const assert = require('assert');

// 1. Mock browser environment
global.window = global;
global.performance = { now: () => Date.now() };

// Load SaveManager
require('../js/core/save.js');
const save = new window.SaveManager();
global.saveManager = save;

console.log('--- TEST 1: SYNCED CHARACTER & ALLY UNLOCKS ---');

// Fresh state: only 'nghi' is unlocked by default
assert.strictEqual(save.isCharacterUnlocked('nghi'), true, 'Nghi is unlocked by default');
assert.strictEqual(save.isCharacterUnlocked('dinhan'), false, 'Dinh An starts locked');
assert.strictEqual(save.isAllyUnlocked('dinhan'), false, 'Ally Dinh An starts locked');

// Unlock character -> automatically unlocks ally
save.unlockCharacter('dinhan');
assert.strictEqual(save.isCharacterUnlocked('dinhan'), true, 'Character Dinh An is now unlocked');
assert.strictEqual(save.isAllyUnlocked('dinhan'), true, 'Ally Dinh An is simultaneously unlocked');
console.log('✓ Character unlock simultaneously unlocks Ally');

// Unlock ally -> automatically unlocks character
save.unlockAlly('huavudai');
assert.strictEqual(save.isAllyUnlocked('huavudai'), true, 'Ally Hua Vu Dai unlocked');
assert.strictEqual(save.isCharacterUnlocked('huavudai'), true, 'Character Hua Vu Dai simultaneously unlocked');
console.log('✓ Ally unlock simultaneously unlocks Character');

// Moc Dang is available as clan advisor from Stage >= 2
save.data.currentStage = 2;
assert.strictEqual(save.isAllyUnlocked('mocdang'), true, 'Moc Dang is available when currentStage >= 2');
console.log('✓ Moc Dang is available as tactical ally from Act 1 Stage 2');

console.log('\n--- TEST 2: ALLY COMBAT, INFINITE DURATION & ENEMY TARGETING ---');

// Load allySystem
require('../js/entities/allySystem.js');
const ally = new window.SummonedAlly('hoanganh', 400, 560);

// Check infinite duration
assert.strictEqual(ally.duration, Infinity, 'Ally duration is Infinite (no 25s despawn timer)');
assert.strictEqual(ally.maxDuration, Infinity, 'Max duration is Infinite');
console.log('✓ Ally duration is Infinite (chét là hết)');

// Check ally HP & taking damage
const initialHp = ally.hp;
ally.takeDamage(100);
assert(ally.hp < initialHp, 'Ally HP reduces when taking damage');
console.log(`✓ Ally takes damage: ${initialHp} -> ${ally.hp} HP`);

// Check death logic
ally.takeDamage(9999);
assert.strictEqual(ally.hp, 0, 'Ally HP drops to 0');
assert.strictEqual(ally.isDead, true, 'Ally enters isDead state');
console.log('✓ Ally dies only when HP hits 0');

console.log('\n--- TEST 3: NGHI EXTENDED MOVES (UPPERCUT, ELBOW STRIKE, SCISSOR KICK) ---');

require('../js/entities/roster.js');
require('../js/ui/menu/charSlots.js');

const nghiSlot = window.CHAR_SLOTS.find(s => s.id === 'nghi');
assert(nghiSlot, 'Nghi slot found');
assert.strictEqual(nghiSlot.passives.length, 4, 'Nghi has 4 passives');
assert(nghiSlot.skills.some(s => s.name.includes('Đấm Móc & Đánh Chỏ')), 'Skill describes W+J / S+J correctly');
assert(nghiSlot.skills.some(s => s.name.includes('Đòn Chân Kẹp Vovinam')), 'Skill describes Scissor Kick accurately');
console.log('✓ Character slot skills accurately describe Uppercut, Elbow Strike, and Scissor Kick');

