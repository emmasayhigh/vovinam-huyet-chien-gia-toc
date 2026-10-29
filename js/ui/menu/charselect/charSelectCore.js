/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/menu/charselect/charSelectCore.js - Chon nhan vat, skin, chi tiet, chapter map.
 */

class MenuManagerCharSelectCore extends window.MenuManagerBase {
  playableList() {
    return Object.values(window.CHARACTERS || {}).filter((c) => c.playable);
  }

  isUnlocked(id) {
    if (id === 'nghi') return true;
    if (id === 'coming_soon') return false;
    return window.saveManager ? window.saveManager.isCharacterUnlocked(id) : false;
  }

  cycleChar(direction) {
    const curIdx = window.CHAR_SLOTS.findIndex(s => s.id === this.selectedChar);
    let nextIdx = curIdx + direction;
    if (nextIdx < 0) nextIdx = window.CHAR_SLOTS.length - 1;
    if (nextIdx >= window.CHAR_SLOTS.length) nextIdx = 0;
    this.selectedChar = window.CHAR_SLOTS[nextIdx].id;
    this.refreshCharSelect();
  }


  getStyleTypeForChar(charId) {
    const cObj = (window.CHARACTERS || {})[charId];
    if (cObj && cObj.styleType) return cObj.styleType;
    const fallback = {
      nghi: 'player',
      bichlam: 'boss_bichlam',
      huavudai: 'npc_huavudai',
      dinhan: 'boss_dinhan',
      hoanganh: 'boss_hoanganh',
      dunghai: 'boss_dunghai',
      giangmanh: 'boss_giangmanh'
    };
    return fallback[charId] || 'player';
  }

  getSkinsForChar(slot) {
    if (!slot || slot.isLocked) return [];

    // Ngô Nhất Nghị mặc định đã khoác Lam Võ Phục Vovinam nên chỉ có 1 trang phục chuẩn
    if (slot.id === 'nghi') {
      return [
        {
          id: 'default',
          name: 'Lam Võ Phục Chính Thống',
          tier: 'MẶC ĐỊNH • VIỆT VÕ ĐẠO',
          badgeClass: 'vovinam',
          image: slot.image,
          fx: ['Lam Võ Phục', 'Hoàng Đai Vovinam', 'Đòn Chân Kẹp'],
          sub: 'Võ phục Vovinam truyền thống kèm phù hiệu Việt Võ Đạo — Trang phục chuẩn của Ngô Nhất Nghị'
        }
      ];
    }

    const defaultSkinTitles = {
      bichlam: {
        name: 'Thanh Phong Thiết Quyền',
        sub: 'Võ phục lục chiến không tay kèm băng quấn cổ tay chiến thuật',
        fx: ['Lục Chiến Y', 'Thần Phong Trảo']
      },
      huavudai: {
        name: 'Âu Phục Ông Trùm',
        sub: 'Bộ vest đen thêu rồng quyền lực kết hợp trượng đầu rồng bạc',
        fx: ['Âu Phục Hắc Long', 'Thiết Trượng']
      },
      dinhan: {
        name: 'Thiết Giáp Chùy Vương',
        sub: 'Chiến giáp Phụng Hoàng, Chùy Gai Càn Quét & Khiên Hỏa Liên',
        fx: ['Chiến Giáp Đỏ', 'Chùy Gai & Khiên']
      },
      hoanganh: {
        name: 'Sơn Cước Thiết Cuốc',
        sub: 'Võ phục sơn trang dã chiến cùng Thiết Cuốc Càn Quét hạng nặng',
        fx: ['Sơn Trang Y', 'Thiết Cuốc Bạt Sơn']
      },
      dunghai: {
        name: 'Huyết Ảnh Song Đao',
        sub: 'Dạ hành phục sát thủ khăn đỏ cùng cặp Song Đoản Đao sắc bén',
        fx: ['Dạ Hành Giáp', 'Song Đoản Đao']
      },
      giangmanh: {
        name: 'Hàn Băng Kiếm Chủ',
        sub: 'Trường bào tông chủ thêu bạc cùng Hàn Băng Đao tuyệt sát',
        fx: ['Trường Bào Bạc', 'Hàn Băng Đao']
      }
    };
    const defMeta = defaultSkinTitles[slot.id] || {
      name: 'Trang Phục Mặc Định',
      sub: 'Ngoại hình và vũ khí nguyên bản theo cốt truyện',
      fx: ['Nguyên Bản']
    };
    return [
      {
        id: 'default',
        name: defMeta.name,
        tier: 'MẶC ĐỊNH',
        badgeClass: 'default',
        image: slot.image,
        fx: defMeta.fx || ['Nguyên Bản'],
        sub: defMeta.sub
      },
      {
        id: 'vovinam',
        name: 'Võ Phục Vovinam Chính Thống',
        tier: 'BẬC A • VIỆT VÕ ĐẠO',
        badgeClass: 'vovinam',
        image: slot.vovinamImage || slot.image,
        fx: ['Lam Võ Phục', 'Phù Hiệu Vovinam', 'Thế Tấn Võ Đạo'],
        sub: 'Lam Võ Phục thêu Kim Long kèm phù hiệu Vovinam — Thi triển Cương Nhu Phối Triển chuẩn Việt Võ Đạo'
      }
    ];
  }

