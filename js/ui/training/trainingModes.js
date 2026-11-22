/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/training/trainingModes.js - Chuyen che do, tien trinh bai tap va thiet lap vo si.
 */

class TrainingManagerModes extends window.TrainingManagerBase {
  switchToFreeMode() {
    this.mode = 'free';
    if (this.dummy) {
      this.dummy.attackMode = 'idle';
      this.dummy.state = 'idle';
    }
    if (window.uiManager) {
      window.uiManager.hideBossHUD();
      window.uiManager.setObjective('⚡ VÕ ĐƯỜNG VOVINAM — LUYỆN TẬP TỰ DO');
      window.uiManager.showToast('⚡ Đã chuyển sang: Luyện Tập Tự Do');
    }
    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      window.audioManager.playChime();
    }
    this.updateOverlayUI();
  }

  switchToDrillMode(drillIndex = 0) {
    this.mode = 'drill';
    this.setupDrill(typeof drillIndex === 'number' ? drillIndex : this.currentDrillIndex);
    if (window.uiManager) {
      window.uiManager.hideBossHUD();
      window.uiManager.setObjective('🥋 VÕ ĐƯỜNG VOVINAM — KHẢO HẠCH VÕ HỌC');
      window.uiManager.showToast(`🥋 Đã chuyển sang: 7 Bài Khảo Hạch (${this.drills[this.currentDrillIndex].title})`);
    }
    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      window.audioManager.playChime();
    }
  }


  completeCurrentDrill() {
    if (this._drillTransitioning) return;
    this._drillTransitioning = true;
    this.drillProgress = this.drillTarget;

    const drill = this.drills[this.currentDrillIndex];
    if (window.saveManager) {
      window.saveManager.recordTrainingDrill(drill.id);
    }
    if (window.uiManager) {
      window.uiManager.showAlertBanner(`HOÀN THÀNH: ${drill.title}`);
    }
    if (window.audioManager) {
      window.audioManager.playVictory();
    }

    if (this._drillTransitionTimer) clearTimeout(this._drillTransitionTimer);
    this._drillTransitionTimer = setTimeout(() => {
      this._drillTransitionTimer = null;
      if (this.isActive && this.mode === 'drill') {
        this.setupDrill(this.currentDrillIndex + 1);
      }
    }, 1400);
  }

  finishAllDrills() {
    this.mode = 'free';
    if (window.saveManager) {
      window.saveManager.unlockTrainingFree();
      window.saveManager.unlockAchievement('training_master');
    }
    if (this.dummy) {
      this.dummy.attackMode = 'free';
    }
    if (window.uiManager) {
      window.uiManager.setObjective('⚡ VÕ ĐƯỜNG VOVINAM — LUYỆN TẬP TỰ DO');
      window.uiManager.showAlertBanner('TỐT NGHIỆP LUYỆN VÕ — MỞ KHÓA LUYỆN TỰ DO!');
    }
    this.updateOverlayUI();
  }

  skipToFreeTraining() {
    if (window.saveManager) {
      window.saveManager.unlockTrainingFree();
    }
    this.finishAllDrills();
  }

  quitTraining() {
    this.isActive = false;
    this.noCooldown = false;
    this._drillTransitioning = false;
    if (this._drillTransitionTimer) {
      clearTimeout(this._drillTransitionTimer);
      this._drillTransitionTimer = null;
    }
    this.drillGraceTimer = 0;
    if (window.allyManager && typeof window.allyManager.reset === 'function') {
      window.allyManager.reset();
    }
    if (window.effectManager && typeof window.effectManager.clearCombatEffects === 'function') {
      window.effectManager.clearCombatEffects();
    }
    this.hideOverlay();
    const game = window.game;
    if (game && game.player) {
      game.player._summonedFiends = [];
    }
    if (game) {
      if (typeof game.returnToMenu === 'function') {
        game.returnToMenu();
      } else {
        game.state = 'MENU';
        game.previousState = 'MENU';
        game.enemies = [];
        game.currentBoss = null;
        game.arenaLocked = false;
        if (window.uiManager) {
          window.uiManager.hideBossHUD();
          window.uiManager.showTitleScreen();
        }
        if (window.audioManager) {
          window.audioManager.stopBGM();
        }
      }
    }
  }

  setNoCooldown(enabled) {
    this.noCooldown = !!enabled;
    const p = window.game && window.game.player;
    if (this.noCooldown && p) {
      p.energy = p.maxEnergy;
      p.dodgeCooldown = 0;
      p.counterCooldown = 0;
      if (window.uiManager) window.uiManager.updatePlayerEnergy(p.energy, p.maxEnergy);
    }
    if (this.noCooldown && window.allyManager) {
      window.allyManager.cooldown = 0;
      window.allyManager.gauge = window.allyManager.maxGauge;
      window.allyManager.updateHUD();
    }
    if (window.uiManager) {
      window.uiManager.showToast(this.noCooldown ? '⚡ KHÔNG HỒI CHIÊU: ĐÃ BẬT' : '⚡ KHÔNG HỒI CHIÊU: ĐÃ TẮT');
    }
    this.updateOverlayUI();
  }

  setPlayerGodMode(enabled) {
    this.playerGodMode = !!enabled;
    const p = window.game && window.game.player;
    if (this.playerGodMode && p) {
      p.hp = p.maxHp;
      if (window.uiManager) window.uiManager.updatePlayerHp(p.hp, p.maxHp);
    }
    if (window.uiManager) {
      window.uiManager.showToast(this.playerGodMode ? '🩸 BẤT TỬ NGƯỜI CHƠI: ĐÃ BẬT' : '🩸 BẤT TỬ NGƯỜI CHƠI: ĐÃ TẮT');
    }
    this.updateOverlayUI();
  }

  setPlayerCharacter(charId) {
    if (!window.game || !window.game.player) return;
    const p = window.game.player;
    this.selectedTrainingChar = charId;
    if (Array.isArray(p._summonedFiends)) {
      for (const f of p._summonedFiends) {
        if (f) f.life = 0;
      }
      p._summonedFiends = [];
    }
    p._activeNguTinhUltFx = null;
    if (window.effectManager && typeof window.effectManager.clearCombatEffects === 'function') {
      window.effectManager.clearCombatEffects();
    }
    if (window.skeletalRenderer) window.skeletalRenderer._styles = {};
    if (typeof p.clearAuraArmor === 'function') p.clearAuraArmor();
    if (p.hitTargets && typeof p.hitTargets.clear === 'function') p.hitTargets.clear();
    p.comboStep = 0;
    p.comboWindowTimer = 0;
    p.setCharacter(charId);
    if (this.dummy) {
      this.dummy._maMarks = 0;
      this.dummy.burnTimer = 0;
      this.dummy.bleedTimer = 0;
      this.dummy.chillTimer = 0;
      this.dummy.frostStacks = 0;
      this.dummy.stunTimer = 0;
      this.dummy.armorBreakTimer = 0;
    }
    p.hp = p.maxHp;
    p.energy = p.maxEnergy;
    p.guardGauge = 100;
    p.dodgeCooldown = 0;
    p.counterCooldown = 0;
    p.counterHandCooldown = 0;
    p.counterLegCooldown = 0;
    p.kickCooldown = 0;
    p.isAttacking = false;
    p.state = 'idle';
    p.stateTimer = 0;
    p.stateDuration = 0;

    if (window.uiManager) {
      window.uiManager.setCharacterHUD(p);
      window.uiManager.updatePlayerHp(p.hp, p.maxHp);
      window.uiManager.updatePlayerEnergy(p.energy, p.maxEnergy);
    }
    if (window.saveManager) {
      window.saveManager.data.selectedCharacter = charId;
      window.saveManager.persist();
    }
    const cMeta = window.TRAINING_CHARACTERS.find(c => c.id === charId);
    const cName = cMeta ? `${cMeta.name} (${cMeta.title})` : ((window.CHARACTERS && window.CHARACTERS[charId]) ? window.CHARACTERS[charId].name : charId);
    if (window.uiManager) window.uiManager.showToast(`🥋 Đã xuất trận: ${cName}!`);
    if (window.audioManager) {
      if (typeof window.audioManager.playSkill === 'function') window.audioManager.playSkill();
      if (typeof window.audioManager.playVovinamKiai === 'function') window.audioManager.playVovinamKiai('special');
    }
    this.updateOverlayUI();
  }

  setDummyArchetype(typeId) {
    if (!this.dummy) return;
    const names = {
      dummy_wood: 'Mộc Nhân Gỗ Võ Đường',
      thug: 'Côn Đồ Đường Phố',
      enemy_guard: 'Vệ Binh Giáp Trụ',
      enemy_dodger: 'Sát Thủ Thân Pháp',
      enemy_baton: 'Côn Đồ Gậy Điện',
      enemy_blade: 'Sát Thủ Mã Tấu',
      enemy_shield: 'Vệ Binh Khiên Bạo Động',
      boss_haclang: 'Boss Hắc Lang',
      boss_thietquyen: 'Boss Thiết Quyền',
      boss_hoanganh: 'Boss Phó Đặng Hoàng Anh',
      boss_dinhan: 'Boss Triệu Đình An',
      boss_longvuong: 'Boss Long Vương'
    };
    this.dummy.setDummyStyle(typeId, names[typeId] || 'Hình Nộm Thử Nghiệm');
    if (window.uiManager) {
      window.uiManager.hideBossHUD();
      window.uiManager.showToast(`Hình nộm đổi thành: ${names[typeId] || typeId}`);
    }
  }

}

window.TrainingManagerModes = TrainingManagerModes;
