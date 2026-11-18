/**
 * TEST SUITE: VERIFYING REAL IN-GAME PASSIVES & BOTH PUNCH/KICK COUNTERS
 */

const assert = (cond, msg) => {
  if (!cond) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
};

global.window = global;
global.performance = { now: () => Date.now() };

// Mock audio & effect managers
global.audioManager = {
  playWarning: () => {}, playHurt: () => {}, playBlock: () => {},
  playPunch: () => {}, playKick: () => {}, playHeavyHit: () => {},
  playDodge: () => {}, playUltimateBurst: () => {}, playGong: () => {},
  playVovinamKiai: () => {}, playWhoosh: () => {}
};
global.effectManager = {
  addFloatingText: () => {}, createHitSparks: () => {}, createShockRing: () => {},
  triggerFinisherMoment: () => {}, triggerScreenShake: () => {}, createGroundCrack: () => {},
  addGhostTrail: () => {}, createDust: () => {}, triggerFlash: () => {}
};
global.uiManager = {
  updatePlayerHp: () => {}, updatePlayerEnergy: () => {}, showAlertBanner: () => {},
  setCharacterHUD: () => {}, updateBossPoise: () => {}, updateCombo: () => {}
};
global.saveManager = { unlockAchievement: () => {} };

require('../js/combat/combat.js');
require('../js/entities/roster.js');
require('../js/entities/enemy/baseEnemy.js');
require('../js/entities/player/playerBase.js');
require('../js/entities/player/playerDamage.js');
require('../js/entities/player/playerUltimate.js');
require('../js/entities/player/playerInput.js');
require('../js/entities/player.js');

console.log('--- TEST 1: U+J & U+K COUNTER BOTH PUNCHES AND KICKS ---');
const player = new Player(150, 580);
const enemy = new BaseEnemy(220, 580, 'thug');

// 1. U+J counters punch
player.state = 'counter_hand_prep';
player.activeCounterType = 'hand';
player.activeCounterWindow = 0.32;
player.counterSuccess = false;
window.combatSystem.resolveHit(enemy, player, { damage: 40, counterType: 'hand', isKick: false });
assert(player.counterSuccess === true, 'U+J đỡ và phản đòn thành công cú ĐẤM');
assert(player.state === 'counter_hand_strike', 'Player chuyển sang counter_hand_strike');

// 2. U+J counters kick!
player.state = 'counter_hand_prep';
player.activeCounterType = 'hand';
player.activeCounterWindow = 0.32;
player.counterSuccess = false;
window.combatSystem.resolveHit(enemy, player, { damage: 45, counterType: 'leg', isKick: true });
assert(player.counterSuccess === true, 'U+J đỡ và phản đòn thành công cả cú ĐÁ');
assert(player.state === 'counter_hand_strike', 'Player chuyển sang counter_hand_strike khi đỡ đá');

// 3. U+K counters kick
player.state = 'counter_leg_prep';
player.activeCounterType = 'leg';
player.activeCounterWindow = 0.32;
player.counterSuccess = false;
window.combatSystem.resolveHit(enemy, player, { damage: 45, counterType: 'leg', isKick: true });
assert(player.counterSuccess === true, 'U+K đỡ và phản đòn thành công cú ĐÁ');
assert(player.state === 'counter_leg_strike', 'Player chuyển sang counter_leg_strike');

// 4. U+K counters punch!
player.state = 'counter_leg_prep';
player.activeCounterType = 'leg';
player.activeCounterWindow = 0.32;
player.counterSuccess = false;
window.combatSystem.resolveHit(enemy, player, { damage: 40, counterType: 'hand', isKick: false });
assert(player.counterSuccess === true, 'U+K đỡ và phản đòn thành công cả cú ĐẤM');
assert(player.state === 'counter_leg_strike', 'Player chuyển sang counter_leg_strike khi đỡ đấm');

console.log('\n--- TEST 2: NỘI TẠI NGÔ NHẤT NGHỊ ---');
player.setCharacter('nghi');
assert(player.passive_cuongNhu === true, 'Nội tại Cương Nhu Phối Triển kích hoạt');
assert(player.passive_batKhuat === true, 'Nội tại Bất Khuất Thân Pháp kích hoạt');
assert(player.passive_phanChau === true, 'Nội tại Gạt Quyền Phản Chưởng kích hoạt');
assert(player.dodgeIframeMul === 1.25, 'Tăng 25% i-frame khi né');

// Cương Nhu hồi thể lực & nộ ở combo >= 5
player.stamina = 50;
player.energy = 10;
window.combatSystem.comboCount = 5;
window.combatSystem.resolveHit(player, enemy, { damage: 40 });
assert(player.stamina === 53, 'Cương Nhu hồi +3 thể lực khi trúng đích ở combo 5');
assert(player.energy > 10, 'Cương Nhu hồi thêm nộ khí');

// Gạt Quyền nạp nộ và siêu giáp khi counter
player.state = 'counter_hand_prep';
player.activeCounterType = 'hand';
player.activeCounterWindow = 0.32;
player.energy = 0;
window.combatSystem.resolveHit(enemy, player, { damage: 30 });
assert(player.energy >= 25, 'Gạt Quyền nạp ngay 25 nộ khi counter thành công');
assert(player.superArmor === true, 'Nhận Siêu Giáp phản kích');

