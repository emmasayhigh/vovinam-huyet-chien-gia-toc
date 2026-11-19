/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * tests/test_vovinam_skin_skills.js
 *
 * Kiểm thử tính năng: Bất kỳ nhân vật nào khi khoác Võ Phục Vovinam
 * sẽ kế thừa trọn vẹn chiêu thức, phản đòn, đòn chân kẹp & tuyệt kỹ Long Hổ Xuất Sơn của Ngô Nhất Nghị;
 * đồng thời giữ nguyên 100% bản sắc khi mặc trang phục mặc định.
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
  getElementById: (id) => makeStubEl(),
  querySelector: () => makeStubEl(),
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
  if (rel.endsWith('main.js')) continue;
  require(path.join(__dirname, '..', rel));
}

let passed = 0;
function check(cond, msg) {
  if (!cond) {
    console.error('❌ FAILED:', msg);
    process.exit(1);
  }
  passed++;
  console.log('✅ PASSED:', msg);
}

console.log('=== KIỂM THỬ: KẾ THỪA BỘ KỸ NĂNG VOVINAM KHI KHOÁC LAM VÕ PHỤC ===\n');

// Khởi tạo Player
const player = new window.Player();

// TEST 1: Ngô Nhất Nghị luôn sử dụng chuẩn Vovinam
console.log('--- TEST 1: Ngô Nhất Nghị (Mặc định chuẩn Vovinam) ---');
player.setCharacter('nghi');
check(player.isVovinamSkin === true, 'Ngô Nhất Nghị có cờ isVovinamSkin = true');
check(player.finisher === 'scissor', 'Finisher của Nghị là đòn chân kẹp (scissor)');
check(player.ultimateState === 'ultimate_flurry', 'Tuyệt kỹ của Nghị là ultimate_flurry');
check(player.passive_cuongNhu === true, 'Nội tại Cương Nhu Phối Triển được kích hoạt');
check(player.passive_batKhuat === true, 'Nội tại Bất Khuất Thân Pháp được kích hoạt');
check(player.passive_phanChau === true, 'Nội tại Gạt Quyền Phản Chưởng được kích hoạt');

// TEST 2: Đình Bích Lâm trang phục mặc định giữ nguyên phong cách cá nhân
console.log('\n--- TEST 2: Đình Bích Lâm mặc trang phục MẶC ĐỊNH ---');
window.saveManager.setSkinEquipped('bichlam', 'default');
player.setCharacter('bichlam');
check(player.isVovinamSkin === false, 'Bích Lâm mặc định: isVovinamSkin = false');
check(player.finisher === 'rush', 'Finisher mặc định của Bích Lâm là lao tới (rush)');
check(player.comboMax === 5, 'Bích Lâm mặc định có comboMax = 5 (nhờ nội tại Lục Chiến)');
check(player.passive_lucChien === true, 'Bích Lâm mặc định có nội tại Lục Chiến Y');
check(player.passive_cuongNhu === false, 'Bích Lâm mặc định KHÔNG kích hoạt Cương Nhu Vovinam');

// TEST 3: Đình Bích Lâm khoác Lam Võ Phục Vovinam (thuần trang phục — giữ nguyên bộ chiêu thức riêng)
console.log('\n--- TEST 3: Đình Bích Lâm KHOÁC VÕ PHỤC VOVINAM (CHỈ ĐỔI ÁO) ---');
window.saveManager.setSkinEquipped('bichlam', 'vovinam');
player.setCharacter('bichlam');
check(player.isVovinamSkin === true, 'Bích Lâm khoác Vovinam: isVovinamSkin = true');
check(player.equippedSkin === 'vovinam', 'Bích Lâm ghi nhận equippedSkin = vovinam');
check(player.finisher === 'rush', 'Bích Lâm giữ nguyên finisher lao tới rush (không đổi thành scissor)');
check(player.ultimateState === 'ultimate_rush', 'Bích Lâm giữ nguyên tuyệt kỹ Phong Vũ Thần Tiễn (ultimate_rush)');
check(player.ultimateType === 'rush', 'Bích Lâm giữ nguyên ultimateType = rush');
check(player.comboMax === 5, 'Bích Lâm giữ nguyên nhịp combo 5 hit Lục Chiến');
check(player.passive_lucChien === true, 'Bích Lâm giữ nguyên nội tại Lục Chiến cá nhân');
check(player.passive_cuongNhu === false, 'Bích Lâm KHÔNG chuyển sang nội tại Cương Nhu của Nghị');

