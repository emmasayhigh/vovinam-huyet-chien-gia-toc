/**
 * VOVINAM: SÁT THẦN GIẢI CỨU HỨA VŨ ĐẠI
 * js/game.js - Core Game Loop, State Machine, Wave Spawner & Camera Controller
 */

class Game {
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
  // ==========================================================================
  // FACTORY TẠO INSTANCE KẺ ĐỊCH HOÀN CHỈNH
  // Đầy đủ HP, AI, animation, hitbox, damage, collision theo đúng archetype
  // ==========================================================================
  createEnemyInstance(type, x, y, faction = 'general') {
    let enemy = null;
    if (type === 'dodger') {
      enemy = new EnemyDodger(x, y);
    } else if (type === 'guard') {
      enemy = new EnemyGuard(x, y);
    } else if (type === 'baton' && typeof EnemyBaton !== 'undefined') {
      enemy = new EnemyBaton(x, y, faction);
    } else if (type === 'blade' && typeof EnemyBlade !== 'undefined') {
      enemy = new EnemyBlade(x, y, faction);
    } else if (type === 'shield' && typeof EnemyShield !== 'undefined') {
      enemy = new EnemyShield(x, y, faction);
    } else if (type === 'armored' && typeof EnemyArmored !== 'undefined') {
      enemy = new EnemyArmored(x, y, faction);
    } else if (type === 'thrower' && typeof EnemyThrower !== 'undefined') {
      enemy = new EnemyThrower(x, y, faction);
    } else if (type === 'brawler' && typeof EnemyBrawler !== 'undefined') {
      enemy = new EnemyBrawler(x, y, faction);
    } else if (type === 'grabber' && typeof EnemyGrabber !== 'undefined') {
      enemy = new EnemyGrabber(x, y, faction);
    } else if (type === 'medic' && typeof EnemyMedic !== 'undefined') {
      enemy = new EnemyMedic(x, y, faction);
    } else {
      enemy = new BaseEnemy(x, y, type || 'thug', 'Lính Đánh Thuê');
      if (faction) enemy.faction = faction;
    }
    return enemy;
  }

  // Tìm vị trí sinh địch hợp lệ trong đấu trường: không kẹt vật cản, không đè người chơi
  findValidSpawnPosition(preferredX, preferredY) {
    let x = preferredX;
    let y = preferredY || (540 + Math.random() * 80);

    const minX = this.arenaLocked ? (this.arenaMinX + 50) : 50;
    const maxX = this.arenaLocked ? (this.arenaMaxX - 50) : (window.stageManager ? window.stageManager.stageWidth - 50 : 2550);
    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(520, Math.min(630, y));

    // Không spawn trực tiếp lên người chơi
    if (this.player && Math.abs(x - this.player.x) < 85) {
      if (x < this.player.x) {
        x = Math.max(minX, this.player.x - 130);
      } else {
        x = Math.min(maxX, this.player.x + 130);
      }
    }

    // Tránh vật cản trong sân (thùng gỗ, rào chắn)
    if (window.propSystem && window.propSystem.props) {
      for (const prop of window.propSystem.props) {
        if (!prop.destroyed && Math.hypot(x - prop.x, y - prop.y) < 70) {
          x = (x <= prop.x) ? Math.max(minX, prop.x - 85) : Math.min(maxX, prop.x + 85);
          y = (y <= prop.y) ? Math.max(520, prop.y - 45) : Math.min(630, prop.y + 45);
        }
      }
    }

    return { x, y };
  }

  // KÍCH HOẠT SỰ KIỆN TIẾP VIỆN — SPAWN KẺ ĐỊCH THẬT SỰ
  triggerReinforcementEvent(event) {
    if (!event || event.triggered) return [];
    event.triggered = true;
    if (event.id) this.triggeredReinforcementIds.add(event.id);

    // Tín hiệu cảnh báo: banner ngắn + âm thanh cảnh báo + chớp màn hình nhẹ
    const bannerText = event.bannerText || 'ENEMY REINFORCEMENTS INCOMING';
    if (window.uiManager) window.uiManager.showAlertBanner(bannerText);
    if (window.audioManager) window.audioManager.playWarning();
    if (window.effectManager) {
      window.effectManager.triggerFlash('#ff2a4b', 0.35);
      window.effectManager.triggerScreenShake(6, 0.25);
    }

    const spawned = [];
    const entries = event.enemies || [];
    const isRequired = (event.isRequired !== false);

    for (const group of entries) {
      const count = group.count || 1;
      const spacing = group.spacing || 90;
      const baseSpawnX = (event.spawnSide === 'left')
        ? (this.arenaMinX + 80)
        : ((event.spawnSide === 'right' || !event.spawnSide) ? (this.arenaMaxX - 80) : (this.player ? this.player.x + 220 : 1200));

      for (let i = 0; i < count; i++) {
        const rawX = (event.spawnSide === 'left') ? (baseSpawnX + i * spacing) : (baseSpawnX - i * spacing);
        const rawY = 535 + (i % 3) * 35;
        const validPos = this.findValidSpawnPosition(rawX, rawY);

        const enemy = this.createEnemyInstance(group.type, validPos.x, validPos.y, group.faction);
        // Địch tiếp viện tự động hướng mặt và di chuyển áp sát giao chiến với người chơi
        if (this.player) {
          enemy.facing = (this.player.x >= enemy.x) ? 1 : -1;
          enemy.vx = enemy.facing * (enemy.speed || 120) * 0.75;
          enemy.setState('walk');
        }

        this.enemies.push(enemy);
        if (isRequired) {
          this.currentWaveRequiredEnemies.push(enemy);
        }
        spawned.push(enemy);

        if (window.effectManager) {
          window.effectManager.addFloatingText('TIẾP VIỆN!', enemy.x, enemy.y - 145, 'warn');
          window.effectManager.createShockRing(enemy.x, enemy.y, '#ff2a4b');
          window.effectManager.createDust(enemy.x, enemy.y, 10, 45);
        }
      }
    }

    return spawned;
  }