console.log('\n--- TEST 3: NỘI TẠI ĐÌNH BÍCH LÂM ---');
player.setCharacter('bichlam');
assert(player.comboMax === 5, 'Chuỗi combo mở rộng lên 5 đòn');
assert(player.speed > 230, 'Tốc độ di chuyển tăng 25%');
assert(player.passive_lucChien === true, 'Lục Chiến Bất Khuất kích hoạt');

// Lục chiến bất khuất giảm 20% sát thương khi máu dưới 50%
player.hp = 400; // < 50%
const hpBefore = player.hp;
player.takeDamage(100);
// 100 * 0.8 (Lục Chiến -20%) = 80
assert(hpBefore - player.hp === 80, `Lục Chiến giảm 20% sát thương khi dưới 50% HP: mất ${hpBefore - player.hp} HP`);

console.log('\n--- TEST 4: NỘI TẠI HỨA VŨ ĐẠI ---');
player.setCharacter('huavudai');
assert(player.kbMul === 1.7, 'Lực xô đẩy tăng 70%');
assert(player.passive_hacLongShield === true, 'Hắc Long Hộ Thể kích hoạt');

// Chặn đòn chí tử
player.hp = 50;
player.takeDamage(500);
assert(player.hp > 0, 'Hắc Long Hộ Thể chặn đòn chí tử, không bị chết');
assert(player.invincibleTimer === 3.0, 'Được cấp 3 giây bất tử');

console.log('\n--- TEST 5: NỘI TẠI TRIỆU ĐÌNH AN ---');
player.setCharacter('dinhan');
assert(player.damageReduction === 0.25, 'Giảm vĩnh viễn 25% sát thương nhận vào');
assert(player.passive_phungHoang === true, 'Phụng Hoàng Hộ Tâm kích hoạt');

// Phụng Hoàng phản chấn 40% sát thương khi thủ thế
player.state = 'guard';
const guardEnemy = new BaseEnemy(220, 580, 'thug');
guardEnemy.hp = 200;
window.combatSystem.resolveHit(guardEnemy, player, { damage: 50 });
assert(guardEnemy.hp < 200, `Kẻ địch bị phản chấn sát thương khi đánh vào thế thủ: HP còn ${guardEnemy.hp}`);

console.log('\n--- TEST 6: NỘI TẠI PHÓ ĐẶNG HOÀNG ANH ---');
player.setCharacter('hoanganh');
assert(player.superArmor === true, 'Bá Thể Sơn Cước kích hoạt vĩnh viễn');
assert(player.reachMul === 1.5, 'Tầm càn quét tăng 50%');
assert(player.dmgMul > 1.2, 'Sát thương cơ bản tăng 25%');

// Nham thạch hồi phục khi đứng yên 2s
player.hp = 500;
player.state = 'idle';
player.stateTimer = 2.5;
player.update(0.1, []);
assert(player.hp > 500, `Nham thạch tự động hồi phục khi đứng yên: HP = ${player.hp}`);

console.log('\n--- TEST 7: NỘI TẠI PHÓ DUNG HẢI ---');
player.setCharacter('dunghai');
assert(player.passive_huyetDao === true, 'Huyết Đao Xuất Huyết kích hoạt');
assert(player.passive_huAnh === true, 'Hư Ảnh Biến Ảo kích hoạt');

// Chém gây xuất huyết
const slashEnemy = new BaseEnemy(220, 580, 'thug');
slashEnemy.bleedTimer = 0;
window.combatSystem.resolveHit(player, slashEnemy, { damage: 40 });
assert(slashEnemy.bleedTimer > 0, 'Đòn chém song đao gây xuất huyết DoT');

console.log('\n--- TEST 8: NỘI TẠI NGÔ GIANG MẠNH ---');
player.setCharacter('giangmanh');
assert(player.counterBonus === 2.6, 'Sát thương phản đòn bạo kích tăng 260%');
assert(player.passive_hanBang === true, 'Hàn Băng Tâm Pháp kích hoạt');

// Tích tụ 4 tầng hàn băng làm choáng
const freezeEnemy = new BaseEnemy(220, 580, 'thug');
freezeEnemy.stunTimer = 0;
freezeEnemy._frostStacks = 0;
window.combatSystem.resolveHit(player, freezeEnemy, { damage: 30 });
freezeEnemy.invincibleTimer = 0;
window.combatSystem.resolveHit(player, freezeEnemy, { damage: 30 });
freezeEnemy.invincibleTimer = 0;
window.combatSystem.resolveHit(player, freezeEnemy, { damage: 30 });
freezeEnemy.invincibleTimer = 0;
window.combatSystem.resolveHit(player, freezeEnemy, { damage: 30 });
assert(freezeEnemy.stunTimer > 0, 'Đủ 4 đòn kiếm đóng băng làm choáng đối thủ');

