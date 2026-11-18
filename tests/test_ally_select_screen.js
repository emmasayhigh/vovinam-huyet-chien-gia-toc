/**
 * tests/test_ally_select_screen.js
 * Kiểm thử giao diện và luồng hoạt động của Màn Chọn Đồng Minh Chi Viện (#ally-select-modal)
 * Đảm bảo kiến trúc 3 cột đồng nhất tuyệt đối với Màn Chọn Nhân Vật (#char-select-modal):
 * - Cột trái: Roster Grid thẻ tướng (2 cột dạng cs-card, có banner, avatar, icon vai trò)
 * - Cột giữa: Sân khấu tranh minh họa toàn thân + Banner vai trò + Nút Prev / Confirm Brush / Next
 * - Cột phải: Hồ sơ Dossier chi tiết (3 chỉ số sinh lực/sát thương/tốc độ + 3 kỹ năng viện trợ + câu thoại)
 * - Phím điều hướng & loại trừ võ sĩ xuất trận (hero-busy)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== BẮT ĐẦU TEST MÀN CHỌN ĐỒNG MINH CHI VIỆN 3 CỘT (ALLY SELECT SCREEN) ===\n');

// -----------------------------------------------------------------------------
// PHẦN 1: KIỂM THỬ TÍNH TOÀN VẸN MARKUP TRONG INDEX.HTML
// -----------------------------------------------------------------------------
console.log('[PHẦN 1: Kiểm thử cấu trúc DOM 3 cột của #ally-select-modal trong index.html]');
const htmlPath = path.resolve(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

assert.ok(html.includes('id="ally-select-modal"'), '#ally-select-modal phải tồn tại trong index.html');
assert.ok(html.includes('class="cs-main-body ally-cs-main-body"'), 'Phải sử dụng cs-main-body cho bố cục 3 cột đồng nhất');

// Kiểm tra 3 cột
assert.ok(html.includes('class="cs-left-col ally-left-col"'), 'Cột trái (cs-left-col ally-left-col) phải tồn tại');
assert.ok(html.includes('id="ally-dock-pills" class="cs-grid ally-cs-grid"'), 'Grid danh sách đồng minh (ally-dock-pills cs-grid) phải tồn tại ở cột trái');
assert.ok(html.includes('id="ally-roster-count"'), 'Huy hiệu số lượng đồng minh ally-roster-count phải tồn tại');

assert.ok(html.includes('class="cs-center-col ally-center-col"'), 'Cột giữa (cs-center-col ally-center-col) phải tồn tại');
assert.ok(html.includes('id="ally-showcase-img"'), 'Ảnh toàn thân ally-showcase-img phải tồn tại ở cột giữa');
assert.ok(html.includes('id="ally-special-card"'), 'Thẻ đặc biệt ally-special-card (Auto/None) phải tồn tại ở cột giữa');
assert.ok(html.includes('id="btn-ally-prev"'), 'Nút chuyển lùi btn-ally-prev phải tồn tại');
assert.ok(html.includes('id="btn-ally-confirm"'), 'Nút xác nhận btn-ally-confirm phải tồn tại');
assert.ok(html.includes('id="btn-ally-next"'), 'Nút chuyển tới btn-ally-next phải tồn tại');

assert.ok(html.includes('class="cs-right-col ally-right-col"'), 'Cột phải (cs-right-col ally-right-col) phải tồn tại');
assert.ok(html.includes('class="cs-dossier-card ally-dossier-card"'), 'Thẻ hồ sơ cs-dossier-card ally-dossier-card phải tồn tại ở cột phải');
assert.ok(html.includes('id="ally-dossier-name"'), 'Tên hồ sơ ally-dossier-name phải tồn tại');
assert.ok(html.includes('id="ally-stat-hp"') && html.includes('id="ally-stat-dmg"') && html.includes('id="ally-stat-spd"'), 'Các chỉ số HP, DMG, SPD phải tồn tại');
assert.ok(html.includes('id="ally-skill-name"') && html.includes('id="ally-aura-name"') && html.includes('id="ally-coop-name"'), '3 kỹ năng viện trợ phải tồn tại');
assert.ok(html.includes('id="ally-quote-text"'), 'Trích dẫn ally-quote-text phải tồn tại');

// Kiểm tra Top Bar
assert.ok(html.includes('id="btn-ally-back"'), 'Nút quay lại btn-ally-back phải tồn tại ở Top Bar');
assert.ok(html.includes('id="btn-ally-close-x"'), 'Nút đóng btn-ally-close-x phải tồn tại ở Top Bar');
assert.ok(html.includes('id="ally-selected-hero-name"'), 'Tên võ sĩ xuất trận ally-selected-hero-name phải tồn tại ở Top Bar');

console.log('✓ Cấu trúc DOM 3 cột của #ally-select-modal trong index.html hoàn toàn chuẩn xác!');

// -----------------------------------------------------------------------------
// PHẦN 2: MÔ PHỎNG RUNTIME VÀ KIỂM THỬ CLASS MenuManagerCharSelectDeployment
// -----------------------------------------------------------------------------
console.log('\n[PHẦN 2: Kiểm thử runtime MenuManagerCharSelectDeployment]');

// Tạo DOM mock chi tiết cho môi trường Node
global.window = global;
global.window.CHAR_SLOTS = [
  { id: 'nghi', slotName: 'Ngô Nhất Nghị', fullName: 'Ngô Nhất Nghị (Sát Thần)', image: 'assets/images/characters/char_hero_nghi.png' },
  { id: 'bichlam', slotName: 'Đình Bích Lâm', fullName: 'Đình Bích Lâm (Mãnh Tướng)', image: 'assets/images/characters/char_bichlam.png' },
  { id: 'dinhan', slotName: 'Triệu Đình An', fullName: 'Triệu Đình An (Thiết Bích)', image: 'assets/images/characters/char_dinhan.png' }
];

const mockElements = {};
function createMockEl(id, tagName = 'div') {
  const classSet = new Set();
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    classList: {
      _set: classSet,
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); },
      toggle(c, v) { if (v === undefined) v = !this.contains(c); if (v) this.add(c); else this.remove(c); return v; }
    },
    get className() { return Array.from(this.classList._set).join(' '); },
    set className(val) {
      this.classList._set.clear();
      if (val) val.split(/\s+/).filter(Boolean).forEach(c => this.classList._set.add(c));
    },
    style: {},
    dataset: {},
    textContent: '',
    src: '',
    innerHTML: '',
    children: [],
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] || null; },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    addEventListener(evt, fn) {
      if (!this._events) this._events = {};
      if (!this._events[evt]) this._events[evt] = [];
      this._events[evt].push(fn);
    },
    trigger(evt) {
      if (this._events && this._events[evt]) {
        this._events[evt].forEach(fn => fn({ key: evt, preventDefault: () => {} }));
      }
    }
  };
  mockElements[id] = el;
  return el;
}

global.document = {
  getElementById(id) {
    if (!mockElements[id]) {
      return createMockEl(id);
    }
    return mockElements[id];
  },
  createElement(tag) {
    return createMockEl('elem_' + Math.random().toString(36).slice(2), tag);
  },
  querySelectorAll() { return []; },
  querySelector() { return null; }
};

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); }
};

// Khởi tạo các ID chính cần thiết
createMockEl('ally-select-modal');
createMockEl('char-select-modal');
createMockEl('ally-dock-pills');
createMockEl('ally-roster-count');
createMockEl('ally-selected-hero-avatar');
createMockEl('ally-selected-hero-name');
createMockEl('ally-selected-hero-stage');
createMockEl('ally-confirm-text');
createMockEl('btn-ally-back');
createMockEl('btn-ally-close-x');
createMockEl('btn-ally-confirm');
createMockEl('btn-ally-prev');
createMockEl('btn-ally-next');
createMockEl('ally-showcase-img');
createMockEl('ally-special-card');
createMockEl('ally-stage-role-tag');
createMockEl('ally-stage-name-tag');
createMockEl('ally-ambient-glow');
createMockEl('ally-dossier-role-badge');
createMockEl('ally-dossier-status-badge');
createMockEl('ally-dossier-name');
createMockEl('ally-dossier-title');
createMockEl('ally-stat-hp');
createMockEl('ally-stat-dmg');
createMockEl('ally-stat-spd');
createMockEl('ally-skill-name');
createMockEl('ally-skill-cd');
createMockEl('ally-skill-desc');
createMockEl('ally-aura-name');
createMockEl('ally-aura-desc');
createMockEl('ally-coop-name');
createMockEl('ally-coop-desc');
createMockEl('ally-quote-text');
createMockEl('ally-quote-attr');

// Nạp các lớp kế thừa
global.MenuManagerBase = class {
  constructor() {
    this.toasts = [];
  }
  showToast(msg) { this.toasts.push(msg); }
  click() {}
  hideAll() {}
};
global.MenuManagerCharSelectCore = class extends global.MenuManagerBase {
  constructor() {
    super();
    this.selectedChar = 'nghi';
  }
  isUnlocked() { return true; }
};
global.MenuManagerCharSelectDemo = class extends global.MenuManagerCharSelectCore {};

// Nạp charSelectDeployment.js
require('../js/ui/menu/charselect/charSelectDeployment.js');
const MenuManagerDeployment = global.MenuManagerCharSelectDeployment;
assert.ok(MenuManagerDeployment, 'MenuManagerCharSelectDeployment phải tồn tại');

const menu = new MenuManagerDeployment();
menu.selectedChar = 'nghi';

// Mock Save & Ally Managers
global.saveManager = {
  data: { selectedAlly: 'auto' },
  setSelectedAlly(id) { this.data.selectedAlly = id; },
  isAllyUnlocked() { return true; },
  persist() {}
};
global.allyManager = {
  selectedAllyId: 'auto',
  updateHUD() {}
};

// -----------------------------------------------------------------------------
// TEST 2.1: Mở màn chọn đồng minh openAllySelect()
// -----------------------------------------------------------------------------
console.log('[TEST 2.1: openAllySelect chuyển đổi modal & cập nhật võ sĩ xuất trận]');
menu.selectedChar = 'bichlam';
menu.openAllySelect();

const allyModal = document.getElementById('ally-select-modal');
const csModal = document.getElementById('char-select-modal');
assert.strictEqual(allyModal.classList.contains('hidden'), false, '#ally-select-modal phải hiển thị');
assert.strictEqual(csModal.classList.contains('hidden'), true, '#char-select-modal phải bị ẩn');

const rosterCount = document.getElementById('ally-roster-count');
assert.strictEqual(rosterCount.textContent, '9', 'Số lượng đồng minh trong tab phải là 9');

const fighterName = document.getElementById('ally-selected-hero-name');
assert.strictEqual(fighterName.textContent, 'Đình Bích Lâm (Mãnh Tướng)', 'Võ sĩ xuất trận phải hiển thị đúng Bích Lâm');

console.log('✓ openAllySelect() cập nhật modal, số lượng roster (9) và badge võ sĩ chuẩn xác!');

// -----------------------------------------------------------------------------
// TEST 2.2: renderAllyDockPills tạo 9 thẻ dạng cs-card với avatar và cờ hero-busy
// -----------------------------------------------------------------------------
console.log('\n[TEST 2.2: renderAllyDockPills tạo các thẻ chuẩn cs-card và gán cờ hero-busy]');
const dockPills = document.getElementById('ally-dock-pills');
assert.strictEqual(dockPills.children.length, 9, 'Phải render đúng 9 thẻ đồng minh trong grid');

// Kiểm tra cấu trúc từng thẻ
dockPills.children.forEach(card => {
  assert.ok(card.classList.contains('cs-card'), 'Thẻ đồng minh phải có class cs-card');
  assert.ok(card.classList.contains('ally-dock-card'), 'Thẻ đồng minh phải có class ally-dock-card');
  assert.ok(card.dataset.allyId, 'Thẻ phải có data-ally-id để áp dụng background nguyên tố');
  
  const thumb = card.children.find(c => c.classList && c.classList.contains('cs-card-thumb-wrap'));
  assert.ok(thumb, 'Thẻ phải có cs-card-thumb-wrap');
  
  const banner = card.children.find(c => c.classList && c.classList.contains('cs-card-banner'));
  assert.ok(banner, 'Thẻ phải có cs-card-banner');

  const elem = card.children.find(c => c.classList && c.classList.contains('cs-card-element'));
  assert.ok(elem, 'Thẻ phải có cs-card-element vai trò/icon');
});

// Thẻ Bích Lâm đang là võ sĩ chính -> phải có cờ hero-busy và locked
const bichlamCard = dockPills.children.find(c => {
  const nameEl = c.children.find(ch => ch.classList && ch.classList.contains('cs-card-banner'));
  return nameEl && nameEl.children[0] && nameEl.children[0].textContent === 'Bích Lâm';
});
assert.ok(bichlamCard, 'Phải tìm thấy thẻ Bích Lâm');
assert.ok(bichlamCard.classList.contains('hero-busy'), 'Bích Lâm đang là tướng chính nên thẻ đồng minh phải mang class hero-busy');
assert.ok(bichlamCard.classList.contains('locked'), 'Thẻ hero-busy phải bị locked không cho chọn');
const busyThumb = bichlamCard.children.find(c => c.classList && c.classList.contains('cs-card-thumb-wrap'));
assert.ok(busyThumb, 'Thẻ hero-busy phải có cs-card-thumb-wrap');
const busyBadge = busyThumb.children.find(c => c.classList && c.classList.contains('cs-card-busy-badge'));
assert.ok(busyBadge && busyBadge.innerHTML.includes('ĐANG XUẤT TRẬN'), 'Thẻ hero-busy phải hiển thị dải ruy băng ĐANG XUẤT TRẬN');

// Thẻ Auto và Thẻ Độc Hành
const autoCard = dockPills.children.find(c => c.dataset.allyId === 'auto');
assert.ok(autoCard && autoCard.classList.contains('ally-card-auto'), 'Thẻ Auto phải có class ally-card-auto');

const soloCard = dockPills.children.find(c => c.dataset.allyId === 'none');
assert.ok(soloCard && soloCard.classList.contains('ally-card-solo'), 'Thẻ Solo phải có class ally-card-solo');
const soloThumb = soloCard.children.find(c => c.classList && c.classList.contains('cs-card-thumb-wrap'));
assert.ok(soloThumb.innerHTML.includes('ally-solo-thumb-art'), 'Thẻ Solo phải có võ đồ riêng ally-solo-thumb-art');

console.log('✓ 9 thẻ đồng minh dạng cs-card được render hoàn hảo với đầy đủ banner, avatar và cờ hero-busy!');

// -----------------------------------------------------------------------------
// TEST 2.3: cycleAlly() chuyển đổi đồng minh và tự động bỏ qua hero-busy
// -----------------------------------------------------------------------------
console.log('\n[TEST 2.3: cycleAlly(1) và cycleAlly(-1) bỏ qua thẻ hero-busy]');
menu.selectedAlly = 'auto'; // Vị trí 0
// Khi cycle forward (1), ứng viên tiếp theo là bichlam (vị trí 1), nhưng bichlam đang là hero-busy!
// Do đó cycleAlly phải tự động nhảy qua bichlam để chọn hoanganh (vị trí 2)!
menu.cycleAlly(1);
assert.strictEqual(menu.selectedAlly, 'hoanganh', 'cycleAlly(1) phải nhảy qua Bích Lâm (đang xuất trận) để chọn Hoàng Anh!');
console.log(`✓ cycleAlly(1) từ auto đã nhảy qua Bích Lâm để chọn: ${menu.selectedAlly}`);

// Tiếp tục cycle forward
menu.cycleAlly(1);
assert.strictEqual(menu.selectedAlly, 'dunghai', 'cycleAlly(1) tiếp theo phải chọn Dung Hải');

// Cycle lùi
menu.cycleAlly(-1);
assert.strictEqual(menu.selectedAlly, 'hoanganh', 'cycleAlly(-1) phải lùi lại Hoàng Anh');

// Cycle lùi lần nữa: nhảy qua Bích Lâm để về auto
menu.cycleAlly(-1);
assert.strictEqual(menu.selectedAlly, 'auto', 'cycleAlly(-1) phải nhảy qua Bích Lâm để về lại auto');
console.log(`✓ cycleAlly(-1) lùi thành công về: ${menu.selectedAlly}`);

// -----------------------------------------------------------------------------
// TEST 2.4: Điều hướng quay lại backToCharSelect()
// -----------------------------------------------------------------------------
console.log('\n[TEST 2.4: backToCharSelect() chuyển lại màn chọn tướng]');
menu.backToCharSelect();
assert.strictEqual(allyModal.classList.contains('hidden'), true, '#ally-select-modal phải bị ẩn');
assert.strictEqual(csModal.classList.contains('hidden'), false, '#char-select-modal phải hiển thị lại');
console.log('✓ backToCharSelect() hoạt động trơn tru!');

// -----------------------------------------------------------------------------
// TEST 2.5: Kiểm tra Võ Đường Support Tab, Companion Preview & Loadout Summary Bar
// -----------------------------------------------------------------------------
console.log('\n[TEST 2.5: Võ Đường (#training-mode-modal) Support Tab & Loadout + #char-select-modal sạch]');
const trainJs = fs.readFileSync(path.resolve(__dirname, '../js/ui/training/trainingManagerOverlay.js'), 'utf8');
assert.ok(trainJs.includes('id="btn-t-tab-support"'), '#btn-t-tab-support (Tab Trợ Chiến) phải tồn tại trong Võ Đường');
assert.ok(trainJs.includes('id="training-support-grid"'), '#training-support-grid phải tồn tại trong Võ Đường');
assert.ok(trainJs.includes('id="t-support-companion-card"'), '#t-support-companion-card phải tồn tại trên sân khấu Võ Đường');
assert.ok(trainJs.includes('id="t-loadout-summary-bar"'), '#t-loadout-summary-bar phải tồn tại trong Võ Đường');
assert.ok(!html.includes('id="cs-support-companion-card"'), 'Màn chọn Võ Sĩ (#char-select-modal) không bị đè thẻ Support nổi');
assert.ok(html.includes('id="ally-combo-preview-badge"'), '#ally-combo-preview-badge phải tồn tại trên #ally-select-modal');
console.log('✓ Hệ thống Support Tab, Skin & Loadout nằm đúng trong Võ Đường (#training-mode-modal)!');

console.log('\n===============================================================');
console.log('TẤT CẢ BÀI TEST GIAO DIỆN & LOGIC MÀN CHỌN ĐỒNG MINH ĐỀU PASS 100%!');
console.log('===============================================================');
