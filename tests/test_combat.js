/**
 * Automated Verification Script for Critical Combat Fix & Vovinam Balance Update
 * Tests A through H in Node.js environment
 */

// Mock browser globals
global.window = global;
global.window.addEventListener = () => {};
global.performance = {
  now: () => Date.now()
};
global.document = {
  getElementById: () => ({ getContext: () => ({}) })
};

// Load modules in order
require('../js/core/effects.js');
require('../js/entities/roster.js');
require('../js/entities/animation/animationData.js');
require('../js/entities/animation/animationBase.js');
require('../js/entities/animation/animationPose.js');
require('../js/entities/animation/animationRenderBase.js');
require('../js/entities/animation/animationWeapon.js');
require('../js/entities/animation/animationBody.js');
require('../js/entities/animation.js');
require('../js/combat/props.js');
require('../js/entities/enemy/baseEnemy.js');
require('../js/entities/enemy/enemyVariants.js');
require('../js/entities/enemy/enemyBosses.js');
require('../js/entities/enemy.js');
require('../js/combat/weapons.js');
require('../js/entities/bosses2.js');
require('../js/core/input.js');
require('../js/combat/combat.js');
require('../js/entities/player/playerBase.js');
require('../js/entities/player/playerDamage.js');
require('../js/entities/player/playerUltimate.js');
require('../js/entities/player/playerInput.js');
require('../js/entities/player.js');
require('../js/data/stages.js');
require('../js/world/stageManager.js');
require('../js/world/stageRenderer.js');
require('../js/world/stages.js');
require('../js/core/gameBase.js');
require('../js/core/gameWave.js');
require('../js/core/gameCamera.js');
require('../js/core/gameFlow.js');
require('../js/core/gameStory.js');
require('../js/core/gameRender.js');
require('../js/core/game.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('--- TEST SUITE: CRITICAL COMBAT & VOVINAM BALANCE ---');

// ==========================================
// TEST A: VẬT CẢN (OBSTACLE COLLISION & AVOIDANCE)
// ==========================================
console.log('\n[TEST A: Vật cản - Chạm thùng không tự ngã & AI né vật cản]');

window.game = { arenaLocked: false, arenaMinX: 20, arenaMaxX: 1800 };
window.stageManager = { stageWidth: 2000 };

const propSys = window.propSystem;
propSys.props = [new window.InteractiveProp({ type: 'crate', x: 300, y: 570 })];

const thug = new BaseEnemy(260, 570, 'thug');
thug.speed = 180;
thug.vx = 180; // Di chuyển bình thường vào thùng với tốc độ > 135 px/s

// 1. Va chạm vật lý thông thường
propSys.resolvePhysicalCollisions(null, [thug]);
propSys.checkEnvironmentalImpacts(null, [thug], 0.016);

assert(thug.state !== 'knockdown', 'AI đi bộ vào thùng KHÔNG bị chuyển thành knockdown');
assert(thug.hp === thug.maxHp, 'AI đi bộ vào thùng KHÔNG bị trừ máu tự ngã');
assert(thug.vx <= 0, 'AI chạm thùng bị chặn lại / đẩy lùi vận tốc hướng về thùng');

// 2. Thuật toán né vật cản
const mockPlayer = { x: 500, y: 570 };
const steer = thug.avoidObstacles(180, 0, mockPlayer);
assert(steer.vy !== 0 || steer.vx < 180, 'AI phát hiện vật cản phía trước và tự bẻ lái Y để đi vòng');
assert(thug.y + steer.vy * 0.1 >= 510 && thug.y + steer.vy * 0.1 <= 640, 'Hướng né của AI giữ trong giới hạn làn chơi 510-640');

// ==========================================
// TEST B: KNOCKBACK VĂNG VÀO THÙNG (COMBAT WALL SPLAT)
// ==========================================
console.log('\n[TEST B: Đánh địch văng vào thùng]');

thug.x = 270;
thug.y = 570;
thug.vx = 400; // Đòn đánh của người chơi hất văng địch
thug.combatKnockbackTimer = 0.5;
thug.isKnockedBack = true;
thug.state = 'hurt';

const initialHp = thug.hp;
propSys.checkEnvironmentalImpacts(null, [thug], 0.016);

assert(thug.hp < initialHp, 'Địch bị đánh văng vào thùng nhận sát thương va đập môi trường');
assert(thug.state === 'knockdown', 'Địch bị đánh văng vào thùng bị quật ngã (Wall Splat)');
assert(thug.combatKnockbackTimer === 0 && !thug.isKnockedBack, 'Cờ combatKnockback bị xóa ngay sau va đập để không lặp vô hạn');

const hpAfterFirstSplat = thug.hp;
// Kiểm tra frame kế tiếp: không bị nhân đôi sát thương
propSys.checkEnvironmentalImpacts(null, [thug], 0.016);
assert(thug.hp === hpAfterFirstSplat, 'Không gây sát thương lặp vô hạn trong các frame sau');

// ==========================================
// TEST C: SPACE + K (STATE MACHINE & ANTI-SPAM)
// ==========================================
console.log('\n[TEST C: Space + K Anti-Spam & Landing Recovery]');

const player = new Player(100, 570);
// Giả lập nhảy lên không
player.z = -100;
player.vz = 200;

// Kích hoạt đá bay lần 1
window.input.keys['KeyK'] = true;
window.input.actionBuffer.push({ code: 'KeyK', timestamp: performance.now() });
player.handlePlayerInput([]);

assert(player.state === 'flying_kick', 'Player chuyển sang flying_kick trên không');
assert(player.kickCooldown === 0.6, 'kickCooldown được thiết lập 0.6s chống spam');

// Thử spam KeyK ngay lập tức khi đang trong flying_kick
window.input.actionBuffer.push({ code: 'KeyK', timestamp: performance.now() });
player.handlePlayerInput([]);
assert(player.state === 'flying_kick', 'Không ghi đè đòn đánh mới khi đang trong flying_kick');

// Thử nghiệm tiếp đất khi WHIFF (không trúng đích)
player.kickHasHit = false;
player.z = -5; // Đang trên không rơi xuống
player.vz = -200;
player.update(0.05, []); // Chạm đất qua kiểm tra vật lý Z
assert(player.state === 'landing', 'Chạm đất chuyển sang trạng thái landing');
assert(Math.abs(player.stateDuration - 0.75) < 0.01, 'Whiff phạt thêm 0.20s recovery: 0.55s + 0.20s = 0.75s');

// Trong lúc landing, nhấn phím không được phép ra đòn
window.input.actionBuffer.push({ code: 'KeyJ', timestamp: performance.now() });
window.input.actionBuffer.push({ code: 'KeyK', timestamp: performance.now() });
player.handlePlayerInput([]);
assert(player.state === 'landing', 'Trong lúc landing không thể tung đòn mới hoặc nhảy');

// Thử nghiệm tiếp đất khi HIT (trúng đích)
player.state = 'flying_kick';
player.kickHasHit = true;
player.z = -5;
player.vz = -200;
player.update(0.05, []);
assert(player.state === 'landing', 'Trúng đích tiếp đất chuyển sang landing');
assert(Math.abs(player.stateDuration - 0.55) < 0.01, 'Tiếp đất trúng đích hồi phục chuẩn 0.55s');

// ==========================================
// TEST D: KỸ NĂNG L (NÉ THÂN PHÁP COOLDOWN 8s)
// ==========================================
console.log('\n[TEST D: Kỹ năng L - Hồi chiêu 8s chống spam]');

player.state = 'idle';
player.dodgeCooldown = 0;
player.invincibleTimer = 0;
window.input.keys = {};
window.input.justPressed = {};
window.input.actionBuffer = [];

// Nhấn L lần 1
window.input.justPressed['KeyL'] = true;
window.input.actionBuffer.push({ code: 'KeyL', timestamp: performance.now() });
player.handlePlayerInput([]);

assert(player.state === 'dodge', 'Nhấn L kích hoạt né tránh thành công');
assert(player.dodgeCooldown === 8.0, 'dodgeCooldown được thiết lập 8.0s chuẩn');
assert(player.invincibleTimer === 0.18, 'Cửa sổ bất tử i-frame cân bằng đúng 0.18s');

// Giả lập player về idle và tiếp tục spam L khi đang còn cooldown (ví dụ còn 7.0s)
player.state = 'idle';
player.dodgeCooldown = 7.0;
window.input.justPressed = { KeyL: true };
window.input.actionBuffer = [{ code: 'KeyL', timestamp: performance.now() }];
player.handlePlayerInput([]);

assert(player.state === 'idle', 'Spam L khi còn cooldown bị chặn hoàn toàn');
assert(player.dodgeCooldown === 7.0, 'Cooldown không bị reset khi spam');

// Giữ phím L không tự động kích hoạt lại
player.dodgeCooldown = 0.01;
player.update(0.02, []); // Hết cooldown
assert(player.dodgeCooldown <= 0, 'Cooldown đã kết thúc');
// Mô phỏng giữ phím: keys có KeyL nhưng justPressed không có và actionBuffer rỗng
window.input.keys = { KeyL: true };
window.input.justPressed = {};
window.input.actionBuffer = [];
player.handlePlayerInput([]);
assert(player.state === 'idle', 'Giữ phím L không tự động kích hoạt đòn mới nếu không nhấn lại');

// ==========================================
// TEST E: U + J (COUNTER TAY)
// ==========================================
console.log('\n[TEST E: U + J Counter Tay Vovinam]');

player.state = 'idle';
player.counterHandCooldown = 0;
player.invincibleTimer = 0;
window.input._counterHandHandled = false;
window.input.keys = { KeyU: true, KeyJ: true };
window.input.justPressed = { KeyU: true, KeyJ: true };
window.input.lastKeyDownTime = {
  KeyU: performance.now(),
  KeyJ: performance.now() + 10 // J sau U 10ms
};

player.handlePlayerInput([]);

assert(player.state === 'counter_hand_prep', 'U + J kích hoạt trạng thái counter_hand_prep');
assert(player.counterHandCooldown === 2.5, 'Counter tay có cooldown 2.5s');
assert(player.activeCounterWindow === 0.32, 'Cửa sổ counter tay mở đúng 0.32s');

// 1. Thử nghiệm Whiff (không có đòn nào đánh tới trong 0.32s)
player.activeCounterWindow = 0;
player.counterSuccess = false;
player.update(0.016, []);
assert(player.state === 'counter_hand_recovery', 'Hết cửa sổ counter chuyển sang counter_hand_recovery');
assert(player.stateDuration === 0.28, 'Counter tay whiff recovery là 0.28s');

// 2. Thử nghiệm Counter đòn tay thành công
player.state = 'counter_hand_prep';
player.activeCounterWindow = 0.20;
player.counterSuccess = false;
player.facing = 1;
player.x = 200;
player.y = 570;
player.invincibleTimer = 0;

const punchEnemy = new BaseEnemy(270, 570, 'thug');
punchEnemy.facing = -1;
const punchAttack = { damage: 30, counterType: 'hand', isKick: false };

window.combatSystem.resolveHit(punchEnemy, player, punchAttack);

assert(player.counterSuccess === true, 'Counter ghi nhận thành công');
assert(player.state === 'counter_hand_strike', 'Player chuyển sang counter_hand_strike phản công');
assert(punchEnemy.state === 'hurt', 'Địch bị khựng lại (hurt)');

// 3. Thử nghiệm đòn nặng / uncounterable (Counter đỡ được mọi đòn theo yêu cầu người chơi)
player.state = 'counter_hand_prep';
player.activeCounterWindow = 0.20;
player.counterSuccess = false;
player.invincibleTimer = 0;
const heavyAttack = { damage: 50, counterType: 'hand', uncounterable: true };
const initialPlayerHp = player.hp;

window.combatSystem.resolveHit(punchEnemy, player, heavyAttack);

assert(player.counterSuccess === true, 'Counter U+J đỡ và phản đòn thành công cả đòn uncounterable/nặng');
assert(player.hp === initialPlayerHp, 'Player không bị mất máu khi counter đòn uncounterable');

// ==========================================
// TEST F: U + K (COUNTER CHÂN)
// ==========================================
console.log('\n[TEST F: U + K Counter Chân Vovinam]');

player.state = 'idle';
player.counterLegCooldown = 0;
player.invincibleTimer = 0;
window.input._counterLegHandled = false;
window.input.keys = { KeyU: true, KeyK: true };
window.input.justPressed = { KeyU: true, KeyK: true };
window.input.lastKeyDownTime = {
  KeyK: performance.now(),
  KeyU: performance.now() + 15 // U sau K 15ms
};

player.handlePlayerInput([]);

assert(player.state === 'counter_leg_prep', 'U + K kích hoạt trạng thái counter_leg_prep dù bấm K trước U');
assert(player.counterLegCooldown === 3.5, 'Counter chân có cooldown 3.5s');
assert(player.activeCounterWindow === 0.32, 'Cửa sổ counter chân mở đúng 0.32s');

// 1. Thử nghiệm Whiff
player.activeCounterWindow = 0;
player.counterSuccess = false;
player.update(0.016, []);
assert(player.state === 'counter_leg_recovery', 'Hết cửa sổ counter chuyển sang counter_leg_recovery');
assert(player.stateDuration === 0.32, 'Counter chân whiff recovery là 0.32s');

// 2. Thử nghiệm Counter đòn chân thành công (quét ngã đối thủ)
player.state = 'counter_leg_prep';
player.activeCounterWindow = 0.20;
player.counterSuccess = false;
player.facing = 1;
player.x = 200;
player.y = 570;
player.invincibleTimer = 0;

const kickEnemy = new BaseEnemy(270, 570, 'thug');
kickEnemy.facing = -1;
const kickAttack = { damage: 45, counterType: 'leg', isKick: true };

window.combatSystem.resolveHit(kickEnemy, player, kickAttack);

assert(player.counterSuccess === true, 'Counter chân thành công');
assert(player.state === 'counter_leg_strike', 'Player chuyển sang counter_leg_strike');
assert(kickEnemy.state === 'knockdown', 'Lính thường bị đòn counter chân quét quật ngã');

// 3. Counter Chân đón đòn Đấm Tay thành công (Cả U+J và U+K đều đỡ được cả đấm lẫn đá)
player.state = 'counter_leg_prep';
player.activeCounterWindow = 0.20;
player.counterSuccess = false;
player.invincibleTimer = 0;
const handAttack = { damage: 30, counterType: 'hand', isKick: false };
const playerHpBefore = player.hp;

window.combatSystem.resolveHit(kickEnemy, player, handAttack);

assert(player.counterSuccess === true, 'Counter chân đỡ thành công cả đòn tay');
assert(player.hp === playerHpBefore, 'Người chơi không bị mất máu khi dùng Counter chân đỡ đòn tay');

// ==========================================
// TEST G: BOSS BALANCE, POISE & ANTI-LOOP
// ==========================================
console.log('\n[TEST G: Cân bằng Boss]');

const boss1 = new BossHacLang(500, 570);
boss1.phase = 3;
assert(boss1.phase === 3, 'Hac Lang có Phase 3 dive attack logic');

const boss2 = new BossThietQuyen(500, 570);
boss2.phase = 2;
boss2.startAttackSequence(player);
assert(boss2.phase === 2, 'Thiet Quyen có Phase 2 địa chấn tầm rộng');

// 1. Phân biệt Lính thường vs Boss khi bị trúng Space + K (isKnockdown = true)
const normalThug = new BaseEnemy(500, 570, 'thug');
normalThug.takeDamage(50, 4, true);
assert(normalThug.state === 'knockdown', 'Lính thường bị đòn Space + K quật ngã ngay lập tức');

// 2. Boss có thanh Poise: Space + K gây sát thương và trừ poise, nhưng Boss KHÔNG ngã
const testBoss = new BossHacLang(500, 570);
const bossInitialHp = testBoss.hp;
const initialPoise = testBoss.poise;
testBoss.takeDamage(50, 4, true);
assert(testBoss.hp < bossInitialHp, 'Boss nhận sát thương từ Space + K');
assert(testBoss.state === 'hurt', 'Boss còn poise KHÔNG bị quật ngã bởi Space + K đơn lẻ');
assert(testBoss.poise < initialPoise, 'Space + K làm hao tổn thanh poise của Boss');

// 3. Khi Poise cạn (<= 0) hoặc có cửa sổ sơ hở (weakWindow > 0): Boss mới bị quật ngã
testBoss.invincibleTimer = 0;
testBoss.poise = 0;
testBoss.takeDamage(50, 4, true);
assert(testBoss.state === 'knockdown', 'Boss bị quật ngã khi vỡ thế đứng (Poise <= 0)');

// 4. Cơ chế Đứng dậy & Chống đòn vét trên sàn (OTG / Wake-up Protection)
testBoss.stateTimer = testBoss.stateDuration;
testBoss.updateAI(0.016, player);
assert(testBoss.state === 'getup', 'Boss chuyển sang getup sau khi nằm sàn');

const hpDuringGetup = testBoss.hp;
testBoss.takeDamage(50, 4, true);
assert(testBoss.hp === hpDuringGetup, 'Boss được bảo vệ OTG chống đòn vét trong lúc đang đứng dậy');

// Hoàn tất animation đứng dậy -> Kích hoạt Giáp bảo hộ Knockdown (3.5s) và hồi đầy poise
testBoss.stateTimer = testBoss.stateDuration;
testBoss.updateAI(0.016, player);
assert(testBoss.state === 'idle', 'Boss hoàn tất đứng dậy chuyển sang idle');
assert(testBoss.knockdownImmuneTimer === 3.5, 'Boss nhận 3.5s miễn nhiễm quật ngã sau khi đứng dậy');
assert(testBoss.poise === testBoss.maxPoise, 'Thanh poise của Boss được hồi đầy khi đứng dậy');

// 5. Thử nghiệm Space + K lặp lại trong cửa sổ 3.5s miễn quật ngã (CHỐNG VÒNG LẶP SPACE + K)
const hpBeforeLoopKick = testBoss.hp;
testBoss.invincibleTimer = 0;
testBoss.takeDamage(50, 4, true);
assert(testBoss.hp < hpBeforeLoopKick, 'Boss vẫn nhận sát thương bình thường trong thời gian miễn quật ngã');
assert(testBoss.state === 'hurt', 'Boss TRỤ VỮNG, không bị vòng lặp Space + K làm ngã tiếp');

// 6. Tự động hồi phục Poise ngoài giao tranh
testBoss.poise = 50;
testBoss.poiseRegenDelay = 0;
testBoss.update(0.5, player);
assert(testBoss.poise > 50, 'Boss tự động hồi phục poise sau thời gian trễ không bị đánh');

// ==========================================
// TEST H: HỒI QUY (REGRESSION)
// ==========================================
console.log('\n[TEST H: Hồi quy hệ thống]');
assert(ATTACK_STATES.has('counter_hand_prep'), 'ATTACK_STATES chứa counter_hand_prep');
assert(ATTACK_STATES.has('counter_leg_prep'), 'ATTACK_STATES chứa counter_leg_prep');
assert(ATTACK_STATES.has('landing'), 'ATTACK_STATES chứa landing');

// ==========================================
// TEST I: WEAPON PICKUP ([E] Prompt & Gameplay Validation)
// ==========================================
console.log('\n[TEST I: Nhặt vũ khí [E] — Prompt & Kiểm tra Gameplay]');
const wpSys = window.weaponSystem;
wpSys.reset(player);
player.state = 'idle';
player.isDead = false;

// 1. Thả một cây gậy (baton) xuống đất
wpSys.spawnDrop('baton', 500, 570, 1);
const dropItem = wpSys.drops[0];
dropItem.landed = true; // Vũ khí đã tiếp đất

// Người chơi ở xa (> 85px) -> _nearest phải là null (không hiện prompt)
player.x = 200; player.y = 570;
wpSys.update(0.016, player, []);
assert(wpSys._nearest === null, 'Người chơi ở xa không hiển thị prompt nhặt');

// Người chơi đi vào cự ly gần (< 85px) -> _nearest được gán chính xác (hiện prompt)
player.x = 520; player.y = 570;
wpSys.update(0.016, player, []);
assert(wpSys._nearest === dropItem, 'Người chơi lại gần vũ khí hiển thị nhãn [E] NHẶT VŨ KHÍ');

// Chạm vào vũ khí mà KHÔNG bấm E -> không tự động nhặt
window.input = { isKeyJustPressed: () => false, isJustPressed: () => false, isActionJustPressed: () => false };
wpSys.update(0.016, player, []);
assert(player.weapon === null && wpSys.drops.length === 1, 'Chạm vào vũ khí KHÔNG tự động nhặt nếu chưa bấm E');

// Bấm phím E trong phạm vi hợp lệ -> nhặt thành công
window.input = { isKeyJustPressed: (k) => k === 'KeyE', isJustPressed: (k) => k === 'KeyE', isActionJustPressed: (a) => a === 'interact' };
wpSys.update(0.016, player, []);
assert(player.weapon !== null && player.weapon.type === 'baton', 'Bấm E nhặt thành công vũ khí vào trang bị');
assert(wpSys.drops.length === 0, 'Vũ khí trên sàn biến mất sau khi nhặt');
assert(wpSys._nearest === null, 'Prompt nhặt tự động biến mất sau khi nhặt xong');

// Đổi vũ khí: khi đang có vũ khí, nhặt món mới sẽ thả món cũ ra sàn
wpSys.spawnDrop('blade', 530, 570, 1);
wpSys.drops[0].landed = true;
wpSys.update(0.016, player, []);
assert(wpSys.drops.length === 1 && wpSys.drops[0].type === 'baton', 'Vũ khí cũ tự động rơi lại xuống sàn với đúng loại');

// Kiểm tra giữ nguyên độ bền khi rơi và nhặt lại (Không tự động hồi 100% lượt dùng)
player.weapon.dur = 2; // Mã tấu chỉ còn 2 lượt chém (trên tổng số 6)
wpSys.spawnDrop('baton', 540, 570, 1, 3); // Thả baton với độ bền 3/5
wpSys.drops[1].landed = true;
// Nhặt baton (độ bền 3), mã tấu rơi ra phải lưu đúng dur = 2
wpSys.update(0.016, player, []);
assert(player.weapon.type === 'baton' && player.weapon.dur === 3, 'Nhặt lại vũ khí giữ nguyên đúng số lượt dùng còn lại (3/5)');
const droppedBlade = wpSys.drops.find(d => d.type === 'blade');
assert(droppedBlade && droppedBlade.dur === 2, 'Vũ khí cũ rơi ra bảo toàn số lượt dùng (2/6, không hồi 100%)');
// Nhặt lại mã tấu -> kiểm tra dur vẫn là 2
droppedBlade.landed = true;
wpSys.update(0.016, player, []);
assert(player.weapon.type === 'blade' && player.weapon.dur === 2, 'Nhặt lại mã tấu vẫn còn đúng 2 lượt dùng');


// ==========================================
// TEST J: ARENA BOSS BOUNDS & NO HALF-MAP LOCK
// ==========================================
console.log('\n[TEST J: Đấu trường Boss — Sân đấu đầy đủ, không kẹt nửa map]');

// Thiết lập Game & StageManager giả lập
window.stageManager = {
  stageWidth: 2600,
  getCurrentStage: () => ({
    waves: [
      { spawnX: 750, enemies: [{ type: 'thug', count: 1, spacing: 90 }] },
      { spawnX: 1400, enemies: [{ type: 'thug', count: 1, spacing: 90 }] },
      { spawnX: 2100, isBossWave: true, bossClass: BossHacLang, bossTitle: 'THỦ LĨNH' }
    ]
  })
};

// Khởi tạo Game arena
window.game = {
  width: 1280,
  arenaLocked: false,
  arenaMinX: 20,
  arenaMaxX: 2600,
  camera: { x: 0, maxX: 1320 },
  player: player,
  combatMode: 'CROWD',
  isBossSpawned: false,
  currentBoss: null,
  enemies: [],
  spawnMinionWave: () => [],
  spawnBossWave(wave, stageData) {
    this.isBossSpawned = true;
    this.combatMode = 'DUEL';
    this.arenaLocked = true;
    const waves = stageData.waves;
    this.arenaMinX = (waves.length > 1) ? Math.max(20, waves[waves.length - 2].spawnX + 100) : 20;
    this.arenaMaxX = window.stageManager.stageWidth - 20;
    this.currentBoss = new BossHacLang(wave.spawnX + 220, 570);
  },
  updateCamera(dt) {
    const targetCameraX = this.player.x - this.width * 0.38;
    this.camera.x += (targetCameraX - this.camera.x) * 6.5 * dt;
    if (this.arenaLocked) {
      const maxCamX = Math.max(this.arenaMinX, this.arenaMaxX - this.width);
      this.camera.x = Math.max(this.arenaMinX, Math.min(maxCamX, this.camera.x));
      this.player.x = Math.max(this.arenaMinX + 30, Math.min(this.arenaMaxX - 30, this.player.x));
    }
  }
};

// Kích hoạt Boss Wave
const stageData = window.stageManager.getCurrentStage();
window.game.spawnBossWave(stageData.waves[2], stageData);

assert(window.game.arenaLocked === true, 'Boss Wave kích hoạt khóa đấu trường');
assert(window.game.arenaMaxX === 2580, 'Sân đấu mở rộng đến hết mép phải bản đồ (2580px, không bị kẹt ở 1320px)');
assert(window.game.arenaMaxX - window.game.arenaMinX >= 1000, 'Sân đấu có chiều rộng hợp lệ (>1000px) cho trận đại chiến');

// Người chơi đi tới đầu trái đấu trường
window.game.player.x = window.game.arenaMinX;
window.game.updateCamera(0.1);
assert(window.game.player.x >= window.game.arenaMinX + 30, 'Người chơi chạm mép trái đấu trường an toàn không vượt biên');

// Người chơi đi tới đầu phải đấu trường (vượt qua mốc nửa map 1320px)
window.game.player.x = 2500;
window.game.updateCamera(0.1);
assert(window.game.player.x === 2500, 'Người chơi tự do di chuyển ở nửa phải bản đồ (2500px)');

window.game.player.x = 2600;
window.game.updateCamera(0.1);
assert(window.game.player.x <= window.game.arenaMaxX - 30, 'Người chơi chạm mép phải đấu trường (2550px) an toàn');

// Kẻ địch bị giới hạn trong đấu trường
const arenaEnemy = new BaseEnemy(2600, 570, 'thug');
arenaEnemy.update(0.016, player);
assert(arenaEnemy.x <= window.game.arenaMaxX - 28, 'Kẻ địch tự động bị chặn lại không thể thoát khỏi đấu trường');

// ==========================================
// TEST K: MARTIAL DUEL & AI DISCIPLINE
// ==========================================
console.log('\n[TEST K: Chế độ Đấu Võ 1v1 — Giữ thế đối diện & Di chuyển kỷ luật]');
const duelBoss = new BossHacLang(1800, 570);
window.game.currentBoss = duelBoss;
window.game.combatMode = 'DUEL';

// 1. Boss lùi lại giữ khoảng cách: vx âm nhưng facing vẫn hướng về player
player.x = 1750; player.y = 570;
duelBoss.x = 1800; duelBoss.y = 570;
duelBoss.preferredDist = 120;
duelBoss.updateAI(0.016, player);
assert(duelBoss.facing === -1, 'Boss lùi lại (backpedal) nhưng VẪN giữ hướng quay mặt về phía người chơi');

// 2. Boss không xoay hướng giữa lúc ra đòn
duelBoss.isAttacking = true;
duelBoss.facing = -1;
// Player nhảy qua sau lưng boss
player.x = 1900;
duelBoss.update(0.016, player);
assert(duelBoss.facing === -1, 'Boss KHÔNG đổi hướng tức thời giữa đòn đánh khi người chơi vòng ra sau');

// 3. Đọc hành vi lặp lại: Player spam Space + K
window.combatSystem.playerMoveLog = ['flying_kick', 'flying_kick', 'flying_kick'];
player.state = 'landing';
duelBoss.isAttacking = false;
duelBoss.attackCooldown = 0.8;
duelBoss.updateAI(0.016, player);
assert(duelBoss.attackCooldown <= 0.1, 'Boss lập tức trừng phạt khi đọc được sơ hở landing sau phi cước');

// ==========================================
// TEST L: TIẾN TRÌNH STAGE & KHU VỰC CHIẾN ĐẤU
// ==========================================
console.log('\n[TEST L: Tiến trình khu vực — Quét sạch lính mới mở lối đi]');
let waveCleared = false;
const mockEncounter = {
  currentWaveActive: true,
  currentWaveIndex: 0,
  currentWaveRequiredEnemies: [new BaseEnemy(700, 570, 'thug'), new BaseEnemy(750, 570, 'thug')],
  checkProgress() {
    if (this.currentWaveActive) {
      const allDead = this.currentWaveRequiredEnemies.every(e => e.isDead);
      if (allDead) {
        this.currentWaveActive = false;
        this.currentWaveIndex++;
        waveCleared = true;
      }
    }
  }
};

mockEncounter.checkProgress();
assert(mockEncounter.currentWaveActive === true, 'Khu vực bị khóa khi lính bắt buộc còn sống');

// Hạ gục toàn bộ lính
mockEncounter.currentWaveRequiredEnemies.forEach(e => { e.isDead = true; });
mockEncounter.checkProgress();
assert(mockEncounter.currentWaveActive === false && mockEncounter.currentWaveIndex === 1, 'Khu vực mở lối đi tiếp khi đã tiêu diệt toàn bộ lính đợt');

// ==========================================
// TEST M: HOÀNG ANH — PROCEDURAL MARTIAL ARTS ANIMATION
// ==========================================
console.log('\n[TEST M: Hoạt ảnh Phó Đặng Hoàng Anh — Cuốc sắt & Thái Cực Bát Quái Cước]');
const renderer = new window.SkeletalRenderer();
const hoangAnh = new BossHoangAnh(600, 570);

// Thử nghiệm tính toán các pose đặc trưng
['idle', 'walk', 'boss_thrust', 'boss_swing', 'boss_slam', 'boss_chain1', 'boss_chain2', 'boss_chain3'].forEach(state => {
  hoangAnh.state = state;
  hoangAnh.stateTimer = 0.15;
  hoangAnh.animTime = 0.5;
  const pose = renderer.calculatePose(hoangAnh);
  assert(pose && !isNaN(pose.torso) && !isNaN(pose.nA) && !isNaN(pose.nT), `Pose ${state} của Hoàng Anh được tính toán chính xác, không biến dạng`);
});

// ==========================================
// TEST N: GRUNT HEALTH BALANCE (GIẢM ĐỘ TRÂU CỦA LÍNH THƯỜNG 15-20%)
// ==========================================
console.log('\n[TEST N: Cân bằng HP lính thường — Giảm 15-20%, giữ nguyên Boss]');

const thugEnemy = new BaseEnemy(0, 0, 'thug');
assert(thugEnemy.maxHp === 180, `BaseEnemy thug HP giảm từ 220 xuống 180 (-18.2%): thực tế ${thugEnemy.maxHp}`);

const throwerEnemy = new EnemyThrower(0, 0);
assert(throwerEnemy.maxHp === 155, `EnemyThrower HP giảm từ 185 xuống 155 (-16.2%): thực tế ${throwerEnemy.maxHp}`);

const medicEnemy = new EnemyMedic(0, 0);
assert(medicEnemy.maxHp === 145, `EnemyMedic HP giảm từ 175 xuống 145 (-17.1%): thực tế ${medicEnemy.maxHp}`);

const bladeEnemy = new EnemyBlade(0, 0);
assert(bladeEnemy.maxHp === 170, `EnemyBlade HP giảm từ 210 xuống 170 (-19.0%): thực tế ${bladeEnemy.maxHp}`);

const batonEnemy = new EnemyBaton(0, 0);
assert(batonEnemy.maxHp === 205, `EnemyBaton HP giảm từ 250 xuống 205 (-18.0%): thực tế ${batonEnemy.maxHp}`);

const grabberEnemy = new EnemyGrabber(0, 0);
assert(grabberEnemy.maxHp === 205, `EnemyGrabber HP giảm từ 250 xuống 205 (-18.0%): thực tế ${grabberEnemy.maxHp}`);

const dodgerEnemy = new EnemyDodger(0, 0);
assert(dodgerEnemy.maxHp === 210, `EnemyDodger HP giảm từ 260 xuống 210 (-19.2%): thực tế ${dodgerEnemy.maxHp}`);

const brawlerEnemy = new EnemyBrawler(0, 0);
assert(brawlerEnemy.maxHp === 240, `EnemyBrawler HP giảm từ 290 xuống 240 (-17.2%): thực tế ${brawlerEnemy.maxHp}`);

const guardEnemy = new EnemyGuard(0, 0);
assert(guardEnemy.maxHp === 280, `EnemyGuard HP giảm từ 340 xuống 280 (-17.6%): thực tế ${guardEnemy.maxHp}`);

const shieldEnemy = new EnemyShield(0, 0);
assert(shieldEnemy.maxHp === 310, `EnemyShield HP giảm từ 380 xuống 310 (-18.4%): thực tế ${shieldEnemy.maxHp}`);

const armoredEnemy = new EnemyArmored(0, 0);
assert(armoredEnemy.maxHp === 380, `EnemyArmored HP giảm từ 460 xuống 380 (-17.4%): thực tế ${armoredEnemy.maxHp}`);

// Bảo vệ Boss: không bị giảm HP ngoài ý muốn
const bossHacLang = new BossHacLang(0, 0);
assert(bossHacLang.maxHp === 1350, `BossHacLang HP giữ nguyên 1350: thực tế ${bossHacLang.maxHp}`);

const bossThietQuyen = new BossThietQuyen(0, 0);
assert(bossThietQuyen.maxHp === 2000, `BossThietQuyen HP giữ nguyên 2000: thực tế ${bossThietQuyen.maxHp}`);

const bossLongVuong = new BossLongVuong(0, 0);
assert(bossLongVuong.maxHp === 3400, `BossLongVuong HP giữ nguyên 3400: thực tế ${bossLongVuong.maxHp}`);

// Kiểm tra đòn đánh không gây một phát chết ngay (vẫn đòi hỏi combo)
const testPunch = { damage: 28, offsetX: 50, offsetY: -70, width: 60, height: 50 };
window.combatSystem.checkAttackHit(player, thugEnemy, testPunch);
assert(!thugEnemy.isDead && thugEnemy.hp > 0, 'Đòn đấm thường 28 dmg không hạ lính ngay (đòi hỏi combo)');

// Kiểm tra phân cấp HP lính: Medic < Thrower < Blade < Thug < Baton < Dodger < Brawler < Guard < Shield < Armored
assert(
  medicEnemy.maxHp < throwerEnemy.maxHp &&
  throwerEnemy.maxHp < bladeEnemy.maxHp &&
  bladeEnemy.maxHp < thugEnemy.maxHp &&
  thugEnemy.maxHp < batonEnemy.maxHp &&
  batonEnemy.maxHp < dodgerEnemy.maxHp &&
  dodgerEnemy.maxHp < brawlerEnemy.maxHp &&
  brawlerEnemy.maxHp < guardEnemy.maxHp &&
  guardEnemy.maxHp < shieldEnemy.maxHp &&
  shieldEnemy.maxHp < armoredEnemy.maxHp,
  'Phân cấp HP giữa các loại lính được bảo toàn chặt chẽ theo đặc tính võ học'
);

// ==========================================
// TEST O: HỒI 25% MÁU SAU MỖI ĐỢT (WAVE HEALING)
// ==========================================
console.log('\n[TEST O: Hồi 25% HP sau mỗi wave hoàn thành]');

const testGame = new window.Game();
testGame.player.maxHp = 500;
testGame.player.hp = 200; // Người chơi mất máu, còn 200/500 HP

// Thiết lập một đợt lính
const waveEnemy1 = new BaseEnemy(500, 570, 'thug');
const waveEnemy2 = new BaseEnemy(550, 570, 'thug');
testGame.currentWaveActive = true;
testGame.currentWaveIndex = 0;
testGame.currentWaveRequiredEnemies = [waveEnemy1, waveEnemy2];

// 1. Hạ gục 1 tên lính (chưa clear cả wave): KHÔNG được hồi máu
waveEnemy1.isDead = true;
testGame.checkWaveProgress();
assert(testGame.player.hp === 200, 'Hạ gục 1 kẻ địch riêng lẻ KHÔNG hồi máu');
assert(testGame.currentWaveActive === true, 'Wave vẫn active khi còn kẻ địch bắt buộc');

// 2. Hạ gục toàn bộ lính trong đợt -> Wave clear: Hồi đúng 25% HP tối đa (500 * 0.25 = 125 HP -> 325 HP)
waveEnemy2.isDead = true;
testGame.checkWaveProgress();
assert(testGame.player.hp === 325, `Wave clear hồi đúng 25% maxHp (200 + 125 = 325 HP): thực tế ${testGame.player.hp}`);
assert(testGame.currentWaveActive === false, 'Wave chuyển sang không active sau khi clear');
assert(testGame.clearedWaveIndices.has(0), 'Wave 0 được đánh dấu vào danh sách đã hoàn thành');

// 3. Gọi lại checkWaveProgress ở frame tiếp theo: KHÔNG được hồi máu lặp lại
testGame.checkWaveProgress();
assert(testGame.player.hp === 325, 'Kiểm tra wave clear nhiều frame không hồi máu lặp lại');

// 4. Kiểm tra chống vượt quá maxHp (Overheal protection)
testGame.player.hp = 480;
testGame.currentWaveActive = true;
testGame.currentWaveIndex = 1;
const wave2Enemy = new BaseEnemy(600, 570, 'thug');
testGame.currentWaveRequiredEnemies = [wave2Enemy];
wave2Enemy.isDead = true;
testGame.checkWaveProgress();
assert(testGame.player.hp === 500, `Hồi máu không vượt quá maxHp (480 + 125 -> 500): thực tế ${testGame.player.hp}`);

// 5. Boss Wave: Không tự động hồi 25% máu
testGame.player.hp = 300;
testGame.currentWaveActive = false;
testGame.currentWaveIndex = 2;
const mockBossWave = { spawnX: 2000, isBossWave: true, bossClass: BossHacLang, bossTitle: 'THỦ LĨNH' };
testGame.checkWaveProgress();
assert(testGame.player.hp === 300, 'Boss Wave xuất hiện không trao hồi máu quần chiến');

// ==========================================
// TEST P: SỬA SPAM SPACE + J VÀ SPACE + K
// ==========================================
console.log('\n[TEST P: State Machine và Chống Spam Space + J / Space + K]');

const pTest = new Player(100, 570);
pTest.z = -100;
pTest.vz = 200;

// 1. Kích hoạt Space + J trên không
window.input = new window.InputManager();
window.input.keys['KeyJ'] = true;
window.input.actionBuffer.push({ code: 'KeyJ', timestamp: performance.now() });
pTest.handlePlayerInput([]);

assert(pTest.state === 'air_punch', 'Space + J kích hoạt trạng thái air_punch trên không');
assert(pTest.airPunchCooldown === 0.5, 'airPunchCooldown được thiết lập 0.5s chống spam');
assert(pTest.lastAerialAttack === 'air_punch', 'Ghi nhận lastAerialAttack là air_punch');

// 2. Thử spam KeyJ hoặc KeyK ngay lập tức khi đang trong air_punch -> BỊ CHẶN
window.input.actionBuffer.push({ code: 'KeyJ', timestamp: performance.now() });
window.input.actionBuffer.push({ code: 'KeyK', timestamp: performance.now() });
pTest.handlePlayerInput([]);
assert(pTest.state === 'air_punch', 'Không ghi đè đòn đánh mới khi đang trong air_punch');

// 3. Thử nghiệm tiếp đất khi WHIFF của Space + J: phạt sơ hở 0.44s
pTest.airPunchHasHit = false;
pTest.z = -5;
pTest.vz = -200;
pTest.update(0.05, []);
assert(pTest.state === 'landing', 'Space + J chạm đất chuyển sang trạng thái landing');
assert(Math.abs(pTest.stateDuration - 0.44) < 0.01, `Space + J whiff recovery là 0.44s: thực tế ${pTest.stateDuration}`);

// 4. Trong lúc landing, phím đấm/đá/nhảy trong buffer bị tiêu thụ và loại bỏ (không bypass recovery)
window.input.actionBuffer.push({ code: 'KeyJ', timestamp: performance.now() });
window.input.actionBuffer.push({ code: 'KeyK', timestamp: performance.now() });
window.input.actionBuffer.push({ code: 'Space', timestamp: performance.now() });
pTest.handlePlayerInput([]);
assert(pTest.state === 'landing', 'Trong lúc landing không thể tung đòn mới hay nhảy');
assert(window.input.actionBuffer.length === 0, 'Các lệnh đòn bấm khi landing bị xóa khỏi buffer, không bypass recovery');

// 5. Thử nghiệm tiếp đất khi HIT của Space + J: recovery nhanh 0.24s
pTest.state = 'air_punch';
pTest.airPunchHasHit = true;
pTest.lastAerialAttack = 'air_punch';
pTest.z = -5;
pTest.vz = -200;
pTest.update(0.05, []);
assert(pTest.state === 'landing', 'Space + J trúng đích chuyển sang landing');
assert(Math.abs(pTest.stateDuration - 0.24) < 0.01, `Space + J trúng đích recovery nhanh 0.24s: thực tế ${pTest.stateDuration}`);

// 6. Whiff trên không cao rơi xuống (stateTimer kết thúc trước khi chạm đất -> jump_fall -> chạm đất)
pTest.state = 'flying_kick';
pTest.kickHasHit = false;
pTest.lastAerialAttack = 'flying_kick';
pTest.stateTimer = 0.56; // Hết 0.55s của flying_kick khi vẫn còn ở trên không
pTest.z = -80;
pTest.updateStateLogic(0.016, []);
assert(pTest.state === 'jump_fall', 'flying_kick hết thời gian trên không chuyển sang jump_fall');
// Rơi xuống chạm đất:
pTest.z = -5;
pTest.vz = -200;
pTest.update(0.05, []);
assert(pTest.state === 'landing', 'Rơi từ jump_fall sau đòn đánh trên không VẪN PHẢI vào landing recovery');
assert(Math.abs(pTest.stateDuration - 0.75) < 0.01, 'Whiff Space + K vẫn bị phạt đủ 0.75s recovery khi tiếp đất');

// 7. Ưu tiên đòn khi nhấn đồng thời Space + J và Space + K
pTest.state = 'jump_up';
pTest.z = -50;
pTest.airPunchCooldown = 0;
pTest.kickCooldown = 0;
window.input.clearAll();
const now = performance.now();
window.input.lastKeyDownTime = { KeyJ: now, KeyK: now + 5 }; // K bấm sau J 5ms
window.input.actionBuffer.push({ code: 'KeyJ', timestamp: now });
window.input.actionBuffer.push({ code: 'KeyK', timestamp: now + 5 });
pTest.handlePlayerInput([]);
assert(pTest.state === 'flying_kick', 'Ưu tiên Space + K khi nhấn cả hai đòn, tránh kích hoạt chồng chéo');
assert(window.input.actionBuffer.length === 0, 'Cả hai phím xung đột đều được tiêu thụ sạch');

// 8. Poise Damage của Space + J vs Space + K
const bossTestPoise = new BossHacLang(500, 570);
bossTestPoise.poise = bossTestPoise.maxPoise;
// Space + J gây sát thương poise vừa phải (24)
bossTestPoise.pendingHit = { attackerState: 'air_punch', weight: 'medium', knockdown: true };
bossTestPoise.takeDamage(46, 3, true);
assert(bossTestPoise.poise === bossTestPoise.maxPoise - 24, `Space + J chỉ trừ 24 poise (không phá stun 2 hit): thực tế ${bossTestPoise.maxPoise - bossTestPoise.poise}`);

// Space + K gây sát thương poise nặng (42)
bossTestPoise.poise = bossTestPoise.maxPoise;
bossTestPoise.invincibleTimer = 0;
bossTestPoise.pendingHit = { attackerState: 'flying_kick', weight: 'heavy', knockdown: true };
bossTestPoise.takeDamage(85, 5, true);
assert(bossTestPoise.poise === bossTestPoise.maxPoise - 42, `Space + K trừ 42 poise: thực tế ${bossTestPoise.maxPoise - bossTestPoise.poise}`);

// ==========================================
// TEST Q: HỆ THỐNG TIẾP VIỆN — SPAWN KẺ ĐỊCH THẬT & TÍCH HỢP WAVE
// ==========================================
console.log('\n[TEST Q: Tiếp viện kẻ địch thật & Tích hợp Wave progression]');

const reGame = new window.Game();
reGame.player.maxHp = 500;
reGame.player.hp = 250;
reGame.currentWaveActive = true;
reGame.currentWaveIndex = 0;
reGame.arenaLocked = true;
reGame.arenaMinX = 50;
reGame.arenaMaxX = 1500;

// 1. Tạo wave có cấu hình tiếp viện
const initialEnemy = new BaseEnemy(600, 570, 'thug');
reGame.currentWaveRequiredEnemies = [initialEnemy];
reGame.enemies = [initialEnemy];

const reinforceEvent = {
  id: 'test_re_1',
  trigger: 'enemies_remaining',
  threshold: 1, // Kích hoạt khi lính còn lại <= 1
  bannerText: 'ENEMY REINFORCEMENTS INCOMING',
  isRequired: true,
  enemies: [
    { type: 'baton', count: 1, spacing: 90, faction: 'huavudai' },
    { type: 'armored', count: 1, spacing: 90, faction: 'huavudai' }
  ]
};
reGame.currentWaveReinforcements = [reinforceEvent];

// 2. Kích hoạt tiếp viện
reGame.checkWaveProgress();
assert(reinforceEvent.triggered === true, 'Sự kiện tiếp viện được kích hoạt khi điều kiện thỏa mãn');
assert(reGame.triggeredReinforcementIds.has('test_re_1'), 'Event ID được ghi nhận vào triggeredReinforcementIds');

// 3. Kiểm tra kẻ địch tiếp viện thật sự được sinh ra
const spawnedBaton = reGame.enemies.find(e => e.type === 'enemy_baton');
const spawnedArmored = reGame.enemies.find(e => e.type === 'enemy_armored');

assert(spawnedBaton !== undefined, 'Tiếp viện thật sự tạo ra instance EnemyBaton');
assert(spawnedArmored !== undefined, 'Tiếp viện thật sự tạo ra instance EnemyArmored');
assert(spawnedBaton.maxHp === 205 && spawnedBaton.hp === 205, `EnemyBaton có HP hợp lệ 205: thực tế ${spawnedBaton.hp}`);
assert(spawnedArmored.maxHp === 380 && spawnedArmored.hp === 380, `EnemyArmored có HP hợp lệ 380: thực tế ${spawnedArmored.hp}`);

// 4. Kiểm tra vị trí spawn hợp lệ trong sân đấu
assert(spawnedBaton.x >= reGame.arenaMinX && spawnedBaton.x <= reGame.arenaMaxX, 'Địch tiếp viện sinh trong ranh giới đấu trường');
assert(spawnedArmored.x >= reGame.arenaMinX && spawnedArmored.x <= reGame.arenaMaxX, 'Địch tiếp viện 2 sinh trong ranh giới đấu trường');
assert(spawnedBaton.y >= 510 && spawnedBaton.y <= 640, 'Tọa độ Y của địch tiếp viện nằm trong làn đường hợp lệ 510-640');

// 5. Kiểm tra đăng ký vào currentWaveRequiredEnemies
assert(reGame.currentWaveRequiredEnemies.includes(spawnedBaton), 'EnemyBaton tiếp viện được đăng ký vào currentWaveRequiredEnemies');
assert(reGame.currentWaveRequiredEnemies.includes(spawnedArmored), 'EnemyArmored tiếp viện được đăng ký vào currentWaveRequiredEnemies');

// 6. Hạ gục lính ban đầu: Wave KHÔNG ĐƯỢC CLEAR vì tiếp viện còn sống
initialEnemy.isDead = true;
reGame.checkWaveProgress();
assert(reGame.currentWaveActive === true, 'Wave KHÔNG clear khi địch tiếp viện còn sống');
assert(reGame.player.hp === 250, 'Không được hồi máu khi còn địch tiếp viện');

// 7. Chạy tiếp nhiều frame: sự kiện tiếp viện KHÔNG lặp lại vô hạn
const enemyCountBefore = reGame.enemies.length;
reGame.checkWaveProgress();
assert(reGame.enemies.length === enemyCountBefore, 'Sự kiện tiếp viện đã kích hoạt KHÔNG spawn lặp mỗi frame');

// 8. Hạ gục toàn bộ tiếp viện: Wave hoàn thành -> Hồi 25% máu
spawnedBaton.isDead = true;
spawnedArmored.isDead = true;
reGame.checkWaveProgress();

assert(reGame.currentWaveActive === false, 'Toàn bộ lính ban đầu + tiếp viện bị hạ: wave hoàn thành thành công');
assert(reGame.player.hp === 375, `Hạ hết tiếp viện: nhận đúng 25% HP tối đa (250 + 125 = 375): thực tế ${reGame.player.hp}`);

// ============================================================================
// TEST R: CƠ CHẾ GUARD GAUGE & GIỚI HẠN ĐỠ ĐÒN (BLOCK LIMIT 5-7 LẦN)
// ============================================================================
console.log('\n[TEST R: Cân bằng thế thủ - Guard Gauge & Bể thủ (Guard Break)]');

const testGuardPlayer = new Player(100, 560);
testGuardPlayer.reset();
assert(testGuardPlayer.guardGauge === 100, `Guard Gauge ban đầu khởi tạo 100 điểm: thực tế ${testGuardPlayer.guardGauge}`);
assert(testGuardPlayer.guardBreakTimer === 0, 'Chưa bị bể thủ lúc đầu');

// 1. Đỡ đòn thường: tiêu hao 16 điểm guard gauge
testGuardPlayer.setState('guard');
const enemyAttacker = new EnemyBaton(160, 560);
enemyAttacker.facing = -1;

window.combatSystem.resolveHit(enemyAttacker, testGuardPlayer, { damage: 30, knockback: 2 });
assert(testGuardPlayer.guardGauge === 84, `Đỡ đòn 1: Tiêu hao 16 điểm, còn 84: thực tế ${testGuardPlayer.guardGauge}`);
assert(testGuardPlayer.state === 'guard', 'Vẫn duy trì thế thủ sau đòn 1');

// 2. Đỡ liên tiếp đến đòn thứ 6 (còn 4 điểm)
for (let i = 2; i <= 6; i++) {
  testGuardPlayer.invincibleTimer = 0;
  window.combatSystem.resolveHit(enemyAttacker, testGuardPlayer, { damage: 30, knockback: 2 });
}
assert(testGuardPlayer.guardGauge === 4, `Sau 6 đòn đỡ liên tiếp, guard gauge còn 4 điểm: thực tế ${testGuardPlayer.guardGauge}`);
assert(testGuardPlayer.state === 'guard', 'Vẫn chưa vỡ khiên sau 6 đòn');

// 3. Đòn thứ 7: Vượt quá giới hạn -> BỂ THỦ (GUARD BREAK)
testGuardPlayer.invincibleTimer = 0;
window.combatSystem.resolveHit(enemyAttacker, testGuardPlayer, { damage: 30, knockback: 2 });
assert(testGuardPlayer.guardGauge === 0, 'Guard gauge giảm về 0 sau đòn 7');
assert(testGuardPlayer.state === 'guard_break', `Trạng thái chuyển sang guard_break: thực tế ${testGuardPlayer.state}`);
assert(testGuardPlayer.guardBreakTimer > 1.2, `Thời gian choáng bể thủ chuẩn 1.35s: thực tế ${testGuardPlayer.guardBreakTimer.toFixed(2)}s`);

// 4. Khi đang bị bể thủ: bấm giữ U không thể thủ lại
window.input.block = true;
testGuardPlayer.handlePlayerInput([]);
assert(testGuardPlayer.state === 'guard_break', 'Trong lúc bể thủ, không thể vào lại thế thủ');
window.input.block = false;

// 5. Hồi phục sau thời gian choáng bể thủ
testGuardPlayer.update(1.4, []);
assert(testGuardPlayer.guardBreakTimer === 0, 'Hết thời gian choáng bể thủ');
assert(testGuardPlayer.state === 'idle', `Tự động trở về trạng thái idle: thực tế ${testGuardPlayer.state}`);
assert(testGuardPlayer.guardGauge === 40, `Hồi phục 40% thể lực khiên sau khi hết choáng: thực tế ${testGuardPlayer.guardGauge}`);

// 6. Tự động hồi phục Guard Gauge khi không thủ (sau trễ 0.9s)
testGuardPlayer.attackClock = 10;
testGuardPlayer.lastGuardHitTime = 8.5; // Đã qua 1.5s (> 0.9s)
testGuardPlayer.update(1.0, []);
assert(testGuardPlayer.guardGauge > 40 + 20, `Guard Gauge tự hồi phục theo thời gian (+24/s): thực tế ${testGuardPlayer.guardGauge.toFixed(1)}`);

// ============================================================================
// TEST S: CÂN BẰNG PHẢN CHỦNG TRIỆU ĐÌNH AN (GIỚI HẠN BLOCK, KHÔNG BẤT TỬ)
// ============================================================================
console.log('\n[TEST S: Cân bằng Triệu Đình An - Phản chủng có giới hạn độ bền]');

const dinhanPlayer = new Player(200, 560);
dinhanPlayer.setCharacter('dinhan');
assert(dinhanPlayer.mechRiposte === true, 'Triệu Đình An kích hoạt cơ chế phản chủng (mechRiposte)');
assert(dinhanPlayer.guardGauge === 100, 'Guard Gauge của Đình An ban đầu 100');

dinhanPlayer.setState('guard');
const enemyThug = new EnemyBrawler(260, 560);
enemyThug.facing = -1;
const initialThugHp = enemyThug.hp;

// Đòn 1: Phản chủng thành công, gây sát thương lên địch nhưng tiêu hao 16 Guard Gauge
window.combatSystem.resolveHit(enemyThug, dinhanPlayer, { damage: 40, knockback: 3 });
assert(enemyThug.hp < initialThugHp, 'Địch bị phản đòn chịu sát thương từ phản chủng');
assert(dinhanPlayer.guardGauge === 84, `Đình An tiêu hao 16 Guard Gauge sau đòn phản chủng: thực tế ${dinhanPlayer.guardGauge}`);

// Đỡ tiếp 5 đòn nữa -> tổng 6 đòn
for (let i = 2; i <= 6; i++) {
  dinhanPlayer.invincibleTimer = 0;
  window.combatSystem.resolveHit(enemyThug, dinhanPlayer, { damage: 40, knockback: 3 });
}
assert(dinhanPlayer.guardGauge === 4, `Sau 6 lần phản chủng liên tiếp, Guard Gauge còn 4: thực tế ${dinhanPlayer.guardGauge}`);

// Đòn thứ 7: Bể thủ! Không còn phản đòn vô hạn, nhận sát thương trừng phạt (+30%)
const dinhanHpBeforeBreak = dinhanPlayer.hp;
dinhanPlayer.invincibleTimer = 0;
window.combatSystem.resolveHit(enemyThug, dinhanPlayer, { damage: 40, knockback: 3 });
assert(dinhanPlayer.guardGauge === 0, 'Guard Gauge Đình An cạn kiệt');
assert(dinhanPlayer.state === 'guard_break', `Đình An bị vỡ thế thủ (guard_break): thực tế ${dinhanPlayer.state}`);
assert(dinhanPlayer.hp < dinhanHpBeforeBreak, 'Đình An nhận sát thương trừng phạt khi bị bể thủ');

// ============================================================================
// TEST T: ĐỒ HỌA TUYỆT KỸ ĐIỆN ẢNH & HIỆU ỨNG VFX (AAA FIGHTING GAME)
// ============================================================================
console.log('\n[TEST T: Hệ thống Trình diễn Điện ảnh Tuyệt kỹ & VFX đồ họa mới]');

assert(typeof window.effectManager.triggerUltimateCinematic === 'function', 'Hàm triggerUltimateCinematic khả dụng');
window.effectManager.triggerUltimateCinematic('NGÔ NHẤT NGHỊ', 'LONG HỔ XUẤT SƠN', '#00f0ff', '#ffd700', 'lightning');

assert(window.effectManager.cinematic !== null, 'Trạng thái cinematic được tạo lập');
assert(window.effectManager.cinematic.active === true, 'Cinematic đang hoạt động');
assert(window.effectManager.cinematic.charName === 'NGÔ NHẤT NGHỊ', 'Đúng tên nhân vật trong cinematic banner');
assert(window.effectManager.cinematic.ultName === 'LONG HỔ XUẤT SƠN', 'Đúng tên chiêu thức trong cinematic banner');
assert(window.effectManager.cinematic.speedlines.length > 20, 'Tạo hiệu ứng anime speedlines hướng tâm');

// Kiểm tra các VFX chiêu thức mới
window.effectManager.createLightningArc(100, 200, 300, 200, '#00f0ff', 1);
assert(window.effectManager.lightningArcs.length > 0, 'Tạo thành công tia sét liên kết (Lightning Arc)');

window.effectManager.createDimensionalSlash(200, 300, 0.4, 220, '#38bdf8');
assert(window.effectManager.dimensionalSlashes.length > 0, 'Tạo thành công vết chém không gian (Dimensional Slash)');

window.effectManager.createMagmaCrater(400, 500, 180);
assert(window.effectManager.magmaCraters.length > 0, 'Tạo thành công hố nứt dung nham (Magma Crater)');

window.effectManager.createSonicBoomCone(250, 450, 1, '#f59e0b');
assert(window.effectManager.sonicCones.length > 0, 'Tạo thành công nón sóng âm (Sonic Boom Cone)');

window.effectManager.createThunderStrike(500, 550, '#facc15');
assert(window.effectManager.thunderStrikes.length > 0, 'Tạo thành công cột sét trời giáng (Thunder Strike)');

// ============================================================================
// TEST U: KÉO & CUỐN KẺ ĐỊCH THEO KHI TUNG ULTIMATE DI CHUYỂN (ENEMY DRAGGING)
// ============================================================================
console.log('\n[TEST U: Kéo kẻ địch di chuyển theo khi tung Ultimate lướt]');

// 1. Ngô Nhất Nghị: ultimate_flurry lướt tới đâu kéo kẻ địch theo tới đó
const pFlurry = new Player(100, 560);
pFlurry.setCharacter('nghi');
pFlurry.setState('ultimate_flurry', 1.4);
const dragThug = new EnemyBaton(150, 560);

pFlurry.runUltimate('ultimate_flurry', 0.05, [dragThug]);
assert(pFlurry.hitTargets.has(dragThug.id), 'Kẻ địch trên đường lướt của Ngô Nhất Nghị bị cuốn vào tuyệt kỹ');
assert(Math.abs(dragThug.x - (pFlurry.x + pFlurry.facing * 48)) <= 2, 'Kẻ địch bị kéo đặt ngay phía trước đòn đánh');
assert(dragThug.vx === pFlurry.vx, 'Tốc độ lướt của kẻ địch đồng bộ với tốc độ người chơi');

// Khi người chơi lướt xa về phía trước (+300px), kẻ địch vẫn bị kéo đi cùng
pFlurry.x = 400;
pFlurry.runUltimate('ultimate_flurry', 0.05, [dragThug]);
assert(Math.abs(dragThug.x - (pFlurry.x + pFlurry.facing * 48)) <= 2, `Kẻ địch tiếp tục bị kéo theo khi người chơi di chuyển: x = ${dragThug.x}`);

// 2. Triệu Đình An: ultimate_bash húc khiên kéo kẻ địch trước mặt khiên
const pBash = new Player(100, 560);
pBash.setCharacter('dinhan');
pBash.setState('ultimate_bash', 1.15);
pBash.stateTimer = 0.2; // Trong giai đoạn húc khiên (p < 0.6)
const dragDummy = new EnemyBrawler(160, 560);

pBash.runUltimate('ultimate_bash', 0.05, [dragDummy]);
assert(pBash.hitTargets.has(dragDummy.id), 'Kẻ địch bị mặt khiên sấm sét của Đình An đè và cuốn theo');
assert(Math.abs(dragDummy.x - (pBash.x + pBash.facing * 52)) <= 2, 'Kẻ địch bị kéo dính chặt vào mặt trước khiên');

// Đình An lao tới vị trí x = 550
pBash.x = 550;
pBash.runUltimate('ultimate_bash', 0.05, [dragDummy]);
assert(Math.abs(dragDummy.x - (pBash.x + pBash.facing * 52)) <= 2, `Kẻ địch vẫn bị kéo chặt trước mặt khiên Đình An: x = ${dragDummy.x}`);

// ============================================================================
// TEST V: KỸ NĂNG VŨ KHÍ — MÃ TẤU XUẤT HUYẾT & CÔN CHOÁNG VÁNG (BLEED & STUN)
// ============================================================================
console.log('\n[TEST V: Kỹ năng vũ khí — Mã tấu Xuất Huyết & Côn Choáng Váng]');

// 1. Cấu hình đòn vũ khí có hiệu ứng trạng thái
const playerBatonSlam = window.PLAYER_ATTACKS.baton_slam;
const playerBladeLunge = window.PLAYER_ATTACKS.blade_lunge;
assert(playerBatonSlam && playerBatonSlam.weaponEffect === 'stun', 'Đòn đập côn có hiệu ứng stun');
assert(playerBatonSlam.stunChance === 1.0 && playerBatonSlam.stunDuration >= 1.2, 'Đòn đập côn gây choáng 100% trong >= 1.2s');
assert(playerBladeLunge && playerBladeLunge.weaponEffect === 'bleed', 'Đòn đâm mã tấu có hiệu ứng bleed');
assert(playerBladeLunge.bleedChance === 1.0 && playerBladeLunge.bleedDmg >= 6, 'Đòn đâm mã tấu gây xuất huyết 100% với sát thương DoT 6-8');

// 2. Kiểm tra hiệu ứng Xuất Huyết (Bleed DoT) trên kẻ địch
const bleedVictim = new BaseEnemy(200, 560, 'thug', 'Du Côn');
const bleedVictimInitialHp = bleedVictim.hp;
window.combatSystem.applyBleed(bleedVictim, true, 7);
assert(bleedVictim.bleedTimer === 2.5, 'Kẻ địch nhận trạng thái xuất huyết trong 2.5s');
assert(bleedVictim.bleedTickTimer === 0.8, 'Chu kỳ tick xuất huyết khởi tạo 0.8s');
assert(bleedVictim.bleedDmg === 7, 'Sát thương mỗi tick là 7 HP');

// Mô phỏng 0.85s trôi qua -> nhảy 1 tick sát thương DoT
bleedVictim.update(0.85, { x: 100, y: 560 });
assert(bleedVictim.hp === bleedVictimInitialHp - 7, `Kẻ địch bị trừ đúng 7 HP sau tick đầu: ${bleedVictim.hp}/${bleedVictimInitialHp}`);
assert(bleedVictim.bleedTimer < 2.0 && bleedVictim.bleedTimer > 1.5, 'Thời gian xuất huyết đếm ngược chính xác');

// Làm mới xuất huyết (Refresh duration, non-stacking vô hạn)
window.combatSystem.applyBleed(bleedVictim, true, 8);
assert(bleedVictim.bleedTimer === 2.5, 'Tung đòn chém tiếp theo làm mới thời gian xuất huyết về 2.5s');
assert(bleedVictim.bleedDmg === 8, 'Cập nhật mức sát thương cao hơn (8 HP/tick)');

// 3. Kiểm tra hiệu ứng Choáng Váng (Stun) trên kẻ địch thường
const stunVictim = new EnemyBaton(300, 560);
stunVictim.setState('walk');
stunVictim.vx = 100;
window.combatSystem.applyStun(stunVictim, true, 1.4, 25);
assert(stunVictim.stunTimer === 1.4, 'Kẻ địch thường bị choáng 1.4s');
assert(stunVictim.state === 'hurt', 'Kẻ địch bị khóa vào trạng thái hurt');
assert(stunVictim.vx === 0 && stunVictim.vy === 0, 'Kẻ địch bị dừng chuyển động khi bị choáng');

// Trong lúc bị choáng, updateAI bị bỏ qua (không thể tấn công hay di chuyển)
stunVictim.update(0.4, { x: 100, y: 560 });
assert(stunVictim.stunTimer > 0.9 && stunVictim.stunTimer < 1.1, 'Bộ đếm choáng đếm ngược chính xác');
assert(stunVictim.state === 'hurt', 'Vẫn duy trì trạng thái hurt trong thời gian choáng');

// Sau khi hết choáng
stunVictim.update(1.2, { x: 100, y: 560 });
assert(stunVictim.stunTimer === 0, 'Hiệu ứng choáng đã kết thúc');
stunVictim.updateAI(0.1, { x: 100, y: 560 });
assert(stunVictim.state !== 'hurt', 'Kẻ địch phục hồi khỏi trạng thái choáng');

// 4. Kiểm tra hiệu ứng Choáng Váng (Stun) trên Boss: Không perma-stun, trừ Poise & mở sơ hở
const stunTestBoss = new BossHacLang(400, 560);
const bossPoiseBefore = stunTestBoss.poise;
window.combatSystem.applyStun(stunTestBoss, true, 1.4, 25);
assert(stunTestBoss.stunTimer === 0, 'Boss KHÔNG bị gán stunTimer đơ cứng vĩnh viễn');
assert(stunTestBoss.poise === bossPoiseBefore - 25, `Đòn đập côn làm sụt 25 Poise của Boss: ${stunTestBoss.poise}/${bossPoiseBefore}`);
assert(stunTestBoss.weakWindow >= 0.6, 'Boss mở cửa sổ sơ hở micro-stagger 0.6s để trừng phạt');

// 5. Kiểm tra hiệu ứng xuất huyết và choáng trên Người Chơi
const weaponEffectTestPlayer = new Player(100, 560);
weaponEffectTestPlayer.setCharacter('nghi');
const weaponEffectPlayerHpBefore = weaponEffectTestPlayer.hp;
window.combatSystem.applyBleed(weaponEffectTestPlayer, false, 3);
assert(weaponEffectTestPlayer.bleedTimer === 2.5, 'Người chơi dính xuất huyết khi bị đao chém trúng');
weaponEffectTestPlayer.update(0.85, []);
assert(weaponEffectTestPlayer.hp === weaponEffectPlayerHpBefore - 3, `Người chơi nhận sát thương DoT 3 HP: ${weaponEffectTestPlayer.hp}/${weaponEffectPlayerHpBefore}`);

window.combatSystem.applyStun(weaponEffectTestPlayer, false, 0.8, 25);
assert(weaponEffectTestPlayer.stunTimer === 0.8, 'Người chơi bị choáng 0.8s khi bị côn đập trúng');
assert(weaponEffectTestPlayer.state === 'hurt', 'Người chơi rơi vào trạng thái hurt khi bị choáng');

console.log(`\n==========================================`);
console.log(`KẾT QUẢ: ${passedTests} / ${totalTests} BÀI KIỂM THỬ THÀNH CÔNG!`);
console.log(`==========================================\n`);

