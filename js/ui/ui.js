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
    this.stageSelectModal = document.getElementById('stage-select-modal');
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
    if (window.skeletalRenderer) window.skeletalRenderer.drawPortrait(this.playerPortrait, 'player');
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
    if (this.hudCharName) this.hudCharName.textContent = (char.name || '').toUpperCase();
    if (this.hudCharTitle) this.hudCharTitle.textContent = (char.title || '').toUpperCase();
    if (window.skeletalRenderer && this.playerPortrait) {
      window.skeletalRenderer.drawPortrait(this.playerPortrait, char.styleType || char.type || 'player');
    }
    // Nhãn năng lượng theo nhân vật (Hứa Vũ Đại không dùng thuật ngữ Vovinam)
    const label = char.charId === 'nghi' ? 'VOVINAM' : 'NĂNG LƯỢNG';
    const energyText = document.getElementById('player-energy-text');
    if (energyText && energyText.dataset.kind !== char.charId) {
      energyText.dataset.kind = char.charId || '';
      energyText.dataset.label = label;
    }
  }

  showHUD() {
    this.hud.classList.remove('hidden');
    const topControls = document.getElementById('top-controls');
    if (topControls) topControls.classList.remove('hidden');
    // Luôn ẩn Boss HUD nếu không có boss đang chiến đấu hoặc đang trong Võ Đường
    if (!window.game || !window.game.currentBoss || window.game.currentBoss.isDead || window.game.state === 'TRAINING') {
      this.hideBossHUD();
    }
    if (window.skeletalRenderer) {
      if (!this.playerPortrait) this.playerPortrait = document.getElementById('player-portrait');
      if (this.playerPortrait) window.skeletalRenderer.drawPortrait(this.playerPortrait, 'player');
    }
    this.updateSkillCooldowns();
  }

  hideHUD() {
    this.hud.classList.add('hidden');
    this.hideBossHUD();
    const topControls = document.getElementById('top-controls');
    if (topControls) topControls.classList.add('hidden');
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
    const percent = Math.max(0, Math.min(100, (currentEnergy / maxEnergy) * 100));
    this.playerEnergyFill.style.width = percent + '%';
    const label = (this.playerEnergyText && this.playerEnergyText.dataset && this.playerEnergyText.dataset.label) || 'VOVINAM';
    this.playerEnergyText.textContent = `${label}: ${Math.round(percent)}%`;

    if (percent >= 100) {
      this.ultimateBadge.classList.remove('hidden');
    } else {
      this.ultimateBadge.classList.add('hidden');
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

  // Đồng bộ thời gian hồi chiêu kỹ năng Vovinam lên HUD
  updateSkillCooldowns(player) {
    if (!player) return;

    // Né Thân Pháp (L) — Hồi chiêu 8.0s
    if (!this.badgeDodge) this.badgeDodge = document.getElementById('badge-dodge');
    if (!this.cdDodgeText) this.cdDodgeText = document.getElementById('cd-dodge-text');
    if (this.badgeDodge && this.cdDodgeText) {
      const cd = player.dodgeCooldown || 0;
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

    // Phản Đòn Tay Vovinam (U + J) — Hồi chiêu 2.5s
    if (!this.badgeCounterHand) this.badgeCounterHand = document.getElementById('badge-counter-hand');
    if (!this.cdCounterHandText) this.cdCounterHandText = document.getElementById('cd-counter-hand-text');
    if (this.badgeCounterHand && this.cdCounterHandText) {
      const cd = player.counterHandCooldown || 0;
      if (cd > 0) {
        this.badgeCounterHand.classList.remove('ready');
        this.badgeCounterHand.classList.add('cooldown');
        this.cdCounterHandText.textContent = `${cd.toFixed(1)}s`;
      } else {
        this.badgeCounterHand.classList.remove('cooldown');
        this.badgeCounterHand.classList.add('ready');
        this.cdCounterHandText.textContent = 'SẴN SÀNG';
      }
    }

    // Phản Đòn Chân Vovinam (U + K) — Hồi chiêu 3.5s
    if (!this.badgeCounterLeg) this.badgeCounterLeg = document.getElementById('badge-counter-leg');
    if (!this.cdCounterLegText) this.cdCounterLegText = document.getElementById('cd-counter-leg-text');
    if (this.badgeCounterLeg && this.cdCounterLegText) {
      const cd = player.counterLegCooldown || 0;
      if (cd > 0) {
        this.badgeCounterLeg.classList.remove('ready');
        this.badgeCounterLeg.classList.add('cooldown');
        this.cdCounterLegText.textContent = `${cd.toFixed(1)}s`;
      } else {
        this.badgeCounterLeg.classList.remove('cooldown');
        this.badgeCounterLeg.classList.add('ready');
        this.cdCounterLegText.textContent = 'SẴN SÀNG';
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
  }

  hideTitleScreen() {
    this.titleScreen.classList.add('hidden');
    this.showHUD();
  }

  showStageSelect() {
    this.stageSelectModal.classList.remove('hidden');
  }

  hideStageSelect() {
    this.stageSelectModal.classList.add('hidden');
  }

  showControls() {
    if (this.pauseModal && !this.pauseModal.classList.contains('hidden')) {
      this._returnToPauseOnCloseControls = true;
      this.pauseModal.classList.add('hidden');
    }
    this.controlsModal.classList.remove('hidden');
  }

  hideControls() {
    this.controlsModal.classList.add('hidden');
    if (this._returnToPauseOnCloseControls || (window.game && window.game.state === 'PAUSED')) {
      this._returnToPauseOnCloseControls = false;
      if (this.pauseModal) this.pauseModal.classList.remove('hidden');
    }
  }

  showPause() {
    this.pauseModal.classList.remove('hidden');
  }

  hidePause() {
    this.pauseModal.classList.add('hidden');
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

  // Thông báo thành tích / mở khóa (hiện góc màn hình)
  showToast(msg) {
    if (!this.toastStack) return;
    const el = document.createElement('div');
    el.className = 'toast-item';
    el.textContent = msg;
    this.toastStack.appendChild(el);
    setTimeout(() => { el.classList.add('toast-out'); }, 2600);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 3100);
  }

  // Thông báo Cúp & Thành Tựu Vinh Quang (Golden Trophy Toast Banner)
  showAchievementToast(achName, achDesc = '') {
    if (!this.toastStack) return;
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
    setTimeout(() => { el.classList.add('toast-out'); }, 3800);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 4400);
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
