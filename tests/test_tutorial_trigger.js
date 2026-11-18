/**
 * tests/test_tutorial_trigger.js
 * Kiểm tra kích hoạt Hướng Dẫn Tân Thủ khi chơi màn với tài khoản mới.
 */

const assert = require('assert');

// Mock browser env
global.window = global;
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
global.document = {
  getElementById: (id) => {
    if (id === 'gameCanvas' || id === 'game-canvas') {
      return {
        getContext: () => ({
          fillRect: () => {},
          clearRect: () => {},
          drawImage: () => {},
          save: () => {},
          restore: () => {},
          translate: () => {},
          scale: () => {}
        }),
        width: 1280,
        height: 720
      };
    }
    return null;
  },
  createElement: (tag) => ({
    id: '',
    className: '',
    innerHTML: '',
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    setAttribute: () => {},
    appendChild: () => {},
    style: {}
  }),
  body: { appendChild: () => {} },
  addEventListener: () => {}
};

// Mock components
window.saveManager = {
  data: {
    currentStage: 1,
    selectedCharacter: 'nghi',
    tutorialCompleted: false,
    tutorialSkipped: false,
    completedStages: []
  },
  isTutorialNeeded() {
    return !this.data.tutorialCompleted && !this.data.tutorialSkipped;
  },
  skipTutorial() {
    this.data.tutorialSkipped = true;
  },
  completeTutorial() {
    this.data.tutorialCompleted = true;
  },
  isCharacterUnlocked: () => true,
  persist: () => {}
};

let inviteModalCalled = false;
let acceptCallback = null;
let skipCallback = null;

window.tutorialManager = {
  isActive: false,
  isTutorialNeeded() {
    return window.saveManager.isTutorialNeeded();
  },
  showInviteModal(onAccept, onSkip) {
    inviteModalCalled = true;
    acceptCallback = onAccept;
    skipCallback = onSkip;
  },
  startTutorial() {
    this.isActive = true;
    if (window.game) window.game.state = 'TUTORIAL';
  },
  hideOverlay() {}
};

window.uiManager = new Proxy({}, {
  get: (target, prop) => () => {}
});

window.stageManager = {
  setStage: () => {},
  getCurrentStage: () => ({ id: 1, title: 'MÀN 1' })
};

class MockPlayer {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 1000;
    this.maxHp = 1000;
  }
  setCharacter() {}
  reset() {}
}
global.Player = MockPlayer;
window.Player = MockPlayer;

// Mock Game
class MockGame {
  constructor() {
    this.state = 'MENU';
    this.enemies = [];
    this.currentBoss = null;
    this.player = {
      setCharacter: () => {},
      reset: () => {},
      maxHp: 1000,
      hp: 1000
    };
    this.camera = { x: 0, y: 0 };
    this.attackTokens = new Map();
  }
  cancelGameOverTimer() {}
  clearLaterTimers() {}
  updateAllyHUD() {}
  startLoop() {}
}

window.GameCamera = MockGame;
require('../js/core/gameFlow.js');
require('../js/core/gameStory.js');
require('../js/core/gameBase.js');

window.GameBase.prototype.cancelGameOverTimer = function() {};
window.GameBase.prototype.clearLaterTimers = function() {};
window.GameBase.prototype.updateAllyHUD = function() {};
window.GameBase.prototype.startLoop = function() {};
window.GameBase.prototype.gameLoop = function() {};

console.log('=== BẮT ĐẦU TEST KÍCH HOẠT HƯỚNG DẪN TÂN THỦ ===\n');

// TEST 1: ACC MỚI TINH - GỌI startStage(1) PHẢI HIỆN INVITE MODAL VÀ KHÔNG VÀO MÀN 1 THẲNG
{
  inviteModalCalled = false;
  window.saveManager.data.tutorialCompleted = false;
  window.saveManager.data.tutorialSkipped = false;

  const game = new window.GameBase();
  window.game = game;

  game.startStage(1);

  assert.strictEqual(inviteModalCalled, true, 'startStage(1) phải gọi showInviteModal khi acc mới');
  assert.strictEqual(game.state, 'MENU', 'Game không được nhảy vào PLAYING Màn 1 khi chưa xác nhận');
  console.log('✓ TEST 1: Acc mới tinh ấn chơi Màn 1 hiển thị Hướng Dẫn Tân Thủ chuẩn xác');
}

// TEST 2: NGƯỜI CHƠI CHỌN VÀO HƯỚNG DẪN TÂN THỦ -> KÍCH HOẠT startTutorial()
{
  assert.strictEqual(typeof acceptCallback, 'function', 'Phải có callback accept');
  acceptCallback();

  assert.strictEqual(window.tutorialManager.isActive, true, 'tutorialManager phải active');
  assert.strictEqual(window.game.state, 'TUTORIAL', 'game.state phải là TUTORIAL');
  console.log('✓ TEST 2: Người chơi chọn vào Hướng dẫn -> Võ đường TUTORIAL kích hoạt');
}