console.log('\n--- TEST 4: THU HỒI ĐỒNG MINH SAU 5S (CHẠY ĐI / NHẢY LÊN TRỜI), BUFF NGÔ NHẤT NGHỊ & NÉ [L] GIẢM 50% HỒI CHIÊU ---');

if (!global.document) {
  global.document = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  };
}
global.game = {
  player: { x: 400, y: 580, facing: 1, hp: 1000, maxHp: 1000, dmgMul: 1 },
  enemies: [],
  camera: { x: 0, y: 0 }
};

const mgrRecall = new window.AllyManager();
mgrRecall.cooldown = 0;
mgrRecall.gauge = 100;
assert.strictEqual(mgrRecall.summonAlly('bichlam', global.game.player), true, 'Gọi đồng minh Bích Lâm thành công');
assert.ok(mgrRecall.activeAlly && mgrRecall.activeAlly.fieldTime === 0, 'fieldTime khởi tạo bằng 0s');
assert.strictEqual(mgrRecall.activeAlly.isEntering, true, 'Vừa gọi ra đồng minh phải đang chạy vào (isEntering = true)');
assert.strictEqual(mgrRecall.activeAlly.state, 'run', 'Vừa gọi ra đồng minh phải ở trạng thái run');
assert.strictEqual(mgrRecall.activeAlly.isInvulnerable(), true, 'Khi chạy vào đồng minh phải bất tử');
const hpDuringEntry = mgrRecall.activeAlly.hp;
mgrRecall.activeAlly.takeDamage(300);
assert.strictEqual(mgrRecall.activeAlly.hp, hpDuringEntry, 'Đánh trúng đồng minh lúc đang chạy vào không được mất máu');

// 4a. Trước 5s -> hoàn tất chạy vào, hết bất tử, nhưng chưa đủ 5s nên chưa cho thu hồi
mgrRecall.update(2.5, global.game.player, []);
assert.strictEqual(mgrRecall.activeAlly.isEntering, false, 'Sau khi chạy vào xong, isEntering phải tắt');
assert.strictEqual(mgrRecall.activeAlly.isInvulnerable(), false, 'Sau khi chạy vào xong, đồng minh hết bất tử');
assert.strictEqual(mgrRecall.activeAlly.x, mgrRecall.activeAlly.entryTargetX, 'Đồng minh chạy vào đúng vị trí mục tiêu');
assert.strictEqual(mgrRecall.canRecall(), false, 'Chưa đủ 5s nên chưa thể thu hồi đồng minh');
assert.strictEqual(mgrRecall.recallAlly(), false, 'Gọi thu hồi lúc 2.5s phải trả về false');
assert.ok(mgrRecall.activeAlly !== null, 'Đồng minh vẫn ở lại chiến đấu khi chưa đủ 5s');

// 4b. Sau 5s -> bấm thu hồi mặc định chạy đi rời sân & bất tử trong lúc chạy ra
mgrRecall.update(2.6, global.game.player, []);
assert.strictEqual(mgrRecall.canRecall(), true, 'Sau 5.1s trên sân, cho phép thu hồi đồng minh');
const startRunX = mgrRecall.activeAlly.x;
const hpBeforeRetreat = mgrRecall.activeAlly.hp;
assert.strictEqual(mgrRecall.recallAlly(), true, 'Thu hồi đồng minh lúc >= 5s mặc định chạy đi rời sân');
assert.strictEqual(mgrRecall.activeAlly, null, 'activeAlly được giải phóng ngay khi thu về');
assert.ok(mgrRecall.retreatingAlly && mgrRecall.retreatingAlly.exitMode === 'run' && mgrRecall.retreatingAlly.state === 'run', 'Đồng minh mặc định chuyển sang trạng thái chạy đi rời sân');
assert.strictEqual(mgrRecall.retreatingAlly.isRetreating, true, 'isRetreating phải bật khi chạy ra');
assert.strictEqual(mgrRecall.retreatingAlly.isInvulnerable(), true, 'Khi chạy ra đồng minh phải bất tử');
mgrRecall.retreatingAlly.takeDamage(300);
assert.strictEqual(mgrRecall.retreatingAlly.hp, hpBeforeRetreat, 'Đánh trúng đồng minh lúc đang chạy ra không được mất máu');
mgrRecall.update(0.25, global.game.player, []);
assert.notStrictEqual(mgrRecall.retreatingAlly.x, startRunX, 'Đồng minh thực sự chạy dịch chuyển rời khỏi màn hình');