  switchCsTab(tab) {
    this.activeCsTab = tab === 'skins' ? 'skins' : 'heroes';
    const tabHeroes = document.getElementById('btn-cs-tab-heroes');
    const tabSkins = document.getElementById('btn-cs-tab-skins');
    if (tabHeroes) tabHeroes.classList.toggle('active', this.activeCsTab === 'heroes');
    if (tabSkins) tabSkins.classList.toggle('active', this.activeCsTab === 'skins');

    if (this.charGrid) this.charGrid.classList.toggle('hidden', this.activeCsTab !== 'heroes');
    if (this.skinGrid) this.skinGrid.classList.toggle('hidden', this.activeCsTab !== 'skins');

    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    const colTitle = document.getElementById('cs-col-left-title') || document.querySelector('.cs-col-title');
    if (colTitle) {
      if (this.activeCsTab === 'skins') {
        colTitle.textContent = `TRANG PHỤC — ${slot ? slot.slotName : ''}`;
      } else {
        colTitle.textContent = this.isCampaignMode ? 'CHỌN NHÂN VẬT XUẤT TRẬN' : 'DANH SÁCH VÕ SĨ';
      }
    }
    this.renderSkinGrid();
    this.updateWardrobeButtons();
  }

  renderSkinGrid() {
    if (!this.skinGrid) return;
    this.skinGrid.innerHTML = '';
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    if (!slot) return;

    const isVovinam = slot.id !== 'nghi' && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(slot.id, 'vovinam');
    const equippedSkinId = isVovinam ? 'vovinam' : 'default';
    const skins = this.getSkinsForChar(slot);

    const skinCountBadge = document.getElementById('cs-tab-skin-count');
    if (skinCountBadge) {
      skinCountBadge.textContent = String(skins.length);
    }

    if (slot.isLocked || skins.length === 0) {
      this.skinGrid.innerHTML = `<div class="cs-skin-empty">Nhân vật này chưa mở khóa trang phục.</div>`;
      return;
    }

    skins.forEach((sk) => {
      const isSelected = equippedSkinId === sk.id;
      const card = document.createElement('div');
      card.className = 'cs-skin-card' + (isSelected ? ' selected' : '');
      const fxHtml = (sk.fx || []).map(tag => `<span class="cs-skin-fx-chip">${tag}</span>`).join('');
      card.innerHTML = `
        <div class="cs-skin-art-wrap">
          ${sk.image ? `<img class="cs-skin-card-img" src="${sk.image}" alt="${sk.name}">` : ''}
          <span class="cs-skin-tier-ribbon ${sk.badgeClass}">${sk.tier}</span>
        </div>
        <div class="cs-skin-info">
          <div>
            <div class="cs-skin-title">${sk.name}</div>
            <div class="cs-skin-desc">${sk.sub}</div>
          </div>
          ${fxHtml ? `<div class="cs-skin-fx-list">${fxHtml}</div>` : ''}
          <span class="cs-skin-status-pill">${isSelected ? '✔ ĐANG TRANG BỊ' : 'NHẤN ĐỂ TRANG BỊ'}</span>
        </div>`;

      card.addEventListener('click', () => {
        this.click();
        this._csStageDemoTimer = 0;
        this._csStageDemoState = null;
        this.setWardrobeSkin(sk.id);
      });

      this.skinGrid.appendChild(card);
    });
  }


