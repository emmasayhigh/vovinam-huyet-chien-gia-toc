/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/bossRush.js - Hệ thống Tái Đấu Boss & Biến thể thử thách
 */

class BossRushManager {
  constructor() {
    this.modal = null;
    this.selectedBossId = 'haclang';
    this.selectedModifier = 'normal';
    this.activeChallenge = null;

    this.bossDefs = [
      { id: 'haclang', name: 'Đao Thủ Hắc Lang', title: 'Thủ Lĩnh Cửa Ngõ', stage: 1, bossClass: 'BossHacLang', diff: 2 },
      { id: 'thietquyen', name: 'Võ Sĩ Thiết Quyền', title: 'Thiết Quyền Thép', stage: 2, bossClass: 'BossThietQuyen', diff: 3 },
      { id: 'huyetanh', name: 'Đội Trưởng Huyết Ảnh', title: 'Hành Lang Tử Thủ', stage: 3, bossClass: 'BossHuyetAnh', diff: 4 },
      { id: 'longvuong', name: 'Long Vương', title: 'Chúa Tể Căn Cứ Ngầm', stage: 4, bossClass: 'BossLongVuong', diff: 5 },
      { id: 'bichlam', name: 'Đình Bích Lâm', title: 'Thủ Lĩnh Bến Cảng', stage: 6, bossClass: 'BossBichLam', diff: 3 },
      { id: 'dunghai', name: 'Phó Dung Hải', title: 'Song Đao Sát Thủ', stage: 7, bossClass: 'BossDungHai', diff: 4 },
      { id: 'hoanganh', name: 'Phó Đặng Hoàng Anh', title: 'Thần Cước Trấn Sơn', stage: 8, bossClass: 'BossHoangAnh', diff: 5 },
      { id: 'dinhan', name: 'Triệu Đình An', title: 'Bức Tường Triệu Gia', stage: 9, bossClass: 'BossDinhAn', diff: 4 },
      { id: 'vinhtam', name: 'Triệu Vinh Tâm', title: 'Chủ Tịch Triệu Gia', stage: 10, bossClass: 'BossVinhTam', diff: 5 },
      { id: 'giangmanh', name: 'Ngô Giang Mạnh', title: 'Đoạn Nghĩa Võ Thần', stage: 11, bossClass: 'BossGiangManh', diff: 5 }
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
    if (!save) return bossId === 'haclang';
    if (save.data.bossesDefeated && save.data.bossesDefeated.includes(bossId)) return true;
    const def = this.bossDefs.find(b => b.id === bossId);
    if (!def) return false;
    if (save.data.completedStages && save.data.completedStages.includes(def.stage)) return true;
    if (save.data.stagesUnlocked && save.data.stagesUnlocked >= def.stage) return true;
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


  showMenu() {
    this.createModalDOM();
    if (this.modal) {
      this.modal.classList.remove('hidden');
      this.renderBossList();
      this.renderDetail();
    }
  }

  hideMenu() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
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
        <div class="boss-rush-header">
          <div class="boss-rush-title-wrap">
            <span class="boss-rush-badge">⚔️ VÕ ĐÀI HUYẾT CHIẾN</span>
            <h2 class="modal-title boss-rush-title">THỬ THÁCH TÁI ĐẤU BOSS</h2>
          </div>
          <button id="btn-close-bossrush-x" class="modal-close-icon">✕</button>
        </div>

        <div class="boss-rush-body">
          <!-- Cột Trái: Danh sách Boss -->
          <div class="boss-rush-list-col">
            <span class="col-head">DANH SÁCH BOSS ĐÃ ĐỐI ĐẦU:</span>
            <div id="boss-rush-grid" class="boss-rush-grid"></div>
          </div>

          <!-- Cột Phải: Tùy chọn Thử Thách & Thành Tích Cá Nhân -->
          <div class="boss-rush-detail-col">
            <div id="boss-rush-detail-content" class="boss-rush-detail-content"></div>
          </div>
        </div>

        <div class="modal-actions">
          <button id="btn-start-boss-rush" class="btn btn-primary">BẮT ĐẦU TÁI ĐẤU ⚔️</button>
          <button id="btn-close-bossrush" class="btn btn-secondary">QUAY LẠI MENU</button>
        </div>
      </div>
    `;

    document.getElementById('ui-layer').appendChild(modal);
    this.modal = modal;

    modal.querySelector('#btn-close-bossrush-x').addEventListener('click', () => this.hideMenu());
    modal.querySelector('#btn-close-bossrush').addEventListener('click', () => this.hideMenu());
    modal.querySelector('#btn-start-boss-rush').addEventListener('click', () => this.startSelectedChallenge());
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
        <div class="boss-card-avatar">🥋</div>
        <div class="boss-card-info">
          <span class="b-name">${b.name}</span>
          <span class="b-title">${unlocked ? b.title : `🔒 Hạ tại Màn ${b.stage} để mở khóa`}</span>
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
          if (window.uiManager) window.uiManager.showToast(`BOSS ĐANG KHÓA — Cần đánh bại tại Màn ${b.stage} trong Chiến Dịch!`);
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
        <span class="mod-label">CHỌN BIẾN THỂ THỬ THÁCH:</span>
        <div class="modifiers-list">
          ${this.modifiers.map(m => {
            const isSel = (this.selectedModifier === m.id);
            const rec = records[m.id];
            return `
              <div class="mod-card ${isSel ? 'selected' : ''}" data-mod="${m.id}">
                <div class="mod-head">
                  <span class="mod-icon">${m.icon}</span>
                  <span class="mod-title">${m.name}</span>
                  ${rec ? `<span class="rec-badge rank-${rec.rank}">HẠNG ${rec.rank} (${rec.timeStr})</span>` : ''}
                </div>
                <div class="mod-desc">${m.desc}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="boss-records-summary">
        <span class="rec-head">🏆 KỶ LỤC CÁ NHÂN VỚI ${boss.name.toUpperCase()}:</span>
        <div class="rec-badges-row">
          ${this.modifiers.map(m => {
            const r = records[m.id];
            return `
              <span class="badge-pill ${r ? 'cleared' : 'pending'}">
                ${m.name}: ${r ? `✓ ${r.rank} (${r.score} pts)` : 'Chưa đấu'}
              </span>
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

    // Chuẩn bị sàn đấu 1v1
    game.state = 'PLAYING';
    game.isBossRush = true;
    game.arenaLocked = true;
    game.arenaMinX = 50;
    game.arenaMaxX = 1600;
    game.combatMode = 'DUEL';
    game.currentWaveActive = false;

    // Reset Người chơi
    const charId = (window.saveManager && window.saveManager.data.selectedCharacter) || 'nghi';
    game.player.setCharacter(charId);
    game.player.reset(200, 580);
    game.player.energy = 0;

    // Áp dụng biến thể cho người chơi
    if (modifierId === 'sudden_death') {
      game.player.hp = 1;
      game.player.maxHp = 1;
      if (window.uiManager) window.uiManager.updatePlayerHp(1, 1);
    }
    if (modifierId === 'no_ult') {
      game.player.energy = 0;
      game.player.maxEnergy = 0;
    }

    // Khởi tạo Boss
    const BossClass = window[bossDef.bossClass];
    if (!BossClass) {
      console.error(`Không tìm thấy lớp boss: ${bossDef.bossClass}`);
      return;
    }

    const boss = new BossClass(1000, 570);
    boss.isBoss = true;
    boss.title = bossDef.title;

    // Áp dụng biến thể cho Boss
    if (modifierId === 'speed') {
      boss.speed = Math.round((boss.speed || 120) * 1.35);
      boss.attackCooldownMul = 0.7;
    }
    if (modifierId === 'titan') {
      boss.maxHp = Math.round(boss.maxHp * 1.6);
      boss.hp = boss.maxHp;
      boss.superArmor = true;
    }

    game.currentBoss = boss;
    game.enemies = [boss];

    // Camera
    game.camera.x = 0;
    game.camera.y = 0;
    game.camera.maxX = 1600 - game.width;

    if (window.uiManager) {
      window.uiManager.showBossHUD(boss);
      window.uiManager.showBossIntro(boss);
      window.uiManager.showAlertBanner(`THỬ THÁCH: ${bossDef.name.toUpperCase()} — ${modifierId.toUpperCase()}`);
    }
    if (window.audioManager) {
      window.audioManager.setBGMIntensity(1.3);
      window.audioManager.playGong(0.5);
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
    if (game && game.currentBoss && game.currentBoss.isDead && game.state === 'PLAYING') {
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

    // Ghi vào SaveManager
    if (window.saveManager) {
      window.saveManager.recordBossBest(chal.bossDef.id, chal.modifierId, {
        cleared: true,
        rank,
        score,
        timeStr
      });
      window.saveManager.unlockAchievement('boss_challenger');
    }

    if (window.audioManager) {
      window.audioManager.playVictory();
    }

    // Hiển thị thông báo chiến thắng
    if (window.uiManager) {
      window.uiManager.showAlertBanner(`THẮNG THỬ THÁCH! HẠNG ${rank} — ${score.toLocaleString()} PTS`);
    }

    setTimeout(() => {
      if (window.uiManager) {
        window.uiManager.showTitleScreen();
      }
      this.showMenu();
    }, 2800);
  }
}

const bossRushManager = new BossRushManager();
window.BossRushManager = BossRushManager;
window.bossRushManager = bossRushManager;
