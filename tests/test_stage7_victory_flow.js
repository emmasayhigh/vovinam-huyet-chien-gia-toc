/**
 * tests/test_stage7_victory_flow.js
 * Kiểm tra xác thực luồng qua Màn 7 cho cả 3 nhánh và thoại giữa trận
 */

const assert = require('assert');

// Mock môi trường trình duyệt tối giản
global.window = global;
global.document = {
  getElementById: (id) => ({
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    querySelector: () => null,
    textContent: '',
    innerHTML: '',
    appendChild: () => {},
    insertBefore: () => {}
  }),
  createElement: () => ({
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    querySelector: () => null,
    setAttribute: () => {},
    appendChild: () => {},
    style: {}
  })
};

// Mock dependencies
window.saveManager = {
  data: {
    unlockedCharacters: ['nghi'],
    unlockedAllies: ['nghi'],
    allyAvailability: {},
    choices: {},
    endings: []
  },
  unlockCharacter(id) {
    if (!this.data.unlockedCharacters.includes(id)) {
      this.data.unlockedCharacters.push(id);
      this.unlockAlly(id);
    }
    return true;
  },
  unlockAlly(id) {
    if (!this.data.unlockedAllies.includes(id)) {
      this.data.unlockedAllies.push(id);
    }
    return true;
  },
  isCharacterUnlocked(id) {
    return this.data.unlockedCharacters.includes(id);
  },
  isAllyUnlocked(id) {
    return this.data.unlockedAllies.includes(id);
  },
  completeStage: () => {},
  addStats: () => {},
  defeatBoss: () => {},
  unlockAchievement: () => false,
  isMissionDone: () => false,
  recordChoice: () => {}
};

window.investigationManager = {
  isFound: () => true,
  adjustTrust: () => {},
  collectEvidence: () => {},
  ensureState: () => {}
};

window.audioManager = {
  stopBGM: () => {},
  playVictory: () => {},
  setBGMIntensity: () => {},
  playClick: () => {},
  playWarning: () => {}
};

window.rankingManager = {
  processAndDisplayVictory: () => {}
};

window.uiManager = {
  showChoice: (opts, cb) => {
    // Lưu callback để test gọi
    window._lastChoiceCb = cb;
  },
  showDialogue: () => {},
  hideDialogue: () => {},
  showAlertBanner: () => {},
  updateBossHp: () => {},
  setObjective: () => {},
  showToast: () => {}
};

window.stageManager = {
  currentStageIndex: 7,
  stageWidth: 2600,
  getCurrentStage: () => ({
    id: 7,
    title: 'MÀN 7: TRẠM SÁT THỦ NGẦM',
    bossDialogue: [
      { speaker: 'PHÓ DUNG HẢI', text: 'Lại là cậu à, Nghị?' }
    ]
  }),
  playDialogueSequence: (list, onComplete) => {
    // Giả lập xem xong thoại ngay lập tức
    if (onComplete) onComplete();
  }
};

window.STORY_META = {
  stages: {
    7: { id: 7, act: 2, boss: 'dunghai', next: 8, unlockChar: 'dunghai' },
    8: { id: 8, act: 3, boss: 'hoanganh', next: 9, unlockChar: 'hoanganh' }
  }
};

// Base class mock
class GameCamera {
  constructor() {
    this.state = 'PLAYING';
    this.stageElapsedTime = 45;
    this.player = { hp: 1000, maxHp: 1000 };
    this.laterTimers = [];
  }
  later(fn, ms) {
    fn();
  }
  calculateStageStats() {
    return { timeStr: '01:30', maxCombo: 12, hits: 40, dodges: 5, rank: 'SÁT THẦN (S)' };
  }
  toast() {}
}
window.GameCamera = GameCamera;

// Load gameFlow and gameStory
require('../js/core/gameFlow.js');
require('../js/core/gameStory.js');

console.log('=== BẮT ĐẦU TEST TOÀN DIỆN MÀN 7 & HỘI THOẠI ===\n');

// TEST 1: NHÁNH A - CHỌN TIN DUNG HẢI (TRUST)
{
  const game = new window.GameStory();
  window.game = game;
  const stageData = window.stageManager.getCurrentStage();

  game.triggerStage7DungHaiEncounter(stageData, {});
  assert.strictEqual(typeof window._lastChoiceCb, 'function', 'Hộp thoại lựa chọn phải mở');

  // Người chơi chọn A ('trust')
  window._lastChoiceCb('trust');

  assert.strictEqual(game.state, 'STAGE_CLEAR', 'Nhánh A (Tin Dung Hải) phải qua màn thành công');
  assert.strictEqual(window.saveManager.isCharacterUnlocked('dunghai'), true, 'Dung Hải phải được mở khóa nhân vật');
  assert.strictEqual(window.saveManager.isAllyUnlocked('dunghai'), true, 'Dung Hải phải được mở khóa đồng minh');
  console.log('✓ TEST 1: Nhánh A (Tin Dung Hải) chuyển thẳng sang STAGE_CLEAR và mở khóa Dung Hải thành công');
}

