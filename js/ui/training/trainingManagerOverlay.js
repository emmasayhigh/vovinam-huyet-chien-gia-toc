/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/training/trainingManagerOverlay.js - Modal chon che do va overlay HUD Vo Duong.
 */

class TrainingManagerOverlay extends window.TrainingManagerModes {
  showModeSelectModal() {
    let modal = document.getElementById('training-mode-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'training-mode-modal';
      modal.className = 'modal-overlay cs-modal-screen hidden';
      document.body.appendChild(modal);
    } else if (!modal.classList.contains('cs-modal-screen')) {
      modal.className = 'modal-overlay cs-modal-screen hidden';
    }

    const savedChar = (window.saveManager && window.saveManager.data.selectedCharacter) || 'nghi';
    if (!this.selectedTrainingChar) {
      this.selectedTrainingChar = savedChar;
    }
    const allChars = window.TRAINING_CHARACTERS || [];
    const uniqueChars = [];
    const seen = new Set();
    for (const c of allChars) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        uniqueChars.push(c);
      }
    }

    const curHero = uniqueChars.find(c => c.id === this.selectedTrainingChar) || uniqueChars[0];
    const curSlot = (window.CHAR_SLOTS && window.CHAR_SLOTS.find(s => s.id === curHero.id)) || null;

    if (window.uiCore && typeof window.uiCore.hideAllModals === 'function') {
      window.uiCore.hideAllModals(['training-mode-modal']);
    }

    if (modal.dataset && modal.dataset.tBuilt === '1' && typeof modal._tUpdateDossier === 'function') {
      const existingCards = (typeof modal.querySelectorAll === 'function')
        ? modal.querySelectorAll('#training-char-grid .cs-card')
        : [];
      existingCards.forEach((c) => {
        c.classList.toggle('selected', c.getAttribute('data-char-id') === curHero.id);
      });
      const selDrillCached = modal.querySelector ? modal.querySelector('#modal-drill-select') : null;
      if (selDrillCached) selDrillCached.value = String(this.currentDrillIndex || 0);
      if (typeof modal._tSwitchTab === 'function') modal._tSwitchTab('heroes');
      modal._tUpdateDossier(curHero.id);
      if (window.uiCore) window.uiCore.showModal(modal);
      else modal.classList.remove('hidden');
      return;
    }

    modal.innerHTML = `
      <div class="cs-cinematic-stage training-cinematic-stage">
        <!-- Background Layers (Sử dụng sân võ đường không có nhân vật nền gây nhiễu) -->
        <div class="cs-bg-image training-cs-bg" style="background-image: url('assets/images/backgrounds/char_select_bg.jpg');"></div>
        <div class="cs-bg-overlay training-bg-vignette"></div>

        <!-- Top Navigation Bar (Chuẩn Cinematic AAA đồng bộ Màn Chọn Nhân Vật) -->
        <header class="cs-top-bar">
          <button id="btn-close-training-modal-btn" class="cs-back-btn" aria-label="Quay lại">
            <span class="cs-back-arrow">‹</span>
            <span class="cs-back-text">QUAY LẠI</span>
          </button>
          <div class="cs-brand-center">
            <div class="cs-brand-logo">VOVINAM</div>
            <div class="cs-brand-subtitle">VÕ ĐƯỜNG • RÈN LUYỆN VÕ THUẬT</div>
          </div>
          <div class="cs-top-motto">
            <span>Cương Nhu Phối Triển — Việt Võ Đạo</span>
          </div>
          <div class="t-char-badge-full">FULL ${uniqueChars.length} CAO THỦ ⚡</div>
          <button class="modal-close-icon cs-close-x" id="btn-close-training-modal-x" aria-label="Đóng">&times;</button>
        </header>

        <!-- Main 3-Column Body -->
        <div class="cs-main-body training-cs-main-body">
          <!-- Left Column: 3-Tab Switcher (VÕ SĨ | TRANG PHỤC | TRỢ CHIẾN) -->
          <aside class="cs-left-col training-left-col">
            <div class="cs-col-header training-col-header">
              <div id="t-lq-tabs" class="cs-lq-tabs t-lq-tabs" role="tablist" aria-label="Chọn Võ Sĩ, Trang Phục hoặc Trợ Chiến">
                <button id="btn-t-tab-heroes" class="cs-lq-tab active" data-ttab="heroes" type="button" role="tab" aria-selected="true">
                  <span class="cs-lq-tab-ico">🥋</span>
                  <span class="cs-lq-tab-label">VÕ SĨ</span>
                  <span class="cs-lq-tab-badge">${uniqueChars.length}</span>
                </button>
                <button id="btn-t-tab-skins" class="cs-lq-tab" data-ttab="skins" type="button" role="tab" aria-selected="false">
                  <span class="cs-lq-tab-ico">👘</span>
                  <span class="cs-lq-tab-label">TRANG PHỤC</span>
                  <span id="t-tab-skin-count" class="cs-lq-tab-badge">2</span>
                </button>
                <button id="btn-t-tab-support" class="cs-lq-tab" data-ttab="support" type="button" role="tab" aria-selected="false">
                  <span class="cs-lq-tab-ico">🤝</span>
                  <span class="cs-lq-tab-label">TRỢ CHIẾN</span>
                  <span id="t-tab-support-count" class="cs-lq-tab-badge">9</span>
                </button>
              </div>
              <span class="cs-col-line"></span>
            </div>

            <!-- Bộ lọc & Tìm kiếm -->
            <div class="t-roster-filters" id="training-roster-filters">
              <div class="t-filter-pills-row">
                <button type="button" class="t-filter-pill active" data-tfilter="all">Tất Cả</button>
                <button type="button" class="t-filter-pill" data-tfilter="Họ Phó">⬡ Họ Phó</button>
                <button type="button" class="t-filter-pill" data-tfilter="other">Thế Lực Khác</button>
              </div>
              <input type="search" id="training-roster-search" class="t-roster-search" placeholder="🔍 Tìm võ sĩ theo tên, phái..." autocomplete="off">
            </div>

            <!-- Grid Danh Sách Võ Sĩ (Thẻ gọn sạch, không đè chữ lên chân dung/tên) -->
            <div id="training-char-grid" class="cs-grid training-cs-grid">
              ${uniqueChars.map(c => {
                const isSel = (c.id === curHero.id);
                return `
                  <div class="cs-card t-card ${isSel ? 'selected' : ''}" data-char-id="${c.id}" style="--char-color: ${c.color};" title="${c.name} — ${c.title}">
                    <div class="cs-card-thumb-wrap">
                      <img src="${c.image}" alt="${c.name}" class="cs-card-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                      <div class="cs-card-fallback-icon" style="display:none; font-size: 24px; align-items:center; justify-content:center; height:100%;">${c.icon}</div>
                      <span class="t-card-faction-chip">${c.badge}</span>
                      <span class="cs-card-element">${c.icon}</span>
                    </div>
                    <div class="cs-card-banner t-card-banner">
                      <span class="cs-card-name">${c.name}</span>
                      <span class="t-card-role-sub">${c.title}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Tab 2: Trang Phục trong Võ Đường -->
            <div id="training-skin-grid" class="cs-skin-grid training-skin-grid hidden"></div>

            <!-- Tab 3: Nhân Vật Hỗ Trợ / Trợ Chiến trong Võ Đường -->
            <div id="training-support-grid" class="cs-grid ally-cs-grid cs-support-grid training-support-grid hidden"></div>

            <div class="cs-left-footer">
              <div class="cs-footer-brush">Vovinam</div>
              <div class="cs-footer-sub">100% Mở Khóa Miễn Phí Trong Võ Đường</div>
            </div>
          </aside>

          <!-- Center Column: Hero Stage Spotlight & Start Mode Actions -->
          <main class="cs-center-col training-center-col">
            <div class="cs-hero-stage">
              <div class="cs-hero-ambient" id="t-hero-ambient" style="background: radial-gradient(circle, ${curHero.color}44 0%, ${curHero.color}11 45%, transparent 70%);"></div>
              <div class="cs-hero-shadow"></div>
              <div class="cs-skin-stage-banner">
                <span id="t-hero-faction-badge" class="cs-skin-tier-tag default" style="border-color:${curHero.color}; color:${curHero.color};">${curHero.badge}</span>
                <span id="t-hero-martial-style" class="cs-skin-stage-name">${curHero.title}</span>
              </div>
              <!-- Thẻ Support / Trợ Chiến đồng hành ngay trên sân khấu Võ Đường -->
              <div id="t-support-companion-card" class="cs-support-companion-card">
                <div class="cs-support-comp-avatar-wrap">
                  <img id="t-support-companion-img" src="assets/images/characters/char_bichlam.png" alt="Trợ Chiến">
                  <span id="t-support-companion-icon" class="cs-support-comp-icon hidden">⭐</span>
                </div>
                <div class="cs-support-comp-meta">
                  <span class="cs-support-comp-tag">🤝 SUPPORT / TRỢ CHIẾN [PHÍM H]</span>
                  <strong id="t-support-companion-name">TỰ ĐỘNG THEO TRUYỆN</strong>
                  <span id="t-support-companion-role" class="cs-support-comp-role">Linh Hoạt Theo Hồi</span>
                  <span id="t-support-companion-skill" class="cs-support-comp-skill">Tự gọi đồng minh hỗ trợ</span>
                </div>
                <button id="btn-t-change-support" type="button" class="cs-support-comp-btn" title="Chọn Trợ Chiến cho Võ Đường">ĐỔI</button>
              </div>
              <img id="t-hero-img" class="cs-hero-img" src="${curHero.image}" alt="${curHero.name}">
            </div>

            <!-- Thanh tổng kết Loadout trong Võ Đường -->
            <div id="t-loadout-summary-bar" class="cs-loadout-summary-bar t-loadout-summary-bar" aria-live="polite">
              <div class="cs-loadout-pill"><span class="lbl">VÕ SĨ</span><strong id="t-loadout-hero-name">${curHero.name}</strong></div>
              <span class="cs-loadout-sep">+</span>
              <div class="cs-loadout-pill"><span class="lbl">TRANG PHỤC</span><strong id="t-loadout-skin-name">Mặc Định</strong></div>
              <span class="cs-loadout-sep">+</span>
              <div class="cs-loadout-pill"><span class="lbl">TRỢ CHIẾN</span><strong id="t-loadout-ally-name">Tự Động</strong></div>
              <span class="cs-loadout-status ready">✓ SẴN SÀNG TẬP</span>
            </div>

            <!-- Panel chọn chế độ luyện tập -->
            <div class="training-hero-actions-panel">
              <div class="t-mode-action-row">
                <button id="btn-modal-start-free" class="btn-training-mode-action btn-gold">
                  <span class="t-btn-icon">⚡</span>
                  <div class="t-btn-text">
                    <span class="t-btn-main">LUYỆN TẬP TỰ DO</span>
                    <span class="t-btn-sub">Thử combo • Bất tử • Tùy biến hình nộm & Boss</span>
                  </div>
                  <span class="t-btn-arrow">➔</span>
                </button>

                <div class="t-drill-action-group">
                  <button id="btn-modal-start-drill" class="btn-training-mode-action btn-blue">
                    <span class="t-btn-icon">🥋</span>
                    <div class="t-btn-text">
                      <span class="t-btn-main">7 BÀI KHẢO HẠCH</span>
                      <span class="t-btn-sub">Quyền cước, Né, Phản đòn & Tuyệt kỹ</span>
                    </div>
                    <span class="t-btn-arrow">➔</span>
                  </button>
                  <div class="t-drill-dropdown-wrap">
                    <label for="modal-drill-select">BÀI:</label>
                    <select id="modal-drill-select" class="training-select">
                      ${this.drills.map((d, i) => `
                        <option value="${i}" ${i === this.currentDrillIndex ? 'selected' : ''}>
                          ${d.title}
                        </option>
                      `).join('')}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <!-- Right Column: Character Dossier (Stats, Lore, Passives, Moves) -->
          <aside class="cs-right-col training-right-col">
            <div class="cs-dossier-card">
              <div class="cs-name-wrap">
                <div class="cs-name-header-row">
                  <h2 id="t-dossier-name" class="cs-hero-name" style="color: ${curHero.color};">${curHero.name}</h2>
                </div>
                <div id="t-dossier-title" class="cs-hero-subname">${curHero.title}</div>
                <div id="t-dossier-tagline" class="cs-hero-tagline">${curHero.desc}</div>
              </div>

              <p id="t-dossier-bio" class="cs-hero-bio">
                ${curSlot && curSlot.bio ? curSlot.bio : curHero.desc}
              </p>

              <!-- 4 Thanh chỉ số chiến đấu -->
              <div id="t-dossier-stats" class="cs-stats-container">
                <!-- Rendered dynamically -->
              </div>

              <!-- Chiêu Thức & Nội Tại Block -->
              <div class="cs-skills-block">
                <div class="cs-skills-header-bar">
                  <div class="cs-skills-subtabs" role="tablist">
                    <button id="btn-t-subtab-skills" class="cs-subtab-btn active" type="button">
                      <span>⚡</span> CHIÊU THỨC
                    </button>
                    <button id="btn-t-subtab-passives" class="cs-subtab-btn" type="button">
                      <span>🛡️</span> NỘI TẠI
                    </button>
                  </div>
                </div>
                <div class="cs-skills-body">
                  <div id="t-skills-badges" class="cs-skills-badges"></div>
                  <div id="t-passives-list" class="cs-passives-list" style="display: none;"></div>
                  <div id="t-dossier-mechanic" class="cs-mechanic-text">
                    ${curSlot && curSlot.mechanic ? curSlot.mechanic : 'Võ thuật Vovinam thực chiến.'}
                  </div>
                </div>
              </div>

              <!-- Quote -->
              <div id="t-dossier-quote" class="cs-dossier-quote">
                ${curSlot && curSlot.quote ? curSlot.quote : '“Không chỉ là võ, đó là đạo!”'}
              </div>
            </div>
          </aside>
        </div>
      </div>
    `;

    if (window.uiCore) window.uiCore.showModal(modal);
    else modal.classList.remove('hidden');

    const getTrainingSkins = (charId, slot) => {
      if (window.SkinRegistry && typeof window.SkinRegistry.getForCharacter === 'function') {
        return window.SkinRegistry.getForCharacter(slot || charId);
      }
      return [];
    };

    const getTrainingSupportCatalog = () => {
      if (window.menuManager && typeof window.menuManager.getAlliesCatalog === 'function') {
        return window.menuManager.getAlliesCatalog();
      }
      return [
        { id: 'auto', name: 'Tự Động', fullName: 'Tự Động Theo Cốt Truyện', icon: '✦', isSpecial: true, role: 'Linh Hoạt Theo Hồi', roleColor: '#38bdf8' },
        { id: 'bichlam', name: 'Bích Lâm', fullName: 'Đình Bích Lâm', icon: '❖', role: 'Hồi Máu & Càn Quét', roleColor: '#10b981', image: 'assets/images/characters/char_bichlam.png' },
        { id: 'hoanganh', name: 'Hoàng Anh', fullName: 'Phó Đặng Hoàng Anh', icon: '◈', role: 'Siêu Tanker & Phá Giáp', roleColor: '#f59e0b', image: 'assets/images/characters/char_hoanganh.png' },
        { id: 'dunghai', name: 'Dung Hải', fullName: 'Phó Dung Hải', icon: '⚔', role: 'Sát Thương & Xuất Huyết', roleColor: '#f43f5e', image: 'assets/images/characters/char_dunghai.png' },
        { id: 'dinhan', name: 'Đình An', fullName: 'Triệu Đình An', icon: '🛡', role: 'Khiên Kim Cương & Taunt', roleColor: '#d97706', image: 'assets/images/characters/char_dinhan.png' },
        { id: 'huavudai', name: 'Hứa Vũ Đại', fullName: 'Hứa Vũ Đại', icon: '⚜', role: 'Chiến Thuật & Bom Khói', roleColor: '#a855f7', image: 'assets/images/characters/char_huavudai.png' },
        { id: 'giangmanh', name: 'Giang Mạnh', fullName: 'Ngô Giang Mạnh', icon: '❄', role: 'Phản Đòn & Băng Tê Liệt', roleColor: '#38bdf8', image: 'assets/images/characters/char_giangmanh.png' },
        { id: 'mocdang', name: 'Mộc Đăng', fullName: 'Phó Mộc Đăng', icon: '⚡', isSpecial: true, role: 'Khống Chế & Tê Liệt', roleColor: '#00d2ff', image: 'assets/images/characters/char_mocdang.png' },
        { id: 'none', name: 'Độc Hành', fullName: 'Chiến Đấu Độc Hành', icon: '✵', isSpecial: true, role: 'Thử Thách Bản Lĩnh', roleColor: '#c084fc' }
      ];
    };

    const getActiveTrainingAlly = (charId) => {
      const sm = window.saveManager;
      let aid = this.selectedTrainingAlly || (sm && sm.data && sm.data.selectedAlly) || (window.allyManager && window.allyManager.selectedAllyId) || 'auto';
      if (aid === charId) aid = 'auto';
      return aid;
    };

    const updateTrainingSupportAndLoadout = (charId) => {
      const hero = uniqueChars.find(c => c.id === charId) || uniqueChars[0];
      const slot = (window.CHAR_SLOTS && window.CHAR_SLOTS.find(s => s.id === charId)) || null;
      const sm = window.saveManager;
      const rawEq = (sm && typeof sm.getEquippedSkin === 'function') ? (sm.getEquippedSkin(charId) || 'default') : 'default';
      const eqSkinId = (charId === 'nghi' && rawEq === 'vovinam') ? 'default' : rawEq;
      const skins = getTrainingSkins(charId, slot);
      const activeSkin = skins.find(s => s.id === eqSkinId) || skins[0];

      const allyId = getActiveTrainingAlly(charId);
      const catalog = getTrainingSupportCatalog();
      const allyObj = catalog.find(a => a.id === allyId) || catalog[0];
      const profile = (window.ALLY_PROFILES && window.ALLY_PROFILES[allyId]) || null;

      const compImg = modal.querySelector('#t-support-companion-img');
      const compIcon = modal.querySelector('#t-support-companion-icon');
      const compName = modal.querySelector('#t-support-companion-name');
      const compRole = modal.querySelector('#t-support-companion-role');
      const compSkill = modal.querySelector('#t-support-companion-skill');

      if (compImg && compIcon) {
        if (allyId === 'auto' || allyId === 'none' || !allyObj.image) {
          compImg.classList.add('hidden');
          compIcon.classList.remove('hidden');
          compIcon.textContent = allyId === 'none' ? '⚔️' : '⭐';
        } else {
          compIcon.classList.add('hidden');
          compImg.classList.remove('hidden');
          compImg.src = allyObj.image;
        }
      }
      if (compName) compName.textContent = ((profile && profile.name) || allyObj.name).toUpperCase();
      if (compRole) {
        compRole.textContent = (profile && profile.role) || allyObj.role || 'Trợ Chiến';
        compRole.style.color = (profile && profile.roleColor) || allyObj.roleColor || '#38bdf8';
      }
      if (compSkill) {
        if (allyId === 'auto') compSkill.textContent = 'Tự kích hoạt đồng minh từng hồi';
        else if (allyId === 'none') compSkill.textContent = 'Độc hành — Không viện trợ';
        else if (profile && profile.activeSkill) compSkill.textContent = `[H] ${profile.activeSkill.name}`;
        else compSkill.textContent = allyObj.role || 'Hỗ trợ thực chiến';
      }

      const lHero = modal.querySelector('#t-loadout-hero-name');
      const lSkin = modal.querySelector('#t-loadout-skin-name');
      const lAlly = modal.querySelector('#t-loadout-ally-name');
      if (lHero) lHero.textContent = (slot && slot.slotName) || hero.name;
      if (lSkin) lSkin.textContent = activeSkin ? activeSkin.name : 'Mặc Định';
      if (lAlly) lAlly.textContent = allyObj ? allyObj.name : 'Tự Động';
    };

    const renderTrainingSkinGrid = (charId) => {
      const skinGrid = modal.querySelector('#training-skin-grid');
      const countBadge = modal.querySelector('#t-tab-skin-count');
      if (!skinGrid) return;
      const slot = (window.CHAR_SLOTS && window.CHAR_SLOTS.find(s => s.id === charId)) || null;
      const sm = window.saveManager;
      const rawEq = (sm && typeof sm.getEquippedSkin === 'function') ? (sm.getEquippedSkin(charId) || 'default') : 'default';
      const eqSkinId = (charId === 'nghi' && rawEq === 'vovinam') ? 'default' : rawEq;
      const skins = getTrainingSkins(charId, slot);
      if (countBadge) countBadge.textContent = String(skins.length || 1);

      skinGrid.innerHTML = '';
      if (!skins.length) {
        skinGrid.innerHTML = '<div class="cs-skin-empty">Võ sĩ này đang dùng trang phục mặc định.</div>';
        return;
      }

      skins.forEach((sk) => {
        const isSelected = eqSkinId === sk.id;
        const card = document.createElement('div');
        card.className = 'cs-skin-card' + (sk.rarity ? ` rarity-${sk.rarity}` : '') + (isSelected ? ' selected' : '');
        card.setAttribute('data-skin-id', sk.id);
        card.innerHTML = `
          <div class="cs-skin-art-wrap">
            ${sk.image ? `<img class="cs-skin-card-img" src="${sk.image}" alt="${sk.name}">` : ''}
            <span class="cs-skin-tier-ribbon ${sk.badgeClass || 'default'}">${sk.tier || 'VÕ ĐƯỜNG'}</span>
          </div>
          <div class="cs-skin-info">
            <div>
              <div class="cs-skin-title">${sk.name}</div>
              <div class="cs-skin-desc">${sk.sub || 'Thay đổi ngoại hình trong Võ Đường'}</div>
            </div>
            <span class="cs-skin-status-pill">${isSelected ? '✔ ĐANG MẶC' : 'NHẤN ĐỂ THAY'}</span>
          </div>`;
        card.addEventListener('click', () => {
          const targetSkin = (charId === 'nghi' && sk.id === 'vovinam') ? 'default' : sk.id;
          if (sm && typeof sm.setSkinEquipped === 'function') {
            sm.setSkinEquipped(charId, targetSkin);
          }
          if (window.skeletalRenderer) window.skeletalRenderer._styles = {};
          updateDossier(charId);
          if (window.audioManager && typeof window.audioManager.playSkill === 'function') {
            window.audioManager.playSkill();
          }
        });
        skinGrid.appendChild(card);
      });
    };

    const renderTrainingSupportGrid = (charId) => {
      const suppGrid = modal.querySelector('#training-support-grid');
      const countBadge = modal.querySelector('#t-tab-support-count');
      if (!suppGrid) return;
      const catalog = getTrainingSupportCatalog();
      if (countBadge) countBadge.textContent = String(catalog.length);
      const activeAllyId = getActiveTrainingAlly(charId);
      suppGrid.innerHTML = '';

      catalog.forEach((a) => {
        const isHeroActive = (a.id === charId);
        const isSelected = (a.id === activeAllyId);
        const profile = (window.ALLY_PROFILES && window.ALLY_PROFILES[a.id]) || null;
        const roleSub = (profile && profile.role) || a.role || 'Hỗ trợ';
        const accentColor = (profile && profile.roleColor) || a.roleColor || '#38bdf8';

        const card = document.createElement('div');
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('data-ally-id', a.id);
        card.style.setProperty('--char-color', accentColor);
        card.className = 'cs-card t-card t-support-card' +
          (a.id === 'auto' ? ' ally-card-auto' : '') +
          (a.id === 'none' ? ' ally-card-solo' : '') +
          (isSelected ? ' selected active' : '') +
          (isHeroActive ? ' hero-busy locked' : '');

        if (a.id === 'auto') {
          card.innerHTML = `
            <div class="cs-card-thumb-wrap ally-auto-thumb"><span class="ally-auto-icon">⭐</span></div>
            <div class="cs-card-banner ally-auto-banner">
              <span class="cs-card-name ally-auto-title">TỰ ĐỘNG THEO TRUYỆN</span>
              <span class="ally-auto-desc">Tự chọn đồng đội phối hợp trong Võ Đường</span>
            </div>
            <span class="ally-auto-tag">⭐ AUTO</span>`;
        } else if (a.id === 'none') {
          card.innerHTML = `
            <div class="cs-card-thumb-wrap">
              <div class="t-solo-art">
                <span class="t-solo-icon">⚔️</span>
                <span class="t-solo-label">TỰ LỰC CÁNH SINH</span>
              </div>
              <span class="t-card-faction-chip">SOLO</span>
              <span class="cs-card-element" style="color:${accentColor}">${a.icon || '🥋'}</span>
            </div>
            <div class="cs-card-banner t-card-banner">
              <span class="cs-card-name">ĐỘC HÀNH</span>
              <span class="t-card-role-sub">Không gọi trợ chiến</span>
            </div>`;
        } else {
          card.innerHTML = `
            <div class="cs-card-thumb-wrap">
              <img class="cs-card-img" src="${a.image}" alt="${a.name}">
              <span class="t-card-faction-chip">${isHeroActive ? '⚔️ XUẤT TRẬN' : roleSub}</span>
              <span class="cs-card-element" style="color:${accentColor}">${a.icon || '🤝'}</span>
            </div>
            <div class="cs-card-banner t-card-banner">
              <span class="cs-card-name">${a.name}</span>
              <span class="t-card-role-sub">${roleSub}</span>
            </div>`;
        }

        const activateCard = () => {
          if (isHeroActive) {
            if (window.uiManager && typeof window.uiManager.showToast === 'function') {
              window.uiManager.showToast('Võ sĩ này đang ra sân, hãy chọn Trợ Chiến khác!');
            }
            return;
          }
          this.selectedTrainingAlly = a.id;
          if (window.saveManager && typeof window.saveManager.setSelectedAlly === 'function') {
            window.saveManager.setSelectedAlly(a.id);
          }
          if (window.allyManager) {
            window.allyManager.selectedAllyId = a.id;
            if (typeof window.allyManager.updateHUD === 'function') window.allyManager.updateHUD();
          }
          renderTrainingSupportGrid(charId);
          updateTrainingSupportAndLoadout(charId);
          if (window.audioManager && typeof window.audioManager.playSkill === 'function') {
            window.audioManager.playSkill();
          }
        };
        card.addEventListener('click', activateCard);
        card.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activateCard(); }
        });
        suppGrid.appendChild(card);
      });
    };

    const switchTrainingTab = (tab) => {
      const activeTab = (tab === 'skins' || tab === 'support') ? tab : 'heroes';
      const btnH = modal.querySelector('#btn-t-tab-heroes');
      const btnS = modal.querySelector('#btn-t-tab-skins');
      const btnA = modal.querySelector('#btn-t-tab-support');
      const fBar = modal.querySelector('#training-roster-filters');
      const gH = modal.querySelector('#training-char-grid');
      const gS = modal.querySelector('#training-skin-grid');
      const gA = modal.querySelector('#training-support-grid');

      if (btnH) btnH.classList.toggle('active', activeTab === 'heroes');
      if (btnS) btnS.classList.toggle('active', activeTab === 'skins');
      if (btnA) btnA.classList.toggle('active', activeTab === 'support');
      if (fBar) fBar.classList.toggle('hidden', activeTab !== 'heroes');
      if (gH) gH.classList.toggle('hidden', activeTab !== 'heroes');
      if (gS) gS.classList.toggle('hidden', activeTab !== 'skins');
      if (gA) gA.classList.toggle('hidden', activeTab !== 'support');
    };

    const updateDossier = (charId) => {
      const hero = uniqueChars.find(c => c.id === charId) || uniqueChars[0];
      const slot = (window.CHAR_SLOTS && window.CHAR_SLOTS.find(s => s.id === charId)) || null;
      const sm = window.saveManager;
      const rawEq = (sm && typeof sm.getEquippedSkin === 'function') ? (sm.getEquippedSkin(charId) || 'default') : 'default';
      const eqSkinId = (charId === 'nghi' && rawEq === 'vovinam') ? 'default' : rawEq;
      const resolvedHeroImg = (window.SkinRegistry && typeof window.SkinRegistry.resolveImage === 'function')
        ? (window.SkinRegistry.resolveImage(slot || charId, eqSkinId) || hero.image)
        : hero.image;

      // Update Center Hero Spotlight (pre-warmed swap avoiding frame spikes)
      const heroImg = modal.querySelector('#t-hero-img');
      if (heroImg) {
        if (window.uiCore && typeof window.uiCore.swapImage === 'function') {
          window.uiCore.swapImage(heroImg, resolvedHeroImg);
        } else {
          heroImg.src = resolvedHeroImg;
        }
        heroImg.alt = hero.name;
      }
      const ambient = modal.querySelector('#t-hero-ambient');
      if (ambient) {
        ambient.style.background = `radial-gradient(circle, ${hero.color}44 0%, ${hero.color}11 45%, transparent 70%)`;
      }
      const badge = modal.querySelector('#t-hero-faction-badge');
      if (badge) {
        badge.textContent = hero.badge;
        badge.style.borderColor = hero.color;
        badge.style.color = hero.color;
      }
      const styleName = modal.querySelector('#t-hero-martial-style');
      if (styleName) styleName.textContent = hero.title;

      // Update Right Dossier
      const nameEl = modal.querySelector('#t-dossier-name');
      if (nameEl) {
        nameEl.textContent = hero.name;
        nameEl.style.color = hero.color;
      }
      const titleEl = modal.querySelector('#t-dossier-title');
      if (titleEl) titleEl.textContent = hero.title;
      const tagEl = modal.querySelector('#t-dossier-tagline');
      if (tagEl) tagEl.textContent = hero.desc;
      const bioEl = modal.querySelector('#t-dossier-bio');
      if (bioEl) bioEl.textContent = (slot && slot.bio) ? slot.bio : hero.desc;

      // Stats
      const statsBox = modal.querySelector('#t-dossier-stats');
      if (statsBox) {
        statsBox.innerHTML = '';
        const stats = (slot && slot.stats) ? slot.stats : { power: 85, speed: 80, defense: 80, technique: 85 };
        const statLabels = [
          { label: 'Sức mạnh', val: stats.power || 80 },
          { label: 'Tốc độ', val: stats.speed || 80 },
          { label: 'Kháng cự', val: stats.defense || 80 },
          { label: 'Kỹ thuật', val: stats.technique || 80 }
        ];
        statLabels.forEach(st => {
          const row = document.createElement('div');
          row.className = 'cs-stat-row';
          row.innerHTML = `
            <span class="cs-stat-label">${st.label}</span>
            <div class="cs-stat-track">
              <div class="cs-stat-fill" style="width: ${st.val}%"></div>
            </div>`;
          statsBox.appendChild(row);
        });
      }

      // Skills
      const skillsBadges = modal.querySelector('#t-skills-badges');
      if (skillsBadges) {
        skillsBadges.innerHTML = '';
        const skills = (slot && slot.skills) ? slot.skills : [
          { icon: '👊', key: 'J', name: 'Đấm Liên Hoàn', desc: 'Đòn quyền cơ bản' },
          { icon: '🦶', key: 'K', name: 'Đá Tạt Vovinam', desc: 'Đòn cước uy lực' },
          { icon: '⚡', key: 'U+J', name: 'Phản Đòn Tay', desc: 'Gạt đỡ & trả đòn' },
          { icon: '🌪️', key: 'I', name: 'Tuyệt Kỹ Nộ', desc: 'Đòn thế tối thượng' }
        ];
        skills.forEach(sk => {
          const item = document.createElement('div');
          item.className = 'cs-skill-card';
          item.title = `${sk.key ? '[' + sk.key + '] ' : ''}${sk.name}: ${sk.desc}`;
          item.innerHTML = `
            <span class="cs-skill-key">${sk.key || '✦'}</span>
            <div class="cs-skill-info">
              <span class="cs-skill-name">${sk.name}</span>
              <span class="cs-skill-desc">${sk.desc}</span>
            </div>
          `;
          skillsBadges.appendChild(item);
        });
      }

      // Passives
      const passivesList = modal.querySelector('#t-passives-list');
      if (passivesList) {
        passivesList.innerHTML = '';
        const passives = (slot && slot.passives) ? slot.passives : [
          { icon: '⚡', name: 'Khí Phách', type: 'BỊ ĐỘNG', desc: 'Tăng sát thương theo combo' },
          { icon: '🛡️', name: 'Kim Cang', type: 'BỊ ĐỘNG', desc: 'Giảm sát thương khi phòng thủ' }
        ];
        passives.forEach(p => {
          const pCard = document.createElement('div');
          pCard.className = 'cs-passive-card';
          pCard.title = `${p.name} [${p.type}]: ${p.desc}`;
          const isAct = p.type && p.type.includes('CHỦ ĐỘNG');
          pCard.innerHTML = `
            <div class="cs-passive-icon-circle">${p.icon}</div>
            <div class="cs-passive-info">
              <div class="cs-passive-header-row">
                <span class="cs-passive-name">${p.name}</span>
                <span class="cs-passive-tag ${isAct ? 'active' : 'passive'}">${p.type}</span>
              </div>
              <div class="cs-passive-desc">${p.desc}</div>
            </div>
          `;
          passivesList.appendChild(pCard);
        });
      }

      const mechEl = modal.querySelector('#t-dossier-mechanic');
      if (mechEl) mechEl.textContent = (slot && slot.mechanic) ? slot.mechanic : 'Võ thuật Vovinam thực chiến.';
      const quoteEl = modal.querySelector('#t-dossier-quote');
      if (quoteEl) quoteEl.textContent = (slot && slot.quote) ? slot.quote : '“Không chỉ là võ, đó là đạo!”';

      renderTrainingSkinGrid(charId);
      renderTrainingSupportGrid(charId);
      updateTrainingSupportAndLoadout(charId);
    };

    updateDossier(curHero.id);
    modal._tUpdateDossier = updateDossier;
    modal._tSwitchTab = switchTrainingTab;
    if (modal.dataset) modal.dataset.tBuilt = '1';

    const tabHeroes = modal.querySelector('#btn-t-tab-heroes');
    const tabSkins = modal.querySelector('#btn-t-tab-skins');
    const tabSupport = modal.querySelector('#btn-t-tab-support');
    const btnChangeSupport = modal.querySelector('#btn-t-change-support');
    if (tabHeroes) tabHeroes.addEventListener('click', () => switchTrainingTab('heroes'));
    if (tabSkins) tabSkins.addEventListener('click', () => switchTrainingTab('skins'));
    if (tabSupport) tabSupport.addEventListener('click', () => switchTrainingTab('support'));
    if (btnChangeSupport) btnChangeSupport.addEventListener('click', () => switchTrainingTab('support'));

    // Sự kiện chọn võ sĩ trong bảng roster
    const charCards = (typeof modal.querySelectorAll === 'function') ? modal.querySelectorAll('#training-char-grid .cs-card') : [];
    charCards.forEach(card => {
      card.addEventListener('click', () => {
        const charId = card.getAttribute('data-char-id');
        if (!charId) return;
        this.selectedTrainingChar = charId;
        if (window.saveManager) {
          window.saveManager.data.selectedCharacter = charId;
          if (window.uiCore) window.uiCore.schedulePersist(250);
          else window.saveManager.persist();
        }
        charCards.forEach(c => c.classList.toggle('selected', c === card));
        updateDossier(charId);
        if (window.audioManager && typeof window.audioManager.playSkill === 'function') {
          window.audioManager.playSkill();
        }
      });
    });

    // Subtabs chuyển đổi Chiêu Thức / Nội Tại
    const btnSubSkills = modal.querySelector('#btn-t-subtab-skills');
    const btnSubPassives = modal.querySelector('#btn-t-subtab-passives');
    const skillsBox = modal.querySelector('#t-skills-badges');
    const passivesBox = modal.querySelector('#t-passives-list');
    if (btnSubSkills && btnSubPassives) {
      btnSubSkills.addEventListener('click', () => {
        btnSubSkills.classList.add('active');
        btnSubPassives.classList.remove('active');
        if (skillsBox) skillsBox.style.display = 'flex';
        if (passivesBox) passivesBox.style.display = 'none';
      });
      btnSubPassives.addEventListener('click', () => {
        btnSubPassives.classList.add('active');
        btnSubSkills.classList.remove('active');
        if (skillsBox) skillsBox.style.display = 'none';
        if (passivesBox) passivesBox.style.display = 'flex';
      });
    }

    const closeModal = () => {
      if (window.uiCore) window.uiCore.hideModal(modal);
      else modal.classList.add('hidden');
    };

    // Bộ lọc thế lực + tìm kiếm võ sĩ
    let activeFilter = 'all';
    let searchText = '';
    const applyRosterFilter = () => {
      charCards.forEach(card => {
        const meta = uniqueChars.find(c => c.id === card.getAttribute('data-char-id'));
        if (!meta) return;
        const okFaction = activeFilter === 'all'
          || (activeFilter === 'other' ? meta.faction !== 'Họ Phó' : meta.faction === activeFilter);
        const hay = `${meta.name} ${meta.title} ${meta.faction}`.toLowerCase();
        const okSearch = !searchText || hay.includes(searchText);
        card.style.display = (okFaction && okSearch) ? '' : 'none';
      });
    };
    const filterBar = modal.querySelector('#training-roster-filters');
    if (filterBar) {
      filterBar.querySelectorAll('.t-filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          activeFilter = pill.getAttribute('data-tfilter') || 'all';
          filterBar.querySelectorAll('.t-filter-pill').forEach(p => p.classList.toggle('active', p === pill));
          applyRosterFilter();
        });
      });
      const searchBox = filterBar.querySelector('#training-roster-search');
      if (searchBox) {
        searchBox.addEventListener('input', () => {
          searchText = String(searchBox.value || '').trim().toLowerCase();
          applyRosterFilter();
        });
        searchBox.addEventListener('keydown', (ev) => ev.stopPropagation());
      }
    }

    const btnCloseX = modal.querySelector('#btn-close-training-modal-x');
    if (btnCloseX) btnCloseX.addEventListener('click', closeModal);
    const btnCloseBtn = modal.querySelector('#btn-close-training-modal-btn');
    if (btnCloseBtn) btnCloseBtn.addEventListener('click', closeModal);

    const btnStartFree = modal.querySelector('#btn-modal-start-free');
    if (btnStartFree) {
      btnStartFree.addEventListener('click', () => {
        closeModal();
        if (window.menuManager) window.menuManager.hideAll();
        if (window.uiManager) window.uiManager.hideTitleScreen();
        this.startTraining('free', 0, this.selectedTrainingChar);
      });
    }

    const btnStartDrill = modal.querySelector('#btn-modal-start-drill');
    const selDrill = modal.querySelector('#modal-drill-select');
    if (btnStartDrill) {
      btnStartDrill.addEventListener('click', () => {
        const idx = selDrill ? parseInt(selDrill.value, 10) : 0;
        closeModal();
        if (window.menuManager) window.menuManager.hideAll();
        if (window.uiManager) window.uiManager.hideTitleScreen();
        this.startTraining('drill', idx, this.selectedTrainingChar);
      });
    }
  }


  toggleMenuCollapse(forceState) {
    if (typeof forceState === 'boolean') {
      this.isMenuCollapsed = forceState;
    } else {
      this.isMenuCollapsed = !this.isMenuCollapsed;
    }
    this.updateOverlayUI();
    if (window.audioManager) {
      if (typeof window.audioManager.playSkill === 'function') window.audioManager.playSkill();
      else if (typeof window.audioManager.playWhoosh === 'function') window.audioManager.playWhoosh();
    }
  }

  showOverlay() {
    let el = document.getElementById('training-hud-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'training-hud-overlay';
      el.className = 'training-overlay';
      document.getElementById('ui-layer').appendChild(el);
    }
    el.classList.remove('hidden');
    this.overlay = el;
    this.updateOverlayUI();
  }

  hideOverlay() {
    const el = document.getElementById('training-hud-overlay');
    if (el) el.classList.add('hidden');
  }

  updateOverlayUI() {
    if (!this.overlay) return;
    const isDrill = (this.mode === 'drill');
    const drill = this.drills[this.currentDrillIndex];
    const curChar = (window.game && window.game.player && window.game.player.characterId) || this.selectedTrainingChar || (window.saveManager && window.saveManager.data.selectedCharacter) || 'nghi';
    const allChars = window.TRAINING_CHARACTERS || [];
    const dedupRoster = [];
    const dedupIds = new Set();
    for (const c of allChars) {
      if (!dedupIds.has(c.id)) {
        dedupIds.add(c.id);
        dedupRoster.push(c);
      }
    }
    const activeHero = dedupRoster.find(c => c.id === curChar) || dedupRoster[0];

    // Trạng thái thu gọn (Collapsed): Hiển thị nút floating dock nhỏ gọn, không chắn màn hình
    if (this.isMenuCollapsed) {
      this.overlay.classList.add('collapsed');
      this.overlay.innerHTML = `
        <div class="training-floating-dock">
          <button id="btn-expand-training-menu" class="btn-training-expand-pill" title="Mở bảng tùy biến luyện võ (Phím tắt: [C])">
            <span class="pill-badge-glow"></span>
            <span class="pill-icon">${isDrill ? '🥋' : '⚡'}</span>
            <div class="pill-content">
              <span class="pill-title">${isDrill ? `BÀI ${this.currentDrillIndex + 1}: ${drill ? drill.title : 'HUẤN LUYỆN'}` : 'LUYỆN TẬP TỰ DO'}</span>
              <span class="pill-subtitle">Bấm để mở lại menu <kbd>[C]</kbd></span>
            </div>
            <span class="pill-chevron">🔼</span>
          </button>
        </div>
      `;
      const btnExpand = this.overlay.querySelector('#btn-expand-training-menu');
      if (btnExpand) btnExpand.addEventListener('click', () => this.toggleMenuCollapse(false));
      return;
    }

    this.overlay.classList.remove('collapsed');

    // Khung giao diện chính với Segmented Tabs chuyển đổi chế độ
    if (isDrill && drill) {
      this.overlay.innerHTML = `
        <div class="training-card free-training-card">
          <!-- 4 Góc đồng triện hoa văn cổ truyền Việt Nam -->
          <span class="vovinam-corner corner-tl"></span>
          <span class="vovinam-corner corner-tr"></span>
          <span class="vovinam-corner corner-bl"></span>
          <span class="vovinam-corner corner-br"></span>

          <div class="training-header">
            <div class="training-header-left">
              <span class="training-tag gold">⚡ VÕ ĐƯỜNG VOVINAM</span>
              <span class="training-step">BÀI ${this.currentDrillIndex + 1} / ${this.drills.length}</span>
            </div>
            <button id="btn-collapse-training-menu" class="btn-training-header-toggle" title="Thu gọn menu để không che tầm nhìn (Phím tắt: [C])">
              <span class="btn-toggle-icon">➖</span>
              <span class="btn-toggle-text">THU GỌN [C]</span>
            </button>
          </div>
          <div class="vovinam-sub-motto">CƯƠNG NHU PHỐI TRIỂN • VIỆT VÕ ĐẠO</div>

          <!-- Thanh Tabs chuyển đổi nhanh chế độ -->
          <div class="training-mode-tabs">
            <button id="tab-mode-free" class="t-mode-tab" title="Chuyển sang chế độ Luyện Tự Do (Sandbox)">
              <span class="tab-icon">⚡</span>
              <span class="tab-text">LUYỆN TẬP TỰ DO</span>
            </button>
            <button id="tab-mode-drills" class="t-mode-tab active" title="Đang ở chế độ Khảo Hạch 7 Bài Tập">
              <span class="tab-icon">🥋</span>
              <span class="tab-text">7 BÀI KHẢO HẠCH</span>
            </button>
          </div>

          <!-- Thanh Đổi Nhanh 7 Võ Sĩ Trong Trận -->
          <div class="training-quick-roster-bar" title="Đổi nhanh võ sĩ đang luyện tập">
            <div class="quick-roster-header">
              <span class="quick-roster-label">VÕ SĨ XUẤT TRẬN:</span>
              <span class="active-hero-badge" style="color: ${activeHero.color}; border-color: ${activeHero.color}60; background: ${activeHero.color}1c;">
                ${activeHero.icon} ${activeHero.name}
              </span>
            </div>
            <div class="quick-roster-pills">
              ${dedupRoster.map(c => `
                <button class="quick-char-pill ${c.id === curChar ? 'active' : ''}" data-char-id="${c.id}" style="--pill-color: ${c.color};" title="${c.name} — ${c.title}&#10;${c.desc}">
                  <img class="pill-thumb" src="${c.image}" alt="" onerror="this.style.display='none'">
                  <span class="pill-name">${c.shortName || c.name.replace(/^(Phó|Ngô)\s+/, '')}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Dropdown chọn nhanh bài tập bất kỳ -->
          <div class="training-drill-select-row">
            <label class="drill-select-label" for="training-drill-select">CHUYỂN BÀI TẬP:</label>
            <select id="training-drill-select" class="training-select">
              ${this.drills.map((d, i) => `
                <option value="${i}" ${i === this.currentDrillIndex ? 'selected' : ''}>
                  ${d.title}
                </option>
              `).join('')}
            </select>
          </div>

          <h2 class="training-title">${drill.title}</h2>
          <p class="training-desc">${drill.desc}</p>
          <div class="training-keys-box">
            <span class="keys-label">THỰC HIỆN:</span>
            <span class="keys-content">${drill.keys}</span>
          </div>

          <!-- Thanh tiến độ bài tập -->
          <div class="training-progress-row">
            <div class="t-bar-shell">
              <div class="t-bar-fill" style="width: ${(this.drillProgress / this.drillTarget) * 100}%"></div>
            </div>
            <span class="t-progress-text">${this.drillProgress} / ${this.drillTarget}</span>
          </div>

          <!-- Thanh Timing nếu là bài né / phản đòn -->
          ${(drill.id === 'drill_dodge' || drill.id === 'drill_counter_hand' || drill.id === 'drill_counter_leg') ? `
            <div class="training-timing-box">
              <span class="timing-label">NHỊP ĐÒN ĐỐI THỦ:</span>
              <div class="timing-meter-wrap">
                <div id="training-timing-meter" class="timing-meter"></div>
                <div class="perfect-window-marker">VÙNG HOÀN HẢO</div>
              </div>
            </div>
          ` : ''}

          <div class="training-hint">💡 ${drill.hint}</div>

          <div class="training-actions">
            <button id="btn-training-skip-drill" class="btn btn-primary btn-sm">BÀI TIẾP THEO ⏩</button>
            <button id="btn-training-reset-pos" class="btn btn-secondary btn-sm" title="Đặt lại vị trí nhân vật về xuất phát (Phím tắt: [R])">🔄 ĐẶT LẠI [R]</button>
            <button id="btn-collapse-training-menu-bottom" class="btn btn-ghost btn-sm" title="Thu gọn bảng hướng dẫn">👁️ ẨN BẢNG [C]</button>
            <button id="btn-training-quit" class="btn btn-ghost btn-sm btn-quit">✕ RỜI VÕ ĐƯỜNG</button>
          </div>
        </div>
      `;

      // Event bindings cho Drill mode
      const btnCollapse = this.overlay.querySelector('#btn-collapse-training-menu');
      if (btnCollapse) btnCollapse.addEventListener('click', () => this.toggleMenuCollapse(true));
      const btnCollapseBottom = this.overlay.querySelector('#btn-collapse-training-menu-bottom');
      if (btnCollapseBottom) btnCollapseBottom.addEventListener('click', () => this.toggleMenuCollapse(true));

      const tabFree = this.overlay.querySelector('#tab-mode-free');
      if (tabFree) tabFree.addEventListener('click', () => this.switchToFreeMode());

      // Quick character pills click
      const quickPillsDrill = (typeof this.overlay.querySelectorAll === 'function') ? this.overlay.querySelectorAll('.quick-char-pill') : [];
      quickPillsDrill.forEach(pill => {
        pill.addEventListener('click', () => {
          const charId = pill.getAttribute('data-char-id');
          if (charId) this.setPlayerCharacter(charId);
        });
      });

      const selDrill = this.overlay.querySelector('#training-drill-select');
      if (selDrill) {
        selDrill.addEventListener('change', (e) => {
          this.setupDrill(parseInt(e.target.value, 10));
        });
      }

      const btnSkip = this.overlay.querySelector('#btn-training-skip-drill');
      if (btnSkip) btnSkip.addEventListener('click', () => this.setupDrill(this.currentDrillIndex + 1));
      const btnResetPos = this.overlay.querySelector('#btn-training-reset-pos');
      if (btnResetPos) btnResetPos.addEventListener('click', () => this.resetPositions());
      const btnQuit = this.overlay.querySelector('#btn-training-quit');
      if (btnQuit) btnQuit.addEventListener('click', () => this.quitTraining());
    } else {
      // Chế độ luyện tự do vô tận (Free Sandbox Mode)
      const curDummyStyle = (this.dummy && this.dummy.styleType) || 'dummy_wood';
      const curDummyMode = (this.dummy && this.dummy.attackMode) || 'idle';

      this.overlay.innerHTML = `
        <div class="training-card free-training-card">
          <!-- 4 Góc đồng triện hoa văn cổ truyền Việt Nam -->
          <span class="vovinam-corner corner-tl"></span>
          <span class="vovinam-corner corner-tr"></span>
          <span class="vovinam-corner corner-bl"></span>
          <span class="vovinam-corner corner-br"></span>

          <!-- 1. Header mộc bản võ phái Vovinam -->
          <div class="training-header">
            <div class="training-header-left">
              <span class="training-tag gold">⚡ VÕ ĐƯỜNG VOVINAM</span>
            </div>
            <button id="btn-collapse-training-menu" class="btn-training-header-toggle" title="Thu gọn bảng tùy chỉnh (Phím tắt: [C])">
              <span class="btn-toggle-icon">➖</span>
              <span class="btn-toggle-text">THU GỌN [C]</span>
            </button>
          </div>
          <div class="vovinam-sub-motto">CƯƠNG NHU PHỐI TRIỂN • VIỆT VÕ ĐẠO</div>

          <!-- 2. Tabs chuyển đổi chế độ chuẩn xác -->
          <div class="training-mode-tabs">
            <button id="tab-mode-free" class="t-mode-tab active" title="Đang ở chế độ Luyện Tự Do">
              <span class="tab-icon">⚡</span>
              <span class="tab-text">LUYỆN TẬP TỰ DO</span>
            </button>
            <button id="tab-mode-drills" class="t-mode-tab" title="Chuyển sang 7 Bài Khảo Hạch">
              <span class="tab-icon">🥋</span>
              <span class="tab-text">7 BÀI KHẢO HẠCH</span>
            </button>
          </div>

          <!-- 3. Hàng Thẻ Bài 7 Môn Đệ (Quick Roster) -->
          <div class="training-quick-roster-bar" title="Đổi nhanh võ sĩ đang luyện tập">
            <div class="quick-roster-header">
              <span class="quick-roster-label">VÕ SĨ XUẤT TRẬN:</span>
              <span class="active-hero-badge" style="color: ${activeHero.color}; border-color: ${activeHero.color}60; background: ${activeHero.color}1c;">
                ${activeHero.icon} ${activeHero.name}
              </span>
            </div>
            <div class="quick-roster-pills">
              ${dedupRoster.map(c => `
                <button class="quick-char-pill ${c.id === curChar ? 'active' : ''}" data-char-id="${c.id}" style="--pill-color: ${c.color};" title="${c.name} — ${c.title}&#10;${c.desc}">
                  <img class="pill-thumb" src="${c.image}" alt="" onerror="this.style.display='none'">
                  <span class="pill-name">${c.shortName || c.name.replace(/^(Phó|Ngô)\s+/, '')}</span>
                </button>
              `).join('')}
            </div>
            <select id="training-player-char" style="display:none;" aria-hidden="true">
              ${dedupRoster.map(c => `
                <option value="${c.id}" ${c.id === curChar ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>
          </div>

          <!-- 4. Lưới điều khiển 2 Trụ Cột Võ Thuật: Đối Thủ & Công Phu Hộ Thân -->
          <div class="training-grid-controls">
            <!-- Cột Trái: Cấu hình Đối Thủ Hình Nộm -->
            <div class="training-panel-card">
              <div class="panel-card-title">
                <span class="panel-icon">⚔️</span>
                <span>HÌNH NỘM TẬP ĐÒN</span>
              </div>
              <div class="panel-control-row">
                <label for="training-dummy-char" class="control-label">Nhân vật:</label>
                <select id="training-dummy-char" class="training-select">
                  <option value="dummy_wood">Mộc Nhân Gỗ Võ Đường</option>
                  <option value="thug">Côn Đồ Đường Phố</option>
                  <option value="enemy_guard">Vệ Binh Giáp Trụ</option>
                  <option value="enemy_dodger">Sát Thủ Thân Pháp</option>
                  <option value="enemy_baton">Côn Đồ Gậy Điện</option>
                  <option value="enemy_blade">Sát Thủ Mã Tấu</option>
                  <option value="enemy_shield">Vệ Binh Khiên Bạo Động</option>
                  <option value="boss_haclang">Boss Hắc Lang</option>
                  <option value="boss_thietquyen">Boss Thiết Quyền</option>
                  <option value="boss_hoanganh">Boss Hoàng Anh</option>
                  <option value="boss_dinhan">Boss Đình An</option>
                  <option value="boss_longvuong">Boss Long Vương</option>
                </select>
              </div>
              <div class="panel-control-row">
                <label for="training-dummy-behavior" class="control-label">Hành vi:</label>
                <select id="training-dummy-behavior" class="training-select">
                  <option value="idle">Đứng yên chịu đòn</option>
                  <option value="guard">Thủ thế (Luyện phá thủ)</option>
                  <option value="telegraph_hand">Tấn công tay: Đấm [U+J]</option>
                  <option value="telegraph_leg">Tấn công chân: Đá [U+K]</option>
                  <option value="sparring">Đối kháng chủ động 🥊</option>
                  <option value="free">Giao đấu tự do nhẹ nhàng</option>
                </select>
              </div>
            </div>

            <!-- Cột Phải: Trạng Thái Võ Học (Ấn Triện Võ Thuật) -->
            <div class="training-panel-card">
              <div class="panel-card-title">
                <span class="panel-icon">🥋</span>
                <span>CÔNG PHU HỘ THÂN</span>
              </div>
              <div class="training-switches-group">
                <button id="btn-training-no-cd" class="training-switch-btn ${this.noCooldown ? 'active' : ''}" title="Bật/Tắt nạp đầy tuyệt kỹ & hồi chiêu tức thì">
                  <span class="switch-left">
                    <span class="switch-ico">⚡</span>
                    <span class="switch-name">HỒI CHIÊU 0S</span>
                  </span>
                  <span class="switch-badge ${this.noCooldown ? 'on' : 'off'}">${this.noCooldown ? 'BẬT' : 'TẮT'}</span>
                </button>
                <button id="btn-training-god-mode" class="training-switch-btn ${this.playerGodMode ? 'active' : ''}" title="Bảo hộ người chơi không chết khi giao đấu">
                  <span class="switch-left">
                    <span class="switch-ico">🩸</span>
                    <span class="switch-name">BẢO HỘ BẤT TỬ</span>
                  </span>
                  <span class="switch-badge ${this.playerGodMode ? 'on' : 'off'}">${this.playerGodMode ? 'BẬT' : 'TẮT'}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 5. Bia Đo Kình Lực & Sát Thương (Martial Telemetry Plaque) -->
          <div class="training-telemetry-box">
            <div class="telemetry-pill">
              <span class="telemetry-label">💥 NGOẠI KÌNH</span>
              <span id="telemetry-last-dmg" class="telemetry-val">${this.lastDamage}</span>
            </div>
            <div class="telemetry-pill">
              <span class="telemetry-label">🔥 LIÊN HOÀN</span>
              <span id="telemetry-combo-dmg" class="telemetry-val">${this.currentComboDamage}</span>
            </div>
            <div class="telemetry-pill highlight">
              <span class="telemetry-label">🏆 ĐỈNH CÔNG</span>
              <span id="telemetry-max-combo" class="telemetry-val">${this.maxComboHits} Hits (${this.maxComboDamage} dmg)</span>
            </div>
          </div>

          <!-- 6. Thanh 4 Lệnh Bài Hành Động -->
          <div class="training-actions">
            <button id="btn-training-reset-pos" class="btn btn-secondary btn-sm" title="Đặt lại thế tấn xuất phát (Phím tắt: [R])">
              🔄 ĐẶT LẠI [R]
            </button>
            <button id="btn-training-refill-energy" class="btn btn-primary btn-sm" title="Nạp đầy 100% Năng lượng Khí Công Vovinam">
              ⚡ NẠP ĐẦY KHÍ
            </button>
            <button id="btn-collapse-training-menu-bottom" class="btn btn-ghost btn-sm" title="Ẩn mộc bản tùy chỉnh (Phím tắt: [C])">
              👁️ ẨN BẢNG [C]
            </button>
            <button id="btn-training-quit" class="btn btn-ghost btn-sm btn-quit" title="Rời Võ Đường về màn hình chính">
              ✕ RỜI VÕ ĐƯỜNG
            </button>
          </div>
        </div>
      `;
      const btnCollapse = this.overlay.querySelector('#btn-collapse-training-menu');
      if (btnCollapse) btnCollapse.addEventListener('click', () => this.toggleMenuCollapse(true));
      const btnCollapseBottom = this.overlay.querySelector('#btn-collapse-training-menu-bottom');
      if (btnCollapseBottom) btnCollapseBottom.addEventListener('click', () => this.toggleMenuCollapse(true));

      const tabDrills = this.overlay.querySelector('#tab-mode-drills');
      if (tabDrills) tabDrills.addEventListener('click', () => this.switchToDrillMode(0));

      // Quick character pills click
      const quickPillsFree = (typeof this.overlay.querySelectorAll === 'function') ? this.overlay.querySelectorAll('.quick-char-pill') : [];
      quickPillsFree.forEach(pill => {
        pill.addEventListener('click', () => {
          const charId = pill.getAttribute('data-char-id');
          if (charId) this.setPlayerCharacter(charId);
        });
      });

      // Binding behavior select
      const selBehavior = this.overlay.querySelector('#training-dummy-behavior');
      if (selBehavior && this.dummy) {
        selBehavior.value = curDummyMode;
        selBehavior.addEventListener('change', (e) => {
          if (this.dummy) {
            this.dummy.attackMode = e.target.value;
            this.dummy.isAttacking = false;
            this.dummy.vx = 0; this.dummy.vy = 0;
            this.dummy.telegraphState = 'idle';
            this.dummy.telegraphTimer = 0;
            this.dummy.sparCooldown = 1.0;
            this.dummy.setState('idle');
            if (window.uiManager) window.uiManager.showToast(`Hành vi hình nộm: ${selBehavior.options[selBehavior.selectedIndex].text}`);
          }
        });
      }

      // Binding player character select
      const selPlayerChar = this.overlay.querySelector('#training-player-char');
      if (selPlayerChar) {
        selPlayerChar.value = curChar;
        selPlayerChar.addEventListener('change', (e) => {
          this.setPlayerCharacter(e.target.value);
        });
      }

      // Binding dummy character select
      const selDummyChar = this.overlay.querySelector('#training-dummy-char');
      if (selDummyChar && this.dummy) {
        selDummyChar.value = curDummyStyle;
        selDummyChar.addEventListener('change', (e) => {
          this.setDummyArchetype(e.target.value);
        });
      }

      // Binding no-cooldown toggle
      const btnNoCd = this.overlay.querySelector('#btn-training-no-cd');
      if (btnNoCd) {
        btnNoCd.addEventListener('click', () => {
          this.setNoCooldown(!this.noCooldown);
        });
      }

      // Binding god-mode toggle
      const btnGodMode = this.overlay.querySelector('#btn-training-god-mode');
      if (btnGodMode) {
        btnGodMode.addEventListener('click', () => {
          this.setPlayerGodMode(!this.playerGodMode);
        });
      }

      // Binding reset positions button
      const btnResetPos = this.overlay.querySelector('#btn-training-reset-pos');
      if (btnResetPos) {
        btnResetPos.addEventListener('click', () => {
          this.resetPositions();
        });
      }

      const btnRefill = this.overlay.querySelector('#btn-training-refill-energy');
      if (btnRefill && window.game && window.game.player) {
        btnRefill.addEventListener('click', () => {
          window.game.player.energy = window.game.player.maxEnergy;
          if (window.uiManager) window.uiManager.updatePlayerEnergy(100, 100);
          if (window.uiManager) window.uiManager.showToast('Đã nạp đầy năng lượng Vovinam!');
        });
      }

      const btnQuit = this.overlay.querySelector('#btn-training-quit');
      if (btnQuit) btnQuit.addEventListener('click', () => this.quitTraining());
    }
  }

}

window.TrainingManagerOverlay = TrainingManagerOverlay;
