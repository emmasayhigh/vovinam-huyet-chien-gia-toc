/**
 * NHÂN VẬT: NGÔ GIANG MẠNH
 * js/entities/characters/giangmanh.js
 * Chứa toàn bộ: Hồ sơ, UI chọn tướng, Ngoại hình, Chỉ số sát thương, Nội tại, Tuyệt kỹ & Đồng minh.
 */

(function () {
  function applyFrostStacks(target, count, combatSystem) {
    if (!target || target.isDead) return false;
    const isPvpTarget = !!target.isRemotePlayer;
    const now = Date.now();
    // Đang đóng băng/choáng hoặc đang trong thời gian kháng đóng băng -> không tích chồng gây stunlock vĩnh viễn
    if ((target.frozenTimer || 0) > 0 || (target.stunTimer || 0) > 0 || (target._freezeImmunityUntil || 0) > now) {
      return false;
    }
    const maxStacks = isPvpTarget ? 5 : 4;
    target._frostStacks = Math.min(maxStacks, (target._frostStacks || 0) + count);
    target.chillStacks = target._frostStacks;
    const slowPerStack = isPvpTarget ? 0.05 : 0.1;
    const minSpeedMul = isPvpTarget ? 0.75 : 0.5;
    target.speedMul = Math.max(minSpeedMul, 1.0 - target._frostStacks * slowPerStack);
    target.slowTimer = Math.max(target.slowTimer || 0, isPvpTarget ? 2.0 : 3.0);
    if (target._frostStacks >= maxStacks) {
      target._frostStacks = 0;
      target.chillStacks = 0;
      const freezeDur = isPvpTarget ? 0.75 : 1.45;
      target.frozenTimer = freezeDur;
      target._freezeImmunityUntil = now + (isPvpTarget ? 8000 : 3500);
      if (combatSystem && typeof combatSystem.applyStun === 'function') {
        combatSystem.applyStun(target, true, freezeDur, 40);
      } else {
        target.stunTimer = Math.max(target.stunTimer || 0, freezeDur);
      }
      if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
        window.effectManager.addFloatingText(`❄️ HÀN BĂNG ĐÓNG BĂNG ${freezeDur}s!`, target.x, (target.y || 580) - 170, 'stun');
      }
      return true;
    }
    return false;
  }

  window.CharacterRegistry.register({
    id: 'giangmanh',
    uiSlotOrder: 6,

    // =========================================================================
    // 1. NGOẠI HÌNH & TRANG PHỤC (STYLE_DEFS)
    // =========================================================================
    appearance: {
      styleKey: 'boss_giangmanh',
      style: {
        scale: 1.29,
        archetype: 'patriarch_sword_robe',
        rig: {
          shW: 13.0, waW: 9.2, hipW: 10.8, chestOut: 14.0,
          thighLen: 27, calfLen: 28, armUpper: 19.5, armFore: 18.5,
          spineH: 35.5, neckLen: 14.6, nShX: -5.4, nShY: -2.4, fShX: 5.2, fShY: -1.8,
          hipHalf: 4.1, footPad: 4, headScale: 0.82, limbBulk: 1.03, armBulk: 1.00
        },
        skin: '#e2b690',
        hair: '#e2e8f0',
        hairStyle: 'giangmanh_topknot',
        jawStyle: 'elder_dignified',
        gi: '#1e3a5f',
        pants: '#13243d',
        belt: '#334155',
        beard: true,
        robe: true,
        wideSleeves: true,
        highCollar: true,
        frostBlade: true,
        weapon: 'machete',
        weaponLen: 44,
        aura: '#38bdf8',
        under: '#111f36',
        shoes: 'patriarch_boots',
        eyeColor: '#38bdf8'
      }
    },

    // =========================================================================
    // 2. HỒ SƠ CỐT TRUYỆN (ROSTER DOSSIER)
    // =========================================================================
    dossier: {
      id: 'giangmanh',
      name: 'Ngô Giang Mạnh',
      title: 'CHỦ GIA TỘC HỌ NGÔ',
      faction: 'ngo',
      styleType: 'boss_giangmanh',
      portrait: 'boss_giangmanh',
      playable: true,
      role: 'Chủ gia tộc họ Ngô, kẻ thù của họ Phó, bước ra khỏi bóng tối ở Hồi V.',
      motive: 'Mối thù sâu sắc với Phó Mộc Đăng và sự nghi ngờ tuyệt đối với tất cả — kể cả Nghị.',
      bio: 'Giang Mạnh không cần thuyết phục ai. Hắn quan sát, ghi nhớ thói quen chiến đấu của đối thủ và trừng phạt sự lặp lại. Hắn không phải phản diện cuối cùng: nếu Nghị đưa ra lựa chọn đúng, hắn trở thành đồng minh bất đắc dĩ.',
      fightingStyle: 'Đòn chính xác, di chuyển tiết kiệm, phản công mạnh khi người chơi lặp lại một combo, né ngang và áp sát bất ngờ.',
      strengths: 'Đọc thói quen (không đọc đầu vào tương lai), trừng phạt combo lặp, phản công chính xác, dodge ngang có cooldown.',
      weaknesses: 'Ít hành động thừa nghĩa là mỗi sai lầm của hắn đều đáng giá — hắn không có lượng HP vô nghĩa.',
      skills: [
        { name: 'Quan Sát Thói Quen', desc: 'Ghi nhận các đòn người chơi hay dùng; lặp lại 3 lần sẽ bị hắn trừng phạt.' },
        { name: 'Né Ngang Tiếp Cận', desc: 'Né sidestep rồi áp sát — có thời gian hồi, không né liên tục.' },
        { name: 'Phản Công Trừng Phạt', desc: 'Đòn phản công sau khi né: sát thương lớn, ngắn gọn.' },
        { name: 'Hàn Băng Kiếm Quyết [W+U]', desc: 'Tỏa hàn khí gắn +1 tầng Đóng Băng lên địch (165px), hồi +12 Thể Lực và mở 0.8s cửa sổ Phản Đòn (CD 6s).' },
        { name: 'Áp Sát Bất Ngờ', desc: 'Lướt thẳng vào cự ly gần rồi ra đòn ngay.' }
      ],
      ultimate: null,
      stats: { power: 4, speed: 4, defense: 3, technique: 5, range: 2 },
      relations: [
        { who: 'Ngô Nhất Nghị', rel: 'Cùng họ — nhưng Giang Mạnh không tin hắn' },
        { who: 'Phó Mộc Đăng', rel: 'Kẻ thù không đội trời chung' },
        { who: 'Phó Đặng Hoàng Anh', rel: 'Có thể thành đồng minh bất đắc dĩ' }
      ],
      events: [
        'Hồi V: Đoạn Nghĩa Đài — trận chiến cuối của tuyến truyện',
        'Quyết định của người chơi quyết định hắn là thù hay bạn'
      ],
      unlock: { type: 'stage', stage: 11, text: 'Hoàn thành Hồi V (Màn 11 — Đoạn Nghĩa Đài)' }
    },

    // =========================================================================
    // 3. THẺ CHỌN NHÂN VẬT (CHAR_SLOTS UI)
    // =========================================================================
    uiSlot: {
      id: 'giangmanh',
      slotName: 'NGÔ GIANG MẠNH',
      fullName: 'NGÔ GIANG MẠNH',
      title: 'CHỦ GIA TỘC HỌ NGÔ',
      tagline: 'Nhất kiếm tuyệt sát — Hàn băng tịch mịch',
      element: '❄️',
      color: '#38bdf8',
      image: 'assets/images/characters/char_giangmanh.png',
      vovinamImage: 'assets/images/characters/char_giangmanh_vovinam.png',
      bio: 'Chủ nhân bí ẩn của bóng tối họ Ngô. Ít di chuyển, không động tác thừa, nắm rõ từng thói quen của đối thủ để tung ra đòn phản công trừng phạt chí mạng.',
      stats: { power: 90, speed: 85, defense: 75, technique: 100 },
      skills: [
        { key: 'J / K', icon: '🗡️', name: 'Nhất Kiếm Tuyệt Sát', desc: 'Đòn kiếm chuẩn xác, không động tác thừa, trừng phạt sơ hở.' },
        { key: 'L', icon: '❄️', name: 'Thân Pháp Băng Bộ', desc: 'Né sidestep nhanh chóng rồi tức thì áp sát cự ly gần.' },
        { key: 'U+J / U+K', icon: '👁️', name: 'Bắt Bài Phản Công', desc: 'Trừng phạt combo lặp của đối thủ bằng đòn phản kích tê liệt.' },
        { key: 'W+U', icon: '❄️', name: 'Hàn Băng Kiếm Quyết', desc: 'Tỏa hàn khí khắc +1 tầng Đóng Băng địch (165px), hồi +12 Thể Lực và mở 0.8s cửa sổ Phản Đòn (CD 6s).' },
        { key: 'I', icon: '⚡', name: 'Vô Nhất Hàn Phong', desc: 'Tuyệt kỹ: kiếm khí băng hàn xé rách mọi tuyến phòng thủ.' }
      ],
      passives: [
        { icon: '🗡️', name: 'Nhất Kiếm Tuyệt Sát', type: 'BỊ ĐỘNG', desc: 'Sát thương phản đòn bạo kích (Counter) tăng thêm 260% (PvP: 185%), trừng phạt sơ hở của đối thủ.' },
        { icon: '❄️', name: 'Hàn Băng Tâm Pháp', type: 'BỊ ĐỘNG', desc: 'Mỗi đòn kiếm tích tụ 1 tầng hàn khí; đủ 4 tầng (PvP: 5 tầng) đóng băng 0.75s–1.4s và tạo miễn nhiễm băng.' },
        { icon: '👁️', name: 'Bắt Bài Phản Công', type: 'CHỦ ĐỘNG [U+J]', desc: 'Đón đỡ đòn cận chiến, tung nhát kiếm phản kích xuyên giáp +22 sát thương chuẩn.' },
        { icon: '🧊', name: 'Băng Thân Tuyệt Ảnh', type: 'BỊ ĐỘNG', desc: 'Né đòn hồi 10 thể lực; tạo luồng sương băng làm chậm kẻ địch 25%.' }
      ],
      mechanic: 'Trừng phạt combo lặp — Né ngang tiếp cận — Đòn chém chuẩn xác.',
      quote: '“Thói quen của ngươi chính là nhược điểm chí tử.”'
    },

    // =========================================================================
    // 4. CHỈ SỐ CHIẾN ĐẤU & SÁT THƯƠNG ĐÒN ĐÁNH
    // =========================================================================
    combat: {
      hp: 1040,
      speed: 245,
      runSpeed: 370,
      jumpForce: 510,
      damage: 1.10,
      reach: 1.04,
      knockback: 1.05,
      energyGain: 1,
      finisher: 'counter',
      ultimateState: 'ultimate_precision',
      ultimateType: 'precision',
      counterBonus: 2.6,
      counterWindow: 2.5,
      mechanic: 'Trừng phạt combo lặp + Perfect Counter mạnh hơn'
    },

    moveOverrides: {},

    finisher: {
      state: 'boss_riposte',
      dur: 0.55,
      lunge: 330,
      shake: false,
      attack: { damage: 125, offsetX: 64, offsetY: -84, width: 98, height: 62, knockback: 320, knockdown: true, weight: 'heavy', energyGain: 22 }
    },

    // =========================================================================
    // 5. NỘI TẠI THỰC CHIẾN (PASSIVES)
    // =========================================================================
    passives: {
      onApply(player) {
        player.counterBonus = 2.6;
        player.passive_nhatKiem = true;
        player.passive_hanBang = true;
        player.passive_batBai = true;
        player.passive_bangThan = true;
      },
      onDodge(player, ctx) {
        player.stamina = Math.min(player.maxStamina || 100, (player.stamina || 0) + 10);
        if (window.game && window.game.enemies) {
          let closest = null, bestDist = 220;
          window.game.enemies.forEach((e) => {
            if (!e.isDead) {
              const d = Math.hypot(e.x - player.x, e.y - player.y);
              if (d < 165) {
                e.speedMul = Math.min(e.speedMul || 1, 0.75);
                e.slowTimer = Math.max(e.slowTimer || 0, 1.8);
              }
              if (d < bestDist) {
                bestDist = d;
                closest = e;
              }
            }
          });
          if (closest && ctx) {
            ctx.dir = Math.sign(closest.x - player.x) || player.facing;
            ctx.dodgeSpeed = 400;
          }
        }
        if (window.effectManager) {
          window.effectManager.createShockRing(player.x, player.y, '#38bdf8');
          window.effectManager.addFloatingText('SƯƠNG BĂNG LÀM CHẬM 25%', player.x, player.y - 140, 'dodge');
        }
      },
      onHandCounter(defender, attacker, combatSystem) {
        if (!attacker || attacker.isDead) return;
        const pierceDmg = attacker.isRemotePlayer ? 22 : 30;
        attacker.hp = Math.max(0, attacker.hp - pierceDmg);
        if (attacker.hp <= 0) {
          attacker.isDead = true;
          attacker.isAttacking = false;
          if (typeof attacker.setState === 'function') attacker.setState('knockdown', 1.0);
        }
        if (attacker.isBoss) {
          attacker.poise = Math.max(0, (attacker.poise || 100) - 40);
        }
        applyFrostStacks(attacker, attacker.isRemotePlayer ? 1 : 2, combatSystem);
        if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText(`❄️ BẮT BÀI XUYÊN GIÁP (+${pierceDmg})!`, attacker.x, (attacker.y || 580) - 165, 'crit');
        }
      },
      onLegCounter(defender, attacker, combatSystem) {
        if (!attacker || attacker.isDead) return;
        const isPvpTarget = !!attacker.isRemotePlayer;
        const stacks = attacker._frostStacks || 0;
        if (isPvpTarget) {
          // PvP: chỉ đóng băng 0.75s khi mục tiêu đã tích >= 2 tầng Hàn Khí và không đang miễn nhiễm; tránh đóng băng tức thì từ 0 tầng
          const shatterDmg = stacks >= 2 ? stacks * 18 : 22;
          attacker.hp = Math.max(0, attacker.hp - shatterDmg);
          if (attacker.hp <= 0) {
            attacker.isDead = true;
            attacker.isAttacking = false;
            if (typeof attacker.setState === 'function') attacker.setState('knockdown', 1.0);
          }
          if (stacks >= 2 && (attacker._freezeImmunityUntil || 0) <= Date.now()) {
            attacker._frostStacks = 0;
            attacker.chillStacks = 0;
            attacker.frozenTimer = Math.max(attacker.frozenTimer || 0, 0.75);
            attacker._freezeImmunityUntil = Date.now() + 8000;
            if (combatSystem && typeof combatSystem.applyStun === 'function') {
              combatSystem.applyStun(attacker, true, 0.75, 25);
            } else {
              attacker.stunTimer = Math.max(attacker.stunTimer || 0, 0.75);
            }
          } else {
            applyFrostStacks(attacker, 2, combatSystem);
          }
          if (window.effectManager) {
            if (typeof window.effectManager.createIceShatterBurst === 'function') window.effectManager.createIceShatterBurst(attacker.x, (attacker.y || 580) - 60, 12);
            if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText(`🧊 TOÁI BĂNG (+${shatterDmg})!`, attacker.x, (attacker.y || 580) - 175, 'crit');
          }
          return;
        }
        const shatterDmg = stacks > 0 ? stacks * 30 : 35;
        attacker._frostStacks = 0;
        attacker.chillStacks = 0;
        attacker.hp = Math.max(0, attacker.hp - shatterDmg);
        if (attacker.hp <= 0) {
          attacker.isDead = true;
          attacker.isAttacking = false;
          if (typeof attacker.setState === 'function') attacker.setState('knockdown', 1.0);
        }
        attacker.frozenTimer = Math.max(attacker.frozenTimer || 0, 1.4);
        if (combatSystem && typeof combatSystem.applyStun === 'function') {
          combatSystem.applyStun(attacker, true, 1.4, 35);
        } else {
          attacker.stunTimer = Math.max(attacker.stunTimer || 0, 1.4);
        }
        if (window.effectManager) {
          if (typeof window.effectManager.createIceShatterBurst === 'function') window.effectManager.createIceShatterBurst(attacker.x, (attacker.y || 580) - 60, 14);
          if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText(`🧊 TOÁI BĂNG PHÁ CỐT (+${shatterDmg})!`, attacker.x, (attacker.y || 580) - 175, 'crit');
        }
      },
      onStanceSpecial(player, enemies) {
        const list = (window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : (Array.isArray(enemies) ? enemies : []);
        for (const e of list) {
          if (!e || e.isDead) continue;
          if (Math.hypot(e.x - player.x, e.y - player.y) <= 165) {
            applyFrostStacks(e, 1, window.combatSystem);
          }
        }
        player.stamina = Math.min(player.maxStamina || 100, (player.stamina || 0) + 12);
        if (window.combatSystem && !(window.onlineManager && window.onlineManager.isActive && window.onlineManager.mode === 'pvp')) {
          window.combatSystem.isCounterWindow = true;
          window.combatSystem.counterTimer = Math.max(window.combatSystem.counterTimer || 0, 0.8);
        }
        if (window.effectManager) {
          if (typeof window.effectManager.createFrostMandala === 'function') window.effectManager.createFrostMandala(player.x, (player.y || 580) - 55, 68, 0.42);
          if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText('❄️ HÀN BĂNG KIẾM QUYẾT!', player.x, (player.y || 580) - 175, 'dodge');
        }
        return true;
      },
      onDodgeFollowup(player, btn) {
        if (btn === 'K') {
          player.startAttack('kick_roundhouse', 0.56, 200);
          if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText('❄️ HÀN PHONG CƯỚC!', player.x, (player.y || 580) - 150, 'crit');
          }
          return true;
        }
        player.startAttack('punch_straight', 0.36, 225);
        if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText('🗡️ NHẤT KIẾM XUYÊN TÂM!', player.x, (player.y || 580) - 150, 'dodge');
        }
        return true;
      },
      onAttackHit(attacker, defender, attackData, combatSystem, hitCtx) {
        if (!defender || defender.type === 'player' || !combatSystem) return;
        const isPvpTarget = !!defender.isRemotePlayer;
        const addCount = isPvpTarget ? 1 : ((hitCtx && (hitCtx.isCrossCombo || hitCtx.effectiveMove === 'uppercut')) ? 2 : 1);
        applyFrostStacks(defender, addCount, combatSystem);
        if (hitCtx && hitCtx.effectiveMove === 'kick_sweep') {
          defender.speedMul = Math.min(defender.speedMul || 1, isPvpTarget ? 0.75 : 0.55);
          defender.slowTimer = Math.max(defender.slowTimer || 0, isPvpTarget ? 1.8 : 3.0);
        }
      }
    },

    // =========================================================================
    // 5b. HOẠT ẢNH ĐẶC TRƯNG 5 GIAI ĐOẠN (NGÔ GIANG MẠNH — HÀN BĂNG KIẾM PHÁP)
    // =========================================================================
    animation: {
      signatureStates: ['ultimate_precision'],
      trailProfile: {
        primary: '#7dd3fc',
        secondary: '#38bdf8',
        core: '#ffffff',
        width: 11,
        dual: false,
        dodgeGhost: 'rgba(125, 211, 252, 0.5)'
      },
      skillCatalog: [
        { id: 'punch_straight', input: 'J', name: 'Nhất Kiếm Điểm Tuyết', dur: 0.34, category: 'combo' },
        { id: 'punch_hook', input: 'J → J', name: 'Hoành Trảm Hàn Sương', dur: 0.42, category: 'combo' },
        { id: 'kick_push', input: 'K', name: 'Chấn Kiếm Khí Đẩy Lùi', dur: 0.52, category: 'combo' },
        { id: 'kick_roundhouse', input: 'K → K', name: 'Nguyệt Quang Trảm Pháp', dur: 0.60, category: 'combo' },
        { id: 'wk', input: 'W + K', name: 'Lăng Ba Ngự Phong Cước', dur: 0.52, category: 'special' },
        { id: 'uppercut', input: 'W + J', name: 'Băng Long Thăng Kiếm', dur: 0.52, category: 'special' },
        { id: 'elbow_strike', input: 'S + J', name: 'Đốc Kiếm Hộ Thân', dur: 0.46, category: 'special' },
        { id: 'kick_sweep', input: 'S + K', name: 'Hàn Phong Tảo Địa', dur: 0.66, category: 'special' },
        { id: 'hook_run', input: 'Shift + J', name: 'Tật Phong Đoạt Ảnh Kiếm', dur: 0.48, category: 'special' },
        { id: 'air_punch', input: 'Space + J', name: 'Thiên Sương Giáng Kiếm', dur: 0.38, category: 'aerial' },
        { id: 'flying_kick', input: 'Space + K', name: 'Phi Vân Trảm Băng', dur: 0.55, category: 'aerial' },
        { id: 'dodge', input: 'L', name: 'Lăng Ba Băng Bộ', dur: 0.28, category: 'defense' },
        { id: 'counter_hand_strike', input: 'U + J', name: 'Phản Đòn: Nhất Kiếm Phong Sương', dur: 0.42, category: 'counter' },
        { id: 'counter_leg_strike', input: 'U + K', name: 'Phản Đòn: Tảo Tuyết Hồi Kiếm', dur: 0.48, category: 'counter' },
        { id: 'boss_riposte', input: 'Finisher', name: 'Sương Kiếm Đoạt Hồn', dur: 0.55, category: 'finisher' },
        { id: 'ultimate_precision', input: 'I', name: 'Tuyệt Kỹ: Hàn Băng Tuyệt Sát', dur: 1.15, category: 'ultimate' }
      ],
      initPose(P) {
        P.grip = -0.18;
      },
      poses: {
        idle(P, { t }) {
          const b = Math.sin(t * 2.4);
          P.torso = 0.03 + 0.01 * b; P.head = -0.01;
          P.nT = 0.30 + 0.015 * b; P.nS = -0.34 - 0.015 * b;
          P.fT = -0.28 - 0.015 * b; P.fS = 0.06 + 0.015 * b;
          P.lift = Math.sin(t * 2.4) * 0.8;
          // Dáng Kiếm Thánh uy nghi: Hàn Băng Kiếm hạ chếch chéo phô diễn tay áo chuông & đạo bào, tay trái giữ kiếm quyết
          P.nA = 0.16 + 0.02 * b; P.nE = 0.62; P.grip = -0.26;
          P.fA = 0.30; P.fE = 1.62;
          return true;
        },
        punch_straight(P, { U, p }) {
          // Kiếm sĩ: Đâm thẳng Hàn Băng Kiếm gọn gàng, tay trái giữ kiếm quyết sau lưng
          const s = U.stage5(p, { a: 0.16, c: 0.34, i: 0.54, f: 0.78 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.65);
          P.torso = 0.06 - 0.10 * s.windup + 0.16 * ex;
          P.nA = U.lerp(0.28 - 0.55 * s.windup, 1.16, ex); P.nE = U.lerp(1.05, 0.04, ex);
          P.grip = U.lerp(-0.2, -0.58, ex);
          P.fA = U.lerp(-0.25, -0.75, ex); P.fE = 1.15;
          P.nT = 0.6 + 0.24 * ex; P.nS = -0.78; P.fT = -0.55; P.fS = 0.16;
          return true;
        },
        punch_hook(P, { U, p }) {
          // Chém ngang Hàn Băng Kiếm một nét sắc lẹm (Iaido slash)
          const s = U.stage5(p, { a: 0.20, c: 0.38, i: 0.58, f: 0.80 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.5 - s.recover * 0.68);
          P.torso = 0.06 - 0.18 * s.windup + 0.16 * ex;
          P.nA = U.lerp(1.18 * s.windup + 0.28 * (1 - s.windup), 1.14, ex);
          P.nE = U.lerp(0.92, 0.06, ex);
          P.grip = U.lerp(0.4, -0.88, ex);
          P.fA = -0.45; P.fE = 1.25;
          return true;
        },
        elbow_strike(P, { U, p }) {
          // Đốc Kiếm Hộ Thân: Thúc chỏ kèm đốc Hàn Băng Kiếm gọn gàng cự ly gần, tay sau kết ấn giữ trục
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.58, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.48 - s.recover * 0.68);
          P.torso = U.lerp(0.06 - 0.12 * s.windup, 0.14, ex);
          P.hx = -2 * s.windup + 4 * ex;
          P.nA = U.lerp(0.22 - 0.45 * s.windup, 1.26, ex);
          P.nE = U.lerp(0.95, -1.78, ex);
          P.grip = U.lerp(-0.20, 0.92, ex);
          P.fA = U.lerp(0.15, -0.68, ex); P.fE = 0.35;
          P.nT = 0.66; P.nS = -0.82; P.fT = -0.54; P.fS = 0.18;
          return true;
        },
        kick_push(P, { U, p }) {
          // Vung kiếm khí đẩy lùi kết hợp thế trụ vững vàng của Kiếm Sư
          const s = U.stage5(p, { a: 0.20, c: 0.40, i: 0.60, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.68);
          P.torso = 0.08 - 0.16 * s.windup + 0.22 * ex;
          P.nA = U.lerp(0.3 - 0.7 * s.windup, 1.62, ex); P.nE = 0.08;
          P.grip = U.lerp(-0.2, -0.78, ex);
          P.fA = 0.4; P.fE = 1.65;
          P.nT = 0.68; P.nS = -0.86; P.fT = -0.56; P.fS = 0.18;
          return true;
        },
        kick_roundhouse(P, { U, p }) {
          // Beat 3 Nguyệt Quang Trảm Pháp: Lướt chân bước hạc bay, vung Hàn Băng Kiếm chém vòng cung trăng khuyết
          const s = U.stage5(p, { a: 0.22, c: 0.42, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.5 - s.recover * 0.7);
          P.torso = U.lerp(0.08 - 0.22 * s.windup, -0.18, ex);
          P.lift = -6 * ex;
          P.nA = U.lerp(-0.52 * s.windup + 0.32 * (1 - s.windup), 0.78, ex);
          P.nE = 0.08; P.grip = U.lerp(0.35, -0.94, ex);
          P.fA = -0.58 * ex; P.fE = 1.25;
          P.nT = U.lerp(0.55, 1.48, ex); P.nS = U.lerp(-1.1, -0.02, ex);
          P.fT = -0.35; P.fS = 0.1;
          return true;
        },
        wk(P, { U, p }) {
          // W + K: Lăng Ba Ngự Phong Cước — lướt trên không ung dung tiên phong, kiếm vung mũi chỉ thiên thanh thoát, chưởng & cước đẩy nhẹ
          const s = U.stage5(p, { a: 0.18, c: 0.38, i: 0.60, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.44 - s.recover * 0.7);
          P.torso = U.lerp(0.04, -0.10, ex);
          P.lift = -10 * ex;
          P.nA = U.lerp(0.42, 0.92, ex); P.nE = 0.22; P.grip = U.lerp(-0.22, -1.18, ex);
          P.fA = U.lerp(0.35, 1.24, ex); P.fE = 0.14;
          P.nT = U.lerp(0.45, 1.48, ex); P.nS = U.lerp(-1.1, -0.02, ex); P.nF = 0.30 * ex;
          P.fT = -0.32; P.fS = 0.12;
          return true;
        },
        kick_sweep(P, { U, p }) {
          // S + K: Hàn Phong Tảo Địa — bậc Kiếm Sư đứng thẳng ung dung quét tà áo bào & đường kiếm ngang sát tuyết
          const s = U.stage5(p, { a: 0.20, c: 0.40, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.42 - s.recover * 0.72);
          P.lift = U.lerp(0, 8, ex);
          P.torso = U.lerp(0.02, 0.08, ex);
          P.nA = U.lerp(1.4 * s.windup + 0.3, 0.38, ex); P.nE = 0.12; P.grip = U.lerp(0.25, -0.92, ex);
          P.fA = U.lerp(0.34, -0.55, ex); P.fE = 1.45;
          P.nT = U.lerp(0.38, 1.08, ex); P.nS = U.lerp(-0.95, -0.02, ex);
          P.fT = U.lerp(-0.2, 0.32, ex); P.fS = U.lerp(0.06, -1.08, ex);
          return true;
        },
        uppercut(P, { U, p }) {
          // Băng Long Thăng Kiếm: Chém hất kiếm từ dưới lên trời
          const s = U.stage5(p, { a: 0.20, c: 0.40, i: 0.60, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.48 - s.recover * 0.7);
          P.torso = U.lerp(0.28 * s.windup + 0.08 * (1 - s.windup), -0.26, ex);
          P.lift = -8 * ex;
          P.nA = U.lerp(-0.55 * s.windup + 0.4 * (1 - s.windup), 2.55, ex);
          P.nE = 0.1; P.grip = U.lerp(-0.4, -0.68, ex);
          return true;
        },
        dodge(P, { U, p }) {
          // Lăng Ba Băng Bộ: Thân thẳng lướt nhẹ trên băng, tà áo lụa bay
          const w = U.beat(p, 0.04, 0.96, 0.36);
          P.torso = U.lerp(0.08, -0.16, w); P.lift = -4 * w;
          P.nA = U.lerp(0.42, -0.62, w); P.nE = 1.1; P.grip = -0.35;
          P.fA = U.lerp(-0.22, 1.05, w); P.fE = 1.35;
          P.nT = 0.5; P.nS = -0.58; P.fT = -0.65 * w - 0.45 * (1 - w); P.fS = 0.22;
          return true;
        },
        counter_hand_strike(P, { U, p }) {
          // Gạt thẳng Hàn Băng Kiếm đỡ đòn (0..0.22) -> Rút trảm Nhất Kiếm Phong Sương chớp nhoáng -> Thu kiếm bình thản
          const s = U.stage5(p, { a: 0.20, c: 0.38, i: 0.58, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.5 - s.recover * 0.7);
          P.torso = U.lerp(0.06 - 0.14 * s.windup, 0.20, ex);
          P.nA = U.lerp(1.02 * s.windup + 0.32 * (1 - s.windup), 1.14, ex);
          P.nE = U.lerp(0.65, 0.06, ex); P.grip = U.lerp(0.32, -0.88, ex);
          P.fA = U.lerp(0.85, -0.68, ex); P.fE = 1.25;
          P.nT = 0.65 + 0.24 * ex; P.nS = -0.82;
          return true;
        },
        counter_leg_strike(P, { U, p }) {
          const s = U.stage5(p, { a: 0.20, c: 0.40, i: 0.60, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.68);
          P.torso = 0.26 - 0.24 * ex;
          P.nA = U.lerp(0.3, 1.48, ex); P.nE = 0.1; P.grip = -0.86;
          P.nT = U.lerp(0.6, 1.25, ex); P.nS = U.lerp(-0.8, -0.1, ex);
          return true;
        },
        boss_riposte(P, { U, p }) {
          // Sương Kiếm Đoạt Hồn Finisher: Tra kiếm chờ hơi thở (0..0.24) -> Rút kiếm trảm ngang tia chớp (0.24..0.68) -> Hạ kiếm thu tay
          const s = U.stage5(p, { a: 0.24, c: 0.40, i: 0.64, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.52 - s.recover * 0.72);
          P.torso = U.lerp(0.14 - 0.22 * s.windup, 0.38, ex);
          P.hx = -5 * s.windup + 9 * ex;
          P.nA = U.lerp(-0.35 * s.windup + 0.4 * (1 - s.windup), 1.62, ex);
          P.nE = U.lerp(1.4, 0.05, ex); P.grip = U.lerp(0.15, -0.92, ex);
          P.fA = U.lerp(0.3, -0.65, ex); P.fE = 1.4;
          P.nT = 0.7 + 0.26 * ex; P.nS = -0.92;
          return true;
        },
        ultimate_precision(P, { U, p }) {
          // Hàn Băng Tuyệt Sát (5 giai đoạn Kiếm Sư — hoàn toàn thay thế kick_roundhouse!):
          // Stg 1 (0..0.20): Bắt Kiếm Quyết dựng Hàn Băng Kiếm thẳng đứng triệu hồi Trận Đồ Hàn Băng
          // Stg 2 (0.20..0.72): 3 Đường Kiếm Iaido chém chớp nhoáng xuyên không gian
          // Stg 3 (0.72..0.88): Bổ dọc Khai Thiên Phá Băng làm vỡ vụn Hoa Sen Tuyết
          // Stg 4-5 (0.88..1.0): Thu kiếm uy nghi, tà áo lụa rủ nhẹ
          if (p < 0.20) {
            const w = U.easeInOut(p / 0.20);
            P.torso = U.lerp(0.06, -0.08, w); P.head = -0.06;
            P.nA = U.lerp(0.32, 1.06, w); P.nE = U.lerp(0.95, 0.18, w);
            P.grip = U.lerp(-0.18, -1.25, w);
            P.fA = U.lerp(-0.22, 1.18, w); P.fE = U.lerp(1.25, 0.95, w);
            P.nT = 0.56; P.nS = -0.74; P.fT = -0.5; P.fS = 0.16;
            return true;
          }
          if (p < 0.72) {
            const u = (p - 0.20) / 0.52;
            const slashIdx = Math.floor(u * 3);
            const loc = (u * 3) % 1;
            const s = U.stage5(loc, { a: 0.18, c: 0.42, i: 0.68, f: 0.90 });
            const ex = Math.max(0, s.strike - s.recover * 0.5);
            if (slashIdx === 1) {
              // Đường kiếm ngược hất lên
              P.torso = U.lerp(0.18, -0.18, ex); P.lift = -8 * ex;
              P.nA = U.lerp(0.15, 1.32, ex); P.nE = 0.08; P.grip = U.lerp(-0.8, -0.35, ex);
            } else {
              // Đường kiếm thuận chém xé không gian
              P.torso = U.lerp(-0.10, 0.24, ex); P.hx = 5 * ex;
              P.nA = U.lerp(1.36, 0.85, ex); P.nE = 0.06; P.grip = U.lerp(0.2, -0.92, ex);
            }
            P.fA = -0.6; P.fE = 1.25;
            P.nT = 0.68; P.nS = -0.84; P.fT = -0.62; P.fS = 0.2;
            return true;
          }
          if (p < 0.88) {
            const cleave = U.easeOutBack(U.clamp((p - 0.72) / 0.12), 1.35);
            P.torso = U.lerp(-0.16, 0.28, cleave); P.hx = 7 * cleave;
            P.nA = U.lerp(1.42, 0.65, cleave); P.nE = 0.08;
            P.grip = U.lerp(0.35, -0.95, cleave);
            P.fA = -0.68; P.fE = 1.25;
            P.nT = 0.78; P.nS = -1.0; P.fT = -0.68; P.fS = 0.22;
            return true;
          }
          const rec = U.easeInOutQuart((p - 0.88) / 0.12);
          P.torso = U.lerp(0.28, 0.06, rec); P.hx = U.lerp(7, 0, rec);
          P.nA = U.lerp(0.65, 0.36, rec); P.nE = U.lerp(0.08, 0.95, rec);
          P.grip = U.lerp(-0.95, -0.18, rec);
          P.fA = U.lerp(-0.68, -0.22, rec); P.fE = U.lerp(1.25, 1.35, rec);
          P.nT = 0.54; P.nS = -0.7; P.fT = -0.48; P.fS = 0.15;
          return true;
        },
        boss_thrust(P, { U, p }) {
          // Nhất Kiếm Xuyên Tâm: Lao người đâm Hàn Băng Kiếm tầm ngực mở hoàn toàn khuôn mặt
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.58, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.46 - s.recover * 0.68);
          P.torso = U.lerp(0.06 - 0.12 * s.windup, 0.20, ex); P.head = -0.06 * ex;
          P.nA = U.lerp(0.28 - 0.52 * s.windup, 1.14, ex); P.nE = U.lerp(0.85, 0.04, ex);
          P.grip = U.lerp(-0.25, -0.76, ex);
          P.fA = U.lerp(0.2, -0.62, ex); P.fE = 1.15;
          P.nT = 0.68 + 0.28 * ex; P.nS = -0.92; P.fT = -0.60; P.fS = 0.18;
          return true;
        }
      },
      emitSkillVFX(e, st, prevP, p, fx) {
        const cross = (t) => prevP < t && p >= t;
        const dir = e.facing || 1;
        const gx = e.x || 0, gy = e.y || 580;
        if (st === 'dodge' && cross(0.06)) {
          fx.createFrostMandala(gx, gy - 12, 54, 0.36);
          fx.createIceShatterBurst(gx, gy - 35, 8);
        } else if (st === 'counter_hand_strike') {
          if (cross(0.06)) fx.createFrostMandala(gx + dir * 18, gy - 62, 64, 0.38);
          if (cross(0.36)) {
            fx.createDimensionalSlash(gx + dir * 55, gy - 64, -0.18 * dir, 175, '#7dd3fc');
            fx.createIceShatterBurst(gx + dir * 55, gy - 64, 12);
          }
        } else if (st === 'boss_riposte') {
          if (cross(0.08)) fx.createFrostMandala(gx, gy - 58, 72, 0.42);
          if (cross(0.40)) {
            fx.createDimensionalSlash(gx + dir * 58, gy - 62, 0.08 * dir, 210, '#e0f2fe');
            fx.createIceShatterBurst(gx + dir * 60, gy - 62, 16);
          }
        } else if (st === 'wk' && cross(0.32)) {
          fx.createFrostMandala(gx + dir * 24, gy - 54, 62, 0.36);
          fx.createSonicBoomCone(gx + dir * 40, gy - 58, dir, '#7dd3fc');
        } else if (st === 'kick_sweep' && cross(0.42)) {
          fx.createFrostMandala(gx + dir * 32, gy - 10, 68, 0.36);
          fx.createIceShatterBurst(gx + dir * 48, gy - 16, 9);
        } else if (st === 'punch_hook' || st === 'uppercut' || st === 'kick_roundhouse') {
          if (cross(0.36)) fx.createIceShatterBurst(gx + dir * 48, gy - 65, 8);
        } else if (st === 'ultimate_precision') {
          if (cross(0.06)) fx.createFrostMandala(gx, gy - 64, 108, 0.72);
          if (cross(0.36)) fx.createIceShatterBurst(gx + dir * 55, gy - 60, 12);
          if (cross(0.73)) {
            fx.createFrostMandala(gx + dir * 48, gy - 58, 128, 0.56);
            fx.createIceShatterBurst(gx + dir * 56, gy - 58, 22);
          }
        }
      }
    },

    // =========================================================================
    // 6. TUYỆT KỸ THỰC CHIẾN (ULTIMATE: HÀN BĂNG TUYỆT SÁT)
    // =========================================================================
    ultimateRuntime: {
      type: 'precision',
      cinematic: {
        title: 'NGÔ GIANG MẠNH',
        ult: 'HÀN BĂNG TUYỆT SÁT',
        color: '#38bdf8',
        accent: '#e0f2fe',
        style: 'ice',
        duration: 1.15
      },
      execute(player, st, dt, enemies, { p, hitEnemy }) {
        const step = Math.floor(p * 4);
        if (step > 0 && step <= 3 && step !== player._ultStep) {
          player._ultStep = step;
          let target = null, min = 460;
          for (const e of enemies) {
            if (e.isDead) continue;
            const d = Math.hypot(e.x - player.x, (e.y - player.y) * 1.4);
            if (d < min) { min = d; target = e; }
          }
          if (target) {
            if (window.effectManager) {
              window.effectManager.addGhostTrail(player, 'rgba(56, 189, 248, 0.8)');
              window.effectManager.createDimensionalSlash(target.x, target.y - 55, (step % 2 === 0 ? 0.38 : -0.38), 240, '#38bdf8');
              window.effectManager.createShockRing(target.x, target.y, '#38bdf8');
              window.effectManager.triggerFlash('#e0f2fe', 0.45);
            }
            const maxW = window.stageManager ? window.stageManager.stageWidth - 30 : 2570;
            player.x = Math.max(30, Math.min(maxW, target.x - player.facing * 62));
            player.y = target.y;
            hitEnemy(target, 165, 12, true);
            if (window.effectManager) window.effectManager.triggerScreenShake(11, 0.22);
          }
        }
        if (p >= 1) {
          if (window.effectManager) {
            window.effectManager.createUltimateBlast(player.x + player.facing * 40, player.y - 60, { primary: '#7dd3fc', secondary: '#ffffff', flash: '#e0f2fe' });
            window.effectManager.createIceShatterBurst(player.x + player.facing * 48, player.y - 60, 24);
            window.effectManager.createGroundCrack(player.x + player.facing * 40, player.y, 140, '#38bdf8');
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
        id: 'giangmanh',
        name: 'Ngô Giang Mạnh',
        title: 'Chủ Gia Tộc Họ Ngô',
        icon: '❄️',
        role: 'Hàn Băng & Phản Kích',
        roleColor: '#38bdf8',
        styleType: 'boss_giangmanh',
        speed: 210,
        dmg: 80,
        hp: 1200,
        quote: 'Thói quen của đối thủ chính là sơ hở lớn nhất.',
        activeSkill: {
          name: 'Hàn Phong Tuyệt Sát',
          cd: '4.5s',
          desc: 'Lướt tới vung kiếm băng làm đông cứng lính thường và làm chậm 30% bước tiến của Boss.'
        },
        passiveAura: {
          name: 'Hàn Băng Thần Uy',
          desc: 'Tăng +35% sát thương phản đòn bạo kích (Counter) cho người chơi.'
        },
        coopSkill: {
          name: 'Băng Huyết Đoạn Nghĩa',
          desc: 'Song kiếm hàn phong càn quét gây sát thương diện rộng và làm chậm kẻ địch.'
        }
      },
      coopBaseDamage: 270,
      onUpdate(ally, dt, player, enemies) {
        if (player) {
          player.allyCounterBuff = 1.30;
        }
        if (ally.specialTimer >= 4.5) {
          ally.specialTimer = 0;
          if (window.effectManager) {
            window.effectManager.createShockRing(ally.x, ally.y, '#38bdf8');
            window.effectManager.addFloatingText('HÀN PHONG QUẤY NHIỄU!', ally.x, ally.y - 150, 'freeze');
          }
          (enemies || []).forEach((e) => {
            if (!e.isDead && Math.hypot(e.x - ally.x, e.y - ally.y) < 280) {
              const isBossE = !!(e.isBoss || String(e.type || '').startsWith('boss_'));
              if (isBossE) {
                e.takeDamage(36, 0, false);
                if (e.allyCcImmunityTimer <= 0 || !e.allyCcImmunityTimer) {
                  e.speedMul = 0.80;
                  e.allyCcImmunityTimer = 4.5;
                }
              } else {
                e.frozenTimer = 2.0;
                e.speedMul = 0.5;
                e.takeDamage(60, 0, false);
                if (typeof e.setState === 'function') e.setState('hurt', 0.6);
              }
            }
          });
        }
      },
      onBasicAttack(ally, target, dmg, isBossTarget) {
        target.takeDamage(dmg, isBossTarget ? 0 : ally.facing * 6, false);
        if (window.audioManager) window.audioManager.playPunchHit();
        if (window.effectManager) {
          window.effectManager.createHitSparks(target.x, target.y - 70, 10, false);
          window.effectManager.addFloatingText('HÀN KIẾM!', target.x, target.y - 140, 'freeze');
        }
      }
    }
  });
})();

