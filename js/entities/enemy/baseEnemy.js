/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/enemy/baseEnemy.js - Lop co so cho moi loai dich: mau, AI, nhan don.
 */

class BaseEnemy {
  constructor(x, y, type = 'thug', name = 'Lính Đánh Thuê') {
    this.id = 'enemy_' + Math.random().toString(36).substr(2, 9);
    this.type = type;
    this.name = name;
    this.x = x;
    this.y = y;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.facing = -1;
    this.gravity = 1300;

    this.maxHp = 180;
    this.hp = 180;
    this.speed = 130;
    this.isDead = false;
    this.invincibleTimer = 0;
    this.isAttacking = false;

    this.state = 'idle';
    this.animTime = Math.random() * 3; // lệch pha để lính không nhún nhảy đồng loạt
    this.stateTimer = 0;
    this.stateDuration = 0;
    this.attackCooldown = 0.8 + Math.random() * 0.6;
    this.hitTargets = new Set();

    // ==== Siêu giáp / chống spam: đòn nhẹ không đủ sức hạ thế đứng ====
    this.armorTimer = 0;      // gồng sau khi bị dồn đòn liên tiếp
    this.hitsTaken = 0;       // số đòn ăn liên tiếp trong cửa sổ ngắn
    this.hitWindowTimer = 0;
    this.breakThreshold = 4;  // bị liên tiếp bấy nhiêu đòn thì gồng lên phản công
    this.armorAll = false;    // boss: chỉ đòn quật ngã mới làm chùn bước
    this.followupChance = 0;  // xác suất tung đòn nối tiếp (chuỗi 2 nhịp)
    this.reactCooldown = 0;   // giới hạn nhịp "phản công khi người chơi ra đòn"

    // Khoảng cách ưa thích khi đánh (mỗi lính lệch một chút -> không dồn thành một cục)
    this.preferredDist = 74 + Math.random() * 30;
    // Cửa sổ sơ hở: boss lộ recovery -> người chơi trừng phạt được (sát thương tăng)
    this.weakWindow = 0;
    // Ngăn AI tấn công đồng loạt: chỉ tối đa vài kẻ được quyền ra đòn cùng lúc
    this.attackTokenHeld = false;
    // Giọng nói / câu nói trong trận (boss điện ảnh)
    this.tauntLines = [];
    this.tauntCooldown = 0;

    // Phân biệt va chạm: cờ knockback từ đòn đánh chiến đấu hợp lệ
    this.combatKnockbackTimer = 0;
    this.isKnockedBack = false;
    this._steerTimer = 0;
    this._steerDirY = 0;
    this._targetLockTimer = 0;
    this._turnCooldown = 0;
    this.targetAlly = false;
    this.currentTarget = null;

    // ===== HỆ THỐNG POISE & CHỐNG VÒNG LẶP KNOCKDOWN CHO BOSS =====
    this.maxPoise = 120;
    this.poise = 120;
    this.poiseRegenDelay = 0;
    this.knockdownImmuneTimer = 0; // Thời gian miễn nhiễm quật ngã lặp lại sau khi đứng dậy

    // ===== HIỆU ỨNG TRẠNG THÁI TỪ VŨ KHÍ & NỘI TẠI VÕ SĨ =====
    this.stunTimer = 0;            // Thời gian bị choáng (từ Côn / Gậy)
    this.bleedTimer = 0;           // Thời gian duy trì xuất huyết (từ Mã Tấu / Song Đao)
    this.bleedTickTimer = 0;       // Bộ đếm chu kỳ nhảy sát thương xuất huyết (0.8s)
    this.bleedDmg = 0;             // Sát thương mỗi tick xuất huyết
    this.slowTimer = 0;            // Thời gian bị làm chậm tốc độ (Trọng Chùy / Hàn Khí / Lệnh Bài)
    this.speedMul = 1.0;           // Hệ số tốc độ di chuyển (1.0 = bình thường)
    this.frozenTimer = 0;          // Thời gian bị đóng băng (Ngô Giang Mạnh)
    this.blindTimer = 0;           // Thời gian bị mù / khóa đòn đánh (Phó Dung Hải)
    this.chillStacks = 0;          // Số cộng dồn Hàn Khí
    this.allyCcImmunityTimer = 0;  // Kháng khống chế lặp lại từ đồng minh (chống stun lock)

    // ===== HỆ THỐNG 3 TẦNG GIÁP HÀO QUANG (3-TIER ARMOR AURAS) =====
    // 'red'   = Bá Thể Cương Kình (Kháng choáng/ngã, nhận sát thương, có thể bị phá)
    // 'gold'  = Kim Cang Bất Khuất (Kháng choáng/ngã, giảm 35% DMG, BẤT KHẢ PHÁ)
    // 'white' = Bất Hoại Thân Pháp (BẤT TỬ HOÀN TOÀN 0 DMG, kháng mọi hiệu ứng)
    this.auraArmor = null;
    this.auraArmorTimer = 0;
    this.auraArmorHp = 0;
    this.auraArmorMaxHp = 0;
    this.auraArmorHits = 0;
  }

