/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/menu/collections.js - Ho so nhan vat, bo suu tap va thanh tich.
 */

class MenuManagerCollections extends window.MenuManagerCharSelect {
  // --------------------------------------------------------------------------
  // HỒ SƠ NGƯỜI CHƠI & CHIẾN TÍCH GIA TỘC (TÁCH RIÊNG VỚI HỒ SƠ NHÂN VẬT)
  // --------------------------------------------------------------------------
  showPlayerProfile() {
    this.hideAll();
    this.updateMenuPlayerBar();
    const body = this.playerProfileBody || document.getElementById('player-profile-body');
    const modal = this.playerProfileModal || document.getElementById('player-profile-modal');
    if (!body || !modal) return;

    const sm = window.saveManager;
    const d = (sm && sm.data) ? sm.data : {};
    const prog = this.computePlayerProfileProgress();

    const curCharId = d.selectedCharacter || this.selectedChar || 'nghi';
    const slot = (window.CHAR_SLOTS && window.CHAR_SLOTS.find(s => s.id === curCharId)) || (window.CHAR_SLOTS && window.CHAR_SLOTS[0]) || {
      id: 'nghi', fullName: 'Ngô Nhất Nghị', slotName: 'Nhất Nghị', title: 'Sát Thần Việt Võ Đạo', image: 'assets/images/characters/char_hero_nghi.png'
    };
    const eqSkin = slot.id === 'nghi'
      ? 'default'
      : ((sm && typeof sm.getEquippedSkin === 'function')
        ? sm.getEquippedSkin(slot.id)
        : ((sm && typeof sm.isSkinEquipped === 'function' && sm.isSkinEquipped(slot.id, 'vovinam')) ? 'vovinam' : 'default'));
    const heroImg = typeof this.resolveHeroSkinImage === 'function'
      ? this.resolveHeroSkinImage(slot, eqSkin)
      : ((eqSkin === 'vovinam' && slot.vovinamImage) ? slot.vovinamImage : (slot.image || 'assets/images/characters/char_hero_nghi.png'));
    const skinInfo = (window.SkinRegistry && typeof window.SkinRegistry.getSkin === 'function')
      ? window.SkinRegistry.getSkin(slot, eqSkin)
      : null;
    const skinLabel = (slot.id === 'nghi' || eqSkin === 'vovinam')
      ? 'Lam Võ Phục Vovinam 🥋'
      : ((skinInfo && (skinInfo.shortName || skinInfo.name)) || 'Trang Phục Nguyên Bản 👘');

    const curAllyId = d.selectedAlly || 'auto';
    const allyNameMap = {
      auto: 'Tự Động Theo Truyện ⭐',
      none: 'Độc Hành Chiến Đấu 🗡️',
      bichlam: 'Đình Bích Lâm',
      dinhan: 'Triệu Đình An',
      huavudai: 'Hứa Vũ Đại',
      hoanganh: 'Phó Đặng Hoàng Anh',
      dunghai: 'Phó Dung Hải',
      mocdang: 'Phó Mộc Đăng',
      giangmanh: 'Ngô Giang Mạnh'
    };
    const activeAllyName = allyNameMap[curAllyId] || curAllyId;

    const totalAchCount = (window.STORY_META && Array.isArray(window.STORY_META.achievements)) ? window.STORY_META.achievements.length : 18;
    const stageRecords = d.stageBestRecords || {};
    const stageList = (window.STORY_META && window.STORY_META.stages) ? Object.values(window.STORY_META.stages) : [];

    let stageBadgesHtml = '';
    if (stageList.length > 0) {
      stageBadgesHtml = stageList.map(st => {
        const rec = stageRecords[st.id];
        const done = Array.isArray(d.completedStages) && d.completedStages.includes(st.id);
        const rank = rec && rec.rank ? rec.rank : (done ? '✓' : '—');
        const rankCls = rec && rec.rank ? `rank-${rec.rank}` : (done ? 'rank-done' : 'rank-locked');
        const scoreTxt = rec && rec.score ? `${Number(rec.score).toLocaleString()} PTS` : (done ? 'Đã vượt' : 'Chưa vượt');
        return `
          <div class="pp-stage-pill ${done || rec ? 'cleared' : 'locked'}" title="${st.title} — ${scoreTxt}">
            <span class="pp-stage-code">M${st.id}</span>
            <span class="pp-stage-name">${st.title.replace(/^MÀN\s*\d+:\s*/i, '')}</span>
            <span class="pp-stage-rank ${rankCls}">${rank}</span>
          </div>
        `;
      }).join('');
    }

    body.innerHTML = `
      <div class="pp-hero-banner">
        <div class="pp-avatar-box">
          <img class="pp-avatar-img" src="${heroImg}" alt="${slot.fullName || slot.slotName}">
          <span class="pp-level-pill">Lv. ${prog.level}</span>
        </div>
        <div class="pp-identity-col">
          <div class="pp-rank-row">
            <span class="pp-rank-badge" style="border-color:${prog.rankColor}; color:${prog.rankColor};">${prog.rankBadge}</span>
            <span class="pp-clan-tag">GIA TỘC HỌ PHÓ • VIỆT VÕ ĐẠO</span>
          </div>
          <h3 class="pp-player-title">${prog.rankTitle}</h3>
          <div class="pp-exp-wrap">
            <div class="pp-exp-labels">
              <span>KINH NGHIỆM VÕ ĐẠO (EXP)</span>
              <span>${prog.currentLevelExp} / ${prog.expPerLevel} EXP (Tổng: ${prog.totalExp.toLocaleString()})</span>
            </div>
            <div class="pp-exp-track">
              <div class="pp-exp-fill" style="width: ${prog.expPercent}%;"></div>
            </div>
          </div>
          <div class="pp-loadout-row">
            <div class="pp-loadout-chip">
              <span class="lbl">VÕ SĨ ĐẠI DIỆN:</span>
              <strong class="val">${slot.fullName || slot.slotName}</strong>
              <span class="sub">(${skinLabel})</span>
            </div>
            <div class="pp-loadout-chip">
              <span class="lbl">ĐỒNG MINH CHI VIỆN:</span>
              <strong class="val">${activeAllyName}</strong>
            </div>
            <button id="btn-pp-change-hero" type="button" class="pp-change-hero-btn">🥋 ĐỔI VÕ SĨ</button>
          </div>
        </div>
      </div>

      <div class="pp-stats-grid">
        <div class="pp-stat-card">
          <span class="pp-stat-icon">⚔️</span>
          <div class="pp-stat-info">
            <span class="pp-stat-val">${prog.completedStagesCount} / 11</span>
            <span class="pp-stat-lbl">Khu Vực Đã Triệt Phá</span>
          </div>
        </div>
        <div class="pp-stat-card">
          <span class="pp-stat-icon">🔥</span>
          <div class="pp-stat-info">
            <span class="pp-stat-val">${prog.bestCombo} HIT</span>
            <span class="pp-stat-lbl">Kỷ Lục Liên Hoàn Combo</span>
          </div>
        </div>
        <div class="pp-stat-card">
          <span class="pp-stat-icon">👊</span>
          <div class="pp-stat-info">
            <span class="pp-stat-val">${prog.totalHits.toLocaleString()}</span>
            <span class="pp-stat-lbl">Tổng Đòn Đánh Trúng</span>
          </div>
        </div>
        <div class="pp-stat-card">
          <span class="pp-stat-icon">⚡</span>
          <div class="pp-stat-info">
            <span class="pp-stat-val">${prog.perfectDodges.toLocaleString()}</span>
            <span class="pp-stat-lbl">Né Thân Pháp Hoàn Hảo</span>
          </div>
        </div>
        <div class="pp-stat-card">
          <span class="pp-stat-icon">💀</span>
          <div class="pp-stat-info">
            <span class="pp-stat-val">${prog.bossesDefeatedCount} / 10</span>
            <span class="pp-stat-lbl">Thủ Lĩnh Đã Khuất Phục</span>
          </div>
        </div>
        <div class="pp-stat-card">
          <span class="pp-stat-icon">🥋</span>
          <div class="pp-stat-info">
            <span class="pp-stat-val">${prog.unlockedCharsCount} / 9</span>
            <span class="pp-stat-lbl">Cao Thủ Đã Chiêu Mộ</span>
          </div>
        </div>
        <div class="pp-stat-card">
          <span class="pp-stat-icon">🏆</span>
          <div class="pp-stat-info">
            <span class="pp-stat-val">${prog.achievementsCount} / ${totalAchCount}</span>
            <span class="pp-stat-lbl">Cúp Thành Tựu Gia Tộc</span>
          </div>
        </div>
        <div class="pp-stat-card">
          <span class="pp-stat-icon">📜</span>
          <div class="pp-stat-info">
            <span class="pp-stat-val">${prog.endingsCount} / 4</span>
            <span class="pp-stat-lbl">Kết Cục Đại Án Đã Mở</span>
          </div>
        </div>
      </div>

      <div class="pp-stages-section">
        <div class="pp-section-header">
          <h4>🎖️ BẢNG PHONG THẦN &amp; XẾP HẠNG CÁC MÀN CHƠI</h4>
          <span>Hoàn thành màn chơi với Combo cao &amp; ít mất máu để đạt hạng S (Sát Thần)</span>
        </div>
        <div class="pp-stages-grid">
          ${stageBadgesHtml}
        </div>
      </div>
    `;

    const btnChangeHero = document.getElementById('btn-pp-change-hero');
    if (btnChangeHero) {
      btnChangeHero.addEventListener('click', () => {
        this.click();
        this.closePlayerProfile();
        this.openCharSelect(null);
      });
    }

    modal.classList.remove('hidden');
  }

