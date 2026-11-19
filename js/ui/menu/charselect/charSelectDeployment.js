/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/ui/menu/charselect/charSelectDeployment.js
 * Màn chọn Đồng Minh Viện Trợ riêng biệt & Trình diễn hình ảnh toàn thân
 */

const ALLIES_LIST = [
  { id: 'auto', name: 'Tự Động', fullName: 'Tự Động Theo Cốt Truyện', icon: '✦', isSpecial: true, role: 'Linh Hoạt Theo Hồi', roleColor: '#38bdf8' },
  { id: 'bichlam', name: 'Bích Lâm', fullName: 'Đình Bích Lâm (Mãnh Tướng Bến Cảng)', icon: '❖', role: 'Hồi Máu & Càn Quét', roleColor: '#10b981', image: 'assets/images/characters/char_bichlam.png' },
  { id: 'hoanganh', name: 'Hoàng Anh', fullName: 'Phó Đặng Hoàng Anh (Thần Cước Trấn Sơn)', icon: '◈', role: 'Siêu Tanker & Phá Giáp', roleColor: '#f59e0b', image: 'assets/images/characters/char_hoanganh.png' },
  { id: 'dunghai', name: 'Dung Hải', fullName: 'Phó Dung Hải (Song Đao Sát Thủ)', icon: '⚔', role: 'Sát Thương & Xuất Huyết', roleColor: '#f43f5e', image: 'assets/images/characters/char_dunghai.png' },
  { id: 'dinhan', name: 'Đình An', fullName: 'Triệu Đình An (Cận Vệ Thiết Bích)', icon: '🛡', role: 'Khiên Kim Cương & Taunt', roleColor: '#d97706', image: 'assets/images/characters/char_dinhan.png' },
  { id: 'huavudai', name: 'Hứa Vũ Đại', fullName: 'Hứa Vũ Đại (Ông Trùm Mạng Lưới)', icon: '⚜', role: 'Chiến Thuật & Bom Khói', roleColor: '#a855f7', image: 'assets/images/characters/char_huavudai.png' },
  { id: 'giangmanh', name: 'Giang Mạnh', fullName: 'Ngô Giang Mạnh (Chủ Gia Tộc Họ Ngô)', icon: '❄', role: 'Phản Đòn & Băng Tê Liệt', roleColor: '#38bdf8', image: 'assets/images/characters/char_giangmanh.png' },
  { id: 'mocdang', name: 'Mộc Đăng', fullName: 'Phó Mộc Đăng (Kiến Trúc Sư Hack EMP)', icon: '⚡', isSpecial: true, role: 'Khống Chế & Tê Liệt', roleColor: '#00d2ff', image: 'assets/images/characters/char_mocdang.png' },
  { id: 'none', name: 'Độc Hành', fullName: 'Chiến Đấu Độc Hành (Không Trợ Lực)', icon: '✵', isSpecial: true, role: 'Thử Thách Bản Lĩnh', roleColor: '#c084fc' }
];

class MenuManagerCharSelectDeployment extends window.MenuManagerCharSelectDemo {
  constructor() {
    super();
    this.selectedAlly = 'auto';
    this._allyEventsInited = false;
  }

  getAlliesCatalog() {
    return ALLIES_LIST;
  }

  // --------------------------------------------------------------------------
  // XÁC NHẬN CHỌN NHÂN VẬT -> CHUYỂN SANG MÀN CHỌN ĐỒNG MINH RIÊNG BIỆT
  // --------------------------------------------------------------------------
  startSelected() {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar);
    if (!slot || slot.isLocked) {
      this.showToast('NHÂN VẬT CHƯA SẴN SÀNG!');
      return;
    }

    // Kiểm tra tính hợp lệ của trang phục đang chọn
    if (window.saveManager && typeof window.saveManager.getEquippedSkin === 'function' && typeof window.saveManager.isSkinUnlocked === 'function') {
      const eqSkin = window.saveManager.getEquippedSkin(slot.id);
      if (eqSkin && eqSkin !== 'default' && eqSkin !== 'vovinam' && !window.saveManager.isSkinUnlocked(slot.id, eqSkin)) {
        window.saveManager.setSkinEquipped(slot.id, 'default');
        this.showToast('Trang phục chưa sở hữu đã được tự động chuyển về Mặc Định!');
      }
    }