  static resolveKnockback(knockbackX) {
    if (typeof knockbackX === 'number') return Number.isFinite(knockbackX) ? knockbackX : 0;
    if (knockbackX && typeof knockbackX === 'object') {
      if (Number.isFinite(knockbackX.force)) return knockbackX.force;
      if (Number.isFinite(knockbackX.knockbackX)) return knockbackX.knockbackX;
    }
    return 0;
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    if (this.isDead || this.invincibleTimer > 0) return;
    // Chống OTG / chém lúc đối thủ đang gục sàn hoặc đang trong animation đứng dậy
    if (this.state === 'knockdown' || this.state === 'getup') return;

    if (knockbackX && typeof knockbackX === 'object') {
      if (!this.pendingHit) {
        this.pendingHit = {
          weight: 'heavy',
          isCrit: !!knockbackX.critical,
          knockdown: !!knockbackX.knockback
        };
      }
      isKnockdown = Boolean(isKnockdown || knockbackX.knockdown);
    }
    knockbackX = BaseEnemy.resolveKnockback(knockbackX);
    amount = Number.isFinite(amount) ? Math.max(0, amount) : 0;

    const hit = this.pendingHit || null;
    this.pendingHit = null;
    const weight = hit ? hit.weight : (isKnockdown ? 'heavy' : 'light');

    // ===== HỆ THỐNG 3 TẦNG GIÁP HÀO QUANG (3-TIER ARMOR AURAS) CHO KẺ ĐỊCH / BOSS =====
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
      this.invincibleTimer = 0.08;
      this.vx = knockbackX * 0.1;
      if (window.audioManager) window.audioManager.playBlock();
      if (window.effectManager) {
        const py = (this.y || 580) + (this.z || 0);
        window.effectManager.createHitSparks(this.x, py - 85, 6, false);
        window.effectManager.addFloatingText('🟡 KIM CANG BẤT KHUẤT!', this.x, py - 150, 'heal');
      }
      if (this.hp <= 0) {
        this.isDead = true;
        this.isAttacking = false;
        this.setState('knockdown', 1.0);
      }
      return; // Giữ nguyên đòn đánh và trạng thái, không bị flinch hay ngã gục
    }

    if (this.auraArmor === 'red' && this.auraArmorTimer > 0) {
      const reduced = Math.max(1, Math.round(amount * 0.85));
      this.auraArmorHp -= reduced;
      this.auraArmorHits = Math.max(0, (this.auraArmorHits || 1) - 1);

      if (this.auraArmorHp > 0 && this.auraArmorHits > 0) {
        this.hp = Math.max(0, this.hp - reduced);
        this.invincibleTimer = 0.1;
        this.vx = knockbackX * 0.15;
        if (window.audioManager) window.audioManager.playHurt();
        if (window.effectManager) {
          const py = (this.y || 580) + (this.z || 0);
          window.effectManager.createHitSparks(this.x, py - 85, 6, false);
          window.effectManager.addFloatingText(`🔴 BÁ THỂ ĐỎ (${this.auraArmorHp} HP)!`, this.x, py - 150, 'ultimate');
        }
        if (this.hp <= 0) {
          this.isDead = true;
          this.isAttacking = false;
          this.setState('knockdown', 1.0);
        }
        return; // Đứng vững, không bị ngắt chiêu
      } else {
        this.clearAuraArmor();
        if (window.effectManager) {
          const py = (this.y || 580) + (this.z || 0);
          window.effectManager.createShockRing(this.x, this.y || 580, '#ef4444');
          window.effectManager.triggerScreenShake(7, 0.2);
          window.effectManager.addFloatingText('💥 VỠ BÁ THỂ ĐỎ!', this.x, py - 165, 'warn');
        }
        if (window.audioManager) window.audioManager.playHeavyHit();
      }
    }

    // ===== HỆ THỐNG QUY TẮC QUẬT NGÃ & POISE DÀNH CHO BOSS =====
    let bossCanKnockdown = false;
    if (this.isBoss) {
      this.poiseRegenDelay = 2.2;
      let poiseDmg = 16;
      if (weight === 'ultimate') poiseDmg = 80;
      else if (hit && hit.isCrit) poiseDmg = 50;
      else if (hit && hit.attackerState === 'air_punch') poiseDmg = 24; // Space + J Phi Quyền gây áp lực poise vừa phải
      else if (isKnockdown) poiseDmg = 42; // Space + K hoặc đòn nặng knockdown
      else if (weight === 'heavy') poiseDmg = 30;

      this.poise = Math.max(0, this.poise - poiseDmg);

      const isWeak = (this.weakWindow > 0);
      const isPoiseBroken = (this.poise <= 0);
      const isGuardBroken = !!this.guardBroken;
      const isUltimate = (weight === 'ultimate');
      const isLegCounter = !!(hit && hit.isLegCounter);

      // Boss chỉ bị quật ngã khi:
      // 1. Không nằm trong khoảng chống quật ngã lặp lại (knockdownImmuneTimer <= 0)
      // 2. VÀ thỏa mãn điều kiện chiến thuật: sơ hở trừng phạt, vỡ thế thủ, đòn tuyệt kỹ, hoặc counter chân
      if (this.knockdownImmuneTimer <= 0 && (isWeak || isPoiseBroken || isGuardBroken || isUltimate || isLegCounter)) {
        bossCanKnockdown = true;
        this.poise = this.maxPoise;
        this.guardBroken = false;
        if (isPoiseBroken && window.effectManager) {
          window.effectManager.addFloatingText('PHÁ THẾ THỦ — QUẬT NGÃ!', this.x, this.y - 165, 'counter');
        }
      } else {
        bossCanKnockdown = false;
        if (isKnockdown && window.effectManager) {
          if (this.knockdownImmuneTimer > 0) {
            window.effectManager.addFloatingText('TRỤ VỮNG!', this.x, this.y - 150, 'block');
          } else {
            window.effectManager.addFloatingText('THẾ ĐỨNG VỮNG (' + Math.round(this.poise) + '/' + this.maxPoise + ')', this.x, this.y - 150, 'stale');
          }
        }
      }
    }

    const effectiveKnockdown = this.isBoss ? bossCanKnockdown : isKnockdown;

    this.hp = Math.max(0, this.hp - amount);
    // Bất tử ngắn tránh trùng frame
    this.invincibleTimer = effectiveKnockdown ? 0.45 : 0.05;

    // Đếm đòn liên tiếp để phát hiện "spam đánh thường"
    if (!hit || !hit.blocked) {
      this.hitsTaken++;
      this.hitWindowTimer = 1.5;
    }

    if (this.hp <= 0) {
      this.isDead = true;
      this.isAttacking = false;
      this.stunTimer = 0;
      this.vx = knockbackX * 1.6;
      this.vz = 200;
      this.combatKnockbackTimer = 0.8;
      this.isKnockedBack = true;
      this.setState('knockdown', 1.0);
      return;
    }

