/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/core/gameFlow.js - Chien thang, ket thuc, thong ke man, game over va pause/menu.
 */

class GameFlow extends window.GameCamera {
  // ==========================================================================
  // CHIẾN THẮNG & THẤT BẠI
  // ==========================================================================
  triggerStageVictory() {
    if (this.state === 'STAGE_CLEAR' || this.stageCompletedPending) return;
    this.stageCompletedPending = true;
    this.state = 'STAGE_CLEAR';
    this.cancelGameOverTimer();
    this.projectiles = [];
    if (this.player) {
      if (typeof this.player.clearAllDebuffs === 'function') {
        this.player.clearAllDebuffs();
      } else {
        this.player.bleedTimer = 0;
        this.player.stunTimer = 0;
      }
      this.player.invincibleTimer = Math.max(this.player.invincibleTimer || 0, 5.0);
    }
    if (window.allyManager && typeof window.allyManager.reset === 'function') {
      window.allyManager.reset();
    }
    if (window.audioManager) {
      if (typeof window.audioManager.duckBGM === 'function' && window.audioManager.bgmAudio) {
        window.audioManager.duckBGM(0.25, 2400);
      } else {
        window.audioManager.stopBGM();
      }
      window.audioManager.playVictory();
      window.audioManager.setBGMIntensity(1);
    }

    const stageData = window.stageManager.getCurrentStage();
    const currentStageNum = window.stageManager.currentStageIndex;
    const om = window.onlineManager;
    const isCoopOnline = !!(om && om.isActive && om.mode === 'coop');

    // Chơi Co-op thưởng Vàng & Kim Cương riêng thay vì ghi đè tiến trình mở khóa màn/nhân vật Chiến dịch
    if (isCoopOnline) {
      const sm = window.saveManager;
      const stats = this.calculateStageStats();
      const goldBonus = 120 + currentStageNum * 25;
      const diamondBonus = (stageData && stageData.bossType) ? 10 : 5;
      if (sm) {
        if (typeof sm.addStats === 'function') {
          sm.addStats({ hits: stats.hits, perfectDodges: stats.dodges, bestCombo: stats.maxCombo });
        }
        if (typeof sm.addGold === 'function') sm.addGold(goldBonus);
        if (typeof sm.addDiamonds === 'function') sm.addDiamonds(diamondBonus);
      }
      this.toast(`🤝 CO-OP CHIẾN THẮNG! +${goldBonus} Vàng & +${diamondBonus} Kim Cương`);
    } else {
      // Lưu tiến trình, mở khóa nhân vật, thành tích (chế độ Chiến Dịch)
      this.recordStageProgress(currentStageNum, stageData);
    }

    if (isCoopOnline) {
      const shouldNotifyPeer = !om._roundOver;
      om._roundOver = true;
      if (typeof om._resetRematchButton === 'function' && !om._rematchRequested) {
        om._resetRematchButton(true);
      }
      if (shouldNotifyPeer && typeof om.send === 'function') {
        om.send({ type: 'coop_stage_ended', epoch: om._matchEpoch || 1, result: 'victory' });
      }
    }

    const proceed = () => {
      // Màn cuối -> dòng kết thúc theo lựa chọn của người chơi (chỉ trong Chiến dịch đơn)
      if (!isCoopOnline && stageData.finalStage) {
        this.showEndingFlow();
        return;
      }
      const stats = this.calculateStageStats();
      this.later(() => {
        if (window.rankingManager) {
          window.rankingManager.processAndDisplayVictory(currentStageNum, stageData.title, {
            timeSec: this.stageElapsedTime,
            timeStr: stats.timeStr,
            hpPercent: (this.player.hp / this.player.maxHp) * 100,
            maxCombo: stats.maxCombo,
            totalHits: stats.hits,
            perfectDodges: stats.dodges,
            perfectCounters: window.combatSystem ? (window.combatSystem.perfectCounterCount || 0) : 0,
            sideDone: window.saveManager ? window.saveManager.isMissionDone('side_' + currentStageNum) : false
          });
        } else if (window.uiManager) {
          window.uiManager.showStageClear(stageData.title, stats);
        }
      }, 600);
    };

    // CAO TRÀO ĐẶC BIỆT HỒI IV (TRIỆU VINH TÂM): Sau khi hạ Triệu Vinh Tâm, kích hoạt BA NGƯỜI, BA SỰ THẬT
    const metaCur = window.STORY_META && window.STORY_META.stages ? window.STORY_META.stages[currentStageNum] : null;
    const isVinhTamStage = currentStageNum === 17 || (currentStageNum === 10 && stageData && stageData.bossType === 'vinhtam') || (metaCur && metaCur.boss === 'vinhtam');
    const hasConfrontationModal = typeof document !== 'undefined' && typeof document.getElementById === 'function' && !!document.getElementById('confrontation-modal');
    if (!isCoopOnline && isVinhTamStage && window.clanConfrontation && hasConfrontationModal) {
      window.clanConfrontation.startConfrontation(() => {
        if (stageData.postChoice && !(window.saveManager && window.saveManager.getChoice(stageData.postChoice))) {
          this.showStoryChoice(stageData.postChoice, proceed);
        } else {
          proceed();
        }
      });
      return;
    }

    // Lựa chọn cốt truyện có hệ quả thật (xếp trước màn kết quả)
    if (!isCoopOnline && stageData.postChoice) {
      this.showStoryChoice(stageData.postChoice, proceed);
    } else {
      proceed();
    }
  }