    // Chế độ Luyện Võ (Võ Đường) -> Trực tiếp xuất chiến vào Võ Đường ngay lập tức
    if (this.isTrainingMode || this.deploymentTargetStage === 'training') {
      this.click();
      if (this.charModal) this.charModal.classList.add('hidden');
      if (window.uiManager) window.uiManager.hideTitleScreen();
      if (window.trainingManager) {
        window.trainingManager.startTraining('free', 0, this.selectedChar);
      }
      return;
    }
    if (!this.isUnlocked(slot.id)) {
      if (slot.shopUnlock && typeof this.showShop === 'function') {
        this.click();
        this._shopReturnTarget = 'char-select';
        if (this.charModal) this.charModal.classList.add('hidden');
        this.showShop(slot.id);
        return;
      }
      const orig = (window.CHARACTERS || {})[slot.id];
      this.showToast('CHƯA MỞ KHÓA: ' + (orig ? this.lockText(orig) : 'Cần vượt màn chơi'));
      return;
    }
    if (window.saveManager) {
      window.saveManager.data.selectedCharacter = this.selectedChar;
      window.saveManager.persist();
    }
    this.click();

    // Chuyển sang màn chọn Đồng Minh riêng biệt (Step 2)
    this.openAllySelect();
  }

  // --------------------------------------------------------------------------
  // MÀN CHỌN ĐỒNG MINH CHI VIỆN (STEP 2 DEDICATED SCREEN)
  // --------------------------------------------------------------------------
  openAllySelect() {
    const allyModal = document.getElementById('ally-select-modal');
    if (!allyModal) return;

    // Ẩn màn chọn nhân vật, mở màn chọn đồng minh
    const csModal = document.getElementById('char-select-modal');
    if (csModal) csModal.classList.add('hidden');
    allyModal.classList.remove('hidden');

    // Cập nhật số lượng đồng minh trong tab
    const rosterCount = document.getElementById('ally-roster-count');
    if (rosterCount) {
      rosterCount.textContent = String(ALLIES_LIST.length);
    }

    // Cập nhật thông tin Võ sĩ xuất trận đã chọn ở Top Bar
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    const heroAvatar = document.getElementById('ally-selected-hero-avatar');
    const heroName = document.getElementById('ally-selected-hero-name');
    const heroStage = document.getElementById('ally-selected-hero-stage');
    
    if (heroName) heroName.textContent = slot.fullName || slot.slotName;
    if (heroAvatar) {
      const eqSkin = (window.saveManager && typeof window.saveManager.getEquippedSkin === 'function')
        ? window.saveManager.getEquippedSkin(slot.id)
        : ((window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(slot.id, 'vovinam')) ? 'vovinam' : 'default');
      heroAvatar.src = typeof this.resolveHeroSkinImage === 'function'
        ? this.resolveHeroSkinImage(slot, eqSkin)
        : ((eqSkin === 'vovinam' && slot.vovinamImage) ? slot.vovinamImage : (slot.image || ''));
    }
    if (heroStage) {
      if (this.isCampaignMode) {
        const stageNum = this.deploymentTargetStage || 1;
        const meta = (window.STORY_META && window.STORY_META.stages) ? window.STORY_META.stages[stageNum] : null;
        heroStage.textContent = meta ? meta.title : `MÀN ${stageNum}`;
      } else {
        heroStage.textContent = 'THIẾT LẬP VÕ ĐƯỜNG';
      }
    }

    // Nút xác nhận xuất trận
    const confirmText = document.getElementById('ally-confirm-text');
    if (confirmText) {
      confirmText.textContent = this.isCampaignMode ? 'XUẤT TRẬN CHIẾN ĐẤU ⚔️' : 'LƯU ĐỘI HÌNH & XONG ✔';
    }

    // Gán sự kiện phím & nút
    this.initAllySelectEvents();

    // Lấy đồng minh hiện tại: nếu đang chọn trùng với võ sĩ xuất trận -> tự động reset về 'auto'
    let currentSelected = (window.saveManager && window.saveManager.data && window.saveManager.data.selectedAlly) 
      || (window.allyManager && window.allyManager.selectedAllyId) 
      || 'auto';

    if (currentSelected === this.selectedChar) {
      currentSelected = 'auto';
      if (window.saveManager) window.saveManager.setSelectedAlly('auto');
      if (window.allyManager) window.allyManager.selectedAllyId = 'auto';
    }

    this.selectAlly(currentSelected, false);
  }

  initAllySelectEvents() {
    if (this._allyEventsInited) return;
    this._allyEventsInited = true;

    const btnBack = document.getElementById('btn-ally-back');
    if (btnBack) {
      btnBack.addEventListener('click', () => this.backToCharSelect());
    }

    const btnCloseX = document.getElementById('btn-ally-close-x');
    if (btnCloseX) {
      btnCloseX.addEventListener('click', () => this.backToCharSelect());
    }

    const btnConfirm = document.getElementById('btn-ally-confirm');
    if (btnConfirm) {
      btnConfirm.addEventListener('click', () => this.confirmAllyAndStart());
    }

    const btnPrev = document.getElementById('btn-ally-prev');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => this.cycleAlly(-1));
    }

    const btnNext = document.getElementById('btn-ally-next');
    if (btnNext) {
      btnNext.addEventListener('click', () => this.cycleAlly(1));
    }

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', (e) => {
        const activeEl = e.target || (typeof document !== 'undefined' ? document.activeElement : null);
        if (activeEl) {
          const tag = String(activeEl.tagName || '').toUpperCase();
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || activeEl.isContentEditable) return;
        }
        const allyModal = document.getElementById('ally-select-modal');
        if (!allyModal || (allyModal.classList && allyModal.classList.contains('hidden'))) return;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          this.cycleAlly(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          this.cycleAlly(1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.confirmAllyAndStart();
        } else if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault();
          this.backToCharSelect();
        }
      });
    }
  }

  cycleAlly(direction) {
    if (!ALLIES_LIST || ALLIES_LIST.length === 0) return;
    const curIdx = ALLIES_LIST.findIndex(a => a.id === this.selectedAlly);
    let nextIdx = (curIdx === -1) ? 0 : curIdx;
    for (let i = 0; i < ALLIES_LIST.length; i++) {
      nextIdx = (nextIdx + direction + ALLIES_LIST.length) % ALLIES_LIST.length;
      const candidate = ALLIES_LIST[nextIdx];
      const isHeroActive = (candidate.id === this.selectedChar);
      const isUnlocked = candidate.isSpecial || (window.saveManager ? window.saveManager.isAllyUnlocked(candidate.id) : true);
      if (!isHeroActive && isUnlocked) {
        this.selectAlly(candidate.id, true);
        break;
      }
    }
  }

  selectAlly(allyId, playSfx = true) {
    if (playSfx) this.click();
    this.selectedAlly = allyId;

    if (window.saveManager) {
      window.saveManager.setSelectedAlly(allyId);
    }
    if (window.allyManager) {
      window.allyManager.selectedAllyId = allyId;
      if (typeof window.allyManager.updateHUD === 'function') {
        window.allyManager.updateHUD();
      }
    }

    // Render danh sách dock pills & Support grid trong Võ Đường
    this.renderAllyDockPills(allyId);
    this.renderCsSupportGrid(allyId);

    // Render Showcase hình ảnh toàn thân & Card chi tiết kỹ năng
    this.renderAllyShowcaseAndDossier(allyId);

    // Đồng bộ badge xem trước đội hình & thanh tổng kết Loadout
    if (typeof this.updateSupportCompanionPreview === 'function') {
      this.updateSupportCompanionPreview();
    }
    if (typeof this.updateLoadoutSummaryBar === 'function') {
      this.updateLoadoutSummaryBar();
    }
    const heroComboEl = document.getElementById('ally-combo-hero-label');
    const suppComboEl = document.getElementById('ally-combo-support-label');
    const slot = (window.CHAR_SLOTS || []).find((s) => s.id === this.selectedChar);
    const allyObj = ALLIES_LIST.find((a) => a.id === allyId) || ALLIES_LIST[0];
    if (heroComboEl && slot) heroComboEl.textContent = slot.slotName || slot.fullName;
    if (suppComboEl && allyObj) suppComboEl.textContent = allyObj.name;
  }

  renderCsSupportGrid(currentAllyId = null) {
    const grid = document.getElementById('cs-support-grid');
    if (!grid) return;
    const countBadge = document.getElementById('cs-tab-support-count');
    if (countBadge) countBadge.textContent = String(ALLIES_LIST.length);

    const activeId = currentAllyId || this.selectedAlly || (window.saveManager && window.saveManager.data && window.saveManager.data.selectedAlly) || 'auto';
    grid.innerHTML = '';
    if (Array.isArray(grid.children)) grid.children.length = 0;

    ALLIES_LIST.forEach((a) => {
      const isHeroActive = (a.id === this.selectedChar);
      const isUnlocked = a.isSpecial || (window.saveManager ? window.saveManager.isAllyUnlocked(a.id) : true);
      const isSelected = (a.id === activeId);

      const card = document.createElement('button');
      card.type = 'button';
      if (!card.dataset) card.dataset = {};
      card.dataset.allyId = a.id;
      card.className = 'cs-card ally-dock-card cs-support-card' +
        (a.id === 'auto' ? ' ally-card-auto' : '') +
        (a.id === 'none' ? ' ally-card-solo' : '') +
        (isSelected ? ' selected active' : '') +
        (isUnlocked ? '' : ' locked') +
        (isHeroActive ? ' hero-busy locked' : '');

      const profile = (window.ALLY_PROFILES && window.ALLY_PROFILES[a.id]) || null;
      const skillHint = (profile && profile.activeSkill && profile.activeSkill.name)
        ? `[H] ${profile.activeSkill.name}`
        : a.role;

      if (a.id === 'auto') {
        card.innerHTML = `
          <div class="cs-card-thumb-wrap ally-dock-avatar-wrap ally-auto-thumb">
            <span class="ally-auto-icon">⭐</span>
          </div>
          <div class="cs-card-banner ally-auto-banner">
            <span class="cs-card-name ally-auto-title">TỰ ĐỘNG THEO TRUYỆN</span>
            <span class="ally-auto-desc">Linh hoạt từng hồi • Khuyên dùng</span>
          </div>
          <span class="cs-card-element ally-dock-role ally-auto-tag">⭐ AUTO</span>`;
      } else {
        card.innerHTML = `
          <div class="cs-card-thumb-wrap ally-dock-avatar-wrap">
            ${a.image ? `<img class="cs-card-img ally-dock-avatar-img" src="${a.image}" alt="${a.name}">` : `<span class="ally-special-thumb-icon ally-dock-avatar-icon">${a.icon}</span>`}
            ${(!isUnlocked && !isHeroActive) ? '<div class="cs-card-lock-icon"><span>🔒</span></div>' : ''}
            ${isHeroActive ? '<div class="cs-card-busy-badge"><span class="cs-card-busy-icon">⚔️</span><span class="cs-card-busy-text">XUẤT TRẬN</span></div>' : ''}
          </div>
          <div class="cs-card-banner">
            <span class="cs-card-name ally-dock-name">${a.name}</span>
          </div>
          <span class="cs-card-element ally-dock-role" style="color:${a.roleColor || '#38bdf8'}" title="${skillHint}">${a.icon || '🤝'}</span>`;
      }

      card.addEventListener('click', () => {
        if (isHeroActive) {
          this.showToast('Nhân vật đang là Võ Sĩ Chính, hãy chọn đồng minh khác làm Trợ Chiến!');
          return;
        }
        if (!isUnlocked) {
          this.showToast('ĐỒNG MINH CHƯA MỞ KHÓA — Vượt thêm cốt truyện để kết giao!');
          return;
        }
        this.selectAlly(a.id, true);
        this.showToast(`🤝 Đã chọn Trợ Chiến: ${a.fullName}`);
      });

      grid.appendChild(card);
    });
  }

  renderAllyDockPills(currentAllyId) {
    const dockContainer = document.getElementById('ally-dock-pills');
    if (!dockContainer) return;
    dockContainer.innerHTML = '';

    ALLIES_LIST.forEach(a => {
      const isHeroActive = (a.id === this.selectedChar);
      const isUnlocked = a.isSpecial || (window.saveManager ? window.saveManager.isAllyUnlocked(a.id) : true);
      const isSelected = (a.id === currentAllyId);

      const card = document.createElement('button');
      card.type = 'button';
      if (!card.dataset) card.dataset = {};
      card.dataset.allyId = a.id;
      if (card.setAttribute) card.setAttribute('data-ally-id', a.id);
      card.className = 'cs-card ally-dock-card' +
        (a.id === 'auto' ? ' ally-card-auto' : '') +
        (a.id === 'none' ? ' ally-card-solo' : '') +
        (isSelected ? ' selected active' : '') +
        (isUnlocked ? '' : ' locked') +
        (isHeroActive ? ' hero-busy locked' : '');
      if (card.setAttribute) card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

      if (isHeroActive) {
        card.title = `${a.fullName} — Đang là Võ sĩ Xuất trận chính (Không thể tự chi viện)`;
      } else if (isUnlocked) {
        card.title = `${a.fullName} — ${a.role}`;
      } else {
        card.title = `${a.fullName} — Chưa kết giao`;
      }

      if (a.id === 'auto') {
        // Thumbnail icon for Auto (span 2 banner card)
        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'cs-card-thumb-wrap ally-dock-avatar-wrap ally-auto-thumb';
        thumbWrap.innerHTML = '<span class="ally-auto-icon">⭐</span>';
        card.appendChild(thumbWrap);

        // Banner info for Auto
        const banner = document.createElement('div');
        banner.className = 'cs-card-banner ally-auto-banner';
        banner.innerHTML = `
          <span class="cs-card-name ally-auto-title">TỰ ĐỘNG THEO TRUYỆN</span>
          <span class="ally-auto-desc">Linh hoạt theo từng hồi</span>
        `;
        card.appendChild(banner);

        // Role/Recommended tag for Auto
        const elemBadge = document.createElement('span');
        elemBadge.className = 'cs-card-element ally-dock-role ally-auto-tag';
        elemBadge.textContent = '⭐ KHUYÊN DÙNG';
        elemBadge.title = 'Tự động theo cốt truyện';
        card.appendChild(elemBadge);
      } else if (a.id === 'none') {
        // Thumbnail for Solo (slot 8)
        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'cs-card-thumb-wrap ally-dock-avatar-wrap';
        thumbWrap.innerHTML = `
          <div class="ally-solo-thumb-art">
            <div class="ally-solo-glow-ring"></div>
            <div class="ally-solo-icon-wrap">
              <span class="ally-solo-icon">⚔️</span>
            </div>
            <span class="ally-solo-tag">TỰ LỰC CÁNH SINH</span>
          </div>
        `;
        card.appendChild(thumbWrap);

        const banner = document.createElement('div');
        banner.className = 'cs-card-banner';
        banner.innerHTML = `<span class="cs-card-name ally-dock-name" style="color: #d8b4fe;">ĐỘC HÀNH</span>`;
        card.appendChild(banner);

        const elemBadge = document.createElement('span');
        elemBadge.className = 'cs-card-element ally-dock-role';
        elemBadge.textContent = '🥋';
        elemBadge.style.color = '#c084fc';
        elemBadge.title = 'Chiến đấu độc hành không trợ lực';
        card.appendChild(elemBadge);
      } else {
        // Character Ally Card (Chân dung thẳng đứng 2x4 chuẩn cs-card)
        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'cs-card-thumb-wrap ally-dock-avatar-wrap';

        if (a.image) {
          const img = document.createElement('img');
          img.className = 'cs-card-img ally-dock-avatar-img';
          img.src = a.image;
          img.alt = a.name;
          thumbWrap.appendChild(img);
        } else {
          const iconSpan = document.createElement('span');
          iconSpan.className = 'ally-special-thumb-icon ally-dock-avatar-icon';
          iconSpan.textContent = a.icon;
          thumbWrap.appendChild(iconSpan);
        }

        if (!isUnlocked && !isHeroActive) {
          const lockWrap = document.createElement('div');
          lockWrap.className = 'cs-card-lock-icon';
          lockWrap.innerHTML = '<span>🔒</span>';
          thumbWrap.appendChild(lockWrap);
        }

        if (isHeroActive) {
          const busyWrap = document.createElement('div');
          busyWrap.className = 'cs-card-busy-badge';
          busyWrap.innerHTML = '<span class="cs-card-busy-icon">⚔️</span><span class="cs-card-busy-text">ĐANG XUẤT TRẬN</span>';
          thumbWrap.appendChild(busyWrap);
        }

        card.appendChild(thumbWrap);

        const banner = document.createElement('div');
        banner.className = 'cs-card-banner';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'cs-card-name ally-dock-name';
        nameSpan.textContent = a.name;
        banner.appendChild(nameSpan);
        card.appendChild(banner);

        const elemBadge = document.createElement('span');
        elemBadge.className = 'cs-card-element ally-dock-role';
        elemBadge.textContent = a.icon || '⚔️';
        elemBadge.style.color = isHeroActive ? '#f59e0b' : (a.roleColor || '#38bdf8');
        elemBadge.title = isHeroActive ? 'Đang là Võ sĩ Xuất trận chính' : (isUnlocked ? a.role : 'Chưa kết giao');
        card.appendChild(elemBadge);
      }

      card.addEventListener('click', () => {
        if (isHeroActive) {
          this.showToast('Nhân vật đang là Võ Sĩ Xuất Trận chính, không thể chọn làm Đồng Minh chi viện!');
          return;
        }
        if (!isUnlocked) {
          this.showToast('ĐỒNG MINH CHƯA KẾT GIAO — Vượt thêm cốt truyện để mở khóa!');
          return;
        }
        this.selectAlly(a.id, true);
      });

      dockContainer.appendChild(card);
    });
  }

    renderAllyShowcaseAndDossier(allyId) {
    const showcaseImg = document.getElementById('ally-showcase-img');
    const specialCard = document.getElementById('ally-special-card');
    const roleTag = document.getElementById('ally-stage-role-tag');
    const nameTag = document.getElementById('ally-stage-name-tag');
    const ambientGlow = document.getElementById('ally-ambient-glow');

    // Right column dossier elements
    const dossierRoleBadge = document.getElementById('ally-dossier-role-badge');
    const dossierStatusBadge = document.getElementById('ally-dossier-status-badge');
    const dossierName = document.getElementById('ally-dossier-name');
    const dossierTitle = document.getElementById('ally-dossier-title');
    const statHp = document.getElementById('ally-stat-hp');
    const statDmg = document.getElementById('ally-stat-dmg');
    const statSpd = document.getElementById('ally-stat-spd');

    const skillName = document.getElementById('ally-skill-name');
    const skillCd = document.getElementById('ally-skill-cd');
    const skillDesc = document.getElementById('ally-skill-desc');

    const auraName = document.getElementById('ally-aura-name');
    const auraDesc = document.getElementById('ally-aura-desc');

    const coopName = document.getElementById('ally-coop-name');
    const coopDesc = document.getElementById('ally-coop-desc');

    const quoteText = document.getElementById('ally-quote-text');
    const quoteAttr = document.getElementById('ally-quote-attr');

    const allyObj = ALLIES_LIST.find(a => a.id === allyId) || ALLIES_LIST[0];
    const profile = (window.ALLY_PROFILES && window.ALLY_PROFILES[allyId]) || null;

    if (allyId === 'auto') {
      if (showcaseImg) showcaseImg.classList.add('hidden');
      if (specialCard) {
        specialCard.classList.remove('hidden');
        const icon = document.getElementById('ally-special-icon');
        const title = document.getElementById('ally-special-title');
        const desc = document.getElementById('ally-special-desc');
        if (icon) icon.textContent = '⭐';
        if (title) title.textContent = 'TỰ ĐỘNG THEO CỐT TRUYỆN';
        if (desc) desc.textContent = 'Hệ thống tự động kích hoạt đồng minh gắn liền với từng hồi (Màn 1: Đình Bích Lâm, Màn 2: Phó Mộc Đăng, Màn 3: Phó Dung Hải, Màn 4: Hoàng Anh, Màn 5: Đình An).';
      }
      if (roleTag) { roleTag.textContent = 'LINH HOẠT'; roleTag.style.background = '#38bdf8'; roleTag.style.borderColor = '#38bdf8'; }
      if (nameTag) nameTag.textContent = 'TỰ ĐỘNG THEO TRUYỆN';
      if (ambientGlow) ambientGlow.style.background = 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, transparent 70%)';

      if (dossierRoleBadge) { dossierRoleBadge.textContent = 'TỰ ĐỘNG'; dossierRoleBadge.style.background = '#38bdf8'; }
      if (dossierStatusBadge) { dossierStatusBadge.textContent = 'CỐT TRUYỆN'; dossierStatusBadge.className = 'ally-status-badge unlocked'; }
      if (dossierName) dossierName.textContent = 'TỰ ĐỘNG CHI VIỆN';
      if (dossierTitle) dossierTitle.textContent = 'THEO DIỄN BIẾN GIA TỘC';

      if (statHp) statHp.textContent = '❤️ THEO HỒI';
      if (statDmg) statDmg.textContent = '⚡ THEO HỒI';
      if (statSpd) statSpd.textContent = '🏃 THEO HỒI';

      if (skillName) skillName.textContent = 'Chiêu Thức Theo Từng Hồi';
      if (skillCd) skillCd.textContent = '⏱️ 2.0s - 3.5s';
      if (skillDesc) skillDesc.textContent = 'Mỗi hồi truyện sẽ có đồng minh tương ứng xuất chiến hỗ trợ kịp thời.';

      if (auraName) auraName.textContent = 'Hào Quang Đa Dạng';
      if (auraDesc) auraDesc.textContent = 'Kích hoạt hào quang tăng tốc, giảm sát thương, siêu giáp tùy theo đồng minh từng chương.';

      if (coopName) coopName.textContent = 'Song Sát Gia Tộc';
      if (coopDesc) coopDesc.textContent = 'Kích hoạt hợp kích đặc trưng của đồng minh từng chương khi đứng gần nhau.';

      if (quoteText) quoteText.textContent = 'Đồng minh nào cũng có lý do để chiến đấu. Cứ để cốt truyện chọn hộ.';
      if (quoteAttr) quoteAttr.textContent = '— GIA TỘC VOVINAM';
      return;
    }

    if (allyId === 'none') {
      if (showcaseImg) showcaseImg.classList.add('hidden');
      if (specialCard) {
        specialCard.classList.remove('hidden');
        const icon = document.getElementById('ally-special-icon');
        const title = document.getElementById('ally-special-title');
        const desc = document.getElementById('ally-special-desc');
        if (icon) icon.textContent = '👤';
        if (title) title.textContent = 'ĐỘC HÀNH TÁC CHIẾN';
        if (desc) desc.textContent = 'Bạn sẽ không nhận bất kỳ viện trợ nào trên chiến trường. Thử thách bản lĩnh võ đạo tuyệt đỉnh của bản thân!';
      }
      if (roleTag) { roleTag.textContent = 'ĐỘC HÀNH'; roleTag.style.background = '#64748b'; roleTag.style.borderColor = '#64748b'; }
      if (nameTag) nameTag.textContent = 'KHÔNG VIỆN TRỢ';
      if (ambientGlow) ambientGlow.style.background = 'radial-gradient(circle, rgba(100, 116, 139, 0.3) 0%, transparent 70%)';

      if (dossierRoleBadge) { dossierRoleBadge.textContent = 'SOLO'; dossierRoleBadge.style.background = '#64748b'; }
      if (dossierStatusBadge) { dossierStatusBadge.textContent = 'THỬ THÁCH'; dossierStatusBadge.className = 'ally-status-badge unlocked'; }
      if (dossierName) dossierName.textContent = 'ĐỘC THÂN CHIẾN ĐẤU';
      if (dossierTitle) dossierTitle.textContent = 'BẢN LĨNH VOVINAM TUYỆT ĐỐI';

      if (statHp) statHp.textContent = '❤️ 0 HP';
      if (statDmg) statDmg.textContent = '⚡ 0 DMG';
      if (statSpd) statSpd.textContent = '🏃 0 SPD';

      if (skillName) skillName.textContent = 'Không Có Viện Trợ';
      if (skillCd) skillCd.textContent = 'VÔ HIỆU';
      if (skillDesc) skillDesc.textContent = 'Phím [H] sẽ không thể gọi viện trợ. Toàn bộ phụ thuộc vào kỹ năng cá nhân.';

      if (auraName) auraName.textContent = 'Khí Phách Độc Hành';
      if (auraDesc) auraDesc.textContent = 'Không có hào quang hỗ trợ.';

      if (coopName) coopName.textContent = 'Không Có Co-op';
      if (coopDesc) coopDesc.textContent = 'Không có chiêu phối hợp.';

      if (quoteText) quoteText.textContent = 'Không đồng minh, không viện trợ. Chỉ có ta và con đường phía trước.';
      if (quoteAttr) quoteAttr.textContent = '— KẺ ĐỘC HÀNH';
      return;
    }

    // Với 6 đồng minh có profile và hình ảnh thực tế ("vẽ luôn ảnh đồng minh ra")
    if (specialCard) specialCard.classList.add('hidden');
    if (showcaseImg) {
      showcaseImg.classList.remove('hidden');
      if (allyObj.image) showcaseImg.src = allyObj.image;
    }

    const roleColor = (profile && profile.roleColor) || allyObj.roleColor || '#10b981';
    if (roleTag) {
      roleTag.textContent = (profile && profile.role) || allyObj.role;
      roleTag.style.background = roleColor;
      roleTag.style.borderColor = roleColor;
    }
    if (nameTag) nameTag.textContent = (profile && profile.name) || allyObj.name;
    if (ambientGlow) {
      ambientGlow.style.background = `radial-gradient(circle, ${roleColor}55 0%, transparent 70%)`;
    }

    if (dossierRoleBadge) {
      dossierRoleBadge.textContent = (profile && profile.role) || allyObj.role;
      dossierRoleBadge.style.background = roleColor;
    }
    if (dossierStatusBadge) {
      dossierStatusBadge.textContent = 'ĐÃ KẾT GIAO';
      dossierStatusBadge.className = 'ally-status-badge unlocked';
    }
    if (dossierName) dossierName.textContent = (profile && profile.name) || allyObj.name;
    if (dossierTitle) dossierTitle.textContent = (profile && profile.title) || allyObj.title;

    if (statHp) statHp.textContent = `❤️ ${(profile && profile.hp) || 1200} HP`;
    if (statDmg) statDmg.textContent = `⚡ ${(profile && profile.dmg) || 85} DMG`;
    if (statSpd) statSpd.textContent = `🏃 ${(profile && profile.speed) || 190} SPD`;

    if (profile) {
      if (skillName) skillName.textContent = profile.activeSkill.name;
      if (skillCd) skillCd.textContent = `⏱️ ${profile.activeSkill.cd}`;
      if (skillDesc) skillDesc.textContent = profile.activeSkill.desc;

      if (auraName) auraName.textContent = profile.passiveAura.name;
      if (auraDesc) auraDesc.textContent = profile.passiveAura.desc;

      if (coopName) coopName.textContent = profile.coopSkill.name;
      if (coopDesc) coopDesc.textContent = profile.coopSkill.desc;
    }

    if (quoteText) {
      quoteText.textContent = (profile && profile.quote) || 'Đồng hành cùng gia tộc, giữ trọn nghĩa tình Vovinam.';
    }
    if (quoteAttr) {
      quoteAttr.textContent = `— ${((profile && profile.name) || allyObj.name).toUpperCase()}`;
    }
  }

  confirmAllyAndStart() {
    this.click();
    let allyId = this.selectedAlly || 'auto';
    if (allyId === this.selectedChar) {
      allyId = 'auto';
      this.selectedAlly = 'auto';
    }
    if (window.saveManager) {
      window.saveManager.data.selectedCharacter = this.selectedChar;
      window.saveManager.setSelectedAlly(allyId);
      window.saveManager.persist();
    }
    if (window.allyManager) {
      window.allyManager.selectedAllyId = allyId;
      if (typeof window.allyManager.updateHUD === 'function') {
        window.allyManager.updateHUD();
      }
    }

    const allyModal = document.getElementById('ally-select-modal');
    if (allyModal) allyModal.classList.add('hidden');

    if (this.isCampaignMode) {
      this.hideAll(true);
      const stageToStart = Number(this.deploymentTargetStage || (window.saveManager && window.saveManager.data.currentStage) || 1);
      if (stageToStart === 1 && window.tutorialManager && typeof window.tutorialManager.isTutorialNeeded === 'function' && window.tutorialManager.isTutorialNeeded()) {
        window.tutorialManager.showInviteModal(
          () => {
            if (window.uiManager) window.uiManager.hideTitleScreen();
            window.tutorialManager.startTutorial();
          },
          () => {
            if (window.saveManager) window.saveManager.skipTutorial();
            if (window.uiManager) window.uiManager.hideTitleScreen();
            if (window.game) window.game.startStage(1);
          }
        );
        return;
      }
      if (window.game) {
        window.game.startStage(stageToStart);
      }
    } else {
      const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
      const allyObj = ALLIES_LIST.find(a => a.id === allyId) || ALLIES_LIST[0];
      this.showToast(`Đã lưu thiết lập đội hình: ${slot.fullName || slot.slotName} + ${allyObj.name}!`);
      this.hideAll();
      if (typeof this.updateMenuPlayerBar === 'function') {
        this.updateMenuPlayerBar();
      }
      if (window.uiManager) window.uiManager.showTitleScreen();
    }
  }

  backToCharSelect() {
    this.click();
    const allyModal = document.getElementById('ally-select-modal');
    if (allyModal) allyModal.classList.add('hidden');
    const csModal = document.getElementById('char-select-modal');
    if (csModal) csModal.classList.remove('hidden');
  }

  // Phương thức tương thích ngược
  refreshAllySelector() {
    const currentSelected = (window.saveManager && window.saveManager.data && window.saveManager.data.selectedAlly) 
      || (window.allyManager && window.allyManager.selectedAllyId) 
      || 'auto';
    this.selectedAlly = (currentSelected === this.selectedChar) ? 'auto' : currentSelected;
    this.renderAllyDockPills(this.selectedAlly);
    this.renderCsSupportGrid(this.selectedAlly);
    if (typeof this.updateSupportCompanionPreview === 'function') {
      this.updateSupportCompanionPreview();
    }
    if (typeof this.updateLoadoutSummaryBar === 'function') {
      this.updateLoadoutSummaryBar();
    }
  }

  renderAllyDetailCard(allyId) {
    this.renderAllyShowcaseAndDossier(allyId);
  }

  showDeploymentModal(targetStage = 1) {
    const fromChapterMap = !!(this.mapModal && !this.mapModal.classList.contains('hidden'));
    const fromCampaignHub = !!(this._returnToCampaignHub || (this.campaignModal && !this.campaignModal.classList.contains('hidden')));
    this.openCharSelect(targetStage);
    this._charSelectReturnTarget = fromChapterMap ? 'chapter-map' : (fromCampaignHub ? 'campaign-hub' : null);
    this._returnToCampaignHub = fromCampaignHub;
  }

  setDeploymentSkin(skinType) {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    if ((slot && slot.id === 'nghi' && skinType === 'vovinam') || (slot && slot.isLocked)) {
      skinType = 'default';
    }
    if (window.saveManager && typeof window.saveManager.setSkinEquipped === 'function') {
      window.saveManager.setSkinEquipped(this.selectedChar, skinType);
    }
    if (window.skeletalRenderer) window.skeletalRenderer._styles = {};
    if (window.game && window.game.player && window.game.player.charId === this.selectedChar) {
      window.game.player.setCharacter(this.selectedChar);
    }
    this.updateDeploymentSkinButtons();
    this.updateWardrobeButtons();
    this.showToast(skinType === 'vovinam'
      ? 'Đã trang bị: Võ Phục Vovinam Chính Thống 🥋'
      : 'Đã trang bị: Trang Phục Mặc Định 👘');
  }

  updateDeploymentSkinButtons() {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    const isNghi = !!(slot && slot.id === 'nghi');
    const isVovinam = !isNghi && window.saveManager &&
      typeof window.saveManager.isSkinEquipped === 'function' &&
      window.saveManager.isSkinEquipped(this.selectedChar, 'vovinam');
    const defBtn = document.getElementById('btn-deploy-skin-default');
    const vovBtn = document.getElementById('btn-deploy-skin-vovinam');
    if (!defBtn || !vovBtn) return;
    defBtn.classList.toggle('active', !isVovinam);
    vovBtn.classList.toggle('active', !!isVovinam);
    vovBtn.classList.toggle('hidden', isNghi || !slot || !!slot.isLocked);
  }

  confirmDeployment() {
    if (!window.game) return;
    if (window.saveManager) {
      window.saveManager.data.selectedCharacter = this.selectedChar;
      window.saveManager.persist();
    }
    this.hideAll();
    const stageToStart = Number(this.deploymentTargetStage || (window.saveManager && window.saveManager.data.currentStage) || 1);
    if (stageToStart === 1 && window.tutorialManager && typeof window.tutorialManager.isTutorialNeeded === 'function' && window.tutorialManager.isTutorialNeeded()) {
      window.tutorialManager.showInviteModal(
        () => {
          if (window.uiManager) window.uiManager.hideTitleScreen();
          window.tutorialManager.startTutorial();
        },
        () => {
          if (window.saveManager) window.saveManager.skipTutorial();
          if (window.uiManager) window.uiManager.hideTitleScreen();
          if (window.game) window.game.startStage(1);
        }
      );
      return;
    }
    window.game.startStage(stageToStart);
  }
}

window.MenuManagerCharSelectDeployment = MenuManagerCharSelectDeployment;