console.log('\n--- TEST 9: NỘI TẠI PHÓ TIẾN ĐĂNG (HỒ SƠ SAO KÊ & CÂN BẰNG SKILL-EXPRESSION) ---');
player.setCharacter('tiendang');
assert(player.passive_hoSoSaoKe === true, 'Hồ Sơ Sao Kê kích hoạt');
assert(player.finisher === 'counter', 'Tiến Đăng dùng finisher counter (boss_riposte), tách khỏi rush của Bích Lâm');
assert(player.mechRiposte === false, 'Tiến Đăng không ăn theo cơ chế giữ U phản chủng của Đình An / Giang Mạnh');
assert(player.maxHp === 980 && player.speed === 248 && Math.abs(player.dmgMul - 1.08) < 1e-6, 'Chỉ số cơ bản cân bằng (980 HP, speed 248, dmgMul 1.08)');

// 9a. Phối chiêu khác nhau tích 3 tầng Sao Kê, spam 1 chiêu bị chặn
const maBoss = new BaseEnemy(220, 580, 'thug');
maBoss.maxHp = 1000;
maBoss.hp = 1000;
maBoss.isBoss = true;
maBoss.poise = 100;
maBoss.maxPoise = 100;
player.energy = 0;
player.state = 'punch_straight';
window.combatSystem.resolveHit(player, maBoss, { damage: 40 });
assert(maBoss._maMarks === 1, 'Chiêu đầu tiên khắc +1 tầng Sao Kê');

maBoss.invincibleTimer = 0;
player.state = 'punch_straight';
window.combatSystem.resolveHit(player, maBoss, { damage: 40 });
assert(maBoss._maMarks === 1, 'Spam cùng 1 chiêu liên tiếp không cộng thêm tầng Sao Kê');

maBoss.invincibleTimer = 0;
player.state = 'punch_hook';
window.combatSystem.resolveHit(player, maBoss, { damage: 40 });
assert(maBoss._maMarks === 2, 'Đổi sang chiêu thứ 2 tăng lên 2 tầng Sao Kê');

const hpBeforeDetonate = maBoss.hp;
maBoss.invincibleTimer = 0;
player.state = 'uppercut';
window.combatSystem.resolveHit(player, maBoss, { damage: 40 });
assert(maBoss._maMarks === 0, 'Đủ 3 tầng kích nổ Thâu Tóm M&A và reset tầng về 0');
assert(hpBeforeDetonate - maBoss.hp > 60, `Kích nổ cộng thêm +42 sát thương chuẩn (mất ${hpBeforeDetonate - maBoss.hp} HP)`);
assert(maBoss.poise <= 78, `Kích nổ phá 22 Poise Boss (Poise còn ${maBoss.poise})`);
assert(player._quantumShieldTimer === 3.5, 'Kích nổ bật Lá Chắn Thanh Khoản 3.5s');

// 9b. Lá Chắn Thanh Khoản giảm 28% sát thương kế tiếp rồi tự tiêu thụ
player.invincibleTimer = 0;
player.hp = player.maxHp;
player.takeDamage(100);
assert(player.maxHp - player.hp === 72, `Lá Chắn Thanh Khoản giảm 28% sát thương đòn kế (mất ${player.maxHp - player.hp} HP)`);
assert(player._quantumShieldTimer === 0, 'Lá Chắn Thanh Khoản tiêu thụ sau khi đỡ 1 đòn');

player.invincibleTimer = 0;
const hpUnshielded = player.hp;
player.takeDamage(100);
assert(hpUnshielded - player.hp === 100, `Khi không có Lá Chắn chịu đủ 100% sát thương (mất ${hpUnshielded - player.hp} HP)`);

// 9c. Tàn Ảnh Thế Thân [L]: không dịch chuyển sau lưng, đánh dấu +1 Sao Kê và giảm hồi chiêu Counter
const decoyTarget = new BaseEnemy(240, 580, 'thug');
decoyTarget._maMarks = 0;
global.game = { enemies: [decoyTarget] };
player.x = 150;
player.y = 580;
player.counterHandCooldown = 2.5;
player.counterLegCooldown = 3.5;
window.CharacterRegistry.onDodge(player, { dodgeSpeed: 440, dir: 1 });
assert(player.x === 150, 'Tàn Ảnh Thế Thân giữ vị trí né chủ động, không dịch chuyển tự động ra sau lưng');
assert(decoyTarget._maMarks === 1 && decoyTarget.slowTimer > 0, 'Tàn Ảnh khắc +1 Sao Kê và làm chậm địch gần');
assert(player.counterHandCooldown === 1.0 && player.counterLegCooldown === 2.0, 'Tàn Ảnh giảm 1.5s hồi chiêu Phản Đòn');

// Dash-Cancel [L] chỉ kích hoạt khi đòn đã chạm đích (hitTargets.size > 0)
const cancelMockInput = {
  moveRight: true, moveLeft: false, justPressed: { KeyL: true },
  isJustPressed: (k) => k === 'KeyL',
  peek: (k) => k === 'KeyL',
  consumeBufferedAction: () => {}
};
player.state = 'punch_hook';
player.dodgeCooldown = 0;
player.hitTargets = new Set();
assert(window.CharacterRegistry.tryInputCancel(player, cancelMockInput) === false, 'Không cho Dash-Cancel [L] khi đánh hụt (hitTargets rỗng)');
player.hitTargets.add(decoyTarget.id);
assert(window.CharacterRegistry.tryInputCancel(player, cancelMockInput) === true && player.state === 'dodge', 'Cho phép Dash-Cancel [L] ngay khi đòn đã chạm đích');
delete global.game;

