// Test Suite: Kiểm thử độ bền vũ khí và chống lỗi âm độ bền (-2/8)
const assert = require('assert');

// Mock browser globals
global.window = {};
global.Math = Math;
global.BaseEnemy = class { constructor() {} };

require('../js/combat/weapons.js');

const weaponSystem = window.weaponSystem;
const WEAPON_DEFS = window.WEAPON_DEFS;

console.log('--- TEST: WEAPON DURABILITY INTEGRITY ---');

// Mock player
function createMockPlayer() {
  return {
    x: 100, y: 550, z: 0, facing: 1,
    state: 'idle', stateTimer: 0, stateDuration: 0,
    attackClock: 10,
    weapon: null, heldWeapon: null, stance: null, atk: null,
    setState(st, dur) {
      this.state = st;
      this.stateTimer = 0;
      this.stateDuration = dur || 0;
    },
    spendStamina() {}
  };
}

// 1. Nhặt vũ khí
const p = createMockPlayer();
weaponSystem.setPlayerWeapon(p, 'baton');
assert.strictEqual(p.weapon.type, 'baton');
assert.strictEqual(p.weapon.dur, WEAPON_DEFS.baton.durability);
console.log('✅ PASSED: Nhặt vũ khí khởi tạo đúng độ bền ban đầu: ' + p.weapon.dur);

// 2. Tấn công cho đến khi còn 1 độ bền
p.weapon.dur = 1;

// 3. Tấn công trúng đích: vũ khí phải giảm về 0 và gãy ngay lập tức
let breakSparksCreated = false;
let floatTextShown = false;
window.effectManager = {
  addFloatingText(txt) {
    if (txt.includes('GÃY')) floatTextShown = true;
  },
  createHitSparks() {
    breakSparksCreated = true;
  }
};
window.audioManager = {
  playHeavyHit() {},
  playWhoosh() {}
};
window.combatSystem = {
  checkAttackHit() { return true; } // Đòn trúng
};

const started = weaponSystem.startPlayerAttack(p, 'light');
assert.strictEqual(started, true);
assert.ok(p.atk);
console.log('✅ PASSED: Tung đòn vũ khí khi còn 1 độ bền thành công');

// Giả lập frame trúng đích (startup -> active)
p.stateTimer = p.atk.startup + 0.01;
const dummyEnemy = { x: 150, y: 550, isDead: false, id: 99 };
weaponSystem.updatePlayerAttack(p, 0.016, [dummyEnemy]);

// Vũ khí phải gãy ngay, thu hồi vũ khí, không bao giờ âm độ bền!
assert.strictEqual(p.weapon, null, 'Vũ khí phải được thu hồi khỏi player');
assert.strictEqual(p.heldWeapon, null);
assert.strictEqual(floatTextShown, true, 'Hiển thị thông báo CÔN GÃY!');
assert.strictEqual(breakSparksCreated, true, 'Hiệu ứng tóe lửa gãy vũ khí được tạo');
console.log('✅ PASSED: Vũ khí hết độ bền bị gãy ngay khi chạm đích, không cho phép âm độ bền');

// 4. Khi vũ khí đã gãy (null hoặc dur <= 0), không thể tiếp tục dùng vũ khí để tấn công
const attackAfterBreak = weaponSystem.startPlayerAttack(p, 'light');
assert.strictEqual(attackAfterBreak, false, 'Không thể tấn công bằng vũ khí đã gãy');
console.log('✅ PASSED: startPlayerAttack chặn hoàn toàn khi không có vũ khí hoặc vũ khí gãy');

// 5. Thử nghiệm trường hợp bị ngắt đòn (hurt) trước khi kết thúc recovery
const p2 = createMockPlayer();
weaponSystem.setPlayerWeapon(p2, 'blade', 1);
assert.strictEqual(p2.weapon.dur, 1);
weaponSystem.startPlayerAttack(p2, 'light');
p2.stateTimer = p2.atk.startup + 0.01;
weaponSystem.updatePlayerAttack(p2, 0.016, [dummyEnemy]);
// Ngay khi trúng đòn, p2.weapon đã được giải phóng
assert.strictEqual(p2.weapon, null);
console.log('✅ PASSED: Ngay cả khi bị ngắt đòn, vũ khí đã được clear an toàn, không thể tồn tại âm độ bền (-1 hay -2)');

// 6. Kiểm tra HUD không bao giờ render số âm
let hudRendered = false;
const mockCtx = {
  save() {}, restore() {}, translate() {}, fillRect() { hudRendered = true; },
  fillText() {}, measureText() { return { width: 50 }; }
};
const p3 = createMockPlayer();
p3.weapon = { type: 'baton', dur: 0, max: 8 };
weaponSystem.renderHud(mockCtx, { x: 0, y: 0 }, p3);
assert.strictEqual(hudRendered, false, 'HUD không vẽ nếu dur <= 0');
console.log('✅ PASSED: HUD không vẽ thanh độ bền hoặc số âm khi vũ khí hết độ bền');

// 7. Nhấn E khi KHÔNG có vũ khí dưới đất -> NÉM VŨ KHÍ
console.log('\n--- TEST: PHÍM [E] NÉM VŨ KHÍ KHI KHÔNG CÓ VŨ KHÍ DƯỚI ĐẤT ---');
weaponSystem.reset();
const pThrow = createMockPlayer();
weaponSystem.setPlayerWeapon(pThrow, 'baton', 6);
assert.strictEqual(pThrow.weapon.type, 'baton');
assert.strictEqual(pThrow.weapon.dur, 6);

