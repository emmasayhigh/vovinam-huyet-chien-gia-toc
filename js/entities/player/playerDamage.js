/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/player/playerDamage.js - Nhan sat thuong, counter va va cham don danh.
 */

(function () {
class PlayerDamage extends window.PlayerBase {
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

window.PlayerDamage = PlayerDamage;
})();
