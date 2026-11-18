/**
 * VOVINAM: SÁT THẦN GIẢI CỨU HỨA VŨ ĐẠI
 * js/ui.js - HUD Controller, Dialogue Typewriter, Menus & Victory Modals
 */

class UIManager {
  constructor() {
    // DOM Elements Cache
    this.hud = document.getElementById('hud');
    this.playerHpFill = document.getElementById('player-hp-fill');
    this.playerHpDelay = document.getElementById('player-hp-delay');
    this.playerHpText = document.getElementById('player-hp-text');

    this.playerEnergyFill = document.getElementById('player-energy-fill');
    this.playerEnergyText = document.getElementById('player-energy-text');
    this.ultimateBadge = document.getElementById('ultimate-ready-badge');

    // Flow & Overdrive HUD (Legacy / Cleaned)
    this.playerFlowShell = null;
    this.playerFlowFill = null;
    this.playerFlowText = null;
    this.overdriveBadge = null;

    this.objectiveText = document.getElementById('objective-text');

    // Boss HUD
    this.bossHud = document.getElementById('boss-hud');
    this.bossName = document.getElementById('boss-name');
    this.bossTitle = document.getElementById('boss-title');
    this.bossHpFill = document.getElementById('boss-hp-fill');
    this.bossHpDelay = document.getElementById('boss-hp-delay');
    this.bossHpText = document.getElementById('boss-hp-text');
    this.bossPoiseShell = document.getElementById('boss-poise-shell');
    this.bossPoiseFill = document.getElementById('boss-poise-fill');
    this.bossPoiseText = document.getElementById('boss-poise-text');
    this.bossPhaseMarkers = document.getElementById('boss-phase-markers');
    this.bossAvatarIcon = document.getElementById('boss-avatar-icon');

    // Combo Tracker
    this.comboTracker = document.getElementById('combo-tracker');
    this.comboCount = document.getElementById('combo-count');
    this.comboRank = document.getElementById('combo-rank');
    this.comboTimerBar = document.getElementById('combo-timer-bar');

    // Alert Banner
    this.alertBanner = document.getElementById('alert-banner');
    this.alertText = document.getElementById('alert-text');

    // Dialogue Box
    this.dialogueBox = document.getElementById('dialogue-box');
    this.dialogueSpeakerName = document.getElementById('dialogue-speaker-name');
    this.dialogueText = document.getElementById('dialogue-text');
    this.dialogueAvatar = document.getElementById('dialogue-avatar');

    // Screens & Modals
    this.titleScreen = document.getElementById('title-screen');
    this.controlsModal = document.getElementById('controls-modal');
    this.pauseModal = document.getElementById('pause-modal');
    this.stageClearModal = document.getElementById('stage-clear-modal');
    this.gameOverModal = document.getElementById('game-over-modal');
    this.grandVictoryModal = document.getElementById('grand-victory-modal');

    // Mới: HUD tên nhân vật, ra mắt boss, lựa chọn cốt truyện, kết thúc, toast
    this.hudCharName = document.getElementById('hud-char-name');
    this.hudCharTitle = document.getElementById('hud-char-title');
    this.bossIntroCard = document.getElementById('boss-intro-card');
    this.choiceModal = document.getElementById('choice-modal');
    this.choiceQuestion = document.getElementById('choice-question');
    this.choiceLabel = document.getElementById('choice-label');
    this.choiceOptions = document.getElementById('choice-options');
    this.endingModal = document.getElementById('ending-modal');
    this.toastStack = document.getElementById('toast-stack');
    this.bossIntroTimer = null;
    this.choiceCallback = null;

    // Quick Audio
    this.quickAudioBtn = document.getElementById('btn-quick-audio');

    // Internal typewriter timer
    this.typingTimer = null;
    this.fullTextToType = '';
    this.typedIndex = 0;

    // Chân dung nhân vật vẽ bằng canvas
    this.playerPortrait = document.getElementById('player-portrait');
    this.hudPassiveWidget = document.getElementById('hud-passive-widget');
    this.hudPassiveOrb = document.getElementById('hud-passive-orb');
    this.hudPassiveName = document.getElementById('hud-passive-name');
    this.hudPassiveState = document.getElementById('hud-passive-state');
    this.hudPassivePips = document.getElementById('hud-passive-pips');
    this.badgeStanceWu = document.getElementById('badge-stance-wu');
    this.cdStanceWuText = document.getElementById('cd-stance-wu-text');
    this.labelStanceWu = document.getElementById('label-stance-wu');
    this.labelDodge = document.getElementById('label-dodge');
    this.labelCounterHand = document.getElementById('label-counter-hand');
    this.labelCounterLeg = document.getElementById('label-counter-leg');
    this.hudDebuffsBar = document.getElementById('hud-debuffs-bar');
    this.bossDebuffsBar = document.getElementById('boss-debuffs-bar');
    const curChar = (window.saveManager && window.saveManager.data && window.saveManager.data.selectedCharacter) || 'nghi';
    const initPortraitType = this.portraitType(curChar);
    if (window.skeletalRenderer) window.skeletalRenderer.drawPortrait(this.playerPortrait, initPortraitType);
  }

  // Map loại avatar trong kịch bản -> kiểu nhân vật
  portraitType(avatarType) {
    const map = {
      nghi: 'player', haclang: 'boss_haclang', thietquyen: 'boss_thietquyen',
      huyetanh: 'boss_huyetanh', longvuong: 'boss_longvuong', huavudai: 'npc_huavudai',
      // Nhân vật mới
      bichlam: 'boss_bichlam', dunghai: 'boss_dunghai', hoanganh: 'boss_hoanganh',
      dinhan: 'boss_dinhan', vinhtam: 'boss_vinhtam', giangmanh: 'boss_giangmanh',
      mocdang: 'npc_mocdang'
    };
    return map[avatarType] || avatarType || 'player';
  }