  // --------------------------------------------------------------------------
  // CỬA HÀNG GIA TỘC (PHÂN KHU RIÊNG: NHÂN VẬT = VÀNG 🪙 | TRANG PHỤC = KIM CƯƠNG 💎)
  // --------------------------------------------------------------------------
  _bindShopTabs() {
    const bar = document.getElementById('shop-tabs-bar');
    if (bar && !bar.__vovShopTabBound) {
      bar.__vovShopTabBound = true;
      bar.addEventListener('click', (ev) => {
        const btn = ev.target && ev.target.closest ? ev.target.closest('[data-shop-tab]') : null;
        if (!btn) return;
        this.click();
        this.activeShopTab = btn.getAttribute('data-shop-tab') === 'skins' ? 'skins' : 'heroes';
        this.renderShopItems();
      });
    }
  }

  showShop(focusCharId = null) {
    const keepReturn = this._shopReturnTarget || null;
    this.hideAll();
    this._shopReturnTarget = keepReturn;
    this._bindShopTabs();
    if (focusCharId && (String(focusCharId).startsWith('skin_') || ['namcheo', 'thantrung', 'chodoinon', 'skins'].includes(focusCharId))) {
      this.activeShopTab = 'skins';
    } else if (focusCharId === 'heroes' || focusCharId) {
      this.activeShopTab = 'heroes';
    } else if (!this.activeShopTab) {
      this.activeShopTab = 'heroes';
    }
    this.updateCurrencyUI();

    const modal = this.shopModal || document.getElementById('shop-modal');
    if (!modal) return;

    this.renderShopItems(focusCharId);
    modal.classList.remove('hidden');
  }

