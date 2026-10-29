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
      modal.className = 'modal-overlay hidden';
      document.body.appendChild(modal);
    }

    const savedChar = (window.saveManager && window.saveManager.data.selectedCharacter) || 'nghi';
    if (!this.selectedTrainingChar) {
      this.selectedTrainingChar = savedChar;
    }
    const activeChar = this.selectedTrainingChar;

    modal.innerHTML = `
      <div class="modal-card wide-card training-mode-modal-card">
        <div class="training-modal-header">
          <div class="t-modal-title-wrap">
            <span class="t-modal-badge">🥋 VÕ ĐƯỜNG VOVINAM</span>
            <h2 class="modal-title t-modal-title">CHỌN CHẾ ĐỘ & VÕ SĨ LUYỆN TẬP</h2>
          </div>
          <button id="btn-close-training-modal-x" class="modal-close-icon" title="Đóng [ESC]">✕</button>
        </div>

        <!-- 1. Bảng Chọn Toàn Bộ 7 Cao Thủ Võ Thuật -->
        <div class="training-char-pick-section">
          <div class="t-char-section-header">
            <div class="t-char-section-title-wrap">
              <span class="t-char-section-icon">🥋</span>
              <div>
                <span class="t-char-section-title">CHỌN VÕ SĨ XUẤT TRẬN</span>
                <span class="t-char-section-sub">Mở khóa 100% toàn bộ 7 võ sĩ — Thử nghiệm đòn thế tự do không giới hạn</span>
              </div>
            </div>
            <span class="t-char-badge-full">FULL 7 CAO THỦ ⚡</span>
          </div>

          <div class="training-char-grid" id="training-char-grid">
            ${window.TRAINING_CHARACTERS.map(c => {
              const isSel = (c.id === activeChar);
              return `
                <div class="t-char-pick-card ${isSel ? 'selected' : ''}" data-char-id="${c.id}" style="--char-theme: ${c.color};" title="${c.name} — ${c.title}&#10;${c.desc}">
                  <div class="t-char-avatar-wrap">
                    <img src="${c.image}" alt="${c.name}" class="t-char-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                    <div class="t-char-avatar-fallback" style="display:none;">${c.icon}</div>
                    <span class="t-char-faction-pill" style="border-color: ${c.color}; color: ${c.color};">${c.badge}</span>
                  </div>
                  <div class="t-char-card-body">
                    <div class="t-char-card-name" style="color: ${c.color};">${c.name}</div>
                    <div class="t-char-card-title">${c.title}</div>
                    <div class="t-char-card-desc">${c.desc}</div>
                  </div>
                  <div class="t-char-card-status">
                    ${isSel ? '<span class="status-active">✓ ĐANG CHỌN</span>' : '<span class="status-idle">CHỌN VÕ SĨ</span>'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <p class="t-modal-subtitle" style="margin-top: 14px;">Tùy chọn hình thức rèn luyện theo mong muốn của bạn:</p>

        <div class="training-mode-cards-grid">
          <!-- Chế độ 1: Luyện Tập Tự Do (Sandbox) -->
          <div class="training-mode-pick-card free-pick">
            <div class="mode-pick-header">
              <span class="mode-pill-badge gold">⚡ KHUYÊN DÙNG</span>
              <span class="mode-pick-icon">⚡</span>
            </div>
            <h3 class="mode-pick-title">LUYỆN TẬP TỰ DO</h3>
            <p class="mode-pick-desc">Vào thẳng võ đường tự do không bị ép làm lại các bài tập. Thử combo, đổi bất kỳ hình nộm hay Boss nào, bật Không Hồi Chiêu & Bất Tử.</p>
            <ul class="mode-pick-bullets">
              <li>✓ Tự do điều khiển mọi võ sĩ & thử combo</li>
              <li>✓ Chỉnh hành vi hình nộm: Đứng yên, Đỡ đòn, Đối kháng 🥊</li>
              <li>✓ Bật/Tắt Không Hồi Chiêu & Bất Tử tùy ý</li>
              <li>✓ Bảng đo lường sát thương & kỷ lục chuỗi Combo</li>
            </ul>
            <button id="btn-modal-start-free" class="btn btn-primary mode-start-btn">
              VÀO LUYỆN TỰ DO ⚡
            </button>
          </div>

          <!-- Chế độ 2: 7 Bài Khảo Hạch Võ Thuật -->
          <div class="training-mode-pick-card drill-pick">
            <div class="mode-pick-header">
              <span class="mode-pill-badge cyan">🥋 7 BÀI TẬP</span>
              <span class="mode-pick-icon">🥋</span>
            </div>
            <h3 class="mode-pick-title">7 BÀI KHẢO HẠCH VÕ THUẬT</h3>
            <p class="mode-pick-desc">Rèn luyện chuyên sâu 7 kỹ năng võ thuật chuẩn mực: Quyền cước, Né hoàn hảo, Phản đòn tay/chân [U+J / U+K], Combo, Tuyệt kỹ nộ và Triệu hồi viện trợ.</p>
            <div class="modal-drill-select-box">
              <label for="modal-drill-select">CHỌN BÀI TẬP BẮT ĐẦU:</label>
              <select id="modal-drill-select" class="training-select">
                ${this.drills.map((d, i) => `
                  <option value="${i}" ${i === this.currentDrillIndex ? 'selected' : ''}>
                    ${d.title}
                  </option>
                `).join('')}
              </select>
            </div>
            <button id="btn-modal-start-drill" class="btn btn-secondary mode-start-btn">
              BẮT ĐẦU KHẢO HẠCH 🥋
            </button>
          </div>
        </div>

        <div class="modal-actions" style="margin-top: 14px; justify-content: flex-end;">
          <button id="btn-close-training-modal-btn" class="btn btn-ghost btn-sm">ĐÓNG [ESC]</button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');

    // Sự kiện chọn võ sĩ trong bảng 7 cao thủ
    const charCards = (typeof modal.querySelectorAll === 'function') ? modal.querySelectorAll('.t-char-pick-card') : [];
    charCards.forEach(card => {
      card.addEventListener('click', () => {
        const charId = card.getAttribute('data-char-id');
        if (!charId) return;
        this.selectedTrainingChar = charId;
        if (window.saveManager) {
          window.saveManager.data.selectedCharacter = charId;
          window.saveManager.persist();
        }
        charCards.forEach(c => {
          c.classList.remove('selected');
          const st = c.querySelector('.t-char-card-status');
          if (st) st.innerHTML = '<span class="status-idle">CHỌN VÕ SĨ</span>';
        });
        card.classList.add('selected');
        const st = card.querySelector('.t-char-card-status');
        if (st) st.innerHTML = '<span class="status-active">✓ ĐANG CHỌN</span>';
        if (window.audioManager) {
          if (typeof window.audioManager.playSkill === 'function') window.audioManager.playSkill();
        }
      });
    });

    const closeModal = () => {
      modal.classList.add('hidden');
    };

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
    const activeHero = window.TRAINING_CHARACTERS.find(c => c.id === curChar) || window.TRAINING_CHARACTERS[0];

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
              ${window.TRAINING_CHARACTERS.map(c => `
                <button class="quick-char-pill ${c.id === curChar ? 'active' : ''}" data-char-id="${c.id}" style="--pill-color: ${c.color};" title="${c.name} — ${c.title}&#10;${c.desc}">
                  <span class="pill-icon">${c.icon}</span>
                  <span class="pill-name">${c.name.split(' ').slice(-1)[0]}</span>
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
              ${window.TRAINING_CHARACTERS.map(c => `
                <button class="quick-char-pill ${c.id === curChar ? 'active' : ''}" data-char-id="${c.id}" style="--pill-color: ${c.color};" title="${c.name} — ${c.title}&#10;${c.desc}">
                  <span class="pill-icon">${c.icon}</span>
                  <span class="pill-name">${c.name.split(' ').slice(-1)[0]}</span>
                </button>
              `).join('')}
            </div>
            <select id="training-player-char" style="display:none;" aria-hidden="true">
              ${window.TRAINING_CHARACTERS.map(c => `
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