  // Cập nhật HUD theo nhân vật đang điều khiển
  setCharacterHUD(char) {
    if (!char) return;
    if (!this.playerPortrait) this.playerPortrait = document.getElementById('player-portrait');
    if (this.hudCharName) this.hudCharName.textContent = (char.name || '').toUpperCase();
    if (this.hudCharTitle) this.hudCharTitle.textContent = (char.title || '').toUpperCase();
    
    const charKey = char.charId || char.characterId || (window.saveManager && window.saveManager.data && window.saveManager.data.selectedCharacter) || 'nghi';
    const pType = char.styleType || this.portraitType(charKey);
    const equippedSkin = charKey !== 'nghi' && window.saveManager && typeof window.saveManager.getEquippedSkin === 'function'
      ? window.saveManager.getEquippedSkin(charKey)
      : (charKey !== 'nghi' && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(charKey, 'vovinam') ? 'vovinam' : 'default');
    const isVovinam = equippedSkin === 'vovinam';
    
    if (window.skeletalRenderer && this.playerPortrait) {
      window.skeletalRenderer.drawPortrait(this.playerPortrait, pType, false, isVovinam, equippedSkin);
    }

    // Cập nhật màu đai HUD (.avatar-belt) theo nhân vật
    const beltEl = (typeof document !== 'undefined' && typeof document.querySelector === 'function') ? document.querySelector('.player-avatar .avatar-belt') : null;
    if (beltEl) {
      const beltColors = {
        nghi: 'linear-gradient(90deg, #cbd5e1, #ffffff, #f1f5f9)',
        dunghai: 'linear-gradient(90deg, #7f1d1d, #ef4444, #991b1b)',
        bichlam: 'linear-gradient(90deg, #14532d, #22c55e, #16a34a)',
        hoanganh: 'linear-gradient(90deg, #78350f, #f59e0b, #d97706)',
        dinhan: 'linear-gradient(90deg, #334155, #64748b, #475569)',
        huavudai: 'linear-gradient(90deg, #581c87, #a855f7, #7e22ce)',
        giangmanh: 'linear-gradient(90deg, #4c1d95, #8b5cf6, #6d28d9)',
        vananh: 'linear-gradient(90deg, #92400e, #f59e0b, #fbbf24)',
        tiendang: 'linear-gradient(90deg, #0369a1, #22d3ee, #38bdf8)',
        thienkhanh: 'linear-gradient(90deg, #7f1d1d, #dc2626, #f59e0b)'
      };
      beltEl.style.background = beltColors[charKey] || beltColors.nghi;
      beltEl.style.boxShadow = `0 0 8px ${charKey === 'dunghai' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 255, 255, 0.85)'}`;
    }

    // Nhãn năng lượng theo nhân vật (Hứa Vũ Đại không dùng thuật ngữ Vovinam)
    const label = (char.charId || char.characterId) === 'nghi' ? 'VOVINAM' : 'NĂNG LƯỢNG';
    const energyText = document.getElementById('player-energy-text');
    if (energyText && energyText.dataset.kind !== (char.charId || char.characterId)) {
      energyText.dataset.kind = (char.charId || char.characterId) || '';
      energyText.dataset.label = label;
    }
    if (typeof char.hp === 'number' && typeof char.maxHp === 'number' && this.playerHpFill && this.playerHpText) {
      this.updatePlayerHp(char.hp, char.maxHp);
    }
    this.updatePlayerEnergy(char.energy, char.maxEnergy);
    this.updatePassiveHUD(char);
  }

  showHUD() {
    this.hud.classList.remove('hidden');
    const topControls = document.getElementById('top-controls');
    if (topControls) topControls.classList.remove('hidden');
    // Luôn ẩn Boss HUD nếu không có boss đang chiến đấu hoặc đang trong Võ Đường
    if (!window.game || !window.game.currentBoss || window.game.currentBoss.isDead || window.game.state === 'TRAINING') {
      this.hideBossHUD();
    }
    if (window.game && window.game.player) {
      this.setCharacterHUD(window.game.player);
    } else if (window.skeletalRenderer) {
      if (!this.playerPortrait) this.playerPortrait = document.getElementById('player-portrait');
      if (this.playerPortrait) {
        const curChar = (window.saveManager && window.saveManager.data && window.saveManager.data.selectedCharacter) || 'nghi';
        const pType = this.portraitType(curChar);
        const eqSkin = curChar !== 'nghi' && window.saveManager && typeof window.saveManager.getEquippedSkin === 'function'
          ? window.saveManager.getEquippedSkin(curChar)
          : (curChar !== 'nghi' && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(curChar, 'vovinam') ? 'vovinam' : 'default');
        window.skeletalRenderer.drawPortrait(this.playerPortrait, pType, false, eqSkin === 'vovinam', eqSkin);
      }
    }
    this.updateSkillCooldowns();
  }

  hideHUD() {
    this.hud.classList.add('hidden');
    this.hideBossHUD();
    const topControls = document.getElementById('top-controls');
    if (topControls) topControls.classList.add('hidden');
    if (this.hudWeaponCard) this.hudWeaponCard.classList.add('hidden');
    if (this.hudDebuffsBar) this.hudDebuffsBar.classList.add('hidden');
  }

  // Cập nhật Thanh Máu Người Chơi (với Chip Damage Delay)
  updatePlayerHp(currentHp, maxHp) {
    const percent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
    this.playerHpFill.style.width = percent + '%';
    this.playerHpText.textContent = `${Math.round(currentHp)} / ${maxHp}`;

    // Hiệu ứng delay giảm dần
    setTimeout(() => {
      if (this.playerHpDelay) {
        this.playerHpDelay.style.width = percent + '%';
      }
    }, 280);
  }

