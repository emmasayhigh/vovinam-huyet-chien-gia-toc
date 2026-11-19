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
      giangmanh: 'boss_giangmanh',
      vananh: 'boss_vananh',
      tiendang: 'boss_tiendang',
      thienkhanh: 'boss_thienkhanh'
    };
    return fallback[charId] || 'player';
  }

  getSkinsForChar(slot) {
    if (!slot || slot.isLocked) return [];
    if (window.SkinRegistry && typeof window.SkinRegistry.getForCharacter === 'function') {
      return window.SkinRegistry.getForCharacter(slot);
    }
    return [];
  }

  resolveHeroSkinImage(slot, skinId) {
    if (window.SkinRegistry && typeof window.SkinRegistry.resolveImage === 'function') {
      return window.SkinRegistry.resolveImage(slot, skinId);
    }
    if (!slot) return 'assets/images/characters/char_hero_nghi.png';
    if (skinId === 'vovinam' && slot.vovinamImage) return slot.vovinamImage;
    return slot.image || 'assets/images/characters/char_hero_nghi.png';
  }

  _bindCsSupportEvents() {
    if (this._csSupportBound || typeof document === 'undefined') return;
    this._csSupportBound = true;
    const tabSupp = document.getElementById('btn-cs-tab-support');
    if (tabSupp && !tabSupp.__vovBound) {
      tabSupp.__vovBound = true;
      tabSupp.addEventListener('click', () => {
        this.click();
        this.switchCsTab('support');
      });
    }
    const changeBtn = document.getElementById('btn-cs-change-support');
    if (changeBtn && !changeBtn.__vovBound) {
      changeBtn.__vovBound = true;
      changeBtn.addEventListener('click', () => {
        this.click();
        this.switchCsTab('support');
      });
    }
  }

  switchCsTab(tab) {
    this._bindCsSupportEvents();
    this.activeCsTab = (tab === 'skins' || tab === 'support') ? tab : 'heroes';
    const tabHeroes = document.getElementById('btn-cs-tab-heroes');
    const tabSkins = document.getElementById('btn-cs-tab-skins');
    const tabSupport = document.getElementById('btn-cs-tab-support');
    if (tabHeroes) {
      tabHeroes.classList.toggle('active', this.activeCsTab === 'heroes');
      tabHeroes.setAttribute && tabHeroes.setAttribute('aria-selected', this.activeCsTab === 'heroes' ? 'true' : 'false');
    }
    if (tabSkins) {
      tabSkins.classList.toggle('active', this.activeCsTab === 'skins');
      tabSkins.setAttribute && tabSkins.setAttribute('aria-selected', this.activeCsTab === 'skins' ? 'true' : 'false');
    }
    if (tabSupport) {
      tabSupport.classList.toggle('active', this.activeCsTab === 'support');
      tabSupport.setAttribute && tabSupport.setAttribute('aria-selected', this.activeCsTab === 'support' ? 'true' : 'false');
    }

    const supportGrid = document.getElementById('cs-support-grid');
    if (this.charGrid) this.charGrid.classList.toggle('hidden', this.activeCsTab !== 'heroes');
    if (this.skinGrid) this.skinGrid.classList.toggle('hidden', this.activeCsTab !== 'skins');
    if (supportGrid) supportGrid.classList.toggle('hidden', this.activeCsTab !== 'support');
    const rosterFilters = document.getElementById('cs-roster-filters');
    if (rosterFilters) rosterFilters.classList.toggle('hidden', this.activeCsTab !== 'heroes');

    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    const colTitle = document.getElementById('cs-col-left-title') || document.querySelector('.cs-col-title');
    if (colTitle) {
      if (this.activeCsTab === 'skins') {
        colTitle.textContent = `TRANG PHỤC — ${slot ? slot.slotName : ''}`;
      } else if (this.activeCsTab === 'support') {
        colTitle.textContent = 'TRỢ CHIẾN GIA TỘC [PHÍM H]';
      } else {
        colTitle.textContent = this.isCampaignMode ? 'CHỌN NHÂN VẬT XUẤT TRẬN' : 'DANH SÁCH VÕ SĨ';
      }
    }
    this.renderSkinGrid();
    if (this.activeCsTab === 'support' && typeof this.renderCsSupportGrid === 'function') {
      this.renderCsSupportGrid();
    }
    this.updateWardrobeButtons();
  }

  switchSkillsTab(tab) {
    this.activeSkillsTab = (tab === 'passives') ? 'passives' : 'skills';
    this.click();
    this.updateSkillsSubtabsUI();
  }

  toggleSkillsBlock() {
    this.skillsCollapsed = !this.skillsCollapsed;
    this.click();
    const block = document.getElementById('cs-skills-block');
    if (block) {
      block.classList.toggle('collapsed', !!this.skillsCollapsed);
    }
    const label = document.querySelector('#btn-cs-skills-toggle .cs-toggle-label');
    if (label) {
      label.textContent = this.skillsCollapsed ? 'MỞ RỘNG' : 'THU GỌN';
    }
  }

  updateSkillsSubtabsUI() {
    const isPassives = (this.activeSkillsTab === 'passives');
    const tabSkills = document.getElementById('btn-cs-subtab-skills');
    const tabPassives = document.getElementById('btn-cs-subtab-passives');
    if (tabSkills) tabSkills.classList.toggle('active', !isPassives);
    if (tabPassives) tabPassives.classList.toggle('active', isPassives);

    const skillsBadges = document.getElementById('cs-skills-badges');
    const passivesList = document.getElementById('cs-passives-list');
    if (skillsBadges) skillsBadges.style.display = isPassives ? 'none' : 'flex';
    if (passivesList) passivesList.style.display = isPassives ? 'flex' : 'none';
  }

  renderSkinGrid() {
    if (!this.skinGrid) return;
    this.skinGrid.innerHTML = '';
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    if (!slot) return;

    const rawEqSkin = (window.saveManager && typeof window.saveManager.getEquippedSkin === 'function')
      ? window.saveManager.getEquippedSkin(slot.id)
      : ((slot.id !== 'nghi' && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(slot.id, 'vovinam')) ? 'vovinam' : 'default');
    const equippedSkinId = (slot.id === 'nghi' && rawEqSkin === 'vovinam') ? 'default' : (rawEqSkin || 'default');
    const skins = this.getSkinsForChar(slot);

    const skinCountBadge = document.getElementById('cs-tab-skin-count');
    if (skinCountBadge) {
      skinCountBadge.textContent = String(skins.length);
    }

    if (slot.isLocked || skins.length === 0) {
      this.skinGrid.innerHTML = `<div class="cs-skin-empty">Nhân vật này chưa mở khóa trang phục.</div>`;
      return;
    }

    const legend = document.createElement('div');
    legend.className = 'cs-rarity-legend';
    legend.innerHTML = `
      <span class="cs-rar-dot default">Phàm Phẩm (Bản Sắc)</span>
      <span class="cs-rar-dot rare">Linh Phẩm (Lam Đạo)</span>
      <span class="cs-rar-dot epic">Địa Phẩm (Tử Vân)</span>
      <span class="cs-rar-dot legendary">Thiên Phẩm (Hoàng Kim)</span>
      <span class="cs-rar-dot mythic">Chí Tôn Phẩm (Đỏ)</span>
    `;
    this.skinGrid.appendChild(legend);

    skins.forEach((sk) => {
      const isSelected = equippedSkinId === sk.id;
      const isOwned = !sk.shopSkin || (window.saveManager && typeof window.saveManager.isSkinUnlocked === 'function' && window.saveManager.isSkinUnlocked(slot.id, sk.id));
      const card = document.createElement('div');
      const rarityCls = sk.rarity ? ` rarity-${sk.rarity}` : '';
      card.className = 'cs-skin-card' + rarityCls + (isSelected ? ' selected' : '') + (isOwned ? '' : ' locked');
      if (card.setAttribute) card.setAttribute('data-skin-id', sk.id);
      const fxHtml = (sk.fx || []).map(tag => `<span class="cs-skin-fx-chip">${tag}</span>`).join('');
      const unlockSource = !sk.shopSkin
        ? (sk.id === 'default' ? 'Mở sẵn theo võ sĩ' : 'Sẵn sàng trang bị tại Võ Đường')
        : (isOwned ? 'Đã mở khóa vĩnh viễn' : `Mua tại Cửa Hàng Gia Tộc (${Number(sk.shopPrice || 150).toLocaleString()} 💎)`);
      const pillLabel = !isOwned
        ? `🔒 MUA TẠI SHOP (${Number(sk.shopPrice || 150).toLocaleString()} 💎)`
        : (isSelected ? '✔ ĐANG TRANG BỊ' : 'XEM & TRANG BỊ');
      card.innerHTML = `
        <div class="cs-skin-art-wrap">
          ${sk.image ? `<img class="cs-skin-card-img" src="${sk.image}" alt="${sk.name}">` : ''}
          <span class="cs-skin-tier-ribbon ${sk.badgeClass}">${sk.tier}</span>
        </div>
        <div class="cs-skin-info">
          <div>
            <div class="cs-skin-title">${sk.name}</div>
            <div class="cs-skin-desc">${sk.sub}</div>
            <div class="cs-skin-unlock-source">${unlockSource}</div>
          </div>
          ${fxHtml ? `<div class="cs-skin-fx-list">${fxHtml}</div>` : ''}
          <span class="cs-skin-status-pill">${pillLabel}</span>
        </div>`;

      card.addEventListener('click', () => {
        this.click();
        if (!isOwned && sk.shopSkin) {
          this.showToast(`🛒 Chuyển tới Cửa Hàng để sở hữu trang phục ${sk.name}!`);
          if (typeof this.showShop === 'function') {
            this._shopReturnTarget = 'char-select';
            if (this.charModal) this.charModal.classList.add('hidden');
            this.showShop(sk.shopKey || 'skin_bichlam_namcheo');
          }
          return;
        }
        this._csStageDemoTimer = 0;
        this._csStageDemoState = null;
        this.setWardrobeSkin(sk.id);
      });

      this.skinGrid.appendChild(card);
    });
  }


  refreshCharSelect() {
    this._bindCsSupportEvents();
    this.initCsParticles();
    this.initCsSkinStageCanvas();
    if (!this.charGrid) return;
    if (!this._csCardCache) this._csCardCache = {};
    const heroTabCount = document.getElementById('cs-tab-hero-count');
    if (heroTabCount && Array.isArray(window.CHAR_SLOTS)) {
      heroTabCount.textContent = String(window.CHAR_SLOTS.filter((s) => !s.isLocked).length);
    }

    // Bộ lọc danh sách võ sĩ (Tất cả / Đã mở / Họ Phó / Cửa hàng)
    const filterBar = document.getElementById('cs-roster-filters');
    if (filterBar && !filterBar._bound) {
      filterBar._bound = true;
      filterBar.addEventListener('click', (ev) => {
        const pill = ev.target.closest ? ev.target.closest('.cs-filter-pill') : null;
        if (!pill) return;
        this.click();
        this.csRosterFilter = pill.getAttribute('data-filter') || 'all';
        this.refreshCharSelect();
      });
    }
    const activeFilter = this.csRosterFilter || 'all';
    if (filterBar) {
      filterBar.querySelectorAll('.cs-filter-pill').forEach((p) => {
        p.classList.toggle('active', p.getAttribute('data-filter') === activeFilter);
      });
    }
    const matchFilter = (slot) => {
      if (slot.id === this.selectedChar) return true;
      if (activeFilter === 'owned') return this.isUnlocked(slot.id);
      if (activeFilter === 'phogia') {
        const c = (window.CHARACTERS || {})[slot.id];
        return !!(c && c.faction === 'phogia');
      }
      if (activeFilter === 'shop') return !!slot.shopUnlock;
      return true;
    };
    const countEl = document.getElementById('cs-roster-count');
    if (countEl) {
      const ownedN = window.CHAR_SLOTS.filter((s) => !s.isLocked && this.isUnlocked(s.id)).length;
      countEl.textContent = `${ownedN} / ${window.CHAR_SLOTS.filter((s) => !s.isLocked).length}`;
      countEl.title = 'Số võ sĩ đã mở / tổng số võ sĩ';
    }

    window.CHAR_SLOTS.forEach((slot) => {
      const unlocked = this.isUnlocked(slot.id);
      const isSelected = this.selectedChar === slot.id;
      const isVisible = matchFilter(slot);
      let card = this._csCardCache[slot.id];
      if (!card) {
        card = document.createElement('div');
        if (typeof card.setAttribute === 'function') card.setAttribute('data-char-id', slot.id);
        card.innerHTML = `
        <div class="cs-card-thumb-wrap">
          ${slot.image ? `<img class="cs-card-img" src="${slot.image}" alt="${slot.slotName}">` : `<div class="cs-card-lock-icon"><span>🔒</span></div>`}
          <div class="cs-card-lock-icon" data-lock-badge style="display:none;"><span>🔒</span></div>
          <span class="cs-card-element">${slot.element}</span>
        </div>
        <div class="cs-card-banner">
          <span class="cs-card-name">${slot.slotName}</span>
        </div>`;
        this._csCardCache[slot.id] = card;
        this.charGrid.appendChild(card);
      }
      card.className = 'cs-card' +
        (unlocked ? '' : ' locked') +
        (isSelected ? ' selected' : '') +
        (isVisible ? '' : ' hidden');
      const lockBadge = card.querySelector ? card.querySelector('[data-lock-badge]') : null;
      if (lockBadge && lockBadge.style) {
        lockBadge.style.display = (!unlocked && slot.image) ? '' : 'none';
      }

      if (!card.__vovCardWired) {
      card.__vovCardWired = true;
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
        if (this.charGrid) {
          this.charGrid.querySelectorAll('.cs-card').forEach(c => {
            c.classList.toggle('selected', c === card);
          });
        }
        this.renderSkinGrid();
        this.renderCharDetail();
        this.refreshAllySelector();
        if (slot.isLocked) {
          this.showToast('NHÂN VẬT SẮP RA MẮT!');
        } else if (!unlocked) {
          const orig = (window.CHARACTERS || {})[slot.id];
          this.showToast('CHƯA MỞ KHÓA: ' + (orig ? this.lockText(orig) : 'Cần vượt màn chơi'));
        }
      });
      }
    });

    this.renderSkinGrid();
    if (typeof this.renderCsSupportGrid === 'function') {
      this.renderCsSupportGrid();
    }
    this.renderCharDetail();
    this.refreshAllySelector();
    if (typeof this.updateSupportCompanionPreview === 'function') {
      this.updateSupportCompanionPreview();
    }
    if (typeof this.updateLoadoutSummaryBar === 'function') {
      this.updateLoadoutSummaryBar();
    }
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
    const rawCsEq = (window.saveManager && typeof window.saveManager.getEquippedSkin === 'function')
      ? window.saveManager.getEquippedSkin(slot.id)
      : ((slot.id !== 'nghi' && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(slot.id, 'vovinam')) ? 'vovinam' : 'default');
    const eqSkin = (slot.id === 'nghi' && rawCsEq === 'vovinam') ? 'default' : (rawCsEq || 'default');
    const targetHeroImg = this.resolveHeroSkinImage(slot, eqSkin);
    const heroImg = document.getElementById('cs-hero-img');
    if (heroImg) {
      if (targetHeroImg) {
        heroImg.style.display = 'block';
        heroImg.style.opacity = '1';
        if (window.uiCore && typeof window.uiCore.swapImage === 'function') {
          window.uiCore.swapImage(heroImg, targetHeroImg);
        } else {
          heroImg.src = targetHeroImg;
          if (heroImg.dataset) heroImg.dataset.currentSrc = targetHeroImg;
        }
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

    // Đòn Thế Võ Thuật Thực Chiến (Bộ Chiêu Thức)
    const skillsBadges = document.getElementById('cs-skills-badges');
    if (skillsBadges && slot.skills) {
      skillsBadges.innerHTML = '';
      slot.skills.forEach(sk => {
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
        item.addEventListener('click', () => {
          this.showToast(`${sk.key ? '[' + sk.key + '] ' : ''}${sk.name}: ${sk.desc}`);
        });
        skillsBadges.appendChild(item);
      });
    }

    // 4 Nội Tại Võ Đạo Đặc Biệt
    const passivesList = document.getElementById('cs-passives-list');
    if (passivesList && slot.passives) {
      passivesList.innerHTML = '';
      slot.passives.forEach(p => {
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
        pCard.addEventListener('click', () => {
          this.showToast(`${p.icon} ${p.name} [${p.type}]: ${p.desc}`);
        });
        passivesList.appendChild(pCard);
      });
    }

    this.updateSkillsSubtabsUI();

    // Cập nhật trạng thái nút CHỌN
    const startBtn = document.getElementById('btn-char-start');
    if (startBtn) {
      const confirmText = startBtn.querySelector('.cs-confirm-text');
      const unlocked = this.isUnlocked(slot.id);
      if (this.isTrainingMode) {
        if (confirmText) confirmText.textContent = 'VÀO VÕ ĐƯỜNG ➔';
        startBtn.classList.remove('disabled');
      } else if (slot.isLocked) {
        if (confirmText) confirmText.textContent = 'SẮP RA MẮT';
        startBtn.classList.add('disabled');
      } else if (!unlocked && slot.shopUnlock) {
        const priceLabel = slot.shopCurrency === 'diamond'
          ? `${slot.shopPrice} KIM CƯƠNG 💎`
          : `${Number(slot.shopPrice || 0).toLocaleString()} VÀNG 🪙`;
        if (confirmText) confirmText.textContent = `🛒 MỞ CỬA HÀNG (${priceLabel})`;
        startBtn.classList.remove('disabled');
      } else if (!unlocked) {
        if (confirmText) confirmText.textContent = 'CHƯA MỞ KHÓA';
        startBtn.classList.add('disabled');
      } else {
        if (confirmText) confirmText.textContent = 'CHỌN & TIẾP TỤC ➔';
        startBtn.classList.remove('disabled');
      }
    }
    this.updateWardrobeButtons();
    this.updateDeploymentSkinButtons();
  }

  openCharSelect(targetStage = null) {
    if (targetStage === null || targetStage === undefined) {
      this._charSelectReturnTarget = null;
      this._returnToCampaignHub = false;
    }
    this.hideAll();
    this.selectedChar = (window.saveManager && window.saveManager.data.selectedCharacter) || this.selectedChar || 'nghi';
    this._csCurrentMove = null;
    this._csActiveDemoQueue = [];
    this._csMoveTimer = 0;
    const demoBtn = document.getElementById('btn-cs-demo-move');
    if (demoBtn) {
      demoBtn.textContent = '⚡ BIỂU DIỄN ĐÒN THẾ';
      demoBtn.classList.remove('playing');
    }
    this.isTrainingMode = (targetStage === 'training');
    this.isCampaignMode = (targetStage !== null && targetStage !== undefined && targetStage !== 'training');
    this.deploymentTargetStage = (targetStage !== null && targetStage !== undefined && targetStage !== 'training')
      ? targetStage
      : ((window.saveManager && window.saveManager.data.currentStage) || 1);

    const indicator = document.getElementById('cs-stage-indicator');
    const motto = document.getElementById('cs-top-motto');
    const stageTitleText = document.getElementById('cs-stage-title-text');
    const startBtn = document.getElementById('btn-char-start');
    const confirmText = startBtn ? startBtn.querySelector('.cs-confirm-text') : null;
    const colTitle = document.querySelector('.cs-col-title');

    if (this.isTrainingMode) {
      if (indicator) indicator.classList.remove('hidden');
      if (motto) motto.classList.add('hidden');
      if (stageTitleText) stageTitleText.textContent = '⚡ VÕ ĐƯỜNG VOVINAM';
      if (confirmText) confirmText.textContent = 'VÀO VÕ ĐƯỜNG ➔';
      if (colTitle) colTitle.textContent = 'CHỌN CAO THỦ VÀO VÕ ĐƯỜNG';
    } else if (this.isCampaignMode) {
      if (indicator) indicator.classList.remove('hidden');
      if (motto) motto.classList.add('hidden');
      const meta = (window.STORY_META && window.STORY_META.stages) ? window.STORY_META.stages[this.deploymentTargetStage] : null;
      const sTitle = meta ? meta.title : `MÀN ${this.deploymentTargetStage}`;
      if (stageTitleText) stageTitleText.textContent = sTitle;
      if (confirmText) confirmText.textContent = 'CHỌN & TIẾP TỤC ➔';
      if (colTitle) colTitle.textContent = 'CHỌN NHÂN VẬT XUẤT TRẬN';
    } else {
      if (indicator) indicator.classList.add('hidden');
      if (motto) motto.classList.remove('hidden');
      if (confirmText) confirmText.textContent = 'CHỌN & TIẾP TỤC ➔';
      if (colTitle) colTitle.textContent = 'XEM NHÂN VẬT & VÕ PHỤC';
    }

    this.refreshCharSelect();
    this.refreshAllySelector();
    if (this.charModal) {
      if (window.uiCore) window.uiCore.showModal(this.charModal);
      else this.charModal.classList.remove('hidden');
    }
  }


  showChapterMap(opts = {}) {
    if (opts && typeof opts.fromCampaignHub === 'boolean') {
      this._returnToCampaignHub = opts.fromCampaignHub;
    }
    if (!this.chapterList) return;
    const meta = window.STORY_META;
    if (!meta || !Array.isArray(meta.acts)) return;

    const sm = window.saveManager;
    const frontierStageId = (sm && sm.data && sm.data.currentStage) ? sm.data.currentStage : 1;
    const frontierStage = meta.stages[frontierStageId] || meta.stages[1];

    if (opts && opts.actId) {
      this._activeMapAct = opts.actId;
    } else if (!this._activeMapAct || !meta.acts.some(a => a.id === this._activeMapAct)) {
      this._activeMapAct = (frontierStage && frontierStage.act) || 1;
    }
    if (opts && opts.stageId && meta.stages[opts.stageId]) {
      this._selectedMapStageId = opts.stageId;
      this._activeMapAct = meta.stages[opts.stageId].act || this._activeMapAct;
    }

    this._renderPvzChapterMap();
    this.mapModal.classList.remove('hidden');
  }

  _renderPvzChapterMap() {
    if (!this.chapterList) return;
    const meta = window.STORY_META;
    if (!meta || !Array.isArray(meta.acts)) return;
    const sm = window.saveManager;
    const curStageId = (sm && sm.data && sm.data.currentStage) ? sm.data.currentStage : 1;
    const completed = (sm && sm.data && Array.isArray(sm.data.completedStages)) ? sm.data.completedStages : [];

    const actIdx = Math.max(0, meta.acts.findIndex(a => a.id === this._activeMapAct));
    const act = meta.acts[actIdx] || meta.acts[0];
    const accent = act.themeColor || '#f59e0b';

    const mainStageIds = act.stages.filter(sid => meta.stages[sid] && meta.stages[sid].type !== 'side');
    const sideStageIds = act.stages.filter(sid => meta.stages[sid] && meta.stages[sid].type === 'side');

    // Chọn stage hiển thị mặc định trong Hồi này
    if (!this._selectedMapStageId || !act.stages.includes(this._selectedMapStageId)) {
      const unlockedInAct = act.stages.filter(sid => (sm ? sm.isStageUnlocked(sid) : sid === 1));
      const latestUnlocked = unlockedInAct.length ? unlockedInAct[unlockedInAct.length - 1] : act.stages[0];
      this._selectedMapStageId = act.stages.includes(curStageId) ? curStageId : latestUnlocked;
    }

    // Tọa độ đường uốn lượn phong cách PvZ2 (% trong .pvz-map-viewport)
    const getCoord = (idx, total) => {
      const yWave = [64, 38, 66, 46];
      const xStart = 13, xEnd = 86;
      const x = total <= 1 ? 50 : xStart + (idx / (total - 1)) * (xEnd - xStart);
      const y = yWave[idx % yWave.length];
      return { x, y };
    };

    const worldTabsHtml = meta.acts.map((a) => {
      const mainSids = a.stages.filter(id => meta.stages[id] && meta.stages[id].type !== 'side');
      const doneCnt = mainSids.filter(id => completed.includes(id)).length;
      const isActive = a.id === act.id;
      return `
        <button type="button" class="pvz-world-tab ${isActive ? 'active' : ''}" data-pvz-act="${a.id}" style="--world-accent:${a.themeColor || '#f59e0b'}">
          <span class="pvz-wt-head"><span>${a.code}</span><span>${doneCnt}/${mainSids.length} MÀN</span></span>
          <span class="pvz-wt-name">${a.title}</span>
        </button>`;
    }).join('');

    // Tạo đường tia năng lượng phát sáng nối các Đảo Nổi 3D
    const mainCoords = mainStageIds.map((sid, i) => ({ sid, ...getCoord(i, mainStageIds.length) }));
    let svgPaths = `
      <defs>
        <filter id="pvzCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>`;
    for (let i = 0; i < mainCoords.length - 1; i++) {
      const a = mainCoords[i], b = mainCoords[i + 1];
      const cx1 = (a.x + b.x) * 0.5;
      const unlockedTo = sm ? sm.isStageUnlocked(b.sid) : false;
      const dPath = `M ${a.x * 10} ${a.y * 2.95} C ${cx1 * 10} ${a.y * 2.95}, ${cx1 * 10} ${b.y * 2.95}, ${b.x * 10} ${b.y * 2.95}`;
      if (unlockedTo) {
        svgPaths += `<path d="${dPath}" fill="none" stroke="rgba(56, 189, 248, 0.45)" stroke-width="11" stroke-linecap="round" filter="url(#pvzCyanGlow)" />`;
        svgPaths += `<path d="${dPath}" fill="none" stroke="#a5f3fc" stroke-width="4" stroke-linecap="round" opacity="0.96" />`;
      } else {
        svgPaths += `<path d="${dPath}" fill="none" stroke="rgba(148, 163, 184, 0.32)" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="10 8" opacity="0.68" />`;
      }
    }
    sideStageIds.forEach((sid) => {
      const s = meta.stages[sid];
      const parent = mainCoords.find(c => c.sid === s.sideOf) || mainCoords[mainCoords.length - 1];
      if (!parent) return;
      const unlockedSide = sm ? sm.isStageUnlocked(sid) : false;
      const bx = Math.max(12, Math.min(88, parent.x - 10));
      const by = 22;
      svgPaths += `<path d="M ${parent.x * 10} ${parent.y * 2.95} Q ${(parent.x + bx) * 5} ${by * 2.95}, ${bx * 10} ${by * 2.95}" fill="none" stroke="${unlockedSide ? '#fde047' : 'rgba(250,204,21,0.38)'}" stroke-width="4" stroke-dasharray="7 6" />`;
    });

    const activeSlot = (window.CHAR_SLOTS || []).find(s => s.id === (this.selectedChar || 'nghi')) || (window.CHAR_SLOTS || [])[0];
    const heroThumb = activeSlot ? activeSlot.image : 'assets/images/characters/char_hero_nghi.png';
    const bossPortraitMap = {
      bichlam: 'assets/images/characters/char_bichlam.png',
      dunghai: 'assets/images/characters/char_dunghai.png',
      giangmanh: 'assets/images/characters/char_giangmanh.png'
    };

    const renderNodeBtn = (sid, pos, isSide = false) => {
      const s = meta.stages[sid];
      if (!s) return '';
      const unlocked = sm ? sm.isStageUnlocked(sid) : sid === 1;
      const done = completed.includes(sid);
      const bestRec = (sm && typeof sm.getStageBest === 'function') ? sm.getStageBest(sid) : null;
      const isBoss = !!s.boss;
      const isSelected = this._selectedMapStageId === sid;
      const hasClueDoc = window.investigationManager && window.investigationManager.docs &&
        Object.values(window.investigationManager.docs).find(d => Number(d.stageOrigin) === sid && !window.investigationManager.isFound(d.id));
      const iconMap = { longvuong: '🐉', bichlam: '🌊', dunghai: '🗡️', vinhtam: '👑', giangmanh: '❄️' };
      const icon = isSide ? '🎁' : (isBoss ? (iconMap[s.boss] || '👹') : (unlocked ? (done ? '🥋' : '⚔️') : '🔒'));
      const cls = [
        'pvz-node-btn',
        'pvz-floating-island',
        unlocked ? 'unlocked' : 'locked',
        done ? 'done' : '',
        isBoss ? 'boss-node pvz-boss-monument' : '',
        isSide ? 'side-node' : '',
        isSelected ? 'selected' : ''
      ].filter(Boolean).join(' ');

      const showHero = (curStageId === sid) || (isSelected && unlocked);
      if (isBoss) {
        const portraitSrc = bossPortraitMap[s.boss] || '';
        const statueInner = portraitSrc
          ? `<img class="pvz-boss-statue-img" src="${portraitSrc}" alt="${s.boss}">`
          : `<span class="pvz-boss-statue-glyph">${icon}</span>`;
        return `
          <button type="button" class="${cls}" data-pvz-stage="${sid}" style="left:${pos.x}%;top:${pos.y}%;--world-accent:${accent}">
            ${showHero ? `<span class="pvz-hero-marker"><img src="${heroThumb}" alt=""></span>` : ''}
            <span class="pvz-monument-wrap">
              <span class="pvz-monument-arch">
                <span class="pvz-monument-crown">${statueInner}</span>
              </span>
              <span class="pvz-island-ledge pvz-boss-ledge">
                <span class="pvz-skull-disc">
                  <span class="pvz-skull-icon">💀</span>
                  <span class="pvz-node-num">M${sid}</span>
                </span>
              </span>
              <span class="pvz-island-underside boss"></span>
              ${bestRec ? `<span class="pvz-node-rank">${bestRec.rank}</span>` : ''}
              ${hasClueDoc ? `<span class="pvz-node-clue" title="Có manh mối điều tra">📜</span>` : ''}
            </span>
            <span class="pvz-node-label boss">${s.title.replace(/^MÀN \d+:\s*|^MÀN PHỤ:\s*/i, '')}</span>
          </button>`;
      }

      return `
        <button type="button" class="${cls}" data-pvz-stage="${sid}" style="left:${pos.x}%;top:${pos.y}%;--world-accent:${accent}">
          ${showHero ? `<span class="pvz-hero-marker"><img src="${heroThumb}" alt=""></span>` : ''}
          <span class="pvz-island-platform">
            <span class="pvz-island-top">
              <span class="pvz-node-disc">
                <span class="pvz-node-icon">${icon}</span>
                <span class="pvz-node-num">${isSide ? 'PHỤ' : `M${sid}`}</span>
              </span>
            </span>
            <span class="pvz-island-rim"></span>
            <span class="pvz-island-underside"></span>
            ${bestRec ? `<span class="pvz-node-rank">${bestRec.rank}</span>` : ''}
            ${hasClueDoc ? `<span class="pvz-node-clue" title="Có manh mối điều tra">📜</span>` : ''}
          </span>
          <span class="pvz-node-label">${s.title.replace(/^MÀN \d+:\s*|^MÀN PHỤ:\s*/i, '')}</span>
        </button>`;
    };

    const mainNodesHtml = mainCoords.map(c => renderNodeBtn(c.sid, c, false)).join('');
    const sideNodesHtml = sideStageIds.map((sid) => {
      const s = meta.stages[sid];
      const parent = mainCoords.find(c => c.sid === s.sideOf) || mainCoords[mainCoords.length - 1];
      const pos = { x: Math.max(12, Math.min(88, (parent ? parent.x : 78) - 10)), y: 22 };
      return renderNodeBtn(sid, pos, true);
    }).join('');

    const sel = meta.stages[this._selectedMapStageId] || meta.stages[mainStageIds[0]];
    const selDef = (window.STAGE_DEFINITIONS && window.STAGE_DEFINITIONS[sel.id]) || {};
    const selUnlocked = sm ? sm.isStageUnlocked(sel.id) : sel.id === 1;
    const selDone = completed.includes(sel.id);
    const selBest = (sm && typeof sm.getStageBest === 'function') ? sm.getStageBest(sel.id) : null;
    const bossNames = { longvuong: 'Long Vương', bichlam: 'Đình Bích Lâm', dunghai: 'Phó Dung Hải', vinhtam: 'Triệu Vinh Tâm', giangmanh: 'Ngô Giang Mạnh' };
    const worldBgs = {
      1: 'assets/images/maps/world_1.jpg',
      2: 'assets/images/maps/world_2.jpg',
      3: 'assets/images/maps/world_3.jpg',
      4: 'assets/images/maps/world_4.jpg',
      5: 'assets/images/maps/world_5.jpg'
    };
    const worldBgSrc = worldBgs[act.id] || worldBgs[1];
    const allyNameMap = { bichlam: 'Đình Bích Lâm', hoanganh: 'Hoàng Anh', dinhan: 'Triệu Đình An', tiendang: 'Phó Tiến Đăng' };

    this.chapterList.innerHTML = `
      <div class="pvz-world-bar">
        <button type="button" class="pvz-world-arrow" data-pvz-nav="-1" ${actIdx <= 0 ? 'disabled' : ''}>◀</button>
        <div class="pvz-world-tabs">${worldTabsHtml}</div>
        <button type="button" class="pvz-world-arrow" data-pvz-nav="1" ${actIdx >= meta.acts.length - 1 ? 'disabled' : ''}>▶</button>
      </div>

      <div class="pvz-map-viewport" style="--world-accent:${accent}">
        <img class="pvz-world-bg-img" src="${worldBgSrc}" alt="${act.title}">
        <div class="pvz-world-scrim"></div>
        <div class="pvz-world-banner">
          <div>
            <div class="pvz-wb-title">${act.code}: ${act.title}</div>
            <div class="pvz-wb-sub">${act.worldSub ? `${act.worldSub} — ` : ''}${act.desc}</div>
          </div>
        </div>
        <div class="pvz-board-3d">
          <svg class="pvz-trail-svg" viewBox="0 0 1000 295" preserveAspectRatio="none">${svgPaths}</svg>
          ${mainNodesHtml}
          ${sideNodesHtml}
        </div>
      </div>

      <div class="pvz-stage-inspector">
        <div class="pvz-insp-left">
          <div class="pvz-insp-badges">
            <span class="pvz-insp-chip">${sel.type === 'side' ? '🎁 NHIỆM VỤ PHỤ' : `CHẶNG MÀN ${sel.id}`}</span>
            ${sel.boss ? `<span class="pvz-insp-chip boss">🔥 BOSS: ${bossNames[sel.boss] || sel.boss.toUpperCase()}</span>` : '<span class="pvz-insp-chip">⚔️ ĐỘT KÍCH CỐT TRUYỆN</span>'}
            ${selDef.timeLimit ? `<span class="pvz-insp-chip">⏱️ GIỚI HẠN ${selDef.timeLimit}S</span>` : ''}
            ${selDef.storyAlly ? `<span class="pvz-insp-chip">🤝 ĐỒNG HÀNH: ${allyNameMap[selDef.storyAlly] || selDef.storyAlly}</span>` : ''}
            ${selDef.hazardMode === 'fire_talismans' ? '<span class="pvz-insp-chip boss">🔥 BÙA HỎA THIÊU HỒN</span>' : ''}
            ${selDef.escape ? '<span class="pvz-insp-chip">🏃 TRỐN THOÁT</span>' : ''}
            <span class="pvz-insp-chip reward">🏆 ${sel.reward || 'Kinh nghiệm & Chiến lợi phẩm'}</span>
            ${selBest ? `<span class="pvz-insp-chip">🏅 Hạng ${selBest.rank} (${selBest.score.toLocaleString()}đ)</span>` : ''}
            ${selDone ? '<span class="pvz-insp-chip">✔ ĐÃ HOÀN THÀNH</span>' : ''}
          </div>
          <h3 class="pvz-insp-title">${sel.title}</h3>
          <p class="pvz-insp-mission">${sel.mission || ''}</p>
          ${sel.clue ? `<p class="pvz-insp-clue">📜 Manh mối: ${sel.clue}</p>` : ''}
        </div>
        <div class="pvz-insp-cta">
          <button type="button" class="btn btn-primary" id="btn-pvz-play-stage" ${selUnlocked ? '' : 'disabled'}>
            ${selUnlocked ? '⚔️ XUẤT TRẬN MÀN NÀY' : '🔒 HOÀN THÀNH MÀN TRƯỚC'}
          </button>
        </div>
      </div>
    `;

    // Bind events
    this.chapterList.querySelectorAll('[data-pvz-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.click();
        this._activeMapAct = Number(btn.getAttribute('data-pvz-act'));
        this._selectedMapStageId = null;
        this._renderPvzChapterMap();
      });
    });
    this.chapterList.querySelectorAll('[data-pvz-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dir = Number(btn.getAttribute('data-pvz-nav'));
        const nextAct = meta.acts[actIdx + dir];
        if (!nextAct) return;
        this.click();
        this._activeMapAct = nextAct.id;
        this._selectedMapAct = null;
        this._selectedMapStageId = null;
        this._renderPvzChapterMap();
      });
    });
    this.chapterList.querySelectorAll('[data-pvz-stage]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sid = Number(btn.getAttribute('data-pvz-stage'));
        this.click();
        this._selectedMapStageId = sid;
        this._renderPvzChapterMap();
      });
    });
    const playBtn = document.getElementById('btn-pvz-play-stage');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.click();
        if (!selUnlocked) {
          this.showToast('🔒 MÀN NÀY ĐANG KHÓA — hãy hoàn thành màn trước!');
          return;
        }
        this.showDeploymentModal(sel.id);
      });
    }
  }



  setWardrobeSkin(skinType) {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    if (slot && slot.id === 'nghi' && skinType === 'vovinam') {
      skinType = 'default';
    }
    if (slot && skinType && skinType !== 'default' && skinType !== 'vovinam' && window.saveManager && typeof window.saveManager.isSkinUnlocked === 'function' && !window.saveManager.isSkinUnlocked(slot.id, skinType)) {
      this.showToast('🛒 Vui lòng mua trang phục này tại Cửa Hàng Gia Tộc trước!');
      return;
    }
    if (window.saveManager && typeof window.saveManager.setSkinEquipped === 'function') {
      window.saveManager.setSkinEquipped(this.selectedChar, skinType);
    }
    // Xóa cache style để trang phục mới được dựng lại ngay (trong menu lẫn trong trận)
    if (window.skeletalRenderer) window.skeletalRenderer._styles = {};
    if (window.game && window.game.player && window.game.player.charId === this.selectedChar) {
      window.game.player.setCharacter(this.selectedChar);
    }
    this.renderSkinGrid();
    this.updateWardrobeButtons();
    const skinDef = (window.SkinRegistry && typeof window.SkinRegistry.getSkin === 'function' && slot)
      ? window.SkinRegistry.getSkin(slot.id, skinType)
      : null;
    if (skinDef && skinDef.toast) {
      this.showToast(skinDef.toast);
    } else if (slot && slot.id === 'nghi') {
      this.showToast('Ngô Nhất Nghị mặc định đã khoác Lam Võ Phục Vovinam Chính Thống 🥋');
    } else if (skinType === 'namcheo') {
      this.showToast('🌊 Đã trang bị: Ông Năm Chèo — Thủy Bá Bến Cảng (Đổi hiệu ứng Sóng Nước)!');
    } else {
      this.showToast(skinType === 'vovinam' ? 'Đã trang bị: Võ Phục Vovinam Chính Thống 🥋' : 'Đã trang bị: Trang Phục Mặc Định 👘');
    }
  }

  // Doi vo phuc ngay trong modal deployment (nut cu bi thieu method nay).

  updateWardrobeButtons() {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    const isNghi = slot && slot.id === 'nghi';
    const rawW = (window.saveManager && typeof window.saveManager.getEquippedSkin === 'function')
      ? window.saveManager.getEquippedSkin(this.selectedChar)
      : ((!isNghi && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(this.selectedChar, 'vovinam')) ? 'vovinam' : 'default');
    const equippedSkin = (isNghi && rawW === 'vovinam') ? 'default' : (rawW || 'default');
    const isVovinam = !isNghi && equippedSkin === 'vovinam';
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
    const activeSkin = skins.find(s => s.id === equippedSkin) || skins[0];

    const skinCountBadge = document.getElementById('cs-tab-skin-count');
    if (skinCountBadge) {
      skinCountBadge.textContent = String(skins.length);
    }

    const tierTag = document.getElementById('cs-skin-tier-tag');
    const stageName = document.getElementById('cs-skin-stage-name');
    if (tierTag && activeSkin) {
      tierTag.textContent = activeSkin.tier;
      tierTag.className = `cs-skin-tier-tag ${activeSkin.badgeClass || 'default'}`;
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
          if (heroImg.dataset && heroImg.dataset.currentSrc !== targetHeroImg) {
            if (heroImg.classList) {
              heroImg.classList.remove('cs-hero-swap-anim');
              void heroImg.offsetWidth;
              heroImg.classList.add('cs-hero-swap-anim');
            }
            heroImg.src = targetHeroImg;
            if (heroImg.dataset) heroImg.dataset.currentSrc = targetHeroImg;
          }
        } else {
          heroImg.style.display = 'none';
        }
      }
    }

    // Nút skin mở rộng (VD: Ông Năm Chèo cho Đình Bích Lâm)
    const extraWrap = document.getElementById('cs-wardrobe-extra-skins');
    if (extraWrap) {
      extraWrap.innerHTML = '';
      skins.filter((s) => s && s.id !== 'default' && s.id !== 'vovinam').forEach((sk) => {
        const isOwned = !sk.shopSkin || (window.saveManager && typeof window.saveManager.isSkinUnlocked === 'function' && window.saveManager.isSkinUnlocked(slot.id, sk.id));
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cs-skin-toggle-btn' + (equippedSkin === sk.id ? ' active' : '') + (isOwned ? '' : ' locked');
        btn.textContent = isOwned ? `${sk.name}` : `🔒 ${sk.name}`;
        btn.title = sk.sub || sk.name;
        btn.addEventListener('click', () => this.setWardrobeSkin(sk.id));
        extraWrap.appendChild(btn);
      });
    }

    this.updateSupportCompanionPreview();
    this.updateLoadoutSummaryBar();
  }

  updateSupportCompanionPreview() {
    const card = document.getElementById('cs-support-companion-card');
    if (!card) return;
    const sm = window.saveManager;
    let allyId = (this.selectedAlly) || (sm && sm.data && sm.data.selectedAlly) || (window.allyManager && window.allyManager.selectedAllyId) || 'auto';
    if (allyId === this.selectedChar) allyId = 'auto';

    const catalog = (typeof this.getAlliesCatalog === 'function') ? this.getAlliesCatalog() : [];
    const allyObj = catalog.find((a) => a.id === allyId) || { id: allyId, name: 'Tự Động', fullName: 'Tự Động Theo Cốt Truyện', role: 'Linh Hoạt Theo Hồi', roleColor: '#38bdf8' };
    const profile = (window.ALLY_PROFILES && window.ALLY_PROFILES[allyId]) || null;

    const imgEl = document.getElementById('cs-support-companion-img');
    const iconEl = document.getElementById('cs-support-companion-icon');
    const nameEl = document.getElementById('cs-support-companion-name');
    const roleEl = document.getElementById('cs-support-companion-role');
    const skillEl = document.getElementById('cs-support-companion-skill');

    if (imgEl && iconEl) {
      if (allyId === 'auto' || allyId === 'none' || !allyObj.image) {
        imgEl.classList.add('hidden');
        iconEl.classList.remove('hidden');
        iconEl.textContent = allyId === 'none' ? '⚔️' : '⭐';
      } else {
        iconEl.classList.add('hidden');
        imgEl.classList.remove('hidden');
        imgEl.src = allyObj.image;
      }
    }
    if (nameEl) nameEl.textContent = (profile && profile.name ? profile.name : allyObj.name).toUpperCase();
    if (roleEl) {
      roleEl.textContent = (profile && profile.role) || allyObj.role || 'Hỗ Trợ';
      roleEl.style.color = (profile && profile.roleColor) || allyObj.roleColor || '#38bdf8';
    }
    if (skillEl) {
      if (allyId === 'auto') skillEl.textContent = 'Tự động gọi đồng minh theo hồi';
      else if (allyId === 'none') skillEl.textContent = 'Độc hành — Không viện trợ';
      else if (profile && profile.activeSkill) skillEl.textContent = `[H] ${profile.activeSkill.name}`;
      else skillEl.textContent = allyObj.role || 'Chi viện thực chiến';
    }
  }

  updateLoadoutSummaryBar() {
    const bar = document.getElementById('cs-loadout-summary-bar');
    if (!bar || !Array.isArray(window.CHAR_SLOTS)) return;
    const slot = window.CHAR_SLOTS.find((s) => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    if (!slot) return;
    const sm = window.saveManager;
    const rawSum = (sm && typeof sm.getEquippedSkin === 'function')
      ? sm.getEquippedSkin(slot.id)
      : ((slot.id !== 'nghi' && sm && typeof sm.isSkinEquipped === 'function' && sm.isSkinEquipped(slot.id, 'vovinam')) ? 'vovinam' : 'default');
    const equippedSkin = (slot.id === 'nghi' && rawSum === 'vovinam') ? 'default' : (rawSum || 'default');
    const skins = this.getSkinsForChar(slot);
    const activeSkin = skins.find((s) => s.id === equippedSkin) || skins[0];

    let allyId = (this.selectedAlly) || (sm && sm.data && sm.data.selectedAlly) || (window.allyManager && window.allyManager.selectedAllyId) || 'auto';
    if (allyId === slot.id) allyId = 'auto';
    const catalog = (typeof this.getAlliesCatalog === 'function') ? this.getAlliesCatalog() : [];
    const allyObj = catalog.find((a) => a.id === allyId) || { name: allyId };

    const heroEl = document.getElementById('cs-loadout-hero-name');
    const skinEl = document.getElementById('cs-loadout-skin-name');
    const allyEl = document.getElementById('cs-loadout-ally-name');
    const statusEl = document.getElementById('cs-loadout-status-pill');

    if (heroEl) heroEl.textContent = slot.slotName || slot.fullName;
    if (skinEl) skinEl.textContent = activeSkin ? activeSkin.name : 'Mặc Định';
    if (allyEl) allyEl.textContent = allyObj.name || 'Tự Động';

    if (statusEl) {
      const heroOk = !slot.isLocked && this.isUnlocked(slot.id);
      const skinOwned = !activeSkin || !activeSkin.shopSkin || (sm && typeof sm.isSkinUnlocked === 'function' && sm.isSkinUnlocked(slot.id, activeSkin.id));
      if (!heroOk) {
        statusEl.textContent = slot.shopUnlock ? '🛒 CẦN MỞ KHÓA' : '🔒 CHƯA MỞ KHÓA';
        statusEl.className = 'cs-loadout-status locked';
      } else if (!skinOwned) {
        statusEl.textContent = '🔒 SKIN CHƯA SỞ HỮU';
        statusEl.className = 'cs-loadout-status locked';
      } else {
        statusEl.textContent = '✓ ĐỘI HÌNH HỢP LỆ';
        statusEl.className = 'cs-loadout-status ready';
      }
    }
  }

}

window.MenuManagerCharSelectCore = MenuManagerCharSelectCore;
