/**
 * VOVINAM: SÁT THẦN GIẢI CỨU HỨA VŨ ĐẠI
 * js/main.js - Game Bootstrapper, Button Event Listeners & Audio Unlocker
 */

window.addEventListener('DOMContentLoaded', () => {
  // 1. Kết Nối Sự Kiện Các Nút Trên Màn Hình Chính Điện Ảnh (Cinematic Menu)
  const openMenu = (fn) => () => { unlockAudio(); fn(); };
  const menu = () => window.menuManager;
  const bind = (id, fn) => {
    const el = document.getElementById(id);
    if (!el || el.__vovClickBound) return;
    el.__vovClickBound = true;
    if (el) el.addEventListener('click', openMenu(fn));
  };

  bind('btn-campaign-hub', () => { if (menu()) menu().showCampaignHub(); });
  bind('btn-char-select', () => { if (menu()) menu().openCharSelect(null); });
  bind('btn-quick-chronicles', () => { if (menu()) menu().showChronicles('docs', { fromCampaignHub: false }); });
  bind('btn-dossier', () => { if (menu()) menu().showDossier(); });
  bind('btn-collection', () => { if (menu()) menu().showCollection(); });
  bind('btn-achievements', () => { if (menu()) menu().showAchievements(); });
  bind('btn-settings', () => { if (menu()) menu().showSettings(); });
  bind('btn-training', () => {
    if (menu()) {
      menu().openCharSelect('training');
    } else if (window.trainingManager) {
      window.trainingManager.startTraining('free', 0, 'nghi');
    }
  });

  // Thẻ tính năng & sự kiện trên màn hình chính
  bind('card-feature-story', () => { if (menu()) menu().showChronicles('docs', { fromCampaignHub: false }); });
  bind('card-feature-event', () => {
    if (window.bossRushManager) window.bossRushManager.showMenu({ fromCampaignHub: false });
  });
  bind('card-feature-map', () => { if (menu()) menu().showChapterMap({ fromCampaignHub: false }); });
  bind('card-feature-battlegrounds', () => {
    if (menu()) {
      menu().openCharSelect('training');
    } else if (window.trainingManager) {
      window.trainingManager.startTraining('free', 0, 'nghi');
    }
  });

  // Modal Trang Bị & Kỹ Năng (Kho Đồ Studio)
  const skillsModal = document.getElementById('skills-equip-modal');
  bind('btn-skills-equip', () => {
    if (menu() && typeof menu().showSkillsEquip === 'function') {
      menu().showSkillsEquip();
    } else if (window.uiCore && skillsModal) {
      window.uiCore.showModal(skillsModal);
    } else if (skillsModal) {
      skillsModal.classList.remove('hidden');
    }
  });
  bind('btn-close-skills-equip', () => {
    if (window.uiCore && skillsModal) window.uiCore.hideModal(skillsModal);
    else if (skillsModal) skillsModal.classList.add('hidden');
  });
  bind('btn-skills-equip-close-x', () => {
    if (window.uiCore && skillsModal) window.uiCore.hideModal(skillsModal);
    else if (skillsModal) skillsModal.classList.add('hidden');
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

  // Nút Thoát trên Top Bar
  bind('btn-top-exit', () => {
    if (exitModal) exitModal.classList.remove('hidden');
  });

  // Các nút điều hướng mới trên Main Menu AAA
  bind('btn-nav-solo', () => { if (menu()) menu().showChapterMap({ fromCampaignHub: false }); });
  bind('btn-nav-arena', () => {
    if (window.trainingManager) {
      window.trainingManager.showModeSelectModal();
    } else if (window.bossRushManager) {
      window.bossRushManager.showMenu({ fromCampaignHub: false });
    }
  });
  bind('card-mini-event', () => {
    if (window.bossRushManager) window.bossRushManager.showMenu({ fromCampaignHub: false });
  });

  // Modal Thông Báo & Cập Nhật v5.22
  const notifModal = document.getElementById('notif-modal');
  bind('btn-top-notif', () => { if (notifModal) notifModal.classList.remove('hidden'); });
  bind('btn-notif-close-x', () => { if (notifModal) notifModal.classList.add('hidden'); });
  bind('btn-notif-confirm', () => { if (notifModal) notifModal.classList.add('hidden'); });
  if (notifModal) {
    notifModal.addEventListener('click', (e) => {
      if (e.target === notifModal) notifModal.classList.add('hidden');
    });
  }

  // Hồ Sơ Người Chơi & Gia Tộc (Tách riêng với Hồ Sơ Nhân Vật)
  bind('btn-top-profile', () => { if (menu()) menu().showPlayerProfile(); });
  bind('menu-player-bar', () => { if (menu()) menu().showPlayerProfile(); });
  bind('btn-top-dossier', () => { if (menu()) menu().showDossier(); });
  bind('btn-top-settings', () => { if (menu()) menu().showSettings(); });

  // Modal Hộp Thư Gia Tộc
  const mailModal = document.getElementById('mail-modal');
  bind('btn-quick-mail', () => { if (mailModal) mailModal.classList.remove('hidden'); });
  bind('btn-mail-close-x', () => { if (mailModal) mailModal.classList.add('hidden'); });
  bind('btn-mail-close', () => { if (mailModal) mailModal.classList.add('hidden'); });
  if (mailModal) {
    mailModal.addEventListener('click', (e) => {
      if (e.target === mailModal) mailModal.classList.add('hidden');
    });
  }
  document.querySelectorAll('.btn-claim-mail').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.textContent = 'ĐÃ NHẬN ✓';
      btn.disabled = true;
      btn.style.opacity = '0.6';
      if (window.uiManager) window.uiManager.showToast('ĐÃ NHẬN THƯỞNG: +500 NỘ KHÍ GIA TỘC!');
    });
  });

  // Modal Nhiệm Vụ & Thành Tích
  const questsModal = document.getElementById('quests-modal');
  bind('btn-quick-quests', () => { if (questsModal) questsModal.classList.remove('hidden'); });
  bind('btn-quests-close-x', () => { if (questsModal) questsModal.classList.add('hidden'); });
  bind('btn-quests-close', () => { if (questsModal) questsModal.classList.add('hidden'); });
  if (questsModal) {
    questsModal.addEventListener('click', (e) => {
      if (e.target === questsModal) questsModal.classList.add('hidden');
    });
  }
  document.querySelectorAll('.btn-claim-quest').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.textContent = 'ĐÃ NHẬN ⭐';
      btn.disabled = true;
      btn.style.opacity = '0.6';
      if (window.uiManager) window.uiManager.showToast('HOÀN THÀNH NHIỆM VỤ GIA TỘC!');
    });
  });

  // Modal Bạn Bè / Đồng Môn Vovinam
  const friendsModal = document.getElementById('friends-modal');
  bind('btn-quick-friends', () => { if (friendsModal) friendsModal.classList.remove('hidden'); });
  bind('btn-friends-close-x', () => { if (friendsModal) friendsModal.classList.add('hidden'); });
  bind('btn-friends-close', () => { if (friendsModal) friendsModal.classList.add('hidden'); });
  if (friendsModal) {
    friendsModal.addEventListener('click', (e) => {
      if (e.target === friendsModal) friendsModal.classList.add('hidden');
    });
  }

  // Bảng Xếp Hạng
  bind('btn-quick-ranking', () => { if (menu()) menu().showAchievements(); });

  // News items tương tác
  bind('news-row-1', () => { if (menu()) menu().showChapterMap(); });
  bind('news-row-2', () => { if (menu()) menu().openCharSelect(); });
  bind('news-row-3', () => { if (mailModal) mailModal.classList.remove('hidden'); });

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
      if (window.menuManager && typeof window.menuManager.openCharSelect === 'function') {
        window.menuManager.openCharSelect(1);
      } else if (window.game) {
        window.game.startStage(1);
      }
    });
  }
  const btnEndingCloseX = document.getElementById('btn-ending-close-x');
  if (btnEndingCloseX) {
    btnEndingCloseX.addEventListener('click', () => {
      unlockAudio();
      window.uiManager.hideEnding();
      if (window.game) window.game.state = 'MENU';
      if (window.uiManager) window.uiManager.showTitleScreen();
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
  window._touchControlsMode = 'auto';
  if (btnTouchToggle) {
    btnTouchToggle.addEventListener('click', () => {
      unlockAudio();
      const tc = document.getElementById('touch-controls');
      if (tc) {
        const nextOff = (window._touchControlsMode === 'force-on') || (window._touchControlsMode === 'auto' && !tc.classList.contains('hidden'));
        window._touchControlsMode = nextOff ? 'force-off' : 'force-on';
        if (typeof window.syncTouchControlsVisibility === 'function') {
          window.syncTouchControlsVisibility();
        } else {
          tc.classList.toggle('hidden', nextOff);
        }
        if (window.uiManager) {
          window.uiManager.showToast(nextOff ? 'ĐÃ ẨN PHÍM CẢM ỨNG' : 'ĐÃ BẬT PHÍM CẢM ỨNG (MOBILE)');
        }
      }
    });
  }

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
      if (window.onlineManager && window.onlineManager.isActive) {
        if (window.uiManager) window.uiManager.hidePause();
        window.onlineManager.requestRematch();
        return;
      }
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
      if (window.onlineManager && window.onlineManager.isActive) {
        window.onlineManager.leaveMatch(false);
        return;
      }
      if (window.game && typeof window.game.returnToMenu === 'function') {
        window.game.returnToMenu();
      } else {
        window.uiManager.hidePause();
        window.uiManager.showTitleScreen();
        window.game.state = 'MENU';
        if (window.audioManager) {
          if (typeof window.audioManager.startMenuBGM === 'function') window.audioManager.startMenuBGM();
          else window.audioManager.stopBGM();
        }
      }
    });
  }

  // 3. Nút Chiến Thắng Màn Chơi (Stage Clear)
  const btnNextStage = document.getElementById('btn-next-stage');
  if (btnNextStage) {
    btnNextStage.addEventListener('click', () => {
      unlockAudio();
      if (window.onlineManager && window.onlineManager.isActive) {
        window.uiManager.hideStageClear();
        window.onlineManager.leaveMatch(true);
        return;
      }
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
      if (window.onlineManager && window.onlineManager.isActive) {
        window.onlineManager.requestRematch();
        return;
      }
      if (window.menuManager) {
        window.menuManager.openCharSelect(window.stageManager.currentStageIndex);
      } else {
        window.game.startStage(window.stageManager.currentStageIndex);
      }
    });
  }

  const btnVictoryMenu = document.getElementById('btn-victory-menu');
  if (btnVictoryMenu) {
    btnVictoryMenu.addEventListener('click', () => {
      unlockAudio();
      if (window.uiManager) window.uiManager.hideStageClear();
      if (window.onlineManager && window.onlineManager.isActive) {
        window.onlineManager.leaveMatch(false);
        return;
      }
      if (window.game && typeof window.game.returnToMenu === 'function') {
        window.game.returnToMenu();
      } else {
        if (window.game) window.game.state = 'MENU';
        if (window.uiManager) window.uiManager.showTitleScreen();
      }
      if (window.menuManager && typeof window.menuManager.updateMenuPlayerBar === 'function') {
        window.menuManager.updateMenuPlayerBar();
      }
    });
  }

  // 4. Nút Thất Bại (Game Over)
  const btnRetry = document.getElementById('btn-retry');
  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      unlockAudio();
      if (window.onlineManager && window.onlineManager.isActive) {
        window.onlineManager.requestRematch();
        return;
      }
      if (window.game && window.game.isBossRush && window.bossRushManager && window.bossRushManager.activeChallenge) {
        const chal = window.bossRushManager.activeChallenge;
        window.bossRushManager.launchBossDuel(chal.bossDef, chal.modifierId);
      } else {
        window.game.startStage(window.stageManager.currentStageIndex);
      }
    });
  }

  const btnGameOverMenu = document.getElementById('btn-gameover-menu');
  if (btnGameOverMenu) {
    btnGameOverMenu.addEventListener('click', () => {
      unlockAudio();
      if (window.onlineManager && window.onlineManager.isActive) {
        window.onlineManager.leaveMatch(false);
        return;
      }
      if (window.game) {
        if (window.game.isBossRush) {
          window.game.isBossRush = false;
          if (window.bossRushManager) window.bossRushManager.activeChallenge = null;
        }
        window.game.state = 'MENU';
      }
      window.uiManager.hideGameOver();
      window.uiManager.showTitleScreen();
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
      if (window.game.state === 'PAUSED' || window.game._onlinePauseOpen) {
        window.game.resumeGame();
      } else if (window.game.state === 'PLAYING' || window.game.state === 'TRAINING' || window.game.state === 'TUTORIAL') {
        window.game.pauseGame();
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
    const activeEl = e.target || document.activeElement;
    if (activeEl) {
      const tag = String(activeEl.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || activeEl.isContentEditable) {
        if (e.code === 'Escape' && typeof activeEl.blur === 'function') {
          activeEl.blur();
        }
        return;
      }
    }

    const loginGate = document.getElementById('login-gate-overlay');
    if (loginGate && loginGate.classList && !loginGate.classList.contains('hidden')) {
      return;
    }

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

      // Ưu tiên 4: Màn chọn nhân vật cần trả về đúng ngữ cảnh (kết quả màn / chương hồi / chiến dịch / menu)
      const charSelectModal = document.getElementById('char-select-modal');
      if (charSelectModal && !charSelectModal.classList.contains('hidden')) {
        if (window.menuManager) window.menuManager.closeCharSelect();
        return;
      }

      // Ưu tiên 4.1: Hộp thoại xác nhận Hành Trình Mới -> Chỉ đóng hộp thoại, giữ nguyên menu Chiến Dịch
      const newgameModal = document.getElementById('newgame-confirm-modal');
      if (newgameModal && !newgameModal.classList.contains('hidden')) {
        newgameModal.classList.add('hidden');
        return;
      }

      // Ưu tiên 4.2: Bản đồ Chương Hồi -> Trả về menu Chiến Dịch (nếu mở từ đó) hoặc màn hình chính
      const chapterMapModal = document.getElementById('chapter-map-modal');
      if (chapterMapModal && !chapterMapModal.classList.contains('hidden')) {
        if (window.menuManager && typeof window.menuManager.closeChapterMap === 'function') {
          window.menuManager.closeChapterMap();
        } else if (window.menuManager) {
          window.menuManager.hideAll();
        }
        return;
      }

      // Ưu tiên 4.3: Liên Đấu Trùm (Boss Rush) -> Trả về menu Chiến Dịch (nếu mở từ đó) hoặc màn hình chính
      const bossRushModal = document.getElementById('boss-rush-modal');
      if (bossRushModal && !bossRushModal.classList.contains('hidden')) {
        if (window.bossRushManager && typeof window.bossRushManager.closeMenu === 'function') {
          window.bossRushManager.closeMenu();
        } else if (window.bossRushManager) {
          window.bossRushManager.hideMenu();
        }
        return;
      }

      // Ưu tiên 4.4: Menu Chiến Dịch -> Đóng về màn hình chính
      const campaignModal = document.getElementById('campaign-modal');
      if (campaignModal && !campaignModal.classList.contains('hidden')) {
        if (window.menuManager && typeof window.menuManager.hideCampaignHub === 'function') {
          window.menuManager.hideCampaignHub();
        }
        return;
      }

      // Ưu tiên 5: Nếu modal Tài khoản hoặc Đấu Online hoặc modal menu nào khác đang mở -> Đóng an toàn
      const accountModal = document.getElementById('account-modal');
      if (accountModal && !accountModal.classList.contains('hidden')) {
        if (window.accountManager && typeof window.accountManager.closeModal === 'function') {
          window.accountManager.closeModal();
        } else {
          accountModal.classList.add('hidden');
        }
        return;
      }

      const onlineModal = document.getElementById('online-modal');
      if (onlineModal && !onlineModal.classList.contains('hidden')) {
        if (window.onlineManager && typeof window.onlineManager.closeModal === 'function') {
          window.onlineManager.closeModal();
        } else {
          onlineModal.classList.add('hidden');
        }
        return;
      }

      const otherModalIds = [
        'player-profile-modal', 'dossier-modal',
        'collection-modal', 'achievements-modal', 'settings-modal', 'credits-modal',
        'account-modal', 'online-modal'
      ];
      const anyOtherOpen = otherModalIds.some(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains('hidden');
      });
      if (anyOtherOpen) {
        if (window.menuManager) window.menuManager.hideAll();
        return;
      }

      // Ưu tiên 6: Bật / Tắt Tạm Dừng trận đánh / đấu luyện / hướng dẫn
      if (window.game) {
        const pauseModalEl = document.getElementById('pause-modal');
        const pauseModalShown = !!(pauseModalEl && !pauseModalEl.classList.contains('hidden'));
        if (window.game.state === 'PAUSED' || window.game._onlinePauseOpen || pauseModalShown) {
          window.game.resumeGame();
        } else if (window.game.state === 'PLAYING' || window.game.state === 'TRAINING' || window.game.state === 'TUTORIAL') {
          window.game.pauseGame();
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

  // 9. Khởi tạo phím ảo cảm ứng (Virtual Touch Controls cho Mobile & Tablet — CHỈ hiện trong trận chiến, tự ẩn ở Login/Menu/Modal)
  const touchContainer = document.getElementById('touch-controls');
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  let hasTouchInteraction = isTouchDevice;

  const ACTIVE_COMBAT_STATES = new Set(['PLAYING', 'TRAINING', 'TUTORIAL', 'BOSS_RUSH', 'ONLINE', 'CONFRONTATION']);
  const BLOCKING_OVERLAY_IDS = [
    'login-gate-overlay', 'title-screen', 'char-select-screen', 'ally-select-screen',
    'campaign-hub', 'shop-modal', 'settings-modal', 'pause-modal', 'controls-modal',
    'online-lobby-modal', 'ranking-modal', 'dossier-modal', 'account-modal',
    'victory-screen', 'gameover-screen', 'ending-screen'
  ];

  function syncTouchControlsVisibility() {
    if (!touchContainer) return;
    if (window._touchControlsMode === 'force-off') {
      touchContainer.classList.add('hidden');
      return;
    }
    const gState = window.game && window.game.state;
    const inCombat = ACTIVE_COMBAT_STATES.has(gState);
    let hasBlockingOverlay = false;
    for (let i = 0; i < BLOCKING_OVERLAY_IDS.length; i++) {
      const el = document.getElementById(BLOCKING_OVERLAY_IDS[i]);
      if (el && !el.classList.contains('hidden')) {
        hasBlockingOverlay = true;
        break;
      }
    }
    const trainingOv = document.querySelector('.training-overlay');
    if (trainingOv && !trainingOv.classList.contains('hidden') && !trainingOv.classList.contains('collapsed')) {
      hasBlockingOverlay = true;
    }
    const shouldShow = inCombat && !hasBlockingOverlay && (window._touchControlsMode === 'force-on' || hasTouchInteraction);
    touchContainer.classList.toggle('hidden', !shouldShow);
  }
  window.syncTouchControlsVisibility = syncTouchControlsVisibility;
  syncTouchControlsVisibility();
  setInterval(syncTouchControlsVisibility, 220);

  window.addEventListener('touchstart', () => {
    hasTouchInteraction = true;
    syncTouchControlsVisibility();
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

    let rafActive = false;
    let petalTimer = 0;

    function canAnimatePetals() {
      if (typeof document !== 'undefined' && document.hidden) return false;
      const titleScreen = document.getElementById('title-screen');
      if (!titleScreen || titleScreen.classList.contains('hidden')) return false;
      if (window.uiCore && typeof window.uiCore.isMainMenuActive === 'function') {
        return window.uiCore.isMainMenuActive();
      }
      return true;
    }

    function drawPetals(stepDt, elapsedSec) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.angle += p.angularSpeed * stepDt;
        p.x += (p.vx + Math.sin(elapsedSec * p.oscillationSpeed * 60 + p.seed) * 0.7) * stepDt;
        p.y += p.vy * stepDt;

        if (p.x > canvas.width + 30) p.x = -30;
        if (p.y > canvas.height + 30) {
          p.y = -30;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;

        // Vẽ cánh hoa mềm mại (bỏ shadowBlur thời gian thực để tối ưu GPU/CPU menu)
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size * 0.75, -p.size * 0.5, p.size * 0.75, p.size * 0.5, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.75, p.size * 0.5, -p.size * 0.75, -p.size * 0.5, 0, -p.size);
        ctx.fill();

        ctx.restore();
      }
    }

    let lastTime = performance.now();
    function render(time) {
      if (!canAnimatePetals()) {
        rafActive = false;
        return;
      }

      const elapsedMs = time - lastTime;
      lastTime = time;
      petalTimer += Math.min(0.05, Math.max(0.004, elapsedMs / 1000));
      const stepDt = Math.min(2.5, Math.max(0.4, elapsedMs / 16.67));

      drawPetals(stepDt, petalTimer);

      if (window.uiCore && window.uiCore.prefersReducedMotion()) {
        rafActive = false;
        return;
      }

      requestAnimationFrame(render);
    }

    function startPetals() {
      if (!canAnimatePetals()) {
        rafActive = false;
        return;
      }
      if (window.uiCore && window.uiCore.prefersReducedMotion()) {
        drawPetals(0, petalTimer);
        rafActive = false;
        return;
      }
      if (rafActive) return;
      rafActive = true;
      lastTime = performance.now();
      requestAnimationFrame(render);
    }

    if (window.uiCore && typeof window.uiCore.onOverlayChange === 'function') {
      window.uiCore.onOverlayChange(startPetals);
    }
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', startPetals);
    }

    startPetals();
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

  // Khởi động Canvas Renderer & Nạp trước tài nguyên nhân vật ở nền rảnh
  window.game.startLoop();
  if (window.uiCore && typeof window.uiCore.warmCharacterAssets === 'function') {
    window.uiCore.warmCharacterAssets();
  }
});
