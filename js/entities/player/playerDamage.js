/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/player/playerDamage.js - Nhan sat thuong, counter va va cham don danh.
 */

(function () {
class PlayerDamage extends window.PlayerBase {
  _grantPvpRevengeEnergy(dmg) {
    if (this.isDead || this.isRemotePlayer || (this.hp || 0) <= 0 || dmg <= 0) return;
    if (window.onlineManager && window.onlineManager.isActive && window.onlineManager.mode === 'pvp') {
      const gain = Math.max(4, Math.min(12, Math.round(dmg * 0.08)));
      if (typeof this.addEnergy === 'function') this.addEnergy(gain);
    }
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    // Miễn nhiễm tuyệt đối khi đã chết, khi đang có i-frame, hoặc khi đang nằm sàn (knockdown) / đang đứng dậy (getup)
    if (this.isDead || this.invincibleTimer > 0 || this.state === 'knockdown' || this.state === 'getup') return;

    const isPvpActive = !!(window.onlineManager && window.onlineManager.isActive && window.onlineManager.mode === 'pvp');

    // Chủ động Phản Đòn Vovinam (U+J / U+K) trước đòn pvp_hit trực tiếp từ đối thủ Online
    if (isPvpActive && !this.isRemotePlayer && !this.pendingHit &&
        (this.state === 'counter_hand_prep' || this.state === 'counter_leg_prep') &&
        this.activeCounterWindow > 0) {
      const isHand = (this.activeCounterType === 'hand' || this.state === 'counter_hand_prep');
      this.counterSuccess = true;
      this.activeCounterWindow = 0;
      const counterDmg = Math.round((isHand ? 90 : 110) * (this.dmgMul || 1) * (this.counterBonus || 1));
      this.setState(isHand ? 'counter_hand_strike' : 'counter_leg_strike', isHand ? 0.36 : 0.44);
      if (typeof this.addEnergy === 'function') this.addEnergy(isHand ? 25 : 22);
      const rp = window.onlineManager.remotePlayer;
      if (rp && !rp.isDead && typeof rp.takeDamage === 'function') {
        rp.takeDamage(counterDmg, (this.facing || 1) * (isHand ? 6 : 12), !isHand);
      }
      if (window.audioManager) window.audioManager.playHeavyHit();
      if (window.effectManager) {
        window.effectManager.createShockRing(this.x, this.y, isHand ? '#38bdf8' : '#eab308');
        window.effectManager.addFloatingText('⚡ PHẢN ĐÒN PVP!', this.x, this.y - 175, 'counter');
      }
      return;
    }

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

    // Áp dụng hệ số sát thương nhận vào theo nội tại nhân vật (VD: Thiên Khánh +10% ST phải chịu)
    amount = Math.max(1, Math.round(amount * (this.incomingDamageMul || 1.0)));

    // ========================================================================
    // HỆ THỐNG 3 TẦNG GIÁP HÀO QUANG (3-TIER ARMOR AURAS) CHO NGƯỜI CHƠI
    // 1. WHITE: Hào Quang Trắng (Bất Tử Hoàn Toàn 0 DMG, Miễn Khống Chế)
    // 2. GOLD:  Hào Quang Vàng (Kim Cang Bất Khuất, Kháng Choáng/Ngã, Giảm 35% DMG, Bất Khả Phá)
    // 3. RED:   Hào Quang Đỏ  (Bá Thể Cương Kình, Kháng Choáng/Ngã, Có Thể Bị Phá Giáp)
    // ========================================================================
    if (this.auraArmor === 'white' && this.auraArmorTimer > 0) {
      if (window.effectManager) {
        const py = (this.y || 580) + (this.z || 0);
        window.effectManager.createEnergySparks(this.x, py - 85, 4);
        window.effectManager.addFloatingText('⚪ BẤT HOẠI (0 DMG)!', this.x, py - 150, 'ultimate');
      }
      if (window.audioManager) window.audioManager.playBlock();
      return;
    }

    if (this.auraArmor === 'gold' && this.auraArmorTimer > 0) {
      const reduced = Math.max(1, Math.round(amount * 0.65));
      this.hp = Math.max(0, this.hp - reduced);
      this.invincibleTimer = 0.12;
      this.vx = knockbackX * 0.12;
      if (window.audioManager) window.audioManager.playBlock();
      if (window.effectManager) {
        const py = (this.y || 580) + (this.z || 0);
        window.effectManager.createHitSparks(this.x, py - 85, 6, false);
        window.effectManager.addFloatingText('🟡 KIM CANG BẤT KHUẤT!', this.x, py - 150, 'heal');
      }
      if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);
      this._grantPvpRevengeEnergy(reduced);
      if (this.hp <= 0) this.die(knockbackX);
      return; // Giữ nguyên đòn tấn công và thế đứng
    }

    if (this.auraArmor === 'red' && this.auraArmorTimer > 0) {
      const reduced = Math.max(1, Math.round(amount * 0.85));
      this.auraArmorHp -= reduced;
      this.auraArmorHits = Math.max(0, (this.auraArmorHits || 1) - 1);

      if (this.auraArmorHp > 0 && this.auraArmorHits > 0) {
        // Bá thể đỏ vẫn còn độ bền -> Hấp thụ hoàn toàn choáng và ngã gục!
        this.hp = Math.max(0, this.hp - reduced);
        this.invincibleTimer = 0.14;
        this.vx = knockbackX * 0.18;
        if (window.audioManager) window.audioManager.playHurt();
        if (window.effectManager) {
          const py = (this.y || 580) + (this.z || 0);
          window.effectManager.createHitSparks(this.x, py - 85, 6, false);
          window.effectManager.addFloatingText(`🔴 BÁ THỂ ĐỎ (${this.auraArmorHp} HP)!`, this.x, py - 150, 'ultimate');
        }
        if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);
        this._grantPvpRevengeEnergy(reduced);
        if (this.hp <= 0) this.die(knockbackX);
        return; // Không bị ngắt chiêu hay quật ngã
      } else {
        // Bá thể đỏ bị phá vỡ!
        this.clearAuraArmor();
        if (window.effectManager) {
          const py = (this.y || 580) + (this.z || 0);
          window.effectManager.createShockRing(this.x, this.y || 580, '#ef4444');
          window.effectManager.triggerScreenShake(8, 0.22);
          window.effectManager.addFloatingText('💥 VỠ BÁ THỂ ĐỎ!', this.x, py - 165, 'warn');
        }
        if (window.audioManager) window.audioManager.playHeavyHit();
        // Tiếp tục rơi xuống nhánh nhận đòn và khựng/ngã gục phía dưới
      }
    }

    // Nội tại phòng vệ / né đòn / bảo mệnh trước khi nhận sát thương (từ module nhân vật)
    if (window.CharacterRegistry) {
      const preCtx = { amount, knockbackX, isKnockdown };
      const preRes = window.CharacterRegistry.onBeforeTakeDamage(this, preCtx);
      amount = preCtx.amount;
      if (preRes && preRes.cancelled) return;
    }

    // Giảm sát thương thụ động (Triệu Đình An: Thiết Bích Kim Cương -25%)
    if (this.damageReduction > 0) {
      amount = Math.max(1, Math.round(amount * (1 - this.damageReduction)));
    }

    // Super armor (Phó Đặng Hoàng Anh): đòn nhẹ gây 50% và không làm chùn bước
    if (this.superArmor && !isKnockdown && amount < this.armorThreshold) {
      const reduced = Math.max(1, Math.round(amount * 0.5));
      this.hp = Math.max(0, this.hp - reduced);
      this.invincibleTimer = 0.2;
      if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);
      this._grantPvpRevengeEnergy(reduced);
      if (window.effectManager) {
        window.effectManager.createHitSparks(this.x, this.y - 95, 6, false);
        window.effectManager.addFloatingText('CHỊU ĐÒN', this.x, this.y - 150, 'block');
      }
      return;
    }

    // Hào quang giảm sát thương từ Đồng Minh (Bích Lâm)
    if (this.allyDmgReduction && this.allyDmgReduction > 0) {
      amount = Math.max(1, Math.round(amount * (1 - this.allyDmgReduction)));
    }

    // Lá chắn Kim Cương từ Đồng Minh (Triệu Đình An)
    if (this.shieldHp && this.shieldHp > 0) {
      const absorbed = Math.min(this.shieldHp, amount);
      this.shieldHp -= absorbed;
      amount -= absorbed;
      if (window.effectManager) {
        if (typeof window.effectManager.createHitSparks === 'function') {
          window.effectManager.createHitSparks(this.x, this.y - 80, 8, false);
        }
        if (typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText(`KHIÊN HẤP THỤ -${absorbed} (CÒN ${this.shieldHp})`, this.x, this.y - 150, 'heal');
        }
      }
      if (amount <= 0) return;
    }

    // Đang trong trạng thái Bể Thủ (Guard Break): bị đánh trúng chịu sát thương trừng phạt, giữ nguyên thế choáng
    if (this.state === 'guard_break' || this.guardBreakTimer > 0) {
      this.hp = Math.max(0, this.hp - amount);
      this.invincibleTimer = 0.05; // Cho phép đối phương trừng phạt bằng combo liên hoàn
      this.comboStep = 0;
      this.grabbedTarget = null;
      if (window.audioManager) window.audioManager.playHurt();
      if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);
      this._grantPvpRevengeEnergy(amount);
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
      if (isPvpActive && (!this.pendingHit || !this.pendingHit.blocked) && typeof this.addEnergy === 'function') {
        this.addEnergy(6);
      }
      if (this.weapon && this.weapon.type === 'shield' && this.weapon.dur > 0) {
        const heavyChip = amount >= 5;
        amount = Math.max(0, Math.floor(amount * 0.25));
        if (typeof this.guardGauge === 'number' && typeof this.maxGuardGauge === 'number') {
          this.guardGauge = Math.min(this.maxGuardGauge, this.guardGauge + 8);
        }
        if (window.audioManager && typeof window.audioManager.playBlock === 'function') {
          window.audioManager.playBlock();
        }
        if (window.effectManager) {
          if (typeof window.effectManager.createHitSparks === 'function') {
            window.effectManager.createHitSparks(this.x + (this.facing || 1) * 26, (this.y || 580) - 82, 8, false);
          }
          if (typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText('🛡️ ĐỠ KHIÊN!', this.x, (this.y || 580) - 135, 'block');
          }
        }
        if (heavyChip) {
          this.weapon.dur = Math.max(0, this.weapon.dur - 1);
        }
      }
      this.hp = Math.max(0, this.hp - amount);
      this.invincibleTimer = 0.04; // Cho phép liên tục đỡ chuỗi đòn trong combo
      if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);
      if (this.hp <= 0) this.die(knockbackX);
      return;
    }

    // ===== BÁ THỂ / LỲ ĐÒN (COMBO TENACITY & ANTI-FLINCH) =====
    // Khi đang xuất chiêu combo võ thuật, đòn đánh nhẹ của đối phương không thể bẻ gãy nhịp quyền cước!
    const isPlayerAttackingMove = this.isAttacking || (this.state && (
      this.state.startsWith('punch_') || this.state.startsWith('kick_') ||
      this.state.startsWith('attack_') || this.state.startsWith('ultimate_') ||
      ['uppercut', 'elbow_strike', 'hook_run', 'air_punch', 'flying_kick'].includes(this.state)
    ));
    const flinchThreshold = (this.armorThreshold || 55);
    const hasTenacity = this.superArmor || (isPlayerAttackingMove && !isKnockdown && amount < flinchThreshold);

    if (hasTenacity && !isKnockdown) {
      this.hp = Math.max(0, this.hp - amount);
      this.invincibleTimer = 0.18;
      this.vx = knockbackX * 0.15; // Giữ vững thế tấn, chỉ lùi nhẹ
      if (this.comboWindowTimer > 0) {
        this.comboWindowTimer = Math.max(this.comboWindowTimer, 0.8);
      }
      if (window.audioManager) window.audioManager.playHurt();
      if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);
      this._grantPvpRevengeEnergy(amount);
      if (window.effectManager) {
        window.effectManager.createHitSparks(this.x, this.y - 85, 8, false);
        window.effectManager.addFloatingText('LỲ ĐÒN — BÁ THỂ!', this.x, this.y - 145, 'block');
      }
      if (this.hp <= 0) this.die(knockbackX);
      return; // Tiếp tục duy trì đòn tấn công và nhịp combo!
    }

    this.hp = Math.max(0, this.hp - amount);
    this.invincibleTimer = 0.45;
    this.grabbedTarget = null;
    if (window.audioManager) window.audioManager.playHurt();
    if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);
    this._grantPvpRevengeEnergy(amount);

    if (this.hp <= 0) {
      this.comboStep = 0;
      this.die(knockbackX);
      return;
    }

    // Cơ chế chống lặp quật ngã liên hoàn (Anti-Knockdown Vortex):
    // Đã nerf xuống 1.0s: Nếu vừa bị quật ngã trong vòng 1.0s qua, đòn tiếp theo chỉ gây chùn bước (hurt)
    const nowClock = this.attackClock || 0;
    if (isKnockdown && (nowClock - (this.lastKnockdownTime || -99) < 1.0)) {
      isKnockdown = false;
    }

    if (isKnockdown) {
      this.comboStep = 0;
      this.stunTimer = 0;
      this.lastKnockdownTime = nowClock;
      if (this.weapon && window.weaponSystem) {
        if (this.weapon.dur > 0) {
          window.weaponSystem.spawnDrop(this.weapon.type, this.x, this.y, -this.facing, this.weapon.dur);
        }
        window.weaponSystem.clearPlayerWeapon(this);
      }
      this.vx = knockbackX * 1.25;
      this.vz = 200;
      this.invincibleTimer = 0.45; // Miễn nhiễm sát thương khi đang văng trên không
      this.setState('knockdown', 0.45); // Rút ngắn thời gian nằm sàn từ 0.8s xuống 0.45s
    } else {
      // Giữ nhịp combo: Không xóa comboStep về 0 khi bị trúng đòn nhẹ!
      // Cấp cửa sổ gia hạn 0.9s để sau 0.24s hurt người chơi vẫn tiếp tục nối chuỗi combo được!
      if (this.comboStep > 0) {
        this.comboWindowTimer = 0.9;
      }
      if (this.weapon && this.weapon.dur <= 0 && window.weaponSystem) {
        window.weaponSystem.breakWeapon(this, this.weapon);
      }
      this.vx = knockbackX;
      this.setState('hurt', 0.24);
    }
  }

  // Gục ngã -> báo game over

  startCounter(type, windowDuration = 0.32, cooldown = 2.5) {
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
    const isPvpActive = !!(window.onlineManager && window.onlineManager.isActive && window.onlineManager.mode === 'pvp');
    for (const enemy of enemies) {
      if (!enemy.isDead && enemy.isAttacking && Math.hypot(enemy.x - this.x, enemy.y - this.y) < 110) {
        this.perfectDodgeDone = true;
        if (window.combatSystem) window.combatSystem.triggerPerfectDodge(this);
        this.addEnergy(isPvpActive ? 16 : 12);
        return;
      }
    }
  }


  checkAttackCollision(enemies) {
    let attackData = null;

    // Finisher hoặc đòn đánh thường theo module nhân vật đang chơi
    if (this._finisherState && this.state === this._finisherState) {
      attackData = this.finisherAttackData();
      if (!attackData) return;
    } else {
      attackData = window.CharacterRegistry ? window.CharacterRegistry.getMoveAttackData(this, this.state) : null;
      if (!attackData) return;
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