// 4c. Thu hồi chế độ nhảy lên trời (mode = 'leap')
mgrRecall.cooldown = 0;
mgrRecall.gauge = 100;
mgrRecall.retreatingAlly = null;
assert.strictEqual(mgrRecall.summonAlly('hoanganh', global.game.player), true, 'Triệu hồi Hoàng Anh thành công');
mgrRecall.update(5.1, global.game.player, []);
assert.strictEqual(mgrRecall.recallAlly('leap'), true, 'Thu hồi thành công (chế độ nhảy lên trời)');
assert.ok(mgrRecall.retreatingAlly && mgrRecall.retreatingAlly.exitMode === 'leap' && mgrRecall.retreatingAlly.state === 'jump_up', 'Đồng minh chuyển sang trạng thái jump_up nhảy lên trời');
mgrRecall.update(0.2, global.game.player, []);
assert.ok(mgrRecall.retreatingAlly.z < -100, `Đồng minh bay vọt lên trời (z = ${mgrRecall.retreatingAlly.z})`);

// 4d. Buff Ngô Nhất Nghị (noWhiffStun) & Né [L] thành công giảm 50% hồi chiêu
if (typeof global.window.addEventListener !== 'function') global.window.addEventListener = () => {};
require('../js/core/effects.js');
require('../js/core/input.js');
require('../js/entities/characters/bootstrap.js');
require('../js/entities/characters/nghi.js');
require('../js/combat/combat.js');
require('../js/entities/player/playerBase.js');
require('../js/entities/player/playerDamage.js');
require('../js/entities/player/playerUltimate.js');
require('../js/entities/player/playerInput.js');
require('../js/entities/player.js');
if (!global.window.input && global.window.InputManager) global.window.input = new global.window.InputManager();
if (!global.window.combatSystem && global.window.CombatSystem) global.window.combatSystem = new global.window.CombatSystem();

const nghi = new window.Player(300, 580).setCharacter('nghi');
global.game.player = nghi;
assert.strictEqual(nghi.noWhiffStun, true, 'Ngô Nhất Nghị được bật noWhiffStun (miễn choáng/khựng khi hụt chiêu)');

// Hụt Counter U+J không bị kẹt recovery
nghi.state = 'counter_hand_prep';
nghi.activeCounterWindow = 0;
nghi.counterSuccess = false;
nghi.updateStateLogic(0.016, []);
assert.strictEqual(nghi.state, 'idle', 'Ngô Nhất Nghị hụt Counter về thẳng idle, không bị choáng recovery');

// Cạn thể lực không bị choáng Kiệt Sức
nghi.stamina = 4;
nghi.spendStamina('kick_sweep');
assert.strictEqual(nghi.exhaustTimer, 0, 'Ngô Nhất Nghị không bị trạng thái Kiệt Sức khi hết thể lực');
assert.ok(nghi.stamina >= 40, 'Ngô Nhất Nghị tự điều tức hồi ngay 40 Thể Lực');

// Né [L] thành công giảm 50% cooldown
nghi.dodgeCooldown = 8.0;
nghi.state = 'dodge';
window.combatSystem.triggerPerfectDodge(nghi);
assert.strictEqual(nghi.dodgeCooldown, 4.0, 'Dùng [L] né thành công giảm ngay 1 nửa hồi chiêu (8.0s -> 4.0s)');

console.log('\n==========================================');
console.log('ALL NEW V5 ALLY & MOVES TESTS PASSED 100%!');
console.log('==========================================');