  // Cập nhật Thanh Năng Lượng Vovinam
  updatePlayerEnergy(currentEnergy, maxEnergy) {
    const safeCur = (typeof currentEnergy === 'number' && Number.isFinite(currentEnergy)) ? currentEnergy : 0;
    const safeMax = (typeof maxEnergy === 'number' && Number.isFinite(maxEnergy)) ? maxEnergy : 100;
    const rawPct = safeMax > 0 ? (safeCur / safeMax) * 100 : 0;
    const percent = Number.isFinite(rawPct) ? Math.max(0, Math.min(100, rawPct)) : 0;
    if (this.playerEnergyFill) this.playerEnergyFill.style.width = percent + '%';
    const label = (this.playerEnergyText && this.playerEnergyText.dataset && this.playerEnergyText.dataset.label) || 'VOVINAM';
    if (this.playerEnergyText) this.playerEnergyText.textContent = `${label}: ${Math.round(percent)}%`;

    if (this.ultimateBadge) {
      if (percent >= 100 && safeMax > 0) {
        this.ultimateBadge.classList.remove('hidden');
      } else {
        this.ultimateBadge.classList.add('hidden');
      }
    }
  }

  // Cập nhật Thanh Nhịp Võ & Bùng Nổ (Đã dọn dẹp theo yêu cầu)
  updateFlow(flow = 0, maxFlow = 100, isOverdrive = false) {}
  pulseFlow() {}
  updateOverdriveTimer(timer = 0, maxTimer = 6.5) {}

  updateDodgeCooldown(cd = 0) {
    if (!this.badgeDodge) this.badgeDodge = document.getElementById('badge-dodge');
    if (!this.cdDodgeText) this.cdDodgeText = document.getElementById('cd-dodge-text');
    if (this.badgeDodge && this.cdDodgeText) {
      if (cd > 0) {
        this.badgeDodge.classList.remove('ready');
        this.badgeDodge.classList.add('cooldown');
        this.cdDodgeText.textContent = `${cd.toFixed(1)}s`;
      } else {
        this.badgeDodge.classList.remove('cooldown');
        this.badgeDodge.classList.add('ready');
        this.cdDodgeText.textContent = 'SẴN SÀNG';
      }
    }
  }

  _syncCooldownBadge(badgeEl, textEl, cacheKey, cd) {
    if (!badgeEl || !textEl) return;
    const isCd = cd > 0;
    const label = isCd ? `${cd.toFixed(1)}s` : 'SẴN SÀNG';
    if (this[cacheKey] === label) return;
    this[cacheKey] = label;
    if (badgeEl.classList) {
      badgeEl.classList.toggle('cooldown', isCd);
      badgeEl.classList.toggle('ready', !isCd);
    }
    textEl.textContent = label;
  }

  // Đồng bộ thời gian hồi chiêu kỹ năng Vovinam lên HUD
  updateSkillCooldowns(player) {
    if (!player) return;

    // Né Thân Pháp (L) — Hồi chiêu 8.0s
    if (!this.badgeDodge) this.badgeDodge = document.getElementById('badge-dodge');
    if (!this.cdDodgeText) this.cdDodgeText = document.getElementById('cd-dodge-text');
    this._syncCooldownBadge(this.badgeDodge, this.cdDodgeText, '_lastCdDodge', player.dodgeCooldown || 0);

    // Phản Đòn Tay Vovinam (U + J) — Hồi chiêu 2.5s
    if (!this.badgeCounterHand) this.badgeCounterHand = document.getElementById('badge-counter-hand');
    if (!this.cdCounterHandText) this.cdCounterHandText = document.getElementById('cd-counter-hand-text');
    this._syncCooldownBadge(this.badgeCounterHand, this.cdCounterHandText, '_lastCdHand', player.counterHandCooldown || 0);

    // Phản Đòn Chân Vovinam (U + K) — Hồi chiêu 3.5s
    if (!this.badgeCounterLeg) this.badgeCounterLeg = document.getElementById('badge-counter-leg');
    if (!this.cdCounterLegText) this.cdCounterLegText = document.getElementById('cd-counter-leg-text');
    this._syncCooldownBadge(this.badgeCounterLeg, this.cdCounterLegText, '_lastCdLeg', player.counterLegCooldown || 0);

    // Thế Chiêu Đặc Trưng (W + U) — Hồi chiêu 6.0s
    if (!this.badgeStanceWu) this.badgeStanceWu = document.getElementById('badge-stance-wu');
    if (!this.cdStanceWuText) this.cdStanceWuText = document.getElementById('cd-stance-wu-text');
    this._syncCooldownBadge(this.badgeStanceWu, this.cdStanceWuText, '_lastCdWu', player.stanceSkillCooldown || 0);

    // Đồng bộ Cục Nội Tại & Nhãn chiêu theo từng nhân vật
    this.updatePassiveHUD(player);

    // Đồng bộ Card vũ khí cầm tay trên HUD
    this.updateWeaponHUD(player);
  }

