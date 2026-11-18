/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/bossRush.js - Hệ thống Tái Đấu Boss & Biến thể thử thách (Huyết Chiến Gia Tộc)
 */

class BossRushManager {
  constructor() {
    this.modal = null;
    this.selectedBossId = 'haclang';
    this.selectedModifier = 'normal';
    this.activeChallenge = null;

    this.bossDefs = [
      { id: 'haclang', name: 'Đao Thủ Hắc Lang', title: 'Thủ Lĩnh Cửa Ngõ', stage: 2, bossClass: 'BossHacLang', diff: 2, icon: '🗡️' },
      { id: 'thietquyen', name: 'Võ Sĩ Thiết Quyền', title: 'Thiết Quyền Thép', stage: 3, bossClass: 'BossThietQuyen', diff: 3, icon: '🥊' },
      { id: 'huyetanh', name: 'Đội Trưởng Huyết Ảnh', title: 'Hành Lang Tử Thủ', stage: 4, bossClass: 'BossHuyetAnh', diff: 4, icon: '🥷' },
      { id: 'longvuong', name: 'Long Vương', title: 'Chúa Tể Căn Cứ Ngầm', stage: 4, bossClass: 'BossLongVuong', diff: 5, icon: '🐉' },
      { id: 'bichlam', name: 'Đình Bích Lâm', title: 'Thủ Lĩnh Bến Cảng', stage: 9, bossClass: 'BossBichLam', diff: 3, icon: '⚔️' },
      { id: 'dunghai', name: 'Phó Dung Hải', title: 'Song Đao Sát Thủ', stage: 13, bossClass: 'BossDungHai', diff: 4, icon: '🗡️' },
      { id: 'hoanganh', name: 'Phó Đặng Hoàng Anh', title: 'Thần Cước Trấn Sơn', stage: 15, bossClass: 'BossHoangAnh', diff: 5, icon: '🌪️' },
      { id: 'dinhan', name: 'Triệu Đình An', title: 'Bức Tường Triệu Gia', stage: 16, bossClass: 'BossDinhAn', diff: 4, icon: '🛡️' },
      { id: 'vinhtam', name: 'Triệu Vinh Tâm', title: 'Chủ Tịch Triệu Gia', stage: 17, bossClass: 'BossVinhTam', diff: 5, icon: '👑' },
      { id: 'giangmanh', name: 'Ngô Giang Mạnh', title: 'Đoạn Nghĩa Võ Thần', stage: 20, bossClass: 'BossGiangManh', diff: 5, icon: '❄️' }
    ];

    this.modifiers = [
      { id: 'normal', name: 'ĐẤU THƯỜNG', desc: 'Đấu võ 1v1 tiêu chuẩn theo luật Vovinam.', icon: '⚔️', bonus: 1.0 },
      { id: 'no_ult', name: 'CẤM TUYỆT KỸ', desc: 'Năng lượng bị khóa ở 0%. Không thể sử dụng tuyệt kỹ [I].', icon: '🚫', bonus: 1.3 },
      { id: 'sudden_death', name: 'MỘT MÁU (1 HP)', desc: 'Người chơi chỉ có 1 HP duy nhất. Bất kỳ đòn trúng nào cũng gục ngã.', icon: '💀', bonus: 2.0 },
      { id: 'speed', name: 'BOSS CUỒNG TỐC', desc: 'Boss di chuyển và tung chiêu nhanh hơn 35%. Cửa sổ phản đòn hẹp hơn.', icon: '⚡', bonus: 1.4 },
      { id: 'titan', name: 'BÁ THỂ THIẾT GIÁP', desc: 'Boss nhận thêm 60% HP và có siêu giáp super armor khó bị đánh ngã.', icon: '🛡️', bonus: 1.5 },
      { id: 'time_attack', name: 'GIỚI HẠN 90 GIÂY', desc: 'Phải hạ gục boss trước khi đồng hồ 90s đếm ngược về 0.', icon: '⏱️', bonus: 1.6 }
    ];
  }

