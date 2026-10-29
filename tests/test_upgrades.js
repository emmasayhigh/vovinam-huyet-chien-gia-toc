/**
 * Test Suite for 6 New Major Game Features:
 * 1. Chế độ Luyện Võ (Training Mode)
 * 2. Màn Xếp Hạng Cuối Màn Chi Tiết (Detailed Stage End Ranking)
 * 3. Nhật Ký Điều Tra: Bảng Suy Luận (Deduction Board)
 * 4. Thử Thách Tái Đấu Boss (Boss Rematch)
 * 5. Đồng Minh Hỗ Trợ Ngắn Hạn & Co-op (Summonable Ally)
 * 6. Tutorial Trước Khi Bắt Đầu Chiến Dịch (Interactive Tutorial)
 */

// Mock browser environment
global.window = global;
global.window.addEventListener = () => {};
global.performance = { now: () => Date.now() };

// Mock localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: function (key) {
      return store[key] || null;
    },
    setItem: function (key, value) {
      store[key] = value.toString();
    },
    removeItem: function (key) {
      delete store[key];
    },
    clear: function () {
      store = {};
    }
  };
})();
global.localStorage = localStorageMock;

// Mock document
global.document = {
  getElementById: (id) => ({
    id,
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    appendChild: () => {},
    insertBefore: () => {},
    innerHTML: '',
    textContent: '',
    style: {}
  }),
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    id: '',
    className: '',
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    appendChild: () => {},
    insertBefore: () => {},
    innerHTML: '',
    textContent: '',
    style: {},
    setAttribute: () => {},
    getAttribute: () => null
  })
};

// Load dependencies
require('../js/entities/animation.js');
require('../js/combat/props.js');
require('../js/entities/enemy.js');
require('../js/combat/weapons.js');
require('../js/entities/bosses2.js');
require('../js/core/input.js');
require('../js/combat/combat.js');
require('../js/entities/player.js');
require('../js/data/stages.js');
require('../js/world/stageManager.js');
require('../js/world/stageRenderer.js');
require('../js/world/stages.js');
require('../js/core/save.js');
require('../js/ui/ranking.js');
require('../js/ui/training.js');
require('../js/features/deduction.js');
require('../js/features/bossRush.js');
require('../js/entities/allySystem.js');
require('../js/ui/tutorial.js');


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

console.log('====================================================');
console.log('--- TEST SUITE: 6 MAJOR UPGRADES & VERIFICATION ---');
console.log('====================================================\n');

// ==========================================
// SUITE 1: SAVEMANAGER & BACKWARD COMPATIBILITY
// ==========================================
console.log('[SUITE 1: SaveManager Data Integrity & Sanitization]');

const saveMgr = new SaveManager();
assert(SaveManager.SAVE_VERSION === 5, 'SaveManager SAVE_VERSION là 5');

// Test sanitization of old legacy save (Version 4 with missing fields)
const legacyData = {
  version: 4,
  highScore: 12000,
  maxCombo: 15,
  stagesUnlocked: 3,
  charactersUnlocked: ['nghi', 'hoanganh'],
  characterTrust: { hoanganh: 60, dunghai: 40, mocdang: 30, bichlam: 50 },
  storyFlags: {}
};
const sanitized = saveMgr.sanitize(legacyData);

assert(sanitized.stageBestRecords !== undefined, 'Sanitize tạo mới stageBestRecords nếu thiếu');
assert(sanitized.deductionsSolved !== undefined && Array.isArray(sanitized.deductionsSolved), 'Sanitize tạo deductionsSolved là mảng');
assert(sanitized.bossRecords !== undefined, 'Sanitize tạo mới bossRecords');
assert(sanitized.tutorialCompleted === false, 'Mặc định tutorialCompleted là false');
assert(sanitized.tutorialSkipped === false, 'Mặc định tutorialSkipped là false');
assert(sanitized.trainingDrillsCompleted !== undefined && Array.isArray(sanitized.trainingDrillsCompleted), 'Sanitize tạo mảng trainingDrillsCompleted');
assert(sanitized.trainingFreeUnlocked === false, 'Mặc định trainingFreeUnlocked là false');

