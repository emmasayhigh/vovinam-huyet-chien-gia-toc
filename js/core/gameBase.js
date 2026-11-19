/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/core/gameBase.js - Trang thai game, vong lap, setup man va cap nhat moi khung hinh.
 *
 * Cac nhom logic khac ke thua tiep:
 *   gameWave.js -> gameCamera.js -> gameFlow.js -> gameStory.js -> gameRender.js -> game.js
 */

class GameBase {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = 1280;
    this.height = 720;

    // Game State
    this.state = 'MENU'; // 'MENU', 'PLAYING', 'CUTSCENE', 'PAUSED', 'STAGE_CLEAR', 'GAME_OVER', 'GRAND_VICTORY'
    this.previousState = 'MENU';

    // Thời Gian Vòng Lặp
    this.lastTime = 0;
    this.stageElapsedTime = 0;
    this.isLoopRunning = false;

    // Entities
    this.player = new Player(150, 580);
    this.enemies = [];
    this.currentBoss = null;

    // Camera
    this.camera = { x: 0, y: 0, minX: 0, maxX: 2600 - 1280 };

    // Wave Progression & Tiếp viện
    this.currentWaveIndex = 0;
    this.activeWaves = [];
    this.isBossSpawned = false;
    this.isBossCutsceneTriggered = false;
    this.clearedWaveIndices = new Set();
    this.currentWaveReinforcements = [];
    this.triggeredReinforcementIds = new Set();
    this.currentWaveTime = 0;

    // Arena Lock (Ranh giới khu vực chiến đấu & Đấu trường Boss)
    this.arenaLocked = false;
    this.arenaMinX = 20;
    this.arenaMaxX = 2600;
    this.combatMode = 'CROWD'; // 'CROWD' (Quần chiến) | 'DUEL' (Đấu võ 1v1)
    this.currentWaveActive = false;
    this.currentWaveRequiredEnemies = [];

    // Hit-stop (khựng hình khi trúng đòn) & thanh letterbox điện ảnh
    this.hitStop = 0;
    this.cineBar = 0;

    // ==== Hệ thống mới: token ra đòn, đạn bay, nhiệm vụ trốn thoát, zoom điện ảnh ====
    this.attackTokens = new Map(); // enemy -> { grant }
    this.maxAttackTokens = 2;
    this.projectiles = [];
    this.escapeTimer = 0;
    this.bossZoom = 0;            // zoom camera khi boss ra mắt (0 = không zoom)
    this.bossIntroTarget = null;
    this.endingShown = false;

    // Hệ thống Huyết Án Họ Phó & Điều tra:
    this.stageEvidence = null;
    this.dungHaiSubdueMode = false;
    this.dungHaiSubdued = false;
    this.allyCooldown = 0;