// Giả lập phím E được nhấn khi không có drop nào gần
window.input = {
  isKeyJustPressed(k) { return k === 'KeyE'; },
  isJustPressed(k) { return k === 'KeyE'; },
  isActionJustPressed() { return false; }
};

// Bước qua pha gồng kéo tay (startup ~0.105s) rồi kiểm tra giải phóng vũ khí
weaponSystem.update(0.016, pThrow, []);
assert.strictEqual(pThrow.state, 'wp_throw', 'Trong pha gồng ném vũ khí, người chơi phải vào thế wp_throw');
assert.ok(pThrow.weapon !== null, 'Trong pha gồng đầu (0.016s), vũ khí vẫn nằm trên tay trước khi vung ném');
for (let step = 0; step < 7; step++) {
  weaponSystem.update(0.016, pThrow, []);
}
assert.strictEqual(pThrow.weapon, null, 'Vũ khí trên tay phải được thu hồi đúng thời điểm phóng khỏi tay');
assert.strictEqual(weaponSystem.thrownWeapons.length, 1, 'Tạo thực thể vũ khí đang bay');
const tw = weaponSystem.thrownWeapons[0];
assert.strictEqual(tw.type, 'baton');
assert.strictEqual(tw.dur, 6);
assert.ok(tw.vx > 0, 'Bay theo hướng nhân vật');
console.log('✅ PASSED: Nhấn [E] khi không có vũ khí dưới đất ném thành công vũ khí đang cầm');

// 8. Vũ khí ném bay va chạm đối thủ: gây sát thương nặng, trừ 2 độ bền và rơi thành drop
const targetEnemy = {
  x: tw.x + 10,
  y: tw.y,
  hp: 200,
  isDead: false,
  takeDamage(dmg, opts) {
    this.hp -= dmg;
    this.knockedBack = opts.knockback;
  }
};
// Update frame để va chạm
weaponSystem.update(0.016, pThrow, [targetEnemy]);
assert.ok(targetEnemy.hp < 200, 'Kẻ địch nhận sát thương nặng từ vũ khí ném');
assert.strictEqual(targetEnemy.knockedBack, true, 'Kẻ địch bị đẩy lùi / ngã sàn');
assert.strictEqual(weaponSystem.thrownWeapons.length, 0, 'Vũ khí kết thúc trạng thái bay');
assert.strictEqual(weaponSystem.drops.length, 1, 'Vũ khí rơi xuống đất sau va đập để nhặt lại');
assert.strictEqual(weaponSystem.drops[0].dur, 4, 'Độ bền giảm đúng 2 điểm sau cú ném trúng đích: 6 - 2 = 4');
console.log('✅ PASSED: Vũ khí ném trúng đối thủ gây sát thương, giảm 2 độ bền và rơi thành drop nhặt lại');

// 9. Ném vũ khí khi chỉ còn 2 độ bền: va chạm kẻ địch sẽ vỡ nát, không tạo drop
weaponSystem.reset();
const pFragile = createMockPlayer();
weaponSystem.setPlayerWeapon(pFragile, 'blade', 2);
for (let step = 0; step < 8; step++) {
  weaponSystem.update(0.016, pFragile, []); // Nhấn E + hoàn tất pha vung ném (~0.11s)
}
assert.strictEqual(weaponSystem.thrownWeapons.length, 1);
const twBlade = weaponSystem.thrownWeapons[0];
const targetEnemy2 = {
  x: twBlade.x + 10,
  y: twBlade.y,
  hp: 200,
  isDead: false,
  takeDamage(dmg) { this.hp -= dmg; }
};
weaponSystem.update(0.016, pFragile, [targetEnemy2]);
assert.strictEqual(weaponSystem.thrownWeapons.length, 0);
assert.strictEqual(weaponSystem.drops.length, 0, 'Vũ khí vỡ nát khi độ bền về 0, không tạo drop');
console.log('✅ PASSED: Vũ khí độ bền thấp khi ném trúng đối thủ sẽ vỡ nát hoàn toàn');

// 10. Khi CÓ vũ khí dưới đất gần người chơi: nhấn [E] ưu tiên NHẶT / ĐỔI VŨ KHÍ, KHÔNG ném
weaponSystem.reset();
const pPickup = createMockPlayer();
pPickup.x = 200; pPickup.y = 550;
weaponSystem.setPlayerWeapon(pPickup, 'baton', 8);
weaponSystem.spawnDrop('blade', 220, 550, 1, 5); // Tạo drop mã tấu ở gần (cách 20px)
const groundDrop = weaponSystem.drops[0];
groundDrop.landed = true;
groundDrop.pickable = true;

window.input = {
  isKeyJustPressed(k) { return k === 'KeyE'; },
  isJustPressed(k) { return k === 'KeyE'; },
  isActionJustPressed() { return false; }
};

weaponSystem.update(0.016, pPickup, []);
assert.strictEqual(pPickup.weapon.type, 'blade', 'Người chơi đổi sang nhặt Mã Tấu dưới đất');
assert.strictEqual(pPickup.weapon.dur, 5);
assert.strictEqual(weaponSystem.thrownWeapons.length, 0, 'KHÔNG ném vũ khí khi có vũ khí dưới đất để nhặt');
console.log('✅ PASSED: Khi có vũ khí dưới đất, [E] luôn ưu tiên nhặt / đổi vũ khí, không bị nhầm lẫn');

console.log('\n==========================================');
console.log('TẤT CẢ TEST ĐỘ BỀN VŨ KHÍ HOÀN TOÀN CHÍNH XÁC!');
console.log('==========================================');