  // Ghi lại tiến trình + kiểm tra thành tích sau mỗi màn
  recordStageProgress(stageNum, stageData) {
    const sm = window.saveManager;
    if (!sm) return;
    sm.completeStage(stageNum);

    const stats = this.calculateStageStats();
    sm.addStats({ hits: stats.hits, perfectDodges: stats.dodges, bestCombo: stats.maxCombo });

    const meta = window.STORY_META && window.STORY_META.stages ? window.STORY_META.stages[stageNum] : null;

    // Mở khóa nhân vật theo meta hoặc stageData hoặc Màn cuối Ngô Giang Mạnh
    const charToUnlock = (meta && meta.unlockChar) || (stageData && stageData.unlockChar) || ((stageNum === 20 || stageNum === 11 || (meta && meta.boss === 'giangmanh')) ? 'giangmanh' : null);
    if (charToUnlock) {
      const name = (window.CHARACTERS && window.CHARACTERS[charToUnlock]) ? window.CHARACTERS[charToUnlock].name : (charToUnlock === 'giangmanh' ? 'Ngô Giang Mạnh' : charToUnlock);
      if (sm.unlockCharacter(charToUnlock)) {
        this.toast('MỞ KHÓA NHÂN VẬT: ' + name.toUpperCase());
      }
    }

    // Nhiệm vụ phụ
    if (meta && meta.type === 'side') sm.completeMission('side_' + stageNum);
    if (stageData && stageData.escape) {
      if (sm.unlockAchievement('escape_hud')) this.toast('THÀNH TÍCH: THOÁT HIỂM');
      sm.completeMission('escape_' + stageNum);
    }

    // Thành tích theo màn / boss
    if (stageNum === 4 && sm.unlockAchievement('act1_clear')) this.toast('THÀNH TÍCH: ĐÊM HẮC LANG');
    if (meta && meta.boss) {
      sm.defeatBoss(meta.boss);
      if (meta.boss === 'hoanganh' && sm.unlockAchievement('beat_hoanganh')) this.toast('THÀNH TÍCH: TRẬN CHIẾN TRÊN NÚI');
      if (meta.boss === 'vinhtam' && sm.unlockAchievement('beat_vinhtam')) this.toast('THÀNH TÍCH: ĐẠI ĐIỆN ĐÃ RỤNG');
      if (meta.boss === 'giangmanh') {
        sm.unlockCharacter('giangmanh');
        if (sm.unlockAchievement('beat_giangmanh')) this.toast('THÀNH TÍCH: ĐOẠN NGHĨA');
      }
    }

    // Thành tích theo thành tích chiến đấu
    if (stats.maxCombo >= 10 && sm.unlockAchievement('combo_10')) this.toast('THÀNH TÍCH: LIÊN HOÀN THẦN KỲ');
    if (stats.dodges >= 3 && sm.unlockAchievement('perfect_3')) this.toast('THÀNH TÍCH: THÂN PHÁP VÔ LỖI');
    if (stats.rank && stats.rank.indexOf('SÁT THẦN') === 0 && sm.unlockAchievement('rank_s')) this.toast('THÀNH TÍCH: SÁT THẦN');
    if (this.player && this.player.hp >= this.player.maxHp && sm.unlockAchievement('nodamage_clear')) {
      this.toast('THÀNH TỰU: BẤT KHẢ XÂM PHẠM (NO DAMAGE)');
    }
  }

