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

    container.innerHTML = '';
    const bindings = window.input.bindings;

    let activeListeningBtn = null;
    let activeAction = null;

    const stopListening = () => {
      if (activeListeningBtn) {
        activeListeningBtn.classList.remove('listening');
        const code = bindings[activeAction];
        activeListeningBtn.textContent = window.input.formatKeyName(code);
        activeListeningBtn = null;
        activeAction = null;
      }
    };

    const onKeydownRemap = (e) => {
      if (!activeAction || !activeListeningBtn) return;
      e.preventDefault();
      e.stopPropagation();

      const newCode = e.code;
      if (newCode === 'Escape') {
        stopListening();
        window.removeEventListener('keydown', onKeydownRemap, true);
        return;
      }

      window.input.setBinding(activeAction, newCode);
      activeListeningBtn.textContent = window.input.formatKeyName(newCode);
      activeListeningBtn.classList.remove('listening');
      activeListeningBtn = null;
      activeAction = null;
      window.removeEventListener('keydown', onKeydownRemap, true);
    };

    Object.keys(ACTION_NAMES).forEach(action => {
      const info = ACTION_NAMES[action];
      const curCode = bindings[action] || '';
      const row = document.createElement('div');
      row.className = 'keybind-row';
      row.innerHTML = `
        <div class="keybind-label">
          <span class="keybind-name">${info.name}</span>
          <span class="keybind-desc">${info.desc}</span>
        </div>
        <button class="keybind-btn" data-action="${action}">${window.input.formatKeyName(curCode)}</button>
      `;

      const btn = row.querySelector('.keybind-btn');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeListeningBtn === btn) {
          stopListening();
          window.removeEventListener('keydown', onKeydownRemap, true);
          return;
        }
        stopListening();
        activeListeningBtn = btn;
        activeAction = action;
        btn.classList.add('listening');
        btn.textContent = 'ẤN PHÍM...';
        window.addEventListener('keydown', onKeydownRemap, true);
      });

      container.appendChild(row);
    });

    modal.classList.remove('hidden');
  }

  hideKeybindings() {
    const modal = document.getElementById('keybindings-modal');
    if (modal) modal.classList.add('hidden');
  }

  // --------------------------------------------------------------------------
  // CÀI ĐẶT
  // --------------------------------------------------------------------------
  showSettings() {
    const st = window.saveManager ? window.saveManager.data.settings : null;
    const music = document.getElementById('setting-music');
    const sfx = document.getElementById('setting-sfx');
    const mute = document.getElementById('setting-mute');
    if (st && music) music.value = Math.round((st.musicVolume ?? 0.45) * 100);
    if (st && sfx) sfx.value = Math.round((st.sfxVolume ?? 0.85) * 100);
    if (st && mute) mute.checked = !!st.muted;
    const reduceShake = document.getElementById('setting-reduce-shake');
    const reduceFlash = document.getElementById('setting-reduce-flash');
    const hideDmg = document.getElementById('setting-hide-dmg');
    if (reduceShake && window.fxSettings) reduceShake.checked = !!window.fxSettings.reduceShake;
    if (reduceFlash && window.fxSettings) reduceFlash.checked = !!window.fxSettings.reduceFlash;
    if (hideDmg && window.fxSettings) hideDmg.checked = !!window.fxSettings.hideDamageNumbers;
    const out = document.getElementById('save-summary');
    if (out && window.saveManager) {
      const d = window.saveManager.data;
      out.textContent = `Màn đã qua: ${d.completedStages.length} · Nhân vật mở: ${d.unlockedCharacters.length}/7 · ` +
        `Kết thúc: ${d.endings.length}/4 · Thành tích: ${d.achievements.length}/12`;
    }
    this.settingsModal.classList.remove('hidden');
  }
}

window.MenuManagerSettings = MenuManagerSettings;