const cine = window.CharacterRegistry.getUltimateCinematic('bichlam', player);
check(cine.ult === 'PHONG VŨ THẦN TIỄN', `Cinematic giữ nguyên tuyệt kỹ của Bích Lâm (${cine.ult})`);

const vovStyle = window.skeletalRenderer.getStyle(player);
check(vovStyle.gi === '#234a9c' && vovStyle.patch === true, 'Võ Phục Vovinam thay áo xanh lam (#234a9c) & phù hiệu Vovinam lên nhân vật');

// TEST 4: Các nhân vật khác khi khoác Võ Phục Vovinam đều giữ 100% skill, nội tại & vũ khí riêng
console.log('\n--- TEST 4: Hàng loạt tướng khoác Võ Phục Vovinam giữ nguyên chiêu & vũ khí gốc ---');
const testCases = [
  { id: 'huavudai', fin: 'shove', ult: 'ultimate_command', checkWeapon: (st) => st.cane === true },
  { id: 'dinhan', fin: 'bash', ult: 'ultimate_bash', checkWeapon: (st) => st.weapon === 'mace' && st.shield === true },
  { id: 'dunghai', fin: 'rush', ult: 'ultimate_feint', checkWeapon: (st) => st.weapon === 'twin_daggers' },
  { id: 'giangmanh', fin: 'counter', ult: 'ultimate_precision', checkWeapon: (st) => st.weapon === 'machete' && st.frostBlade === true },
  { id: 'hoanganh', fin: 'heavy', ult: 'ultimate_slam', checkWeapon: (st) => st.weapon === 'hoe' }
];
for (const tc of testCases) {
  window.saveManager.setSkinEquipped(tc.id, 'vovinam');
  player.setCharacter(tc.id);
  check(player.isVovinamSkin === true, `${tc.id}: isVovinamSkin = true`);
  check(player.finisher === tc.fin, `${tc.id}: giữ nguyên finisher ${tc.fin}`);
  check(player.ultimateState === tc.ult, `${tc.id}: giữ nguyên tuyệt kỹ ${tc.ult}`);
  check(player.passive_cuongNhu === false, `${tc.id}: không bị ghi đè nội tại sang Ngô Nhất Nghị`);
  const st = window.skeletalRenderer.getStyle(player);
  check(st.gi === '#234a9c' && st.patch === true && tc.checkWeapon(st), `${tc.id}: mặc áo Vovinam (#234a9c) nhưng vẫn giữ nguyên vũ khí riêng`);
}

// TEST 5: Skin ÔNG NĂM CHÈO (Đình Bích Lâm) trong Shop & hiệu ứng sóng nước
console.log('\n--- TEST 5: Skin ÔNG NĂM CHÈO (Shop + Đổi Hiệu Ứng) ---');
check(window.saveManager.isSkinUnlocked('bichlam', 'namcheo') === false, 'Skin Ông Năm Chèo ban đầu chưa mở khóa trước khi mua Shop');
window.saveManager.addDiamonds(300);
const buyRes = window.saveManager.buyShopSkin('skin_bichlam_namcheo', 'bichlam', 'namcheo', 'diamond', 150);
check(buyRes.ok === true && window.saveManager.isSkinUnlocked('bichlam', 'namcheo') === true, 'Mua thành công skin Ông Năm Chèo bằng 150 Kim Cương trong Shop Trang Phục');
check(!window.saveManager.data.unlockedCharacters.includes('skin_bichlam_namcheo'), 'Mã mua skin không bị nhầm thành character trong unlockedCharacters');

player.setCharacter('bichlam');
check(player.equippedSkin === 'namcheo' && player.isVovinamSkin === false, 'Bích Lâm trang bị equippedSkin = namcheo');
const ncStyle = window.skeletalRenderer.getStyle(player);
check(ncStyle.gi === '#0f4c5c' && ncStyle.aura === '#0ea5e9', 'Ông Năm Chèo đổi ngoại hình Bà Ba Chàm (#0f4c5c) & hào quang Sóng Nước (#0ea5e9)');
const ncTrail = window.CharacterRegistry.getTrailProfile(player, null);
check(ncTrail.primary === '#0ea5e9' && ncTrail.secondary === '#facc15', `Vệt đòn đổi thành Sóng Nước (${ncTrail.primary} / ${ncTrail.secondary})`);
const ncCine = window.CharacterRegistry.getUltimateCinematic('bichlam', player);
check(ncCine.ult.includes('CỬU LONG CUỘN SÓNG') && ncCine.color === '#ef4444', `Tuyệt kỹ đổi thành ${ncCine.ult} (tông Đỏ Thần Thoại SSS ${ncCine.color})`);
const ncHud = window.CharacterRegistry.getPassiveHudStatus(player, []);
check(ncHud.icon === '🌊' && ncHud.name.includes('ÔNG NĂM CHÈO'), `Cục Nội Tại HUD đổi thành 🌊 THỦY BÁ ÔNG NĂM CHÈO (${ncHud.name})`);