  isBossUnlocked(bossId) {
    const save = window.saveManager;
    if (!save || !save.data) return true;
    const def = this.bossDefs.find(b => b.id === bossId);
    if (!def) return false;
    // Màn 1 luôn mở cho người chơi trải nghiệm ngay
    if (def.stage === 1) return true;
    // Đã từng hạ gục boss này trong chiến dịch
    if (save.data.bossesDefeated && save.data.bossesDefeated.includes(bossId)) return true;
    // Đã hoàn thành màn này
    if (save.data.completedStages && save.data.completedStages.includes(def.stage)) return true;
    // Tiến trình màn chơi hiện tại hoặc cờ mở khóa màn
    if (save.data.stagesUnlocked && save.data.stagesUnlocked >= def.stage) return true;
    if (save.data.currentStage && save.data.currentStage >= def.stage) return true;
    // Kiểm tra hàm isStageUnlocked của SaveManager
    if (typeof save.isStageUnlocked === 'function' && save.isStageUnlocked(def.stage)) return true;
    return false;
  }

  getActiveMultiplier(modId = null) {
    const target = modId || this.selectedModifier || 'normal';
    const mod = this.modifiers.find(m => m.id === target);
    return mod ? mod.bonus : 1.0;
  }

  calculateVictoryScore(bossId, timeSec, hpPercent = 100, modifierId = null) {
    const modId = modifierId || this.selectedModifier || 'normal';
    const bonus = this.getActiveMultiplier(modId);
    const basePts = 15000;
    const timeBonus = Math.max(0, 8000 - timeSec * 45);
    const hpBonus = Math.round(hpPercent * 30);
    return Math.round((basePts + timeBonus + hpBonus) * bonus);
  }

  showMenu(opts = {}) {
    if (opts && typeof opts.fromCampaignHub === 'boolean') {
      this._returnToCampaignHub = opts.fromCampaignHub;
    } else if (window.menuManager && window.menuManager._returnToCampaignHub) {
      this._returnToCampaignHub = true;
    }
    this.createModalDOM();
    if (this.modal) {
      const closeBtn = this.modal.querySelector('#btn-close-bossrush');
      if (closeBtn) {
        closeBtn.textContent = this._returnToCampaignHub ? 'QUAY LẠI CHIẾN DỊCH' : 'QUAY LẠI MENU';
      }
      if (!this.isBossUnlocked(this.selectedBossId)) {
        const firstUnlocked = this.bossDefs.find(b => this.isBossUnlocked(b.id));
        if (firstUnlocked) this.selectedBossId = firstUnlocked.id;
      }
      this.modal.classList.remove('hidden');
      this.renderBossList();
      this.renderDetail();
    }
  }

  hideMenu(opts = {}) {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
    const shouldReturn = (opts && opts.returnToParent !== undefined) ? opts.returnToParent : !this._suppressCampaignReturn;
    if (shouldReturn && this._returnToCampaignHub) {
      this._returnToCampaignHub = false;
      if (window.menuManager) {
        window.menuManager._returnToCampaignHub = false;
        if (typeof window.menuManager.showCampaignHub === 'function') {
          window.menuManager.showCampaignHub();
        }
      }
    }
  }

  closeMenu() {
    this.hideMenu({ returnToParent: true });
  }

