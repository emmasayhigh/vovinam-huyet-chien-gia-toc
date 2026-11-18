/**
 * TEST SUITE: 3-TIER ARMOR AURAS (HÀO QUANG GIÁP 3 TẦNG: ĐỎ - VÀNG - TRẮNG)
 * 1. Hào quang Đỏ (Red Hyper Armor): Không choáng, không ngã, có thể bị phá vỡ sau N đòn/ngưỡng HP
 * 2. Hào quang Vàng (Gold Super Armor): Tương tự đỏ nhưng KHÔNG THỂ BỊ PHÁ VỠ (giảm 35% DMG)
 * 3. Hào quang Trắng (White Invulnerability): BẤT TỬ HOÀN TOÀN (0 DMG), miễn nhiễm toàn bộ khống chế
 * 4. U+J & U+K: Đỡ và phản đòn MỌI ĐÒN ĐÁNH, lập tức phá vỡ Bá Thể Đỏ của đối phương!
 */

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
};

global.window = global;
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Mock effectManager
global.effectManager = {
  addFloatingText: () => {},
  createHitSparks: () => {},
  createShockRing: () => {},
  createGroundCrack: () => {},
  createEnergySparks: () => {},
  triggerFinisherMoment: () => {},
  triggerScreenShake: () => {},
  triggerFlash: () => {}
};
global.window.effectManager = global.effectManager;

// Mock audioManager
global.audioManager = {
  playHurt: () => {},
  playBlock: () => {},
  playHeavyHit: () => {},
  playKick: () => {},
  playDodge: () => {},
  playUltimateBurst: () => {},
  playWarning: () => {},
  playClick: () => {},
  playVovinamKiai: () => {}
};
global.window.audioManager = global.audioManager;

// Mock uiManager
global.uiManager = {
  updatePlayerHp: () => {},
  updatePlayerEnergy: () => {},
  updateCombo: () => {},
  updateBossHp: () => {},
  updateBossPoise: () => {},
  showAlertBanner: () => {},
  setBossPhase: () => {}
};
global.window.uiManager = global.uiManager;

// Load entities & combat
require('../js/entities/player/playerBase.js');
require('../js/entities/player/playerDamage.js');
require('../js/entities/enemy/baseEnemy.js');
require('../js/combat/combat.js');

console.log('--- TEST SUITE: 3-TIER ARMOR AURAS & FULL COUNTER ---\n');

// ============================================================================
// 1. KIỂM THỬ HÀO QUANG TRẮNG (WHITE AURA - BẤT TỬ HOÀN TOÀN 0 DMG)
// ============================================================================
console.log('[TEST 1: Hào quang Trắng (White Invulnerability)]');
const playerWhite = new window.PlayerDamage(200, 560);
playerWhite.reset(200, 560);
playerWhite.setAuraArmor('white', 3.0);

assert(playerWhite.hasAuraArmor('white') === true, 'Player kích hoạt thành công Hào quang Trắng');
assert(playerWhite.auraArmorTimer === 3.0, 'Thời gian duy trì Hào quang Trắng khởi tạo 3.0s');

const initialHp = playerWhite.hp;
// Nhận đòn cực nặng 150 damage có quật ngã
playerWhite.takeDamage(150, 200, true);

assert(playerWhite.hp === initialHp, `Hào quang Trắng triệt tiêu 100% sát thương (0 DMG): HP ${playerWhite.hp}/${initialHp}`);
assert(playerWhite.state === 'idle', 'Hào quang Trắng miễn nhiễm toàn bộ khống chế, không bị ngã hay khựng');

// Thử nghiệm trên Enemy có Hào quang Trắng
const enemyWhite = new window.BaseEnemy(300, 560, 'thug');
enemyWhite.setAuraArmor('white', 2.0);
const enemyInitialHp = enemyWhite.hp;
enemyWhite.takeDamage(80, 150, true);
assert(enemyWhite.hp === enemyInitialHp, 'Enemy có Hào quang Trắng nhận 0 damage');
assert(enemyWhite.state === 'idle', 'Enemy có Hào quang Trắng không bị knockdown');

// ============================================================================
// 2. KIỂM THỬ HÀO QUANG VÀNG (GOLD AURA - KIM CANG BẤT KHẢ PHÁ)
// ============================================================================
console.log('\n[TEST 2: Hào quang Vàng (Gold Super Armor - Unbreakable)]');
const playerGold = new window.PlayerDamage(200, 560);
playerGold.reset(200, 560);
playerGold.setAuraArmor('gold', 4.0);

assert(playerGold.hasAuraArmor('gold') === true, 'Player kích hoạt thành công Hào quang Vàng');

// Đang tung đòn đấm punch_1
playerGold.state = 'punch_1';
// Nhận đòn 100 damage (được giảm 35% DMG -> nhận 65 DMG)
// Lưu ý: Player có hệ số độ khó 1.2x (100 * 1.2 = 120 -> giảm 35% = 78 DMG)
const goldInitialHp = playerGold.hp;
playerGold.takeDamage(100, 250, true);