  refreshCharSelect() {
    this.initCsParticles();
    this.initCsSkinStageCanvas();
    if (!this.charGrid) return;
    this.charGrid.innerHTML = '';

    window.CHAR_SLOTS.forEach((slot) => {
      const unlocked = this.isUnlocked(slot.id);
      const isSelected = this.selectedChar === slot.id;
      const card = document.createElement('div');
      card.className = 'cs-card' +
        (unlocked ? '' : ' locked') +
        (isSelected ? ' selected' : '');

      card.innerHTML = `
        <div class="cs-card-thumb-wrap">
          ${slot.image ? `<img class="cs-card-img" src="${slot.image}" alt="${slot.slotName}">` : `<div class="cs-card-lock-icon"><span>🔒</span></div>`}
          ${!unlocked && slot.image ? `<div class="cs-card-lock-icon"><span>🔒</span></div>` : ''}
        </div>
        <div class="cs-card-banner">
          <span class="cs-card-name">${slot.slotName}</span>
        </div>
        <span class="cs-card-element">${slot.element}</span>`;

      card.addEventListener('click', () => {
        this.click();
        this.selectedChar = slot.id;
        this._csCurrentMove = null;
        this._csActiveDemoQueue = [];
        this._csMoveTimer = 0;
        const demoBtn = document.getElementById('btn-cs-demo-move');
        if (demoBtn) {
          demoBtn.textContent = '⚡ BIỂU DIỄN ĐÒN THẾ';
          demoBtn.classList.remove('playing');
        }
        this.refreshCharSelect();
        if (slot.isLocked) {
          this.showToast('NHÂN VẬT SẮP RA MẮT!');
        } else if (!unlocked) {
          const orig = (window.CHARACTERS || {})[slot.id];
          this.showToast('CHƯA MỞ KHÓA: ' + (orig ? this.lockText(orig) : 'Cần vượt màn chơi'));
        }
      });

      this.charGrid.appendChild(card);
    });

    this.renderSkinGrid();
    this.renderCharDetail();
    this.refreshAllySelector();
  }

  lockText(c) {
    if (!c || !c.unlock) return 'CHƯA MỞ KHÓA';
    if (c.unlock.type === 'stage') return 'HOÀN THÀNH MÀN ' + c.unlock.stage;
    return c.unlock.text || 'CHƯA MỞ KHÓA';
  }

