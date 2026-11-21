/**
 * NHÂN VẬT: ĐÌNH BÍCH LÂM
 * js/entities/characters/bichlam.js
 * Chứa toàn bộ: Hồ sơ, UI chọn tướng, Ngoại hình, Chỉ số sát thương, Nội tại, Tuyệt kỹ & Đồng minh.
 */

(function () {
  function isNamCheoSkin(entity) {
    return !!(window.CharacterRegistry && typeof window.CharacterRegistry.getEquippedSkin === 'function' && window.CharacterRegistry.getEquippedSkin(entity) === 'namcheo');
  }

  function emitTidalSplash(fx, x, y, dir, count = 10) {
    if (!fx) return;
    if (Array.isArray(fx.ripples)) {
      for (let r = 0; r < 2; r++) {
        fx.ripples.push({
          x,
          y: y + 2,
          radius: 8 + r * 6,
          maxRadius: 42 + r * 24,
          alpha: 0.72 - r * 0.18
        });
      }
    }
    if (Array.isArray(fx.particles)) {
      for (let i = 0; i < count; i++) {
        fx.particles.push({
          x: x + (Math.random() - 0.5) * 32,
          y: y - 20 - Math.random() * 44,
          vx: dir * (1.8 + Math.random() * 4.5) + (Math.random() - 0.5) * 3,
          vy: -1.8 - Math.random() * 4.2,
          size: 2.5 + Math.random() * 3.0,
          color: i % 4 === 0 ? '#ef4444' : (i % 3 === 0 ? '#facc15' : (i % 2 === 0 ? '#38bdf8' : '#e0f2fe')),
          alpha: 0.95,
          life: 0.48,
          maxLife: 0.48,
          gravity: 0.18
        });
      }
    }
  }

  window.CharacterRegistry.register({
    id: 'bichlam',
    uiSlotOrder: 1,

    // =========================================================================
    // 1. NGOẠI HÌNH & TRANG PHỤC (STYLE_DEFS)
    // =========================================================================
    appearance: {
      styleKey: 'boss_bichlam',
      style: {
        scale: 1.25,
        archetype: 'street_brawler_gi',
        rig: {
          shW: 12.8, waW: 8.8, hipW: 10.6, chestOut: 14.2,
          thighLen: 25.5, calfLen: 26.5, armUpper: 18.5, armFore: 17.5,
          spineH: 33, neckLen: 14.0, nShX: -5.4, nShY: -2.5, fShX: 5.2, fShY: -1.8,
          hipHalf: 4.1, footPad: 4, headScale: 0.81, limbBulk: 1.08, armBulk: 1.05
        },
        baggyPants: true,
        skin: '#f0bfa0',
        hair: '#14171f',
        hairStyle: 'bichlam_spiky',
        jawStyle: 'youth',
        gi: '#1a844c',
        pants: '#166e3f',
        belt: '#16a34a',
        aura: '#4ade80',
        under: '#14171f',
        sleeveless: true,
        vest: true,
        bareBiceps: true,
        stripedWraps: true,
        wrapColor: '#16a34a',
        shoes: 'brawler_boots',
        shoeColor: '#166534',
        eyeColor: '#15803d'
      }
    },

    // =========================================================================
    // 2. HỒ SƠ CỐT TRUYỆN (ROSTER DOSSIER)
    // =========================================================================
    dossier: {
      id: 'bichlam',
      name: 'Đình Bích Lâm',
      title: 'ĐỒNG MINH NGANG TÀNG',
      faction: 'doclap',
      styleType: 'boss_bichlam',
      portrait: 'boss_bichlam',
      playable: true,
      role: 'Đồng minh ngang tàng, có cá tính mạnh — đến vì tò mò, ở lại vì ghét giả trung thành.',
      motive: 'Anh ta muốn xem Nghị có thật sự khác những kẻ trung thành khác không — và muốn một trận đánh đàng hoàng.',
      fightingStyle: 'Đánh áp sát, tấn công mạnh cự ly gần, phản công và đẩy lùi, phối hợp được với Nghị trong các đoạn dàn dựng.',
      strengths: 'Nhanh, dồn ép liên tục, finisher lao tới, chống chịu tốt hơn Nghị.',
      weaknesses: 'Tầm đánh ngắn — nếu người chơi giữ cự ly và trừng phạt hồi phục, anh ta không có cách tiếp cận an toàn.',
      skills: [
        { name: 'Áp Sát Liên Tục', desc: 'Rất ít thời gian nghỉ giữa các chuỗi đòn.' },
        { name: 'Đòn Gần Mạnh', desc: 'Sát thương cao nhất ở cự ly rất gần.' },
        { name: 'Đẩy Lùi Phản Công', desc: 'Phản ứng khi bị dồn: tung đòn đẩy tạo khoảng cách.' },
        { name: 'Cuồng Phong Hộ Thể [W+U]', desc: 'Quét luồng khí xung quanh gây 15 ST + đẩy lùi địch (140px) và bật 2.0s Bá Thể Đỏ / Kim Cang (CD 6s).' },
        { name: 'Phối Hợp', desc: 'Có đoạn dàn dựng đánh cặp với Ngô Nhất Nghị.' }
      ],
      ultimate: { name: 'XUYÊN TẦN LIÊN KẾT', desc: 'Lao xuyên màn hình, liên hoàn nhiều hit, finish bằng đẩy lùi.' },
      stats: { power: 4, speed: 4, defense: 3, technique: 4, range: 2 },
      relations: [
        { who: 'Ngô Nhất Nghị', rel: 'Đối thủ trước, đồng minh sau' },
        { who: 'Hứa Vũ Đại', rel: 'Không ưa cách hắn dùng người' },
        { who: 'Triệu Vinh Tâm', rel: 'Từng bị Triệu gia săn đuổi' }
      ],
      events: ['Hồi II: Trận thử thách ở Bến cảng — hạ 30% máu anh ta sẽ có hiệp ước'],
      unlock: { type: 'stage', stage: 6, text: 'Hoàn thành Màn 6 (Bến Cảng Hạ Tầng)' }
    },

    // =========================================================================
    // 3. THẺ CHỌN NHÂN VẬT (CHAR_SLOTS UI)
    // =========================================================================
    uiSlot: {
      id: 'bichlam',
      slotName: 'ĐÌNH BÍCH LÂM',
      fullName: 'ĐÌNH BÍCH LÂM',
      title: 'ĐỒNG MINH NGANG TÀNG',
      tagline: 'Ngang tàng — Quyết liệt — Trọng nghĩa tình',
      element: '🌪️',
      color: '#22c55e',
      image: 'assets/images/characters/char_bichlam.png',
      vovinamImage: 'assets/images/characters/char_bichlam_vovinam.png',
      namcheoImage: 'assets/images/characters/char_bichlam_namcheo.png',
      bio: 'Bích Lâm là mãnh tướng ngang tàng của võ giới ngầm, tính tình bộc trực, phóng khoáng và trọng nghĩa khí. Anh khinh ghét thói giả nhân giả nghĩa, sẵn sàng tung quyền bảo vệ anh em bằng hữu.',
      stats: { power: 75, speed: 92, defense: 65, technique: 85 },
      skills: [
        { key: 'J / K', icon: '🌪️', name: 'Thần Phong Trảo', desc: 'Chuỗi cào xé cực nhanh áp sát cự ly gần.' },
        { key: 'L', icon: '💨', name: 'Phi Thân Lạc Bộ', desc: 'Thân pháp lướt xuyên đối thủ ra phía sau.' },
        { key: 'U+J / U+K', icon: '🛡️', name: 'Đẩy Lùi Phản Kích', desc: 'Đón đỡ đòn địch và phản đòn đẩy văng đối phương.' },
        { key: 'W+U', icon: '🌪️', name: 'Cuồng Phong Hộ Thể', desc: 'Quét khí gây 15 ST + đẩy lùi địch quanh thân (140px) và kích hoạt 2.0s Bá Thể Đỏ / Kim Cang (CD 6s).' },
        { key: 'I', icon: '⚡', name: 'Xuyên Tần Liên Kích', desc: 'Tuyệt kỹ: lao xuyên màn hình nhiều hit dồn dập.' }
      ],
      passives: [
        { icon: '🌪️', name: 'Thần Phong Nộ Quyền', type: 'BỊ ĐỘNG', desc: 'Tốc độ di chuyển tăng 25%, mở rộng chuỗi liên hoàn cước lên tối đa 5 đòn dồn dập.' },
        { icon: '🛡️', name: 'Lục Chiến Bất Khuất', type: 'BỊ ĐỘNG', desc: 'Khi HP dưới 50%, tăng 20% phòng thủ và giảm 50% thời gian chịu hiệu ứng choáng.' },
        { icon: '💨', name: 'Phi Thân Lạc Bộ', type: 'CHỦ ĐỘNG [L]', desc: 'Lướt xuyên người đối thủ ra phía sau trong chớp mắt; đòn đánh sau đó 100% bạo kích.' },
        { icon: '🗡️', name: 'Cuồng Phong Phản Trảo', type: 'CHỦ ĐỘNG [U+J]', desc: 'Gạt quyền thành công lập tức tung chuỗi cào xé khiến đối phương xuất huyết DoT.' }
      ],
      mechanic: 'Áp sát chớp nhoáng — Liên hoàn vũ bão — Phản công linh hoạt.',
      quote: '“Ở đâu có bất công, ở đó có nắm đấm của Bích Lâm!”'
    },

    // =========================================================================
    // 4. CHỈ SỐ CHIẾN ĐẤU & SÁT THƯƠNG ĐÒN ĐÁNH
    // =========================================================================
    combat: {
      hp: 1080,
      speed: 255,
      runSpeed: 400,
      jumpForce: 530,
      damage: 1.10,
      reach: 0.95,
      knockback: 1.25,
      energyGain: 1.2,
      finisher: 'rush',
      ultimateState: 'ultimate_rush',
      ultimateType: 'rush',
      comboMax: 4,
      mechanic: 'Combo dài hơn + finisher lao tới + áp sát liên tục'
    },

    moveOverrides: {},

    finisher: {
      state: 'flying_kick',
      dur: 0.62,
      lunge: 540,
      shake: false,
      attack: { damage: 105, offsetX: 70, offsetY: -70, width: 100, height: 62, knockback: 340, weight: 'heavy', energyGain: 18 }
    },

    // =========================================================================
    // 5. NỘI TẠI THỰC CHIẾN (PASSIVES)
    // =========================================================================
    passives: {
      onApply(player) {
        player.speed = Math.round((player.speed || 230) * 1.25);
        player.runSpeed = Math.round((player.runSpeed || 380) * 1.2);
        player.comboMax = 5;
        player.passive_lucChien = true;
        player.passive_phiThan = true;
        player.passive_phanTrao = true;
      },
      onBeforeTakeDamage(player, ctx) {
        if (player.hp < player.maxHp * 0.5) {
          ctx.amount = Math.round(ctx.amount * 0.8);
        }
        return null;
      },
      onUpdate(player, dt) {
        if (player.hp < player.maxHp * 0.5 && player.stunTimer > 0) {
          player.stunTimer = Math.max(0, player.stunTimer - dt);
        }
        if (player._windSurgeTimer > 0) {
          player._windSurgeTimer = Math.max(0, player._windSurgeTimer - dt);
          if (player._windSurgeTimer <= 0) {
            player.speed = Math.round((player._baseSpeed || 255) * 1.25);
          }
        }
      },
      onDodge(player, ctx) {
        const namCheo = isNamCheoSkin(player);
        if (ctx) ctx.dodgeSpeed = 560;
        player.nextHitCrit = true;
        const enemies = (window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : [];
        let target = null;
        let bestDist = 240;
        for (const e of enemies) {
          if (!e || e.isDead) continue;
          const d = Math.hypot(e.x - player.x, (e.y - player.y) * 1.4);
          if (d < bestDist) {
            bestDist = d;
            target = e;
          }
        }
        if (target) {
          const stepDir = Math.sign(target.x - player.x) || (player.facing || 1);
          if (ctx) ctx.dir = stepDir;
          player.x = target.x + stepDir * 48;
          player.y = target.y;
          player.facing = -stepDir;
        }
        if (window.effectManager) {
          window.effectManager.addFloatingText(namCheo ? '🌊 CHÈO LƯỚT SÓNG NGẦM!' : 'PHI THÂN BẠO KÍCH!', player.x, player.y - 140, 'crit');
          window.effectManager.addGhostTrail(player, namCheo ? 'rgba(14, 165, 233, 0.58)' : 'rgba(34, 197, 94, 0.45)');
          if (namCheo) emitTidalSplash(window.effectManager, player.x, player.y || 580, player.facing || 1, 10);
        }
      },
      onHandCounter(defender, attacker, combatSystem) {
        if (!attacker) return;
        const namCheo = isNamCheoSkin(defender);
        if (combatSystem && typeof combatSystem.applyBleed === 'function') {
          combatSystem.applyBleed(attacker, true, 8);
        }
        attacker.bleedTimer = 3.0;
        attacker.bleedTickTimer = 0.8;
        attacker.bleedDmg = 8;
        if (window.effectManager) {
          window.effectManager.addFloatingText(namCheo ? '🌊 MÁI CHÈO XÉ NƯỚC' : 'XUẤT HUYẾT TRẢO', attacker.x, attacker.y - 145, 'bleed');
          if (namCheo) emitTidalSplash(window.effectManager, attacker.x, attacker.y || 580, defender.facing || 1, 12);
        }
      },
      onLegCounter(defender) {
        const namCheo = isNamCheoSkin(defender);
        defender._windSurgeTimer = 2.5;
        defender.speed = Math.round((defender._baseSpeed || 255) * 1.50);
        const enemies = (window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : [];
        for (const e of enemies) {
          if (!e || e.isDead) continue;
          if (Math.hypot(e.x - defender.x, e.y - defender.y) <= 165) {
            const dir = Math.sign(e.x - defender.x) || (defender.facing || 1);
            if (typeof e.takeDamage === 'function') e.takeDamage(40, dir * 14, true);
            e.stunTimer = Math.max(e.stunTimer || 0, 1.0);
          }
        }
        if (window.effectManager) {
          if (typeof window.effectManager.createShockRing === 'function') window.effectManager.createShockRing(defender.x, defender.y || 580, namCheo ? '#0ea5e9' : '#22c55e');
          if (namCheo) emitTidalSplash(window.effectManager, defender.x, defender.y || 580, defender.facing || 1, 14);
          if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText(namCheo ? '🌊 ĐẠP SÓNG PHÁ VÂY (+25% TỐC)!' : '🌪️ SONG CƯỚC PHÁ VÂY (+25% TỐC)!', defender.x, (defender.y || 580) - 180, 'crit');
        }
      },
      onStanceSpecial(player) {
        const namCheo = isNamCheoSkin(player);
        if (typeof player.setAuraArmor === 'function') player.setAuraArmor(namCheo ? 'gold' : 'red', 2.0, 120, 4);
        const enemies = (window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : [];
        for (const e of enemies) {
          if (!e || e.isDead) continue;
          if (Math.hypot(e.x - player.x, e.y - player.y) <= 140) {
            const dir = Math.sign(e.x - player.x) || (player.facing || 1);
            if (typeof e.takeDamage === 'function') e.takeDamage(15, dir * 8, false);
          }
        }
        if (window.effectManager) {
          if (namCheo) {
            emitTidalSplash(window.effectManager, player.x, player.y || 580, player.facing || 1, 14);
            if (typeof window.effectManager.createCrocodileTailSweep === 'function') {
              window.effectManager.createCrocodileTailSweep(player.x, (player.y || 580) - 20, player.facing || 1, 95);
            }
          } else if (typeof window.effectManager.createDust === 'function') {
            window.effectManager.createDust(player.x, player.y || 580, 14, 55);
          }
          if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText(namCheo ? '🌊 THỦY TRIỀU HỘ THỂ!' : '🌪️ CUỒNG PHONG HỘ THỂ!', player.x, (player.y || 580) - 170, 'ultimate');
        }
        return true;
      },
      onDodgeFollowup(player, btn) {
        const namCheo = isNamCheoSkin(player);
        if (btn === 'K') {
          player.startAttack('kick_push', 0.48, 220);
          player._moveVariant = 'wk';
          if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText(namCheo ? '🌊 ĐẠP SÓNG CỬU LONG!' : '🌪️ PHI THÂN ĐẠP XOÁY!', player.x, (player.y || 580) - 150, 'crit');
          }
          return true;
        }
        player.startAttack('elbow_strike', 0.42, 185);
        if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText(namCheo ? '🌊 CHÈO TẠT NGƯỢC DÒNG!' : '💥 GÓT CHỎ PHONG BÃO!', player.x, (player.y || 580) - 150, 'dodge');
        }
        return true;
      },
      onAttackHit(attacker, defender, attackData, combatSystem, hitCtx) {
        if (!defender || defender.isDead || defender.type === 'player') return;
        const namCheo = isNamCheoSkin(attacker);
        let bonus = 0;
        let msg = null;
        if (hitCtx && hitCtx.isCrossCombo) {
          bonus += 16;
          msg = namCheo ? '🌊 SÓNG ĐÔI VỖ BỜ (+16)!' : '🌪️ CHÉM GIÓ LIÊN HOÀN (+16)!';
        }
        if (hitCtx && hitCtx.effectiveMove === 'elbow_strike' && defender.bleedTimer > 0) {
          bonus += 30;
          msg = namCheo ? '🌊 XÉ NƯỚC PHÁ HUYẾT (+30)!' : '🩸 TOẠC HUYẾT (+30)!';
        }
        if (bonus > 0) {
          defender.hp = Math.max(0, defender.hp - bonus);
          if (defender.hp <= 0) {
            defender.isDead = true;
            defender.isAttacking = false;
            if (typeof defender.setState === 'function') defender.setState('knockdown', 1.0);
          }
          if (window.effectManager && msg && typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText(msg, defender.x, (defender.y || 580) - 160, 'crit');
            if (namCheo) emitTidalSplash(window.effectManager, defender.x, defender.y || 580, attacker.facing || 1, 8);
          }
        }
        if (hitCtx && hitCtx.effectiveMove === 'kick_sweep' && typeof attacker.dodgeCooldown === 'number') {
          attacker.dodgeCooldown = Math.max(0, attacker.dodgeCooldown - 1.5);
        }
      }
    },

    // =========================================================================
    // 5b. HOẠT ẢNH ĐẶC TRƯNG 5 GIAI ĐOẠN (ĐÌNH BÍCH LÂM — CUỒNG PHONG ĐẤU SĨ)
    // =========================================================================
    animation: {
      signatureStates: ['ultimate_rush'],
      trailProfile: {
        primary: '#22c55e',
        secondary: '#bef264',
        core: '#ffffff',
        width: 11,
        dual: true,
        dodgeGhost: 'rgba(16, 185, 129, 0.5)'
      },
      skillCatalog: [
        { id: 'punch_straight', input: 'J', name: 'Liên Đấm Thanh Phong', dur: 0.34, category: 'combo' },
        { id: 'punch_hook', input: 'J → J', name: 'Móc Xoáy Bích Ngọc', dur: 0.42, category: 'combo' },
        { id: 'kick_push', input: 'K', name: 'Đá Đẩy Gió Lốc', dur: 0.52, category: 'combo' },
        { id: 'kick_roundhouse', input: 'K → K', name: 'Vòng Cước Xé Gió', dur: 0.60, category: 'combo' },
        { id: 'wk', input: 'W + K', name: 'Phi Thân Đạp Xoáy', dur: 0.52, category: 'special' },
        { id: 'uppercut', input: 'W + J', name: 'Thăng Long Quyền Ngang', dur: 0.52, category: 'special' },
        { id: 'elbow_strike', input: 'S + J', name: 'Gót Chỏ Phong Bão', dur: 0.46, category: 'special' },
        { id: 'kick_sweep', input: 'S + K', name: 'Quét Lốc Sân Phố', dur: 0.66, category: 'special' },
        { id: 'hook_run', input: 'Shift + J', name: 'Lao Quyền Xé Gió', dur: 0.48, category: 'special' },
        { id: 'air_punch', input: 'Space + J', name: 'Đấm Bổ Không Trung', dur: 0.38, category: 'aerial' },
        { id: 'flying_kick', input: 'Space + K / Finisher', name: 'Liên Hoàn Phong Cước', dur: 0.62, category: 'finisher' },
        { id: 'dodge', input: 'L', name: 'Phi Thân Lướt Gió', dur: 0.28, category: 'defense' },
        { id: 'counter_hand_strike', input: 'U + J', name: 'Phản Đòn: Xuất Huyết Trảo', dur: 0.42, category: 'counter' },
        { id: 'counter_leg_strike', input: 'U + K', name: 'Phản Đòn: Song Cước Xoáy', dur: 0.48, category: 'counter' },
        { id: 'ultimate_rush', input: 'I', name: 'Tuyệt Kỹ: Phong Vũ Thần Tiễn', dur: 1.40, category: 'ultimate' }
      ],
      poses: {
        idle(P, { t }) {
          const b = Math.sin(t * 3.6);
          const kneeB = Math.sin(t * 3.6) * 0.03;
          P.torso = 0.06 + 0.015 * b;
          P.head = -0.02 + 0.015 * b;
          P.hx = Math.sin(t * 1.8) * 0.8;
          P.lift = Math.sin(t * 3.6) * 1.2;
          P.nT = 0.46 + kneeB; P.nS = -0.58 - kneeB;
          P.fT = -0.42 - kneeB * 0.8; P.fS = 0.14 + kneeB * 0.8;
          // Dáng du hiệp đường phố phô cơ bắp vai & gile xanh viền đen: tay trước giơ bảo vệ, tay sau siết gọn
          P.nA = -0.10 + 0.03 * b; P.nE = 1.72 + 0.02 * b;
          P.fA = 0.56 - 0.03 * b; P.fE = 1.88;
          return true;
        },
        punch_straight(P, { U, p }) {
          // Beat 1 Du Hiệp Bão Gió: Đấm chớp nhoáng, vai sau vặn chờ móc xoáy Beat 2
          const s = U.stage5(p, { a: 0.15, c: 0.32, i: 0.52, f: 0.76 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.55 - s.recover * 0.65);
          P.torso = 0.16 - 0.12 * s.windup + 0.18 * ex;
          P.nA = U.lerp(0.42 - 0.72 * s.windup, 1.18, ex); P.nE = U.lerp(1.15, 0.04, ex);
          P.fA = 0.35 - 0.55 * ex; P.fE = 1.25;
          P.nT = 0.7 + 0.22 * ex; P.nS = -0.9; P.fT = -0.6; P.fS = 0.2;
          return true;
        },
        punch_hook(P, { U, p }) {
          // Beat 2: Bật xoáy người tung Móc Bích Ngọc tốc độ cao chuẩn bị tung cước lốc
          const s = U.stage5(p, { a: 0.16, c: 0.34, i: 0.54, f: 0.78 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.55 - s.recover * 0.65);
          P.torso = 0.16 - 0.16 * s.windup + 0.20 * ex;
          P.lift = -4 * ex;
          P.nA = U.lerp(0.32 - 0.85 * s.windup, 1.18, ex); P.nE = U.lerp(1.12, 0.42, ex);
          P.fA = U.lerp(0.38, -0.58, ex); P.fE = 1.25;
          P.nT = 0.76 + 0.24 * ex; P.nS = -1.0; P.fT = -0.64; P.fS = 0.22;
          return true;
        },
        elbow_strike(P, { U, p }) {
          // Gót Chỏ Phong Bão: Nhún bật người phóng mũi chỏ Muay đường phố sắc bén, tay sau quét xuống giữ thăng bằng
          const s = U.stage5(p, { a: 0.16, c: 0.34, i: 0.56, f: 0.78 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.54 - s.recover * 0.68);
          P.torso = U.lerp(0.16 - 0.14 * s.windup, 0.26, ex);
          P.lift = 4 * s.windup - 7 * ex;
          P.hx = -3 * s.windup + 6 * ex;
          P.nA = U.lerp(0.18 - 0.58 * s.windup, 1.42, ex);
          P.nE = U.lerp(1.10, -2.04, ex);
          P.fA = U.lerp(0.35, -0.62, ex); P.fE = 1.05;
          P.nT = 0.92; P.nS = -1.25; P.fT = -0.68; P.fS = 0.24;
          return true;
        },
        kick_roundhouse(P, { U, p }) {
          // Beat 3: Xoay thân nhảy Parkour đá vòng cầu capoeira cực bốc, mở ngực vút lên
          const s = U.stage5(p, { a: 0.18, c: 0.38, i: 0.58, f: 0.80 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.52 - s.recover * 0.68);
          P.torso = U.lerp(0.22 * s.windup, -0.52, ex);
          P.lift = 5 * s.windup - 13 * ex;
          P.roll = ex * 0.22;
          P.nT = U.lerp(0.7, 2.18, ex); P.nS = U.lerp(-1.45, 0.04, ex); P.nF = -0.45 * ex;
          P.fT = U.lerp(-0.4, -0.55, ex); P.fS = U.lerp(0.15, -0.95, ex);
          P.nA = -0.75 * ex; P.nE = 1.3; P.fA = 1.38 * ex; P.fE = 0.88;
          return true;
        },
        wk(P, { U, p }) {
          // W + K: Phi Thân Đạp Xoáy — bật gối lốc xoáy lao chéo không trung
          const prep = p < 0.15 ? U.easeInOut(p / 0.15) : 0;
          const jump = U.beat(p, 0.12, 0.78, 0.48);
          const rec = p > 0.78 ? U.easeInOutQuart((p - 0.78) / 0.22) : 0;
          P.torso = 0.34 * prep + 0.28 * jump * (1 - rec);
          P.lift = 6 * prep - 14 * jump;
          P.nT = U.lerp(0.85, 1.62, jump) * (1 - rec) + 0.38 * rec;
          P.nS = U.lerp(-1.4, -0.04, jump) * (1 - rec) - 0.48 * rec;
          P.nF = 0.32 * jump;
          P.fT = U.lerp(-0.35, 0.65, jump); P.fS = U.lerp(0.1, -1.45, jump);
          P.nA = -0.85 * jump; P.nE = 1.25; P.fA = 1.48 * jump; P.fE = 0.65;
          return true;
        },
        kick_sweep(P, { U, p }) {
          // S + K: Quét Lốc Sân Phố — chống hai tay kiểu breakdance đường phố quét văng chân xanh lá
          const s = U.stage5(p, { a: 0.18, c: 0.38, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.48 - s.recover * 0.72);
          P.lift = U.lerp(4 * s.windup, 20, ex);
          P.torso = U.lerp(0.24, 0.62, ex); P.head = -0.32 * ex;
          P.nT = U.lerp(0.75, 1.36, ex); P.nS = U.lerp(-1.4, -0.02, ex); P.nF = -0.36 * ex;
          P.fT = U.lerp(-0.4, 0.92, ex); P.fS = U.lerp(0.12, -1.98, ex);
          P.nA = U.lerp(0.6, -0.46, ex); P.nE = U.lerp(1.3, 0.25, ex);
          P.fA = U.lerp(0.2, 0.88, ex); P.fE = U.lerp(1.4, 0.14, ex);
          return true;
        },
        dodge(P, { U, p }) {
          const w = U.beat(p, 0.02, 0.96, 0.32);
          P.torso = U.lerp(0.16, 0.68, w); P.lift = -10 * Math.sin(w * Math.PI);
          P.nT = 0.95; P.nS = -1.6; P.fT = -0.82 * w - 0.4 * (1 - w); P.fS = -0.35;
          P.nA = -0.85 * w; P.nE = 1.3; P.fA = 1.2 * w; P.fE = 1.4;
          return true;
        },
        counter_hand_strike(P, { U, p }) {
          // Ngồi thấp gạt đòn -> Bật lên thọc Quyền Xoáy Xuất Huyết Trảo
          const s = U.stage5(p, { a: 0.18, c: 0.38, i: 0.58, f: 0.80 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.52 - s.recover * 0.68);
          P.torso = U.lerp(0.28 * s.windup + 0.12 * (1 - s.windup), -0.14, ex);
          P.lift = 7 * s.windup - 10 * ex;
          P.nA = U.lerp(0.30 - 0.85 * s.windup, 1.44, ex); P.nE = U.lerp(1.15, 0.12, ex);
          P.fA = U.lerp(0.55, -0.45, ex); P.fE = 1.25;
          P.nT = 0.72 + 0.25 * ex; P.nS = -0.95; P.fT = -0.6; P.fS = 0.22;
          return true;
        },
        counter_leg_strike(P, { U, p }) {
          const s = U.stage5(p, { a: 0.18, c: 0.38, i: 0.60, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.5 - s.recover * 0.68);
          P.torso = U.lerp(0.24, -0.46, ex); P.lift = -8 * ex;
          P.nT = U.lerp(0.7, 2.15, ex); P.nS = U.lerp(-1.2, 0.04, ex);
          P.fT = -0.5; P.fS = 0.25;
          P.nA = -0.7 * ex; P.nE = 1.3; P.fA = 1.3 * ex; P.fE = 1.2;
          return true;
        },
        flying_kick(P, { U, p }) {
          // Liên Hoàn Phong Cước: Nén gối nhún bật -> Xoáy vặn cước lốc xoáy trên không -> Đáp dẻo
          const prep = p < 0.15 ? U.easeInOut(p / 0.15) : 0;
          const spin = U.beat(p, 0.12, 0.82, 0.52);
          const rec = p > 0.78 ? U.easeInOutQuart((p - 0.78) / 0.22) : 0;
          P.torso = U.lerp(0.38 * prep - 0.55 * spin, 0.16, rec);
          P.roll = spin > 0.2 ? Math.sin(p * Math.PI * 2) * 0.22 : 0;
          P.lift = 8 * prep - 15 * spin;
          P.nT = U.lerp(0.75, 1.98, spin); P.nS = U.lerp(-1.1, -0.04, spin);
          P.fT = U.lerp(-0.5, -0.82, spin); P.fS = -0.65 * spin;
          P.nA = -0.95 * spin; P.nE = 1.25; P.fA = 1.45 * spin; P.fE = 0.45;
          return true;
        },
        ultimate_rush(P, { e, U, p, t }) {
          if (isNamCheoSkin(e)) {
            // Ông Năm Chèo SSS: Ngồi/Đứng tấn trên thuyền gỗ tam bản, hai tay vung mái chèo rẽ sóng Cửu Long
            const row = Math.sin(p * Math.PI * 8);
            const surge = Math.cos(p * Math.PI * 8);
            P.lift = 10 + 2 * surge;
            P.torso = 0.22 + 0.14 * row;
            P.head = -0.08 - 0.06 * row;
            P.hx = 3 * row;
            P.nT = 1.08; P.nS = -1.42; P.nF = 0.15;
            P.fT = 0.58; P.fS = -1.18; P.fF = 0.10;
            P.nA = 0.55 + 0.65 * row; P.nE = 0.85 - 0.35 * surge;
            P.fA = 0.35 + 0.45 * row; P.fE = 1.05;
            return true;
          }
          // Phong Vũ Thần Tiễn (5 giai đoạn hoàn toàn khác flying_kick!):
          // Stg 1 (0..0.15): Tư thế chạy nước rút nén lực lốc xoáy
          // Stg 2 (0.15..0.72): Nhịp 1 Đấm Xé Gió + Nhịp 2 Lên Gối Bay + Nhịp 3 Liên Hoàn Phi Cước Xoáy
          // Stg 3 (0.72..0.86): Bổ Cước Bão Gió Chốt Hạ
          // Stg 4-5 (0.86..1.0): Lộn nhẹ tiếp đất cân bằng
          if (p < 0.15) {
            const w = U.easeInOut(p / 0.15);
            P.torso = U.lerp(0.14, 0.65, w); P.head = -0.28 * w; P.lift = 9 * w;
            P.nT = 1.05; P.nS = -1.55; P.fT = -0.85; P.fS = 0.35;
            P.nA = -0.9 * w; P.nE = 1.5; P.fA = 1.15 * w; P.fE = 1.25;
            return true;
          }
          if (p < 0.42) {
            const u = (p - 0.15) / 0.27;
            const c = u * Math.PI * 5;
            const a = Math.max(0, Math.sin(c)), b = Math.max(0, -Math.sin(c));
            P.torso = 0.30; P.head = -0.14; P.lift = -5;
            P.nA = U.lerp(0.2, 1.18, a); P.nE = U.lerp(1.12, 0.05, a);
            P.fA = U.lerp(0.2, 1.18, b); P.fE = U.lerp(1.12, 0.05, b);
            P.nT = 0.85; P.nS = -0.65; P.fT = -0.85; P.fS = 0.3;
            return true;
          }
          if (p < 0.72) {
            const k = U.beat(p, 0.42, 0.72, 0.45);
            const flip = U.clamp((p - 0.46) / 0.24);
            P.roll = flip * Math.PI * 2;
            P.torso = -0.45 * k; P.lift = -18 * k;
            P.nT = U.lerp(0.6, 1.95, k); P.nS = U.lerp(-1.2, 0.05, k);
            P.fT = -0.75 * k; P.fS = -0.5;
            P.nA = -0.8 * k; P.nE = 1.2; P.fA = 1.4 * k; P.fE = 0.5;
            return true;
          }
          if (p < 0.86) {
            const fin = U.easeOutBack(U.clamp((p - 0.72) / 0.11), 1.35);
            P.torso = U.lerp(-0.2, -0.52, fin); P.lift = -14 * fin;
            P.nT = 2.02 * fin; P.nS = 0.04; P.fT = -0.78; P.fS = -0.4;
            P.nA = -0.85; P.nE = 1.1; P.fA = 1.5; P.fE = 0.4;
            return true;
          }
          const rec = U.easeInOutQuart((p - 0.86) / 0.14);
          P.torso = U.lerp(-0.52, 0.14, rec); P.lift = U.lerp(-14, 0, rec);
          P.nT = U.lerp(2.02, 0.62, rec); P.nS = U.lerp(0.04, -0.82, rec);
          P.fT = U.lerp(-0.78, -0.55, rec); P.fS = U.lerp(-0.4, 0.15, rec);
          P.nA = U.lerp(-0.85, 0.7, rec); P.nE = U.lerp(1.1, 1.8, rec);
          P.fA = U.lerp(1.5, 0.35, rec); P.fE = U.lerp(0.4, 1.95, rec);
          return true;
        }
      },
      emitSkillVFX(e, st, prevP, p, fx) {
        const cross = (t) => prevP < t && p >= t;
        const dir = e.facing || 1;
        const gx = e.x || 0, gy = e.y || 580, gz = e.z || 0;
        const namCheo = isNamCheoSkin(e);
        if (namCheo) {
          if (st === 'uppercut' && cross(0.10)) {
            if (typeof fx.createCrocodileBite === 'function') fx.createCrocodileBite(gx + dir * 44, gy - 6, dir, 1.05);
            else emitTidalSplash(fx, gx + dir * 44, gy - 24, dir, 14);
          } else if ((st === 'punch_straight' || st === 'punch_hook') && cross(0.32)) {
            if (typeof fx.createWaterSlashArc === 'function') fx.createWaterSlashArc(gx + dir * 36, gy - 58, dir, -0.25, 62);
            emitTidalSplash(fx, gx + dir * 32, gy - 36, dir, 8);
          } else if (st === 'dodge' && cross(0.06)) {
            emitTidalSplash(fx, gx, gy, dir, 12);
          } else if (st === 'counter_hand_strike' && cross(0.36)) {
            if (typeof fx.createWaterSlashArc === 'function') fx.createWaterSlashArc(gx + dir * 38, gy - 62, dir, -0.1, 74);
            emitTidalSplash(fx, gx + dir * 36, gy - 32, dir, 12);
            fx.createSonicBoomCone(gx + dir * 34, gy - 68, dir, '#0ea5e9');
          } else if (st === 'counter_leg_strike' && cross(0.38)) {
            if (typeof fx.createCrocodileTailSweep === 'function') fx.createCrocodileTailSweep(gx + dir * 24, gy - 14, dir, 88);
            emitTidalSplash(fx, gx + dir * 44, gy - 12, dir, 14);
            fx.createSonicBoomCone(gx + dir * 38, gy - 46, dir, '#38bdf8');
          } else if ((st === 'kick_roundhouse' || st === 'wk') && cross(0.32)) {
            if (typeof fx.createWaterSlashArc === 'function') fx.createWaterSlashArc(gx + dir * 42, gy + gz - 54, dir, 0.18, 78);
            emitTidalSplash(fx, gx + dir * 36, gy + gz - 20, dir, 12);
            fx.createSonicBoomCone(gx + dir * 34, gy + gz - 60, dir, '#38bdf8');
          } else if (st === 'kick_sweep' && cross(0.36)) {
            if (typeof fx.createCrocodileTailSweep === 'function') fx.createCrocodileTailSweep(gx + dir * 24, gy - 12, dir, 90);
            emitTidalSplash(fx, gx + dir * 36, gy, dir, 14);
          } else if (st === 'flying_kick') {
            if (cross(0.18)) emitTidalSplash(fx, gx + dir * 24, gy + gz - 20, dir, 10);
            if (cross(0.45)) fx.createSonicBoomCone(gx + dir * 36, gy + gz - 56, dir, '#0ea5e9');
          } else if (st === 'ultimate_rush') {
            if (cross(0.05)) {
              emitTidalSplash(fx, gx, gy, dir, 16);
              if (typeof fx.addFloatingText === 'function') fx.addFloatingText('🐊 CÁ SẤU 5 CHÂN — THỦY BÁ XUẤT THẾ!', gx, gy - 170, 'ultimate');
            }
            if (cross(0.35) || cross(0.65)) {
              if (typeof fx.createWaterSlashArc === 'function') fx.createWaterSlashArc(gx + dir * 48, gy - 50, dir, 0, 88);
              emitTidalSplash(fx, gx + dir * 35, gy - 12, dir, 16);
            }
            if (cross(0.82)) {
              if (typeof fx.createCrocodileBite === 'function') fx.createCrocodileBite(gx + dir * 56, gy - 4, dir, 1.35);
              fx.createSonicBoomCone(gx + dir * 42, gy - 58, dir, '#ef4444');
            }
          }
          return;
        }
        if (st === 'dodge' && cross(0.06)) {
          fx.createWindVortex(gx, gy - 45, dir, 48, 0.3);
        } else if (st === 'counter_hand_strike' && cross(0.36)) {
          fx.createWindVortex(gx + dir * 36, gy - 72, dir, 70, 0.36);
        } else if (st === 'counter_leg_strike' && cross(0.38)) {
          fx.createWindVortex(gx + dir * 44, gy - 44, dir, 76, 0.36);
        } else if (st === 'punch_hook' && cross(0.34)) {
          fx.createWindVortex(gx + dir * 32, gy - 70, dir, 56, 0.28);
        } else if ((st === 'kick_roundhouse' || st === 'wk') && cross(0.32)) {
          fx.createWindVortex(gx + dir * 36, gy + gz - 56, dir, 66, 0.34);
          fx.createSonicBoomCone(gx + dir * 34, gy + gz - 60, dir, '#22c55e');
        } else if (st === 'kick_sweep' && cross(0.40)) {
          fx.createWindVortex(gx + dir * 36, gy - 16, dir, 62, 0.32);
          fx.createDust(gx + dir * 30, gy, 9, 44);
        } else if (st === 'flying_kick') {
          if (cross(0.18)) fx.createWindVortex(gx + dir * 24, gy + gz - 52, dir, 68, 0.36);
          if (cross(0.45)) fx.createSonicBoomCone(gx + dir * 36, gy + gz - 56, dir, '#22c55e');
        } else if (st === 'ultimate_rush') {
          if (cross(0.06)) fx.createWindVortex(gx, gy - 40, dir, 72, 0.38);
          if (cross(0.42)) fx.createWindVortex(gx + dir * 35, gy - 62, dir, 86, 0.42);
          if (cross(0.73)) {
            fx.createWindVortex(gx + dir * 48, gy - 58, dir, 108, 0.48);
            fx.createSonicBoomCone(gx + dir * 42, gy - 58, dir, '#bef264');
          }
        }
      }
    },

    // =========================================================================
    // 6. TUYỆT KỸ THỰC CHIẾN (ULTIMATE: PHONG VŨ THẦN TIỄN)
    // =========================================================================
    ultimateRuntime: {
      type: 'rush',
      cinematic: {
        title: 'ĐÌNH BÍCH LÂM',
        ult: 'PHONG VŨ THẦN TIỄN',
        color: '#10b981',
        accent: '#34d399',
        style: 'wind',
        duration: 1.4
      },
      execute(player, st, dt, enemies, { p, hitEnemy }) {
        const namCheo = isNamCheoSkin(player);
        player.vx = player.facing * 660;
        if (window.effectManager) {
          if (Math.random() < 0.7) window.effectManager.addGhostTrail(player, namCheo ? 'rgba(14, 165, 233, 0.8)' : 'rgba(16, 185, 129, 0.8)');
          if (Math.random() < 0.4) window.effectManager.createShockRing(player.x, player.y, namCheo ? '#0ea5e9' : '#34d399');
          if (Math.random() < 0.35) window.effectManager.createSonicBoomCone(player.x + player.facing * 30, player.y - 50, player.facing, namCheo ? '#38bdf8' : '#10b981');
        }
        let rushIdx = 0;
        for (const e of enemies) {
          if (e.isDead) continue;
          const inReach = (Math.abs(e.x - player.x) < 145 && Math.abs(e.y - player.y) < 70) || player.hitTargets.has(e.id);
          if (inReach) {
            player.hitTargets.add(e.id);
            e.x = player.x + player.facing * (50 + rushIdx * 12);
            e.y = player.y;
            e.vx = player.vx;
            e.vz = 0;
            e.z = 0;
            e.state = 'hurt';
            e.stateTimer = 0;
            e.stateDuration = 0.25;
            rushIdx++;

            const last = player._ultData[e.id] || -1;
            if (player.stateTimer - last > 0.16) {
              player._ultData[e.id] = player.stateTimer;
              hitEnemy(e, 42, 4, false);
            }
          }
        }
        if (p >= 1) {
          if (window.effectManager) {
            if (namCheo) {
              window.effectManager.createUltimateBlast(player.x + player.facing * 30, player.y - 55, { primary: '#ef4444', secondary: '#0ea5e9', flash: '#e0f2fe' });
              emitTidalSplash(window.effectManager, player.x + player.facing * 30, player.y || 580, player.facing || 1, 22);
              if (typeof window.effectManager.createCrocodileBite === 'function') {
                window.effectManager.createCrocodileBite(player.x + player.facing * 45, player.y, player.facing || 1, 1.4);
              }
              window.effectManager.createShockRing(player.x + player.facing * 30, player.y, '#ef4444');
            } else {
              window.effectManager.createUltimateBlast(player.x + player.facing * 30, player.y - 55, { primary: '#10b981', secondary: '#bef264', flash: '#34d399' });
              window.effectManager.createWindVortex(player.x + player.facing * 30, player.y - 55, player.facing, 125, 0.55);
              window.effectManager.createShockRing(player.x + player.facing * 30, player.y, '#10b981');
            }
            window.effectManager.triggerScreenShake(20, 0.5);
          }
          for (const e of enemies) {
            if (!e.isDead && (Math.abs(e.x - player.x) < 180 || player.hitTargets.has(e.id))) {
              hitEnemy(e, 170, 16, true);
            }
          }
          player.hitTargets.clear();
          player.setState('idle');
        }
      }
    },

    // =========================================================================
    // 7. HỆ THỐNG ĐỒNG MINH CHI VIỆN (ALLY SUPPORT)
    // =========================================================================
    ally: {
      profile: {
        id: 'bichlam',
        name: 'Đình Bích Lâm',
        title: 'Mãnh Tướng Bến Cảng',
        icon: '🦅',
        role: 'Hồi Phục & Tiếp Ứng',
        roleColor: '#10b981',
        styleType: 'boss_bichlam',
        speed: 215,
        dmg: 72,
        hp: 1200,
        quote: 'Bến cảng này là nhà của ta — kẻ nào bước vào, kẻ đó phải nằm lại.',
        activeSkill: {
          name: 'Hồi Sinh Khí Lực',
          cd: '3.0s',
          desc: 'Hồi +40 HP cho người chơi, giải trừ Chảy Máu / Choáng và hồi phục Thể Lực (Stamina).'
        },
        passiveAura: {
          name: 'Hào Quang Bến Cảng',
          desc: 'Tăng 20% tốc độ di chuyển và giảm 16% sát thương nhận vào cho người chơi khi Bích Lâm có mặt.'
        },
        coopSkill: {
          name: 'Cuồng Phong Bạt Hải',
          desc: 'Song sát liên hoàn cước gây sát thương bão tố và hất dạt kẻ địch xung quanh.'
        }
      },
      coopBaseDamage: 250,
      onUpdate(ally, dt, player) {
        if (player) {
          player.allyDmgReduction = 0.12;
        }
        if (ally.specialTimer >= 3.0 && player) {
          ally.specialTimer = 0;
          player.hp = Math.min(player.maxHp, player.hp + 40);
          player.bleedTimer = 0;
          player.stunTimer = 0;
          if (typeof player.maxStamina === 'number') player.stamina = player.maxStamina;
          if (window.uiManager) window.uiManager.updatePlayerHp(player.hp, player.maxHp);
          if (window.effectManager) {
            window.effectManager.addFloatingText('+40 HP HỒI PHỤC', player.x, player.y - 150, 'heal');
            window.effectManager.createShockRing(player.x, player.y, '#10b981');
          }
        }
      },
      onBasicAttack(ally, target, dmg, isBossTarget) {
        target.takeDamage(dmg, isBossTarget ? 0 : ally.facing * 5, !isBossTarget);
        if (window.audioManager) window.audioManager.playPunchHit();
        if (window.effectManager) {
          window.effectManager.createHitSparks(target.x, target.y - 80, 12, false);
        }
      }
    }
  });
})();

