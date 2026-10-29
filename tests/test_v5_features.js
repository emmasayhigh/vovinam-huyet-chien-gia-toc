/**
 * Unit Test Suite for V5.0 Features:
 * 1. Custom Keybindings (InputManager)
 * 2. Achievements & Golden Trophy Fanfare
 * 3. Dynamic Interactive Boss BGM
 * 4. Diverse Vovinam Kiai Voices
 * 5. Campaign Character Selection Flexibility
 */

const assert = require('assert');

// Mock browser globals
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.requestAnimationFrame = () => {};
global.cancelAnimationFrame = () => {};
global.performance = { now: () => Date.now() };
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};
global.document = {
  getElementById(id) {
    return {
      id,
      dataset: {},
      classList: {
        add() {},
        remove() {},
        contains() { return false; },
        toggle() { return false; }
      },
      style: {},
      textContent: '',
      addEventListener() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
      appendChild() {},
      innerHTML: '',
      getContext() {
        return {
          clearRect() {},
          save() {},
          restore() {},
          translate() {},
          rotate() {},
          scale() {},
          fillRect() {},
          strokeRect() {},
          fill() {},
          stroke() {},
          beginPath() {},
          arc() {},
          ellipse() {},
          setLineDash() {},
          createRadialGradient() { return { addColorStop() {} }; }
        };
      }
    };
  },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement() {
    return {
      classList: { add() {}, remove() {} },
      style: {},
      appendChild() {},
      addEventListener() {},
      querySelector() { return { style: {} }; },
      querySelectorAll() { return []; }
    };
  }
};
global.AudioContext = class {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
  }
  createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
  createOscillator() { return { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, type: 'sine', start() {}, stop() {}, connect() {} }; }
  createBiquadFilter() { return { frequency: { setValueAtTime() {} }, Q: { setValueAtTime() {} }, type: 'bandpass', connect() {} }; }
  createBuffer() { return { getChannelData() { return new Float32Array(100); } }; }
  createBufferSource() { return { buffer: null, loop: false, start() {}, stop() {}, connect() {} }; }
};
global.webkitAudioContext = global.AudioContext;

// Load target modules
require('../js/core/input.js');
require('../js/core/audio.js');
require('../js/core/save.js');
require('../js/world/story.js');

const InputManager = global.InputManager;
const AudioManager = global.AudioManager;
const SaveManager = global.SaveManager;
const STORY_META = global.STORY_META;