  // ==========================================================================
  // QUẢN LÝ TIẾN TRÌNH CÁC ĐỢT KẺ ĐỊCH (WAVES & BOSS)
  // ==========================================================================
  checkWaveProgress() {
    if (this.state === 'TUTORIAL' || this.state === 'TRAINING') return;
    const stageData = window.stageManager.getCurrentStage();
    const waves = stageData.waves;

    // 1. Quản lý đợt lính quần chiến hiện tại
    if (this.currentWaveActive) {
      this.currentWaveTime = (this.currentWaveTime || 0) + 0.016;
      const required = this.currentWaveRequiredEnemies;
      const aliveRequired = required.filter((e) => !e.isDead);

      // Kích hoạt sự kiện tiếp viện nếu điều kiện thỏa mãn
      if (this.currentWaveReinforcements && this.currentWaveReinforcements.length > 0) {
        for (const rEvent of this.currentWaveReinforcements) {
          if (!rEvent.triggered && !this.triggeredReinforcementIds.has(rEvent.id)) {
            let shouldTrigger = false;
            if (rEvent.trigger === 'time' || rEvent.delay) {
              shouldTrigger = this.currentWaveTime >= (rEvent.delay || 5.0);
            } else if (rEvent.trigger === 'hp_threshold') {
              const totalHp = required.reduce((sum, e) => sum + e.maxHp, 0);
              const curHp = required.reduce((sum, e) => sum + Math.max(0, e.hp), 0);
              shouldTrigger = (curHp / Math.max(1, totalHp)) <= (rEvent.threshold || 0.4);
            } else {
              // Mặc định: kích hoạt khi số lính còn sống <= threshold
              const thresh = (rEvent.threshold !== undefined) ? rEvent.threshold : 1;
              shouldTrigger = (aliveRequired.length <= thresh);
            }

            if (shouldTrigger) {
              this.triggerReinforcementEvent(rEvent);
            }
          }
        }
      }

      // Toàn bộ kẻ địch bắt buộc (kể cả tiếp viện) phải bị tiêu diệt
      const allCleared = required.length > 0 && required.every((e) => e.isDead);
      if (allCleared) {
        this.currentWaveActive = false;
        this.arenaLocked = false;
        const waveJustCleared = this.currentWaveIndex;
        this.currentWaveIndex++;

        // HỒI 25% MÁU SAU MỖI ĐỢT QUẦN CHIẾN: newHealth = min(maxHealth, currentHealth + maxHealth * 0.25)
        if (!this.clearedWaveIndices.has(waveJustCleared)) {
          this.clearedWaveIndices.add(waveJustCleared);

          const maxHealth = this.player.maxHp;
          const currentHealth = this.player.hp;
          const newHealth = Math.min(maxHealth, currentHealth + maxHealth * 0.25);
          const healedAmount = Math.round(newHealth - currentHealth);
          this.player.hp = Math.round(newHealth);

          if (window.uiManager && window.uiManager.updatePlayerHp) {
            window.uiManager.updatePlayerHp(this.player.hp, this.player.maxHp);
          }

          if (window.uiManager) {
            window.uiManager.showAlertBanner('WAVE CLEARED — +25% HP');
          }
          if (window.audioManager) {
            window.audioManager.playSkill();
          }
          if (window.effectManager) {
            window.effectManager.createShockRing(this.player.x, this.player.y, '#4ade80');
            if (healedAmount > 0) {
              window.effectManager.addFloatingText('+' + healedAmount + ' HP', this.player.x, this.player.y - 140, 'heal');
            } else {
              window.effectManager.addFloatingText('HP ĐÃ ĐẦY', this.player.x, this.player.y - 140, 'heal');
            }
          }
        }

        // Mở lối đi tiếp sang khu vực kế tiếp
        if (this.currentWaveIndex < waves.length) {
          if (window.audioManager) window.audioManager.playClick();
        }
      }
      return;
    }

    // 2. Kích hoạt đợt kế tiếp khi người chơi đi vào vùng kích hoạt
    if (this.currentWaveIndex < waves.length) {
      const wave = waves[this.currentWaveIndex];

      if (this.player.x >= wave.spawnX - 450) {
        if (wave.isBossWave) {
          if (!this.isBossSpawned) {
            this.spawnBossWave(wave, stageData);
          }
        } else {
          this.currentWaveActive = true;
          this.currentWaveTime = 0;
          this.combatMode = 'CROWD';
          this.currentWaveRequiredEnemies = this.spawnMinionWave(wave);

          // Đăng ký danh sách tiếp viện của đợt này
          this.currentWaveReinforcements = (wave.reinforcements || []).map((r, idx) => ({
            ...r,
            id: r.id || `wave_${this.currentWaveIndex}_r_${idx}`,
            triggered: false
          }));

          // Khóa khu vực chiến đấu của đợt này (Encounter Boundary)
          this.arenaLocked = true;
          this.arenaMinX = (this.currentWaveIndex === 0) ? 20 : (waves[this.currentWaveIndex - 1].spawnX + 100);
          this.arenaMaxX = Math.min(window.stageManager.stageWidth - 20, wave.spawnX + 480);
        }
      }
    }
  }

  spawnMinionWave(wave) {
    const spawned = [];
    for (const group of wave.enemies) {
      for (let i = 0; i < group.count; i++) {
        const spawnX = wave.spawnX + i * group.spacing;
        const spawnY = 540 + (i % 3) * 35;
        const enemy = this.createEnemyInstance(group.type, spawnX, spawnY, group.faction);
        spawned.push(enemy);
        this.enemies.push(enemy);
      }
    }
    return spawned;
  }