  // Cập nhật Cục Nội Tại & Tích Tầng trực quan dưới thanh Máu/Năng Lượng
  updatePassiveHUD(player) {
    if (!player || !window.CharacterRegistry || typeof window.CharacterRegistry.getPassiveHudStatus !== 'function') return;
    if (!this.hudPassiveWidget) this.hudPassiveWidget = document.getElementById('hud-passive-widget');
    if (!this.hudPassiveOrb) this.hudPassiveOrb = document.getElementById('hud-passive-orb');
    if (!this.hudPassiveName) this.hudPassiveName = document.getElementById('hud-passive-name');
    if (!this.hudPassiveState) this.hudPassiveState = document.getElementById('hud-passive-state');
    if (!this.hudPassivePips) this.hudPassivePips = document.getElementById('hud-passive-pips');
    if (!this.labelDodge) this.labelDodge = document.getElementById('label-dodge');
    if (!this.labelCounterHand) this.labelCounterHand = document.getElementById('label-counter-hand');
    if (!this.labelCounterLeg) this.labelCounterLeg = document.getElementById('label-counter-leg');
    if (!this.labelStanceWu) this.labelStanceWu = document.getElementById('label-stance-wu');

    const st = window.CharacterRegistry.getPassiveHudStatus(player, window.game && window.game.enemies);
    if (!st) return;

    if (this.hudPassiveWidget) {
      if (this._lastPassiveAccent !== st.accentColor && this.hudPassiveWidget.style && typeof this.hudPassiveWidget.style.setProperty === 'function') {
        this._lastPassiveAccent = st.accentColor;
        this.hudPassiveWidget.style.setProperty('--passive-accent', st.accentColor || '#38bdf8');
      }
      if (this.hudPassiveWidget.classList && typeof this.hudPassiveWidget.classList.toggle === 'function') {
        this.hudPassiveWidget.classList.toggle('passive-active', !!st.isBuffActive);
      }
    }
    if (this.hudPassiveOrb && this._lastPassiveIcon !== st.icon) {
      this._lastPassiveIcon = st.icon;
      this.hudPassiveOrb.textContent = st.icon;
    }
    if (this.hudPassiveName && this._lastPassiveName !== st.name) {
      this._lastPassiveName = st.name;
      this.hudPassiveName.textContent = st.name;
    }
    if (this.hudPassiveState && this._lastPassiveState !== st.statusText) {
      this._lastPassiveState = st.statusText;
      this.hudPassiveState.textContent = st.statusText;
    }

    if (this.hudPassivePips && typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const maxPips = Math.max(1, st.pipsMax || 3);
      if (this._lastPassivePipsMax !== maxPips || !this.hudPassivePips.children || this.hudPassivePips.children.length !== maxPips) {
        this.hudPassivePips.innerHTML = '';
        for (let i = 0; i < maxPips; i++) {
          const pip = document.createElement('span');
          pip.className = 'passive-pip';
          this.hudPassivePips.appendChild(pip);
        }
        this._lastPassivePipsMax = maxPips;
        this._lastPassivePipsFilled = -1;
      }
      const filled = Math.max(0, Math.min(maxPips, st.pipsFilled || 0));
      if (this._lastPassivePipsFilled !== filled && this.hudPassivePips.children) {
        this._lastPassivePipsFilled = filled;
        for (let i = 0; i < maxPips; i++) {
          const pip = this.hudPassivePips.children[i];
          if (pip && pip.classList && typeof pip.classList.toggle === 'function') {
            pip.classList.toggle('filled', i < filled);
          }
        }
      }
    }

    if (this.labelDodge && st.dodgeLabel && this._lastLabelDodge !== st.dodgeLabel) {
      this._lastLabelDodge = st.dodgeLabel;
      this.labelDodge.textContent = st.dodgeLabel;
    }
    if (this.labelCounterHand && st.handCounterLabel && this._lastLabelHand !== st.handCounterLabel) {
      this._lastLabelHand = st.handCounterLabel;
      this.labelCounterHand.textContent = st.handCounterLabel;
    }
    if (this.labelCounterLeg && st.legCounterLabel && this._lastLabelLeg !== st.legCounterLabel) {
      this._lastLabelLeg = st.legCounterLabel;
      this.labelCounterLeg.textContent = st.legCounterLabel;
    }
    if (this.labelStanceWu && st.wuLabel && this._lastLabelWu !== st.wuLabel) {
      this._lastLabelWu = st.wuLabel;
      this.labelStanceWu.textContent = st.wuLabel;
    }

    // Đồng bộ thanh Hiệu Ứng Bất Lợi dưới thanh máu Player (CHỈ hiện debuff mà bản thân Player đang bị dính)
    if (!this.hudDebuffsBar && typeof document !== 'undefined') {
      this.hudDebuffsBar = document.getElementById('hud-debuffs-bar');
    }
    if (this.hudDebuffsBar) {
      const selfDebuffs = Array.isArray(st.selfDebuffs) ? st.selfDebuffs : [];
      const sig = selfDebuffs.map((d) => `${d.id}:${d.shortText}`).join('|');
      if (!sig) {
        if (this._lastHudDebuffsSig !== sig) {
          this._lastHudDebuffsSig = sig;
          this.hudDebuffsBar.classList.add('hidden');
          this.hudDebuffsBar.innerHTML = '';
        }
      } else if (this._lastHudDebuffsSig !== sig) {
        this._lastHudDebuffsSig = sig;
        this.hudDebuffsBar.classList.remove('hidden');
        this.hudDebuffsBar.innerHTML = this._buildDebuffPillsHtml(selfDebuffs, '', true);
      }
    }

    // Đồng bộ thanh Hiệu Ứng Bất Lợi trên Boss HUD (hiện ngay dưới thanh máu của Boss bị dính)
    if (!this.bossDebuffsBar && typeof document !== 'undefined') {
      this.bossDebuffsBar = document.getElementById('boss-debuffs-bar');
    }
    if (this.bossDebuffsBar) {
      const boss = (window.game && window.game.currentBoss && !window.game.currentBoss.isDead)
        ? window.game.currentBoss
        : ((window.game && Array.isArray(window.game.enemies))
          ? window.game.enemies.find((e) => e && !e.isDead && (e.isBoss || (typeof e.type === 'string' && e.type.startsWith('boss_'))))
          : null);
      const bossDebuffs = (boss && window.CharacterRegistry && typeof window.CharacterRegistry.getEntityDebuffs === 'function')
        ? window.CharacterRegistry.getEntityDebuffs(boss)
        : [];
      const bSig = bossDebuffs.map((d) => `${d.id}:${d.shortText}`).join('|');
      if (!bSig) {
        if (this._lastBossDebuffsSig !== bSig) {
          this._lastBossDebuffsSig = bSig;
          this.bossDebuffsBar.classList.add('hidden');
          this.bossDebuffsBar.innerHTML = '';
        }
      } else if (this._lastBossDebuffsSig !== bSig) {
        this._lastBossDebuffsSig = bSig;
        this.bossDebuffsBar.classList.remove('hidden');
        this.bossDebuffsBar.innerHTML = this._buildDebuffPillsHtml(bossDebuffs, '', false);
      }
    }
  }

