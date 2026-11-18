/**
 * VOVINAM: SÁT THẦN GIẢI CỨU HỨA VŨ ĐẠI
 * js/input.js - Keyboard State Manager & Action Buffer Queue
 * Hỗ trợ đa phím đồng thời, combo buffering mượt mà
 */

const DEFAULT_KEYBINDINGS = {
  punch: 'KeyJ',
  kick: 'KeyK',
  block: 'KeyU',
  dodge: 'KeyL',
  ultimate: 'KeyI',
  jump: 'Space',
  interact: 'KeyE',
  support: 'KeyH',
  overdrive: 'KeyG',
  up: 'KeyW',
  down: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  run: 'ShiftLeft'
};

class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this.actionBuffer = [];
    this.bufferTimeout = 0.15; // 150ms buffer timeout — phản hồi nhanh, chống chồng đòn
    this.lastKeyDownTime = {};

    // Khóa debounce cho tổ hợp U+J và U+K (giữ phím không tự động kích hoạt đòn vô hạn)
    this._counterHandHandled = false;
    this._counterLegHandled = false;

    // Tùy chỉnh phím điều khiển (Custom Keybindings)
    this.DEFAULT_BINDINGS = Object.assign({}, DEFAULT_KEYBINDINGS);
    this.bindings = Object.assign({}, DEFAULT_KEYBINDINGS);
    this.loadBindings();

    this.bindEvents();
  }

  loadBindings() {
    try {
      const raw = localStorage.getItem('vovinam_keybindings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          Object.assign(this.bindings, parsed);
        }
      }
    } catch (_) {}
  }

  saveBindings() {
    try {
      localStorage.setItem('vovinam_keybindings', JSON.stringify(this.bindings));
      if (window.saveManager && window.saveManager.data) {
        window.saveManager.data.customKeybindings = Object.assign({}, this.bindings);
        if (typeof window.saveManager.save === 'function') window.saveManager.save();
      }
    } catch (_) {}
    this.updateHudKeyBadges();
  }

  setBinding(action, code) {
    if (this.bindings[action] !== undefined && code) {
      this.bindings[action] = code;
      this.saveBindings();
    }
  }

  resetDefaultBindings() {
    this.bindings = Object.assign({}, this.DEFAULT_BINDINGS);
    this.saveBindings();
  }

  formatKeyName(code) {
    if (!code) return '';
    if (code.startsWith('Key')) return code.slice(3).toUpperCase();
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return 'NUM ' + code.slice(6);
    const map = {
      Space: 'SPACE',
      ShiftLeft: 'L-SHIFT',
      ShiftRight: 'R-SHIFT',
      ControlLeft: 'L-CTRL',
      ControlRight: 'R-CTRL',
      AltLeft: 'L-ALT',
      AltRight: 'R-ALT',
      ArrowUp: '↑',
      ArrowDown: '↓',
      ArrowLeft: '←',
      ArrowRight: '→',
      Enter: 'ENTER',
      Backspace: 'BACKSPACE',
      Tab: 'TAB',
      Escape: 'ESC'
    };
    return map[code] || code.toUpperCase();
  }

  updateHudKeyBadges() {
    const uKey = this.formatKeyName(this.bindings.block || 'KeyU');
    const jKey = this.formatKeyName(this.bindings.punch || 'KeyJ');
    const kKey = this.formatKeyName(this.bindings.kick || 'KeyK');
    const lKey = this.formatKeyName(this.bindings.dodge || 'KeyL');
    const iKey = this.formatKeyName(this.bindings.ultimate || 'KeyI');
    const hKey = this.formatKeyName(this.bindings.support || 'KeyH');

    const bHand = document.querySelector('#badge-counter-hand .skill-key');
    if (bHand) bHand.textContent = `${uKey}+${jKey}`;
    const bLeg = document.querySelector('#badge-counter-leg .skill-key');
    if (bLeg) bLeg.textContent = `${uKey}+${kKey}`;
    const bDodge = document.querySelector('#badge-dodge .skill-key');
    if (bDodge) bDodge.textContent = lKey;

    const bUlt = document.getElementById('ultimate-ready-badge');
    if (bUlt) bUlt.textContent = `TUYỆT KỸ SẴN SÀNG! [PHÍM ${iKey}]`;
    const bAlly = document.getElementById('ally-ready-badge');
    if (bAlly) bAlly.textContent = `ĐỒNG MINH SẴN SÀNG! [PHÍM ${hKey}]`;
  }

  // Tra cứu mã phím tương ứng (gốc hoặc đã đổi phím)
  resolveActionCode(code) {
    if (code === this.bindings.punch) return 'KeyJ';
    if (code === this.bindings.kick) return 'KeyK';
    if (code === this.bindings.block) return 'KeyU';
    if (code === this.bindings.dodge) return 'KeyL';
    if (code === this.bindings.ultimate) return 'KeyI';
    if (code === this.bindings.jump) return 'Space';
    if (code === this.bindings.interact) return 'KeyE';
    if (code === this.bindings.support) return 'KeyH';
    if (code === this.bindings.overdrive) return 'KeyG';
    return code;
  }

  // Kiểm tra người chơi đang gõ chữ trong ô nhập liệu hoặc đang ở cổng đăng nhập
  isTypingInInput(e) {
    const target = (e && e.target) || (typeof document !== 'undefined' ? document.activeElement : null);
    if (target) {
      const tag = String(target.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
        return true;
      }
    }
    if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
      const gate = document.getElementById('login-gate-overlay');
      if (gate && gate.classList && typeof gate.classList.contains === 'function' && !gate.classList.contains('hidden')) {
        return true;
      }
    }
    return false;
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (this.isTypingInInput(e)) return;

      const code = e.code;
      const resolved = this.resolveActionCode(code);

      // Ngăn chặn cuộn trang mặc định với các phím điều khiển
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', this.bindings.up, this.bindings.down, this.bindings.left, this.bindings.right, this.bindings.jump].includes(code)) {
        e.preventDefault();
      }

      if (!this.keys[code]) {
        this.justPressed[code] = true;
        this.lastKeyDownTime[code] = performance.now();
        if (resolved !== code) {
          this.justPressed[resolved] = true;
          this.lastKeyDownTime[resolved] = performance.now();
        }

        // Khi người chơi bấm J hoặc K trong lúc đang giữ U, mở khóa debounce để counter kích hoạt tức thì
        if (resolved === 'KeyJ' || code === 'KeyJ') {
          this._counterHandHandled = false;
        }
        if (resolved === 'KeyK' || code === 'KeyK') {
          this._counterLegHandled = false;
        }

        // Đưa đòn đánh vào buffer để nhận diện combo & tổ hợp mượt mà
        if (['KeyJ', 'KeyK', 'KeyL', 'KeyI', 'KeyU', 'KeyG', 'Space'].includes(resolved) ||
            ['KeyJ', 'KeyK', 'KeyL', 'KeyI', 'KeyU', 'KeyG', 'Space'].includes(code)) {
          if (!Array.isArray(this.actionBuffer)) this.actionBuffer = [];
          this.actionBuffer.push({
            code: resolved,
            rawCode: code,
            timestamp: performance.now()
          });
        }
      }
      this.keys[code] = true;
      if (resolved !== code) this.keys[resolved] = true;

      // Unlock AudioContext khi người chơi bấm phím bất kỳ
      if (window.audioManager) {
        window.audioManager.unlock();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.isTypingInInput(e)) return;

      const code = e.code;
      const resolved = this.resolveActionCode(code);
      this.keys[code] = false;
      if (resolved !== code) this.keys[resolved] = false;

      if (resolved === 'KeyU' || resolved === 'KeyJ' || code === 'KeyU' || code === 'KeyJ') {
        this._counterHandHandled = false;
      }
      if (resolved === 'KeyU' || resolved === 'KeyK' || code === 'KeyU' || code === 'KeyK') {
        this._counterLegHandled = false;
      }
    });

    // Unlock AudioContext khi người chơi chạm màn hình
    window.addEventListener('touchstart', () => {
      if (window.audioManager) {
        window.audioManager.unlock();
      }
    }, { passive: true });

    // Reset trạng thái khi người chơi chuyển tab
    window.addEventListener('blur', () => {
      this.keys = {};
      this.justPressed = {};
      this.actionBuffer = [];
      this._counterHandHandled = false;
      this._counterLegHandled = false;
    });
  }

  // Điều khiển ảo cho màn hình cảm ứng / Touchpad
  setVirtualKey(code, isPressed) {
    if (isPressed) {
      if (!this.keys[code]) {
        this.justPressed[code] = true;
        this.lastKeyDownTime[code] = performance.now();
        if (['KeyJ', 'KeyK', 'KeyL', 'KeyI', 'KeyU', 'KeyG', 'Space'].includes(code)) {
          this.actionBuffer.push({
            code: code,
            timestamp: performance.now()
          });
          if (navigator.vibrate) {
            try { navigator.vibrate(12); } catch (_) {}
          }
        }
      }
      this.keys[code] = true;
      if (window.audioManager) {
        window.audioManager.unlock();
      }
    } else {
      this.keys[code] = false;
      if (code === 'KeyU' || code === 'KeyJ') {
        this._counterHandHandled = false;
      }
      if (code === 'KeyU' || code === 'KeyK') {
        this._counterLegHandled = false;
      }
    }
  }

  // ==========================================================================
  // PHÁT HIỆN TỔ HỢP PHÍM COUNTER: U + J (TAY) VÀ U + K (CHÂN)
  // Hỗ trợ hoàn hảo:
  // 1. Giữ U (Guard) + bấm J hoặc K bất kỳ lúc nào
  // 2. Nhấn U và J/K cùng lúc (chord window 350ms)
  // 3. Độc lập hoàn toàn với thứ tự bấm U trước hay J/K trước
  // Tiêu thụ đồng thời cả 2 phím để không bị rò rỉ thành đấm / đá / đỡ thường
  // ==========================================================================
  consumeCounterHand() {
    if (this._counterHandHandled) return false;
    const now = performance.now();
    const chordTolerance = 350; // 350ms cửa sổ kết hợp 2 phím mượt mà

    const blockCode = (this.bindings && this.bindings.block) || 'KeyU';
    const punchCode = (this.bindings && this.bindings.punch) || 'KeyJ';

    const uDown = !!this.keys['KeyU'] || !!this.keys[blockCode];
    const jDown = !!this.keys['KeyJ'] || !!this.keys[punchCode];
    const uJust = !!this.justPressed['KeyU'] || !!this.justPressed[blockCode];
    const jJust = !!this.justPressed['KeyJ'] || !!this.justPressed[punchCode];

    const uTime = this.lastKeyDownTime['KeyU'] || this.lastKeyDownTime[blockCode] || 0;
    const jTime = this.lastKeyDownTime['KeyJ'] || this.lastKeyDownTime[punchCode] || 0;
    const closeTogether = Math.abs(uTime - jTime) <= chordTolerance && (now - Math.max(uTime, jTime)) <= 450;

    // Kích hoạt khi:
    // 1. Cả U và J đang được nhấn cùng lúc (bất kể thứ tự bấm)
    // 2. Hoặc đang giữ U (Guard) và vừa bấm J trong frame này
    // 3. Hoặc bấm J trước rồi bấm U bồi trong cửa sổ chord
    const isChord = (uDown && jJust) || (jDown && uJust) ||
                    (uDown && jDown && (uJust || jJust || closeTogether));

    if (isChord) {
      this._counterHandHandled = true; // Khóa debounce cho đến nhịp tiếp theo
      this.justPressed['KeyU'] = false;
      this.justPressed['KeyJ'] = false;
      if (blockCode) this.justPressed[blockCode] = false;
      if (punchCode) this.justPressed[punchCode] = false;
      this.consumeBufferedAction('KeyU');
      this.consumeBufferedAction('KeyJ');
      if (blockCode) this.consumeBufferedAction(blockCode);
      if (punchCode) this.consumeBufferedAction(punchCode);
      return true;
    }
    return false;
  }

  consumeCounterLeg() {
    if (this._counterLegHandled) return false;
    const now = performance.now();
    const chordTolerance = 350;

    const blockCode = (this.bindings && this.bindings.block) || 'KeyU';
    const kickCode = (this.bindings && this.bindings.kick) || 'KeyK';

    const uDown = !!this.keys['KeyU'] || !!this.keys[blockCode];
    const kDown = !!this.keys['KeyK'] || !!this.keys[kickCode];
    const uJust = !!this.justPressed['KeyU'] || !!this.justPressed[blockCode];
    const kJust = !!this.justPressed['KeyK'] || !!this.justPressed[kickCode];

    const uTime = this.lastKeyDownTime['KeyU'] || this.lastKeyDownTime[blockCode] || 0;
    const kTime = this.lastKeyDownTime['KeyK'] || this.lastKeyDownTime[kickCode] || 0;
    const closeTogether = Math.abs(uTime - kTime) <= chordTolerance && (now - Math.max(uTime, kTime)) <= 450;

    const isChord = (uDown && kJust) || (kDown && uJust) ||
                    (uDown && kDown && (uJust || kJust || closeTogether));

    if (isChord) {
      this._counterLegHandled = true;
      this.justPressed['KeyU'] = false;
      this.justPressed['KeyK'] = false;
      if (blockCode) this.justPressed[blockCode] = false;
      if (kickCode) this.justPressed[kickCode] = false;
      this.consumeBufferedAction('KeyU');
      this.consumeBufferedAction('KeyK');
      if (blockCode) this.consumeBufferedAction(blockCode);
      if (kickCode) this.consumeBufferedAction(kickCode);
      return true;
    }
    return false;
  }

  // Kiểm tra phím đang được giữ
  isDown(code) {
    return !!this.keys[code];
  }

  // Kiểm tra phím vừa mới nhấn trong frame này
  isJustPressed(code) {
    return !!this.justPressed[code];
  }

  isKeyJustPressed(code) {
    return !!this.justPressed[code];
  }

  isActionJustPressed(action) {
    const bound = this.bindings[action];
    if (bound && this.justPressed[bound]) return true;
    const MAP = {
      punch: 'KeyJ',
      kick: 'KeyK',
      dodge: 'KeyL',
      ultimate: 'KeyI',
      jump: 'Space',
      interact: 'KeyE',
      support: 'KeyH',
      overdrive: 'KeyG',
      block: 'KeyU',
      up: 'KeyW',
      down: 'KeyS',
      left: 'KeyA',
      right: 'KeyD',
      run: 'ShiftLeft'
    };
    const code = MAP[action];
    return code ? !!this.justPressed[code] : false;
  }

  // Tiêu thụ một hành động từ buffer (Action Buffering)
  consumeBufferedAction(code) {
    if (!Array.isArray(this.actionBuffer)) this.actionBuffer = [];
    const now = performance.now();
    for (let i = 0; i < this.actionBuffer.length; i++) {
      const item = this.actionBuffer[i];
      if (item && (item.code === code || item.rawCode === code) && (now - item.timestamp) <= this.bufferTimeout * 1000) {
        this.actionBuffer.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  // Kiểm tra lệnh đang nằm trong buffer mà KHÔNG tiêu thụ nó
  peek(code) {
    if (!Array.isArray(this.actionBuffer)) this.actionBuffer = [];
    const now = performance.now();
    return this.actionBuffer.some(item => item && (item.code === code || item.rawCode === code) && (now - item.timestamp) <= this.bufferTimeout * 1000);
  }

  // Xóa buffer cũ sau mỗi frame
  update() {
    this.justPressed = {};
    if (!Array.isArray(this.actionBuffer)) this.actionBuffer = [];
    const now = performance.now();
    this.actionBuffer = this.actionBuffer.filter(item => item && (now - item.timestamp) <= this.bufferTimeout * 1000);
  }

  // Helper thuận tiện cho các hướng và phím tắt
  get moveLeft() {
    return this.isDown(this.bindings.left) || this.isDown('KeyA') || this.isDown('ArrowLeft');
  }

  get moveRight() {
    return this.isDown(this.bindings.right) || this.isDown('KeyD') || this.isDown('ArrowRight');
  }

  get moveUp() {
    return this.isDown(this.bindings.up) || this.isDown('KeyW') || this.isDown('ArrowUp');
  }

  get moveDown() {
    return this.isDown(this.bindings.down) || this.isDown('KeyS') || this.isDown('ArrowDown');
  }

  get run() {
    return this.isDown(this.bindings.run) || this.isDown('ShiftLeft') || this.isDown('ShiftRight');
  }

  get jump() {
    return this.consumeBufferedAction(this.bindings.jump || 'Space') || this.consumeBufferedAction('Space');
  }

  // Giữ Thủ thế / Đỡ đòn
  get block() {
    return this.isDown(this.bindings.block) || this.isDown('KeyU');
  }

  get punch() {
    return this.consumeBufferedAction('KeyJ');
  }

  get kick() {
    return this.consumeBufferedAction('KeyK');
  }

  get dodge() {
    return this.consumeBufferedAction('KeyL');
  }

  get ultimate() {
    return this.consumeBufferedAction('KeyI');
  }

  get overdrive() {
    return this.consumeBufferedAction('KeyG');
  }

  get dialogConfirm() {
    return this.consumeBufferedAction('Space') || this.consumeBufferedAction('KeyJ') || this.isJustPressed('Enter');
  }

  // Xóa toàn bộ trạng thái phím và buffer khi đóng modal hoặc chuyển trạng thái
  clearAll() {
    this.keys = {};
    this.justPressed = {};
    this.actionBuffer = [];
    this._counterHandHandled = false;
    this._counterLegHandled = false;
  }
}

// Global Input Instance
const input = new InputManager();
window.InputManager = InputManager;
window.input = input;
