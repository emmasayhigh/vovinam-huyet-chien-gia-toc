/**
 * VOVINAM: SÁT THẦN GIẢI CỨU HỨA VŨ ĐẠI
 * js/main.js - Game Bootstrapper, Button Event Listeners & Audio Unlocker
 */

window.addEventListener('DOMContentLoaded', () => {
  // 1. Kết Nối Sự Kiện Các Nút Trên Màn Hình Chính
  const btnStart = document.getElementById('btn-start-game');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      unlockAudio();
      if (window.tutorialManager && window.tutorialManager.isTutorialNeeded()) {
        window.tutorialManager.showInviteModal(
          () => {
            if (window.uiManager) window.uiManager.hideTitleScreen();
            window.tutorialManager.startTutorial();
          },
          () => {
            if (window.saveManager) window.saveManager.skipTutorial();
            if (window.uiManager) window.uiManager.hideTitleScreen();
            if (window.menuManager) window.menuManager.openCharSelect(1);
            else window.game.startStage(1);
          }
        );
      } else {
        if (window.uiManager) window.uiManager.hideTitleScreen();
        if (window.menuManager) window.menuManager.openCharSelect(1);
        else window.game.startStage(1);
      }
    });
  }

  // Tiếp tục chiến dịch ở màn chơi gần nhất (theo dữ liệu lưu)
  const btnContinue = document.getElementById('btn-continue-game');
  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      unlockAudio();
      const stage = (window.saveManager && window.saveManager.data.currentStage) || 1;
      // Nếu đã đánh xong màn cuối (currentStage vượt danh sách) -> quay lại màn cuối để xem kết thúc again
      const keys = window.stageManager && window.stageManager.stages
        ? Object.keys(window.stageManager.stages).map(Number) : [];
      const maxStage = keys.length ? Math.max(...keys) : stage;
      const targetStage = Math.min(stage, maxStage);
      if (window.uiManager) window.uiManager.hideTitleScreen();
      if (window.menuManager) window.menuManager.openCharSelect(targetStage);
      else window.game.startStage(targetStage);
    });
  }

  // Các màn hình menu mới (Chọn nhân vật / Bản đồ chương / Hồ sơ / Bộ sưu tập / Thành tích / Cài đặt / Luyện võ / Tái đấu / Suy luận)
  const openMenu = (fn) => () => { unlockAudio(); fn(); };
  const menu = () => window.menuManager;
  const bind = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', openMenu(fn));
  };
  bind('btn-campaign-hub', () => { if (menu()) menu().showCampaignHub(); });
  bind('btn-char-select', () => { menu().openCharSelect(null); });
  bind('btn-chronicles', () => menu().showChronicles());
  bind('btn-quick-chronicles', () => menu().showChronicles());
  bind('btn-chapter-map', () => menu().showChapterMap());
  bind('btn-dossier', () => menu().showDossier());
  bind('btn-collection', () => menu().showCollection());
  bind('btn-achievements', () => menu().showAchievements());
  bind('btn-settings', () => menu().showSettings());
  bind('btn-training', () => {
    if (window.trainingManager) {
      window.trainingManager.showModeSelectModal();
    }
  });
  bind('btn-boss-rush', () => {
    if (window.bossRushManager) window.bossRushManager.showMenu();
  });
  bind('btn-deduction', () => {
    if (window.deductionManager) window.deductionManager.showBoard();
  });

  // Thẻ tính năng & sự kiện trên màn hình chính mới
  bind('card-feature-story', () => menu().showChronicles());
  bind('card-feature-event', () => {
    if (window.bossRushManager) window.bossRushManager.showMenu();
  });
  bind('card-feature-map', () => menu().showChapterMap());
  bind('card-feature-battlegrounds', () => {
    if (window.trainingManager) {
      window.trainingManager.showModeSelectModal();
    }
  });

  // Modal Trang Bị & Kỹ Năng
  const skillsModal = document.getElementById('skills-equip-modal');
  bind('btn-skills-equip', () => {
    if (skillsModal) skillsModal.classList.remove('hidden');
  });
  bind('btn-close-skills-equip', () => {
    if (skillsModal) skillsModal.classList.add('hidden');
  });
  bind('btn-skills-equip-close-x', () => {
    if (skillsModal) skillsModal.classList.add('hidden');
  });
  if (skillsModal) {
    skillsModal.addEventListener('click', (e) => {
      if (e.target === skillsModal) skillsModal.classList.add('hidden');
    });
  }

  // Modal Thoát Game
  const exitModal = document.getElementById('exit-confirm-modal');
  bind('btn-exit-game', () => {
    if (exitModal) exitModal.classList.remove('hidden');
  });
  bind('btn-exit-cancel', () => {
    if (exitModal) exitModal.classList.add('hidden');
  });
  bind('btn-exit-close-x', () => {
    if (exitModal) exitModal.classList.add('hidden');
  });
  if (exitModal) {
    exitModal.addEventListener('click', (e) => {
      if (e.target === exitModal) exitModal.classList.add('hidden');
    });
  }
  bind('btn-exit-confirm', () => {
    if (window.uiManager) window.uiManager.showToast('HẸN GẶP LẠI TRÊN CHIẾN TRƯỜNG GIA TỘC!');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  });

  // Nút âm thanh thanh điều hướng trên cùng
  const btnTopAudio = document.getElementById('btn-top-audio');
  if (btnTopAudio) {
    btnTopAudio.addEventListener('click', () => {
      unlockAudio();
      if (window.audioManager) {
        const unmuted = window.audioManager.toggleMute();
        if (window.uiManager) {
          window.uiManager.showToast(unmuted ? 'ÂM THANH: BẬT' : 'ÂM THANH: ĐÃ TẮT');
        }
      }
    });
  }

  // Nút toàn màn hình thanh điều hướng trên cùng
  const btnFullscreenToggle = document.getElementById('btn-fullscreen-toggle');
  if (btnFullscreenToggle) {
    btnFullscreenToggle.addEventListener('click', () => {
      unlockAudio();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        if (window.uiManager) window.uiManager.showToast('CHẾ ĐỘ TOÀN MÀN HÌNH');
      } else {
        document.exitFullscreen().catch(() => {});
        if (window.uiManager) window.uiManager.showToast('THOÁT TOÀN MÀN HÌNH');
      }
    });
  }

  // Nút trong màn hình kết thúc
  const btnEndingReplay = document.getElementById('btn-ending-replay');
  if (btnEndingReplay) {
    btnEndingReplay.addEventListener('click', () => {
      unlockAudio();
      window.uiManager.hideEnding();
      window.game.startStage(1);
    });
  }
  const btnEndingChapters = document.getElementById('btn-ending-chapters');
  if (btnEndingChapters) {
    btnEndingChapters.addEventListener('click', () => {
      unlockAudio();
      window.uiManager.hideEnding();
      window.game.state = 'MENU';
      window.uiManager.showTitleScreen();
      menu().showChapterMap();
    });
  }
  const btnEndingMenu = document.getElementById('btn-ending-menu');
  if (btnEndingMenu) {
    btnEndingMenu.addEventListener('click', () => {
      unlockAudio();
      window.uiManager.hideEnding();
      window.game.state = 'MENU';
      window.uiManager.showTitleScreen();
    });
  }

  const btnTouchToggle = document.getElementById('btn-touch-toggle');
  if (btnTouchToggle) {
    btnTouchToggle.addEventListener('click', () => {
      unlockAudio();
      const tc = document.getElementById('touch-controls');
      if (tc) {
        const isHidden = tc.classList.toggle('hidden');
        if (window.uiManager) {
          window.uiManager.showToast(isHidden ? 'ĐÃ ẨN PHÍM CẢM ỨNG' : 'ĐÃ BẬT PHÍM CẢM ỨNG (MOBILE)');
        }
      }
    });
  }

  const btnCloseStages = document.getElementById('btn-close-stages');
  if (btnCloseStages) {
    btnCloseStages.addEventListener('click', () => {
      unlockAudio();
      window.uiManager.hideStageSelect();
    });
  }

  // Chọn màn chơi trực tiếp
  const stageCards = document.querySelectorAll('.stage-card');
  stageCards.forEach(card => {
    card.addEventListener('click', () => {
      unlockAudio();
      const stageNum = parseInt(card.getAttribute('data-stage'), 10) || 1;
      window.uiManager.hideStageSelect();
      window.game.startStage(stageNum);
    });
  });

  const btnHowToPlay = document.getElementById('btn-how-to-play');
  if (btnHowToPlay) {
    btnHowToPlay.addEventListener('click', () => {
      unlockAudio();
      window.uiManager.showControls();
    });
  }

  const btnCloseControls = document.getElementById('btn-close-controls');
  if (btnCloseControls) {
    btnCloseControls.addEventListener('click', () => {
      unlockAudio();
      window.uiManager.hideControls();
    });
  }
  const btnCloseControlsIcon = document.getElementById('btn-close-controls-icon');
  if (btnCloseControlsIcon) {
    btnCloseControlsIcon.addEventListener('click', () => {
      unlockAudio();
      window.uiManager.hideControls();
    });
  }

  const creditsModal = document.getElementById('credits-modal');
  const btnCredits = document.getElementById('btn-credits');
  if (btnCredits) {
    btnCredits.addEventListener('click', () => {
      unlockAudio();
      if (creditsModal) {
        creditsModal.classList.remove('hidden');
      }
    });
  }
  bind('btn-credits-close', () => {
    if (creditsModal) creditsModal.classList.add('hidden');
  });
  bind('btn-credits-close-x', () => {
    if (creditsModal) creditsModal.classList.add('hidden');
  });
  if (creditsModal) {
    creditsModal.addEventListener('click', (e) => {
      if (e.target === creditsModal) creditsModal.classList.add('hidden');
    });
  }

  // 2. Nút Màn Hình Tạm Dừng (Pause Menu)
  const btnResume = document.getElementById('btn-resume');
  if (btnResume) {
    btnResume.addEventListener('click', () => {
      unlockAudio();
      window.game.resumeGame();
    });
  }

  const btnRestartStage = document.getElementById('btn-restart-stage');
  if (btnRestartStage) {
    btnRestartStage.addEventListener('click', () => {
      unlockAudio();
      if (window.game && window.game.previousState === 'TRAINING' && window.trainingManager) {
        if (window.uiManager) window.uiManager.hidePause();
        const mode = window.trainingManager.mode || 'free';
        const drillIdx = window.trainingManager.currentDrillIndex || 0;
        window.trainingManager.startTraining(mode, drillIdx);
      } else if (window.game && window.game.previousState === 'TUTORIAL' && window.tutorialManager) {
        if (window.uiManager) window.uiManager.hidePause();
        window.tutorialManager.startTutorial();
      } else if (window.game) {
        window.game.startStage(window.stageManager.currentStageIndex);
      }
    });
  }

  const btnPauseControls = document.getElementById('btn-pause-controls');
  if (btnPauseControls) {
    btnPauseControls.addEventListener('click', () => {
      unlockAudio();
      window.uiManager.showControls();
    });
  }

  const btnPauseSettings = document.getElementById('btn-pause-settings');
  if (btnPauseSettings) {
    btnPauseSettings.addEventListener('click', () => {
      unlockAudio();
      if (window.uiManager) {
        window.uiManager._returnToPauseOnCloseSettings = true;
        window.uiManager.hidePause();
      }
      if (window.menuManager) window.menuManager.showSettings();
    });
  }

  const btnQuitMenu = document.getElementById('btn-quit-menu');
  if (btnQuitMenu) {
    btnQuitMenu.addEventListener('click', () => {
      unlockAudio();
      if (window.game && typeof window.game.returnToMenu === 'function') {
        window.game.returnToMenu();
      } else {
        window.uiManager.hidePause();
        window.uiManager.showTitleScreen();
        window.game.state = 'MENU';
        if (window.audioManager) window.audioManager.stopBGM();
      }
    });
  }

  // 3. Nút Chiến Thắng Màn Chơi (Stage Clear)
  const btnNextStage = document.getElementById('btn-next-stage');
  if (btnNextStage) {
    btnNextStage.addEventListener('click', () => {
      unlockAudio();
      const cur = window.stageManager.currentStageIndex;
      const meta = window.STORY_META && window.STORY_META.stages ? window.STORY_META.stages[cur] : null;
      let next = meta ? meta.next : cur + 1;
      // Màn phụ (nhiệm vụ phụ) -> quay về màn chính kế tiếp
      if ((next === null || next === undefined) && meta && meta.type === 'side' && meta.sideOf) {
        const parentMeta = window.STORY_META.stages[meta.sideOf];
        next = parentMeta ? parentMeta.next : null;
      }
      if (next && next !== cur) {
        window.uiManager.hideStageClear();
        if (window.menuManager) {
          window.menuManager.openCharSelect(next);
        } else {
          window.game.startStage(next);
        }
      } else {
        // Hết chuỗi màn chính -> về màn hình chính (kết thúc đã hiển thị ở màn 11)
        window.uiManager.hideStageClear();
        window.game.state = 'MENU';
        window.uiManager.showTitleScreen();
      }
    });
  }

  const btnVictoryReplay = document.getElementById('btn-victory-replay');
  if (btnVictoryReplay) {
    btnVictoryReplay.addEventListener('click', () => {
      unlockAudio();
      window.uiManager.hideStageClear();
      if (window.menuManager) {
        window.menuManager.openCharSelect(window.stageManager.currentStageIndex);
      } else {
        window.game.startStage(window.stageManager.currentStageIndex);
      }
    });
  }

  // 4. Nút Thất Bại (Game Over)
  const btnRetry = document.getElementById('btn-retry');
  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      unlockAudio();
      window.game.startStage(window.stageManager.currentStageIndex);
    });
  }

  const btnGameOverMenu = document.getElementById('btn-gameover-menu');
  if (btnGameOverMenu) {
    btnGameOverMenu.addEventListener('click', () => {
      unlockAudio();
      window.uiManager.hideGameOver();
      window.uiManager.showTitleScreen();
      window.game.state = 'MENU';
    });
  }

  // 5. Nút Toàn Thắng (Grand Victory Epilogue)
  const btnGrandReplay = document.getElementById('btn-grand-replay');
  if (btnGrandReplay) {
    btnGrandReplay.addEventListener('click', () => {
      unlockAudio();
      window.game.startStage(1);
    });
  }

  const btnGrandMenu = document.getElementById('btn-grand-menu');
  if (btnGrandMenu) {
    btnGrandMenu.addEventListener('click', () => {
      unlockAudio();
      window.uiManager.hideGrandVictory();
      window.uiManager.showTitleScreen();
      window.game.state = 'MENU';
    });
  }

  // 6. Nút Bật/Tắt Nhanh Âm Thanh, Toàn Màn Hình & Tạm Dừng Trên Góc Màn Hình
  const btnQuickAudio = document.getElementById('btn-quick-audio');
  if (btnQuickAudio) {
    btnQuickAudio.addEventListener('click', () => {
      unlockAudio();
      if (window.audioManager) {
        const isMuted = !window.audioManager.toggleMute();
        window.uiManager.updateAudioButton(isMuted);
      }
    });
  }

  const toggleFullscreen = () => {
    unlockAudio();
    const wrapper = document.getElementById('game-wrapper');
    if (!document.fullscreenElement) {
      if (wrapper.requestFullscreen) wrapper.requestFullscreen().catch(() => {});
      else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  };

  const btnQuickFullscreen = document.getElementById('btn-quick-fullscreen');
  if (btnQuickFullscreen) {
    btnQuickFullscreen.addEventListener('click', toggleFullscreen);
  }

  const btnQuickPause = document.getElementById('btn-quick-pause');
  if (btnQuickPause) {
    btnQuickPause.addEventListener('click', () => {
      unlockAudio();
      if (window.game.state === 'PLAYING' || window.game.state === 'TRAINING' || window.game.state === 'TUTORIAL') {
        window.game.pauseGame();
      } else if (window.game.state === 'PAUSED') {
        window.game.resumeGame();
      }
    });
  }

  // 7. Nhấp Chuột Lên Hộp Thoại Để Tiếp Tục (Click to Advance Dialogue)
  const dialogueBox = document.getElementById('dialogue-box');
  if (dialogueBox) {
    dialogueBox.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'btn-dialogue-skip') return;
      unlockAudio();
      if (window.stageManager) {
        window.stageManager.advanceDialogue();
      }
    });
  }

  const btnDialogueSkip = document.getElementById('btn-dialogue-skip');
  if (btnDialogueSkip) {
    btnDialogueSkip.addEventListener('click', (e) => {
      e.stopPropagation();
      unlockAudio();
      if (window.stageManager) {
        window.stageManager.skipDialogue();
      }
    });
  }

  // 8. Phím Tắt Toàn Cục (ESC = Pause / Close Modal, M = Mute, F = Fullscreen, TAB = Skip Dialogue)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      // Ưu tiên 1: Nếu hộp thoại Quyết định Quyền nắm giữ đang mở -> Đóng an toàn & khôi phục game
      const custodyModal = document.getElementById('custody-modal');
      if (custodyModal && !custodyModal.classList.contains('hidden')) {
        if (window.menuManager && typeof window.menuManager.closeCustodyModal === 'function') {
          window.menuManager.closeCustodyModal();
        } else {
          custodyModal.classList.add('hidden');
          if (window.game && window.game.state === 'PAUSED') window.game.state = 'PLAYING';
        }
        return;
      }

      // Ưu tiên 2: Nếu Biên Niên Sử đang mở -> Đóng an toàn & khôi phục game
      const chronModal = document.getElementById('chronicles-modal');
      if (chronModal && !chronModal.classList.contains('hidden')) {
        if (window.menuManager && typeof window.menuManager.closeChronicles === 'function') {
          window.menuManager.closeChronicles();
        } else {
          chronModal.classList.add('hidden');
          if (window.game && window.game.state === 'PAUSED') window.game.state = 'PLAYING';
        }
        return;
      }

      // Ưu tiên 3: Nếu bảng Điều khiển đang mở -> Đóng an toàn
      const controlsModal = document.getElementById('controls-modal');
      if (controlsModal && !controlsModal.classList.contains('hidden')) {
        if (window.uiManager) window.uiManager.hideControls();
        return;
      }

      // Ưu tiên 4: Nếu bất kỳ modal menu nào khác đang mở -> Đóng tất cả
      const otherModalIds = [
        'char-select-modal', 'chapter-map-modal', 'dossier-modal',
        'collection-modal', 'achievements-modal', 'settings-modal', 'credits-modal'
      ];
      const anyOtherOpen = otherModalIds.some(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains('hidden');
      });
      if (anyOtherOpen) {
        if (window.menuManager) window.menuManager.hideAll();
        return;
      }

      // Ưu tiên 5: Bật / Tắt Tạm Dừng trận đánh / đấu luyện / hướng dẫn
      if (window.game) {
        if (window.game.state === 'PLAYING' || window.game.state === 'TRAINING' || window.game.state === 'TUTORIAL') {
          window.game.pauseGame();
        } else if (window.game.state === 'PAUSED') {
          window.game.resumeGame();
        }
      }
    } else if (e.code === 'KeyM') {
      if (window.audioManager) {
        const isMuted = !window.audioManager.toggleMute();
        window.uiManager.updateAudioButton(isMuted);
      }
    } else if (e.code === 'KeyF') {
      toggleFullscreen();
    } else if (e.code === 'Tab') {
      if (window.game.state === 'CUTSCENE') {
        e.preventDefault();
        if (window.stageManager) window.stageManager.skipDialogue();
      }
    }
  });

  // 9. Khởi tạo phím ảo cảm ứng (Virtual Touch Controls cho Mobile & Tablet)
  const touchContainer = document.getElementById('touch-controls');
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  if (isTouchDevice && touchContainer) {
    touchContainer.classList.remove('hidden');
  }

  window.addEventListener('touchstart', () => {
    if (touchContainer && touchContainer.classList.contains('hidden')) {
      touchContainer.classList.remove('hidden');
    }
    unlockAudio();
  }, { passive: true, once: true });

  const touchBtns = document.querySelectorAll('.touch-btn');
  touchBtns.forEach((btn) => {
    const key = btn.getAttribute('data-key');
    if (!key) return;

    const press = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add('active');
      if (window.input) window.input.setVirtualKey(key, true);
    };

    const release = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.remove('active');
      if (window.input) window.input.setVirtualKey(key, false);
    };

    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('touchend', release, { passive: false });
    btn.addEventListener('touchcancel', release, { passive: false });
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
  });

  // Mở khóa AudioContext khi có tương tác đầu tiên của người dùng
  function unlockAudio() {
    if (window.audioManager) {
      window.audioManager.unlock();
    }
  }

  document.body.addEventListener('click', unlockAudio, { once: true });
  document.body.addEventListener('keydown', unlockAudio, { once: true });
  document.body.addEventListener('touchstart', unlockAudio, { once: true, passive: true });

  // Hiệu ứng cánh hoa bay lãng mạn trên Màn hình chính (Menu Petals Canvas)
  function initMenuPetals() {
    const canvas = document.getElementById('menu-petals-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      canvas.width = canvas.parentElement.clientWidth || 1280;
      canvas.height = canvas.parentElement.clientHeight || 720;
    }
    resize();
    window.addEventListener('resize', resize);

    const petals = [];
    const COUNT = 38;
    const colors = [
      'rgba(220, 38, 38, 0.75)',
      'rgba(185, 28, 28, 0.70)',
      'rgba(239, 68, 68, 0.65)',
      'rgba(244, 63, 94, 0.60)',
      'rgba(159, 18, 57, 0.70)',
      'rgba(251, 113, 133, 0.55)'
    ];

    for (let i = 0; i < COUNT; i++) {
      petals.push({
        x: Math.random() * (canvas.width + 100) - 50,
        y: Math.random() * canvas.height,
        size: 4.5 + Math.random() * 6.5,
        vx: 1.1 + Math.random() * 1.8,
        vy: 0.7 + Math.random() * 1.3,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.035,
        oscillationSpeed: 0.02 + Math.random() * 0.025,
        seed: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let lastTime = performance.now();
    function render(time) {
      lastTime = time;

      const titleScreen = document.getElementById('title-screen');
      if (!titleScreen || titleScreen.classList.contains('hidden')) {
        requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.angle += p.angularSpeed;
        p.x += (p.vx + Math.sin(time * 0.001 * p.oscillationSpeed * 60 + p.seed) * 0.7);
        p.y += p.vy;

        if (p.x > canvas.width + 30) p.x = -30;
        if (p.y > canvas.height + 30) {
          p.y = -30;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.shadowColor = 'rgba(220, 38, 38, 0.45)';
        ctx.shadowBlur = 4;

        // Vẽ cánh hoa mềm mại
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size * 0.75, -p.size * 0.5, p.size * 0.75, p.size * 0.5, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.75, p.size * 0.5, -p.size * 0.75, -p.size * 0.5, 0, -p.size);
        ctx.fill();

        ctx.restore();
      }

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }

  initMenuPetals();

  // Tự tạm dừng khi người chơi chuyển tab / mất focus giữa trận
  const autoPauseOnLeave = () => {
    const g = window.game;
    if (g && g.state === 'PLAYING') g.pauseGame();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) autoPauseOnLeave();
  });
  window.addEventListener('blur', autoPauseOnLeave);

  // Khởi động Canvas Renderer
  window.game.startLoop();
});
