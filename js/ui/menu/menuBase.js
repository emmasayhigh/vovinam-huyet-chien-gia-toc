/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/menu/menuBase.js - Phan nen cua MenuManager.
 *
 * Chua constructor (cache DOM), wire() (gan su kien) va cac man hinh cap cao
 * nhu Campaign Hub. Cac nhom man hinh khac ke thua tiep trong cung thu muc.
 */

class MenuManagerBase {
  constructor() {
    this.selectedChar = (window.saveManager && window.saveManager.data.selectedCharacter) || 'nghi';
    this.dossierChar = 'nghi';

    // DOM
    this.charModal = document.getElementById('char-select-modal');
    this.mapModal = document.getElementById('chapter-map-modal');
    this.dossierModal = document.getElementById('dossier-modal');
    this.collectionModal = document.getElementById('collection-modal');
    this.achModal = document.getElementById('achievements-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.chroniclesModal = document.getElementById('chronicles-modal');
    this.custodyModal = document.getElementById('custody-modal');
    this.deployModal = document.getElementById('deployment-modal');
    this.campaignModal = document.getElementById('campaign-modal');
    this.newgameModal = document.getElementById('newgame-confirm-modal');

    this.charGrid = document.getElementById('char-grid');
    this.skinGrid = document.getElementById('skin-grid');
    this.charPortrait = document.getElementById('char-portrait');
    this.activeCsTab = 'heroes';
    this._csStageDemoState = null;
    this._csStageDemoTimer = 0;
    this._csStageDemoIdx = 0;
    this.chapterList = document.getElementById('chapter-list');
    this.dossierList = document.getElementById('dossier-list');
    this.collectionBody = document.getElementById('collection-body');
    this.achList = document.getElementById('ach-list');
    this.dossierBody = document.getElementById('dossier-body');

    this.deployStageTitle = document.getElementById('deploy-stage-title');
    this.deployStageDesc = document.getElementById('deploy-stage-desc');
    this.deployCharGrid = document.getElementById('deploy-char-grid');
    this.deployAllyGrid = document.getElementById('deploy-ally-grid');
    this.deploymentTargetStage = 1;

    // Quản lý tab & lọc tài liệu trong Biên Niên Sử
    this.activeChronTab = 'docs';
    this.activeChronFilter = 'all';
    this.selectedDocId = 'DOC_PHOTO_FAMILY';

    // Trạng thái tạm dừng khi mở modal điều tra / biên niên sử lúc đang chơi
    this._custodyWasPlaying = false;
    this._custodyOnDone = null;
    this._chroniclesWasPlaying = false;

    this.wire();
    this.refreshCharSelect();
  }

  // --------------------------------------------------------------------------
  // NÚT BẤM TRONG CÁC MÀN HÌNH MENU
  // --------------------------------------------------------------------------
  wire() {
    const on = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => { this.click(); fn(); });
    };

    // Campaign Hub (Chiến Dịch Cốt Truyện)
    on('btn-campaign-hub', () => this.showCampaignHub());
    on('btn-campaign-close', () => this.hideCampaignHub());
    on('btn-campaign-close-x', () => this.hideCampaignHub());
    on('btn-campaign-continue', () => {
      this.hideAll();
      const stage = (window.saveManager && window.saveManager.data.currentStage) || 1;
      if (window.uiManager) window.uiManager.hideTitleScreen();
      if (window.game) window.game.startStage(stage);
    });
    on('btn-campaign-newgame', () => {
      if (this.newgameModal) this.newgameModal.classList.remove('hidden');
    });
    on('btn-newgame-cancel', () => {
      if (this.newgameModal) this.newgameModal.classList.add('hidden');
    });
    on('btn-newgame-confirm', () => {
      if (window.saveManager) {
        window.saveManager.data.currentStage = 1;
        window.saveManager.persist();
      }
      this.hideAll();
      if (window.tutorialManager && window.tutorialManager.isTutorialNeeded()) {
        window.tutorialManager.showInviteModal(
          () => {
            if (window.uiManager) window.uiManager.hideTitleScreen();
            window.tutorialManager.startTutorial();
          },
          () => {
            if (window.saveManager) window.saveManager.skipTutorial();
            if (window.uiManager) window.uiManager.hideTitleScreen();
            if (window.game) window.game.startStage(1);
          }
        );
      } else {
        if (window.uiManager) window.uiManager.hideTitleScreen();
        if (window.game) window.game.startStage(1);
      }
    });
    on('btn-campaign-chapters', () => {
      this.hideCampaignHub();
      this.showChapterMap();
    });