  _buildDebuffPillsHtml(list, scopeLabel, isSelf) {
    if (!Array.isArray(list) || list.length === 0) return '';
    return list.map((d) => {
      const scopeHtml = scopeLabel ? `<span class="debuff-scope">${scopeLabel}</span>` : '';
      return `<span class="debuff-pill ${isSelf ? 'self-debuff' : 'target-debuff'}" style="--debuff-color:${d.color};--debuff-bg:${d.bg}" title="${d.name}">${scopeHtml}<span>${d.icon} ${d.name}</span><span class="debuff-val">${d.shortText}</span></span>`;
    }).join('');
  }

  // Cập nhật Card Trạng Thái Vũ Khí trên Screen HUD
  updateWeaponHUD(player) {
    if (!this.hudWeaponCard) this.hudWeaponCard = document.getElementById('hud-weapon-card');
    if (!this.hudWeaponCard) return;

    const p = player || (window.game && window.game.player);
    const w = p && p.weapon && p.weapon.dur > 0 && !p.isDead ? p.weapon : null;
    if (!w) {
      if (this._weaponHudVisible !== false) {
        this._weaponHudVisible = false;
        this._lastWeaponSig = '';
        this.hudWeaponCard.classList.add('hidden');
      }
      return;
    }
    if (this._weaponHudVisible !== true) {
      this._weaponHudVisible = true;
      this.hudWeaponCard.classList.remove('hidden');
    }

    const curDur0 = Math.max(0, Math.floor(w.dur));
    const def0 = window.WEAPON_DEFS ? window.WEAPON_DEFS[w.type] : null;
    const maxDur0 = Math.max(1, w.max || (def0 ? def0.durability : 8));
    const wSig = `${w.type}:${curDur0}:${maxDur0}`;
    if (this._lastWeaponSig === wSig) return;
    this._lastWeaponSig = wSig;

    if (!this.hudWeaponIcon) this.hudWeaponIcon = document.getElementById('hud-weapon-icon');
    if (!this.hudWeaponName) this.hudWeaponName = document.getElementById('hud-weapon-name');
    if (!this.hudWeaponBadge) this.hudWeaponBadge = document.getElementById('hud-weapon-badge');
    if (!this.hudWeaponDurText) this.hudWeaponDurText = document.getElementById('hud-weapon-dur-text');
    if (!this.hudWeaponSegments) this.hudWeaponSegments = document.getElementById('hud-weapon-segments');
    if (!this.hudWeaponGuardPill) this.hudWeaponGuardPill = document.getElementById('hud-weapon-guard-pill');

    const def = window.WEAPON_DEFS ? window.WEAPON_DEFS[w.type] : null;
    const isBlade = w.type === 'blade';
    const isShield = w.type === 'shield';
    const curDur = Math.max(0, Math.floor(w.dur));
    const maxDur = Math.max(1, w.max || (def ? def.durability : 8));

    this.hudWeaponCard.classList.toggle('blade-theme', isBlade);
    this.hudWeaponCard.classList.toggle('shield-theme', isShield);
    this.hudWeaponCard.classList.toggle('danger-theme', curDur <= 2);

    if (this.hudWeaponGuardPill) {
      this.hudWeaponGuardPill.classList.toggle('hidden', !isShield);
    }

    if (this.hudWeaponIcon && this._lastHudIconType !== w.type) {
      this._lastHudIconType = w.type;
      if (window.weaponSystem && typeof window.weaponSystem.getIconSvg === 'function') {
        this.hudWeaponIcon.innerHTML = window.weaponSystem.getIconSvg(w.type);
      } else {
        this.hudWeaponIcon.textContent = isBlade ? '⚔️' : (isShield ? '🛡️' : '🥢');
      }
    }
    if (this.hudWeaponName) {
      this.hudWeaponName.textContent = def ? def.name : (isBlade ? 'MÃ TẤU' : (isShield ? 'KHIÊN' : 'CÔN'));
    }
    if (this.hudWeaponBadge) {
      this.hudWeaponBadge.textContent = def && def.effectName ? def.effectName : (isBlade ? 'CHÉM SÂU' : (isShield ? 'CHẮN & ĐẨY' : 'CHOÁNG'));
      this.hudWeaponBadge.style.color = isBlade ? '#fb7185' : (isShield ? '#bae6fd' : '#38bdf8');
      this.hudWeaponBadge.style.borderColor = isBlade ? 'rgba(244, 63, 94, 0.45)' : (isShield ? 'rgba(250, 204, 21, 0.48)' : 'rgba(56, 189, 248, 0.45)');
      this.hudWeaponBadge.style.background = isBlade ? 'rgba(244, 63, 94, 0.16)' : (isShield ? 'rgba(14, 165, 233, 0.2)' : 'rgba(56, 189, 248, 0.15)');
    }
    if (this.hudWeaponDurText) {
      this.hudWeaponDurText.textContent = `${curDur} / ${maxDur}`;
      this.hudWeaponDurText.style.color = curDur <= 2 ? '#ef4444' : (curDur <= maxDur * 0.5 ? '#f59e0b' : '#38bdf8');
    }

    // Render các vạch năng lượng độ bền (segmented pips)
    if (this.hudWeaponSegments) {
      if (this._lastPipMax !== maxDur || this.hudWeaponSegments.children.length !== maxDur) {
        this.hudWeaponSegments.innerHTML = '';
        for (let i = 0; i < maxDur; i++) {
          const pip = document.createElement('div');
          pip.className = 'hud-weapon-pip';
          this.hudWeaponSegments.appendChild(pip);
        }
        this._lastPipMax = maxDur;
      }
      const pips = this.hudWeaponSegments.children;
      for (let i = 0; i < maxDur; i++) {
        const pip = pips[i];
        if (!pip) continue;
        pip.className = 'hud-weapon-pip';
        if (i < curDur) {
          pip.classList.add('filled');
          if (curDur <= 2) {
            pip.classList.add('critical');
          } else if (curDur <= maxDur * 0.5) {
            pip.classList.add('low');
          } else if (isBlade) {
            pip.classList.add('blade');
          } else if (isShield) {
            pip.classList.add('shield');
          }
        }
      }
    }
  }

