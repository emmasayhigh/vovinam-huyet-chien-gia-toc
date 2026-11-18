/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/tutorial/tutorialManagerBase.js - Vong doi tutorial, buoc hoc va tien trinh.
 */

class TutorialManagerBase {
  constructor() {
    this.isActive = false;
    this.isIngame = false;
    this.currentStepIndex = 0;
    this.stepProgress = 0;
    this.stepTarget = 1;
    this.dummy = null;
    this.overlay = null;
    this.bulletAlertEl = null;
    this.graduationModalEl = null;
    this.inviteModalEl = null;
    this.holdTimer = 0;
    this.actionDebounceTimer = 0;
    this.autoStepTimer = 0;
    this.activePressedKeys = new Set();
    this.moveDirs = { up: false, down: false, left: false, right: false };
    this.moveTimers = { up: 0, down: 0, left: 0, right: 0 };

    // Khóa trạng thái chuyển bài để không nhận dồn đòn sang bài sau
    this._stepTransitioning = false;
    this._stepTransitionTimer = null;
    this.stepGraceTimer = 0;

    // 10 Bước chuẩn chỉ Việt Võ Đạo (100% tương thích test_upgrades.js)
    this.steps = [
      {
        id: 'tut_move',
        title: 'BƯỚC 1: BỘ PHÁP DI CHUYỂN & CHUYỂN LÀN 2.5D',
        keys: '<kbd data-key="KeyW">W</kbd> <kbd data-key="KeyA">A</kbd> <kbd data-key="KeyS">S</kbd> <kbd data-key="KeyD">D</kbd>',
        desc: 'Di chuyển tự do 8 hướng trên sàn đấu 2.5D. W/S để chuyển làn sâu né đường đòn, A/D để áp sát hoặc rút lui.',
        masterQuote: 'Bộ pháp là gốc rễ của võ thuật Vovinam. Thân pháp linh hoạt như nước, hãy di chuyển đủ 4 hướng W-A-S-D để làm quen sàn đấu.',
        actionAlert: 'DI CHUYỂN ĐỦ 4 HƯỚNG W-A-S-D',
        target: 4,
        dummyState: 'idle',
        hint: 'Di chuyển lần lượt: A (Trái), D (Phải), W (Lên), S (Xuống).'
      },
      {
        id: 'tut_attack',
        title: 'BƯỚC 2: TẤN CÔNG QUYỀN CƯỚC CƠ BẢN',
        keys: 'Đấm <kbd data-key="KeyJ">J</kbd> & Đá <kbd data-key="KeyK">K</kbd>',
        desc: 'J là quyền pháp thẳng nhanh; K là cước pháp tống lùi và phá thế đối thủ.',
        masterQuote: 'Tay ra như chớp giật, chân phóng kình vạn cân. Hãy tung 4 đòn quyền cước trúng vào người ta!',
        actionAlert: 'TUNG 4 ĐÒN ĐẤM [J] VÀ ĐÁ [K]',
        target: 4,
        dummyState: 'idle',
        hint: 'Tung đòn đấm J và đá K vào đối thủ trước mặt.'
      },
      {
        id: 'tut_guard',
        title: 'BƯỚC 3: THẾ THỦ KIM CANG (GUARD)',
        keys: 'Giữ phím <kbd data-key="KeyU">U</kbd>',
        desc: 'Thế thủ Kim Cang Vovinam giúp triệt tiêu 80% sát thương từ các đòn đánh trực diện.',
        masterQuote: 'Khi đối phương dồn ép, khép chỏ che sườn, hạ thấp trọng tâm. Giữ phím [U] để chặn đứng đòn đánh!',
        actionAlert: 'GIỮ PHÍM [U] ĐỂ PHÒNG THỦ',
        target: 1,
        dummyState: 'guard_practice',
        hint: 'Giữ phím U trong 1.0 giây hoặc chặn đòn tấn công của Sư Huynh.'
      },
      {
        id: 'tut_dodge',
        title: 'BƯỚC 4: NÉ THÂN PHÁP (PERFECT DODGE)',
        keys: 'Nhấn <kbd data-key="KeyL">L</kbd> hoặc <kbd data-key="ShiftLeft">Shift</kbd>',
        desc: 'Né đúng khoảnh khắc đối thủ ra đòn kích hoạt Né Hoàn Hảo (Bullet-Time i-frame) & tạo cơ hội phản kích.',
        masterQuote: 'Đòn đánh cận kề là lúc thân pháp phát huy! Khi thấy ánh sáng đỏ lóe lên, thời gian sẽ chậm lại — nhấn [L] để né lướt!',
        actionAlert: '⚡ [L] HOẶC [SHIFT] — NÉ HOÀN HẢO!',
        target: 2,
        dummyState: 'telegraph_dodge',
        hint: 'Khi Sư Huynh vung đòn và thời gian chậm lại, nhấn L lướt né để tạo cơ hội phản công.'
      },
      {
        id: 'tut_counter_hand',
        title: 'BƯỚC 5: PHẢN ĐÒN TAY VOVINAM',
        keys: 'Nhấn đồng thời <kbd data-key="KeyU">U</kbd> + <kbd data-key="KeyJ">J</kbd>',
        desc: 'Đón đầu đòn đấm: Bắt tay lật chỏ bẻ khớp Vovinam, phá thế và gây choáng đối phương.',
        masterQuote: 'Cương nhu phối triển! Khi ta tung quyền đấm thẳng, hãy nhấn đồng thời [U] + [J] để bẻ khớp chỏ ta tức thì!',
        actionAlert: '⚡ [U] + [J] — CHỎ LẬT BẺ KHỚP TAY!',
        target: 1,
        dummyState: 'telegraph_hand',
        hint: 'Khi Sư Huynh tung đòn tay và thời gian chậm lại, nhấn U+J để bẻ chỏ phản đòn tức thì.'
      },
      {
        id: 'tut_counter_leg',
        title: 'BƯỚC 6: GẠT & PHẢN ĐÒN CHÂN VOVINAM',
        keys: 'Nhấn đồng thời <kbd data-key="KeyU">U</kbd> + <kbd data-key="KeyK">K</kbd>',
        desc: 'Đón đầu đòn chân: Gạt cước và quét ngã phá trụ đối phương ngã sấp sàn.',
        masterQuote: 'Khi ta tung cước quét hạ bàn, hạ trọng tâm gạt cước, nhấn [U] + [K] để quét trụ quật ngã ta!',
        actionAlert: '⚡ [U] + [K] — GẠT CƯỚC QUẬT NGÃ!',
        target: 1,
        dummyState: 'telegraph_leg',
        hint: 'Khi Sư Huynh chuẩn bị đá quét và thời gian chậm lại, nhấn U+K để gạt cước quật ngã.'
      },
      {
        id: 'tut_ultimate',
        title: 'BƯỚC 7: TUYỆT KỸ (LONG HỔ XUẤT SƠN)',
        keys: 'Nhấn <kbd data-key="KeyI">I</kbd> khi năng lượng 100%',
        desc: 'Tuyệt kỹ tối thượng xé toạc toàn bộ kẻ địch trên màn hình với sát thương chí mạng.',
        masterQuote: 'Khí tụ đan điền, uy lực chấn sơn hà! Năng lượng đã được nạp đầy rực lửa — hãy nhấn [I] để giải phóng Tuyệt Kỹ!',
        actionAlert: '⚡ [I] — KHAI MỞ LONG HỔ XUẤT SƠN!',
        target: 1,
        dummyState: 'idle',
        hint: 'Năng lượng đã sẵn sàng rực sáng. Nhấn phím I để kích hoạt Tuyệt Kỹ!'
      },
      {
        id: 'tut_ally',
        title: 'BƯỚC 8: TRIỆU HỒI ĐỒNG MINH CHI VIỆN',
        keys: 'Nhấn <kbd data-key="KeyH">H</kbd> gọi đồng minh',
        desc: 'Đồng minh hỗ trợ tham chiến trong 25 giây, tự động truy sát và yểm trợ người chơi.',
        masterQuote: 'Gia tộc họ Phó luôn có huynh đệ kề vai sát cánh. Nhấn [H] để triệu hồi đồng minh chi viện xuất trận!',
        actionAlert: '⚡ [H] — TRIỆU HỒI ĐỒNG MINH CHI VIỆN!',
        target: 1,
        dummyState: 'idle',
        hint: 'Nhấn phím H để đồng minh xuất trận trợ chiến!'
      },
      {
        id: 'tut_hud',
        title: 'BƯỚC 9: THEO DÕI GIAO DIỆN CHIẾN ĐẤU (HUD)',
        keys: 'Nhấn <kbd data-key="Space">SPACE</kbd> hoặc Tiếp tục chiến đấu',
        desc: 'Thanh đỏ: Máu (HP); Thanh vàng: Năng lượng; Góc trái: Hồi chiêu Né [L], Thủ [U].',
        masterQuote: 'Võ tướng giỏi phải biết quan sát đại cục. Thanh Đỏ là Máu, Thanh Vàng là Năng Lượng, góc trái là Hồi Chiêu Thân Pháp. Hãy nhấn [SPACE] để xác nhận!',
        actionAlert: 'NHẤN [SPACE] HOẶC [ENTER] ĐỂ TIẾP TỤC',
        target: 1,
        dummyState: 'idle',
        hint: 'Ghi nhớ thanh máu và hồi chiêu để không bị sơ hở giữa trận đánh.'
      },
      {
        id: 'tut_special_combos',
        title: 'BƯỚC 10: TỔ HỢP COMBO CHIẾN ĐẤU THỰC TẾ',
        keys: '<kbd data-key="KeyW">W</kbd>+<kbd data-key="KeyJ">J</kbd> (Móc lên) hoặc <kbd data-key="KeyS">S</kbd>+<kbd data-key="KeyK">K</kbd> (Quét trụ)',
        desc: 'W+J: móc hất tung kẻ địch lên không; S+K: quét trụ quật ngã xuyên giáp.',
        masterQuote: 'Cuối cùng: Kết hợp phương hướng với quyền cước! Nhấn [W + J] để Móc Lên hất tung, hoặc [S + K] để Quét Trụ quật ngã!',
        actionAlert: 'THỰC HIỆN [W+J] HOẶC [S+K]',
        target: 2,
        dummyState: 'idle',
        hint: 'Kết hợp hướng W+J (Móc lên) hoặc S+K (Quét trụ) để làm chủ sàn đấu!'
      }
    ];

    // Lắng nghe sự kiện bàn phím thực tế để bật đèn phím 3D cơ học
    this.initKeyboardListener();
  }