// Test recordStageBest & getStageBest
saveMgr.data = sanitized;
saveMgr.recordStageBest(1, {
  rank: 'A',
  score: 16500,
  timeStr: '01:45',
  timeSec: 105,
  maxCombo: 18,
  hits: 42,
  hpPercent: 78,
  dodges: 3,
  counters: 2,
  sideDone: true
});

let rec = saveMgr.getStageBest(1);
assert(rec !== null && rec.rank === 'A' && rec.score === 16500, 'Lưu và đọc thành công kỷ lục Màn 1 (Hạng A, 16500đ)');

// Thử ghi đè kỷ lục kém hơn: rank B, score 12000 -> Không ghi đè rank
saveMgr.recordStageBest(1, { rank: 'B', score: 12000, timeStr: '02:10' });
rec = saveMgr.getStageBest(1);
assert(rec.rank === 'A' && rec.score === 16500, 'Kỷ lục thấp hơn KHÔNG làm tụt hạng cao nhất đã đạt được');

// Thử lập kỷ lục xuất sắc hơn: rank S, score 24200 -> Cập nhật thành công
saveMgr.recordStageBest(1, { rank: 'S', score: 24200, timeStr: '01:12' });
rec = saveMgr.getStageBest(1);
assert(rec.rank === 'S' && rec.score === 24200, 'Lập kỷ lục S ghi đè nâng hạng thành công');

// Test solveDeduction
const dedResult = saveMgr.solveDeduction('DED_EXPULSION_TRAP', { dunghai: 25, mocdang: -15 }, 'flag_test_expulsion');
assert(dedResult === true, 'solveDeduction trả về true khi giải lần đầu');
assert(saveMgr.data.deductionsSolved.includes('DED_EXPULSION_TRAP'), 'ID suy luận được lưu trong deductionsSolved');
assert(saveMgr.data.characterTrust.dunghai === 65, `Điểm tin cậy Dung Hải tăng đúng 25 (40+25=65): thực tế ${saveMgr.data.characterTrust.dunghai}`);
assert(saveMgr.data.characterTrust.mocdang === 15, `Điểm tin cậy Mộc Đăng giảm đúng 15 (30-15=15): thực tế ${saveMgr.data.characterTrust.mocdang}`);
assert(saveMgr.data.storyFlags['flag_test_expulsion'] === true, 'Cờ truyện flag_test_expulsion được kích hoạt true');

// Test recordBossBest
saveMgr.recordBossBest('boss_hac_lang', 'mod_titan', { rank: 'S', score: 18500, timeStr: '01:05', timeSec: 65 });
const bossRec = saveMgr.getBossBest('boss_hac_lang', 'mod_titan');
assert(bossRec !== null && bossRec.rank === 'S' && bossRec.score === 18500, 'Lưu và đọc thành công kỷ lục boss Hắc Lang với biến thể mod_titan');

// Test tutorial flags
saveMgr.completeTutorial();
assert(saveMgr.data.tutorialCompleted === true, 'completeTutorial gán tutorialCompleted = true');
assert(saveMgr.isTutorialNeeded() === false, 'Sau khi hoàn thành tutorial, isTutorialNeeded trả về false');

// ==========================================
// SUITE 2: RANKING SYSTEM & SCORING FORMULA
// ==========================================
console.log('\n[SUITE 2: RankingManager Công Thức Xếp Hạng Minh Bạch]');

const rankingMgr = new RankingManager();
window.saveManager = saveMgr;

// Test calculation for an S-Rank performance
const rawStatsS = {
  timeSec: 75, // 1m15s (< 90s -> +4000)
  playerHp: 480,
  playerMaxHp: 500, // 96% -> +3840
  maxCombo: 28, // 28 * 120 = +3360
  totalHits: 85, // 85 * 30 = +2550
  perfectDodges: 4, // 4 * 400 = +1600
  perfectCounters: 3, // 3 * 600 = +1800
  sideDone: true // +2000
};
// Base: 10,000 + 4000 + 3840 + 3360 + 2550 + 1600 + 1800 + 2000 = 29,150 pts
const resultS = rankingMgr.calculateScore(1, rawStatsS);