  // Cập nhật Chỉ Dẫn Mục Tiêu Màn Chơi
  setObjective(text) {
    if (this.objectiveText) {
      this.objectiveText.textContent = text;
    }
  }

  // Hiển thị & Cập nhật Boss HUD
  showBossHUD(boss) {
    this.bossHud.classList.remove('hidden');
    this.bossName.textContent = boss.name.toUpperCase();
    this.bossTitle.textContent = boss.title || 'THỦ LĨNH';
    this.updateBossHp(boss.hp, boss.maxHp);
    this.updateBossPoise(boss.poise ?? 100, boss.maxPoise ?? 100, boss.weakWindow || 0);
    this.setBossPhase(1);

    // Avatar Boss
    if (window.skeletalRenderer) window.skeletalRenderer.drawPortrait(this.bossAvatarIcon, boss.type, true);
  }

  hideBossHUD() {
    this.bossHud.classList.add('hidden');
    if (this.bossDebuffsBar) {
      this.bossDebuffsBar.classList.add('hidden');
      this.bossDebuffsBar.innerHTML = '';
      this._lastBossDebuffsSig = '';
    }
  }

  updateBossHp(currentHp, maxHp) {
    const percent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
    this.bossHpFill.style.width = percent + '%';
    this.bossHpText.textContent = `BOSS HP: ${Math.round(percent)}%`;

    // Cập nhật Nhạc Nền Tương Tác theo Phase của Boss (Interactive Dynamic BGM)
    const curPhase = percent <= 35 ? 3 : (percent <= 65 ? 2 : 1);
    if (this._curBossPhase !== curPhase) {
      this._curBossPhase = curPhase;
      this.setBossPhase(curPhase);
    }
    if (window.audioManager && typeof window.audioManager.setBossPhase === 'function') {
      window.audioManager.setBossPhase(curPhase, percent / 100);
    }

    setTimeout(() => {
      if (this.bossHpDelay) {
        this.bossHpDelay.style.width = percent + '%';
      }
    }, 280);
  }

  updateBossPoise(poise = 100, maxPoise = 100, weakWindow = 0) {
    if (!this.bossPoiseFill || !this.bossPoiseText) return;
    const isWeak = weakWindow > 0 || poise <= 0;
    const percent = isWeak ? 100 : Math.max(0, Math.min(100, (poise / (maxPoise || 100)) * 100));
    this.bossPoiseFill.style.width = percent + '%';
    if (this.bossPoiseShell) {
      this.bossPoiseShell.classList.toggle('weak-window', isWeak);
    }
    if (isWeak) {
      this.bossPoiseText.textContent = `⚡ LỘ SƠ HỞ — TẤN CÔNG NGAY!`;
    } else {
      this.bossPoiseText.textContent = `ĐỊNH LỰC (POISE): ${Math.round(percent)}%`;
    }
  }

  setBossPhase(phaseNum) {
    this._curBossPhase = phaseNum;
    if (this.bossPhaseMarkers) {
      const markers = this.bossPhaseMarkers.querySelectorAll('.marker');
      markers.forEach((m, idx) => {
        if (idx + 1 === phaseNum) {
          m.classList.add('active');
        } else {
          m.classList.remove('active');
        }
      });
    }
    if (window.audioManager && typeof window.audioManager.setBossPhase === 'function') {
      window.audioManager.setBossPhase(phaseNum);
    }
  }

  // Combo Tracker
  updateCombo(count, rank, timerRatio) {
    this.comboTracker.classList.remove('hidden');
    this.comboCount.textContent = count;
    this.comboRank.textContent = rank;
    this.comboTimerBar.style.width = Math.max(0, Math.min(100, timerRatio * 100)) + '%';
  }

  hideCombo() {
    this.comboTracker.classList.add('hidden');
  }

  // Banner Thông Báo (PERFECT DODGE / COUNTER)
  showAlertBanner(text) {
    this.alertText.textContent = text;
    this.alertBanner.classList.remove('hidden');

    // Trigger re-animation
    this.alertBanner.style.animation = 'none';
    void this.alertBanner.offsetWidth; // trigger reflow
    this.alertBanner.style.animation = 'flash-banner 0.75s ease-out forwards';

    setTimeout(() => {
      this.alertBanner.classList.add('hidden');
    }, 750);
  }