// TEST 5b: Hiệu ứng Cá Sấu cắn lên khi W+J (uppercut) & Cưỡi Thuyền + Bóng Cá Sấu 5 Chân khi Ulti (I)
console.log('\n--- TEST 5b: Hiệu ứng Cá Sấu Đớp Mồi (W+J) & Thuyền Cá Sấu 5 Chân (Ulti) + Phân bậc Đỏ SSS ---');
window.effectManager.skillProps = [];
window.CharacterRegistry.emitSkillVFX(player, 'uppercut', 0.05, 0.15, window.effectManager, []);
check(window.effectManager.skillProps.some((sp) => sp.kind === 'croc_bite'), 'Đấm móc lên (W+J) Ông Năm Chèo sinh ra hiệu ứng Cá Sấu Đớp Mồi (croc_bite)');

player.state = 'ultimate_rush';
player.stateTimer = 0.4;
player.stateDuration = 1.4;
const dummyCtx = {
  save() {}, restore() {}, translate() {}, scale() {}, rotate() {},
  beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
  quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, ellipse() {}, rect() {},
  fill() {}, stroke() {}, fillRect() {}, strokeRect() {}, clip() {},
  fillText() {}, strokeText() {},
  measureText: (s) => ({ width: (s ? s.length * 6 : 0) }),
  createLinearGradient: () => ({ addColorStop() {} }),
  createRadialGradient: () => ({ addColorStop() {} })
};
let ultRenderOk = true;
try {
  window.skeletalRenderer.render(dummyCtx, player, { x: 0, y: 0 });
} catch (err) {
  ultRenderOk = false;
  console.error('Render ult namcheo error:', err);
}
check(ultRenderOk, 'Render tuyệt kỹ Ông Năm Chèo (Thuyền gỗ + Bóng Cá Sấu 5 Chân phía sau) chạy không lỗi');
const bichlamSkins = window.MenuManager.prototype.getSkinsForChar({ id: 'bichlam', image: 'assets/images/characters/char_bichlam.png' });
const namcheoDef = bichlamSkins.find((s) => s.id === 'namcheo');
check(!!namcheoDef && namcheoDef.rarity === 'mythic' && String(namcheoDef.tier || '').includes('CHÍ TÔN PHẨM'),
      'Skin Ông Năm Chèo được phân hạng Đỏ Chí Tôn Phẩm (mythic) qua SkinRegistry');

// TEST 6: Kiểm tra UI thanh .cs-wardrobe-bar đã ẩn & phục hồi mặc định
console.log('\n--- TEST 6: Phục hồi mặc định & Kiểm tra CSS .cs-wardrobe-bar ---');
window.saveManager.setSkinEquipped('huavudai', 'default');
player.setCharacter('huavudai');
check(player.isVovinamSkin === false && player.equippedSkin === 'default', 'Hứa Vũ Đại trở về trang phục mặc định');
const menuCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'char-select.css'), 'utf8');
check(menuCss.includes('.cs-wardrobe-bar') && menuCss.includes('display: none !important;'), 'CSS đã ẩn thanh nổi .cs-wardrobe-bar bằng display: none !important;');

// TEST 7: Châu Ngọc Thiên Khánh khoác Lam Võ Phục Vovinam
console.log('\n--- TEST 7: Châu Ngọc Thiên Khánh mặc Skin Võ Phục Vovinam ---');
window.saveManager.unlockCharacter('thienkhanh');
window.saveManager.setSkinEquipped('thienkhanh', 'vovinam');
player.setCharacter('thienkhanh');
check(player.isVovinamSkin === true && player.equippedSkin === 'vovinam', 'Thiên Khánh khi trang bị Vovinam đặt đúng isVovinamSkin=true & equippedSkin="vovinam"');
const tkStyle = window.CharacterRegistry.getVovinamSkinOverrides('thienkhanh', window.CharacterRegistry.get('thienkhanh').appearance.style);
check(tkStyle.gi === '#234a9c' && tkStyle.coinVeil === true && tkStyle.weapon === 'coin_sword' && tkStyle.patch === true,
      'Vovinam skin của Thiên Khánh đổi sang Lam Võ Phục (#234a9c, patch) mà vẫn giữ nguyên mạng che mặt đồng xu & Kiếm Xu');
