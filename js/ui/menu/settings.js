/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/menu/settings.js - Tuy chinh phim bam va cai dat game.
 */

class MenuManagerSettings extends window.MenuManagerCollections {
  // --------------------------------------------------------------------------
  // TÙY CHỈNH PHÍM BẤM (CUSTOM KEYBINDINGS)
  // --------------------------------------------------------------------------
  showKeybindings() {
    const modal = document.getElementById('keybindings-modal');
    const container = document.getElementById('keybindings-container');
    if (!modal || !container || !window.input) return;

    const ACTION_NAMES = {
      punch:     { name: 'Đấm thường', desc: 'Chuỗi đòn tay Vovinam liên hoàn' },
      kick:      { name: 'Đòn đá', desc: 'Đá tạt, đá quét, đá bay' },
      block:     { name: 'Thủ thế / Đỡ đòn', desc: 'Giữ thế thủ, giảm sát thương' },
      dodge:     { name: 'Thân pháp Né', desc: 'Lướt né tránh né đòn tức thì' },
      ultimate:  { name: 'Tuyệt kỹ Vovinam', desc: 'Long Hổ Xuất Sơn (khi nạp đầy)' },
      jump:      { name: 'Nhảy cao', desc: 'Bật nhảy né đòn / phi thân' },
      interact:  { name: 'Nhặt vũ khí', desc: 'Tương tác nhặt Côn / Mã tấu rơi' },
      support:   { name: 'Gọi đồng minh', desc: 'Chi viện liên kích hỗ trợ' },
      run:       { name: 'Chạy / Lướt nhanh', desc: 'Giữ phím để chạy áp sát' },
      up:        { name: 'Đi lên (Làn sâu)', desc: 'Chuyển làn chiều sâu sân khấu' },
      down:      { name: 'Đi xuống (Làn trước)', desc: 'Chuyển làn hướng ra trước' },
      left:      { name: 'Sang trái', desc: 'Di chuyển lùi / tiến' },
      right:     { name: 'Sang phải', desc: 'Di chuyển tiến / lùi' }
    };

    const kbState = this._kbState || (this._kbState = {
      activeListeningBtn: null,
      activeAction: null,
      onKeydownRemap: null
    });
    const bindings = window.input.bindings || {};

    const stopListening = () => {
      if (kbState.activeListeningBtn) {
        kbState.activeListeningBtn.classList.remove('listening');
        const liveBindings = (window.input && window.input.bindings) ? window.input.bindings : bindings;
        const code = liveBindings[kbState.activeAction];
        kbState.activeListeningBtn.textContent = window.input.formatKeyName(code);
        kbState.activeListeningBtn = null;
        kbState.activeAction = null;
      }
      if (kbState.onKeydownRemap) {
        window.removeEventListener('keydown', kbState.onKeydownRemap, true);
      }
    };
    this._stopKbListening = stopListening;

    if (!kbState.onKeydownRemap) {
      kbState.onKeydownRemap = (e) => {
        if (!kbState.activeAction || !kbState.activeListeningBtn) return;
        e.preventDefault();
        e.stopPropagation();

        const newCode = e.code;
        if (newCode === 'Escape') {
          stopListening();
          return;
        }

        window.input.setBinding(kbState.activeAction, newCode);
        kbState.activeListeningBtn.textContent = window.input.formatKeyName(newCode);
        kbState.activeListeningBtn.classList.remove('listening');
        kbState.activeListeningBtn = null;
        kbState.activeAction = null;
        window.removeEventListener('keydown', kbState.onKeydownRemap, true);
        if (typeof this.renderSettingsKbPreview === 'function') this.renderSettingsKbPreview();
      };
    }
    const onKeydownRemap = kbState.onKeydownRemap;

    stopListening();
    if (!this._kbRowMap) this._kbRowMap = {};

    Object.keys(ACTION_NAMES).forEach(action => {
      const info = ACTION_NAMES[action];
      const curCode = bindings[action] || '';
      let row = this._kbRowMap[action];
      if (!row) {
        row = document.createElement('div');
        row.className = 'keybind-row';
        row.innerHTML = `
          <div class="keybind-label">
            <span class="keybind-name">${info.name}</span>
            <span class="keybind-desc">${info.desc}</span>
          </div>
          <button class="keybind-btn" data-action="${action}">${window.input.formatKeyName(curCode)}</button>
        `;
        this._kbRowMap[action] = row;
        container.appendChild(row);
      }

      const btn = row.querySelector ? row.querySelector('.keybind-btn') : null;
      if (!btn) return;
      btn.classList.remove('listening');
      btn.textContent = window.input.formatKeyName(curCode);
      if (!btn.__vovKbBtnBound) {
      btn.__vovKbBtnBound = true;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (kbState.activeListeningBtn === btn) {
          stopListening();
          return;
        }
        stopListening();
        kbState.activeListeningBtn = btn;
        kbState.activeAction = action;
        btn.classList.add('listening');
        btn.textContent = 'ẤN PHÍM...';
        window.addEventListener('keydown', onKeydownRemap, true);
      });
      }
    });

    if (window.uiCore) window.uiCore.showModal(modal);
    else modal.classList.remove('hidden');
  }

  cleanupKeybindingsListener() {
    if (typeof this._stopKbListening === 'function') {
      this._stopKbListening();
    }
  }

  hideKeybindings() {
    this.cleanupKeybindingsListener();
    const modal = document.getElementById('keybindings-modal');
    if (window.uiCore && modal) window.uiCore.hideModal(modal);
    else if (modal) modal.classList.add('hidden');
    if (typeof this.renderSettingsKbPreview === 'function') this.renderSettingsKbPreview();
  }

  renderSettingsKbPreview() {
    const preview = document.getElementById('settings-kb-preview');
    if (!preview || !window.input || !window.input.bindings) return;
    const b = window.input.bindings;
    const items = [
      ['Đấm', b.punch],
      ['Đá', b.kick],
      ['Thủ', b.block],
      ['Né', b.dodge],
      ['Tuyệt Kỹ', b.ultimate],
      ['Đồng Minh', b.support]
    ];
    preview.innerHTML = items.map(([label, code]) => (
      `<span class="kb-preview-chip"><span class="kb-preview-act">${label}</span><kbd class="kb-preview-key">${window.input.formatKeyName(code || '')}</kbd></span>`
    )).join('');
  }

  updateSettingsSummary() {
    const out = document.getElementById('save-summary');
    if (!out || !window.saveManager) return;
    const d = window.saveManager.data;
    const slots = Array.isArray(window.CHAR_SLOTS) ? window.CHAR_SLOTS.filter((s) => !s.isLocked) : [];
    const totalChars = slots.length || 9;
    const unlockedChars = slots.length
      ? slots.filter((s) => this.isUnlocked(s.id)).length
      : (Array.isArray(d.unlockedCharacters) ? d.unlockedCharacters.length : 1);
    const totalStages = (window.STORY_META && Array.isArray(window.STORY_META.stages))
      ? window.STORY_META.stages.length
      : 10;
    const totalAch = (window.STORY_META && Array.isArray(window.STORY_META.achievements))
      ? window.STORY_META.achievements.length
      : ((typeof window.ACHIEVEMENTS === 'object' && window.ACHIEVEMENTS)
        ? Object.keys(window.ACHIEVEMENTS).length
        : 24);

    if (out.dataset && out.dataset.mode === 'cards') {
      out.innerHTML = `
        <div class="summary-stat"><span class="summary-val">${(d.completedStages || []).length}/${totalStages}</span><span class="summary-lbl">Màn Hoàn Thành</span></div>
        <div class="summary-stat"><span class="summary-val">${unlockedChars}/${totalChars}</span><span class="summary-lbl">Võ Sĩ Mở Khóa</span></div>
        <div class="summary-stat"><span class="summary-val">${(d.endings || []).length}/4</span><span class="summary-lbl">Kết Thúc</span></div>
        <div class="summary-stat"><span class="summary-val">${(d.achievements || []).length}/${totalAch}</span><span class="summary-lbl">Thành Tựu</span></div>
      `;
    } else {
      out.textContent = `Màn đã qua: ${(d.completedStages || []).length}/${totalStages} · Nhân vật mở: ${unlockedChars}/${totalChars} · ` +
        `Kết thúc: ${(d.endings || []).length}/4 · Thành tích: ${(d.achievements || []).length}/${totalAch}`;
    }
  }

  // --------------------------------------------------------------------------
  // CÀI ĐẶT
  // --------------------------------------------------------------------------
  showSettings() {
    const st = window.saveManager ? window.saveManager.data.settings : null;
    const music = document.getElementById('setting-music');
    const sfx = document.getElementById('setting-sfx');
    const mute = document.getElementById('setting-mute');
    if (st && music) {
      music.value = Math.round((st.musicVolume ?? 0.45) * 100);
      if (window.uiCore) window.uiCore.syncRangeFill(music);
    }
    if (st && sfx) {
      sfx.value = Math.round((st.sfxVolume ?? 0.85) * 100);
      if (window.uiCore) window.uiCore.syncRangeFill(sfx);
    }
    const musicVal = document.getElementById('setting-music-val');
    const sfxVal = document.getElementById('setting-sfx-val');
    if (musicVal && music) musicVal.textContent = `${music.value}%`;
    if (sfxVal && sfx) sfxVal.textContent = `${sfx.value}%`;
    if (st && mute) mute.checked = !!st.muted;
    const reduceShake = document.getElementById('setting-reduce-shake');
    const reduceFlash = document.getElementById('setting-reduce-flash');
    const hideDmg = document.getElementById('setting-hide-dmg');
    if (reduceShake && window.fxSettings) reduceShake.checked = !!window.fxSettings.reduceShake;
    if (reduceFlash && window.fxSettings) reduceFlash.checked = !!window.fxSettings.reduceFlash;
    if (hideDmg && window.fxSettings) hideDmg.checked = !!window.fxSettings.hideDamageNumbers;
    this.renderSettingsKbPreview();
    this.updateSettingsSummary();
    if (window.uiCore) window.uiCore.showModal(this.settingsModal);
    else if (this.settingsModal) this.settingsModal.classList.remove('hidden');
  }
}

window.MenuManagerSettings = MenuManagerSettings;