// 9d. Nước Cờ Bẫy Ngược [U+J]: không gây Bleed, phá Poise, hoàn 50% hồi chiêu Né và hồi Thể Lực
const trapBoss = new BaseEnemy(220, 580, 'thug');
trapBoss.maxHp = 1000;
trapBoss.hp = 1000;
trapBoss.isBoss = true;
trapBoss.poise = 100;
trapBoss.bleedTimer = 0;
trapBoss.stunTimer = 0;
player.invincibleTimer = 0;
player.state = 'counter_hand_prep';
player.activeCounterType = 'hand';
player.activeCounterWindow = 0.32;
player.counterSuccess = false;
player.dodgeCooldown = 6.0;
player.stamina = 60;
player._quantumShieldTimer = 0;
window.combatSystem.resolveHit(trapBoss, player, { damage: 40, counterType: 'hand', isKick: false });
assert(trapBoss.bleedTimer === 0, 'Nước Cờ Bẫy Ngược không sao chép hiệu ứng Xuất Huyết của Bích Lâm');
assert(trapBoss.poise <= 37, `Bẫy Ngược trừ mạnh Poise Boss (Poise còn ${trapBoss.poise})`);
assert(trapBoss.stunTimer >= 1.0, 'Bẫy Ngược gây choáng 1.0s');
assert(player.dodgeCooldown <= 3.0, `Bẫy Ngược hoàn 50% hồi chiêu Né [L] (còn ${player.dodgeCooldown}s)`);
assert(player.stamina >= 78, `Bẫy Ngược hồi +18 Thể Lực (Stamina = ${player.stamina})`);
assert(player._quantumShieldTimer > 0, 'Bẫy Ngược kích hoạt Lá Chắn Thanh Khoản');

console.log('\n--- TEST 10: TỔ HỢP ĐÒN ĐẶC TRƯNG CHO CẢ 10 NHÂN VẬT (U+J ≠ U+K, W+U, L→J/K, J↔K & S+K) ---');
const ALL_9_HEROES = ['nghi', 'bichlam', 'huavudai', 'dinhan', 'hoanganh', 'dunghai', 'giangmanh', 'vananh', 'tiendang', 'thienkhanh'];
for (const hid of ALL_9_HEROES) {
  const def = window.CharacterRegistry.get(hid);
  assert(def && def.passives && typeof def.passives.onLegCounter === 'function', `${hid}: có onLegCounter (U+K riêng)`);
  assert(def && def.passives && typeof def.passives.onStanceSpecial === 'function', `${hid}: có onStanceSpecial (W+U riêng)`);
  assert(def && def.passives && typeof def.passives.onDodgeFollowup === 'function', `${hid}: có onDodgeFollowup (L→J/K riêng)`);
}

// 10a. Tách biệt U+J và U+K
player.setCharacter('nghi');
player.stamina = 40;
player.kickCooldown = 0.5;
player.nextHitCrit = false;
player.clearAuraArmor();
player.state = 'counter_leg_prep';
player.activeCounterType = 'leg';
player.activeCounterWindow = 0.32;
player.counterSuccess = false;
const kickAtkEnemy = new BaseEnemy(220, 580, 'thug');
window.combatSystem.resolveHit(kickAtkEnemy, player, { damage: 40, counterType: 'leg', isKick: true });
assert(player.stamina === 65 && player.kickCooldown === 0 && player.nextHitCrit === true && !player.hasAuraArmor('gold'), 'Ngô Nhất Nghị U+K hồi +25 Thể Lực, reset đá & bật bạo kích (khác U+J Kim Cang)');

player.setCharacter('dunghai');
player.dodgeCooldown = 7.0;
const legVictim = new BaseEnemy(220, 580, 'thug');
player.invincibleTimer = 0;
player.state = 'counter_leg_prep';
player.activeCounterType = 'leg';
player.activeCounterWindow = 0.32;
player.counterSuccess = false;
window.combatSystem.resolveHit(legVictim, player, { damage: 40, counterType: 'leg', isKick: true });
assert(player.dodgeCooldown === 0 && legVictim.bleedDmg >= 11 && legVictim.speedMul === 0.5, 'Phó Dung Hải U+K cắt gân làm chậm 50% & xóa hồi chiêu Né [L]');

player.setCharacter('giangmanh');
const shatterEnemy = new BaseEnemy(220, 580, 'thug');
shatterEnemy.maxHp = 500;
shatterEnemy.hp = 500;
shatterEnemy._frostStacks = 3;
shatterEnemy.stunTimer = 0;
player.invincibleTimer = 0;
player.state = 'counter_leg_prep';
player.activeCounterType = 'leg';
player.activeCounterWindow = 0.32;
player.counterSuccess = false;
window.combatSystem.resolveHit(shatterEnemy, player, { damage: 40, counterType: 'leg', isKick: true });
assert(shatterEnemy._frostStacks === 0 && shatterEnemy.hp <= 300 && shatterEnemy.frozenTimer >= 1.4, `Ngô Giang Mạnh U+K Toái Băng kích nổ 3 tầng Hàn Khí (HP còn ${shatterEnemy.hp}, frozen=${shatterEnemy.frozenTimer})`);

