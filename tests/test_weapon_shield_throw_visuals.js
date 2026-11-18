/**
 * Regression test: Held Riot Shield (KHIÊN), 3-phase wp_throw choreography,
 * upgraded in-hand / ground / flight weapon rendering, and HUD SVG card.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST: KHIÊN CẦM TAY, ANIMATION NÉM [E] & TẠO HÌNH VŨ KHÍ ===');

// Minimal browser environment mocks
global.window = global;
global.performance = { now: () => 1234 };
global.document = {
  getElementById: () => null,
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    className: '',
    children: [],
    _innerHTML: '',
    get innerHTML() { return this._innerHTML; },
    set innerHTML(v) { this._innerHTML = String(v); if (v === '') this.children = []; },
    style: {},
    classList: {
      _set: new Set(),
      add(...cls) { cls.forEach((c) => this._set.add(c)); },
      remove(...cls) { cls.forEach((c) => this._set.delete(c)); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._set.has(c)) this._set.delete(c);
          else this._set.add(c);
        } else if (force) this._set.add(c);
        else this._set.delete(c);
      },
      contains(c) { return this._set.has(c); }
    },
    appendChild(child) { this.children.push(child); return child; }
  })
};

global.ATTACK_STATES = new Set(['punch_straight', 'punch_hook']);
global.POSE_ALIAS = {};
global.BaseEnemy = class { constructor() {} };
window.ATTACK_STATES = global.ATTACK_STATES;
window.POSE_ALIAS = global.POSE_ALIAS;
window.input = { isKeyJustPressed: () => false, isJustPressed: () => false, isActionJustPressed: () => false };
window.audioManager = {
  playWhoosh() {}, playSwing() {}, playBlock() {}, playHeavyHit() {},
  playSlash() {}, playClick() {}, playHurt() {}
};
const floatTexts = [];
let sparkCalls = 0;
let shockRings = 0;
window.effectManager = {
  addFloatingText(txt) { floatTexts.push(txt); },
  createHitSparks() { sparkCalls++; },
  createDust() {},
  createShockRing() { shockRings++; },
  triggerScreenShake() {}
};

// Track hits through combatSystem mock cleanly
const recordedHits = [];
window.combatSystem = {
  checkAttackHit(attacker, enemy, hitData) {
    recordedHits.push({ attacker, enemy, hitData });
    enemy.hp = Math.max(0, enemy.hp - hitData.damage);
    return true;
  },
  registerHit() {},
  applyBleed() {}
};

// Load character modules + skeletal renderer + weapon system
require('../js/entities/characters/bootstrap.js');
require('../js/entities/characters/huavudai.js');
require('../js/entities/characters/bichlam.js');
require('../js/entities/animation/animationData.js');
require('../js/entities/animation/animationBase.js');
require('../js/entities/animation/animationPose.js');
require('../js/entities/animation/animationRenderBase.js');
require('../js/entities/animation/animationWeapon.js');
require('../js/entities/animation/animationBody.js');
require('../js/entities/animation.js');
require('../js/combat/weapons.js');
require('../js/ui/ui.js');
if (window.uiManager) {
  window.uiManager.playerHpFill = global.document.createElement('div');
  window.uiManager.playerHpText = global.document.createElement('div');
  window.uiManager.bossHpFill = global.document.createElement('div');
  window.uiManager.bossHpText = global.document.createElement('div');
  window.uiManager.bossHud = global.document.createElement('div');
  window.uiManager.setBossPhase = () => {};
}

// Base classes needed to load PlayerDamage directly
window.PlayerBase = class {
  constructor() {
    this.id = 'player';
    this.type = 'player';
    this.x = 200; this.y = 580; this.z = 0; this.facing = 1;
    this.hp = 500; this.maxHp = 500;
    this.guardGauge = 60; this.maxGuardGauge = 100;
    this.guardBreakTimer = 0;
    this.invincibleTimer = 0;
    this.attackClock = 10;
    this.state = 'guard';
    this.weapon = null;
    this.isDead = false;
    this.comboStep = 0;
  }
  setState(s, d = 0) { this.state = s; this.stateTimer = 0; this.stateDuration = d; }
  die() { this.isDead = true; }
};
require('../js/entities/player/playerDamage.js');

const { weaponSystem, WEAPON_DEFS, PLAYER_ATTACKS } = window;

// ---------------------------------------------------------------------------
// 1. WEAPON_DEFS.shield is pickable, holdable, has [J]/[K] attacks & SVG icon
// ---------------------------------------------------------------------------
assert.strictEqual(WEAPON_DEFS.shield.pickable, true, 'KHIÊN phải nhặt được bằng [E]');
assert.strictEqual(WEAPON_DEFS.shield.durability, 10, 'KHIÊN có độ bền 10');
assert.strictEqual(WEAPON_DEFS.shield.styleWeapon, 'riot_shield', 'KHIÊN dùng styleWeapon = riot_shield');
assert.deepStrictEqual(WEAPON_DEFS.shield.light, ['shield_strike']);
assert.deepStrictEqual(WEAPON_DEFS.shield.heavy, ['shield_bash']);
assert.ok(PLAYER_ATTACKS.shield_strike && PLAYER_ATTACKS.shield_bash && PLAYER_ATTACKS.weapon_throw, 'PLAYER_ATTACKS đầy đủ shield & weapon_throw');

for (const wt of ['baton', 'blade', 'shield']) {
  const svg = weaponSystem.getIconSvg(wt);
  assert.ok(typeof svg === 'string' && svg.includes('<svg') && svg.includes('</svg>'), `getIconSvg(${wt}) trả về SVG hợp lệ`);
}

// Shield drop & pickup & light/heavy strike flow
weaponSystem.reset();
const p = {
  id: 'player_huavudai', type: 'player', characterId: 'huavudai', styleType: 'npc_huavudai',
  x: 200, y: 580, z: 0, vx: 0, vy: 0, facing: 1, hp: 500, maxHp: 500,
  isDead: false, state: 'idle', stateTimer: 0, stateDuration: 0, animTime: 0, attackClock: 10,
  weapon: null, heldWeapon: null, stance: null, atk: null,
  setState(s, d = 0) { this.state = s; this.stateTimer = 0; this.stateDuration = d; },
  spendStamina() {}
};
weaponSystem.spawnDrop('shield', 210, 580, 1, 10);
assert.strictEqual(weaponSystem.drops.length, 1);
assert.strictEqual(weaponSystem.drops[0].pickable, true, 'Khiên rơi xuống sân có pickable = true');
weaponSystem.drops[0].landed = true;
window.input = { isKeyJustPressed: (k) => k === 'KeyE', isJustPressed: (k) => k === 'KeyE', isActionJustPressed: () => false };
weaponSystem.update(0.016, p, []);
assert.ok(p.weapon && p.weapon.type === 'shield' && p.weapon.dur === 10, 'Nhấn [E] gần Khiên nhặt đúng Khiên với độ bền 10');
assert.strictEqual(p.heldWeapon, 'shield');
assert.strictEqual(p.stance, 'shield');

// Heavy Shield Bash attack test
const dummy = { id: 'e1', x: 255, y: 580, hp: 300, isDead: false, takeDamage(d) { this.hp -= d; } };
const atkOk = weaponSystem.startPlayerAttack(p, 'heavy');
assert.strictEqual(atkOk, true, 'Đánh nặng [K] bằng Khiên phải kích hoạt thành công');
assert.strictEqual(p.state, 'wp_shield_bash');
p.stateTimer = p.atk.startup + 0.02;
weaponSystem.updatePlayerAttack(p, 0.016, [dummy]);
assert.ok(dummy.hp < 300, 'Shield bash gây sát thương thực lên địch');
assert.strictEqual(p.weapon.dur, 9, 'Đánh trúng trừ 1 độ bền (10 -> 9)');

// ---------------------------------------------------------------------------
// 2. PlayerDamage: Guarding while holding Khiên cuts chip damage & restores gauge
// ---------------------------------------------------------------------------
const shielded = new window.PlayerDamage();
weaponSystem.setPlayerWeapon(shielded, 'shield', 10);
shielded.state = 'guard';
const hpStart = shielded.hp;
const gaugeStart = shielded.guardGauge;
floatTexts.length = 0;
sparkCalls = 0;
shielded.takeDamage(20, 80, false); // Simulated blocked heavy chip
assert.strictEqual(hpStart - shielded.hp, 5, 'Cầm Khiên khi thủ [U] chỉ chịu 25% sát thương chip (20 -> 5)');
assert.strictEqual(shielded.guardGauge, gaugeStart + 8, 'Cầm Khiên khi thủ hồi thêm +8 Guard Gauge');
assert.strictEqual(shielded.weapon.dur, 9, 'Đòn chip nặng (>=5) trừ 1 độ bền Khiên');
assert.ok(sparkCalls > 0 && floatTexts.some((t) => t.includes('ĐỠ KHIÊN')), 'Kích hoạt tia lửa và chữ ĐỠ KHIÊN');

// ---------------------------------------------------------------------------
// 3. Choreographed 3-phase throw: both PlayerUpdate-driven and standalone mock paths
// ---------------------------------------------------------------------------
weaponSystem.reset();
shockRings = 0;
const pRealThrow = new window.PlayerDamage();
pRealThrow.spendStamina = () => {};
pRealThrow.setState = function (s, d = 0) { this.state = s; this.stateTimer = 0; this.stateDuration = d; };
pRealThrow.atk = null;
pRealThrow.comboStep = 0;
pRealThrow.facing = 1;
pRealThrow.vx = 0;
weaponSystem.setPlayerWeapon(pRealThrow, 'blade', 7);

const targetBoss = { id: 'boss1', x: 310, y: 580, hp: 500, isBoss: true, isDead: false, takeDamage(d) { this.hp -= d; } };
const started = weaponSystem.throwWeapon(pRealThrow, [targetBoss]);
assert.strictEqual(started, true);
assert.strictEqual(pRealThrow.state, 'wp_throw', 'Vào đúng state wp_throw');
assert.strictEqual(pRealThrow.weapon.type, 'blade', 'Trong pha đầu, Mã Tấu vẫn cầm trên tay để vung!');
assert.strictEqual(weaponSystem.thrownWeapons.length, 0, 'Chưa đẻ projectile trước thời điểm vung tay');
assert.strictEqual(weaponSystem.throwArcs.length, 1, 'Tạo vòng tụ lực charge arc trong pha windup');

// Simulate 4 frames (~0.064s < 0.105s) calling BOTH player state update & weaponSystem update
for (let i = 0; i < 4; i++) {
  const dt = 0.016;
  pRealThrow.stateTimer += dt;
  weaponSystem.updatePlayerAttack(pRealThrow, dt, [targetBoss]);
  weaponSystem.update(dt, pRealThrow, [targetBoss]);
}
assert.ok(pRealThrow.weapon !== null && weaponSystem.thrownWeapons.length === 0, 'Tại t=0.064s vẫn đang co tay giữ vũ khí, không bị double-tick');

// Advance past release threshold (startup = 0.105s)
for (let i = 0; i < 4; i++) {
  const dt = 0.016;
  pRealThrow.stateTimer += dt;
  weaponSystem.updatePlayerAttack(pRealThrow, dt, [targetBoss]);
  weaponSystem.update(dt, pRealThrow, [targetBoss]);
}
assert.strictEqual(pRealThrow.weapon, null, 'Tại release (t >= 0.105s) giải phóng vũ khí khỏi tay');
assert.strictEqual(pRealThrow.state, 'wp_throw', 'Sau release vẫn giữ wp_throw để đi hết pha theo đà cánh tay!');
assert.ok(pRealThrow.atk !== null && pRealThrow.atk.state === 'wp_throw', 'Giữ player.atk cho AnimUtil.wpPhase tính pha theo đà');
assert.ok(shockRings >= 1, 'Kích hoạt vòng chấn động lúc phóng vũ khí');
assert.ok(weaponSystem.thrownWeapons.length === 1 || targetBoss.hp < 500, 'Vũ khí bay ra va chạm hoặc đang lao tới mục tiêu');

// Finish follow-through recovery (total = 0.415s)
for (let i = 0; i < 20; i++) {
  const dt = 0.016;
  pRealThrow.stateTimer += dt;
  weaponSystem.updatePlayerAttack(pRealThrow, dt, [targetBoss]);
  weaponSystem.update(dt, pRealThrow, [targetBoss]);
}
assert.strictEqual(pRealThrow.state, 'idle', 'Kết thúc toàn bộ chuỗi theo đà trở về idle');
assert.strictEqual(pRealThrow.atk, null);
assert.strictEqual(pRealThrow._pendingThrow, null);

// Interruption during windup cancels throw cleanly (no ghost projectile)
weaponSystem.reset();
weaponSystem.setPlayerWeapon(pRealThrow, 'baton', 5);
weaponSystem.throwWeapon(pRealThrow, []);
pRealThrow.setState('hurt', 0.24);
for (let i = 0; i < 10; i++) weaponSystem.update(0.016, pRealThrow, []);
assert.strictEqual(weaponSystem.thrownWeapons.length, 0, 'Bị đánh ngắt trong pha gồng ném không sinh projectile ma');

// ---------------------------------------------------------------------------
// 4. SkeletalRenderer & Canvas finite-gradient verification (all 3 weapons, frostBlade override & _solid silhouettes)
// ---------------------------------------------------------------------------
function makeStrictMockCtx() {
  const grad = { addColorStop() {} };
  const checkNums = (args, name) => {
    for (const v of args) {
      if (!Number.isFinite(v)) throw new TypeError(`Non-finite arg in ${name}: ${v}`);
    }
  };
  return {
    save() {}, restore() {}, translate() {}, scale() {}, rotate() {}, clip() {}, setLineDash() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, ellipse() {},
    rect() {}, roundRect() {}, fill() {}, stroke() {}, fillRect() {}, strokeRect() {},
    fillText() {}, measureText(s) { return { width: String(s).length * 6 }; },
    createLinearGradient(...a) { checkNums(a, 'createLinearGradient'); return grad; },
    createRadialGradient(...a) { checkNums(a, 'createRadialGradient'); return grad; }
  };
}

const renderer = new window.SkeletalRenderer();
const rCtx = makeStrictMockCtx();
const camera = { x: 0, y: 0 };

// Check Bich Lam (has frostBlade: true unarmed) picking up all 3 weapons
const bichLamMock = {
  id: 'player_bichlam', type: 'player', characterId: 'bichlam', styleType: 'npc_bichlam',
  x: 300, y: 580, z: 0, facing: 1, hp: 600, maxHp: 600,
  isDead: false, state: 'wp_throw', stateTimer: 0.06, stateDuration: 0.415, animTime: 0.06,
  atk: PLAYER_ATTACKS.weapon_throw, weapon: null, heldWeapon: null, stance: null
};

for (const wType of ['baton', 'blade', 'shield']) {
  weaponSystem.setPlayerWeapon(bichLamMock, wType, 6);
  const st = renderer.getStyle(bichLamMock);
  assert.strictEqual(st.frostBlade, false, `Bích Lâm cầm ${wType} phải tắt frostBlade để vẽ đúng vũ khí nhặt`);
  if (wType === 'shield') {
    assert.strictEqual(st.riotShield, true);
    assert.strictEqual(st.weapon, null);
  } else {
    assert.strictEqual(st.weapon, WEAPON_DEFS[wType].styleWeapon);
  }

  // Render across all 3 wp_throw phases + normal idle/guard
  for (const timer of [0.05, 0.14, 0.30]) {
    bichLamMock.state = 'wp_throw';
    bichLamMock.atk = PLAYER_ATTACKS.weapon_throw;
    bichLamMock.stateTimer = timer;
    renderer.render(rCtx, bichLamMock, camera);
  }
  // Ghost silhouette draw
  bichLamMock.ghostColor = 'rgba(56,189,248,0.4)';
  renderer.render(rCtx, bichLamMock, camera);
  bichLamMock.ghostColor = null;

  // Ground/flight shape + HUD draw
  weaponSystem.renderWeaponShape(rCtx, wType, false);
  weaponSystem.renderWeaponShape(rCtx, wType, true);
  weaponSystem.renderHud(rCtx, camera, bichLamMock);
}
weaponSystem.render(rCtx, camera);

// ---------------------------------------------------------------------------
// 5. DOM & index.html #hud-weapon-card check + UIManager.updateWeaponHUD
// ---------------------------------------------------------------------------
const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
for (const id of ['hud-weapon-card', 'hud-weapon-icon', 'hud-weapon-name', 'hud-weapon-badge', 'hud-weapon-dur-text', 'hud-weapon-segments', 'hud-weapon-guard-pill']) {
  assert.ok(htmlContent.includes(`id="${id}"`), `index.html phải chứa #${id}`);
}

// Simulate DOM elements for UIManager.prototype.updateWeaponHUD
const mockDom = {};
for (const id of ['hud-weapon-card', 'hud-weapon-icon', 'hud-weapon-name', 'hud-weapon-badge', 'hud-weapon-dur-text', 'hud-weapon-segments', 'hud-weapon-guard-pill']) {
  mockDom[id] = global.document.createElement('div');
  mockDom[id].id = id;
  if (id === 'hud-weapon-card') mockDom[id].classList.add('hidden');
}
global.document.getElementById = (id) => mockDom[id] || null;

const uiMgr = Object.create(window.UIManager.prototype);
// Unarmed -> hidden
uiMgr.updateWeaponHUD({ weapon: null, isDead: false });
assert.ok(mockDom['hud-weapon-card'].classList.contains('hidden'), 'Tay không phải ẩn #hud-weapon-card');

// Shield -> shield-theme, guard-pill visible, SVG icon, 10 pips
uiMgr.updateWeaponHUD({ weapon: { type: 'shield', dur: 10, max: 10 }, isDead: false });
assert.ok(!mockDom['hud-weapon-card'].classList.contains('hidden'), 'Cầm Khiên phải hiện #hud-weapon-card');
assert.ok(mockDom['hud-weapon-card'].classList.contains('shield-theme'), 'Cầm Khiên có class shield-theme');
assert.ok(!mockDom['hud-weapon-guard-pill'].classList.contains('hidden'), 'Cầm Khiên hiện nút gợi ý [U] Chắn Khiên');
assert.ok(mockDom['hud-weapon-icon'].innerHTML.includes('<svg'), 'HUD hiển thị icon SVG sắc nét');
assert.strictEqual(mockDom['hud-weapon-segments'].children.length, 10, 'HUD hiển thị đủ 10 vạch độ bền Khiên');
assert.strictEqual(mockDom['hud-weapon-name'].textContent, 'KHIÊN');

// Blade low durability -> blade-theme + danger-theme + guard-pill hidden
uiMgr.updateWeaponHUD({ weapon: { type: 'blade', dur: 2, max: 9 }, isDead: false });
assert.ok(mockDom['hud-weapon-card'].classList.contains('blade-theme'));
assert.ok(mockDom['hud-weapon-card'].classList.contains('danger-theme'));
assert.ok(mockDom['hud-weapon-guard-pill'].classList.contains('hidden'));
assert.strictEqual(mockDom['hud-weapon-segments'].children.length, 9);

console.log('✅ TẤT CẢ ASSERTIONS CHO KHIÊN, ANIMATION NÉM [E] & TẠO HÌNH VŨ KHÍ ĐỀU PASS!');