/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/training/trainingDummy.js - Moc nhan vo duong (dummy) va AI phan don.
 */

class TrainingDummy extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'brawler', 'Mộc Nhân Võ Đường');
    this.maxHp = 1000;
    this.hp = 1000;
    this.isTrainingDummy = true;
    this.styleType = 'dummy_wood'; // Hình nhân gỗ mộc nhân võ đường
    this.attackMode = 'idle'; // 'idle', 'telegraph_hand', 'telegraph_leg', 'sparring', 'free', 'guard'
    this.telegraphTimer = 0;
    this.telegraphDuration = 1.3;
    this.telegraphState = 'idle'; // 'idle', 'telegraph', 'active'
    this.attackType = 'hand'; // 'hand' or 'leg'
    this.hasStruckThisCycle = false;
  }

  update(dt, player) {
    this.animTime += dt;
    this.stateTimer += dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    // Giảm bộ đếm rung/méo hình khi trúng đòn (trước đây không giảm nên hình nộm rung mãi)
    if (this.hitJitterTimer > 0) this.hitJitterTimer = Math.max(0, this.hitJitterTimer - dt);
    if (this.squashTimer > 0) this.squashTimer = Math.max(0, this.squashTimer - dt);
    if (this.combatKnockbackTimer > 0) {
      this.combatKnockbackTimer -= dt;
      if (this.combatKnockbackTimer <= 0) this.isKnockedBack = false;
    }

    // Hiệu ứng Choáng Váng (Stun từ Côn / Gậy)
    if (this.stunTimer > 0) {
      this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.state !== 'knockdown' && this.state !== 'getup') {
        this.vx = 0;
        this.vy = 0;
        if (window.effectManager && Math.random() < 0.25) {
          window.effectManager.createEnergySparks(this.x, (this.y || 580) + (this.z || 0) - 85, 2);
        }
      }
      if (this.stunTimer <= 0 && this.state === 'hurt') {
        this.setState('idle');
      }
    }

    // Hiệu ứng Xuất Huyết (Bleed DoT từ Mã Tấu)
    if (this.bleedTimer > 0 && !this.isDead) {
      this.bleedTimer -= dt;
      this.bleedTickTimer = (this.bleedTickTimer || 0) - dt;
      if (this.bleedTickTimer <= 0) {
        this.bleedTickTimer = 0.8;
        const tickDmg = this.bleedDmg || 6;
        this.hp = Math.max(1, this.hp - tickDmg);
        if (window.trainingManager && typeof window.trainingManager.recordDummyDamage === 'function') {
          window.trainingManager.recordDummyDamage(tickDmg);
        }
        if (window.effectManager) {
          window.effectManager.addFloatingText(`-${tickDmg} 🩸`, this.x, (this.y || 580) + (this.z || 0) - 120, 'bleed');
          window.effectManager.createHitSparks(this.x, (this.y || 580) + (this.z || 0) - 65, 4, false);
        }
      }
    }

    // Vật lý Z (rơi và nảy khi bị đánh bay lên không)
    if (this.z < 0 || this.vz !== 0) {
      this.z -= this.vz * dt;
      this.vz -= this.gravity * dt;
      if (this.z >= 0) {
        this.z = 0;
        this.vz = 0;
        if (window.effectManager && this.state === 'knockdown') window.effectManager.createDust(this.x, this.y, 6);
      }
    }

    // Ma sát trượt và cập nhật tọa độ di chuyển mượt mà
    const friction = Math.exp(-12 * dt);
    this.vx *= friction;
    this.vy *= friction;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Giữ hình nộm trong giới hạn sàn đấu
    this.y = Math.max(510, Math.min(640, this.y));
    if (window.game && window.game.arenaLocked) {
      this.x = Math.max(window.game.arenaMinX + 28, Math.min(window.game.arenaMaxX - 28, this.x));
    }

    // Luôn tự động hồi phục máu cho hình nhân tập luyện
    if (this.hp < this.maxHp && !this.isDead) {
      this.hp = Math.min(this.maxHp, this.hp + 380 * dt);
    }

    // Nếu bị đánh ngã hoặc máu về 0 -> lập tức hồi sinh và đứng dậy
    if (this.isDead) {
      this.isDead = false;
      this.hp = this.maxHp;
      this.setState('getup', 0.8);
      return;
    }

    if (this.state === 'knockdown' || this.state === 'getup') {
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle', 1.0);
      }
      return;
    }

    if (this.state === 'hurt') {
      if (this.stunTimer > 0) {
        this.vx = 0;
        this.vy = 0;
        return;
      }
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle', 1.0);
      }
      return;
    }

    // Luôn quay mặt về phía người chơi
    if (player) {
      this.facing = (player.x >= this.x) ? 1 : -1;
    }

    if (this.stunTimer > 0) {
      this.isAttacking = false;
      this.vx = 0;
      this.vy = 0;
      return;
    }

    // Điều khiển chu kỳ ra đòn chuẩn nhịp để người chơi tập né và phản đòn
    if (this.attackMode === 'telegraph_hand' || this.attackMode === 'telegraph_leg') {
      const neededType = (this.attackMode === 'telegraph_hand') ? 'hand' : 'leg';
      this.attackType = neededType;
      this.telegraphTimer += dt;

      if (this.telegraphState === 'idle') {
        if (this.telegraphTimer >= 1.0) {
          this.telegraphState = 'telegraph';
          this.telegraphTimer = 0;
          this.telegraphDuration = 1.3;
          this.hasStruckThisCycle = false;
          this.setState(neededType === 'hand' ? 'counter_hand_prep' : 'counter_leg_prep', 1.3);
          if (window.audioManager) window.audioManager.playWarning();
          if (window.effectManager) {
            window.effectManager.createShockRing(this.x, this.y, neededType === 'leg' ? '#ffd700' : '#ff3344');
          }
        }
      } else if (this.telegraphState === 'telegraph') {
        if (this.telegraphTimer >= this.telegraphDuration) {
          // Tung đòn thực sự trong cửa sổ active
          this.telegraphState = 'active';
          this.telegraphTimer = 0;
          this.hasStruckThisCycle = false;
          this.setState(neededType === 'hand' ? 'punch_straight' : 'kick_roundhouse', 0.55);
          this.isAttacking = true;
          if (window.audioManager) window.audioManager.playWhoosh();
        }
      } else if (this.telegraphState === 'active') {
        // Thực hiện va chạm đòn với người chơi để kích hoạt né / đỡ / phản đòn
        if (!this.hasStruckThisCycle && player && window.combatSystem) {
          this.hasStruckThisCycle = true;
          const hitData = {
            damage: 2,
            counterType: neededType,
            isKick: (neededType === 'leg'),
            width: 85,
            height: 50,
            offsetX: 40,
            offsetY: neededType === 'leg' ? -45 : -70
          };
          window.combatSystem.checkAttackHit(this, player, hitData);
        }

        if (this.telegraphTimer >= 0.5) {
          this.telegraphState = 'idle';
          this.telegraphTimer = 0;
          this.isAttacking = false;
          this.setState('idle', 1.0);
        }
      }
    } else if (this.attackMode === 'guard') {
      this.isAttacking = false;
      this.vx = 0;
      if (player) this.facing = (player.x >= this.x) ? 1 : -1;
      // Chỉ vào thế thủ một lần (không reset hoạt ảnh mỗi frame)
      if (this.state !== 'guard') this.setState('guard');
    } else if (this.attackMode === 'sparring' || this.attackMode === 'free') {
      this._updateSparring(dt, player, this.attackMode === 'free');
    } else {
      this.isAttacking = false;
      this.vx = 0;
      if (this.state !== 'idle') this.setState('idle');
    }
  }

  // Bộ đòn theo kiểu hình nộm: có vũ khí thì dùng đòn vũ khí thay vì đấm đá tay không
  getAttackKit() {
    const armed = {
      boss_hoanganh: { reach: 125, moves: [
        { state: 'boss_swing', dur: 0.55, dmg: 14, counterType: 'hand', w: 150, ox: 85, oy: -78 },
        { state: 'boss_thrust', dur: 0.45, dmg: 11, counterType: 'hand', w: 105, ox: 90, oy: -80 }
      ] },
      boss_dinhan: { reach: 115, moves: [
        { state: 'boss_swing', dur: 0.55, dmg: 14, counterType: 'hand', w: 135, ox: 80, oy: -78 },
        { state: 'boss_thrust', dur: 0.45, dmg: 11, counterType: 'hand', w: 100, ox: 80, oy: -80 }
      ] },
      boss_haclang: { reach: 105, moves: [
        { state: 'boss_swing', dur: 0.45, dmg: 12, counterType: 'hand', w: 125, ox: 70, oy: -78 },
        { state: 'boss_thrust', dur: 0.4, dmg: 10, counterType: 'hand', w: 95, ox: 70, oy: -80 }
      ] },
      enemy_baton: { reach: 100, moves: [
        { state: 'boss_swing', dur: 0.5, dmg: 10, counterType: 'hand', w: 110, ox: 65, oy: -78 }
      ] },
      enemy_blade: { reach: 100, moves: [
        { state: 'boss_swing', dur: 0.45, dmg: 11, counterType: 'hand', w: 110, ox: 65, oy: -78 },
        { state: 'boss_thrust', dur: 0.4, dmg: 9, counterType: 'hand', w: 90, ox: 65, oy: -80 }
      ] }
    };
    const kit = armed[this.styleType];
    if (kit) return kit;
    return { reach: 100, moves: [
      { state: 'punch_straight', dur: 0.55, dmg: 10, counterType: 'hand', w: 80, ox: 40, oy: -62 },
      { state: 'kick_roundhouse', dur: 0.55, dmg: 12, counterType: 'leg', kick: true, w: 85, ox: 45, oy: -45 }
    ] };
  }

  // Đối kháng chủ động (sparring) / giao đấu nhẹ (free): áp sát, căn hàng, gồng đòn rồi mới ra đòn
  _updateSparring(dt, player, gentle) {
    this.sparCooldown = (this.sparCooldown === undefined ? 1.0 : this.sparCooldown) - dt;
    if (!player) return;
    const kit = this.getAttackKit();

    // Đang ra đòn: đứng yên, trúng đòn ở giữa chu kỳ, hết chu kỳ thì thu thế
    if (this.isAttacking) {
      this.vx = 0; this.vy = 0;
      if (!this.hasStruckThisCycle && this.stateTimer >= this.stateDuration * 0.5) {
        this.hasStruckThisCycle = true;
        const m = this.curMove;
        if (m && window.combatSystem) {
          window.combatSystem.checkAttackHit(this, player, {
            damage: gentle ? Math.ceil(m.dmg * 0.6) : m.dmg,
            counterType: m.counterType,
            isKick: !!m.kick,
            width: m.w, height: 55, offsetX: m.ox, offsetY: m.oy
          });
        }
      }
      if (this.stateTimer >= this.stateDuration) {
        this.isAttacking = false;
        this.setState('idle');
        this.sparCooldown = gentle ? 3.0 : 1.3 + Math.random() * 0.6;
      }
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    this.facing = dx >= 0 ? 1 : -1;
    const inRange = Math.abs(dx) < kit.reach && Math.abs(dy) < 28;

    if (!inRange && !(gentle && Math.abs(dx) > 260)) {
      // Áp sát theo cả trục x và y để đòn trúng được người chơi
      const standOff = kit.reach * 0.8;
      const mx = Math.abs(dx) > standOff ? Math.sign(dx) : 0;
      const my = Math.abs(dy) > 12 ? Math.sign(dy) : 0;
      this.vx = mx * 125;
      this.vy = my * 85;
      if (mx || my) { if (this.state !== 'walk') this.setState('walk'); }
      else if (this.state !== 'idle') this.setState('idle');
    } else {
      this.vx = 0; this.vy = 0;
      if (this.state !== 'idle') this.setState('idle');
      if (inRange && this.sparCooldown <= 0) {
        const m = kit.moves[Math.floor(Math.random() * kit.moves.length)];
        this.curMove = m;
        this.hasStruckThisCycle = false;
        this.setState(m.state, m.dur);
        if (window.audioManager) window.audioManager.playWhoosh();
      }
    }
  }

  takeDamage(amount, knockback = 0, isKnockdown = false) {
    if (this.attackMode === 'guard') {
      amount *= 0.25;
      if (window.audioManager) window.audioManager.playBlock();
      if (window.effectManager) window.effectManager.addFloatingText('ĐỠ ĐÒN!', this.x, this.y - 120, 'dodge');
    }
    // Ghi nhận sát thương vào bộ đo telemetry võ đường
    if (window.trainingManager) {
      window.trainingManager.recordDummyDamage(amount);
    }
    super.takeDamage(amount, knockback, isKnockdown);
    this.invincibleTimer = 0.05; // Đặt cực ngắn để không bao giờ bị flash trắng liên tục
    // Hồi lại máu ngay lập tức để không bao giờ chết vĩnh viễn
    if (this.hp <= 0) {
      this.hp = this.maxHp;
      this.isDead = false;
    }
  }

  setDummyStyle(styleType, name) {
    this.styleType = styleType || 'dummy_wood';
    this.name = name || 'Mộc Nhân Võ Đường';
    this.hp = this.maxHp;
    this.isDead = false;
    this.hitJitterTimer = 0;
    this.squashTimer = 0;
    this.weapon = null;
    this.heldWeapon = null;
    this.armed = false;
  }
}

window.TrainingDummy = TrainingDummy;