  renderShopItems(focusCharId = null) {
    const grid = this.shopItemsGrid || document.getElementById('shop-items-grid');
    if (!grid) return;
    this._bindShopTabs();
    const tab = this.activeShopTab === 'skins' ? 'skins' : 'heroes';
    const tabHeroes = document.getElementById('btn-shop-tab-heroes');
    const tabSkins = document.getElementById('btn-shop-tab-skins');
    if (tabHeroes) tabHeroes.classList.toggle('active', tab === 'heroes');
    if (tabSkins) tabSkins.classList.toggle('active', tab === 'skins');
    grid.innerHTML = '';

    this.updateCurrencyUI();
    const sm = window.saveManager;
    const curGold = (sm && typeof sm.getGold === 'function') ? sm.getGold() : ((sm && sm.data && sm.data.gold) || 0);
    const curDiamonds = (sm && typeof sm.getDiamonds === 'function') ? sm.getDiamonds() : ((sm && sm.data && sm.data.diamonds) || 0);

    if (tab === 'heroes') {
      const shopCharIds = ['vananh', 'tiendang', 'thienkhanh'];
      shopCharIds.forEach((charId) => {
        const slot = (window.CHAR_SLOTS || []).find(s => s.id === charId);
        if (!slot) return;

        const unlocked = this.isUnlocked(charId);
        // Quy chuẩn tiền tệ: Toàn bộ Nhân Vật mua tự động bằng VÀNG (🪙)
        const price = Number(slot.shopPrice || 2500);
        const canAfford = curGold >= price;
        const isFocused = focusCharId === charId;

        const card = document.createElement('div');
        card.className = `shop-hero-card ${charId === 'thienkhanh' ? 'theme-mythic' : 'theme-gold'} ${unlocked ? 'owned' : ''} ${isFocused ? 'focused' : ''}`;
        card.setAttribute('data-shop-char', charId);

        const skillsHtml = (slot.skills || []).map(sk => `
          <div class="sh-skill-chip" title="${sk.desc}">
            <span class="sh-skill-key">${sk.key}</span>
            <span class="sh-skill-name">${sk.name}</span>
          </div>
        `).join('');

        const passivesHtml = (slot.passives || []).slice(0, 2).map(p => `
          <div class="sh-passive-row">
            <span class="sh-p-icon">${p.icon || '✦'}</span>
            <div class="sh-p-text"><strong>${p.name}:</strong> ${p.desc}</div>
          </div>
        `).join('');

        const badgeLabel = charId === 'thienkhanh'
          ? '🔥🪙 SIÊU PHẨM TÀ ĐẠO • 12.000 VÀNG'
          : '🪙 CHIÊU MỘ BẰNG VÀNG • TỨ TRỤ HỌ PHÓ';

        card.innerHTML = `
          <div class="sh-card-visual">
            <img class="sh-portrait-img" src="${slot.image}" alt="${slot.fullName}">
            <span class="sh-tier-ribbon ${charId === 'thienkhanh' ? 'mythic' : 'gold'}">${badgeLabel}</span>
            ${unlocked ? '<span class="sh-owned-stamp">✔ ĐÃ CHIÊU MỘ</span>' : ''}
          </div>

          <div class="sh-card-body">
            <div class="sh-header-block">
              <span class="sh-role-sub">${slot.title}</span>
              <h3 class="sh-char-name">${slot.fullName}</h3>
              <p class="sh-quote">${slot.quote}</p>
            </div>

            <p class="sh-bio-desc">${slot.bio}</p>

            <div class="sh-stats-bar-row">
              <div class="sh-stat-pill"><span>Sức mạnh</span><strong>${slot.stats.power}</strong></div>
              <div class="sh-stat-pill"><span>Tốc độ</span><strong>${slot.stats.speed}</strong></div>
              <div class="sh-stat-pill"><span>Kháng cự</span><strong>${slot.stats.defense}</strong></div>
              <div class="sh-stat-pill"><span>Kỹ thuật</span><strong>${slot.stats.technique}</strong></div>
            </div>

            <div class="sh-skills-grid">${skillsHtml}</div>
            <div class="sh-passives-box">${passivesHtml}</div>

            <div class="sh-actions-row">
              <button type="button" class="btn btn-secondary sh-btn-dossier" data-dossier-char="${charId}">📖 TIỂU SỬ</button>
              ${unlocked ? `
                <button type="button" class="btn btn-primary sh-btn-select" data-select-char="${charId}">
                  🥋 CHỌN XUẤT TRẬN NGAY
                </button>
              ` : `
                <button type="button" class="btn btn-primary sh-btn-buy buy-gold ${canAfford ? '' : 'insufficient'}" data-buy-char="${charId}">
                  <span class="buy-icon">🪙</span>
                  <span class="buy-text">CHIÊU MỘ: ${price.toLocaleString()} VÀNG</span>
                </button>
              `}
            </div>
          </div>
        `;

        const btnDossier = card.querySelector('.sh-btn-dossier');
        if (btnDossier) {
          btnDossier.addEventListener('click', () => {
            this.click();
            this._dossierReturnTarget = 'shop';
            this.dossierChar = charId;
            if (this.shopModal) this.shopModal.classList.add('hidden');
            this.showDossier();
          });
        }

        const btnSelect = card.querySelector('.sh-btn-select');
        if (btnSelect) {
          btnSelect.addEventListener('click', () => {
            this.click();
            this.selectedChar = charId;
            if (window.saveManager) {
              window.saveManager.data.selectedCharacter = charId;
              window.saveManager.persist();
            }
            if (this.shopModal) this.shopModal.classList.add('hidden');
            this.updateMenuPlayerBar();
            this.openCharSelect(null);
          });
        }

        const btnBuy = card.querySelector('.sh-btn-buy');
        if (btnBuy) {
          btnBuy.addEventListener('click', () => {
            this.click();
            this.purchaseShopCharacter(charId);
          });
        }

        grid.appendChild(card);
      });
      return;
    }

    // Khu Bán Trang Phục (Skin): Đọc động từ SkinRegistry & giao dịch bằng KIM CƯƠNG (💎)
    const shopSkins = (window.SkinRegistry && typeof window.SkinRegistry.getShopSkins === 'function')
      ? window.SkinRegistry.getShopSkins()
      : [];
    shopSkins.forEach((sk) => {
      const charId = sk.charId;
      const skinId = sk.id;
      const skinKey = sk.shopKey || `skin_${charId}_${skinId}`;
      const skinPrice = Number(sk.shopPrice || 150);
      const skinOwned = !!(sm && typeof sm.isSkinUnlocked === 'function' && sm.isSkinUnlocked(charId, skinId));
      const heroUnlocked = this.isUnlocked(charId);
      const isEquipped = !!(sm && typeof sm.isSkinEquipped === 'function' && sm.isSkinEquipped(charId, skinId));
      const canAfford = curDiamonds >= skinPrice;
      const isFocusedSkin = focusCharId === skinKey || focusCharId === skinId;

      const sCard = document.createElement('div');
      sCard.className = `shop-hero-card ${sk.themeClass || 'theme-mythic'} ${skinOwned ? 'owned' : ''} ${isFocusedSkin ? 'focused' : ''}`;
      sCard.setAttribute('data-shop-skin', skinKey);
      const skillsHtml = (sk.skillsGrid || []).map((item) =>
        `<div class="sh-skill-chip"><span class="sh-skill-key">${item.key}</span><span class="sh-skill-name">${item.name}</span></div>`
      ).join('');
      const pNote = sk.passiveNote;

      sCard.innerHTML = `
        <div class="sh-card-visual">
          <img class="sh-portrait-img" src="${sk.image}" alt="${sk.name}">
          <span class="sh-tier-ribbon ${sk.rarity || 'mythic'}">${sk.shopRibbon || sk.tier}</span>
          ${skinOwned ? '<span class="sh-owned-stamp">✔ ĐÃ SỞ HỮU</span>' : ''}
        </div>
        <div class="sh-card-body">
          <div class="sh-header-block">
            <span class="sh-role-sub">${sk.shopRoleSub || sk.tier}</span>
            <h3 class="sh-char-name">${(sk.name || '').toUpperCase()}</h3>
            ${sk.quote ? `<p class="sh-quote">${sk.quote}</p>` : ''}
          </div>
          <p class="sh-bio-desc">${sk.bio || sk.sub || ''}</p>
          ${skillsHtml ? `<div class="sh-skills-grid">${skillsHtml}</div>` : ''}
          ${pNote ? `<div class="sh-passives-box"><div class="sh-passive-row"><span class="sh-p-icon">${pNote.icon || '✨'}</span><div class="sh-p-text"><strong>${pNote.title || ''}</strong> ${pNote.desc || ''}</div></div></div>` : ''}
          <div class="sh-actions-row">
            <button type="button" class="btn btn-secondary sh-btn-skin-preview">🥋 XEM TẠI VÕ ĐƯỜNG</button>
            ${skinOwned ? `
              <button type="button" class="btn btn-primary sh-btn-equip-skin" ${isEquipped ? 'disabled' : ''}>
                ${isEquipped ? `✔ ĐANG MẶC ${(sk.shortName || sk.name).toUpperCase()}` : (heroUnlocked ? '🌊 MẶC NGAY TRANG PHỤC' : `✔ ĐÃ SỞ HỮU (CHỜ MỞ ${(sk.heroName || charId).toUpperCase()})`)}
              </button>
            ` : `
              <button type="button" class="btn btn-primary sh-btn-buy-skin buy-diamond ${canAfford ? '' : 'insufficient'}">
                <span class="buy-icon">💎</span>
                <span class="buy-text">MUA TRANG PHỤC: ${skinPrice.toLocaleString()} KIM CƯƠNG</span>
              </button>
            `}
          </div>
        </div>
      `;

      const previewBtn = sCard.querySelector('.sh-btn-skin-preview');
      if (previewBtn) {
        previewBtn.addEventListener('click', () => {
          this.click();
          if (this.shopModal) this.shopModal.classList.add('hidden');
          this.openCharSelect(null);
          this.selectedChar = charId;
          this.refreshCharSelect();
          this.switchCsTab('skins');
        });
      }

      const equipBtn = sCard.querySelector('.sh-btn-equip-skin');
      if (equipBtn) {
        equipBtn.addEventListener('click', () => {
          this.click();
          if (sm && typeof sm.setSkinEquipped === 'function') sm.setSkinEquipped(charId, skinId);
          if (window.skeletalRenderer) window.skeletalRenderer._styles = {};
          if (heroUnlocked && sm && sm.data) {
            sm.data.selectedCharacter = charId;
            sm.persist();
            this.selectedChar = charId;
          }
          if (window.game && window.game.player && window.game.player.charId === charId) {
            window.game.player.setCharacter(charId);
          }
          this.updateMenuPlayerBar();
          this.renderShopItems(skinKey);
          this.showToast(sk.toast || `✨ Đã trang bị ${sk.name}!`);
        });
      }

      const buySkinBtn = sCard.querySelector('.sh-btn-buy-skin');
      if (buySkinBtn) {
        buySkinBtn.addEventListener('click', () => {
          this.click();
          this.purchaseShopSkin(skinKey, charId, skinId, sk.shopCurrency || 'diamond', skinPrice);
        });
      }

      grid.appendChild(sCard);
    });
  }