  // Hộp Thoại Điện Ảnh (Cinematic Dialogue Box)
  showDialogue(speaker, text, avatarType = 'nghi') {
    this.dialogueBox.classList.remove('hidden');
    this.dialogueSpeakerName.textContent = speaker;

    // Avatar: chân dung vẽ canvas, nhân vật phản diện quay mặt về phía anh hùng
    if (window.skeletalRenderer) {
      window.skeletalRenderer.drawPortrait(this.dialogueAvatar, this.portraitType(avatarType), avatarType !== 'nghi');
    }

    // Typewriter effect
    if (this.typingTimer) clearInterval(this.typingTimer);
    this.dialogueText.textContent = '';
    this.fullTextToType = text;
    this.typedIndex = 0;

    this.typingTimer = setInterval(() => {
      if (this.typedIndex < this.fullTextToType.length) {
        const ch = this.fullTextToType.charAt(this.typedIndex);
        this.dialogueText.textContent += ch;
        if (this.typedIndex % 3 === 0 && ch !== ' ' && window.audioManager && typeof window.audioManager.playTypeBlip === 'function') {
          window.audioManager.playTypeBlip();
        }
        this.typedIndex++;
      } else {
        clearInterval(this.typingTimer);
        this.typingTimer = null;
      }
    }, 18);
  }

  hideDialogue() {
    if (this.typingTimer) clearInterval(this.typingTimer);
    this.dialogueBox.classList.add('hidden');
  }

  // Mở/Đóng Modals
  showTitleScreen() {
    this.hideHUD();
    this.titleScreen.classList.remove('hidden');
    const topControls = document.getElementById('top-controls');
    if (topControls) topControls.classList.add('hidden');
    if (window.menuManager && typeof window.menuManager.updateMenuPlayerBar === 'function') {
      window.menuManager.updateMenuPlayerBar();
    }
  }

  hideTitleScreen() {
    this.titleScreen.classList.add('hidden');
    this.showHUD();
  }

  showStageSelect() {
    if (window.menuManager && typeof window.menuManager.showChapterMap === 'function') {
      window.menuManager.showChapterMap();
    }
  }

  hideStageSelect() {
    const modal = document.getElementById('stage-select-modal');
    if (modal) modal.classList.add('hidden');
  }

  showControls() {
    if (this.pauseModal && !this.pauseModal.classList.contains('hidden')) {
      this._returnToPauseOnCloseControls = true;
      this.pauseModal.classList.add('hidden');
    }
    if (window.uiCore) window.uiCore.showModal(this.controlsModal);
    else this.controlsModal.classList.remove('hidden');
  }

  hideControls() {
    if (window.uiCore) window.uiCore.hideModal(this.controlsModal);
    else this.controlsModal.classList.add('hidden');
    if (this._returnToPauseOnCloseControls || (window.game && window.game.state === 'PAUSED')) {
      this._returnToPauseOnCloseControls = false;
      if (this.pauseModal) {
        if (window.uiCore) window.uiCore.showModal(this.pauseModal);
        else this.pauseModal.classList.remove('hidden');
      }
    }
  }

  showPause() {
    if (window.uiCore) window.uiCore.showModal(this.pauseModal);
    else this.pauseModal.classList.remove('hidden');
  }

  hidePause() {
    if (window.uiCore) window.uiCore.hideModal(this.pauseModal);
    else this.pauseModal.classList.add('hidden');
  }

  showGameOver() {
    this.hideBossHUD();
    // Tiêu đề theo đúng nhân vật đang chơi (trước đây luôn là Ngô Nhất Nghị)
    const p = window.game && window.game.player;
    const titleEl = this.gameOverModal ? this.gameOverModal.querySelector('.gameover-title') : null;
    if (titleEl) {
      const who = (p && p.name) ? p.name.toUpperCase() : 'NGÔ NHẤT NGHỊ';
      titleEl.textContent = who + ' GỤC NGÃ';
    }
    this.gameOverModal.classList.remove('hidden');
  }

  hideGameOver() {
    this.gameOverModal.classList.add('hidden');
  }

  showStageClear(stageTitle, stats) {
    this.hideBossHUD();
    const victoryTitle = document.getElementById('victory-stage-name');
    if (victoryTitle) victoryTitle.textContent = stageTitle + ' ĐÃ BỊ TRIỆT PHÁ';

    document.getElementById('stat-hits').textContent = stats.hits;
    document.getElementById('stat-max-combo').textContent = stats.maxCombo + ' HIT';
    document.getElementById('stat-dodges').textContent = stats.dodges;
    document.getElementById('stat-time').textContent = stats.timeStr;
    document.getElementById('stat-rank').textContent = stats.rank;

    // Thưởng & manh mối của màn (theo bản đồ chương)
    const meta = window.STORY_META && window.STORY_META.stages ? window.STORY_META.stages[window.stageManager.currentStageIndex] : null;
    const rewardEl = document.getElementById('victory-reward');
    const clueEl = document.getElementById('victory-clue');
    if (rewardEl) rewardEl.textContent = meta && meta.reward ? 'THƯỞNG: ' + meta.reward : '';
    if (clueEl) clueEl.textContent = meta && meta.clue ? 'MANH MỐI: ' + meta.clue : '';
    if (rewardEl) rewardEl.classList.toggle('hidden', !(meta && meta.reward));
    if (clueEl) clueEl.classList.toggle('hidden', !(meta && meta.clue));

    this.stageClearModal.classList.remove('hidden');
  }

  hideStageClear() {
    this.stageClearModal.classList.add('hidden');
  }

  showGrandVictory() {
    this.grandVictoryModal.classList.remove('hidden');
  }

  hideGrandVictory() {
    this.grandVictoryModal.classList.add('hidden');
  }

  // ==========================================================================
  // MỚI: RA MẮT BOSS / LỰA CHỌN CỐT TRUYỆN / KẾT THÚC / THÔNG BÁO
  // ==========================================================================
  // Bảng tên boss điện ảnh khi boss vừa xuất hiện
  showBossIntro(boss) {
    if (!this.bossIntroCard || !boss) return;
    const nameEl = this.bossIntroCard.querySelector('.boss-intro-name');
    const titleEl = this.bossIntroCard.querySelector('.boss-intro-title');
    if (nameEl) nameEl.textContent = (boss.name || '').toUpperCase();
    if (titleEl) titleEl.textContent = (boss.title || '').toUpperCase();
    this.bossIntroCard.classList.remove('hidden');
    // Chạy lại hiệu ứng
    this.bossIntroCard.style.animation = 'none';
    void this.bossIntroCard.offsetWidth;
    this.bossIntroCard.style.animation = 'boss-intro-in 2.6s ease-out forwards';
    if (this.bossIntroTimer) clearTimeout(this.bossIntroTimer);
    this.bossIntroTimer = setTimeout(() => this.hideBossIntro(), 2700);
  }