player.setCharacter('tiendang');
const tdLegTarget = new BaseEnemy(220, 580, 'thug');
tdLegTarget._maMarks = 0;
player.energy = 0;
player.invincibleTimer = 0;
player.state = 'counter_leg_prep';
player.activeCounterType = 'leg';
player.activeCounterWindow = 0.32;
player.counterSuccess = false;
window.combatSystem.resolveHit(tdLegTarget, player, { damage: 40, counterType: 'leg', isKick: true });
assert(tdLegTarget._maMarks === 2 && player.energy >= 20 && player._quantumShieldTimer === 3.5, 'Phó Tiến Đăng U+K khắc sẵn 2/3 Sao Kê, +20 Nộ & bật Lá Chắn Thanh Khoản');

// 10b. W+U (Stance Special) + PlayerInput integration
const radarEnemy = new BaseEnemy(230, 580, 'thug');
radarEnemy._maMarks = 0;
global.game = { enemies: [radarEnemy] };
player.x = 150;
player.y = 580;
player.state = 'idle';
player.stanceSkillCooldown = 0;
player.stamina = 70;
player._lastMaMove = 'punch_straight';
global.input = {
  keys: { KeyW: true, KeyU: true },
  justPressed: { KeyU: true },
  lastKeyDownTime: { KeyW: performance.now() },
  moveUp: true, moveDown: false, moveLeft: false, moveRight: false,
  run: false, block: false, jump: false, punch: false, kick: false, dodge: false, ultimate: false,
  isDown: (k) => k === 'KeyW' || k === 'KeyU',
  isJustPressed: (k) => k === 'KeyU',
  isActionJustPressed: () => false,
  consumeCounterHand: () => false,
  consumeCounterLeg: () => false,
  consumeBufferedAction: () => {},
  peek: () => false
};
player.handlePlayerInput([radarEnemy]);
assert(radarEnemy._maMarks === 1 && player._lastMaMove === null && player.stamina === 85 && player.stanceSkillCooldown === 6.0, 'Phó Tiến Đăng W+U quét dữ liệu khắc +1 Sao Kê, xóa nhớ chiêu & khóa hồi chiêu 6.0s');

player.setCharacter('dinhan');
player.guardGauge = 40;
player.stanceSkillCooldown = 0;
window.CharacterRegistry.tryStanceSpecial(player, []);
assert(player.guardGauge === 80 && player.hasAuraArmor('gold'), 'Triệu Đình An W+U hồi +40 Guard Gauge & bật Kim Cang');

// 10c. L → J / L → K (Dodge Follow-up) và chuỗi chéo J ↔ K qua PlayerInput
player.setCharacter('tiendang');
player.state = 'idle';
player.setState('dodge', 0.28);
player.stateTimer = 0.14; // > 0.12s cancel threshold
assert(player._dodgeFollowupTimer === 0.45, 'Vào trạng thái dodge mở cửa sổ 0.45s nối chiêu L→J / L→K');

let bufferedK = true;
global.input = {
  keys: { KeyK: true },
  justPressed: {},
  lastKeyDownTime: {},
  moveUp: false, moveDown: false, moveLeft: false, moveRight: false,
  run: false, block: false, jump: false, punch: false,
  get kick() { if (bufferedK) { bufferedK = false; return true; } return false; },
  dodge: false, ultimate: false,
  isDown: () => false,
  isJustPressed: () => false,
  isActionJustPressed: () => false,
  consumeCounterHand: () => false,
  consumeCounterLeg: () => false,
  consumeBufferedAction: () => {},
  peek: (k) => (k === 'KeyK' && bufferedK)
};
player.updateStateLogic(0.016, [radarEnemy]);
assert(player.state === 'kick_push' && player._moveVariant === 'wk' && player._dodgeFollowupTimer === 0, 'L → K trên Phó Tiến Đăng tung Xung Kích Phản Lực Cyan (kick_push / wk)');

// Chuỗi chéo J → K đánh dấu _isCrossComboHit
player.state = 'idle';
player.kickCooldown = 0;
player.comboStep = 1;
player.comboWindowTimer = 0.6;
player._prevComboBtn = 'J';
bufferedK = true;
player.handlePlayerInput([radarEnemy]);
assert(player._isCrossComboHit === true && player._prevComboBtn === 'K', 'Nối J → K kích hoạt cờ isCrossCombo = true');