assert(playerGold.hp < goldInitialHp, 'Hào quang Vàng vẫn nhận sát thương');
assert(playerGold.state === 'punch_1', 'Hào quang Vàng KHÔNG BỊ NGẮT CHIÊU, giữ nguyên punch_1 không chuyển thành hurt/knockdown');

// Thử thách nhận 10 đòn liên tiếp -> Hào quang Vàng KHÔNG THỂ BỊ PHÁ
for (let i = 0; i < 10; i++) {
  playerGold.invincibleTimer = 0;
  playerGold.takeDamage(10, 100, true);
}
assert(playerGold.hasAuraArmor('gold') === true, 'Hào quang Vàng BẤT KHẢ PHÁ sau 10 đòn đánh liên tiếp');
assert(playerGold.state === 'punch_1', 'Vẫn tiếp tục giữ nguyên thế đòn');

// ============================================================================
// 3. KIỂM THỬ HÀO QUANG ĐỎ (RED AURA - BÁ THỂ CÓ THỂ BỊ PHÁ)
// ============================================================================
console.log('\n[TEST 3: Hào quang Đỏ (Red Hyper Armor - Breakable)]');
const playerRed = new window.PlayerDamage(200, 560);
playerRed.reset(200, 560);
// Cấp Bá Thể Đỏ: thời gian 4.0s, 100 Armor HP, chịu tối đa 3 đòn
playerRed.setAuraArmor('red', 4.0, 100, 3);
playerRed.state = 'kick_heavy';

assert(playerRed.hasAuraArmor('red') === true, 'Player kích hoạt thành công Hào quang Đỏ');
assert(playerRed.auraArmorHp === 100, 'Độ bền giáp Đỏ ban đầu là 100 HP');
assert(playerRed.auraArmorHits === 3, 'Số đòn chịu đựng ban đầu là 3 đòn');

// Đòn 1: Nhận đòn thường (không phá vỡ giáp)
playerRed.takeDamage(20, 100, false);
assert(playerRed.hasAuraArmor('red') === true, 'Sau đòn 1, Bá Thể Đỏ vẫn còn hoạt động');
assert(playerRed.auraArmorHits === 2, `Số đòn còn lại giảm xuống 2: thực tế ${playerRed.auraArmorHits}`);
assert(playerRed.state === 'kick_heavy', 'Bá Thể Đỏ hấp thụ hoàn toàn chùn bước, không bị khựng');

// Đòn 2: Nhận đòn 2
playerRed.invincibleTimer = 0;
playerRed.takeDamage(20, 100, true);
assert(playerRed.auraArmorHits === 1, 'Số đòn còn lại giảm xuống 1');
assert(playerRed.state === 'kick_heavy', 'Bá Thể Đỏ hấp thụ hoàn toàn knockdown');

// Đòn 3: Đòn phá vỡ giáp (vượt quá hits hoặc hp)
playerRed.invincibleTimer = 0;
playerRed.takeDamage(120, 150, true);
assert(playerRed.hasAuraArmor('red') === false, 'Bá Thể Đỏ ĐÃ BỊ PHÁ VỠ thành công!');
assert(playerRed.state === 'knockdown', 'Sau khi vỡ Bá Thể Đỏ, người chơi bị quật ngã (knockdown)');

// ============================================================================
// 4. KIỂM THỬ U+J & U+K: ĐỠ MỌI ĐÒN VÀ LẬP TỨC PHÁ VỠ BÁ THỂ ĐỎ CỦA ĐỊCH
// ============================================================================
console.log('\n[TEST 4: U+J & U+K Counter Mọi Đòn & Phá Bá Thể Đỏ]');
const defender = new window.PlayerDamage(200, 560);
defender.reset(200, 560);
defender.state = 'counter_hand_prep';
defender.activeCounterType = 'hand';
defender.activeCounterWindow = 0.32;
defender.facing = 1;

const attacker = new window.BaseEnemy(280, 560, 'thug');
attacker.facing = -1;
// Kẻ địch bật Bá Thể Đỏ cực trâu (250 HP, 8 đòn)
attacker.setAuraArmor('red', 5.0, 250, 8);
assert(attacker.hasAuraArmor('red') === true, 'Kẻ địch đang sở hữu Bá Thể Đỏ');

// Kẻ địch tung đòn Boss siêu nặng Uncounterable
const bossSuperMove = {
  damage: 80,
  knockback: 10,
  uncounterable: true,
  isAoE: true,
  isUltimate: true
};

window.combatSystem.resolveHit(attacker, defender, bossSuperMove);

assert(defender.counterSuccess === true, 'U+J đỡ và phản đòn thành công tuyệt đối đòn uncounterable/AoE/Ultimate');
assert(defender.hp === defender.maxHp, 'Defender không nhận bất kỳ sát thương nào');
assert(attacker.hasAuraArmor('red') === false, 'Phản đòn thành công LẬP TỨC PHÁ VỠ BÁ THỂ ĐỎ của kẻ địch!');
assert(attacker.state === 'hurt', 'Kẻ địch bị tê liệt chấn động (hurt)');

console.log('\n==========================================');
console.log('TẤT CẢ TEST HÀO QUANG GIÁP 3 TẦNG & COUNTER TOÀN DIỆN ĐỀU THÀNH CÔNG 100%!');
console.log('==========================================');
