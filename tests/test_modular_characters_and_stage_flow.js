/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * tests/test_modular_characters_and_stage_flow.js
 *
 * Kiểm thử toàn diện kiến trúc phân tách từng nhân vật (js/entities/characters/*)
 * và độ vững vàng của hệ thống màn chơi, đợt quái, lưu tiến trình & chống softlock.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.performance = { now: () => Date.now() };
const memStore = {};
global.localStorage = {
  getItem: (k) => (k in memStore ? memStore[k] : null),
  setItem: (k, v) => { memStore[k] = String(v); },
  removeItem: (k) => { delete memStore[k]; }
};
global.requestAnimationFrame = () => 1;
const makeStubEl = () => ({
  width: 1280,
  height: 720,
  textContent: '',
  innerHTML: '',
  style: {},
  dataset: {},
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  addEventListener() {},
  removeEventListener() {},
  appendChild() {},
  removeAttribute() {},
  setAttribute() {},
  getAttribute: () => null,
  querySelector: () => makeStubEl(),
  querySelectorAll: () => [],
  getContext: () => ({
    save() {}, restore() {}, translate() {}, scale() {}, rotate() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, bezierCurveTo() {},
    arc() {}, ellipse() {}, rect() {}, roundRect() {}, stroke() {}, fill() {}, clip() {},
    fillRect() {}, strokeRect() {}, clearRect() {}, fillText() {}, strokeText() {},
    measureText: () => ({ width: 40 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} })
  })
});
global.document = {
  getElementById: (id) => (id === 'confrontation-modal' ? null : makeStubEl()),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: () => makeStubEl(),
  body: makeStubEl()
};

// Load toàn bộ script theo đúng thứ tự index.html
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scriptMatches = [...indexHtml.matchAll(/<script\s+src="([^"?]+)(?:\?[^"]*)?"/g)].map(m => m[1]);
for (const rel of scriptMatches) {
  if (rel.endsWith('main.js')) continue; // Không tự chạy DOMContentLoaded boot
  require(path.join(__dirname, '..', rel));
}

// Sử dụng các singleton đã được khởi tạo tự động khi nạp module
window.saveManager.skipTutorial = function () {
  this.data.tutorialSkipped = true;
};
window.saveManager.data.tutorialCompleted = true;

let passed = 0;
function check(cond, msg) {
  if (!cond) {
    console.error('❌ FAILED:', msg);
    process.exit(1);
  }
  passed++;
  console.log('✅ PASSED:', msg);
}

console.log('--- TEST 1: KIẾN TRÚC PHÂN TÁCH 16 FILE NHÂN VẬT ĐỘC LẬP ---');
const expectedChars = [
  'nghi', 'bichlam', 'huavudai', 'dinhan', 'hoanganh', 'dunghai', 'giangmanh',
  'mocdang', 'haclang', 'thietquyen', 'huyetanh', 'longvuong', 'vinhtam',
  'vananh', 'tiendang', 'thienkhanh'
];
for (const id of expectedChars) {
  const filePath = path.join(__dirname, '..', 'js', 'entities', 'characters', `${id}.js`);
  check(fs.existsSync(filePath), `Tồn tại file riêng cho nhân vật ${id}: js/entities/characters/${id}.js`);
  const mod = window.CharacterRegistry.get(id);
  check(mod && mod.dossier && mod.appearance, `CharacterRegistry nạp đầy đủ hồ sơ & ngoại hình của ${id}`);
  check(window.CHARACTERS[id] && window.CHARACTERS[id].name, `window.CHARACTERS['${id}'] tương thích ngược hoàn toàn`);
  const styleKey = mod.appearance.styleKey || id;
  check(!!window.STYLE_DEFS[styleKey], `window.STYLE_DEFS['${styleKey}'] được xuất từ module ${id}`);
}
check(window.CharacterRegistry.get('trieu_vinhtam')?.id === 'vinhtam', 'Alias trieu_vinhtam trỏ chính xác về module vinhtam');
check(window.CHAR_SLOTS.filter(s => s.id !== 'coming_soon' && !s.isLocked).length === 10, 'CHAR_SLOTS xuất đúng 10 võ sĩ điều khiển được theo uiSlotOrder (bao gồm Phó Văn Anh, Phó Tiến Đăng & Châu Ngọc Thiên Khánh)');
check(Object.keys(window.ALLY_PROFILES).length === 8, 'ALLY_PROFILES xuất đúng 8 đồng minh hỗ trợ từ các file nhân vật');
const tkSlot = window.CHAR_SLOTS.find(s => s.id === 'thienkhanh');
check(tkSlot && tkSlot.shopUnlock === true && tkSlot.shopCurrency === 'gold' && tkSlot.shopPrice === 12000, 'Châu Ngọc Thiên Khánh mở bán độc quyền 12.000 Vàng trong Khu Chiêu Mộ Võ Sĩ');

console.log('\n--- TEST 2: HOẠT ẢNH XƯƠNG RIÊNG BIỆT (NGHỊ, ĐÌNH AN, HOÀNG ANH) ---');
const testPoses = [
  { charId: 'nghi', type: 'player', states: ['idle', 'scissor_kick', 'ultimate_flurry'] },
  { charId: 'dinhan', type: 'boss_dinhan', states: ['idle', 'guard', 'boss_bash', 'ultimate_bash'] },
  { charId: 'hoanganh', type: 'boss_hoanganh', states: ['idle', 'boss_swing', 'boss_slam', 'ultimate_slam', 'boss_chain3'] }
];
for (const item of testPoses) {
  const p = new window.Player(200, 580);
  p.setCharacter(item.charId);
  for (const st of item.states) {
    p.state = st;
    p.stateTimer = 0.2;
    p.stateDuration = 0.9;
    p.animTime = 0.4;
    const pose = window.skeletalRenderer.calculatePose(p);
    check(pose && Number.isFinite(pose.torso) && Number.isFinite(pose.nA) && Number.isFinite(pose.fA), `Pose '${st}' của ${item.charId} tính toán mượt không NaN`);
  }
}

console.log('\n--- TEST 3: CHỐNG CỘNG DỒN CHỈ SỐ KHI GỌI applySelectedPassives NHIỀU LẦN ---');
for (const heroId of ['nghi', 'bichlam', 'huavudai', 'dinhan', 'hoanganh', 'dunghai', 'giangmanh']) {
  const hero = new window.Player(150, 580);
  hero.setCharacter(heroId);
  const dmg1 = hero.dmgMul;
  const spd1 = hero.speed;
  const reach1 = hero.reachMul;
  const counter1 = hero.counterBonus;
  for (let i = 0; i < 8; i++) {
    hero.applySelectedPassives();
  }
  check(
    Math.abs(hero.dmgMul - dmg1) < 1e-9 &&
    Math.abs(hero.speed - spd1) < 1e-9 &&
    Math.abs(hero.reachMul - reach1) < 1e-9 &&
    Math.abs(hero.counterBonus - counter1) < 1e-9,
    `Nhân vật ${heroId}: gọi applySelectedPassives() 8 lần giữ nguyên chỉ số chuẩn (dmgMul=${hero.dmgMul.toFixed(3)}, speed=${hero.speed})`
  );
}

console.log('\n--- TEST 4: PERFECT COUNTER ĐỌC ĐÚNG counterBonus & allyCounterBuff CỦA NGƯỜI ĐÁNH ---');
const pNghi = new window.Player(200, 570);
pNghi.setCharacter('nghi');
const pManh = new window.Player(200, 570);
pManh.setCharacter('giangmanh');

const dummy1 = new window.BaseEnemy(240, 570, 'thug');
dummy1.maxHp = 2000; dummy1.hp = 2000;
const dummy2 = new window.BaseEnemy(240, 570, 'thug');
dummy2.maxHp = 2000; dummy2.hp = 2000;

window.combatSystem.isCounterWindow = true;
window.combatSystem.resolveHit(pNghi, dummy1, { damage: 40, knockback: 4 });
const dmgNghiCounter = 2000 - dummy1.hp;

window.combatSystem.isCounterWindow = true;
pManh.allyCounterBuff = 1.3;
window.combatSystem.resolveHit(pManh, dummy2, { damage: 40, knockback: 4 });
const dmgManhCounter = 2000 - dummy2.hp;
check(dmgManhCounter > dmgNghiCounter * 1.5, `Ngô Giang Mạnh (counterBonus=2.6 * allyBuff=1.3) gây sát thương Perfect Counter vượt trội (${dmgManhCounter} vs ${dmgNghiCounter})`);

console.log('\n--- TEST 5: MÀN 5 TRỐN THOÁT KHÔNG BỊ KHÓA TƯỜNG VÔ HÌNH & LƯU TIẾN TRÌNH CHUẨN ---');
window.saveManager.resetProgress();
window.saveManager.data.tutorialCompleted = true;
window.saveManager.completeStage(4);
check(window.saveManager.data.currentStage === 6, `Hoàn thành Màn 4 chuyển tuyến chính sang Màn 6 (thực tế: ${window.saveManager.data.currentStage})`);
window.saveManager.completeStage(5);
check(window.saveManager.data.currentStage === 6, `Hoàn thành Màn phụ 5 KHÔNG làm tụt hoặc lệch currentStage=6 (thực tế: ${window.saveManager.data.currentStage})`);
window.saveManager.completeStage(20);
check(window.saveManager.data.currentStage === 20, `Hoàn thành Màn cuối 20 giữ currentStage=20, không vọt lên 21 (thực tế: ${window.saveManager.data.currentStage})`);
check(!('nghi' in window.saveManager.data.allyAvailability), 'Ngô Nhất Nghị không bị chèn nhầm vào danh sách allyAvailability');

const s1 = window.STAGE_DEFINITIONS[1], s2 = window.STAGE_DEFINITIONS[2], s3 = window.STAGE_DEFINITIONS[3], s4 = window.STAGE_DEFINITIONS[4];
check(!s1.bossClass && !s2.bossClass && !s3.bossClass && !!s4.bossClass, 'Nhịp độ chiến dịch 3-4 màn mới gặp Boss (Màn 1-3 không Boss, Màn 4 Boss Hồi I)');

const game = new window.Game();
window.game = game;
game.startStage(5);
game.state = 'PLAYING';
check(game.player.characterId === 'huavudai', 'Màn 5 tự động ép điều khiển Hứa Vũ Đại ngay cả khi chưa mở khóa trước đó');
game.player.x = 500;
game.checkWaveProgress(0.016);
check(game.arenaLocked === false && game.currentWaveActive === false, 'Màn 5 (escape): phục kích xuất hiện nhưng KHÔNG khóa tường vô hình (arenaLocked=false)');
check(game.enemies.length >= 2, 'Màn 5 vẫn sinh quái phục kích cản đường chân thực');

console.log('\n--- TEST 6: HẠ BOSS LẬP TỨC BẢO HỘ NGƯỜI CHƠI & CHẶN CHẾT OAN ---');
game.startStage(4);
game.state = 'PLAYING';
const stage4 = window.stageManager.getCurrentStage();
game.spawnBossWave(stage4.waves[2], stage4);
check(game.arenaMaxX - game.arenaMinX >= 1080 && game.arenaMaxX - game.arenaMinX <= 1380, `Đấu trường Boss có chiều rộng chuẩn (${game.arenaMaxX - game.arenaMinX}px)`);

// Giả lập đạn bay + xuất huyết ngay khoảnh khắc Boss vừa bị hạ gục
game.spawnProjectile(game.player.x + 10, game.player.y, -1, 200, 999, game.currentBoss);
game.player.bleedTimer = 2.5;
game.currentBoss.hp = 0;
game.currentBoss.isDead = true;
game.currentBoss.stateTimer = 0.1;
game.updatePlaying(0.016);

check(game.projectiles.length === 0, 'Vừa hạ Boss lập tức xóa toàn bộ đạn bay còn sót trên sân');
check(game.player.bleedTimer === 0 && game.player.invincibleTimer >= 4.5, 'Vừa hạ Boss xóa xuất huyết và cấp khiên bất tử bảo hộ người chơi');

// Kể cả khi scheduleGameOver lỡ chạy trễ sau khi Boss chết, triggerGameOver phải từ chối
game.player.isDead = true;
game.triggerGameOver();
check(game.state !== 'GAME_OVER', 'triggerGameOver bị chặn hoàn toàn khi Boss chiến dịch đã bị tiêu diệt');

game.clearLaterTimers();
game.cancelGameOverTimer();

console.log('\n--- TEST 7: ĐA DẠNG LỐI CHƠI CỐT TRUYỆN (TIMELIMIT, STORY ALLY, BÙA HỎA NGỤC, WAVE DIALOGUE) ---');
const st2 = window.STAGE_DEFINITIONS[2];
const st7 = window.STAGE_DEFINITIONS[7];
const st19 = window.STAGE_DEFINITIONS[19];
check(st2.timeLimit === 95 && window.STAGE_DEFINITIONS[12].timeLimit === 85, 'Màn 2 và Màn 12 có đồng hồ đếm ngược nhiệm vụ khẩn (95s / 85s)');
check(st7.storyAlly === 'bichlam' && window.STAGE_DEFINITIONS[15].storyAlly === 'hoanganh' && window.STAGE_DEFINITIONS[18].storyAlly === 'tiendang', 'Các màn trọng điểm gắn đồng minh cốt truyện tự động xuất chiến');
check(st19.hazardMode === 'fire_talismans' && st19.timeLimit === 105, 'Màn 19 kích hoạt cơ chế Đàn Tràng Bùa Hỏa Ngục + giới hạn 105s');
check(Array.isArray(window.STAGE_DEFINITIONS[11].waves[1].dialogue) && window.STAGE_DEFINITIONS[11].waves[1].dialogue.length > 0, 'Màn 11 có thoại giữa trận (file ghi âm Phó Mộc Đăng)');

game.startStage(2);
check(game.stageTimeLimit === 95, `Vào Màn 2 khởi tạo stageTimeLimit=95 (thực tế: ${game.stageTimeLimit})`);
game.state = 'PLAYING';
game.updateStageStoryMechanics(1.5);
check(game.stageTimeLimit < 95 && game.stageTimeLimit > 92, 'updateStageStoryMechanics(1.5) trừ đúng đồng hồ đếm ngược màn chơi');

game.startStage(19);
check(game.stageHazardMode === 'fire_talismans' && Array.isArray(game._activeHazards), 'Vào Màn 19 khởi tạo bẫy Bùa Hỏa Ngục');
game.state = 'PLAYING';
game._hazardTimer = 0.05;
game.updateStageStoryMechanics(0.1);
check(game._activeHazards.length >= 1, 'Cơ chế Màn 19 tự động thả vòng cảnh báo Bùa Hỏa trên mặt đất');

console.log('\n--- TEST 8: THIÊN KHÁNH (+10% SÁT THƯƠNG PHẢI CHỊU & HẤP TINH & XÓA SẠCH TIỂU QUỶ) ---');
window.saveManager.data.unlockedCharacters.push('thienkhanh');
const tk = new window.Player(200, 570);
tk.setCharacter('thienkhanh');
check(tk.incomingDamageMul === 1.10 && tk.passive_taThuatPhanPhe === true && tk.passive_huyetAnHapTinh === true, 'Thiên Khánh mang Tà Thuật Phản Phệ (1.10) và Huyết Ấn Hấp Tinh');
const hpBefore = tk.hp;
tk.takeDamage(100, 0, false);
check(hpBefore - tk.hp === 110, `Thiên Khánh chịu 100 ST gốc thành 110 ST (+10%) (thực nhận: ${hpBefore - tk.hp})`);

// Kiểm tra nerf Phó Văn Anh (không còn quá trâu & quá khỏe) và clearAllDebuffs khi đổi/reset
const vaTest = new window.Player(200, 570);
vaTest.setCharacter('vananh');
check(vaTest.maxHp <= 1100 && vaTest.dmgMul <= 1.15 && (vaTest.damageReduction || 0) <= 0.12, `Phó Văn Anh đã được cân bằng (hp=${vaTest.maxHp}, dmgMul=${vaTest.dmgMul.toFixed(2)}, dr=${vaTest.damageReduction})`);
vaTest.chillTimer = 3.0;
vaTest.burnTimer = 2.0;
vaTest.armorBreakTimer = 2.0;
vaTest.reset(200, 570);
check(vaTest.chillTimer === 0 && vaTest.burnTimer === 0 && vaTest.armorBreakTimer === 0 && vaTest.bleedTimer === 0, 'Player.reset() xóa sạch mọi hiệu ứng xấu từ trận trước');

// Triệu hồi Tiểu Quỷ rồi kiểm tra hồi chiêu W+U và dọn sạch khi thoát Võ Đường / đổi nhân vật / vào màn mới
const tkMod = window.CharacterRegistry.get('thienkhanh');
tkMod.passives.onStanceSpecial(tk);
check(tk._summonedFiends.length === 1 && tk._fiendSummonCd === 3.5, 'Triệu hồi [W+U] gọi 1 Âm Binh và kích hoạt hồi chiêu 3.5s');
tkMod.passives.onStanceSpecial(tk);
check(tk._summonedFiends.length === 1, 'Không cho phép spam [W+U] liên tục khi chưa hết hồi chiêu');

// Kiểm chứng thanh nội tại Hỏa Xu Tà Chú của Thiên Khánh tăng đúng logic 1 -> 2 -> 3 -> 4 (gọi 1 Âm Binh) -> 1 -> 2 -> 3 -> 4
const tkHudTarget = new window.BaseEnemy(260, 570, 'thug');
const pipsTrace = [];
for (let h = 1; h <= 4; h++) {
  tkMod.passives.onAttackHit(tk, tkHudTarget);
  const st = window.CharacterRegistry.getPassiveHudStatus(tk, [tkHudTarget]);
  pipsTrace.push(`${st.pipsFilled}/${st.pipsMax}`);
  if (h < 4) tk._fiendSummonFlashTimer = 0;
}
check(pipsTrace.join(',') === '1/4,2/4,3/4,4/4' && tk._summonedFiends.length === 2, `Chuỗi Tà Chú lần 1 tăng chuẩn 1/4->2/4->3/4->4/4 và gọi Âm Binh (got ${pipsTrace.join(',')} | fiends=${tk._summonedFiends.length})`);
tk._fiendSummonFlashTimer = 0;
const pipsTrace2 = [];
for (let h = 1; h <= 4; h++) {
  tkMod.passives.onAttackHit(tk, tkHudTarget);
  const st = window.CharacterRegistry.getPassiveHudStatus(tk, [tkHudTarget]);
  pipsTrace2.push(`${st.pipsFilled}/${st.pipsMax}`);
}
check(pipsTrace2.join(',') === '1/4,2/4,3/4,4/4' && tk._summonedFiends.length === 3, `Ngay cả khi đang có Âm Binh, nhịp Tà Chú tiếp theo vẫn tăng 1/4->2/4->3/4->4/4 chuẩn (got ${pipsTrace2.join(',')} | fiends=${tk._summonedFiends.length})`);

window.trainingManager.quitTraining();
check(window.effectManager.skillProps.filter((sp) => sp && sp.kind === 'taoist_fiend').length === 0, 'Thoát Võ Đường xóa sạch Tiểu Quỷ khỏi effectManager.skillProps');
game.player.setCharacter('thienkhanh');
tkMod.passives.onStanceSpecial(game.player);
game.startStage(4);
check(game.player.charId === 'nghi' && game.player.incomingDamageMul === 1.0, 'Đổi sang Ngô Nhất Nghị reset incomingDamageMul về 1.0');
check(game.player._summonedFiends.length === 0 && window.effectManager.skillProps.filter((sp) => sp && sp.kind === 'taoist_fiend').length === 0, 'Vào màn chơi mới không mang theo tàn dư Tiểu Quỷ từ Võ Đường/màn trước');

// Kiểm chứng tất cả 20 màn chiến dịch (M1-M20) đều chuyển sang STAGE_CLEAR hoặc CHOICE sau khi dọn sạch địch (không kẹt PLAYING)
console.log('\n--- TEST 9: RÀ SOÁT 20 MÀN CHIẾN DỊCH (KHÔNG KẸT SAU KHI DỌN ĐỊCH) ---');
const origLaterFn = game.later;
game.later = (fn) => { fn(); return 1; };
let clearedAll20 = true;
for (let stId = 1; stId <= 20; stId++) {
  game.startStage(stId);
  if (game.state === 'CUTSCENE' && window.stageManager) window.stageManager.skipDialogue();
  let guardSteps = 0;
  while (game.state !== 'STAGE_CLEAR' && game.state !== 'CHOICE' && guardSteps < 200) {
    guardSteps++;
    if (game.state === 'CUTSCENE' && window.stageManager) window.stageManager.skipDialogue();
    if (!game.currentWaveActive && !game.currentBoss) {
      game.player.x = Math.min(2500, game.player.x + 150);
    }
    for (const en of game.enemies) {
      if (!en.isDead) {
        en.hp = 0;
        en.isDead = true;
        en.stateTimer = 3.0;
      }
    }
    game.updatePlaying(0.1);
  }
  if (game.state !== 'STAGE_CLEAR' && game.state !== 'CHOICE') {
    clearedAll20 = false;
    console.error(`Màn M${stId} bị kẹt ở trạng thái ${game.state}!`);
  }
}
game.later = origLaterFn;
check(clearedAll20, 'Toàn bộ 20 màn (M1-M20) đều kết thúc màn sạch sẽ sau khi tiêu diệt hết địch');

game.clearLaterTimers();
game.cancelGameOverTimer();
console.log(`\n======================================================`);
console.log(`HOÀN TẤT XUẤT SẮC: ${passed} KIỂM THỬ MỚI ĐỀU THÀNH CÔNG 100%!`);
console.log(`======================================================`);
process.exit(0);