assert(resultS.totalScore >= 22000, `Tổng điểm S-rank đạt chuẩn >= 22,000: thực tế ${resultS.totalScore}`);
assert(resultS.rank === 'S', `Hạng được xếp là S: thực tế ${resultS.rank}`);
assert(resultS.medalClass === 'medal-gold', 'Hạng S nhận Huy Chương Vàng');
assert(resultS.timeStr === '01:15', `Format chuỗi thời gian đúng: thực tế ${resultS.timeStr}`);
assert(resultS.breakdown.baseScore === 5000, 'Điểm cơ bản là 5,000 pts');
assert(resultS.breakdown.counterScore === 1800, 'Điểm phản đòn hoàn hảo là 3 * 600 = 1,800 pts');
assert(resultS.rewards.length > 0, 'Có danh sách phần thưởng mở khóa cho màn chơi');

// Test calculation for a D-Rank performance (slow, low HP, low combo, no counters)
const rawStatsD = {
  timeSec: 360, // 6 mins (>= 267s -> +0)
  playerHp: 10,
  playerMaxHp: 500, // 2% -> +100
  maxCombo: 1, // 1 * 200 = +200
  totalHits: 5, // 5 * 20 = +100
  perfectDodges: 0,
  perfectCounters: 0,
  sideDone: false
};
// Base: 5000 + 0 + 100 + 200 + 100 = 5400 (< 7,000)
const resultD = rankingMgr.calculateScore(1, rawStatsD);
assert(resultD.rank === 'D', `Hạng điểm thấp xếp là D (< 7,000): thực tế ${resultD.rank} (${resultD.totalScore} pts)`);
assert(resultD.medalClass === 'medal-iron', 'Hạng D nhận Huy Hiệu Tập Sự');


// ==========================================
// SUITE 3: DEDUCTION BOARD (BẢNG SUY LUẬN)
// ==========================================
console.log('\n[SUITE 3: Nhật Ký Điều Tra - Bảng Suy Luận Họ Phó]');

const deductionMgr = new DeductionManager();

assert(Object.keys(deductionMgr.cards).length >= 19, `Kho thẻ có đủ ít nhất 19 thẻ: thực tế ${Object.keys(deductionMgr.cards).length}`);
assert(deductionMgr.deductions.length === 5, 'Có đúng 5 kết luận cốt truyện được định sẵn');

// Test correct deduction match (Order independent)
// DED_EXPULSION_TRAP requires: DOC_EXPULSION_ORDER, CHAR_MOCDANG, EVENT_SERVER_RAID
const matchCorrect = deductionMgr.checkDeductionMatch(['EVENT_SERVER_RAID', 'DOC_EXPULSION_ORDER', 'CHAR_MOCDANG']);
assert(matchCorrect !== null, 'Phát hiện suy luận đúng bất kể thứ tự chọn thẻ');
assert(matchCorrect.id === 'DED_EXPULSION_TRAP', `Khớp đúng kết luận DED_EXPULSION_TRAP: thực tế ${matchCorrect.id}`);

// Test incorrect deduction match (No penalty, neutral feedback)
const matchWrong = deductionMgr.checkDeductionMatch(['DOC_PHOTO_FAMILY', 'CHAR_VINHTAM', 'EVENT_SERVER_RAID']);
assert(matchWrong === null, 'Tổ hợp thẻ không khớp trả về null (suy luận sai)');

// Test executeDeduction updates SaveManager and returns result
deductionMgr.selectedCards.clear();
deductionMgr.selectedCards.add('DOC_CIPHER_CORE');
deductionMgr.selectedCards.add('CHAR_VINHTAM');
deductionMgr.selectedCards.add('EVENT_CORE_SALE');

