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
    this.isLoopRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  // ==========================================================================
  // KHỞI ĐỘNG HOẶC ĐỔI MÀN CHƠI (STAGE SETUP)
  // ==========================================================================
  startStage(stageNumber = 1) {
    this.cancelGameOverTimer();
    this.clearLaterTimers();
    // Vô hiệu hóa dứt điểm chế độ Luyện Võ và Hướng Dẫn khi vào Màn Chiến Dịch
    if (window.trainingManager) {
      window.trainingManager.isActive = false;
      window.trainingManager.noCooldown = false;
      window.trainingManager.hideOverlay();
    }
    if (window.tutorialManager) {
      window.tutorialManager.isActive = false;
      window.tutorialManager.hideOverlay();
    }
    if (window.allyManager && typeof window.allyManager.reset === 'function') {
      window.allyManager.reset();
    }

    if (window.stageManager) {
      window.stageManager.setStage(stageNumber);
    }
    const stageData = window.stageManager.getCurrentStage();

    // ==== CHỌN NHÂN VẬT: nhiệm vụ phụ buộc nhân vật, còn lại theo lựa chọn của người chơi ====
    let charId = stageData.forcedCharacter || (window.saveManager && window.saveManager.data.selectedCharacter) || 'nghi';
    if (window.saveManager && !window.saveManager.isCharacterUnlocked(charId)) charId = 'nghi';
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
    this.arenaMaxX = window.stageManager ? window.stageManager.stageWidth - 20 : 2580;
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
    this.maxAttackTokens = (stageNumber <= 1) ? 1 : 2;
    this.escapeTimer = 2.5;
    this.bossZoom = 0;
    this.stageCompletedPending = false;
    this.endingShown = false;
    this.previousState = 'PLAYING';

    // Bằng chứng có thể thu thập trong màn chơi này
    const inv = window.investigationManager;
    if (inv && inv.docs) {
      const docEntry = Object.values(inv.docs).find(d => d.stageOrigin === stageNumber);
      if (docEntry && !inv.isFound(docEntry.id)) {
        this.stageEvidence = { id: docEntry.id, x: docEntry.pickupX, y: 560, collected: false, doc: docEntry };
      } else {
        this.stageEvidence = null;
      }
    } else {
      this.stageEvidence = null;
    }
    this.dungHaiSubdueMode = false;
    this.allyCooldown = 0;
    this.updateAllyHUD();

    // Camera
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.maxX = window.stageManager.stageWidth - this.width;

    // Reset Combat & Effects & Weapons & Props
    if (window.combatSystem) window.combatSystem.resetStageStats();
    if (window.effectManager) window.effectManager.setWeather(stageNumber);
    if (window.weaponSystem) window.weaponSystem.reset(this.player);
    if (window.propSystem) window.propSystem.initStage(stageNumber);

    // BGM & HUD
    if (window.audioManager) window.audioManager.startStageBGM(stageNumber);
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
    if (stageData.introDialogue && stageData.introDialogue.length > 0) {
      this.state = 'CUTSCENE';
      window.stageManager.playDialogueSequence(stageData.introDialogue, () => {
        this.state = 'PLAYING';
        if (window.uiManager) window.uiManager.showHUD();
        if (stageNumber === 1 && window.tutorialManager && window.tutorialManager.isTutorialNeeded()) {
          window.tutorialManager.startIngameTutorial();
        }
      });
    } else {
      this.state = 'PLAYING';
      if (window.uiManager) window.uiManager.showHUD();
      if (stageNumber === 1 && window.tutorialManager && window.tutorialManager.isTutorialNeeded()) {
        window.tutorialManager.startIngameTutorial();
      }
    }

    this.startLoop();
  }

  // ==========================================================================
  // VÒNG LẶP CHÍNH CỦA GAME (GAME LOOP)
  // ==========================================================================
  gameLoop(currentTime) {
    // Tính toán Delta Time chuẩn xác (giới hạn tối đa 0.1s tránh glitch)
    const rawDt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    // Cập nhật Hiệu Ứng (bao gồm slow-motion scale)
    const dt = window.effectManager ? window.effectManager.update(rawDt) : rawDt;

    // Cập nhật Logic (hit-stop đóng bang logic chiến đấu trong vài khung hình)
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
        const titleScreen = document.getElementById('title-screen');
        const isTitleScreenVisible = titleScreen && !titleScreen.classList.contains('hidden');
        if (isTitleScreenVisible) {
          this.state = 'MENU';
          this.previousState = 'MENU';
          this._pausedNoModalTimer = 0;
          // Phải tiếp tục vòng lặp, nếu không game sẽ đứng hình vĩnh viễn
          requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
          return;
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

      // Render Đồ Họa
      this.render();
    } catch (loopErr) {
      console.error('[GameLoop Error]', loopErr);
    }

    // Reset Input Pressed Flag sau mỗi frame
    if (window.input) {
      window.input.update();
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

    // 1c. Cập nhật Vật thể sân khấu & va chạm môi trường (Wall Splat)
    if (window.propSystem) {
      window.propSystem.update(dt, this.player, this.enemies);
    }

    // 2. Cập nhật Ngô Nhất Nghị
    this.player.update(dt, this.enemies);

    // 3. Cập nhật Đối Thủ & Boss (truyền danh sách địch để xử lý giãn cách không dồn cục)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, this.player, this.enemies);

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
          enemy.x -= sign * pushX;
        }
      }
    }

    // 4. Quản lý Đợt Kẻ Địch (Wave Spawning)
    this.checkWaveProgress();

    // 5. Kiểm tra Trận Đấu Boss Hoàn Thành
    if (this.currentBoss && this.currentBoss.isDead && this.currentBoss.stateTimer > 1.8) {
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
    const stageData = window.stageManager.getCurrentStage();
    if (stageData.escape) {
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

    // 8b. Kiểm tra nhặt Bằng Chứng / Manh Mối trong màn
    if (this.stageEvidence && !this.stageEvidence.collected) {
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
    if (this.currentBoss && this.currentBoss.type === 'boss_dunghai' && this.dungHaiSubdueMode &&
        !this.currentBoss.isDead && this.currentBoss.hp <= this.currentBoss.maxHp * 0.2) {
      this.triggerDungHaiSubdued();
      return;
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