// 10d. S+K Siêu Thâu Tóm trên Phó Tiến Đăng (2 Sao Kê + S+K = +56 dmg & -28 Poise)
const superSweepBoss = new BaseEnemy(220, 580, 'thug');
superSweepBoss.maxHp = 1000;
superSweepBoss.hp = 1000;
superSweepBoss.isBoss = true;
superSweepBoss.poise = 100;
superSweepBoss.maxPoise = 100;
superSweepBoss._maMarks = 2;
player._lastMaMove = 'punch_hook';
player.state = 'kick_sweep';
player._moveVariant = null;
player._isCrossComboHit = false;
window.combatSystem.resolveHit(player, superSweepBoss, { damage: 40 });
assert(superSweepBoss._maMarks === 0 && superSweepBoss.hp <= 904 && superSweepBoss.poise <= 72, `S+K khi địch có 2 Sao Kê nổ Siêu Thâu Tóm (+56 dmg, HP=${superSweepBoss.hp}, Poise=${superSweepBoss.poise})`);

console.log('\n--- TEST 11: TÊN CHIÊU RIÊNG, TỐC ĐÁNH VŨ KHÍ NẶNG & CỤC NỘI TẠI HUD ---');
// 11a. Tên chiêu thức theo nhân vật & kế thừa Vovinam
const nghiUpLabel = window.CharacterRegistry.getSkillMoveLabel(Object.assign(player, { charId: 'nghi', characterId: 'nghi', isVovinamSkin: true }), 'uppercut');
for (const hid of ALL_9_HEROES) {
  player.setCharacter(hid);
  player.isVovinamSkin = (hid === 'nghi');
  const upLabel = window.CharacterRegistry.getSkillMoveLabel(player, 'uppercut');
  const handLabel = window.CharacterRegistry.getSkillMoveLabel(player, 'counter_hand_strike');
  assert(typeof upLabel === 'string' && upLabel.length > 0, `${hid}: getSkillMoveLabel('uppercut') -> ${upLabel}`);
  assert(typeof handLabel === 'string' && handLabel.length > 0 && !handLabel.startsWith('PHẢN ĐÒN:'), `${hid}: getSkillMoveLabel('counter_hand_strike') chuẩn hóa -> ${handLabel}`);
  if (hid !== 'nghi') {
    assert(upLabel !== nghiUpLabel, `${hid}: không dùng nhãn W+J của Ngô Nhất Nghị khi mặc trang phục gốc`);
  }
}
player.setCharacter('dinhan');
player.isVovinamSkin = true;
assert(window.CharacterRegistry.getSkillMoveLabel(player, 'uppercut') === 'PHỤNG HOÀNG KHỞI CHÙY', 'Mặc Võ Phục Vovinam chỉ đổi áo, giữ nguyên tên chiêu gốc của Đình An');

// 11b. Đình An & Hoàng Anh đánh chậm hơn do vũ khí nặng (kể cả khi mặc Võ Phục Vovinam thuần áo)
player.setCharacter('nghi');
player.startAttack('punch_straight', 0.34, 120);
const nghiAtkDur = player.stateDuration;

player.setCharacter('dinhan');
player.isVovinamSkin = false;
player.startAttack('punch_straight', 0.34, 120);
const dinhanAtkDur = player.stateDuration;
assert(player.attackDurationMul === 1.22 && dinhanAtkDur > nghiAtkDur, `Đình An cầm chùy khiên vung đòn chậm hơn Nghị (${dinhanAtkDur}s > ${nghiAtkDur}s)`);

player.setCharacter('hoanganh');
player.isVovinamSkin = false;
player.startAttack('punch_straight', 0.34, 120);
const hoanganhAtkDur = player.stateDuration;
assert(player.attackDurationMul === 1.26 && hoanganhAtkDur > dinhanAtkDur, `Hoàng Anh cầm cuốc sắt vung đòn chậm hơn Đình An (${hoanganhAtkDur}s > ${dinhanAtkDur}s)`);

player.isVovinamSkin = true;
player.startAttack('punch_straight', 0.34, 120);
assert(Math.abs(player.stateDuration - hoanganhAtkDur) < 1e-6, 'Mặc Võ Phục Vovinam vẫn giữ nguyên nhịp vung đòn đặc trưng của Hoàng Anh');

// 11c. Cục Nội Tại HUD & Tích tầng trực quan cho cả 9 nhân vật
const hudEnemy = new BaseEnemy(220, 580, 'thug');
for (const hid of ALL_9_HEROES) {
  player.setCharacter(hid);
  player.isVovinamSkin = (hid === 'nghi');
  const st = window.CharacterRegistry.getPassiveHudStatus(player, [hudEnemy]);
  assert(st && st.icon && st.name && st.pipsMax >= 3 && typeof st.pipsFilled === 'number' && st.wuLabel, `${hid}: getPassiveHudStatus hợp lệ (${st.icon} ${st.name} | W+U=${st.wuLabel})`);
}

player.setCharacter('tiendang');
player.isVovinamSkin = false;
player._quantumShieldTimer = 1.6;
hudEnemy._maMarks = 2;
player._lastDamagedEnemy = hudEnemy;
const tdHud = window.CharacterRegistry.getPassiveHudStatus(player, [hudEnemy]);
assert(tdHud.name === 'TIÊN PHONG TÁC CHIẾN' && tdHud.statusText.includes('LÁ CHẮN') && !tdHud.statusText.includes('SAO KÊ'), `Tiến Đăng HUD chỉ hiển thị nội tại bản thân (${tdHud.statusText}), không hiện debuff Sao Kê của địch`);
const tdEnemyDebuffs = window.CharacterRegistry.getEntityDebuffs(hudEnemy).map((d) => d.id);
assert(tdEnemyDebuffs.includes('ma_marks'), 'Hiệu ứng Sao Kê nằm trên thực thể kẻ địch bị dính (hudEnemy)');

