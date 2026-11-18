/**
 * Test: Đảm bảo Ngô Giang Mạnh được mở khóa sau khi chiến thắng Màn 11
 * và không bị mất trạng thái mở khóa khi chơi lại hoặc tải lại game.
 */

const assert = require('assert');
const fs = require('fs');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

// Mock window & document
global.window = global;
global.document = {
  getElementById: (id) => ({
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => false },
    querySelector: () => null,
    querySelectorAll: () => []
  }),
  querySelector: () => null,
  querySelectorAll: () => []
};

// Nạp các module cần thiết
require('../js/core/save.js');
require('../js/entities/roster.js');
require('../js/world/story.js');
require('../js/data/stages.js');

console.log('--- BẮT ĐẦU KIỂM TRA MỞ KHÓA NGÔ GIANG MẠNH ---');

// 1. Kiểm tra cấu hình STORY_META và STAGES của Màn cuối (Màn 20)
const meta20 = window.STORY_META.stages[20];
assert.ok(meta20, 'STORY_META phải có cấu hình cho Màn 20');
assert.strictEqual(meta20.boss, 'giangmanh', 'Boss màn 20 phải là giangmanh');
assert.strictEqual(meta20.unlockChar, 'giangmanh', 'STORY_META màn 20 phải có unlockChar là giangmanh');

const stage20 = (window.STAGE_DEFINITIONS && window.STAGE_DEFINITIONS[20]) || (window.STAGES && window.STAGES[20]);
assert.ok(stage20, 'STAGE_DEFINITIONS phải có cấu hình cho Màn 20');
assert.strictEqual(stage20.unlockChar, 'giangmanh', 'STAGE_DEFINITIONS màn 20 phải có unlockChar là giangmanh');
console.log('✓ Cấu hình Màn 20 trong STORY_META và STAGE_DEFINITIONS hợp lệ.');

// 2. Khởi tạo SaveManager với tài khoản mới
localStorage.clear();
const sm = new window.SaveManager();
assert.strictEqual(sm.isCharacterUnlocked('giangmanh'), false, 'Tài khoản mới: Giang Mạnh phải đang khóa');
assert.strictEqual(sm.isCharacterUnlocked('nghi'), true, 'Tài khoản mới: Nghị phải mở khóa');

// 3. Giả lập chiến thắng Màn 11 qua GameFlow
class MockGameCamera {}
global.window.GameCamera = MockGameCamera;
require('../js/core/gameFlow.js');

const gameFlow = new window.GameFlow();
gameFlow.later = (fn) => { if (typeof fn === 'function') fn(); };
gameFlow.toasts = [];
gameFlow.toast = (msg) => gameFlow.toasts.push(msg);
gameFlow.calculateStageStats = () => ({
  timeStr: '01:45',
  hits: 42,
  dodges: 5,
  maxCombo: 12,
  rank: 'SÁT THẦN'
});

window.saveManager = sm;
window.stageManager = {
  currentStageIndex: 20,
  getCurrentStage: () => stage20
};

// Gọi recordStageProgress
gameFlow.recordStageProgress(20, stage20);

// Kiểm tra sau khi recordStageProgress
assert.strictEqual(sm.isCharacterUnlocked('giangmanh'), true, 'Giang Mạnh phải được mở khóa sau Màn 20');
assert.strictEqual(sm.isAllyUnlocked('giangmanh'), true, 'Giang Mạnh phải mở khóa đồng minh sau Màn 20');
assert.ok(sm.data.completedStages.includes(20), 'Màn 20 phải được ghi nhận hoàn thành');
assert.ok(sm.data.bossesDefeated.includes('giangmanh'), 'Ngô Giang Mạnh phải có trong bossesDefeated');
console.log('✓ recordStageProgress đã mở khóa Ngô Giang Mạnh thành công.');

// 4. Kiểm tra showEndingFlow
gameFlow.endingShown = false;
gameFlow.showEndingFlow();
assert.strictEqual(sm.isCharacterUnlocked('giangmanh'), true, 'showEndingFlow vẫn giữ nguyên mở khóa');

// 5. Kiểm tra trường hợp ấn Chơi Lại / Reload Trang Web
const reloadedSave = new window.SaveManager();
assert.strictEqual(reloadedSave.isCharacterUnlocked('giangmanh'), true, 'Sau khi reload/persist, Giang Mạnh vẫn phải mở khóa');
assert.strictEqual(reloadedSave.isAllyUnlocked('giangmanh'), true, 'Sau khi reload/persist, Giang Mạnh vẫn là đồng minh khả dụng');
console.log('✓ Dữ liệu lưu vĩnh viễn (Persist) hoạt động chuẩn xác.');

// 6. Kiểm tra tính năng Self-Healing của sanitize(raw) cho save cũ
const oldBrokenSave = {
  version: 1,
  completedStages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  bossesDefeated: ['giangmanh'],
  unlockedCharacters: ['nghi'], // Thiếu giangmanh do bug phiên bản cũ
  allyAvailability: {}
};
const healed = sm.sanitize(oldBrokenSave);
assert.ok(healed.unlockedCharacters.includes('giangmanh'), 'Sanitize phải tự động phục hồi giangmanh cho người đã vượt Màn 11');
assert.ok(healed.allyAvailability.giangmanh === true, 'Sanitize phải tự động kích hoạt ally giangmanh');
console.log('✓ Self-Healing hồi phục mở khóa cho save cũ thành công.');

console.log('--- TOÀN BỘ CÁC KIỂM TRA MỞ KHÓA NGÔ GIANG MẠNH ĐỀU ĐẠT CHUẨN! ---');