  purchaseShopSkin(skinKey, charId, skinId, currency, price) {
    if (!window.saveManager || typeof window.saveManager.buyShopSkin !== 'function') return false;
    // Skin luôn auto giao dịch bằng Kim Cương (💎)
    const enforcedCurrency = 'diamond';
    const res = window.saveManager.buyShopSkin(skinKey, charId, skinId, enforcedCurrency, price);
    if (!res || !res.ok) {
      if (res && res.reason === 'already_unlocked') {
        window.saveManager.setSkinEquipped(charId, skinId);
        this.renderShopItems(skinKey);
        return true;
      }
      if (res && res.reason === 'insufficient_diamonds') {
        const cur = window.saveManager.getDiamonds();
        this.showToast(`💎 Chưa đủ Kim Cương! Cần ${price.toLocaleString()} 💎 (Hiện có: ${cur.toLocaleString()} 💎)`);
      } else {
        this.showToast('Không thể thực hiện giao dịch trang phục!');
      }
      return false;
    }
    if (window.audioManager && typeof window.audioManager.playVictory === 'function') {
      window.audioManager.playVictory();
    }
    if (window.skeletalRenderer) window.skeletalRenderer._styles = {};
    if (window.game && window.game.player && window.game.player.charId === charId) {
      window.game.player.setCharacter(charId);
    }
    this.updateMenuPlayerBar();
    this.renderShopItems(skinKey);
    this.refreshCharSelect();
    this.showToast('🎉 ĐÃ MUA & TRANG BỊ THÀNH CÔNG: ÔNG NĂM CHÈO (ĐÌNH BÍCH LÂM) 🌊!');
    return true;
  }

  purchaseShopCharacter(charId) {
    const slot = (window.CHAR_SLOTS || []).find(s => s.id === charId);
    if (!slot || !window.saveManager) return false;

    if (this.isUnlocked(charId)) {
      this.showToast(`${slot.fullName} đã có trong đội hình của bạn!`);
      return false;
    }

    // Nhân vật luôn auto giao dịch bằng Vàng (🪙)
    const currency = 'gold';
    const price = Number(slot.shopPrice || 2500);
    const res = window.saveManager.buyShopCharacter(charId, currency, price);

    if (!res || !res.ok) {
      if (res && res.reason === 'insufficient_diamonds') {
        const cur = window.saveManager.getDiamonds();
        this.showToast(`💎 Chưa đủ Kim Cương! Cần ${price} 💎 (Hiện có: ${cur} 💎) — Hãy vượt màn chơi hoặc Liên Đấu Trùm để nhận thêm!`);
      } else if (res && res.reason === 'insufficient_gold') {
        const cur = window.saveManager.getGold();
        this.showToast(`🪙 Chưa đủ Vàng! Cần ${price.toLocaleString()} 🪙 (Hiện có: ${cur.toLocaleString()} 🪙) — Hãy vượt màn chơi hoặc Liên Đấu Trùm để nhận thêm!`);
      } else {
        this.showToast('Không thể thực hiện giao dịch!');
      }
      return false;
    }

    if (window.audioManager && typeof window.audioManager.playVictory === 'function') {
      window.audioManager.playVictory();
    }
    this.selectedChar = charId;
    window.saveManager.data.selectedCharacter = charId;
    window.saveManager.persist();

    this.updateMenuPlayerBar();
    this.renderShopItems(charId);
    this.refreshCharSelect();
    this.showToast(`🎉 ĐÃ CHIÊU MỘ THÀNH CÔNG: ${slot.fullName} (${slot.title})!`);
    return true;
  }

  // --------------------------------------------------------------------------
  // HỒ SƠ NHÂN VẬT (dossier)
  // --------------------------------------------------------------------------
  showDossier() {
    if (!this.dossierList) return;
    this.dossierList.innerHTML = '';
    const allChars = Object.values(window.CHARACTERS || {});
    const seen = new Set();
    const chars = [];
    allChars.forEach((c) => {
      if (c && c.id && !seen.has(c.id)) {
        seen.add(c.id);
        chars.push(c);
      }
    });
    chars.forEach((c) => {
      const item = document.createElement('button');
      item.className = 'dossier-item' + (c.id === this.dossierChar ? ' active' : '');
      item.textContent = c.name;
      item.addEventListener('click', () => {
        this.click();
        this.dossierChar = c.id;
        this.showDossier();
      });
      this.dossierList.appendChild(item);
    });
    this.renderDossierDetail();
    if (window.uiCore) {
      window.uiCore.hideModal('skills-equip-modal');
      window.uiCore.showModal(this.dossierModal);
    } else {
      const se = document.getElementById('skills-equip-modal');
      if (se) se.classList.add('hidden');
      this.dossierModal.classList.remove('hidden');
    }
  }