const execRes = deductionMgr.executeDeduction();
assert(execRes.success === true, 'Thực hiện suy luận DED_MOCDANG_BURDEN thành công');
assert(saveMgr.isDeductionSolved('DED_MOCDANG_BURDEN') === true, 'Kết luận được lưu vào SaveManager');
assert(deductionMgr.getSolvedCount() >= 2, `Số lượng kết luận đã giải mã: ${deductionMgr.getSolvedCount()}`);

// ==========================================
// SUITE 4: BOSS REMATCH (THỬ THÁCH TÁI ĐẤU BOSS)
// ==========================================
console.log('\n[SUITE 4: Thử Thách Tái Đấu Boss]');

const bossRushMgr = new BossRushManager();

assert(bossRushMgr.bossDefs.length === 10, `Có đủ 10 Boss đại chiến: thực tế ${bossRushMgr.bossDefs.length}`);
assert(bossRushMgr.modifiers.length === 6, `Có đủ 6 biến thể thử thách: thực tế ${bossRushMgr.modifiers.length}`);

// Test boss unlock condition: Boss at Stage 4 is unlocked if stagesUnlocked >= 4
saveMgr.data.stagesUnlocked = 4;
assert(bossRushMgr.isBossUnlocked('haclang') === true, 'Boss Hắc Lang (Stage 1) đã mở khóa');
assert(bossRushMgr.isBossUnlocked('thietquyen') === true, 'Boss Thiết Quyền (Stage 2) đã mở khóa');
assert(bossRushMgr.isBossUnlocked('longvuong') === true, 'Boss Long Vương (Stage 4) đã mở khóa');
assert(bossRushMgr.isBossUnlocked('hoanganh') === false, 'Boss Hoàng Anh (Stage 8) vẫn đang khóa');

// Test modifier multipliers
bossRushMgr.selectedModifier = 'sudden_death'; // 2.0x
const mult = bossRushMgr.getActiveMultiplier();
assert(mult === 2.0, `Hệ số điểm Sudden Death là 2.0: thực tế ${mult}`);

// Test record score on victory
const brScore = bossRushMgr.calculateVictoryScore('haclang', 45, 100);
assert(brScore > 15000, `Điểm tái đấu thắng nhanh 100% HP đạt cao: thực tế ${brScore}`);


// ==========================================
// SUITE 5: ALLY SYSTEM (ĐỒNG MINH HỖ TRỢ NGẮN HẠN)
// ==========================================
console.log('\n[SUITE 5: Đồng Minh Hỗ Trợ Ngắn Hạn & Co-op]');

const allyMgr = new AllyManager();
assert(allyMgr.summonDuration === 25, 'Thời gian đồng minh hiện diện trên sân là 25 giây');
assert(allyMgr.summonCooldown === 35, 'Thời gian hồi chiêu đồng minh là 35 giây');

// Mặc định thanh đồng minh ban đầu chưa sẵn sàng
assert(allyMgr.isReady() === false, 'Thanh đồng minh ban đầu chưa nạp đầy');

// Sạc đầy thanh đồng minh
allyMgr.chargeGauge(100);
assert(allyMgr.isReady() === true, 'Thanh nạp 100% -> Sẵn sàng triệu hồi');

// Triệu hồi đồng minh Hoàng Anh
saveMgr.data.charactersUnlocked = ['nghi', 'hoanganh'];
const mockGamePlayer = { x: 400, y: 550, facing: 1, hp: 450, maxHp: 500, currentAttack: null };
window.game = { player: mockGamePlayer, enemies: [] };

const summoned = allyMgr.summonAlly('hoanganh', mockGamePlayer);
assert(summoned === true, 'Triệu hồi đồng minh Hoàng Anh thành công');
assert(allyMgr.activeAlly !== null, 'Có instance SummonedAlly hoạt động trên sân');
assert(allyMgr.activeAlly.characterKey === 'hoanganh', 'Đúng nhân vật Hoàng Anh');
assert(allyMgr.activeAlly.duration === 25, 'Đồng minh được cấp 25 giây hoạt động');