  hideBossIntro() {
    if (this.bossIntroCard) this.bossIntroCard.classList.add('hidden');
  }

  // Hộp lựa chọn cốt truyện — mỗi lựa chọn mở ra một kết thúc khác nhau
  showChoice(def, onPick) {
    if (!this.choiceModal || !def) { if (onPick) onPick(null); return; }
    this.choiceCallback = onPick;
    if (this.choiceLabel) this.choiceLabel.textContent = def.label || 'LỰA CHỌN';
    if (this.choiceQuestion) this.choiceQuestion.textContent = def.question || '';
    if (this.choiceOptions) {
      this.choiceOptions.innerHTML = '';
      def.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'choice-option';
        btn.innerHTML = `<span class="choice-text"></span><span class="choice-desc"></span>` +
          (def.effect && def.effect[opt.id] ? `<span class="choice-effect">${def.effect[opt.id]}</span>` : '');
        btn.querySelector('.choice-text').textContent = opt.text;
        btn.querySelector('.choice-desc').textContent = opt.desc || '';
        btn.addEventListener('click', () => this.pickChoice(opt.id));
        this.choiceOptions.appendChild(btn);
      });
    }
    this.choiceModal.classList.remove('hidden');
  }

  pickChoice(optionId) {
    const cb = this.choiceCallback;
    this.choiceCallback = null;
    this.hideChoice();
    if (cb) cb(optionId);
  }

  hideChoice() {
    if (this.choiceModal) this.choiceModal.classList.add('hidden');
  }

  // Màn kết thúc (1 trong 4) — nội dung khác hẳn nhau theo lựa chọn
  showEnding(ending) {
    if (!this.endingModal || !ending) { this.showGrandVictory(); return; }
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('ending-name', ending.name);
    set('ending-tagline', ending.tagline || '');
    set('ending-scene', ending.scene || '');
    set('ending-quote', ending.quote || '');
    const cond = document.getElementById('ending-condition');
    if (cond) cond.textContent = 'ĐIỀU KIỆN: ' + (ending.conditionText || '');

    // Tóm tắt lựa chọn người chơi đã đưa ra
    const summary = document.getElementById('ending-choices');
    if (summary) {
      const ch = (window.saveManager && window.saveManager.data.choices) || {};
      const label = (k, v) => {
        const c = window.STORY_META && window.STORY_META.choices[k];
        if (!c || !v) return null;
        const opt = c.options.find((o) => o.id === v);
        return opt ? `${c.label}: ${opt.text}` : null;
      };
      const parts = ['rescue', 'mountain', 'danghai'].map((k) => label(k, ch[k])).filter(Boolean);
      summary.textContent = parts.length ? parts.join('  •  ') : 'Bạn chưa đưa ra lựa chọn nào ở các bước ngoặt.';
    }

    // Đã đạt bao nhiêu kết thúc
    const progress = document.getElementById('ending-progress');
    if (progress && window.saveManager) {
      progress.textContent = `KẾT THÚC ĐÃ MỞ: ${window.saveManager.data.endings.length} / 4`;
    }

    this.hideStageClear();
    this.hideGrandVictory();
    this.endingModal.classList.remove('hidden');
    if (window.audioManager) window.audioManager.playGong(0.5);
  }

  hideEnding() {
    if (this.endingModal) this.endingModal.classList.add('hidden');
  }

  // Thông báo thành tích / mở khóa (hiện góc màn hình, giới hạn tối đa 4 toast đồng thời)
  showToast(msg) {
    if (!this.toastStack) return;
    while (this.toastStack.children && this.toastStack.children.length >= 4 && this.toastStack.firstElementChild) {
      this.toastStack.removeChild(this.toastStack.firstElementChild);
    }
    const el = document.createElement('div');
    el.className = 'toast-item';
    el.textContent = msg;
    this.toastStack.appendChild(el);
    setTimeout(() => { el.classList.add('toast-out'); }, 2400);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 2850);
  }

  // Thông báo Cúp & Thành Tựu Vinh Quang (Golden Trophy Toast Banner)
  showAchievementToast(achName, achDesc = '') {
    if (!this.toastStack) return;
    while (this.toastStack.children && this.toastStack.children.length >= 4 && this.toastStack.firstElementChild) {
      this.toastStack.removeChild(this.toastStack.firstElementChild);
    }
    const el = document.createElement('div');
    el.className = 'toast-item toast-achievement';
    el.innerHTML = `
      <div class="toast-ach-badge">🏆</div>
      <div class="toast-ach-content">
        <span class="toast-ach-header">MỞ KHÓA THÀNH TỰU!</span>
        <strong class="toast-ach-title">${achName}</strong>
        ${achDesc ? `<small class="toast-ach-desc">${achDesc}</small>` : ''}
      </div>
    `;
    this.toastStack.appendChild(el);
    if (window.audioManager && typeof window.audioManager.playAchievementFanfare === 'function') {
      window.audioManager.playAchievementFanfare();
    }
    setTimeout(() => { el.classList.add('toast-out'); }, 3600);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 4150);
  }

  updateAudioButton(isMuted) {
    if (this.quickAudioBtn) {
      this.quickAudioBtn.textContent = isMuted ? '🔇' : '🔊';
    }
  }
}

// Global UI Manager Instance
const uiManager = new UIManager();
window.uiManager = uiManager;
window.UIManager = UIManager;
