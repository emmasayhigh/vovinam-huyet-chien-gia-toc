/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/props.js — Vật thể tương tác sân khấu & Va chạm môi trường (Giai đoạn 4)
 *
 *  - Thùng hàng (Crate), Thùng phuy (Barrel), Chướng ngại có thể phá hủy
 *  - 3 trạng thái: intact (nguyên vẹn) -> damaged (nứt vỡ) -> broken (vỡ vụn)
 *  - Vật thể cản đường di chuyển, rung, trượt khi bị va chạm
 *  - Khi vỡ tạo mảnh vụn văng, khói bụi, âm thanh va chạm, rơi vũ khí/vật phẩm
 *  - Thùng phuy phát nổ lan sát thương khi bị đòn nặng/tuyệt kỹ trúng
 *  - Va chạm môi trường (Wall Splat): Địch bị knockback mạnh đập vào tường/thùng -> dội lại, choáng, rơi vũ khí
 */
(function () {
  'use strict';

  class InteractiveProp {
    constructor(cfg) {
      this.id = cfg.id || ('prop_' + Math.random().toString(36).substr(2, 6));
      this.type = cfg.type || 'crate'; // 'crate' | 'barrel'
      this.x = cfg.x || 600;
      this.y = cfg.y || 560;
      this.width = cfg.width || (this.type === 'crate' ? 64 : 52);
      this.height = cfg.height || (this.type === 'crate' ? 64 : 70);
      this.maxHp = cfg.maxHp || (this.type === 'barrel' ? 45 : 75);
      this.hp = this.maxHp;
      this.state = 'intact'; // 'intact' | 'damaged' | 'broken'
      this.vx = 0;
      this.vy = 0;
      this.shaking = 0;
      this.debris = [];
      this.contains = cfg.contains || null; // 'weapon' | 'heal' | null
      this.isSolid = true;
      this.deathTimer = 0;
    }

    update(dt) {
      if (this.shaking > 0) this.shaking -= dt * 8;

      // Ma sát trượt khi bị đâm trúng
      if (Math.abs(this.vx) > 1) {
        this.x += this.vx * dt;
        this.vx *= Math.exp(-8 * dt);
      } else {
        this.vx = 0;
      }

      // Cập nhật mảnh vỡ khi đã phá hủy
      if (this.state === 'broken') {
        this.deathTimer += dt;
        for (const p of this.debris) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vz -= 900 * dt;
          p.z -= p.vz * dt;
          p.rot += p.rotV * dt;
          if (p.z >= 0) {
            p.z = 0;
            p.vx *= 0.6;
            p.vy *= 0.6;
            p.vz = 0;
          }
        }
      }
    }

    takeDamage(damage, fromDir = 0, weight = 'light') {
      if (this.state === 'broken') return false;

      this.hp -= damage;
      this.shaking = 0.25;
      const push = (weight === 'ultimate' ? 240 : (weight === 'heavy' ? 150 : 70));
      this.vx = (fromDir || 1) * push;

      if (window.audioManager) {
        if (this.type === 'barrel') {
          window.audioManager.playBlock();
        } else {
          window.audioManager.playPunch();
        }
      }

      if (window.effectManager) {
        window.effectManager.createDust(this.x, this.y, 4, 18);
        window.effectManager.createHitSparks(this.x, this.y - 25, 6, false);
      }

      if (this.hp <= this.maxHp * 0.45 && this.state === 'intact') {
        this.state = 'damaged';
      }

      if (this.hp <= 0) {
        this.destroy(fromDir, weight);
        return true;
      }
      return false;
    }

    destroy(fromDir = 0, weight = 'light') {
      this.state = 'broken';
      this.isSolid = false;

      // Sinh mảnh vụn văng ra
      this.debris = [];
      const pieceCount = this.type === 'barrel' ? 8 : 10;
      for (let i = 0; i < pieceCount; i++) {
        const ang = (Math.random() - 0.5) * Math.PI;
        const spd = 80 + Math.random() * 160;
        this.debris.push({
          x: this.x + (Math.random() - 0.5) * this.width * 0.6,
          y: this.y - 20 + (Math.random() - 0.5) * this.height * 0.4,
          z: -10 - Math.random() * 20,
          vx: fromDir * 60 + Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd * 0.4,
          vz: 180 + Math.random() * 180,
          w: 8 + Math.random() * 14,
          h: 6 + Math.random() * 10,
          rot: Math.random() * Math.PI * 2,
          rotV: (Math.random() - 0.5) * 16,
          col: this.type === 'barrel' ? '#475569' : '#854d0e'
        });
      }

      if (this.type === 'barrel') {
        // Thùng phuy phát nổ
        if (window.audioManager) window.audioManager.playExplosion();
        if (window.effectManager) {
          window.effectManager.createHitSparks(this.x, this.y - 30, 24, true);
          window.effectManager.createShockRing(this.x, this.y, '#f97316');
          window.effectManager.triggerScreenShake(8, 0.25);
          window.effectManager.createDust(this.x, this.y, 14, 60);
        }
        // Gây sát thương lan cho địch lân cận
        const enemies = (window.game && window.game.enemies) || [];
        for (const e of enemies) {
          if (e.isDead) continue;
          const dist = Math.hypot(e.x - this.x, (e.y - this.y) * 1.5);
          if (dist < 140) {
            const dir = Math.sign(e.x - this.x) || 1;
            e.takeDamage(45, dir * 18, true);
          }
        }
      } else {
        // Thùng gỗ vỡ tan
        if (window.audioManager) window.audioManager.playHeavyHit();
        if (window.effectManager) {
          window.effectManager.createDust(this.x, this.y, 12, 45);
          window.effectManager.triggerScreenShake(4, 0.12);
        }
        // Rơi vũ khí ngẫu nhiên
        if (window.weaponSystem && (this.contains === 'weapon' || Math.random() < 0.45)) {
          const wp = Math.random() < 0.5 ? 'baton' : 'blade';
          window.weaponSystem.spawnDrop(wp, this.x, this.y, fromDir || 1);
        }
      }
    }

    render(ctx, camera) {
      const sx = this.x - camera.x;
      const sy = this.y - camera.y;
      if (sx < -100 || sx > 1600) return;

      ctx.save();

      // Vẽ mảnh vỡ nếu đã vỡ
      if (this.state === 'broken') {
        for (const p of this.debris) {
          const px = p.x - camera.x;
          const py = p.y + p.z - camera.y;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.col;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
        ctx.restore();
        return;
      }

      // Rung lắc khi bị trúng đòn
      const shakeX = this.shaking > 0 ? (Math.random() - 0.5) * 6 : 0;
      ctx.translate(sx + shakeX, sy);

      // Bóng dưới mặt đất
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.beginPath();
      ctx.ellipse(0, 4, this.width * 0.52, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      if (this.type === 'crate') {
        // --- THÙNG GỖ CÔNG NGHIỆP ---
        const w = this.width, h = this.height;
        const x0 = -w / 2, y0 = -h;

        // Thân gỗ chính
        ctx.fillStyle = this.state === 'damaged' ? '#713f12' : '#854d0e';
        ctx.fillRect(x0, y0, w, h);

        // Các đường nan gỗ ngang
        ctx.fillStyle = '#a16207';
        ctx.fillRect(x0 + 4, y0 + 4, w - 8, 14);
        ctx.fillRect(x0 + 4, y0 + 24, w - 8, 14);
        ctx.fillRect(x0 + 4, y0 + 44, w - 8, 14);

        // Khung viền gỗ & chữ X trợ lực
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 3;
        ctx.strokeRect(x0 + 1.5, y0 + 1.5, w - 3, h - 3);

        ctx.beginPath();
        ctx.moveTo(x0 + 4, y0 + 4); ctx.lineTo(x0 + w - 4, y0 + h - 4);
        ctx.moveTo(x0 + w - 4, y0 + 4); ctx.lineTo(x0 + 4, y0 + h - 4);
        ctx.stroke();

        // Nẹp góc sắt
        ctx.fillStyle = '#1e293b';
        [[x0, y0], [x0 + w - 12, y0], [x0, y0 + h - 12], [x0 + w - 12, y0 + h - 12]].forEach(([cx, cy]) => {
          ctx.fillRect(cx, cy, 12, 12);
        });

        // Vết nứt vỡ nếu damaged
        if (this.state === 'damaged') {
          ctx.strokeStyle = '#1c1917';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x0 + 12, y0 + 16); ctx.lineTo(x0 + 28, y0 + 32);
          ctx.lineTo(x0 + 20, y0 + 50); ctx.lineTo(x0 + 44, y0 + 58);
          ctx.stroke();
        }
      } else {
        // --- THÙNG PHUY THÉP (BARREL) ---
        const w = this.width, h = this.height;
        const x0 = -w / 2, y0 = -h;

        // Thân thùng kim loại
        ctx.fillStyle = this.state === 'damaged' ? '#1e293b' : '#334155';
        ctx.fillRect(x0, y0, w, h);

        // Ánh sáng kim loại
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(x0 + 6, y0, 8, h);

        // Vành gờ thép gia cố
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x0 - 2, y0 + 4, w + 4, 6);
        ctx.fillRect(x0 - 2, y0 + h * 0.48, w + 4, 6);
        ctx.fillRect(x0 - 2, y0 + h - 10, w + 4, 6);

        // Dải cảnh báo màu vàng đen / đỏ
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x0 + 4, y0 + h * 0.22, w - 8, 12);
        ctx.fillStyle = '#fde047';
        ctx.font = '900 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('HAZARD', 0, y0 + h * 0.22 + 9);

        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2);
      }

      ctx.restore();
    }
  }

  // ==========================================================================
  // HỆ THỐNG QUẢN LÝ VẬT THỂ MÔI TRƯỜNG & VA CHẠM DỘI TƯỜNG (WALL SPLAT)
  // ==========================================================================
  const propSystem = {
    props: [],

    initStage(stageId) {
      this.props = [];
      const stageProps = {
        1: [
          { type: 'crate', x: 550, y: 550, contains: 'weapon' },
          { type: 'crate', x: 1100, y: 575 },
          { type: 'barrel', x: 1650, y: 545 },
          { type: 'crate', x: 1950, y: 580, contains: 'weapon' }
        ],
        2: [
          { type: 'barrel', x: 620, y: 540 },
          { type: 'crate', x: 1050, y: 565, contains: 'weapon' },
          { type: 'barrel', x: 1450, y: 585 },
          { type: 'crate', x: 1950, y: 550 }
        ],
        3: [
          { type: 'crate', x: 600, y: 545 },
          { type: 'crate', x: 1200, y: 575, contains: 'weapon' },
          { type: 'barrel', x: 1750, y: 555 }
        ],
        4: [
          { type: 'crate', x: 700, y: 560, contains: 'weapon' },
          { type: 'barrel', x: 1350, y: 545 },
          { type: 'crate', x: 1950, y: 575 }
        ]
      };

      const list = stageProps[stageId] || [
        { type: 'crate', x: 650, y: 560 },
        { type: 'barrel', x: 1400, y: 550 }
      ];

      for (const cfg of list) {
        this.props.push(new InteractiveProp(cfg));
      }
    },

    update(dt, player, enemies) {
      // Dọn dẹp thùng vỡ sau 6 giây
      for (let i = this.props.length - 1; i >= 0; i--) {
        const p = this.props[i];
        p.update(dt);
        if (p.state === 'broken' && p.deathTimer > 6.0) {
          this.props.splice(i, 1);
        }
      }

      // Xử lý va chạm vật lý giữa nhân vật và vật thể solid
      this.resolvePhysicalCollisions(player, enemies);

      // Xử lý va chạm môi trường (Wall Splat khi bị knockback mạnh)
      this.checkEnvironmentalImpacts(player, enemies, dt);
    },

    // 1. Va chạm vật lý thuần túy giữa nhân vật và vật cản tĩnh
    // Chỉ ngăn cản di chuyển — KHÔNG gây sát thương, KHÔNG ngã, KHÔNG kích hoạt animation bị đánh
    resolvePhysicalCollisions(player, enemies) {
      const allEntities = [player, ...enemies];
      for (const ent of allEntities) {
        if (!ent || ent.isDead) continue;
        for (const p of this.props) {
          if (!p.isSolid) continue;
          const dx = ent.x - p.x;
          const dy = ent.y - p.y;
          const hw = (p.width / 2) + 20;
          const hh = 22; // hitbox chân 2.5D
          if (Math.abs(dx) < hw && Math.abs(dy) < hh) {
            // Đẩy lùi ra ngoài ranh giới vật cản theo trục x
            const overlapX = hw - Math.abs(dx);
            ent.x += Math.sign(dx || 1) * overlapX;
            // Triệt tiêu vận tốc hướng vào vật thể tĩnh để nhân vật không bị trượt dính
            if ((dx > 0 && ent.vx < 0) || (dx < 0 && ent.vx > 0)) {
              ent.vx = 0;
            }
          }
        }
      }
    },

    // 2. Va chạm môi trường có chủ đích (Wall Splat / Prop Splat)
    // CHỈ áp dụng khi thực thể chịu một cú ĐÁNH THỰC SỰ tạo lực đẩy mạnh (Combat Knockback)
    // Tuyệt đối KHÔNG kích hoạt khi kẻ địch tự đi bộ, chạy, né hay áp sát vào thùng hàng
    checkEnvironmentalImpacts(player, enemies, dt) {
      const game = window.game;
      if (!game) return;
      const minX = game.arenaLocked ? game.arenaMinX : 20;
      const maxX = game.arenaLocked ? game.arenaMaxX : (window.stageManager.stageWidth - 20);

      const targets = [...enemies];
      for (const ent of targets) {
        if (!ent || ent.isDead) continue;
        if (ent._splatCooldown > 0) ent._splatCooldown -= dt;

        // Phân biệt sự kiện: Phải đang trong trạng thái bị đánh (hurt / knockdown)
        // VÀ có cờ knockback từ đòn đánh chiến đấu hợp lệ (combatKnockbackTimer > 0 hoặc isKnockedBack)
        const isCombatKnockback = (ent.combatKnockbackTimer > 0 || ent.isKnockedBack) &&
          (ent.state === 'hurt' || ent.state === 'knockdown');

        if (isCombatKnockback && Math.abs(ent.vx) > 135 && (!ent._splatCooldown || ent._splatCooldown <= 0)) {
          let wallHit = false;
          let hitX = ent.x;

          // 1. Va chạm ranh giới màn đấu / tường đấu
          if (ent.x <= minX + 25 && ent.vx < 0) {
            wallHit = true;
            hitX = minX + 25;
            ent.x = minX + 28;
          } else if (ent.x >= maxX - 25 && ent.vx > 0) {
            wallHit = true;
            hitX = maxX - 25;
            ent.x = maxX - 28;
          }

          // 2. Bị đòn đánh hất văng đập trúng thùng hàng kiên cố
          if (!wallHit) {
            for (const p of this.props) {
              if (!p.isSolid) continue;
              if (Math.abs(ent.x - p.x) < (p.width / 2 + 22) && Math.abs(ent.y - p.y) < 26) {
                wallHit = true;
                hitX = p.x;
                p.takeDamage(35, Math.sign(ent.vx), 'heavy');
                break;
              }
            }
          }

          if (wallHit) {
            // Tiêu hao cờ knockback — đảm bảo sự kiện va chạm chỉ xảy ra đúng 1 lần duy nhất cho mỗi cú đánh
            ent.combatKnockbackTimer = 0;
            ent.isKnockedBack = false;
            ent._splatCooldown = 0.9;
            // Dội ngược lại
            ent.vx = -ent.vx * 0.35;
            ent.vz = 180;

            if (window.audioManager) window.audioManager.playHeavyHit();
            if (window.effectManager) {
              window.effectManager.createHitSparks(hitX, ent.y - 70, 16, true);
              window.effectManager.createDust(ent.x, ent.y, 10, 45);
              window.effectManager.triggerScreenShake(6, 0.18);
              window.effectManager.addFloatingText('VA ĐẬP MÔI TRƯỜNG!', ent.x, ent.y - 140, 'crit');
            }

            // Gây thêm sát thương va đập môi trường trước khi chuyển state để không bị OTG guard chặn
            const isKnockdown = !ent.isBoss || (ent.knockdownImmuneTimer <= 0);
            ent.takeDamage(28, 0, isKnockdown);
            if (ent.isBoss && ent.knockdownImmuneTimer > 0) {
              ent.setState('hurt', 0.4);
            } else {
              ent.setState('knockdown', 0.85);
            }

            // Nếu đang cầm vũ khí thì bị rơi do chấn động
            if (ent.armed && typeof ent.dropWeapon === 'function') {
              ent.dropWeapon(false);
            }
          }
        }
      }
    },

    // Kiểm tra đòn đánh trúng vào vật thể
    checkAttackHit(attacker, attackData) {
      let hitAny = false;
      for (const p of this.props) {
        if (!p.isSolid) continue;
        const reach = (attackData.width || 60) + (p.width / 2);
        const reachY = (attackData.height || 40) + 20;
        const dx = (p.x - attacker.x) * (attacker.facing || 1);
        const dy = Math.abs(p.y - attacker.y);

        if (dx > 0 && dx < reach && dy < reachY) {
          p.takeDamage(attackData.damage || 30, attacker.facing, attackData.weight || 'light');
          hitAny = true;
        }
      }
      return hitAny;
    },

    render(ctx, camera) {
      for (const p of this.props) {
        p.render(ctx, camera);
      }
    }
  };

  window.propSystem = propSystem;
  window.InteractiveProp = InteractiveProp;
})();