    on('btn-char-close', () => this.hideAll());
    on('btn-char-close-x', () => this.hideAll());
    on('btn-char-start', () => this.startSelected());
    on('btn-char-prev', () => this.cycleChar(-1));
    on('btn-char-next', () => this.cycleChar(1));
    on('btn-map-close', () => this.hideAll());
    on('btn-map-close-x', () => this.hideAll());
    on('btn-dossier-close', () => this.hideAll());
    on('btn-dossier-close-x', () => this.hideAll());
    on('btn-collection-close', () => this.hideAll());
    on('btn-collection-close-x', () => this.hideAll());
    on('btn-ach-close', () => this.hideAll());
    on('btn-ach-close-x', () => this.hideAll());
    on('btn-achievements', () => this.showAchievements());
    on('btn-pause-achievements', () => {
      if (window.uiManager) window.uiManager.hidePause();
      this.showAchievements();
    });

    on('btn-open-keybindings', () => this.showKeybindings());
    on('btn-open-keybindings-from-controls', () => this.showKeybindings());
    on('btn-pause-keybindings', () => {
      if (window.uiManager) window.uiManager.hidePause();
      this.showKeybindings();
    });
    on('btn-keybindings-close-x', () => this.hideKeybindings());
    on('btn-close-keybindings', () => this.hideKeybindings());
    on('btn-reset-keybindings', () => {
      if (window.input) {
        window.input.resetDefaultBindings();
        this.showKeybindings();
      }
    });

    on('btn-settings-close', () => this.hideAll());
    on('btn-settings-close-x', () => this.hideAll());
    on('btn-ending-close-x', () => this.hideAll());
    on('btn-chronicles-close', () => this.closeChronicles());
    on('btn-chronicles-close-x', () => this.closeChronicles());

    on('btn-chronicles', () => this.showChronicles());
    on('btn-quick-chronicles', () => this.showChronicles());
    on('btn-pause-chronicles', () => {
      this.closeChronicles();
      this.showChronicles();
    });

    // Mới: Nút Luyện võ, Tái đấu Boss, Bảng suy luận, Chơi lại hướng dẫn
    on('btn-training', () => {
      if (window.trainingManager) {
        window.trainingManager.showModeSelectModal();
      } else {
        this.hideAll();
        if (window.uiManager) window.uiManager.hideTitleScreen();
      }
    });
    on('btn-boss-rush', () => {
      if (window.bossRushManager) window.bossRushManager.showMenu();
    });
    on('btn-deduction', () => {
      if (window.deductionManager) window.deductionManager.showBoard();
    });
    on('btn-pause-deduction', () => {
      if (window.uiManager) window.uiManager.hidePause();
      if (window.deductionManager) window.deductionManager.showBoard();
    });
    on('btn-replay-tutorial', () => {
      this.hideAll();
      if (window.uiManager) window.uiManager.hideTitleScreen();
      if (window.tutorialManager) window.tutorialManager.startTutorial();
    });

    on('btn-custody-cancel', () => this.closeCustodyModal());
    on('btn-custody-close-x', () => this.closeCustodyModal());

    on('btn-deploy-cancel', () => this.hideAll());
    on('btn-deploy-close-x', () => this.hideAll());
    on('btn-deploy-start', () => this.confirmDeployment());

