/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * tests/test_skin_registry_and_cloud_auth.js
 *
 * Kiểm thử:
 * 1. Hệ thống SkinRegistry tách rời (js/data/skins.js) đồng bộ Kho Đồ & Cửa Hàng chỉ bằng register()
 * 2. API Tài khoản Cloud (Register, Login, Save Cloud, PvP Win, Leaderboard) trên server.js
 * 3. Bộ mở rộng âm thanh external / CoinSword SFX trên SoundEngine
 */

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const { createOnlineServer } = require('../server.js');

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

const makeStub = () => ({
  style: {},
  dataset: {},
  value: '',
  textContent: '',
  innerHTML: '',
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  addEventListener() {},
  appendChild() {},
  querySelector: () => makeStub(),
  querySelectorAll: () => [],
  getContext: () => ({
    save() {}, restore() {}, translate() {}, scale() {}, rotate() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, bezierCurveTo() {},
    arc() {}, ellipse() {}, rect() {}, roundRect() {}, stroke() {}, fill() {}, clip() {},
    fillRect() {}, strokeRect() {}, clearRect() {}, fillText() {}, strokeText() {},
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} })
  })
});

global.document = {
  getElementById: () => makeStub(),
  querySelector: () => makeStub(),
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => makeStub(),
  body: makeStub()
};

require('../js/core/audio.js');
require('../js/core/save.js');
require('../js/core/account.js');
require('../js/ui/menu/charSlots.js');
require('../js/data/skins.js');