  renderDossierDetail() {
    let c = (window.CHARACTERS || {})[this.dossierChar];
    if (!c && window.CHARACTERS) {
      c = Object.values(window.CHARACTERS).find((char) => char && (char.id === this.dossierChar || char.name === this.dossierChar));
    }
    const body = this.dossierBody;
    if (!body) return;
    body.innerHTML = '';
    if (!c) {
      body.innerHTML = '<div style="padding: 24px; text-align: center; color: #94a3b8;">Đang cập nhật hồ sơ võ hiệp...</div>';
      return;
    }

    const head = document.createElement('div');
    head.className = 'dossier-head';
    head.innerHTML = `<canvas id="dossier-portrait" width="150" height="150"></canvas>
      <div class="dossier-head-text">
        <h3 class="dossier-name"></h3>
        <div class="dossier-role"></div>
        <div class="dossier-faction-line"></div>
        <div class="dossier-status"></div>
      </div>`;
    head.querySelector('.dossier-name').textContent = `${c.name} — ${c.title}`;
    head.querySelector('.dossier-role').textContent = c.role || '';
    const fac = (window.FACTIONS || {})[c.faction];
    head.querySelector('.dossier-faction-line').textContent = fac ? `PHE: ${fac.name} — ${fac.arena}` : '';
    head.querySelector('.dossier-status').textContent = c.playable
      ? (this.isUnlocked(c.id) ? 'TRẠNG THÁI: CHƠI ĐƯỢC (đã mở)' : 'TRẠNG THÁI: CHƠI ĐƯỢC — ' + this.lockText(c))
      : 'TRẠNG THÁI: ' + (c.unlock && c.unlock.text ? c.unlock.text : 'KHÔNG CHƠI ĐƯỢC');
    body.appendChild(head);
    if (window.skeletalRenderer) window.skeletalRenderer.drawPortrait(head.querySelector('canvas'), c.styleType || 'player');

    const icons = {
      'TIỂU SỬ': '📜',
      'ĐỘNG CƠ': '🎯',
      'PHONG CÁCH ĐÁNH': '🥋',
      'ĐIỂM MẠNH': '⚡',
      'ĐIỂM YẾU': '⚠️',
      'KỸ NĂNG': '⚔️',
      'TUYỆT KỸ': '🔥',
      'CƠ CHẾ CHƠI ĐƯỢC': '🛡️',
      'QUAN HỆ': '👥',
      'SỰ KIỆN CỐT TRUYỆN': '📖',
      'ĐIỀU KIỆN MỞ KHÓA': '🔓'
    };
    const section = (title, content) => {
      const el = document.createElement('div');
      el.className = 'dossier-section';
      const h = document.createElement('h4');
      const icon = icons[title] || '✦';
      h.innerHTML = `<span>${icon}</span> <span>${title}</span>`;
      el.appendChild(h);
      if (Array.isArray(content)) {
        const ul = document.createElement('ul');
        content.forEach((item) => {
          const li = document.createElement('li');
          if (typeof item === 'string') li.textContent = item;
          else { li.innerHTML = `<strong></strong> <span></span>`; li.querySelector('strong').textContent = item.name + ':'; li.querySelector('span').textContent = item.desc; }
          ul.appendChild(li);
        });
        el.appendChild(ul);
      } else {
        const p = document.createElement('p'); p.textContent = content; el.appendChild(p);
      }
      body.appendChild(el);
    };

    section('TIỂU SỬ', c.bio || '—');
    section('ĐỘNG CƠ', c.motive || '—');
    section('PHONG CÁCH ĐÁNH', c.fightingStyle || '—');
    section('ĐIỂM MẠNH', c.strengths || '—');
    section('ĐIỂM YẾU', c.weaknesses || '—');
    if (c.skills && c.skills.length) section('KỸ NĂNG', c.skills);
    if (c.ultimate) section('TUYỆT KỸ', `${c.ultimate.name} — ${c.ultimate.desc}`);
    if (c.combat && c.combat.mechanic) section('CƠ CHẾ CHƠI ĐƯỢC', c.combat.mechanic);
    if (c.relations && c.relations.length) section('QUAN HỆ', c.relations.map((r) => ({ name: r.who, desc: r.rel })));
    if (c.events && c.events.length) section('SỰ KIỆN CỐT TRUYỆN', c.events);
    section('ĐIỀU KIỆN MỞ KHÓA', this.lockText(c));
  }

  // --------------------------------------------------------------------------
  // BỘ SƯU TẬP (boss đã hạ, kết thúc, nhiệm vụ)
  // --------------------------------------------------------------------------
  showCollection() {
    const body = this.collectionBody;
    if (!body) return;
    const sm = window.saveManager;
    body.innerHTML = '';

    const block = (title, items) => {
      const wrap = document.createElement('div');
      wrap.className = 'collection-block';
      const h = document.createElement('h4'); h.textContent = title;
      wrap.appendChild(h);
      const grid = document.createElement('div'); grid.className = 'collection-grid';
      items.forEach((it) => {
        const cell = document.createElement('div');
        cell.className = 'collection-cell' + (it.on ? ' on' : ' off');
        cell.innerHTML = '<span class="cell-mark"></span><span class="cell-text"></span>';
        cell.querySelector('.cell-mark').textContent = it.on ? '★' : '☆';
        cell.querySelector('.cell-text').textContent = it.text;
        if (it.tip) cell.title = it.tip;
        grid.appendChild(cell);
      });
      wrap.appendChild(grid);
      body.appendChild(wrap);
    };

    // Boss
    const bossIds = ['haclang', 'thietquyen', 'huyetanh', 'longvuong', 'bichlam', 'dunghai', 'hoanganh', 'dinhan', 'vinhtam', 'giangmanh'];
    block('BOSS ĐÃ HẠ', bossIds.map((id) => {
      const c = (window.CHARACTERS || {})[id];
      return { text: c ? c.name : id, on: sm ? sm.data.bossesDefeated.includes(id) : false, tip: c ? c.title : '' };
    }));

    // Kết thúc
    block('BỐN KẾT THÚC', (window.STORY_META ? window.STORY_META.endings : []).map((e) => ({
      text: e.name, on: sm ? sm.data.endings.includes(e.id) : false, tip: e.conditionText
    })));

    // Nhiệm vụ phụ
    const missions = (window.STORY_META ? window.STORY_META.stages : {});
    block('NHIỆM VỤ PHỤ', Object.values(missions).filter((s) => s.type === 'side').map((s) => ({
      text: s.title, on: sm ? sm.data.missionsDone.includes('side_' + s.id) || sm.data.missionsDone.includes('escape_' + s.id) : false,
      tip: s.mission
    })));

    // Lựa chọn đã đưa ra
    block('LỰA CHỌN CỐT TRUYỆN', ['rescue', 'mountain', 'danghai'].map((k) => {
      const c = (window.STORY_META && window.STORY_META.choices[k]) || null;
      const v = sm ? sm.getChoice(k) : null;
      const opt = c && v && c.options.find((o) => o.id === v);
      return { text: c ? c.label : k, on: !!opt, tip: opt ? opt.text : 'Chưa đưa ra lựa chọn này' };
    }));

    if (window.uiCore) {
      window.uiCore.hideModal('skills-equip-modal');
      window.uiCore.showModal(this.collectionModal);
    } else {
      const se = document.getElementById('skills-equip-modal');
      if (se) se.classList.add('hidden');
      this.collectionModal.classList.remove('hidden');
    }
  }