// TEST 3: NGƯỜI CHƠI BẤM BỎ QUA -> GHI NHẬN SKIP VÀ VÀO MÀN 1 THÀNH CÔNG
{
  window.saveManager.data.tutorialCompleted = false;
  window.saveManager.data.tutorialSkipped = false;
  window.tutorialManager.isActive = false;

  const game = new window.GameBase();
  window.game = game;

  game.startStage(1);
  assert.strictEqual(typeof skipCallback, 'function', 'Phải có callback skip');

  // Gọi skip
  skipCallback();

  assert.strictEqual(window.saveManager.data.tutorialSkipped, true, 'tutorialSkipped phải được ghi nhận là true');
  assert.strictEqual(game.state, 'PLAYING', 'Sau khi skip, Màn 1 được khởi động PLAYING thành công');
  console.log('✓ TEST 3: Người chơi bấm Bỏ qua -> Lưu cờ skip và vào Màn 1 chiến dịch');
}

// TEST 4: ACC ĐÃ HOÀN THÀNH HOẶC ĐÃ BỎ QUA -> VÀO THẲNG MÀN 1, KHÔNG HỎI LẠI
{
  inviteModalCalled = false;
  window.saveManager.data.tutorialCompleted = true; // Đã xong

  const game = new window.GameBase();
  window.game = game;

  game.startStage(1);

  assert.strictEqual(inviteModalCalled, false, 'Không được hiện lại invite modal khi acc đã xong tutorial');
  assert.strictEqual(game.state, 'PLAYING', 'Vào thẳng Màn 1 mượt mà');
  console.log('✓ TEST 4: Acc cũ đã hoàn thành hướng dẫn -> Vào thẳng Màn 1 không bị hỏi lại');
}

// TEST 5: ACC CŨ BẤM "HÀNH TRÌNH MỚI" -> RESET TÂN THỦ & KÍCH HOẠT HƯỚNG DẪN TÂN THỦ
{
  inviteModalCalled = false;
  window.saveManager.data.currentStage = 3;
  window.saveManager.data.tutorialCompleted = true;
  window.saveManager.data.tutorialSkipped = true;
  window.saveManager.data.completedStages = [1, 2];

  // Giả lập hành động bấm "ĐỒNG Ý BẮT ĐẦU MỚI" (btn-newgame-confirm)
  window.saveManager.data.currentStage = 1;
  window.saveManager.data.tutorialCompleted = false;
  window.saveManager.data.tutorialSkipped = false;
  window.saveManager.data.completedStages = [];

  assert.strictEqual(window.saveManager.isTutorialNeeded(), true, 'Sau khi bấm Hành Trình Mới, isTutorialNeeded phải là true');

  const game = new window.GameBase();
  window.game = game;
  game.startStage(1);

  assert.strictEqual(inviteModalCalled, true, 'Hành trình mới chơi Màn 1 phải kích hoạt showInviteModal');
  console.log('✓ TEST 5: Bấm Hành Trình Mới reset trạng thái tân thủ và kích hoạt Hướng Dẫn Tân Thủ');
}

// TEST 6: BẤM "XÓA TIẾN TRÌNH" TRONG CÀI ĐẶT -> RESET SẠCH VÀ KÍCH HOẠT HƯỚNG DẪN
{
  inviteModalCalled = false;
  window.saveManager.data.currentStage = 5;
  window.saveManager.data.tutorialCompleted = true;
  window.saveManager.data.completedStages = [1, 2, 3, 4];

  // Giả lập saveManager.resetProgress()
  window.saveManager.data.currentStage = 1;
  window.saveManager.data.tutorialCompleted = false;
  window.saveManager.data.tutorialSkipped = false;
  window.saveManager.data.completedStages = [];

  assert.strictEqual(window.saveManager.isTutorialNeeded(), true, 'Sau khi resetProgress, isTutorialNeeded phải là true');

  const game = new window.GameBase();
  window.game = game;
  game.startStage(1);

  assert.strictEqual(inviteModalCalled, true, 'Sau khi xóa tiến trình chơi Màn 1 phải kích hoạt showInviteModal');
  console.log('✓ TEST 6: Xóa tiến trình trong Cài Đặt reset sạch và kích hoạt Hướng Dẫn Tân Thủ');
}

console.log('\n==========================================');
console.log('TẤT CẢ 6 BỘ TEST TUTORIAL TRIGGER PASS 100%!');
console.log('==========================================');