check(window.SkinRegistry.resolveImage('thienkhanh', 'vovinam') === 'assets/images/characters/char_thienkhanh_vovinam.png',
      'SkinRegistry.resolveImage("thienkhanh", "vovinam") trả đúng ảnh char_thienkhanh_vovinam.png');
let tkRenderOk = true;
try {
  player.state = 'idle';
  window.skeletalRenderer.render(dummyCtx, player, { x: 0, y: 0 });
} catch (err) {
  tkRenderOk = false;
  console.error('Render thienkhanh vovinam error:', err);
}
check(tkRenderOk, 'Render Thiên Khánh Lam Võ Phục Vovinam chạy an toàn không lỗi');
window.saveManager.setSkinEquipped('thienkhanh', 'default');

// TEST 8: Skin HỔ XÁM SƠN LÂM (Ngô Nhất Nghị) — Giữ hình người + Vằn hổ xám + Đấm hổ ngoạm + Ulti vồ như hổ
console.log('\n--- TEST 8: Skin HỔ XÁM SƠN LÂM (Ngô Nhất Nghị) ---');
window.saveManager.addDiamonds(400);
const buyTigerRes = window.saveManager.buyShopSkin('skin_nghi_hoxam', 'nghi', 'hoxam', 'diamond', 150);
check(buyTigerRes.ok === true && window.saveManager.isSkinUnlocked('nghi', 'hoxam') === true, 'Mua thành công skin Hổ Xám bằng 150 Kim Cương');
check(!window.saveManager.data.unlockedCharacters.includes('skin_nghi_hoxam') && !window.saveManager.data.unlockedCharacters.includes('hoxam'), 'Không nhầm Hổ Xám thành character');
player.setCharacter('nghi');
check(player.equippedSkin === 'hoxam' && player.isVovinamSkin === false, 'Ngô Nhất Nghị trang bị skin hoxam');
const tigerStyle = window.skeletalRenderer.getStyle(player);
check(tigerStyle.tigerPelt === true && tigerStyle.tigerStripes === true && tigerStyle.jawStyle === 'youth' && tigerStyle.hairStyle === 'nghi_hero', 'Skin Hổ Xám đổi trang phục vằn hổ xám nhưng vẫn giữ hình người Ngô Nhất Nghị');
window.effectManager.skillProps = [];
window.CharacterRegistry.emitSkillVFX(player, 'punch_straight', 0.28, 0.40, window.effectManager, []);
check(window.effectManager.skillProps.some((sp) => sp.kind === 'tiger_bite'), 'Đấm thẳng Ngô Nhất Nghị (Hổ Xám) tung ra hiệu ứng Hổ Ngoạm (tiger_bite)');
window.effectManager.skillProps = [];
player.state = 'ultimate_flurry';
player.stateTimer = 0.45;
player.stateDuration = 1.4;
window.CharacterRegistry.emitSkillVFX(player, 'ultimate_flurry', 0.25, 0.36, window.effectManager, []);
check(window.effectManager.skillProps.some((sp) => sp.kind === 'tiger_bite'), 'Tuyệt kỹ (I) Hổ Xám kích hoạt Hổ Ngoạm & Bóng Hổ Vồ');
const tigerHud = window.CharacterRegistry.getPassiveHudStatus(player, []);
check(tigerHud.icon === '🐯' && tigerHud.name.includes('MÃNH HỔ'), 'Cục nội tại HUD đổi thành 🐯 MÃNH HỔ XUẤT SƠN');
let tigerRenderOk = true;
try {
  window.skeletalRenderer.render(dummyCtx, player, { x: 0, y: 0 });
} catch (err) {
  tigerRenderOk = false;
  console.error('Render hoxam error:', err);
}
check(tigerRenderOk, 'Render Ngô Nhất Nghị skin Hổ Xám (dáng vồ + bóng Hổ Xám vồ phía sau) không lỗi');
window.saveManager.setSkinEquipped('nghi', 'default');