  // --------------------------------------------------------------------------
  // THÀNH TÍCH (ACHIEVEMENTS)
  // --------------------------------------------------------------------------
  showAchievements() {
    if (!this.achList) return;
    const sm = window.saveManager;
    this.achList.innerHTML = '';
    const all = window.STORY_META ? window.STORY_META.achievements : [];
    let unlocked = 0;

    all.forEach(a => {
      if (sm && sm.hasAchievement(a.id)) unlocked++;
    });

    const header = document.createElement('div');
    header.style.cssText = 'padding: 10px 14px; margin-bottom: 10px; background: rgba(229,169,60,0.12); border: 1px solid rgba(229,169,60,0.35); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;';
    header.innerHTML = `
      <span style="font-weight: 800; color: #ffd700; font-size: 13px;">🏆 TIẾN ĐỘ THÀNH TỰU: ${unlocked} / ${all.length} CÚP</span>
      <span style="color: #38bdf8; font-weight: 900; font-size: 13px;">${Math.round((unlocked / (all.length || 1)) * 100)}%</span>
    `;
    this.achList.appendChild(header);

    all.forEach((a) => {
      const on = sm ? sm.hasAchievement(a.id) : false;
      const row = document.createElement('div');
      row.className = 'ach-row' + (on ? ' unlocked' : ' locked');
      row.innerHTML = `<span class="ach-mark"></span><span class="ach-text"><strong></strong><em></em></span>`;
      row.querySelector('.ach-mark').textContent = on ? '🏆' : '🔒';
      row.querySelector('strong').textContent = a.name;
      row.querySelector('em').textContent = a.desc;
      this.achList.appendChild(row);
    });
    if (window.uiCore) {
      window.uiCore.hideModal('skills-equip-modal');
      window.uiCore.showModal(this.achModal);
    } else {
      const se = document.getElementById('skills-equip-modal');
      if (se) se.classList.add('hidden');
      this.achModal.classList.remove('hidden');
    }
  }

  // --------------------------------------------------------------------------
  // KHO ĐỒ, VÕ PHỤC & KỸ NĂNG (STUDIO ARCHITECTURE — DỮ LIỆU THỰC 100%)
  // --------------------------------------------------------------------------
  showSkillsEquip(initialTab) {
    const modal = document.getElementById('skills-equip-modal');
    if (!modal) return;
    if (typeof this.hideAll === 'function') this.hideAll();
    if (!this._khoHeroId) {
      this._khoHeroId = (window.saveManager && window.saveManager.data.selectedCharacter) || this.selectedChar || 'nghi';
    }
    if (initialTab) this._khoActiveTab = initialTab;
    else if (!this._khoActiveTab) this._khoActiveTab = 'outfits';

    this._bindKhoDoEvents();
    this._renderKhoDoTab(this._khoActiveTab);

    if (window.uiCore) window.uiCore.showModal(modal);
    else modal.classList.remove('hidden');
  }

  _bindKhoDoEvents() {
    const tabsBar = document.getElementById('kho-tabs-bar');
    if (tabsBar && !tabsBar.__vovKhoBound) {
      tabsBar.__vovKhoBound = true;
      tabsBar.addEventListener('click', (ev) => {
        const btn = ev.target.closest ? ev.target.closest('.kho-tab-btn') : null;
        if (!btn) return;
        this.click();
        const tab = btn.getAttribute('data-kho-tab') || 'outfits';
        this._renderKhoDoTab(tab);
      });
    }
    const outfitCards = document.getElementById('kho-outfit-cards');
    if (outfitCards && !outfitCards.__vovKhoOutfitBound) {
      outfitCards.__vovKhoOutfitBound = true;
      outfitCards.addEventListener('click', (ev) => {
        const actBtn = ev.target.closest ? ev.target.closest('[data-kho-equip-skin]') : null;
        if (!actBtn) return;
        const skinId = actBtn.getAttribute('data-kho-equip-skin');
        const charId = this._khoHeroId || 'nghi';
        if (charId !== 'nghi' && typeof this.isUnlocked === 'function' && !this.isUnlocked(charId)) {
          this.showToast('🔒 Vui lòng mở khóa võ sĩ này để trang bị võ phục!');
          return;
        }
        if (skinId && skinId !== 'default' && skinId !== 'vovinam' && window.saveManager && typeof window.saveManager.isSkinUnlocked === 'function' && !window.saveManager.isSkinUnlocked(charId, skinId)) {
          this.click();
          this.showToast('🛒 Vui lòng mua trang phục này tại Cửa Hàng Gia Tộc!');
          if (typeof this.showShop === 'function') {
            this.showShop(`skin_${charId}_${skinId}`);
          }
          return;
        }
        this.click();
        if (window.saveManager && typeof window.saveManager.setSkinEquipped === 'function') {
          window.saveManager.setSkinEquipped(charId, skinId);
        }
        if (window.skeletalRenderer) window.skeletalRenderer._styles = {};
        if (window.game && window.game.player && window.game.player.charId === charId) {
          window.game.player.setCharacter(charId);
        }
        const skInfo = (window.SkinRegistry && typeof window.SkinRegistry.getSkin === 'function')
          ? window.SkinRegistry.getSkin(charId, skinId)
          : null;
        this.showToast((skInfo && skInfo.toast) || '👕 Đã cập nhật trang phục!');
        this._renderKhoOutfits();
      });
    }
    const heroRail = document.getElementById('kho-hero-rail');
    if (heroRail && !heroRail.__vovKhoRailBound) {
      heroRail.__vovKhoRailBound = true;
      heroRail.addEventListener('click', (ev) => {
        const chip = ev.target.closest ? ev.target.closest('[data-kho-hero]') : null;
        if (!chip) return;
        const id = chip.getAttribute('data-kho-hero');
        if (!id) return;
        this.click();
        this._khoHeroId = id;
        this._renderKhoOutfits();
        if (this._khoActiveTab === 'techniques') this._renderKhoTechniques();
      });
    }
  }