    // Ngô Nhất Nghị trình diễn trên màn hình tiêu đề
    this.titleHero = {
      type: 'player', x: 900, y: 640, z: 0, vx: 0, facing: -1,
      state: 'idle', animTime: 0, stateTimer: 0, stateDuration: 0,
      renderScale: 2.5, energy: 0, maxEnergy: 100, invincibleTimer: 0
    };
    this.titleSeq = [['idle', 1.8], ['punch_straight', 0.5], ['punch_hook', 0.6], ['kick_roundhouse', 0.9], ['idle', 1.2], ['kick_push', 0.7]];
    this.titleIdx = 0;
  }

  // Khởi Động Vòng Lặp Chính (Chỉ chạy 1 vòng lặp duy nhất)
  startLoop() {
    if (this.isLoopRunning) return;
    if (typeof window !== 'undefined' && window.uiCore && !this._uiCoreLoopHooked && typeof window.uiCore.onOverlayChange === 'function') {
      this._uiCoreLoopHooked = true;
      window.uiCore.onOverlayChange(() => {
        if (!this.isLoopRunning && (this.state !== 'MENU' || !window.uiCore.shouldPauseMenuGameLoop())) {
          this.startLoop();
        }
      });
    }
    this._menuFrameRendered = false;
    this.isLoopRunning = true;
    this.lastTime = performance.now();
    this._lastLogicTickAt = this.lastTime;
    this._bindBackgroundKeepAlive();
    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  _bindBackgroundKeepAlive() {
    if (this._bgTickerBound) return;
    this._bgTickerBound = true;

    const tickIfStalled = () => {
      const om = window.onlineManager;
      if (!om || !om.isActive || this.state === 'MENU') return;
      const now = performance.now();
      if ((now - (this._lastLogicTickAt || 0)) >= 180) {
        this.catchUpBackgroundSimulation(now);
      }
    };

    const timer = setInterval(tickIfStalled, 250);
    if (timer && typeof timer.unref === 'function') timer.unref();
    this._bgKeepAliveInterval = timer;

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (window.input && typeof window.input.clearAll === 'function') {
            window.input.clearAll();
          }
          tickIfStalled();
        } else {
          this.catchUpBackgroundSimulation(performance.now());
        }
      });
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('blur', () => {
        if (window.input && typeof window.input.clearAll === 'function') {
          window.input.clearAll();
        }
      });
    }
  }

  catchUpBackgroundSimulation(now = performance.now()) {
    const om = window.onlineManager;
    if (!om || !om.isActive || this.state === 'MENU') return 0;
    const prev = this._lastLogicTickAt || this.lastTime || now;
    let remain = Math.min(2.4, Math.max(0, (now - prev) / 1000));
    if (remain < 0.12) return 0;
    this._lastLogicTickAt = now;
    this.lastTime = now;
    let steps = 0;
    while (remain > 0.001) {
      const sub = Math.min(0.05, remain);
      remain -= sub;
      this.stepSimulation(sub, false);
      steps++;
    }
    return steps;
  }

  // ==========================================================================
  // DỌN SẠCH TRẠNG THÁI CHẾ ĐỘ PHỤ & TIMER TRƯỚC KHI ĐỔI MÀN / VỀ MENU
  // ==========================================================================
  resetTransientModes(opts = {}) {
    this.cancelGameOverTimer();
    this.clearLaterTimers();

    if (window.stageManager && typeof window.stageManager.cancelDialogue === 'function') {
      window.stageManager.cancelDialogue();
    }
    if (window.clanConfrontation) {
      if (typeof window.clanConfrontation.cancel === 'function') {
        window.clanConfrontation.cancel();
      } else if (typeof window.clanConfrontation.close === 'function') {
        window.clanConfrontation.close();
      }
    }
    if (!opts.keepBossRush && window.bossRushManager && typeof window.bossRushManager.cancel === 'function') {
      window.bossRushManager.cancel();
    }
    if (!opts.keepFlashback && window.flashbackMission && typeof window.flashbackMission.cancel === 'function') {
      window.flashbackMission.cancel();
    }
    if (window.trainingManager) {
      window.trainingManager.isActive = false;
      window.trainingManager.noCooldown = false;
      if (typeof window.trainingManager.hideOverlay === 'function') window.trainingManager.hideOverlay();
    }
    if (window.tutorialManager) {
      window.tutorialManager.isActive = false;
      if (typeof window.tutorialManager.hideOverlay === 'function') window.tutorialManager.hideOverlay();
    }
    if (window.allyManager && typeof window.allyManager.reset === 'function') {
      window.allyManager.reset();
    }
    if (window.propSystem) {
      window.propSystem.props = [];
    }
    this._activeHazards = [];
    this.stageHazardMode = null;

    if (!opts.keepBossRush) this.isBossRush = false;
    this.pendingChoice = null;
    this.hitStop = 0;
    this.bossZoom = 0;
    this.bossIntroTarget = null;
    this._bossDefeatedHandled = false;
    this._pausedNoModalTimer = 0;
    this.stageCompletedPending = false;
    this._waveVictoryScheduled = false;
    this.endingShown = false;
  }

  // ==========================================================================
  // KHỞI ĐỘNG HOẶC ĐỔI MÀN CHƠI (STAGE SETUP)
  // ==========================================================================
  startStage(stageNumber = 1) {
    const maxStage = (window.STAGE_DEFINITIONS && Math.max(20, ...Object.keys(window.STAGE_DEFINITIONS).map(Number).filter(Number.isFinite))) || 20;
    const sNum = Math.max(1, Math.min(maxStage, Number(stageNumber) || 1));
    // Nếu là Màn 1 và tài khoản mới cần hướng dẫn tân thủ
    if (sNum === 1 && window.tutorialManager && typeof window.tutorialManager.isTutorialNeeded === 'function' && window.tutorialManager.isTutorialNeeded()) {
      if (window.menuManager && typeof window.menuManager.hideAll === 'function') {
        window.menuManager.hideAll();
      }
      window.tutorialManager.showInviteModal(
        () => {
          if (window.uiManager) window.uiManager.hideTitleScreen();
          window.tutorialManager.startTutorial();
        },
        () => {
          if (window.saveManager) window.saveManager.skipTutorial();
          if (window.uiManager) window.uiManager.hideTitleScreen();
          this.startStage(1);
        }
      );
      return;
    }

    this.resetTransientModes();

    if (window.stageManager) {
      window.stageManager.setStage(sNum);
    }
    const stageData = window.stageManager ? window.stageManager.getCurrentStage() : null;
    if (!stageData) return;
    const stageWidth = (window.stageManager && window.stageManager.stageWidth) || stageData.width || 2600;

    // ==== CHỌN NHÂN VẬT: nhiệm vụ phụ buộc nhân vật, còn lại theo lựa chọn của người chơi ====
    let charId = stageData.forcedCharacter || (window.saveManager && window.saveManager.data.selectedCharacter) || 'nghi';
    if (!stageData.forcedCharacter && window.saveManager && !window.saveManager.isCharacterUnlocked(charId)) charId = 'nghi';
    if (!(window.CHARACTERS && window.CHARACTERS[charId] && window.CHARACTERS[charId].playable)) charId = 'nghi';
    this.player.setCharacter(charId);

    // Reset Người Chơi
    this.player.reset(120, 580);

    // Reset Enemies & Waves
    this.enemies = [];
    this.currentBoss = null;
    this.currentWaveIndex = 0;
    this.isBossSpawned = false;
    this.isBossCutsceneTriggered = false;
    this.arenaLocked = false;
    this.arenaMinX = 20;
    this.arenaMaxX = stageWidth - 20;
    this.combatMode = 'CROWD';
    this.currentWaveActive = false;
    this.currentWaveRequiredEnemies = [];
    this.clearedWaveIndices = new Set();
    this.currentWaveReinforcements = [];
    this.triggeredReinforcementIds = new Set();
    this.currentWaveTime = 0;
    this.stageElapsedTime = 0;

    // Reset trạng thái mới
    this.projectiles = [];
    this.attackTokens.clear();
    // Độ khó leo thang: màn đầu chỉ 1 địch được ra đòn cùng lúc, về sau tăng lên
    this.maxAttackTokens = (sNum <= 1) ? 1 : 2;
    this.escapeTimer = 2.5;
    this.bossZoom = 0;
    this.stageCompletedPending = false;
    this._waveVictoryScheduled = false;
    this.endingShown = false;
    this.previousState = 'PLAYING';

    // Bằng chứng có thể thu thập trong màn chơi này (KHÔNG kích hoạt trong chế độ Online)
    const isOnlineMatch = !!(window.onlineManager && window.onlineManager.isActive);
    const inv = window.investigationManager;
    if (!isOnlineMatch && inv && inv.docs) {
      const docEntry = Object.values(inv.docs).find(d => Number(d.stageOrigin) === sNum);
      if (docEntry && !inv.isFound(docEntry.id)) {
        this.stageEvidence = { id: docEntry.id, x: docEntry.pickupX, y: 560, collected: false, doc: docEntry };
      } else {
        this.stageEvidence = null;
      }
    } else {
      this.stageEvidence = null;
    }
    this.dungHaiSubdueMode = false;
    this.dungHaiSubdued = false;
    this.allyCooldown = 0;
    this.stageTimeLimit = Number(stageData.timeLimit) > 0 ? Number(stageData.timeLimit) : 0;
    this._lastDisplayedTimeSec = -1;
    this._timeLimitWarned = false;
    this.stageHazardMode = stageData.hazardMode || null;
    this._hazardTimer = this.stageHazardMode === 'fire_talismans' ? 3.0 : 0;
    this._activeHazards = [];
    this.updateAllyHUD();

    // Camera
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.maxX = Math.max(0, stageWidth - this.width);

    // Reset Combat & Effects & Weapons & Props
    if (window.combatSystem) window.combatSystem.resetStageStats();
    if (window.effectManager) {
      if (typeof window.effectManager.clearCombatEffects === 'function') window.effectManager.clearCombatEffects();
      window.effectManager.setWeather(sNum);
    }
    if (window.weaponSystem) window.weaponSystem.reset(this.player);
    if (window.propSystem) window.propSystem.initStage(sNum);

    // BGM & HUD
    if (window.audioManager) window.audioManager.startStageBGM(sNum);
    if (window.uiManager) {
      window.uiManager.hideTitleScreen();
      window.uiManager.showHUD();
      window.uiManager.hideBossHUD();
      window.uiManager.hideStageClear();
      window.uiManager.hideGameOver();
      window.uiManager.hideGrandVictory();
      window.uiManager.hideEnding();
      window.uiManager.hideChoice();
      window.uiManager.hidePause();
      window.uiManager.setCharacterHUD(this.player);
      window.uiManager.setObjective(stageData.objective);
      window.uiManager.updatePlayerHp(this.player.hp, this.player.maxHp);
      window.uiManager.updatePlayerEnergy(this.player.energy, this.player.maxEnergy);
    }
    if (window.menuManager) window.menuManager.hideAll();

    // Phát Thoại Khởi Đầu Màn Chơi (Intro Cutscene)
    const beginGameplay = () => {
      this.state = 'PLAYING';
      if (window.uiManager) window.uiManager.showHUD();
      this.summonStoryAlly(stageData);
    };
    if (stageData.introDialogue && stageData.introDialogue.length > 0) {
      this.state = 'CUTSCENE';
      if (window.uiManager) window.uiManager.hideHUD();
      window.stageManager.playDialogueSequence(stageData.introDialogue, beginGameplay);
    } else {
      beginGameplay();
    }

    this.startLoop();
  }

  // ==========================================================================
  // MÔ PHỎNG LOGIC MỘT BƯỚC (DÙNG CHUNG CHO rAF VÀ BACKGROUND TAB KEEP-ALIVE)
  // ==========================================================================
  stepSimulation(rawDt, allowRender = true) {
    this._lastLogicTickAt = performance.now();
    // Cập nhật Hiệu Ứng (bao gồm slow-motion scale)
    const dt = window.effectManager ? window.effectManager.update(rawDt) : rawDt;

    // Cập nhật Logic (hit-stop đóng băng logic chiến đấu trong vài khung hình)
    try {
      if (this.hitStop > 0) {
        this.hitStop -= rawDt;
      } else if (this.state === 'PLAYING') {
        this.updatePlaying(dt);
        if (window.tutorialManager && window.tutorialManager.isActive) {
          window.tutorialManager.update(dt);
        }
      } else if (this.state === 'TRAINING') {
        this.updatePlaying(dt);
        if (window.trainingManager) window.trainingManager.update(dt);
      } else if (this.state === 'TUTORIAL') {
        this.updatePlaying(dt);
        if (window.tutorialManager) window.tutorialManager.update(dt);
      } else if (this.state === 'CUTSCENE') {
        this.updateCutscene(dt);
      } else if (this.state === 'MENU') {
        this.updateMenu(rawDt);
      } else if (this.state === 'PAUSED') {
        if (window.onlineManager && window.onlineManager.isActive) {
          this.state = this.previousState || 'PLAYING';
          this._onlinePauseOpen = true;
          this.updatePlaying(dt);
        }
        const titleScreen = document.getElementById('title-screen');
        const isTitleScreenVisible = titleScreen && !titleScreen.classList.contains('hidden');
        if (isTitleScreenVisible) {
          this.state = 'MENU';
          this.previousState = 'MENU';
          this._pausedNoModalTimer = 0;
          return 'CONTINUE';
        }
        // Cơ chế bảo vệ chống softlock: nếu game đang ở trạng thái PAUSED nhưng KHÔNG CÓ bất kỳ modal nào hiển thị
        const anyModal = document.querySelector('.modal-overlay:not(.hidden)');
        if (!anyModal) {
          if (!this._pausedNoModalTimer) this._pausedNoModalTimer = 0;
          this._pausedNoModalTimer += rawDt;
          const inp = window.input;
          const wantsToPlay = inp && (
            inp.moveLeft || inp.moveRight || inp.moveUp || inp.moveDown ||
            inp.punch || inp.kick || inp.jump || inp.dodge || inp.block ||
            inp.isDown('KeyW') || inp.isDown('KeyA') || inp.isDown('KeyS') || inp.isDown('KeyD') ||
            inp.isDown('ArrowLeft') || inp.isDown('ArrowRight')
          );
          if (this._pausedNoModalTimer > 0.35 || wantsToPlay) {
            console.warn('[Vovinam Guardian] Khôi phục trạng thái hoạt động sau khi đóng modal');
            this.state = this.previousState || 'PLAYING';
            this._pausedNoModalTimer = 0;
            if (window.input && typeof window.input.clearAll === 'function') {
              window.input.clearAll();
            }
          }
        } else {
          this._pausedNoModalTimer = 0;
        }
      }
      if (this.state !== 'CUTSCENE') this._cutsceneInputCleared = false;
      this.cineBar += ((this.state === 'CUTSCENE' ? 1 : 0) - this.cineBar) * Math.min(1, rawDt * 6);

      // Zoom điện ảnh khi boss ra mắt — tự lùi về bình thường
      if (this.bossZoom > 0) {
        this.bossZoom = Math.max(0, this.bossZoom - rawDt * (this.state === 'CUTSCENE' ? 0.35 : 0.8));
        if (this.bossZoom === 0) this.bossIntroTarget = null;
      }

      // Nghỉ hoàn toàn rAF nền khi đang ở Title Screen hoặc mở modal phủ kín để tiết kiệm CPU/GPU
      if (this.state === 'MENU' && typeof window !== 'undefined' && window.uiCore && window.uiCore.shouldPauseMenuGameLoop()) {
        if (allowRender && !this._menuFrameRendered) {
          this._menuFrameRendered = true;
          this.render();
        }
        return 'STOP_MENU';
      }

      // Render Đồ Họa (Tối ưu hóa: Chỉ bỏ qua render nền khi đang ở MENU với modal toàn màn hình như Võ Đường / Chọn Đồng Minh)
      const isFullScreenModalOpen = !!(this.state === 'MENU' && typeof document !== 'undefined' && document.querySelector && document.querySelector('.cs-modal-screen:not(.hidden)'));
      if (allowRender && !isFullScreenModalOpen) {
        try {
          this.render();
        } catch (renderErr) {
          console.error('[GameRender Error]', renderErr);
        }
      }
    } catch (loopErr) {
      console.error('[GameLoop Error]', loopErr);
      if (allowRender && this.state !== 'MENU') {
        try { this.render(); } catch (_) {}
      }
    }

    // Reset Input Pressed Flag sau mỗi frame
    if (window.input) {
      try {
        window.input.update();
      } catch (_) {}
    }
    return 'CONTINUE';
  }

  // ==========================================================================
  // VÒNG LẶP CHÍNH CỦA GAME (GAME LOOP)
  // ==========================================================================
  gameLoop(currentTime) {
    const om = window.onlineManager;
    const elapsedSec = Math.max(0, (currentTime - this.lastTime) / 1000);
    // Nếu tab vừa quay lại sau khi bị trình duyệt tạm dừng lúc đấu Online, bù ngay mô phỏng để không kẹt knockdown/state
    if (om && om.isActive && this.state !== 'MENU' && elapsedSec > 0.14) {
      this.catchUpBackgroundSimulation(currentTime);
    }
    const rawDt = Math.min(0.1, elapsedSec);
    this.lastTime = currentTime;

    const status = this.stepSimulation(rawDt, true);
    if (status === 'STOP_MENU') {
      this.isLoopRunning = false;
      return;
    }

    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  // ==========================================================================
  // CẬP NHẬT TRONG TRẬN ĐẤU (PLAYING UPDATE)
  // ==========================================================================
  updatePlaying(dt) {
    this.stageElapsedTime += dt;

    // 1. Cập nhật Hệ thống Chiến đấu (Combat Combos & Counters)
    if (window.combatSystem) {
      window.combatSystem.update(dt);
    }

    // 1b. Cập nhật Hệ thống Vũ khí rơi & nhặt
    if (window.weaponSystem) {
      window.weaponSystem.update(dt, this.player, this.enemies);
    }

    // 1c. Cập nhật Vật thể sân khấu & va chạm môi trường (Wall Splat — bỏ qua Võ đường / Tân thủ)
    if (window.propSystem && this.state !== 'TRAINING' && this.state !== 'TUTORIAL') {
      window.propSystem.update(dt, this.player, this.enemies);
    }

    // 2. Cập nhật Ngô Nhất Nghị
    this.player.update(dt, this.enemies);

    // 3. Cập nhật Đối Thủ & Boss (truyền danh sách địch để xử lý giãn cách không dồn cục)
    const isCoopGuest = !!(window.onlineManager && window.onlineManager.isActive && window.onlineManager.mode === 'coop' && window.onlineManager.slot !== 1);
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (isCoopGuest) {
        enemy.animTime = (enemy.animTime || 0) + dt;
        enemy.stateTimer = (enemy.stateTimer || 0) + dt;
        if (enemy.hitJitterTimer > 0) enemy.hitJitterTimer = Math.max(0, enemy.hitJitterTimer - dt);
        if (enemy.invincibleTimer > 0) enemy.invincibleTimer = Math.max(0, enemy.invincibleTimer - dt);
        if (enemy.burnTimer > 0) enemy.burnTimer = Math.max(0, enemy.burnTimer - dt);
        if (enemy.bleedTimer > 0) enemy.bleedTimer = Math.max(0, enemy.bleedTimer - dt);
        if (enemy.chillTimer > 0) enemy.chillTimer = Math.max(0, enemy.chillTimer - dt);
        if (enemy.stunTimer > 0) enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
        if (enemy.armorBreakTimer > 0) enemy.armorBreakTimer = Math.max(0, enemy.armorBreakTimer - dt);
        continue;
      }
      enemy.update(dt, this.player, this.enemies);

      // Đồng bộ trạng thái tử vong nếu HP đã về 0 bởi sát thương cộng thêm/nội tại
      if (!enemy.isDead && typeof enemy.hp === 'number' && enemy.hp <= 0) {
        enemy.hp = 0;
        enemy.isDead = true;
        enemy.isAttacking = false;
        enemy.stunTimer = 0;
        if (typeof enemy.setState === 'function') enemy.setState('knockdown', 1.0);
      }

      // Chống lỗi kẹt kẻ địch bắt buộc / Boss văng ra ngoài ranh giới đấu trường bị khóa
      if (!enemy.isDead) {
        if (isFinite(enemy.y)) {
          enemy.y = Math.max(515, Math.min(640, enemy.y));
        }
        if (this.arenaLocked && (enemy.isBoss || this.currentWaveRequiredEnemies.includes(enemy))) {
          enemy.x = Math.max(this.arenaMinX + 18, Math.min(this.arenaMaxX - 18, enemy.x));
        }
      }

      // Xóa xác lính thường sau khi nằm sàn một khoảng thời gian
      if (enemy.isDead && enemy.stateTimer > 2.5 && !enemy.isBoss) {
        this.enemies.splice(i, 1);
      }
    }

    // Giãn cách vật lý mềm giữa Người chơi và Đối thủ / Mộc nhân (chống đứng xuyên tâm lồng hình vào nhau)
    if (this.player && !this.player.isDead && this.player.state !== 'scissor_kick') {
      for (const enemy of this.enemies) {
        if (!enemy || enemy.isDead || enemy.state === 'knockdown') continue;
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        if (Math.abs(dx) < 32 && Math.abs(dy) < 16) {
          const pushX = (32 - Math.abs(dx)) * 0.45;
          const sign = dx >= 0 ? 1 : -1;
          this.player.x += sign * pushX;
          if (!isCoopGuest) enemy.x -= sign * pushX;
        }
      }
    }

    // 4. Quản lý Đợt Kẻ Địch (Wave Spawning) & Cơ chế cốt truyện riêng từng màn
    this.checkWaveProgress(dt);
    this.updateStageStoryMechanics(dt);

    // 4b. Bảo hộ bất tử tức thời ngay khoảnh khắc Boss vừa gục (chống chết oan do đạn rơi / xuất huyết / lính lẻ trong 1.8s chờ thắng)
    if (this.currentBoss && this.currentBoss.isDead && !this._bossDefeatedHandled) {
      this._bossDefeatedHandled = true;
      this.cancelGameOverTimer();
      this.projectiles = [];
      if (this.player) {
        if (this.player.isDead && this.player.hp <= 0) {
          this.player.isDead = false;
          this.player.hp = Math.max(1, Math.round(this.player.maxHp * 0.05));
          if (this.player.state === 'dead') this.player.setState('idle', 0);
        }
        this.player.bleedTimer = 0;
        this.player.stunTimer = 0;
        this.player.invincibleTimer = Math.max(this.player.invincibleTimer || 0, 5.0);
      }
      if (!this.isBossRush) {
        for (const e of this.enemies) {
          if (e && !e.isBoss && !e.isDead) {
            e.hp = 0;
            e.isDead = true;
            e.setState('knockdown', 2.0);
          }
        }
      }
    }

    // 5. Kiểm tra Trận Đấu Boss Hoàn Thành (Chiến dịch)
    if (!this.isBossRush && this.currentBoss && this.currentBoss.isDead && this.currentBoss.stateTimer > 1.8) {
      if (this.currentBoss.type === 'boss_dunghai' && this.dungHaiSubdueMode && !this.dungHaiSubdued) {
        this.triggerDungHaiSubdued();
        return;
      }
      this.triggerStageVictory();
      return;
    }

    // 6. Hiệp ước (Bích Lâm): hạ anh ta xuống 30% máu -> thay vì giết
    if (this.currentBoss && !this.currentBoss.isDead && this.currentBoss.truceEnabled &&
        !this.currentBoss.truceTriggered && this.currentBoss.hp <= this.currentBoss.maxHp * this.currentBoss.truceAt) {
      this.triggerTruce();
      return;
    }

    // 7. Nhiệm vụ trốn thoát: chạy tới cửa là thắng, thỉnh thoảng có kẻ đuổi theo
    const stageData = window.stageManager ? window.stageManager.getCurrentStage() : null;
    if (stageData && stageData.escape) {
      this.escapeTimer -= dt;
      if (this.escapeTimer <= 0) {
        this.escapeTimer = stageData.chaserInterval || 4.5;
        this.spawnChasers();
      }
      if (this.player.x >= (stageData.exitX || 2380)) {
        this.triggerStageVictory();
        return;
      }
    }

    // 8. Đạn / vật bay (Dung Hải ném đồ môi trường)
    this.updateProjectiles(dt);

    // 8b. Kiểm tra nhặt Bằng Chứng / Manh Mối trong màn (chặn hoàn toàn khi đang chơi Online)
    if (this.stageEvidence && !this.stageEvidence.collected && !(window.onlineManager && window.onlineManager.isActive)) {
      const dist = Math.abs(this.player.x - this.stageEvidence.x);
      if (dist < 85) {
        const inp = window.input;
        const pressedPickup = inp && (
          (typeof inp.isActionJustPressed === 'function' && inp.isActionJustPressed('punch')) ||
          (typeof inp.isKeyJustPressed === 'function' && inp.isKeyJustPressed('KeyE')) ||
          (typeof inp.isJustPressed === 'function' && inp.isJustPressed('KeyE')) ||
          inp.punch
        );
        if (pressedPickup) {
          this.collectStageEvidence();
        }
      }
    }

    // 8c. Chi viện Đồng Minh Vovinam / Họ Phó [Phím H]
    if (this.allyCooldown > 0) this.allyCooldown -= dt;
    const inp = window.input;
    if (inp && (
      (typeof inp.isKeyJustPressed === 'function' && (inp.isKeyJustPressed('KeyH') || inp.isKeyJustPressed('KeyT'))) ||
      (typeof inp.isJustPressed === 'function' && (inp.isJustPressed('KeyH') || inp.isJustPressed('KeyT')))
    )) {
      this.triggerAllySupport();
    }

    // Cập nhật Đồng Minh Thực Chiến
    if (window.allyManager) {
      window.allyManager.update(dt, this.player, this.enemies);
    }

    // Cập nhật Tái Đấu Boss
    if (this.isBossRush && window.bossRushManager) {
      window.bossRushManager.update(dt);
    }

    // 8d. Kiểm tra khống chế Dung Hải (Màn 7 nhánh B)
    if (this.currentBoss && this.currentBoss.type === 'boss_dunghai' && this.dungHaiSubdueMode && !this.dungHaiSubdued) {
      if (this.currentBoss.isDead || this.currentBoss.hp <= this.currentBoss.maxHp * 0.2) {
        this.triggerDungHaiSubdued();
        return;
      }
    }

    // 8e. Cập nhật Hồi Ức nếu đang chơi
    if (window.flashbackMission && window.flashbackMission.isActive) {
      window.flashbackMission.update(dt);
    }

    // 9. Giải phóng "suất" ra đòn của AI (không cho cả lô cùng tấn công)
    this.pruneAttackTokens();

    // 10. Cập nhật Camera theo Người Chơi
    this.updateCamera(dt);
  }

  // Cập nhật Trong Đoạn Thoại Cắt Cảnh (Cutscene)
  // Diễn võ trên màn hình tiêu đề
  updateMenu(dt) {
    const h = this.titleHero;
    h.animTime += dt;
    h.stateTimer += dt;
    if (h.stateTimer >= h.stateDuration) {
      this.titleIdx = (this.titleIdx + 1) % this.titleSeq.length;
      const [s, d] = this.titleSeq[this.titleIdx];
      h.state = s; h.stateDuration = d; h.stateTimer = 0; h.animTime = 0;
    }
  }

  updateCutscene(dt) {
    // Giữ nhân vật "thở" trong lúc thoại
    this.player.animTime += dt;
    for (const e of this.enemies) e.animTime += dt;
    // Vừa vào cutscene: xóa phím bấm còn nằm trong buffer (J/Space của đòn trước đó) để không nhảy mất câu thoại đầu
    if (!this._cutsceneInputCleared) {
      this._cutsceneInputCleared = true;
      if (window.input) {
        window.input.actionBuffer = [];
        window.input.justPressed = {};
      }
      return;
    }
    // Cho phép người chơi nhấn Space hoặc Enter để lướt qua lời thoại
    if (window.input && window.input.dialogConfirm) {
      if (window.stageManager) {
        window.stageManager.advanceDialogue();
      }
    }
  }

  toast(msg) {
    if (window.uiManager && window.uiManager.showToast) window.uiManager.showToast(msg);
  }

  /**
   * Triệu hồi đồng minh cốt truyện đầu màn mà không ảnh hưởng nhân vật người chơi tự chọn.
   */
  summonStoryAlly(stageData) {
    if (!stageData || !stageData.storyAlly) return;
    if (window.onlineManager && window.onlineManager.isActive) return;
    if (!window.allyManager || !this.player) return;
    const heroId = this.player.charId || this.player.characterId;
    if (heroId === stageData.storyAlly) return;
    window.allyManager.cooldown = 0;
    window.allyManager.gauge = window.allyManager.maxGauge || 100;
    window.allyManager.summonAlly(stageData.storyAlly, this.player);
  }

  /**
   * Cập nhật đồng hồ đếm ngược nhiệm vụ khẩn và bẫy đàn tràng Bùa Hỏa Ngục theo màn chơi.
   */
  updateStageStoryMechanics(dt) {
    if (this.isBossRush || (window.onlineManager && window.onlineManager.isActive)) return;
    if (this.stageCompletedPending || this._waveVictoryScheduled || this.state === 'STAGE_CLEAR') return;
    if (window.trainingManager && window.trainingManager.isActive) return;

    const stageData = window.stageManager ? window.stageManager.getCurrentStage() : null;
    if (!stageData) return;

    if (this.stageTimeLimit > 0 && this.player && !this.player.isDead) {
      this.stageTimeLimit = Math.max(0, this.stageTimeLimit - dt);
      const sec = Math.ceil(this.stageTimeLimit);
      if (sec !== this._lastDisplayedTimeSec && window.uiManager && typeof window.uiManager.setObjective === 'function') {
        this._lastDisplayedTimeSec = sec;
        window.uiManager.setObjective(`⏱️ CÒN ${sec}S • ${stageData.objective}`);
      }
      if (!this._timeLimitWarned && sec <= 15 && sec > 0) {
        this._timeLimitWarned = true;
        this.toast('⚠️ CHỈ CÒN 15 GIÂY! MAU QUÉT SẠCH ĐỊCH!');
      }
      if (this.stageTimeLimit <= 0) {
        if (window.uiManager && typeof window.uiManager.showAlertBanner === 'function') {
          window.uiManager.showAlertBanner('⏱️ HẾT THỜI GIAN NHIỆM VỤ!');
        }
        this.player.hp = 0;
        this.player.isDead = true;
        this.player.setState('dead', 99);
        if (typeof this.triggerGameOver === 'function') this.triggerGameOver();
        return;
      }
    }

    if (this.stageHazardMode === 'fire_talismans' && this.player && !this.player.isDead) {
      this._hazardTimer -= dt;
      if (this._hazardTimer <= 0) {
        this._hazardTimer = 4.8;
        const stageW = window.stageManager ? window.stageManager.stageWidth : 2600;
        const offsets = [0, (Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 80)];
        for (const ox of offsets) {
          const hx = Math.max(80, Math.min(stageW - 80, this.player.x + ox));
          const hy = Math.max(525, Math.min(635, this.player.y + (Math.random() - 0.5) * 44));
          this._activeHazards.push({ x: hx, y: hy, radius: 74, timer: 1.35, maxTimer: 1.35 });
          if (window.effectManager) window.effectManager.createShockRing(hx, hy, '#f43f5e');
        }
      }
      for (let i = this._activeHazards.length - 1; i >= 0; i--) {
        const hz = this._activeHazards[i];
        hz.timer -= dt;
        if (hz.timer > 0) continue;
        this._activeHazards.splice(i, 1);
        if (window.effectManager) {
          window.effectManager.createShockRing(hz.x, hz.y, '#ef4444');
          if (typeof window.effectManager.createHitSparks === 'function') {
            window.effectManager.createHitSparks(hz.x, hz.y - 16, '#fb923c', 12);
          }
        }
        const dist = Math.hypot(this.player.x - hz.x, (this.player.y - hz.y) * 1.35);
        const isAirborne = (this.player.z || 0) > 36;
        if (dist <= hz.radius && !this.player.invincibleTimer && !isAirborne && !this.player.isDead) {
          const dmg = 26;
          this.player.hp = Math.max(0, this.player.hp - dmg);
          if (window.combatSystem && typeof window.combatSystem.applyBurn === 'function') {
            window.combatSystem.applyBurn(this.player, false, 9, 2.5);
          }
          if (window.uiManager) window.uiManager.updatePlayerHp(this.player.hp, this.player.maxHp);
          if (window.effectManager) window.effectManager.addFloatingText(`🔥 BÙA HỎA -${dmg}`, this.player.x, this.player.y - 110, 'burn');
          if (this.player.hp <= 0) {
            this.player.isDead = true;
            this.player.setState('dead', 99);
            if (typeof this.triggerGameOver === 'function') this.triggerGameOver();
          }
        }
      }
    }
  }


  later(fn, ms) {
    if (!this._laterTimers) this._laterTimers = new Set();
    const id = setTimeout(() => {
      this._laterTimers.delete(id);
      fn();
    }, ms);
    this._laterTimers.add(id);
    return id;
  }

  clearLaterTimers() {
    if (this._laterTimers) {
      this._laterTimers.forEach((id) => clearTimeout(id));
      this._laterTimers.clear();
    }
  }

}

window.GameBase = GameBase;
