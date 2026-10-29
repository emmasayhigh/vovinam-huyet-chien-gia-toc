/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/menu/charSelect.js - Chon nhan vat, skin, biểu diễn võ đài và triển khai.
 *
 * Gom: danh sach nhan vat, tab heroes/skins, demo combo, chapter map,
 * wardrobe va modal deployment.
 */

class MenuManagerCharSelect extends window.MenuManagerBase {
  // --------------------------------------------------------------------------
  // CHỌN NHÂN VẬT
  // --------------------------------------------------------------------------
  playableList() {
    return Object.values(window.CHARACTERS || {}).filter((c) => c.playable);
  }

  isUnlocked(id) {
    if (id === 'nghi') return true;
    if (id === 'coming_soon') return false;
    return window.saveManager ? window.saveManager.isCharacterUnlocked(id) : false;
  }

  cycleChar(direction) {
    const curIdx = window.CHAR_SLOTS.findIndex(s => s.id === this.selectedChar);
    let nextIdx = curIdx + direction;
    if (nextIdx < 0) nextIdx = window.CHAR_SLOTS.length - 1;
    if (nextIdx >= window.CHAR_SLOTS.length) nextIdx = 0;
    this.selectedChar = window.CHAR_SLOTS[nextIdx].id;
    this.refreshCharSelect();
  }