    on('btn-deploy-skin-default', () => this.setDeploymentSkin('default'));
    on('btn-deploy-skin-vovinam', () => this.setDeploymentSkin('vovinam'));

    on('btn-cs-skin-default', () => this.setWardrobeSkin('default'));
    on('btn-cs-skin-vovinam', () => this.setWardrobeSkin('vovinam'));
    on('btn-cs-tab-heroes', () => this.switchCsTab('heroes'));
    on('btn-cs-tab-skins', () => this.switchCsTab('skins'));
    on('btn-cs-demo-move', () => this.triggerCsStageDemo());
    on('btn-cs-view-toggle', () => this.toggleCsStageView());

    // Đóng khi click ra ngoài backdrop modal (chống kẹt giao diện)
    [this.charModal, this.mapModal, this.dossierModal, this.collectionModal, this.achModal, this.settingsModal, this.deployModal, this.campaignModal, this.newgameModal].forEach((m) => {
      if (m) {
        m.addEventListener('click', (e) => {
          if (e.target === m) this.hideAll();
        });
      }
    });
    if (this.custodyModal) {
      this.custodyModal.addEventListener('click', (e) => {
        if (e.target === this.custodyModal) this.closeCustodyModal();
      });
    }
    if (this.chroniclesModal) {
      this.chroniclesModal.addEventListener('click', (e) => {
        if (e.target === this.chroniclesModal) this.closeChronicles();
      });
    }

    on('btn-launch-flashback', () => {
      this.hideAll();
      if (window.flashbackMission) {
        window.flashbackMission.startMission();
      }
    });