  initKeyboardListener() {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', (e) => {
      this.activePressedKeys.add(e.code);
      this.refreshKeycapHighlights();
    });
    window.addEventListener('keyup', (e) => {
      this.activePressedKeys.delete(e.code);
      this.refreshKeycapHighlights();
    });
  }

  refreshKeycapHighlights() {
    if (!this.overlay) return;
    const keycaps = this.overlay.querySelectorAll('kbd[data-key]');
    keycaps.forEach(k => {
      const code = k.getAttribute('data-key');
      if (this.activePressedKeys.has(code) || (code === 'ShiftLeft' && this.activePressedKeys.has('ShiftRight'))) {
        k.classList.add('active');
      } else {
        k.classList.remove('active');
      }
    });
  }

  isTutorialNeeded() {
    const save = window.saveManager;
    if (!save || !save.data) return false;
    if (typeof save.isTutorialNeeded === 'function') {
      return save.isTutorialNeeded();
    }
    if (save.data.tutorialCompleted || save.data.tutorialSkipped) return false;
    if (save.data.completedStages && save.data.completedStages.length > 0) return false;
    return true;
  }

  /**
   * Khởi động Võ Đường Khảo Hạch Nhập Môn Chuẩn AAA (Dedicated Training Dojo)
   */
  startTutorial() {
    this.isActive = true;
    this.isIngame = false;
    this.currentStepIndex = 0;
    this.stepProgress = 0;
    this.autoStepTimer = 0;
    this._stepTransitioning = false;
    if (this._stepTransitionTimer) {
      clearTimeout(this._stepTransitionTimer);
      this._stepTransitionTimer = null;
    }
    this.stepGraceTimer = 0.2;

    if (window.allyManager && typeof window.allyManager.reset === 'function') {
      window.allyManager.reset();
    }

    const game = window.game;
    if (game) {
      // Tắt mưa hoàn toàn trong võ đường
      if (window.effectManager) {
        window.effectManager.isRaining = false;
        window.effectManager.rainDrops = [];
        window.effectManager.particles = [];
        window.effectManager.floatingTexts = [];
      }
      if (window.propSystem) {
        window.propSystem.props = [];
      }
      if (window.weaponSystem) {
        window.weaponSystem.reset(game.player);
      }

      game.state = 'TUTORIAL';
      game.arenaLocked = true;
      game.arenaMinX = 50;
      game.arenaMaxX = 1400;

      game.player.setCharacter('nghi');
      game.player.reset(360, 580);
      game.player.facing = 1;
      game.player.hp = game.player.maxHp;
      game.player.energy = 100;

      // Sinh Sư Huynh Huấn Luyện (Tutorial Dummy) đứng ngay đối diện (140px)
      this.dummy = new window.TutorialDummy(500, 580);
      this.dummy.facing = -1;
      game.enemies = [this.dummy];
      game.currentBoss = null;
      game.camera.x = 0;
      game.camera.y = 0;
      game.startLoop();

      if (window.uiManager) {
        window.uiManager.hideTitleScreen();
        window.uiManager.showHUD();
        window.uiManager.setCharacterHUD(game.player);
        window.uiManager.showAlertBanner('🥋 BÀN TAY THÉP ĐẶT LÊN TRÁI TIM TỪ ÁI');
      }
      if (window.audioManager && typeof window.audioManager.playVovinamKiai === 'function') {
        window.audioManager.playVovinamKiai('salute');
      }
    }

    this.showOverlay();
    this.setupStep(0);

    if (window.audioManager && typeof window.audioManager.playSkill === 'function') {
      window.audioManager.playSkill();
    }
  }

  /**
   * Không chèn giao diện khảo hạch võ đường đè lên màn chiến dịch thực tế
   */
  startIngameTutorial() {
    this.isActive = false;
    this.isIngame = false;
    this.hideOverlay();
  }

  setupStep(index) {
    if (this._stepTransitionTimer) {
      clearTimeout(this._stepTransitionTimer);
      this._stepTransitionTimer = null;
    }
    this._stepTransitioning = false;
    this.stepGraceTimer = 0.25;

    if (index >= this.steps.length) {
      this.finishTutorial();
      return;
    }

    this.currentStepIndex = index;
    const step = this.steps[index];
    this.stepProgress = 0;
    this.stepTarget = step.target;
    this.holdTimer = 0;
    this.autoStepTimer = 0;
    this.actionDebounceTimer = 0;

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

    if (window.game && window.game.player) {
      const p = window.game.player;
      p.comboStep = 0;
      p.queuedCombo = false;
      if (p.hitTargets && typeof p.hitTargets.clear === 'function') {
        p.hitTargets.clear();
      }
    }

    if (step.id === 'tut_move') {
      this.moveDirs = { up: false, down: false, left: false, right: false };
      this.moveTimers = { up: 0, down: 0, left: 0, right: 0 };
    }

    if (this.dummy && this.dummy.isTutorialDummy) {
      this.dummy.attackMode = step.dummyState;
      this.dummy.telegraphTimer = 0;
      this.dummy.telegraphState = 'idle';
      this.dummy.slowMoTriggered = false;
      this.dummy.hasStruckThisCycle = false;
      this.dummy.hitJitterTimer = 0;
      this.dummy.squashTimer = 0;
      this.dummy.cooldownTimer = 0.5;

      // Đặt vị trí Sư Huynh cách người chơi một khoảng vừa phải (~130px)
      if (window.game && window.game.player) {
        const p = window.game.player;
        this.dummy.x = (p.x < 700) ? p.x + 130 : p.x - 130;
        this.dummy.y = p.y;
        this.dummy.facing = (p.x >= this.dummy.x) ? 1 : -1;
        // Đánh dấu người chơi đã hit dummy cho đòn hiện tại (nếu đang vung dở) để không tính vào bài mới
        if (p.hitTargets && typeof p.hitTargets.add === 'function') {
          p.hitTargets.add(this.dummy.id);
        }
      } else {
        this.dummy.x = 560;
        this.dummy.y = 580;
      }
    }

    if (step.id === 'tut_ultimate' && window.game && window.game.player) {
      window.game.player.energy = window.game.player.maxEnergy;
      if (window.uiManager) window.uiManager.updatePlayerEnergy(100, 100);
    }

    if (step.id === 'tut_ally') {
      if (window.game) window.game.allyCooldown = 0;
      if (window.allyManager) {
        if (typeof window.allyManager.reset === 'function') window.allyManager.reset();
        window.allyManager.gauge = 100;
        window.allyManager.isReady = true;
        window.allyManager.updateHUD();
      }
    } else {
      if (window.allyManager && typeof window.allyManager.reset === 'function') {
        window.allyManager.reset();
      }
    }

    this.hideSlowMoAlert();
    this.updateOverlayUI();
  }

  // Cả recordAction và recordTutorialAction đều dùng chung một bộ điều khiển
  recordAction(actionType, detail = {}) {
    this.recordTutorialAction(actionType, detail);
  }

  recordTutorialAction(actionType, detail = {}) {
    if (!this.isActive) return;
    if (this._stepTransitioning || this.stepGraceTimer > 0) return;
    const step = this.steps[this.currentStepIndex];
    if (!step) return;

    let matched = false;

    if (step.id === 'tut_move') {
      // BƯỚC 1: Được kiểm tra kỹ lưỡng theo từng hướng trong update(dt).
      // Không cho phép nhận nút liên tục gây xong ngay lập tức khi giữ phím.
      return;
    } else if (step.id === 'tut_attack' && (actionType === 'punch' || actionType === 'kick')) {
      this.stepProgress++;
      matched = true;
    } else if (step.id === 'tut_guard' && actionType === 'guard_held') {
      this.stepProgress++;
      matched = true;
    } else if (step.id === 'tut_dodge' && actionType === 'perfect_dodge') {
      this.stepProgress++;
      matched = true;
    } else if (step.id === 'tut_counter_hand' && actionType === 'counter_hand') {
      this.stepProgress++;
      matched = true;
    } else if (step.id === 'tut_counter_leg' && actionType === 'counter_leg') {
      this.stepProgress++;
      matched = true;
    } else if (step.id === 'tut_ultimate' && actionType === 'ultimate_hit') {
      this.stepProgress++;
      matched = true;
    } else if (step.id === 'tut_ally' && actionType === 'ally_summon') {
      this.stepProgress++;
      matched = true;
    } else if (step.id === 'tut_hud' && actionType === 'space_pressed') {
      this.stepProgress++;
      matched = true;
    } else if (step.id === 'tut_special_combos' && (actionType === 'uppercut' || actionType === 'sweep' || actionType === 'dash_punch' || actionType === 'combo_finished')) {
      this.stepProgress++;
      matched = true;
    }

    if (matched) {
      this.hideSlowMoAlert();

      if (window.effectManager && window.game && window.game.player) {
        window.effectManager.addFloatingText(`TIẾN ĐỘ: ${this.stepProgress}/${this.stepTarget}`, window.game.player.x, window.game.player.y - 140, 'heal');
      }

      if (window.audioManager) {
        if (typeof window.audioManager.playChime === 'function') {
          window.audioManager.playChime();
        } else if (typeof window.audioManager.playClick === 'function') {
          window.audioManager.playClick();
        }
      }

      this.updateOverlayUI();

      if (this.stepProgress >= this.stepTarget) {
        this.completeCurrentStep();
      }
    }
  }

  completeCurrentStep() {
    if (this._stepTransitioning) return;
    this._stepTransitioning = true;
    this.stepProgress = this.stepTarget;

    const step = this.steps[this.currentStepIndex];
    if (window.uiManager && typeof window.uiManager.showAlertBanner === 'function') {
      window.uiManager.showAlertBanner(`XUẤT SẮC: ${step.title}`);
    }
    if (window.audioManager) {
      if (typeof window.audioManager.playSkill === 'function') {
        window.audioManager.playSkill();
      }
    }

    if (this._stepTransitionTimer) clearTimeout(this._stepTransitionTimer);
    this._stepTransitionTimer = setTimeout(() => {
      this._stepTransitionTimer = null;
      if (this.isActive) {
        this.setupStep(this.currentStepIndex + 1);
      }
    }, 850);
  }

  skipTutorial() {
    if (window.saveManager && typeof window.saveManager.skipTutorial === 'function') {
      window.saveManager.skipTutorial();
    }
    if (window.uiManager && typeof window.uiManager.showToast === 'function') {
      window.uiManager.showToast('ĐÃ BỎ QUA GỢI Ý CHIẾN ĐẤU [TAB]');
    }
    this.endTutorial();
  }

  finishTutorial() {
    if (window.saveManager) {
      window.saveManager.completeTutorial();
      window.saveManager.unlockAchievement('tutorial_master');
    }
    if (window.audioManager && typeof window.audioManager.playVictory === 'function') {
      window.audioManager.playVictory();
    }

    this.showGraduationScreen();
  }


  endTutorialAndStartStage1() {
    this.isActive = false;
    this._stepTransitioning = false;
    if (this._stepTransitionTimer) {
      clearTimeout(this._stepTransitionTimer);
      this._stepTransitionTimer = null;
    }
    if (window.allyManager && typeof window.allyManager.reset === 'function') {
      window.allyManager.reset();
    }
    this.hideOverlay();
    if (this.graduationModalEl) {
      this.graduationModalEl.classList.add('hidden');
    }
    if (window.menuManager) {
      window.menuManager.showDeploymentModal(1);
    } else {
      const game = window.game;
      if (game && typeof game.startStage === 'function') {
        game.startStage(1);
      }
    }
  }

  endTutorialAndReturnMenu() {
    this.isActive = false;
    this._stepTransitioning = false;
    if (this._stepTransitionTimer) {
      clearTimeout(this._stepTransitionTimer);
      this._stepTransitionTimer = null;
    }
    if (window.allyManager && typeof window.allyManager.reset === 'function') {
      window.allyManager.reset();
    }
    this.hideOverlay();
    if (this.graduationModalEl) {
      this.graduationModalEl.classList.add('hidden');
    }
    if (window.game && typeof window.game.returnToMenu === 'function') {
      window.game.returnToMenu();
    } else {
      const game = window.game;
      if (game) {
        game.state = 'MENU';
        game.enemies = [];
        game.currentBoss = null;
        if (window.uiManager && typeof window.uiManager.showTitleScreen === 'function') {
          window.uiManager.showTitleScreen();
        }
      }
    }
  }

  endTutorial() {
    this.isActive = false;
    this._stepTransitioning = false;
    if (this._stepTransitionTimer) {
      clearTimeout(this._stepTransitionTimer);
      this._stepTransitionTimer = null;
    }
    if (window.allyManager && typeof window.allyManager.reset === 'function') {
      window.allyManager.reset();
    }
    this.hideOverlay();
    if (this.graduationModalEl) {
      this.graduationModalEl.classList.add('hidden');
    }
    // Nếu đang ở màn độc lập, mở xuất trận Màn 1
    if (!this.isIngame) {
      if (window.menuManager) {
        window.menuManager.showDeploymentModal(1);
      } else {
        const game = window.game;
        if (game && typeof game.startStage === 'function') {
          game.startStage(1);
        }
      }
    }
  }


  update(dt) {
    if (!this.isActive) {
      // Hỗ trợ phím tắt Enter/Esc trên màn hình tốt nghiệp
      if (this.graduationModalEl && !this.graduationModalEl.classList.contains('hidden')) {
        const inp = window.input;
        if (inp && inp.isJustPressed) {
          if (inp.isJustPressed('Enter') || inp.isJustPressed('Space')) {
            this.endTutorialAndStartStage1();
          } else if (inp.isJustPressed('Escape')) {
            this.endTutorialAndReturnMenu();
          }
        }
      }
      return;
    }

    const step = this.steps[this.currentStepIndex];
    if (!step) return;

    if (this.stepGraceTimer > 0) {
      this.stepGraceTimer = Math.max(0, this.stepGraceTimer - dt);
    }
    if (this._stepTransitioning) return;

    const inp = window.input;
    if (!inp) return;

    // Phím TAB hoặc Escape bỏ qua gợi ý nhanh
    if (inp.isJustPressed && (inp.isJustPressed('Tab') || inp.isJustPressed('Escape'))) {
      this.skipTutorial();
      return;
    }

    if (this.actionDebounceTimer > 0) {
      this.actionDebounceTimer -= dt;
    }

    // --- KIỂM TRA CHẶT CHẼ THEO TỪNG BƯỚC KHẢO HẠCH ---
    if (step.id === 'tut_move') {
      const p = window.game && window.game.player;
      const isMoving = p && (Math.abs(p.vx) > 10 || Math.abs(p.vy) > 10);

      const checkDir = (dirKey, isPressed, label) => {
        if (this.moveDirs[dirKey]) return; // Hướng này đã hoàn thành, không nhận trùng lặp

        if (isPressed && isMoving) {
          this.moveTimers[dirKey] += dt;
          // Yêu cầu giữ và di chuyển thật sự liên tục ít nhất 0.35s
          if (this.moveTimers[dirKey] >= 0.35) {
            this.moveDirs[dirKey] = true;
            this.stepProgress = Object.values(this.moveDirs).filter(Boolean).length;

            if (window.effectManager && p) {
              window.effectManager.addFloatingText(`✓ HƯỚNG ${label}: ĐẠT!`, p.x, p.y - 140, 'heal');
            }
            if (window.audioManager && typeof window.audioManager.playChime === 'function') {
              window.audioManager.playChime();
            }
            this.updateOverlayUI();

            if (this.stepProgress >= this.stepTarget) {
              this.completeCurrentStep();
            }
          }
        } else {
          // Nhả phím hoặc đứng yên thì reset bộ đếm thời gian của hướng này
          this.moveTimers[dirKey] = 0;
        }
      };

      checkDir('right', inp.moveRight, 'PHẢI (D)');
      checkDir('left', inp.moveLeft, 'TRÁI (A)');
      checkDir('up', inp.moveUp, 'LÀN SÂU (W)');
      checkDir('down', inp.moveDown, 'LÀN TRƯỚC (S)');

    } else if (step.id === 'tut_guard') {
      // Thế thủ: Giữ U liên tục ít nhất 1.0 giây hoặc đỡ thành công đòn đánh của Sư Huynh
      if (inp.block || inp.isDown('KeyU') || (inp.isKeyDown && inp.isKeyDown('KeyU'))) {
        this.holdTimer += dt;
        if (this.holdTimer >= 1.0) {
          this.recordTutorialAction('guard_held');
        }
      } else {
        this.holdTimer = 0;
      }

    } else if (step.id === 'tut_ultimate') {
      if (inp.isJustPressed && inp.isJustPressed('KeyI')) {
        this.recordTutorialAction('ultimate_hit');
      }

    } else if (step.id === 'tut_ally') {
      if (inp.isJustPressed && inp.isJustPressed('KeyH')) {
        this.recordTutorialAction('ally_summon');
      } else {
        // Tự động vượt qua sau 8 giây nếu chưa mở khóa đồng minh
        this.autoStepTimer += dt;
        if (this.autoStepTimer > 8.0) {
          this.recordTutorialAction('ally_summon');
        }
      }

    } else if (step.id === 'tut_hud') {
      this.autoStepTimer += dt;
      if ((inp.isJustPressed && (inp.isJustPressed('Space') || inp.isJustPressed('Enter'))) || this.autoStepTimer >= 4.0) {
        this.recordTutorialAction('space_pressed');
      }
    }
  }
}

window.TutorialManagerBase = TutorialManagerBase;
