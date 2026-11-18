/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/core/account.js - Hệ thống Tài Khoản Gia Tộc, Lưu Cloud & Bảng Xếp Hạng Toàn Server
 */
(function (root) {
  const TOKEN_KEY = 'vovinam_auth_token';
  const USER_CACHE_KEY = 'vovinam_auth_user';
  const LOCAL_ACCOUNTS_KEY = 'vovinam_local_accounts_v1';
  const DEFAULT_CLOUD_SERVER_URL = 'https://vovinam-huyet-chien-gia-toc.onrender.com';

  if (typeof root.VOVINAM_DEFAULT_SERVER_URL !== 'string' || !root.VOVINAM_DEFAULT_SERVER_URL.trim()) {
    const host = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
    if (!/^(localhost|127\.0\.0\.1)$/i.test(host)) {
      root.VOVINAM_DEFAULT_SERVER_URL = DEFAULT_CLOUD_SERVER_URL;
    }
  }

  class AccountManager {
    constructor() {
      this.token = null;
      this.user = null;
      this._syncTimer = null;
      this._uiBound = false;
      this._loadStoredSession();
    }

    normalizeUsername(raw) {
      return String(raw || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
    }

    _isLocalModePreferred() {
      const sel = this._el('gate-server-select');
      return !!(sel && sel.value === 'local');
    }

    _loadLocalAccounts() {
      try {
        if (typeof localStorage === 'undefined') return {};
        const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return (parsed && typeof parsed === 'object') ? parsed : {};
      } catch (_) {
        return {};
      }
    }

    _saveLocalAccounts(accounts) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts || {}));
        }
      } catch (_) {}
    }

    _localSanitizeUser(acc) {
      const save = acc.save || {};
      return {
        username: acc.username,
        displayName: acc.displayName || acc.username,
        pvpWins: Number(acc.pvpWins || 0),
        pvpMatches: Number(acc.pvpMatches || 0),
        currentStage: Number(save.currentStage || 1),
        completedCount: Array.isArray(save.completedStages) ? save.completedStages.length : 0,
        unlockedCount: Array.isArray(save.unlockedCharacters) ? save.unlockedCharacters.length : 1,
        updatedAt: acc.updatedAt || Date.now()
      };
    }

    _localAuthLogin(username, password) {
      const u = this.normalizeUsername(username);
      const accounts = this._loadLocalAccounts();
      const acc = accounts[u];
      if (!acc) {
        return { ok: false, status: 401, userNotFound: true, error: 'Tài khoản chưa tồn tại!' };
      }
      if (String(acc.password || '') !== String(password || '')) {
        return { ok: false, status: 401, error: 'Sai tên đăng nhập hoặc mật khẩu!' };
      }
      return {
        ok: true,
        status: 200,
        local: true,
        token: `local_${u}`,
        user: this._localSanitizeUser(acc),
        save: acc.save || null
      };
    }

    _localAuthRegister(username, password, displayName, initialSave) {
      const u = this.normalizeUsername(username);
      if (!/^[a-z0-9_.-]{2,24}$/.test(u)) {
        return { ok: false, status: 400, error: 'Tên tài khoản 2-24 ký tự (chữ cái, số, _, . hoặc -)' };
      }
      if (String(password || '').length < 3) {
        return { ok: false, status: 400, error: 'Mật khẩu cần tối thiểu 3 ký tự!' };
      }
      const accounts = this._loadLocalAccounts();
      if (accounts[u]) {
        return { ok: false, status: 409, error: 'Tài khoản đã tồn tại!' };
      }
      const acc = {
        username: u,
        displayName: String(displayName || u).trim().slice(0, 24) || u,
        password: String(password),
        pvpWins: 0,
        pvpMatches: 0,
        save: initialSave || null,
        updatedAt: Date.now()
      };
      accounts[u] = acc;
      this._saveLocalAccounts(accounts);
      return {
        ok: true,
        status: 201,
        local: true,
        token: `local_${u}`,
        user: this._localSanitizeUser(acc),
        save: acc.save
      };
    }

    _el(id) {
      return (typeof document !== 'undefined' && typeof document.getElementById === 'function')
        ? document.getElementById(id)
        : null;
    }

    _toast(msg) {
      if (root.uiManager && typeof root.uiManager.showToast === 'function') {
        root.uiManager.showToast(msg);
      }
    }

    _apiBase() {
      if (typeof window !== 'undefined') {
        if (window.location) {
          try {
            if (window.location.search) {
              const srvParam = new URLSearchParams(window.location.search).get('server');
              if (srvParam && srvParam.trim()) {
                return srvParam.trim().replace(/\/+$/, '').replace(/^wss:/i, 'https:').replace(/^ws:/i, 'http:').replace(/\/ws$/i, '');
              }
            }
            if (typeof localStorage !== 'undefined') {
              const savedSrv = localStorage.getItem('vovinam_online_server_url');
              const normSaved = savedSrv ? savedSrv.trim().replace(/\/+$/, '').replace(/^wss:/i, 'https:').replace(/^ws:/i, 'http:').replace(/\/ws$/i, '') : '';
              const curOrigin = (window.location && window.location.origin) ? window.location.origin.replace(/\/+$/, '') : '';
              const isStaticSelf = Boolean(normSaved && curOrigin && normSaved === curOrigin && !/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname || ''));
              if (normSaved && !isStaticSelf) {
                return normSaved;
              }
            }
          } catch (_) {}
        }
        if (typeof root.VOVINAM_DEFAULT_SERVER_URL === 'string' && root.VOVINAM_DEFAULT_SERVER_URL.trim()) {
          return root.VOVINAM_DEFAULT_SERVER_URL.trim().replace(/\/+$/, '').replace(/^wss:/i, 'https:').replace(/^ws:/i, 'http:').replace(/\/ws$/i, '');
        }
        if (window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
          return window.location.origin;
        }
      }
      return '';
    }

    _loadStoredSession() {
      try {
        if (typeof localStorage === 'undefined') return;
        this.token = localStorage.getItem(TOKEN_KEY) || null;
        const rawUser = localStorage.getItem(USER_CACHE_KEY);
        if (rawUser) this.user = JSON.parse(rawUser);
      } catch (_) {
        this.token = null;
        this.user = null;
      }
    }

    _saveSession(token, user) {
      this.token = token || null;
      this.user = user || null;
      try {
        if (typeof localStorage !== 'undefined') {
          if (this.token) localStorage.setItem(TOKEN_KEY, this.token);
          else localStorage.removeItem(TOKEN_KEY);
          if (this.user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(this.user));
          else localStorage.removeItem(USER_CACHE_KEY);
        }
      } catch (_) {}
      this.updateUI();
    }

    isLoggedIn() {
      return !!(this.token && this.user);
    }

    async _api(path, method = 'GET', body = null) {
      const base = this._apiBase();
      if (!base || typeof fetch !== 'function') {
        return { ok: false, offline: true, error: 'Chế độ Offline chưa kết nối Server Cloud!' };
      }
      const headers = { 'Content-Type': 'application/json' };
      if (this.token && !String(this.token).startsWith('local_')) {
        headers.Authorization = `Bearer ${this.token}`;
      }
      try {
        const res = await fetch(`${base}${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined
        });
        let data = null;
        if (typeof res.text === 'function') {
          const text = await res.text().catch(() => '');
          try {
            data = text ? JSON.parse(text) : null;
          } catch (_) {
            data = null;
          }
        } else if (typeof res.json === 'function') {
          data = await res.json().catch(() => null);
        }
        if (!data || typeof data !== 'object' || (!('ok' in data) && (res.status === 404 || res.status === 405 || res.status === 501 || res.status >= 502))) {
          return { ok: false, offline: true, status: res.status, error: 'Server tĩnh chưa có Backend Cloud — chuyển sang tài khoản nội bộ!' };
        }
        return Object.assign({ status: res.status }, data);
      } catch (_) {
        return { ok: false, offline: true, error: 'Không thể kết nối tới Server!' };
      }
    }

    async refreshSession() {
      if (!this.token) return false;
      if (String(this.token).startsWith('local_')) {
        const u = this.normalizeUsername(String(this.token).slice(6));
        const accounts = this._loadLocalAccounts();
        if (accounts[u]) {
          this._saveSession(this.token, this._localSanitizeUser(accounts[u]));
          return true;
        }
        return false;
      }
      if (!this._apiBase()) return false;
      const res = await this._api('/api/auth/me', 'GET');
      if (res && res.ok && res.user) {
        this._saveSession(this.token, res.user);
        return true;
      }
      if (res && res.status === 401) {
        this._saveSession(null, null);
      }
      return false;
    }

    async login(username, password, opts = {}) {
      const cleanUser = this.normalizeUsername(username);
      let res;
      if (this._isLocalModePreferred()) {
        res = this._localAuthLogin(cleanUser, password);
      } else {
        res = await this._api('/api/auth/login', 'POST', { username: cleanUser, password });
        if (res && res.offline) {
          res = this._localAuthLogin(cleanUser, password);
        }
      }
      if (!res || !res.ok) {
        if (!opts.silentError) {
          this._toast(res && res.error ? res.error : 'Đăng nhập thất bại!');
        }
        return res;
      }
      this._saveSession(res.token, res.user);
      const sm = root.saveManager;
      if (sm && res.save && typeof res.save === 'object') {
        const localStages = (sm.data && Array.isArray(sm.data.completedStages)) ? sm.data.completedStages.length : 0;
        const cloudStages = Array.isArray(res.save.completedStages) ? res.save.completedStages.length : 0;
        if (cloudStages >= localStages) {
          sm.data = sm.sanitize(res.save);
          sm.persist(true);
        } else {
          await this.syncToCloud(true);
        }
      } else if (sm && sm.data) {
        await this.syncToCloud(true);
      }
      const onName = this._el('online-player-name');
      if (onName && res.user.displayName) onName.value = res.user.displayName;
      if (root.menuManager && typeof root.menuManager.updateMenuPlayerBar === 'function') {
        root.menuManager.updateMenuPlayerBar();
      }
      this._toast(res.local
        ? `🟢 Chào mừng ${res.user.displayName} (Lưu nội bộ)!`
        : `🟢 Chào mừng ${res.user.displayName} đã đồng bộ Cloud!`);
      return res;
    }

    async register(username, password, displayName, opts = {}) {
      const cleanUser = this.normalizeUsername(username);
      const sm = root.saveManager;
      const initialSave = (sm && sm.data) ? sm.data : null;
      let res;
      if (this._isLocalModePreferred()) {
        res = this._localAuthRegister(cleanUser, password, displayName, initialSave);
      } else {
        res = await this._api('/api/auth/register', 'POST', {
          username: cleanUser,
          password,
          displayName,
          save: initialSave
        });
        if (res && res.offline) {
          res = this._localAuthRegister(cleanUser, password, displayName, initialSave);
        }
      }
      if (!res || !res.ok) {
        if (!opts.silentError) {
          this._toast(res && res.error ? res.error : 'Đăng ký thất bại!');
        }
        return res;
      }
      this._saveSession(res.token, res.user);
      const onName = this._el('online-player-name');
      if (onName && res.user.displayName) onName.value = res.user.displayName;
      if (root.menuManager && typeof root.menuManager.updateMenuPlayerBar === 'function') {
        root.menuManager.updateMenuPlayerBar();
      }
      this._toast(res.local
        ? `🎉 Đã tạo tài khoản ${res.user.displayName} (Lưu nội bộ)!`
        : `🎉 Đã tạo tài khoản ${res.user.displayName} & sao lưu Cloud!`);
      return res;
    }

    logout() {
      this._saveSession(null, null);
      this._setGateFeedback('');
      this._setAccountFeedback('');
      this._toast('Đã đăng xuất tài khoản.');
      this.showLoginGate();
    }

    _setGateFeedback(msg, isError = false) {
      const fb = this._el('gate-auth-feedback');
      if (!fb) return;
      fb.textContent = msg || '';
      if (fb.classList) {
        fb.classList.toggle('is-error', !!isError);
      }
    }

    _setAccountFeedback(msg, isError = false) {
      const fb = this._el('acc-auth-feedback');
      if (!fb) return;
      fb.textContent = msg || '';
      if (fb.classList) {
        fb.classList.toggle('is-error', !!isError);
      }
    }

    dismissLoginGate() {
      try {
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('vov_gate_passed', '1');
      } catch (_) {}
      const gate = this._el('login-gate-overlay');
      if (gate && gate.classList) gate.classList.add('hidden');
    }

    showLoginGate() {
      try {
        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('vov_gate_passed');
      } catch (_) {}
      const gate = this._el('login-gate-overlay');
      if (gate && gate.classList) gate.classList.remove('hidden');
      this.updateUI();
    }

    scheduleCloudSync() {
      if (!this.isLoggedIn()) return;
      if (this._syncTimer) clearTimeout(this._syncTimer);
      this._syncTimer = setTimeout(() => {
        this._syncTimer = null;
        this.syncToCloud(true);
      }, 1200);
    }

    async syncToCloud(silent = false) {
      if (!this.isLoggedIn()) return { ok: false, error: 'Chưa đăng nhập!' };
      const sm = root.saveManager;
      if (!sm || !sm.data) return { ok: false };
      if (String(this.token || '').startsWith('local_')) {
        const u = this.normalizeUsername(String(this.token).slice(6));
        const accounts = this._loadLocalAccounts();
        if (accounts[u]) {
          accounts[u].save = sm.data;
          accounts[u].updatedAt = Date.now();
          this._saveLocalAccounts(accounts);
          const sanitized = this._localSanitizeUser(accounts[u]);
          this._saveSession(this.token, sanitized);
          if (!silent) this._toast('💾 Đã lưu tiến trình vào tài khoản nội bộ!');
          return { ok: true, local: true, user: sanitized, save: accounts[u].save };
        }
      }
      const res = await this._api('/api/auth/save', 'POST', {
        save: sm.data,
        displayName: this.user && this.user.displayName
      });
      if (res && res.ok && res.user) {
        this._saveSession(this.token, res.user);
        if (!silent) this._toast('☁️ Đã đồng bộ tiến trình & kho đồ lên Cloud!');
      } else if (!silent) {
        this._toast((res && res.error) || 'Không thể lưu Cloud!');
      }
      return res;
    }

    async recordPvPResult(won) {
      if (!this.isLoggedIn()) return;
      if (String(this.token || '').startsWith('local_')) {
        const u = this.normalizeUsername(String(this.token).slice(6));
        const accounts = this._loadLocalAccounts();
        if (accounts[u]) {
          accounts[u].pvpMatches = Number(accounts[u].pvpMatches || 0) + 1;
          if (won) accounts[u].pvpWins = Number(accounts[u].pvpWins || 0) + 1;
          accounts[u].updatedAt = Date.now();
          this._saveLocalAccounts(accounts);
          this._saveSession(this.token, this._localSanitizeUser(accounts[u]));
        }
        return;
      }
      if (!this._apiBase()) return;
      const res = await this._api('/api/auth/pvp-win', 'POST', { won: !!won });
      if (res && res.ok && res.user) {
        this._saveSession(this.token, res.user);
      }
    }

    async loadLeaderboard() {
      const box = this._el('account-leaderboard-list');
      if (!box) return;
      box.innerHTML = '<div class="opfp-chat-sys">⏳ Đang tải Bảng Xếp Hạng...</div>';
      const res = await this._api('/api/auth/leaderboard', 'GET');
      if (!res || !res.ok || !Array.isArray(res.leaderboard)) {
        box.innerHTML = '<div class="opfp-chat-sys">Chưa kết nối được Server Cloud (chạy npm start để xem BXH).</div>';
        return;
      }
      if (!res.leaderboard.length) {
        box.innerHTML = '<div class="opfp-chat-sys">Chưa có võ sĩ nào đăng ký — Hãy là người đầu tiên!</div>';
        return;
      }
      box.innerHTML = res.leaderboard.map((row, idx) => `
        <div class="online-room-item">
          <span><strong>#${idx + 1} ${row.displayName || row.username}</strong> (@${row.username})</span>
          <span style="color:#facc15;font-weight:800;">🏆 ${row.pvpWins || 0} Thắng PvP • M${row.currentStage || 1}</span>
        </div>
      `).join('');
    }

    openModal() {
      this.bindUI();
      this.updateUI();
      this.loadLeaderboard();
      const modal = this._el('account-modal');
      if (modal && modal.classList) modal.classList.remove('hidden');
    }

    closeModal() {
      const modal = this._el('account-modal');
      if (modal && modal.classList) modal.classList.add('hidden');
    }

    updateUI() {
      const topBtn = this._el('btn-top-account');
      if (topBtn) {
        const lbl = topBtn.querySelector ? topBtn.querySelector('.top-pill-label') : null;
        if (lbl) lbl.textContent = this.isLoggedIn() ? this.user.displayName : 'Tài Khoản';
      }
      const authPanel = this._el('account-auth-panel');
      const profilePanel = this._el('account-profile-panel');
      if (authPanel && authPanel.classList) authPanel.classList.toggle('hidden', this.isLoggedIn());
      if (profilePanel && profilePanel.classList) profilePanel.classList.toggle('hidden', !this.isLoggedIn());
      if (this.isLoggedIn() && this.user) {
        const setTxt = (id, t) => { const e = this._el(id); if (e) e.textContent = t; };
        setTxt('account-profile-name', `${this.user.displayName} (@${this.user.username})`);
        setTxt('account-profile-wins', String(this.user.pvpWins || 0));
        setTxt('account-profile-stage', `Màn ${this.user.currentStage || 1}`);
        setTxt('account-profile-heroes', `${this.user.unlockedCount || 1} Võ Sĩ`);
        setTxt('gate-welcome-name', `${this.user.displayName} (@${this.user.username})`);
        setTxt('gate-welcome-meta', `🏆 ${this.user.pvpWins || 0} Thắng PvP • Chặng Màn ${this.user.currentStage || 1}`);
      }
      const gateForm = this._el('gate-auth-form');
      const gateWelcome = this._el('gate-welcome-panel');
      const gateTabs = this._el('login-gate-overlay') && this._el('login-gate-overlay').querySelector
        ? this._el('login-gate-overlay').querySelector('.vov-gate-tabs')
        : null;
      if (gateForm && gateForm.classList) gateForm.classList.toggle('hidden', this.isLoggedIn());
      if (gateWelcome && gateWelcome.classList) gateWelcome.classList.toggle('hidden', !this.isLoggedIn());
      if (gateTabs && gateTabs.classList) gateTabs.classList.toggle('hidden', this.isLoggedIn());

      try {
        if (this.isLoggedIn() && typeof sessionStorage !== 'undefined' && sessionStorage.getItem('vov_gate_passed') === '1') {
          const gate = this._el('login-gate-overlay');
          if (gate && gate.classList) gate.classList.add('hidden');
        } else if (!this.isLoggedIn()) {
          const gate = this._el('login-gate-overlay');
          if (gate && gate.classList) gate.classList.remove('hidden');
        }
      } catch (_) {}
    }

    bindUI() {
      if (this._uiBound || typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
      const modal = this._el('account-modal');
      const topBtn = this._el('btn-top-account');
      const gateEl = this._el('login-gate-overlay');
      if (!modal && !topBtn && !gateEl) return;
      this._uiBound = true;

      const onClick = (id, fn) => {
        const el = this._el(id);
        if (!el || el.__vovAccBound || typeof el.addEventListener !== 'function') return;
        el.__vovAccBound = true;
        el.addEventListener('click', fn);
      };

      const runAuthFlow = async ({ prefix, isRegister }) => {
        const setFb = (msg, isError = false) => {
          if (prefix === 'gate') this._setGateFeedback(msg, isError);
          else this._setAccountFeedback(msg, isError);
        };
        const rawU = ((this._el(`${prefix}-username`) || {}).value || '').trim();
        const u = this.normalizeUsername(rawU);
        const p = (this._el(`${prefix}-password`) || {}).value || '';
        const d = ((this._el(`${prefix}-displayname`) || {}).value || '').trim();

        if (!u || !/^[a-z0-9_.-]{2,24}$/.test(u)) {
          const msg = 'Tên tài khoản 2-24 ký tự (không chứa ký tự đặc biệt)!';
          setFb(msg, true);
          this._toast(msg);
          return;
        }
        if (p.length < 3) {
          const msg = 'Mật khẩu cần tối thiểu 3 ký tự!';
          setFb(msg, true);
          this._toast(msg);
          return;
        }

        let res;
        if (!isRegister) {
          setFb('⏳ Đang xác thực đăng nhập...', false);
          res = await this.login(u, p, { silentError: true });
          if ((!res || !res.ok) && res && res.userNotFound) {
            setFb('⏳ Tài khoản mới — đang tự động tạo & vào game...', false);
            res = await this.register(u, p, d || rawU || u, { silentError: true });
          }
          if (!res || !res.ok) {
            this._toast((res && res.error) || 'Đăng nhập thất bại!');
          }
        } else {
          setFb('⏳ Đang tạo tài khoản Võ Sĩ mới...', false);
          res = await this.register(u, p, d || rawU || u, { silentError: true });
          if (res && res.status === 409) {
            setFb('⏳ Tài khoản đã tồn tại — đang tự động đăng nhập...', false);
            res = await this.login(u, p, { silentError: true });
          }
          if (!res || !res.ok) {
            this._toast((res && res.error) || 'Đăng ký thất bại!');
          }
        }

        if (res && res.ok) {
          setFb('', false);
          this.updateUI();
          if (prefix === 'gate') this.dismissLoginGate();
          else this.loadLeaderboard();
        } else {
          setFb((res && res.error) || 'Thao tác thất bại — vui lòng kiểm tra lại thông tin tài khoản!', true);
        }
      };

      onClick('btn-top-account', () => this.openModal());
      onClick('btn-account-close', () => this.closeModal());
      onClick('btn-account-close-x', () => this.closeModal());
      onClick('btn-account-login', () => runAuthFlow({ prefix: 'acc', isRegister: false }));
      onClick('btn-account-register', () => runAuthFlow({ prefix: 'acc', isRegister: true }));
      onClick('btn-account-sync-now', async () => {
        await this.syncToCloud(false);
        this.loadLeaderboard();
      });
      onClick('btn-account-logout', () => {
        this.logout();
        this.loadLeaderboard();
      });
      onClick('btn-account-refresh-lb', () => this.loadLeaderboard());

      let gateMode = 'login';
      const setGateMode = (mode) => {
        gateMode = mode === 'register' ? 'register' : 'login';
        const isReg = gateMode === 'register';
        const tabLogin = this._el('btn-gate-tab-login');
        const tabReg = this._el('btn-gate-tab-register');
        const btnLogin = this._el('btn-gate-login');
        const btnReg = this._el('btn-gate-register');
        const dispRow = this._el('gate-displayname-row');
        const titleEl = this._el('gate-card-title');
        const linkBtn = this._el('btn-gate-switch-mode');
        if (tabLogin && tabLogin.classList) tabLogin.classList.toggle('active', !isReg);
        if (tabReg && tabReg.classList) tabReg.classList.toggle('active', isReg);
        if (btnLogin && btnLogin.classList) btnLogin.classList.toggle('hidden', isReg);
        if (btnReg && btnReg.classList) btnReg.classList.toggle('hidden', !isReg);
        if (dispRow && dispRow.classList) dispRow.classList.toggle('hidden', !isReg);
        if (titleEl) titleEl.textContent = isReg ? 'ĐĂNG KÝ VÕ SĨ MỚI' : 'ĐĂNG NHẬP TÀI KHOẢN';
        if (linkBtn) {
          linkBtn.innerHTML = isReg
            ? 'Đã có tài khoản? <strong>Quay lại Đăng nhập</strong>'
            : 'Chưa có tài khoản? <strong>Đăng ký ngay</strong>';
        }
        this._setGateFeedback('', false);
      };

      onClick('btn-gate-tab-login', () => setGateMode('login'));
      onClick('btn-gate-tab-register', () => setGateMode('register'));
      onClick('btn-gate-switch-mode', () => setGateMode(gateMode === 'login' ? 'register' : 'login'));
      onClick('btn-gate-toggle-pw', () => {
        const pwEl = this._el('gate-password');
        const eyeEl = this._el('btn-gate-toggle-pw');
        if (!pwEl) return;
        const show = pwEl.type === 'password';
        pwEl.type = show ? 'text' : 'password';
        if (eyeEl) eyeEl.textContent = show ? '🙈' : '👁';
      });

      onClick('btn-gate-login', () => runAuthFlow({ prefix: 'gate', isRegister: false }));
      onClick('btn-gate-register', () => runAuthFlow({ prefix: 'gate', isRegister: true }));
      onClick('btn-gate-enter', () => {
        if (!this.isLoggedIn()) {
          this._setGateFeedback('Vui lòng đăng nhập để vào Đại Sảnh!', true);
          return;
        }
        this.dismissLoginGate();
      });
      onClick('btn-gate-switch', () => {
        this.logout();
        this.showLoginGate();
      });

      const bindEnterSubmit = (ids, prefix) => {
        ids.forEach((id) => {
          const inp = this._el(id);
          if (inp && !inp.__vovEnterBound && typeof inp.addEventListener === 'function') {
            inp.__vovEnterBound = true;
            inp.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                runAuthFlow({ prefix, isRegister: prefix === 'gate' && gateMode === 'register' });
              }
            });
          }
        });
      };
      bindEnterSubmit(['gate-username', 'gate-password', 'gate-displayname'], 'gate');
      bindEnterSubmit(['acc-username', 'acc-password', 'acc-displayname'], 'acc');

      const srvSel = this._el('gate-server-select');
      if (srvSel && !srvSel.__vovSrvBound && typeof srvSel.addEventListener === 'function') {
        srvSel.__vovSrvBound = true;
        srvSel.addEventListener('change', () => {
          const pill = this._el('gate-server-status');
          const lbl = this._el('gate-server-label');
          const dot = pill && pill.querySelector ? pill.querySelector('.vov-server-dot') : null;
          if (srvSel.value === 'local') {
            if (lbl) lbl.textContent = 'MÁY CHỦ S2: PHÒNG TẬP OFFLINE — LOCAL SAVE';
            if (dot && dot.classList) { dot.classList.remove('online'); dot.classList.add('offline'); }
          } else {
            if (lbl) lbl.textContent = 'MÁY CHỦ S1: ĐOẠN NGHĨA ĐÀI — ONLINE';
            if (dot && dot.classList) { dot.classList.remove('offline'); dot.classList.add('online'); }
          }
        });
      }
    }
  }

  const accountManager = new AccountManager();
  root.AccountManager = AccountManager;
  root.accountManager = accountManager;

  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('DOMContentLoaded', () => {
      accountManager.bindUI();
      accountManager.updateUI();
      if (accountManager.isLoggedIn()) {
        accountManager.refreshSession();
      }
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
