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

  // Đăng ký thử 1 skin mới động hoàn toàn
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
  assert.strictEqual(tkSkins.length, 3, 'SkinRegistry.register tự thêm skin vào danh sách nhân vật');
  assert.ok(window.SkinRegistry.getShopSkins().some((s) => s.id === 'test_huyet_linh'), 'Skin mới đăng ký tự động xuất hiện trong ShopSkins');

  // Kiểm chứng runtime skin styles đã tách hoàn toàn khỏi file nhân vật
  assert.ok(window.SkinRegistry.getRuntimeStyle('bichlam', 'namcheo').style.scarfColor === '#0ea5e9', 'SkinRegistry giữ runtime style Ông Năm Chèo');
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
    console.log('✓ TEST 4: InputManager typing guard & AccountManager gate auto-register passed');
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
