/**
 * VOVINAM: SÁT THẦN GIẢI CỨU HỨA VŨ ĐẠI
 * js/player.js - Ngô Nhất Nghị (Sát Thần Việt Võ Đạo)
 * Quy ước trục: z < 0 là đang ở trên không (nhảy), z = 0 là chạm đất.
 */

class Player {
  constructor(x = 150, y = 580) {
    this.id = 'player_nghi';
    this.type = 'player';
    this.name = 'Ngô Nhất Nghị';

    this.x = x;
    this.y = y;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0; // vận tốc hướng LÊN (dương = bay lên)
    this.facing = 1;
    this.speed = 230;
    this.runSpeed = 380;
    this.jumpForce = 520;
    this.gravity = 1300;

    this.maxHp = 1000;
    this.hp = 1000;
    this.energy = 0;
    this.maxEnergy = 100;
    this.isDead = false;
    this.invincibleTimer = 0;

    this.state = 'idle';
    this.animTime = 0;
    this.stateTimer = 0;
    this.stateDuration = 0;

    // Combo: comboStep = số đòn đã nối trong chuỗi hiện tại
    this.comboStep = 0;
    this.comboWindowTimer = 0;
    this.hitTargets = new Set();

    this.grabbedTarget = null;
    this.scissorHitDone = false;
    this.perfectDodgeDone = false;

    // ==== Thông số nhân vật chơi được (xem CHARACTERS[id].combat trong roster.js) ====
    this.charId = 'nghi';
    this.characterId = 'nghi';
    this.title = 'SÁT THẦN VIỆT VÕ ĐẠO';
    this.styleType = 'player';
    this.dmgMul = 1;         // hệ số sát thương
    this.reachMul = 1;       // hệ số tầm đánh
    this.kbMul = 1;          // hệ số lực đẩy
    this.energyMul = 1;      // hệ số hồi năng lượng
    this.finisher = 'scissor';
    this.ultimateState = 'ultimate_flurry';
    this.ultimateType = 'flurry';
    this.comboMax = 3;       // số đòn tối đa trong một chuỗi
    this.superArmor = false;
    this.armorThreshold = 55;
    this.damageReduction = 0;
    this.counterBonus = 1.85;  // hệ số sát thương Perfect Counter
    this.counterWindow = 1.8;  // thời gian cửa sổ phản đòn (giây)
    this.mechRiposte = false;  // đỡ đòn -> phản kích (Đình An / Giang Mạnh)

    this._finisherState = null; // trạng thái finisher đang tung
    this._ultFlags = 0;
    this._ultData = {};

    // Nhịp ra đòn (chống spam): spamStack càng cao thì đòn càng nhạt lực
    this.attackClock = 0;        // đồng hồ thời gian chiến đấu (không bị reset theo state)
    this.spamStack = 0;          // số đòn đánh dồn dập liên tiếp
    this._attackMul = 1;         // hệ số lực đòn hiện tại
    this._lastHitAt = -99;       // thời điểm đòn cuối trúng đích
    this._rhythmApplied = false; // đã tính nhịp cho cú vung hiện tại chưa
    this._warnedAt = -99;        // lần cuối hiện cảnh báo "nhạt lực"
    this._ultStep = 0;
    this._ultHitDone = false;
    this._ultInit = false;
    this.maxStamina = 100;
    this.stamina = 100;          // thể lực: mỗi đòn đánh tiêu hao, đá tốn hơn đấm
    this.kickCooldown = 0;       // hồi chiêu giữa các đòn đá (chống spam K)
    this.maxKickCooldown = 0.28;
    this.kickHasHit = false;     // ghi nhận đòn đá bay đã trúng mục tiêu (để phân biệt tiếp đất chuẩn vs whiff)
    this.airPunchCooldown = 0;   // hồi chiêu giữa các đòn phi quyền Space + J (0.5s chống spam)
    this.airPunchHasHit = false; // ghi nhận phi quyền đã trúng đích
    this.lastAerialAttack = null; // lưu vết đòn không chiến gần nhất để đảm bảo landing recovery bắt buộc
    this._lastKickWarnAt = -99;
    this._lastAtkAt = -99;
    this._staminaShownAt = -99;

    // ===== HỒI CHIÊU & CƠ CHẾ KỸ NĂNG L VÀ COUNTER VÕ THUẬT VOVINAM =====
    this.dodgeCooldown = 0;           // hồi chiêu né L (8.0s chuẩn chống spam)
    this.maxDodgeCooldown = 8.0;
    this._lastDodgeWarnAt = -99;

    this.counterHandCooldown = 0;     // hồi chiêu Counter Tay U+J (2.5s)
    this.maxCounterHandCooldown = 2.5;

    this.counterLegCooldown = 0;      // hồi chiêu Counter Chân U+K (3.5s)
    this.maxCounterLegCooldown = 3.5;

    this.activeCounterWindow = 0;     // cửa sổ bắt đòn đang hoạt động (0.22s)
    this.activeCounterType = null;    // 'hand' | 'leg'
    this.counterSuccess = false;      // đã bắt đòn thành công
    this._lastCounterWarnAt = -99;

    // ===== HỆ THỐNG THẾ THỦ & ĐỘ BỀN KHIÊN (GUARD GAUGE / BLOCK LIMIT) =====
    this.maxGuardGauge = 100;
    this.guardGauge = 100;            // 100 điểm: mỗi đòn đỡ tốn 16 điểm (tối đa 5-7 đòn liên tiếp)
    this.guardBreakTimer = 0;         // thời gian choáng khi bể thủ (1.35s)
    this.maxGuardBreakDuration = 1.35;
    this.lastGuardHitTime = -99;      // thời điểm cuối bị đánh khi thủ
    this.guardRegenRate = 24;         // hồi 24 điểm/giây khi buông thủ
    this.guardRegenDelay = 0.9;       // trễ 0.9s sau đòn đánh cuối mới bắt đầu hồi
    this._lastGuardWarnAt = -99;

    // ===== HIỆU ỨNG TRẠNG THÁI TỪ VŨ KHÍ =====
    this.stunTimer = 0;               // Choáng váng từ Côn (khóa điều khiển)
    this.bleedTimer = 0;              // Xuất huyết từ Mã tấu
    this.bleedTickTimer = 0;
    this.bleedDmg = 0;
  }