  _renderKhoDoTab(tabName) {
    this._khoActiveTab = tabName || 'outfits';
    const tabsBar = document.getElementById('kho-tabs-bar');
    if (tabsBar && typeof tabsBar.querySelectorAll === 'function') {
      tabsBar.querySelectorAll('.kho-tab-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-kho-tab') === this._khoActiveTab);
      });
    }
    const panels = {
      outfits: document.getElementById('kho-panel-outfits'),
      weapons: document.getElementById('kho-panel-weapons'),
      techniques: document.getElementById('kho-panel-techniques'),
      archives: document.getElementById('kho-panel-archives')
    };
    Object.keys(panels).forEach((k) => {
      if (panels[k]) panels[k].classList.toggle('hidden', k !== this._khoActiveTab);
    });

    if (this._khoActiveTab === 'outfits') this._renderKhoOutfits();
    else if (this._khoActiveTab === 'weapons') this._renderKhoWeapons();
    else if (this._khoActiveTab === 'techniques') this._renderKhoTechniques();
    else if (this._khoActiveTab === 'archives') this._renderKhoArchives();
  }

  _renderKhoOutfits() {
    const slots = (window.CHAR_SLOTS || []).filter((s) => !s.isLocked);
    if (slots.length === 0) return;
    const slot = slots.find((s) => s.id === this._khoHeroId) || slots[0];
    this._khoHeroId = slot.id;

    const pill = document.getElementById('kho-active-hero-pill');
    if (pill) pill.textContent = `${slot.element || '🥋'} ${slot.slotName || slot.name}`;

    const rail = document.getElementById('kho-hero-rail');
    if (rail) {
      if (!this._khoRailCache) this._khoRailCache = {};
      slots.forEach((s) => {
        let chip = this._khoRailCache[s.id];
        if (!chip) {
          chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'kho-hero-chip';
          chip.setAttribute('data-kho-hero', s.id);
          chip.innerHTML = `<span class="kho-chip-ico">${s.element || '🥋'}</span><span class="kho-chip-name">${s.slotName}</span><span class="kho-chip-badge"></span>`;
          this._khoRailCache[s.id] = chip;
          rail.appendChild(chip);
        }
        const unlocked = typeof this.isUnlocked === 'function' ? this.isUnlocked(s.id) : true;
        const isVov = s.id !== 'nghi' && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(s.id, 'vovinam');
        chip.classList.toggle('active', s.id === slot.id);
        chip.classList.toggle('locked', !unlocked);
        const badge = chip.querySelector ? chip.querySelector('.kho-chip-badge') : null;
        if (badge) {
          badge.textContent = !unlocked ? '🔒' : (isVov ? 'LAM PHỤC' : '');
        }
      });
    }

    const equippedId = slot.id === 'nghi'
      ? 'default'
      : ((window.saveManager && typeof window.saveManager.getEquippedSkin === 'function')
        ? window.saveManager.getEquippedSkin(slot.id)
        : ((window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(slot.id, 'vovinam')) ? 'vovinam' : 'default'));
    const skins = typeof this.getSkinsForChar === 'function' ? this.getSkinsForChar(slot) : [];
    const activeSkin = skins.find((sk) => sk.id === equippedId) || skins[0];

    const previewImg = document.getElementById('kho-outfit-preview-img');
    const targetSrc = typeof this.resolveHeroSkinImage === 'function'
      ? this.resolveHeroSkinImage(slot, equippedId)
      : ((activeSkin && activeSkin.image) ? activeSkin.image : (slot.image || ''));
    if (previewImg && targetSrc) {
      if (window.uiCore && typeof window.uiCore.swapImage === 'function') {
        window.uiCore.swapImage(previewImg, targetSrc);
      } else {
        previewImg.src = targetSrc;
      }
      previewImg.alt = slot.fullName || slot.slotName;
    }

    const heroNameEl = document.getElementById('kho-outfit-hero-name');
    const heroRoleEl = document.getElementById('kho-outfit-hero-role');
    if (heroNameEl) heroNameEl.textContent = slot.fullName || slot.slotName;
    if (heroRoleEl) heroRoleEl.textContent = `${slot.title || ''} — ${slot.tagline || ''}`;

    const cardsBox = document.getElementById('kho-outfit-cards');
    if (cardsBox) {
      const unlocked = typeof this.isUnlocked === 'function' ? this.isUnlocked(slot.id) : true;
      cardsBox.innerHTML = skins.map((sk) => {
        const isEq = sk.id === equippedId;
        const isSkinOwned = !sk.shopSkin || (window.saveManager && typeof window.saveManager.isSkinUnlocked === 'function' && window.saveManager.isSkinUnlocked(slot.id, sk.id));
        const fxChips = (sk.fx || []).map((t) => `<span class="kho-fx-tag">${t}</span>`).join('');
        const btnText = !unlocked && slot.id !== 'nghi'
          ? '🔒 CHƯA MỞ KHÓA'
          : (!isSkinOwned
            ? `💎 MUA TẠI SHOP (${Number(sk.shopPrice || 150).toLocaleString()} KIM CƯƠNG)`
            : (isEq ? 'ĐANG TRANG BỊ' : 'MẶC VÕ PHỤC NÀY'));
        const rarityCls = `rarity-${sk.rarity || sk.badgeClass || 'default'}`;
        return `
          <div class="kho-outfit-card ${rarityCls} ${isEq ? 'equipped' : ''}">
            <div class="kho-outfit-card-head">
              <span class="kho-tier-chip ${sk.badgeClass || ''}">${sk.tier || 'TRANG PHỤC'}</span>
              <span class="kho-eq-status ${isEq ? 'on' : ''}">${isEq ? '✓ ĐANG MẶC' : (isSkinOwned ? 'CHƯA MẶC' : 'CHƯA SỞ HỮU')}</span>
            </div>
            <div class="kho-outfit-card-name">${sk.name}</div>
            <p class="kho-outfit-card-desc">${sk.sub || ''}</p>
            <div class="kho-fx-row">${fxChips}</div>
            <div class="kho-outfit-card-actions">
              <button type="button" class="btn ${isEq ? 'btn-secondary' : 'btn-primary'} kho-equip-btn" data-kho-equip-skin="${sk.id}" ${isEq ? 'disabled' : ''}>
                ${btnText}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  _renderKhoWeapons() {
    const grid = document.getElementById('kho-weapons-grid');
    if (!grid) return;
    const defs = window.WEAPON_DEFS || {};
    const atks = window.PLAYER_ATTACKS || {};
    const keys = Object.keys(defs);
    if (keys.length === 0) {
      grid.innerHTML = '<div class="kho-empty">Đang đồng bộ kho vũ khí...</div>';
      return;
    }
    const calcBoxReach = (atk) => {
      if (!atk || typeof atk.box !== 'function') return null;
      try {
        const b = atk.box(1);
        return b ? Math.round((b.offsetX || 0) + (b.width || 0)) : null;
      } catch (_) { return null; }
    };
    grid.innerHTML = keys.map((key) => {
      const w = defs[key];
      const lightKey = Array.isArray(w.light) && w.light[0];
      const heavyKey = Array.isArray(w.heavy) && w.heavy[0];
      const lightAtk = lightKey ? atks[lightKey] : null;
      const heavyAtk = heavyKey ? atks[heavyKey] : null;
      const lightDmg = lightAtk ? lightAtk.damage : null;
      const heavyDmg = heavyAtk ? heavyAtk.damage : null;
      const lightReach = calcBoxReach(lightAtk);
      const heavyReach = calcBoxReach(heavyAtk);
      const poiseDmg = (heavyAtk && heavyAtk.bossPoiseDmg) || (lightAtk && lightAtk.bossPoiseDmg) || 0;
      const hasCombatMoves = !!(lightAtk || heavyAtk);
      const weaponIconMarkup = (window.weaponSystem && typeof window.weaponSystem.getIconSvg === 'function')
        ? window.weaponSystem.getIconSvg(key)
        : (w.effectIcon || '⚔️');
      const footHint = key === 'shield'
        ? 'Giữ [U] đỡ khiên giảm sâu sát thương · [E] Nhặt / Phi khiên.'
        : (w.pickable ? 'Nhặt bằng [E] khi đánh rơi địch · [E] Phi gây bạo kích.' : 'Trang bị riêng cho đội quân Khiên Giáp.');
      return `
        <article class="kho-weapon-card" style="--w-accent: ${w.color || '#facc15'};">
          <div class="kho-weapon-head">
            <span class="kho-weapon-badge">${weaponIconMarkup}</span>
            <div>
              <h4 class="kho-weapon-name">${w.name}</h4>
              <span class="kho-weapon-sub">${w.effectName || 'Vũ khí cận chiến'}</span>
            </div>
            <span class="kho-weapon-mode">${w.pickable ? 'Nhặt được' : 'Chuyên dụng'}</span>
          </div>
          <div class="kho-weapon-stats">
            <div class="kho-wstat"><span>Độ Bền</span><strong>${w.durability ? `${w.durability} đòn` : 'Độ bền cao'}</strong></div>
            <div class="kho-wstat"><span>Đánh Nhẹ [J]</span><strong>${lightDmg ? `${lightDmg} dmg${lightReach ? ` · ${lightReach}px` : ''}` : 'Chặn đòn trực diện'}</strong></div>
            <div class="kho-wstat"><span>Đánh Nặng [K]</span><strong>${heavyDmg ? `${heavyDmg} dmg${heavyReach ? ` · ${heavyReach}px` : ''}` : 'Đẩy lùi áp sát'}</strong></div>
            <div class="kho-wstat"><span>Phá Poise Boss</span><strong>${poiseDmg ? `+${poiseDmg}` : (hasCombatMoves ? 'Trung bình' : 'Chuyên phòng thủ')}</strong></div>
          </div>
          <p class="kho-weapon-foot">Hiệu ứng: <strong>${w.effectName || 'Xung kích'}</strong> · ${footHint}</p>
        </article>
      `;
    }).join('');
  }

  _renderKhoTechniques() {
    const slots = (window.CHAR_SLOTS || []).filter((s) => !s.isLocked);
    const slot = slots.find((s) => s.id === this._khoHeroId) || slots[0];
    if (!slot) return;
    const pill = document.getElementById('kho-active-hero-pill');
    if (pill) pill.textContent = `${slot.element || '🥋'} ${slot.slotName || slot.name}`;
    const titleEl = document.getElementById('kho-tech-hero-title');
    const mechEl = document.getElementById('kho-tech-mechanic');
    if (titleEl) titleEl.textContent = `VÕ CÔNG: ${(slot.fullName || slot.slotName || '').toUpperCase()}`;
    if (mechEl) mechEl.textContent = slot.mechanic || '';

    const skList = document.getElementById('kho-tech-skills-list');
    if (skList) {
      skList.innerHTML = (slot.skills || []).map((sk) => `
        <div class="cs-skill-card kho-skill-item">
          <span class="cs-skill-key">${sk.key || '✦'}</span>
          <div class="cs-skill-info">
            <span class="cs-skill-name">${sk.name}</span>
            <span class="cs-skill-desc">${sk.desc}</span>
          </div>
        </div>
      `).join('');
    }
    const pList = document.getElementById('kho-tech-passives-list');
    if (pList) {
      pList.innerHTML = (slot.passives || []).map((p) => `
        <div class="cs-passive-card kho-passive-item">
          <div class="cs-passive-icon-circle">${p.icon}</div>
          <div class="cs-passive-info">
            <div class="cs-passive-header-row">
              <span class="cs-passive-name">${p.name}</span>
              <span class="cs-passive-tag ${p.type && p.type.includes('CHỦ ĐỘNG') ? 'active' : 'passive'}">${p.type}</span>
            </div>
            <div class="cs-passive-desc">${p.desc}</div>
          </div>
        </div>
      `).join('');
    }
  }

  _renderKhoArchives() {
    const sum = document.getElementById('kho-archives-summary');
    if (!sum || !window.saveManager) return;
    const d = window.saveManager.data;
    const totalChars = (window.CHAR_SLOTS || []).filter((s) => !s.isLocked).length || 9;
    const unlockedChars = (window.CHAR_SLOTS || []).filter((s) => !s.isLocked && (typeof this.isUnlocked === 'function' ? this.isUnlocked(s.id) : true)).length;
    const totalAch = (window.STORY_META && Array.isArray(window.STORY_META.achievements)) ? window.STORY_META.achievements.length : 12;
    const totalStages = (window.STORY_META && Array.isArray(window.STORY_META.stages)) ? window.STORY_META.stages.length : 10;
    sum.innerHTML = `
      <div class="kho-sum-card"><strong>${unlockedChars} / ${totalChars}</strong><span>Võ Sĩ Mở Khóa</span></div>
      <div class="kho-sum-card"><strong>${(d.completedStages || []).length} / ${totalStages}</strong><span>Màn Đã Phá</span></div>
      <div class="kho-sum-card"><strong>${(d.achievements || []).length} / ${totalAch}</strong><span>Thành Tựu Gia Tộc</span></div>
      <div class="kho-sum-card"><strong>${(d.endings || []).length} / 4</strong><span>Kết Cục Cốt Truyện</span></div>
    `;
  }
}

window.MenuManagerCollections = MenuManagerCollections;
