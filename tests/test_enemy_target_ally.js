/**
 * tests/test_enemy_target_ally.js
 * Kiểm tra AI kẻ địch lựa chọn mục tiêu gần hơn (Player vs Ally)
 * và gây sát thương chính xác lên Đồng Minh hỗ trợ.
 */

const assert = require('assert');

// Mock browser
global.window = global;
global.document = {
  getElementById: () => null,
  createElement: () => ({
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {}
  }),
  body: { appendChild: () => {} }
};

// Mock audio & effect
window.audioManager = {
  playPunchHit: () => {},
  playHeavyHit: () => {},
  playClick: () => {},
  playWhoosh: () => {},
  playWarning: () => {}
};
window.effectManager = {
  addFloatingText: () => {},
  createHitSparks: () => {},
  triggerFlash: () => {},
  createShockRing: () => {}
};

// Load combat & allySystem & baseEnemy
require('../js/combat/combat.js');
require('../js/entities/allySystem.js');
require('../js/entities/enemy/baseEnemy.js');

console.log('=== BẮT ĐẦU TEST AI QUÁI LỰA CHỌN MỤC TIÊU GẦN HƠN (ALLY VS PLAYER) ===\n');

// TEST 1: KIỂM TRA ALIAS window.allySystem VÀ window.allyManager
{
  assert.strictEqual(window.allySystem, window.allyManager, 'window.allySystem phải trỏ tới allyManager');
  console.log('✓ TEST 1: window.allySystem đồng bộ chính xác với window.allyManager');
}

// TEST 2: ĐỒNG MINH Ở GẦN HƠN -> QUÁI ƯU TIÊN ĐÁNH ĐỒNG MINH
{
  const enemy = new window.BaseEnemy(500, 560);
  enemy.attackCooldown = 0;

  // Player ở xa (x = 750, khoảng cách = 250px)
  const player = {
    x: 750,
    y: 560,
    z: 0,
    hp: 1000,
    isDead: false,
    state: 'idle',
    takeDamage: () => {}
  };
  window.game = { player, requestAttackToken: () => true };

  // Triệu hồi Đồng Minh Bích Lâm ở gần quái (x = 560, khoảng cách = 60px)
  window.allyManager.activeAlly = new window.SummonedAlly('bichlam', 560, 560);
  const ally = window.allyManager.activeAlly;

  // Cập nhật AI quái
  enemy.updateAI(0.016, player);

  assert.strictEqual(enemy.targetAlly, true, 'Quái phải nhắm vào đồng minh vì đồng minh ở gần hơn (60px vs 250px)');
  assert.strictEqual(enemy.currentTarget, ally, 'currentTarget của quái phải là ally');
  assert.strictEqual(enemy.facing, 1, 'Quái phải quay mặt sang phải về phía đồng minh (x=560 > 500)');
  console.log('✓ TEST 2: Đồng minh ở gần hơn (60px vs 250px) -> Quái lập tức nhắm và quay mặt đánh đồng minh');
}

// TEST 3: PLAYER TIẾN LẠI GẦN HƠN -> QUÁI ĐỔI MỤC TIÊU SANG PLAYER
{
  const enemy = new window.BaseEnemy(500, 560);
  enemy.attackCooldown = 0;

  // Player áp sát (x = 540, khoảng cách = 40px)
  const player = {
    x: 540,
    y: 560,
    z: 0,
    hp: 1000,
    isDead: false,
    state: 'idle',
    takeDamage: () => {}
  };
  window.game = { player, requestAttackToken: () => true };

  // Đồng minh đang đứng xa hơn (x = 700, khoảng cách = 200px)
  window.allyManager.activeAlly = new window.SummonedAlly('bichlam', 700, 560);

  enemy.updateAI(0.016, player);

  assert.strictEqual(enemy.targetAlly, false, 'Quái phải nhắm vào player vì player ở gần hơn (40px vs 200px)');
  assert.strictEqual(enemy.currentTarget, player, 'currentTarget của quái phải là player');
  console.log('✓ TEST 3: Player tiến lại gần hơn (40px vs 200px) -> Quái chuyển mục tiêu sang đánh Player');
}

// TEST 4: TƯỚNG ĐỠ ĐÒN (ĐÌNH AN / HOÀNG ANH) KHIÊU KHÍCH THU HÚT QUÁI
{
  const enemy = new window.BaseEnemy(500, 560);
  enemy.attackCooldown = 0;

  // Player ở cự ly 100px (x = 600)
  const player = { x: 600, y: 560, z: 0, hp: 1000, isDead: false, state: 'idle' };
  window.game = { player, requestAttackToken: () => true };

  // Đình An (Tanker) ở cự ly 120px (x = 620)
  window.allyManager.activeAlly = new window.SummonedAlly('dinhan', 620, 560);

  enemy.updateAI(0.016, player);

  // Nhờ tauntFactor = 1.35, 120px < 100px * 1.35 = 135px -> Quái bị khiêu khích nhắm Đình An
  assert.strictEqual(enemy.targetAlly, true, 'Quái phải bị khiêu khích bởi tướng Đỡ Đòn Đình An');
  console.log('✓ TEST 4: Tướng Đỡ Đòn Đình An khiêu khích thu hút quái chuẩn xác');
}

// TEST 5: ĐÒN ĐÁNH CỦA QUÁI GÂY SÁT THƯƠNG TRỰC TIẾP LÊN ĐỒNG MINH
{
  const enemy = new window.BaseEnemy(500, 560);
  enemy.facing = 1;

  const player = { x: 900, y: 560, z: 0, hp: 1000, isDead: false, state: 'idle', type: 'player' };
  window.game = { player };

  const ally = new window.SummonedAlly('bichlam', 550, 560);
  window.allyManager.activeAlly = ally;

  const initialAllyHp = ally.hp;

  // Quái tung đòn đánh vào ally
  enemy.currentTarget = ally;
  enemy.targetAlly = true;
  enemy.checkAttackPlayer(player);

  assert.ok(ally.hp < initialAllyHp, `Máu đồng minh phải bị trừ (Hiện tại: ${ally.hp} / Ban đầu: ${initialAllyHp})`);
  console.log(`✓ TEST 5: Đòn đánh của quái trúng đồng minh -> Máu đồng minh giảm: ${initialAllyHp} -> ${ally.hp} HP`);
}

// TEST 6: ĐỒNG MINH CHẾT -> QUÁI TỰ ĐỘNG CHUYỂN VỀ ĐÁNH PLAYER
{
  const enemy = new window.BaseEnemy(500, 560);
  enemy.targetAlly = true;

  const player = { x: 600, y: 560, z: 0, hp: 1000, isDead: false, state: 'idle', type: 'player' };
  window.game = { player };

  // Đồng minh đã chết
  window.allyManager.activeAlly.hp = 0;
  window.allyManager.activeAlly.isDead = true;

  enemy.updateAI(0.016, player);

  assert.strictEqual(enemy.targetAlly, false, 'Khi đồng minh chết, quái phải chuyển về đánh player');
  assert.strictEqual(enemy.currentTarget, player, 'Mục tiêu phải là player');
  console.log('✓ TEST 6: Khi đồng minh gục ngã, quái lập tức chuyển mục tiêu về Player');
}

console.log('\n==========================================');
console.log('TẤT CẢ 6 BỘ TEST AI LỰA CHỌN MỤC TIÊU PASS 100%!');
console.log('==========================================');

