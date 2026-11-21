/**
 * NHÂN VẬT: PHÓ DUNG HẢI
 * js/entities/characters/dunghai.js
 * Chứa toàn bộ: Hồ sơ, UI chọn tướng, Ngoại hình, Chỉ số sát thương, Nội tại, Tuyệt kỹ & Đồng minh.
 */

(function () {
  window.CharacterRegistry.register({
    id: 'dunghai',
    uiSlotOrder: 5,

    // =========================================================================
    // 1. NGOẠI HÌNH & TRANG PHỤC (STYLE_DEFS)
    // =========================================================================
    appearance: {
      styleKey: 'boss_dunghai',
      style: {
        scale: 1.23,
        archetype: 'shinobi_assassin',
        rig: {
          shW: 12.4, waW: 8.4, hipW: 10.0, chestOut: 13.4,
          thighLen: 25, calfLen: 25.5, armUpper: 17.5, armFore: 17,
          spineH: 31.5, neckLen: 13.8, nShX: -5.0, nShY: -2.4, fShX: 4.8, fShY: -1.8,
          hipHalf: 3.9, footPad: 4, headScale: 0.81, limbBulk: 1.02, armBulk: 0.98
        },
        baggyPants: true,
        skin: '#e0b28a',
        hair: '#121318',
        hairStyle: 'dunghai_spiky',
        jawStyle: 'lean_angular',
        gi: '#23262e',
        pants: '#17191f',
        belt: '#991b1b',
        crimsonScarf: true,
        scarfColor: '#b91c1c',
        shinobiArmor: true,
        weapon: 'twin_daggers',
        aura: '#ef4444',
        under: '#12141a',
        shoes: 'tabi_guards',
        eyeColor: '#ef4444'
      }
    },

    // =========================================================================
    // 2. HỒ SƠ CỐT TRUYỆN (ROSTER DOSSIER)
    // =========================================================================
    dossier: {
      id: 'dunghai',
      name: 'Phó Dung Hải',
      title: 'KẺ BỊ KHAI TRỪ',
      faction: 'pho',
      styleType: 'boss_dunghai',
      portrait: 'boss_dunghai',
      playable: true,
      role: 'Kẻ bị khai trừ khỏi họ Phó, nhân vật phản trắc trung tâm của Hồi II & IV.',
      motive: 'Động cơ thật sự phức tạp hơn vẻ ngoài: hắn bị cắt khỏi gia tộc, và hắn biết ai đã sửa hồ sơ.',
      bio: 'Dung Hải đánh không theo nhịp cố định. Hắn đánh lừa, tạo khoảng cách rồi áp sát, dùng môi trường để tạo lợi thế. Trong trận đấu hắn dừng lại để nói — và mỗi câu nói đều khiến người chơi nghi ngờ thông tin mình nhận.',
      fightingStyle: 'Nhịp bất quy tắc, đánh lừa, thình lình áp sát, dùng môi trường, hội thoại tâm lý giữa trận.',
      strengths: 'Không có rhythm cố định nên khó đọc, có pha cancel, cấu rỉa từ xa bằng đồ vật môi trường.',
      weaknesses: 'Bị lộ quá khứ khi nói nhiều — giai đoạn cuối để lộ động cơ thật sự, cũng là lúc hắn dễ tổn thương nhất.',
      skills: [
        { name: 'Nhịp Bất Kỷ Luật', desc: 'Thời gian giữa các đòn ngẫu nhiên rộng — không thể canh theo thói quen.' },
        { name: 'Hủy Đòn Dối', desc: 'Bắt đầu một đòn rồi cancel 40% sang né ngang và đòn thật.' },
        { name: 'Ném Đồ Môi Trường', desc: 'Gạch, chai, ống thép — cấu rỉa rồi mới áp sát.' },
        { name: 'Khói Mù Nhẫn Giả [W+U]', desc: 'Tung bom khói làm mù địch (150px) trong 1.4s, bật 0.6s Giáp Trắng Bất Hoại và cường hóa đòn kế 100% Chí Mạng (CD 6s).' },
        { name: 'Lời Nói Giữa Trận', desc: 'Dừng lại nói về quá khứ — khiến người chơi hoài nghi lựa chọn của mình.' }
      ],
      ultimate: null,
      stats: { power: 3, speed: 4, defense: 2, technique: 5, range: 4 },
      relations: [
        { who: 'Phó Mộc Đăng', rel: 'Người đã ký quyết định khai trừ hắn' },
        { who: 'Hứa Vũ Đại', rel: 'Từng làm việc cho mạng lưới ngầm' },
        { who: 'Ngô Nhất Nghị', rel: 'Kẻ có thể tha thứ hoặc giết hắn' }
      ],
      events: ['Hồi II: Lần đầu đối đầu — hắn bỏ chạy và để lại manh mối', 'Hồi IV: Sự thật về động cơ được hé lộ qua gameplay'],
      unlock: { type: 'stage', stage: 7, text: 'Hoàn thành Màn 7 (Trạm Sát Thủ Ngầm)' }
    },

    // =========================================================================
    // 3. THẺ CHỌN NHÂN VẬT (CHAR_SLOTS UI)
    // =========================================================================
    uiSlot: {
      id: 'dunghai',
      slotName: 'PHÓ DUNG HẢI',
      fullName: 'PHÓ DUNG HẢI',
      title: 'KẺ BỊ KHAI TRỪ',
      tagline: 'Biến ảo khôn lường — Xuất quỷ nhập thần',
      element: '🗡️',
      color: '#84cc16',
      image: 'assets/images/characters/char_dunghai.png',
      vovinamImage: 'assets/images/characters/char_dunghai_vovinam.png',
      bio: 'Kẻ từng bị khai trừ khỏi gia tộc, mang theo bí mật động trời về hồ sơ bị đánh cắp. Lối đánh bất quy tắc kết hợp thủ thuật tâm lý khiến đối thủ bối rối.',
      stats: { power: 75, speed: 90, defense: 60, technique: 95 },
      skills: [
        { key: 'J / K', icon: '🗡️', name: 'Song Đao Liên Hoàn', desc: 'Chém chớp nhoáng gây hiệu ứng xuất huyết DoT.' },
        { key: 'L', icon: '💨', name: 'Hư Ảnh Biến Ảo', desc: 'Hủy chiêu giữa chừng chuyển sang né và tập kích bất ngờ.' },
        { key: 'U+J / U+K', icon: '🧱', name: 'Ám Khí Phản Phá', desc: 'Tận dụng phi tiêu môi trường phá nhịp đối phương.' },
        { key: 'W+U', icon: '💨', name: 'Khói Mù Nhẫn Giả', desc: 'Tung khói làm mù địch (150px) 1.4s, nhận 0.6s Giáp Trắng Bất Hoại và đòn kế tiếp 100% Chí Mạng (CD 6s).' },
        { key: 'I', icon: '⚡', name: 'Huyễn Ảnh Loạn Vũ', desc: 'Tuyệt kỹ: phân thân tung hàng chục vết chém liên tiếp.' }
      ],
      passives: [
        { icon: '💨', name: 'Huyễn Ảnh Xuất Quỷ', type: 'BỊ ĐỘNG', desc: 'Có 25% tỉ lệ né tránh hoàn toàn đòn đánh của địch, để lại tàn ảnh huyễn hoặc đối thủ.' },
        { icon: '🗡️', name: 'Huyết Đao Xuất Huyết', type: 'BỊ ĐỘNG', desc: 'Các nhát chém từ song đao gây hiệu ứng chảy máu DoT rút máu kẻ địch liên tục trong 3s.' },
        { icon: '🌪️', name: 'Hư Ảnh Biến Ảo', type: 'CHỦ ĐỘNG [L]', desc: 'Hủy chiêu giữa chừng chuyển sang né tức thời và xuất hiện bất ngờ ngay sau lưng mục tiêu.' },
        { icon: '🧱', name: 'Ám Khí Triệt Tiêu', type: 'CHỦ ĐỘNG [U+J]', desc: 'Phản đòn thành công phóng phi tiêu ám khí làm mù và vô hiệu hóa đòn đánh đối thủ 2s.' }
      ],
      mechanic: 'Nhịp đánh bất thường — Hủy đòn lừa thế — Áp sát độc hiểm.',
      quote: '“Ngươi tin vào mắt mình ư? Mắt người là thứ dễ lừa dối nhất.”'
    },

    // =========================================================================
    // 4. CHỈ SỐ CHIẾN ĐẤU & SÁT THƯƠNG ĐÒN ĐÁNH
    // =========================================================================
    combat: {
      hp: 1050,
      speed: 250,
      runSpeed: 400,
      jumpForce: 520,
      damage: 1.20,
      reach: 1.1,
      knockback: 1.15,
      energyGain: 1.15,
      finisher: 'rush',
      ultimateState: 'ultimate_feint',
      ultimateType: 'feint',
      mechanic: 'Nhịp đánh bất thường + hủy đòn + áp sát bất ngờ'
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
        player.passive_huyenAnh = true;
        player.passive_huyetDao = true;
        player.passive_huAnh = true;
        player.passive_amKhi = true;
      },
      onBeforeTakeDamage(player) {
        if (Math.random() < 0.25) {
          player.invincibleTimer = 0.35;
          if (window.effectManager) {
            window.effectManager.createDust(player.x, player.y, 8);
            window.effectManager.addFloatingText('HUYỄN ẢNH NÉ ĐÒN!', player.x, player.y - 140, 'dodge');
          }
          if (window.audioManager) window.audioManager.playDodge();
          return { cancelled: true };
        }
        return null;
      },
      onInputCancel(player, input) {
        if ((input.isJustPressed('KeyL') || input.peek('KeyL')) && player.dodgeCooldown <= 0) {
          if (player.state.startsWith('punch_') || player.state.startsWith('kick_') || player.state === 'elbow_strike' || player.state === 'uppercut') {
            input.consumeBufferedAction('KeyL');
            if (input.justPressed) input.justPressed['KeyL'] = false;
            player.dodgeCooldown = player.maxDodgeCooldown;
            const enemies = (window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : [];
            let target = null, best = 260;
            for (const e of enemies) {
              if (!e || e.isDead) continue;
              const d = Math.hypot(e.x - player.x, (e.y - player.y) * 1.4);
              if (d < best) { best = d; target = e; }
            }
            if (target) {
              const behindDir = -(target.facing || (target.x >= player.x ? -1 : 1));
              player.x = target.x + behindDir * 48;
              player.y = target.y;
              player.facing = (target.x >= player.x) ? 1 : -1;
              player.vx = player.facing * 180;
              player.nextHitCrit = true;
            } else {
              const dir = (input.moveRight ? 1 : 0) - (input.moveLeft ? 1 : 0) || -player.facing;
              player.vx = dir * 480;
            }
            player.setState('dodge', 0.28);
            player.invincibleTimer = 0.22;
            player.setAuraArmor('white', 0.8);
            if (window.effectManager) {
              window.effectManager.addFloatingText('HƯ ẢNH BIẾN ẢO (SAU LƯNG)!', player.x, player.y - 140, 'dodge');
              window.effectManager.addGhostTrail(player, 'rgba(132, 204, 22, 0.5)');
            }
            return true;
          }
        }
        return false;
      },
      onDodge(player, ctx) {
        const enemies = (window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : [];
        let target = null, best = 250;
        for (const e of enemies) {
          if (!e || e.isDead) continue;
          const d = Math.hypot(e.x - player.x, (e.y - player.y) * 1.4);
          if (d < best) { best = d; target = e; }
        }
        if (target) {
          const behindDir = -(target.facing || (target.x >= player.x ? -1 : 1));
          player.x = target.x + behindDir * 48;
          player.y = target.y;
          player.facing = (target.x >= player.x) ? 1 : -1;
          if (ctx) {
            ctx.dir = player.facing;
            ctx.dodgeSpeed = 220;
          }
          player.nextHitCrit = true;
        }
        player.setAuraArmor('white', 0.6);
        if (window.effectManager) {
          window.effectManager.addGhostTrail(player, 'rgba(132, 204, 22, 0.5)');
        }
      },
      onHandCounter(defender, attacker) {
        if (!attacker) return;
        attacker.attackCooldown = 2.0;
        attacker.blindTimer = 2.0;
        if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText('ÁM KHÍ LÀM MÙ 2s!', attacker.x, (attacker.y || 580) - 150, 'stale');
        }
      },
      onLegCounter(defender, attacker, combatSystem) {
        defender.dodgeCooldown = 0;
        if (attacker && !attacker.isDead) {
          if (combatSystem && typeof combatSystem.applyBleed === 'function') {
            combatSystem.applyBleed(attacker, true, 11);
          }
          attacker.bleedTimer = Math.max(attacker.bleedTimer || 0, 3.5);
          attacker.bleedDmg = Math.max(attacker.bleedDmg || 0, 11);
          attacker.speedMul = 0.5;
          attacker.slowTimer = Math.max(attacker.slowTimer || 0, 2.5);
          if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText('🩸 HUYẾT ẢNH CẮT GÂN (HỒI NGAY NÉ [L])!', attacker.x, (attacker.y || 580) - 165, 'crit');
          }
        }
      },
      onStanceSpecial(player) {
        if (typeof player.setAuraArmor === 'function') player.setAuraArmor('white', 0.6);
        player.nextHitCrit = true;
        const enemies = (window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : [];
        for (const e of enemies) {
          if (!e || e.isDead) continue;
          if (Math.hypot(e.x - player.x, e.y - player.y) <= 150) {
            e.blindTimer = Math.max(e.blindTimer || 0, 1.4);
          }
        }
        if (window.effectManager) {
          if (typeof window.effectManager.createDust === 'function') window.effectManager.createDust(player.x, player.y || 580, 12, 48);
          if (typeof window.effectManager.addGhostTrail === 'function') window.effectManager.addGhostTrail(player, 'rgba(244, 63, 94, 0.52)');
          if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText('💨 KHÓI MÙ NHẪN GIẢ (MÙ ĐỊCH / BẠO KÍCH)!', player.x, (player.y || 580) - 175, 'dodge');
        }
        return true;
      },
      onDodgeFollowup(player, btn) {
        if (btn === 'K') {
          player.startAttack('kick_sweep', 0.58, 200);
          if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText('🗡️ QUÉT LƯỠI HÁI ĐỘC!', player.x, (player.y || 580) - 150, 'crit');
          }
          return true;
        }
        player.startAttack('elbow_strike', 0.40, 215);
        if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText('💀 ĐOẢN ĐAO XUYÊN GIÁP!', player.x, (player.y || 580) - 150, 'dodge');
        }
        return true;
      },
      onAttackHit(attacker, defender, attackData, combatSystem, hitCtx) {
        if (!defender || defender.type === 'player') return;
        const wasBleeding = (defender.bleedTimer || 0) > 0;
        if (combatSystem && typeof combatSystem.applyBleed === 'function') {
          combatSystem.applyBleed(defender, true, 7);
        }
        const isBehind = (attacker.x - defender.x) * (defender.facing || 1) < -10;
        if (isBehind || (hitCtx && hitCtx.isCrossCombo)) {
          defender.hp = Math.max(0, defender.hp - 22);
          if (defender.hp <= 0) {
            defender.isDead = true;
            defender.isAttacking = false;
            if (typeof defender.setState === 'function') defender.setState('knockdown', 1.0);
          }
          if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText(isBehind ? '💀 ĐÂM LÉN (+22)!' : '🗡️ ÁM SÁT LIÊN KÍCH (+22)!', defender.x, (defender.y || 580) - 160, 'crit');
          }
        }
        if (hitCtx && hitCtx.effectiveMove === 'elbow_strike' && wasBleeding) {
          attacker.stamina = Math.min(attacker.maxStamina || 100, (attacker.stamina || 0) + 12);
          if (typeof attacker.addEnergy === 'function') attacker.addEnergy(8);
        }
      }
    },

    // =========================================================================
    // 5b. HOẠT ẢNH ĐẶC TRƯNG 5 GIAI ĐOẠN (PHÓ DUNG HẢI — SONG ĐOẢN ĐAO & HUYỄN ẢNH)
    // =========================================================================
    animation: {
      signatureStates: ['ultimate_feint'],
      trailProfile: {
        primary: '#f43f5e',
        secondary: '#a855f7',
        core: '#ffe4e6',
        width: 10,
        dual: true,
        dodgeGhost: 'rgba(244, 63, 94, 0.52)'
      },
      skillCatalog: [
        { id: 'punch_straight', input: 'J', name: 'Xuyên Đao Đoạt Hầu', dur: 0.34, category: 'combo' },
        { id: 'punch_hook', input: 'J → J', name: 'Song Đao Chéo Huyết', dur: 0.42, category: 'combo' },
        { id: 'kick_push', input: 'K', name: 'Đá Lùi Thoát Thân', dur: 0.52, category: 'combo' },
        { id: 'kick_roundhouse', input: 'K → K', name: 'Xoáy Gót Nhẫn Giả', dur: 0.60, category: 'combo' },
        { id: 'wk', input: 'W + K', name: 'Ám Sát Đoản Đao Đột Kích', dur: 0.52, category: 'special' },
        { id: 'uppercut', input: 'W + J', name: 'Liềm Đao Cắt Ngược', dur: 0.52, category: 'special' },
        { id: 'elbow_strike', input: 'S + J', name: 'Xiên Đao Gần Thân', dur: 0.46, category: 'special' },
        { id: 'kick_sweep', input: 'S + K', name: 'Quét Đao Sạt Gân', dur: 0.66, category: 'special' },
        { id: 'hook_run', input: 'Shift + J', name: 'Ảnh Tốc Xuyên Tim', dur: 0.48, category: 'special' },
        { id: 'air_punch', input: 'Space + J', name: 'Ám Sát Không Trung', dur: 0.38, category: 'aerial' },
        { id: 'flying_kick', input: 'Space + K / Finisher', name: 'Huyễn Ảnh Đoạt Mệnh', dur: 0.62, category: 'finisher' },
        { id: 'dodge', input: 'L', name: 'Thế Thân Khói Ảnh', dur: 0.28, category: 'defense' },
        { id: 'counter_hand_strike', input: 'U + J', name: 'Phản Đòn: Huyết Đao X-Cut', dur: 0.42, category: 'counter' },
        { id: 'counter_leg_strike', input: 'U + K', name: 'Phản Đòn: Xoáy Cắt Gân Chân', dur: 0.48, category: 'counter' },
        { id: 'ultimate_feint', input: 'I', name: 'Tuyệt Kỹ: Huyễn Ảnh Loạn Vũ', dur: 1.20, category: 'ultimate' }
      ],
      initPose(P) {
        P.grip = -0.35;
      },
      poses: {
        idle(P, { t }) {
          const b = Math.sin(t * 3.8);
          P.torso = 0.14 + 0.015 * b; P.head = -0.07;
          P.nT = 0.50 + 0.02 * b; P.nS = -0.66 - 0.02 * b;
          P.fT = -0.44 - 0.02 * b; P.fS = 0.16 + 0.02 * b;
          P.nA = -0.22 + 0.03 * b; P.nE = 1.56; P.grip = -0.35;
          P.fA = 0.44 - 0.02 * b; P.fE = 1.46;
          return true;
        },
        punch_straight(P, { U, p }) {
          // Đâm song đao chéo thấp như sát thủ, không đấm quyền anh
          const s = U.stage5(p, { a: 0.16, c: 0.34, i: 0.54, f: 0.78 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.55 - s.recover * 0.65);
          P.torso = 0.20 - 0.14 * s.windup + 0.16 * ex; P.head = -0.14 * ex;
          P.nA = U.lerp(0.2 - 0.72 * s.windup, 1.14, ex); P.nE = U.lerp(1.10, 0.06, ex);
          P.grip = U.lerp(-0.4, -0.82, ex);
          P.fA = U.lerp(-0.3, -0.75, ex); P.fE = 1.15;
          P.nT = 0.78 + 0.22 * ex; P.nS = -1.0; P.fT = -0.68; P.fS = 0.24;
          return true;
        },
        punch_hook(P, { U, p }) {
          // Chém X-cut hai đoản đao luân phiên, dồn đà vào hông cho Beat 3
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.56, f: 0.80 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.55 - s.recover * 0.68);
          P.torso = 0.18 - 0.18 * s.windup + 0.18 * ex;
          P.nA = U.lerp(-0.35, 1.18, ex); P.nE = U.lerp(1.05, 0.10, ex);
          P.fA = U.lerp(0.25, 1.05, ex); P.fE = U.lerp(1.10, 0.14, ex);
          P.grip = U.lerp(-0.2, -0.92, ex);
          P.nT = 0.8 + 0.2 * ex; P.nS = -1.0; P.fT = -0.68; P.fS = 0.24;
          return true;
        },
        elbow_strike(P, { U, p }) {
          // Xiên Đao Gần Thân: Ép khuỷu & cầm ngược đoản đao thúc cự ly gần, tay sau giấu đao chuẩn bị bồi kích
          const s = U.stage5(p, { a: 0.16, c: 0.34, i: 0.56, f: 0.80 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.54 - s.recover * 0.68);
          P.torso = U.lerp(0.18, 0.32, ex);
          P.lift = 4 * ex;
          P.hx = -3 * s.windup + 6 * ex;
          P.nA = U.lerp(0.12 - 0.55 * s.windup, 1.28, ex);
          P.nE = U.lerp(1.05, -1.92, ex);
          P.fA = U.lerp(0.20, -0.78, ex); P.fE = 0.55;
          P.grip = -0.92;
          P.nT = 0.86; P.nS = -1.05; P.fT = -0.70; P.fS = 0.26;
          return true;
        },
        kick_roundhouse(P, { U, p }) {
          // Beat 3 Nhẫn Giả: Bật ngược bổ cước gót song kiếm dang rộng hình cánh dơi huyết ảnh
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.58, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.52 - s.recover * 0.68);
          P.torso = U.lerp(0.32 * s.windup, -0.38, ex);
          P.lift = 5 * s.windup - 10 * ex;
          P.nT = U.lerp(0.75, 1.94, ex); P.nS = U.lerp(-1.4, -0.02, ex); P.nF = -0.45 * ex;
          P.fT = -0.48; P.fS = 0.18;
          P.nA = U.lerp(0.3, -0.85, ex); P.nE = 0.32;
          P.fA = U.lerp(-0.2, 1.42, ex); P.fE = 0.25;
          P.grip = -0.94;
          return true;
        },
        wk(P, { U, p }) {
          // W + K: Ám Sát Đoản Đao Đột Kích — cúi rạp sát thủ lao tới đá xuyên tâm, song đao ghìm ngược sau lưng
          const s = U.stage5(p, { a: 0.16, c: 0.34, i: 0.58, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.5 - s.recover * 0.7);
          P.torso = U.lerp(0.24, 0.48, ex);
          P.head = -0.26 * ex;
          P.lift = 5 * s.windup - 6 * ex;
          P.nT = U.lerp(0.85, 1.62, ex); P.nS = U.lerp(-1.55, -0.04, ex); P.nF = 0.35 * ex;
          P.fT = -0.62; P.fS = 0.24;
          P.nA = U.lerp(0.4, -0.98, ex); P.nE = 0.16;
          P.fA = U.lerp(0.2, -0.92, ex); P.fE = 0.20;
          P.grip = -0.88;
          return true;
        },
        kick_sweep(P, { U, p }) {
          // S + K: Quét Đao Sạt Gân — sụp bóng tối cực thấp gần sát mặt đất, cắm đao chống trụ, gạt gót xén gân
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.60, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.48 - s.recover * 0.72);
          P.lift = U.lerp(6 * s.windup, 21, ex);
          P.torso = U.lerp(0.26, 0.64, ex); P.head = -0.34 * ex;
          P.nT = U.lerp(0.75, 1.32, ex); P.nS = U.lerp(-1.35, 0.0, ex); P.nF = -0.38 * ex;
          P.fT = U.lerp(-0.4, 0.88, ex); P.fS = U.lerp(0.15, -1.92, ex);
          P.nA = U.lerp(0.3, -0.56, ex); P.nE = 0.25;
          P.fA = U.lerp(0.2, 0.72, ex); P.fE = 0.14;
          P.grip = -0.92;
          return true;
        },
        uppercut(P, { U, p }) {
          const s = U.stage5(p, { a: 0.18, c: 0.38, i: 0.58, f: 0.80 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.5 - s.recover * 0.68);
          P.torso = U.lerp(0.36, -0.22, ex); P.lift = -10 * ex;
          P.nA = U.lerp(-0.45, 2.28, ex); P.nE = U.lerp(1.5, 0.14, ex);
          P.fA = U.lerp(0.25, -0.72, ex); P.fE = 0.65;
          P.grip = -0.75;
          return true;
        },
        dodge(P, { U, p }) {
          const w = U.beat(p, 0.02, 0.96, 0.34);
          P.torso = U.lerp(0.24, 0.72, w); P.lift = 8 * w; P.head = -0.34 * w;
          P.nT = 1.05; P.nS = -1.58; P.fT = -0.82 * w - 0.5 * (1 - w); P.fS = 0.35;
          P.nA = -0.95 * w; P.nE = 1.15; P.fA = -0.85 * w; P.fE = 1.25; P.grip = -0.6;
          return true;
        },
        counter_hand_strike(P, { U, p }) {
          // Khóa chéo song đoản đao (0..0.2) -> Lướt chém X-Cut đỏ huyết sau lưng -> Tra đao gọn
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.58, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.52 - s.recover * 0.7);
          P.torso = U.lerp(0.20 - 0.18 * s.windup, 0.32, ex);
          P.nA = U.lerp(0.55 - 0.85 * s.windup, 1.14, ex); P.nE = U.lerp(1.08, 0.08, ex);
          P.fA = U.lerp(0.55 - 0.78 * s.windup, 1.04, ex); P.fE = U.lerp(1.08, 0.12, ex);
          P.grip = U.lerp(0.2, -0.95, ex);
          P.nT = 0.85 + 0.22 * ex; P.nS = -1.1;
          return true;
        },
        counter_leg_strike(P, { U, p }) {
          const s = U.stage5(p, { a: 0.18, c: 0.38, i: 0.58, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.48 - s.recover * 0.68);
          P.torso = U.lerp(0.45, -0.38, ex); P.lift = 6 * ex;
          P.nT = U.lerp(0.85, 1.65, ex); P.nS = U.lerp(-1.2, -0.05, ex);
          P.nA = -0.85 * ex; P.nE = 0.4; P.fA = 1.45 * ex; P.fE = 0.2; P.grip = -0.8;
          return true;
        },
        flying_kick(P, { U, p }) {
          // Huyễn Ảnh Đoạt Mệnh: Cuộn mình lao xuống với song đao dang rộng như dơi
          const prep = p < 0.14 ? U.easeInOut(p / 0.14) : 0;
          const dive = U.beat(p, 0.10, 0.80, 0.5);
          const rec = p > 0.78 ? U.easeInOutQuart((p - 0.78) / 0.22) : 0;
          P.torso = U.lerp(0.45 * prep + 0.58 * dive, 0.24, rec);
          P.lift = 6 * prep - 14 * dive;
          P.nA = U.lerp(0.3, 1.65, dive); P.nE = 0.12;
          P.fA = U.lerp(-0.3, -1.35, dive); P.fE = 0.15; P.grip = -0.85;
          P.nT = U.lerp(0.8, 1.68, dive); P.nS = -0.25; P.fT = -0.8; P.fS = -0.4;
          return true;
        },
        ultimate_feint(P, { U, p }) {
          // Huyễn Ảnh Loạn Vũ (5 giai đoạn sát thủ):
          // Stg 1 (0..0.18): Ngồi thấp bắt ấn Kuji chuẩn bị tan biến khói ảnh
          // Stg 2 (0.18..0.68): 2 nhịp dịch chuyển Xuyên Đao đa góc (trước-sau, trên-dưới)
          // Stg 3 (0.68..0.84): Xé không gian Chữ Thập Đỏ (Cross-Cut Finish)
          // Stg 4-5 (0.84..1.0): Quỳ thấp ngoảnh lại tra đao lạnh lùng
          if (p < 0.18) {
            const w = U.easeInOut(p / 0.18);
            P.torso = U.lerp(0.24, 0.56, w); P.head = -0.28 * w; P.lift = 9 * w;
            P.nT = 1.02; P.nS = -1.58; P.fT = -0.78; P.fS = 0.35;
            P.nA = 0.9 * w; P.nE = 1.5; P.fA = 0.95 * w; P.fE = 1.45; P.grip = 0.1;
            return true;
          }
          if (p < 0.68) {
            const u = (p - 0.18) / 0.50;
            const cyc = u * Math.PI * 4;
            const cut = Math.abs(Math.sin(cyc));
            P.torso = 0.48 - 0.3 * cut; P.lift = -6 * cut;
            P.nA = U.lerp(-0.85, 1.92, cut); P.nE = 0.12;
            P.fA = U.lerp(1.45, -1.15, cut); P.fE = 0.16;
            P.grip = -0.9;
            P.nT = 0.92; P.nS = -0.85; P.fT = -0.82; P.fS = 0.3;
            return true;
          }
          if (p < 0.84) {
            const crossCut = U.easeOutBack(U.clamp((p - 0.68) / 0.12), 1.4);
            P.torso = U.lerp(0.15, 0.52, crossCut); P.hx = 9 * crossCut;
            P.nA = U.lerp(-0.8, 1.72, crossCut); P.nE = 0.08;
            P.fA = U.lerp(1.8, -1.05, crossCut); P.fE = 0.12;
            P.grip = -0.95;
            P.nT = 0.98; P.nS = -1.18; P.fT = -0.85; P.fS = 0.25;
            return true;
          }
          const rec = U.easeInOutQuart((p - 0.84) / 0.16);
          P.torso = U.lerp(0.52, 0.24, rec); P.hx = U.lerp(9, 0, rec);
          P.nA = U.lerp(1.72, 0.28, rec); P.nE = U.lerp(0.08, 1.65, rec);
          P.fA = U.lerp(-1.05, -0.35, rec); P.fE = U.lerp(0.12, 1.45, rec);
          P.grip = U.lerp(-0.95, -0.35, rec);
          P.nT = U.lerp(0.98, 0.72, rec); P.nS = U.lerp(-1.18, -0.96, rec);
          P.fT = U.lerp(-0.85, -0.64, rec); P.fS = U.lerp(0.25, 0.22, rec);
          return true;
        },
        boss_spin(P, { U, p }) {
          // Toản Đao Huyết Ảnh Toàn Phong: Cúi thấp trọng tâm xoáy song đao ngang tầm eo/ngực
          const spin = Math.cos(p * Math.PI * 4);
          P.torso = 0.28; P.head = -0.14; P.lift = 6;
          P.nT = 0.88; P.nS = -1.25; P.fT = -0.68; P.fS = 0.24;
          P.nA = 0.92 * spin; P.nE = 0.36;
          P.fA = -0.84 * spin; P.fE = 0.42;
          P.grip = -0.78;
          return true;
        }
      },
      emitSkillVFX(e, st, prevP, p, fx) {
        const cross = (t) => prevP < t && p >= t;
        const dir = e.facing || 1;
        const gx = e.x || 0, gy = e.y || 580, gz = e.z || 0;
        if (st === 'dodge' && cross(0.06)) {
          fx.createDust(gx, gy, 8, 34);
          fx.createShurikenBurst(gx, gy - 54, dir, 3);
        } else if (st === 'punch_hook' && cross(0.36)) {
          fx.createDimensionalSlash(gx + dir * 44, gy - 68, -0.35, 115, '#f43f5e');
        } else if (st === 'wk') {
          if (cross(0.16)) fx.createShurikenBurst(gx, gy - 50, dir, 3);
          if (cross(0.34)) fx.createShadowDecoyCut(gx + dir * 44, gy, dir, '#f43f5e');
        } else if ((st === 'kick_roundhouse' || st === 'kick_sweep') && cross(0.38)) {
          fx.createDimensionalSlash(gx + dir * 44, st === 'kick_sweep' ? gy - 18 : gy - 54, 0.18, 120, '#f43f5e');
        } else if (st === 'counter_hand_strike' && cross(0.34)) {
          fx.createShadowDecoyCut(gx + dir * 48, gy, dir, '#f43f5e');
        } else if (st === 'counter_leg_strike' && cross(0.36)) {
          fx.createDimensionalSlash(gx + dir * 44, gy - 32, 0.18, 120, '#f43f5e');
        } else if (st === 'flying_kick' && cross(0.32)) {
          fx.createShadowDecoyCut(gx + dir * 42, gy + gz, dir, '#f43f5e');
        } else if (st === 'ultimate_feint') {
          if (cross(0.06)) fx.createShurikenBurst(gx, gy - 44, dir, 6);
          if (cross(0.68)) fx.createShadowDecoyCut(gx + dir * 45, gy, dir, '#a855f7');
        }
      }
    },

    // =========================================================================
    // 6. TUYỆT KỸ THỰC CHIẾN (ULTIMATE: HUYỄN ẢNH LOẠN VŨ)
    // =========================================================================
    ultimateRuntime: {
      type: 'feint',
      cinematic: {
        title: 'PHÓ DUNG HẢI',
        ult: 'HUYỄN ẢNH LOẠN VŨ',
        color: '#a855f7',
        accent: '#06b6d4',
        style: 'shadow',
        duration: 1.2
      },
      execute(player, st, dt, enemies, { p, hitEnemy }) {
        const marks = [0.3, 0.62];
        marks.forEach((m, i) => {
          const bit = 1 << i;
          if (p > m && !(player._ultFlags & bit)) {
            player._ultFlags |= bit;
            let target = null, min = 420;
            for (const e of enemies) {
              if (e.isDead) continue;
              const d = Math.hypot(e.x - player.x, (e.y - player.y) * 1.4);
              if (d < min) { min = d; target = e; }
            }
            if (window.effectManager) {
              window.effectManager.addGhostTrail(player, 'rgba(168, 85, 247, 0.85)');
              window.effectManager.createDimensionalSlash(player.x, player.y - 50, 0.45, 200, '#a855f7');
              window.effectManager.createDimensionalSlash(player.x, player.y - 50, -0.45, 200, '#06b6d4');
              window.effectManager.triggerFlash('#a855f7', 0.4);
            }
            if (target) {
              const maxW = window.stageManager ? window.stageManager.stageWidth - 30 : 2570;
              player.x = Math.max(30, Math.min(maxW, target.x + player.facing * 72));
              player.y = target.y;
              player.facing = -player.facing;
              hitEnemy(target, 155, 14, true);
            } else {
              player.vx = player.facing * 520;
            }
            if (window.audioManager) window.audioManager.playDodge();
          }
        });
        if (p >= 1) {
          if (window.effectManager) {
            window.effectManager.createUltimateBlast(player.x, player.y - 60, { primary: '#f43f5e', secondary: '#a855f7', flash: '#f43f5e' });
            window.effectManager.createShadowDecoyCut(player.x, player.y, player.facing, '#f43f5e');
            window.effectManager.createShockRing(player.x, player.y, '#a855f7');
          }
          player.setState('idle');
        }
      }
    },

    // =========================================================================
    // 7. HỆ THỐNG ĐỒNG MINH CHI VIỆN (ALLY SUPPORT)
    // =========================================================================
    ally: {
      profile: {
        id: 'dunghai',
        name: 'Phó Dung Hải',
        title: 'Song Đao Sát Thủ',
        icon: '⚔️',
        role: 'Sát Thương & Xuất Huyết',
        roleColor: '#f43f5e',
        styleType: 'boss_dunghai',
        speed: 190,
        dmg: 80,
        hp: 1150,
        quote: 'Song đao đã rời vỏ thì máu phải đổ — của chúng, không phải của ta.',
        activeSkill: {
          name: 'Huyết Đao Tam Điệp',
          cd: '4.5s',
          desc: 'Chém 3 nhát liên hoàn cực nhanh gây sát thương + găm Xuất Huyết (8 dmg/giây trong 4s).'
        },
        passiveAura: {
          name: 'Trảm Kính Phá Thủ',
          desc: 'Đòn đánh của Dung Hải phá giáp lính thường, giúp người chơi nhanh chóng triệt hạ mục tiêu.'
        },
        coopSkill: {
          name: 'Huyết Long Song Trảm',
          desc: 'Song sát chém rách không gian gây sát thương chí tử và xuất huyết diện rộng.'
        }
      },
      coopBaseDamage: 260,
      onUpdate(ally, dt, player, enemies) {
        if (ally.specialTimer >= 4.5) {
          ally.specialTimer = 0;
          if (window.effectManager) {
            window.effectManager.createShockRing(ally.x, ally.y, '#f43f5e');
            window.effectManager.addFloatingText('HUYẾT ĐAO TAM ĐIỆP!', ally.x, ally.y - 150, 'bleed');
          }
          (enemies || []).forEach((e) => {
            if (!e.isDead && Math.hypot(e.x - ally.x, e.y - ally.y) < 250) {
              const isBossE = !!(e.isBoss || String(e.type || '').startsWith('boss_'));
              e.takeDamage(isBossE ? 34 : 65, isBossE ? 0 : Math.sign(e.x - ally.x || 1) * 6, false);
              if (window.combatSystem && typeof window.combatSystem.applyBleed === 'function') {
                window.combatSystem.applyBleed(e, true, 8);
              } else {
                e.bleedTimer = 3.0;
                e.bleedDmg = 8;
              }
            }
          });
        }
      },
      onBasicAttack(ally, target, dmg, isBossTarget) {
        if (!isBossTarget && target.superArmor) target.superArmor = false;
        target.takeDamage(dmg, isBossTarget ? 0 : ally.facing * 6, !isBossTarget);
        if (isBossTarget && typeof target.bleedTimer === 'number') {
          target.bleedTimer = 2.0;
        }
        if (window.audioManager) window.audioManager.playWhoosh();
        if (window.effectManager) {
          window.effectManager.createHitSparks(target.x, target.y - 80, 15, true);
          window.effectManager.addFloatingText('PHÁ THỦ!', target.x, target.y - 140, 'warn');
        }
      }
    }
  });
})();

