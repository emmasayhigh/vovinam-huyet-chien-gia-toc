/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/training/trainingManagerBase.js - Khoi tao, update, bat dau va ghi nhan bai tap.
 */

class TrainingManagerBase {
  constructor() {
    this.isActive = false;
    this.mode = 'free'; // Mặc định 'free' (tự do) | 'drill' (khảo hạch)
    this.currentDrillIndex = 0;
    this.dummy = null;
    this.drillProgress = 0;
    this.drillTarget = 1;
    this.overlay = null;
    this.noCooldown = false;
    this.playerGodMode = true; // Bất tử cho người chơi trong võ đường
    this.isMenuCollapsed = false;
    this.selectedTrainingChar = null;

    // Chống ghi nhận trùng lặp / nhảy cóc bài tập khi đánh dồn dập
    this._drillTransitioning = false;
    this._drillTransitionTimer = null;
    this.drillGraceTimer = 0;

    // Đo lường sát thương & combo (Fighting Game Telemetry)
    this.lastDamage = 0;
    this.currentComboDamage = 0;
    this.maxComboDamage = 0;
    this.maxComboHits = 0;

    // Bắt sự kiện bàn phím toàn cục:
    // [C]: Bật / Tắt menu tùy biến
    // [R]: Đặt lại vị trí đấu trường (Reset Position)
    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      if (e.repeat) return; // Chống spam khi giữ phím
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        if (e.code === 'Escape') {
          e.target.blur();
        }
        return;
      }
      if (e.code === 'KeyC') {
        e.preventDefault();
        this.toggleMenuCollapse();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        this.resetPositions();
      }
    });

    // 7 bài tập võ thuật (du lieu nam o js/data/training.js)
    this.drills = window.TRAINING_DRILLS;


    this.stats = {
      punches: 0,
      kicks: 0,
      dodges: 0,
      countersHand: 0,
      countersLeg: 0,
      combosDone: 0,
      ultimates: 0,
      alliesCalled: 0
    };
  }

  startTraining(mode = 'free', drillIndex = 0, charId = null) {
    this.isActive = true;
    this.mode = mode;
    this.currentDrillIndex = typeof drillIndex === 'number' ? drillIndex : 0;
    this.drillProgress = 0;
    this._drillTransitioning = false;
    if (this._drillTransitionTimer) {
      clearTimeout(this._drillTransitionTimer);
      this._drillTransitionTimer = null;
    }
    this.drillGraceTimer = 0.2;
    this.playerGodMode = true; // Luôn bảo hộ người chơi an toàn trong võ đường
    this.lastDamage = 0;
    this.currentComboDamage = 0;
    this.maxComboDamage = 0;
    this.maxComboHits = 0;

    // Reset sạch sẽ đồng minh nếu có từ trước
    if (window.allyManager && typeof window.allyManager.reset === 'function') {
      window.allyManager.reset();
    }

    const game = window.game;
    if (!game) return;

    // Tắt mưa hoàn toàn trong võ đường
    if (window.effectManager) {
      window.effectManager.isRaining = false;
      window.effectManager.rainDrops = [];
    }

    // Chọn nhân vật xuất trận trong võ đường (ưu tiên charId -> selectedTrainingChar -> saveManager -> 'nghi')
    const targetChar = charId || this.selectedTrainingChar || (window.saveManager && window.saveManager.data.selectedCharacter) || 'nghi';
    this.selectedTrainingChar = targetChar;
    if (window.saveManager) {
      window.saveManager.data.selectedCharacter = targetChar;
      window.saveManager.persist();
    }

    if (game.player) {
      if (typeof game.player.setCharacter === 'function') game.player.setCharacter(targetChar);
      if (typeof game.player.reset === 'function') game.player.reset(360, 580);
      else { game.player.x = 360; game.player.y = 580; }
      game.player.facing = 1;
      game.player.hp = game.player.maxHp || 1000;
      game.player.energy = 100;
      game.player.guardGauge = 100;
      game.player.dodgeCooldown = 0;
      game.player.counterCooldown = 0;
      game.player.counterHandCooldown = 0;
      game.player.counterLegCooldown = 0;
    }

    // Cập nhật mục tiêu và banner Bái Tổ Vovinam
    if (window.uiManager) {
      window.uiManager.hideTitleScreen();
      window.uiManager.showHUD();
      window.uiManager.hideBossHUD();
      if (game.player) window.uiManager.setCharacterHUD(game.player);
      window.uiManager.setObjective(this.mode === 'free' ? '⚡ VÕ ĐƯỜNG VOVINAM — LUYỆN TẬP TỰ DO' : '🥋 VÕ ĐƯỜNG VOVINAM — KHẢO HẠCH VÕ HỌC');
      window.uiManager.showAlertBanner('🥋 BÀN TAY THÉP ĐẶT LÊN TRÁI TIM TỪ ÁI');
    }

    game.state = 'TRAINING';
    game.arenaLocked = true;
    game.arenaMinX = 50;
    game.arenaMaxX = 1400;

    // Sinh Mộc Nhân ở cự ly vàng đối luyện (cách người chơi 140px)
    this.dummy = new TrainingDummy(500, 580);
    this.dummy.facing = -1;
    game.enemies = [this.dummy];
    game.currentBoss = null;

    // Reset Camera
    game.camera.x = 0;
    game.camera.y = 0;

    if (this.mode === 'drill') {
      this.setupDrill(this.currentDrillIndex);
    } else {
      this.dummy.attackMode = 'idle';
      this.updateOverlayUI();
    }
    this.showOverlay();

    if (window.audioManager) {
      window.audioManager.setBGMIntensity(0.8);
      window.audioManager.playSkill();
      if (typeof window.audioManager.playVovinamKiai === 'function') {
        window.audioManager.playVovinamKiai('salute');
      }
    }
  }


  resetPositions() {
    const game = window.game;
    if (!game) return;
    const p = game.player;
    if (p) {
      p.x = 360;
      p.y = 580;
      p.z = 0;
      p.vx = 0;
      p.vy = 0;
      p.vz = 0;
      p.facing = 1;
      p.state = 'idle';
      p.stateTimer = 0;
      p.stateDuration = 0;
      p.isAttacking = false;
      if (p.hitTargets && typeof p.hitTargets.clear === 'function') p.hitTargets.clear();
      p.hp = p.maxHp || 100;
      if (this.noCooldown) p.energy = p.maxEnergy || 100;
      if (window.uiManager) {
        window.uiManager.updatePlayerHp(p.hp, p.maxHp || 100);
        window.uiManager.updatePlayerEnergy(p.energy, p.maxEnergy || 100);
      }
    }
    if (this.dummy) {
      this.dummy.x = 500;
      this.dummy.y = 580;
      this.dummy.z = 0;
      this.dummy.vx = 0;
      this.dummy.vy = 0;
      this.dummy.vz = 0;
      this.dummy.facing = -1;
      this.dummy.state = 'idle';
      this.dummy.stateTimer = 0;
      this.dummy.stateDuration = 0;
      this.dummy.isAttacking = false;
      this.dummy.isDead = false;
      this.dummy.hp = this.dummy.maxHp;
      this.dummy.invincibleTimer = 0;
      this.dummy.telegraphTimer = 0;
      this.dummy.telegraphState = 'idle';
      this.dummy.stunTimer = 0;
      this.dummy.bleedTimer = 0;
      this.dummy.bleedTickTimer = 0;
      this.dummy.bleedDmg = 0;
    }
    if (game.camera) {
      game.camera.x = 0;
      game.camera.y = 0;
    }
    if (window.effectManager) {
      window.effectManager.createShockRing(360, 580, '#00d2ff');
      window.effectManager.createShockRing(500, 580, '#ffd700');
      window.effectManager.addFloatingText('ĐẶT LẠI VỊ TRÍ [R]', 430, 480, 'heal');
    }
    if (window.audioManager && typeof window.audioManager.playWhoosh === 'function') {
      window.audioManager.playWhoosh();
    }
    this.currentComboDamage = 0;
    this.updateOverlayUI();
  }

  recordDummyDamage(amount) {
    const dmg = Math.round(amount || 0);
    this.lastDamage = dmg;
    this.currentComboDamage += dmg;
    if (this.currentComboDamage > this.maxComboDamage) {
      this.maxComboDamage = this.currentComboDamage;
    }

    const currentHits = (window.combatSystem && window.combatSystem.comboCount) ? window.combatSystem.comboCount : 1;
    if (currentHits > this.maxComboHits) {
      this.maxComboHits = currentHits;
    }

    // Cập nhật ngay lập tức các phần tử DOM telemetry nếu đang hiển thị
    const elLast = document.getElementById('telemetry-last-dmg');
    if (elLast) elLast.textContent = this.lastDamage;
    const elCombo = document.getElementById('telemetry-combo-dmg');
    if (elCombo) elCombo.textContent = this.currentComboDamage;
    const elMax = document.getElementById('telemetry-max-combo');
    if (elMax) elMax.textContent = `${this.maxComboHits} Hits (${this.maxComboDamage} dmg)`;
  }

  setupDrill(index) {
    if (this._drillTransitionTimer) {
      clearTimeout(this._drillTransitionTimer);
      this._drillTransitionTimer = null;
    }
    this._drillTransitioning = false;
    this.drillGraceTimer = 0.25;

    if (index >= this.drills.length) {
      this.finishAllDrills();
      return;
    }

    this.currentDrillIndex = index;
    const drill = this.drills[index];
    this.drillProgress = 0;
    this.drillTarget = drill.target;

    const game = window.game;
    if (game && game.player) {
      if (typeof game.player.reset === 'function') {
        game.player.reset(360, 580);
      } else {
        game.player.x = 360;
        game.player.y = 580;
      }
      game.player.facing = 1;
      game.player.hp = game.player.maxHp || 100;
      game.player.comboStep = 0;
      game.player.queuedCombo = false;
      if (game.player.hitTargets && typeof game.player.hitTargets.clear === 'function') {
        game.player.hitTargets.clear();
      }
    }

    // Xóa bộ đệm phím để các đòn bấm ở bài trước không rơi sang bài mới
    if (window.input) {
      if (typeof window.input.clearAll === 'function') {
        window.input.clearAll();
      } else {
        window.input.actionBuffer = [];
        window.input.justPressed = {};
        window.input.keys = {};
      }
    }

    if (this.dummy) {
      this.dummy.x = 500;
      this.dummy.y = 580;
      this.dummy.facing = -1;
      this.dummy.attackMode = drill.dummyMode;
      this.dummy.telegraphTimer = 0;
      this.dummy.telegraphState = 'idle';
      this.dummy.invincibleTimer = 0;
      this.dummy.hitJitterTimer = 0;
      this.dummy.squashTimer = 0;
      this.dummy.state = 'idle';
      this.dummy.hp = this.dummy.maxHp;
      this.dummy.isDead = false;
      this.dummy.isAttacking = false;
      this.dummy.hasStruckThisCycle = false;
      this.dummy.stunTimer = 0;
      this.dummy.bleedTimer = 0;
      this.dummy.bleedTickTimer = 0;
      this.dummy.bleedDmg = 0;
      // Đánh dấu người chơi đã hit dummy cho đòn hiện tại (nếu đang vung dở) để không tính vào bài mới
      if (game && game.player && game.player.hitTargets && typeof game.player.hitTargets.add === 'function') {
        game.player.hitTargets.add(this.dummy.id);
      }
    }

    // Đặc biệt ở bài tuyệt kỹ: nạp đầy năng lượng
    if (drill.id === 'drill_ultimate' && window.game && window.game.player) {
      window.game.player.energy = window.game.player.maxEnergy;
      if (window.uiManager) window.uiManager.updatePlayerEnergy(100, 100);
    }

    // Đặc biệt ở bài đồng minh: mở tạm đồng minh để tập
    if (drill.id === 'drill_ally') {
      if (window.game) window.game.allyCooldown = 0;
      if (window.allyManager) {
        if (typeof window.allyManager.reset === 'function') window.allyManager.reset();
        window.allyManager.gauge = 100;
        window.allyManager.isReady = true;
        window.allyManager.updateHUD();
      }
    } else {
      // Các bài khác: thu hồi đồng minh nếu còn sót
      if (window.allyManager && typeof window.allyManager.reset === 'function') {
        window.allyManager.reset();
      }
    }

    this.updateOverlayUI();
  }

  recordAction(actionType, detail = {}) {
    if (!this.isActive) return;
    if (this._drillTransitioning || this.drillGraceTimer > 0) return;
    const drill = this.drills[this.currentDrillIndex];

    if (this.mode === 'drill' && drill) {
      let matched = false;

      if (drill.id === 'drill_move_attack') {
        if (actionType === 'punch' || actionType === 'kick') {
          this.drillProgress++;
          matched = true;
        }
      } else if (drill.id === 'drill_dodge' && actionType === 'perfect_dodge') {
        this.drillProgress++;
        matched = true;
      } else if (drill.id === 'drill_counter_hand' && actionType === 'counter_hand') {
        this.drillProgress++;
        matched = true;
      } else if (drill.id === 'drill_counter_leg' && actionType === 'counter_leg') {
        this.drillProgress++;
        matched = true;
      } else if (drill.id === 'drill_combos' && actionType === 'combo_finished') {
        this.drillProgress++;
        matched = true;
      } else if (drill.id === 'drill_ultimate' && actionType === 'ultimate_hit') {
        this.drillProgress++;
        matched = true;
      } else if (drill.id === 'drill_ally' && actionType === 'ally_summon') {
        this.drillProgress++;
        matched = true;
      }

      if (matched) {
        this.drillProgress = Math.min(this.drillTarget, this.drillProgress);
        if (window.effectManager) {
          window.effectManager.addFloatingText(`TIẾN ĐỘ: ${this.drillProgress}/${this.drillTarget}`, window.game.player.x, window.game.player.y - 140, 'heal');
        }
        if (window.audioManager) window.audioManager.playChime();
        this.updateOverlayUI();

        if (this.drillProgress >= this.drillTarget) {
          this.completeCurrentDrill();
        }
      }
    }
  }


  update(dt) {
    if (!this.isActive || !this.dummy) return;
    const inp = window.input;
    const player = window.game && window.game.player;
    const drill = this.drills[this.currentDrillIndex];

    // Duy trì bất tử cho người chơi nếu bật God Mode
    if (this.playerGodMode && player && player.hp < player.maxHp) {
      player.hp = player.maxHp;
      if (window.uiManager) window.uiManager.updatePlayerHp(player.hp, player.maxHp);
    }

    // Áp dụng Không Hồi Chiêu nếu được bật
    if (this.noCooldown) {
      if (player) {
        player.energy = player.maxEnergy;
        player.dodgeCooldown = 0;
        player.counterCooldown = 0;
        if (window.uiManager) {
          window.uiManager.updatePlayerEnergy(player.energy, player.maxEnergy);
          const cdDodge = document.getElementById('cd-dodge-text'); if (cdDodge) cdDodge.textContent = 'SẴN SÀNG';
          const cdHand = document.getElementById('cd-counter-hand-text'); if (cdHand) cdHand.textContent = 'SẴN SÀNG';
          const cdLeg = document.getElementById('cd-counter-leg-text'); if (cdLeg) cdLeg.textContent = 'SẴN SÀNG';
        }
      }
      if (window.allyManager) {
        window.allyManager.cooldown = 0;
        window.allyManager.gauge = window.allyManager.maxGauge;
        window.allyManager.updateHUD();
      }
    }

    // Giảm thời gian đệm bảo vệ chuyển bài
    if (this.drillGraceTimer > 0) {
      this.drillGraceTimer = Math.max(0, this.drillGraceTimer - dt);
    }

    // Reset chuỗi combo telemetry khi đòn đánh ngắt quãng
    if (window.combatSystem && window.combatSystem.comboCount === 0 && this.currentComboDamage > 0) {
      this.currentComboDamage = 0;
      const elCombo = document.getElementById('telemetry-combo-dmg');
      if (elCombo) elCombo.textContent = '0';
    }

    // Cập nhật thanh timing động nếu đang ở bài né hoặc phản đòn
    const meter = document.getElementById('training-timing-meter');
    if (meter && (this.dummy.attackMode === 'telegraph_hand' || this.dummy.attackMode === 'telegraph_leg')) {
      if (this.dummy.telegraphState === 'telegraph') {
        const pct = Math.min(100, (this.dummy.telegraphTimer / this.dummy.telegraphDuration) * 100);
        meter.style.width = pct + '%';
        meter.style.background = (pct > 70) ? '#ffd700' : '#ff3344';
      } else if (this.dummy.telegraphState === 'active') {
        meter.style.width = '100%';
        meter.style.background = '#00d2ff';
      } else {
        meter.style.width = '0%';
      }
    }

    // Cơ chế an toàn phát hiện hành vi trực tiếp nếu combat event bị miss
    if (this.mode === 'drill' && !this._drillTransitioning && this.drillGraceTimer <= 0 && drill && inp && player) {
      if (drill.id === 'drill_dodge') {
        // Bấm né (L hoặc Shift) khi dummy đang chuẩn bị hoặc vung đòn
        const isDodgeKey = (typeof inp.isActionJustPressed === 'function' && inp.isActionJustPressed('dodge')) ||
                           (typeof inp.isKeyJustPressed === 'function' && (inp.isKeyJustPressed('KeyL') || inp.isKeyJustPressed('ShiftLeft') || inp.isKeyJustPressed('ShiftRight')));
        if (isDodgeKey) {
          const isTimingWindow = (this.dummy.telegraphState === 'active') || 
                                 (this.dummy.telegraphState === 'telegraph' && this.dummy.telegraphTimer >= this.dummy.telegraphDuration * 0.6);
          if (isTimingWindow) {
            this.recordAction('perfect_dodge');
          }
        }
      } else if (drill.id === 'drill_counter_hand') {
        const isCounterHand = (typeof inp.isActionJustPressed === 'function' && inp.isActionJustPressed('counter_hand')) ||
                              (inp.isDown('KeyU') && (inp.isDown('KeyJ') || inp.punch));
        if (isCounterHand && (this.dummy.telegraphState === 'active' || (this.dummy.telegraphState === 'telegraph' && this.dummy.telegraphTimer >= this.dummy.telegraphDuration * 0.6))) {
          if (!this._lastCounterHandTime || performance.now() - this._lastCounterHandTime > 750) {
            this._lastCounterHandTime = performance.now();
            this.recordAction('counter_hand');
          }
        }
      } else if (drill.id === 'drill_counter_leg') {
        const isCounterLeg = (typeof inp.isActionJustPressed === 'function' && inp.isActionJustPressed('counter_leg')) ||
                              (inp.isDown('KeyU') && (inp.isDown('KeyK') || inp.kick));
        if (isCounterLeg && (this.dummy.telegraphState === 'active' || (this.dummy.telegraphState === 'telegraph' && this.dummy.telegraphTimer >= this.dummy.telegraphDuration * 0.6))) {
          if (!this._lastCounterLegTime || performance.now() - this._lastCounterLegTime > 750) {
            this._lastCounterLegTime = performance.now();
            this.recordAction('counter_leg');
          }
        }
      }
    }
  }
}

window.TrainingManagerBase = TrainingManagerBase;
