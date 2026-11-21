const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const PORT = Number(process.env.PORT) || 3000;
const EXPLICIT_HOST = process.env.HOST ? String(process.env.HOST).trim() : '';
const HOST = EXPLICIT_HOST || '0.0.0.0';
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.zip': 'application/zip'
};

// ============================================================================
// RFC 6455 WEBSOCKET FRAMING (PURE NODE.JS, ZERO EXTERNAL DEPENDENCIES)
// ============================================================================
function encodeWsFrame(payload, opcode = 0x1) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload || ''), 'utf8');
  const len = data.length;
  let header;

  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x80 | (opcode & 0x0f);
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | (opcode & 0x0f);
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | (opcode & 0x0f);
    header[1] = 127;
    header.writeUInt32BE(0, 2);
    header.writeUInt32BE(len, 6);
  }
  return Buffer.concat([header, data]);
}

const MAX_WS_PAYLOAD_BYTES = 65536;
const MAX_WS_RECV_BUF_BYTES = 131072;

function sanitizeDisplayText(raw, fallback = '', maxLen = 24) {
  const cleaned = String(raw == null ? '' : raw)
    .replace(/[\x00-\x1f\x7f<>]/g, '')
    .trim()
    .slice(0, maxLen);
  return cleaned || fallback;
}

function decodeWsFrames(buffer, maxPayload = MAX_WS_PAYLOAD_BYTES) {
  const frames = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const firstByte = buffer[offset];
    const secondByte = buffer[offset + 1];
    const opcode = firstByte & 0x0f;
    const isMasked = (secondByte & 0x80) !== 0;
    let payloadLen = secondByte & 0x7f;
    let cursor = offset + 2;

    if (payloadLen === 126) {
      if (cursor + 2 > buffer.length) break;
      payloadLen = buffer.readUInt16BE(cursor);
      cursor += 2;
    } else if (payloadLen === 127) {
      if (cursor + 8 > buffer.length) break;
      const hi = buffer.readUInt32BE(cursor);
      const lo = buffer.readUInt32BE(cursor + 4);
      payloadLen = hi * 4294967296 + lo;
      cursor += 8;
    }

    if (!Number.isFinite(payloadLen) || payloadLen < 0 || payloadLen > maxPayload) {
      return { frames: [], remaining: Buffer.alloc(0), error: 'PAYLOAD_TOO_LARGE' };
    }

    const maskLen = isMasked ? 4 : 0;
    if (cursor + maskLen + payloadLen > buffer.length) break;

    let payload;
    if (isMasked) {
      const mask = buffer.subarray(cursor, cursor + 4);
      cursor += 4;
      payload = Buffer.alloc(payloadLen);
      for (let i = 0; i < payloadLen; i++) {
        payload[i] = buffer[cursor + i] ^ mask[i % 4];
      }
    } else {
      payload = Buffer.from(buffer.subarray(cursor, cursor + payloadLen));
    }

    offset = cursor + payloadLen;
    frames.push({ opcode, payload });
  }

  return {
    frames,
    remaining: buffer.subarray(offset)
  };
}

// ============================================================================
// SERVER TẠO PHÒNG, TÀI KHOẢN CLOUD SAVE & RELAY MULTIPLAYER (1V1 PVP & 2P CO-OP)
// ============================================================================
const AUTH_SECRET = process.env.VOV_AUTH_SECRET || crypto.createHash('sha256').update(__dirname + '_vovinam_auth_v5').digest('hex');