let passCount = 0;
let failCount = 0;
function test(desc, fn) {
  try {
    fn();
    console.log(`✅ PASSED: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`❌ FAILED: ${desc}\n`, err);
    failCount++;
  }
}

console.log('====================================================');
console.log('--- TEST SUITE: VOVINAM V5.0 MAJOR FEATURES ---');
console.log('====================================================');

// [1. CUSTOM KEYBINDINGS]
console.log('\n[1. Tùy Chỉnh Phím Điều Khiển (Custom Keybindings)]');
const input = new InputManager();

test('Khởi tạo bindings mặc định đầy đủ 14 hành động', () => {
  assert(input.bindings, 'bindings must exist');
  assert.strictEqual(input.bindings.punch, 'KeyJ');
  assert.strictEqual(input.bindings.kick, 'KeyK');
  assert.strictEqual(input.bindings.block, 'KeyU');
  assert.strictEqual(input.bindings.dodge, 'KeyL');
  assert.strictEqual(input.bindings.ultimate, 'KeyI');
  assert.strictEqual(input.bindings.interact, 'KeyE');
  assert.strictEqual(input.bindings.support, 'KeyH');
  assert.strictEqual(input.bindings.overdrive, 'KeyG');
  assert.strictEqual(input.bindings.jump, 'Space');
});

test('Format tên phím hiển thị thân thiện trên UI', () => {
  assert.strictEqual(input.formatKeyName('KeyJ'), 'J');
  assert.strictEqual(input.formatKeyName('Space'), 'SPACE');
  assert.strictEqual(input.formatKeyName('ArrowUp'), '↑');
  assert.strictEqual(input.formatKeyName('ArrowDown'), '↓');
  assert.strictEqual(input.formatKeyName('ArrowLeft'), '←');
  assert.strictEqual(input.formatKeyName('ArrowRight'), '→');
});

test('Đổi phím thành công và cập nhật action mapping', () => {
  input.setBinding('punch', 'KeyZ');
  assert.strictEqual(input.bindings.punch, 'KeyZ');
  assert.strictEqual(input.resolveActionCode('KeyZ'), 'KeyJ'); // Ánh xạ về virtual punch code
  assert.strictEqual(input.resolveActionCode('KeyK'), 'KeyK');
});

test('Lưu và đọc cấu hình phím từ SaveManager/localStorage', () => {
  input.saveBindings();
  const loaded = JSON.parse(localStorage.getItem('vovinam_keybindings'));
  assert.strictEqual(loaded.punch, 'KeyZ');

  const input2 = new InputManager();
  input2.loadBindings();
  assert.strictEqual(input2.bindings.punch, 'KeyZ');
});

test('Khôi phục phím mặc định (Reset to Default)', () => {
  input.resetDefaultBindings();
  assert.strictEqual(input.bindings.punch, 'KeyJ');
  assert.strictEqual(input.resolveActionCode('KeyJ'), 'KeyJ');
});

// [2. ACHIEVEMENTS & GOLDEN TROPHY FANFARE]
console.log('\n[2. Bảng Thành Tựu & Cúp Danh Dự (Achievements)]');
const save = new SaveManager();

test('Hệ thống có đầy đủ danh mục thành tựu cốt truyện & kỹ năng', () => {
  const achs = STORY_META.achievements;
  assert(achs.length >= 24, `Cần ít nhất 24 thành tựu, thực tế: ${achs.length}`);
  const ids = achs.map(a => a.id);
  assert(ids.includes('bleed_master'), 'Thiếu bleed_master');
  assert(ids.includes('stun_master'), 'Thiếu stun_master');
  assert(ids.includes('nodamage_clear'), 'Thiếu nodamage_clear');
  assert(ids.includes('scissor_master'), 'Thiếu scissor_master');
  assert(ids.includes('counter_master'), 'Thiếu counter_master');
  assert(ids.includes('deduction_master'), 'Thiếu deduction_master');
  assert(ids.includes('ally_master'), 'Thiếu ally_master');
});

test('Mở khóa thành tựu lần đầu kích hoạt cờ và trả về true', () => {
  const res = save.unlockAchievement('bleed_master');
  assert.strictEqual(res, true, 'Mở khóa lần đầu phải trả về true');
  assert(save.data.achievements.includes('bleed_master'));
});

test('Mở khóa lại thành tựu đã có trả về false (không spam)', () => {
  const res = save.unlockAchievement('bleed_master');
  assert.strictEqual(res, false, 'Mở khóa lại phải trả về false');
});

// [3. DYNAMIC INTERACTIVE BOSS BGM]
console.log('\n[3. Nhạc Nền Đổi Phase (Interactive Boss BGM)]');
const audio = global.audioManager;

test('Khởi tạo audioManager có setBossPhase và playAchievementFanfare', () => {
  assert(typeof audio.setBossPhase === 'function');
  assert(typeof audio.playAchievementFanfare === 'function');
  assert(typeof audio.playVovinamKiai === 'function');
});

test('Boss Phase thay đổi tăng nhịp điệu (Tempo & Drums)', () => {
  audio.musicPlaying = true;
  audio.baseBpm = 120;
  audio.bossPhase = 1;
  audio.setBossPhase(2, 0.55);
  assert.strictEqual(audio.bossPhase, 2);
  assert(audio.bgmIntensity >= 1.15, `bgmIntensity phải tăng, thực tế: ${audio.bgmIntensity}`);

  audio.setBossPhase(3, 0.25);
  assert.strictEqual(audio.bossPhase, 3);
  assert(audio.bgmIntensity >= 1.25, `bgmIntensity Phase 3 phải cao hơn, thực tế: ${audio.bgmIntensity}`);
});

// [4. DIVERSE VOVINAM KIAI VOICES]
console.log('\n[4. Tiếng Thét Võ Học (Kiai) Đa Dạng]');

test('Phát Kiai theo nhiều đòn thế khác nhau mà không phát sinh lỗi', () => {
  assert.doesNotThrow(() => {
    audio.playVovinamKiai('punch', 'nghi');
    audio.playVovinamKiai('kick', 'nghi');
    audio.playVovinamKiai('counter', 'dinhan');
    audio.playVovinamKiai('scissor', 'nghi');
    audio.playVovinamKiai('ultimate', 'dunghai');
    audio.playVovinamKiai('dodge', 'hoanganh');
    audio.playVovinamKiai('salute', 'nghi');
  });
});

// [5. CAMPAIGN CHARACTER SELECT FLEXIBILITY]
console.log('\n[5. Linh Hoạt Chọn Nhân Vật Trong Chiến Dịch]');

test('Chiến dịch cho phép chọn nhân vật trừ màn có forcedCharacter', () => {
  require('../js/combat/props.js');
  require('../js/entities/enemy/baseEnemy.js');
  require('../js/entities/enemy/enemyVariants.js');
  require('../js/entities/enemy/enemyBosses.js');
  require('../js/entities/enemy.js');
  require('../js/entities/bosses2.js');
  require('../js/data/stages.js');
  require('../js/world/stageManager.js');
  require('../js/world/stageRenderer.js');
  require('../js/world/stages.js');
  const stageMgr = new global.StageManager();
  const stages = stageMgr.stages;
  assert(stages, 'stages must exist');

  // Màn bình thường (không có forcedCharacter)
  const stage1 = stages[1];
  assert(!stage1.forcedCharacter, 'Màn 1 không bắt buộc nhân vật cố định');

  // Màn 5 hộ tống có forcedCharacter là Hứa Vũ Đại
  const stage5 = stages[5];
  assert(stage5, 'Màn 5 phải tồn tại');
  assert.strictEqual(stage5.forcedCharacter, 'huavudai', 'Màn 5 khóa nhân vật Hứa Vũ Đại');
});

// [6. DEMO MARTIAL ARTS MOVES SHOWCASE]
console.log('\n[6. Biểu Diễn Đòn Thế Võ Thuật (Move Showcase & Choreography)]');
require('../js/ui/menu/charSlots.js');
require('../js/ui/menu/menuBase.js');
require('../js/ui/menu/charselect/charSelectCore.js');
require('../js/ui/menu/charselect/charSelectDemo.js');
require('../js/ui/menu/charselect/charSelectDeployment.js');
require('../js/ui/menu/charSelect.js');
require('../js/ui/menu/collections.js');
require('../js/ui/menu/settings.js');
require('../js/ui/menu/chronicles.js');
require('../js/ui/menu.js');
const MenuManager = global.MenuManager;

test('Hệ thống có đầy đủ kịch bản combo biểu diễn cho các nhân vật', () => {
  assert(MenuManager, 'MenuManager must exist');
  const menu = new MenuManager();
  const nghiCombos = menu.getDemoCombos('nghi');
  assert(Array.isArray(nghiCombos) && nghiCombos.length >= 2, 'Nghị phải có ít nhất 2 combo');
  assert(nghiCombos[0].moves.length >= 3, 'Combo 1 của Nghị phải có ít nhất 3 chiêu liên hoàn');

  const dinhanCombos = menu.getDemoCombos('dinhan');
  assert(Array.isArray(dinhanCombos) && dinhanCombos.length >= 2, 'Đình An phải có combo khiên');

  const dunghaiCombos = menu.getDemoCombos('dunghai');
  assert(Array.isArray(dunghaiCombos) && dunghaiCombos.length >= 1, 'Dũng Hải phải có combo song đao');
});

test('Mỗi đòn trong combo có state, duration > 0 và sound', () => {
  const menu = new MenuManager();
  const combos = menu.getDemoCombos('nghi');
  for (const c of combos) {
    for (const m of c.moves) {
      assert(m.state, 'Mỗi move phải có state');
      assert(m.duration > 0, `duration phải > 0, thực tế: ${m.duration}`);
      assert(m.sound, 'Mỗi move phải có sound');
    }
  }
});

test('Kích hoạt triggerCsStageDemo bật sân khấu võ đài và nạp hàng đợi chiêu thức', () => {
  const menu = new MenuManager();
  menu.selectedChar = 'nghi';
  menu.triggerCsStageDemo();
  assert.strictEqual(menu._csLiveStageActive, true, 'Sân khấu 3D phải được kích hoạt');
  assert(menu._csCurrentMove, 'Phải có đòn đánh đầu tiên được nạp');
  assert(menu._csCurrentMove.duration > 0, 'Đòn đánh phải có duration');
});

test('toggleCsStageView chuyển đổi qua lại giữa Võ Đài 3D và Tranh vẽ', () => {
  const menu = new MenuManager();
  menu._csLiveStageActive = false;
  menu.toggleCsStageView();
  assert.strictEqual(menu._csLiveStageActive, true, 'Toggle lần 1 phải bật 3D');
  menu.toggleCsStageView();
  assert.strictEqual(menu._csLiveStageActive, false, 'Toggle lần 2 phải về 2D');
});

// [7. VO DUONG FULL 7 NHAN VAT LUYEN VO]
console.log('\n[7. Võ Đường Full 7 Nhân Vật Luyện Võ]');
require('../js/data/training.js');
require('../js/ui/training/trainingDummy.js');
require('../js/ui/training/trainingManagerBase.js');
require('../js/ui/training/trainingModes.js');
require('../js/ui/training/trainingManagerOverlay.js');
require('../js/ui/training.js');

test('Võ Đường có đầy đủ toàn bộ 7 võ sĩ có thể chơi được', () => {
  const chars = global.TRAINING_CHARACTERS;
  assert(Array.isArray(chars), 'TRAINING_CHARACTERS phải là một mảng');
  assert.strictEqual(chars.length, 7, 'Phải có đủ 7 nhân vật trong Võ Đường');
  const expectedIds = ['nghi', 'dinhan', 'hoanganh', 'bichlam', 'dunghai', 'huavudai', 'giangmanh'];
  const actualIds = chars.map(c => c.id);
  for (const id of expectedIds) {
    assert(actualIds.includes(id), `Thiếu võ sĩ ${id} trong Võ Đường`);
  }
});

test('Mỗi nhân vật trong Võ Đường có đầy đủ metadata hình ảnh, danh hiệu và phong cách', () => {
  for (const c of global.TRAINING_CHARACTERS) {
    assert(c.id, 'Thiếu id');
    assert(c.name, 'Thiếu name');
    assert(c.title, 'Thiếu title');
    assert(c.color, 'Thiếu color');
    assert(c.badge, 'Thiếu badge');
    assert(c.desc, 'Thiếu desc');
    assert(c.image, 'Thiếu image path');
  }
});

test('Chuyển đổi võ sĩ trong Võ Đường (setPlayerCharacter) áp dụng cho cả 7 nhân vật và reset cooldown', () => {
  const dummyPlayer = {
    setCharacter(charId) { this.characterId = charId; this.maxHp = 1000; this.maxEnergy = 100; },
    maxHp: 1000,
    hp: 100,
    maxEnergy: 100,
    energy: 0,
    dodgeCooldown: 5,
    counterHandCooldown: 3,
    counterLegCooldown: 3,
    guardGauge: 10
  };
  global.game = { player: dummyPlayer };
  const tm = new global.TrainingManager();

  const allIds = ['nghi', 'dinhan', 'hoanganh', 'bichlam', 'dunghai', 'huavudai', 'giangmanh'];
  for (const id of allIds) {
    tm.setPlayerCharacter(id);
    assert.strictEqual(dummyPlayer.characterId, id, `Nhân vật phải là ${id}`);
    assert.strictEqual(dummyPlayer.hp, 1000, 'HP phải được hồi đầy');
    assert.strictEqual(dummyPlayer.energy, 100, 'Energy phải được hồi đầy');
    assert.strictEqual(dummyPlayer.dodgeCooldown, 0, 'dodgeCooldown phải về 0');
    assert.strictEqual(dummyPlayer.counterHandCooldown, 0, 'counterHandCooldown phải về 0');
    assert.strictEqual(dummyPlayer.counterLegCooldown, 0, 'counterLegCooldown phải về 0');
    assert.strictEqual(dummyPlayer.guardGauge, 100, 'guardGauge phải đầy 100');
  }
});

// [8. HO SO NHAN VAT - TRIEU VINH TAM]
console.log('\n[8. Hồ Sơ Nhân Vật - Triệu Vinh Tâm (Dossier)]');
require('../js/entities/roster.js');

test('Hồ sơ nhân vật Triệu Vinh Tâm có key vinhtam và khớp c.id', () => {
  assert(global.CHARACTERS, 'CHARACTERS phải tồn tại');
  assert(global.CHARACTERS.vinhtam, 'CHARACTERS.vinhtam phải tồn tại');
  assert.strictEqual(global.CHARACTERS.vinhtam.id, 'vinhtam');
  assert.strictEqual(global.CHARACTERS.vinhtam.name, 'Triệu Vinh Tâm');
  assert(global.CHARACTERS['vinh tam'], 'Alias vinh tam phải tồn tại');
});

test('Hiển thị hồ sơ chi tiết Triệu Vinh Tâm không bị lỗi undefined', () => {
  const menu = new MenuManager();
  menu.dossierChar = 'vinhtam';
  const mockBody = {
    innerHTML: '',
    children: [],
    appendChild(child) {
      this.children.push(child);
    }
  };
  menu.dossierBody = mockBody;
  assert.doesNotThrow(() => {
    menu.renderDossierDetail();
  });
  assert(mockBody.children && mockBody.children.length > 0, 'Phải có nội dung hồ sơ được render');
});

console.log('====================================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount} / ${passCount + failCount} BÀI THÀNH CÔNG!`);
console.log('====================================================');
// AudioManager giữ timer/interval sống sau khi test xong; thoát tường minh để CI không bị treo.
process.exit(failCount > 0 ? 1 : 0);
