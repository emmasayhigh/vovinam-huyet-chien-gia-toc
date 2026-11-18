/**
 * Test Suite: UI System Overhaul 3.0
 * Verifies:
 * 1. UICore modal stack, main menu idle detection, game loop pause logic,
 *    debounced persistence, safe syncRangeFill(), and swapImage().
 * 2. MenuManagerCollections Kho Do Studio (4 tabs, real WEAPON_DEFS stats,
 *    real CHAR_SLOTS outfits, real STORY_META achievements count).
 * 3. MenuManagerSettings dynamic progress counts & keybindings window listener cleanup.
 * 4. TrainingManagerOverlay backdrop + card markup + DOM caching guard (tBuilt === '1').
 * 5. Structural integrity across index.html, css/ui-overhaul.css, main.js, menuBase.js.
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error('  FAIL:', msg);
  }
}

console.log('=== Running UI System Overhaul 3.0 Tests ===');

const rootDir = path.resolve(__dirname, '..');

function makeClassList(initial = []) {
  const set = new Set(initial);
  return {
    add(...cls) { cls.forEach(c => set.add(c)); },
    remove(...cls) { cls.forEach(c => set.delete(c)); },
    toggle(c, force) {
      if (force === undefined) {
        if (set.has(c)) { set.delete(c); return false; }
        set.add(c); return true;
      }
      if (force) set.add(c);
      else set.delete(c);
      return !!force;
    },
    contains(c) { return set.has(c); }
  };
}

function makeMockElement(id, initialClasses = []) {
  const attrs = id ? { id } : {};
  const listeners = {};
  const setProps = {};
  return {
    id: id || '',
    dataset: {},
    classList: makeClassList(initialClasses),
    style: {
      setProperty(k, v) { setProps[k] = v; },
      getPropertyValue(k) { return setProps[k] || ''; }
    },
    innerHTML: '',
    textContent: '',
    value: '',
    min: '0',
    max: '100',
    alt: '',
    src: '',
    children: [],
    appendChild(child) { this.children.push(child); return child; },
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return attrs[k] !== undefined ? attrs[k] : null; },
    addEventListener(type, fn, opts) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push({ fn, capture: !!(opts === true || (opts && opts.capture)) });
    },
    click() {
      (listeners.click || []).forEach(l => l.fn({ stopPropagation() {}, preventDefault() {}, target: this }));
    },
    querySelector(sel) {
      if (sel === '.keybind-btn') {
        if (!this._kbBtn) this._kbBtn = makeMockElement('');
        return this._kbBtn;
      }
      return null;
    },
    querySelectorAll() { return []; },
    _listeners: listeners,
    _setProps: setProps
  };
}

// ---------------------------------------------------------------------------
// Setup Minimal Global DOM & Window Mocks
// ---------------------------------------------------------------------------
const elementsById = {};
function regEl(id, initialClasses = []) {
  const el = makeMockElement(id, initialClasses);
  elementsById[id] = el;
  return el;
}

regEl('title-screen', []);
regEl('campaign-modal', ['modal-overlay', 'hidden']);
regEl('training-mode-modal', ['modal-overlay', 'cs-modal-screen', 'hidden']);
regEl('char-select-modal', ['modal-overlay', 'cs-modal-screen', 'hidden']);
regEl('settings-modal', ['modal-overlay', 'hidden']);
regEl('keybindings-modal', ['modal-overlay', 'hidden']);
regEl('skills-equip-modal', ['modal-overlay', 'hidden']);
regEl('ally-select-modal', ['modal-overlay', 'hidden']);
regEl('shop-modal', ['modal-overlay', 'hidden']);
regEl('collection-modal', ['modal-overlay', 'hidden']);
regEl('achievements-modal', ['modal-overlay', 'hidden']);

const windowListeners = { keydown: [], resize: [] };

global.window = {
  matchMedia() { return { matches: false, addEventListener() {} }; },
  addEventListener(type, fn, capture) {
    if (!windowListeners[type]) windowListeners[type] = [];
    windowListeners[type].push({ fn, capture: !!capture });
  },
  removeEventListener(type, fn, capture) {
    if (!windowListeners[type]) return;
    const cap = !!capture;
    windowListeners[type] = windowListeners[type].filter(l => l.fn !== fn || l.capture !== cap);
  },
  requestAnimationFrame() { return 1; }
};

global.document = {
  getElementById(id) { return elementsById[id] || null; },
  createElement(tag) { return makeMockElement('', []); },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  body: makeMockElement('body', [])
};

global.MutationObserver = class {
  observe() {}
  disconnect() {}
};

// ---------------------------------------------------------------------------
// 1. Test UICore
// ---------------------------------------------------------------------------
require(path.join(rootDir, 'js/ui/uiCore.js'));
const uiCore = global.window.uiCore;

global.window.game = { state: 'MENU' };
assert(!!uiCore, 'window.uiCore singleton exported');
assert(uiCore.isMainMenuActive() === true, 'Title screen visible -> isMainMenuActive() is true');
assert(uiCore.hasBlockingOverlay() === false, 'No open modals -> hasBlockingOverlay() is false');
assert(uiCore.shouldPauseMenuGameLoop() === true, 'Menu idle -> shouldPauseMenuGameLoop() is true');
global.window.game.state = 'PLAYING';
assert(uiCore.shouldPauseMenuGameLoop() === false, 'In combat -> shouldPauseMenuGameLoop() is false');
global.window.game.state = 'MENU';

let saveCallCount = 0;
global.window.saveManager = {
  data: {
    selectedCharacter: 'nghi',
    unlockedCharacters: ['nghi'],
    completedStages: [1, 2],
    endings: ['ending_a'],
    achievements: ['ach_1', 'ach_2'],
    skins: {},
    settings: { musicVolume: 0.45, sfxVolume: 0.85, muted: false }
  },
  persist() { saveCallCount++; },
  save() { saveCallCount++; },
  setSkinEquipped(charId, skinId) {
    if (!this.data.skins) this.data.skins = {};
    this.data.skins[charId] = skinId;
  },
  hasAchievement(id) { return (this.data.achievements || []).includes(id); }
};

uiCore.showModal('settings-modal');
assert(elementsById['settings-modal'].classList.contains('hidden') === false, 'showModal removes hidden class');
assert(uiCore.hasBlockingOverlay() === true, 'Blocking modal open -> hasBlockingOverlay() is true');
assert(uiCore.isMainMenuActive() === false, 'Blocking modal open -> isMainMenuActive() pauses menu particles');

uiCore.hideModal('settings-modal');
assert(elementsById['settings-modal'].classList.contains('hidden') === true, 'hideModal adds hidden class');
assert(uiCore.hasBlockingOverlay() === false, 'After hideModal -> hasBlockingOverlay() is false');

// Test debounced persist & immediate flush
saveCallCount = 0;
uiCore.schedulePersist(500);
uiCore.schedulePersist(500);
uiCore.flushPersistNow();
assert(saveCallCount === 1, 'schedulePersist + flushPersistNow coalesces into single save call');

// Test syncRangeFill with both full style.setProperty and bare Node mock
const slider = makeMockElement('test-slider');
slider.min = '0';
slider.max = '100';
slider.value = '72';
uiCore.syncRangeFill(slider);
assert(slider._setProps['--range-pct'] === '72.0%', 'syncRangeFill sets --range-pct cleanly');

let bareThrown = false;
try {
  uiCore.syncRangeFill({ value: '50', min: '0', max: '100', style: {} });
} catch (e) {
  bareThrown = true;
}
assert(!bareThrown, 'syncRangeFill safely ignores Node mock elements missing style.setProperty');

// ---------------------------------------------------------------------------
// 2. Test MenuManagerCollections & Kho Do Studio
// ---------------------------------------------------------------------------
global.BaseEnemy = class {};
require(path.join(rootDir, 'js/combat/weapons.js'));

global.window.CHAR_SLOTS = [
  { id: 'nghi', slotName: 'NGÔ NHẤT NGHỊ', fullName: 'NGÔ NHẤT NGHỊ', badge: 'VOVINAM', element: '⚡', title: 'Sát Thần Việt Võ Đạo', tagline: 'Quyền cước chính tông', image: 'assets/images/characters/ngo_nhat_nghi_fullbody.png', color: '#38bdf8' },
  { id: 'vananh', slotName: 'PHÓ VĂN ANH', fullName: 'PHÓ VĂN ANH', badge: 'HỌ PHÓ', element: '🪙', title: 'Anh Hai — Hậu Phương Thép', tagline: 'Vest Habana', image: 'assets/images/characters/pho_van_anh_fullbody.png', color: '#facc15' }
];
global.window.STORY_META = {
  stages: Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })),
  achievements: Array.from({ length: 24 }, (_, i) => ({ id: 'ach_' + i, name: 'A' + i, desc: 'D' + i }))
};
global.window.ACHIEVEMENTS = { a: 1, b: 2 };

// Load base class hierarchy up to MenuManagerCollections cleanly
global.window.MenuManagerCharSelect = class {
  constructor() {
    this.achList = makeMockElement('ach-list');
    this.achModal = elementsById['achievements-modal'];
  }
  click() {}
  showToast() {}
  isUnlocked(id) { return (global.window.saveManager.data.unlockedCharacters || []).includes(id); }
  hideAll() { uiCore.hideAllModals(); }
  getSkinsForChar(slot) {
    return [
      { id: 'default', name: 'Mặc Định', tier: 'MẶC ĐỊNH', sub: 'Nguyên bản', image: slot.image, fx: ['Chuẩn'] },
      { id: 'vovinam', name: 'Võ Phục Vovinam Chính Thống', tier: 'BẬC A', sub: 'Lam Võ Phục', image: 'assets/images/characters/ngo_nhat_nghi_fullbody.png', fx: ['Vovinam'] }
    ];
  }
};

// Mock Kho Do inner DOM nodes
regEl('kho-tabs-bar');
regEl('kho-hero-rail');
regEl('kho-outfit-cards');
regEl('kho-outfit-preview-img');
regEl('kho-outfit-hero-name');
regEl('kho-outfit-hero-role');
regEl('kho-weapons-grid');
regEl('kho-active-hero-pill');
regEl('kho-tech-hero-title');
regEl('kho-tech-hero-sub');
regEl('kho-tech-hero-badge');
regEl('kho-tech-moves-list');
regEl('kho-tech-passives-list');
regEl('kho-archives-summary');
regEl('kho-pane-outfits');
regEl('kho-pane-weapons', ['hidden']);
regEl('kho-pane-techniques', ['hidden']);
regEl('kho-pane-archives', ['hidden']);

require(path.join(rootDir, 'js/ui/menu/collections.js'));
const col = new global.window.MenuManagerCollections();
col.showSkillsEquip('weapons');
const weaponsHtml = elementsById['kho-weapons-grid'].innerHTML;
assert(weaponsHtml.includes('CÔN') && weaponsHtml.includes(`${global.window.WEAPON_DEFS.baton.durability} đòn`), 'Kho Do Weapons tab uses real WEAPON_DEFS baton name & durability');
assert(weaponsHtml.includes(`${global.window.PLAYER_ATTACKS.blade_slash.damage} dmg`), 'Kho Do Weapons tab renders real PLAYER_ATTACKS blade_slash damage (34 dmg)');
assert(weaponsHtml.includes(`${global.window.PLAYER_ATTACKS.baton_slam.damage} dmg`), 'Kho Do Weapons tab renders real PLAYER_ATTACKS baton_slam damage (78 dmg)');

col.showSkillsEquip('archives');
const archHtml = elementsById['kho-archives-summary'].innerHTML;
assert(archHtml.includes('2 / 24'), 'Kho Do Archives summary displays dynamic unlocked/STORY_META total (2 / 24)');

col.showSkillsEquip('outfits');
assert(elementsById['kho-outfit-cards'].innerHTML.includes('Võ Phục Vovinam Chính Thống'), 'Kho Do Outfits tab renders Vovinam skin from CHAR_SLOTS');

// ---------------------------------------------------------------------------
// 3. Test MenuManagerSettings Dynamic Summary & Keybindings Listener Cleanup
// ---------------------------------------------------------------------------
regEl('save-summary').dataset.mode = 'cards';
regEl('settings-kb-preview');
regEl('keybindings-container');

global.window.input = {
  bindings: {
    punch: 'KeyJ', kick: 'KeyK', block: 'KeyU', dodge: 'KeyL',
    ultimate: 'KeyI', jump: 'Space', interact: 'KeyE', support: 'KeyH',
    run: 'ShiftLeft', up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD'
  },
  formatKeyName(code) { return (code || '').replace('Key', ''); },
  setBinding(action, code) { this.bindings[action] = code; }
};

require(path.join(rootDir, 'js/ui/menu/settings.js'));
const settingsMgr = new global.window.MenuManagerSettings();
settingsMgr.updateSettingsSummary();
assert(elementsById['save-summary'].innerHTML.includes('2/10'), 'Settings summary dynamically reads stages completed (2/10)');
assert(elementsById['save-summary'].innerHTML.includes('1/2'), 'Settings summary dynamically counts unlocked/total CHAR_SLOTS (1/2)');
assert(elementsById['save-summary'].innerHTML.includes('2/24'), 'Settings summary dynamically reads STORY_META.achievements (2/24)');

settingsMgr.showKeybindings();
// Simulate real user clicking the punch keybind button to enter listening mode
if (settingsMgr._kbRowMap && settingsMgr._kbRowMap.punch && settingsMgr._kbRowMap.punch._kbBtn) {
  const rowBtn = settingsMgr._kbRowMap.punch._kbBtn;
  rowBtn.click();
  assert(rowBtn.classList.contains('listening') && windowListeners.keydown.length === 1, 'Clicking keybind button attaches single window capture keydown listener');
  settingsMgr.cleanupKeybindingsListener();
  assert(windowListeners.keydown.length === 0, 'cleanupKeybindingsListener removes capture keydown listener');
  assert(rowBtn.textContent === 'J' && !rowBtn.classList.contains('listening'), 'cleanupKeybindingsListener restores original key label');
} else {
  assert(false, 'Keybindings row cache _kbRowMap should populate punch row button');
}

// ---------------------------------------------------------------------------
// 4. Test TrainingManagerOverlay Backdrop & Caching Guard
// ---------------------------------------------------------------------------
global.window.TrainingManagerModes = class {
  constructor() {
    this.drills = [{ title: 'Bài 1' }];
    this.currentDrillIndex = 0;
  }
};
global.window.TRAINING_CHARACTERS = [
  { id: 'nghi', name: 'NGÔ NHẤT NGHỊ', title: 'Sát Thần Việt Võ Đạo', badge: 'VOVINAM', icon: '⚡', color: '#38bdf8', desc: 'Desc', image: 'assets/images/characters/ngo_nhat_nghi_fullbody.png' }
];
require(path.join(rootDir, 'js/ui/training/trainingManagerOverlay.js'));
const tm = new global.window.TrainingManagerOverlay();
const tModal = elementsById['training-mode-modal'];
let updateDossierCalls = 0;
tModal.dataset.tBuilt = '1';
tModal._tUpdateDossier = () => { updateDossierCalls++; };
tModal.innerHTML = 'SENTINEL_CACHED';
tm.showModeSelectModal();
assert(tModal.innerHTML === 'SENTINEL_CACHED', 'Training modal does not rebuild innerHTML when dataset.tBuilt === "1"');
assert(updateDossierCalls === 1, 'Training modal invokes cached _tUpdateDossier instead of full DOM rebuild');
assert(tModal.classList.contains('hidden') === false, 'Training modal opens via uiCore');

// ---------------------------------------------------------------------------
// 5. Static Structural & Asset Integrity Verification
// ---------------------------------------------------------------------------
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const overhaulCss = fs.readFileSync(path.join(rootDir, 'css/ui-overhaul.css'), 'utf8');
const mainJs = fs.readFileSync(path.join(rootDir, 'js/core/main.js'), 'utf8');
const menuBaseJs = fs.readFileSync(path.join(rootDir, 'js/ui/menu/menuBase.js'), 'utf8');
const trainingOverlaySrc = fs.readFileSync(path.join(rootDir, 'js/ui/training/trainingManagerOverlay.js'), 'utf8');

assert(indexHtml.includes('css/ui-overhaul.css'), 'index.html loads css/ui-overhaul.css');
assert(indexHtml.includes('js/ui/uiCore.js'), 'index.html loads js/ui/uiCore.js');
assert(indexHtml.includes('id="setting-music-val"') && indexHtml.includes('id="setting-sfx-val"'), 'index.html includes live % value pills for Settings sliders');
assert(indexHtml.includes('id="settings-kb-preview"'), 'index.html includes Settings keybindings quick-preview container');

['btn-how-to-play', 'btn-dossier', 'btn-collection', 'btn-achievements', 'btn-close-skills-equip', 'btn-skills-equip-close-x']
  .forEach(id => assert(indexHtml.includes(`id="${id}"`), `index.html preserves original ID #${id}`));

assert(overhaulCss.includes('z-index: 440 !important'), 'ui-overhaul.css places #keybindings-modal above #settings-modal');
assert(overhaulCss.includes('backdrop-filter: none !important'), 'ui-overhaul.css strips costly backdrop-filter blur from menu/modals');
assert(overhaulCss.includes('#training-mode-modal #training-char-grid.cs-grid'), 'ui-overhaul.css overrides fixed grid row track in #training-char-grid');
assert(overhaulCss.includes('@media (prefers-reduced-motion: reduce)'), 'ui-overhaul.css supports prefers-reduced-motion');

assert(mainJs.includes('__vovClickBound') && menuBaseJs.includes('__vovClickBound'), 'main.js and menuBase.js share unified __vovClickBound duplicate-handler guard');
assert(trainingOverlaySrc.includes('char_select_bg.jpg') && trainingOverlaySrc.includes('t-card-faction-chip'), 'trainingManagerOverlay uses clean Võ Đường background and clean card structure');

console.log(`Results: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
