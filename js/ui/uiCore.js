/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/ui/uiCore.js - GUI Performance Foundation, Unified Navigation, Asset Preloader & Motion Governor.
 */

(function () {
  'use strict';

  const KNOWN_MODAL_IDS = [
    'training-mode-modal',
    'char-select-modal',
    'ally-select-modal',
    'campaign-modal',
    'chapter-map-modal',
    'deployment-modal',
    'player-profile-modal',
    'shop-modal',
    'dossier-modal',
    'collection-modal',
    'achievements-modal',
    'chronicles-modal',
    'settings-modal',
    'keybindings-modal',
    'skills-equip-modal',
    'controls-modal',
    'credits-modal',
    'notif-modal',
    'mail-modal',
    'quests-modal',
    'friends-modal',
    'newgame-confirm-modal',
    'exit-confirm-modal',
    'boss-rush-modal',
    'stage-select-modal',
    'confrontation-modal',
    'custody-modal'
  ];

  const EXTRA_BLOCKING_IDS = [
    'pause-modal',
    'stage-clear-modal',
    'game-over-modal',
    'grand-victory-modal',
    'choice-modal',
    'ending-modal'
  ];

  class UICore {
    constructor() {
      this._overlayListeners = new Set();
      this._imageCache = new Map();
      this._persistTimer = null;
      this._returnStack = {};
      this._activeLoopControllers = new Set();
      this._reducedMotion = false;
      this._motionMql = null;
      this._domObserver = null;
      this._initMotionPreference();
      this._attachDomObserver();
    }

    _attachDomObserver() {
      if (typeof document === 'undefined' || typeof MutationObserver !== 'function') return;
      const setup = () => {
        if (this._domObserver) return;
        const obs = new MutationObserver(() => this.notifyOverlayChange());
        const ids = ['title-screen'].concat(KNOWN_MODAL_IDS, EXTRA_BLOCKING_IDS);
        for (let i = 0; i < ids.length; i++) {
          const node = typeof document.getElementById === 'function' ? document.getElementById(ids[i]) : null;
          if (node) obs.observe(node, { attributes: true, attributeFilter: ['class'] });
        }
        this._domObserver = obs;
      };
      if (document.readyState === 'loading' && typeof document.addEventListener === 'function') {
        document.addEventListener('DOMContentLoaded', setup, { once: true });
      } else {
        setup();
      }
    }

    _initMotionPreference() {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
      try {
        this._motionMql = window.matchMedia('(prefers-reduced-motion: reduce)');
        this._reducedMotion = !!this._motionMql.matches;
        const onChange = (e) => {
          this._reducedMotion = !!(e && e.matches);
          this.notifyOverlayChange();
        };
        if (typeof this._motionMql.addEventListener === 'function') {
          this._motionMql.addEventListener('change', onChange);
        }
      } catch (_) {}
    }

    prefersReducedMotion() {
      return !!this._reducedMotion;
    }

    resolveElement(target) {
      if (!target) return null;
      if (typeof target === 'string') {
        return typeof document !== 'undefined' && typeof document.getElementById === 'function'
          ? document.getElementById(target)
          : null;
      }
      return target;
    }

    isVisible(target) {
      const el = this.resolveElement(target);
      return !!(el && el.classList && !el.classList.contains('hidden'));
    }

    hasBlockingOverlay() {
      for (let i = 0; i < KNOWN_MODAL_IDS.length; i++) {
        if (this.isVisible(KNOWN_MODAL_IDS[i])) return true;
      }
      for (let i = 0; i < EXTRA_BLOCKING_IDS.length; i++) {
        if (this.isVisible(EXTRA_BLOCKING_IDS[i])) return true;
      }
      return false;
    }

    isMainMenuActive() {
      return this.isVisible('title-screen') && !this.hasBlockingOverlay();
    }

    shouldPauseMenuGameLoop() {
      if (typeof window === 'undefined' || !window.game) return false;
      if (window.game.state !== 'MENU') return false;
      return this.isVisible('title-screen') || this.hasBlockingOverlay();
    }

    onOverlayChange(cb) {
      if (typeof cb !== 'function') return () => {};
      this._overlayListeners.add(cb);
      return () => this._overlayListeners.delete(cb);
    }

    notifyOverlayChange() {
      this._overlayListeners.forEach((cb) => {
        try { cb(); } catch (_) {}
      });
    }

    /**
     * Mở modal đồng nhất, kích hoạt hiệu ứng vào mượt và thông báo tạm dừng rAF nền.
     */
    showModal(target, opts = {}) {
      const el = this.resolveElement(target);
      if (!el || !el.classList) return null;

      if (opts.returnTo && el.id) {
        this._returnStack[el.id] = opts.returnTo;
      }
      el.classList.remove('hidden');

      if (!this.prefersReducedMotion() && opts.animate !== false) {
        const card = (typeof el.querySelector === 'function')
          ? (el.querySelector('.modal-card, .cs-cinematic-stage, .vov-campaign-stage, .ui-modal-surface') || el)
          : el;
        if (card && card.classList) {
          card.classList.remove('ui-anim-enter');
          if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
              if (!el.classList.contains('hidden')) {
                card.classList.add('ui-anim-enter');
              }
            });
          } else {
            card.classList.add('ui-anim-enter');
          }
        }
      }

      this.notifyOverlayChange();
      return el;
    }

    /**
     * Đóng modal tức thì (bảo toàn class .hidden đồng bộ cho các test và chuyển cảnh nhanh).
     */
    hideModal(target, opts = {}) {
      const el = this.resolveElement(target);
      if (!el || !el.classList) return null;

      el.classList.add('hidden');
      const card = (typeof el.querySelector === 'function')
        ? (el.querySelector('.modal-card, .cs-cinematic-stage, .vov-campaign-stage, .ui-modal-surface') || null)
        : null;
      if (card && card.classList) {
        card.classList.remove('ui-anim-enter');
      }

      if (opts.restoreReturn && el.id && this._returnStack[el.id]) {
        const returnId = this._returnStack[el.id];
        delete this._returnStack[el.id];
        this.showModal(returnId, { animate: false });
        return el;
      }

      if (el.id) delete this._returnStack[el.id];
      this.notifyOverlayChange();
      return el;
    }

    popReturnTarget(modalId) {
      if (!modalId || !this._returnStack[modalId]) return null;
      const t = this._returnStack[modalId];
      delete this._returnStack[modalId];
      return t;
    }

    hideAllModals(exceptIds = []) {
      const skip = new Set(Array.isArray(exceptIds) ? exceptIds : [exceptIds]);
      for (let i = 0; i < KNOWN_MODAL_IDS.length; i++) {
        const id = KNOWN_MODAL_IDS[i];
        if (skip.has(id)) continue;
        const el = this.resolveElement(id);
        if (el && el.classList && !el.classList.contains('hidden')) {
          el.classList.add('hidden');
        }
        delete this._returnStack[id];
      }
      this.notifyOverlayChange();
    }

    /**
     * Ngăn trùng lặp listener trên cùng một phần tử DOM.
     */
    bindOnce(target, eventName, handler, flagKey) {
      const el = this.resolveElement(target);
      if (!el || typeof el.addEventListener !== 'function' || typeof handler !== 'function') return false;
      const key = flagKey || (`__vovBound_${eventName}`);
      if (el[key]) return false;
      el[key] = true;
      el.addEventListener(eventName, handler);
      return true;
    }

    /**
     * Gom nhiều lần saveManager.persist() liên tiếp (kéo thanh âm lượng, đổi tướng nhanh).
     */
    schedulePersist(delayMs = 200) {
      if (this._persistTimer) {
        clearTimeout(this._persistTimer);
        this._persistTimer = null;
      }
      const flush = () => {
        this._persistTimer = null;
        if (typeof window !== 'undefined' && window.saveManager && typeof window.saveManager.persist === 'function') {
          window.saveManager.persist();
        }
      };
      if (delayMs <= 0) {
        flush();
        return;
      }
      this._persistTimer = setTimeout(flush, delayMs);
    }

    flushPersistNow() {
      if (this._persistTimer) {
        clearTimeout(this._persistTimer);
        this._persistTimer = null;
        if (typeof window !== 'undefined' && window.saveManager && typeof window.saveManager.persist === 'function') {
          window.saveManager.persist();
        }
      }
    }

    /**
     * Nạp trước & giải mã ảnh bất đồng bộ để chuyển trang phục / đổi tướng không rớt FPS.
     */
    warmImage(src) {
      if (!src || typeof Image === 'undefined') return Promise.resolve();
      if (this._imageCache.has(src)) return this._imageCache.get(src);

      const p = new Promise((resolve) => {
        try {
          const img = new Image();
          img.decoding = 'async';
          const done = () => resolve(img);
          img.onload = () => {
            if (typeof img.decode === 'function') {
              img.decode().then(done, done);
            } else {
              done();
            }
          };
          img.onerror = done;
          img.src = src;
        } catch (_) {
          resolve(null);
        }
      });
      this._imageCache.set(src, p);
      return p;
    }

    swapImage(imgEl, nextSrc) {
      if (!imgEl || !nextSrc) return;
      if (imgEl.dataset && imgEl.dataset.currentSrc === nextSrc && imgEl.getAttribute('src') === nextSrc) {
        return;
      }
      this.warmImage(nextSrc);
      if (imgEl.dataset) imgEl.dataset.currentSrc = nextSrc;
      imgEl.src = nextSrc;
    }

    warmCharacterAssets() {
      if (typeof window === 'undefined' || typeof Image === 'undefined') return;
      const urls = new Set();
      if (Array.isArray(window.CHAR_SLOTS)) {
        window.CHAR_SLOTS.forEach((slot) => {
          if (slot && slot.image) urls.add(slot.image);
          if (slot && slot.vovinamImage) urls.add(slot.vovinamImage);
        });
      }
      if (Array.isArray(window.TRAINING_CHARACTERS)) {
        window.TRAINING_CHARACTERS.forEach((c) => {
          if (c && c.image) urls.add(c.image);
        });
      }
      const list = Array.from(urls);
      if (list.length === 0) return;

      let idx = 0;
      const step = () => {
        if (idx >= list.length) return;
        this.warmImage(list[idx++]);
        if (idx < list.length) {
          setTimeout(step, 45);
        }
      };

      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => step(), { timeout: 1200 });
      } else {
        setTimeout(step, 350);
      }
    }

    /**
     * Thanh trượt phản hồi tức thì + gắn fill % trực quan bằng biến CSS --range-pct.
     */
    syncRangeFill(rangeEl) {
      if (!rangeEl || !rangeEl.style || typeof rangeEl.style.setProperty !== 'function') return;
      const min = Number(rangeEl.min || 0);
      const max = Number(rangeEl.max || 100);
      const val = Number(rangeEl.value || 0);
      const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
      rangeEl.style.setProperty('--range-pct', `${Math.max(0, Math.min(100, pct)).toFixed(1)}%`);
    }
  }

  const uiCore = new UICore();
  if (typeof window !== 'undefined') {
    window.UICore = UICore;
    window.uiCore = uiCore;
  }
})();