  spawnBossWave(wave, stageData) {
    this.isBossSpawned = true;
    this.combatMode = 'DUEL';
    this.arenaLocked = true;

    // SỬA LỖI MẤT NỬA MAP: Sân đấu Boss mở rộng toàn bộ chiều rộng từ cổng vào đến hết mép phải map
    const waves = stageData.waves || [];
    this.arenaMinX = (waves.length > 1) ? Math.max(20, waves[waves.length - 2].spawnX + 100) : 20;
    this.arenaMaxX = window.stageManager.stageWidth - 20;

    // Sinh Boss
    const BossClass = stageData.bossClass;
    const boss = new BossClass(wave.spawnX + 220, 570);
    boss.isBoss = true;
    boss.title = stageData.bossTitle;
    this.currentBoss = boss;
    this.enemies.push(boss);

    // Sinh lính hỗ trợ nếu có
    if (wave.enemies && wave.enemies.length > 0) {
      this.spawnMinionWave(wave);
    }

    // Hiển thị Boss HUD + màn ra mắt điện ảnh
    if (window.uiManager) {
      window.uiManager.showBossHUD(boss);
      window.uiManager.showBossIntro(boss);
    }
    if (window.audioManager) {
      window.audioManager.playGong(0.4);
      window.audioManager.setBGMIntensity(1.3);
    }
    if (window.effectManager) {
      window.effectManager.triggerFlash('#ffffff', 0.35);
      window.effectManager.triggerScreenShake(10, 0.3);
    }
    // Zoom camera chậm lại về phía boss trong lúc ra mắt
    this.bossZoom = 1;
    this.bossIntroTarget = boss;

    // ĐẶC BIỆT MÀN 7: Cuộc gặp tại nơi ẩn náu — không lập tức đánh boss mà có 3 lựa chọn
    if (stageData.id === 7 && !this.isBossCutsceneTriggered) {
      this.triggerStage7DungHaiEncounter(stageData, wave);
      return;
    }

    // Thoại gặp Boss — chờ bảng tên boss chạy xong mới bắt đầu để 2 lớp điện ảnh không đè lên nhau
    if (stageData.bossDialogue && stageData.bossDialogue.length > 0 && !this.isBossCutsceneTriggered) {
      this.isBossCutsceneTriggered = true;
      this.state = 'CUTSCENE';
      const playBossDialogue = () => {
        // Nếu đang tạm dừng thì chờ, tránh cắt ngang màn pause
        if (this.state === 'PAUSED') { this.later(playBossDialogue, 400); return; }
        // Người chơi đã thoát về menu trong lúc chờ -> không phát thoại nữa
        if (this.state !== 'CUTSCENE') return;
        window.stageManager.playDialogueSequence(stageData.bossDialogue, () => {
          this.state = 'PLAYING';
        });
      };
      this.later(playBossDialogue, 2300);
    }

    this.currentWaveIndex++;
  }

  // ==========================================================================
  // HỆ THỐNG MỚI: TOKEN RA ĐÒN / SINH ĐỊCH / ĐẠN / THOẠI GIỮA TRẬN
  // ==========================================================================
  // Xin "suất" ra đòn: tối đa maxAttackTokens địch được đánh cùng lúc (boss luôn được ưu tiên)
  requestAttackToken(enemy) {
    if (!enemy) return false;
    if (enemy.isBoss) return true;
    this.pruneAttackTokens();
    if (this.attackTokens.has(enemy)) return true;
    if (this.attackTokens.size >= this.maxAttackTokens) return false;
    this.attackTokens.set(enemy, { grant: this.stageElapsedTime });
    return true;
  }

  pruneAttackTokens() {
    if (!this.attackTokens.size) return;
    for (const [enemy, rec] of this.attackTokens) {
      const dead = enemy.isDead;
      const justGranted = this.stageElapsedTime - (rec.grant || 0) < 0.5;
      const busy = enemy.isAttacking;
      if (dead || (!busy && !justGranted)) this.attackTokens.delete(enemy);
    }
  }

  // Sinh một lính thường ở tọa độ tùy ý (Vinh Tâm gọi cận vệ giữa trận hoặc chi viện)
  spawnMinionAt(type, x, y, faction = 'general', isRequired = false) {
    const enemy = this.createEnemyInstance(type, x, y, faction);
    this.enemies.push(enemy);
    if (isRequired && this.currentWaveActive) {
      this.currentWaveRequiredEnemies.push(enemy);
    }
    if (window.effectManager) window.effectManager.createDust(x, y, 8);
    return enemy;
  }

  // Cứu cánh của màn trốn thoát: kẻ đuổi theo sinh sau lưng người chơi
  spawnChasers() {
    const alive = this.enemies.filter((e) => !e.isDead).length;
    if (alive >= 5) return;
    const px = this.player.x;
    const sx = Math.max(80, px - 320 - Math.random() * 120);
    const type = Math.random() < 0.4 ? 'dodger' : 'thug';
    this.spawnMinionAt(type, sx, 530 + Math.random() * 90);
    if (window.audioManager) window.audioManager.playWarning();
  }