  initCsParticles() {
    const canvas = document.getElementById('cs-particles-canvas');
    if (!canvas || canvas._init) return;
    canvas._init = true;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const leaves = [];
    const count = 30;
    for (let i = 0; i < count; i++) {
      leaves.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 5 + Math.random() * 8,
        speedX: -0.6 - Math.random() * 1.2,
        speedY: 0.8 + Math.random() * 1.5,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: 0.02 * (Math.random() - 0.5),
        color: Math.random() > 0.4 ? 'rgba(255, 195, 60, 0.75)' : 'rgba(230, 80, 40, 0.65)'
      });
    }

    const loop = () => {
      const modal = document.getElementById('char-select-modal');
      if (modal && !modal.classList.contains('hidden')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < leaves.length; i++) {
          const l = leaves[i];
          l.x += l.speedX;
          l.y += l.speedY;
          l.rot += l.rotSpeed;
          if (l.y > canvas.height + 20) { l.y = -20; l.x = Math.random() * canvas.width + 100; }
          if (l.x < -30) { l.x = canvas.width + 30; }

          ctx.save();
          ctx.translate(l.x, l.y);
          ctx.rotate(l.rot);
          ctx.fillStyle = l.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, l.size, l.size * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  getStyleTypeForChar(charId) {
    const cObj = (window.CHARACTERS || {})[charId];
    if (cObj && cObj.styleType) return cObj.styleType;
    const fallback = {
      nghi: 'player',
      bichlam: 'boss_bichlam',
      huavudai: 'npc_huavudai',
      dinhan: 'boss_dinhan',
      hoanganh: 'boss_hoanganh',
      dunghai: 'boss_dunghai',
      giangmanh: 'boss_giangmanh'
    };
    return fallback[charId] || 'player';
  }

  getSkinsForChar(slot) {
    if (!slot || slot.isLocked) return [];

    // Ngô Nhất Nghị mặc định đã khoác Lam Võ Phục Vovinam nên chỉ có 1 trang phục chuẩn
    if (slot.id === 'nghi') {
      return [
        {
          id: 'default',
          name: 'Lam Võ Phục Chính Thống',
          tier: 'MẶC ĐỊNH • VIỆT VÕ ĐẠO',
          badgeClass: 'vovinam',
          image: slot.image,
          fx: ['Lam Võ Phục', 'Hoàng Đai Vovinam', 'Đòn Chân Kẹp'],
          sub: 'Võ phục Vovinam truyền thống kèm phù hiệu Việt Võ Đạo — Trang phục chuẩn của Ngô Nhất Nghị'
        }
      ];
    }

    const defaultSkinTitles = {
      bichlam: {
        name: 'Thanh Phong Thiết Quyền',
        sub: 'Võ phục lục chiến không tay kèm băng quấn cổ tay chiến thuật',
        fx: ['Lục Chiến Y', 'Thần Phong Trảo']
      },
      huavudai: {
        name: 'Âu Phục Ông Trùm',
        sub: 'Bộ vest đen thêu rồng quyền lực kết hợp trượng đầu rồng bạc',
        fx: ['Âu Phục Hắc Long', 'Thiết Trượng']
      },
      dinhan: {
        name: 'Thiết Giáp Chùy Vương',
        sub: 'Chiến giáp Phụng Hoàng, Chùy Gai Càn Quét & Khiên Hỏa Liên',
        fx: ['Chiến Giáp Đỏ', 'Chùy Gai & Khiên']
      },
      hoanganh: {
        name: 'Sơn Cước Thiết Cuốc',
        sub: 'Võ phục sơn trang dã chiến cùng Thiết Cuốc Càn Quét hạng nặng',
        fx: ['Sơn Trang Y', 'Thiết Cuốc Bạt Sơn']
      },
      dunghai: {
        name: 'Huyết Ảnh Song Đao',
        sub: 'Dạ hành phục sát thủ khăn đỏ cùng cặp Song Đoản Đao sắc bén',
        fx: ['Dạ Hành Giáp', 'Song Đoản Đao']
      },
      giangmanh: {
        name: 'Hàn Băng Kiếm Chủ',
        sub: 'Trường bào tông chủ thêu bạc cùng Hàn Băng Đao tuyệt sát',
        fx: ['Trường Bào Bạc', 'Hàn Băng Đao']
      }
    };
    const defMeta = defaultSkinTitles[slot.id] || {
      name: 'Trang Phục Mặc Định',
      sub: 'Ngoại hình và vũ khí nguyên bản theo cốt truyện',
      fx: ['Nguyên Bản']
    };
    return [
      {
        id: 'default',
        name: defMeta.name,
        tier: 'MẶC ĐỊNH',
        badgeClass: 'default',
        image: slot.image,
        fx: defMeta.fx || ['Nguyên Bản'],
        sub: defMeta.sub
      },
      {
        id: 'vovinam',
        name: 'Võ Phục Vovinam Chính Thống',
        tier: 'BẬC A • VIỆT VÕ ĐẠO',
        badgeClass: 'vovinam',
        image: slot.vovinamImage || slot.image,
        fx: ['Lam Võ Phục', 'Phù Hiệu Vovinam', 'Thế Tấn Võ Đạo'],
        sub: 'Lam Võ Phục thêu Kim Long kèm phù hiệu Vovinam — Thi triển Cương Nhu Phối Triển chuẩn Việt Võ Đạo'
      }
    ];
  }

  switchCsTab(tab) {
    this.activeCsTab = tab === 'skins' ? 'skins' : 'heroes';
    const tabHeroes = document.getElementById('btn-cs-tab-heroes');
    const tabSkins = document.getElementById('btn-cs-tab-skins');
    if (tabHeroes) tabHeroes.classList.toggle('active', this.activeCsTab === 'heroes');
    if (tabSkins) tabSkins.classList.toggle('active', this.activeCsTab === 'skins');

    if (this.charGrid) this.charGrid.classList.toggle('hidden', this.activeCsTab !== 'heroes');
    if (this.skinGrid) this.skinGrid.classList.toggle('hidden', this.activeCsTab !== 'skins');

    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    const colTitle = document.getElementById('cs-col-left-title') || document.querySelector('.cs-col-title');
    if (colTitle) {
      if (this.activeCsTab === 'skins') {
        colTitle.textContent = `TRANG PHỤC — ${slot ? slot.slotName : ''}`;
      } else {
        colTitle.textContent = this.isCampaignMode ? 'CHỌN NHÂN VẬT XUẤT TRẬN' : 'DANH SÁCH VÕ SĨ';
      }
    }
    this.renderSkinGrid();
    this.updateWardrobeButtons();
  }

  renderSkinGrid() {
    if (!this.skinGrid) return;
    this.skinGrid.innerHTML = '';
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    if (!slot) return;

    const isVovinam = slot.id !== 'nghi' && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(slot.id, 'vovinam');
    const equippedSkinId = isVovinam ? 'vovinam' : 'default';
    const skins = this.getSkinsForChar(slot);

    const skinCountBadge = document.getElementById('cs-tab-skin-count');
    if (skinCountBadge) {
      skinCountBadge.textContent = String(skins.length);
    }

    if (slot.isLocked || skins.length === 0) {
      this.skinGrid.innerHTML = `<div class="cs-skin-empty">Nhân vật này chưa mở khóa trang phục.</div>`;
      return;
    }

    skins.forEach((sk) => {
      const isSelected = equippedSkinId === sk.id;
      const card = document.createElement('div');
      card.className = 'cs-skin-card' + (isSelected ? ' selected' : '');
      const fxHtml = (sk.fx || []).map(tag => `<span class="cs-skin-fx-chip">${tag}</span>`).join('');
      card.innerHTML = `
        <div class="cs-skin-art-wrap">
          ${sk.image ? `<img class="cs-skin-card-img" src="${sk.image}" alt="${sk.name}">` : ''}
          <span class="cs-skin-tier-ribbon ${sk.badgeClass}">${sk.tier}</span>
        </div>
        <div class="cs-skin-info">
          <div>
            <div class="cs-skin-title">${sk.name}</div>
            <div class="cs-skin-desc">${sk.sub}</div>
          </div>
          ${fxHtml ? `<div class="cs-skin-fx-list">${fxHtml}</div>` : ''}
          <span class="cs-skin-status-pill">${isSelected ? '✔ ĐANG TRANG BỊ' : 'NHẤN ĐỂ TRANG BỊ'}</span>
        </div>`;

      card.addEventListener('click', () => {
        this.click();
        this._csStageDemoTimer = 0;
        this._csStageDemoState = null;
        this.setWardrobeSkin(sk.id);
      });

      this.skinGrid.appendChild(card);
    });
  }

  getDemoCombos(charId) {
    switch (charId) {
      case 'dinhan':
        return [
          {
            name: 'Liên Hoàn Khiên Kích & Trọng Chùy',
            moves: [
              { state: 'punch_straight', duration: 0.38, sound: 'swing' },
              { state: 'overhead_smash', duration: 0.58, sound: 'swing' },
              { state: 'boss_bash', duration: 0.65, sound: 'kiai_counter' }
            ]
          },
          {
            name: 'Kim Cang Phản Kích Vạn Quân',
            moves: [
              { state: 'guard', duration: 0.42, sound: 'guard' },
              { state: 'boss_riposte', duration: 0.52, sound: 'swing' },
              { state: 'ultimate_bash', duration: 0.88, sound: 'kiai_ultimate' }
            ]
          }
        ];
      case 'hoanganh':
        return [
          {
            name: 'Thiết Cuốc Bạt Sơn Khai Thạch',
            moves: [
              { state: 'punch_straight', duration: 0.38, sound: 'swing' },
              { state: 'boss_swing', duration: 0.55, sound: 'swing' },
              { state: 'kick_sweep', duration: 0.45, sound: 'kick' },
              { state: 'boss_slam', duration: 0.70, sound: 'kiai_ultimate' }
            ]
          }
        ];
      case 'dunghai':
        return [
          {
            name: 'Huyết Ảnh Song Đao Trảm',
            moves: [
              { state: 'boss_stab', duration: 0.42, sound: 'swing' },
              { state: 'punch_hook', duration: 0.38, sound: 'swing' },
              { state: 'flying_kick', duration: 0.58, sound: 'kiai_kick' },
              { state: 'uppercut', duration: 0.52, sound: 'swing' }
            ]
          }
        ];
      case 'bichlam':
        return [
          {
            name: 'Thần Phong Liên Hoàn Quyền Trảo',
            moves: [
              { state: 'punch_straight', duration: 0.35, sound: 'swing' },
              { state: 'punch_hook', duration: 0.35, sound: 'swing' },
              { state: 'elbow_strike', duration: 0.42, sound: 'swing' },
              { state: 'kick_roundhouse', duration: 0.52, sound: 'kiai_kick' }
            ]
          }
        ];
      case 'huavudai':
        return [
          {
            name: 'Hắc Long Quyền Trượng',
            moves: [
              { state: 'kick_push', duration: 0.42, sound: 'kick' },
              { state: 'punch_straight', duration: 0.38, sound: 'swing' },
              { state: 'boss_stab', duration: 0.52, sound: 'swing' },
              { state: 'boss_taunt', duration: 0.68, sound: 'kiai_ultimate' }
            ]
          }
        ];
      case 'giangmanh':
        return [
          {
            name: 'Hàn Băng Tuyệt Sát Kiếm',
            moves: [
              { state: 'punch_straight', duration: 0.35, sound: 'swing' },
              { state: 'boss_swing', duration: 0.52, sound: 'swing' },
              { state: 'kick_roundhouse', duration: 0.48, sound: 'kick' },
              { state: 'boss_stab', duration: 0.62, sound: 'kiai_ultimate' }
            ]
          }
        ];
      default: // Ngô Nhất Nghị ('nghi') & Vovinam chuẩn
        return [
          {
            name: 'Chuỗi Quyền Cước Vovinam Khởi Khí',
            moves: [
              { state: 'punch_straight', duration: 0.35, sound: 'swing' },
              { state: 'punch_hook', duration: 0.35, sound: 'swing' },
              { state: 'kick_roundhouse', duration: 0.46, sound: 'kick' },
              { state: 'flying_kick', duration: 0.58, sound: 'kiai_kick' }
            ]
          },
          {
            name: 'Đòn Chân Kẹp Cổ & Phản Đòn Vovinam',
            moves: [
              { state: 'guard', duration: 0.38, sound: 'guard' },
              { state: 'elbow_strike', duration: 0.42, sound: 'swing' },
              { state: 'kick_sweep', duration: 0.42, sound: 'kick' },
              { state: 'scissor_kick', duration: 0.75, sound: 'kiai_scissor' }
            ]
          },
          {
            name: 'Tuyệt Kỹ Sấm Sét Long Hổ Xuất Sơn',
            moves: [
              { state: 'punch_straight', duration: 0.30, sound: 'swing' },
              { state: 'uppercut', duration: 0.42, sound: 'swing' },
              { state: 'ultimate_flurry', duration: 1.15, sound: 'kiai_ultimate' }
            ]
          }
        ];
    }
  }

  _playDemoMoveSound(sound, charId) {
    if (!window.audioManager) return;
    try {
      if (sound === 'swing') {
        window.audioManager.playSwing();
      } else if (sound === 'kick') {
        window.audioManager.playKick();
      } else if (sound === 'guard') {
        window.audioManager.playBlock();
      } else if (sound === 'kiai_kick') {
        window.audioManager.playKick();
        if (typeof window.audioManager.playVovinamKiai === 'function') {
          window.audioManager.playVovinamKiai('kick', charId);
        }
      } else if (sound === 'kiai_scissor') {
        window.audioManager.playSwing();
        if (typeof window.audioManager.playVovinamKiai === 'function') {
          window.audioManager.playVovinamKiai('scissor', charId);
        }
      } else if (sound === 'kiai_counter') {
        window.audioManager.playPunch();
        if (typeof window.audioManager.playVovinamKiai === 'function') {
          window.audioManager.playVovinamKiai('counter', charId);
        }
      } else if (sound === 'kiai_ultimate') {
        window.audioManager.playPunch();
        if (typeof window.audioManager.playVovinamKiai === 'function') {
          window.audioManager.playVovinamKiai('ultimate', charId);
        }
      }
    } catch (_) {}
  }

  toggleCsStageView() {
    this._csLiveStageActive = !this._csLiveStageActive;
    if (this._csLiveStageActive) {
      this.showToast('ĐÃ BẬT VÕ ĐÀI 3D VÕ THUẬT ⚡');
    } else {
      this._csCurrentMove = null;
      this._csActiveDemoQueue = [];
      this._csMoveTimer = 0;
      this.showToast('ĐÃ CHUYỂN SANG TRANH VẼ NGHỆ THUẬT 🎨');
    }
    this.updateWardrobeButtons();
  }

  triggerCsStageDemo() {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    if (!slot || slot.isLocked) return;

    // Kích hoạt ngay chế độ sân khấu trực tiếp
    this._csLiveStageActive = true;
    this.updateWardrobeButtons();

    const combos = this.getDemoCombos(slot.id);
    const comboIdx = (this._csStageDemoComboIdx || 0) % combos.length;
    const combo = combos[comboIdx];
    this._csStageDemoComboIdx = comboIdx + 1;

    this._csActiveDemoQueue = combo.moves.map(m => Object.assign({}, m));
    this._csCurrentMove = this._csActiveDemoQueue.shift();
    this._csMoveTimer = 0;
    this._playDemoMoveSound(this._csCurrentMove.sound, slot.id);

    const demoBtn = document.getElementById('btn-cs-demo-move');
    if (demoBtn) {
      demoBtn.textContent = `⚡ ĐANG THI TRIỂN: ${combo.name.toUpperCase()}`;
      demoBtn.classList.add('playing');
    }
    this.showToast(`🥋 BIỂU DIỄN: ${combo.name}`);
  }

  initCsSkinStageCanvas() {
    const canvas = document.getElementById('cs-hero-skin-canvas');
    if (!canvas || canvas._stageLoopInit) return;
    canvas._stageLoopInit = true;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let lastTime = performance.now();

    const loop = (now) => {
      const modal = document.getElementById('char-select-modal');
      if (modal && !modal.classList.contains('hidden') && !canvas.classList.contains('hidden')) {
        frame++;
        const dt = Math.min(0.05, Math.max(0.001, ((now || performance.now()) - lastTime) / 1000));
        lastTime = now || performance.now();
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
        if (slot && !slot.isLocked && window.skeletalRenderer) {
          const isVovinam = window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(slot.id, 'vovinam');
          const styleType = this.getStyleTypeForChar(slot.id);
          const accent = isVovinam ? '#1e88e5' : (slot.color || '#d4a017');

          // Hào quang pháp trận võ đài dưới chân và sau lưng
          ctx.save();
          const pulse = 1 + Math.sin(frame * 0.05) * 0.04;
          const auraGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, 20, w * 0.5, h * 0.48, w * 0.45 * pulse);
          auraGrad.addColorStop(0, isVovinam ? 'rgba(30, 136, 229, 0.36)' : `${accent}44`);
          auraGrad.addColorStop(0.55, isVovinam ? 'rgba(255, 213, 79, 0.14)' : `${accent}18`);
          auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = auraGrad;
          ctx.fillRect(0, 0, w, h);

          // Vòng tròn Bát Quái / Âm Dương Vovinam xoay nhẹ phía sau lưng
          ctx.translate(w * 0.5, h * 0.44);
          ctx.rotate(frame * 0.006);
          ctx.strokeStyle = isVovinam ? 'rgba(255, 213, 79, 0.32)' : 'rgba(255, 215, 110, 0.22)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 148, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([12, 10]);
          ctx.beginPath();
          ctx.arc(0, 0, 164, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();

          // Bệ đá võ đài dưới chân
          ctx.save();
          const pedGrad = ctx.createRadialGradient(w * 0.5, h * 0.84, 10, w * 0.5, h * 0.84, 155);
          pedGrad.addColorStop(0, isVovinam ? 'rgba(41, 182, 246, 0.45)' : 'rgba(255, 195, 65, 0.35)');
          pedGrad.addColorStop(0.7, 'rgba(15, 22, 36, 0.65)');
          pedGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = pedGrad;
          ctx.beginPath();
          ctx.ellipse(w * 0.5, h * 0.84, 150, 26, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isVovinam ? 'rgba(255, 213, 79, 0.55)' : 'rgba(255, 200, 80, 0.4)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(w * 0.5, h * 0.84, 128, 19, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // Xử lý tiến trình đòn thế combo mượt mà (Combo Animation State Machine)
          let animState = 'idle';
          let stateTimer = frame * 0.02;
          let stateDuration = 0;

          if (this._csCurrentMove) {
            this._csMoveTimer += dt;
            animState = this._csCurrentMove.state;
            stateTimer = this._csMoveTimer;
            stateDuration = this._csCurrentMove.duration;

            if (this._csMoveTimer >= this._csCurrentMove.duration) {
              if (this._csActiveDemoQueue && this._csActiveDemoQueue.length > 0) {
                this._csCurrentMove = this._csActiveDemoQueue.shift();
                this._csMoveTimer = 0;
                this._playDemoMoveSound(this._csCurrentMove.sound, slot.id);
              } else {
                this._csCurrentMove = null;
                this._csMoveTimer = 0;
                const demoBtn = document.getElementById('btn-cs-demo-move');
                if (demoBtn) {
                  demoBtn.textContent = '⚡ BIỂU DIỄN ĐÒN THẾ TIẾP THEO';
                  demoBtn.classList.remove('playing');
                }
              }
            }
          }

          // Vẽ nhân vật kích thước chuẩn trên sân khấu trung tâm (không bao giờ biến mất!)
          ctx.save();
          const scale = 2.05;
          ctx.translate(w * 0.5, h * 0.82);
          ctx.scale(scale, scale);

          const dummy = {
            x: 0,
            y: 0,
            width: 48,
            height: 92,
            facing: 1,
            state: animState,
            stateTimer: stateTimer,
            stateDuration: stateDuration,
            animFrame: Math.floor(frame / 7) % 4,
            characterId: slot.id,
            charId: slot.id,
            styleType: styleType,
            vovinamSkin: isVovinam,
            rageActive: animState !== 'idle',
            isBoss: styleType.startsWith('boss_'),
            renderScale: 1.0
          };
          window.skeletalRenderer.render(ctx, dummy);
          ctx.restore();
        }
      } else {
        lastTime = now || performance.now();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  refreshCharSelect() {
    this.initCsParticles();
    this.initCsSkinStageCanvas();
    if (!this.charGrid) return;
    this.charGrid.innerHTML = '';

    window.CHAR_SLOTS.forEach((slot) => {
      const unlocked = this.isUnlocked(slot.id);
      const isSelected = this.selectedChar === slot.id;
      const card = document.createElement('div');
      card.className = 'cs-card' +
        (unlocked ? '' : ' locked') +
        (isSelected ? ' selected' : '');

      card.innerHTML = `
        <div class="cs-card-thumb-wrap">
          ${slot.image ? `<img class="cs-card-img" src="${slot.image}" alt="${slot.slotName}">` : `<div class="cs-card-lock-icon"><span>🔒</span></div>`}
          ${!unlocked && slot.image ? `<div class="cs-card-lock-icon"><span>🔒</span></div>` : ''}
        </div>
        <div class="cs-card-banner">
          <span class="cs-card-name">${slot.slotName}</span>
        </div>
        <span class="cs-card-element">${slot.element}</span>`;

      card.addEventListener('click', () => {
        this.click();
        this.selectedChar = slot.id;
        this._csCurrentMove = null;
        this._csActiveDemoQueue = [];
        this._csMoveTimer = 0;
        const demoBtn = document.getElementById('btn-cs-demo-move');
        if (demoBtn) {
          demoBtn.textContent = '⚡ BIỂU DIỄN ĐÒN THẾ';
          demoBtn.classList.remove('playing');
        }
        this.refreshCharSelect();
        if (slot.isLocked) {
          this.showToast('NHÂN VẬT SẮP RA MẮT!');
        } else if (!unlocked) {
          const orig = (window.CHARACTERS || {})[slot.id];
          this.showToast('CHƯA MỞ KHÓA: ' + (orig ? this.lockText(orig) : 'Cần vượt màn chơi'));
        }
      });

      this.charGrid.appendChild(card);
    });

    this.renderSkinGrid();
    this.renderCharDetail();
    this.refreshAllySelector();
  }

  lockText(c) {
    if (!c || !c.unlock) return 'CHƯA MỞ KHÓA';
    if (c.unlock.type === 'stage') return 'HOÀN THÀNH MÀN ' + c.unlock.stage;
    return c.unlock.text || 'CHƯA MỞ KHÓA';
  }

  renderCharDetail() {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    if (!slot) return;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('char-detail-name', slot.fullName || slot.slotName);
    set('char-detail-title', slot.title);
    set('char-detail-tagline', slot.tagline);
    set('char-detail-bio', slot.bio);
    set('char-detail-quote', slot.quote);
    set('char-detail-mechanic', slot.mechanic);

    // Cập nhật ảnh toàn thân theo Trang Phục đang chọn và ánh sáng hào quang trung tâm
    const isVovinam = slot.id !== 'nghi' && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(slot.id, 'vovinam');
    const targetHeroImg = (isVovinam && slot.vovinamImage) ? slot.vovinamImage : slot.image;
    const heroImg = document.getElementById('cs-hero-img');
    if (heroImg) {
      if (targetHeroImg) {
        heroImg.style.display = 'block';
        heroImg.style.opacity = '0.35';
        heroImg.src = targetHeroImg;
        heroImg.dataset.currentSrc = targetHeroImg;
        setTimeout(() => { heroImg.style.opacity = '1'; }, 60);
      } else {
        heroImg.style.display = 'none';
      }
    }
    const ambient = document.getElementById('cs-hero-ambient');
    if (ambient) {
      ambient.style.background = `radial-gradient(circle, ${slot.color}44 0%, ${slot.color}11 45%, transparent 70%)`;
    }

    // 4 Thanh chỉ số chiến đấu dạng thanh vàng óng ánh (như mockup)
    const statsContainer = document.getElementById('char-detail-stats');
    if (statsContainer) {
      statsContainer.innerHTML = '';
      const statLabels = [
        { label: 'Sức mạnh', val: slot.stats.power },
        { label: 'Tốc độ', val: slot.stats.speed },
        { label: 'Kháng cự', val: slot.stats.defense },
        { label: 'Kỹ thuật', val: slot.stats.technique }
      ];
      statLabels.forEach(st => {
        const row = document.createElement('div');
        row.className = 'cs-stat-row';
        row.innerHTML = `
          <span class="cs-stat-label">${st.label}</span>
          <div class="cs-stat-track">
            <div class="cs-stat-fill" style="width: 0%"></div>
          </div>`;
        statsContainer.appendChild(row);
        setTimeout(() => {
          const fill = row.querySelector('.cs-stat-fill');
          if (fill) fill.style.width = st.val + '%';
        }, 50);
      });
    }

    // 4 Huy hiệu Kỹ Năng Đặc Biệt
    const skillsBadges = document.getElementById('cs-skills-badges');
    if (skillsBadges && slot.skills) {
      skillsBadges.innerHTML = '';
      slot.skills.forEach(sk => {
        const b = document.createElement('div');
        b.className = 'cs-skill-badge';
        b.title = `${sk.name}: ${sk.desc}`;
        b.innerHTML = `<span class="cs-skill-ico">${sk.icon}</span>`;
        b.addEventListener('click', () => {
          this.showToast(`${sk.name}: ${sk.desc}`);
        });
        skillsBadges.appendChild(b);
      });
    }

    // Cập nhật trạng thái nút CHỌN
    const startBtn = document.getElementById('btn-char-start');
    if (startBtn) {
      const confirmText = startBtn.querySelector('.cs-confirm-text');
      const unlocked = this.isUnlocked(slot.id);
      if (slot.isLocked) {
        if (confirmText) confirmText.textContent = 'SẮP RA MẮT';
        startBtn.classList.add('disabled');
      } else if (!unlocked) {
        if (confirmText) confirmText.textContent = 'CHƯA MỞ KHÓA';
        startBtn.classList.add('disabled');
      } else {
        if (confirmText) confirmText.textContent = this.isCampaignMode ? 'XUẤT TRẬN' : 'LƯU THIẾT LẬP 🥋';
        startBtn.classList.remove('disabled');
      }
    }
    this.updateWardrobeButtons();
    this.updateDeploymentSkinButtons();
  }

  openCharSelect(targetStage = null) {
    this.hideAll();
    this._csCurrentMove = null;
    this._csActiveDemoQueue = [];
    this._csMoveTimer = 0;
    const demoBtn = document.getElementById('btn-cs-demo-move');
    if (demoBtn) {
      demoBtn.textContent = '⚡ BIỂU DIỄN ĐÒN THẾ';
      demoBtn.classList.remove('playing');
    }
    this.isCampaignMode = (targetStage !== null && targetStage !== undefined);
    this.deploymentTargetStage = (targetStage !== null && targetStage !== undefined)
      ? targetStage
      : ((window.saveManager && window.saveManager.data.currentStage) || 1);

    const indicator = document.getElementById('cs-stage-indicator');
    const motto = document.getElementById('cs-top-motto');
    const stageTitleText = document.getElementById('cs-stage-title-text');
    const startBtn = document.getElementById('btn-char-start');
    const confirmText = startBtn ? startBtn.querySelector('.cs-confirm-text') : null;
    const colTitle = document.querySelector('.cs-col-title');

    if (this.isCampaignMode) {
      if (indicator) indicator.classList.remove('hidden');
      if (motto) motto.classList.add('hidden');
      const meta = (window.STORY_META && window.STORY_META.stages) ? window.STORY_META.stages[this.deploymentTargetStage] : null;
      const sTitle = meta ? meta.title : `MÀN ${this.deploymentTargetStage}`;
      if (stageTitleText) stageTitleText.textContent = sTitle;
      if (confirmText) confirmText.textContent = 'XUẤT TRẬN';
      if (colTitle) colTitle.textContent = 'CHỌN NHÂN VẬT XUẤT TRẬN';
    } else {
      if (indicator) indicator.classList.add('hidden');
      if (motto) motto.classList.remove('hidden');
      if (confirmText) confirmText.textContent = 'LƯU THIẾT LẬP 🥋';
      if (colTitle) colTitle.textContent = 'XEM NHÂN VẬT & VÕ PHỤC';
    }

    this.refreshCharSelect();
    this.refreshAllySelector();
    if (this.charModal) this.charModal.classList.remove('hidden');
  }

  refreshAllySelector() {
    const pillsContainer = document.getElementById('cs-ally-pills');
    const nameLabel = document.getElementById('cs-ally-selected-name');
    if (!pillsContainer) return;
    pillsContainer.innerHTML = '';

    const alliesList = [
      { id: 'auto', name: 'Tự Động', fullName: 'Tự Động Theo Cốt Truyện', icon: '⭐', isSpecial: true, styleType: 'player' },
      { id: 'bichlam', name: 'Bích Lâm', fullName: 'Đình Bích Lâm (Mãnh Tướng Bến Cảng)', icon: '🦅', styleType: 'boss_bichlam' },
      { id: 'hoanganh', name: 'Hoàng Anh', fullName: 'Phó Đặng Hoàng Anh (Thần Cước Trấn Sơn)', icon: '⛰️', styleType: 'boss_hoanganh' },
      { id: 'dunghai', name: 'Dung Hải', fullName: 'Phó Dung Hải (Song Đao Sát Thủ)', icon: '⚔️', styleType: 'boss_dunghai' },
      { id: 'dinhan', name: 'Đình An', fullName: 'Triệu Đình An (Cận Vệ Thiết Bích)', icon: '🛡️', styleType: 'boss_dinhan' },
      { id: 'huavudai', name: 'Hứa Vũ Đại', fullName: 'Hứa Vũ Đại (Ông Trùm Mạng Lưới)', icon: '💼', styleType: 'npc_huavudai' },
      { id: 'mocdang', name: 'Mộc Đăng', fullName: 'Phó Mộc Đăng (Kiến Trúc Sư Hack EMP)', icon: '💻', isSpecial: true, styleType: 'npc_mocdang' },
      { id: 'none', name: 'Độc Hành', fullName: 'Không Mang Viện Trợ', icon: '👤', isSpecial: true, styleType: null }
    ];

    const currentSelected = (window.saveManager && window.saveManager.data && window.saveManager.data.selectedAlly) 
      || (window.allyManager && window.allyManager.selectedAllyId) 
      || 'auto';
    const selObj = alliesList.find(a => a.id === currentSelected) || alliesList[0];
    if (nameLabel) nameLabel.textContent = selObj.fullName || selObj.name;

    alliesList.forEach(a => {
      const isSpecial = a.isSpecial;
      const unlocked = isSpecial || (window.saveManager && window.saveManager.data.allyAvailability && window.saveManager.data.allyAvailability[a.id]);
      const isSelected = (currentSelected === a.id);

      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'cs-ally-pill-btn' + (isSelected ? ' active' : '') + (unlocked ? '' : ' locked');
      
      // Khung chứa Avatar Chân Dung vẽ canvas
      const avatarWrap = document.createElement('div');
      avatarWrap.className = 'cs-ally-avatar-wrap';
      
      if (a.styleType && window.skeletalRenderer) {
        const cvs = document.createElement('canvas');
        cvs.width = 32;
        cvs.height = 32;
        cvs.className = 'cs-ally-avatar-canvas';
        try {
          window.skeletalRenderer.drawPortrait(cvs, a.styleType);
        } catch (_) {
          cvs.style.display = 'none';
        }
        avatarWrap.appendChild(cvs);
      } else {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'cs-ally-icon';
        iconSpan.textContent = a.icon;
        avatarWrap.appendChild(iconSpan);
      }
      pill.appendChild(avatarWrap);

      const textSpan = document.createElement('span');
      textSpan.className = 'cs-ally-name';
      textSpan.textContent = a.name;
      pill.appendChild(textSpan);

      pill.title = (a.fullName || a.name) + (unlocked ? '' : ' — Chưa kết giao (Vượt cốt truyện để mở)');

      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        this.click();
        if (!unlocked) {
          this.showToast('ĐỒNG MINH CHƯA KẾT GIAO — Vượt thêm cốt truyện để mở khóa!');
          return;
        }
        if (window.saveManager) {
          window.saveManager.setSelectedAlly(a.id);
        }
        if (window.allyManager) {
          window.allyManager.selectedAllyId = a.id;
          window.allyManager.updateHUD();
        }
        this.refreshAllySelector();
        this.showToast(`Đã chọn viện trợ: ${a.fullName || a.name}`);
      });

      pillsContainer.appendChild(pill);
    });
  }

  showDeploymentModal(targetStage = 1) {
    this.openCharSelect(targetStage);
  }

  startSelected() {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar);
    if (!slot || slot.isLocked) {
      this.showToast('NHÂN VẬT CHƯA SẴN SÀNG!');
      return;
    }
    if (!this.isUnlocked(slot.id)) {
      const orig = (window.CHARACTERS || {})[slot.id];
      this.showToast('CHƯA MỞ KHÓA: ' + (orig ? this.lockText(orig) : 'Cần vượt màn chơi'));
      return;
    }
    if (window.saveManager) {
      window.saveManager.data.selectedCharacter = this.selectedChar;
      window.saveManager.persist();
    }
    if (this.isCampaignMode) {
      this.hideAll();
      const stageToStart = this.deploymentTargetStage || (window.saveManager && window.saveManager.data.currentStage) || 1;
      if (window.game) {
        window.game.startStage(stageToStart);
      }
    } else {
      this.showToast(`Đã lưu thiết lập: ${slot.fullName || slot.slotName}`);
      this.hideAll();
      if (window.uiManager) window.uiManager.showTitleScreen();
    }
  }

  // --------------------------------------------------------------------------
  // BẢN ĐỒ CHƯƠNG (HỒI I - V)
  // --------------------------------------------------------------------------
  showChapterMap() {
    if (!this.chapterList) return;
    this.chapterList.innerHTML = '';
    const meta = window.STORY_META;
    if (!meta) return;

    meta.acts.forEach((act) => {
      const actEl = document.createElement('div');
      actEl.className = 'act-block';
      const head = document.createElement('div');
      head.className = 'act-head';
      head.innerHTML = `<span class="act-code"></span><span class="act-title"></span><span class="act-desc"></span>`;
      head.querySelector('.act-code').textContent = act.code;
      head.querySelector('.act-title').textContent = act.title;
      head.querySelector('.act-desc').textContent = act.desc;
      actEl.appendChild(head);

      act.stages.forEach((sid) => {
        const s = meta.stages[sid];
        if (!s) return;
        const unlocked = window.saveManager ? window.saveManager.isStageUnlocked(sid) : sid === 1;
        const done = window.saveManager ? window.saveManager.data.completedStages.includes(sid) : false;
        const bestRec = (window.saveManager && typeof window.saveManager.getStageBest === 'function')
          ? window.saveManager.getStageBest(sid)
          : null;

        const card = document.createElement('div');
        card.className = 'stage-row' + (unlocked ? '' : ' locked') + (done ? ' done' : '');
        card.innerHTML = `
          <span class="stage-index">M${s.id}</span>
          <span class="stage-main-info">
            <span class="stage-title"></span>
            <span class="stage-mission"></span>
          </span>
          ${bestRec ? `<span class="stage-rank-badge rank-${bestRec.rank}">${bestRec.rank} (${bestRec.score.toLocaleString()}đ)</span>` : ''}
          <span class="stage-flags"></span>`;
        card.querySelector('.stage-title').textContent = s.title;
        card.querySelector('.stage-mission').textContent = s.mission || '';
        const flags = [];
        if (s.type === 'side') flags.push('NHIỆM VỤ PHỤ');
        if (s.choice) flags.push('CÓ LỰA CHỌN');
        if (s.boss) flags.push('BOSS');
        if (done) flags.push('ĐÃ QUA');
        if (!unlocked) flags.push('KHÓA');
        card.querySelector('.stage-flags').textContent = flags.join(' · ');
        card.addEventListener('click', () => {
          this.click();
          if (!unlocked) { this.showToast('MÀN NÀY ĐANG KHÓA — hoàn thành màn trước đã'); return; }
          this.showDeploymentModal(sid);
        });
        actEl.appendChild(card);
      });
      this.chapterList.appendChild(actEl);
    });

    this.mapModal.classList.remove('hidden');
  }



  setWardrobeSkin(skinType) {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    if (slot && slot.id === 'nghi') {
      skinType = 'default';
    }
    if (window.saveManager && typeof window.saveManager.setSkinEquipped === 'function') {
      window.saveManager.setSkinEquipped(this.selectedChar, skinType);
    }
    // Xóa cache style để trang phục mới được dựng lại ngay (trong menu lẫn trong trận)
    if (window.skeletalRenderer) window.skeletalRenderer._styles = {};
    this.renderSkinGrid();
    this.updateWardrobeButtons();
    if (slot && slot.id === 'nghi') {
      this.showToast('Ngô Nhất Nghị mặc định đã khoác Lam Võ Phục Vovinam Chính Thống 🥋');
    } else {
      this.showToast(skinType === 'vovinam' ? 'Đã trang bị: Võ Phục Vovinam Chính Thống 🥋' : 'Đã trang bị: Trang Phục Mặc Định 👘');
    }
  }

  // Doi vo phuc ngay trong modal deployment (nut cu bi thieu method nay).
  setDeploymentSkin(skinType) {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    if ((slot && slot.id === 'nghi') || (slot && slot.isLocked)) {
      skinType = 'default';
    }
    if (window.saveManager && typeof window.saveManager.setSkinEquipped === 'function') {
      window.saveManager.setSkinEquipped(this.selectedChar, skinType);
    }
    if (window.skeletalRenderer) window.skeletalRenderer._styles = {};
    this.updateDeploymentSkinButtons();
    this.updateWardrobeButtons();
    this.showToast(skinType === 'vovinam'
      ? 'Đã trang bị: Võ Phục Vovinam Chính Thống 🥋'
      : 'Đã trang bị: Trang Phục Mặc Định 👘');
  }

  updateDeploymentSkinButtons() {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    const isNghi = !!(slot && slot.id === 'nghi');
    const isVovinam = !isNghi && window.saveManager &&
      typeof window.saveManager.isSkinEquipped === 'function' &&
      window.saveManager.isSkinEquipped(this.selectedChar, 'vovinam');
    const defBtn = document.getElementById('btn-deploy-skin-default');
    const vovBtn = document.getElementById('btn-deploy-skin-vovinam');
    if (!defBtn || !vovBtn) return;
    defBtn.classList.toggle('active', !isVovinam);
    vovBtn.classList.toggle('active', !!isVovinam);
    vovBtn.classList.toggle('hidden', isNghi || !slot || !!slot.isLocked);
  }

  updateWardrobeButtons() {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    const isNghi = slot && slot.id === 'nghi';
    const isVovinam = !isNghi && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(this.selectedChar, 'vovinam');
    const defBtn = document.getElementById('btn-cs-skin-default');
    const vovBtn = document.getElementById('btn-cs-skin-vovinam');
    if (defBtn && vovBtn) {
      if (isNghi) {
        defBtn.textContent = 'Lam Võ Phục Vovinam (Mặc Định) 🥋';
        defBtn.classList.add('active');
        vovBtn.classList.remove('active');
        vovBtn.classList.add('hidden');
      } else {
        defBtn.textContent = 'Mặc Định';
        vovBtn.classList.toggle('hidden', !slot || !!slot.isLocked);
        if (isVovinam) {
          defBtn.classList.remove('active');
          vovBtn.classList.add('active');
        } else {
          defBtn.classList.add('active');
          vovBtn.classList.remove('active');
        }
      }
    }

    const skins = slot ? this.getSkinsForChar(slot) : [];
    const activeSkin = skins.find(s => s.id === (isVovinam ? 'vovinam' : 'default')) || skins[0];

    const skinCountBadge = document.getElementById('cs-tab-skin-count');
    if (skinCountBadge) {
      skinCountBadge.textContent = String(skins.length);
    }

    const tierTag = document.getElementById('cs-skin-tier-tag');
    const stageName = document.getElementById('cs-skin-stage-name');
    if (tierTag && activeSkin) {
      tierTag.textContent = activeSkin.tier;
      tierTag.classList.toggle('vovinam-tier', isVovinam || isNghi);
    }
    if (stageName && activeSkin) {
      stageName.textContent = activeSkin.name.toUpperCase();
    }

    // Cập nhật hình vẽ minh họa toàn thân (#cs-hero-img) và Võ Đài 3D (#cs-hero-skin-canvas)
    const heroImg = document.getElementById('cs-hero-img');
    const skinCanvas = document.getElementById('cs-hero-skin-canvas');
    const demoBtn = document.getElementById('btn-cs-demo-move');
    const viewToggleBtn = document.getElementById('btn-cs-view-toggle');
    const targetHeroImg = activeSkin && activeSkin.image ? activeSkin.image : (slot ? slot.image : '');

    if (demoBtn) {
      demoBtn.classList.toggle('hidden', !slot || !!slot.isLocked);
    }
    if (viewToggleBtn) {
      viewToggleBtn.classList.toggle('hidden', !slot || !!slot.isLocked);
      viewToggleBtn.textContent = this._csLiveStageActive ? '🎨 TRANH NGHỆ THUẬT' : '⚡ VÕ ĐÀI 3D';
    }
    if (skinCanvas && heroImg) {
      if (this._csLiveStageActive) {
        skinCanvas.classList.remove('hidden');
        heroImg.style.display = 'none';
      } else {
        skinCanvas.classList.add('hidden');
        if (targetHeroImg) {
          heroImg.style.display = 'block';
          heroImg.style.opacity = '1';
          if (heroImg.dataset.currentSrc !== targetHeroImg) {
            heroImg.src = targetHeroImg;
            heroImg.dataset.currentSrc = targetHeroImg;
          }
        } else {
          heroImg.style.display = 'none';
        }
      }
    }
  }

  confirmDeployment() {
    if (!window.game) return;
    if (window.saveManager) {
      window.saveManager.data.selectedCharacter = this.selectedChar;
      window.saveManager.persist();
    }
    this.hideAll();
    window.game.startStage(this.deploymentTargetStage || 1);
  }
}

window.MenuManagerCharSelect = MenuManagerCharSelect;