// TEST 9: Đảm bảo 2 skin Thần Trùng & Chó Đội Nón tạm thời chưa mở bán trong Shop
console.log('\n--- TEST 9: Xác nhận tạm ẩn 2 skin Thần Trùng & Chó Đội Nón khỏi Shop ---');
const visibleShopIds = window.SkinRegistry.getShopSkins().map((s) => s.id);
check(visibleShopIds.includes('namcheo') && visibleShopIds.includes('hoxam'), 'Shop Trang Phục hiển thị Ông Năm Chèo & Hổ Xám');
check(!visibleShopIds.includes('thantrung') && !visibleShopIds.includes('chodoinon'), 'Shop Trang Phục tạm thời không hiển thị Thần Trùng & Chó Đội Nón');

// TEST 10: Nâng cấp skin Thần Trùng (Châu Ngọc Thiên Khánh) sang tông Đen-Tím Hắc Ám + Ulti chém bão đường Đen-Tím
console.log('\n--- TEST 10: Nâng cấp Skin Thần Trùng (Đen-Tím Hắc Ám & Ulti Chém Đường Đen-Tím) ---');
window.saveManager.unlockCharacter('thienkhanh');
window.saveManager.setSkinEquipped('thienkhanh', 'thantrung');
player.setCharacter('thienkhanh');
check(player.equippedSkin === 'thantrung', 'Thiên Khánh trang bị skin thantrung trực tiếp từ danh sách chọn');
const ttStyle = window.skeletalRenderer.getStyle(player);
check(ttStyle.coatColor === '#09090d' && ttStyle.coatTrim === '#a855f7' && ttStyle.aura === '#9333ea' && ttStyle.weaponVoid === true,
      'Skin Thần Trùng dùng bảng màu Hắc Ám Đen-Tím (#09090d / #a855f7 / #9333ea)');
const ttTrail = window.CharacterRegistry.getTrailProfile(player, ttStyle);
check(ttTrail.darkVoid === true && ttTrail.primary === '#09090b' && ttTrail.secondary === '#9333ea',
      'Vệt chém Thần Trùng dùng tông Đen-Tím (darkVoid=true)');

window.effectManager.skillProps = [];
window.effectManager.dimensionalSlashes = [];
window.CharacterRegistry.emitSkillVFX(player, 'punch_straight', 0.25, 0.36, window.effectManager, []);
check(window.effectManager.skillProps.some((sp) => sp.kind === 'flame_coin_slash' && sp.theme === 'void'),
      'Đòn thường Thiên Khánh (Thần Trùng) sinh ra kiếm khí Đen-Tím (theme: void)');
check(window.effectManager.dimensionalSlashes.some((ds) => ds.darkCore === true),
      'Đòn đánh Thần Trùng kèm vết chém Đen-Tím sắc bén (darkCore=true)');

window.effectManager.skillProps = [];
window.effectManager.dimensionalSlashes = [];
player.state = 'ultimate_precision';
player._ultStep = 0;
const ultCharDef = window.CharacterRegistry.get('thienkhanh');
const dummyTarget = { id: 99, x: player.x + 120, y: 580, hp: 1000, isDead: false, takeDamage() {} };
ultCharDef.ultimateRuntime.execute(player, null, 0.016, [dummyTarget], { p: 0.30, hitEnemy() {} });
ultCharDef.ultimateRuntime.execute(player, null, 0.016, [dummyTarget], { p: 1.0, hitEnemy() {} });
check(window.effectManager.dimensionalSlashes.length >= 8 && window.effectManager.dimensionalSlashes.every((ds) => ds.darkCore === true),
      `Ulti Thần Trùng chém hàng loạt đường Đen-Tím cắt ngang màn hình (${window.effectManager.dimensionalSlashes.length} đường trảm)`);

let ttRenderOk = true;
try {
  window.skeletalRenderer.render(dummyCtx, player, { x: 0, y: 0 });
  window.effectManager.renderWorld(dummyCtx, { x: 0, y: 0 });
} catch (err) {
  ttRenderOk = false;
  console.error('Render thantrung void error:', err);
}
check(ttRenderOk, 'Render Thiên Khánh Thần Trùng + Hiệu ứng chém Đen-Tím hoàn hảo không lỗi');
window.saveManager.setSkinEquipped('thienkhanh', 'default');

console.log(`\n🎉 TẤT CẢ ${passed} BÀI TEST VOVINAM COSMETIC & ÔNG NĂM CHÈO ĐỀU THÀNH CÔNG 100%!\n`);
process.exit(0);