  renderCharDetail() {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    if (!slot) return;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('char-detail-name', slot.fullName || slot.slotName);
    set('char-detail-title', slot.title);
    set('char-detail-tagline', slot.tagline);
    set('char-detail-bio', slot.bio);
    set('char-detail-quote', slot.quote);
    set('char-detail-mechanic', slot.mechanic);

    // Cập nhật ảnh toàn thân theo Trang Phục đang chọn và ánh sáng hào quang trung tâm
    const isVovinam = slot.id !== 'nghi' && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(slot.id, 'vovinam');
    const targetHeroImg = (isVovinam && slot.vovinamImage) ? slot.vovinamImage : slot.image;
    const heroImg = document.getElementById('cs-hero-img');
    if (heroImg) {
      if (targetHeroImg) {
        heroImg.style.display = 'block';
        heroImg.style.opacity = '0.35';
        heroImg.src = targetHeroImg;
        heroImg.dataset.currentSrc = targetHeroImg;
        setTimeout(() => { heroImg.style.opacity = '1'; }, 60);
      } else {
        heroImg.style.display = 'none';
      }
    }
    const ambient = document.getElementById('cs-hero-ambient');
    if (ambient) {
      ambient.style.background = `radial-gradient(circle, ${slot.color}44 0%, ${slot.color}11 45%, transparent 70%)`;
    }

    // 4 Thanh chỉ số chiến đấu dạng thanh vàng óng ánh (như mockup)
    const statsContainer = document.getElementById('char-detail-stats');
    if (statsContainer) {
      statsContainer.innerHTML = '';
      const statLabels = [
        { label: 'Sức mạnh', val: slot.stats.power },
        { label: 'Tốc độ', val: slot.stats.speed },
        { label: 'Kháng cự', val: slot.stats.defense },
        { label: 'Kỹ thuật', val: slot.stats.technique }
      ];
      statLabels.forEach(st => {
        const row = document.createElement('div');
        row.className = 'cs-stat-row';
        row.innerHTML = `
          <span class="cs-stat-label">${st.label}</span>
          <div class="cs-stat-track">
            <div class="cs-stat-fill" style="width: 0%"></div>
          </div>`;
        statsContainer.appendChild(row);
        setTimeout(() => {
          const fill = row.querySelector('.cs-stat-fill');
          if (fill) fill.style.width = st.val + '%';
        }, 50);
      });
    }

    // 4 Huy hiệu Kỹ Năng Đặc Biệt
    const skillsBadges = document.getElementById('cs-skills-badges');
    if (skillsBadges && slot.skills) {
      skillsBadges.innerHTML = '';
      slot.skills.forEach(sk => {
        const b = document.createElement('div');
        b.className = 'cs-skill-badge';
        b.title = `${sk.name}: ${sk.desc}`;
        b.innerHTML = `<span class="cs-skill-ico">${sk.icon}</span>`;
        b.addEventListener('click', () => {
          this.showToast(`${sk.name}: ${sk.desc}`);
        });
        skillsBadges.appendChild(b);
      });
    }

    // Cập nhật trạng thái nút CHỌN
    const startBtn = document.getElementById('btn-char-start');
    if (startBtn) {
      const confirmText = startBtn.querySelector('.cs-confirm-text');
      const unlocked = this.isUnlocked(slot.id);
      if (slot.isLocked) {
        if (confirmText) confirmText.textContent = 'SẮP RA MẮT';
        startBtn.classList.add('disabled');
      } else if (!unlocked) {
        if (confirmText) confirmText.textContent = 'CHƯA MỞ KHÓA';
        startBtn.classList.add('disabled');
      } else {
        if (confirmText) confirmText.textContent = this.isCampaignMode ? 'XUẤT TRẬN' : 'LƯU THIẾT LẬP 🥋';
        startBtn.classList.remove('disabled');
      }
    }
    this.updateWardrobeButtons();
    this.updateDeploymentSkinButtons();
  }

  openCharSelect(targetStage = null) {
    this.hideAll();
    this._csCurrentMove = null;
    this._csActiveDemoQueue = [];
    this._csMoveTimer = 0;
    const demoBtn = document.getElementById('btn-cs-demo-move');
    if (demoBtn) {
      demoBtn.textContent = '⚡ BIỂU DIỄN ĐÒN THẾ';
      demoBtn.classList.remove('playing');
    }
    this.isCampaignMode = (targetStage !== null && targetStage !== undefined);
    this.deploymentTargetStage = (targetStage !== null && targetStage !== undefined)
      ? targetStage
      : ((window.saveManager && window.saveManager.data.currentStage) || 1);

    const indicator = document.getElementById('cs-stage-indicator');
    const motto = document.getElementById('cs-top-motto');
    const stageTitleText = document.getElementById('cs-stage-title-text');
    const startBtn = document.getElementById('btn-char-start');
    const confirmText = startBtn ? startBtn.querySelector('.cs-confirm-text') : null;
    const colTitle = document.querySelector('.cs-col-title');

    if (this.isCampaignMode) {
      if (indicator) indicator.classList.remove('hidden');
      if (motto) motto.classList.add('hidden');
      const meta = (window.STORY_META && window.STORY_META.stages) ? window.STORY_META.stages[this.deploymentTargetStage] : null;
      const sTitle = meta ? meta.title : `MÀN ${this.deploymentTargetStage}`;
      if (stageTitleText) stageTitleText.textContent = sTitle;
      if (confirmText) confirmText.textContent = 'XUẤT TRẬN';
      if (colTitle) colTitle.textContent = 'CHỌN NHÂN VẬT XUẤT TRẬN';
    } else {
      if (indicator) indicator.classList.add('hidden');
      if (motto) motto.classList.remove('hidden');
      if (confirmText) confirmText.textContent = 'LƯU THIẾT LẬP 🥋';
      if (colTitle) colTitle.textContent = 'XEM NHÂN VẬT & VÕ PHỤC';
    }

    this.refreshCharSelect();
    this.refreshAllySelector();
    if (this.charModal) this.charModal.classList.remove('hidden');
  }