function httpRequest(port, method, reqPath, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    if (token) headers.Authorization = `Bearer ${token}`;

    const req = http.request({ host: '127.0.0.1', port, path: reqPath, method, headers }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, raw }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  console.log('=== TEST SUITE: SKIN REGISTRY & CLOUD ACCOUNT AUTH ===\n');

  // 1. SkinRegistry tests
  assert.ok(window.SkinRegistry && window.SKIN_TIERS, 'SkinRegistry & SKIN_TIERS loaded');
  const bichlamSkins = window.SkinRegistry.getForCharacter('bichlam');
  assert.strictEqual(bichlamSkins.length, 3, 'Đình Bích Lâm có 3 skin (default, vovinam, namcheo)');
  assert.strictEqual(
    window.SkinRegistry.resolveImage('bichlam', 'namcheo'),
    'assets/images/characters/char_bichlam_namcheo.png',
    'SkinRegistry.resolveImage trả đúng ảnh Ông Năm Chèo'
  );
  assert.ok(window.SkinRegistry.getShopSkins().some((s) => s.id === 'namcheo' && s.shopCurrency === 'diamond'), 'ShopSkins liệt kê đúng Ông Năm Chèo');

  // Kiểm tra skin Hổ Xám cho Ngô Nhất Nghị & tạm ẩn 2 skin Thần Trùng / Chó Đội Nón khỏi Shop
  assert.ok(window.SkinRegistry.getForCharacter('nghi').some((s) => s.id === 'hoxam'), 'Ngô Nhất Nghị có skin Hổ Xám đăng ký trong SkinRegistry');
  assert.strictEqual(
    window.SkinRegistry.resolveImage('nghi', 'hoxam'),
    'assets/images/characters/char_nghi_hoxam.png',
    'SkinRegistry.resolveImage trả đúng ảnh Hổ Xám cho Ngô Nhất Nghị'
  );
  assert.ok(window.SkinRegistry.getShopSkins().some((s) => s.id === 'chodoinon' && s.shopCurrency === 'diamond'), 'ShopSkins liệt kê Chó Trắng Mũi Đỏ Đội Nón (Hứa Vũ Đại)');
  assert.ok(!window.SkinRegistry.getShopSkins().some((s) => s.id === 'hoxam' || s.id === 'thantrung'), '2 skin Hổ Xám & Thần Trùng không mở bán trong Shop');
  assert.ok(window.SkinRegistry.getForCharacter('thienkhanh').some((s) => s.id === 'thantrung'), 'Skin Thần Trùng vẫn hiển thị trong danh sách chọn của Thiên Khánh');
  assert.ok(window.SkinRegistry.getForCharacter('huavudai').some((s) => s.id === 'chodoinon'), 'Skin Chó Đội Nón hiển thị trong danh sách chọn của Hứa Vũ Đại');
  assert.strictEqual(window.saveManager.isSkinUnlocked('thienkhanh', 'thantrung'), true, 'Skin Thần Trùng trang bị trực tiếp được khi chưa mở bán trong Shop');
  assert.strictEqual(window.saveManager.isSkinUnlocked('nghi', 'hoxam'), true, 'Skin Hổ Xám trang bị trực tiếp được khi đã gỡ khỏi Shop');
  assert.strictEqual(window.saveManager.isSkinUnlocked('huavudai', 'chodoinon'), false, 'Skin Chó Đội Nón cần mua tại Shop khi mới tạo save');

  window.SkinRegistry.register('thienkhanh', {
    id: 'test_huyet_linh',
    name: 'Huyết Linh Tà Tôn',
    tier: window.SKIN_TIERS.thien.tier,
    shopSkin: true,
    shopCurrency: 'diamond',
    shopPrice: 220,
    image: 'assets/images/characters/char_thienkhanh.png'
  });
  const tkSkins = window.SkinRegistry.getForCharacter('thienkhanh');
  assert.strictEqual(tkSkins.length, 5, 'SkinRegistry.register tự thêm skin vào danh sách nhân vật (default, vovinam, thantrung, quydaxoa, test_huyet_linh)');
  assert.ok(window.SkinRegistry.getShopSkins().some((s) => s.id === 'test_huyet_linh'), 'Skin mới đăng ký tự động xuất hiện trong ShopSkins');

  // Kiểm chứng runtime skin styles đã tách hoàn toàn khỏi file nhân vật
  assert.ok(window.SkinRegistry.getRuntimeStyle('bichlam', 'namcheo').style.scarfColor === '#0ea5e9', 'SkinRegistry giữ runtime style Ông Năm Chèo');
  assert.ok(window.SkinRegistry.getRuntimeStyle('nghi', 'hoxam').style.tigerPelt === true, 'SkinRegistry giữ runtime style Hổ Xám Ngô Nhất Nghị');
  assert.ok(window.SkinRegistry.getRuntimeStyle('thienkhanh', 'vovinam').style.coinVeil === true, 'SkinRegistry giữ runtime style Vovinam Thiên Khánh');
  const bichlamSrc = fs.readFileSync(path.resolve(__dirname, '../js/entities/characters/bichlam.js'), 'utf8');
  const thienkhanhSrc = fs.readFileSync(path.resolve(__dirname, '../js/entities/characters/thienkhanh.js'), 'utf8');
  assert.ok(!bichlamSrc.includes('skinTrailProfiles:') && !bichlamSrc.includes('skinCinematics:'), 'bichlam.js không còn chứa block skinTrailProfiles/skinCinematics nội tuyến');
  assert.ok(!thienkhanhSrc.includes('vovinamSkin:'), 'thienkhanh.js không còn chứa block vovinamSkin nội tuyến');
  require('../js/entities/characters/characterRegistry.js');
  require('../js/entities/characters/bichlam.js');
  require('../js/entities/characters/thienkhanh.js');
  window.SkinRegistry.applyToCharacterRegistry();
  const appliedNamCheo = window.CharacterRegistry.getCustomSkinOverrides('bichlam', 'namcheo', {});
  const appliedTkVov = window.CharacterRegistry.getVovinamSkinOverrides('thienkhanh', {});
  assert.strictEqual(appliedNamCheo.scarfColor, '#0ea5e9', 'CharacterRegistry nhận đúng style namcheo qua SkinRegistry');
  assert.strictEqual(appliedTkVov.coinVeil, true, 'CharacterRegistry nhận đúng style Vovinam Thiên Khánh qua SkinRegistry');

  console.log('✓ TEST 1: Modular SkinRegistry passed');

  // 2. SoundEngine extension safety
  assert.strictEqual(typeof window.audioManager.registerTrack, 'function', 'SoundEngine.registerTrack exists');
  assert.strictEqual(typeof window.audioManager.playCoinSwordSlash, 'function', 'SoundEngine.playCoinSwordSlash exists');
  window.audioManager.playCoinSwordSlash();
  console.log('✓ TEST 2: SoundEngine extension safety passed');

  // 3. Server Auth, Cloud Save & Leaderboard API
  const tmpFile = path.join(os.tmpdir(), `vov_test_accounts_${Date.now()}.json`);
  const { server } = createOnlineServer(path.resolve(__dirname, '..'), { accountsFile: tmpFile });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  try {
    const reg = await httpRequest(port, 'POST', '/api/auth/register', {
      username: 'vovinam_pro',
      password: 'secret123',
      displayName: 'Nhất Nghị Pro',
      save: { gold: 900, diamonds: 50, currentStage: 6, completedStages: [1, 2, 3, 4], unlockedCharacters: ['nghi', 'bichlam'] }
    });
    assert.strictEqual(reg.status, 201);
    assert.strictEqual(reg.data.ok, true);
    assert.ok(reg.data.token, 'JWT/HMAC token returned on register');

    const storedRaw = fs.readFileSync(tmpFile, 'utf8');
    assert.ok(!storedRaw.includes('secret123'), 'Mật khẩu được băm scrypt, không lưu dạng rõ trong file JSON');

    const dup = await httpRequest(port, 'POST', '/api/auth/register', { username: 'vovinam_pro', password: 'secret123' });
    assert.strictEqual(dup.status, 409, 'Trùng tên đăng ký trả 409');

    const badLogin = await httpRequest(port, 'POST', '/api/auth/login', { username: 'vovinam_pro', password: 'wrong' });
    assert.strictEqual(badLogin.status, 401, 'Sai mật khẩu trả 401');

    const unknownLogin = await httpRequest(port, 'POST', '/api/auth/login', { username: 'chua_ton_tai', password: 'abc' });
    assert.strictEqual(unknownLogin.status, 401);
    assert.strictEqual(unknownLogin.data.userNotFound, true, 'Tài khoản chưa tồn tại trả về userNotFound: true');

    const goodLogin = await httpRequest(port, 'POST', '/api/auth/login', { username: 'vovinam_pro', password: 'secret123' });
    assert.strictEqual(goodLogin.status, 200);
    assert.strictEqual(goodLogin.data.save.gold, 900, 'Login khôi phục đúng save từ Cloud');

    const savedRes = await httpRequest(port, 'POST', '/api/auth/save', {
      save: { gold: 1500, diamonds: 80, currentStage: 12, completedStages: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11], unlockedCharacters: ['nghi', 'bichlam', 'thienkhanh'] }
    }, goodLogin.data.token);
    assert.strictEqual(savedRes.status, 200);
    assert.strictEqual(savedRes.data.user.currentStage, 12);

    const winRes = await httpRequest(port, 'POST', '/api/auth/pvp-win', { won: true }, goodLogin.data.token);
    assert.strictEqual(winRes.status, 200);
    assert.strictEqual(winRes.data.user.pvpWins, 1);

    const lbRes = await httpRequest(port, 'GET', '/api/auth/leaderboard');
    assert.strictEqual(lbRes.status, 200);
    assert.strictEqual(lbRes.data.leaderboard[0].username, 'vovinam_pro');
    assert.strictEqual(lbRes.data.leaderboard[0].pvpWins, 1);
    console.log('✓ TEST 3: Account Auth, Scrypt Hashing, Cloud Save & Leaderboard API passed');

    // 4. InputManager input-typing protection & AccountManager gate auto-register
    const winHandlers = {};
    const origAddEvent = global.window.addEventListener;
    global.window.addEventListener = (type, fn) => {
      (winHandlers[type] = winHandlers[type] || []).push(fn);
    };
    require('../js/core/input.js');
    global.window.addEventListener = origAddEvent;

    const origGetByIdPre = global.document.getElementById;
    let fakeGateOpen = false;
    global.document.getElementById = (id) => {
      if (id === 'login-gate-overlay') {
        return { classList: { contains: (c) => c === 'hidden' && !fakeGateOpen } };
      }
      return makeStub();
    };
    try {
      assert.ok(winHandlers.keydown && winHandlers.keydown.length > 0, 'InputManager registered keydown listener');
      for (const code of ['KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space', 'ArrowLeft']) {
        let prevented = false;
        const ev = {
          code,
          target: { tagName: 'INPUT' },
          preventDefault: () => { prevented = true; }
        };
        winHandlers.keydown.forEach((fn) => fn(ev));
        assert.strictEqual(prevented, false, `InputManager không gọi preventDefault khi đang gõ ${code} trong <input>`);
        assert.ok(!window.input.keys[code], `InputManager không giữ trạng thái phím ${code} khi đang gõ trong <input>`);
      }

      // Khi cổng đăng nhập đang mở, phím trên BODY cũng không bị kẹt/chặn
      fakeGateOpen = true;
      winHandlers.keydown.forEach((fn) => fn({ code: 'KeyD', target: { tagName: 'BODY' }, preventDefault() {} }));
      assert.ok(!window.input.keys['KeyD'], 'InputManager không bắt KeyD khi cổng đăng nhập đang mở');
      fakeGateOpen = false;

      // Khi đã vào game (không focus input, cổng đăng nhập đã ẩn), InputManager vẫn nhận KeyA bình thường
      winHandlers.keydown.forEach((fn) => fn({ code: 'KeyA', target: { tagName: 'BODY' }, preventDefault() {} }));
      assert.strictEqual(window.input.keys['KeyA'], true, 'InputManager vẫn nhận KeyA khi không focus input');
      winHandlers.keyup.forEach((fn) => fn({ code: 'KeyA', target: { tagName: 'BODY' } }));
    } finally {
      global.document.getElementById = origGetByIdPre;
    }

    // Kiểm tra normalizeUsername & auto-register khi bấm Đăng nhập với tài khoản mới
    assert.strictEqual(window.accountManager.normalizeUsername('Nguyễn Văn A'), 'nguyen_van_a', 'normalizeUsername bỏ dấu & đổi khoảng trắng thành _');

    const domEls = {};
    const makeDomEl = (id) => {
      const listeners = {};
      const el = {
        id,
        value: '',
        textContent: '',
        innerHTML: '',
        listeners,
        classList: {
          set: new Set(),
          add(c) { this.set.add(c); },
          remove(c) { this.set.delete(c); },
          toggle(c, force) {
            if (force === true) this.set.add(c);
            else if (force === false) this.set.delete(c);
            else if (this.set.has(c)) this.set.delete(c);
            else this.set.add(c);
          },
          contains(c) { return this.set.has(c); }
        },
        addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
        querySelector: () => makeStub(),
        querySelectorAll: () => []
      };
      domEls[id] = el;
      return el;
    };
    ['gate-username', 'gate-password', 'gate-displayname', 'btn-gate-login', 'gate-auth-feedback', 'login-gate-overlay'].forEach(makeDomEl);
    const origGetById = global.document.getElementById;
    global.document.getElementById = (id) => domEls[id] || makeStub();
    global.window.location = { protocol: 'http:', origin: `http://127.0.0.1:${port}` };
    global.fetch = async (url, init = {}) => {
      const parsed = new URL(url);
      const bodyObj = init.body ? JSON.parse(init.body) : null;
      const tokenHeader = init.headers && init.headers.Authorization ? init.headers.Authorization.replace(/^Bearer\s+/, '') : null;
      const r = await httpRequest(port, init.method || 'GET', parsed.pathname, bodyObj, tokenHeader);
      return { status: r.status, json: async () => r.data };
    };

    try {
      const am = new window.AccountManager();
      am._saveSession(null, null);
      am.bindUI();
      domEls['gate-username'].value = 'New Gate User';
      domEls['gate-password'].value = 'pass123';
      domEls['gate-displayname'].value = 'Cao Thủ A D';
      await domEls['btn-gate-login'].listeners.click[0]();
      assert.strictEqual(am.isLoggedIn(), true, 'Bấm Đăng nhập với tài khoản mới tự động đăng ký & đăng nhập');
      assert.strictEqual(am.user.username, 'new_gate_user', 'Username được chuẩn hóa chính xác');
      assert.strictEqual(domEls['login-gate-overlay'].classList.contains('hidden'), true, 'Cổng đăng nhập tự đóng sau khi đăng nhập');

      // Static 404 HTML fallback (e.g. Vercel without Cloud server) must fall back to local account creation cleanly
      global.fetch = async () => ({ status: 404, text: async () => '<html><body>404 Not Found</body></html>' });
      const amStatic = new window.AccountManager();
      amStatic._saveSession(null, null);
      const staticReg = await amStatic.register('vercel_player_1', '123456', 'Võ Sĩ Vercel');
      assert.strictEqual(staticReg.ok, true, 'Đăng ký trên static host trả HTTP 404 vẫn tạo tài khoản nội bộ thành công');
      assert.strictEqual(staticReg.local, true);
      const staticLogin = await amStatic.login('vercel_player_1', '123456');
      assert.strictEqual(staticLogin.ok, true, 'Đăng nhập lại bằng tài khoản nội bộ thành công');
    } finally {
      global.document.getElementById = origGetById;
      delete global.window.location;
      delete global.fetch;
    }

    const indexSrc = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    assert.ok(!indexSrc.includes('id="btn-gate-guest"'), 'Đã bỏ nút Chơi Ngay (Khách), bắt buộc đăng nhập');
    assert.ok(!indexSrc.includes('id="online-server-config-bar"'), 'Đã bỏ thanh Máy chủ WebSocket khỏi sảnh Online');
    assert.ok(!indexSrc.includes('class="online-web-share-bar"'), 'Đã bỏ thanh WEB SERVER LIVE khỏi footer sảnh Online');
    assert.ok(indexSrc.includes('id="btn-gate-tab-login"') && indexSrc.includes('id="btn-gate-tab-register"'), 'Cổng đăng nhập có tab Đăng Nhập / Đăng Ký Mới chuyên nghiệp');

    // TEST 5: Skin Chí Tôn Phẩm Thuồng Luồng (Phó Văn Anh) — Registry, Runtime Style & 3-Phase Transformation Ult
    const tlSkin = window.SkinRegistry.getSkin('vananh', 'thuongluong');
    assert.ok(tlSkin && tlSkin.id === 'thuongluong' && tlSkin.styleKey === 'vananh_thuongluong', 'SkinRegistry đăng ký thành công skin thuongluong cho vananh');
    assert.strictEqual(tlSkin.shopSkin, false, 'Skin thuongluong mở sẵn trong danh sách chọn trang phục (không chiếm ô shop)');
    assert.ok(fs.existsSync(path.resolve(__dirname, '../assets/images/characters/char_vananh_thuongluong.png')), 'Ảnh chân dung char_vananh_thuongluong.png tồn tại trong assets');
    const tlRuntime = window.SkinRegistry.getRuntimeStyle('vananh', 'thuongluong');
    assert.ok(tlRuntime && tlRuntime.style && tlRuntime.style.serpentSuit && tlRuntime.style.serpentTail && tlRuntime.style.serpentSpines, 'Runtime style Thuồng Luồng có đầy đủ bộ đồ vảy, đuôi và vây đỏ');
    const gameBaseSrc = fs.readFileSync(path.resolve(__dirname, '../js/core/gameBase.js'), 'utf8');
    const gameSrc = fs.readFileSync(path.resolve(__dirname, '../js/core/game.js'), 'utf8');
    const vananhSrc = fs.readFileSync(path.resolve(__dirname, '../js/entities/characters/vananh.js'), 'utf8');
    assert.ok(vananhSrc.includes('hitEnemy(target, 22, 0, false)'), 'Pha 1 Ulti Thuồng Luồng dùng knockback = 0');
    assert.ok(gameBaseSrc.includes('isThuongLuongPassThrough'), 'GameBase bỏ qua giãn cách thân người khi Thuồng Luồng lao xuyên qua');
    assert.ok(gameSrc.includes('tlUltSelf') && gameSrc.includes('tlUltPeer'), 'PvP Game bỏ qua giãn cách thân người khi Thuồng Luồng lao xuyên qua');

    // TEST 7: Skin Chí Tôn Phẩm Ngư Tinh (Phó Tiến Đăng) — Registry, Runtime Style & Non-P2W Parity
    const ntSkin = window.SkinRegistry.getSkin('tiendang', 'ngutinh');
    assert.ok(ntSkin && ntSkin.id === 'ngutinh' && ntSkin.styleKey === 'tiendang_ngutinh', 'SkinRegistry đăng ký thành công skin ngutinh cho tiendang');
    assert.strictEqual(ntSkin.shopSkin, false, 'Skin ngutinh mở sẵn trong danh sách chọn trang phục (không chiếm ô shop)');
    assert.ok(fs.existsSync(path.resolve(__dirname, '../assets/images/characters/char_tiendang_ngutinh.png')), 'Ảnh chân dung char_tiendang_ngutinh.png tồn tại trong assets');
    const ntRuntime = window.SkinRegistry.getRuntimeStyle('tiendang', 'ngutinh');
    assert.ok(ntRuntime && ntRuntime.style && ntRuntime.style.nguTinhSuit && ntRuntime.style.nguTinhTail && ntRuntime.style.nguTinhFin && ntRuntime.style.nguTinhTalisman, 'Runtime style Ngư Tinh có đầy đủ vảy bạc, đuôi xương, vây tím & bùa cổ');
    const tiendangSrc = fs.readFileSync(path.resolve(__dirname, '../js/entities/characters/tiendang.js'), 'utf8');
    const effectsSrc = fs.readFileSync(path.resolve(__dirname, '../js/core/effects.js'), 'utf8');
    assert.ok(tiendangSrc.includes('isNguTinhSkin') && tiendangSrc.includes('createNguTinhSkyDrop') && tiendangSrc.includes('emergeTriggered = true') && tiendangSrc.includes('createNguTinhFangsBite') && tiendangSrc.includes('hitEnemy(target, 42, 5, false)') && tiendangSrc.includes('hitEnemy(e, 175, 18, true)'), 'Skin Ngư Tinh rơi 1 lần chìm đất -> kết thúc I trồi lên cắn rồi bay lên trời biến mất (42/175 dmg)');
    assert.ok(effectsSrc.includes("sf.kind === 'ngutinh_sky_drop'") && effectsSrc.includes("sf.kind === 'ngutinh_fangs'") && effectsSrc.includes("sf.kind === 'ngutinh_seal'") && effectsSrc.includes("sf.kind === 'ngutinh_spines'"), 'Effects có đủ 4 VFX Ngư Tinh độc quyền');

    // TEST 8: Phân bậc lại toàn bộ Skin (Tím/Vàng/Đỏ) & Nâng cấp Thần Trùng (Thiên Khánh)
    const dogSk = window.SkinRegistry.getSkin('huavudai', 'chodoinon');
    const tigerSk = window.SkinRegistry.getSkin('nghi', 'hoxam');
    const crowSk = window.SkinRegistry.getSkin('thienkhanh', 'thantrung');
    const fishSk = window.SkinRegistry.getSkin('tiendang', 'ngutinh');
    const boatSk = window.SkinRegistry.getSkin('bichlam', 'namcheo');
    const dragonSk = window.SkinRegistry.getSkin('vananh', 'thuongluong');
    assert.ok(dogSk.rarity === 'epic' && tigerSk.rarity === 'epic', 'Chó Đội Nón & Hổ Xám phân hạng Địa Phẩm (Tím)');
    assert.ok(crowSk.rarity === 'legendary' && fishSk.rarity === 'legendary', 'Thần Trùng & Ngư Tinh phân hạng Thần Phẩm (Vàng)');
    assert.ok(boatSk.rarity === 'mythic' && dragonSk.rarity === 'mythic', 'Ông Năm Chèo & Thuồng Luồng phân hạng Chí Tôn Phẩm (Đỏ)');
    const crowRuntime = window.SkinRegistry.getRuntimeStyle('thienkhanh', 'thantrung');
    assert.ok(crowRuntime && crowRuntime.style && crowRuntime.style.thanTrungFeathers && crowRuntime.style.thanTrungCrowFamiliar, 'Skin Thần Trùng nâng cấp có lông quạ & Linh Quạ hộ vệ sau vai');
    const thienKhanhSrc = fs.readFileSync(path.resolve(__dirname, '../js/entities/characters/thienkhanh.js'), 'utf8');
    assert.ok(thienKhanhSrc.includes('createThanTrungCursedMoon') && thienKhanhSrc.includes('createThanTrungCrowFlock') && thienKhanhSrc.includes('hitEnemy(target, isPvpOnlineMatch() ? 58 : 74, 10, false)'), 'Thần Trùng nâng cấp dùng Hắc Nguyệt & Đàn Quạ Đen, giữ đúng thông số sát thương Thiên Khánh gốc');

    // TEST 9: Võ Đường dọn sạch linh vật triệu hồi & hiệu ứng tồn đọng khi đổi tướng / reset [R]
    const playerBaseSrc = fs.readFileSync(path.resolve(__dirname, '../js/entities/player/playerBase.js'), 'utf8');
    const trainingModesSrc = fs.readFileSync(path.resolve(__dirname, '../js/ui/training/trainingModes.js'), 'utf8');
    const trainingBaseSrc = fs.readFileSync(path.resolve(__dirname, '../js/ui/training/trainingManagerBase.js'), 'utf8');
    assert.ok(playerBaseSrc.includes('f.life = 0') && effectsSrc.includes('sp._staleWatch'), 'Linh vật cũ tự thu hồi khi đổi tướng hoặc ngưng cập nhật');
    assert.ok(trainingModesSrc.includes('clearCombatEffects') && trainingBaseSrc.includes('clearCombatEffects'), 'Đổi tướng và Reset [R] trong Võ Đường dọn sạch hiệu ứng cũ');

    // TEST 10: Thiên Khánh — Skin Chí Tôn Quỷ Dạ Xoa (Mặt nạ, Katana, 3 VFX Quỷ & Ulti Cutscene Tra Kiếm kích nổ)
    const oniSk = window.SkinRegistry.getSkin('thienkhanh', 'quydaxoa');
    assert.ok(oniSk && oniSk.rarity === 'mythic' && oniSk.image === 'assets/images/characters/char_thienkhanh_quydaxoa.png', 'Skin Quỷ Dạ Xoa phân hạng Chí Tôn Phẩm (Đỏ) & có ảnh riêng');
    const oniRuntime = window.SkinRegistry.getRuntimeStyle('thienkhanh', 'quydaxoa');
    assert.ok(oniRuntime && oniRuntime.style && oniRuntime.style.oniMask && oniRuntime.style.oniArmor && oniRuntime.style.weapon === 'oni_katana', 'Quỷ Dạ Xoa có mặt nạ Dạ Xoa, giáp Samurai Đỏ-Vàng & Katana');
    assert.ok(oniRuntime.cinematic && oniRuntime.cinematic.style === 'oni_demon', 'Quỷ Dạ Xoa dùng Cutscene riêng style oni_demon');
    assert.ok(effectsSrc.includes('createOniDemonUppercutHand') && effectsSrc.includes('createOniDemonPushHand') && effectsSrc.includes('createOniDemonAerialSlash') && effectsSrc.includes('createOniPinnedSlash') && effectsSrc.includes('detonateOniPinnedSlashes') && effectsSrc.includes("c.style === 'oni_demon'"), 'Effects có đủ 3 VFX Quỷ Thủ/Không Trảm, nhát chém ghim nổ & Cutscene code Quỷ Dạ Xoa');
    assert.ok(effectsSrc.includes('createOniKatanaSmear') && effectsSrc.includes('createOniJudgmentBarrage') && effectsSrc.includes('oni_uppercut_fist.png') && effectsSrc.includes('oni_push_palm.png') && effectsSrc.includes('nga_quy_fiend.png'), 'Quỷ Dạ Xoa có hiệu ứng chém Trắng+Đỏ, bão hàng chục vết chém, sprite nắm đấm/bàn tay & Ngạ Quỷ');
    assert.ok(thienKhanhSrc.includes('isQuyDaXoaSkin') && thienKhanhSrc.includes('detonateOniPinnedSlashes') && thienKhanhSrc.includes('createOniJudgmentBarrage') && thienKhanhSrc.includes("'ngaquy'") && !thienKhanhSrc.includes('<= (isOni ? 440 : 280)') && !thienKhanhSrc.includes('_oniPendingDmg'), 'Thiên Khánh Quỷ Dạ Xoa giữ chuẩn 100% Non-P2W (tầm 280 & sát thương y hệt bản gốc), có dáng Samurai điềm tĩnh, Ngạ Quỷ & bão chém Trắng+Đỏ khi tra kiếm');

    // TEST 11: Giao diện Mobile Responsive & Ẩn/Hiện Touch Controls thông minh
    const indexHtmlSrc = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    const mainJsSrc = fs.readFileSync(path.resolve(__dirname, '../js/core/main.js'), 'utf8');
    assert.ok(indexHtmlSrc.includes('css/mobile.css') && fs.existsSync(path.resolve(__dirname, '../css/mobile.css')), 'index.html nạp stylesheet css/mobile.css dành riêng cho giao diện di động');
    assert.ok(mainJsSrc.includes('syncTouchControlsVisibility') && mainJsSrc.includes('BLOCKING_OVERLAY_IDS'), 'Touch controls tự động ẩn ở Login/Menu/Modal và chỉ hiện khi vào trận');

    // TEST 6: AccountManager Local Mirror & Auto-Recovery when Cloud Server wipes accounts.json (Render redeploy)
    {
      const amRec = new window.AccountManager();
      const richSave = {
        completedStages: [1, 2, 3, 4, 5],
        currentStage: 6,
        unlockedCharacters: ['nghi', 'bichlam', 'vananh'],
        shopPurchases: ['vananh'],
        gold: 4200,
        diamonds: 180
      };
      amRec._mirrorAccountToLocal('old_hero_99', 'Cao Thủ Cũ', richSave, { pvpWins: 7, pvpMatches: 10 }, 'secret123');
      let registeredSavePayload = null;
      const prevFetch = global.fetch;
      const prevLoc = global.window.location;
      global.window.location = { protocol: 'http:', origin: 'http://127.0.0.1:9999' };
      global.fetch = async (url, init = {}) => {
        if (String(url).includes('/api/auth/login')) {
          return { status: 401, text: async () => JSON.stringify({ ok: false, userNotFound: true, error: 'Tài khoản chưa tồn tại!' }) };
        }
        if (String(url).includes('/api/auth/register')) {
          const body = JSON.parse(init.body || '{}');
          registeredSavePayload = body.save;
          return { status: 201, text: async () => JSON.stringify({ ok: true, token: 'tok_restored', user: { username: body.username, displayName: body.displayName }, save: body.save }) };
        }
        return { status: 200, text: async () => JSON.stringify({ ok: true }) };
      };
      try {
        const loginRes = await amRec.login('old_hero_99', 'secret123', { silentError: true });
        assert.ok(loginRes && loginRes.userNotFound && loginRes.localBackup && loginRes.localBackup.save, 'Login trả về localBackup khi Cloud mất data sau redeploy');
        const regRes = await amRec.register('old_hero_99', 'secret123', loginRes.localBackup.displayName, { silentError: true, restoredSave: loginRes.localBackup.save });
        assert.strictEqual(regRes.ok, true, 'Tự đăng ký lại lên Cloud thành công với bản sao lưu cục bộ');
        assert.deepStrictEqual(registeredSavePayload.completedStages, [1, 2, 3, 4, 5], 'Tiến trình 5 màn cũ được đẩy ngược lên Cloud nguyên vẹn');
        assert.strictEqual(registeredSavePayload.gold, 4200, 'Vàng cũ được khôi phục nguyên vẹn');
      } finally {
        global.fetch = prevFetch;
        if (prevLoc === undefined) delete global.window.location;
        else global.window.location = prevLoc;
      }
    }

    console.log('✓ TEST 4, 5 & 6: Auth gate, Thuong Luong skin & Account Local Mirror auto-recovery passed');
  } finally {
    server.close();
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }

  console.log('\n================================================');
  console.log('SKIN REGISTRY & CLOUD AUTH TESTS PASSED 100%!');
  console.log('================================================');
  process.exit(0);
})().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