// Kiểm tra đòn đặc trưng theo nhân vật
assert(allyMgr.activeAlly.trait === 'rapid_strikes', 'Đặc tính của Hoàng Anh là áp sát & chuỗi đòn cuốc sắt nhanh (rapid_strikes)');

// Kiểm tra Co-op Dual Attack trigger
// Tạo một kẻ địch ở gần cả người chơi và đồng minh
const nearbyEnemy = { x: 450, y: 550, hp: 200, takeDamage: (dmg) => { nearbyEnemy.hp -= dmg; } };
window.game.enemies = [nearbyEnemy];
allyMgr.activeAlly.x = 420;
allyMgr.activeAlly.y = 550;

mockGamePlayer.currentAttack = { name: 'punch', damage: 30 };
const coopFired = allyMgr.checkCoopTrigger(mockGamePlayer);
assert(coopFired === true, 'Kích hoạt thành công chiêu phối hợp SONG LONG XUẤT HẢI khi người chơi tấn công gần đồng minh');
assert(nearbyEnemy.hp < 200, 'Kẻ địch nhận thêm sát thương liên kích từ chiêu phối hợp');

// Đồng minh rời sân sau khi hết thời gian
allyMgr.update(25.1, mockGamePlayer, [nearbyEnemy]);
assert(allyMgr.activeAlly === null, 'Đồng minh tự động rời sân khi hết thời gian 25 giây');
assert(allyMgr.cooldown === 35, 'Hồi chiêu 35 giây bắt đầu đếm ngược');

// ==========================================
// SUITE 6: TRAINING & INTERACTIVE TUTORIAL
// ==========================================
console.log('\n[SUITE 6: Luyện Võ & Tutorial Tân Thủ]');

const trainingMgr = new TrainingManager();
assert(trainingMgr.drills.length === 7, `Chế độ Luyện Võ có đủ 7 bài tập cơ bản: thực tế ${trainingMgr.drills.length}`);

// Test TrainingDummy
const dummy = new window.TrainingDummy(600, 570);
assert(dummy instanceof window.TrainingDummy, 'Có dummy hồi phục máu không thể chết vĩnh viễn');

// Test Dummy HP regeneration
dummy.hp = 100;
dummy.update(1.0, mockGamePlayer);
assert(dummy.hp > 100, `Dummy tự động hồi phục máu sau khi bị đánh: thực tế ${dummy.hp}`);

// Test Training Menu Toggle Collapse (Ẩn / Bật menu tùy chỉnh luyện võ)
assert(trainingMgr.isMenuCollapsed === false, 'Mặc định menu tùy chỉnh luyện võ ở trạng thái mở');
trainingMgr.toggleMenuCollapse();
assert(trainingMgr.isMenuCollapsed === true, 'Kích hoạt toggleMenuCollapse: Menu được thu gọn thành công');
trainingMgr.toggleMenuCollapse();
assert(trainingMgr.isMenuCollapsed === false, 'Kích hoạt toggleMenuCollapse lần 2: Menu được mở rộng trở lại');

// Test Overlay DOM rendering when collapsed vs expanded
let overlayClassSet = new Set(['training-overlay']);
let innerHTMLContent = '';
const mockOverlay = {
  id: 'training-hud-overlay',
  className: 'training-overlay',
  classList: {
    add: (c) => overlayClassSet.add(c),
    remove: (c) => overlayClassSet.delete(c),
    contains: (c) => overlayClassSet.has(c)
  },
  get innerHTML() { return innerHTMLContent; },
  set innerHTML(html) { innerHTMLContent = html; },
  querySelector: (sel) => {
    if (sel.startsWith('#')) {
      const id = sel.substring(1);
      return innerHTMLContent.includes(`id="${id}"`) ? { addEventListener: () => {} } : null;
    }
    return null;
  }
};
trainingMgr.overlay = mockOverlay;

trainingMgr.toggleMenuCollapse(true);
assert(mockOverlay.classList.contains('collapsed'), 'Thêm class collapsed vào overlay khi thu gọn');
assert(mockOverlay.querySelector('#btn-expand-training-menu') !== null, 'Tạo nút viên thuốc mở rộng floating dock khi thu gọn');

