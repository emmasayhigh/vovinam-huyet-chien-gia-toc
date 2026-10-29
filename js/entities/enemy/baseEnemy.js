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

    // ===== HỆ THỐNG POISE & CHỐNG VÒNG LẶP KNOCKDOWN CHO BOSS =====
    this.maxPoise = 120;
    this.poise = 120;
    this.poiseRegenDelay = 0;
    this.knockdownImmuneTimer = 0; // Thời gian miễn nhiễm quật ngã lặp lại sau khi đứng dậy

    // ===== HIỆU ỨNG TRẠNG THÁI TỪ VŨ KHÍ (VŨ KHÍ THẬT) =====
    this.stunTimer = 0;            // Thời gian bị choáng (từ Côn / Gậy)
    this.bleedTimer = 0;           // Thời gian duy trì xuất huyết (từ Mã Tấu)
    this.bleedTickTimer = 0;       // Bộ đếm chu kỳ nhảy sát thương xuất huyết (0.8s)
    this.bleedDmg = 0;             // Sát thương mỗi tick xuất huyết
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    if (this.isDead || this.invincibleTimer > 0) return;
    // Chống OTG / chém lúc đối thủ đang gục sàn hoặc đang trong animation đứng dậy
    if (this.state === 'knockdown' || this.state === 'getup') return;

    const hit = this.pendingHit || null;
    this.pendingHit = null;
    const weight = hit ? hit.weight : (isKnockdown ? 'heavy' : 'light');

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
    const interrupt = effectiveKnockdown || (!this.armorAll && (weight === 'ultimate' || (hit && hit.isCrit)));
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
      if (hit && !hit.blocked && this.hitsTaken >= this.breakThreshold) {
        // Bị dồn quá nhiều: GỒNG lên — phản công ngay, không chùn
        this.hitsTaken = 0;
        this.armorTimer = 1.1;
        this.attackCooldown = Math.min(this.attackCooldown, 0.12);
        this.vx = knockbackX * 0.2;
        if (window.audioManager) window.audioManager.playBlock();
        if (window.effectManager) {
          window.effectManager.createHitSparks(this.x, this.y - 95, 9, false);
          window.effectManager.addFloatingText('GỒNG ĐỠ!', this.x, this.y - 150, 'block');
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
      this.setState('knockdown', 0.8);
    } else {
      this.vx = knockbackX;
      if (Math.abs(knockbackX) > 100) {
        this.combatKnockbackTimer = 0.45;
        this.isKnockedBack = true;
      }
      this.setState('hurt', 0.28);
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

    if (this.knockdownImmuneTimer > 0) this.knockdownImmuneTimer -= dt;
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
    this.vx *= friction;
    this.vy *= friction;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.isDead) return;

    this.y = Math.max(510, Math.min(640, this.y));

    // Giữ kẻ địch trong ranh giới chiến đấu hợp lệ (không chạy ra ngoài map/arena)
    if (window.game && window.game.arenaLocked) {
      this.x = Math.max(window.game.arenaMinX + 28, Math.min(window.game.arenaMaxX - 28, this.x));
    } else if (window.stageManager) {
      this.x = Math.max(28, Math.min(window.stageManager.stageWidth - 28, this.x));
    }

    if (['idle', 'walk'].includes(this.state) && !this.holdFacing && !this.isAttacking) {
      this.facing = (player.x > this.x) ? 1 : -1;
    }

    this.updateAI(dt, player);
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
        this.setState('getup', 0.45);
        this.invincibleTimer = 0.45;
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
        }
      }
      return;
    }

    // Đang tung đòn: chỉ gây sát thương khi tay/chân đã duỗi ra (khóa hướng trong thời gian ra đòn)
    if (this.isAttacking) {
      if (window.AnimUtil && AnimUtil.isActive(this)) this.checkAttackPlayer(player);
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle');
        this.attackCooldown = 0.65 + Math.random() * 0.55;
        // Đòn nối tiếp: chuỗi 2 nhịp như võ sĩ thật — buộc người chơi phải đỡ/né
        if (this.followupChance > 0 && !player.isDead && Math.random() < this.followupChance &&
            Math.abs(player.x - this.x) < 160 && Math.abs(player.y - this.y) < 52) {
          this.attackCooldown = 0.14;
        }
      }
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy * 1.4);
    const targetDist = this.preferredDist || 78;

    // ĐỌC HÀNH VI NGƯỜI CHƠI (CHẾ ĐỘ ĐẤU VÕ CỦA BOSS — không đọc trước input tương lai)
    if (this.isBoss && window.combatSystem && window.combatSystem.playerMoveLog) {
      const log = window.combatSystem.playerMoveLog;
      const recent = log.slice(-6);
      let fkCount = 0;
      for (const m of recent) if (m === 'flying_kick') fkCount++;

      // Nhận diện thói quen: người chơi spam Space + K liên tục
      if (fkCount >= 2 && player.state === 'flying_kick' && Math.abs(dx) < 220 && Math.abs(dy) < 55) {
        if (Math.random() < 0.45 && this.reactCooldown <= 0) {
          this.reactCooldown = 1.5;
          // Dạt trục Y hoặc lùi thế phòng thủ để tránh đòn phi cước
          this.vx = -this.facing * this.speed * 0.75;
          this.vy = (dy >= 0 ? -1 : 1) * 75;
          this.setState('walk');
          return;
        }
      }

      // Trừng phạt sơ hở khi người chơi tiếp đất whiff (đánh hụt) hoặc khi người chơi lặp lại thói quen spam phi cước (fkCount >= 2)
      // Nếu người chơi đá trúng đích hợp lệ (không spam), không bị đối thủ trừng phạt vô lý
      const isRepeatedSpam = (fkCount >= 2);
      const isWhiffLanding = (!player.kickHasHit && !player.airPunchHasHit);
      if (player.state === 'landing' && (isRepeatedSpam || isWhiffLanding) && Math.abs(dx) < 135 && Math.abs(dy) < 45 && this.attackCooldown > 0.1) {
        this.attackCooldown = 0.08;
      }
    }


    // Phản ứng: người chơi đang cam kết ra đòn ở cự ly gần -> tranh thủ phản công
    const playerAttacking = (typeof ATTACK_STATES !== 'undefined') && ATTACK_STATES.has(player.state);
    if (playerAttacking && this.reactCooldown <= 0 && !player.isDead && Math.abs(dx) < 125 && Math.abs(dy) < 46) {
      this.reactCooldown = 1.7 + Math.random() * 0.9;
      this.attackCooldown = Math.min(this.attackCooldown, 0.18);
    }

    // Di chuyển có kỷ luật: Tiến thăm dò hoặc Áp sát có kiểm soát khi người chơi liên tục lùi
    if (dist > targetDist + 18) {
      const angle = Math.atan2(dy, dx);
      // Nếu người chơi liên tục chạy lùi: Boss tăng áp lực có kiểm soát (không teleport, không vô lý)
      const isPlayerFleeing = (player.state === 'run' && (player.x - this.x) * player.facing > 0);
      const moveSpeed = isPlayerFleeing ? this.speed * 1.2 : this.speed;

      const rawVx = Math.cos(angle) * moveSpeed;
      const rawVy = Math.sin(angle) * moveSpeed * 0.7;
      const nav = this.avoidObstacles(rawVx, rawVy, player);
      this.vx = nav.vx;
      this.vy = nav.vy;
      this.setState('walk');
    } else if (dist < targetDist - 24) {
      // Lùi giữ khoảng cách (Backpedal — vẫn quay mặt về phía đối thủ)
      const angle = Math.atan2(-dy, -dx);
      const rawVx = Math.cos(angle) * this.speed * 0.55;
      const rawVy = Math.sin(angle) * this.speed * 0.4;
      const nav = this.avoidObstacles(rawVx, rawVy, player);
      this.vx = nav.vx;
      this.vy = nav.vy;
      this.facing = (player.x > this.x) ? 1 : -1;
      this.setState('walk');
    } else if (this.attackCooldown <= 0 && !player.isDead && Math.abs(dy) < 40) {
      // Xin "suất" ra đòn: chống AI dồn cục cùng tấn công một lúc
      if (window.game && !window.game.requestAttackToken(this)) {
        this.setState('idle');
      } else {
        this.startAttackSequence(player);
      }
    } else {
      this.setState('idle');
    }
  }

  startAttackSequence(player) {
    this.facing = (player.x > this.x) ? 1 : -1;
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
    window.combatSystem.checkAttackHit(this, player, attackData);
  }
}

// ============================================================================
// VÕ SĨ THÂN PHÁP (hay lùi né khi bị dồn đòn)
// ============================================================================

window.BaseEnemy = BaseEnemy;