  // Vật bay (đá/gạch Dung Hải ném) — va chạm với người chơi
  spawnProjectile(x, y, dirX, speed, damage, owner) {
    this.projectiles.push({
      x, y, z: 0, vx: (dirX >= 0 ? 1 : -1) * speed, vy: 0,
      damage: damage || 30, owner: owner || null, life: 2.4, rot: 0
    });
    if (window.audioManager) window.audioManager.playWhoosh();
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.rot += dt * 12;
      p.life -= dt;

      const hitPlayer = !this.player.isDead &&
        Math.abs(p.x - this.player.x) < 44 &&
        Math.abs(p.y - 30 - (this.player.y - 60)) < 70 &&
        this.player.z > -70;

      if (hitPlayer) {
        this.player.takeDamage(p.damage, Math.sign(p.vx) * 9, false);
        if (window.effectManager) window.effectManager.createHitSparks(p.x, p.y, 10, false);
        this.projectiles.splice(i, 1);
        continue;
      }
      if (p.life <= 0 || p.x < -100 || p.x > window.stageManager.stageWidth + 100) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  // Thoại nảy sinh NGAY GIỮA trận đấu (không cần đợt địch mới)
  playInlineDialogue(list, onDone) {
    if (!list || !list.length) { if (onDone) onDone(); return; }
    const resume = () => {
      this.state = 'PLAYING';
      if (onDone) onDone();
    };
    if (this.state !== 'PLAYING') {
      // Đang có cutscene khác -> nối tiếp bằng cách chờ
      this.later(() => this.playInlineDialogue(list, onDone), 400);
      return;
    }
    this.state = 'CUTSCENE';
    window.stageManager.playDialogueSequence(list, resume);
  }

  // Hiệp ước với Đình Bích Lâm (không cần giết anh ta)
  triggerTruce() {
    const boss = this.currentBoss;
    boss.truceTriggered = true;
    boss.setState('idle', 0);
    boss.vx = 0;
    this.state = 'CUTSCENE';
    if (window.audioManager) window.audioManager.setBGMIntensity(1);
    window.stageManager.playDialogueSequence([
      { speaker: 'ĐÌNH BÍCH LÂM', role: 'ĐỒNG MINH NGANG TÀNG', avatar: 'bichlam',
        text: 'Được... đủ rồi. Anh đánh không phải để chứng tỏ trung thành — vậy thì tôi tin anh một lần.' },
      { speaker: 'ĐÌNH BÍCH LÂM', role: 'ĐỒNG MINH NGANG TÀNG', avatar: 'bichlam',
        text: 'Bản gốc danh sách liên hệ từng nằm ở bến cảng này. Kẻ bị xóa tên là người họ Phó — và người ra lệnh xóa thì vẫn đang ngồi trên ghế.' },
      { speaker: 'NGÔ NHẤT NGHỊ', role: 'SÁT THẦN VIỆT VÕ ĐẠO', avatar: 'nghi',
        text: 'Cảm ơn. Nếu sau này tôi cần một đồng minh không biết nói dối — tôi sẽ tìm anh.' }
    ], () => {
      if (window.saveManager) {
        window.saveManager.unlockAchievement('truce_bichlam');
        window.saveManager.completeMission('truce_bichlam');
      }
      if (window.uiManager) window.uiManager.showToast('THÀNH TÍCH: HIỆP ƯỚC GIỮA HAI NGƯỜI');
      // Kết thúc trận đấu mà không cần hạ gục
      boss.isDead = true;
      boss.setState('knockdown', 1.2);
      this.triggerStageVictory();
    });
  }

  // ==========================================================================
  // CẬP NHẬT CAMERA ĐIỆN ẢNH (LOOK-AHEAD, DUEL FRAMING, PUNCH ZOOM & BOUNDS)
  // ==========================================================================
  triggerCameraPunch(zoomScale = 1.055, duration = 0.18, worldX = null, worldY = null) {
    const fx = window.fxSettings;
    if (fx && fx.reduceShake) return;
    this.camPunchScale = Math.max(this.camPunchScale || 1.0, zoomScale);
    this.camPunchTimer = Math.max(this.camPunchTimer || 0, duration);
    this.camPunchMaxTimer = duration;
    this.camPunchX = worldX;
    this.camPunchY = worldY;
  }

  updateCamera(dt) {
    // Look-Ahead mượt theo hướng nhìn & căn khung hình đối kháng khi đấu Boss (DUEL)
    const facing = (this.player && this.player.facing) ? this.player.facing : 1;
    const lookAheadOffset = facing > 0 ? this.width * 0.36 : this.width * 0.44;
    let targetCameraX = this.player.x - lookAheadOffset;

    if (this.combatMode === 'DUEL' && this.currentBoss && !this.currentBoss.isDead) {
      const midX = (this.player.x * 0.65 + this.currentBoss.x * 0.35);
      targetCameraX = midX - this.width * 0.42;
    }

    // Lerp mượt mà
    this.camera.x += (targetCameraX - this.camera.x) * 6.5 * dt;

    if (this.camPunchTimer > 0) {
      this.camPunchTimer = Math.max(0, this.camPunchTimer - dt);
    }

    // Giới hạn trong sàn đấu hoặc trong khu vực khóa Boss
    if (this.arenaLocked) {
      const maxCamX = Math.max(this.arenaMinX, this.arenaMaxX - this.width);
      this.camera.x = Math.max(this.arenaMinX, Math.min(maxCamX, this.camera.x));
      // Không cho nhân vật chạy ra ngoài ranh giới sàn đấu (đến được cả 2 đầu sân)
      this.player.x = Math.max(this.arenaMinX + 30, Math.min(this.arenaMaxX - 30, this.player.x));
    } else {
      this.camera.x = Math.max(0, Math.min(this.camera.maxX, this.camera.x));
      this.player.x = Math.max(30, Math.min(window.stageManager.stageWidth - 30, this.player.x));
    }
  }

  // ==========================================================================
  // CHIẾN THẮNG & THẤT BẠI
  // ==========================================================================
  triggerStageVictory() {
    if (this.state === 'STAGE_CLEAR' || this.stageCompletedPending) return;
    this.stageCompletedPending = true;
    this.state = 'STAGE_CLEAR';
    if (window.allyManager && typeof window.allyManager.reset === 'function') {
      window.allyManager.reset();
    }
    if (window.audioManager) {
      window.audioManager.stopBGM();
      window.audioManager.playVictory();
      window.audioManager.setBGMIntensity(1);
    }

    const stageData = window.stageManager.getCurrentStage();
    const currentStageNum = window.stageManager.currentStageIndex;

    // Lưu tiến trình, mở khóa nhân vật, thành tích
    this.recordStageProgress(currentStageNum, stageData);

    const proceed = () => {
      // Màn cuối -> dòng kết thúc theo lựa chọn của người chơi
      if (stageData.finalStage) {
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

    // CAO TRÀO ĐẶC BIỆT MÀN 10: Sau khi hạ Triệu Vinh Tâm, kích hoạt BA NGƯỜI, BA SỰ THẬT
    if (currentStageNum === 10 && window.clanConfrontation) {
      window.clanConfrontation.startConfrontation((verdict) => {
        proceed();
      });
      return;
    }

    // Lựa chọn cốt truyện có hệ quả thật (xếp trước màn kết quả)
    if (stageData.postChoice) {
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

    // Mở khóa nhân vật theo meta
    if (meta && meta.unlockChar) {
      const name = (window.CHARACTERS && window.CHARACTERS[meta.unlockChar]) ? window.CHARACTERS[meta.unlockChar].name : meta.unlockChar;
      if (sm.unlockCharacter(meta.unlockChar)) {
        this.toast('MỞ KHÓA NHÂN VẬT: ' + name.toUpperCase());
      }
    }

    // Nhiệm vụ phụ
    if (meta && meta.type === 'side') sm.completeMission('side_' + stageNum);
    if (stageData.escape) {
      if (sm.unlockAchievement('escape_hud')) this.toast('THÀNH TÍCH: THOÁT HIỂM');
      sm.completeMission('escape_' + stageNum);
    }

    // Thành tích theo màn / boss
    if (stageNum === 4 && sm.unlockAchievement('act1_clear')) this.toast('THÀNH TÍCH: ĐÊM HẮC LANG');
    if (meta && meta.boss) {
      sm.defeatBoss(meta.boss);
      if (meta.boss === 'hoanganh' && sm.unlockAchievement('beat_hoanganh')) this.toast('THÀNH TÍCH: TRẬN CHIẾN TRÊN NÚI');
      if (meta.boss === 'vinhtam' && sm.unlockAchievement('beat_vinhtam')) this.toast('THÀNH TÍCH: ĐẠI ĐIỆN ĐÃ RỤNG');
      if (meta.boss === 'giangmanh' && sm.unlockAchievement('beat_giangmanh')) this.toast('THÀNH TÍCH: ĐOẠN NGHĨA');
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

  toast(msg) {
    if (window.uiManager && window.uiManager.showToast) window.uiManager.showToast(msg);
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
    // Bỏ qua nếu người chơi đã chơi lại, về menu hoặc không còn ở trạng thái gục
    if (!this.player || !this.player.isDead) return;
    if (this.state === 'MENU' || this.state === 'GAME_OVER') return;
    // Đang tạm dừng: chờ người chơi tiếp tục rồi mới hiện màn thua (tránh chồng modal / kẹt không có game over)
    if (this.state === 'PAUSED') { this.scheduleGameOver(300); return; }
    this.state = 'GAME_OVER';
    if (window.audioManager) window.audioManager.stopBGM();
    if (window.uiManager) window.uiManager.showGameOver();
  }

  pauseGame() {
    if (this.state === 'PLAYING' || this.state === 'TRAINING' || this.state === 'TUTORIAL') {
      this.previousState = this.state;
      this.state = 'PAUSED';
      if (window.uiManager) window.uiManager.showPause();
    }
  }

  resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = this.previousState || 'PLAYING';
      if (window.uiManager) window.uiManager.hidePause();
    }
  }

  returnToMenu() {
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
    this.cancelGameOverTimer();
    this.clearLaterTimers();
    this.state = 'MENU';
    this.previousState = 'MENU';
    this._pausedNoModalTimer = 0;
    this.enemies = [];
    this.currentBoss = null;
    this.projectiles = [];
    this.arenaLocked = false;
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
    if (window.audioManager) window.audioManager.stopBGM();
  }

  // Vẽ vật bay (ném môi trường) — không cần ảnh, vẽ bằng canvas thuần
  renderProjectiles() {
    if (!this.projectiles.length) return;
    const ctx = this.ctx;
    for (const p of this.projectiles) {
      const sx = p.x - this.camera.x;
      const sy = p.y - this.camera.y;
      if (sx < -60 || sx > this.width + 60) continue;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(p.rot);
      ctx.fillStyle = '#8a919c';
      ctx.fillRect(-13, -9, 26, 18);
      ctx.strokeStyle = '#41474f';
      ctx.lineWidth = 2;
      ctx.strokeRect(-13, -9, 26, 18);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-13, -9, 26, 4);
      ctx.restore();
      // Vệt chuyển động
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#c9d2dd';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - Math.sign(p.vx) * 14, sy);
      ctx.lineTo(sx - Math.sign(p.vx) * 52, sy + 4);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ==========================================================================
  // RENDER HÌNH ẢNH TOÀN BỘ GAME
  // ==========================================================================
  render() {
    const inMenu = this.state === 'MENU';
    if (inMenu) {
      const ts = document.getElementById('title-screen');
      if (ts && !ts.classList.contains('hidden')) {
        // Màn hình chính đang hiển thị lớp phủ riêng: bỏ qua vẽ ngầm trên gameCanvas để tiết kiệm GPU/CPU
        return;
      }
      this.camera.x = 0;
      this.camera.y = 0;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Rung màn hình khi có chấn động
    this.ctx.save();
    if (window.effectManager) {
      this.ctx.translate(window.effectManager.shakeOffsetX, window.effectManager.shakeOffsetY);
    }

    // Zoom điện ảnh khi boss ra mắt (lùi về tự nhiên theo thời gian)
    if (this.bossZoom > 0.01 && this.bossIntroTarget) {
      const b = this.bossIntroTarget;
      const z = 1 + 0.42 * this.bossZoom;
      const bx = Math.max(this.width * 0.26, Math.min(this.width * 0.74, b.x - this.camera.x));
      const by = Math.max(this.height * 0.26, Math.min(this.height * 0.74, (b.y + (b.z || 0)) - 95));
      this.ctx.translate(this.width / 2, this.height / 2);
      this.ctx.scale(z, z);
      this.ctx.translate(-bx, -by);
    } else if ((this.camPunchTimer || 0) > 0) {
      // Camera Punch Zoom khi tung đòn Chí mạng / Phản đòn / Kẹp cổ Vovinam
      const p = this.camPunchTimer / (this.camPunchMaxTimer || 0.18);
      const ease = Math.sin(p * Math.PI);
      const z = 1 + ((this.camPunchScale || 1.05) - 1) * ease;
      const fx = this.camPunchX != null ? Math.max(this.width * 0.25, Math.min(this.width * 0.75, this.camPunchX - this.camera.x)) : this.width * 0.5;
      const fy = this.camPunchY != null ? Math.max(this.height * 0.25, Math.min(this.height * 0.75, this.camPunchY - this.camera.y - 70)) : this.height * 0.55;
      this.ctx.translate(fx, fy);
      this.ctx.scale(z, z);
      this.ctx.translate(-fx, -fy);
    }

    // 1. Vẽ Bối cảnh Parallax theo màn chơi
    if (window.stageManager) {
      window.stageManager.renderBackground(this.ctx, this.camera, this.width, this.height);
    }

    // 1b. Vẽ Vũ khí rơi trên nền đất
    if (window.weaponSystem && !inMenu) {
      window.weaponSystem.render(this.ctx, this.camera);
    }

    // 1c. Vẽ Vật thể tương tác sân khấu (thùng hàng, thùng phuy, mảnh vỡ)
    if (window.propSystem && !inMenu) {
      window.propSystem.render(this.ctx, this.camera);
    }

    // 2. Sắp xếp chiều sâu (2.5D Depth Sorting theo tọa độ Y)
    const renderList = inMenu ? [this.titleHero] : [this.player, ...this.enemies];
    if (!inMenu && window.allyManager && window.allyManager.activeAlly) {
      renderList.push(window.allyManager.activeAlly);
    }
    renderList.sort((a, b) => a.y - b.y);

    // 3. Vẽ Tàn Ảnh (Ghost Trails)
    if (window.effectManager && window.skeletalRenderer) {
      for (const ghost of window.effectManager.ghostTrails) {
        this.ctx.save();
        this.ctx.globalAlpha = ghost.alpha;
        window.skeletalRenderer.render(this.ctx, ghost, this.camera);
        this.ctx.restore();
      }
    }

    // 4. Vẽ Các Thực Thể Khung Xương (Ngô Nhất Nghị, Lính, Boss)
    if (window.skeletalRenderer) {
      for (const entity of renderList) {
        window.skeletalRenderer.render(this.ctx, entity, this.camera);
      }
    }

    // 5. Vẽ Hiệu Ứng Thế Giới (Tia lửa, sóng chấn động, chữ số sát thương)
    if (window.effectManager) {
      window.effectManager.renderWorld(this.ctx, this.camera);
    }

    // 5b. Vẽ vật bay (đá/gạch môi trường)
    this.renderProjectiles();

    // 5c. Vẽ Vật Chứng Khám Phá trên mặt sân khấu
    this.renderStageEvidence(this.ctx, this.camera);

    // 5d. Vẽ Hồi ức nếu đang kích hoạt
    if (window.flashbackMission && window.flashbackMission.isActive) {
      window.flashbackMission.render(this.ctx, this.camera);
    }

    // 5e. Vẽ HUD gợi ý nhặt vũ khí [E] và độ bền
    if (window.weaponSystem && !inMenu) {
      window.weaponSystem.renderHud(this.ctx, this.camera, this.player);
    }

    // 5f. Vẽ Đồng Minh trên sân
    if (window.allyManager && !inMenu) {
      window.allyManager.draw(this.ctx, this.camera);
    }

    // 5g. Vẽ Lớp Tiền Cảnh Điện Ảnh 2.5D (Foreground Parallax 1.28x)
    if (window.stageManager && typeof window.stageManager.renderForeground === 'function' && !inMenu) {
      window.stageManager.renderForeground(this.ctx, this.camera, this.width, this.height);
    }

    this.ctx.restore(); // Khôi phục rung màn hình & camera zoom

    // 6. Vẽ Hiệu Ứng Lớp Phủ Màn Hình (Mưa, chớp flash)
    if (window.effectManager) {
      window.effectManager.renderScreen(this.ctx, this.width, this.height);
    }

    // 7. Vignette điện ảnh
    const vg = this.ctx.createRadialGradient(this.width / 2, this.height / 2, this.height * 0.45, this.width / 2, this.height / 2, this.width * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.6)');
    this.ctx.fillStyle = vg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 8. Letterbox khi đang thoại
    if (this.cineBar > 0.01) {
      const bh = 64 * this.cineBar;
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.width, bh);
      this.ctx.fillRect(0, this.height - bh, this.width, bh);
    }
  }

  // ==========================================================================
  // HỆ THỐNG ĐIỀU TRA & VẬT CHỨNG TRÊN SÂN KHẤU (INVESTIGATION PICKUPS)
  // ==========================================================================
  collectStageEvidence() {
    if (!this.stageEvidence || this.stageEvidence.collected) return;
    this.stageEvidence.collected = true;
    const docId = this.stageEvidence.id;
    const inv = window.investigationManager;

    if (inv) {
      inv.collectEvidence(docId);
      // Hiển thị hộp thoại quyết định quyền nắm giữ (Custody Choice)
      if (window.menuManager && window.menuManager.showCustodyModal) {
        window.menuManager.showCustodyModal(docId);
      }
    }
  }

  renderStageEvidence(ctx, camera) {
    if (!this.stageEvidence || this.stageEvidence.collected) return;
    const ev = this.stageEvidence;
    const sx = ev.x - camera.x;
    if (sx < -80 || sx > this.width + 80) return;

    ctx.save();
    ctx.translate(sx, ev.y);

    // Hiệu ứng phát sáng lấp lánh (pulsing gold/cyan aura)
    const pulse = Math.sin(performance.now() * 0.005) * 0.25 + 0.75;
    const grad = ctx.createRadialGradient(0, -25, 2, 0, -25, 45);
    grad.addColorStop(0, 'rgba(255, 215, 0, ' + (0.5 * pulse) + ')');
    grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -25, 45, 0, Math.PI * 2);
    ctx.fill();

    // Hòm tài liệu / Túi hồ sơ có dấu sáp đỏ
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-16, -36, 32, 24);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.strokeRect(-16, -36, 32, 24);

    // Nắp phong bì
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.moveTo(-16, -36);
    ctx.lineTo(0, -22);
    ctx.lineTo(16, -36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Con dấu niêm phong sáp đỏ
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, -22, 5, 0, Math.PI * 2);
    ctx.fill();

    // Chỉ dẫn nút bấm khi ở gần
    if (Math.abs(this.player.x - ev.x) < 95) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 11px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 6;
      ctx.fillText('[J] hoặc [E]: THU THẬP MANH MỐI', 0, -50);
      ctx.fillStyle = '#fef08a';
      ctx.font = '600 10px Montserrat, sans-serif';
      ctx.fillText(ev.doc ? ev.doc.typeName.toUpperCase() : 'VẬT CHỨNG', 0, -64);
    }

    ctx.restore();
  }

  // ==========================================================================
  // HỆ THỐNG CHI VIỆN ĐỒNG MINH VOVINAM / HỌ PHÓ (ALLY SUMMON)
  // ==========================================================================
  triggerAllySupport() {
    if (window.allyManager) {
      const ok = window.allyManager.summonAlly();
      if (ok) {
        this.allyCooldown = window.allyManager.cooldown;
      }
      return;
    }

    const sm = window.saveManager;
    if (!sm) return;
    const allies = sm.data.allyAvailability || {};
    const trust = sm.data.characterTrust || {};

    if (this.allyCooldown > 0) {
      if (window.uiManager) window.uiManager.showToast(`ĐỒNG MINH ĐANG HỒI CHIÊU (${Math.ceil(this.allyCooldown)}s)`);
      return;
    }

    let activeAlly = (window.allyManager && window.allyManager.selectedAllyId) || null;
    if (!activeAlly) {
      if (allies.hoanganh && trust.hoanganh >= 55) activeAlly = 'hoanganh';
      else if (allies.dunghai && trust.dunghai >= 45) activeAlly = 'dunghai';
      else if (allies.mocdang && trust.mocdang >= 65) activeAlly = 'mocdang';
      else if (allies.bichlam) activeAlly = 'bichlam';
      else if (window.trainingManager && window.trainingManager.isActive) activeAlly = 'bichlam';
    }

    if (!activeAlly) {
      if (window.uiManager) window.uiManager.showToast('CHƯA CÓ ĐỒNG MINH NÀO SẴN SÀNG CHI VIỆN!');
      return;
    }

    this.allyCooldown = 14;
    if (window.saveManager) {
      window.saveManager.unlockAchievement('ally_master');
    }

    if (activeAlly === 'hoanganh') {
      if (window.audioManager) {
        window.audioManager.playExplosion();
        window.audioManager.playGong(0.6);
      }
      if (window.effectManager) {
        window.effectManager.triggerFlash('#ffd700', 0.45);
        window.effectManager.triggerScreenShake(22, 0.6);
        window.effectManager.createDust(this.player.x, 560, 35);
      }
      if (window.uiManager) window.uiManager.showToast('CHI VIỆN: HOÀNG ANH — SƠN THẠCH TRẤN ĐỊA!');
      this.enemies.forEach(e => {
        if (!e.isDead) {
          e.takeDamage(130, 0, true);
          e.setState('knockdown', 2.8);
        }
      });
    } else if (activeAlly === 'dunghai') {
      if (window.audioManager) window.audioManager.playWhoosh();
      if (window.effectManager) {
        window.effectManager.triggerFlash('#a3e635', 0.5);
      }
      if (window.uiManager) window.uiManager.showToast('CHI VIỆN: DUNG HẢI — KHÓI SƯƠNG NGHI BINH!');
      if (this.currentBoss) {
        this.currentBoss.superArmor = false;
        this.currentBoss.attackCooldown = 4.5;
        this.currentBoss.setState('idle', 0);
      }
    } else if (activeAlly === 'mocdang') {
      if (window.audioManager) window.audioManager.playChime();
      if (window.effectManager) {
        window.effectManager.triggerFlash('#00d2ff', 0.4);
      }
      if (window.uiManager) window.uiManager.showToast('CHI VIỆN: MỘC ĐĂNG — HACK DRONE & XUNG ĐIỆN EMP!');
      this.player.energy = this.player.maxEnergy;
      if (window.uiManager) window.uiManager.updatePlayerEnergy(this.player.energy, this.player.maxEnergy);
    } else if (activeAlly === 'bichlam') {
      if (window.audioManager) window.audioManager.playWhoosh();
      if (window.uiManager) window.uiManager.showToast('CHI VIỆN: ĐÌNH BÍCH LÂM — XUYÊN TẦN LIÊN KẾT!');
      this.enemies.forEach(e => {
        if (!e.isDead) {
          e.takeDamage(160, this.player.facing * 16, true);
        }
      });
    }
  }

  updateAllyHUD() {
    if (window.allyManager) {
      window.allyManager.updateHUD();
      return;
    }
    const badge = document.getElementById('ally-ready-badge');
    if (!badge || !window.saveManager) return;
    const sm = window.saveManager;
    const allies = sm.data.allyAvailability || {};
    const hasAny = Object.values(allies).some(Boolean);
    if (hasAny) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // ==========================================================================
  // ĐẶC BIỆT MÀN 7: CUỘC GẶP TẠI NƠI ẨN NÁU CỦA PHÓ DUNG HẢI
  // ==========================================================================
  triggerStage7DungHaiEncounter(stageData, wave) {
    this.isBossCutsceneTriggered = true;
    this.state = 'CUTSCENE';

    const inv = window.investigationManager;
    const hasExpulsion = inv && inv.isFound('DOC_EXPULSION_ORDER');
    const hasLetter = inv && inv.isFound('DOC_LETTER_TORN');
    const canConfront = hasExpulsion || hasLetter;

    const options = [
      {
        id: 'trust',
        text: 'A. TIN DUNG HẢI TẠM THỜI',
        desc: 'Nghị hạ thế thủ, nghe hết câu chuyện về đêm lưu đày và chấp nhận hiệp ước ngầm.'
      },
      {
        id: 'subdue',
        text: 'B. TRUY BẮT DUNG HẢI',
        desc: 'Vào trận chiến: khống chế Dung Hải bằng đòn Vovinam mà không lấy mạng hắn.'
      }
    ];

    if (canConfront) {
      options.push({
        id: 'confront',
        text: 'C. ĐỐI CHẤT BẰNG CHỨNG [ĐẶC BIỆT]',
        desc: 'Đưa ra lệnh khai trừ bị sửa ngày tháng và thư mật để ép Dung Hải tiết lộ tầng sự thật sâu nhất.'
      });
    }

    window.stageManager.playDialogueSequence(stageData.bossDialogue, () => {
      window.uiManager.showChoice({
        label: 'CUỘC GẶP TẠI NƠI ẨN NÁU — PHÓ DUNG HẢI',
        question: 'Dung Hải đứng dựa lưng vào tủ điện, song đao giấu sau vạt áo rách. Ánh mắt hắn đầy hoài nghi và giằng xé:',
        options
      }, (optId) => {
        if (optId === 'trust') {
          if (inv) {
            inv.adjustTrust('dunghai', +30, 'Bạn chọn lắng nghe thay vì bạo lực');
            inv.adjustTrust('mocdang', -15, 'Mộc Đăng phát hiện bạn không chấp hành lệnh');
            inv.collectEvidence('DOC_AUDIO_MOCDANG');
          }
          window.game.playInlineDialogue([
            {
              speaker: 'PHÓ DUNG HẢI', role: 'KẺ BỊ KHAI TRỪ', avatar: 'dunghai',
              text: 'Cậu không giống những con chó săn khác của Hứa Vũ Đại. Cầm lấy chiếc bộ đàm này — nó có đoạn ghi âm Mộc Đăng muốn thủ tiêu cả hai chúng ta.'
            },
            {
              speaker: 'NGÔ NHẤT NGHỊ', role: 'SÁT THẦN VIỆT VÕ ĐẠO', avatar: 'nghi',
              text: 'Tôi sẽ lên Thập Vạn Đại Sơn tìm Hoàng Anh để đối chứng. Rời khỏi thành phố đi trước khi người của Mộc Đăng đến.'
            }
          ], () => {
            if (window.saveManager) window.saveManager.unlockCharacter('dunghai');
            this.triggerStageVictory();
          });
        } else if (optId === 'confront') {
          if (inv) {
            inv.adjustTrust('dunghai', +40, 'Bạn chứng minh được sự ngụy tạo của lệnh khai trừ');
            inv.collectEvidence('DOC_AUDIO_MOCDANG');
            inv.ensureState(window.saveManager);
            window.saveManager.data.allyAvailability.dunghai = true;
          }
          window.game.playInlineDialogue([
            {
              speaker: 'NGÔ NHẤT NGHỊ', role: 'ĐỐI CHẤT', avatar: 'nghi',
              text: 'Nhìn cho kỹ: Lệnh khai trừ anh đề ngày 14, nhưng kho dữ liệu bị tấn công ngày 19. Mộc Đăng đã chuẩn bị bản án này từ trước.'
            },
            {
              speaker: 'PHÓ DUNG HẢI', role: 'KINH NGẠC', avatar: 'dunghai',
              text: 'Cái gì?! (Nhìn vào bản sao văn bản) Con số 14... Mộc Đăng... Thằng khốn nạn đó! Vậy ra cái bẫy này đã giăng sẵn từ đầu!'
            },
            {
              speaker: 'PHÓ DUNG HẢI', role: 'ĐỒNG MINH MỚI', avatar: 'dunghai',
              text: 'Nghị, tôi nợ cậu một mạng. Bất cứ khi nào cậu cần, tôi sẽ yểm trợ cậu bằng sương mù và ảo ảnh Vovinam!'
            }
          ], () => {
            if (window.saveManager) window.saveManager.unlockCharacter('dunghai');
            this.triggerStageVictory();
          });
        } else {
          // B. Subdue: Chiến đấu với cơ chế khống chế đòn chân kẹp
          if (inv) inv.adjustTrust('dunghai', -20, 'Bạn chọn dùng vũ lực áp chế');
          this.dungHaiSubdueMode = true;
          this.state = 'PLAYING';
          this.currentWaveIndex++;
        }
      });
    });
  }

  triggerDungHaiSubdued() {
    const boss = this.currentBoss;
    boss.isDead = true;
    boss.setState('knockdown', 2.0);
    this.state = 'CUTSCENE';

    window.game.playInlineDialogue([
      {
        speaker: 'NGÔ NHẤT NGHỊ', role: 'KHỐNG CHẾ ĐÒN CHÂN KẸP', avatar: 'nghi',
        text: 'Dừng lại! Tôi đã có thể bẻ gãy cổ anh bằng đòn kẹp cổ Vovinam. Tôi không đến đây để giết anh.'
      },
      {
        speaker: 'PHÓ DUNG HẢI', role: 'BỊ KHỐNG CHẾ', avatar: 'dunghai',
        text: 'Hừ... Đánh hay lắm. Muốn giao nộp tôi cho Hứa Vũ Đại thì làm đi. Nhưng đừng hòng moi thêm một chữ nào từ miệng tôi.'
      }
    ], () => {
      const inv = window.investigationManager;
      if (inv) inv.collectEvidence('DOC_AUDIO_MOCDANG');
      if (window.saveManager) window.saveManager.unlockCharacter('dunghai');
      this.triggerStageVictory();
    });
  }
}

// Global Game Engine Instance
const game = new Game();
window.Game = Game;
window.game = game;