  // Hộp thoại lựa chọn cốt truyện (có hệ quả thật -> quyết định kết thúc)
  showStoryChoice(key, cb) {
    const def = window.STORY_META && window.STORY_META.choices ? window.STORY_META.choices[key] : null;
    if (!def || !window.uiManager) { if (cb) cb(); return; }
    this.pendingChoice = { key, cb };
    this.state = 'CHOICE';
    window.uiManager.showChoice(def, (optionId) => {
      if (window.saveManager) {
        window.saveManager.recordChoice(key, optionId);
        if (key === 'rescue' && window.saveManager.unlockAchievement('rescue_choice')) {
          this.toast('THÀNH TÍCH: LỰA CHỌN ĐẦU TIÊN');
        }
      }
      if (window.audioManager) window.audioManager.playClick();
      const pending = this.pendingChoice;
      this.pendingChoice = null;
      this.state = 'STAGE_CLEAR';
      if (pending && pending.cb) pending.cb();
    });
  }

  // 1 trong 4 kết thúc — tính từ toàn bộ lựa chọn người chơi đã đưa ra
  showEndingFlow() {
    if (this.endingShown) return;
    this.endingShown = true;
    const sm = window.saveManager;
    const choices = (sm && sm.data.choices) || {};
    const endingId = (window.computeEndingId || (() => 'huyetchien'))(choices);
    const ending = (window.getEnding || (() => null))(endingId);

    if (sm && ending) {
      // Đảm bảo Ngô Giang Mạnh được mở khóa và lưu trữ vĩnh viễn trước khi kiểm tra toàn bộ nhân vật
      sm.unlockCharacter('giangmanh');
      const isNew = sm.unlockEnding(ending.id);
      const playable = ['nghi', 'huavudai', 'hoanganh', 'giangmanh', 'dunghai', 'bichlam', 'dinhan'];
      const allPlayable = playable.every((id) => sm.isCharacterUnlocked(id));
      if (allPlayable && sm.unlockAchievement('all_playable')) this.toast('THÀNH TÍCH: TOÀN BỘ TUYẾT NHÂN VẬT');
      if (sm.data.endings.length >= 4 && sm.unlockAchievement('all_endings')) this.toast('THÀNH TÍCH: BỐN KẾT THÚC');
      if (isNew) this.toast('KẾT THÚC MỚI: ' + ending.name);
    }

    this.later(() => {
      if (window.uiManager && ending) window.uiManager.showEnding(ending);
    }, 900);
  }


  calculateStageStats() {
    const combat = window.combatSystem;
    const hits = combat ? combat.totalHits : 0;
    const maxCombo = combat ? combat.maxComboInStage : 0;
    const dodges = combat ? combat.perfectDodgeCount : 0;

    const mins = Math.floor(this.stageElapsedTime / 60);
    const secs = Math.floor(this.stageElapsedTime % 60);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Đánh giá cấp độ thân pháp
    let rank = 'CAO THỦ (A)';
    if (dodges >= 3 && maxCombo >= 8) {
      rank = 'SÁT THẦN (S)';
    } else if (maxCombo < 4) {
      rank = 'HỌC ĐỒ (B)';
    }

    return { hits, maxCombo, dodges, timeStr, rank };
  }

  // Timer có thể hủy hàng loạt khi đổi màn / về menu (tránh hộp thoại, bảng thắng, kết thúc hiện nhầm lúc)

  cancelGameOverTimer() {
    if (this._gameOverTimer) {
      clearTimeout(this._gameOverTimer);
      this._gameOverTimer = null;
    }
  }

  // Lên lịch hiện màn hình thua sau khi nhân vật gục (có thể hủy khi chơi lại / về menu)
  scheduleGameOver(delayMs = 900) {
    this.cancelGameOverTimer();
    this._gameOverTimer = setTimeout(() => {
      this._gameOverTimer = null;
      this.triggerGameOver();
    }, delayMs);
  }

