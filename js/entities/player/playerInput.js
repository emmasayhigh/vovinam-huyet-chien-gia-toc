/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/player/playerInput.js - Doc phim, combo, ne, counter va dieu khien.
 */

(function () {
class PlayerInput extends window.PlayerUltimate {
  handlePlayerInput(enemies) {
    if (window.game && window.game._onlinePauseOpen) return;
    const input = window.input;
    if (!input) return;

    // Nội tại hủy chiêu đặc trưng theo nhân vật (VD: Phó Dung Hải — Hư Ảnh Biến Ảo)
    if (window.CharacterRegistry && window.CharacterRegistry.tryInputCancel(this, input)) {
      return;
    }

    // Không nhận lệnh điều khiển mới khi đang chịu hồi phục (landing, counter recovery), bị thương, bể thủ hay đang bắt đòn
    if (['landing', 'guard_break', 'counter_hand_prep', 'counter_leg_prep', 'counter_hand_recovery', 'counter_leg_recovery', 'counter_hand_strike', 'counter_leg_strike', 'hurt', 'knockdown', 'getup', 'scissor_kick'].includes(this.state)) {
      if (this.state === 'guard_break') {
        input.consumeBufferedAction('Space');
        input.consumeBufferedAction('KeyJ');
        input.consumeBufferedAction('KeyK');
        input.consumeBufferedAction('KeyL');
        input.consumeBufferedAction('KeyU');
        input.consumeBufferedAction('KeyI');
        return;
      }
      if (this.state === 'landing') {
        // Nếu đòn đá/đấm trên không ĐÃ TRÚNG ĐÍCH (hit-confirm) hoặc nhân vật miễn khựng hụt chiêu:
        // Sau nhịp tiếp đất đĩnh đạc (0.08s), người chơi được quyền hủy landing ngay lập tức khi di chuyển hoặc tung đòn tiếp
        if (this.kickHasHit || this.airPunchHasHit || this.noWhiffStun) {
          const wantsMove = input.moveLeft || input.moveRight || input.moveUp || input.moveDown;
          const wantsAction = input.peek('KeyJ') || input.peek('KeyK') || input.peek('KeyL') || input.peek('Space') || input.peek('KeyI') || input.peek('KeyU');
          if (this.stateTimer >= 0.08 && (wantsMove || wantsAction)) {
            this.setState(wantsMove ? (input.run ? 'run' : 'walk') : 'idle');
            this.kickHasHit = false;
            this.airPunchHasHit = false;
            // Cho phép tiếp tục luồng xử lý bên dưới để thực thi ngay đòn đánh / di chuyển
          } else {
            return;
          }
        } else {
          // Whiff (đánh hụt): phạt sơ hở, tiêu thụ phím trong buffer để không bypass recovery
          input.consumeBufferedAction('Space');
          input.consumeBufferedAction('KeyJ');
          input.consumeBufferedAction('KeyK');
          return;
        }
      } else {
        if (['counter_hand_recovery', 'counter_leg_recovery'].includes(this.state)) {
          input.consumeBufferedAction('Space');
          input.consumeBufferedAction('KeyJ');
          input.consumeBufferedAction('KeyK');
        }
        return;
      }
    }

    // --- Trên không ---
    if (this.z < -1) {
      const mx = (input.moveRight ? 1 : 0) - (input.moveLeft ? 1 : 0);
      if (mx) {
        this.facing = mx;
        this.vx = mx * this.speed * 1.1;
      }
      // Nếu đang trong đòn đánh trên không (flying_kick hoặc air_punch), không nhận lệnh mới hoặc ghi đè hoạt ảnh nhảy
      if (this.state === 'flying_kick' || this.state === 'air_punch') {
        input.consumeBufferedAction('Space');
        input.consumeBufferedAction('KeyJ');
        input.consumeBufferedAction('KeyK');
        return;
      }

      // Xử lý thứ tự ưu tiên và chống spam cho Space + J và Space + K trên không
      const hasBufferedJ = input.peek('KeyJ');
      const hasBufferedK = input.peek('KeyK');

      if (hasBufferedJ || hasBufferedK) {
        const jTime = input.lastKeyDownTime['KeyJ'] || 0;
        const kTime = input.lastKeyDownTime['KeyK'] || 0;

        // Nếu cả 2 phím cùng xuất hiện trong buffer, ưu tiên phím bấm sau (hoặc Space+K nếu cùng thời điểm)
        const preferKick = (hasBufferedK && !hasBufferedJ) || (hasBufferedK && hasBufferedJ && kTime >= jTime);

        if (preferKick) {
          if (this.kickCooldown <= 0) {
            input.consumeBufferedAction('KeyK');
            input.consumeBufferedAction('KeyJ'); // Tiêu thụ đòn còn lại tránh kích hoạt chồng chéo
            this.kickCooldown = 0.6; // Chống spam Space + K liên tục
            this.kickHasHit = false;
            this.lastAerialAttack = 'flying_kick';
            this.vx = this.facing * 460;
            this.vz = Math.max(this.vz, 60);
            if (window.audioManager) {
              window.audioManager.playWhoosh();
              if (typeof window.audioManager.playVovinamKiai === 'function') {
                window.audioManager.playVovinamKiai('kick', this.characterId || 'nghi');
              }
            }
            this.setState('flying_kick', 0.55);
            this.spendStamina('flying_kick');
            return;
          } else {
            input.consumeBufferedAction('KeyK');
          }
        } else {
          if (this.airPunchCooldown <= 0) {
            input.consumeBufferedAction('KeyJ');
            input.consumeBufferedAction('KeyK');
            this.airPunchCooldown = 0.5; // Chống spam Space + J liên tục (0.5s cooldown)
            this.airPunchHasHit = false;
            this.lastAerialAttack = 'air_punch';
            this.vx = this.facing * 340;
            this.vz = Math.min(this.vz, 40);
            if (window.audioManager) {
              window.audioManager.playWhoosh();
              if (typeof window.audioManager.playVovinamKiai === 'function') {
                window.audioManager.playVovinamKiai('kick', this.characterId || 'nghi');
              }
            }
            if (window.effectManager) window.effectManager.addGhostTrail(this, 'rgba(255, 255, 255, 0.35)');
            this.setState('air_punch', 0.38);
            this.spendStamina('air_punch');
            return;
          } else {
            input.consumeBufferedAction('KeyJ');
          }
        }
      }

      if (this.state !== 'jump_up' && this.state !== 'jump_fall') this.setState('jump_up');
      this.setState(this.vz > 0 ? 'jump_up' : 'jump_fall');
      return;
    }

    // ===== U + J: PHẢN ĐÒN TAY VOVINAM (COUNTER TAY) =====
    // Cửa sổ 0.32s, đỡ được cả đấm lẫn đá, hồi chiêu 2.5s
    if (input.consumeCounterHand()) {
      if (this.counterHandCooldown <= 0) {
        this.startCounter('hand', 0.32, 2.5);
        return;
      } else {
        if (this.attackClock - this._lastCounterWarnAt > 0.45) {
          this._lastCounterWarnAt = this.attackClock;
          if (window.effectManager) {
            window.effectManager.addFloatingText('COUNTER TAY ĐANG HỒI! (' + this.counterHandCooldown.toFixed(1) + 's)', this.x, this.y - 150, 'stale');
          }
        }
      }
    }

    // ===== U + K: PHẢN ĐÒN CHÂN VOVINAM (COUNTER CHÂN) =====
    // Cửa sổ 0.32s, đỡ được cả đấm lẫn đá, hồi chiêu 3.5s
    if (input.consumeCounterLeg()) {
      if (this.counterLegCooldown <= 0) {
        this.startCounter('leg', 0.32, 3.5);
        return;
      } else {
        if (this.attackClock - this._lastCounterWarnAt > 0.45) {
          this._lastCounterWarnAt = this.attackClock;
          if (window.effectManager) {
            window.effectManager.addFloatingText('COUNTER CHÂN ĐANG HỒI! (' + this.counterLegCooldown.toFixed(1) + 's)', this.x, this.y - 150, 'stale');
          }
        }
      }
    }

    // ===== W + U: CHIÊU ĐẶC TRƯNG THEO THẾ (STANCE SPECIAL) =====
    const nowMs = performance.now();
    const isHoldingUp = input.moveUp || (nowMs - ((input.lastKeyDownTime && input.lastKeyDownTime['KeyW']) || 0) < 220) || (nowMs - ((input.lastKeyDownTime && input.lastKeyDownTime['ArrowUp']) || 0) < 220);
    const isHoldingDown = input.moveDown || (nowMs - ((input.lastKeyDownTime && input.lastKeyDownTime['KeyS']) || 0) < 220) || (nowMs - ((input.lastKeyDownTime && input.lastKeyDownTime['ArrowDown']) || 0) < 220);
    const uPressed = (typeof input.isJustPressed === 'function' && input.isJustPressed('KeyU')) ||
                     (typeof input.isActionJustPressed === 'function' && input.isActionJustPressed('block'));
    const holdingJK = (typeof input.isDown === 'function' && (input.isDown('KeyJ') || input.isDown('KeyK'))) ||
                      !!(input.keys && (input.keys['KeyJ'] || input.keys['KeyK']));
    if (isHoldingUp && uPressed && !holdingJK) {
      if (typeof input.consumeBufferedAction === 'function') input.consumeBufferedAction('KeyU');
      if (input.justPressed) input.justPressed['KeyU'] = false;
      if ((this.stanceSkillCooldown || 0) <= 0) {
        if (window.CharacterRegistry && window.CharacterRegistry.tryStanceSpecial(this, enemies)) {
          return;
        }
      } else if (this.attackClock - (this._lastCounterWarnAt || -99) > 0.45) {
        this._lastCounterWarnAt = this.attackClock;
        if (window.effectManager) {
          window.effectManager.addFloatingText('CHIÊU W+U ĐANG HỒI! (' + this.stanceSkillCooldown.toFixed(1) + 's)', this.x, this.y - 150, 'stale');
        }
      }
    }

    // --- Tuyệt kỹ (I): mỗi nhân vật một tuyệt kỹ riêng ---
    if (input.ultimate && this.maxEnergy > 0 && this.energy >= this.maxEnergy) {
      if (window.trainingManager) window.trainingManager.recordAction('ultimate_hit');
      if (window.tutorialManager) window.tutorialManager.recordAction('ultimate_hit');
      this.consumeEnergy(this.maxEnergy);
      if (window.audioManager) {
        window.audioManager.playUltimateBurst();
        if (typeof window.audioManager.playVovinamKiai === 'function') {
          window.audioManager.playVovinamKiai('ultimate', this.finisher === 'scissor' ? 'nghi' : (this.characterId || 'nghi'));
        }
      }
      const meta = window.CharacterRegistry
        ? window.CharacterRegistry.getUltimateCinematic(this.charId, this)
        : { title: 'NGÔ NHẤT NGHỊ', ult: 'LONG HỔ XUẤT SƠN', color: '#00f0ff', accent: '#ffd700', style: 'lightning', duration: 1.4 };
      if (window.effectManager) {
        window.effectManager.triggerUltimateCinematic(meta.title, meta.ult, meta.color, meta.accent, meta.style);
        window.effectManager.addFloatingText('⚡ ' + meta.ult + '!', this.x, this.y - 180, 'ultimate');
      }
      this._ultFlags = 0;
      this._ultData = {};
      this._ultStep = 0;
      this._ultHitDone = false;
      this._ultInit = false;
      this.hitTargets.clear();
      const st = this.ultimateState || 'ultimate_flurry';
      const ultDur = meta.duration || 1.3;
      this.setAuraArmor('white', ultDur + 0.2); // Hào quang Trắng Bất Hoại bảo hộ hoàn toàn trong lúc tung Tuyệt Kỹ
      this.setState(st, ultDur);
      return;
    }

    // --- Né tránh (L): hồi chiêu 8.0s, i-frame theo nhân vật, chống spam triệt để ---
    if (input.isJustPressed('KeyL') || input.peek('KeyL')) {
      input.consumeBufferedAction('KeyL');
      if (input.justPressed) input.justPressed['KeyL'] = false;
      if (this.dodgeCooldown > 0) {
        if (this.attackClock - this._lastDodgeWarnAt > 0.5) {
          this._lastDodgeWarnAt = this.attackClock;
          if (window.effectManager) {
            window.effectManager.addFloatingText('NÉ ĐANG HỒI CHIÊU! (' + this.dodgeCooldown.toFixed(1) + 's)', this.x, this.y - 140, 'stale');
          }
        }
        return;
      }
      this.dodgeCooldown = this.maxDodgeCooldown; // 8.0s hồi chiêu chuẩn trung tâm
      const mx = (input.moveRight ? 1 : 0) - (input.moveLeft ? 1 : 0);
      const dir = mx !== 0 ? mx : -this.facing;
      const dodgeCtx = { dodgeSpeed: 440, dir };
      if (window.CharacterRegistry) {
        window.CharacterRegistry.onDodge(this, dodgeCtx);
      }

      this.vx = (dodgeCtx.dir || dir) * dodgeCtx.dodgeSpeed;
      this.squashTimer = 0.16;
      this.squashType = 'stretch';
      if (window.audioManager) window.audioManager.playDodge();
      this.setState('dodge', 0.28);
      // Thời gian bất tử i-frame: cơ bản 0.18s, tăng thêm theo nội tại nhân vật
      this.invincibleTimer = 0.18 * (this.dodgeIframeMul || 1);
      return;
    }

    // --- Nhảy ---
    if (input.jump) {
      this.vz = this.jumpForce;
      this.z = -0.5;
      this.squashTimer = 0.15;
      this.squashType = 'stretch';
      this.setState('jump_up');
      if (window.audioManager) window.audioManager.playWhoosh();
      if (window.effectManager) window.effectManager.createDust(this.x, this.y, 6);
      return;
    }

    // --- Đấm / Đá theo chuỗi combo ---
    const exhausted = this.exhaustTimer > 0;
    const pressedJ = input.punch && !exhausted;
    const canKick = this.kickCooldown <= 0;
    const pressedK = input.kick && !exhausted && canKick;

    // Phản hồi rõ ràng khi cố đá lúc chân đang trong thời gian hồi chiêu
    if (input.kick && !exhausted && !canKick && this.state === 'idle') {
      if (this.attackClock - this._lastKickWarnAt > 0.55) {
        this._lastKickWarnAt = this.attackClock;
        if (window.effectManager) {
          window.effectManager.addFloatingText('HỒI CHÂN!', this.x, this.y - 140, 'stale');
        }
      }
    }

    // ===== ĐÒN VŨ KHÍ NHẶT ĐƯỢC (nếu đang cầm vũ khí) =====
    if (this.weapon && window.weaponSystem) {
      if (pressedK) {
        if (window.weaponSystem.startPlayerAttack(this, 'heavy')) return;
      }
      if (pressedJ) {
        if (window.weaponSystem.startPlayerAttack(this, 'light')) return;
      }
    }

    // ===== ĐÒN NỐI SAU KHI NÉ (L → J / L → K) =====
    if (this._dodgeFollowupTimer > 0 && (pressedJ || pressedK) && !isHoldingUp && !isHoldingDown && !input.run) {
      const followBtn = pressedK ? 'K' : 'J';
      this._isCrossComboHit = (this._prevComboBtn !== null && this._prevComboBtn !== followBtn);
      this._prevComboBtn = followBtn;
      if (window.CharacterRegistry && window.CharacterRegistry.tryDodgeFollowup(this, followBtn, enemies)) {
        this._dodgeFollowupTimer = 0;
        return;
      }
    }

    // ===== ĐÒN THẾ VOVINAM MỞ RỘNG (giữ hướng Lên/Xuống + phím đòn) =====

    // 1. Đấm Móc Lên (giữ ↑/W + J): móc xoáy từ dưới hất tung đối thủ lên không, quật ngã (Knockdown)
    if (pressedJ && isHoldingUp) {
      if (window.trainingManager) window.trainingManager.recordAction('uppercut');
      if (window.tutorialManager) window.tutorialManager.recordAction('uppercut');
      this.comboStep = 0;
      this._isCrossComboHit = false;
      this._prevComboBtn = 'J';
      this.startAttack('uppercut', 0.52, 130);
      if (window.audioManager) window.audioManager.playHeavyHit();
      if (window.effectManager) {
        const isNamCheoUppercut = (this.charId === 'bichlam' && this.equippedSkin === 'namcheo');
        const upName = isNamCheoUppercut
          ? '🐊 CÁ SẤU ĐỎ MŨI ĐỚP MỒI'
          : ((window.CharacterRegistry && window.CharacterRegistry.getSkillMoveLabel)
            ? window.CharacterRegistry.getSkillMoveLabel(this, 'uppercut', 'ĐẤM MÓC LÊN')
            : 'ĐẤM MÓC LÊN');
        window.effectManager.addFloatingText((isNamCheoUppercut ? '' : '💥 ') + upName + '!', this.x, this.y - 150, 'crit');
        window.effectManager.addGhostTrail(this, isNamCheoUppercut ? 'rgba(239, 68, 68, 0.55)' : 'rgba(56, 189, 248, 0.5)');
        window.effectManager.createEnergySparks(this.x + this.facing * 20, this.y - 70, 8);
      }
      return;
    }

    // Đòn Tiến Công W + K: Vovinam áp sát kẹp cổ (scissor_kick), hoặc chiêu tiến W+K riêng từng nhân vật (giữ nguyên hitbox & sát thương chuẩn)
    // Cân bằng PvP & Boss: Không cho phép kẹp cổ (scissor_kick) lên Boss hoặc đối thủ Online PvP (RemotePlayer)
    const isOnlinePvP = !!(window.onlineManager && window.onlineManager.isActive && window.onlineManager.mode === 'pvp');
    if (pressedK && isHoldingUp) {
      if (this.finisher === 'scissor' && !isOnlinePvP) {
        const near = this.findClosestEnemy(enemies, 130 * this.reachMul);
        if (near && !near.isBoss && !near.isRemotePlayer) {
          if (window.trainingManager) window.trainingManager.recordAction('combo_finished');
          if (window.tutorialManager) window.tutorialManager.recordAction('combo_finished');
          this.comboStep = 0;
          this._isCrossComboHit = false;
          this._prevComboBtn = 'K';
          this.grabbedTarget = near;
          this.scissorHitDone = false;
          this.vz = 330;
          this.vx = this.facing * 160;
          if (window.audioManager) window.audioManager.playWhoosh();
          if (window.effectManager) {
            window.effectManager.addFloatingText('🥋 ĐÒN CHÂN KẸP VOVINAM!', this.x, this.y - 170, 'crit');
            window.effectManager.createShockRing(this.x, this.y, '#00d2ff');
          }
          this.setState('scissor_kick', 0.7);
          this.spendStamina('scissor_kick');
          return;
        }
      }
      if (window.trainingManager) window.trainingManager.recordAction('kick');
      if (window.tutorialManager) window.tutorialManager.recordAction('kick');
      this.comboStep = 0;
      this._isCrossComboHit = false;
      this._prevComboBtn = 'K';
      this.startAttack('kick_push', 0.52, 110);
      this._moveVariant = 'wk';
      if (window.effectManager) {
        const wkName = (window.CharacterRegistry && window.CharacterRegistry.getSkillMoveLabel)
          ? window.CharacterRegistry.getSkillMoveLabel(this, 'wk', 'TIẾN CƯỚC')
          : 'TIẾN CƯỚC';
        window.effectManager.addFloatingText('⚡ ' + wkName + '!', this.x, this.y - 150, 'dodge');
      }
      return;
    }

    // 2. Đánh Chỏ Phá Thủ (giữ ↓/S + J): áp sát cực gần, PHÁ PHÒNG THỦ (Unblockable & Guard Break)
    if (pressedJ && isHoldingDown) {
      if (window.trainingManager) window.trainingManager.recordAction('punch');
      if (window.tutorialManager) window.tutorialManager.recordAction('punch');
      this.comboStep = 0;
      this._isCrossComboHit = false;
      this._prevComboBtn = 'J';
      this.startAttack('elbow_strike', 0.46, 95);
      if (window.audioManager) window.audioManager.playPunchHit();
      if (window.effectManager) {
        const elbowName = (window.CharacterRegistry && window.CharacterRegistry.getSkillMoveLabel)
          ? window.CharacterRegistry.getSkillMoveLabel(this, 'elbow_strike', 'ĐÁNH CHỎ PHÁ THỦ')
          : 'ĐÁNH CHỎ PHÁ THỦ';
        window.effectManager.addFloatingText('⚡ ' + elbowName + '!', this.x, this.y - 150, 'warn');
        window.effectManager.createShockRing(this.x + this.facing * 35, this.y - 65, '#f59e0b');
        window.effectManager.createHitSparks(this.x + this.facing * 40, this.y - 70, 10, true);
      }
      return;
    }

    // 3. Quét Trụ (giữ ↓/S + K): đòn chân thấp quật ngã, xuyên thủ, hồi lâu nếu đánh hụt
    if (pressedK && isHoldingDown) {
      if (window.trainingManager) window.trainingManager.recordAction('sweep');
      if (window.tutorialManager) window.tutorialManager.recordAction('sweep');
      this.comboStep = 0;
      this._isCrossComboHit = false;
      this._prevComboBtn = 'K';
      this.startAttack('kick_sweep', 0.66, 85);
      if (window.audioManager) window.audioManager.playWhoosh();
      if (window.effectManager) {
        const sweepName = (window.CharacterRegistry && window.CharacterRegistry.getSkillMoveLabel)
          ? window.CharacterRegistry.getSkillMoveLabel(this, 'kick_sweep', 'QUÉT TRỤ HẠ ĐỐI THỦ')
          : 'QUÉT TRỤ HẠ ĐỐI THỦ';
        window.effectManager.addFloatingText('🌪️ ' + sweepName + '!', this.x, this.y - 140, 'crit');
        window.effectManager.createDust(this.x + this.facing * 40, this.y, 14, 50);
      }
      return;
    }
    // Lao Tới Đấm Móc (Shift + J): đòn áp sát tầm xa, quật ngã
    if (pressedJ && input.run) {
      if (window.trainingManager) window.trainingManager.recordAction('dash_punch');
      if (window.tutorialManager) window.tutorialManager.recordAction('dash_punch');
      this.comboStep = 0;
      this._isCrossComboHit = false;
      this._prevComboBtn = 'J';
      this.startAttack('hook_run', 0.48, 310);
      return;
    }

    if (pressedJ) {
      if (window.trainingManager) window.trainingManager.recordAction('punch');
      if (window.tutorialManager) window.tutorialManager.recordAction('punch');
      this._isCrossComboHit = (this.comboWindowTimer > 0 && this._prevComboBtn === 'K');
      this._prevComboBtn = 'J';
      const n = this.comboStep;
      const max = Math.max(3, this.comboMax);
      if (n === 0 || n >= max) {
        this.comboStep = 1;
        this.startAttack('punch_straight', 0.34, 120);
      } else if (n === 1) {
        this.comboStep = 2;
        this.startAttack('punch_hook', 0.42, 140);
      } else {
        // Chuỗi dài hơn (Bích Lâm): thêm đòn móc trước khi chốt
        this.comboStep = n + 1;
        this.startAttack(n >= 3 ? 'punch_hook' : 'punch_straight', 0.42, 140);
      }
      return;
    }

    if (pressedK) {
      if (window.trainingManager) window.trainingManager.recordAction('kick');
      if (window.tutorialManager) window.tutorialManager.recordAction('kick');
      this._isCrossComboHit = (this.comboWindowTimer > 0 && this._prevComboBtn === 'J');
      this._prevComboBtn = 'K';
      const n = this.comboStep;
      const near = this.findClosestEnemy(enemies, 95 * this.reachMul);
      // FINISHER: chốt hạ chuỗi combo khi đã nối 2 đòn và ở cự ly gần (không kẹp cổ Boss hoặc đối thủ Online PvP)
      const isScissor = (this.finisher === 'scissor');
      const canFinish = n >= 2 && near && (!isScissor || (!isOnlinePvP && !near.isBoss && !near.isRemotePlayer));
      if (canFinish) {
        if (window.trainingManager) window.trainingManager.recordAction('combo_finished');
        if (window.tutorialManager) window.tutorialManager.recordAction('combo_finished');
        this.comboStep = 0;
        if (isScissor) {
          // Đòn chân kẹp biểu diễn của Ngô Nhất Nghị (boss không bị kẹp)
          this.grabbedTarget = near;
          this.scissorHitDone = false;
          this.vz = 330;
          this.vx = this.facing * 160;
          if (window.audioManager) window.audioManager.playWhoosh();
          this.setState('scissor_kick', 0.7);
          this.spendStamina('scissor_kick');
          return;
        }
        this.doFinisher();
        return;
      }
      if (n === 0) {
        this.comboStep = 1;
        this.startAttack('kick_push', 0.52, 110);
      } else {
        if (window.trainingManager) window.trainingManager.recordAction('combo_finished');
        if (window.tutorialManager) window.tutorialManager.recordAction('combo_finished');
        this.comboStep = n >= 2 ? 0 : 2;
        this.startAttack('kick_roundhouse', 0.6, 150);
      }
      return;
    }

    // --- Di chuyển ---
    const prevFacing = this.facing;
    let moveX = 0, moveY = 0;
    if (input.moveLeft) { moveX -= 1; this.facing = -1; }
    if (input.moveRight) { moveX += 1; this.facing = 1; }
    if (input.moveUp) moveY -= 0.85;
    if (input.moveDown) moveY += 0.85;

    const isRunning = input.run && moveX !== 0;
    // Phản hồi quán tính đổi hướng (Pivot Turnaround Dust & Squash nhẹ)
    if (moveX !== 0 && this.facing !== prevFacing && Math.abs(this.vx) > 90) {
      this.squashTimer = 0.10;
      this.squashType = 'land';
      if (window.effectManager) window.effectManager.createDust(this.x - this.facing * 12, this.y, 5, 22);
      if (window.audioManager) window.audioManager.playFootstep();
    }

    // Trong chế độ Đấu Võ 1v1 (Martial Duel): giữ thế đối diện Boss khi đi bộ/lùi
    const isDuel = window.game && window.game.combatMode === 'DUEL' && window.game.currentBoss && !window.game.currentBoss.isDead;
    if (isDuel && !isRunning) {
      const boss = window.game.currentBoss;
      const dX = boss.x - this.x;
      const dY = boss.y - this.y;
      if (Math.abs(dX) < 320 && Math.abs(dY) < 90) {
        this.facing = (dX >= 0) ? 1 : -1;
      }
    }

    // --- Đỡ đòn (giữ U): thủ thế tại chỗ, giảm 80% sát thương khi bị đánh (giới hạn 5-7 đòn liên tiếp) ---
    if (input.block) {
      if (this.state === 'guard_break' || this.guardBreakTimer > 0) {
        return; // Đang bị bể thủ, không thể đỡ!
      }
      if (this.guardGauge <= 10) {
        if (this.attackClock - this._lastGuardWarnAt > 0.6) {
          this._lastGuardWarnAt = this.attackClock;
          if (window.effectManager) {
            window.effectManager.addFloatingText('KHIÊN ĐÃ VỠ — ĐANG HỒI PHỤC!', this.x, this.y - 140, 'stale');
          }
        }
        return;
      }
      this.vx = 0;
      this.vy = 0;
      this.setState('guard');
      return;
    }

    const spd = isRunning ? this.runSpeed : this.speed;

    if (moveX !== 0 || moveY !== 0) {
      if (window.trainingManager) window.trainingManager.recordAction('move');
      this.vx = moveX * spd;
      this.vy = moveY * spd * 0.7;
      this.setState(isRunning ? 'run' : 'walk');
      if (isRunning && Math.random() < 0.2 && window.effectManager) window.effectManager.createDust(this.x, this.y, 2);
      this.stepTimer = (this.stepTimer || 0) + 1;
      if (this.stepTimer % (isRunning ? 14 : 22) === 0 && window.audioManager) window.audioManager.playFootstep();
    } else {
      this.setState('idle');
    }
  }

}

window.PlayerInput = PlayerInput;
})();