  // ==========================================================================
  // CHỌN NHÂN VẬT CHƠI ĐƯỢC (mỗi nhân vật một bộ chỉ số & phong cách riêng)
  // ==========================================================================
  setCharacter(charId) {
    const list = window.CHARACTERS || {};
    const c = list[charId] && list[charId].playable ? list[charId] : list.nghi;
    const combat = (c && c.combat) || (list.nghi && list.nghi.combat) || {};

    this.charId = (c && c.id) || 'nghi';
    this.characterId = this.charId;
    this.id = 'player_' + this.charId;
    this.name = (c && c.name) || 'Ngô Nhất Nghị';
    this.title = (c && c.title) || 'SÁT THẦN VIỆT VÕ ĐẠO';
    this.styleType = (c && c.styleType) || 'player';

    this.maxHp = combat.hp || 1000;
    this.hp = this.maxHp;
    this.speed = combat.speed || 230;
    this.runSpeed = combat.runSpeed || 380;
    this.jumpForce = combat.jumpForce || 520;

    this.dmgMul = combat.damage || 1;
    this.reachMul = combat.reach || 1;
    this.kbMul = combat.knockback || 1;
    this.energyMul = combat.energyGain || 1;
    this.finisher = combat.finisher || 'scissor';
    this.ultimateState = combat.ultimateState || 'ultimate_flurry';
    this.ultimateType = combat.ultimateType || 'flurry';
    this.comboMax = combat.comboMax || 3;
    this.superArmor = !!combat.superArmor;
    this.armorThreshold = combat.armorThreshold || 55;
    this.damageReduction = combat.damageReduction || 0;
    this.counterBonus = combat.counterBonus || 1.85;
    this.counterWindow = combat.counterWindow || 1.8;
    this.mechRiposte = (this.finisher === 'bash' || this.finisher === 'counter');

    this.energy = 0;
    this.isDead = false;
    this.state = 'idle';
    this.stateTimer = 0;
    this.stateDuration = 0;
    this._finisherState = null;
    this._pose = null;
    this._trail = [];

    if (window.uiManager) {
      window.uiManager.setCharacterHUD(this);
    }
    return this;
  }

  reset(x = 150, y = 580) {
    this.x = x;
    this.y = y;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.facing = 1;
    this.hp = this.maxHp;
    this.energy = 0;
    this.isDead = false;
    this.invincibleTimer = 0;
    this.state = 'idle';
    this.animTime = 0;
    this.stateTimer = 0;
    this.stateDuration = 0;
    this.comboStep = 0;
    this.comboWindowTimer = 0;
    this.hitTargets.clear();
    this.grabbedTarget = null;
    this.scissorHitDone = false;
    this._pose = null;
    this._trail = [];
    // Nhịp ra đòn (chống spam): đánh dồn dập thì lực nhạt dần
    this.attackClock = 0;
    this.spamStack = 0;
    this._attackMul = 1;
    this._lastHitAt = -99;
    this._rhythmApplied = false;
    this.stamina = this.maxStamina;
    this.exhaustTimer = 0;
    this.kickCooldown = 0;
    this.kickHasHit = false;
    this.airPunchCooldown = 0;
    this.airPunchHasHit = false;
    this.lastAerialAttack = null;
    this.dodgeCooldown = 0;
    this.counterHandCooldown = 0;
    this.counterLegCooldown = 0;
    this.activeCounterWindow = 0;
    this.activeCounterType = null;
    this.counterSuccess = false;
    this.guardGauge = this.maxGuardGauge;
    this.guardBreakTimer = 0;
    this.lastGuardHitTime = -99;
    this.stunTimer = 0;
    this.bleedTimer = 0;
    this.bleedTickTimer = 0;
    this.bleedDmg = 0;
  }

  // Tiêu hao thanh giữ thủ (Guard Gauge). Trả về true nếu bể thủ (Guard Break)
  consumeGuard(amount) {
    this.guardGauge = Math.max(0, this.guardGauge - amount);
    this.lastGuardHitTime = this.attackClock;
    if (this.guardGauge <= 0) {
      this.triggerGuardBreak();
      return true;
    }
    return false;
  }