  createModalDOM() {
    if (document.getElementById('boss-rush-modal')) {
      this.modal = document.getElementById('boss-rush-modal');
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'boss-rush-modal';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `
      <div class="modal-card wide-card boss-rush-card">
        <div class="boss-rush-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(220,38,38,0.4); padding-bottom: 10px;">
          <div class="boss-rush-title-wrap">
            <span class="boss-rush-badge" style="font-size: 11px; font-weight: 800; color: #ef4444; letter-spacing: 1px;">⚔️ SỰ KIỆN ĐẶC BIỆT</span>
            <h2 class="modal-title boss-rush-title" style="margin: 2px 0 0 0; font-family: 'Cinzel', serif; font-size: 20px; color: #ffd700;">HUYẾT CHIẾN GIA TỘC — TÁI ĐẤU BOSS</h2>
          </div>
          <button id="btn-close-bossrush-x" class="modal-close-icon" style="background:none; border:none; color:#cbd5e1; font-size:20px; cursor:pointer;" title="Đóng">✕</button>
        </div>

        <div class="boss-rush-body">
          <!-- Cột Trái: Danh sách Boss -->
          <div class="boss-rush-sidebar">
            <span class="col-head" style="font-size: 11px; font-weight: 800; color: #ffd700; margin-bottom: 6px; display: block; text-transform: uppercase;">DANH SÁCH BOSS ĐÃ ĐỐI ĐẦU:</span>
            <div id="boss-rush-grid" class="boss-rush-grid"></div>
          </div>

          <!-- Cột Phải: Tùy chọn Thử Thách & Thành Tích Cá Nhân -->
          <div class="boss-rush-detail">
            <div id="boss-rush-detail-content" class="boss-rush-detail-content"></div>
          </div>
        </div>

        <div class="modal-actions" style="display:flex; justify-content:flex-end; gap:12px; margin-top:14px; border-top: 1px solid rgba(255,255,255,0.08); padding-top:12px;">
          <button id="btn-close-bossrush" class="btn btn-secondary">QUAY LẠI MENU</button>
          <button id="btn-start-boss-rush" class="btn btn-primary" style="background: linear-gradient(135deg, #dc2626, #991b1b); border-color: #ef4444; font-weight:800;">BẮT ĐẦU TÁI ĐẤU ⚔️</button>
        </div>
      </div>
    `;

    const uiLayer = document.getElementById('ui-layer') || document.body;
    uiLayer.appendChild(modal);
    this.modal = modal;

    modal.querySelector('#btn-close-bossrush-x').addEventListener('click', () => this.hideMenu());
    modal.querySelector('#btn-close-bossrush').addEventListener('click', () => this.hideMenu());
    modal.querySelector('#btn-start-boss-rush').addEventListener('click', () => this.startSelectedChallenge());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.hideMenu();
    });
  }

  renderBossList() {
    const grid = document.getElementById('boss-rush-grid');
    if (!grid) return;
    grid.innerHTML = '';

    this.bossDefs.forEach(b => {
      const unlocked = this.isBossUnlocked(b.id);
      const isSelected = (this.selectedBossId === b.id);

      const item = document.createElement('div');
      item.className = `boss-card-row ${unlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}`;
      item.innerHTML = `
        <div class="boss-card-avatar">${b.icon || '🥋'}</div>
        <div class="boss-card-info">
          <span class="b-name">${b.name}</span>
          <span class="b-title">${unlocked ? b.title : `🔒 Mở tại Màn ${b.stage}`}</span>
        </div>
        <div class="boss-diff-stars">${'★'.repeat(b.diff)}</div>
      `;

      if (unlocked) {
        item.addEventListener('click', () => {
          this.selectedBossId = b.id;
          if (window.audioManager) window.audioManager.playClick();
          this.renderBossList();
          this.renderDetail();
        });
      } else {
        item.addEventListener('click', () => {
          if (window.uiManager) window.uiManager.showToast(`BOSS ĐANG KHÓA — Cần mở khóa Màn ${b.stage} trong Chiến Dịch!`);
        });
      }

      grid.appendChild(item);
    });
  }

  renderDetail() {
    const detail = document.getElementById('boss-rush-detail-content');
    if (!detail) return;

    const boss = this.bossDefs.find(b => b.id === this.selectedBossId);
    if (!boss) return;

    const save = window.saveManager;
    const records = (save && save.data.bossRecords && save.data.bossRecords[boss.id]) || {};

    detail.innerHTML = `
      <div class="boss-profile-box">
        <h3 class="bp-name">${boss.name.toUpperCase()}</h3>
        <span class="bp-title">${boss.title.toUpperCase()} — ĐỘ KHÓ: ${'★'.repeat(boss.diff)}</span>
      </div>

      <div class="modifiers-select-box">
        <span class="mod-title">CHỌN BIẾN THỂ THỬ THÁCH:</span>
        <div class="modifiers-grid">
          ${this.modifiers.map(m => {
            const isSel = (this.selectedModifier === m.id);
            const rec = records[m.id];
            return `
              <div class="mod-card ${isSel ? 'selected' : ''}" data-mod="${m.id}">
                <div class="mod-head">
                  <span class="mod-name">${m.icon} ${m.name}</span>
                  <span class="mod-mult">x${m.bonus.toFixed(1)}</span>
                </div>
                <div class="mod-desc">${m.desc}</div>
                ${rec ? `<div style="font-size: 10px; color: #4ade80; font-weight: 700; margin-top: 4px;">🏆 Kỷ lục: Hạng ${rec.rank} (${rec.timeStr} • ${rec.score ? rec.score.toLocaleString() : 0} pts)</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="boss-records-box">
        <div class="rec-head">🏆 THÀNH TÍCH TÁI ĐẤU CÁ NHÂN VỚI ${boss.name.toUpperCase()}:</div>
        <div class="rec-grid">
          ${this.modifiers.map(m => {
            const r = records[m.id];
            return `
              <div>
                <strong>${m.name}:</strong> ${r ? `${r.rank} (${r.timeStr})` : 'Chưa đấu'}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    detail.querySelectorAll('.mod-card').forEach(c => {
      c.addEventListener('click', () => {
        detail.querySelectorAll('.mod-card').forEach(mc => mc.classList.remove('selected'));
        c.classList.add('selected');
        this.selectedModifier = c.getAttribute('data-mod') || 'normal';
        if (window.audioManager) window.audioManager.playClick();
      });
    });
  }

  startSelectedChallenge() {
    const bossDef = this.bossDefs.find(b => b.id === this.selectedBossId);
    if (!bossDef || !this.isBossUnlocked(bossDef.id)) {
      if (window.uiManager) window.uiManager.showToast('Vui lòng chọn Boss đã được mở khóa!');
      return;
    }

    this.hideMenu();
    this.launchBossDuel(bossDef, this.selectedModifier);
  }

  launchBossDuel(bossDef, modifierId) {
    const game = window.game;
    if (!game) return;

    this.activeChallenge = {
      bossDef,
      modifierId,
      timeElapsed: 0,
      timeLimit: (modifierId === 'time_attack') ? 90 : 0
    };

    // 1. Dọn dẹp các modal & chế độ khác
    this.cancel();
    this.activeChallenge = {
      bossDef,
      modifierId,
      timeElapsed: 0,
      timeLimit: (modifierId === 'time_attack') ? 90 : 0
    };
    if (typeof game.resetTransientModes === 'function') {
      game.resetTransientModes({ keepBossRush: true });
    }
    if (window.trainingManager) {
      window.trainingManager.isActive = false;
      window.trainingManager.noCooldown = false;
      window.trainingManager.hideOverlay();
    }
    if (window.tutorialManager) {
      window.tutorialManager.isActive = false;
      window.tutorialManager.hideOverlay();
    }
    if (window.menuManager) {
      window.menuManager.hideAll();
    }

    // 2. Ẩn Title Screen & các overlay khác, hiển thị HUD chiến đấu
    if (window.uiManager) {
      window.uiManager.hideTitleScreen();
      window.uiManager.hideGameOver();
      window.uiManager.hideStageClear();
      window.uiManager.hideGrandVictory();
      window.uiManager.hideEnding();
      window.uiManager.hidePause();
      window.uiManager.showHUD();
    }

    // 3. Khởi tạo Sân khấu theo màn của Boss
    const stageNum = bossDef.stage || 1;
    if (window.stageManager) {
      window.stageManager.setStage(stageNum);
    }
    if (window.effectManager) {
      window.effectManager.setWeather(stageNum);
    }
    if (window.propSystem) {
      window.propSystem.initStage(stageNum);
    }

    // 4. Thiết lập Trạng thái Game cho Đấu trường 1v1
    game.state = 'PLAYING';
    game.previousState = 'PLAYING';
    game.isBossRush = true;
    game.arenaLocked = true;
    game.combatMode = 'DUEL';
    game.currentWaveActive = false;
    game.currentWaveIndex = 999; // Khóa toàn bộ các wave thường của màn
    game.currentWaveRequiredEnemies = [];
    game.projectiles = [];
    game.stageEvidence = null;

    // Giới hạn võ đài 1v1
    const stageWidth = (window.stageManager && window.stageManager.stageWidth) || 1600;
    game.arenaMinX = 50;
    game.arenaMaxX = Math.min(1600, stageWidth);

    // 5. Khởi tạo & Đặt lại Người chơi
    const save = window.saveManager;
    const charId = (save && save.data.selectedCharacter) || 'nghi';
    const playerX = 200;
    const playerY = 580;
    if (game.player) {
      game.player.setCharacter(charId);
      game.player.reset(playerX, playerY);
      game.player.facing = 1;
      game.player.energy = 0;
      game.player.isDead = false;

      // Áp dụng trang phục skin nếu có
      const skinId = (save && save.data.equippedSkins && save.data.equippedSkins[charId]) || 'default';
      if (typeof game.player.setSkin === 'function') {
        game.player.setSkin(skinId);
      }

      // Kích hoạt nội tại đã chọn
      if (typeof game.player.applySelectedPassives === 'function') {
        game.player.applySelectedPassives();
      }

      // Áp dụng biến thể người chơi
      if (modifierId === 'sudden_death') {
        game.player.hp = 1;
        game.player.maxHp = 1;
      }
      if (modifierId === 'no_ult') {
        game.player.energy = 0;
        game.player.maxEnergy = 0;
      }

      if (window.weaponSystem) {
        window.weaponSystem.reset(game.player);
      }
      if (window.combatSystem) {
        window.combatSystem.resetStageStats();
      }
      if (window.uiManager) {
        window.uiManager.setCharacterHUD(game.player);
        window.uiManager.updatePlayerHp(game.player.hp, game.player.maxHp);
        window.uiManager.updatePlayerEnergy(game.player.energy, game.player.maxEnergy);
      }
    }

    // 6. Tìm và khởi tạo Boss
    let BossClass = window[bossDef.bossClass];
    if (!BossClass) {
      const classMap = {
        haclang: window.BossHacLang,
        thietquyen: window.BossThietQuyen,
        huyetanh: window.BossHuyetAnh,
        longvuong: window.BossLongVuong,
        bichlam: window.BossBichLam || window.BossBichlam,
        dunghai: window.BossDungHai,
        hoanganh: window.BossHoangAnh,
        dinhan: window.BossDinhAn,
        vinhtam: window.BossVinhTam,
        giangmanh: window.BossGiangManh
      };
      BossClass = classMap[bossDef.id];
    }

    if (!BossClass) {
      console.error(`[BossRush] Không tìm thấy lớp boss: ${bossDef.bossClass}`);
      if (window.uiManager) window.uiManager.showToast(`Lỗi: Không tìm thấy ${bossDef.name}!`);
      return;
    }

    const bossSpawnX = Math.min(850, game.arenaMaxX - 140);
    const boss = new BossClass(bossSpawnX, 580);
    boss.isBoss = true;
    boss.facing = -1;
    boss.title = bossDef.title;

    // Áp dụng biến thể cho Boss
    if (modifierId === 'speed') {
      boss.speed = Math.round((boss.speed || 120) * 1.35);
      boss.attackCooldownMul = 0.65;
    }
    if (modifierId === 'titan') {
      boss.maxHp = Math.round(boss.maxHp * 1.6);
      boss.hp = boss.maxHp;
      boss.superArmor = true;
    }

    game.currentBoss = boss;
    game.enemies = [boss];

    // 7. Cập nhật Camera
    game.camera.x = 0;
    game.camera.y = 0;
    game.camera.maxX = Math.max(0, game.arenaMaxX - game.width);

    // 8. Cập nhật HUD & Âm thanh
    const modObj = this.modifiers.find(m => m.id === modifierId);
    const modName = modObj ? modObj.name : 'ĐẤU THƯỜNG';
    if (window.uiManager) {
      window.uiManager.setObjective(`⚔️ TÁI ĐẤU BOSS: ${bossDef.name.toUpperCase()} [${modName}]`);
      window.uiManager.showBossHUD(boss);
      window.uiManager.showBossIntro(boss);
      window.uiManager.showAlertBanner(`⚔️ HUYẾT CHIẾN: ${bossDef.name.toUpperCase()} — ${modName}`);
    }

    if (window.audioManager) {
      window.audioManager.startStageBGM(stageNum);
      window.audioManager.setBGMIntensity(1.3);
      window.audioManager.playGong(0.6);
    }
  }

  update(dt) {
    if (!this.activeChallenge) return;
    this.activeChallenge.timeElapsed += dt;

    // Kiểm tra giới hạn thời gian (Time Attack)
    if (this.activeChallenge.modifierId === 'time_attack') {
      const remain = Math.max(0, this.activeChallenge.timeLimit - this.activeChallenge.timeElapsed);
      const mins = Math.floor(remain / 60);
      const secs = Math.floor(remain % 60);
      const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

      const objEl = document.getElementById('objective-text');
      if (objEl) objEl.textContent = `⏱️ THỜI GIAN CÒN LẠI: ${timeStr}`;

      if (remain <= 0 && window.game && window.game.state === 'PLAYING') {
        if (window.uiManager) window.uiManager.showToast('HẾT THỜI GIAN THỬ THÁCH (TIME OUT)!');
        window.game.triggerGameOver();
        this.activeChallenge = null;
      }
    }

    // Kiểm tra Boss đã bị hạ gục chưa
    const game = window.game;
    if (game && game.currentBoss && game.currentBoss.isDead && (game.currentBoss.stateTimer > 1.5 || game.currentBoss.state === 'dead') && game.state === 'PLAYING') {
      this.handleBossRushVictory();
    }
  }

  handleBossRushVictory() {
    if (!this.activeChallenge) return;
    const chal = this.activeChallenge;
    this.activeChallenge = null;

    const game = window.game;
    if (game) {
      game.state = 'STAGE_CLEAR';
      game.isBossRush = false;
    }

    const timeSec = Math.round(chal.timeElapsed);
    const mins = Math.floor(timeSec / 60);
    const secs = timeSec % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Tính điểm thử thách
    const modObj = this.modifiers.find(m => m.id === chal.modifierId);
    const bonus = modObj ? modObj.bonus : 1.0;
    const basePts = 15000;
    const timeBonus = Math.max(0, 8000 - timeSec * 45);
    const score = Math.round((basePts + timeBonus) * bonus);

    let rank = 'B';
    if (score >= 26000) rank = 'S';
    else if (score >= 20000) rank = 'A';
    else if (score >= 14000) rank = 'B';
    else rank = 'C';

    const goldReward = Math.round(450 * bonus);
    const diamondReward = Math.round(18 * bonus);

    // Ghi vào SaveManager
    if (window.saveManager) {
      window.saveManager.recordBossBest(chal.bossDef.id, chal.modifierId, {
        cleared: true,
        rank,
        score,
        timeStr
      });
      window.saveManager.unlockAchievement('boss_challenger');
      if (typeof window.saveManager.addGold === 'function') window.saveManager.addGold(goldReward);
      if (typeof window.saveManager.addDiamonds === 'function') window.saveManager.addDiamonds(diamondReward);
    }

    if (window.audioManager) {
      window.audioManager.playVictory();
    }

    // Hiển thị thông báo chiến thắng
    if (window.uiManager) {
      window.uiManager.showAlertBanner(`THẮNG THỬ THÁCH! HẠNG ${rank} — +${goldReward} VÀNG 🪙 • +${diamondReward} KIM CƯƠNG 💎`);
      if (typeof window.uiManager.hideBossHUD === 'function') {
        window.uiManager.hideBossHUD();
      }
    }

    if (this._postVictoryTimer) clearTimeout(this._postVictoryTimer);
    this._postVictoryTimer = setTimeout(() => {
      this._postVictoryTimer = null;
      if (window.game && window.game.state !== 'STAGE_CLEAR') return;
      if (window.game) {
        window.game.state = 'MENU';
        window.game.isBossRush = false;
        window.game.enemies = [];
        window.game.currentBoss = null;
      }
      if (window.uiManager) {
        if (typeof window.uiManager.hideHUD === 'function') window.uiManager.hideHUD();
        if (typeof window.uiManager.showTitleScreen === 'function') window.uiManager.showTitleScreen();
      }
      this.showMenu();
    }, 2800);
  }

  cancel() {
    if (this._postVictoryTimer) {
      clearTimeout(this._postVictoryTimer);
      this._postVictoryTimer = null;
    }
    this.activeChallenge = null;
    this.hideMenu({ returnToParent: false });
  }
}

const bossRushManager = new BossRushManager();
window.BossRushManager = BossRushManager;
window.bossRushManager = bossRushManager;
