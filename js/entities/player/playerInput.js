/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/player/playerInput.js - Doc phim, combo, ne, counter va dieu khien.
 */

(function () {
class PlayerInput extends window.PlayerUltimate {
  handlePlayerInput(enemies) {
    const input = window.input;
    if (!input) return;

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
        // Nếu đòn đá/đấm trên không ĐÃ TRÚNG ĐÍCH (hit-confirm):
        // Sau nhịp tiếp đất đĩnh đạc (0.08s), người chơi được quyền hủy landing ngay lập tức khi di chuyển hoặc tung đòn tiếp
        if (this.kickHasHit || this.airPunchHasHit) {
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
    // Cửa sổ 0.22s, hồi chiêu 2.5s, độc lập với thứ tự bấm U hay J
    if (input.consumeCounterHand()) {
      if (this.counterHandCooldown <= 0) {
        this.startCounter('hand', 0.22, 2.5);
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
    // Cửa sổ 0.22s, hồi chiêu 3.5s, độc lập với thứ tự bấm U hay K
    if (input.consumeCounterLeg()) {
      if (this.counterLegCooldown <= 0) {
        this.startCounter('leg', 0.22, 3.5);
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

    // --- Tuyệt kỹ (I): mỗi nhân vật một tuyệt kỹ riêng ---
    if (input.ultimate && this.energy >= this.maxEnergy) {
      if (window.trainingManager) window.trainingManager.recordAction('ultimate_hit');
      if (window.tutorialManager) window.tutorialManager.recordAction('ultimate_hit');
      this.consumeEnergy(this.maxEnergy);
      if (window.audioManager) {
        window.audioManager.playUltimateBurst();
        if (typeof window.audioManager.playVovinamKiai === 'function') {
          window.audioManager.playVovinamKiai('ultimate', this.characterId || 'nghi');
        }
      }
      const ultMeta = {
        nghi:     { title: 'NGÔ NHẤT NGHỊ',     ult: 'LONG HỔ XUẤT SƠN',      color: '#00f0ff', accent: '#ffd700', style: 'lightning' },
        hoanganh: { title: 'PHÓ ĐẶNG HOÀNG ANH', ult: 'THỐNG SƠN ĐẠI CHÙY',     color: '#f97316', accent: '#ef4444', style: 'magma' },
        dinhan:   { title: 'TRIỆU ĐÌNH AN',     ult: 'LÔI HỎA PHÁ TRẬN',      color: '#f59e0b', accent: '#facc15', style: 'thunder' },
        giangmanh:{ title: 'NGÔ GIANG MẠNH',    ult: 'HÀN BĂNG TUYỆT SÁT',    color: '#38bdf8', accent: '#e0f2fe', style: 'ice' },
        dunghai:  { title: 'PHÓ DUNG HẢI',      ult: 'HUYỄN ẢNH LOẠN VŨ',     color: '#a855f7', accent: '#06b6d4', style: 'shadow' },
        bichlam:  { title: 'TRẦN BÍCH LÂM',     ult: 'PHONG VŨ THẦN TIỄN',    color: '#10b981', accent: '#34d399', style: 'wind' },
        huavudai: { title: 'HỨA VŨ ĐẠI',        ult: 'MỆNH LỆNH TRUY SÁT',    color: '#ef4444', accent: '#fbbf24', style: 'command' }
      };
      const meta = ultMeta[this.charId] || ultMeta.nghi;
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
      const durations = {
        ultimate_flurry: 1.4, ultimate_slam: 1.25, ultimate_command: 1.35,
        ultimate_rush: 1.4, ultimate_precision: 1.15, ultimate_feint: 1.2, ultimate_bash: 1.15
      };
      this.setState(st, durations[st] || 1.3);
      return;
    }

    // --- Né tránh (L): hồi chiêu 8.0s, i-frame 0.18s, chống spam triệt để ---
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
      this.vx = dir * 440;
      this.squashTimer = 0.16;
      this.squashType = 'stretch';
      if (window.audioManager) window.audioManager.playDodge();
      this.setState('dodge', 0.28);
      this.invincibleTimer = 0.18; // Cửa sổ i-frame cân bằng
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

    // ===== ĐÒN THẾ VOVINAM MỞ RỘNG (giữ hướng + phím đòn) =====
    // Đấm Móc Lên (giữ ↑ + J): móc xoáy từ dưới hất tung đối thủ lên không
    if (pressedJ && input.moveUp) {
      if (window.trainingManager) window.trainingManager.recordAction('uppercut');
      if (window.tutorialManager) window.tutorialManager.recordAction('uppercut');
      this.comboStep = 0;
      this.startAttack('uppercut', 0.52, 130);
      if (window.effectManager) {
        window.effectManager.addGhostTrail(this, 'rgba(56, 189, 248, 0.5)');
        window.effectManager.createEnergySparks(this.x + this.facing * 20, this.y - 70, 6);
      }
      return;
    }
    // Đánh Chỏ (giữ ↓ + J): cực gần, phá thủ, không bị chùn bước
    if (pressedJ && input.moveDown) {
      if (window.trainingManager) window.trainingManager.recordAction('punch');
      if (window.tutorialManager) window.tutorialManager.recordAction('punch');
      this.comboStep = 0;
      this.startAttack('elbow_strike', 0.46, 95);
      return;
    }
    // Quét Trụ (giữ ↓ + K): đòn thấp quật ngã, xuyên thủ, hồi lâu nếu đánh hụt
    if (pressedK && input.moveDown) {
      if (window.trainingManager) window.trainingManager.recordAction('sweep');
      if (window.tutorialManager) window.tutorialManager.recordAction('sweep');
      this.comboStep = 0;
      this.startAttack('kick_sweep', 0.66, 85);
      if (window.effectManager) {
        window.effectManager.createDust(this.x + this.facing * 40, this.y, 12, 50);
      }
      return;
    }
    // Lao Tới Đấm Móc (Shift + J): đòn áp sát tầm xa, quật ngã
    if (pressedJ && input.run) {
      if (window.trainingManager) window.trainingManager.recordAction('dash_punch');
      if (window.tutorialManager) window.tutorialManager.recordAction('dash_punch');
      this.comboStep = 0;
      this.startAttack('hook_run', 0.48, 310);
      return;
    }

    if (pressedJ) {
      if (window.trainingManager) window.trainingManager.recordAction('punch');
      if (window.tutorialManager) window.tutorialManager.recordAction('punch');
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
      const n = this.comboStep;
      const near = this.findClosestEnemy(enemies, 95 * this.reachMul);
      // FINISHER: chốt hạ chuỗi combo khi đã nối 2 đòn và ở cự ly gần
      const canFinish = n >= 2 && near && (this.finisher !== 'scissor' || !near.isBoss);
      if (canFinish) {
        if (window.trainingManager) window.trainingManager.recordAction('combo_finished');
        if (window.tutorialManager) window.tutorialManager.recordAction('combo_finished');
        this.comboStep = 0;
        if (this.finisher === 'scissor') {
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