player.setCharacter('giangmanh');
player.isVovinamSkin = false;
player._quantumShieldTimer = 0;
player.nextHitCrit = true;
hudEnemy._frostStacks = 3;
player._lastDamagedEnemy = hudEnemy;
const gmHud = window.CharacterRegistry.getPassiveHudStatus(player, [hudEnemy]);
assert(gmHud.name === 'HÀN BĂNG KIẾM PHÁP' && gmHud.statusText.includes('XUYÊN GIÁP') && !gmHud.statusText.includes('HÀN KHÍ'), `Giang Mạnh HUD chỉ hiển thị nội tại bản thân (${gmHud.statusText}), không hiện debuff Hàn Khí của địch`);
const gmEnemyDebuffs = window.CharacterRegistry.getEntityDebuffs(hudEnemy).map((d) => d.id);
assert(gmEnemyDebuffs.includes('frost_stacks'), 'Hiệu ứng Hàn Khí nằm trên thực thể kẻ địch bị dính (hudEnemy)');

console.log('\n--- TEST 12: HIỂN THỊ HIỆU ỨNG BẤT LỢI ĐÚNG DƯỚI THANH MÁU KẺ BỊ DÍNH (KHÔNG HIỆN Ở KẺ GÂY RA) ---');
const debuffEnemy = new BaseEnemy(220, 580, 'thug');
debuffEnemy.isBoss = true;
debuffEnemy.bleedTimer = 2.1;
debuffEnemy.stunTimer = 1.4;
debuffEnemy.blindTimer = 1.6;
debuffEnemy.slowTimer = 2.5;
debuffEnemy.weakWindow = 1.2;
debuffEnemy._maMarks = 2;
debuffEnemy._frostStacks = 3;
const eDebuffs = window.CharacterRegistry.getEntityDebuffs(debuffEnemy);
const eIds = eDebuffs.map((d) => d.id);
assert(['stun', 'bleed', 'blind', 'slow', 'weak', 'ma_marks', 'frost_stacks'].every((k) => eIds.includes(k)), `Đọc đủ hiệu ứng bất lợi & cộng dồn trên kẻ địch/boss: ${eIds.join(', ')}`);

debuffEnemy.frozenTimer = 1.3;
const frozenIds = window.CharacterRegistry.getEntityDebuffs(debuffEnemy).map((d) => d.id);
assert(frozenIds.includes('frozen') && !frozenIds.includes('stun') && !frozenIds.includes('frost_stacks'), 'Đóng băng ưu tiên hiển thị thay thế Choáng & Hàn Khí trung gian');

player.setCharacter('tiendang');
player.isVovinamSkin = false;
player.bleedTimer = 0;
player.frozenTimer = 0;
player.stunTimer = 0;
player.blindTimer = 0;
player.slowTimer = 0;
player.guardBreakTimer = 0;
player.exhaustTimer = 0;
player.spamStack = 0;
player._lastDamagedEnemy = debuffEnemy;

// Kiểm tra UIManager: khi chỉ có địch bị dính debuff, #hud-debuffs-bar dưới thanh máu Player PHẢI ẨN & RỖNG
const mockHudDebuffBar = {
  innerHTML: 'stale',
  _cls: new Set(['hud-debuffs-bar']),
  classList: {
    add(c) { this._parent._cls.add(c); },
    remove(c) { this._parent._cls.delete(c); },
    contains(c) { return this._parent._cls.has(c); }
  }
};
mockHudDebuffBar.classList._parent = mockHudDebuffBar;
const mockBossDebuffBar = {
  innerHTML: '',
  _cls: new Set(['hud-debuffs-bar', 'hidden']),
  classList: {
    add(c) { this._parent._cls.add(c); },
    remove(c) { this._parent._cls.delete(c); },
    contains(c) { return this._parent._cls.has(c); }
  }
};
mockBossDebuffBar.classList._parent = mockBossDebuffBar;

if (window.UIManager && typeof window.UIManager === 'function') {
  global.game.enemies = [debuffEnemy];
  global.game.currentBoss = debuffEnemy;
  const uiSim = Object.create(window.UIManager.prototype);
  uiSim.hudDebuffsBar = mockHudDebuffBar;
  uiSim.bossDebuffsBar = mockBossDebuffBar;
  uiSim.updateSkillCooldowns(player);
  assert(mockHudDebuffBar.classList.contains('hidden') && mockHudDebuffBar.innerHTML === '', 'Khi chỉ có địch dính debuff, thanh debuff dưới máu Player PHẢI ẨN và rỗng');
  assert(!mockBossDebuffBar.classList.contains('hidden') && mockBossDebuffBar.innerHTML.includes('ĐÓNG BĂNG'), 'Thanh debuff của Boss HUD hiển thị đầy đủ hiệu ứng xấu mà Boss bị dính');

  // Khi chính Player bị dính debuff, #hud-debuffs-bar mới hiện dưới thanh máu Player
  player.bleedTimer = 1.8;
  player.guardBreakTimer = 0.9;
  uiSim.updateSkillCooldowns(player);
  assert(!mockHudDebuffBar.classList.contains('hidden') && mockHudDebuffBar.innerHTML.includes('XUẤT HUYẾT') && !mockHudDebuffBar.innerHTML.includes('SAO KÊ'), 'Khi chính Player bị dính debuff, #hud-debuffs-bar chỉ hiện debuff của Player');
}