    // Chuyển Tab trong Biên Niên Sử Họ Phó
    const chronTabs = document.querySelectorAll('.chron-tab-btn');
    chronTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        this.click();
        const tab = btn.getAttribute('data-tab');
        this.switchChroniclesTab(tab);
      });
    });

    // Bộ lọc loại tài liệu trong Biên Niên Sử
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.click();
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeChronFilter = chip.getAttribute('data-filter') || 'all';
        this.renderChroniclesDocs();
      });
    });

    on('btn-reset-progress', () => {
      if (window.saveManager) {
        window.saveManager.resetProgress();
        this.selectedChar = 'nghi';
        this.refreshCharSelect();
        this.showToast('ĐÃ XÓA TIẾN TRÌNH (giữ nguyên cài đặt âm thanh)');
      }
    });

    // Âm lượng
    const music = document.getElementById('setting-music');
    const sfx = document.getElementById('setting-sfx');
    const mute = document.getElementById('setting-mute');
    const st = window.saveManager ? window.saveManager.data.settings : null;
    if (music) {
      if (st) music.value = Math.round((st.musicVolume ?? 0.45) * 100);
      music.addEventListener('input', () => {
        if (window.audioManager) window.audioManager.setMusicVolume(Number(music.value) / 100);
      });
    }
    if (sfx) {
      if (st) sfx.value = Math.round((st.sfxVolume ?? 0.85) * 100);
      sfx.addEventListener('input', () => {
        if (window.audioManager) window.audioManager.setSfxVolume(Number(sfx.value) / 100);
      });
    }
    if (mute) {
      if (st) mute.checked = !!st.muted;
      mute.addEventListener('change', () => {
        if (window.audioManager && window.audioManager.isMuted !== mute.checked) {
          window.audioManager.toggleMute();
          if (window.uiManager) window.uiManager.updateAudioButton(mute.checked);
        }
      });
    }

    // Tùy chọn tiếp cận (Accessibility: giảm rung màn hình, giảm chớp flash)
    const reduceShake = document.getElementById('setting-reduce-shake');
    const reduceFlash = document.getElementById('setting-reduce-flash');
    if (reduceShake) {
      if (window.fxSettings) reduceShake.checked = !!window.fxSettings.reduceShake;
      reduceShake.addEventListener('change', () => {
        if (window.fxSettings) {
          window.fxSettings.reduceShake = reduceShake.checked;
          window.fxSettings.save();
        }
      });
    }
    if (reduceFlash) {
      if (window.fxSettings) reduceFlash.checked = !!window.fxSettings.reduceFlash;
      reduceFlash.addEventListener('change', () => {
        if (window.fxSettings) {
          window.fxSettings.reduceFlash = reduceFlash.checked;
          window.fxSettings.save();
        }
      });
    }
    const hideDmg = document.getElementById('setting-hide-dmg');
    if (hideDmg) {
      if (window.fxSettings) hideDmg.checked = !!window.fxSettings.hideDamageNumbers;
      hideDmg.addEventListener('change', () => {
        if (window.fxSettings) {
          window.fxSettings.hideDamageNumbers = hideDmg.checked;
          window.fxSettings.save();
        }
      });
    }
  }

  click() { if (window.audioManager) window.audioManager.playClick(); }

  showToast(msg) { if (window.uiManager) window.uiManager.showToast(msg); }

  hideAll() {
    const creditsModal = document.getElementById('credits-modal');
    const keybindingsModal = document.getElementById('keybindings-modal');
    [this.charModal, this.mapModal, this.dossierModal, this.collectionModal, this.achModal, this.settingsModal, this.chroniclesModal, this.custodyModal, this.deployModal, this.campaignModal, this.newgameModal, creditsModal, keybindingsModal]
      .forEach((m) => { if (m) m.classList.add('hidden'); });
    if (window.uiManager) window.uiManager.hideStageSelect();
    if (window.deductionManager) window.deductionManager.hideBoard();
    if (window.bossRushManager) window.bossRushManager.hideMenu();

    if (window.uiManager && window.uiManager._returnToPauseOnCloseSettings) {
      window.uiManager._returnToPauseOnCloseSettings = false;
      window.uiManager.showPause();
    } else if (window.game && window.game.state === 'MENU' && window.uiManager) {
      window.uiManager.hideHUD();
      const topControls = document.getElementById('top-controls');
      if (topControls) topControls.classList.add('hidden');
    }

    // Hồi phục game loop nếu trước đó bị tạm dừng do mở modal điều tra / biên niên sử
    if (this._custodyWasPlaying && window.game && window.game.state === 'PAUSED') {
      window.game.state = 'PLAYING';
      this._custodyWasPlaying = false;
    }
    if (this._chroniclesWasPlaying && window.game && window.game.state === 'PAUSED') {
      window.game.state = 'PLAYING';
      this._chroniclesWasPlaying = false;
    }
    if (window.input && typeof window.input.clearAll === 'function') {
      window.input.clearAll();
    }
  }

  showCampaignHub() {
    this.hideAll();
    const curStage = (window.saveManager && window.saveManager.data.currentStage) || 1;
    const stageMeta = (window.STORY_META && window.STORY_META.stages) ? window.STORY_META.stages[curStage] : null;
    const curNameEl = document.getElementById('campaign-cur-stage-name');
    const curDescEl = document.getElementById('campaign-cur-stage-desc');

    if (curNameEl) {
      curNameEl.textContent = stageMeta ? stageMeta.title : `MÀN ${curStage}: KHU VỰC CHIẾN ĐẤU`;
    }
    if (curDescEl) {
      curDescEl.textContent = stageMeta ? (stageMeta.subtitle || stageMeta.objective) : 'Tiếp tục hành trình điều tra đại án gia tộc và giải cứu Hứa Vũ Đại.';
    }

    if (this.campaignModal) {
      this.campaignModal.classList.remove('hidden');
    }
  }

  hideCampaignHub() {
    if (this.campaignModal) this.campaignModal.classList.add('hidden');
    if (this.newgameModal) this.newgameModal.classList.add('hidden');
    if (window.game && window.game.state === 'MENU' && window.uiManager) {
      window.uiManager.showTitleScreen();
    }
  }
}

window.MenuManagerBase = MenuManagerBase;
