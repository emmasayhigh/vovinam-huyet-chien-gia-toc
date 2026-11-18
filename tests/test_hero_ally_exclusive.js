/**
 * tests/test_hero_ally_exclusive.js
 * Kiểm thử tính loại trừ độc quyền giữa Võ Sĩ Xuất Trận và Đồng Minh Chi Viện,
 * cùng tính đúng đắn của Avatar HUD & Menu theo nhân vật được chọn.
 */

const assert = require('assert');

// Giả lập môi trường trình duyệt tối giản
global.window = global;
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};
global.document = {
  getElementById: (id) => {
    if (!global._elements[id]) {
      global._elements[id] = {
        id,
        classList: {
          _classes: new Set(),
          add(c) { this._classes.add(c); },
          remove(c) { this._classes.delete(c); },
          contains(c) { return this._classes.has(c); },
          toggle(c, v) { if (v) this.add(c); else this.remove(c); }
        },
        style: {},
        dataset: {},
        textContent: '',
        src: '',
        appendChild: () => {},
        addEventListener: () => {},
        getContext: () => ({
          clearRect: () => {},
          createRadialGradient: () => ({ addColorStop: () => {} }),
          createLinearGradient: () => ({ addColorStop: () => {} }),
          fillRect: () => {},
          save: () => {},
          restore: () => {},
          translate: () => {},
          scale: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          quadraticCurveTo: () => {},
          closePath: () => {},
          fill: () => {},
          stroke: () => {},
          arc: () => {}
        })
      };
    }
    return global._elements[id];
  },
  querySelector: (sel) => {
    if (sel.includes('.avatar-belt')) return global.document.getElementById('mock-avatar-belt');
    if (sel.includes('.player-avatar-img')) return global.document.getElementById('mock-player-avatar-img');
    return null;
  },
  querySelectorAll: () => [],
  createElement: () => ({
    classList: { add: () => {}, remove: () => {} },
    style: {},
    appendChild: () => {},
    addEventListener: () => {}
  })
};
global._elements = {};

// Mock âm thanh & hiệu ứng
global.audioManager = { playSkill: () => {}, playGong: () => {} };
global.effectManager = { triggerFlash: () => {}, createShockRing: () => {}, createDust: () => {} };

// Mock SkeletalRenderer
global.lastDrawnPortrait = null;
global.skeletalRenderer = {
  drawPortrait: (canvas, type, flip, vovinam) => {
    global.lastDrawnPortrait = { type, flip, vovinam };
  }
};

// Nạp các script cần thiết
require('../js/core/save.js');
require('../js/entities/roster.js');
require('../js/ui/menu/charSlots.js');
require('../js/entities/allySystem.js');
require('../js/ui/ui.js');
require('../js/ui/menu/menuBase.js');

console.log('=== BẮT ĐẦU TEST KHẮC PHỤC LỖI 2 PHÓ DUNG HẢI VÀ AVATAR HUD ===\n');

// Khởi tạo saveManager & uiManager
global.saveManager = new SaveManager();
global.saveManager.unlockCharacter('dunghai');
global.saveManager.unlockCharacter('bichlam');
global.saveManager.unlockCharacter('hoanganh');
global.saveManager.unlockCharacter('dinhan');

global.uiManager = window.uiManager;
global.menuManager = new MenuManagerBase();

// -----------------------------------------------------------------------------
// TEST 1: Khi chơi Phó Dung Hải, getBestAvailableAlly KHÔNG BAO GIỜ trả về 'dunghai'
// -----------------------------------------------------------------------------
console.log('[TEST 1: getBestAvailableAlly tự động loại trừ nhân vật đang điều khiển]');
global.game = {
  player: {
    charId: 'dunghai',
    characterId: 'dunghai',
    name: 'Phó Dung Hải',
    styleType: 'boss_dunghai',
    x: 200,
    y: 580,
    facing: 1
  }
};

global.allyManager.selectedAllyId = 'auto';
const allyForDunghai = global.allyManager.getBestAvailableAlly('dunghai');
assert.notStrictEqual(allyForDunghai, 'dunghai', 'Đồng minh không được phép là dunghai khi đang chơi dunghai!');
console.log(`✓ Người chơi là Phó Dung Hải -> Đồng minh tự động chọn: ${allyForDunghai} (KHÔNG PHẢI dunghai)`);

