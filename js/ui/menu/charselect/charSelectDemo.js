/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/menu/charselect/charSelectDemo.js - Hat sang, combo demo va san khau vo dai.
 */

class MenuManagerCharSelectDemo extends window.MenuManagerCharSelectCore {
  initCsParticles() {
    const canvas = document.getElementById('cs-particles-canvas');
    if (!canvas || canvas._init) return;
    canvas._init = true;
    const ctx = canvas.getContext('2d');
    if (canvas._particlesInit) return;
    canvas._particlesInit = true;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const leaves = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      leaves.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 4 + Math.random() * 5,
        speedX: -0.5 - Math.random() * 0.8,
        speedY: 0.6 + Math.random() * 1.0,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: 0.015 * (Math.random() - 0.5),
        color: Math.random() > 0.4 ? 'rgba(255, 195, 60, 0.7)' : 'rgba(230, 80, 40, 0.6)'
      });
    }

    let rafActive = false;
    const canRun = () => {
      if (typeof document !== 'undefined' && document.hidden) return false;
      if (window.uiCore && window.uiCore.prefersReducedMotion()) return false;
      const modal = document.getElementById('char-select-modal');
      return !!(modal && !modal.classList.contains('hidden'));
    };

    const loop = () => {
      if (!canRun()) {
        rafActive = false;
        return;
      }
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
      requestAnimationFrame(loop);
    };

    const kickParticles = () => {
      if (!canRun()) { rafActive = false; return; }
      if (rafActive) return;
      rafActive = true;
      requestAnimationFrame(loop);
    };
    if (window.uiCore && typeof window.uiCore.onOverlayChange === 'function') {
      window.uiCore.onOverlayChange(kickParticles);
    }
    kickParticles();
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
            name: 'Thiết Cuốc Bạt Sơn & Tuyệt Kỹ Địa Chấn',
            moves: [
              { state: 'punch_straight', duration: 0.38, sound: 'swing' },
              { state: 'counter_hand_strike', duration: 0.42, sound: 'kiai_counter' },
              { state: 'kick_sweep', duration: 0.45, sound: 'kick' },
              { state: 'ultimate_slam', duration: 0.85, sound: 'kiai_ultimate' }
            ]
          }
        ];
      case 'dunghai':
        return [
          {
            name: 'Huyết Ảnh Song Đao & Loạn Vũ Huyễn Ảnh',
            moves: [
              { state: 'punch_straight', duration: 0.36, sound: 'swing' },
              { state: 'punch_hook', duration: 0.38, sound: 'swing' },
              { state: 'flying_kick', duration: 0.58, sound: 'kiai_kick' },
              { state: 'ultimate_feint', duration: 0.92, sound: 'kiai_ultimate' }
            ]
          }
        ];
      case 'bichlam':
        return [
          {
            name: 'Thần Phong Liên Hoàn & Cuồng Phong Phá Trận',
            moves: [
              { state: 'punch_straight', duration: 0.35, sound: 'swing' },
              { state: 'counter_leg_strike', duration: 0.44, sound: 'kiai_counter' },
              { state: 'flying_kick', duration: 0.54, sound: 'kiai_kick' },
              { state: 'ultimate_rush', duration: 0.95, sound: 'kiai_ultimate' }
            ]
          }
        ];
      case 'huavudai':
        return [
          {
            name: 'Hắc Long Quyền Trượng & Hỏa Ngục Gia Chủ',
            moves: [
              { state: 'kick_push', duration: 0.44, sound: 'kick' },
              { state: 'punch_straight', duration: 0.38, sound: 'swing' },
              { state: 'counter_hand_strike', duration: 0.40, sound: 'kiai_counter' },
              { state: 'ultimate_command', duration: 0.95, sound: 'kiai_ultimate' }
            ]
          }
        ];
      case 'giangmanh':
        return [
          {
            name: 'Hàn Băng Tuyệt Sát Kiếm',
            moves: [
              { state: 'punch_straight', duration: 0.35, sound: 'swing' },
              { state: 'boss_riposte', duration: 0.52, sound: 'swing' },
              { state: 'kick_roundhouse', duration: 0.48, sound: 'kick' },
              { state: 'ultimate_precision', duration: 0.98, sound: 'kiai_ultimate' }
            ]
          }
        ];
      case 'vananh':
        return [
          {
            name: 'Thiết Quyền Habana & Bão Đạn Hắc Kim',
            moves: [
              { state: 'punch_straight', duration: 0.36, sound: 'swing' },
              { state: 'counter_hand_strike', duration: 0.40, sound: 'kiai_counter' },
              { state: 'boss_bash', duration: 0.58, sound: 'swing' },
              { state: 'ultimate_barrage', duration: 1.05, sound: 'kiai_ultimate' }
            ]
          }
        ];
      case 'tiendang':
        return [
          {
            name: 'Thâu Tóm Liên Hoàn & Ám Sát Đa Chiều',
            moves: [
              { state: 'punch_straight', duration: 0.32, sound: 'swing' },
              { state: 'counter_leg_strike', duration: 0.42, sound: 'kiai_counter' },
              { state: 'flying_kick', duration: 0.54, sound: 'kiai_kick' },
              { state: 'ultimate_blink', duration: 0.92, sound: 'kiai_ultimate' }
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
    if (typeof this._kickCsStageLoop === 'function') this._kickCsStageLoop();
  }

  triggerCsStageDemo() {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    if (!slot || slot.isLocked) return;

    // Kích hoạt ngay chế độ sân khấu trực tiếp
    this._csLiveStageActive = true;
    this.updateWardrobeButtons();
    if (typeof this._kickCsStageLoop === 'function') this._kickCsStageLoop();

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
    const demoFx = window.EffectManager ? new window.EffectManager() : null;
    const demoCamera = { x: 0, y: 0, zoom: 1 };
    const dummy = {
      x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
      width: 48, height: 92, facing: 1,
      state: 'idle', stateTimer: 0, stateDuration: 0, animFrame: 0,
      characterId: 'nghi', charId: 'nghi', styleType: 'vovinam',
      vovinamSkin: false, equippedSkin: 'default', rageActive: false, isBoss: false, renderScale: 1.0,
      _prevDemoState: 'idle', _prevDemoP: 0
    };
    this._csDemoFx = demoFx;

    let stageRafActive = false;
    const canRunStage = () => {
      if (typeof document !== 'undefined' && document.hidden) return false;
      const modal = document.getElementById('char-select-modal');
      return !!(modal && !modal.classList.contains('hidden') && !canvas.classList.contains('hidden'));
    };

    const loop = (now) => {
      if (!canRunStage()) {
        stageRafActive = false;
        return;
      }
      {
        frame++;
        const dt = Math.min(0.05, Math.max(0.001, ((now || performance.now()) - lastTime) / 1000));
        lastTime = now || performance.now();
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
        if (slot && !slot.isLocked && window.skeletalRenderer) {
          const rawDemoEq = (window.saveManager && typeof window.saveManager.getEquippedSkin === 'function')
            ? window.saveManager.getEquippedSkin(slot.id)
            : ((slot.id !== 'nghi' && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(slot.id, 'vovinam')) ? 'vovinam' : 'default');
          const eqSkin = (slot.id === 'nghi' && rawDemoEq === 'vovinam') ? 'default' : (rawDemoEq || 'default');
          const isVovinam = eqSkin === 'vovinam';
          const isNamCheo = eqSkin === 'namcheo';
          const isHoXam = eqSkin === 'hoxam';
          const isHorrorChiTon = (eqSkin === 'thantrung' || eqSkin === 'chodoinon');
          const styleType = this.getStyleTypeForChar(slot.id);
          const accent = isNamCheo ? '#0ea5e9' : (isHoXam ? '#e2e8f0' : (isHorrorChiTon ? '#ef4444' : (isVovinam ? '#1e88e5' : (slot.color || '#d4a017'))));

          // Hào quang pháp trận võ đài dưới chân và sau lưng
          ctx.save();
          const pulse = 1 + Math.sin(frame * 0.05) * 0.04;
          const auraGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, 20, w * 0.5, h * 0.48, w * 0.45 * pulse);
          auraGrad.addColorStop(0, isNamCheo ? 'rgba(14, 165, 233, 0.42)' : (isHorrorChiTon ? 'rgba(220, 38, 38, 0.44)' : (isVovinam ? 'rgba(30, 136, 229, 0.36)' : `${accent}44`)));
          auraGrad.addColorStop(0.55, isNamCheo ? 'rgba(250, 204, 21, 0.16)' : (isHorrorChiTon ? 'rgba(37, 99, 235, 0.18)' : (isVovinam ? 'rgba(255, 213, 79, 0.14)' : `${accent}18`)));
          auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = auraGrad;
          ctx.fillRect(0, 0, w, h);

          // Vòng tròn Bát Quái / Âm Dương Vovinam xoay nhẹ phía sau lưng
          ctx.translate(w * 0.5, h * 0.44);
          ctx.rotate(frame * 0.006);
          ctx.strokeStyle = isNamCheo ? 'rgba(56, 189, 248, 0.42)' : (isHorrorChiTon ? 'rgba(239, 68, 68, 0.46)' : (isVovinam ? 'rgba(255, 213, 79, 0.32)' : 'rgba(255, 215, 110, 0.22)'));
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
          pedGrad.addColorStop(0, isNamCheo ? 'rgba(14, 165, 233, 0.52)' : (isHorrorChiTon ? 'rgba(220, 38, 38, 0.52)' : (isVovinam ? 'rgba(41, 182, 246, 0.45)' : 'rgba(255, 195, 65, 0.35)')));
          pedGrad.addColorStop(0.7, 'rgba(15, 22, 36, 0.65)');
          pedGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = pedGrad;
          ctx.beginPath();
          ctx.ellipse(w * 0.5, h * 0.84, 150, 26, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isNamCheo ? 'rgba(56, 189, 248, 0.65)' : (isHorrorChiTon ? 'rgba(248, 113, 113, 0.72)' : (isVovinam ? 'rgba(255, 213, 79, 0.55)' : 'rgba(255, 200, 80, 0.4)'));
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

          // Vẽ nhân vật kích thước chuẩn trên sân khấu trung tâm + hiệu ứng kỹ năng riêng
          ctx.save();
          const scale = 2.05;
          ctx.translate(w * 0.5, h * 0.82);
          ctx.scale(scale, scale);

          if (dummy.characterId !== slot.id || dummy.equippedSkin !== eqSkin) {
            dummy._trail = [];
            dummy._trail2 = [];
            dummy._clothWhip = 0;
            if (demoFx && typeof demoFx.clearSkillEffects === 'function') demoFx.clearSkillEffects();
          }
          if (dummy._prevDemoState !== animState) {
            dummy._prevDemoState = animState;
            dummy._prevDemoP = 0;
          }
          const curP = stateDuration > 0 ? Math.min(1, Math.max(0, stateTimer / stateDuration)) : 0;

          dummy.state = animState;
          dummy.stateTimer = stateTimer;
          dummy.stateDuration = stateDuration;
          dummy.animFrame = Math.floor(frame / 7) % 4;
          dummy.characterId = slot.id;
          dummy.charId = slot.id;
          dummy.styleType = styleType;
          dummy.vovinamSkin = isVovinam;
          dummy.namcheoSkin = isNamCheo;
          dummy.equippedSkin = eqSkin;
          dummy.rageActive = animState !== 'idle';
          dummy.isBoss = styleType.startsWith('boss_');
          dummy.vx = animState === 'ultimate_rush' || animState === 'flying_kick' ? 140 : 0;

          if (demoFx && animState !== 'idle' && stateDuration > 0 && window.CharacterRegistry && typeof window.CharacterRegistry.emitSkillVFX === 'function') {
            window.CharacterRegistry.emitSkillVFX(dummy, animState, dummy._prevDemoP, curP, demoFx, []);
          }
          dummy._prevDemoP = curP;

          if (demoFx) demoFx.update(dt);
          window.skeletalRenderer.render(ctx, dummy);
          if (demoFx) demoFx.renderWorld(ctx, demoCamera);
          ctx.restore();
        }
      }
      requestAnimationFrame(loop);
    };

    const kickStageLoop = () => {
      if (!canRunStage()) {
        stageRafActive = false;
        return;
      }
      if (stageRafActive) return;
      stageRafActive = true;
      lastTime = performance.now();
      requestAnimationFrame(loop);
    };
    this._kickCsStageLoop = kickStageLoop;
    if (window.uiCore && typeof window.uiCore.onOverlayChange === 'function') {
      window.uiCore.onOverlayChange(kickStageLoop);
    }
    kickStageLoop();
  }

}

window.MenuManagerCharSelectDemo = MenuManagerCharSelectDemo;