// TEST 2: NHÁNH C - CHỌN ĐỐI CHẤT BẰNG CHỨNG (CONFRONT)
{
  const game = new window.GameStory();
  window.game = game;
  const stageData = window.stageManager.getCurrentStage();

  game.triggerStage7DungHaiEncounter(stageData, {});
  // Người chơi chọn C ('confront')
  window._lastChoiceCb('confront');

  assert.strictEqual(game.state, 'STAGE_CLEAR', 'Nhánh C (Đối chất) phải qua màn thành công');
  assert.strictEqual(window.saveManager.isCharacterUnlocked('dunghai'), true, 'Dung Hải phải được mở khóa');
  console.log('✓ TEST 2: Nhánh C (Đối chất bằng chứng) hoàn thành Màn 7 thành công');
}

// TEST 3: NHÁNH B - VÀO TRẬN CHIẾN & SUBDUE KHI MÁU DƯỚI 20%
{
  const game = new window.GameStory();
  window.game = game;
  const stageData = window.stageManager.getCurrentStage();

  game.triggerStage7DungHaiEncounter(stageData, {});
  // Người chơi chọn B ('subdue')
  window._lastChoiceCb('subdue');

  assert.strictEqual(game.dungHaiSubdueMode, true, 'dungHaiSubdueMode phải được kích hoạt');
  assert.strictEqual(game.state, 'PLAYING', 'Game phải ở trạng thái PLAYING để đánh boss');

  // Giả lập boss Dung Hải
  game.currentBoss = {
    type: 'boss_dunghai',
    hp: 500,
    maxHp: 3000,
    isDead: false,
    setState: () => {}
  };

  // Kích hoạt subdue khi hp <= 20% maxHp
  game.triggerDungHaiSubdued();

  assert.strictEqual(game.state, 'STAGE_CLEAR', 'Khống chế Dung Hải xong phải chuyển sang STAGE_CLEAR');
  assert.strictEqual(game.currentBoss.isDead, true, 'Boss phải ở trạng thái isDead');
  assert.strictEqual(game.dungHaiSubdued, true, 'Cờ dungHaiSubdued phải bật');
  console.log('✓ TEST 3: Nhánh B (Khống chế Dung Hải) mở khóa và chiến thắng Màn 7');
}

// TEST 4: NHÁNH B - NẾU BOSS DUNG HẢI BỊ ĐÁNH CHẾT HẲN (HP <= 0)
{
  const game = new window.GameStory();
  window.game = game;
  game.dungHaiSubdueMode = true;
  game.dungHaiSubdued = false;

  game.currentBoss = {
    type: 'boss_dunghai',
    hp: 0,
    maxHp: 3000,
    isDead: true,
    stateTimer: 2.0,
    setState: () => {}
  };

  // Giả lập logic kiểm tra trong loop: nếu boss chết hẳn mà chưa triggerDungHaiSubdued
  if (game.currentBoss.type === 'boss_dunghai' && game.dungHaiSubdueMode && !game.dungHaiSubdued) {
    if (game.currentBoss.isDead || game.currentBoss.hp <= game.currentBoss.maxHp * 0.2) {
      game.triggerDungHaiSubdued();
    }
  }

  assert.strictEqual(game.state, 'STAGE_CLEAR', 'Boss chết hẳn vẫn kích hoạt kết màn STAGE_CLEAR thành công');
  console.log('✓ TEST 4: Đánh hạ gục hoàn toàn Dung Hải (0 HP) kết thúc Màn 7 an toàn');
}

// TEST 5: THOẠI GIỮA TRẬN (playInlineDialogue) KHÔNG BỊ TREO KHI ĐANG PLAYING
{
  const game = new window.GameStory();
  window.game = game;
  game.state = 'PLAYING';

  let doneCalled = false;
  game.playInlineDialogue([
    { speaker: 'PHÓ DUNG HẢI', text: 'Tôi không bán đứng ai, Nghị.' }
  ], () => {
    doneCalled = true;
  });

  assert.strictEqual(doneCalled, true, 'Callback onDone phải được gọi ngay khi thoại hoàn thành');
  console.log('✓ TEST 5: playInlineDialogue giữa trận diễn ra thông suốt, không deadlock');
}

console.log('\n==========================================');
console.log('TẤT CẢ 5 BỘ TEST STAGE 7 VICTORY ĐỀU PASS 100%!');
console.log('==========================================');