function normalizeUsername(raw) {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function createAuthHelpers(accountsFilePath) {
  let cache = null;

  function loadAccounts() {
    if (cache) return cache;
    try {
      if (fs.existsSync(accountsFilePath)) {
        const parsed = JSON.parse(fs.readFileSync(accountsFilePath, 'utf8'));
        if (parsed && typeof parsed === 'object') {
          cache = parsed;
          return cache;
        }
      }
    } catch (_) {}
    cache = {};
    return cache;
  }

  function flushAccounts() {
    if (!cache) return;
    try {
      fs.mkdirSync(path.dirname(accountsFilePath), { recursive: true });
      fs.writeFileSync(accountsFilePath, JSON.stringify(cache, null, 2), 'utf8');
    } catch (_) {}
  }

  function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto.scryptSync(String(password), salt, 32).toString('hex');
    return `${salt}:${hash}`;
  }

  function verifyPassword(password, stored) {
    if (!stored || !stored.includes(':')) return false;
    const [salt, expectedHex] = stored.split(':');
    const actual = crypto.scryptSync(String(password), salt, 32);
    const expected = Buffer.from(expectedHex, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  }

  function signToken(username) {
    const payload = Buffer.from(JSON.stringify({ u: username, iat: Date.now() }), 'utf8').toString('base64url');
    const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  }

  function verifyToken(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [payload, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    try {
      return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch (_) {
      return null;
    }
  }

  function sanitizePublicUser(acc) {
    const sv = (acc && acc.save && typeof acc.save === 'object') ? acc.save : {};
    return {
      username: acc.username,
      displayName: acc.displayName || acc.username,
      pvpWins: Number(acc.pvpWins || 0),
      pvpMatches: Number(acc.pvpMatches || 0),
      currentStage: Number(sv.currentStage || 1),
      gold: Number(sv.gold || 0),
      diamonds: Number(sv.diamonds || 0),
      unlockedCount: Array.isArray(sv.unlockedCharacters) ? sv.unlockedCharacters.length : 1,
      completedCount: Array.isArray(sv.completedStages) ? sv.completedStages.length : 0,
      updatedAt: acc.updatedAt || acc.createdAt
    };
  }

  return { loadAccounts, flushAccounts, hashPassword, verifyPassword, signToken, verifyToken, sanitizePublicUser };
}

function readJsonBody(req, maxBytes = 128 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > maxBytes) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (_) {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(obj));
}

function createOnlineServer(rootDir = __dirname, options = {}) {
  const rooms = new Map();
  const clients = new Map();
  const disconnectedSessions = new Map();
  let nextClientId = 1;
  let lastLobbyRoomsSig = '';
  let lastPlayersSig = '';
  const accountsFile = options.accountsFile || path.join(rootDir, 'data', 'accounts.json');
  const auth = createAuthHelpers(accountsFile);

  function sendWs(client, dataObj) {
    if (!client || !client.socket || client.socket.destroyed) return;
    try {
      const json = typeof dataObj === 'string' ? dataObj : JSON.stringify(dataObj);
      client.socket.write(encodeWsFrame(json, 0x1));
    } catch (_) {}
  }

  function serializeRoom(room) {
    if (!room) return null;
    return {
      code: room.code,
      roomName: room.roomName || `Võ Đài #${room.code}`,
      mode: room.mode,
      stageId: room.stageId,
      isPrivate: !!room.isPrivate,
      hasPassword: Boolean(room.password),
      isQuickMatch: !!room.isQuickMatch,
      quickMatched: !!room.quickMatched,
      status: room.status,
      scores: { p1: room.scores.p1, p2: room.scores.p2 },
      players: room.players.map((p) => ({
        id: p.id,
        slot: p.slot,
        name: p.name,
        charId: p.charId,
        skinId: p.skinId,
        allyId: p.allyId || 'auto',
        ready: !!p.ready
      })),
      matchEpoch: room.matchEpoch || 1
    };
  }

  function getPublicRoomsList() {
    const out = [];
    for (const room of rooms.values()) {
      out.push({
        code: room.code,
        roomName: room.roomName || `Võ Đài #${room.code}`,
        mode: room.mode,
        stageId: room.stageId,
        isPrivate: !!room.isPrivate,
        hasPassword: Boolean(room.password),
        status: room.status,
        playerCount: room.players.length,
        maxPlayers: 2,
        hostName: room.players[0] ? room.players[0].name : 'Võ Sĩ'
      });
    }
    return out;
  }

  function getOnlinePlayersList() {
    const out = [];
    for (const c of clients.values()) {
      out.push({
        id: c.id,
        name: c.name || 'Võ Sĩ',
        charId: c.charId || 'nghi',
        skinId: c.skinId || 'default',
        allyId: c.allyId || 'auto',
        status: c.roomCode ? 'in_room' : (c.isSearching ? 'searching' : 'lobby'),
        roomCode: c.roomCode || null
      });
    }
    return out;
  }

  function broadcastOnlinePlayers(force = false) {
    const list = getOnlinePlayersList();
    const json = JSON.stringify({ type: 'online_players', players: list });
    if (!force && json === lastPlayersSig) return;
    lastPlayersSig = json;
    const frame = encodeWsFrame(json, 0x1);
    for (const c of clients.values()) {
      if (!c || !c.socket || c.socket.destroyed) continue;
      try { c.socket.write(frame); } catch (_) {}
    }
  }

  function broadcastRoomsToLobby(force = false) {
    const list = getPublicRoomsList();
    const json = JSON.stringify({ type: 'rooms_list', rooms: list });
    if (!force && json === lastLobbyRoomsSig) return;
    lastLobbyRoomsSig = json;
    const frame = encodeWsFrame(json, 0x1);
    for (const c of clients.values()) {
      if (!c.roomCode && c.socket && !c.socket.destroyed) {
        try { c.socket.write(frame); } catch (_) {}
      }
    }
  }

  function broadcastRoom(room, payload, excludeId = null) {
    if (!room) return;
    const isVolatile = !!(payload && (payload.type === 'player_state' || payload.type === 'coop_enemies_sync'));
    const json = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const frame = encodeWsFrame(json, 0x1);
    for (const p of room.players) {
      if (excludeId !== null && p.id === excludeId) continue;
      if (!p || !p.socket || p.socket.destroyed) continue;
      if (isVolatile && (p.socket.writableLength || 0) > 32768) continue;
      try { p.socket.write(frame); } catch (_) {}
    }
  }

  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 20; attempt++) {
      let code = '';
      for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      if (!rooms.has(code)) return code;
    }
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  function leaveCurrentRoom(client, reason = 'left') {
    if (!client || !client.roomCode) return;
    const room = rooms.get(client.roomCode);
    const oldCode = client.roomCode;
    client.roomCode = null;
    client.slot = 0;
    client.ready = false;
    client.rematchReady = false;
    if (!room) return;

    room.players = room.players.filter((p) => p.id !== client.id);
    if (room.players.length === 0) {
      rooms.delete(oldCode);
    } else {
      room.status = 'waiting';
      room.quickMatched = false;
      room.players.forEach((p, idx) => {
        p.slot = idx + 1;
        p.rematchReady = false;
      });
      broadcastRoom(room, {
        type: 'peer_left',
        reason,
        room: serializeRoom(room)
      });
      broadcastRoom(room, {
        type: 'room_updated',
        room: serializeRoom(room)
      });
    }
    broadcastRoomsToLobby();
  }

  function createRoomForClient(client, msg = {}) {
    leaveCurrentRoom(client);
    const customCode = typeof msg.code === 'string'
      ? msg.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
      : '';
    const code = (customCode && !rooms.has(customCode)) ? customCode : generateRoomCode();
    const mode = msg.mode === 'coop' ? 'coop' : 'pvp';
    const rawStage = Math.max(1, Math.min(20, Number(msg.stageId) || 1));
    const maxUnlocked = Number.isFinite(Number(msg.maxUnlockedStage))
      ? Math.max(1, Math.min(20, Number(msg.maxUnlockedStage)))
      : 20;
    const stageId = mode === 'coop' ? Math.min(rawStage, maxUnlocked) : rawStage;
    const isQM = !!msg.fromQuickMatch;

    client.name = sanitizeDisplayText(msg.name, client.name || 'Võ Sĩ 1', 24);
    client.charId = sanitizeDisplayText(msg.charId, client.charId || 'nghi', 24);
    client.skinId = sanitizeDisplayText(msg.skinId, client.skinId || 'default', 24);
    client.allyId = sanitizeDisplayText(msg.allyId, client.allyId || 'auto', 24);
    client.roomCode = code;
    client.slot = 1;
    client.ready = isQM;
    client.isSearching = isQM;
    client.rematchReady = false;

    const cleanRoomName = sanitizeDisplayText(msg.roomName, `Võ Đài của ${client.name}`, 32);
    const isPrivate = !!msg.isPrivate;
    const password = (isPrivate && typeof msg.password === 'string') ? msg.password.trim().slice(0, 12) : '';

    const room = {
      code,
      roomName: cleanRoomName,
      mode,
      stageId,
      isPrivate,
      password,
      isQuickMatch: isQM,
      quickMatched: false,
      status: 'waiting',
      matchEpoch: 1,
      scores: { p1: 0, p2: 0 },
      players: [client]
    };
    rooms.set(code, room);
    sendWs(client, { type: 'room_joined', slot: 1, room: serializeRoom(room) });
    broadcastRoomsToLobby();
    broadcastOnlinePlayers();
    return room;
  }

  function joinRoomForClient(client, room, msg = {}) {
    leaveCurrentRoom(client);
    const viaQM = !!msg.fromQuickMatch || !!room.isQuickMatch;
    client.name = sanitizeDisplayText(msg.name, client.name || 'Võ Sĩ 2', 24);
    client.charId = sanitizeDisplayText(msg.charId, client.charId || 'bichlam', 24);
    client.skinId = sanitizeDisplayText(msg.skinId, client.skinId || 'default', 24);
    client.allyId = sanitizeDisplayText(msg.allyId, client.allyId || 'auto', 24);
    client.roomCode = room.code;
    client.ready = viaQM;
    client.isSearching = false;
    client.rematchReady = false;
    room.players.forEach((p) => {
      p.isSearching = false;
      if (viaQM) p.ready = true;
    });
    if (viaQM) room.quickMatched = true;
    if (Number(msg.preferredSlot) === 1 && room.players.length === 1) {
      room.players[0].slot = 2;
      client.slot = 1;
      room.players.unshift(client);
    } else {
      client.slot = room.players.some((p) => p.slot === 1) ? 2 : 1;
      room.players.push(client);
    }

    const payload = serializeRoom(room);
    sendWs(client, { type: 'room_joined', slot: client.slot, room: payload });
    broadcastRoom(room, { type: 'room_updated', room: payload }, client.id);
    broadcastRoomsToLobby();
    broadcastOnlinePlayers();
    return room;
  }

  function handleMessage(client, rawText) {
    let msg;
    try {
      msg = JSON.parse(rawText);
    } catch (_) {
      return;
    }
    if (!msg || typeof msg.type !== 'string') return;

    switch (msg.type) {
      case 'hello': {
        if (msg.name) client.name = sanitizeDisplayText(msg.name, client.name, 24);
        if (msg.charId) client.charId = sanitizeDisplayText(msg.charId, client.charId, 24);
        if (msg.skinId) client.skinId = sanitizeDisplayText(msg.skinId, client.skinId, 24);
        if (msg.allyId) client.allyId = sanitizeDisplayText(msg.allyId, client.allyId, 24);
        sendWs(client, {
          type: 'welcome',
          clientId: client.id,
          sessionToken: client.sessionToken,
          rooms: getPublicRoomsList(),
          players: getOnlinePlayersList()
        });
        broadcastOnlinePlayers();
        break;
      }

      case 'resume_session': {
        const token = typeof msg.sessionToken === 'string' ? msg.sessionToken.trim() : '';
        const prev = token ? disconnectedSessions.get(token) : null;
        if (token) disconnectedSessions.delete(token);
        if (prev && prev.expiresAt > Date.now() && prev.roomCode) {
          const room = rooms.get(prev.roomCode);
          if (room && room.players.length > 0 && room.players.length < 2) {
            client.name = prev.name || client.name;
            client.charId = prev.charId || client.charId;
            client.skinId = prev.skinId || client.skinId;
            client.allyId = prev.allyId || client.allyId;
            joinRoomForClient(client, room, { fromQuickMatch: !!room.isQuickMatch, preferredSlot: prev.slot });
            const resumedRoom = serializeRoom(room);
            sendWs(client, { type: 'session_resumed', room: resumedRoom, slot: client.slot });
            broadcastRoom(room, { type: 'room_updated', room: resumedRoom }, client.id);
            break;
          }
        }
        sendWs(client, { type: 'session_expired', roomCode: msg.roomCode || null });
        break;
      }

      case 'list_rooms': {
        sendWs(client, { type: 'rooms_list', rooms: getPublicRoomsList() });
        break;
      }

      case 'list_online_players': {
        sendWs(client, { type: 'online_players', players: getOnlinePlayersList() });
        break;
      }

      case 'create_room': {
        createRoomForClient(client, msg);
        break;
      }

      case 'join_room': {
        const code = String(msg.code || '').trim().toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          sendWs(client, { type: 'error_msg', message: `Không tìm thấy phòng "${code}"!` });
          return;
        }
        if (room.players.length >= 2) {
          sendWs(client, { type: 'error_msg', message: `Phòng "${code}" đã đủ 2 người!` });
          return;
        }
        if (room.status !== 'waiting') {
          sendWs(client, { type: 'error_msg', message: `Phòng "${code}" đang thi đấu!` });
          return;
        }
        if (room.isPrivate && room.password && !msg.viaInvite) {
          const supplied = String(msg.password || '').trim();
          if (supplied !== room.password) {
            sendWs(client, {
              type: 'error_msg',
              errorCode: 'WRONG_PASSWORD',
              roomCode: room.code,
              message: supplied ? `Mật khẩu phòng "#${code}" không đúng!` : `Phòng "#${code}" là phòng riêng tư — vui lòng nhập mật khẩu!`
            });
            return;
          }
        }
        joinRoomForClient(client, room, msg);
        break;
      }

      case 'quick_match': {
        const targetMode = msg.mode === 'coop' ? 'coop' : 'pvp';
        const reqMax = Number.isFinite(Number(msg.maxUnlockedStage))
          ? Math.max(1, Math.min(20, Number(msg.maxUnlockedStage)))
          : null;
        let found = null;
        for (const room of rooms.values()) {
          if (room.status === 'waiting' && !room.isPrivate && room.players.length === 1 && room.mode === targetMode && room.players[0].id !== client.id) {
            if (targetMode === 'coop' && reqMax !== null && (Number(room.stageId) || 1) > reqMax) continue;
            found = room;
            break;
          }
        }
        if (found) {
          joinRoomForClient(client, found, { ...msg, fromQuickMatch: true });
        } else {
          createRoomForClient(client, { ...msg, fromQuickMatch: true, isPrivate: false });
        }
        break;
      }

      case 'cancel_quick_match': {
        if (client.roomCode) {
          const r = rooms.get(client.roomCode);
          if (r && r.players.length >= 2) {
            client.isSearching = false;
            sendWs(client, { type: 'room_joined', slot: client.slot, room: serializeRoom(r), cancelRejected: true });
            broadcastOnlinePlayers();
            break;
          }
          if (r && r.players.length <= 1) {
            leaveCurrentRoom(client);
          }
        }
        client.isSearching = false;
        sendWs(client, { type: 'search_cancelled' });
        broadcastOnlinePlayers();
        break;
      }

      case 'update_lobby': {
        const room = client.roomCode ? rooms.get(client.roomCode) : null;
        if (msg.name) client.name = sanitizeDisplayText(msg.name, client.name, 24);
        if (msg.charId) client.charId = sanitizeDisplayText(msg.charId, client.charId, 24);
        if (msg.skinId) client.skinId = sanitizeDisplayText(msg.skinId, client.skinId, 24);
        if (msg.allyId) client.allyId = sanitizeDisplayText(msg.allyId, client.allyId, 24);
        if (typeof msg.ready === 'boolean') client.ready = msg.ready;
        if (!room) {
          broadcastOnlinePlayers();
          return;
        }
        if (client.slot === 1) {
          if (msg.mode === 'pvp' || msg.mode === 'coop') room.mode = msg.mode;
          if (msg.stageId) room.stageId = Math.max(1, Math.min(20, Number(msg.stageId) || 1));
          if (typeof msg.roomName === 'string' && msg.roomName.trim()) {
            room.roomName = sanitizeDisplayText(msg.roomName, room.roomName, 32);
          }
        }
        broadcastRoom(room, { type: 'room_updated', room: serializeRoom(room) });
        broadcastRoomsToLobby();
        broadcastOnlinePlayers();
        break;
      }

      case 'toggle_ready': {
        const room = client.roomCode ? rooms.get(client.roomCode) : null;
        client.ready = typeof msg.ready === 'boolean' ? msg.ready : !client.ready;
        if (!room) return;
        broadcastRoom(room, { type: 'room_updated', room: serializeRoom(room) });
        break;
      }

      case 'send_invite': {
        const room = client.roomCode ? rooms.get(client.roomCode) : null;
        if (!room) {
          sendWs(client, { type: 'error_msg', message: 'Hãy vào hoặc tạo phòng trước khi mời người chơi khác!' });
          return;
        }
        const targetId = Number(msg.targetClientId);
        const target = clients.get(targetId);
        if (!target || target.id === client.id) {
          sendWs(client, { type: 'error_msg', message: 'Không tìm thấy võ sĩ đang online này!' });
          return;
        }
        sendWs(target, {
          type: 'room_invite',
          roomCode: room.code,
          roomName: room.roomName,
          hostName: client.name,
          mode: room.mode,
          stageId: room.stageId,
          isPrivate: !!room.isPrivate
        });
        sendWs(client, { type: 'invite_sent', targetName: target.name });
        break;
      }

      case 'start_match': {
        const room = client.roomCode ? rooms.get(client.roomCode) : null;
        if (!room) return;
        if (client.slot !== 1) {
          sendWs(client, { type: 'error_msg', message: 'Chỉ Chủ phòng (P1) mới có quyền bắt đầu trận!' });
          return;
        }
        if (room.players.length < 2) {
          sendWs(client, { type: 'error_msg', message: 'Cần đủ 2 người chơi trong phòng để bắt đầu!' });
          return;
        }
        if (room.players.some((p) => !p.ready)) {
          sendWs(client, { type: 'error_msg', message: 'Cả 2 võ sĩ cần nhấn SẴN SÀNG trước khi khai chiến!' });
          return;
        }
        room.status = 'playing';
        room.matchEpoch = (room.matchEpoch || 1) + 1;
        room.players.forEach((p) => { p.rematchReady = false; p.isSearching = false; });
        broadcastRoom(room, { type: 'match_started', room: serializeRoom(room) });
        broadcastRoomsToLobby();
        broadcastOnlinePlayers();
        break;
      }

      case 'leave_room': {
        client.isSearching = false;
        leaveCurrentRoom(client, 'left');
        sendWs(client, { type: 'rooms_list', rooms: getPublicRoomsList() });
        broadcastOnlinePlayers();
        break;
      }

      case 'ping_check': {
        sendWs(client, { type: 'pong_check', t: msg.t || Date.now() });
        break;
      }

      case 'match_result': {
        const room = client.roomCode ? rooms.get(client.roomCode) : null;
        if (!room || (client.slot !== 1 && client.slot !== 2)) return;
        if (Number.isFinite(Number(msg.epoch)) && room.matchEpoch && Number(msg.epoch) !== Number(room.matchEpoch)) {
          return;
        }
        const winnerSlot = Number(msg.winnerSlot) === 2 ? 2 : 1;
        if (room.status === 'playing') {
          if (winnerSlot === 1) room.scores.p1 += 1;
          else room.scores.p2 += 1;
          room.status = 'round_over';
          broadcastRoom(room, {
            type: 'match_result',
            winnerSlot,
            scores: { p1: room.scores.p1, p2: room.scores.p2 }
          });
        }
        break;
      }

      case 'coop_stage_ended': {
        const room = client.roomCode ? rooms.get(client.roomCode) : null;
        if (!room) return;
        if (room.status === 'playing') {
          room.status = 'round_over';
        }
        broadcastRoom(room, {
          type: 'coop_stage_ended',
          result: msg.result === 'victory' ? 'victory' : 'defeat',
          fromSlot: client.slot
        });
        break;
      }

      case 'rematch_request': {
        const room = client.roomCode ? rooms.get(client.roomCode) : null;
        if (!room) {
          sendWs(client, { type: 'error_msg', message: 'Bạn không còn ở trong phòng đấu!' });
          return;
        }
        if (room.players.length < 2) {
          sendWs(client, { type: 'error_msg', message: 'Đối thủ/Đồng đội đã rời phòng — không thể đấu lại!' });
          return;
        }
        client.rematchReady = true;
        broadcastRoom(room, { type: 'rematch_request', fromSlot: client.slot }, client.id);
        if (room.players.every((p) => p.rematchReady)) {
          room.status = 'playing';
          room.matchEpoch = (room.matchEpoch || 1) + 1;
          room.players.forEach((p) => { p.rematchReady = false; p.ready = true; });
          broadcastRoom(room, { type: 'rematch_start', room: serializeRoom(room) });
        }
        break;
      }

      case 'pvp_hit': {
        const room = client.roomCode ? rooms.get(client.roomCode) : null;
        if (!room) return;
        if (Number.isFinite(Number(msg.epoch)) && room.matchEpoch && Number(msg.epoch) !== Number(room.matchEpoch)) {
          return;
        }
        const now = Date.now();
        if (!client._hitWindowStart || (now - client._hitWindowStart) > 1000) {
          client._hitWindowStart = now;
          client._hitWindowCount = 0;
        }
        client._hitWindowCount += 1;
        if (client._hitWindowCount > 28) {
          if (Number.isFinite(Number(msg.hitSeq))) {
            sendWs(client, {
              type: 'pvp_hit_ack',
              epoch: msg.epoch || room.matchEpoch || 1,
              hitSeq: Number(msg.hitSeq),
              accepted: false,
              appliedDmg: 0,
              reason: 'rate_limit'
            });
          }
          return;
        }
        msg.damage = Math.max(0, Math.min(600, Number(msg.damage) || 0));
        msg.fromSlot = client.slot;
        broadcastRoom(room, msg, client.id);
        break;
      }

      case 'chat_emote': {
        const room = client.roomCode ? rooms.get(client.roomCode) : null;
        if (!room) return;
        msg.senderName = sanitizeDisplayText(msg.senderName, client.name || 'Võ Sĩ', 24);
        msg.text = sanitizeDisplayText(msg.text, '', 90);
        if (!msg.text) return;
        msg.fromSlot = client.slot;
        broadcastRoom(room, msg, client.id);
        break;
      }

      case 'player_state':
      case 'pvp_hit_ack':
      case 'coop_hit_enemy':
      case 'coop_hit_ack':
      case 'coop_enemies_sync':
      case 'coop_player_downed':
      case 'vfx_event': {
        const room = client.roomCode ? rooms.get(client.roomCode) : null;
        if (!room) return;
        if (Number.isFinite(Number(msg.epoch)) && room.matchEpoch && Number(msg.epoch) !== Number(room.matchEpoch)) {
          return;
        }
        msg.fromSlot = client.slot;
        broadcastRoom(room, msg, client.id);
        break;
      }
    }
  }

  const server = http.createServer(async (req, res) => {
    const reqPath = (req.url || '/').split('?')[0];
    if (req.method === 'OPTIONS') {
      sendJson(res, 204, {});
      return;
    }
    if (reqPath === '/health' || reqPath === '/api/health') {
      sendJson(res, 200, { ok: true, status: 'up', rooms: rooms.size, clients: clients.size });
      return;
    }
    if (reqPath === '/api/online/rooms') {
      sendJson(res, 200, { ok: true, rooms: getPublicRoomsList() });
      return;
    }
    if (reqPath === '/api/online/info') {
      const addr = server.address();
      const activePort = (addr && addr.port) || PORT;
      const lanUrls = [];
      try {
        const nets = os.networkInterfaces();
        for (const ifaces of Object.values(nets)) {
          for (const net of ifaces || []) {
            if (net && net.family === 'IPv4' && !net.internal) {
              lanUrls.push(`http://${net.address}:${activePort}/`);
            }
          }
        }
      } catch (_) {}
      const hostHeader = (req.headers && req.headers.host) ? String(req.headers.host) : `localhost:${activePort}`;
      const proto = (req.headers && req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
      sendJson(res, 200, {
        ok: true,
        currentUrl: `${proto}://${hostHeader}/`,
        lanUrls,
        clientsCount: clients.size,
        roomsCount: rooms.size
      });
      return;
    }

    // --- TÀI KHOẢN & LƯU CLOUD ---
    if (reqPath === '/api/auth/register' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const rawUsername = String(body.username || '').trim();
        const username = normalizeUsername(rawUsername);
        const password = String(body.password || '');
        const displayName = String(body.displayName || rawUsername || username).trim().slice(0, 24);
        if (!/^[a-z0-9_.-]{2,24}$/.test(username)) {
          sendJson(res, 400, { ok: false, error: 'Tên tài khoản 2-24 ký tự (chữ cái, số, _, . hoặc -)' });
          return;
        }
        if (password.length < 3) {
          sendJson(res, 400, { ok: false, error: 'Mật khẩu cần ít nhất 3 ký tự' });
          return;
        }
        const accounts = auth.loadAccounts();
        if (accounts[username]) {
          sendJson(res, 409, { ok: false, error: 'Tài khoản đã tồn tại!' });
          return;
        }
        const initSave = (body.save && typeof body.save === 'object') ? body.save : null;
        accounts[username] = {
          username,
          displayName: displayName || username,
          passwordHash: auth.hashPassword(password),
          pvpWins: 0,
          pvpMatches: 0,
          save: initSave,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        auth.flushAccounts();
        const token = auth.signToken(username);
        sendJson(res, 201, { ok: true, token, user: auth.sanitizePublicUser(accounts[username]), save: accounts[username].save });
      } catch (e) {
        sendJson(res, 400, { ok: false, error: e.message || 'Yêu cầu không hợp lệ' });
      }
      return;
    }

    if (reqPath === '/api/auth/login' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const username = normalizeUsername(body.username);
        const password = String(body.password || '');
        const accounts = auth.loadAccounts();
        const acc = accounts[username];
        if (!acc) {
          sendJson(res, 401, { ok: false, userNotFound: true, error: 'Tài khoản chưa tồn tại!' });
          return;
        }
        if (!auth.verifyPassword(password, acc.passwordHash)) {
          sendJson(res, 401, { ok: false, error: 'Sai tên đăng nhập hoặc mật khẩu!' });
          return;
        }
        const token = auth.signToken(username);
        sendJson(res, 200, { ok: true, token, user: auth.sanitizePublicUser(acc), save: acc.save || null });
      } catch (e) {
        sendJson(res, 400, { ok: false, error: e.message || 'Yêu cầu không hợp lệ' });
      }
      return;
    }

    const getAuthAccount = () => {
      const header = String((req.headers && req.headers.authorization) || '');
      const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
      const claims = auth.verifyToken(token);
      if (!claims || !claims.u) return null;
      const accounts = auth.loadAccounts();
      return accounts[claims.u] || null;
    };

    if (reqPath === '/api/auth/me' && req.method === 'GET') {
      const acc = getAuthAccount();
      if (!acc) { sendJson(res, 401, { ok: false, error: 'Chưa đăng nhập' }); return; }
      sendJson(res, 200, { ok: true, user: auth.sanitizePublicUser(acc), save: acc.save || null });
      return;
    }

    if (reqPath === '/api/auth/save' && req.method === 'POST') {
      const acc = getAuthAccount();
      if (!acc) { sendJson(res, 401, { ok: false, error: 'Phiên đăng nhập hết hạn' }); return; }
      try {
        const body = await readJsonBody(req);
        if (body.save && typeof body.save === 'object') {
          acc.save = body.save;
          acc.updatedAt = Date.now();
          if (body.displayName) acc.displayName = String(body.displayName).trim().slice(0, 24);
          auth.flushAccounts();
        }
        sendJson(res, 200, { ok: true, user: auth.sanitizePublicUser(acc), save: acc.save });
      } catch (e) {
        sendJson(res, 400, { ok: false, error: e.message || 'Lỗi lưu Cloud' });
      }
      return;
    }

    if (reqPath === '/api/auth/pvp-win' && req.method === 'POST') {
      const acc = getAuthAccount();
      if (!acc) { sendJson(res, 401, { ok: false, error: 'Chưa đăng nhập' }); return; }
      try {
        const body = await readJsonBody(req);
        acc.pvpMatches = Number(acc.pvpMatches || 0) + 1;
        if (body.won) acc.pvpWins = Number(acc.pvpWins || 0) + 1;
        acc.updatedAt = Date.now();
        auth.flushAccounts();
        sendJson(res, 200, { ok: true, user: auth.sanitizePublicUser(acc) });
      } catch (_) {
        sendJson(res, 400, { ok: false });
      }
      return;
    }

    if (reqPath === '/api/auth/leaderboard' && req.method === 'GET') {
      const accounts = auth.loadAccounts();
      const list = Object.values(accounts)
        .map((acc) => auth.sanitizePublicUser(acc))
        .sort((a, b) => (b.pvpWins * 1000 + b.completedCount * 50 + b.currentStage * 20) - (a.pvpWins * 1000 + a.completedCount * 50 + a.currentStage * 20))
        .slice(0, 20);
      sendJson(res, 200, { ok: true, leaderboard: list });
      return;
    }

    const cleanRel = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');
    const resolvedRoot = path.resolve(rootDir);
    const filePath = path.resolve(resolvedRoot, cleanRel);
    if (!filePath.startsWith(resolvedRoot)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (reqPath === '/favicon.ico') {
          res.writeHead(204, { 'Cache-Control': 'public, max-age=3600' });
          res.end();
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(data);
    });
  });

  server.on('connection', (socket) => {
    try {
      if (typeof socket.setNoDelay === 'function') socket.setNoDelay(true);
      if (typeof socket.setKeepAlive === 'function') socket.setKeepAlive(true, 15000);
    } catch (_) {}
  });

  server.on('upgrade', (req, socket) => {
    const upgradeHeader = (req.headers.upgrade || '').toLowerCase();
    const wsKey = req.headers['sec-websocket-key'];
    const reqPath = (req.url || '').split('?')[0];
    if (upgradeHeader !== 'websocket' || !wsKey || (reqPath !== '/ws' && reqPath !== '/')) {
      socket.destroy();
      return;
    }

    try {
      if (typeof socket.setNoDelay === 'function') socket.setNoDelay(true);
      if (typeof socket.setKeepAlive === 'function') socket.setKeepAlive(true, 15000);
    } catch (_) {}

    const acceptKey = crypto
      .createHash('sha1')
      .update(wsKey + WS_GUID)
      .digest('base64');

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '',
      ''
    ].join('\r\n');

    socket.write(headers);

    const client = {
      id: nextClientId++,
      sessionToken: crypto.randomBytes(12).toString('hex'),
      socket,
      name: 'Võ Sĩ',
      charId: 'nghi',
      skinId: 'default',
      allyId: 'auto',
      roomCode: null,
      slot: 0,
      ready: false,
      isSearching: false,
      rematchReady: false,
      lastPongAt: Date.now(),
      missedPongs: 0,
      recvBuf: Buffer.alloc(0)
    };
    clients.set(client.id, client);

    sendWs(client, {
      type: 'welcome',
      clientId: client.id,
      sessionToken: client.sessionToken,
      rooms: getPublicRoomsList(),
      players: getOnlinePlayersList()
    });
    broadcastOnlinePlayers();

    socket.on('data', (chunk) => {
      client.lastPongAt = Date.now();
      client.missedPongs = 0;
      if (client.recvBuf.length + chunk.length > MAX_WS_RECV_BUF_BYTES) {
        try { socket.destroy(); } catch (_) {}
        return;
      }
      client.recvBuf = Buffer.concat([client.recvBuf, chunk]);
      const parsed = decodeWsFrames(client.recvBuf, MAX_WS_PAYLOAD_BYTES);
      if (parsed.error === 'PAYLOAD_TOO_LARGE') {
        try { socket.destroy(); } catch (_) {}
        return;
      }
      client.recvBuf = parsed.remaining;

      const textQueue = [];
      for (const f of parsed.frames) {
        if (f.opcode === 0x8) {
          socket.end(encodeWsFrame(Buffer.alloc(0), 0x8));
          socket.destroy();
          return;
        }
        if (f.opcode === 0x9) {
          socket.write(encodeWsFrame(f.payload, 0xA));
          continue;
        }
        if (f.opcode === 0xA) {
          continue;
        }
        if (f.opcode === 0x1 || f.opcode === 0x0) {
          textQueue.push(f.payload.toString('utf8'));
        }
      }

      if (textQueue.length === 1) {
        handleMessage(client, textQueue[0]);
      } else if (textQueue.length > 1) {
        let lastPlayerStateIdx = -1;
        let lastCoopEnemiesIdx = -1;
        const parsedMsgs = textQueue.map((raw, idx) => {
          try {
            const msg = JSON.parse(raw);
            if (msg && msg.type === 'player_state') lastPlayerStateIdx = idx;
            else if (msg && msg.type === 'coop_enemies_sync') lastCoopEnemiesIdx = idx;
            return { raw, type: msg && msg.type };
          } catch (_) {
            return { raw, type: null };
          }
        });
        for (let i = 0; i < parsedMsgs.length; i++) {
          const item = parsedMsgs[i];
          if (item.type === 'player_state' && i !== lastPlayerStateIdx) continue;
          if (item.type === 'coop_enemies_sync' && i !== lastCoopEnemiesIdx) continue;
          handleMessage(client, item.raw);
        }
      }
    });

    const cleanup = () => {
      if (!clients.has(client.id)) return;
      clients.delete(client.id);
      if (client.roomCode && client.sessionToken) {
        disconnectedSessions.set(client.sessionToken, {
          roomCode: client.roomCode,
          slot: client.slot,
          name: client.name,
          charId: client.charId,
          skinId: client.skinId,
          allyId: client.allyId,
          expiresAt: Date.now() + 25000
        });
      }
      leaveCurrentRoom(client, 'disconnect');
      broadcastOnlinePlayers();
    };

    socket.on('end', () => {
      cleanup();
      try { socket.destroy(); } catch (_) {}
    });
    socket.on('close', cleanup);
    socket.on('error', cleanup);
  });

  // Giữ kết nối WebSocket qua proxy cloud & dọn kết nối chết không phản hồi pong (chống phòng ma 2/2)
  const hbIntervalMs = Number(options.heartbeatIntervalMs) || 25000;
  const maxMissedPongs = Number(options.maxMissedPongs) || 2;
  const heartbeat = setInterval(() => {
    const now = Date.now();
    for (const [tok, sess] of disconnectedSessions.entries()) {
      if (!sess || sess.expiresAt <= now) disconnectedSessions.delete(tok);
    }
    for (const c of Array.from(clients.values())) {
      if (!c || !c.socket || c.socket.destroyed) continue;
      if ((c.missedPongs || 0) >= maxMissedPongs) {
        clients.delete(c.id);
        leaveCurrentRoom(c, 'timeout');
        broadcastOnlinePlayers();
        try { c.socket.destroy(); } catch (_) {}
        continue;
      }
      c.missedPongs = (c.missedPongs || 0) + 1;
      try { c.socket.write(encodeWsFrame(Buffer.alloc(0), 0x9)); } catch (_) {}
    }
  }, hbIntervalMs);
  if (typeof heartbeat.unref === 'function') heartbeat.unref();
  server.on('close', () => clearInterval(heartbeat));

  return { server, rooms, clients, encodeWsFrame, decodeWsFrames };
}

let defaultInstance = null;
if (require.main === module) {
  defaultInstance = createOnlineServer(__dirname);
  const onListening = () => {
    const addr = defaultInstance.server.address();
    const bindLabel = (addr && typeof addr === 'object') ? `${addr.address}:${addr.port}` : `${HOST}:${PORT}`;
    console.log(`VOVINAM Online Server running at http://localhost:${PORT}/ (bind: ${bindLabel}, WS: ws://localhost:${PORT}/ws)`);
  };
  // Omitting host enables dual-stack (IPv6 [::1] + IPv4 127.0.0.1 / 0.0.0.0) so tools resolving localhost to ::1 (e.g. cloudflared on Windows) connect reliably.
  if (EXPLICIT_HOST) {
    defaultInstance.server.listen(PORT, EXPLICIT_HOST, onListening);
  } else {
    defaultInstance.server.listen(PORT, onListening);
  }
}

module.exports = {
  createOnlineServer,
  encodeWsFrame,
  decodeWsFrames,
  get server() {
    if (!defaultInstance) defaultInstance = createOnlineServer(__dirname);
    return defaultInstance.server;
  }
};