  triggerGameOver() {
    // Bỏ qua nếu người chơi đã chơi lại, về menu, đã thắng hoặc Boss chiến dịch vừa gục
    if (!this.player || !this.player.isDead) return;
    if (
      this.state === 'MENU' ||
      this.state === 'GAME_OVER' ||
      this.state === 'STAGE_CLEAR' ||
      this.state === 'CHOICE' ||
      this.state === 'CUTSCENE' ||
      this.state === 'GRAND_VICTORY' ||
      this.stageCompletedPending ||
      this.endingShown ||
      (!this.isBossRush && this.currentBoss && this.currentBoss.isDead)
    ) {
      return;
    }
    // Đang tạm dừng: chờ người chơi tiếp tục rồi mới hiện màn thua (tránh chồng modal / kẹt không có game over)
    if (this.state === 'PAUSED') { this.scheduleGameOver(300); return; }
    this.state = 'GAME_OVER';
    const om = window.onlineManager;
    if (om && om.isActive && om.mode === 'coop') {
      const shouldNotifyPeer = !om._roundOver;
      om._roundOver = true;
      if (typeof om._resetRematchButton === 'function' && !om._rematchRequested) {
        om._resetRematchButton(true);
      }
      if (shouldNotifyPeer && typeof om.send === 'function') {
        om.send({ type: 'coop_stage_ended', epoch: om._matchEpoch || 1, result: 'defeat' });
      }
    }
    if (window.audioManager) {
      if (typeof window.audioManager.duckBGM === 'function' && window.audioManager.bgmAudio) {
        window.audioManager.duckBGM(0.35, 1600);
      } else {
        window.audioManager.stopBGM();
      }
    }
    if (window.uiManager) window.uiManager.showGameOver();
  }

  pauseGame() {
    const isOnline = !!(window.onlineManager && window.onlineManager.isActive);
    if (isOnline && (this.state === 'PLAYING' || this.state === 'TRAINING' || this.state === 'TUTORIAL')) {
      // Online real-time: mở bảng ESC nhưng KHÔNG đóng băng game loop / hất tung / sát thương
      this._onlinePauseOpen = true;
      if (window.uiManager) window.uiManager.showPause();
      return;
    }
    if (this.state === 'PLAYING' || this.state === 'TRAINING' || this.state === 'TUTORIAL') {
      this.previousState = this.state;
      this.state = 'PAUSED';
      if (window.uiManager) window.uiManager.showPause();
    }
  }

  resumeGame() {
    this._onlinePauseOpen = false;
    if (this.state === 'PAUSED') {
      this.state = this.previousState || 'PLAYING';
    }
    if (window.uiManager) window.uiManager.hidePause();
  }

  returnToMenu() {
    this._onlinePauseOpen = false;
    if (typeof this.resetTransientModes === 'function') {
      this.resetTransientModes();
    } else {
      this.cancelGameOverTimer();
      this.clearLaterTimers();
    }
    this.state = 'MENU';
    this.previousState = 'MENU';
    this._pausedNoModalTimer = 0;
    this.enemies = [];
    this.currentBoss = null;
    this.projectiles = [];
    this.arenaLocked = false;
    if (this.player) {
      this.player._summonedFiends = [];
      if (typeof this.player.clearAllDebuffs === 'function') this.player.clearAllDebuffs();
    }
    if (window.effectManager && typeof window.effectManager.clearCombatEffects === 'function') {
      window.effectManager.clearCombatEffects();
    }
    if (window.uiManager) {
      window.uiManager.hidePause();
      window.uiManager.hideGameOver();
      window.uiManager.hideStageClear();
      window.uiManager.hideBossHUD();
      window.uiManager.hideEnding();
      window.uiManager.hideChoice();
      window.uiManager.setObjective('ĐỘT NHẬP CĂN CỨ VÀ TIÊU DIỆT ĐỐI THỦ');
      window.uiManager.showTitleScreen();
    }
    if (window.menuManager) window.menuManager.hideAll();
    if (window.audioManager) {
      if (typeof window.audioManager.startMenuBGM === 'function') window.audioManager.startMenuBGM();
      else window.audioManager.stopBGM();
    }
  }

  // Vẽ vật bay (ném môi trường) — không cần ảnh, vẽ bằng canvas thuần
}

window.GameFlow = GameFlow;
