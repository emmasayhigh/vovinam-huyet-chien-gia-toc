/**
 * NHÂN VẬT: PHÓ TIẾN ĐĂNG (ANH BA — TIÊN PHONG TÁC CHIẾN)
 * js/entities/characters/tiendang.js
 * Nguồn: Biên Niên Sử Gia Tộc Họ Phó: Huyết Chiến Đại Lục (Hồi 1, Hồi 5, Hồi 6, Vĩ Thanh)
 * Mở khóa: Chiêu mộ tại Bảo Điện Võ Sĩ (4.200 Vàng)
 */

(function () {
  function isNguTinhSkin(e) {
    if (!e) return false;
    if (e.equippedSkin === 'ngutinh' || e.styleType === 'tiendang_ngutinh') return true;
    if (window.CharacterRegistry && typeof window.CharacterRegistry.getEquippedSkin === 'function') {
      return window.CharacterRegistry.getEquippedSkin(e) === 'ngutinh';
    }
    return false;
  }

  function detonateMaMarks(attacker, defender, bonusDmg = 42, poiseBreak = 22) {
    if (!defender || defender.isDead) return;
    defender._maMarks = 0;
    defender.hp = Math.max(0, (defender.hp || 0) - bonusDmg);
    if (defender.isBoss && typeof defender.poise === 'number') {
      defender.poise = Math.max(0, defender.poise - poiseBreak);
      if (window.uiManager && typeof window.uiManager.updateBossPoise === 'function') {
        window.uiManager.updateBossPoise(defender.poise, defender.maxPoise || 100, defender.weakWindow || 0);
      }
    }
    if (defender.hp <= 0) {
      defender.isDead = true;
      defender.isAttacking = false;
      if (typeof defender.setState === 'function') defender.setState('knockdown', 1.0);
    }
    if (attacker && typeof attacker.addEnergy === 'function') {
      attacker.addEnergy(12);
    }
    if (attacker) {
      attacker._quantumShieldTimer = 3.5;
    }
    const fx = window.effectManager;
    if (fx) {
      const dy = (defender.y || 580) + (defender.z || 0);
      const dir = (attacker && attacker.facing) || 1;
      const isNT = isNguTinhSkin(attacker);
      if (isNT && typeof fx.createNguTinhCentipedeEruption === 'function') fx.createNguTinhCentipedeEruption(defender.x, defender.y || 580, dir);
      if (isNT && typeof fx.createNguTinhFangsBite === 'function') fx.createNguTinhFangsBite(defender.x, dy - 60, dir, 1.25);
      else if (typeof fx.createCyberHexBurst === 'function') fx.createCyberHexBurst(defender.x, dy - 60, dir, '#22d3ee');
      if (typeof fx.createShockRing === 'function') fx.createShockRing(defender.x, defender.y || 580, isNT ? '#fde047' : '#22d3ee');
      if (typeof fx.addFloatingText === 'function') fx.addFloatingText(isNT ? `🐟 NGƯ TINH THÔN PHỆ! (+${bonusDmg})` : `💎 THÂU TÓM M&A! (+${bonusDmg})`, defender.x, dy - 160, 'crit');
    }
  }

  function deployQuantumDecoy(player, anchorX, anchorY, dir) {
    const enemies = (window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : [];
    for (const e of enemies) {
      if (!e || e.isDead) continue;
      if (Math.hypot(e.x - anchorX, (e.y - anchorY) * 1.35) <= 185) {
        e._maMarks = Math.min(3, (e._maMarks || 0) + 1);
        e.speedMul = Math.min(e.speedMul || 1, 0.78);
        e.slowTimer = Math.max(e.slowTimer || 0, 0.8);
      }
    }
    if (typeof player.counterHandCooldown === 'number') {
      player.counterHandCooldown = Math.max(0, player.counterHandCooldown - 1.5);
    }
    if (typeof player.counterLegCooldown === 'number') {
      player.counterLegCooldown = Math.max(0, player.counterLegCooldown - 1.5);
    }
    const fx = window.effectManager;
    if (fx) {
      const isNT = isNguTinhSkin(player);
      if (isNT && typeof fx.createNguTinhTalismanSeal === 'function') fx.createNguTinhTalismanSeal(anchorX, anchorY, 62);
      else if (typeof fx.createQuantumLockOn === 'function') fx.createQuantumLockOn(anchorX, anchorY - 56, 56, 0.36);
      if (isNT && typeof fx.createNguTinhFangsBite === 'function') fx.createNguTinhFangsBite(anchorX, anchorY - 56, dir || 1, 0.95);
      else if (typeof fx.createCyberHexBurst === 'function') fx.createCyberHexBurst(anchorX, anchorY - 56, dir || 1, '#22d3ee');
      if (typeof fx.addGhostTrail === 'function') fx.addGhostTrail(player, isNT ? 'rgba(192, 132, 252, 0.58)' : 'rgba(34, 211, 238, 0.55)');
      if (typeof fx.addFloatingText === 'function') fx.addFloatingText(isNT ? '📜 BÙA CỔ NGƯ TINH!' : '⚡ TÀN ẢNH THẾ THÂN!', anchorX, anchorY - 145, 'dodge');
    }
  }

  window.CharacterRegistry.register({
    id: 'tiendang',
    uiSlotOrder: 8,

    // =========================================================================
    // 1. NGOẠI HÌNH & TRANG PHỤC (STYLE_DEFS)
    // =========================================================================
    appearance: {
      styleKey: 'boss_tiendang',
      style: {
        scale: 1.25,
        archetype: 'cyber_trench',
        rig: {
          shW: 12.6, waW: 8.6, hipW: 10.2, chestOut: 13.8,
          thighLen: 26, calfLen: 27, armUpper: 19, armFore: 18,
          spineH: 33.5, neckLen: 14.0, nShX: -5.2, nShY: -2.4, fShX: 5.2, fShY: -1.8,
          hipHalf: 4.0, footPad: 4, headScale: 0.81, limbBulk: 1.03, armBulk: 0.99
        },
        skin: '#f2ccb0',
        hair: '#0f172a',
        hairStyle: 'windswept',
        jawStyle: 'lean_angular',
        gi: '#1a2234',
        pants: '#131926',
        belt: '#94a3b8',
        aura: '#22d3ee',
        under: '#0f172a',
        tactical: true,
        cyberTrench: true,
        coat: true,
        coatColor: '#0e131e',
        coatTrim: '#d8e8f5',
        liningColor: '#0e7490',
        leatherBelt: true,
        leatherBeltColor: '#1e293b',
        quantumGauntlets: true,
        glowingEyes: '#22d3ee',
        shoes: 'cyber_boots',
        eyeColor: '#22d3ee'
      }
    },

    // =========================================================================
    // 2. HỒ SƠ CỐT TRUYỆN (ROSTER DOSSIER)
    // =========================================================================
    dossier: {
      id: 'tiendang',
      name: 'Phó Tiến Đăng',
      title: 'ANH BA — TIÊN PHONG TÁC CHIẾN',
      faction: 'phogia',
      styleType: 'boss_tiendang',
      portrait: 'boss_tiendang',
      playable: true,
      role: 'Anh Ba trong Tứ Trụ Hoàng Kim Họ Phó (sau Anh Cả Phó Mộc Đăng và Anh Hai Phó Văn Anh) — Bậc thầy thâu tóm M&A quốc tế, chuyên khai thác sơ hở đối thủ bằng nhịp phối chiêu biến hóa.',
      motive: 'Mở rộng bờ cõi đế chế họ Phó ra toàn cầu và nghiền nát mọi âm mưu gián điệp của Triệu gia. “Không chỉ là anh em mà là huyền thoại!”',
      fightingStyle: 'Đánh đổi sinh lực để tối ưu nhịp phối chiêu Lượng Tử: tích 3 tầng Hồ Sơ Sao Kê bằng các đòn khác nhau để kích nổ Thâu Tóm M&A, Dash-Cancel [L] cắt hồi đòn và Bẫy Ngược hồi chiêu.',
      strengths: 'Trần kỹ năng cực cao: càng phối hợp đa dạng chiêu thức càng nhanh kích nổ sát thương chuẩn, phá Poise Boss và mở Lá Chắn Thanh Khoản; phản đòn [U+J]/[U+K] hoàn hồi chiêu né.',
      weaknesses: 'Lượng máu cơ bản mỏng (980 HP) và không có giảm sát thương thường trực — nếu lặp 1 đòn liên tục hoặc bỏ lỡ nhịp né/phản đòn sẽ rất dễ bị áp lực ngược.',
      skills: [
        { name: 'Hồ Sơ Sao Kê (Mix-up)', desc: 'Phối hợp các chiêu khác nhau để khắc tối đa 3 tầng Sao Kê rồi kích nổ Thâu Tóm M&A (spam cùng 1 chiêu sẽ không tích tầng).' },
        { name: 'Lá Chắn Thanh Khoản', desc: 'Kích nổ Sao Kê hoặc phản đòn thành công tạo Lá Chắn Lượng Tử 3.5s, giảm 28% sát thương cho đòn kế tiếp và làm chậm kẻ đánh.' },
        { name: 'Tàn Ảnh Thế Thân [L]', desc: 'Lướt né (có thể Dash-Cancel khi đòn vừa trúng đích) để lại Bóng Tàn Ảnh khắc +1 Sao Kê và rút ngắn hồi chiêu Phản Đòn.' },
        { name: 'Quét Dữ Liệu Tây Hồ [W+U]', desc: 'Quét 220px khắc +1 tầng Sao Kê lên địch, xóa khóa trùng chiêu và hồi ngay +15 Thể Lực (CD 6s).' },
        { name: 'Nước Cờ Bẫy Ngược [U+J]', desc: 'Kích nổ trực tiếp Bẫy Ngược phá 28 Poise, mở sơ hở Boss, hồi Thể Lực và giảm 50% hồi chiêu Né [L].' }
      ],
      ultimate: { name: 'HUYỀN THOẠI THÂU TÓM M&A', desc: 'Tiên phong đột kích xuyên toàn màn hình, khóa chặt và nghiền nát mọi kẻ địch bằng bão xung kích Kim Cương.' },
      stats: { power: 4, speed: 5, defense: 2, technique: 5, range: 4 },
      relations: [
        { who: 'Phó Mộc Đăng', rel: 'Anh Cả / Chủ Gia Tộc Đời Thứ 4 — Thủ lĩnh tối cao của họ Phó, người định hướng đại cục cùng Tiến Đăng' },
        { who: 'Phó Văn Anh', rel: 'Anh Hai — Hậu phương thép vững chắc hỗ trợ mọi chiến dịch tiên phong của Tiến Đăng' },
        { who: 'Phó Đặng Hoàng Anh', rel: 'Anh họ đại ngàn — Người anh hùng Thập Vạn Đại Sơn mà Tiến Đăng đích thân lên núi nghênh đón' },
        { who: 'Triệu Hoàng Châu', rel: 'Điệp viên Triệu gia bị Tiến Đăng dắt mũi ngược và dùng hồ sơ sao kê vạch mặt tại Tây Hồ' }
      ],
      events: [
        'Hồi I: Thâu tóm cảng biển nước sâu Ninh Ba — Tuyên bố trước hội đồng cổ đông: “Không chỉ là anh em mà là huyền thoại!”',
        'Hồi V: Rạng sáng Thập Vạn Đại Sơn — Cùng Anh Cả Mộc Đăng và Anh Hai Văn Anh dẫn đoàn xe thiết giáp lên núi đón Phó Đặng Hoàng Anh',
        'Hồi VI: Nước Cờ Bẫy Ngược Tây Hồ — Đặt tập hồ sơ sao kê lên bàn vạch mặt điệp viên Triệu Hoàng Châu, biến tin giả thành mồi nhử chôn vùi Triệu Vinh Tâm',
        'Vĩ Thanh: Đại diện Gia tộc họ Phó bay sang châu Âu mở rộng liên minh hậu cần quốc tế'
      ],
      unlock: { type: 'shop', currency: 'gold', price: 4200, text: 'Chiêu mộ tại Cửa Hàng Gia Tộc (4.200 Vàng)' }
    },

    // =========================================================================
    // 3. THẺ CHỌN NHÂN VẬT (CHAR_SLOTS UI)
    // =========================================================================
    uiSlot: {
      id: 'tiendang',
      slotName: 'PHÓ TIẾN ĐĂNG',
      fullName: 'PHÓ TIẾN ĐĂNG',
      title: 'ANH BA — TIÊN PHONG TÁC CHIẾN',
      tagline: 'Biến chiêu tích ấn — Tàn ảnh thế thân — Bẫy ngược đoạt mệnh',
      element: '💎',
      color: '#38bdf8',
      image: 'assets/images/characters/char_tiendang.png',
      vovinamImage: 'assets/images/characters/char_tiendang_vovinam.png',
      shopUnlock: true,
      shopCurrency: 'gold',
      shopPrice: 4200,
      bio: 'Anh Ba trong Tứ Trụ Hoàng Kim của Gia tộc họ Phó. Mang bản lĩnh phong trần, sắc sảo và quyết đoán, Phó Tiến Đăng là bậc thầy thâu tóm M&A quốc tế, mũi nhọn tiên phong chuyên đè bẹp các tập đoàn thù địch trên bàn đàm phán lẫn chiến trường. Tại Trại cá Koi Tây Hồ, chính anh đã dùng tập hồ sơ sao kê vạch mặt điệp viên Triệu Hoàng Châu và biến tin giả của hắn thành mồi nhử chôn vùi Triệu Vinh Tâm.',
      stats: { power: 84, speed: 92, defense: 68, technique: 98 },
      skills: [
        { key: 'Mix-up', icon: '💎', name: 'Thâu Tóm M&A (3 Tầng)', desc: 'Đổi chiêu liên tục (J → W+J → K / S+K) để tích 3 tầng Sao Kê và kích nổ sát thương chuẩn + phá Poise.' },
        { key: 'L', icon: '⚡', name: 'Tàn Ảnh Thế Thân', desc: 'Lướt né (Dash-Cancel ngay khi trúng đòn), để lại Bóng Tàn Ảnh khắc +1 Sao Kê và rút ngắn hồi chiêu Phản Đòn.' },
        { key: 'U+J / U+K', icon: '📂', name: 'Nước Cờ Bẫy Ngược', desc: 'Phản đòn kích nổ Bẫy Ngược phá 28 Poise, hồi Thể Lực và hoàn 50% hồi chiêu Né [L].' },
        { key: 'W+U', icon: '💎', name: 'Quét Dữ Liệu Tây Hồ', desc: 'Quét vùng 220px khắc +1 tầng Sao Kê lên địch, xóa khóa trùng chiêu và hồi +15 Thể Lực (CD 6s).' },
        { key: 'I', icon: '🌌', name: 'Huyền Thoại Thâu Tóm M&A', desc: 'Tuyệt kỹ: Đột kích siêu thanh xuyên màn hình, kích nổ bão xung kích Kim Cương.' }
      ],
      passives: [
        { icon: '📂', name: 'Hồ Sơ Sao Kê', type: 'BỊ ĐỘNG', desc: 'Đánh trúng bằng chiêu KHÁC với chiêu vừa dùng trước đó khắc +1 tầng Sao Kê & hồi +4 Thể Lực. Đủ 3 tầng kích nổ +42 sát thương chuẩn, phá 22 Poise Boss và nạp +12 Năng Lượng.' },
        { icon: '🛡️', name: 'Lá Chắn Thanh Khoản', type: 'BỊ ĐỘNG', desc: 'Mỗi lần kích nổ M&A hoặc Phản Đòn thành công kích hoạt Lá Chắn Lượng Tử 3.5s: giảm 28% sát thương cho đòn đánh kế tiếp và làm chậm kẻ tấn công.' },
        { icon: '⚡', name: 'Tàn Ảnh Thế Thân', type: 'CHỦ ĐỘNG [L]', desc: 'Hỗ trợ Dash-Cancel ngay khi đòn vừa chạm đích; để lại Bóng Tàn Ảnh khắc +1 Sao Kê quanh vị trí cũ, làm chậm địch và giảm 1.5s hồi chiêu Phản Đòn.' },
        { icon: '💎', name: 'Nước Cờ Bẫy Ngược', type: 'CHỦ ĐỘNG [U+J]', desc: 'Phản đòn thành công lập tức kích nổ Bẫy Ngược gây +45 sát thương, phá 28 Poise, mở sơ hở Boss 1.6s, hồi +18 Thể Lực và hoàn 50% hồi chiêu Né [L].' }
      ],
      mechanic: 'Đổi chiêu tích ấn Sao Kê — Dash-Cancel [L] — Phản đòn hoàn hồi chiêu (High Skill Ceiling).',
      quote: '“Không chỉ là anh em mà là huyền thoại! Spam một chiêu sẽ bị đọc vị — muốn thâu tóm đối thủ thì phải biến hóa từng nhịp đánh.”'
    },

    // =========================================================================
    // 4. CHỈ SỐ CHIẾN ĐẤU & SÁT THƯƠNG ĐÒN ĐÁNH (CÂN BẰNG NGANG — HIGH SKILL)
    // =========================================================================
    combat: {
      hp: 980,
      speed: 248,
      runSpeed: 395,
      jumpForce: 535,
      damage: 1.08,
      reach: 1.06,
      knockback: 1.20,
      energyGain: 1.15,
      finisher: 'counter',
      ultimateState: 'ultimate_blink',
      ultimateType: 'blink',
      comboMax: 4,
      counterBonus: 2.15,
      mechanic: 'Tích 3 tầng Hồ Sơ Sao Kê qua chuỗi chiêu đa dạng + Dash-Cancel [L] + Bẫy ngược hồi chiêu'
    },

    moveOverrides: {
      punch_straight: { damage: 40, width: 64, knockback: 165, energyGain: 9 },
      kick_roundhouse: { damage: 88, width: 92, knockback: 460, knockdown: true, isKick: true, counterType: 'leg', energyGain: 18 },
      flying_kick: { damage: 118, width: 84, knockback: 540, knockdown: true, isKick: true, counterType: 'leg', energyGain: 20 }
    },

    // =========================================================================
    // 4b. HOẠT ẢNH ĐẶC TRƯNG 5 GIAI ĐOẠN (PHÓ TIẾN ĐĂNG — GĂNG LƯỢNG TỬ M&A)
    // =========================================================================
    animation: {
      signatureStates: ['ultimate_blink'],
      trailProfile: {
        primary: '#22d3ee',
        secondary: '#818cf8',
        core: '#e0f2fe',
        width: 11,
        dual: true,
        dodgeGhost: 'rgba(34, 211, 238, 0.55)'
      },
      skillCatalog: [
        { id: 'punch_straight', input: 'J', name: 'Đấm Xung Lượng Tử', dur: 0.34, category: 'combo' },
        { id: 'punch_hook', input: 'J → J', name: 'Chéo Găng Huyết Tốc', dur: 0.42, category: 'combo' },
        { id: 'kick_push', input: 'K', name: 'Đá Phản Lực Cyan', dur: 0.52, category: 'combo' },
        { id: 'kick_roundhouse', input: 'K → K', name: 'Cước Lưỡi Dao Số Hóa', dur: 0.60, category: 'combo' },
        { id: 'wk', input: 'W + K', name: 'Xung Kích Phản Lực Cyan', dur: 0.52, category: 'special' },
        { id: 'uppercut', input: 'W + J', name: 'Xung Chưởng Vượt Ngưỡng', dur: 0.52, category: 'special' },
        { id: 'elbow_strike', input: 'S + J', name: 'Phá Giáp Cận Tốc', dur: 0.46, category: 'special' },
        { id: 'kick_sweep', input: 'S + K', name: 'Trượt Lượng Tử Quét Trụ', dur: 0.66, category: 'special' },
        { id: 'hook_run', input: 'Shift + J', name: 'Thôn Tính Xung Kích', dur: 0.48, category: 'special' },
        { id: 'air_punch', input: 'Space + J', name: 'Rơi Tụ Lượng Tử', dur: 0.38, category: 'aerial' },
        { id: 'flying_kick', input: 'Space + K', name: 'Phi Cước Xung Kích', dur: 0.55, category: 'aerial' },
        { id: 'dodge', input: 'L', name: 'Tàn Ảnh Thế Thân', dur: 0.28, category: 'defense' },
        { id: 'counter_hand_strike', input: 'U + J', name: 'Phản Đòn: Xung Điện Phá Gân', dur: 0.42, category: 'counter' },
        { id: 'counter_leg_strike', input: 'U + K', name: 'Phản Đòn: Cắt Tần Số Hạ', dur: 0.48, category: 'counter' },
        { id: 'boss_riposte', input: 'Finisher', name: 'Thâu Tóm Đoạt Mệnh', dur: 0.56, category: 'finisher' },
        { id: 'ultimate_blink', input: 'I', name: 'Tuyệt Kỹ: Lượng Tử Dịch Chuyển', dur: 1.50, category: 'ultimate' }
      ],
      poses: {
        idle(P, { t }) {
          const b = Math.sin(t * 3.4);
          P.torso = 0.07 + 0.015 * b;
          P.head = -0.04 + 0.015 * b;
          P.hx = Math.sin(t * 1.7) * 0.7;
          P.lift = Math.sin(t * 3.4) * 1.0;
          P.nT = 0.44 + 0.02 * b; P.nS = -0.58 - 0.02 * b;
          P.fT = -0.40 - 0.02 * b; P.fS = 0.14 + 0.02 * b;
          // Dáng Cyber tấn rộng: tay trước mở găng lượng tử thấp, tay sau thủ cao ngang cằm lộ cổ trench viền bạc
          P.nA = 0.24 + 0.03 * b; P.nE = 1.32 + 0.02 * b;
          P.fA = 0.56 - 0.02 * b; P.fE = 1.92;
          return true;
        },
        punch_straight(P, { U, p }) {
          // Beat 1 Lượng Tử: Lao thân găm găng tay cyan thẳng tắp, tay sau gập phản lực chuẩn bị Beat 2
          const s = U.stage5(p, { a: 0.16, c: 0.34, i: 0.54, f: 0.78 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.65);
          P.torso = 0.18 - 0.14 * s.windup + 0.16 * ex;
          P.head = -0.10 * ex; P.hx = -3 * s.windup + 6 * ex;
          P.nA = U.lerp(0.42 - 0.72 * s.windup, 1.16, ex); P.nE = U.lerp(1.15, 0.04, ex);
          P.fA = U.lerp(0.35, -0.58, ex); P.fE = 0.42;
          P.nT = 0.74 + 0.2 * ex; P.nS = -0.82; P.fT = -0.7; P.fS = 0.2;
          return true;
        },
        punch_hook(P, { U, p }) {
          // Beat 2: Song găng tay lượng tử vung chéo X-cross công phá đồng bộ
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.56, f: 0.78 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.52 - s.recover * 0.65);
          P.torso = 0.16 - 0.16 * s.windup + 0.18 * ex;
          P.head = -0.08 * ex; P.hx = -4 * s.windup + 7 * ex;
          P.nA = U.lerp(-0.55 * s.windup + 0.18, 1.18, ex); P.nE = U.lerp(1.08, 0.16, ex);
          P.fA = U.lerp(-0.48 * s.windup - 0.18, 1.04, ex); P.fE = U.lerp(1.05, 0.22, ex);
          P.nT = 0.84; P.nS = -0.96; P.fT = -0.66; P.fS = 0.24;
          return true;
        },
        elbow_strike(P, { U, p }) {
          // Phá Giáp Cận Tốc: Gập găng tay lượng tử ép sát ngực, lao chúi dùng chỏ làm mũi khoan xung kích
          const s = U.stage5(p, { a: 0.16, c: 0.34, i: 0.56, f: 0.80 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.52 - s.recover * 0.68);
          P.torso = U.lerp(0.12, 0.36, ex);
          P.lift = -5 * ex;
          P.hx = -3 * s.windup + 7 * ex;
          P.nA = U.lerp(0.14 - 0.45 * s.windup, 1.18, ex);
          P.nE = U.lerp(0.95, -1.92, ex);
          P.fA = U.lerp(0.2, -0.78, ex); P.fE = 0.32;
          P.nT = 0.88; P.nS = -0.94; P.fT = -0.72; P.fS = 0.26;
          return true;
        },
        kick_roundhouse(P, { U, p }) {
          // Beat 3: Phản lực bật người bổ Cước Lưỡi Dao từ trên xuống, hai cánh tay xuôi sau như vây máy bay
          const s = U.stage5(p, { a: 0.18, c: 0.38, i: 0.58, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.5 - s.recover * 0.68);
          P.torso = U.lerp(0.28 * s.windup, -0.42, ex);
          P.head = 0.08 * ex;
          P.lift = 5 * s.windup - 11 * ex;
          P.nT = U.lerp(0.65, 2.12, ex); P.nS = U.lerp(-1.5, 0.04, ex); P.nF = 0.38 * ex;
          P.fT = -0.42; P.fS = 0.14;
          P.nA = -0.88 * ex; P.nE = 0.16;
          P.fA = -0.62 * ex; P.fE = 0.22;
          return true;
        },
        wk(P, { U, p }) {
          // W + K Xung Kích Phản Lực: Lao thân chúi về trước bắn gót piston, hai găng tay gập sau làm bộ đẩy
          const s = U.stage5(p, { a: 0.16, c: 0.36, i: 0.58, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.48 - s.recover * 0.68);
          P.torso = U.lerp(0.18, 0.36, ex);
          P.head = -0.18 * ex;
          P.lift = -8 * ex;
          P.nT = U.lerp(1.35 * s.windup + 0.5, 1.65, ex);
          P.nS = U.lerp(-1.85, -0.02, ex); P.nF = 0.35 * ex;
          P.fT = -0.68; P.fS = 0.28;
          P.nA = U.lerp(0.4, -0.92, ex); P.nE = 0.14;
          P.fA = U.lerp(0.2, -0.85, ex); P.fE = 0.18;
          return true;
        },
        kick_sweep(P, { U, p }) {
          // S + K Trượt Lượng Tử Cắt Gót: Ngả ngửa khí động học sát đất (ngược hoàn toàn W+K chúi tới), một tay lướt mặt sàn
          const s = U.stage5(p, { a: 0.18, c: 0.38, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.72);
          P.lift = U.lerp(5 * s.windup, 18, ex);
          P.torso = U.lerp(0.1, -0.30, ex);
          P.head = 0.18 * ex;
          P.nT = U.lerp(0.6, 1.24, ex); P.nS = U.lerp(-1.2, 0.02, ex); P.nF = -0.35 * ex;
          P.fT = U.lerp(-0.4, 0.46, ex); P.fS = U.lerp(0.15, -1.55, ex);
          P.nA = U.lerp(0.5, 1.05, ex); P.nE = 0.35;
          P.fA = U.lerp(0.2, -0.58, ex); P.fE = 0.12;
          return true;
        },
        dodge(P, { U, p }) {
          const w = U.beat(p, 0.02, 0.96, 0.35);
          P.torso = U.lerp(0.18, 0.62, w); P.head = -0.32 * w;
          P.lift = 7 * w; P.hx = 5 * w;
          P.nT = U.lerp(0.62, 1.05, w); P.nS = U.lerp(-0.82, -1.55, w);
          P.fT = -0.85 * w - 0.55 * (1 - w); P.fS = 0.35;
          P.nA = -0.75 * w + 0.6 * (1 - w); P.nE = 1.4;
          P.fA = -0.55 * w + 0.35 * (1 - w); P.fE = 1.6;
          return true;
        },
        counter_hand_strike(P, { U, p }) {
          // Chắn găng bắt khóa -> Đẩy song chưởng Xung Lượng Tử siêu thanh -> Hồi thế
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.58, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.48 - s.recover * 0.68);
          P.torso = U.lerp(0.14 - 0.16 * s.windup, 0.28, ex);
          P.hx = -4 * s.windup + 7 * ex;
          P.nA = U.lerp(0.55 - 0.72 * s.windup, 1.14, ex); P.nE = U.lerp(1.12, 0.05, ex);
          P.fA = U.lerp(0.55 - 0.62 * s.windup, 1.02, ex); P.fE = U.lerp(1.12, 0.06, ex);
          P.nT = 0.82 + 0.2 * ex; P.nS = -1.0; P.fT = -0.75; P.fS = 0.22;
          return true;
        },
        counter_leg_strike(P, { U, p }) {
          const s = U.stage5(p, { a: 0.18, c: 0.38, i: 0.58, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.68);
          P.torso = U.lerp(0.35, -0.35, ex);
          P.nT = U.lerp(0.9, 1.95, ex); P.nS = U.lerp(-1.4, -0.05, ex);
          P.fT = -0.55; P.fS = 0.2;
          P.nA = -0.65 * ex; P.nE = 1.4; P.fA = 1.2 * ex; P.fE = 1.2;
          return true;
        },
        flying_kick(P, { U, p }) {
          // Thôn Tính Thần Tốc: Khóa mục tiêu -> Bay gối/cước tên lửa -> Đáp gọn
          const prep = p < 0.14 ? U.easeInOut(p / 0.14) : 0;
          const fly = U.beat(p, 0.10, 0.82, 0.56);
          const rec = p > 0.78 ? U.easeInOutQuart((p - 0.78) / 0.22) : 0;
          P.torso = U.lerp(0.32 * prep - 0.48 * fly, 0.18, rec);
          P.head = 0.18 * fly; P.lift = 6 * prep - 12 * fly;
          P.nT = U.lerp(0.75, 1.78, fly); P.nS = U.lerp(-1.1, -0.08, fly);
          P.fT = -0.7 * fly - 0.55 * (1 - fly); P.fS = -0.55 * fly;
          P.nA = U.lerp(0.4, -0.85, fly); P.nE = 1.1;
          P.fA = U.lerp(0.4, 1.35, fly); P.fE = 0.45;
          return true;
        },
        boss_riposte(P, { U, p }) {
          // Thâu Tóm Đoạt Mệnh Finisher: Thu song găng lượng tử chéo ngực nạp xung -> Bước thọc mũi đao lượng tử tốc độ siêu thanh -> Thu thế
          const s = U.stage5(p, { a: 0.22, c: 0.38, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.50 - s.recover * 0.70);
          P.torso = U.lerp(0.10 - 0.16 * s.windup, 0.30, ex);
          P.head = -0.10 * ex;
          P.hx = -4 * s.windup + 8 * ex;
          P.nA = U.lerp(-0.45 * s.windup + 0.28 * (1 - s.windup), 1.38, ex);
          P.nE = U.lerp(1.65, 0.04, ex);
          P.fA = U.lerp(-0.35 * s.windup + 0.32 * (1 - s.windup), -0.78, ex);
          P.fE = U.lerp(1.72, 0.45, ex);
          P.nT = 0.78 + 0.22 * ex; P.nS = -0.94; P.fT = -0.66; P.fS = 0.22;
          return true;
        },
        ultimate_blink(P, { U, p }) {
          // 5 giai đoạn Lượng Tử Dịch Chuyển:
          // Stg 1 (0..0.16): Cúi người khóa mục tiêu + găng phát sáng
          // Stg 2 (0.16..0.72): 6 pha trảm cắt đa góc (cận cao, xiên ngang, vươn lên)
          // Stg 3 (0.72..0.86): Bật cao nện găng lượng tử thẳng xuống mặt đất
          // Stg 4-5 (0.86..1.0): Đứng thẳng gập áo trench recovery
          if (p < 0.16) {
            const w = U.easeInOut(p / 0.16);
            P.torso = U.lerp(0.14, 0.52, w); P.head = -0.25 * w; P.lift = 8 * w;
            P.nA = U.lerp(0.6, -0.75, w); P.nE = 1.65;
            P.fA = U.lerp(0.35, -0.55, w); P.fE = 1.75;
            P.nT = 0.95; P.nS = -1.42; P.fT = -0.75; P.fS = 0.35;
            return true;
          }
          if (p < 0.72) {
            const u = (p - 0.16) / 0.56;
            const cyc = u * Math.PI * 6;
            const a = Math.max(0, Math.sin(cyc)), b = Math.max(0, -Math.sin(cyc));
            P.torso = 0.44 + 0.14 * Math.sin(cyc * 0.5);
            P.head = -0.1; P.lift = -8 - 6 * Math.abs(Math.sin(cyc));
            P.nA = U.lerp(-0.2, 1.85, a); P.nE = U.lerp(1.5, 0.08, a);
            P.fA = U.lerp(-0.2, 1.85, b); P.fE = U.lerp(1.5, 0.08, b);
            P.nT = 0.92; P.nS = -0.55; P.fT = -0.88; P.fS = 0.28;
            return true;
          }
          if (p < 0.86) {
            const slam = U.easeOutBack(U.clamp((p - 0.72) / 0.11), 1.35);
            P.torso = U.lerp(-0.15, 0.56, slam); P.lift = U.lerp(-22, 9, slam);
            P.nA = U.lerp(2.4, 0.65, slam); P.nE = 0.12;
            P.fA = U.lerp(2.1, 0.45, slam); P.fE = 0.18;
            P.nT = 0.88; P.nS = -1.25; P.fT = -0.75; P.fS = 0.3;
            return true;
          }
          const rec = U.easeInOutQuart((p - 0.86) / 0.14);
          P.torso = U.lerp(0.56, 0.16, rec); P.lift = U.lerp(9, 0, rec);
          P.nA = U.lerp(0.65, 0.7, rec); P.nE = U.lerp(0.12, 1.8, rec);
          P.fA = U.lerp(0.45, 0.35, rec); P.fE = U.lerp(0.18, 1.95, rec);
          P.nT = U.lerp(0.88, 0.62, rec); P.nS = U.lerp(-1.25, -0.82, rec);
          P.fT = U.lerp(-0.75, -0.55, rec); P.fS = U.lerp(0.3, 0.15, rec);
          return true;
        }
      },
      emitSkillVFX(e, st, prevP, p, fx) {
        const cross = (t) => prevP < t && p >= t;
        const dir = e.facing || 1;
        const gx = e.x || 0, gy = e.y || 580, gz = e.z || 0;
        const isNT = isNguTinhSkin(e);
        if (st === 'dodge' && cross(0.06)) {
          if (isNT && typeof fx.createNguTinhTalismanSeal === 'function') {
            fx.createNguTinhTalismanSeal(gx, gy, 56);
          } else {
            fx.createQuantumLockOn(gx, gy - 55, 52, 0.3);
            fx.createCyberHexBurst(gx, gy - 55, dir, '#22d3ee');
          }
        } else if (st === 'counter_hand_strike') {
          if (cross(0.06)) {
            if (isNT && typeof fx.createNguTinhTalismanSeal === 'function') fx.createNguTinhTalismanSeal(gx + dir * 20, gy, 58);
            else fx.createQuantumLockOn(gx + dir * 20, gy - 62, 58, 0.34);
          }
          if (cross(0.36)) {
            if (isNT && typeof fx.createNguTinhFangsBite === 'function') fx.createNguTinhFangsBite(gx + dir * 52, gy - 64, dir, 1.2);
            else fx.createCyberHexBurst(gx + dir * 56, gy - 64, dir, '#22d3ee');
            if (!isNT) fx.createSonicBoomCone(gx + dir * 48, gy - 64, dir, '#818cf8');
          }
        } else if (st === 'flying_kick' && cross(0.22)) {
          if (isNT && typeof fx.createNguTinhFangsBite === 'function') fx.createNguTinhFangsBite(gx + dir * 40, gy + gz - 56, dir, 1.15);
          else {
            fx.createSonicBoomCone(gx + dir * 32, gy + gz - 56, dir, '#22d3ee');
            fx.createCyberHexBurst(gx + dir * 40, gy + gz - 56, dir, '#38bdf8');
          }
        } else if (st === 'boss_riposte') {
          if (cross(0.08)) {
            if (isNT && typeof fx.createNguTinhTalismanSeal === 'function') fx.createNguTinhTalismanSeal(gx + dir * 24, gy, 68);
            else fx.createQuantumLockOn(gx + dir * 24, gy - 62, 68, 0.40);
          }
          if (cross(0.38)) {
            if (isNT) {
              if (typeof fx.createNguTinhFangsBite === 'function') fx.createNguTinhFangsBite(gx + dir * 58, gy - 66, dir, 1.35);
              if (typeof fx.createNguTinhCentipedeEruption === 'function') fx.createNguTinhCentipedeEruption(gx + dir * 58, gy, dir);
            } else {
              fx.createSonicBoomCone(gx + dir * 52, gy - 66, dir, '#22d3ee');
              fx.createCyberHexBurst(gx + dir * 58, gy - 66, dir, '#818cf8');
            }
          }
        } else if (st === 'ultimate_blink') {
          if (cross(0.05)) {
            if (isNT && typeof fx.createNguTinhTalismanSeal === 'function') fx.createNguTinhTalismanSeal(gx, gy, 90);
            else fx.createQuantumLockOn(gx, gy - 62, 76, 0.45);
          }
          if (cross(0.73)) {
            if (isNT && typeof fx.createNguTinhCentipedeEruption === 'function') fx.createNguTinhCentipedeEruption(gx + dir * 20, gy, dir);
            else fx.createCyberHexBurst(gx + dir * 20, gy - 45, dir, '#818cf8');
            fx.createGroundCrack(gx + dir * 20, gy, 145, isNT ? '#fde047' : '#22d3ee');
          }
        } else if (st === 'wk') {
          if (cross(0.16)) {
            if (isNT && typeof fx.createNguTinhCentipedeEruption === 'function') fx.createNguTinhCentipedeEruption(gx + dir * 16, gy, dir);
            else fx.createCyberHexBurst(gx, gy - 44, dir, '#22d3ee');
          }
          if (cross(0.32)) {
            if (isNT && typeof fx.createNguTinhFangsBite === 'function') fx.createNguTinhFangsBite(gx + dir * 40, gy - 62, dir, 1.05);
            else fx.createSonicBoomCone(gx + dir * 40, gy - 62, dir, '#38bdf8');
          }
        } else if (st === 'kick_sweep' && cross(0.40)) {
          if (isNT && typeof fx.createNguTinhCentipedeEruption === 'function') fx.createNguTinhCentipedeEruption(gx + dir * 48, gy, dir);
          else fx.createCyberHexBurst(gx + dir * 48, gy - 14, dir, '#22d3ee');
          fx.createDust(gx + dir * 32, gy, 8, 36);
        } else if (cross(0.34) && (st === 'punch_hook' || st === 'uppercut' || st === 'hook_run' || st === 'kick_roundhouse')) {
          if (isNT && typeof fx.createNguTinhFangsBite === 'function') fx.createNguTinhFangsBite(gx + dir * 44, gy - 64, dir, 1.05);
          else fx.createCyberHexBurst(gx + dir * 44, gy - 64, dir, '#22d3ee');
        }
      }
    },

    finisher: {
      state: 'boss_riposte',
      dur: 0.56,
      lunge: 420,
      shake: true,
      attack: { damage: 128, offsetX: 72, offsetY: -78, width: 104, height: 64, knockback: 360, knockdown: true, weight: 'heavy', energyGain: 20, unblockable: true }
    },

    // =========================================================================
    // 5. NỘI TẠI THỰC CHIẾN (PASSIVES — SKILL-EXPRESSIVE M&A LOCK-ON)
    // =========================================================================
    passives: {
      onApply(player) {
        player.mechRiposte = false;
        player.passive_hoSoSaoKe = true;
        player.passive_laChanThanhKhoan = true;
        player.passive_tanAnhTheThan = true;
        player.passive_bayNguocTayHo = true;
        player._quantumShieldTimer = 0;
        player._lastMaMove = null;
      },
      onUpdate(player, dt) {
        if (player._quantumShieldTimer > 0) {
          player._quantumShieldTimer = Math.max(0, player._quantumShieldTimer - dt);
        }
      },
      onBeforeTakeDamage(player, ctx) {
        if (player._quantumShieldTimer > 0) {
          player._quantumShieldTimer = 0;
          ctx.amount = Math.round(ctx.amount * 0.72);
          const enemies = (window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : [];
          for (const e of enemies) {
            if (!e || e.isDead) continue;
            if (Math.hypot(e.x - player.x, (e.y - player.y) * 1.35) <= 155) {
              e.speedMul = Math.min(e.speedMul || 1, 0.7);
              e.slowTimer = Math.max(e.slowTimer || 0, 1.5);
            }
          }
          const fx = window.effectManager;
          if (fx) {
            const isNT = isNguTinhSkin(player);
            if (typeof fx.createShockRing === 'function') fx.createShockRing(player.x, player.y || 580, isNT ? '#c084fc' : '#22d3ee');
            if (typeof fx.addFloatingText === 'function') fx.addFloatingText(isNT ? '🛡️ THỦY LÂN HỘ THỂ (-28%)!' : '🛡️ LÁ CHẮN THANH KHOẢN (-28%)!', player.x, (player.y || 580) - 155, 'dodge');
          }
          return null;
        }
        return null;
      },
      onInputCancel(player, input) {
        const isAttackState = typeof player.state === 'string' && (
          player.state.startsWith('punch_') || player.state.startsWith('kick_') ||
          player.state === 'elbow_strike' || player.state === 'uppercut' ||
          player.state === 'hook_run' || player.state === 'boss_riposte'
        );
        const hasHit = player.hitTargets && player.hitTargets.size > 0;
        if ((input.isJustPressed('KeyL') || input.peek('KeyL')) && isAttackState && hasHit && player.dodgeCooldown <= 0) {
          input.consumeBufferedAction('KeyL');
          if (input.justPressed) input.justPressed['KeyL'] = false;
          player.dodgeCooldown = player.maxDodgeCooldown;
          const anchorX = player.x;
          const anchorY = player.y || 580;
          const mx = (input.moveRight ? 1 : 0) - (input.moveLeft ? 1 : 0);
          const dashDir = mx !== 0 ? mx : (player.facing || 1);
          deployQuantumDecoy(player, anchorX, anchorY, dashDir);
          player.vx = dashDir * 520;
          player.setState('dodge', 0.28);
          player.invincibleTimer = 0.18 * (player.dodgeIframeMul || 1);
          return true;
        }
        return false;
      },
      onDodge(player, ctx) {
        const anchorX = player.x;
        const anchorY = player.y || 580;
        const dir = (ctx && ctx.dir) || player.facing || 1;
        if (ctx) {
          ctx.dodgeSpeed = 520;
          ctx.dir = dir;
        }
        deployQuantumDecoy(player, anchorX, anchorY, dir);
      },
      onHandCounter(defender, attacker) {
        if (!attacker || attacker.isDead) return;
        detonateMaMarks(defender, attacker, 45, 28);
        attacker.stunTimer = Math.max(attacker.stunTimer || 0, 1.0);
        if (attacker.isBoss) {
          attacker.weakWindow = Math.max(attacker.weakWindow || 0, 1.6);
        }
        if (typeof defender.dodgeCooldown === 'number' && defender.dodgeCooldown > 0) {
          defender.dodgeCooldown = +(defender.dodgeCooldown * 0.5).toFixed(3);
        }
        defender.stamina = Math.min(defender.maxStamina || 100, (defender.stamina || 0) + 18);
        if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText(isNguTinhSkin(defender) ? '🐟 NGƯ TINH BẪY NGƯỢC! (-28 POISE)' : '📂 NƯỚC CỜ BẪY NGƯỢC! (-28 POISE)', attacker.x, (attacker.y || 580) - 175, 'crit');
        }
      },
      onLegCounter(defender, attacker) {
        if (typeof defender.addEnergy === 'function') defender.addEnergy(20);
        defender._quantumShieldTimer = 3.5;
        if (!attacker || attacker.isDead) return;
        attacker.speedMul = 0.35;
        attacker.slowTimer = Math.max(attacker.slowTimer || 0, 2.2);
        attacker._maMarks = Math.max(attacker._maMarks || 0, 2);
        if (window.effectManager) {
          const isNT = isNguTinhSkin(defender);
          if (isNT && typeof window.effectManager.createNguTinhCentipedeEruption === 'function') window.effectManager.createNguTinhCentipedeEruption(attacker.x, attacker.y || 580, defender.facing || 1);
          else if (typeof window.effectManager.createCyberHexBurst === 'function') window.effectManager.createCyberHexBurst(attacker.x, (attacker.y || 580) - 35, defender.facing || 1, '#22d3ee');
          if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText(isNT ? '📜 PHONG ẤN NGƯ TINH (SAO KÊ 2/3 / +20 NỘ)!' : '⚡ CẮT TẦN SỐ HẠ (SAO KÊ 2/3 / +20 NỘ)!', attacker.x, (attacker.y || 580) - 175, 'crit');
        }
      },
      onStanceSpecial(player, enemies) {
        const list = (window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : (Array.isArray(enemies) ? enemies : []);
        for (const e of list) {
          if (!e || e.isDead) continue;
          if (Math.hypot(e.x - player.x, e.y - player.y) <= 220) {
            e._maMarks = Math.min(3, (e._maMarks || 0) + 1);
          }
        }
        player._lastMaMove = null;
        player.stamina = Math.min(player.maxStamina || 100, (player.stamina || 0) + 15);
        if (window.effectManager) {
          const isNT = isNguTinhSkin(player);
          if (isNT) {
            if (typeof window.effectManager.createNguTinhTalismanSeal === 'function') window.effectManager.createNguTinhTalismanSeal(player.x, player.y || 580, 96);
            if (typeof window.effectManager.createNguTinhCentipedeEruption === 'function') window.effectManager.createNguTinhCentipedeEruption(player.x, player.y || 580, player.facing || 1);
          } else {
            if (typeof window.effectManager.createQuantumLockOn === 'function') window.effectManager.createQuantumLockOn(player.x, (player.y || 580) - 56, 84, 0.42);
            if (typeof window.effectManager.createCyberHexBurst === 'function') window.effectManager.createCyberHexBurst(player.x, (player.y || 580) - 56, player.facing || 1, '#38bdf8');
          }
          if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText(isNT ? '📜 BÙA TRIỆU ẤN NGƯ TINH (+1 SAO KÊ / +15 TL)!' : '💎 QUÉT DỮ LIỆU TÂY HỒ (+1 SAO KÊ / +15 TL)!', player.x, (player.y || 580) - 175, 'dodge');
        }
        return true;
      },
      onDodgeFollowup(player, btn) {
        const isNT = isNguTinhSkin(player);
        if (btn === 'K') {
          player.startAttack('kick_push', 0.48, 225);
          player._moveVariant = 'wk';
          if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText(isNT ? '🌊 VÂY TÍM XUNG KÍCH!' : '⚡ XUNG KÍCH PHẢN LỰC CYAN!', player.x, (player.y || 580) - 150, 'crit');
          }
          return true;
        }
        player.startAttack('hook_run', 0.44, 280);
        if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText(isNT ? '🐟 NGƯ TINH ĐỘT KÍCH!' : '💎 THÔN TÍNH XUNG KÍCH!', player.x, (player.y || 580) - 150, 'dodge');
        }
        return true;
      },
      onAttackHit(attacker, defender, attackData, combatSystem, hitCtx) {
        if (!defender || defender.isDead || defender.type === 'player') return;
        const moveKey = (hitCtx && hitCtx.effectiveMove) || (attacker._moveVariant === 'wk' ? 'wk' : (attacker.state || 'attack'));
        if (attacker._lastMaMove === moveKey) {
          if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
            const nowClock = attacker.attackClock || 0;
            if (nowClock - (attacker._maRepeatWarnAt || -99) > 1.2) {
              attacker._maRepeatWarnAt = nowClock;
              window.effectManager.addFloatingText('TRÙNG CHIÊU — ĐỔI ĐÒN TÍCH SAO KÊ!', attacker.x, (attacker.y || 580) - 165, 'stale');
            }
          }
          return;
        }
        const hadMarks = (defender._maMarks || 0) >= 1;
        attacker._lastMaMove = moveKey;
        attacker.stamina = Math.min(attacker.maxStamina || 100, (attacker.stamina || 0) + 4);
        if (hitCtx && hitCtx.isCrossCombo && typeof attacker.addEnergy === 'function') {
          attacker.addEnergy(10);
        }
        const nextMarks = (defender._maMarks || 0) + 1;
        if (nextMarks >= 3) {
          const isSuperSweep = (moveKey === 'kick_sweep' && (defender._maMarks || 0) >= 2);
          detonateMaMarks(attacker, defender, isSuperSweep ? 56 : 42, isSuperSweep ? 28 : 22);
        } else {
          defender._maMarks = nextMarks;
        }
        if (moveKey === 'wk' && hadMarks) {
          if (defender.isBoss && typeof defender.poise === 'number') {
            defender.poise = Math.max(0, defender.poise - 10);
          }
          if (typeof attacker.dodgeCooldown === 'number') {
            attacker.dodgeCooldown = Math.max(0, attacker.dodgeCooldown - 1.0);
          }
        }
      }
    },

    // =========================================================================
    // 6. TUYỆT KỸ THỰC CHIẾN (ULTIMATE: HUYỀN THOẠI THÂU TÓM M&A)
    // =========================================================================
    ultimateRuntime: {
      type: 'blink',
      cinematic: {
        title: 'PHÓ TIẾN ĐĂNG',
        ult: 'LƯỢNG TỬ DỊCH CHUYỂN',
        color: '#38bdf8',
        accent: '#818cf8',
        style: 'lightning',
        duration: 1.5
      },
      // Dịch chuyển tức thời liên tục ra sau lưng từng kẻ địch, trảm 6 nhát bằng găng lượng tử rồi nổ siêu tân tinh cyan
      execute(player, st, dt, enemies, { p, hitEnemy }) {
        const fx = window.effectManager;
        const isNT = isNguTinhSkin(player);
        player.vx = 0;
        const steps = Math.min(6, Math.floor(p * 6));
        while ((player._ultStep || 0) < steps && p < 1) {
          player._ultStep = (player._ultStep || 0) + 1;
          const alive = enemies.filter((e) => !e.isDead && Math.abs(e.x - player.x) < 760);
          if (!alive.length) break;
          alive.sort((a, b) => Math.abs(a.x - player.x) - Math.abs(b.x - player.x));
          const target = alive[(player._ultStep - 1) % alive.length];
          const side = (player._ultStep % 2) ? 1 : -1;
          if (fx) {
            fx.addGhostTrail(player, isNT ? 'rgba(253, 224, 71, 0.72)' : 'rgba(56, 189, 248, 0.8)');
            fx.createShockRing(player.x, player.y, isNT ? '#c084fc' : '#38bdf8');
          }
          player.x = target.x + side * 70;
          player.y = target.y;
          player.facing = -side;
          player.hitTargets.add(target.id);
          target.stunTimer = Math.max(target.stunTimer || 0, 0.35);
          hitEnemy(target, 42, 5, false);
          if (fx) {
            if (isNT) {
              // Rơi xuống 1 lần duy nhất ở nhịp đầu rồi chìm hẳn xuống lòng đất theo dõi mục tiêu suốt 6 nhịp!
              if (player._ultStep === 1 && !player._activeNguTinhUltFx && typeof fx.createNguTinhSkyDrop === 'function') {
                player._activeNguTinhUltFx = fx.createNguTinhSkyDrop(target.x, target.y, player.facing, 1.18, true);
                if (typeof fx.addFloatingText === 'function') {
                  fx.addFloatingText('🐟 NGƯ TINH GIÁNG THỔ — LẶN NGẦM!', player.x, player.y - 165, 'ultimate');
                }
              }
              if (player._activeNguTinhUltFx) {
                player._activeNguTinhUltFx.emergeX = target.x;
                player._activeNguTinhUltFx.emergeY = target.y;
                player._activeNguTinhUltFx.emergeDir = player.facing || 1;
              }
              if (typeof fx.createNguTinhFangsBite === 'function') fx.createNguTinhFangsBite(target.x, target.y - 68, player.facing, 1.15);
            } else {
              fx.createSonicBoomCone(player.x + player.facing * 30, player.y - 70, player.facing, '#38bdf8');
              fx.createShockRing(target.x, target.y, '#818cf8');
            }
            if (Array.isArray(fx.particles)) {
              for (let i = 0; i < 10; i++) {
                fx.particles.push({
                  x: target.x, y: target.y - 70, vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 6,
                  size: 2 + Math.random() * 2.5,
                  color: isNT ? (i % 3 === 0 ? '#fde047' : (i % 2 ? '#c084fc' : '#d97706')) : (i % 2 ? '#38bdf8' : '#e0f2fe'),
                  alpha: 1, life: 0.45, maxLife: 0.45, gravity: 0
                });
              }
            }
          }
        }
        if (p >= 1) {
          if (fx) {
            if (isNT) {
              // Kết thúc chiêu I: Ngư Tinh từ dưới lòng đất trồi lên CẮN MẠNH rồi bay thẳng lên trời biến mất!
              const ultFx = player._activeNguTinhUltFx;
              player._activeNguTinhUltFx = null;
              if (ultFx) {
                ultFx.emergeX = player.x;
                ultFx.emergeY = player.y || 580;
                ultFx.emergeDir = player.facing || 1;
                ultFx.emergeTriggered = true;
                ultFx.emergeStartT = ultFx.t || 0;
                ultFx.life = 0.95;
                ultFx.maxLife = 0.95;
              } else if (typeof fx.createNguTinhSkyDrop === 'function') {
                fx.createNguTinhSkyDrop(player.x, player.y || 580, player.facing, 1.2, false);
              }
              if (typeof fx.createNguTinhCentipedeEruption === 'function') {
                fx.createNguTinhCentipedeEruption(player.x + 48, player.y, 1);
                fx.createNguTinhCentipedeEruption(player.x - 48, player.y, -1);
              }
              fx.createUltimateBlast(player.x, player.y - 60, { primary: '#c084fc', secondary: '#fde047', flash: '#fae8ff' });
              fx.createShockRing(player.x, player.y, '#c084fc', 320);
              fx.createShockRing(player.x, player.y, '#fde047', 235);
            } else {
              fx.createUltimateBlast(player.x, player.y - 60, { primary: '#22d3ee', secondary: '#818cf8', flash: '#38bdf8' });
              fx.createCyberHexBurst(player.x, player.y - 60, player.facing, '#818cf8');
              fx.createShockRing(player.x, player.y, '#38bdf8');
            }
            fx.triggerScreenShake(22, 0.55);
          }
          for (const e of enemies) {
            if (!e.isDead && (Math.abs(e.x - player.x) < 260 || player.hitTargets.has(e.id))) {
              hitEnemy(e, 175, 18, true);
            }
          }
          player.hitTargets.clear();
          player.setState('idle');
        }
      }
    }
  });
})();