  showChapterMap() {
    if (!this.chapterList) return;
    this.chapterList.innerHTML = '';
    const meta = window.STORY_META;
    if (!meta) return;

    meta.acts.forEach((act) => {
      const actEl = document.createElement('div');
      actEl.className = 'act-block';
      const head = document.createElement('div');
      head.className = 'act-head';
      head.innerHTML = `<span class="act-code"></span><span class="act-title"></span><span class="act-desc"></span>`;
      head.querySelector('.act-code').textContent = act.code;
      head.querySelector('.act-title').textContent = act.title;
      head.querySelector('.act-desc').textContent = act.desc;
      actEl.appendChild(head);

      act.stages.forEach((sid) => {
        const s = meta.stages[sid];
        if (!s) return;
        const unlocked = window.saveManager ? window.saveManager.isStageUnlocked(sid) : sid === 1;
        const done = window.saveManager ? window.saveManager.data.completedStages.includes(sid) : false;
        const bestRec = (window.saveManager && typeof window.saveManager.getStageBest === 'function')
          ? window.saveManager.getStageBest(sid)
          : null;

        const card = document.createElement('div');
        card.className = 'stage-row' + (unlocked ? '' : ' locked') + (done ? ' done' : '');
        card.innerHTML = `
          <span class="stage-index">M${s.id}</span>
          <span class="stage-main-info">
            <span class="stage-title"></span>
            <span class="stage-mission"></span>
          </span>
          ${bestRec ? `<span class="stage-rank-badge rank-${bestRec.rank}">${bestRec.rank} (${bestRec.score.toLocaleString()}đ)</span>` : ''}
          <span class="stage-flags"></span>`;
        card.querySelector('.stage-title').textContent = s.title;
        card.querySelector('.stage-mission').textContent = s.mission || '';
        const flags = [];
        if (s.type === 'side') flags.push('NHIỆM VỤ PHỤ');
        if (s.choice) flags.push('CÓ LỰA CHỌN');
        if (s.boss) flags.push('BOSS');
        if (done) flags.push('ĐÃ QUA');
        if (!unlocked) flags.push('KHÓA');
        card.querySelector('.stage-flags').textContent = flags.join(' · ');
        card.addEventListener('click', () => {
          this.click();
          if (!unlocked) { this.showToast('MÀN NÀY ĐANG KHÓA — hoàn thành màn trước đã'); return; }
          this.showDeploymentModal(sid);
        });
        actEl.appendChild(card);
      });
      this.chapterList.appendChild(actEl);
    });

    this.mapModal.classList.remove('hidden');
  }