player.bleedTimer = 1.8;
player.guardBreakTimer = 0.9;
player.exhaustTimer = 0.6;
player.spamStack = 4;
player.attackClock = 10.0;
player._lastHitAt = 9.7;
player._attackMul = 0.42;
const pDebuffs = window.CharacterRegistry.getEntityDebuffs(player);
const pIds = pDebuffs.map((d) => d.id);
assert(['bleed', 'guard_break', 'exhaust', 'stale'].every((k) => pIds.includes(k)), `Đọc đủ hiệu ứng bất lợi trên người chơi: ${pIds.join(', ')}`);

const combinedHud = window.CharacterRegistry.getPassiveHudStatus(player, [debuffEnemy]);
assert(Array.isArray(combinedHud.selfDebuffs) && combinedHud.selfDebuffs.length === 4 && Array.isArray(combinedHud.targetDebuffs) && combinedHud.targetDebuffs.length >= 5, 'getPassiveHudStatus trả về đủ danh sách selfDebuffs & targetDebuffs');

console.log('\n--- TEST 13: CHÂU NGỌC THIÊN KHÁNH (KIẾM XU THIÊU ĐỐT & TRIỆU HỒI HỎA ÂM BINH) ---');
player.setCharacter('thienkhanh');
const tkDef = window.CharacterRegistry.get('thienkhanh');
assert(tkDef.uiSlot.shopPrice === 12000 && tkDef.uiSlot.shopCurrency === 'gold', 'Thiên Khánh có giá siêu đắt 12.000 Vàng trong Khu Chiêu Mộ Võ Sĩ');
const burnTarget = new BaseEnemy(player.x + 80, player.y, 'brawler');
burnTarget.hp = 400;
global.game.enemies = [burnTarget];
// 1. Đòn đánh Kiếm Xu khắc hiệu ứng Thiêu Đốt (burnTimer)
tkDef.passives.onAttackHit(player, burnTarget);
assert(burnTarget.burnTimer >= 3.0 && burnTarget.burnDmg >= 12, 'Đòn đánh của Thiên Khánh khắc hiệu ứng Thiêu Đốt (burnTimer)');
const burnTargetDebuffs = window.CharacterRegistry.getEntityDebuffs(burnTarget).map(d => d.id);
assert(burnTargetDebuffs.includes('burn'), `Debuff Thiêu Đốt hiển thị trên kẻ địch: ${burnTargetDebuffs.join(', ')}`);
// 2. W+U triệu hồi Hỏa Âm Binh chạy tới chém & đốt mục tiêu
player.x = 200;
burnTarget.x = 230;
tkDef.passives.onStanceSpecial(player, [burnTarget]);
assert(Array.isArray(player._summonedFiends) && player._summonedFiends.length === 1, 'Kích hoạt W+U của Thiên Khánh triệu hồi 1 Hỏa Âm Binh');
const hpBeforeFiend = burnTarget.hp;
for (let step = 0; step < 6; step++) {
  tkDef.passives.onUpdate(player, 0.25);
}
assert(burnTarget.hp < hpBeforeFiend, `Hỏa Âm Binh tự động lao vào chém địch (HP: ${hpBeforeFiend} -> ${burnTarget.hp})`);

// 3. Kiểm tra Hỏa Âm Binh đuổi theo đối thủ Online PvP (window.onlineManager.remotePlayer) & Huyết Ấn Hấp Tinh hồi máu
player.hp = 600;
player._hapTinhHealCd = 0;
global.game.enemies = [];
let pvpDamageReceived = 0;
global.window.onlineManager = {
  isActive: true,
  mode: 'pvp',
  remotePlayer: {
    x: 420,
    y: 580,
    hp: 900,
    isDead: false,
    burnTimer: 2.0,
    takeDamage(dmg) {
      pvpDamageReceived += dmg;
      this.hp = Math.max(0, this.hp - dmg);
    }
  }
};
for (let step = 0; step < 12; step++) {
  tkDef.passives.onUpdate(player, 0.15);
}
assert(pvpDamageReceived > 0, `Hỏa Âm Binh tự động đuổi theo và đánh trúng đối thủ PvP Online (dmg=${pvpDamageReceived})`);
assert(player.hp > 600, `Huyết Ấn Hấp Tinh hồi máu cho Thiên Khánh khi đốt mục tiêu (HP: 600 -> ${player.hp})`);
delete global.window.onlineManager;

delete global.game;
delete global.input;

console.log('\n==========================================');
console.log('TẤT CẢ 13 BỘ KIỂM THỬ NỘI TẠI, TỔ HỢP ĐÒN & DEBUFF HUD ĐỀU THÀNH CÔNG RỰC RỠ!');
console.log('==========================================');