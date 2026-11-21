/**
 * NHÂN VẬT: HỨA VŨ ĐẠI
 * js/entities/characters/huavudai.js
 * Chứa toàn bộ: Hồ sơ, UI chọn tướng, Ngoại hình, Chỉ số sát thương, Nội tại, Tuyệt kỹ & Đồng minh.
 */

(function () {
  function isChoDoiNonSkin(entity) {
    return !!(entity && (
      entity.equippedSkin === 'chodoinon' ||
      (window.CharacterRegistry && typeof window.CharacterRegistry.getEquippedSkin === 'function' && window.CharacterRegistry.getEquippedSkin(entity) === 'chodoinon')
    ));
  }

  window.CharacterRegistry.register({
    id: 'huavudai',
    uiSlotOrder: 2,

    // =========================================================================
    // 1. NGOẠI HÌNH & TRANG PHỤC (STYLE_DEFS)
    // =========================================================================
    appearance: {
      styleKey: 'npc_huavudai',
      style: {
        scale: 1.30,
        archetype: 'patriarch_draped_suit',
        rig: {
          shW: 14.6, waW: 11.4, hipW: 12.4, chestOut: 16.0,
          thighLen: 26.5, calfLen: 27, armUpper: 19.5, armFore: 18.5,
          spineH: 36, neckLen: 14.4, nShX: -6.0, nShY: -2.5, fShX: 5.8, fShY: -1.8,
          hipHalf: 4.8, footPad: 4, headScale: 0.80, limbBulk: 1.14, armBulk: 1.08
        },
        skin: '#e5b892',
        hair: '#222630',
        hairStyle: 'huavudai_patriarch',
        jawStyle: 'broad_elder',
        gi: '#1f2430',
        pants: '#161a24',
        belt: '#f59e0b',
        aura: '#ef4444',
        under: '#111827',
        suit: true,
        drapedOvercoat: true,
        cape: true,
        coatColor: '#0b0e17',
        coatTrim: '#475569',
        liningColor: '#881337',
        cuffRedEmbroidery: true,
        tieColor: '#7f1d1d',
        pocketSquare: '#dc2626',
        leatherBelt: true,
        leatherBeltColor: '#09090b',
        cane: true,
        signetRings: true,
        shoes: 'dress',
        eyeColor: '#b91c1c'
      }
    },

    // =========================================================================
    // 2. HỒ SƠ CỐT TRUYỆN (ROSTER DOSSIER)
    // =========================================================================
    dossier: {
      id: 'huavudai',
      name: 'Hứa Vũ Đại',
      title: 'ÔNG TRÙM MẠNG LƯỚI NGẦM',
      faction: 'hua',
      styleType: 'npc_huavudai',
      portrait: 'npc_huavudai',
      playable: true,
      role: 'Ông trùm được giải cứu, nhân vật trung tâm của âm mưu.',
      motive: 'Giữ mạng lưới của mình sống sót — và giữ bí mật về hồ sơ lâu nhất có thể.',
      bio: 'Hứa Vũ Đại không phải thánh nhân. Hắn xây mạng lưới ngầm bằng thông tin, không bằng lòng trung thành. Khi được giải cứu, hắn chỉ nói: "Muốn biết ai đứng sau chuyện này, mày phải sống sót qua đêm nay đã."',
      fightingStyle: 'Thực dụng và thiếu chính quy: đẩy, húc, đá lùi, ra lệnh hỗ trợ từ xa. Không tuyệt kỹ võ thuật phi lý.',
      strengths: 'Đòn đẩy tạo khoảng cách lớn, ra lệnh cho Mộc Đăng gọi strike hỗ trợ, không dễ bị khống chế bởi crowd.',
      weaknesses: 'Sát thương mỗi đòn thấp, không có kỹ thuật Vovinam, không combo được như Nghị.',
      skills: [
        { name: 'Xô Bật', desc: 'Đòn tay đẩy đối thủ ra xa, tạo khoảng thở.' },
        { name: 'Đá Lùi Vội', desc: 'Khoảng cách xa, knockback mạnh, sát thương thấp.' },
        { name: 'Hiệu Lệnh Kim Tiền [W+U]', desc: 'Tung tiền làm chậm 35% tốc độ địch xung quanh (150px) trong 2.0s và nạp ngay +16 Năng Lượng (CD 6s).' },
        { name: 'Mệnh Lệnh Ngầm', desc: 'Tuyệt kỹ: gọi Mộc Đăng thả strike hỗ trợ vào khu vực trước mặt.' }
      ],
      ultimate: { name: 'MỆNH LỆNH NGẦM', desc: 'Gọi strike hỗ trợ — nổ diện rộng phía trước, không cần cận chiến.' },
      stats: { power: 2, speed: 3, defense: 3, technique: 1, range: 4 },
      relations: [
        { who: 'Ngô Nhất Nghị', rel: 'Tên cận vệ trung thành nhất' },
        { who: 'Phó Mộc Đăng', rel: 'Kẻ hắn vẫn dùng như một quân cờ' },
        { who: 'Long Vương', rel: 'Kẻ đã bắt cóc hắn' }
      ],
      events: ['Hồi I: Được giải cứu nhưng giấu toàn bộ sự thật', 'Màn chơi phụ: Chạy trốn hầm ngầm (điều khiển Hứa Vũ Đại)'],
      unlock: { type: 'stage', stage: 4, text: 'Hoàn thành Hồi I (Màn 4 — Giải cứu Hứa Vũ Đại)' }
    },

    // =========================================================================
    // 3. THẺ CHỌN NHÂN VẬT (CHAR_SLOTS UI)
    // =========================================================================
    uiSlot: {
      id: 'huavudai',
      slotName: 'HỨA VŨ ĐẠI',
      fullName: 'HỨA VŨ ĐẠI',
      title: 'ÔNG TRÙM MẠNG LƯỚI NGẦM',
      tagline: 'Thâm trầm — Quyền uy — Nhìn thấu ván cờ',
      element: '◈',
      color: '#ef4444',
      image: 'assets/images/characters/char_huavudai.png',
      vovinamImage: 'assets/images/characters/char_huavudai_vovinam.png',
      bio: 'Hứa Vũ Đại xây dựng đế chế ngầm bằng thông tin và tính toán lạnh lùng. Dưới vẻ ngoài quyền lực là trái tim luôn bảo bọc những kẻ trung thành.',
      stats: { power: 70, speed: 60, defense: 80, technique: 95 },
      skills: [
        { key: 'J / K', icon: '💥', name: 'Xô Bật Uy Lực', desc: 'Đòn tay đẩy dũng mãnh tạo khoảng cách an toàn.' },
        { key: 'L', icon: '💨', name: 'Thoái Bộ Khẩn Cấp', desc: 'Né lùi nhanh giữ cự ly, tránh bị bao vây.' },
        { key: 'U+J / U+K', icon: '🛡️', name: 'Thiết Trượng Hộ Thân', desc: 'Dùng gậy quyền trượng đỡ đòn và hóa giải chấn động.' },
        { key: 'W+U', icon: '◈', name: 'Hiệu Lệnh Kim Tiền', desc: 'Tung tiền làm chậm 35% tốc độ địch (150px) trong 2.0s và nạp ngay +16 Năng Lượng (CD 6s).' },
        { key: 'I', icon: '🎯', name: 'Mệnh Lệnh Ngầm', desc: 'Tuyệt kỹ: triệu hồi hỏa lực yểm trợ từ mạng lưới ngầm.' }
      ],
      passives: [
        { icon: '◈', name: 'Trầm Tĩnh Thống Soái', type: 'BỊ ĐỘNG', desc: 'Đòn xô đẩy (Knockback) tăng 70% tầm đẩy lùi và gây thêm 30% sát thương va đập tường.' },
        { icon: '🛡️', name: 'Hắc Long Hộ Thể', type: 'BỊ ĐỘNG', desc: 'Khi chịu sát thương chí tử, tự động kích hoạt Hộ Thể Thuẫn chặn 100% sát thương trong 3s.' },
        { icon: '💥', name: 'Thiết Trượng Chấn Lực', type: 'CHỦ ĐỘNG [U+J]', desc: 'Dùng trượng bạc cản đòn, giải phóng sóng chấn động AoE đẩy dạt mọi kẻ địch xung quanh.' },
        { icon: '🎯', name: 'Mạng Lưới Chi Viện', type: 'BỊ ĐỘNG', desc: 'Mỗi 8s tự động nạp 12% Nộ khí; tăng 35% vàng và điểm tích lũy sau mỗi trận chiến.' }
      ],
      mechanic: 'Thực dụng — Đẩy lùi diện rộng — Gọi chi viện tầm xa.',
      quote: '“Muốn biết chân tướng, trước hết phải sống sót qua đêm nay.”'
    },

    // =========================================================================
    // 4. CHỈ SỐ CHIẾN ĐẤU & SÁT THƯƠNG ĐÒN ĐÁNH
    // =========================================================================
    combat: {
      hp: 900,
      speed: 210,
      runSpeed: 340,
      jumpForce: 470,
      damage: 1.0,
      reach: 1.1,
      knockback: 1.7,
      energyGain: 1.1,
      finisher: 'shove',
      ultimateState: 'ultimate_command',
      ultimateType: 'command',
      mechanic: 'Đòn đẩy diện rộng + Gọi hỗ trợ từ xa'
    },

    moveOverrides: {},

    finisher: {
      state: 'kick_push',
      dur: 0.6,
      lunge: 250,
      shake: false,
      attack: { damage: 65, offsetX: 66, offsetY: -70, width: 108, height: 66, knockback: 620, weight: 'heavy', energyGain: 16, unblockable: true }
    },

    // =========================================================================
    // 5. NỘI TẠI THỰC CHIẾN (PASSIVES)
    // =========================================================================
    passives: {
      onApply(player) {
        player.kbMul = 1.7;
        player.passive_tramTinh = true;
        player.passive_hacLongShield = true;
        player._hacLongShieldUsed = false;
        player.passive_thietTruong = true;
        player.passive_mangLuoi = true;
        player._energyRegenTimer = 0;
      },
      onUpdate(player, dt) {
        if (!player.isDead) {
          player._energyRegenTimer = (player._energyRegenTimer || 0) + dt;
          if (player._energyRegenTimer >= 8.0) {
            player._energyRegenTimer = 0;
            player.energy = Math.min(player.maxEnergy, player.energy + 12);
            if (window.uiManager && typeof window.uiManager.updatePlayerEnergy === 'function') {
              window.uiManager.updatePlayerEnergy(player.energy, player.maxEnergy);
            }
            if (window.effectManager) {
              window.effectManager.addFloatingText('+12 NỘ KHÍ', player.x, (player.y || 580) - 140, 'heal');
            }
          }
        }
      },
      onBeforeTakeDamage(player, ctx) {
        if (ctx.amount >= player.hp && !player._hacLongShieldUsed) {
          player._hacLongShieldUsed = true;
          player.hp = Math.max(1, Math.round(player.maxHp * 0.20));
          player.invincibleTimer = 3.0;
          player.setAuraArmor('white', 3.0);
          if (window.effectManager) {
            window.effectManager.createShockRing(player.x, player.y, '#ffffff');
            window.effectManager.addFloatingText('🛡️ HẮC LONG HỘ THỂ (BẤT HOẠI 3s)!', player.x, player.y - 160, 'ultimate');
          }
          if (window.audioManager) window.audioManager.playUltimateBurst();
          if (window.uiManager) window.uiManager.updatePlayerHp(player.hp, player.maxHp);
          return { cancelled: true };
        }
        return null;
      },
      onHandCounter(defender, attacker) {
        if (window.game && window.game.enemies) {
          window.game.enemies.forEach((e) => {
            if (e !== attacker && !e.isDead && Math.hypot(e.x - defender.x, e.y - defender.y) < 180) {
              e.takeDamage(45, Math.sign(e.x - defender.x || 1) * 12, true);
            }
          });
        }
        if (window.effectManager) window.effectManager.createShockRing(defender.x, defender.y, '#ef4444');
      },
      onLegCounter(defender, attacker) {
        if (typeof defender.addEnergy === 'function') defender.addEnergy(18);
        if (attacker && !attacker.isDead) {
          attacker.speedMul = 0.45;
          attacker.slowTimer = Math.max(attacker.slowTimer || 0, 3.0);
          if (typeof attacker.takeDamage === 'function') {
            attacker.takeDamage(40, (defender.facing || 1) * 8, false);
          }
          if (window.effectManager) {
            if (typeof window.effectManager.createShockRing === 'function') window.effectManager.createShockRing(attacker.x, attacker.y || 580, '#ef4444');
            if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText('🎯 MỆNH LỆNH PHẢN TẬP KÍCH (+40 / KHÓA CHÂN)!', attacker.x, (attacker.y || 580) - 165, 'crit');
          }
        }
      },
      onStanceSpecial(player) {
        if (typeof player.addEnergy === 'function') player.addEnergy(16);
        const enemies = (window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : [];
        for (const e of enemies) {
          if (!e || e.isDead) continue;
          if (Math.hypot(e.x - player.x, e.y - player.y) <= 150) {
            e.speedMul = Math.min(e.speedMul || 1, 0.65);
            e.slowTimer = Math.max(e.slowTimer || 0, 2.0);
          }
        }
        if (window.effectManager) {
          if (typeof window.effectManager.createBanknoteScatter === 'function') window.effectManager.createBanknoteScatter(player.x, (player.y || 580) - 40, 6);
          if (typeof window.effectManager.createShockRing === 'function') window.effectManager.createShockRing(player.x, player.y || 580, '#ef4444');
          if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText('◈ HIỆU LỆNH KIM TIỀN (+16 NỘ)!', player.x, (player.y || 580) - 170, 'heal');
        }
        return true;
      },
      onDodgeFollowup(player, btn) {
        if (btn === 'K') {
          player.startAttack('kick_push', 0.54, 240);
          if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText('💢 UY QUYỀN ĐẨY LÙI!', player.x, (player.y || 580) - 150, 'crit');
          }
          return true;
        }
        player.startAttack('punch_hook', 0.40, 170);
        if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText('🦯 QUÉT GẬY ĐẦU RỒNG!', player.x, (player.y || 580) - 150, 'dodge');
        }
        return true;
      },
      onDodge(player, ctx) {
        if (ctx) ctx.dodgeSpeed = 520;
        player.invincibleTimer = Math.max(player.invincibleTimer || 0, 0.35);
        if (window.game && Array.isArray(window.game.enemies)) {
          window.game.enemies.forEach((e) => {
            if (e && !e.isDead && Math.hypot(e.x - player.x, e.y - player.y) < 165) {
              e.blindTimer = 1.6;
              e.speedMul = 0.65;
              e.slowTimer = 1.6;
            }
          });
        }
        if (window.effectManager) {
          window.effectManager.createDust(player.x, player.y, 12, 55);
          window.effectManager.addFloatingText('THOÁI BỘ KHẨN CẤP!', player.x, player.y - 140, 'dodge');
        }
      },
      onAttackHit(attacker, defender, attackData, combatSystem, hitCtx) {
        if (!defender || defender.isDead || !attackData) return;
        const isShoveOrKb = (attackData.knockback || 0) >= 18 || attackData.knockdown || attacker.state === 'kick_push';
        if (isShoveOrKb) {
          const mul = (hitCtx && hitCtx.isCrossCombo) ? 0.65 : 0.3;
          const wallBonus = Math.max(8, Math.round((attackData.damage || 30) * mul));
          defender.hp = Math.max(0, defender.hp - wallBonus);
          if (defender.hp <= 0) {
            defender.isDead = true;
            defender.isAttacking = false;
            defender.setState('knockdown', 1.0);
          }
          if (window.effectManager) {
            window.effectManager.addFloatingText(`💥 XÔ ĐẨY VA ĐẬP (+${wallBonus})!`, defender.x, (defender.y || 580) - 155, 'crit');
          }
        }
        if (hitCtx && hitCtx.effectiveMove === 'uppercut') {
          defender.blindTimer = Math.max(defender.blindTimer || 0, 1.5);
        }
        if (hitCtx && hitCtx.effectiveMove === 'elbow_strike') {
          if (defender.isBoss && typeof defender.poise === 'number') defender.poise = Math.max(0, defender.poise - 18);
          if (typeof attacker.addEnergy === 'function') attacker.addEnergy(8);
        }
      }
    },

    // =========================================================================
    // 5b. HOẠT ẢNH ĐẶC TRƯNG 5 GIAI ĐOẠN (HỨA VŨ ĐẠI — GẬY ĐẦU RỒNG & UY QUYỀN)
    // =========================================================================
    animation: {
      signatureStates: ['ultimate_command'],
      trailProfile: {
        primary: '#ef4444',
        secondary: '#facc15',
        core: '#fef08a',
        width: 12,
        dual: false,
        dodgeGhost: 'rgba(220, 38, 38, 0.45)'
      },
      skillCatalog: [
        { id: 'punch_straight', input: 'J', name: 'Thúc Gậy Đầu Rồng', dur: 0.34, category: 'combo' },
        { id: 'punch_hook', input: 'J → J', name: 'Vung Gậy Hoành Tảo', dur: 0.42, category: 'combo' },
        { id: 'kick_push', input: 'K / Finisher', name: 'Uy Quyền Gia Chủ', dur: 0.60, category: 'finisher' },
        { id: 'kick_roundhouse', input: 'K → K', name: 'Hất Gót Trấn Áp', dur: 0.60, category: 'combo' },
        { id: 'wk', input: 'W + K', name: 'Trường Quyền Bá Chủ Tiến Công', dur: 0.52, category: 'special' },
        { id: 'uppercut', input: 'W + J', name: 'Long Thủ Thăng Thiên', dur: 0.52, category: 'special' },
        { id: 'elbow_strike', input: 'S + J', name: 'Đập Chuôi Ngược Gậy', dur: 0.46, category: 'special' },
        { id: 'kick_sweep', input: 'S + K', name: 'Quét Gậy Triệt Bộ', dur: 0.66, category: 'special' },
        { id: 'hook_run', input: 'Shift + J', name: 'Chấn Địa Lệnh Chưởng', dur: 0.48, category: 'special' },
        { id: 'air_punch', input: 'Space + J', name: 'Thiên Giáng Quyền Trượng', dur: 0.38, category: 'aerial' },
        { id: 'flying_kick', input: 'Space + K', name: 'Hổ Cước Đế Đô', dur: 0.55, category: 'aerial' },
        { id: 'dodge', input: 'L', name: 'Thoái Bộ Uy Nghiêm', dur: 0.28, category: 'defense' },
        { id: 'counter_hand_strike', input: 'U + J', name: 'Phản Đòn: Trấn Gậy Đế Vương', dur: 0.42, category: 'counter' },
        { id: 'counter_leg_strike', input: 'U + K', name: 'Phản Đòn: Quét Gậy Chấn Uy', dur: 0.48, category: 'counter' },
        { id: 'ultimate_command', input: 'I', name: 'Tuyệt Kỹ: Mệnh Lệnh Truy Sát', dur: 1.35, category: 'ultimate' }
      ],
      poses: {
        idle(P, { t }) {
          const b = Math.sin(t * 2.2);
          P.torso = 0.03 + 0.01 * b;
          P.head = 0.01 * b;
          P.hx = Math.sin(t * 1.1) * 0.5;
          P.lift = Math.sin(t * 2.2) * 0.7;
          P.nT = 0.18 + 0.015 * b; P.nS = -0.22 - 0.015 * b;
          P.fT = -0.18 - 0.015 * b; P.fS = 0.04 + 0.015 * b;
          // Dáng gia chủ bề thế đứng thẳng chống gậy rồng bên đùi, tay kia đặt ngang eo gile lộ cặp nhẫn bạc
          P.nA = 0.22 + 0.02 * b; P.nE = 0.18;
          P.fA = -0.14; P.fE = 1.24;
          return true;
        },
        punch_straight(P, { U, p }) {
          // Beat 1 Gia Chủ: Thúc thẳng gậy Đầu Rồng gọn gàng, tay sau khóa sườn sẵn sàng vung quét Beat 2
          const s = U.stage5(p, { a: 0.2, c: 0.4, i: 0.6, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.4 - s.recover * 0.65);
          P.torso = 0.08 - 0.1 * s.windup + 0.18 * ex;
          P.nA = U.lerp(0.35 - 0.6 * s.windup, 1.54, ex); P.nE = U.lerp(1.75, 0.08, ex);
          P.grip = U.lerp(-0.2, -0.58, ex);
          P.fA = -0.25; P.fE = 1.92;
          P.nT = 0.52 + 0.18 * ex; P.nS = -0.68; P.fT = -0.5; P.fS = 0.15;
          return true;
        },
        punch_hook(P, { U, p }) {
          // Beat 2: Vung ngang Gậy Đầu Rồng hoành tảo, truyền lực hông sang Beat 3
          const s = U.stage5(p, { a: 0.22, c: 0.42, i: 0.60, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.65);
          P.torso = 0.08 - 0.16 * s.windup + 0.18 * ex;
          P.nA = U.lerp(0.32 - 0.78 * s.windup, 1.24, ex); P.nE = U.lerp(1.10, 0.16, ex);
          P.grip = U.lerp(0.32, -0.78, ex);
          P.fA = 0.26; P.fE = 1.45;
          P.nT = 0.6 + 0.16 * ex; P.nS = -0.78; P.fT = -0.52; P.fS = 0.18;
          return true;
        },
        elbow_strike(P, { U, p }) {
          // Đập Chuôi Ngược Gậy: Thúc khuỷu gập cùng đầu Gậy Rồng uy nghi tầm gần, giữ dáng trưởng lão bề thế
          const s = U.stage5(p, { a: 0.20, c: 0.40, i: 0.60, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.46 - s.recover * 0.68);
          P.torso = U.lerp(0.06 - 0.12 * s.windup, 0.16, ex);
          P.hx = -3 * s.windup + 5 * ex;
          P.nA = U.lerp(0.25 - 0.50 * s.windup, 1.24, ex);
          P.nE = U.lerp(1.10, -1.82, ex);
          P.grip = U.lerp(0.20, 0.92, ex);
          P.fA = U.lerp(0.26, 0.55, ex); P.fE = 1.48;
          P.nT = 0.64 + 0.14 * ex; P.nS = -0.78; P.fT = -0.54; P.fS = 0.18;
          return true;
        },
        kick_push(P, { U, p }) {
          // Uy Quyền Gia Chủ: Nhấn gậy đằng sau lấy đà -> Tung Chưởng & Gậy Rồng xô bật kẻ địch
          const s = U.stage5(p, { a: 0.22, c: 0.42, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.4 - s.recover * 0.68);
          P.torso = U.lerp(0.08 - 0.14 * s.windup, 0.28, ex);
          P.hx = -5 * s.windup + 8 * ex;
          P.nA = U.lerp(0.3 - 0.7 * s.windup, 1.54, ex); P.nE = U.lerp(1.7, 0.08, ex);
          P.fA = U.lerp(0.4, 1.25, ex); P.fE = 0.18;
          P.nT = 0.6 + 0.35 * ex; P.nS = -0.82; P.fT = -0.6; P.fS = 0.2;
          return true;
        },
        kick_roundhouse(P, { U, p }) {
          // Beat 3 Gia Chủ: Chống gậy Đầu Rồng làm trụ uy nghiêm, tung chưởng & hất gót nặng trấn áp tầm ngực
          const s = U.stage5(p, { a: 0.22, c: 0.42, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.44 - s.recover * 0.7);
          P.torso = U.lerp(0.10, -0.18, ex);
          P.head = 0.02;
          P.nA = U.lerp(0.35, 0.42, ex); P.nE = 0.24; P.grip = U.lerp(-0.2, 0.15, ex);
          P.fA = U.lerp(0.3, 1.22, ex); P.fE = 0.22;
          P.nT = U.lerp(0.5, 1.54, ex); P.nS = U.lerp(-1.15, -0.02, ex); P.nF = 0.28 * ex;
          P.fT = -0.34; P.fS = 0.08;
          return true;
        },
        wk(P, { U, p }) {
          // W + K: Trường Quyền Bá Chủ Tiến Công — chống mũi gậy làm điểm tựa xô thân lao tới đạp thẳng cực nặng
          const s = U.stage5(p, { a: 0.20, c: 0.40, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.42 - s.recover * 0.7);
          P.torso = U.lerp(0.06, 0.24, ex);
          P.lift = 4 * s.windup - 6 * ex;
          P.nA = U.lerp(0.4, 0.92, ex); P.nE = 0.22; P.grip = 0.18;
          P.fA = U.lerp(0.25, 1.44, ex); P.fE = 0.14;
          P.nT = U.lerp(0.55, 1.38, ex); P.nS = U.lerp(-1.25, 0.02, ex); P.nF = 0.35 * ex;
          P.fT = -0.45; P.fS = 0.14;
          return true;
        },
        kick_sweep(P, { U, p }) {
          // S + K: Quét Gậy Triệt Bộ — giữ dáng trưởng lão bề thế, quét gậy Đầu Rồng kết hợp giày tây sạt mắt cá
          const s = U.stage5(p, { a: 0.22, c: 0.42, i: 0.64, f: 0.86 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.42 - s.recover * 0.72);
          P.lift = U.lerp(0, 8, ex);
          P.torso = U.lerp(0.06, 0.14, ex);
          P.nA = U.lerp(0.85 * s.windup + 0.3, 0.48, ex); P.nE = 0.12; P.grip = U.lerp(0.2, -0.88, ex);
          P.fA = U.lerp(0.25, -0.35, ex); P.fE = 1.68;
          P.nT = U.lerp(0.45, 1.06, ex); P.nS = U.lerp(-1.1, -0.02, ex);
          P.fT = U.lerp(-0.22, 0.35, ex); P.fS = U.lerp(0.06, -1.12, ex);
          return true;
        },
        dodge(P, { U, p }) {
          // Chống gậy xoay thân quý tộc, không gập lưng thô kệch
          const w = U.beat(p, 0.04, 0.96, 0.36);
          P.torso = U.lerp(0.08, -0.18, w); P.head = 0.08 * w;
          P.nA = U.lerp(0.4, 0.95, w); P.nE = 0.35;
          P.fA = U.lerp(0.25, -0.45, w); P.fE = 1.65;
          P.nT = 0.45; P.nS = -0.55; P.fT = -0.7 * w - 0.45 * (1 - w); P.fS = 0.25;
          return true;
        },
        counter_hand_strike(P, { U, p }) {
          // Nhấc gậy đầu rồng thẳng đứng (0..0.24) -> Nện mạnh xuống nền tung sóng đế vương (0.24..0.64) -> Đứng uy nghiêm
          const up = U.beat(p, 0.0, 0.40, 0.2);
          const slam = U.stage5(p, { a: 0.24, c: 0.42, i: 0.62, f: 0.84 });
          const ex = Math.max(0, slam.strike - slam.recover * 0.7);
          P.torso = U.lerp(0.06 - 0.12 * up, 0.22, ex);
          P.nA = U.lerp(0.35 + 1.12 * up, 0.68, ex);
          P.nE = U.lerp(1.10, 0.22, Math.max(up, ex));
          P.fA = U.lerp(0.4, -0.35, ex); P.fE = 1.35;
          P.nT = 0.56 + 0.22 * ex; P.nS = -0.78; P.fT = -0.56; P.fS = 0.18;
          return true;
        },
        counter_leg_strike(P, { U, p }) {
          const s = U.stage5(p, { a: 0.2, c: 0.4, i: 0.6, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.4 - s.recover * 0.65);
          P.torso = 0.18 - 0.26 * ex;
          P.nA = U.lerp(0.4, 1.35, ex); P.nE = 0.35;
          P.nT = U.lerp(0.55, 1.25, ex); P.nS = U.lerp(-0.7, -0.1, ex);
          P.fT = -0.55; P.fS = 0.2;
          return true;
        },
        ultimate_command(P, { U, p }) {
          // Mệnh Lệnh Truy Sát (5 giai đoạn động hoàn toàn — loại bỏ đứng đơ boss_taunt!):
          // Stg 1 (0..0.22): Nhấc cao & nện Gậy Đầu Rồng xuống đất khai ấn Gia Chủ
          // Stg 2 (0.22..0.74): Vung tay áo măng-tô quét cung chỉ huy 3 tọa độ truy sát trên không trung
          // Stg 3 (0.74..0.88): Nện mạnh gậy chốt hạ đợt oanh tạc cuối
          // Stg 4-5 (0.88..1.0): Thu gậy về thế Uy Quyền điềm tĩnh
          if (p < 0.22) {
            const lift = U.beat(p, 0.0, 0.14, 0.15);
            const stamp = U.easeInCubic(U.clamp((p - 0.10) / 0.12));
            P.torso = U.lerp(0.08 - 0.12 * lift, 0.24, stamp);
            P.head = -0.05; P.lift = -4 * lift + 5 * stamp;
            P.nA = U.lerp(0.55 + 1.65 * lift, 0.85, stamp);
            P.nE = U.lerp(1.5, 0.2, Math.max(lift, stamp));
            P.fA = -0.25; P.fE = 1.8;
            P.nT = 0.58; P.nS = -0.82; P.fT = -0.54; P.fS = 0.18;
            return true;
          }
          if (p < 0.74) {
            const u = (p - 0.22) / 0.52;
            const sweep = Math.sin(u * Math.PI * 3);
            P.torso = 0.12 - 0.14 * Math.abs(sweep);
            P.head = -0.1; P.hx = 3 * sweep;
            // Gậy rồng vung chỉ điểm cao -> ngang -> chếch xuống 3 mục tiêu
            P.nA = 1.38 + 0.42 * sweep; P.nE = 0.12 + 0.14 * Math.abs(sweep);
            P.fA = 0.85 - 0.45 * sweep; P.fE = 0.95;
            P.nT = 0.55; P.nS = -0.74; P.fT = -0.58; P.fS = 0.18;
            return true;
          }
          if (p < 0.88) {
            const fin = U.easeOutBack(U.clamp((p - 0.74) / 0.12), 1.3);
            P.torso = U.lerp(0.08, 0.28, fin);
            P.nA = U.lerp(1.75, 0.78, fin); P.nE = 0.15;
            P.fA = -0.35 * fin; P.fE = 1.7;
            P.nT = 0.62; P.nS = -0.86; P.fT = -0.55; P.fS = 0.18;
            return true;
          }
          const rec = U.easeInOutQuart((p - 0.88) / 0.12);
          P.torso = U.lerp(0.28, 0.08, rec);
          P.nA = U.lerp(0.78, 0.52, rec); P.nE = U.lerp(0.15, 1.65, rec);
          P.fA = U.lerp(-0.35, 0.3, rec); P.fE = U.lerp(1.7, 1.95, rec);
          P.nT = 0.58; P.nS = -0.78; P.fT = -0.52; P.fS = 0.16;
          return true;
        }
      },
      emitSkillVFX(e, st, prevP, p, fx) {
        const cross = (t) => prevP < t && p >= t;
        const dir = e.facing || 1;
        const gx = e.x || 0, gy = e.y || 580;
        if (st === 'dodge' && cross(0.06)) {
          fx.createDust(gx, gy, 10, 48);
          fx.createImperialSeal(gx, gy, 56, 0.35, '#dc2626');
        } else if (st === 'counter_hand_strike') {
          if (cross(0.08)) fx.createImperialSeal(gx, gy, 62, 0.38, '#ef4444');
          if (cross(0.38)) {
            fx.createOrbitalPillar(gx + dir * 75, gy, '#dc2626');
            fx.createImperialSeal(gx + dir * 40, gy, 115, 0.5, '#facc15');
          }
        } else if (st === 'punch_hook' && cross(0.38)) {
          fx.createEnergySparks(gx + dir * 60, gy - 78, 6);
        } else if ((st === 'kick_push' || st === 'wk') && cross(0.38)) {
          fx.createImperialSeal(gx + dir * 56, gy - 45, 72, 0.38, '#ef4444');
          fx.createSonicBoomCone(gx + dir * 40, gy - 68, dir, '#facc15');
        } else if (st === 'kick_roundhouse' && cross(0.40)) {
          fx.createImperialSeal(gx + dir * 42, gy, 78, 0.38, '#dc2626');
        } else if (st === 'kick_sweep' && cross(0.44)) {
          fx.createGroundCrack(gx + dir * 52, gy, 88, '#ef4444');
          fx.createDust(gx + dir * 42, gy, 10, 44);
        } else if (st === 'ultimate_command') {
          if (isChoDoiNonSkin(e)) {
            if (prevP < 0.1) e._ultDogBiteTick = 0;
            if (cross(0.12)) {
              fx.createImperialSeal(gx, gy, 110, 0.65, '#dc2626');
              if (typeof fx.addFloatingText === 'function') fx.addFloatingText('🐶 BẠCH KHUYỂN HIỆN HÌNH!', gx, gy - 155, 'crit');
            }
            const marks = [0.28, 0.52, 0.76];
            marks.forEach((m, i) => {
              const bit = 1 << i;
              if (cross(m) && !((e._ultDogBiteTick || 0) & bit)) {
                e._ultDogBiteTick = (e._ultDogBiteTick || 0) | bit;
                const tx = gx + dir * (150 + i * 160);
                if (typeof fx.createDogJawsBite === 'function') {
                  fx.createDogJawsBite(tx, gy, dir, i === 2 ? 1.18 : 1.0);
                } else {
                  fx.createOrbitalPillar(tx, gy, '#dc2626');
                }
              }
            });
          } else {
            if (cross(0.12)) fx.createImperialSeal(gx, gy, 105, 0.65, '#facc15');
            if (cross(0.28)) fx.createOrbitalPillar(gx + dir * 150, gy, '#ef4444');
            if (cross(0.52)) fx.createOrbitalPillar(gx + dir * 310, gy, '#dc2626');
            if (cross(0.76)) fx.createOrbitalPillar(gx + dir * 470, gy, '#facc15');
          }
        }
      }
    },

    // =========================================================================
    // 6. TUYỆT KỸ THỰC CHIẾN (ULTIMATE: MỆNH LỆNH TRUY SÁT)
    // =========================================================================
    ultimateRuntime: {
      type: 'command',
      cinematic: {
        title: 'HỨA VŨ ĐẠI',
        ult: 'MỆNH LỆNH TRUY SÁT',
        color: '#ef4444',
        accent: '#fbbf24',
        style: 'command',
        duration: 1.35
      },
      execute(player, st, dt, enemies, { p, hitEnemy }) {
        if (p < 0.1) player._ultDogBiteTick = 0;
        const marks = [0.28, 0.52, 0.76];
        const isDog = isChoDoiNonSkin(player);
        marks.forEach((m, i) => {
          const bit = 1 << i;
          if (p > m && !(player._ultFlags & bit)) {
            player._ultFlags |= bit;
            const tx = player.x + player.facing * (150 + i * 160);
            if (window.effectManager) {
              if (isDog) {
                if (!((player._ultDogBiteTick || 0) & bit)) {
                  player._ultDogBiteTick = (player._ultDogBiteTick || 0) | bit;
                  if (typeof window.effectManager.createDogJawsBite === 'function') {
                    window.effectManager.createDogJawsBite(tx, player.y, player.facing || 1, i === 2 ? 1.18 : 1.0);
                  } else {
                    window.effectManager.createOrbitalPillar(tx, player.y, '#dc2626');
                  }
                }
                window.effectManager.createDust(tx, player.y, 18, 100);
                window.effectManager.triggerScreenShake(13, 0.28);
                window.effectManager.addFloatingText(i === 2 ? '🦷 BẠCH KHUYỂN ĐỚP XÁC!' : '🐶 NGOẠM!', tx, player.y - 175, 'crit');
              } else {
                window.effectManager.createOrbitalPillar(tx, player.y, i === 2 ? '#facc15' : '#ef4444');
                window.effectManager.createDust(tx, player.y, 18, 100);
                window.effectManager.triggerScreenShake(12, 0.25);
                window.effectManager.addFloatingText('OANH TẠC!', tx, player.y - 170, 'counter');
              }
            }
            if (window.audioManager) window.audioManager.playHeavyHit();
            for (const e of enemies) {
              if (!e.isDead && Math.abs(e.x - tx) < 145 && Math.abs(e.y - player.y) < 85) {
                hitEnemy(e, 150, 12, true);
              }
            }
          }
        });
        if (p >= 1) player.setState('idle');
      }
    },

    // =========================================================================
    // 7. HỆ THỐNG ĐỒNG MINH CHI VIỆN (ALLY SUPPORT)
    // =========================================================================
    ally: {
      profile: {
        id: 'huavudai',
        name: 'Hứa Vũ Đại',
        title: 'Ông Trùm Mạng Lưới',
        icon: '💼',
        role: 'Chiến Thuật & Bom Khói',
        roleColor: '#a855f7',
        styleType: 'npc_huavudai',
        speed: 185,
        dmg: 72,
        hp: 1150,
        quote: 'Thế lực thật sự không nằm ở nắm đấm, mà ở cái đầu biết tính.',
        activeSkill: {
          name: 'Bom Khói Ám Khí',
          cd: '4.5s',
          desc: 'Ném bom khói làm mù lính thường trong 3.0s, che khuất tầm nhìn và làm chậm Boss.'
        },
        passiveAura: {
          name: 'Quyền Lực Thế Ngầm',
          desc: 'Tăng +25% sát thương và +30% tốc độ tích nộ khí Vovinam cho người chơi.'
        },
        coopSkill: {
          name: 'Hắc Long Quyền Uy',
          desc: 'Liên hoàn quyền uy áp đảo và nạp ngay 35% Nộ Khí cho người chơi.'
        }
      },
      coopBaseDamage: 240,
      onCoop(ally, player) {
        if (player && typeof player.energy === 'number') {
          player.energy = Math.min(100, player.energy + 30);
          if (window.uiManager) {
            if (typeof window.uiManager.updateEnergy === 'function') window.uiManager.updateEnergy(player.energy);
            else if (typeof window.uiManager.updatePlayerEnergy === 'function') window.uiManager.updatePlayerEnergy(player.energy, player.maxEnergy || 100);
          }
        }
      },
      onUpdate(ally, dt, player, enemies) {
        if (player) {
          player.allyDmgBuff = 1.25;
          player.allyEnergyRate = 1.30;
        }
        if (ally.specialTimer >= 4.5) {
          ally.specialTimer = 0;
          if (window.effectManager) {
            window.effectManager.createDust(ally.x, ally.y, 24, 35);
            window.effectManager.addFloatingText('BOM KHÓI TẬP KÍCH!', ally.x, ally.y - 160, 'dodge');
          }
          (enemies || []).forEach((e) => {
            if (!e.isDead && Math.hypot(e.x - ally.x, e.y - ally.y) < 280) {
              const isBossE = !!(e.isBoss || String(e.type || '').startsWith('boss_'));
              if (isBossE) {
                if (e.allyCcImmunityTimer <= 0 || !e.allyCcImmunityTimer) {
                  e.blindTimer = 0.8;
                  e.speedMul = 0.85;
                  e.allyCcImmunityTimer = 4.5;
                }
              } else {
                e.blindTimer = 2.5;
                if (typeof e.setState === 'function') e.setState('hurt', 0.6);
              }
            }
          });
        }
      },
      onBasicAttack(ally, target, dmg, isBossTarget) {
        target.takeDamage(dmg, isBossTarget ? 0 : ally.facing * 7, false);
        if (window.audioManager) window.audioManager.playPunchHit();
        if (window.effectManager) {
          window.effectManager.createHitSparks(target.x, target.y - 70, 10, false);
          window.effectManager.addFloatingText('ĐẨY LÙI!', target.x, target.y - 140, 'heal');
        }
      }
    }
  });
})();