  // Kích hoạt trạng thái Bể Thủ (Guard Break)
  triggerGuardBreak() {
    this.guardGauge = 0;
    this.guardBreakTimer = this.maxGuardBreakDuration;
    this.invincibleTimer = 0; // Không có i-frame để đối phương trừng phạt sơ hở
    this.vx = -this.facing * 100;
    this.setState('guard_break', this.maxGuardBreakDuration);
    if (window.audioManager) {
      window.audioManager.playHeavyHit();
      if (typeof window.audioManager.playGong === 'function') window.audioManager.playGong(0.7);
    }
    if (window.effectManager) {
      window.effectManager.triggerScreenShake(14, 0.35);
      window.effectManager.triggerFlash('#ef4444', 0.45);
      window.effectManager.createShockRing(this.x, this.y, '#ef4444');
      window.effectManager.createHitSparks(this.x, this.y - 85, 24, true);
      window.effectManager.addFloatingText('BỂ THỦ! (GUARD BREAK)', this.x, this.y - 170, 'counter');
    }
    if (window.uiManager && typeof window.uiManager.showAlertBanner === 'function') {
      window.uiManager.showAlertBanner('BỂ THỦ! VỠ THẾ PHÒNG NGỰ!');
    }
  }

  addEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
    if (window.uiManager) window.uiManager.updatePlayerEnergy(this.energy, this.maxEnergy);
  }

  consumeEnergy(amount) {
    this.energy = Math.max(0, this.energy - amount);
    if (window.uiManager) window.uiManager.updatePlayerEnergy(this.energy, this.maxEnergy);
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    if (this.isDead || this.invincibleTimer > 0) return;

    // Bảo hộ trong Võ Đường Luyện Võ: không bao giờ tử trận
    if (window.trainingManager && window.trainingManager.isActive) {
      if (window.trainingManager.playerGodMode) {
        this.hp = this.maxHp;
        if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);
        amount = 0;
      } else if (this.hp - amount <= 1) {
        this.hp = Math.max(1, this.hp);
        if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);
        if (window.effectManager) {
          window.effectManager.addFloatingText('BẢO HỘ VÕ ĐƯỜNG!', this.x, this.y - 120, 'heal');
        }
        return;
      }
    }

    // Độ khó: sát thương nhận vào tăng 20%
    amount = Math.round(amount * 1.2);

    // Giảm sát thương thụ động (Triệu Đình An)
    if (this.damageReduction > 0) {
      amount = Math.max(1, Math.round(amount * (1 - this.damageReduction)));
    }

    // Super armor (Phó Đặng Hoàng Anh): đòn nhẹ gây 50% và không làm chùn bước
    if (this.superArmor && !isKnockdown && amount < this.armorThreshold) {
      const reduced = Math.max(1, Math.round(amount * 0.5));
      this.hp = Math.max(0, this.hp - reduced);
      this.invincibleTimer = 0.2;
      if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);
      if (window.effectManager) {
        window.effectManager.createHitSparks(this.x, this.y - 95, 6, false);
        window.effectManager.addFloatingText('CHỊU ĐÒN', this.x, this.y - 150, 'block');
      }
      return;
    }

    // Đang trong trạng thái Bể Thủ (Guard Break): bị đánh trúng chịu sát thương trừng phạt, giữ nguyên thế choáng
    if (this.state === 'guard_break' || this.guardBreakTimer > 0) {
      this.hp = Math.max(0, this.hp - amount);
      this.invincibleTimer = 0.05; // Cho phép đối phương trừng phạt bằng combo liên hoàn
      this.comboStep = 0;
      this.grabbedTarget = null;
      if (window.audioManager) window.audioManager.playHurt();
      if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);
      if (this.hp <= 0) {
        this.die(knockbackX);
        return;
      }
      this.state = 'guard_break';
      this.stateDuration = Math.max(this.stateDuration, this.guardBreakTimer);
      return;
    }

    // Đang thủ (Guard) và đỡ được đòn: giữ nguyên thế thủ, không bị ngắt vào hurt
    const isBlocked = (this.state === 'guard') || (this.pendingHit && this.pendingHit.blocked);
    if (isBlocked && !isKnockdown) {
      this.hp = Math.max(0, this.hp - amount);
      this.invincibleTimer = 0.04; // Cho phép liên tục đỡ chuỗi đòn trong combo
      if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);
      if (this.hp <= 0) this.die(knockbackX);
      return;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.invincibleTimer = 0.45;
    this.comboStep = 0;
    this.grabbedTarget = null;
    if (window.audioManager) window.audioManager.playHurt();
    if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);

    if (this.hp <= 0) {
      this.die(knockbackX);
      return;
    }

    if (isKnockdown) {
      this.stunTimer = 0;
      if (this.weapon && window.weaponSystem) {
        window.weaponSystem.spawnDrop(this.weapon.type, this.x, this.y, -this.facing, this.weapon.dur);
        window.weaponSystem.clearPlayerWeapon(this);
      }
      this.vx = knockbackX * 1.5;
      this.vz = 220;
      this.setState('knockdown', 0.8);
    } else {
      this.vx = knockbackX;
      this.setState('hurt', 0.26);
    }
  }

  // Gục ngã -> báo game over
  die(knockbackX = 0) {
    if (this.isDead) return;
    if (window.trainingManager && window.trainingManager.isActive) {
      this.hp = this.maxHp;
      this.isDead = false;
      this.setState('idle', 0.2);
      if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);
      return;
    }
    this.isDead = true;
    this.vx = knockbackX * 1.5;
    this.vz = 200;
    this.setState('knockdown', 1.2);
    if (window.audioManager) window.audioManager.playDefeat();
    if (window.game) {
      if (typeof window.game.scheduleGameOver === 'function') window.game.scheduleGameOver(900);
      else setTimeout(() => window.game.triggerGameOver(), 900);
    }
  }

  setState(newState, duration = 0) {
    // Trạng thái di chuyển lặp lại mỗi frame không được reset hoạt ảnh
    if (this.state === newState && duration === 0) return;
    this.state = newState;
    this.stateTimer = 0;
    this.stateDuration = duration;
    this.animTime = 0;
    this.hitTargets.clear();
    this._hitStopThisAttack = false;
    this._rhythmApplied = false; // mỗi cú vung chỉ tính nhịp 1 lần
    if (newState === 'dodge') this.perfectDodgeDone = false;
  }

  // ==========================================================================
  update(dt, enemies = []) {
    this.animTime += dt;
    this.attackClock += dt;
    this.stateTimer += dt;

    if (this.invincibleTimer > 0) this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
    if (this.exhaustTimer > 0) this.exhaustTimer = Math.max(0, this.exhaustTimer - dt);
    if (this.kickCooldown > 0) this.kickCooldown = Math.max(0, this.kickCooldown - dt);
    if (this.dodgeCooldown > 0) this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    if (this.counterHandCooldown > 0) this.counterHandCooldown = Math.max(0, this.counterHandCooldown - dt);
    if (this.counterLegCooldown > 0) this.counterLegCooldown = Math.max(0, this.counterLegCooldown - dt);
    if (this.activeCounterWindow > 0) this.activeCounterWindow = Math.max(0, this.activeCounterWindow - dt);

    // Hồi thể lực khi ngừng ra đòn đủ 0.5s (nếu đang kiệt sức thì hồi chậm hơn)
    if (this.stamina < this.maxStamina && this.attackClock - this._lastAtkAt > 0.5) {
      this.stamina = Math.min(this.maxStamina, this.stamina + (this.exhaustTimer > 0 ? 18 : 38) * dt);
    }
    if (this.comboWindowTimer > 0) {
      this.comboWindowTimer -= dt;
      if (this.comboWindowTimer <= 0) this.comboStep = 0;
    }

    // ===== HỆ THỐNG THẾ THỦ & HỒI PHỤC KHIÊN (GUARD GAUGE REGEN & BREAK RECOVERY) =====
    if (this.guardBreakTimer > 0) {
      this.guardBreakTimer = Math.max(0, this.guardBreakTimer - dt);
      if (this.guardBreakTimer <= 0) {
        this.guardBreakTimer = 0;
        this.guardGauge = Math.round(this.maxGuardGauge * 0.4); // Hồi phục 40% độ bền khiên sau khi hết choáng
        if (this.state === 'guard_break') {
          this.setState('idle');
        }
      }
    } else if (this.state !== 'guard' && this.state !== 'guard_break') {
      if (this.guardGauge < this.maxGuardGauge && (this.attackClock - this.lastGuardHitTime) > this.guardRegenDelay) {
        this.guardGauge = Math.min(this.maxGuardGauge, this.guardGauge + this.guardRegenRate * dt);
      }
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
        const tickDmg = this.bleedDmg || 2;
        this.hp = Math.max(0, this.hp - tickDmg);
        if (window.effectManager) {
          window.effectManager.addFloatingText(`-${tickDmg} 🩸`, this.x, (this.y || 580) + (this.z || 0) - 120, 'bleed');
          window.effectManager.createHitSparks(this.x, (this.y || 580) + (this.z || 0) - 65, 4, false);
        }
        if (window.uiManager) {
          window.uiManager.updatePlayerHp(this.hp, this.maxHp);
        }
        if (this.hp <= 0) {
          this.die(0);
          return;
        }
      }
    }

    // Trọng lực (z âm = trên không)
    if (this.z < 0 || this.vz !== 0) {
      this.z -= this.vz * dt;
      this.vz -= this.gravity * dt;
      if (this.z >= 0) {
        this.z = 0;
        this.vz = 0;
        this.squashTimer = 0.16;
        this.squashType = 'land';
        if (this.state === 'flying_kick' || (this.state === 'jump_fall' && this.lastAerialAttack === 'flying_kick')) {
          // STATE MACHINE TIẾP ĐẤT CHO ĐÁ BAY SPACE + K (CHỐNG SPAM)
          // Đòn trúng đích: recovery chuẩn 0.55s.
          // Đòn đánh hụt: phạt thêm +0.20s recovery = 0.75s!
          const recDuration = this.kickHasHit ? 0.55 : 0.75;
          this.vx *= 0.35; // Giảm đà lao về phía trước khi tiếp đất
          this.setState('landing', recDuration);
          if (window.effectManager) {
            window.effectManager.createDust(this.x, this.y, 10, 45);
            if (!this.kickHasHit) {
              window.effectManager.addFloatingText('HỤT ĐÒN — HỒI PHỤC!', this.x, this.y - 145, 'stale');
            }
          }
          this.lastAerialAttack = null;
        } else if (this.state === 'air_punch' || (this.state === 'jump_fall' && this.lastAerialAttack === 'air_punch')) {
          // STATE MACHINE TIẾP ĐẤT CHO PHI QUYỀN SPACE + J (CHỐNG SPAM)
          // Đòn trúng đích: recovery 0.24s nhanh nhẹn.
          // Đòn đánh hụt: phạt sơ hở 0.44s để đối thủ có cơ hội trừng phạt!
          const recDuration = this.airPunchHasHit ? 0.24 : 0.44;
          this.vx *= 0.30;
          this.setState('landing', recDuration);
          if (window.effectManager) {
            window.effectManager.createDust(this.x, this.y, 8, 35);
            if (!this.airPunchHasHit) {
              window.effectManager.addFloatingText('HỤT ĐÒN — HỒI PHỤC!', this.x, this.y - 145, 'stale');
            }
          }
          this.lastAerialAttack = null;
        } else if (['jump_up', 'jump_fall'].includes(this.state)) {
          this.setState('idle');
          this.lastAerialAttack = null;
        }
        if (window.effectManager) window.effectManager.createDust(this.x, this.y, 8);
      }
    }

    // Ma sát mặt đất theo delta time
    if (this.z === 0) {
      const f = Math.exp(-12 * dt);
      this.vx *= f;
      this.vy *= f;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.y = Math.max(510, Math.min(640, this.y));

    // Đồng bộ hồi chiêu lên UI mỗi frame
    if (window.uiManager && window.uiManager.updateSkillCooldowns) {
      window.uiManager.updateSkillCooldowns(this);
    }
    if (this.hitJitterTimer > 0) this.hitJitterTimer = Math.max(0, this.hitJitterTimer - dt);
    if (this.squashTimer > 0) this.squashTimer = Math.max(0, this.squashTimer - dt);
    if (!this.isDead && this.hp > 0 && this.hp / this.maxHp <= 0.25) {
      this._lowHpBeatTimer = (this._lowHpBeatTimer || 0) - dt;
      if (this._lowHpBeatTimer <= 0) {
        this._lowHpBeatTimer = 0.85;
        if (window.audioManager && typeof window.audioManager.playLowHpPulse === 'function') {
          window.audioManager.playLowHpPulse();
        }
      }
    }

    this.updateStateLogic(dt, enemies);
  }

  updateStateLogic(dt, enemies) {
    if (this.isDead) {
      if (this.state !== 'knockdown') this.setState('knockdown', 1.2);
      return;
    }
    const st = this.state;
    const p = window.AnimUtil ? AnimUtil.progress(this) : 0;

    if (st === 'hurt') {
      if (this.stunTimer > 0) {
        this.vx = 0;
        this.vy = 0;
        return;
      }
      if (this.stateTimer >= this.stateDuration) this.setState('idle');
      return;
    }
    if (st === 'knockdown') {
      if (this.stateTimer >= this.stateDuration && this.z === 0) this.setState('getup', 0.4);
      return;
    }
    if (st === 'getup') {
      if (this.stateTimer >= this.stateDuration) this.setState('idle');
      return;
    }
    if (st === 'guard_break') {
      if (this.guardBreakTimer <= 0 || this.stateTimer >= this.stateDuration) {
        this.guardBreakTimer = 0;
        this.guardGauge = Math.max(this.guardGauge, Math.round(this.maxGuardGauge * 0.4));
        this.setState('idle');
      }
      return;
    }

    // Hồi phục sau khi tiếp đất (Landing Recovery của Space + K / Space + J)
    if (st === 'landing') {
      // Đòn trúng đích (Hit-confirm): tiếp đất vững chãi sau 0.08s là có thể hồi về idle ngay
      if ((this.kickHasHit || this.airPunchHasHit) && this.stateTimer >= 0.08) {
        this.kickHasHit = false;
        this.airPunchHasHit = false;
        this.setState('idle');
        return;
      }
      if (this.stateTimer >= this.stateDuration) {
        this.kickHasHit = false;
        this.airPunchHasHit = false;
        this.setState('idle');
      }
      return;
    }

    // Thủ thế Counter Vovinam U+J và U+K (Chờ đón đòn trong cửa sổ counter)
    if (st === 'counter_hand_prep' || st === 'counter_leg_prep') {
      if (this.activeCounterWindow <= 0 && !this.counterSuccess) {
        // Hết thời gian cửa sổ mà không bắt được đòn -> Chịu phạt Whiff Recovery!
        const isHand = (st === 'counter_hand_prep');
        this.setState(isHand ? 'counter_hand_recovery' : 'counter_leg_recovery', isHand ? 0.38 : 0.46);
        if (window.effectManager) {
          window.effectManager.addFloatingText('HỤT COUNTER!', this.x, this.y - 150, 'stale');
        }
      }
      return;
    }

    // Hồi phục khi Counter hụt (Whiff Recovery — đối thủ có cửa sổ trừng phạt)
    if (st === 'counter_hand_recovery' || st === 'counter_leg_recovery') {
      if (this.stateTimer >= this.stateDuration) this.setState('idle');
      return;
    }

    // Đòn phản công Vovinam khi Counter thành công (Active strike)
    if (st === 'counter_hand_strike' || st === 'counter_leg_strike') {
      if (this.stateTimer >= this.stateDuration) this.setState('idle');
      return;
    }

    // Né tránh
    if (st === 'dodge') {
      this.invincibleTimer = Math.max(this.invincibleTimer, 0.1);
      if (window.effectManager && Math.random() < 0.5) window.effectManager.addGhostTrail(this, 'rgba(0, 210, 255, 0.5)');
      if (!this.perfectDodgeDone) this.checkPerfectDodgeOpportunity(enemies);
      if (this.stateTimer >= this.stateDuration) this.setState('idle');
      return;
    }

    // Đòn chân kẹp biểu diễn
    if (st === 'scissor_kick') {
      const target = this.grabbedTarget;
      if (target && !target.isDead) {
        target.x = this.x + this.facing * 28;
        target.y = this.y;
        target.z = Math.min(0, this.z + 10);
        target.vx = 0;
        if (p > 0.6 && !this.scissorHitDone) {
          this.scissorHitDone = true;
          if (window.audioManager) {
            window.audioManager.playScissorClamp();
            if (typeof window.audioManager.playVovinamKiai === 'function') {
              window.audioManager.playVovinamKiai('scissor', this.characterId || 'nghi');
            }
          }
          if (window.saveManager) {
            window.saveManager.unlockAchievement('scissor_master');
          }
          if (window.effectManager) {
            window.effectManager.triggerFinisherMoment(target.x, target.y - 35, 'ĐÒN CHÂN SỐ 7: KẸP CỔ', '#00f0ff', '#ffd700');
            window.effectManager.createGroundCrack(target.x, target.y, 90, '#ffd700');
            window.effectManager.createShockRing(target.x, target.y - 40, '#ffd700');
            window.effectManager.createDust(target.x, target.y, 18);
            window.effectManager.addFloatingText('🥋 ĐÒN CHÂN SỐ 7: KẸP CỔ QUẬT NGÃ!', target.x, target.y - 175, 'ultimate');
          }
          target.hitJitterTimer = 0.12;
          target.takeDamage(240, this.facing * 6, true);
          this.addEnergy(Math.round(8 * this.energyMul));
          if (window.combatSystem) window.combatSystem.registerHit(true, target, 240, true);
          if (window.game) window.game.hitStop = 0.085;
        }
      }
      if (this.stateTimer >= this.stateDuration) {
        this.grabbedTarget = null;
        this.scissorHitDone = false;
        this.setState('idle');
      }
      return;
    }

    // ==== TUYỆT KỸ (mỗi nhân vật một kiểu riêng — xem runUltimate) ====
    if (typeof st === 'string' && st.indexOf('ultimate_') === 0) {
      this.runUltimate(st, dt, enemies);
      return;
    }

    // ==== FINISHER riêng của nhân vật (Xô Bật / Nặng / Lao Tới / Húc / Phản Kích) ====
    if (this._finisherState && st === this._finisherState) {
      if (window.AnimUtil && AnimUtil.isActive(this)) this.checkAttackCollision(enemies);
      if (this.stateTimer >= this.stateDuration) {
        this._finisherState = null;
        this.comboWindowTimer = 0.6;
        this.setState(this.z < 0 ? 'jump_fall' : 'idle');
      }
      return;
    }

    // ==== ĐÒN VŨ KHÍ NHẶT ĐƯỢC ====
    if (typeof st === 'string' && st.indexOf('wp_') === 0) {
      if (window.weaponSystem) {
        window.weaponSystem.updatePlayerAttack(this, dt, enemies);
      }
      return;
    }

    // Các đòn đấm / đá: nối combo mượt mà ngay sau khi đòn trước chạm đích
    if (['punch_straight', 'punch_hook', 'kick_push', 'kick_roundhouse', 'flying_kick', 'air_punch', 'hook_run', 'elbow_strike', 'kick_sweep', 'uppercut'].includes(st)) {
      if (window.AnimUtil && AnimUtil.isActive(this)) this.checkAttackCollision(enemies);

      // Đá bay: nếu chạm đất thì Z-physics đã đưa vào 'landing'; nếu hết thời gian trên không thì rơi tự do
      if (st === 'flying_kick') {
        if (this.z >= 0) {
          const recDuration = this.kickHasHit ? 0.55 : 0.75;
          this.setState('landing', recDuration);
          this.lastAerialAttack = null;
        } else if (this.stateTimer >= this.stateDuration) {
          this.setState('jump_fall');
        }
        return;
      }
      if (st === 'air_punch') {
        if (this.z >= 0) {
          const recDuration = this.airPunchHasHit ? 0.24 : 0.44;
          this.setState('landing', recDuration);
          this.lastAerialAttack = null;
        } else if (this.stateTimer >= this.stateDuration) {
          this.setState('jump_fall');
        }
        return;
      }

      // Đòn nặng (chỏ / quét trụ / móc lên): cam kết tới hết đòn, không nối chuỗi
      if (st === 'elbow_strike' || st === 'kick_sweep' || st === 'uppercut') {
        if (this.stateTimer >= this.stateDuration) {
          this.comboWindowTimer = 0.6;
          this.setState('idle');
        }
        return;
      }

      // Đòn nhẹ: HIT-CONFIRM — trúng đòn thì nối/ngắt sớm, đánh hụt phải chịu hết hồi đòn
      const hitConfirm = this.hitTargets.size > 0;
      const cancelAt = hitConfirm ? 0.52 : 0.8;
      const canChain = p > cancelAt && (window.input.peek('KeyJ') || window.input.peek('KeyK'));
      const canEscape = p > (hitConfirm ? 0.6 : 0.86) && (window.input.block || window.input.peek('KeyL') || window.input.peek('Space'));
      if (canChain || canEscape || this.stateTimer >= this.stateDuration) {
        this.comboWindowTimer = 0.6;
        this.setState('idle');
        if (canChain) this.handlePlayerInput(enemies);
      }
      return;
    }

    this.handlePlayerInput(enemies);
  }

  startAttack(state, duration, lunge) {
    this._rhythmApplied = false;
    this.vx = this.facing * lunge;
    this.comboWindowTimer = 0.9;
    this.setState(state, duration);
    if (window.audioManager) window.audioManager.playWhoosh();
    this.spendStamina(state);
    if (window.allyManager) window.allyManager.checkCoopTrigger(this);
  }


  // ==========================================================================
  // THỂ LỰC: mỗi đòn tiêu hao thể lực — đá tốn hơn đấm, đòn thế tốn nhiều nhất
  // Hết thể lực -> KIỆT SỨC: không thể ra đòn trong 0.8s (thanh thể lực hiển thị trên đầu)
  // ==========================================================================
  spendStamina(state) {
    const COST = {
      punch_straight: 6, punch_hook: 8, air_punch: 10, elbow_strike: 12, hook_run: 14,
      kick_push: 13, kick_roundhouse: 16, boss_bash: 16, boss_riposte: 14, kick_sweep: 20, uppercut: 18, flying_kick: 15
    };
    const cost = COST[state] || 10;
    this._lastAtkAt = this.attackClock;
    this._staminaShownAt = this.attackClock;
    this.stamina -= cost;
    if (/kick|sweep/.test(state)) {
      this.kickCooldown = (state === 'flying_kick') ? 0.6 : this.maxKickCooldown;
    }
    if (this.stamina <= 0) {
      this.stamina = 28;
      this.exhaustTimer = 0.8;
      this.comboStep = 0;
      if (window.effectManager) {
        window.effectManager.addFloatingText('KIỆT SỨC!', this.x, this.y - 190, 'warn');
        window.effectManager.createDust(this.x, this.y, 8, 40);
      }
      if (window.audioManager) window.audioManager.playBlock();
    }
  }

  // ==========================================================================
  // NHỊP RA ĐÒN (chống spam đánh thường)
  //  - Mỗi đòn TRÚNG ĐÍCH trong vòng 0.8s kể từ đòn trước -> lực nhạt dần (đá tính gấp đôi)
  //  - Nghỉ trên 0.8s (né / đỡ / di chuyển / chờ) -> hồi dần
  //  - Quá nhạt (<= 60%) -> đòn mất khả năng gây choáng & quật ngã
  // ==========================================================================
  applyHitRhythm() {
    if (this._rhythmApplied) return this._attackMul === undefined ? 1 : this._attackMul;
    this._rhythmApplied = true;

    const RHYTHM = [1, 1, 0.8, 0.6, 0.42, 0.3, 0.22];
    const gap = this.attackClock - this._lastHitAt;
    this._lastHitAt = this.attackClock;
    const isKick = /kick|sweep/.test(this.state || '');
    const add = isKick ? 2 : 1;
    this.spamStack = gap > 0.8 ? Math.max(0, (this.spamStack || 0) - 2) : Math.min(6, (this.spamStack || 0) + add);
    this._attackMul = RHYTHM[this.spamStack];

    if (this._attackMul <= 0.6 && this.attackClock - this._warnedAt > 2.6) {
      this._warnedAt = this.attackClock;
      if (window.effectManager) {
        window.effectManager.addFloatingText('ĐÒN NHẠT DẦN — NGHỈ LẤY LỰC!', this.x, this.y - 175, 'warn');
      }
    }
    return this._attackMul;
  }

  // ==========================================================================
  // TUYỆT KỸ CHUNG CHO TOÀN BỘ NHÂN VẬT CHƠI ĐƯỢC
  //  flurry / slam / rush / precision / command / feint / bash
  // ==========================================================================
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

  startCounter(type, windowDuration = 0.22, cooldown = 2.5) {
    this.vx = 0;
    this.vy = 0;
    this.activeCounterType = type;
    this.activeCounterWindow = windowDuration;
    this.counterSuccess = false;
    if (type === 'hand') {
      this.counterHandCooldown = cooldown;
      this.setState('counter_hand_prep', windowDuration + 0.05);
    } else {
      this.counterLegCooldown = cooldown;
      this.setState('counter_leg_prep', windowDuration + 0.05);
    }
    if (window.audioManager) window.audioManager.playWarning();
    if (window.effectManager) {
      window.effectManager.createShockRing(this.x, this.y, type === 'hand' ? '#38bdf8' : '#eab308');
      window.effectManager.addFloatingText(type === 'hand' ? 'THỦ THẾ COUNTER TAY' : 'THỦ THẾ COUNTER CHÂN', this.x, this.y - 160, 'dodge');
    }
  }

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

  findClosestEnemy(enemies, range = 70) {
    let closest = null;
    let minDist = range;
    for (const enemy of enemies) {
      if (!enemy.isDead) {
        const dist = Math.hypot(enemy.x - this.x, (enemy.y - this.y) * 1.4);
        if (dist < minDist && (enemy.x - this.x) * this.facing > -20) {
          minDist = dist;
          closest = enemy;
        }
      }
    }
    return closest;
  }

  // Né đúng lúc đối thủ đang tung đòn gần mình -> Perfect Dodge (chỉ tính một lần mỗi lần né)
  checkPerfectDodgeOpportunity(enemies) {
    for (const enemy of enemies) {
      if (!enemy.isDead && enemy.isAttacking && Math.hypot(enemy.x - this.x, enemy.y - this.y) < 110) {
        this.perfectDodgeDone = true;
        if (window.combatSystem) window.combatSystem.triggerPerfectDodge();
        this.addEnergy(12);
        return;
      }
    }
  }

  checkAttackCollision(enemies) {
    let attackData = null;

    // Finisher riêng của nhân vật
    if (this._finisherState && this.state === this._finisherState) {
      attackData = this.finisherAttackData();
      if (!attackData) return;
    } else {
      switch (this.state) {
        case 'punch_straight':
          attackData = { damage: 40, offsetX: 52, offsetY: -80, width: 60, height: 45, knockback: 160, counterType: 'hand', energyGain: 8 }; break;
        case 'punch_hook':
          attackData = { damage: 55, offsetX: 52, offsetY: -85, width: 66, height: 50, knockback: 240, counterType: 'hand', energyGain: 12 }; break;
        case 'kick_push':
          attackData = { damage: 65, offsetX: 60, offsetY: -60, width: 74, height: 50, knockback: 380, isKick: true, counterType: 'leg', energyGain: 14 }; break;
        case 'kick_roundhouse':
          attackData = { damage: 85, offsetX: 62, offsetY: -80, width: 90, height: 60, knockback: 480, knockdown: true, isKick: true, counterType: 'leg', energyGain: 18 }; break;
        case 'flying_kick':
          attackData = { damage: 120, offsetX: 62, offsetY: -60, width: 80, height: 55, knockback: 580, knockdown: true, isKick: true, counterType: 'leg', energyGain: 22 }; break;
        // ===== Đòn thế mở rộng =====
        case 'elbow_strike':
          attackData = { damage: 76, offsetX: 42, offsetY: -88, width: 48, height: 52, knockback: 280, unblockable: true, weight: 'heavy', counterType: 'hand', energyGain: 14 }; break;
        case 'uppercut':
          attackData = { damage: 82, offsetX: 48, offsetY: -102, width: 56, height: 80, knockback: 260, knockdown: true, weight: 'heavy', counterType: 'hand', energyGain: 16 }; break;
        case 'kick_sweep':
          attackData = { damage: 70, offsetX: 66, offsetY: -22, width: 104, height: 42, knockback: 340, knockdown: true, unblockable: true, isKick: true, weight: 'heavy', counterType: 'leg', energyGain: 16 }; break;
        case 'air_punch':
          attackData = { damage: 65, offsetX: 56, offsetY: -70, width: 62, height: 48, knockback: 300, knockdown: true, weight: 'medium', counterType: 'hand', energyGain: 12 }; break;
        case 'hook_run':
          attackData = { damage: 68, offsetX: 58, offsetY: -84, width: 72, height: 54, knockback: 430, knockdown: true, weight: 'heavy', counterType: 'hand', energyGain: 16 }; break;
        default: return;
      }
      // Áp dụng thông số theo nhân vật đang chơi
      attackData.damage = Math.round(attackData.damage * this.dmgMul);
      attackData.width = Math.round(attackData.width * this.reachMul);
      attackData.offsetX = Math.round(attackData.offsetX * Math.max(1, this.reachMul));
      attackData.knockback = Math.round(attackData.knockback * this.kbMul);
      attackData.energyGain = Math.round((attackData.energyGain || 8) * this.energyMul);
    }

    // Đòn "nhạt lực" do spam liên tục được xử lý trong combatSystem.resolveHit
    // (áp dụng cho đúng cú đấm TRÚNG ĐÍCH, tránh phạt oan khi đánh hụt)

    for (const enemy of enemies) {
      if (!enemy.isDead) window.combatSystem.checkAttackHit(this, enemy, attackData);
    }

    // Tương tác va chạm phá hủy thùng hàng và vật thể sân khấu
    if (window.propSystem) {
      window.propSystem.checkAttackHit(this, attackData);
    }
  }
}

window.Player = Player;