// -----------------------------------------------------------------------------
// TEST 2: Dù selectedAllyId có bị ép là 'dunghai', hệ thống vẫn chặn triệu hồi trùng
// -----------------------------------------------------------------------------
console.log('\n[TEST 2: Chặn tuyệt đối triệu hồi trùng nếu người chơi cố tình gọi chính mình]');
global.allyManager.selectedAllyId = 'dunghai';
global.allyManager.gauge = global.allyManager.maxGauge;
global.allyManager.cooldown = 0;
global.allyManager.activeAlly = null;

const summonSuccess = global.allyManager.summonAlly('dunghai', global.game.player);
assert.strictEqual(summonSuccess, true, 'Triệu hồi đồng minh phải thành công');
assert.notStrictEqual(global.allyManager.activeAlly.id, 'dunghai', 'activeAlly KHÔNG ĐƯỢC PHÉP là dunghai!');
console.log(`✓ Người chơi Phó Dung Hải gọi viện trợ -> Đồng minh ra sân thực tế: ${global.allyManager.activeAlly.id} (${global.allyManager.activeAlly.profile.name})`);

// -----------------------------------------------------------------------------
// TEST 3: Khi chơi Bích Lâm, đồng minh cũng không bao giờ trùng Bích Lâm
// -----------------------------------------------------------------------------
console.log('\n[TEST 3: Kiểm tra tính loại trừ với Đình Bích Lâm]');
global.game.player.charId = 'bichlam';
global.game.player.characterId = 'bichlam';
global.allyManager.selectedAllyId = 'auto';
const allyForBichlam = global.allyManager.getBestAvailableAlly('bichlam');
assert.notStrictEqual(allyForBichlam, 'bichlam', 'Đồng minh không được là bichlam khi chơi bichlam');
console.log(`✓ Người chơi là Đình Bích Lâm -> Đồng minh tự động chọn: ${allyForBichlam}`);

// -----------------------------------------------------------------------------
// TEST 4: Avatar HUD hiển thị đúng Phó Dung Hải (boss_dunghai), đai đỏ sát thủ
// -----------------------------------------------------------------------------
console.log('\n[TEST 4: Kiểm tra Avatar HUD khi chọn Phó Dung Hải]');
global.game.player.charId = 'dunghai';
global.game.player.characterId = 'dunghai';
global.game.player.styleType = 'boss_dunghai';
global.game.player.name = 'Phó Dung Hải';
global.game.player.title = 'Kẻ Bị Khai Trừ';

global.uiManager.setCharacterHUD(global.game.player);
assert.strictEqual(global.lastDrawnPortrait.type, 'boss_dunghai', 'Portrait HUD phải vẽ boss_dunghai!');
console.log(`✓ setCharacterHUD vẽ chân dung: ${global.lastDrawnPortrait.type} (Phó Dung Hải)`);

const beltEl = global.document.getElementById('mock-avatar-belt');
assert.ok(beltEl.style.background.includes('#ef4444') || beltEl.style.background.includes('#7f1d1d'), 'Màu đai HUD của Dung Hải phải là đai đỏ sát thủ');
console.log(`✓ Đai avatar HUD Phó Dung Hải được cập nhật màu đai đỏ: ${beltEl.style.background}`);

// -----------------------------------------------------------------------------
// TEST 5: Gọi showHUD() KHÔNG ghi đè chân dung 'player' (Ngô Nhất Nghị)
// -----------------------------------------------------------------------------
console.log('\n[TEST 5: showHUD() giữ nguyên avatar Phó Dung Hải, không bị ghi đè]');
global.uiManager.showHUD();
assert.strictEqual(global.lastDrawnPortrait.type, 'boss_dunghai', 'showHUD() không được phép ghi đè chân dung về player/nghi!');
console.log(`✓ Sau khi gọi showHUD(), chân dung vẫn là: ${global.lastDrawnPortrait.type} (Phó Dung Hải chuẩn)`);

// -----------------------------------------------------------------------------
// TEST 6: Thanh Profile người chơi góc dưới trái Menu cập nhật đúng nhân vật
// -----------------------------------------------------------------------------
console.log('\n[TEST 6: Cập nhật Avatar Menu Profile]');
global.saveManager.data.selectedCharacter = 'dunghai';
global.menuManager.updateMenuPlayerBar();
const menuAvatarImg = global.document.getElementById('mock-player-avatar-img');
assert.ok(menuAvatarImg.src.includes('char_dunghai.png'), 'Avatar menu phải trỏ tới ảnh Phó Dung Hải');
console.log(`✓ Menu profile avatar cập nhật: ${menuAvatarImg.src}`);

console.log('\n==========================================');
console.log('TẤT CẢ 6 BỘ TEST ĐỘC QUYỀN VÕ SĨ & AVATAR ĐỀU PASS 100%!');
console.log('==========================================');