    // ===== SIÊU GIÁP (Poise) =====
    // Đòn quật ngã / bạo kích luôn hạ được thế đứng. Còn lại thì:
    //  - Đang ra đòn: cam kết đòn đánh, đòn nhẹ không ngắt được
    //  - Boss: cực kỳ vững, chỉ quật ngã mới làm chùn
    const interrupt = effectiveKnockdown || isKnockdown || (!this.armorAll && (weight === 'ultimate' || (hit && hit.isCrit)));
    if (!interrupt) {
      // Đòn nhạt lực do spam liên tục: không đủ sức làm chùn bước, đối thủ đứng vững ăn đòn
      if (hit && hit.noFlinch) {
        this.vx = knockbackX * 0.35;
        return;
      }
      if (this.armorTimer > 0 || this.isAttacking) {
        // Ăn sát thương nhưng không chùn bước
        this.vx = knockbackX * 0.2;
        return;
      }
      // Boss bị dồn đòn liên tiếp trên chân: Gồng Bá Thể phá chuỗi (Anti-Infinite Combo Breakout)
      const currentThreshold = this.isBoss ? 3 : this.breakThreshold;
      if (hit && !hit.blocked && this.hitsTaken >= currentThreshold) {
        this.hitsTaken = 0;
        this.armorTimer = this.isBoss ? 1.4 : 1.1;
        this.attackCooldown = this.isBoss ? 0.05 : Math.min(this.attackCooldown, 0.12);
        this.vx = knockbackX * 0.15;
        if (this.isBoss) {
          this.state = 'idle'; // Thoát ngay lập tức khỏi hurt để phản kích!
        }
        if (window.audioManager) window.audioManager.playBlock();
        if (window.effectManager) {
          window.effectManager.createHitSparks(this.x, this.y - 95, 12, false);
          window.effectManager.addFloatingText(this.isBoss ? 'BÁ THỂ BỘC PHÁ!' : 'GỒNG ĐỠ!', this.x, this.y - 150, 'block');
          if (this.isBoss) {
            window.effectManager.createShockRing(this.x, this.y, '#f59e0b');
            window.effectManager.triggerScreenShake(6, 0.18);
          }
        }
        return;
      }
    }