  setWardrobeSkin(skinType) {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    if (slot && slot.id === 'nghi') {
      skinType = 'default';
    }
    if (window.saveManager && typeof window.saveManager.setSkinEquipped === 'function') {
      window.saveManager.setSkinEquipped(this.selectedChar, skinType);
    }
    // Xóa cache style để trang phục mới được dựng lại ngay (trong menu lẫn trong trận)
    if (window.skeletalRenderer) window.skeletalRenderer._styles = {};
    this.renderSkinGrid();
    this.updateWardrobeButtons();
    if (slot && slot.id === 'nghi') {
      this.showToast('Ngô Nhất Nghị mặc định đã khoác Lam Võ Phục Vovinam Chính Thống 🥋');
    } else {
      this.showToast(skinType === 'vovinam' ? 'Đã trang bị: Võ Phục Vovinam Chính Thống 🥋' : 'Đã trang bị: Trang Phục Mặc Định 👘');
    }
  }

  // Doi vo phuc ngay trong modal deployment (nut cu bi thieu method nay).

  updateWardrobeButtons() {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    const isNghi = slot && slot.id === 'nghi';
    const isVovinam = !isNghi && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(this.selectedChar, 'vovinam');
    const defBtn = document.getElementById('btn-cs-skin-default');
    const vovBtn = document.getElementById('btn-cs-skin-vovinam');
    if (defBtn && vovBtn) {
      if (isNghi) {
        defBtn.textContent = 'Lam Võ Phục Vovinam (Mặc Định) 🥋';
        defBtn.classList.add('active');
        vovBtn.classList.remove('active');
        vovBtn.classList.add('hidden');
      } else {
        defBtn.textContent = 'Mặc Định';
        vovBtn.classList.toggle('hidden', !slot || !!slot.isLocked);
        if (isVovinam) {
          defBtn.classList.remove('active');
          vovBtn.classList.add('active');
        } else {
          defBtn.classList.add('active');
          vovBtn.classList.remove('active');
        }
      }
    }

    const skins = slot ? this.getSkinsForChar(slot) : [];
    const activeSkin = skins.find(s => s.id === (isVovinam ? 'vovinam' : 'default')) || skins[0];

    const skinCountBadge = document.getElementById('cs-tab-skin-count');
    if (skinCountBadge) {
      skinCountBadge.textContent = String(skins.length);
    }

    const tierTag = document.getElementById('cs-skin-tier-tag');
    const stageName = document.getElementById('cs-skin-stage-name');
    if (tierTag && activeSkin) {
      tierTag.textContent = activeSkin.tier;
      tierTag.classList.toggle('vovinam-tier', isVovinam || isNghi);
    }
    if (stageName && activeSkin) {
      stageName.textContent = activeSkin.name.toUpperCase();
    }

    // Cập nhật hình vẽ minh họa toàn thân (#cs-hero-img) và Võ Đài 3D (#cs-hero-skin-canvas)
    const heroImg = document.getElementById('cs-hero-img');
    const skinCanvas = document.getElementById('cs-hero-skin-canvas');
    const demoBtn = document.getElementById('btn-cs-demo-move');
    const viewToggleBtn = document.getElementById('btn-cs-view-toggle');
    const targetHeroImg = activeSkin && activeSkin.image ? activeSkin.image : (slot ? slot.image : '');

    if (demoBtn) {
      demoBtn.classList.toggle('hidden', !slot || !!slot.isLocked);
    }
    if (viewToggleBtn) {
      viewToggleBtn.classList.toggle('hidden', !slot || !!slot.isLocked);
      viewToggleBtn.textContent = this._csLiveStageActive ? '🎨 TRANH NGHỆ THUẬT' : '⚡ VÕ ĐÀI 3D';
    }
    if (skinCanvas && heroImg) {
      if (this._csLiveStageActive) {
        skinCanvas.classList.remove('hidden');
        heroImg.style.display = 'none';
      } else {
        skinCanvas.classList.add('hidden');
        if (targetHeroImg) {
          heroImg.style.display = 'block';
          heroImg.style.opacity = '1';
          if (heroImg.dataset.currentSrc !== targetHeroImg) {
            heroImg.src = targetHeroImg;
            heroImg.dataset.currentSrc = targetHeroImg;
          }
        } else {
          heroImg.style.display = 'none';
        }
      }
    }
  }

}

window.MenuManagerCharSelectCore = MenuManagerCharSelectCore;