trainingMgr.toggleMenuCollapse(false);
assert(!mockOverlay.classList.contains('collapsed'), 'Loại bỏ class collapsed khi mở rộng menu');
assert(mockOverlay.querySelector('#btn-collapse-training-menu') !== null, 'Có nút thu gọn [C] ở header khi menu mở rộng');
assert(mockOverlay.querySelector('#btn-collapse-training-menu-bottom') !== null, 'Có nút ẨN MENU ĐỂ ĐẤU ở danh sách thao tác dưới cùng');
assert(mockOverlay.querySelector('#tab-mode-free') !== null, 'Có thanh Tab chuyển sang Luyện Tập Tự Do');
assert(mockOverlay.querySelector('#tab-mode-drills') !== null, 'Có thanh Tab chuyển sang 7 Bài Khảo Hạch');
assert(mockOverlay.querySelector('#btn-training-reset-pos') !== null, 'Có nút ĐẶT LẠI VỊ TRÍ [R] tức thì');

// Test switching modes and drill selection dropdown
trainingMgr.switchToDrillMode(2);
assert(trainingMgr.mode === 'drill', 'Chuyển sang chế độ drill thành công');
assert(trainingMgr.currentDrillIndex === 2, 'Nhảy trực tiếp đến Bài 3 thành công');
assert(mockOverlay.querySelector('#training-drill-select') !== null, 'Có dropdown chọn nhảy bài tập trực tiếp trong Drill mode');

trainingMgr.switchToFreeMode();
assert(trainingMgr.mode === 'free', 'Chuyển sang chế độ free sandbox thành công');
assert(mockOverlay.querySelector('#telemetry-last-dmg') !== null, 'Có bảng đo đòn cuối trong Free Sandbox');
assert(mockOverlay.querySelector('#telemetry-combo-dmg') !== null, 'Có bảng đo sát thương combo trong Free Sandbox');

// Test telemetry damage recording
trainingMgr.recordDummyDamage(250);
assert(trainingMgr.lastDamage === 250, 'Ghi nhận đòn đánh 250 dmg');
assert(trainingMgr.currentComboDamage === 250, 'Tích lũy combo damage 250');
trainingMgr.recordDummyDamage(350);
assert(trainingMgr.currentComboDamage === 600, 'Tích lũy combo damage 600');
assert(trainingMgr.maxComboDamage === 600, 'Cập nhật kỷ lục combo damage 600');

// Test reset positions
trainingMgr.dummy = new TrainingDummy(100, 200);
trainingMgr.resetPositions();
assert(trainingMgr.dummy.x === 500 && trainingMgr.dummy.y === 580, 'Reset vị trí mộc nhân về (500, 580)');
assert(trainingMgr.currentComboDamage === 0, 'Reset combo damage về 0');

// Test Player Immortality in Training Mode
trainingMgr.isActive = true;
window.trainingManager = trainingMgr;
const testPlayer = new Player();
testPlayer.hp = 100;
testPlayer.maxHp = 100;
testPlayer.takeDamage(9999);
assert(testPlayer.hp > 0, 'Người chơi được bảo hộ bất tử, không chết trong Võ Đường');
assert(testPlayer.isDead === false, 'Người chơi không bị kích hoạt Game Over trong Võ Đường');


// Test Tutorial steps
const tutMgr = new TutorialManager();
assert(tutMgr.steps.length === 10, `Tutorial tân thủ có đủ 10 bước hướng dẫn: thực tế ${tutMgr.steps.length}`);

// Test skipping tutorial transitions
tutMgr.skipTutorial();
assert(saveMgr.data.tutorialSkipped === true, 'Bỏ qua tutorial lưu cờ tutorialSkipped = true vào SaveManager');
assert(tutMgr.isTutorialNeeded() === false, 'Sau khi bỏ qua, isTutorialNeeded trả về false');

console.log('\n====================================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${passedTests} / ${totalTests} BÀI THÀNH CÔNG RỰC RỠ!`);
console.log('====================================================\n');