    // Đòn đánh chiến đấu hợp lệ gây knockback: đánh dấu cờ knockback để va đập môi trường
    if (effectiveKnockdown) {
      this.stunTimer = 0;
      this.vx = knockbackX * 1.4;
      this.vz = 220;
      if (Math.abs(knockbackX) > 0) {
        this.combatKnockbackTimer = 0.65;
        this.isKnockedBack = true;
      }
      this.setState('knockdown', this.isBoss ? 0.45 : 0.8);
    } else {
      this.vx = knockbackX;
      if (Math.abs(knockbackX) > 100) {
        this.combatKnockbackTimer = 0.45;
        this.isKnockedBack = true;
      }
      this.setState('hurt', this.isBoss ? 0.18 : 0.28);
    }
  }

  // Thuật toán né chướng ngại vật cục bộ (Local Obstacle Avoidance)
  // Kiểm tra đường di chuyển phía trước, nếu có vật cản thì đổi hướng mượt mà, không rung lắc
  avoidObstacles(desiredVx, desiredVy, player) {
    if (!window.propSystem || !window.propSystem.props || window.propSystem.props.length === 0) {
      return { vx: desiredVx, vy: desiredVy };
    }

    const forwardLook = 55;
    const checkX = this.x + Math.sign(desiredVx || this.facing || 1) * forwardLook;
    const checkY = this.y + (desiredVy * 0.15);

    let obstacleFound = null;
    for (const p of window.propSystem.props) {
      if (!p.isSolid) continue;
      const hw = (p.width / 2) + 26;
      const hh = 26;
      if (Math.abs(checkX - p.x) < hw && Math.abs(checkY - p.y) < hh) {
        obstacleFound = p;
        break;
      }
    }

    if (obstacleFound) {
      // Có vật cản phía trước! Tính toán hướng né vòng tránh theo trục Y
      if (this._steerTimer <= 0) {
        this._steerTimer = 0.45; // Giữ hướng né ít nhất 0.45s để tránh rung lắc qua lại
        // Ưu tiên hướng né hợp lý dựa trên vị trí người chơi và ranh giới sàn đấu (510 - 640)
        if (this.y <= obstacleFound.y) {
          this._steerDirY = (this.y > 525) ? -1 : 1;
        } else {
          this._steerDirY = (this.y < 625) ? 1 : -1;
        }
      }
      return {
        vx: desiredVx * 0.25, // Giảm tốc tiến để không đâm sầm vào thùng
        vy: this._steerDirY * this.speed * 0.85
      };
    }

    return { vx: desiredVx, vy: desiredVy };
  }

  setState(newState, duration = 0) {
    // Trạng thái lặp lại mỗi frame (walk/idle) không được reset hoạt ảnh
    if (this.state === newState && duration === 0) return;
    // Trạng thái ra đòn = mọi trạng thái có trong ATTACK_STATES (bao gồm đòn mới của boss)
    const isAtk = (typeof ATTACK_STATES !== 'undefined' && ATTACK_STATES.has(newState)) ||
      ['punch_straight', 'punch_hook', 'kick_push', 'kick_roundhouse', 'boss_slash', 'boss_slam'].includes(newState);
    // Kéo dài thời gian gồng để người chơi kịp đọc đòn (dấu hiệu báo trước)
    if (isAtk && duration > 0) duration *= 1.45;
    this.state = newState;
    this.stateTimer = 0;
    this.stateDuration = duration;
    this.animTime = 0;
    this.hitTargets.clear();
    this.isAttacking = isAtk;
  }

  update(dt, player, allEnemies = []) {
    this.animTime += dt;
    this.stateTimer += dt;

    if (this.combatKnockbackTimer > 0) {
      this.combatKnockbackTimer -= dt;
      if (this.combatKnockbackTimer <= 0) this.isKnockedBack = false;
    }
    if (this._steerTimer > 0) this._steerTimer -= dt;
    if (this._targetLockTimer > 0) this._targetLockTimer = Math.max(0, this._targetLockTimer - dt);
    if (this._turnCooldown > 0) this._turnCooldown = Math.max(0, this._turnCooldown - dt);

    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.armorTimer > 0) this.armorTimer -= dt;
    if (this.hitWindowTimer > 0) {
      this.hitWindowTimer -= dt;
      if (this.hitWindowTimer <= 0) this.hitsTaken = 0;
    }
    if (this.weakWindow > 0) this.weakWindow -= dt;
    if (this.reactCooldown > 0) this.reactCooldown -= dt;
    if (this.tauntCooldown > 0) this.tauntCooldown -= dt;
    if (this.hitJitterTimer > 0) this.hitJitterTimer = Math.max(0, this.hitJitterTimer - dt);
    if (this.squashTimer > 0) this.squashTimer = Math.max(0, this.squashTimer - dt);
    if (this.allyCcImmunityTimer > 0) this.allyCcImmunityTimer = Math.max(0, this.allyCcImmunityTimer - dt);

    // Hiệu ứng Choáng Váng (Stun từ Côn / Gậy)
    if (this.stunTimer > 0) {
      // Boss phục hồi sau trạng thái choáng nhanh gấp 2.2 lần
      this.stunTimer = Math.max(0, this.stunTimer - (this.isBoss ? dt * 2.2 : dt));
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

    // Hiệu ứng Làm Chậm Tốc Độ (Slow từ Trọng Chùy / Hàn Khí / Lệnh Bài)
    if (this.slowTimer > 0) {
      this.slowTimer = Math.max(0, this.slowTimer - dt);
      if (this.slowTimer <= 0) {
        this.speedMul = 1.0;
        this.chillStacks = 0;
      }
    } else if (typeof this.speedMul === 'number' && this.speedMul < 1.0) {
      this.speedMul = 1.0;
    }

    // Hiệu ứng Đóng Băng (Frozen từ Ngô Giang Mạnh)
    if (this.frozenTimer > 0) {
      this.frozenTimer = Math.max(0, this.frozenTimer - dt);
      this.stunTimer = Math.max(this.stunTimer || 0, this.frozenTimer);
      if (this.state !== 'knockdown' && this.state !== 'getup') {
        this.vx = 0;
        this.vy = 0;
      }
    }

    // Hiệu ứng Mù & Triệt Tiêu Đòn Đánh (Blind từ Phó Dung Hải / Hứa Vũ Đại)
    if (this.blindTimer > 0) {
      this.blindTimer = Math.max(0, this.blindTimer - dt);
      this.attackCooldown = Math.max(this.attackCooldown || 0, Math.min(this.blindTimer, 0.35));
    }

    // Hiệu ứng Xuất Huyết (Bleed DoT từ Mã Tấu)
    if (this.bleedTimer > 0 && !this.isDead) {
      this.bleedTimer -= dt;
      this.bleedTickTimer = (this.bleedTickTimer || 0) - dt;
      if (this.bleedTickTimer <= 0) {
        this.bleedTickTimer = 0.8;
        const tickDmg = this.bleedDmg || 6;
        this.hp = Math.max(0, this.hp - tickDmg);
        if (window.effectManager) {
          window.effectManager.addFloatingText(`-${tickDmg} 🩸`, this.x, (this.y || 580) + (this.z || 0) - 120, 'bleed');
          window.effectManager.createHitSparks(this.x, (this.y || 580) + (this.z || 0) - 65, 4, false);
        }
        if (this.hp <= 0) {
          this.isDead = true;
          this.isAttacking = false;
          this.stunTimer = 0;
          this.setState('knockdown', 1.0);
          return;
        }
      }
    }

    // Hiệu ứng Thiêu Đốt (Burn DoT từ Kiếm Xu & Tà Quái Thiên Khánh)
    if (this.burnTimer > 0 && !this.isDead) {
      this.burnTimer = Math.max(0, this.burnTimer - dt);
      this.burnTickTimer = (this.burnTickTimer || 0) - dt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.7;
        const tickDmg = this.burnDmg || 10;
        this.hp = Math.max(0, this.hp - tickDmg);
        if (window.effectManager) {
          window.effectManager.addFloatingText(`-${tickDmg} 🔥`, this.x, (this.y || 580) + (this.z || 0) - 132, 'crit');
          window.effectManager.createHitSparks(this.x, (this.y || 580) + (this.z || 0) - 70, 5, true);
        }
        if (this.hp <= 0) {
          this.isDead = true;
          this.isAttacking = false;
          this.stunTimer = 0;
          this.setState('knockdown', 1.0);
          return;
        }
      }
    }

    if (this.knockdownImmuneTimer > 0) this.knockdownImmuneTimer -= dt;

    // Cập nhật Hào Quang Giáp (3-Tier Armor Auras)
    if (this.auraArmorTimer > 0) {
      this.auraArmorTimer = Math.max(0, this.auraArmorTimer - dt);
      if (this.auraArmorTimer <= 0) {
        this.clearAuraArmor();
      }
    }
    if (this.poiseRegenDelay > 0) {
      this.poiseRegenDelay -= dt;
    } else if (this.isBoss && this.poise < this.maxPoise && !this.isDead && this.state !== 'knockdown' && this.state !== 'getup') {
      this.poise = Math.min(this.maxPoise, this.poise + 24 * dt);
    }
    if (this.isBoss && window.uiManager && typeof window.uiManager.updateBossPoise === 'function') {
      window.uiManager.updateBossPoise(this.poise, this.maxPoise, this.weakWindow);
    }

    // Đang bị Ngô Nhất Nghị kẹp cổ: đứng yên chịu trận
    if (!this.isDead && player.grabbedTarget === this && player.state === 'scissor_kick' && !player.scissorHitDone) {
      this.setState('hurt', 0.35);
      return;
    }

    // Giãn cách bầy đàn (Crowd Separation): phân tán thông minh, chống chụm đông đè lên cùng 1 tọa độ
    if (allEnemies && allEnemies.length > 1 && !this.isDead && this.z === 0) {
      for (let i = 0; i < allEnemies.length; i++) {
        const other = allEnemies[i];
        if (other !== this && !other.isDead) {
          const dx = this.x - other.x;
          const dy = (this.y - other.y) * 1.4;
          const dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < 70) {
            const push = (70 - dist) * 5.2;
            this.x += (dx / dist) * push * dt;
            this.y += (dy / dist) * push * 0.8 * dt;
          } else if (dist === 0) {
            // Trùng khít tọa độ: tách ngẫu nhiên để không xếp lớp lên nhau
            this.x += (Math.random() - 0.5) * 40 * dt;
            this.y += (Math.random() - 0.5) * 24 * dt;
          }
        }
      }
    }

    // Vật lý Z (z âm = trên không, vz > 0 = đang bay lên)
    if (this.z < 0 || this.vz !== 0) {
      this.z -= this.vz * dt;
      this.vz -= this.gravity * dt;
      if (this.z >= 0) {
        this.z = 0;
        this.vz = 0;
        if (window.effectManager && this.state === 'knockdown') window.effectManager.createDust(this.x, this.y, 6);
      }
    }

    const friction = Math.exp(-12 * dt);
    if (!Number.isFinite(this.vx)) this.vx = 0;
    if (!Number.isFinite(this.vy)) this.vy = 0;
    this.vx *= friction;
    this.vy *= friction;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (!Number.isFinite(this.x)) this.x = (player && Number.isFinite(player.x)) ? player.x + 120 : 400;
    if (!Number.isFinite(this.y)) this.y = 575;

    if (this.isDead) return;

    this.y = Math.max(510, Math.min(640, this.y));

    // Giữ kẻ địch trong ranh giới chiến đấu hợp lệ (không chạy ra ngoài map/arena)
    if (window.game && window.game.arenaLocked) {
      this.x = Math.max(window.game.arenaMinX + 28, Math.min(window.game.arenaMaxX - 28, this.x));
    } else if (window.stageManager) {
      this.x = Math.max(28, Math.min(window.stageManager.stageWidth - 28, this.x));
    }

    const activeTarget = this.selectCombatTarget(player);
    if (['idle', 'walk'].includes(this.state) && !this.holdFacing && !this.isAttacking && activeTarget) {
      const dxFace = activeTarget.x - this.x;
      if (Math.abs(dxFace) > 4) {
        const desiredFacing = dxFace >= 0 ? 1 : -1;
        if (desiredFacing !== this.facing && this._turnCooldown <= 0) {
          this.facing = desiredFacing;
          this._turnCooldown = 0.22;
        }
      }
    }

    this.updateAI(dt, player);
  }

  /**
   * Lựa chọn mục tiêu tác chiến thông minh:
   *  - Boss (isBoss === true):
   *    1. "Nếu 2 thằng đều ít máu thì đuổi theo thằng gần hơn" (Cả 2 <= 40% HP -> chọn kẻ gần hơn)
   *    2. "Nếu cả 2 thằng đều xa thì đuổi theo thằng % máu ít hơn" (Cả 2 >= 180px -> truy đuổi kẻ ít % máu hơn)
   *    3. "Ưu tiên thằng nào gần hơn mới đến % máu":
   *       - Nếu 1 kẻ gần hơn hẳn (chênh lệch cự ly >= 55px) -> ưu tiên tấn công kẻ ở gần
   *       - Nếu khoảng cách tương đương (kẹp 2 đầu / cùng cận chiến) -> ưu tiên kẻ ít % máu hơn
   *       - Kèm cơ chế khóa mục tiêu ngắn chống xoay giật liên tục khi bị kẹp ở giữa.
   *  - Lính thường: Ưu tiên mục tiêu ở gần hơn (có hệ số thu hút với đồng minh hệ Đỡ Đòn).
   */
  selectCombatTarget(player) {
    const rawAlly = (window.allyManager && window.allyManager.activeAlly) || (window.allySystem && window.allySystem.activeAlly);
    const ally = (rawAlly && !rawAlly.isDead && rawAlly.hp > 0) ? rawAlly : null;
    const playerAlive = !!(player && !player.isDead && (player.hp === undefined || player.hp > 0));

    if (!ally) {
      this.targetAlly = false;
      this.currentTarget = player;
      return player;
    }
    if (!playerAlive) {
      this.targetAlly = true;
      this.currentTarget = ally;
      return ally;
    }

    const pDist = Math.hypot(player.x - this.x, (player.y - this.y) * 1.25);
    const aDist = Math.hypot(ally.x - this.x, (ally.y - this.y) * 1.25);

    if (this.isBoss) {
      const pMax = Math.max(1, player.maxHp || 100);
      const aMax = Math.max(1, ally.maxHp || 100);
      const playerPct = Math.max(0, Math.min(1, (player.hp !== undefined ? player.hp : pMax) / pMax));
      const allyPct = Math.max(0, Math.min(1, ally.hp / aMax));

      const LOW_HP_PCT = 0.40;
      const FAR_DIST = 180;
      const DIST_DIFF_THRESHOLD = 55; // Chênh lệch khoảng cách đáng kể để coi là "gần hơn hẳn"

      const isBothLowHp = (playerPct <= LOW_HP_PCT && allyPct <= LOW_HP_PCT);
      const isBothFar = (pDist >= FAR_DIST && aDist >= FAR_DIST);

      let targetShouldBeAlly = false;

      if (isBothLowHp) {
        // Quy tắc 1: Cả 2 thằng đều ít máu -> đuổi theo thằng gần hơn
        targetShouldBeAlly = (aDist < pDist - 8);
      } else if (isBothFar) {
        // Quy tắc 2: Cả 2 thằng đều ở xa -> đuổi theo thằng % máu ít hơn
        if (Math.abs(playerPct - allyPct) >= 0.02) {
          targetShouldBeAlly = (allyPct < playerPct);
        } else {
          targetShouldBeAlly = (aDist < pDist);
        }
      } else {
        // Quy tắc 3: Ưu tiên khoảng cách trước, sau đó mới đến % máu
        const distDiff = Math.abs(pDist - aDist);
        if (distDiff >= DIST_DIFF_THRESHOLD) {
          // Một kẻ ở gần hơn hẳn -> đánh kẻ ở gần
          targetShouldBeAlly = (aDist < pDist);
        } else {
          // Cự ly tương đương (ví dụ cùng bọc sườn kẹp Boss hoặc cùng trong cự ly cận chiến)
          // -> Xét % máu: chọn kẻ yếu % máu hơn
          if (Math.abs(playerPct - allyPct) >= 0.02) {
            targetShouldBeAlly = (allyPct < playerPct);
          } else {
            targetShouldBeAlly = (aDist < pDist);
          }
        }
      }

      // Khóa mục tiêu chống xoay giật liên tục (Anti-jitter & Anti-spinning)
      if (targetShouldBeAlly !== !!this.targetAlly) {
        const currentIsDead = !this.currentTarget || this.currentTarget.isDead;
        const distDecisive = (targetShouldBeAlly && aDist < pDist - 70) || (!targetShouldBeAlly && pDist < aDist - 70);
        const hpDecisive = Math.abs(playerPct - allyPct) >= 0.15;
        const timerExpired = (this._targetLockTimer <= 0);

        if (currentIsDead || timerExpired || distDecisive || hpDecisive) {
          this.targetAlly = targetShouldBeAlly;
          this._targetLockTimer = 0.55;
        }
      }

      this.currentTarget = this.targetAlly ? ally : player;
      return this.currentTarget;
    }

    // Lính thường: so sánh khoảng cách thực tế + hệ số khiêu khích của đồng minh Đỡ Đòn
    const isTaunted = (ally.charId === 'dinhan') || (ally.charId === 'hoanganh');
    const tauntFactor = isTaunted ? 1.35 : 1.0;

    if (aDist < pDist * tauntFactor) {
      this.targetAlly = true;
      this.currentTarget = ally;
    } else {
      this.targetAlly = false;
      this.currentTarget = player;
    }
    return this.currentTarget;
  }

  /**
   * Phát hiện tình huống bị kẹp giữa người chơi và đồng minh (Pincer / Sandwich).
   */
  isSandwichedBy(target, player) {
    const rawAlly = (window.allyManager && window.allyManager.activeAlly) || (window.allySystem && window.allySystem.activeAlly);
    const ally = (rawAlly && !rawAlly.isDead && rawAlly.hp > 0) ? rawAlly : null;
    if (!ally || !player || player.isDead) return false;
    const other = (target === ally) ? player : ally;
    if (!other || other === target || other.isDead) return false;
    const dxTarget = target.x - this.x;
    const dxOther = other.x - this.x;
    return (dxTarget * dxOther < 0) && Math.abs(dxTarget) < 185 && Math.abs(dxOther) < 185;
  }

  /**
   * Kiểm tra va chạm đòn đánh lên mục tiêu ưu tiên (Người chơi hoặc Đồng minh)
   * và càn quét cả mục tiêu phụ nếu đứng chồng trong vùng hitbox.
   */
  deliverAttackHit(player, attackData) {
    if (!window.combatSystem) return false;
    const rawAlly = (window.allyManager && window.allyManager.activeAlly) || (window.allySystem && window.allySystem.activeAlly);
    const ally = (rawAlly && !rawAlly.isDead && rawAlly.hp > 0) ? rawAlly : null;
    const primary = (this.targetAlly && ally) ? ally : (this.currentTarget || player);
    let hitAny = false;
    if (primary && !primary.isDead) {
      if (window.combatSystem.checkAttackHit(this, primary, attackData)) hitAny = true;
    }
    const secondary = (primary === ally) ? player : ally;
    if (secondary && secondary !== primary && !secondary.isDead) {
      if (window.combatSystem.checkAttackHit(this, secondary, attackData)) hitAny = true;
    }
    return hitAny;
  }

  updateAI(dt, player) {
    if (this.stunTimer > 0) {
      this.vx = 0;
      this.vy = 0;
      this.isAttacking = false;
      if (this.state !== 'knockdown' && this.state !== 'getup' && this.state !== 'hurt') {
        this.setState('hurt', this.stunTimer);
      }
      return;
    }
    if (this.state === 'hurt') {
      if (this.stateTimer >= this.stateDuration) this.setState('idle');
      return;
    }
    if (this.state === 'knockdown') {
      this.invincibleTimer = Math.max(this.invincibleTimer, 0.15);
      if (this.stateTimer >= this.stateDuration && !this.isDead && this.z === 0) {
        const getupDur = this.isBoss ? 0.28 : 0.45;
        this.setState('getup', getupDur);
        this.invincibleTimer = getupDur;
      }
      return;
    }
    if (this.state === 'getup') {
      this.invincibleTimer = Math.max(this.invincibleTimer, 0.05);
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle');
        if (this.isBoss) {
          this.knockdownImmuneTimer = 3.5;
          this.poise = this.maxPoise;
          // ===== BOSS WAKEUP REVERSAL SHOCKWAVE (CHẤN KHÍ BỘC PHÁ) =====
          // Khi vừa đứng dậy, boss bộc phát chấn khí đẩy lùi người chơi, nhận Siêu Giáp và lập tức phản công!
          this.attackCooldown = 0.08; // Phản công ngay lập tức!
          this.hitsTaken = 0;
          if (window.effectManager) {
            window.effectManager.createShockRing(this.x, this.y, '#ef4444');
            window.effectManager.createDust(this.x, this.y, 10);
            window.effectManager.triggerScreenShake(7, 0.2);
            window.effectManager.addFloatingText('BÁ THỂ PHẢN KÍCH!', this.x, this.y - 160, 'ultimate');
          }
          if (window.audioManager) window.audioManager.playHeavyHit();
          // Đẩy lùi người chơi nếu đang đứng sát boss (Face-camping)
          if (player && !player.isDead) {
            const pDist = Math.hypot(player.x - this.x, (player.y - this.y) * 1.5);
            if (pDist < 140) {
              const pushDir = Math.sign(player.x - this.x) || (this.facing || 1);
              player.vx = pushDir * 280;
              if (window.effectManager) {
                window.effectManager.addFloatingText('CHẤN KHÍ ĐẨY LÙI!', player.x, player.y - 130, 'warn');
              }
            }
          }
        }
      }
      return;
    }

    // Đang tung đòn: chỉ gây sát thương khi tay/chân đã duỗi ra (khóa hướng trong thời gian ra đòn)
    if (this.isAttacking) {
      if (window.AnimUtil && AnimUtil.isActive(this)) this.checkAttackPlayer(player);
      if (this.stateTimer >= this.stateDuration) {
        const curTarget = this.currentTarget || player;
        this.setState('idle');
        this.attackCooldown = 0.65 + Math.random() * 0.55;
        // Đòn nối tiếp: chuỗi 2 nhịp như võ sĩ thật — buộc đối phương phải đỡ/né
        if (this.followupChance > 0 && curTarget && !curTarget.isDead && Math.random() < this.followupChance &&
            Math.abs(curTarget.x - this.x) < 160 && Math.abs(curTarget.y - this.y) < 52) {
          this.attackCooldown = 0.14;
        }
      }
      return;
    }

    const target = this.selectCombatTarget(player);
    if (!target) {
      this.setState('idle');
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy * 1.4);
    const targetDist = this.preferredDist || 78;
    const sandwiched = this.isSandwichedBy(target, player);

    // ĐỌC HÀNH VI NGƯỜI CHƠI (CHẾ ĐỘ ĐẤU VÕ CỦA BOSS — không đọc trước input tương lai)
    if (this.isBoss && window.combatSystem && window.combatSystem.playerMoveLog && player && !player.isDead) {
      const log = window.combatSystem.playerMoveLog;
      const recent = log.slice(-6);
      let fkCount = 0;
      for (const m of recent) if (m === 'flying_kick') fkCount++;

      // Nhận diện thói quen: người chơi spam Space + K liên tục
      if (fkCount >= 2 && player.state === 'flying_kick' && Math.abs(player.x - this.x) < 220 && Math.abs(player.y - this.y) < 55) {
        if (Math.random() < 0.45 && this.reactCooldown <= 0) {
          this.reactCooldown = 1.5;
          // Dạt trục Y hoặc lùi thế phòng thủ để tránh đòn phi cước (không lùi ngược vào kẻ đang kẹp sau lưng)
          this.vx = sandwiched ? 0 : (-this.facing * this.speed * 0.75);
          this.vy = (dy >= 0 ? -1 : 1) * 85;
          this.setState('walk');
          return;
        }
      }

      // Trừng phạt sơ hở khi người chơi tiếp đất whiff (đánh hụt) hoặc khi người chơi lặp lại thói quen spam phi cước (fkCount >= 2)
      const isRepeatedSpam = (fkCount >= 2);
      const isWhiffLanding = (!player.kickHasHit && !player.airPunchHasHit);
      if (player.state === 'landing' && (isRepeatedSpam || isWhiffLanding) && Math.abs(player.x - this.x) < 135 && Math.abs(player.y - this.y) < 45 && this.attackCooldown > 0.1) {
        this.attackCooldown = 0.08;
      }
    }

    // Phản ứng: mục tiêu đang cam kết ra đòn ở cự ly gần -> tranh thủ phản công
    const playerAttacking = player && (typeof ATTACK_STATES !== 'undefined') && ATTACK_STATES.has(player.state);
    if (playerAttacking && this.reactCooldown <= 0 && !player.isDead && Math.abs(player.x - this.x) < 125 && Math.abs(player.y - this.y) < 46) {
      this.reactCooldown = 1.7 + Math.random() * 0.9;
      this.attackCooldown = Math.min(this.attackCooldown, 0.18);
    }

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const attackLaneY = 52;
    const spdMul = (typeof this.speedMul === 'number' && this.speedMul > 0) ? this.speedMul : 1.0;
    const blindMul = (this.blindTimer > 0) ? 0.65 : 1.0;
    const effSpeed = this.speed * spdMul * blindMul;

    // ƯU TIÊN SỐ 1: Khi đã hồi xong chiêu và mục tiêu nằm trong tầm đánh + cùng làn Y -> lập tức khóa hướng & ra đòn
    // (Ngăn triệt để lỗi Boss lùi/đứng im khi bị kẹp ở giữa hoặc khi người chơi đứng lệch làn Y sát thân!)
    if (this.attackCooldown <= 0 && !target.isDead && dist <= targetDist + 28 && absDy < attackLaneY) {
      if (window.game && !window.game.requestAttackToken(this)) {
        this.setState('idle');
      } else {
        if (absDx > 1 && !this.holdFacing) {
          this.facing = dx >= 0 ? 1 : -1;
        }
        this._turnCooldown = 0.28;
        this.startAttackSequence(target);
        // Nếu mục tiêu đứng sát/chồng lên người Boss, hãm bớt vận tốc lướt tới để không phóng vọt qua đầu mục tiêu
        if (absDx < 52 && this.vx * this.facing > 0) {
          const lungeScale = Math.max(0.15, absDx / 52);
          this.vx *= lungeScale;
        }
      }
    } else if (absDy >= attackLaneY - 6 || dist > targetDist + 18) {
      // Mục tiêu đang lệch làn Y (như đứng ngay trên/dưới Boss) hoặc ở xa -> chủ động khép làn Y và tách nhẹ X để tấn công
      const isTargetFleeing = (target.state === 'run' && (target.x - this.x) * (target.facing || 1) > 0);
      const moveSpeed = isTargetFleeing ? effSpeed * 1.2 : effSpeed;
      let rawVx = 0;
      if (absDx > targetDist + 10) {
        rawVx = Math.sign(dx) * moveSpeed * 0.9;
      } else if (absDx < 32 && !sandwiched) {
        const stepOutDir = (dx !== 0) ? -Math.sign(dx) : -(this.facing || 1);
        rawVx = stepOutDir * moveSpeed * 0.55;
      } else {
        rawVx = Math.sign(dx) * moveSpeed * 0.35;
      }
      const rawVy = (absDy > 6) ? Math.sign(dy) * moveSpeed * 0.85 : 0;
      const nav = this.avoidObstacles(rawVx, rawVy, target);
      this.vx = nav.vx;
      this.vy = nav.vy;
      this.setState('walk');
    } else if (absDx < targetDist - 24) {
      if (sandwiched) {
        // Đang bị kẹp giữa Người Chơi và Đồng Minh: KHÔNG lùi lưng vào kẻ phía sau gây xoay vòng lặp!
        // Trụ vững hướng nhìn vào mục tiêu yếu máu hơn và rút ngắn nhịp hồi đòn để phá vây.
        this.vx = 0;
        if (this.isBoss && this.attackCooldown > 0.22) {
          this.attackCooldown = 0.22;
        }
        if (absDy > 10) {
          this.vy = Math.sign(dy) * effSpeed * 0.55;
          this.setState('walk');
        } else {
          this.vy = 0;
          this.setState('idle');
        }
      } else {
        // Lùi giữ khoảng cách theo phương ngang X, trục Y LUÔN bám về phía mục tiêu (không bao giờ tự đẩy lệch làn Y)
        const awayDirX = (dx !== 0) ? -Math.sign(dx) : -(this.facing || 1);
        const rawVx = awayDirX * effSpeed * 0.55;
        const rawVy = (absDy > 10) ? Math.sign(dy) * effSpeed * 0.55 : 0;
        const nav = this.avoidObstacles(rawVx, rawVy, target);
        this.vx = nav.vx;
        this.vy = nav.vy;
        if (absDx > 8 && !this.holdFacing && this._turnCooldown <= 0) {
          const desiredFacing = dx >= 0 ? 1 : -1;
          if (desiredFacing !== this.facing) {
            this.facing = desiredFacing;
            this._turnCooldown = 0.22;
          }
        }
        this.setState('walk');
      }
    } else if (absDy > 14) {
      // Đang chờ hồi chiêu trong tầm ngang nhưng hơi lệch làn Y -> bước khép làn Y
      this.vx = 0;
      this.vy = Math.sign(dy) * effSpeed * 0.55;
      this.setState('walk');
    } else {
      this.setState('idle');
    }
  }

  startAttackSequence(target) {
    if (target && Math.abs(target.x - this.x) > 3 && !this.holdFacing) {
      this.facing = (target.x >= this.x) ? 1 : -1;
    }
    this.setState('punch_straight', 0.28);
    this.vx = this.facing * 90;
  }

  // Boss/phụ huynh gọi để nói một câu giữa trận (dùng floating text)
  taunt(text) {
    if (!text || this.isDead) return;
    if (window.effectManager) window.effectManager.addFloatingText(text, this.x, this.y - 170, 'taunt');
    if (window.audioManager) window.audioManager.playClick();
  }

  // Đánh dấu cửa phản công (weak point window)
  openWeakWindow(duration = 1.0) {
    this.weakWindow = duration;
  }

  // Chuyển giai đoạn boss (HUD + banner + âm thanh + rung)
  setPhase(n) {
    this.phase = n;
    // Càng về giai đoạn sau càng tung đòn dồn dập
    this.followupChance = Math.max(this.followupChance || 0, 0.18 + 0.14 * n);
    if (n === 2) {
      this.setAuraArmor('red', 4.5, 180, 6); // Giai đoạn 2: Bộc phát Bá Thể Đỏ (có thể bị phá bằng counter/combo)
    } else if (n >= 3) {
      this.setAuraArmor('gold', 3.5);        // Giai đoạn 3: Bộc phát Kim Cang Hoàng Kim (bất khả phá)
    }
    if (window.uiManager) {
      window.uiManager.setBossPhase(n);
      window.uiManager.showAlertBanner('GIAI ĐOẠN ' + n);
    }
    if (window.audioManager) window.audioManager.playWarning();
    if (window.effectManager) {
      window.effectManager.triggerFlash(n >= 3 ? '#ff2a4b' : '#ffd700', 0.45);
      window.effectManager.triggerScreenShake(n >= 3 ? 14 : 9, 0.35);
    }
  }

  checkAttackPlayer(player) {
    const isKick = /kick|sweep/.test(this.state || '');
    const attackData = {
      damage: 21,
      offsetX: 52,
      offsetY: -80,
      width: 60,
      height: 45,
      knockback: 5,
      isKick,
      counterType: isKick ? 'leg' : 'hand'
    };
    this.deliverAttackHit(player, attackData);
  }

  // ==========================================================================
  // HỆ THỐNG 3 TẦNG GIÁP HÀO QUANG (3-TIER ARMOR AURAS)
  // 'red'   = Bá Thể Cương Kình (Kháng choáng/ngã, nhận sát thương, có thể bị phá)
  // 'gold'  = Kim Cang Bất Khuất (Kháng choáng/ngã, giảm 35% DMG, BẤT KHẢ PHÁ)
  // 'white' = Bất Hoại Thân Pháp (BẤT TỬ HOÀN TOÀN 0 DMG, kháng mọi hiệu ứng)
  // ==========================================================================
  setAuraArmor(type, duration = 3.5, hp = 150, hits = 6) {
    this.auraArmor = type;
    this.auraArmorTimer = duration;
    this.auraArmorHp = hp;
    this.auraArmorMaxHp = hp;
    this.auraArmorHits = hits;
    if (window.effectManager) {
      const py = (this.y || 580) + (this.z || 0);
      if (type === 'red') {
        window.effectManager.addFloatingText('🔴 BÁ THỂ CƯƠNG KÌNH!', this.x, py - 160, 'ultimate');
        window.effectManager.createShockRing(this.x, this.y || 580, '#ef4444');
      } else if (type === 'gold') {
        window.effectManager.addFloatingText('🟡 KIM CANG BẤT KHUẤT!', this.x, py - 160, 'heal');
        window.effectManager.createShockRing(this.x, this.y || 580, '#ffd700');
      } else if (type === 'white') {
        window.effectManager.addFloatingText('⚪ BẤT HOẠI THÂN PHÁP (BẤT TỬ)!', this.x, py - 160, 'dodge');
        window.effectManager.createShockRing(this.x, this.y || 580, '#ffffff');
      }
    }
  }

  clearAuraArmor() {
    this.auraArmor = null;
    this.auraArmorTimer = 0;
    this.auraArmorHp = 0;
    this.auraArmorMaxHp = 0;
    this.auraArmorHits = 0;
  }

  hasAuraArmor(type) {
    if (type) return this.auraArmor === type && this.auraArmorTimer > 0;
    return !!this.auraArmor && this.auraArmorTimer > 0;
  }
}

// ============================================================================
// VÕ SĨ THÂN PHÁP (hay lùi né khi bị dồn đòn)
// ============================================================================

window.BaseEnemy = BaseEnemy;
