/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/player/playerUltimate.js - Tuyet ky, finisher va chuoi don ket lieu.
 */

(function () {
class PlayerUltimate extends window.PlayerDamage {
  runUltimate(st, dt, enemies) {
    const p = window.AnimUtil ? AnimUtil.progress(this) : 0;
    const type = this.ultimateType || 'flurry';
    this.invincibleTimer = Math.max(this.invincibleTimer, 0.12);

    const hitEnemy = (e, dmg, kb, knockdown) => {
      if (!e || e.isDead) return false;
      const real = Math.round(dmg * this.dmgMul);
      e.takeDamage(real, this.facing * kb, knockdown);
      if (window.audioManager) window.audioManager.playPunch();
      if (window.effectManager) window.effectManager.createHitSparks(e.x, e.y - 55, 7, true);
      if (window.combatSystem) window.combatSystem.registerHit(true, e, real, false);
      return true;
    };

    // ---- LONG HỔ XUẤT SƠN (chuỗi liên hoàn nguyên bản - Ngô Nhất Nghị) ----
    if (st === 'ultimate_flurry') {
      this.invincibleTimer = 0.2;
      this.vx = this.facing * 430;
      if (window.effectManager) {
        if (Math.random() < 0.7) window.effectManager.addGhostTrail(this, 'rgba(0, 230, 255, 0.75)');
        if (Math.random() < 0.45) window.effectManager.createLightningArc(this.x - this.facing * 30, this.y - 50, this.x + this.facing * 75, this.y - 45 + (Math.random() - 0.5) * 40, '#00f0ff', 1);
        if (Math.random() < 0.4) window.effectManager.createEnergySparks(this.x, this.y - 45, 4);
      }

      // Kéo và cuốn toàn bộ kẻ địch trên đường lướt theo đòn đánh
      let flurryDragIdx = 0;
      for (const enemy of enemies) {
        if (enemy.isDead) continue;
        const inReach = (Math.abs(enemy.x - this.x) < 140 && Math.abs(enemy.y - this.y) < 70) || this.hitTargets.has(enemy.id);
        if (inReach) {
          this.hitTargets.add(enemy.id);
          // Khóa và kéo đối thủ di chuyển theo phía trước người chơi
          enemy.x = this.x + this.facing * (48 + flurryDragIdx * 12);
          enemy.y = this.y;
          enemy.vx = this.vx;
          enemy.vz = 0;
          enemy.z = 0;
          enemy.state = 'hurt';
          enemy.stateTimer = 0;
          enemy.stateDuration = 0.25;
          flurryDragIdx++;

          // Gây sát thương liên hoàn
          const lastHit = this._ultData[enemy.id] || 0;
          if (this.stateTimer - lastHit >= 0.16) {
            this._ultData[enemy.id] = this.stateTimer;
            enemy.takeDamage(35, this.facing * 2, false);
            if (window.audioManager) window.audioManager.playPunch();
            if (window.effectManager) {
              window.effectManager.createHitSparks(enemy.x, enemy.y - 50, 8, true);
              window.effectManager.createDimensionalSlash(enemy.x, enemy.y - 50, (Math.random() - 0.5) * 0.8, 110, '#00f0ff');
            }
            if (window.combatSystem) window.combatSystem.registerHit(true, enemy, 35, true);
          }
        }
      }

      if (this.stateTimer >= this.stateDuration) {
        if (window.effectManager) {
          window.effectManager.createUltimateBlast(this.x + this.facing * 40, this.y - 50);
          window.effectManager.createGroundCrack(this.x + this.facing * 40, this.y, 180, '#00f0ff');
          window.effectManager.createGroundCrack(this.x + this.facing * 40, this.y, 130, '#ffd700');
          window.effectManager.createShockRing(this.x + this.facing * 40, this.y, '#ffd700');
          window.effectManager.triggerScreenShake(24, 0.55);
          window.effectManager.triggerFlash('#00f0ff', 0.75);
        }
        for (const enemy of enemies) {
          if (!enemy.isDead && (Math.abs(enemy.x - this.x) < 185 || this.hitTargets.has(enemy.id))) {
            enemy.takeDamage(320, this.facing * 14, true);
          }
        }
        this.hitTargets.clear();
        this.setState('idle');
      }
      return;
    }

    switch (type) {
      // ---- THỐNG SƠN CHÙY (Hoàng Anh): đập mặt đất AoE, chỉ an toàn khi đang bay ----
      case 'slam': {
        if (!this._ultInit) { this._ultInit = true; this.vz = 560; this.z = -0.5; }
        if (!this._ultHitDone) {
          this.vx = 0;
          if (window.effectManager && Math.random() < 0.6) window.effectManager.createEnergySparks(this.x, this.y - 60, 4);
          // Hút nhẹ kẻ địch gần vùng nhảy vào tâm chấn
          for (const e of enemies) {
            if (!e.isDead && Math.abs(e.x - this.x) < 180 && Math.abs(e.y - this.y) < 70) {
              e.x += (this.x - e.x) * 3 * dt;
              e.y += (this.y - e.y) * 3 * dt;
            }
          }
        }
        const landed = this.z === 0 && this.stateTimer > 0.25;
        if ((landed && !this._ultHitDone) || (p > 0.8 && !this._ultHitDone)) {
          this._ultHitDone = true;
          this._slamAt = this.stateTimer;
          this.z = 0; this.vz = 0;
          if (window.effectManager) {
            window.effectManager.createMagmaCrater(this.x, this.y, 190);
            window.effectManager.createShockRing(this.x, this.y, '#f97316');
            window.effectManager.createShockRing(this.x, this.y, '#facc15');
            window.effectManager.createDust(this.x, this.y, 35, 210);
            window.effectManager.triggerScreenShake(26, 0.65);
            window.effectManager.triggerFlash('#f97316', 0.65);
          }
          if (window.audioManager) window.audioManager.playScissorClamp();
          for (const e of enemies) {
            if (!e.isDead && Math.abs(e.x - this.x) < 235 && Math.abs(e.y - this.y) < 85) hitEnemy(e, 260, 14, true);
          }
        }
        // Sóng xung kích lan ra hai bên sau cú đập
        if (this._ultHitDone && !(this._ultFlags & 1) && this.stateTimer - this._slamAt > 0.18) {
          this._ultFlags |= 1;
          if (window.effectManager) {
            window.effectManager.createShockRing(this.x - 200, this.y, '#f97316');
            window.effectManager.createShockRing(this.x + 200, this.y, '#f97316');
            window.effectManager.createGroundCrack(this.x - 200, this.y, 110, '#facc15');
            window.effectManager.createGroundCrack(this.x + 200, this.y, 110, '#facc15');
            window.effectManager.triggerScreenShake(12, 0.3);
          }
          for (const e of enemies) {
            if (!e.isDead && Math.abs(e.x - this.x) >= 150 && Math.abs(e.x - this.x) < 380 && Math.abs(e.y - this.y) < 85) hitEnemy(e, 140, 12, true);
          }
        }
        if (p >= 1 || this.stateTimer >= this.stateDuration) {
          this.z = 0; this.vz = 0;
          this.setState('idle');
        }
        break;
      }

      // ---- PHONG VŨ THẦN TIỄN (Bích Lâm): phi thân lốc xoáy xuyên màn ----
      case 'rush': {
        this.vx = this.facing * 660;
        if (window.effectManager) {
          if (Math.random() < 0.7) window.effectManager.addGhostTrail(this, 'rgba(16, 185, 129, 0.8)');
          if (Math.random() < 0.4) window.effectManager.createShockRing(this.x, this.y, '#34d399');
          if (Math.random() < 0.35) window.effectManager.createSonicBoomCone(this.x + this.facing * 30, this.y - 50, this.facing, '#10b981');
        }
        let rushIdx = 0;
        for (const e of enemies) {
          if (e.isDead) continue;
          const inReach = (Math.abs(e.x - this.x) < 145 && Math.abs(e.y - this.y) < 70) || this.hitTargets.has(e.id);
          if (inReach) {
            this.hitTargets.add(e.id);
            // Kéo kẻ địch bị cuốn vào tâm lốc xoáy
            e.x = this.x + this.facing * (50 + rushIdx * 12);
            e.y = this.y;
            e.vx = this.vx;
            e.vz = 0;
            e.z = 0;
            e.state = 'hurt';
            e.stateTimer = 0;
            e.stateDuration = 0.25;
            rushIdx++;

            const last = this._ultData[e.id] || -1;
            if (this.stateTimer - last > 0.16) {
              this._ultData[e.id] = this.stateTimer;
              hitEnemy(e, 42, 4, false);
            }
          }
        }
        if (p >= 1) {
          if (window.effectManager) {
            window.effectManager.createUltimateBlast(this.x + this.facing * 30, this.y - 55);
            window.effectManager.createShockRing(this.x + this.facing * 30, this.y, '#10b981');
            window.effectManager.triggerScreenShake(20, 0.5);
          }
          for (const e of enemies) {
            if (!e.isDead && (Math.abs(e.x - this.x) < 180 || this.hitTargets.has(e.id))) {
              hitEnemy(e, 170, 16, true);
            }
          }
          this.hitTargets.clear();
          this.setState('idle');
        }
        break;
      }

      // ---- HÀN BĂNG TUYỆT SÁT (Giang Mạnh): dịch chuyển trảm kích băng không gian ----
      case 'precision': {
        const step = Math.floor(p * 4);
        if (step > 0 && step <= 3 && step !== this._ultStep) {
          this._ultStep = step;
          let target = null, min = 460;
          for (const e of enemies) {
            if (e.isDead) continue;
            const d = Math.hypot(e.x - this.x, (e.y - this.y) * 1.4);
            if (d < min) { min = d; target = e; }
          }
          if (target) {
            if (window.effectManager) {
              window.effectManager.addGhostTrail(this, 'rgba(56, 189, 248, 0.8)');
              window.effectManager.createDimensionalSlash(target.x, target.y - 55, (step % 2 === 0 ? 0.38 : -0.38), 240, '#38bdf8');
              window.effectManager.createShockRing(target.x, target.y, '#38bdf8');
              window.effectManager.triggerFlash('#e0f2fe', 0.45);
            }
            this.x = Math.max(30, Math.min(window.stageManager ? window.stageManager.stageWidth - 30 : 2600, target.x - this.facing * 62));
            this.y = target.y;
            hitEnemy(target, 165, 12, true);
            if (window.effectManager) window.effectManager.triggerScreenShake(11, 0.22);
          }
        }
        if (p >= 1) {
          if (window.effectManager) {
            window.effectManager.createUltimateBlast(this.x + this.facing * 40, this.y - 60);
            window.effectManager.createGroundCrack(this.x + this.facing * 40, this.y, 140, '#38bdf8');
          }
          this.setState('idle');
        }
        break;
      }

      // ---- MỆNH LỆNH TRUY SÁT (Hứa Vũ Đại): gọi strike pháo kích oanh tạc ----
      case 'command': {
        const marks = [0.28, 0.52, 0.76];
        marks.forEach((m, i) => {
          const bit = 1 << i;
          if (p > m && !(this._ultFlags & bit)) {
            this._ultFlags |= bit;
            const tx = this.x + this.facing * (150 + i * 160);
            if (window.effectManager) {
              window.effectManager.createShockRing(tx, this.y, '#ef4444');
              window.effectManager.createGroundCrack(tx, this.y, 120, '#fbbf24');
              window.effectManager.createDust(tx, this.y, 20, 110);
              window.effectManager.triggerScreenShake(12, 0.25);
              window.effectManager.addFloatingText('OANH TẠC!', tx, this.y - 170, 'counter');
            }
            if (window.audioManager) window.audioManager.playHeavyHit();
            for (const e of enemies) {
              if (!e.isDead && Math.abs(e.x - tx) < 145 && Math.abs(e.y - this.y) < 85) hitEnemy(e, 150, 12, true);
            }
          }
        });
        if (p >= 1) this.setState('idle');
        break;
      }

      // ---- HUYỄN ẢNH LOẠN VŨ (Dung Hải): ảo ảnh phân thân chém chữ X neon ----
      case 'feint': {
        const marks = [0.3, 0.62];
        marks.forEach((m, i) => {
          const bit = 1 << i;
          if (p > m && !(this._ultFlags & bit)) {
            this._ultFlags |= bit;
            let target = null, min = 420;
            for (const e of enemies) {
              if (e.isDead) continue;
              const d = Math.hypot(e.x - this.x, (e.y - this.y) * 1.4);
              if (d < min) { min = d; target = e; }
            }
            if (window.effectManager) {
              window.effectManager.addGhostTrail(this, 'rgba(168, 85, 247, 0.85)');
              window.effectManager.createDimensionalSlash(this.x, this.y - 50, 0.45, 200, '#a855f7');
              window.effectManager.createDimensionalSlash(this.x, this.y - 50, -0.45, 200, '#06b6d4');
              window.effectManager.triggerFlash('#a855f7', 0.4);
            }
            if (target) {
              this.x = target.x + this.facing * 72;
              this.y = target.y;
              this.facing = -this.facing;
              hitEnemy(target, 155, 14, true);
            } else {
              this.vx = this.facing * 520;
            }
            if (window.audioManager) window.audioManager.playDodge();
          }
        });
        if (p >= 1) {
          if (window.effectManager) {
            window.effectManager.createUltimateBlast(this.x, this.y - 60);
            window.effectManager.createShockRing(this.x, this.y, '#a855f7');
          }
          this.setState('idle');
        }
        break;
      }

      // ---- LÔI HỎA PHÁ TRẬN (Triệu Đình An): Húc khiên sấm sét + Giáng thiên lôi vỡ mặt đất ----
      case 'bash': {
        if (p < 0.6) {
          this.vx = this.facing * 760;
          if (window.effectManager) {
            if (Math.random() < 0.75) window.effectManager.addGhostTrail(this, 'rgba(250, 204, 21, 0.85)');
            if (Math.random() < 0.45) window.effectManager.createSonicBoomCone(this.x + this.facing * 40, this.y - 50, this.facing, '#f59e0b');
            if (Math.random() < 0.4) window.effectManager.createLightningArc(this.x - this.facing * 20, this.y - 45, this.x + this.facing * 55, this.y - 45, '#facc15');
          }
          let bashIdx = 0;
          for (const e of enemies) {
            if (e.isDead) continue;
            const inReach = (Math.abs(e.x - this.x) < 145 && Math.abs(e.y - this.y) < 70) || this.hitTargets.has(e.id);
            if (inReach) {
              const isFirst = !this.hitTargets.has(e.id);
              this.hitTargets.add(e.id);
              // Ép và kéo đối thủ theo mặt khiên thép đang lướt tốc độ cao
              e.x = this.x + this.facing * (52 + bashIdx * 12);
              e.y = this.y;
              e.vx = this.vx;
              e.vz = 0;
              e.z = 0;
              e.state = 'hurt';
              e.stateTimer = 0;
              e.stateDuration = 0.35;
              bashIdx++;

              if (isFirst) {
                hitEnemy(e, 85, 3, false);
                if (window.effectManager) {
                  window.effectManager.triggerScreenShake(12, 0.25);
                  window.effectManager.createHitSparks(e.x, e.y - 60, 10, true);
                  window.effectManager.createShockRing(e.x, e.y, '#f59e0b');
                }
                if (window.audioManager) window.audioManager.playBlock();
              }
            }
          }
        } else if (!this._ultHitDone) {
          // Bổ thiết chùy + Cột sét trời giáng chấn động toàn trường ngay trên đầu kẻ địch đã kéo theo!
          this._ultHitDone = true;
          this.vx = 0;
          const impactX = this.x + this.facing * 50;
          if (window.effectManager) {
            window.effectManager.createThunderStrike(impactX, this.y, '#facc15');
            window.effectManager.createUltimateBlast(impactX, this.y - 40);
            window.effectManager.createGroundCrack(impactX, this.y, 180, '#f59e0b');
            window.effectManager.createDust(impactX, this.y, 30, 200);
            window.effectManager.triggerScreenShake(26, 0.65);
            window.effectManager.triggerFlash('#facc15', 0.7);
          }
          if (window.audioManager) {
            window.audioManager.playHeavyHit();
            window.audioManager.playGong(0.85);
          }
          for (const e of enemies) {
            if (!e.isDead && (Math.abs(e.x - impactX) < 230 || this.hitTargets.has(e.id))) {
              hitEnemy(e, 310, 26, true);
            }
          }
        } else {
          this.vx = 0;
        }
        if (p >= 1 || this.stateTimer >= this.stateDuration) {
          this.hitTargets.clear();
          this.setState('idle');
        }
        break;
      }

      default: {
        this.setState('idle');
      }
    }
  }

  // ==========================================================================
  // FINISHER riêng (kết thúc chuỗi combo khi đã nối đủ 2 đòn ở cự ly gần)
  // ==========================================================================
  doFinisher() {
    const map = {
      shove:   { state: 'kick_push',       dur: 0.6,  lunge: 250 },
      heavy:   { state: 'kick_roundhouse', dur: 0.74, lunge: 170 },
      rush:    { state: 'flying_kick',     dur: 0.62, lunge: 540 },
      bash:    { state: 'boss_bash',       dur: 0.7,  lunge: 470 },
      counter: { state: 'boss_riposte',    dur: 0.55, lunge: 330 }
    };
    let cfg = map[this.finisher] || map.heavy;
    if (this.charId === 'hoanganh' || this.characterId === 'hoanganh') {
      cfg = { state: 'boss_slam', dur: 0.75, lunge: 190 };
    }
    this._finisherState = cfg.state;
    if (cfg.state === 'flying_kick') { this.z = -0.5; this.vz = 70; }
    this.comboStep = 0;
    this.startAttack(cfg.state, cfg.dur, cfg.lunge);
    if (window.effectManager) window.effectManager.addGhostTrail(this, 'rgba(255, 255, 255, 0.45)');
    if (this.finisher === 'bash' || this.finisher === 'heavy') {
      if (window.effectManager) window.effectManager.triggerScreenShake(6, 0.2);
      if (window.audioManager) window.audioManager.playWarning();
    }
  }

  finisherAttackData() {
    const m = this.dmgMul;
    const k = this.kbMul;
    switch (this.finisher) {
      case 'shove':
        return { damage: Math.round(65 * m), offsetX: 66, offsetY: -70, width: 108 * this.reachMul, height: 66, knockback: 620 * k, weight: 'heavy', energyGain: 16, unblockable: true };
      case 'heavy':
        return { damage: Math.round(130 * m), offsetX: 70, offsetY: -80, width: 106 * this.reachMul, height: 72, knockback: 300 * k, knockdown: true, weight: 'ultimate', energyGain: 20, unblockable: true };
      case 'rush':
        return { damage: Math.round(105 * m), offsetX: 70, offsetY: -70, width: 100 * this.reachMul, height: 62, knockback: 340 * k, weight: 'heavy', energyGain: 18 };
      case 'bash':
        return { damage: Math.round(120 * m), offsetX: 74, offsetY: -84, width: 118 * this.reachMul, height: 72, knockback: 470 * k, knockdown: true, weight: 'ultimate', energyGain: 20, unblockable: true };
      case 'counter':
        return { damage: Math.round(125 * m), offsetX: 64, offsetY: -84, width: 98 * this.reachMul, height: 62, knockback: 320 * k, knockdown: true, weight: 'heavy', energyGain: 22 };
      default:
        return null;
    }
  }

}

window.PlayerUltimate = PlayerUltimate;
})();
