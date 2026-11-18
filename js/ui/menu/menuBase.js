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
    this.playerProfileModal = document.getElementById('player-profile-modal');
    this.playerProfileBody = document.getElementById('player-profile-body');
    this.shopModal = document.getElementById('shop-modal');
    this.shopItemsGrid = document.getElementById('shop-items-grid');
    this.collectionModal = document.getElementById('collection-modal');
    this.achModal = document.getElementById('achievements-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.chroniclesModal = document.getElementById('chronicles-modal');
    this.custodyModal = document.getElementById('custody-modal');
    this.deployModal = document.getElementById('deployment-modal');
    this.campaignModal = document.getElementById('campaign-modal');
    this.allyModal = document.getElementById('ally-select-modal');
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
    if (typeof this.refreshCharSelect === 'function') this.refreshCharSelect();
    this.updateMenuPlayerBar();
  }

  // Tính toán Cấp Độ (Level), Kinh Nghiệm (EXP) và Danh Hiệu Võ Đạo từ tiến trình người chơi
  computePlayerProfileProgress() {
    const sm = window.saveManager;
    const d = (sm && sm.data) ? sm.data : {};
    const stats = d.stats || {};
    const completedStages = Array.isArray(d.completedStages) ? d.completedStages : [];
    const bossesDefeated = Array.isArray(d.bossesDefeated) ? d.bossesDefeated : [];
    const achievements = Array.isArray(d.achievements) ? d.achievements : [];
    const endings = Array.isArray(d.endings) ? d.endings : [];
    const evidenceFound = Array.isArray(d.evidenceFound) ? d.evidenceFound : [];
    const unlockedChars = Array.isArray(d.unlockedCharacters) ? d.unlockedCharacters : ['nghi'];

    const totalExp =
      (completedStages.length * 180) +
      (bossesDefeated.length * 150) +
      (achievements.length * 100) +
      (endings.length * 350) +
      (evidenceFound.length * 60) +
      ((Number(stats.stagesCleared) || 0) * 50) +
      ((Number(stats.bestCombo) || 0) * 12) +
      ((Number(stats.perfectDodges) || 0) * 15) +
      Math.floor((Number(stats.totalHits) || 0) * 1.5);

    const expPerLevel = 450;
    const level = Math.max(1, Math.min(50, 1 + Math.floor(totalExp / expPerLevel)));
    const currentLevelExp = totalExp % expPerLevel;
    const expPercent = level >= 50 ? 100 : Math.max(8, Math.min(100, Math.round((currentLevelExp / expPerLevel) * 100)));

    const rankTitles = [
      { minLv: 25, title: 'SÁT THẦN VIỆT VÕ ĐẠO', badge: '👑 TÔNG SƯ TỐI THƯỢNG', color: '#facc15' },
      { minLv: 16, title: 'ĐẠI SƯ HỌ PHÓ', badge: '🐉 CHƯỞNG MÔN HỘ PHÁP', color: '#f59e0b' },
      { minLv: 10, title: 'HỒNG ĐAI DANH SƯ', badge: '🔥 CAO THỦ ĐỈNH PHONG', color: '#ef4444' },
      { minLv: 5,  title: 'HOÀNG ĐAI KIỆN TƯỚNG', badge: '⚡ VÕ SĨ TINH NHUỆ', color: '#38bdf8' },
      { minLv: 1,  title: 'LAM ĐAI MÔN SINH', badge: '🥋 TÂN THỦ VOVINAM', color: '#60a5fa' }
    ];
    const rankObj = rankTitles.find(r => level >= r.minLv) || rankTitles[rankTitles.length - 1];

    return {
      level,
      totalExp,
      currentLevelExp,
      expPerLevel,
      expPercent,
      rankTitle: rankObj.title,
      rankBadge: rankObj.badge,
      rankColor: rankObj.color,
      completedStagesCount: completedStages.length,
      bossesDefeatedCount: bossesDefeated.length,
      achievementsCount: achievements.length,
      endingsCount: endings.length,
      evidenceCount: evidenceFound.length,
      unlockedCharsCount: unlockedChars.length,
      bestCombo: Number(stats.bestCombo) || 0,
      totalHits: Number(stats.totalHits) || 0,
      perfectDodges: Number(stats.perfectDodges) || 0,
      stagesCleared: Math.max(completedStages.length, Number(stats.stagesCleared) || 0)
    };
  }

  // Đồng bộ ảnh đại diện, cấp độ và thanh EXP ở thanh Menu Profile góc dưới trái
  updateMenuPlayerBar() {
    const curCharId = (window.saveManager && window.saveManager.data && window.saveManager.data.selectedCharacter) || this.selectedChar || 'nghi';
    const slot = (window.CHAR_SLOTS && window.CHAR_SLOTS.find(s => s.id === curCharId)) || (window.CHAR_SLOTS && window.CHAR_SLOTS[0]);
    if (!slot) return;
    
    const eqSkin = (window.saveManager && typeof window.saveManager.getEquippedSkin === 'function')
      ? window.saveManager.getEquippedSkin(slot.id)
      : ((window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(slot.id, 'vovinam')) ? 'vovinam' : 'default');
    const imgSrc = typeof this.resolveHeroSkinImage === 'function'
      ? this.resolveHeroSkinImage(slot, eqSkin)
      : ((eqSkin === 'vovinam' && slot.vovinamImage) ? slot.vovinamImage : (slot.image || 'assets/images/characters/char_hero_nghi.png'));
    const prog = this.computePlayerProfileProgress();
    
    if (typeof document !== 'undefined' && typeof document.querySelector === 'function') {
      const avatarImg = document.querySelector('.player-avatar-img');
      if (avatarImg) {
        avatarImg.src = imgSrc;
        avatarImg.alt = slot.fullName || slot.slotName;
      }
      const clanLevelEl = document.querySelector('.player-clan-level');
      if (clanLevelEl) {
        clanLevelEl.textContent = `Lv. ${prog.level}`;
      }
      const expFillEl = document.querySelector('.player-exp-bar-fill');
      if (expFillEl) {
        expFillEl.style.width = `${prog.expPercent}%`;
      }
    }
    this.updateCurrencyUI();
  }

  // Đồng bộ số dư Vàng (🪙) và Kim Cương (💎) trên Top Bar & Cửa Hàng
  updateCurrencyUI() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    const sm = window.saveManager;
    const gold = (sm && typeof sm.getGold === 'function') ? sm.getGold() : ((sm && sm.data && sm.data.gold) || 0);
    const diamonds = (sm && typeof sm.getDiamonds === 'function') ? sm.getDiamonds() : ((sm && sm.data && sm.data.diamonds) || 0);

    const topGoldEl = document.getElementById('top-gold-val');
    if (topGoldEl) topGoldEl.textContent = Number(gold).toLocaleString();
    const topDiaEl = document.getElementById('top-diamond-val');
    if (topDiaEl) topDiaEl.textContent = Number(diamonds).toLocaleString();

    const shopGoldEl = document.getElementById('shop-gold-balance');
    if (shopGoldEl) shopGoldEl.textContent = Number(gold).toLocaleString();
    const shopDiaEl = document.getElementById('shop-diamond-balance');
    if (shopDiaEl) shopDiaEl.textContent = Number(diamonds).toLocaleString();
  }

  // --------------------------------------------------------------------------
  // NÚT BẤM TRONG CÁC MÀN HÌNH MENU
  // --------------------------------------------------------------------------
  wire() {
    const on = (id, fn) => {
      const el = document.getElementById(id);
      if (!el || el.__vovClickBound) return;
      el.__vovClickBound = true;
      if (el) el.addEventListener('click', (e) => { this.click(); fn(e); });
    };

    // Campaign Hub (Chiến Dịch Cốt Truyện)
    on('btn-campaign-hub', () => this.showCampaignHub());
    on('btn-campaign-close', () => this.hideCampaignHub());
    on('btn-campaign-close-x', () => this.hideCampaignHub());
    const startCampaignStage = (stageNum) => {
      this._returnToCampaignHub = false;
      this._charSelectReturnTarget = null;
      this.hideAll();
      const s = Number(stageNum) || 1;
      if (s === 1 && window.tutorialManager && typeof window.tutorialManager.isTutorialNeeded === 'function' && window.tutorialManager.isTutorialNeeded()) {
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
        return;
      }
      if (window.uiManager) window.uiManager.hideTitleScreen();
      if (window.game) window.game.startStage(s);
    };

    const openChaptersFromCampaignHub = (e) => {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      if (this.campaignModal) this.campaignModal.classList.add('hidden');
      this._returnToCampaignHub = true;
      this.showChapterMap({ fromCampaignHub: true });
    };

    on('btn-campaign-continue', (e) => {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      const stage = (window.saveManager && window.saveManager.data.currentStage) || 1;
      startCampaignStage(stage);
    });
    on('card-campaign-continue', openChaptersFromCampaignHub);
    on('btn-campaign-newgame', (e) => {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      if (this.newgameModal) this.newgameModal.classList.remove('hidden');
    });
    on('card-campaign-newgame', () => {
      if (this.newgameModal) this.newgameModal.classList.remove('hidden');
    });
    on('btn-newgame-cancel', () => {
      if (this.newgameModal) this.newgameModal.classList.add('hidden');
    });
    on('btn-newgame-confirm', () => {
      if (window.saveManager) {
        window.saveManager.data.currentStage = 1;
        window.saveManager.data.tutorialCompleted = false;
        window.saveManager.data.tutorialSkipped = false;
        window.saveManager.data.completedStages = [];
        window.saveManager.persist();
      }
      startCampaignStage(1);
    });
    on('btn-campaign-chapters', openChaptersFromCampaignHub);
    on('card-campaign-chapters', openChaptersFromCampaignHub);

    const openBossRushFromCampaignHub = (e) => {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      if (this.campaignModal) this.campaignModal.classList.add('hidden');
      this._returnToCampaignHub = true;
      if (window.bossRushManager) window.bossRushManager.showMenu({ fromCampaignHub: true });
    };
    on('btn-campaign-bossrush', openBossRushFromCampaignHub);
    on('card-campaign-bossrush', openBossRushFromCampaignHub);

    const openChroniclesFromCampaignHub = (e) => {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      if (this.campaignModal) this.campaignModal.classList.add('hidden');
      this._returnToCampaignHub = true;
      this.showChronicles('docs', { fromCampaignHub: true });
    };
    on('btn-campaign-chronicles', openChroniclesFromCampaignHub);
    on('card-campaign-chronicles', openChroniclesFromCampaignHub);

    on('btn-char-close', () => this.closeCharSelect());
    on('btn-char-close-x', () => this.closeCharSelect());
    on('btn-char-start', () => this.startSelected());
    on('btn-char-prev', () => this.cycleChar(-1));
    on('btn-char-next', () => this.cycleChar(1));
    on('btn-ally-prev', () => { if (typeof this.cycleAlly === 'function') this.cycleAlly(-1); });
    on('btn-ally-next', () => { if (typeof this.cycleAlly === 'function') this.cycleAlly(1); });
    on('btn-ally-back', () => { if (typeof this.backToCharSelect === 'function') this.backToCharSelect(); });
    on('btn-ally-close-x', () => { if (typeof this.backToCharSelect === 'function') this.backToCharSelect(); });
    on('btn-ally-confirm', () => { if (typeof this.confirmAllyAndStart === 'function') this.confirmAllyAndStart(); });
    on('btn-map-close', () => this.closeChapterMap());
    on('btn-map-close-x', () => this.closeChapterMap());
    on('btn-dossier-close', () => this.hideAll());
    on('btn-dossier-close-x', () => this.hideAll());
    on('btn-profile-close', () => this.closePlayerProfile());
    on('btn-profile-close-x', () => this.closePlayerProfile());
    on('btn-top-shop', () => {
      this._shopReturnTarget = null;
      if (typeof this.showShop === 'function') this.showShop();
    });
    on('btn-quick-shop', () => {
      this._shopReturnTarget = null;
      if (typeof this.showShop === 'function') this.showShop();
    });
    on('top-gold-pill', () => {
      this._shopReturnTarget = null;
      if (typeof this.showShop === 'function') this.showShop('vananh');
    });
    on('top-diamond-pill', () => {
      this._shopReturnTarget = null;
      if (typeof this.showShop === 'function') this.showShop('tiendang');
    });
    on('btn-shop-close', () => this.closeShop());
    on('btn-shop-close-x', () => this.closeShop());
    on('btn-shop-open-charselect', () => {
      if (this.shopModal) this.shopModal.classList.add('hidden');
      this._shopReturnTarget = null;
      this.openCharSelect(null);
    });
    on('btn-profile-open-achievements', () => {
      if (this.playerProfileModal) this.playerProfileModal.classList.add('hidden');
      this.showAchievements();
    });
    on('btn-profile-open-collection', () => {
      if (this.playerProfileModal) this.playerProfileModal.classList.add('hidden');
      this.showCollection();
    });
    on('btn-profile-open-dossier', () => {
      if (this.playerProfileModal) this.playerProfileModal.classList.add('hidden');
      this._dossierReturnTarget = 'player-profile';
      this.showDossier();
    });
    on('btn-cs-open-dossier', () => {
      this._dossierReturnTarget = 'char-select';
      this.dossierChar = this.selectedChar || 'nghi';
      if (this.charModal) this.charModal.classList.add('hidden');
      this.showDossier();
    });
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
    on('btn-save-keybindings', () => {
      if (window.uiCore) window.uiCore.flushPersistNow();
      if (window.saveManager && typeof window.saveManager.persist === 'function') {
        window.saveManager.persist();
      }
      this.hideKeybindings();
      this.showToast('✅ ĐÃ LƯU & ÁP DỤNG PHÍM ĐIỀU KHIỂN!');
    });
    if (window.uiCore) {
      const kbModal = document.getElementById('keybindings-modal');
      if (kbModal) {
        window.uiCore.bindOnce(kbModal, 'click', (e) => {
          if (e.target === kbModal) this.hideKeybindings();
        }, '__vovKbBackdropBound');
      }
    }
    on('btn-reset-keybindings', () => {
      if (window.input) {
        window.input.resetDefaultBindings();
        if (typeof this.cleanupKeybindingsListener === 'function') {
          this.cleanupKeybindingsListener();
        }
        this.showKeybindings({ refreshOnly: true });
        this.showToast('↺ ĐÃ KHÔI PHỤC PHÍM MẶC ĐỊNH');
      }
    });

    on('btn-settings-close', () => this.hideAll());
    on('btn-settings-close-x', () => this.hideAll());
    on('btn-ending-close-x', () => this.hideAll());
    on('btn-chronicles-close', () => this.closeChronicles());
    on('btn-chronicles-close-x', () => this.closeChronicles());

    on('btn-chronicles', () => this.showChronicles('docs', { fromCampaignHub: false }));
    on('btn-quick-chronicles', () => this.showChronicles('docs', { fromCampaignHub: false }));
    on('btn-pause-chronicles', () => {
      this._returnToCampaignHub = false;
      this.closeChronicles();
      this.showChronicles('docs', { fromCampaignHub: false });
    });

    // Mới: Nút Luyện võ, Tái đấu Boss, Bảng suy luận, Chơi lại hướng dẫn
    on('btn-training', () => {
      this.openCharSelect('training');
    });
    on('btn-boss-rush', () => {
      this._returnToCampaignHub = false;
      if (window.bossRushManager) window.bossRushManager.showMenu({ fromCampaignHub: false });
    });
    on('card-feature-event', () => {
      this._returnToCampaignHub = false;
      if (window.bossRushManager) window.bossRushManager.showMenu({ fromCampaignHub: false });
    });
    on('card-feature-story', () => this.showChronicles('docs', { fromCampaignHub: false }));
    on('card-feature-map', () => this.showChapterMap({ fromCampaignHub: false }));
    on('card-feature-battlegrounds', () => {
      this.openCharSelect('training');
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

    on('btn-deploy-cancel', () => this.closeCharSelect());
    on('btn-deploy-close-x', () => this.closeCharSelect());
    on('btn-deploy-start', () => this.confirmDeployment());

    on('btn-deploy-skin-default', () => this.setDeploymentSkin('default'));
    on('btn-deploy-skin-vovinam', () => this.setDeploymentSkin('vovinam'));

    on('btn-cs-skin-default', () => this.setWardrobeSkin('default'));
    on('btn-cs-skin-vovinam', () => this.setWardrobeSkin('vovinam'));
    on('btn-cs-tab-heroes', () => this.switchCsTab('heroes'));
    on('btn-cs-tab-skins', () => this.switchCsTab('skins'));
    on('btn-cs-subtab-skills', () => this.switchSkillsTab && this.switchSkillsTab('skills'));
    on('btn-cs-subtab-passives', () => this.switchSkillsTab && this.switchSkillsTab('passives'));
    on('btn-cs-skills-toggle', () => this.toggleSkillsBlock && this.toggleSkillsBlock());
    on('btn-cs-demo-move', () => this.triggerCsStageDemo());
    on('btn-cs-view-toggle', () => this.toggleCsStageView());

    // Đóng khi click ra ngoài backdrop modal (chống kẹt giao diện)
    [this.charModal, this.mapModal, this.dossierModal, this.playerProfileModal, this.shopModal, this.collectionModal, this.achModal, this.settingsModal, this.deployModal, this.campaignModal, this.newgameModal].forEach((m) => {
      if (m) {
        m.addEventListener('click', (e) => {
          if (e.target === m) {
            if (m === this.charModal) this.closeCharSelect();
            else if (m === this.mapModal) this.closeChapterMap();
            else if (m === this.newgameModal) this.newgameModal.classList.add('hidden');
            else if (m === this.campaignModal) this.hideCampaignHub();
            else if (m === this.playerProfileModal) this.closePlayerProfile();
            else if (m === this.shopModal) this.closeShop();
            else this.hideAll();
          }
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
      const resetBtn = document.getElementById('btn-reset-progress');
      if (resetBtn && resetBtn.dataset) {
        if (resetBtn.dataset.confirm !== 'pending') {
          resetBtn.dataset.confirm = 'pending';
          if (!resetBtn.dataset.defaultLabel) resetBtn.dataset.defaultLabel = resetBtn.textContent;
          resetBtn.textContent = '⚠️ BẤM LẦN NỮA ĐỂ XÁC NHẬN XÓA';
          resetBtn.classList.add('is-armed');
          clearTimeout(this._resetArmTimer);
          this._resetArmTimer = setTimeout(() => {
            if (resetBtn.dataset) resetBtn.dataset.confirm = '';
            resetBtn.textContent = resetBtn.dataset.defaultLabel || 'XÓA TOÀN BỘ TIẾN TRÌNH';
            resetBtn.classList.remove('is-armed');
          }, 4000);
          this.showToast('⚠️ BẤM THÊM 1 LẦN NỮA TRONG 4 GIÂY ĐỂ XÓA TIẾN TRÌNH!');
          return;
        }
        clearTimeout(this._resetArmTimer);
        resetBtn.dataset.confirm = '';
        resetBtn.textContent = resetBtn.dataset.defaultLabel || 'XÓA TOÀN BỘ TIẾN TRÌNH';
        resetBtn.classList.remove('is-armed');
      }
      if (window.saveManager) {
        window.saveManager.resetProgress();
        this.selectedChar = 'nghi';
        if (window.allyManager) {
          window.allyManager.selectedAllyId = 'auto';
        }
        this.refreshCharSelect();
        this.updateMenuPlayerBar();
        if (typeof this.updateSettingsSummary === 'function') this.updateSettingsSummary();
        this.showToast('ĐÃ XÓA TIẾN TRÌNH — TÀI KHOẢN TRỞ VỀ TÂN THỦ!');
      }
    });

    // Âm lượng (debounce persist trong lúc kéo slider + cập nhật readout % trực tiếp)
    const syncSliderBadge = (id, pct) => {
      const valEl = document.getElementById(id);
      if (valEl) valEl.textContent = `${Math.round(Number(pct) || 0)}%`;
    };
    const music = document.getElementById('setting-music');
    const sfx = document.getElementById('setting-sfx');
    const mute = document.getElementById('setting-mute');
    const st = window.saveManager ? window.saveManager.data.settings : null;
    if (music) {
      if (st) music.value = Math.round((st.musicVolume ?? 0.45) * 100);
      syncSliderBadge('setting-music-val', music.value);
      if (window.uiCore) window.uiCore.syncRangeFill(music);
      music.addEventListener('input', () => {
        const vol = Math.max(0, Math.min(1, Number(music.value) / 100));
        syncSliderBadge('setting-music-val', music.value);
        if (window.uiCore) window.uiCore.syncRangeFill(music);
        if (window.audioManager) {
          window.audioManager.musicVolume = vol;
          if (window.audioManager.musicGain && window.audioManager.ctx) {
            window.audioManager.musicGain.gain.setValueAtTime(vol, window.audioManager.ctx.currentTime);
          }
        }
        if (window.saveManager && window.saveManager.data && window.saveManager.data.settings) {
          window.saveManager.data.settings.musicVolume = vol;
          if (window.uiCore) window.uiCore.schedulePersist(220);
          else if (typeof window.saveManager.persist === 'function') window.saveManager.persist();
        }
      });
      if (window.uiCore) {
        window.uiCore.bindOnce(music, 'change', () => {
          if (window.audioManager) window.audioManager.setMusicVolume(Number(music.value) / 100);
          window.uiCore.flushPersistNow();
        }, '__vovMusicChangeBound');
      }
    }
    if (sfx) {
      if (st) sfx.value = Math.round((st.sfxVolume ?? 0.85) * 100);
      syncSliderBadge('setting-sfx-val', sfx.value);
      if (window.uiCore) window.uiCore.syncRangeFill(sfx);
      sfx.addEventListener('input', () => {
        const vol = Math.max(0, Math.min(1, Number(sfx.value) / 100));
        syncSliderBadge('setting-sfx-val', sfx.value);
        if (window.uiCore) window.uiCore.syncRangeFill(sfx);
        if (window.audioManager) {
          window.audioManager.sfxVolume = vol;
          if (window.audioManager.sfxGain && window.audioManager.ctx) {
            window.audioManager.sfxGain.gain.setValueAtTime(vol, window.audioManager.ctx.currentTime);
          }
        }
        if (window.saveManager && window.saveManager.data && window.saveManager.data.settings) {
          window.saveManager.data.settings.sfxVolume = vol;
          if (window.uiCore) window.uiCore.schedulePersist(220);
          else if (typeof window.saveManager.persist === 'function') window.saveManager.persist();
        }
      });
      if (window.uiCore) {
        window.uiCore.bindOnce(sfx, 'change', () => {
          if (window.audioManager) window.audioManager.setSfxVolume(Number(sfx.value) / 100);
          window.uiCore.flushPersistNow();
        }, '__vovSfxChangeBound');
      }
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

  // Đóng màn chọn nhân vật nhưng trả người chơi về đúng ngữ cảnh trước đó:
  // - Sau khi thắng màn: mở lại bảng kết quả để chọn Tiếp tục / Chơi lại.
  // - Sau khi bỏ qua hướng dẫn: về màn hình chính thay vì kẹt trong sân tập.
  // - Nếu mở từ Bản Đồ Chương Hồi hoặc Chiến Dịch: quay lại đúng màn hình đó.
  closeCharSelect() {
    const game = window.game;
    const state = game ? game.state : null;
    const tutorialEnded = !!(window.tutorialManager && !window.tutorialManager.isActive);
    const returnTarget = this._charSelectReturnTarget || null;
    const keepCampaignHub = !!this._returnToCampaignHub;
    this._charSelectReturnTarget = null;

    this.hideAll();
    this.updateMenuPlayerBar();

    if (state === 'STAGE_CLEAR' && window.uiManager) {
      const stageClear = document.getElementById('stage-clear-modal');
      if (stageClear) stageClear.classList.remove('hidden');
    } else if (state === 'TUTORIAL' && tutorialEnded && game) {
      game.returnToMenu();
    } else if (returnTarget === 'chapter-map') {
      this._returnToCampaignHub = keepCampaignHub;
      this.showChapterMap({ fromCampaignHub: keepCampaignHub });
    } else if (returnTarget === 'campaign-hub' || keepCampaignHub) {
      this._returnToCampaignHub = false;
      this.showCampaignHub();
    }
  }

  closeChapterMap() {
    if (this.mapModal) this.mapModal.classList.add('hidden');
    if (this._returnToCampaignHub) {
      this._returnToCampaignHub = false;
      this.showCampaignHub();
    } else {
      this.hideAll();
    }
  }

  closePlayerProfile() {
    if (this.playerProfileModal) this.playerProfileModal.classList.add('hidden');
    this.updateMenuPlayerBar();
  }

  closeShop() {
    const returnTarget = this._shopReturnTarget || null;
    this._shopReturnTarget = null;
    if (this.shopModal) this.shopModal.classList.add('hidden');
    this.updateMenuPlayerBar();
    if (returnTarget === 'char-select' && this.charModal) {
      this.refreshCharSelect();
      this.charModal.classList.remove('hidden');
    }
  }

  hideAll(force = false) {
    const wasDossierOpen = !!(this.dossierModal && !this.dossierModal.classList.contains('hidden'));
    const dossierReturn = wasDossierOpen ? this._dossierReturnTarget : null;
    this._dossierReturnTarget = null;

    const creditsModal = document.getElementById('credits-modal');
    const keybindingsModal = document.getElementById('keybindings-modal');
    const skillsEquipModal = document.getElementById('skills-equip-modal');
    const trainingModeModal = document.getElementById('training-mode-modal');
    if (typeof this.cleanupKeybindingsListener === 'function') {
      this.cleanupKeybindingsListener();
    }
    [this.charModal, this.allyModal, this.mapModal, this.dossierModal, this.playerProfileModal, this.shopModal, this.collectionModal, this.achModal, this.settingsModal, this.chroniclesModal, this.custodyModal, this.deployModal, this.campaignModal, this.newgameModal, creditsModal, keybindingsModal, skillsEquipModal, trainingModeModal]
      .forEach((m) => { if (m) m.classList.add('hidden'); });
    const resetBtn = document.getElementById('btn-reset-progress');
    if (resetBtn && resetBtn.dataset && resetBtn.dataset.confirm === 'pending') {
      clearTimeout(this._resetArmTimer);
      resetBtn.dataset.confirm = '';
      resetBtn.textContent = resetBtn.dataset.defaultLabel || 'XÓA TOÀN BỘ TIẾN TRÌNH';
      resetBtn.classList.remove('is-armed');
    }
    if (window.uiCore) {
      window.uiCore.flushPersistNow();
      window.uiCore.notifyOverlayChange();
    }
    if (window.uiManager && typeof window.uiManager.hideStageSelect === 'function') {
      window.uiManager.hideStageSelect();
    }
    if (window.deductionManager) window.deductionManager.hideBoard();
    if (window.bossRushManager) window.bossRushManager.hideMenu({ returnToParent: false });

    if (!force && dossierReturn === 'char-select' && this.charModal) {
      this.charModal.classList.remove('hidden');
      return;
    }
    if (!force && dossierReturn === 'shop' && typeof this.showShop === 'function') {
      this.showShop();
      return;
    }
    if (!force && dossierReturn === 'player-profile' && typeof this.showPlayerProfile === 'function') {
      this.showPlayerProfile();
      return;
    }

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
    this._returnToCampaignHub = false;
    this._charSelectReturnTarget = null;
    if (this.campaignModal) this.campaignModal.classList.add('hidden');
    if (this.newgameModal) this.newgameModal.classList.add('hidden');
    if (window.game && window.game.state === 'MENU' && window.uiManager) {
      window.uiManager.showTitleScreen();
    }
  }
}

window.MenuManagerBase = MenuManagerBase;
