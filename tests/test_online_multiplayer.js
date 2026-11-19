const assert = require('assert');
const http = require('http');
const net = require('net');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { createOnlineServer, encodeWsFrame, decodeWsFrames } = require('../server.js');

function encodeMaskedClientFrame(text) {
  const data = Buffer.from(text, 'utf8');
  const mask = crypto.randomBytes(4);
  const len = data.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(6);
    header[0] = 0x81;
    header[1] = 0x80 | len;
    mask.copy(header, 2);
  } else {
    header = Buffer.alloc(8);
    header[0] = 0x81;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(len, 2);
    mask.copy(header, 4);
  }
  const masked = Buffer.alloc(len);
  for (let i = 0; i < len; i++) {
    masked[i] = data[i] ^ mask[i % 4];
  }
  return Buffer.concat([header, masked]);
}

function connectWsClient(port) {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64');
    const socket = net.connect(port, '127.0.0.1');
    let upgraded = false;
    let buf = Buffer.alloc(0);
    const queue = [];
    const waiters = [];

    function dispatch(msg) {
      if (waiters.length > 0) {
        const w = waiters.shift();
        if (!w.pred || w.pred(msg)) {
          w.resolve(msg);
          return;
        }
        waiters.unshift(w);
      }
      queue.push(msg);
    }

    socket.on('connect', () => {
      const req = [
        'GET /ws HTTP/1.1',
        `Host: 127.0.0.1:${port}`,
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Key: ${key}`,
        'Sec-WebSocket-Version: 13',
        '',
        ''
      ].join('\r\n');
      socket.write(req);
    });

    socket.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (!upgraded) {
        const endIdx = buf.indexOf('\r\n\r\n');
        if (endIdx === -1) return;
        const head = buf.subarray(0, endIdx).toString('utf8');
        if (!head.includes('101 Switching Protocols')) {
          reject(new Error('WebSocket upgrade failed: ' + head));
          return;
        }
        upgraded = true;
        buf = buf.subarray(endIdx + 4);
        resolve({
          send(obj) {
            socket.write(encodeMaskedClientFrame(JSON.stringify(obj)));
          },
          waitFor(type, timeoutMs = 2000) {
            for (let i = 0; i < queue.length; i++) {
              if (!type || queue[i].type === type) {
                return Promise.resolve(queue.splice(i, 1)[0]);
              }
            }
            return new Promise((res, rej) => {
              const timer = setTimeout(() => rej(new Error(`Timeout waiting for ${type}`)), timeoutMs);
              const check = (msg) => {
                if (!type || msg.type === type) {
                  clearTimeout(timer);
                  return true;
                }
                return false;
              };
              const waiter = {
                pred: check,
                resolve(m) { clearTimeout(timer); res(m); }
              };
              waiters.push(waiter);
            });
          },
          close() {
            try { socket.end(); socket.destroy(); } catch (_) {}
          }
        });
      }

      if (upgraded && buf.length > 0) {
        const parsed = decodeWsFrames(buf);
        buf = parsed.remaining;
        for (const f of parsed.frames) {
          if (f.opcode === 0x1) {
            const msg = JSON.parse(f.payload.toString('utf8'));
            // Deliver to matching waiter or queue
            let matched = false;
            for (let i = 0; i < waiters.length; i++) {
              if (waiters[i].pred(msg)) {
                const [w] = waiters.splice(i, 1);
                w.resolve(msg);
                matched = true;
                break;
              }
            }
            if (!matched) queue.push(msg);
          }
        }
      }
    });

    socket.on('error', reject);
  });
}

(async () => {
  console.log('=== TEST SUITE: ONLINE MULTIPLAYER (1V1 PVP & 2P CO-OP) ===\n');

  // -------------------------------------------------------------------------
  // TEST 1: RFC 6455 Framing & Masked Decode
  // -------------------------------------------------------------------------
  const shortMsg = JSON.stringify({ type: 'ping_check', t: 123 });
  const encodedShort = encodeWsFrame(shortMsg, 0x1);
  const decodedShort = decodeWsFrames(encodedShort);
  assert.strictEqual(decodedShort.frames.length, 1);
  assert.strictEqual(decodedShort.frames[0].payload.toString('utf8'), shortMsg);

  const longMsg = 'A'.repeat(400);
  const encodedLong = encodeWsFrame(longMsg, 0x1);
  const decodedLong = decodeWsFrames(Buffer.concat([encodedShort, encodedLong]));
  assert.strictEqual(decodedLong.frames.length, 2);
  assert.strictEqual(decodedLong.frames[1].payload.toString('utf8'), longMsg);

  const maskedFrame = encodeMaskedClientFrame('{"type":"hello"}');
  const decodedMasked = decodeWsFrames(maskedFrame);
  assert.strictEqual(decodedMasked.frames[0].payload.toString('utf8'), '{"type":"hello"}');
  console.log('✓ TEST 1: RFC 6455 WebSocket encode/decode & masked frame round-trip passed');

  // -------------------------------------------------------------------------
  // TEST 2: Live WebSocket Server — Rooms, Join by Code, PvP & Co-op Relays
  // -------------------------------------------------------------------------
  const { server, rooms } = createOnlineServer(path.resolve(__dirname, '..'));
  await new Promise((res) => server.listen(0, '127.0.0.1', res));
  const port = server.address().port;

  let c1, c2;
  try {
    c1 = await connectWsClient(port);
    const w1 = await c1.waitFor('welcome');
    assert.strictEqual(w1.type, 'welcome');

    c1.send({ type: 'create_room', mode: 'pvp', name: 'AnhHai', charId: 'nghi', skinId: 'default' });
    const joined1 = await c1.waitFor('room_joined');
    assert.strictEqual(joined1.slot, 1);
    assert.strictEqual(joined1.room.mode, 'pvp');
    const roomCode = joined1.room.code;
    assert.ok(roomCode && roomCode.length >= 4, 'Room code generated');

    // REST /api/online/rooms lists the created waiting room
    const apiData = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/api/online/rooms`, (res) => {
        let body = '';
        res.on('data', (d) => { body += d; });
        res.on('end', () => resolve(JSON.parse(body)));
      }).on('error', reject);
    });
    assert.strictEqual(apiData.ok, true);
    assert.ok(apiData.rooms.some((r) => r.code === roomCode && r.playerCount === 1), 'REST /api/online/rooms returns waiting room');

    // Client 2 joins by room code (manual room defaults ready=false on both peers until clicked)
    c2 = await connectWsClient(port);
    await c2.waitFor('welcome');
    c2.send({ type: 'join_room', code: roomCode, name: 'BichLam', charId: 'bichlam', skinId: 'namcheo' });
    const joined2 = await c2.waitFor('room_joined');
    assert.strictEqual(joined2.slot, 2);
    assert.strictEqual(joined2.room.players.length, 2);
    assert.strictEqual(joined2.room.players.every((p) => p.ready === false), true, 'Phòng tạo thủ công mặc định ready=false cho cả 2 người chơi');
    const upd1 = await c1.waitFor('room_updated');
    assert.strictEqual(upd1.room.players.length, 2);

    // Both players click Ready, then Host starts 1v1 PvP match
    c1.send({ type: 'toggle_ready', ready: true });
    c2.send({ type: 'toggle_ready', ready: true });
    await c1.waitFor('room_updated');
    c1.send({ type: 'start_match' });
    const start1 = await c1.waitFor('match_started');
    const start2 = await c2.waitFor('match_started');
    assert.strictEqual(start1.room.status, 'playing');
    assert.strictEqual(start2.room.code, roomCode);

    // Relay player_state & pvp_hit
    c1.send({ type: 'pvp_hit', damage: 95, knockbackX: 8, isKnockdown: true });
    const hit2 = await c2.waitFor('pvp_hit');
    assert.strictEqual(hit2.damage, 95);
    assert.strictEqual(hit2.fromSlot, 1);

    // Match result + rematch
    c2.send({ type: 'match_result', winnerSlot: 1 });
    const res1 = await c1.waitFor('match_result');
    assert.strictEqual(res1.scores.p1, 1);
    c1.send({ type: 'rematch_request' });
    c2.send({ type: 'rematch_request' });
    const rematch1 = await c1.waitFor('rematch_start');
    assert.strictEqual(rematch1.room.status, 'playing');

    // Co-op quick_match pairing & enemy hit/sync relay
    c1.send({ type: 'quick_match', mode: 'coop', stageId: 3, name: 'NghiCoop' });
    const coop1 = await c1.waitFor('room_joined');
    assert.strictEqual(coop1.room.mode, 'coop');
    c2.send({ type: 'quick_match', mode: 'coop', stageId: 3, name: 'AnCoop' });
    const coop2 = await c2.waitFor('room_joined');
    assert.strictEqual(coop2.room.code, coop1.room.code, 'quick_match pairs second Co-op player into same room');

    c1.send({ type: 'coop_enemies_sync', enemies: [{ netId: 'e_1', hp: 500, maxHp: 500 }] });
    const sync2 = await c2.waitFor('coop_enemies_sync');
    assert.strictEqual(sync2.enemies[0].netId, 'e_1');

    c2.send({ type: 'coop_hit_enemy', netId: 'e_1', damage: 70 });
    const coopHit1 = await c1.waitFor('coop_hit_enemy');
    assert.strictEqual(coopHit1.damage, 70);

    c2.close();
    await c1.waitFor('peer_left');
    c1.close();
    await new Promise((r) => setTimeout(r, 40));
    assert.strictEqual(rooms.size, 0, 'Empty room cleaned up after both peers disconnect');
    console.log('✓ TEST 2: Live WebSocket room lifecycle, PvP & Co-op relays passed');
  } finally {
    if (c1) c1.close();
    if (c2) c2.close();
    server.close();
  }

  // -------------------------------------------------------------------------
  // TEST 3: HTML UI Markup + Client OnlineManager / RemotePlayer Integration
  // -------------------------------------------------------------------------
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  assert.ok(html.includes('id="btn-online-mode"'), 'index.html includes #btn-online-mode button');
  assert.ok(html.includes('id="btn-top-online"'), 'index.html includes #btn-top-online button');
  assert.ok(html.includes('id="online-modal"'), 'index.html includes #online-modal lobby overlay');
  assert.ok(html.includes('id="online-match-bar"'), 'index.html includes #online-match-bar HUD bar');

  // Load client engine modules (same script list from index.html)
  global.window = global;
  global.window.addEventListener = () => {};
  global.requestAnimationFrame = () => {};
  const mockElements = {};
  const makeMockEl = (id) => ({
    id,
    innerHTML: '',
    textContent: '',
    value: '',
    children: [],
    style: {},
    dataset: {},
    classList: {
      _s: new Set(['hidden']),
      add(...a) { a.forEach((x) => this._s.add(x)); },
      remove(...a) { a.forEach((x) => this._s.delete(x)); },
      toggle(c, force) { if (force) this._s.add(c); else this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    addEventListener() {},
    appendChild(ch) { this.children.push(ch); },
    querySelector: () => null,
    querySelectorAll: () => [],
    getContext: () => ({
      fillRect: () => {}, clearRect: () => {}, save: () => {}, restore: () => {},
      beginPath: () => {}, arc: () => {}, ellipse: () => {}, fill: () => {}, stroke: () => {},
      moveTo: () => {}, lineTo: () => {}, closePath: () => {}, quadraticCurveTo: () => {}, bezierCurveTo: () => {},
      translate: () => {}, scale: () => {}, strokeRect: () => {}, fillText: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
      createLinearGradient: () => ({ addColorStop: () => {} })
    })
  });
  global.document = {
    getElementById: (id) => (mockElements[id] || (mockElements[id] = makeMockEl(id))),
    createElement: (tag) => makeMockEl(tag),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };
  global.localStorage = { getItem: () => null, setItem: () => {} };

  const scriptRegex = /<script\s+src=["']([^"']+)["']\s*><\/script>/g;
  let m;
  while ((m = scriptRegex.exec(html)) !== null) {
    const rel = m[1].split('?')[0];
    require(path.resolve(__dirname, '..', rel));
  }

  assert.ok(window.OnlineManager && window.onlineManager, 'window.onlineManager initialized');
  assert.ok(window.RemotePlayer, 'window.RemotePlayer class exported');

  const sentPackets = [];
  window.onlineManager._testTransport = (pkt) => sentPackets.push(pkt);
  window.onlineManager.slot = 1;

  // Test PvP match initialization & damage relay
  window.onlineManager.startPvPMatch({
    code: 'PVP9',
    mode: 'pvp',
    players: [
      { slot: 1, name: 'Player1', charId: 'nghi', skinId: 'default' },
      { slot: 2, name: 'Player2', charId: 'bichlam', skinId: 'namcheo' }
    ]
  });

  assert.strictEqual(window.onlineManager.isActive, true);
  assert.strictEqual(window.onlineManager.mode, 'pvp');
  assert.strictEqual(window.game.enemies.length, 0, 'PvP clears campaign AI enemies');
  assert.ok(window.onlineManager.remotePlayer instanceof window.RemotePlayer);
  assert.strictEqual(window.onlineManager.remotePlayer.equippedSkin, 'namcheo', 'RemotePlayer applies namcheo skin');

  const rpHpBefore = window.onlineManager.remotePlayer.hp;
  window.onlineManager.remotePlayer.takeDamage(120, 6, false);
  assert.strictEqual(window.onlineManager.remotePlayer.hp, rpHpBefore - 120, 'Local hit lowers RemotePlayer HP optimistically');
  assert.ok(sentPackets.some((p) => p.type === 'pvp_hit' && p.damage === 120), 'Local hit emits pvp_hit packet');

  // Incoming pvp_hit damages local player
  const pHpBefore = window.game.player.hp;
  window.onlineManager.handleServerMessage({
    type: 'pvp_hit',
    damage: 75,
    knockbackX: -5,
    isKnockdown: false,
    debuffs: { bleedTimer: 2.0 }
  });
  assert.ok(window.game.player.hp < pHpBefore, 'Incoming pvp_hit reduces local player HP');
  assert.ok(window.game.player.bleedTimer >= 2.0, 'Incoming pvp_hit applies debuffs');

  // Test Co-op Guest sync & enemy damage hook
  sentPackets.length = 0;
  window.onlineManager.slot = 2;
  window.onlineManager.startCoopMatch({
    code: 'COOP2',
    mode: 'coop',
    stageId: 1,
    players: [
      { slot: 1, name: 'Host', charId: 'dinhan', skinId: 'default' },
      { slot: 2, name: 'Guest', charId: 'nghi', skinId: 'default' }
    ]
  });
  assert.strictEqual(window.onlineManager.mode, 'coop');
  window.onlineManager.handleServerMessage({
    type: 'coop_enemies_sync',
    enemies: [{ netId: 'e_42', type: 'brawler', name: 'Thủ Hạ', isBoss: false, x: 640, y: 580, hp: 300, maxHp: 300, isDead: false }]
  });
  assert.strictEqual(window.game.enemies.length, 1, 'Guest spawns synced Co-op enemy');
  assert.strictEqual(window.game.enemies[0]._netId, 'e_42');
  window.game.enemies[0].takeDamage(55, 4, false);
  assert.ok(sentPackets.some((p) => p.type === 'coop_hit_enemy' && p.netId === 'e_42' && p.damage === 55), 'Guest Co-op damage emits coop_hit_enemy packet');

  // Verify Campaign stageEvidence never spawns or collects during Online PvP / Co-op
  window.game.stageEvidence = { id: 'ev_leak', title: 'LEAK', x: 500, y: 580, collected: false };
  assert.strictEqual(window.game.collectStageEvidence(), false, 'collectStageEvidence() is blocked while onlineManager.isActive === true');
  assert.strictEqual(window.game.stageEvidence.collected, false, 'stageEvidence stays uncollected in Online mode');
  window.onlineManager.startPvPMatch({
    code: 'PVP2',
    mode: 'pvp',
    stageId: 1,
    players: [
      { slot: 1, name: 'Host', charId: 'nghi', skinId: 'default' },
      { slot: 2, name: 'Guest', charId: 'thienkhanh', skinId: 'default' }
    ]
  });
  assert.strictEqual(window.game.stageEvidence, null, 'startPvPMatch clears stageEvidence to null');

  // Verify ESC/Pause in Online PvP keeps game physics live (knockup/vz still happens) & blocks scissor_kick grab on RemotePlayer
  window.game.pauseGame();
  assert.strictEqual(window.game.state, 'PLAYING', 'pauseGame() in Online keeps game.state === PLAYING so physics/hits never freeze');
  assert.strictEqual(window.game._onlinePauseOpen, true, 'pauseGame() in Online marks _onlinePauseOpen === true');
  window.game.player.invincibleTimer = 0;
  window.game.player.z = 0;
  window.game.player.vz = 0;
  window.game.player.setState('idle');
  window.onlineManager.handleServerMessage({ type: 'pvp_hit', damage: 45, knockbackX: 180, isKnockdown: true });
  assert.ok(window.game.player.vz > 0 && window.game.player.state === 'knockdown', 'Player pressing ESC in Online still gets launched (vz > 0, knockdown)');
  window.game.updatePlaying(0.05);
  assert.ok(window.game.player.z < 0, `Player launches upward into the air (z=${window.game.player.z}) even with ESC menu open`);
  window.game.resumeGame();
  assert.strictEqual(window.game._onlinePauseOpen, false, 'resumeGame() clears _onlinePauseOpen');

  // Verify Ngô Nhất Nghị W+K & K->K cannot grab/clamp RemotePlayer with scissor_kick in Online PvP
  window.game.player.setCharacter('nghi');
  window.game.player.invincibleTimer = 0;
  window.game.player.z = 0;
  window.game.player.vz = 0;
  window.game.player.kickCooldown = 0;
  window.game.player.exhaustTimer = 0;
  window.game.player.setState('idle');
  window.game.player.comboStep = 2;
  window.game.player.facing = 1;
  window.onlineManager.remotePlayer.x = window.game.player.x + 60;
  window.onlineManager.remotePlayer.y = window.game.player.y;
  window.onlineManager.remotePlayer.isDead = false;
  global.input = {
    moveUp: true, moveDown: false, moveLeft: false, moveRight: false, run: false, block: false,
    punch: false, kick: true, jump: false, dodge: false,
    keys: { KeyW: true }, justPressed: { KeyK: true }, lastKeyDownTime: { KeyW: performance.now(), KeyK: performance.now() },
    peek: (k) => k === 'KeyK',
    consumeBufferedAction: () => true,
    isJustPressed: (k) => k === 'KeyK',
    isDown: (k) => k === 'KeyW',
    isActionJustPressed: (a) => a === 'kick',
    consumeCounterHand: () => false,
    consumeCounterLeg: () => false
  };
  window.game.player.handlePlayerInput([window.onlineManager.remotePlayer]);
  assert.notStrictEqual(window.game.player.state, 'scissor_kick', 'W+K of Ngô Nhất Nghị MUST NOT grab/clamp RemotePlayer with scissor_kick in Online PvP');
  assert.strictEqual(window.game.player.state, 'kick_push', 'W+K in Online PvP falls back cleanly to standard W+K kick (same as Boss balance)');

  console.log('✓ TEST 3: Client OnlineManager, RemotePlayer & Game PvP/Co-op hooks passed');

  // -------------------------------------------------------------------------
  // TEST 4: 20-Stage Co-op Room Support + VFX Sync Relay (vfx_event & applyRemoteVfx)
  // -------------------------------------------------------------------------
  const prevPropsCount = window.effectManager.skillProps.length;
  window.onlineManager.handleServerMessage({ type: 'vfx_event', kind: 'croc_bite', x: 640, y: 580, dir: 1, scale: 1.0 });
  window.onlineManager.handleServerMessage({ type: 'vfx_event', kind: 'tiger_bite', x: 700, y: 520, dir: 1, scale: 0.9 });
  window.onlineManager.handleServerMessage({ type: 'vfx_event', kind: 'taoist_fiend', x: 520, y: 580, facing: 1, life: 4, maxLife: 5 });
  assert.ok(window.effectManager.skillProps.length >= prevPropsCount + 3, 'vfx_event spawns Cá Sấu, Hổ Xám Ngoạm & Tiểu Quỷ on remote client');
  assert.ok(window.effectManager.skillProps.some((sp) => sp.kind === 'tiger_bite'), 'vfx_event tiger_bite creates Grey Tiger Bite effect');

  sentPackets.length = 0;
  window.onlineManager.applyRemoteVfx({ kind: 'croc_bite', x: 400, y: 580, dir: 1, scale: 1.0 });
  assert.strictEqual(sentPackets.filter((p) => p.type === 'vfx_event').length, 0, 'applyRemoteVfx MUST NOT echo vfx_event back to server');

  const srv20 = createOnlineServer(path.resolve(__dirname, '..'));
  await new Promise((res) => srv20.server.listen(0, '127.0.0.1', res));
  const port20 = srv20.server.address().port;
  let ca, cb;
  try {
    ca = await connectWsClient(port20);
    await ca.waitFor('welcome');
    ca.send({ type: 'create_room', mode: 'coop', stageId: 20, name: 'Host20', charId: 'nghi' });
    const r20 = await ca.waitFor('room_joined');
    assert.strictEqual(r20.room.stageId, 20, 'Server allows 2P Co-op stages up to Stage 20');

    cb = await connectWsClient(port20);
    await cb.waitFor('welcome');
    cb.send({ type: 'join_room', code: r20.room.code, name: 'Guest20', charId: 'thienkhanh' });
    await cb.waitFor('room_joined');
    await ca.waitFor('room_updated');

    ca.send({ type: 'vfx_event', kind: 'croc_bite', x: 500, y: 580, dir: 1 });
    const vfxMsg = await cb.waitFor('vfx_event');
    assert.strictEqual(vfxMsg.kind, 'croc_bite', 'Server relays vfx_event cleanly between players');
  } finally {
    if (ca) ca.close();
    if (cb) cb.close();
    srv20.server.close();
  }
  console.log('✓ TEST 4: 20-Stage Co-op & VFX Event Relay passed');

  // -------------------------------------------------------------------------
  // TEST 5: Skin Dropdown Filtering per Hero + Separate Room Screen State
  // -------------------------------------------------------------------------
  const charSel = document.getElementById('online-char-select');
  const skinSel = document.getElementById('online-skin-select');
  charSel.value = 'huavudai';
  window.onlineManager._populateSkinOptions();
  const huaSkins = skinSel.children.map((o) => o.value);
  assert.ok(!huaSkins.includes('namcheo') && !huaSkins.includes('hoxam'), 'Hứa Vũ Đại không hiển thị skin của nhân vật khác');
  assert.ok(huaSkins.includes('default') && huaSkins.includes('vovinam') && huaSkins.includes('chodoinon'), 'Hứa Vũ Đại hiển thị đầy đủ skin hợp lệ gồm Chó Đội Nón trong danh sách chọn');
  const choOpt = skinSel.children.find((o) => o.value === 'chodoinon');
  assert.ok(choOpt && choOpt.disabled === true, 'Skin Chó Đội Nón hiển thị Chưa sở hữu trong Sảnh Online khi chưa mua Shop');

  charSel.value = 'nghi';
  window.onlineManager._populateSkinOptions();
  const nghiSkins = skinSel.children.map((o) => o.value);
  assert.ok(nghiSkins.includes('default') && nghiSkins.includes('hoxam') && !nghiSkins.includes('vovinam'), 'Ngô Nhất Nghị hiển thị Mặc Định & Hổ Xám (không trùng lặp vovinam)');
  const hoxamOpt = skinSel.children.find((o) => o.value === 'hoxam');
  assert.ok(hoxamOpt && !hoxamOpt.disabled, 'Skin Hổ Xám chọn được trực tiếp trong Sảnh Online');

  charSel.value = 'bichlam';
  window.onlineManager._populateSkinOptions();
  const blSkins = skinSel.children.map((o) => o.value);
  assert.ok(blSkins.includes('namcheo'), 'Đình Bích Lâm hiển thị skin Ông Năm Chèo');

  window.onlineManager.room = { code: 'TEST', mode: 'pvp', players: [{ slot: 1, name: 'Host', charId: 'huavudai', skinId: 'default' }] };
  window.onlineManager.slot = 1;
  window.onlineManager.renderRoomPanel();
  assert.ok(document.getElementById('online-lobby-card').classList.contains('in-room-screen'), 'Vào phòng bật màn hình phòng chờ tách biệt (.in-room-screen)');
  window.onlineManager.room = null;
  window.onlineManager.renderRoomPanel();
  assert.ok(!document.getElementById('online-lobby-card').classList.contains('in-room-screen'), 'Rời phòng quay lại sảnh chọn tướng');
  console.log('✓ TEST 5: Casual Lobby Skin Filtering & Separate Waiting Room Screen passed');

  // -------------------------------------------------------------------------
  // TEST 6: Commercial Multiplayer Features (Private Room + Password, Ready Toggle, Quick Match Cancel, Online Invite)
  // -------------------------------------------------------------------------
  const srv6 = createOnlineServer(path.resolve(__dirname, '..'));
  await new Promise((res) => srv6.server.listen(0, '127.0.0.1', res));
  const port6 = srv6.server.address().port;
  let p1c, p2c;
  try {
    p1c = await connectWsClient(port6);
    await p1c.waitFor('welcome');
    p2c = await connectWsClient(port6);
    const w2 = await p2c.waitFor('welcome');
    assert.ok(Array.isArray(w2.players) && w2.players.length >= 2, 'Server sends online_players list in welcome');

    // Create private passworded room with custom roomName & allyId
    p1c.send({
      type: 'create_room',
      roomName: 'Võ Đường Bí Mật',
      mode: 'pvp',
      isPrivate: true,
      password: '2026',
      name: 'ChuPhong',
      charId: 'nghi',
      allyId: 'dinhan'
    });
    const rPriv = await p1c.waitFor('room_joined');
    assert.strictEqual(rPriv.room.roomName, 'Võ Đường Bí Mật');
    assert.strictEqual(rPriv.room.isPrivate, true);
    assert.strictEqual(rPriv.room.hasPassword, true);
    assert.strictEqual(rPriv.room.players[0].allyId, 'dinhan');

    // Join without password fails cleanly
    p2c.send({ type: 'join_room', code: rPriv.room.code, name: 'Khach', charId: 'bichlam' });
    const errPw = await p2c.waitFor('error_msg');
    assert.strictEqual(errPw.errorCode, 'WRONG_PASSWORD', 'Private room rejects missing/wrong password');

    // Join via direct invite works without leaking password
    p1c.send({ type: 'send_invite', targetClientId: w2.clientId });
    const invMsg = await p2c.waitFor('room_invite');
    assert.strictEqual(invMsg.roomCode, rPriv.room.code, 'Targeted send_invite delivers room_invite to peer');

    // Or join with correct password
    p2c.send({ type: 'join_room', code: rPriv.room.code, password: '2026', name: 'Khach', charId: 'bichlam', allyId: 'hoanganh' });
    const jOk = await p2c.waitFor('room_joined');
    assert.strictEqual(jOk.slot, 2);
    await p1c.waitFor('room_updated');

    // Ready gating on start_match
    p2c.send({ type: 'toggle_ready', ready: false });
    const updNotReady = await p1c.waitFor('room_updated');
    assert.strictEqual(updNotReady.room.players.find((x) => x.slot === 2).ready, false);
    p1c.send({ type: 'start_match' });
    const needReadyErr = await p1c.waitFor('error_msg');
    assert.ok(needReadyErr.message.includes('SẴN SÀNG'), 'Host cannot start match until peer is Ready');

    p1c.send({ type: 'toggle_ready', ready: true });
    p2c.send({ type: 'toggle_ready', ready: true });
    await p1c.waitFor('room_updated');
    p1c.send({ type: 'start_match' });
    await p1c.waitFor('match_started');

    // Quick match cancel state
    p1c.send({ type: 'quick_match', mode: 'pvp', name: 'QM1', charId: 'nghi' });
    await p1c.waitFor('room_joined');
    p1c.send({ type: 'cancel_quick_match' });
    const cancelRes = await p1c.waitFor('search_cancelled');
    assert.strictEqual(cancelRes.type, 'search_cancelled', 'cancel_quick_match cancels matchmaking queue and responds search_cancelled');
  } finally {
    if (p1c) p1c.close();
    if (p2c) p2c.close();
    srv6.server.close();
  }

  // Client-side UI subtabs & 8 Quick Match states
  window.onlineManager.setOnlineSubtab('quickmatch');
  assert.ok(!document.getElementById('online-view-quickmatch').classList.contains('hidden'), 'Subtab quickmatch shows Quick Match view');
  ['ready', 'searching', 'found', 'connecting', 'match_ready', 'failed', 'lost', 'cancelled'].forEach((st) => {
    window.onlineManager.setQuickMatchState(st);
    assert.strictEqual(window.onlineManager.quickMatchState, st, `Quick Match handles state: ${st}`);
  });
  window.onlineManager._stopQmTimer();
  console.log('✓ TEST 6: Commercial Multiplayer Features (Private Room, Ready Gating, Invites & Quick Match States) passed');

  // -------------------------------------------------------------------------
  // TEST 7: Anti-Lag Optimization (Instant State Flush, Optimistic HP Lock & Co-op Interpolation)
  // -------------------------------------------------------------------------
  const lagPkts = [];
  window.onlineManager._testTransport = (pkt) => lagPkts.push(pkt);
  window.onlineManager.slot = 1;
  window.onlineManager.startPvPMatch({
    code: 'LAG1',
    mode: 'pvp',
    players: [
      { slot: 1, name: 'Host', charId: 'nghi', skinId: 'default' },
      { slot: 2, name: 'Guest', charId: 'bichlam', skinId: 'default' }
    ]
  });

  // 7a. Instant player_state flush on state change even with tiny 0.005s dt
  window.game.player.state = 'idle';
  window.onlineManager.update(0.05);
  lagPkts.length = 0;
  window.game.player.state = 'punch_straight';
  window.game.player.vz = 140;
  window.game.player.comboStep = 2;
  window.onlineManager.update(0.005);
  const flushedStatePkt = lagPkts.find((pkt) => pkt.type === 'player_state');
  assert.ok(flushedStatePkt, 'State change (idle -> punch_straight) flushes player_state immediately on 0.005s tick');
  assert.strictEqual(flushedStatePkt.state.vz, 140, 'player_state includes vz for jump extrapolation');
  assert.strictEqual(flushedStatePkt.state.comboStep, 2, 'player_state includes comboStep for multi-hit animation');

  // 7b. RemotePlayer optimistic HP lock blocks stale higher HP while pvp_hit is in flight
  const rp = window.onlineManager.remotePlayer;
  rp.maxHp = 1000;
  rp.hp = 1000;
  rp.state = 'idle';
  rp.invincibleTimer = 0;
  rp.takeDamage(150, 5, false);
  assert.strictEqual(rp.hp, 850, 'RemotePlayer lowers HP optimistically on hit');
  assert.ok(rp._optimisticHpLockTimer > 0, 'RemotePlayer activates _optimisticHpLockTimer after takeDamage');
  rp.applyRemoteState({ hp: 980, maxHp: 1000, state: 'idle' });
  assert.strictEqual(rp.hp, 850, 'Stale higher HP in player_state is ignored during optimistic lock window');

  // 7c. Co-op Guest smooth enemy interpolation & optimistic enemy HP lock
  window.onlineManager.slot = 2;
  window.onlineManager.startCoopMatch({
    code: 'LAG2',
    mode: 'coop',
    stageId: 1,
    players: [
      { slot: 1, name: 'Host', charId: 'nghi', skinId: 'default' },
      { slot: 2, name: 'Guest', charId: 'bichlam', skinId: 'default' }
    ]
  });
  window.onlineManager.handleServerMessage({
    type: 'coop_enemies_sync',
    enemies: [{ netId: 'e_smooth', type: 'brawler', name: 'Thủ Hạ', isBoss: false, x: 500, y: 580, z: 0, hp: 300, maxHp: 300, isDead: false }]
  });
  const coEnemy = window.game.enemies.find((e) => e && e._netId === 'e_smooth');
  assert.ok(coEnemy, 'Co-op enemy spawned on Guest');
  window.onlineManager.handleServerMessage({
    type: 'coop_enemies_sync',
    enemies: [{ netId: 'e_smooth', type: 'brawler', name: 'Thủ Hạ', isBoss: false, x: 560, y: 590, z: 0, hp: 300, maxHp: 300, isDead: false }]
  });
  assert.strictEqual(coEnemy._netTargetX, 560, 'Co-op enemy updates _netTargetX');
  assert.strictEqual(coEnemy.x, 500, 'Co-op enemy does not hard-snap small delta before interpolation');
  window.onlineManager.update(0.03);
  assert.ok(coEnemy.x > 500 && coEnemy.x < 560, 'Co-op Guest smoothly interpolates enemy x toward _netTargetX');

  coEnemy.takeDamage(60, 4, false);
  const lockedHp = coEnemy.hp;
  assert.ok(coEnemy._optimisticHpLockTimer > 0 && lockedHp < 300, 'Guest hit locks Co-op enemy HP optimistically');
  window.onlineManager.handleServerMessage({
    type: 'coop_enemies_sync',
    enemies: [{ netId: 'e_smooth', type: 'brawler', name: 'Thủ Hạ', isBoss: false, x: 560, y: 590, z: 0, hp: 295, maxHp: 300, isDead: false }]
  });
  assert.strictEqual(coEnemy.hp, lockedHp, 'Stale coop_enemies_sync packet does not rubber-band Co-op enemy HP');
  console.log('✓ TEST 7: Anti-Lag Optimization (Instant State Flush, Optimistic HP Lock & Co-op Interpolation) passed');

  // -------------------------------------------------------------------------
  // TEST 8: Rematch Lifecycle, Leave Match Room Cleanup, Co-op Stage End & Intro Damage Guard
  // -------------------------------------------------------------------------
  const rematchPkts = [];
  window.onlineManager._testTransport = (pkt) => rematchPkts.push(pkt);
  window.onlineManager.slot = 1;
  window.onlineManager.room = {
    code: 'REM8',
    mode: 'pvp',
    status: 'playing',
    players: [
      { id: 1, slot: 1, name: 'Host', charId: 'nghi', skinId: 'default', ready: true },
      { id: 2, slot: 2, name: 'Guest', charId: 'bichlam', skinId: 'default', ready: true }
    ]
  };
  window.onlineManager.startPvPMatch(window.onlineManager.room);

  // 8a. RemotePlayer ignores damage while _introLockTimer > 0 or _roundOver === true
  const rmBtn = document.getElementById('btn-online-rematch');
  assert.ok(rmBtn.classList.contains('hidden'), 'Rematch button starts hidden in fresh PvP match');
  window.onlineManager._introLockTimer = 1.5;
  const hpBeforeIntro = window.onlineManager.remotePlayer.hp;
  window.onlineManager.remotePlayer.takeDamage(100, 5, false);
  assert.strictEqual(window.onlineManager.remotePlayer.hp, hpBeforeIntro, 'RemotePlayer ignores damage during VS intro countdown');
  window.onlineManager._introLockTimer = 0;

  window.onlineManager.handleServerMessage({ type: 'match_result', winnerSlot: 1, scores: { p1: 1, p2: 0 } });
  assert.strictEqual(window.onlineManager._roundOver, true);
  assert.ok(!rmBtn.classList.contains('hidden'), 'Rematch button appears after PvP match_result');
  window.onlineManager.remotePlayer.takeDamage(100, 5, false);
  assert.strictEqual(window.onlineManager.remotePlayer.hp, hpBeforeIntro, 'RemotePlayer ignores damage after _roundOver === true');

  // 8b. Peer rematch_request prompt -> local requestRematch -> rematch_start clean reset
  window.onlineManager.handleServerMessage({ type: 'rematch_request', fromSlot: 2 });
  assert.ok(rmBtn.textContent.includes('ĐẤU LẠI NGAY'), 'Incoming rematch_request updates Rematch button label');
  rematchPkts.length = 0;
  const sentReq = window.onlineManager.requestRematch();
  assert.strictEqual(sentReq, true);
  assert.ok(rematchPkts.some((p) => p.type === 'rematch_request'), 'requestRematch emits rematch_request packet');
  assert.strictEqual(rmBtn.disabled, true, 'Rematch button disables while waiting for server rematch_start');
  assert.strictEqual(window.onlineManager.requestRematch(), false, 'Duplicate requestRematch click is guarded');

  window.onlineManager.handleServerMessage({
    type: 'rematch_start',
    room: {
      code: 'REM8',
      mode: 'pvp',
      status: 'playing',
      scores: { p1: 1, p2: 0 },
      players: [
        { id: 1, slot: 1, name: 'Host', charId: 'nghi', skinId: 'default', ready: true },
        { id: 2, slot: 2, name: 'Guest', charId: 'bichlam', skinId: 'default', ready: true }
      ]
    }
  });
  assert.strictEqual(window.onlineManager._roundOver, false, 'rematch_start resets _roundOver to false');
  assert.strictEqual(window.onlineManager._rematchRequested, false, 'rematch_start resets _rematchRequested');
  assert.strictEqual(rmBtn.disabled, false, 'rematch_start re-enables rematch button state');
  assert.ok(rmBtn.classList.contains('hidden'), 'rematch_start hides rematch button for the new round');
  assert.strictEqual(window.game.player.hp, window.game.player.maxHp, 'rematch_start restores local player full HP');
  assert.strictEqual(window.onlineManager.remotePlayer.hp, window.onlineManager.remotePlayer.maxHp, 'rematch_start restores RemotePlayer full HP');

  // 8c. Co-op triggerGameOver / coop_stage_ended exposes rematch button, and leaveMatch sends leave_room + clears room
  window.onlineManager.mode = 'coop';
  window.onlineManager.startCoopMatch({
    code: 'COOP8',
    mode: 'coop',
    stageId: 1,
    players: [
      { id: 1, slot: 1, name: 'Host', charId: 'nghi', skinId: 'default', ready: true },
      { id: 2, slot: 2, name: 'Guest', charId: 'bichlam', skinId: 'default', ready: true }
    ]
  });
  rematchPkts.length = 0;
  window.game.player.isDead = true;
  window.game.triggerGameOver();
  assert.ok(!rmBtn.classList.contains('hidden'), 'Co-op triggerGameOver reveals Rematch button');
  assert.ok(rematchPkts.some((p) => p.type === 'coop_stage_ended' && p.result === 'defeat'), 'Co-op triggerGameOver notifies coop_stage_ended');

  rematchPkts.length = 0;
  window.onlineManager.leaveMatch(false);
  assert.ok(rematchPkts.some((p) => p.type === 'leave_room'), 'leaveMatch sends leave_room to server');
  assert.strictEqual(window.onlineManager.isActive, false);
  assert.strictEqual(window.onlineManager.room, null, 'leaveMatch clears stale room object');
  assert.strictEqual(window.onlineManager.slot, 0, 'leaveMatch resets slot to 0');
  console.log('✓ TEST 8: Rematch Lifecycle, Leave Match Room Cleanup, Co-op Stage End & Intro Damage Guard passed');

  // -------------------------------------------------------------------------
  // TEST 9: PvP Nộ (Energy) Gain Boost & RemotePlayer HUD Isolation
  // -------------------------------------------------------------------------
  window.onlineManager._testTransport = () => {};
  window.onlineManager.slot = 1;
  window.onlineManager.startPvPMatch({
    code: 'PVP_RAGE',
    mode: 'pvp',
    players: [
      { slot: 1, name: 'Host', charId: 'nghi', skinId: 'default' },
      { slot: 2, name: 'Guest', charId: 'dinhan', skinId: 'default' }
    ]
  });
  window.onlineManager._introLockTimer = 0;
  window.onlineManager._roundOver = false;
  const lp = window.game.player;
  const rpPvp = window.onlineManager.remotePlayer;
  lp.setCharacter('nghi');
  lp.energy = 0;
  rpPvp.invincibleTimer = 0;
  rpPvp.state = 'idle';
  let uiHudEnergy = 0;
  const origUpdateEn = window.uiManager.updatePlayerEnergy;
  window.uiManager.updatePlayerEnergy = (en) => { uiHudEnergy = en; };
  try {
    // Hitting opponent in PvP builds strong Nộ (~10 per kick_push vs ~3 previously)
    window.combatSystem.resolveHit(lp, rpPvp, { damage: 60, energyGain: 14, weight: 'light' });
    assert.ok(lp.energy >= 14, `PvP attack builds solid Nộ immediately (got ${lp.energy})`);
    const enAfterHit = lp.energy;

    // RemotePlayer gaining energy never overwrites local player HUD energy
    rpPvp.addEnergy(50);
    assert.strictEqual(rpPvp.energy, 50);
    assert.strictEqual(uiHudEnergy, enAfterHit, 'RemotePlayer.addEnergy never overwrites local HUD Nộ bar');

    // Guarding incoming pvp_hit grants +6 Nộ, taking direct damage grants revenge Nộ
    lp.invincibleTimer = 0;
    lp.setState('guard', 0.4);
    window.onlineManager.handleServerMessage({ type: 'pvp_hit', damage: 50, knockbackX: 4, isKnockdown: false });
    assert.ok(lp.energy >= enAfterHit + 6, `Guarding pvp_hit builds +6 Nộ (got ${lp.energy})`);
    const enBeforeDmg = lp.energy;
    lp.invincibleTimer = 0;
    lp.setState('idle');
    window.onlineManager.handleServerMessage({ type: 'pvp_hit', damage: 80, knockbackX: 4, isKnockdown: false });
    assert.ok(lp.energy >= enBeforeDmg + 4, `Taking pvp_hit grants revenge Nộ (got ${lp.energy})`);

    // Live PvP passive spirit regen
    const enBeforeUpdate = lp.energy;
    lp.update(0.6, [rpPvp]);
    assert.ok(lp.energy > enBeforeUpdate, `PvP passive spirit regen ticks cleanly (after=${lp.energy})`);
  } finally {
    window.uiManager.updatePlayerEnergy = origUpdateEn;
  }
  window.onlineManager.leaveMatch(false);
  console.log('✓ TEST 9: PvP Nộ (Energy) Gain Boost & RemotePlayer HUD Isolation passed');

  // -------------------------------------------------------------------------
  // TEST 10: Giang Mạnh PvP Freeze Balance & Stunlock Immunity
  // -------------------------------------------------------------------------
  window.onlineManager._testTransport = () => {};
  window.onlineManager.slot = 1;
  window.onlineManager.startPvPMatch({
    code: 'PVP_GM',
    mode: 'pvp',
    players: [
      { slot: 1, name: 'Host', charId: 'giangmanh', skinId: 'default' },
      { slot: 2, name: 'Guest', charId: 'nghi', skinId: 'default' }
    ]
  });
  window.onlineManager._introLockTimer = 0;
  window.onlineManager._roundOver = false;
  const gmLocal = window.game.player;
  const gmRemote = window.onlineManager.remotePlayer;
  gmLocal.setCharacter('giangmanh');
  assert.ok(gmLocal.dmgMul <= 1.12, `Giang Mạnh dmgMul đã nerf cân bằng (=${gmLocal.dmgMul})`);
  gmRemote._frostStacks = 0;
  gmRemote._freezeImmunityUntil = 0;
  gmRemote.frozenTimer = 0;
  gmRemote.stunTimer = 0;
  for (let i = 0; i < 4; i++) {
    gmRemote.invincibleTimer = 0;
    gmRemote.state = 'idle';
    window.combatSystem.resolveHit(gmLocal, gmRemote, { damage: 40, weight: 'light' });
  }
  assert.strictEqual(gmRemote.frozenTimer, 0, '4 đòn thường trong PvP CHƯA đóng băng ngay (cần 5 tầng)');
  gmRemote.invincibleTimer = 0;
  gmRemote.state = 'idle';
  window.combatSystem.resolveHit(gmLocal, gmRemote, { damage: 40, weight: 'light' });
  assert.ok(gmRemote.frozenTimer > 0 && gmRemote.frozenTimer <= 0.85, `Đòn thứ 5 kích đóng băng PvP tối đa <= 0.85s (got ${gmRemote.frozenTimer})`);
  assert.ok(gmRemote._freezeImmunityUntil > Date.now(), 'Bật thời gian miễn nhiễm đóng băng sau khi đóng băng PvP');

  // Incoming pvp_hit stun respects immunity & cap
  gmLocal._pvpStunImmunityUntil = 0;
  gmLocal.stunTimer = 0;
  window.onlineManager.handleServerMessage({ type: 'pvp_hit', damage: 0, debuffs: { stunTimer: 2.0 } });
  assert.ok(gmLocal.stunTimer > 0 && gmLocal.stunTimer <= 0.85, `pvp_hit stun giới hạn tối đa 0.85s (got ${gmLocal.stunTimer})`);
  gmLocal.stunTimer = 0;
  window.onlineManager.handleServerMessage({ type: 'pvp_hit', damage: 0, debuffs: { stunTimer: 1.5 } });
  assert.strictEqual(gmLocal.stunTimer, 0, 'Miễn nhiễm stun chống chuỗi đóng băng liên hoàn trong PvP');
  window.onlineManager.leaveMatch(false);
  console.log('✓ TEST 10: Giang Mạnh PvP Freeze Balance & Stunlock Immunity passed');

  // -------------------------------------------------------------------------
  // TEST 11: PvP & Co-op HP Sync Integrity (Zero Ghost-Kill / HP Snapback)
  // -------------------------------------------------------------------------
  const hpSyncPkts = [];
  window.onlineManager._testTransport = (pkt) => hpSyncPkts.push(pkt);
  window.onlineManager.slot = 1;
  window.onlineManager.startPvPMatch({
    code: 'PVP_HP',
    mode: 'pvp',
    players: [
      { slot: 1, name: 'Host', charId: 'giangmanh', skinId: 'default' },
      { slot: 2, name: 'Guest', charId: 'dinhan', skinId: 'default' }
    ]
  });
  window.onlineManager._introLockTimer = 0;
  window.onlineManager._roundOver = false;
  const hpRemote = window.onlineManager.remotePlayer;
  hpRemote.invincibleTimer = 0;
  hpRemote.state = 'idle';
  const startHp = hpRemote.hp;
  hpRemote.takeDamage(100, 5, false);
  assert.ok(hpRemote.hp < startHp, 'Đòn đầu trừ HP RemotePlayer');
  assert.ok(hpRemote.invincibleTimer >= 0.4, 'RemotePlayer bật i-frame 0.45s khớp PlayerDamage để không bị trừ trùng 5 lần liên tiếp về 0');
  const hpAfterFirstHit = hpRemote.hp;
  hpRemote.takeDamage(500, 5, false);
  assert.strictEqual(hpRemote.hp, hpAfterFirstHit, 'Đòn thứ 2 trong cửa sổ i-frame bị chặn, không làm tụt máu ảo về 0');

  // Stale maxHp player_state arriving during optimistic lock must NOT snap HP back to full
  hpRemote.applyRemoteState({ hp: hpRemote.maxHp, maxHp: hpRemote.maxHp, isDead: false });
  assert.strictEqual(hpRemote.hp, hpAfterFirstHit, 'Gói player_state cũ mang full máu không thể hồi máu giả trong lúc khóa optimistic');

  // Passive bonus damage on RemotePlayer syncs via bypassInvincible pvp_hit
  hpSyncPkts.length = 0;
  const pLocalTest = window.game.player;
  pLocalTest.setCharacter('thienkhanh');
  hpRemote.invincibleTimer = 0;
  hpRemote.state = 'idle';
  hpRemote.burnTimer = 2.0;
  window.combatSystem.resolveHit(pLocalTest, hpRemote, { damage: 40, weight: 'light' });
  assert.ok(hpSyncPkts.some((p) => p.type === 'pvp_hit' && p.bypassInvincible === true), 'Sát thương cộng thêm từ nội tại phát gói pvp_hit(bypassInvincible) lên đối thủ');

  // Bypass invincible pvp_hit applies even during normal hurt i-frame
  const hpPreBypass = pLocalTest.hp;
  pLocalTest.invincibleTimer = 0.4;
  window.onlineManager.handleServerMessage({ type: 'pvp_hit', damage: 25, bypassInvincible: true });
  assert.strictEqual(pLocalTest.hp, hpPreBypass - 25, 'Nhận pvp_hit(bypassInvincible) trừ đúng lượng HP nội tại tránh lệch máu');

  window.onlineManager.leaveMatch(false);
  console.log('✓ TEST 11: PvP & Co-op HP Sync Integrity passed');

  // -------------------------------------------------------------------------
  // TEST 12: Production Cloud Default Server URL Resolution (Render + Vercel)
  // -------------------------------------------------------------------------
  {
    const prevLoc = window.location;
    const prevDef = window.VOVINAM_DEFAULT_SERVER_URL;
    window.VOVINAM_DEFAULT_SERVER_URL = '';
    window.location = {
      protocol: 'https:',
      host: 'vovinam-huyet-chien-gia-toc.vercel.app',
      hostname: 'vovinam-huyet-chien-gia-toc.vercel.app',
      origin: 'https://vovinam-huyet-chien-gia-toc.vercel.app',
      search: ''
    };
    const wsFromVercel = window.onlineManager.getDefaultWsUrl();
    assert.strictEqual(
      wsFromVercel,
      'wss://vovinam-huyet-chien-gia-toc.onrender.com/ws',
      'Trên domain công khai Vercel, getDefaultWsUrl phải tự động trỏ tới server Render wss://...'
    );
    window.VOVINAM_DEFAULT_SERVER_URL = prevDef;
    window.location = prevLoc;
  }
  console.log('✓ TEST 12: Production Cloud Default Server URL Resolution passed');

  // -------------------------------------------------------------------------
  // TEST 13: Thien Khanh Balance + Live Fiends Sync + High-Ping ACK & Co-op Wave Bounds
  // -------------------------------------------------------------------------
  {
    const tkDef = window.CharacterRegistry.get('thienkhanh');
    assert.ok(tkDef.combat.damage <= 1.0 && tkDef.combat.hp <= 920, 'Thiên Khánh được cân bằng chỉ số gốc & HP công bằng hơn');

    const syncPkts = [];
    window.onlineManager._testTransport = (pkt) => syncPkts.push(pkt);
    window.onlineManager.slot = 1;
    window.onlineManager.startPvPMatch({
      code: 'TK13',
      mode: 'pvp',
      players: [
        { slot: 1, name: 'Host', charId: 'thienkhanh', skinId: 'default' },
        { slot: 2, name: 'Guest', charId: 'bichlam', skinId: 'default' }
      ]
    });
    window.onlineManager._introLockTimer = 0;
    window.onlineManager._roundOver = false;

    const tkLocal = window.game.player;
    tkLocal.setCharacter('thienkhanh');
    tkLocal.hp = 600;
    tkLocal._hapTinhHealCd = 0;
    const opp = window.onlineManager.remotePlayer;
    opp.state = 'idle';
    opp.invincibleTimer = 0;
    opp.burnTimer = 2.0;
    const oppHp0 = opp.hp;
    tkDef.passives.onAttackHit(tkLocal, opp);
    assert.ok(tkLocal.hp - 600 <= 5, `Huyết Ấn Hấp Tinh trong PvP bị tiết chế (+4 HP, thực tế +${tkLocal.hp - 600})`);

    // Triệu hồi Hỏa Âm Binh & kiểm tra đồng bộ fiends sang đối thủ + cập nhật vị trí đuổi theo
    tkDef.passives.onStanceSpecial(tkLocal);
    assert.strictEqual(tkLocal._summonedFiends.length, 1, 'Triệu hồi 1 Hỏa Âm Binh');
    syncPkts.length = 0;
    window.onlineManager.update(0.05);
    const fiendStatePkt = syncPkts.find((p) => p.type === 'player_state' && p.state && Array.isArray(p.state.fiends) && p.state.fiends.length === 1);
    assert.ok(fiendStatePkt, 'player_state đồng bộ danh sách Tiểu Quỷ đang hoạt động sang đối thủ PvP');

    // Trên màn hình đối thủ: RemotePlayer nhận fiends và nội suy di chuyển đuổi theo
    opp.applyRemoteState({
      x: 400, y: 580,
      fiends: [{ id: 'f_track_1', x: 520, y: 580, facing: -1, life: 4.0, maxLife: 4.5, slash: true }]
    });
    assert.strictEqual(opp.remoteFiends.length, 1, 'RemotePlayer tạo Tiểu Quỷ theo gói player_state');
    opp.applyRemoteState({
      x: 400, y: 580,
      fiends: [{ id: 'f_track_1', x: 440, y: 585, facing: -1, life: 3.8, maxLife: 4.5, slash: true }]
    });
    opp.updateRemote(0.05);
    assert.ok(opp.remoteFiends[0].x < 520 && opp.remoteFiends[0].x >= 440, 'Tiểu Quỷ trên màn đối thủ di chuyển đuổi theo mượt mà');

    // High-ping hitSeq ACK blocks stale HP until victim acknowledges hitSeq
    window.onlineManager.pingMs = 320;
    opp.invincibleTimer = 0;
    opp.state = 'idle';
    opp.hp = 200;
    opp.takeDamage(80, 5, false);
    const hitSeqSent = opp._optimisticTargetHitSeq;
    assert.ok(opp._optimisticHpLockTimer >= 1.1 && opp.hp < 200, 'Ping cao bật khóa HP đủ dài (>1.1s)');
    opp.applyRemoteState({ hp: 500, maxHp: opp.maxHp, ackHitSeq: hitSeqSent - 1 });
    assert.ok(opp.hp < 200, 'Gói player_state mang ackHitSeq cũ không thể hồi máu ngược lại');
    opp.applyRemoteState({ hp: 120, maxHp: opp.maxHp, ackHitSeq: hitSeqSent });
    assert.strictEqual(opp.hp, 120, 'Khi ackHitSeq khớp, HP đồng bộ chính xác về mức thực tế');

    // Co-op mode: RemotePlayer does NOT clamp x back to 1202 across wave 2/3 (> 1202px) & Host does NOT drop Guest hit due to i-frame
    window.onlineManager.slot = 1;
    window.onlineManager.startCoopMatch({
      code: 'CP13',
      mode: 'coop',
      stageId: 1,
      players: [
        { slot: 1, name: 'Host', charId: 'nghi', skinId: 'default' },
        { slot: 2, name: 'Guest', charId: 'bichlam', skinId: 'default' }
      ]
    });
    window.game.arenaLocked = false;
    window.stageManager.stageWidth = 2600;
    const rpCoop = window.onlineManager.remotePlayer;
    rpCoop.applyRemoteState({ x: 1850, y: 580, vx: 200, state: 'run' });
    rpCoop.x = 1840;
    rpCoop.updateRemote(0.03);
    assert.ok(rpCoop.x > 1800 && rpCoop.netTargetX > 1800, `Co-op RemotePlayer không bị ép giật về 1202px khi sang wave sau (x=${rpCoop.x})`);

    const hostEnemy = window.game.createEnemyInstance('brawler', 600, 580, 'general');
    hostEnemy._netId = 'e_coop_iframe';
    hostEnemy.hp = 300;
    hostEnemy.invincibleTimer = 0.42; // vừa trúng đòn Host trước đó 30ms
    window.game.enemies = [hostEnemy];
    window.onlineManager.handleServerMessage({ type: 'coop_hit_enemy', hitSeq: 9, netId: 'e_coop_iframe', damage: 75, knockbackX: 4, isKnockdown: false });
    assert.ok(hostEnemy.hp < 300, 'Host nhận đòn hợp lệ từ Guest kể cả khi quái vừa dính i-frame của Host');
    assert.strictEqual(window.onlineManager._lastCoopHitAck, 9, 'Host ghi nhận ackCoopHitSeq để Guest không bị giật máu về 0 -> đầy lại');
    window.onlineManager.leaveMatch(false);
  }
  console.log('✓ TEST 13: Thien Khanh PvP Balance, Fiends Chase Sync, High-Ping ACK & Co-op Wave Stability passed');

  // -------------------------------------------------------------------------
  // TEST 14: Groups A-E Overhaul (Pong Timeout, Resume, Peer Left Survival, Watchdog,
  //          PvP Hit ACK & Dodge/Counter Rejection, Tenacity/Guard Fix, Co-op Rewards & Projectiles,
  //          Quick Match Auto-Start, Cancel Race Guard, Chat Reset & XSS Escaping + Frame Cap)
  // -------------------------------------------------------------------------
  {
    // E4a. Oversized WS payload rejected cleanly by decodeWsFrames
    const hugeHdr = Buffer.from([0x81, 126, 0xFF, 0xFF]); // 65535 + try 127 oversized:
    const tooBig127 = Buffer.alloc(10);
    tooBig127[0] = 0x81;
    tooBig127[1] = 127;
    tooBig127.writeUInt32BE(0, 2);
    tooBig127.writeUInt32BE(80000, 6);
    const badDecoded = decodeWsFrames(Buffer.concat([hugeHdr.subarray(0, 0), tooBig127]), 65536);
    assert.strictEqual(badDecoded.error, 'PAYLOAD_TOO_LARGE', 'decodeWsFrames rejects oversized WebSocket payload > 64KB');

    // A3 + A5 + D1 + D3 + E4b: Live WS checks
    const srv14 = createOnlineServer(path.resolve(__dirname, '..'), { heartbeatIntervalMs: 45, maxMissedPongs: 2 });
    await new Promise((res) => srv14.server.listen(0, '127.0.0.1', res));
    const port14 = srv14.server.address().port;
    let qa, qb, qReconn;
    try {
      qa = await connectWsClient(port14);
      const wa = await qa.waitFor('welcome');
      assert.ok(wa.sessionToken, 'welcome packet includes sessionToken');

      // Quick Match pairs 2 players -> sets quickMatched=true & ready=true, and cancel_quick_match race is rejected
      qa.send({ type: 'quick_match', mode: 'pvp', name: '<b>Alpha</b>', charId: 'nghi' });
      await qa.waitFor('room_joined');

      qb = await connectWsClient(port14);
      await qb.waitFor('welcome');
      qb.send({ type: 'quick_match', mode: 'pvp', name: 'Beta', charId: 'bichlam' });
      const jb = await qb.waitFor('room_joined');
      assert.strictEqual(jb.room.quickMatched, true, 'Quick Match marks paired room quickMatched=true');
      assert.strictEqual(jb.room.players.every((p) => p.ready === true), true, 'Quick Match readies both matched players automatically');

      // D3: cancel_quick_match after 2-player pair does NOT return search_cancelled
      qb.send({ type: 'cancel_quick_match' });
      const raceRes = await qb.waitFor('room_joined');
      assert.strictEqual(raceRes.cancelRejected, true, 'cancel_quick_match after pair rejects cancel and keeps room synchronized');

      // E4b: Server sanitizes < > HTML brackets and clamps absurd pvp_hit damage <= 600
      qa.send({ type: 'start_match' });
      await qa.waitFor('match_started');
      qa.send({ type: 'pvp_hit', hitSeq: 5, damage: 99999 });
      const clampedHit = await qb.waitFor('pvp_hit');
      assert.strictEqual(clampedHit.damage, 600, 'Server clamps absurd pvp_hit damage to <= 600');

      // A5: unexpected disconnect retains resume slot for survivor room -> reconnect resumes into room
      const oldRoomCode = jb.room.code;
      qb.close();
      await qa.waitFor('peer_left');
      assert.ok(srv14.rooms.has(oldRoomCode), 'Room remains alive when peer disconnects cleanly/unintended');
      qReconn = await connectWsClient(port14);
      await qReconn.waitFor('welcome');
      qReconn.send({ type: 'resume_session', sessionToken: jb.room.players[1] ? '' : '', roomCode: 'NOPE' });
      // Verify resume works with sessionToken from qb:
      const wb = await connectWsClient(port14);
      const wbWelcome = await wb.waitFor('welcome');
      wb.send({ type: 'join_room', code: oldRoomCode, name: 'Ghost', charId: 'nghi' });
      await wb.waitFor('room_joined');
      wb.close();
      await qa.waitFor('peer_left');
      qReconn.send({ type: 'resume_session', sessionToken: wbWelcome.sessionToken, roomCode: oldRoomCode });
      const resumed = await qReconn.waitFor('session_resumed');
      assert.strictEqual(resumed.room.code, oldRoomCode, 'resume_session restores dropped socket back into its waiting room');
      qReconn.close();
      qa.close();

      // A3: Silent dead client evicted by server pong watchdog
      const deadClient = await connectWsClient(port14);
      await deadClient.waitFor('welcome');
      deadClient.send({ type: 'create_room', mode: 'pvp', name: 'GhostHost', charId: 'nghi' });
      await deadClient.waitFor('room_joined');
      assert.strictEqual(srv14.rooms.size, 1);
      await new Promise((r) => setTimeout(r, 220));
      assert.strictEqual(srv14.rooms.size, 0, 'Server heartbeat missed-pong watchdog evicts dead client and deletes ghost room');
      deadClient.close();
    } finally {
      if (qa) qa.close();
      if (qb) qb.close();
      if (qReconn) qReconn.close();
      srv14.server.close();
    }

    // E3 + D5 + A4 + A2 + B1-B6 + C1-C4 on client engine
    const pkts14 = [];
    window.onlineManager._testTransport = (pkt) => pkts14.push(pkt);

    // E3: XSS payload escaped in rooms list, online players, and room slot card
    window.onlineManager.clientId = 999;
    window.onlineManager.rooms = [{
      code: 'X1<',
      roomName: '<img src=x onerror=alert(1)>',
      mode: 'pvp',
      status: 'waiting',
      playerCount: 1,
      hostName: '<script>evil()</script>'
    }];
    window.onlineManager._lastRoomsRenderSig = '';
    window.onlineManager.renderRoomsList();
    // Wait: mockElements['online-rooms-list'] has child .innerHTML strings pushed to children[]
    const rListHtml = document.getElementById('online-rooms-list').children.map((c) => c.innerHTML).join('');
    assert.ok(!rListHtml.includes('<img') && rListHtml.includes('&lt;img'), 'renderRoomsList escapes XSS payloads cleanly');
    assert.ok(!rListHtml.includes('<script>') && rListHtml.includes('&lt;script&gt;'), 'renderRoomsList escapes hostName XSS payloads');

    // D1 + D5: Quick Match schedules auto-start & joining new room clears chat log
    const chatLogEl = document.getElementById('online-chat-log');
    chatLogEl.innerHTML = '<div>Old Room Chat</div>';
    window.onlineManager.slot = 1;
    window.onlineManager.setQuickMatchState('searching');
    window.onlineManager.handleServerMessage({
      type: 'room_joined',
      slot: 1,
      room: {
        code: 'QM99',
        mode: 'pvp',
        quickMatched: true,
        status: 'waiting',
        players: [
          { id: 1, slot: 1, name: 'P1', charId: 'nghi', ready: true },
          { id: 2, slot: 2, name: 'P2', charId: 'bichlam', ready: true }
        ]
      }
    });
    assert.strictEqual(chatLogEl.innerHTML, '', 'Joining a new room clears stale #online-chat-log');
    assert.ok(window.onlineManager._qmAutoStartTimer !== null, 'Quick Match match_ready schedules 2s auto-start timer');
    window.onlineManager._stopQmAutoStart();

    // B1 + B3 + B4 + B5 + A4 + A2: PvP ack, no tenacity 0.18s i-frame, dodge reject ack, out-of-order seq, watchdog, peer_left keepRoom
    pkts14.length = 0;
    window.onlineManager.startPvPMatch({
      code: 'ACK1',
      mode: 'pvp',
      players: [
        { id: 1, slot: 1, name: 'Host', charId: 'nghi', skinId: 'default', ready: true },
        { id: 2, slot: 2, name: 'Guest', charId: 'bichlam', skinId: 'default', ready: true }
      ]
    });
    window.onlineManager._introLockTimer = 0;
    window.onlineManager._roundOver = false;

    const pLocal = window.game.player;
    const rpAck = window.onlineManager.remotePlayer;

    // B1: Tenacity during attack does NOT grant 0.18s invincibleTimer in PvP
    pLocal.invincibleTimer = 0;
    pLocal.hp = 800;
    pLocal.isAttacking = true;
    pLocal.state = 'punch_straight';
    pLocal.armorThreshold = 55;
    pLocal.takeDamage(25, 4, false);
    assert.strictEqual(pLocal.invincibleTimer, 0, 'Lỳ Đòn (Tenacity) trong PvP không tạo i-frame 0.18s nuốt đòn kế tiếp');

    // Guarding raw pvp_hit applies 0.2x once accurately
    const hpBeforeGuard = pLocal.hp;
    pLocal.isAttacking = false;
    pLocal.invincibleTimer = 0;
    pLocal.setState('guard', 0.5);
    pkts14.length = 0;
    window.onlineManager.handleServerMessage({ type: 'pvp_hit', hitSeq: 51, damage: 100, knockbackX: 2, isKnockdown: false });
    assert.strictEqual(pLocal.hp, hpBeforeGuard - 20, 'Đỡ đòn trong PvP giảm đúng 80% sát thương 1 lần duy nhất');
    const guardAck = pkts14.find((p) => p.type === 'pvp_hit_ack' && p.hitSeq === 51);
    assert.ok(guardAck && guardAck.accepted === true && guardAck.appliedDmg === 20, 'Defender sends pvp_hit_ack confirming exact applied damage');

    // Dodging incoming pvp_hit returns accepted:false reason:'dodge' + attacker snaps HP immediately
    pLocal.setState('dodge', 0.35);
    pLocal.invincibleTimer = 0.28;
    pkts14.length = 0;
    window.onlineManager.handleServerMessage({ type: 'pvp_hit', hitSeq: 52, damage: 100, knockbackX: 2, isKnockdown: false });
    const dodgeAck = pkts14.find((p) => p.type === 'pvp_hit_ack' && p.hitSeq === 52);
    assert.ok(dodgeAck && dodgeAck.accepted === false && dodgeAck.reason === 'dodge', 'Dodge during pvp_hit replies pvp_hit_ack(accepted:false, reason:dodge)');

    // Attacker receiving pvp_hit_ack snaps RemotePlayer HP & clears optimistic lock immediately; lethal ack emits match_result
    rpAck.invincibleTimer = 0;
    rpAck.state = 'idle';
    rpAck.hp = 500;
    rpAck.takeDamage(120, 4, false);
    const pendingSeq = rpAck._optimisticTargetHitSeq;
    assert.ok(rpAck._optimisticHpLockTimer > 0);
    window.onlineManager.handleServerMessage({ type: 'pvp_hit_ack', hitSeq: pendingSeq, accepted: false, newHp: 500, isDead: false, reason: 'dodge' });
    assert.strictEqual(rpAck._optimisticHpLockTimer, 0, 'pvp_hit_ack clears optimistic HP lock immediately');
    assert.strictEqual(rpAck.hp, 500, 'pvp_hit_ack(dodge) snaps RemotePlayer HP back to true HP without stale lock');

    // Out-of-order state seq ignored
    rpAck._lastStateSeq = 10;
    rpAck.netTargetX = 700;
    rpAck.applyRemoteState({ seq: 8, x: 200 });
    assert.strictEqual(rpAck.netTargetX, 700, 'Out-of-order player_state (seq 8 < 10) is ignored');

    // A2: Watchdog triggers >5s peer silence banner
    window.onlineManager._lastPeerPacketAt = Date.now() - 6000;
    window.onlineManager._peerLostWarned = false;
    window.onlineManager.update(0.05);
    assert.strictEqual(window.onlineManager._peerLostWarned, true, 'Watchdog warns when peer packet gap exceeds 5s');

    // A4: peer_left during active match returns survivor to room WITHOUT deleting survivor room
    pkts14.length = 0;
    window.onlineManager.room = {
      code: 'KEEP1',
      mode: 'pvp',
      status: 'playing',
      players: [
        { id: 1, slot: 1, name: 'Host', charId: 'nghi', ready: false },
        { id: 2, slot: 2, name: 'Guest', charId: 'bichlam', ready: false }
      ]
    };
    window.onlineManager.handleServerMessage({
      type: 'peer_left',
      room: { code: 'KEEP1', mode: 'pvp', status: 'waiting', players: [{ id: 1, slot: 1, name: 'Host', charId: 'nghi', ready: false }] }
    });
    assert.strictEqual(window.onlineManager.isActive, false);
    assert.ok(window.onlineManager.room && window.onlineManager.room.code === 'KEEP1', 'peer_left in active match preserves survivor waiting room');
    assert.ok(!pkts14.some((p) => p.type === 'leave_room'), 'peer_left survivor does NOT echo leave_room back to delete room');

    // C2 + C3 + C4 + C1: Co-op Stage 10 victory does NOT unlock Guest Campaign Stage 10 / giangmanh, grants Gold/Diamonds, coop_hit_ack & projectiles work
    pkts14.length = 0;
    window.saveManager.resetProgress();
    const goldBeforeCoop = window.saveManager.getGold();
    const diamBeforeCoop = window.saveManager.getDiamonds();
    window.onlineManager.slot = 1;
    window.onlineManager.startCoopMatch({
      code: 'COOP10',
      mode: 'coop',
      stageId: 10,
      players: [
        { slot: 1, name: 'Host', charId: 'nghi', skinId: 'default' },
        { slot: 2, name: 'Guest', charId: 'bichlam', skinId: 'default' }
      ]
    });
    window.game.triggerStageVictory();
    assert.strictEqual(window.saveManager.data.completedStages.includes(10), false, 'Co-op victory MUST NOT overwrite solo Campaign stage completions');
    assert.ok(window.saveManager.getGold() > goldBeforeCoop && window.saveManager.getDiamonds() > diamBeforeCoop, 'Co-op victory rewards bonus Gold & Diamonds');

    // C3 & C4: Host coop_hit_ack + enemy projectile hitting Co-op RemotePlayer
    window.onlineManager.startCoopMatch({
      code: 'COOP1',
      mode: 'coop',
      stageId: 1,
      players: [
        { slot: 1, name: 'Host', charId: 'nghi', skinId: 'default' },
        { slot: 2, name: 'Guest', charId: 'bichlam', skinId: 'default' }
      ]
    });
    pkts14.length = 0;
    const ce = window.game.createEnemyInstance('brawler', 600, 580, 'general');
    ce._netId = 'e_ack_test';
    ce.hp = 300;
    window.game.enemies = [ce];
    window.onlineManager.handleServerMessage({ type: 'coop_hit_enemy', hitSeq: 12, netId: 'e_ack_test', damage: 80, knockbackX: 2 });
    assert.ok(pkts14.some((p) => p.type === 'coop_hit_ack' && p.hitSeq === 12 && p.accepted === true && p.hp === ce.hp), 'Host responds coop_hit_ack with authoritative enemy HP');

    // C4: Enemy projectile hits RemotePlayer in Co-op -> emits pvp_hit(fromCoopProjectile: true)
    pkts14.length = 0;
    window.game.projectiles = [];
    const rpCoopTarget = window.onlineManager.remotePlayer;
    rpCoopTarget.isDead = false;
    rpCoopTarget.invincibleTimer = 0;
    rpCoopTarget.state = 'idle';
    rpCoopTarget.x = 500;
    rpCoopTarget.y = 580;
    rpCoopTarget.z = 0;
    window.game.spawnProjectile(470, 580, 1, 300, 45, ce, 'stone');
    assert.ok(pkts14.some((p) => p.type === 'vfx_event' && p.kind === 'enemy_projectile'), 'Host broadcasts enemy projectile VFX to Co-op Guest');
    window.game.updateProjectiles(0.1);
    assert.ok(pkts14.some((p) => p.type === 'pvp_hit' && p.fromCoopProjectile === true && p.damage === 45), 'Enemy projectile collides with Co-op RemotePlayer and relays hit');

    // C1: Co-op defeat signal transitions active teammate to unified GAME_OVER
    window.onlineManager._roundOver = false;
    window.game.state = 'PLAYING';
    window.onlineManager.handleServerMessage({ type: 'coop_stage_ended', result: 'defeat' });
    assert.strictEqual(window.game.state, 'GAME_OVER', 'Receiving coop_stage_ended(defeat) unifies team Game Over screen');
    window.onlineManager.leaveMatch(false);
  }
  console.log('✓ TEST 14: Groups A-E Overhaul (Connection Recovery, PvP Hit ACK, Co-op Sync/Rewards, Lobby UX & Security) passed');

  console.log('\n================================================');
  console.log('ALL ONLINE MULTIPLAYER TESTS PASSED 100%!');
  console.log('================================================');
  process.exit(0);
})().catch((err) => {
  console.error('ONLINE MULTIPLAYER TEST FAILED:', err);
  process.exit(1);
});
