/**
 * NHÂN VẬT: PHÓ VĂN ANH (ANH HAI — HẬU PHƯƠNG THÉP)
 * js/entities/characters/vananh.js
 * Nguồn: Biên Niên Sử Gia Tộc Họ Phó: Huyết Chiến Đại Lục (Hồi 1, Hồi 5, Hồi 6, Vĩ Thanh)
 * Mở khóa: Mua tại Cửa Hàng Gia Tộc bằng 2.500 Vàng
 */

(function () {
  function isThuongLuongSkin(entity) {
    if (!entity) return false;
    if (entity.equippedSkin === 'thuongluong' || entity.thuongLuongSkin) return true;
    if (window.CharacterRegistry && typeof window.CharacterRegistry.getEquippedSkin === 'function') {
      return window.CharacterRegistry.getEquippedSkin(entity) === 'thuongluong';
    }
    return false;
  }

  function spawnThuongLuongWave(fx, x, y, dir = 1, count = 12, spread = 24) {
    if (!fx || !Array.isArray(fx.particles)) return;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 2.5 + Math.random() * 5.5;
      const col = i % 4 === 0 ? '#ef4444' : (i % 3 === 0 ? '#e0f2fe' : (i % 2 === 0 ? '#06b6d4' : '#0f766e'));
      fx.particles.push({
        x: x + (Math.random() - 0.5) * spread,
        y: y + (Math.random() - 0.5) * spread * 0.7,
        vx: Math.cos(a) * spd + dir * (1.8 + Math.random() * 2.5),
        vy: Math.sin(a) * spd - 1.6,
        size: 2.8 + Math.random() * 3.4,
        color: col,
        alpha: 0.95,
        life: 0.36 + Math.random() * 0.28,
        maxLife: 0.64,
        gravity: 0.16
      });
    }
  }

  window.CharacterRegistry.register({
    id: 'vananh',
    uiSlotOrder: 7,

    // =========================================================================
    // 1. NGOẠI HÌNH & TRANG PHỤC (STYLE_DEFS)
    // =========================================================================
    appearance: {
      styleKey: 'boss_vananh',
      style: {
        scale: 1.28,
        archetype: 'mafia_overcoat',
        rig: {
          shW: 13.4, waW: 9.4, hipW: 10.8, chestOut: 14.6,
          thighLen: 27, calfLen: 28, armUpper: 19.5, armFore: 18.5,
          spineH: 35, neckLen: 14.2, nShX: -5.6, nShY: -2.4, fShX: 5.6, fShY: -1.8,
          hipHalf: 4.3, footPad: 4, headScale: 0.82, limbBulk: 1.04, armBulk: 1.00
        },
        skin: '#edc29c',
        hair: '#121318',
        hairStyle: 'slicked',
        jawStyle: 'sharp',
        gi: '#6b1d2f',
        vestColor: '#6b1d2f',
        pants: '#4a1321',
        belt: '#f59e0b',
        aura: '#fbbf24',
        under: '#14161e',
        suit: true,
        drapedOvercoat: true,
        coat: true,
        coatColor: '#11131a',
        coatTrim: '#eab308',
        liningColor: '#7f1d1d',
        cigar: true,
        tieColor: '#d9a429',
        leatherBelt: true,
        leatherBeltColor: '#111827',
        gloves: '#18181b',
        shoes: 'dress',
        eyeColor: '#d97706',
        facialHair: 'stubble'
      }
    },

    // =========================================================================
    // 2. HỒ SƠ CỐT TRUYỆN (ROSTER DOSSIER)
    // =========================================================================
    dossier: {
      id: 'vananh',
      name: 'Phó Văn Anh',
      title: 'ANH HAI — HẬU PHƯƠNG THÉP',
      faction: 'phogia',
      styleType: 'boss_vananh',
      portrait: 'boss_vananh',
      playable: true,
      role: 'Anh Hai trong Tứ Trụ Hoàng Kim Họ Phó (sau Anh Cả Phó Mộc Đăng) — Nắm giữ kho vàng dự trữ, quân đoàn lính đánh thuê và tuyến vận tải ngầm xuyên lục địa.',
      motive: 'Bảo vệ Anh Cả Phó Mộc Đăng (Chủ gia tộc đời thứ 4) và đế chế Lục Gia Chủy khỏi mọi cuộc tập kích ngầm. “Mặt đất đầy bùn gai và máu me phía sau, đã có Văn Anh này gác súng.”',
      fightingStyle: 'Trọng quyền bọc găng da cốt thép kết hợp súng lục nén giảm thanh và lá chắn Hậu Phương Thép bất khả xâm phạm.',
      strengths: 'Sinh lực và phòng thủ cực cao, đòn thứ 4 bồi phát bắn giảm thanh phá Poise mạnh, phản đòn gây choáng và tự tạo giáp chắn.',
      weaknesses: 'Tốc độ di chuyển trung bình, thiên về thế trận vững chắc và phản công tầm trung hơn là lướt tốc độ cao.',
      skills: [
        { name: 'Thiết Quyền Habana', desc: 'Chuỗi trọng quyền bọc thép kèm tàn lửa xì gà Habana, đòn thứ 4 bồi phát đạn giảm thanh.' },
        { name: 'Bước Tiến Thiết Giáp', desc: 'Lướt né kèm khói Habana giảm sát thương và nạp đạn chí mạng cho đòn kế tiếp.' },
        { name: 'Gác Súng Phản Kích', desc: 'Đón đỡ đòn địch và rút súng lục nén giảm thanh bắn trả ngay lập tức.' },
        { name: 'Tụ Khí Nạp Đạn [W+U]', desc: 'Hồi +10 Thể Lực, bọc 0.8s Giáp Kim Cang Vàng và cường hóa đòn kế tiếp chắc chắn Chí Mạng (CD 6s).' },
        { name: 'Quân Đoàn Hậu Phương Thép', desc: 'Huy động hỏa lực quân đoàn lính đánh thuê và kho vàng họ Phó càn quét toàn màn hình.' }
      ],
      ultimate: { name: 'QUÂN ĐOÀN HẬU PHƯƠNG THÉP', desc: 'Huy động hỏa lực thiết giáp và bão đạn Hắc Kim nghiền nát toàn bộ chiến trường.' },
      stats: { power: 5, speed: 3, defense: 5, technique: 4, range: 4 },
      relations: [
        { who: 'Phó Mộc Đăng', rel: 'Anh Cả / Chủ Gia Tộc Đời Thứ 4 — Vị thủ lĩnh tối cao của đế chế họ Phó mà Anh Hai Văn Anh luôn gác súng bảo vệ hậu phương' },
        { who: 'Phó Tiến Đăng', rel: 'Em Ba — Tiên phong M&A quốc tế phối hợp ăn ý cùng hậu phương thép của Anh Hai Văn Anh' },
        { who: 'Đình Bích Lâm', rel: 'Bạn sinh tử — Cùng uống whisky, bàn manga cổ điển và đột kích động quỷ Ma Cao' },
        { who: 'Hứa Vũ Đại', rel: 'Kẻ trộm cắp bẩn thỉu bị Văn Anh gí súng giảm thanh vào trán tại hầm ngầm Ma Cao' }
      ],
      events: [
        'Hồi I: Tầng 88 Tháp Tài Chính Lục Gia Chủy — Thống lĩnh kho vàng dự trữ và quân đoàn đánh thuê hộ vệ Anh Cả Phó Mộc Đăng',
        'Hồi V: Rạng sáng Thập Vạn Đại Sơn — Cùng Anh Cả Mộc Đăng và Em Ba Tiến Đăng dẫn đoàn xe thiết giáp lên núi nghênh đón Phó Đặng Hoàng Anh',
        'Hồi VI: Đột Kích Động Quỷ Ma Cao — Cùng Đình Bích Lâm bắt sống Triệu Đại Lực và gí súng giảm thanh vào trán Hứa Vũ Đại'
      ],
      unlock: { type: 'shop', currency: 'gold', price: 2500, text: 'Mua tại Cửa Hàng Gia Tộc (2.500 Vàng)' }
    },

    // =========================================================================
    // 3. THẺ CHỌN NHÂN VẬT (CHAR_SLOTS UI)
    // =========================================================================
    uiSlot: {
      id: 'vananh',
      slotName: 'PHÓ VĂN ANH',
      fullName: 'PHÓ VĂN ANH',
      title: 'ANH HAI — HẬU PHƯƠNG THÉP',
      tagline: 'Kho vàng dự trữ — Quân đoàn thiết giáp — Hậu phương thép',
      element: '🪙',
      color: '#f59e0b',
      image: 'assets/images/characters/char_vananh.png',
      vovinamImage: 'assets/images/characters/char_vananh_vovinam.png',
      shopUnlock: true,
      shopCurrency: 'gold',
      shopPrice: 2500,
      bio: 'Anh Hai của Gia tộc họ Phó (em kế sau Anh Cả Phó Mộc Đăng) tại đế chế Lục Gia Chủy. Trầm ổn bên điếu xì gà Habana và ly whisky khói, Phó Văn Anh nắm giữ toàn bộ kho vàng dự trữ, quân đoàn lính đánh thuê và tuyến vận tải ngầm xuyên lục địa. Tại hầm máy chủ Ma Cao, chính anh cùng bạn sinh tử Đình Bích Lâm đã gí súng lục giảm thanh thẳng vào trán Hứa Vũ Đại.',
      stats: { power: 84, speed: 74, defense: 82, technique: 82 },
      skills: [
        { key: 'J / K', icon: '🪙', name: 'Thiết Quyền Habana', desc: 'Trọng quyền găng da cốt thép, đòn kết thúc bồi phát đạn giảm thanh.' },
        { key: 'L', icon: '💨', name: 'Khói Xì Gà Habana', desc: 'Lướt chiến thuật trong làn khói Habana né đòn linh hoạt.' },
        { key: 'U+J / U+K', icon: '🔫', name: 'Gác Súng Phản Kích', desc: 'Gạt đòn và rút súng lục nén giảm thanh gí trán bắn choáng kẻ địch.' },
        { key: 'W+U', icon: '🥃', name: 'Tụ Khí Nạp Đạn', desc: 'Hồi +10 Thể Lực, bật 0.8s Giáp Kim Cang Vàng và cường hóa đòn kế 100% Chí Mạng (CD 6s).' },
        { key: 'I', icon: '🔥', name: 'Quân Đoàn Hậu Phương Thép', desc: 'Tuyệt kỹ: Đoàn xe thiết giáp và mưa đạn Hắc Kim càn quét toàn chiến trường.' }
      ],
      passives: [
        { icon: '🪙', name: 'Kho Vàng Dự Trữ', type: 'BỊ ĐỘNG', desc: 'Nắm giữ kho vàng họ Phó: Tăng 6% sát thương quyền cước và giảm 8% sát thương nhận vào.' },
        { icon: '🥃', name: 'Khói Habana & Whisky', type: 'BỊ ĐỘNG', desc: 'Khi HP xuống dưới 35%, tự động kích hoạt Giáp Hậu Phương Thép (3 tầng) và hồi 8% HP một lần mỗi trận.' },
        { icon: '💨', name: 'Bước Tiến Thiết Giáp', type: 'CHỦ ĐỘNG [L]', desc: 'Lướt né phủ khói Habana tốc độ cao kèm tàn ảnh chiến thuật.' },
        { icon: '🔫', name: 'Phát Bắn Giảm Thanh', type: 'CHỦ ĐỘNG [U+J]', desc: 'Phản đòn tay thành công lập tức nổ súng lục giảm thanh gây 34 ST và phá 14 Poise.' }
      ],
      mechanic: 'Đấu sĩ cân bằng — Giáp Hậu Phương Thép (<35% HP) — Súng lục giảm thanh.',
      quote: '“Anh cả Mộc Đăng cứ việc điều khiển dòng tiền thế giới. Mặt đất đầy bùn gai và máu me phía sau, đã có Văn Anh này gác súng.”'
    },

    // =========================================================================
    // 4. CHỈ SỐ CHIẾN ĐẤU & SÁT THƯƠNG ĐÒN ĐÁNH
    // =========================================================================
    combat: {
      hp: 1080,
      speed: 220,
      runSpeed: 355,
      jumpForce: 510,
      damage: 1.04,
      reach: 1.05,
      knockback: 1.15,
      energyGain: 1.05,
      finisher: 'bash',
      ultimateState: 'ultimate_barrage',
      ultimateType: 'barrage',
      comboMax: 4,
      mechanic: 'Giáp Hậu Phương Thép + Phát bắn giảm thanh phá Poise + Trọng quyền Hắc Kim'
    },

    moveOverrides: {
      punch_straight: { damage: 36, width: 64, knockback: 165, energyGain: 9 },
      punch_hook: { damage: 48, width: 70, knockback: 220, energyGain: 12 },
      uppercut: { damage: 68, width: 66, knockback: 270, knockdown: true, weight: 'heavy', energyGain: 15 }
    },

    // =========================================================================
    // 4b. HOẠT ẢNH ĐẶC TRƯNG 5 GIAI ĐOẠN (PHÓ VĂN ANH — MAFIA HẮC KIM & XÌ GÀ)
    // =========================================================================
    animation: {
      signatureStates: ['ultimate_barrage'],
      trailProfile: {
        primary: '#f59e0b',
        secondary: '#dc2626',
        core: '#fef08a',
        width: 11,
        dual: false,
        dodgeGhost: 'rgba(245, 158, 11, 0.45)'
      },
      skillCatalog: [
        { id: 'punch_straight', input: 'J', name: 'Thụi Nắm Đấm Thép', dur: 0.34, category: 'combo' },
        { id: 'punch_hook', input: 'J → J', name: 'Quất Báng Súng Hắc Kim', dur: 0.42, category: 'combo' },
        { id: 'kick_push', input: 'K', name: 'Đá Đạp Bành Trướng', dur: 0.52, category: 'combo' },
        { id: 'kick_roundhouse', input: 'K → K', name: 'Vòng Cước Đế Đô', dur: 0.60, category: 'combo' },
        { id: 'wk', input: 'W + K', name: 'Ủng Thân Khẳng Định Đế Đô', dur: 0.52, category: 'special' },
        { id: 'uppercut', input: 'W + J', name: 'Móc Cằm Habana', dur: 0.52, category: 'special' },
        { id: 'elbow_strike', input: 'S + J', name: 'Thúc Chỏ Áo Măng-Tô', dur: 0.46, category: 'special' },
        { id: 'kick_sweep', input: 'S + K', name: 'Quét Giò Sạt Gầm', dur: 0.66, category: 'special' },
        { id: 'hook_run', input: 'Shift + J', name: 'Húc Vai Băng Đảng', dur: 0.48, category: 'special' },
        { id: 'air_punch', input: 'Space + J', name: 'Bắn Đạn Không Trung', dur: 0.38, category: 'aerial' },
        { id: 'flying_kick', input: 'Space + K', name: 'Phi Cước Áo Choàng', dur: 0.55, category: 'aerial' },
        { id: 'dodge', input: 'L', name: 'Lướt Măng-Tô Hạ Bộ', dur: 0.28, category: 'defense' },
        { id: 'counter_hand_strike', input: 'U + J', name: 'Phản Đòn: Gí Súng Giảm Thanh', dur: 0.42, category: 'counter' },
        { id: 'counter_leg_strike', input: 'U + K', name: 'Phản Đòn: Đá Gãy Trụ', dur: 0.48, category: 'counter' },
        { id: 'boss_bash', input: 'Finisher', name: 'Thiết Quyền Habana', dur: 0.68, category: 'finisher' },
        { id: 'ultimate_barrage', input: 'I', name: 'Tuyệt Kỹ: Bão Đạn Hắc Kim', dur: 1.50, category: 'ultimate' }
      ],
      poses: {
        idle(P, { t }) {
          const b = Math.sin(t * 2.6);
          P.torso = 0.02 + 0.01 * b;
          P.head = -0.01 + 0.01 * b;
          P.hx = Math.sin(t * 1.3) * 0.6;
          P.lift = Math.sin(t * 2.6) * 0.9;
          P.nT = 0.22 + 0.02 * b; P.nS = -0.26 - 0.02 * b;
          P.fT = -0.20 - 0.02 * b; P.fS = 0.04 + 0.02 * b;
          // Dáng đứng thẳng kiêu bạc: tay phải nâng xì gà thư thái cạnh ngực, tay trái giữ súng bên đùi mở rộng ngực áo gile thêu vàng
          P.nA = 0.12 + 0.03 * b; P.nE = 1.66 + 0.02 * b;
          P.fA = -0.18; P.fE = 0.34;
          return true;
        },
        punch_straight(P, { U, p }) {
          // Beat 1 Đế Vương Hắc Kim: Đứng vững thọc nắm đấm thép lạnh lùng, tay xì gà giữ nguyên uy thế
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.55, f: 0.78 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.65);
          P.torso = 0.04 - 0.10 * s.windup + 0.18 * ex;
          P.head = -0.02; P.hx = -3 * s.windup + 7 * ex;
          P.nA = U.lerp(0.32 - 0.72 * s.windup, 1.54, ex); P.nE = U.lerp(1.86, 0.06, ex);
          P.fA = 0.24; P.fE = 2.04;
          P.nT = 0.54 + 0.22 * ex; P.nS = -0.66; P.fT = -0.56; P.fS = 0.16;
          return true;
        },
        punch_hook(P, { U, p }) {
          // Beat 2: Tiếp nối độ xoay Beat 1 quất báng súng hắc kim ngang cực nặng
          const s = U.stage5(p, { a: 0.22, c: 0.40, i: 0.58, f: 0.80 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.5 - s.recover * 0.65);
          P.torso = 0.08 - 0.16 * s.windup + 0.16 * ex;
          P.hx = -4 * s.windup + 6 * ex;
          P.nA = U.lerp(0.25 - 0.85 * s.windup, 1.22, ex); P.nE = U.lerp(1.15, 0.22, ex);
          P.grip = U.lerp(0.35, -0.52, ex);
          P.fA = 0.24; P.fE = 1.35;
          P.nT = 0.62 + 0.22 * ex; P.nS = -0.78; P.fT = -0.6; P.fS = 0.18;
          return true;
        },
        elbow_strike(P, { U, p }) {
          // S+J Thúc Chỏ Áo Măng-Tô: Áp sát ghì cẳng tay thúc chỏ ngang hông, tay xì gà vẫn điềm tĩnh
          const s = U.stage5(p, { a: 0.20, c: 0.38, i: 0.60, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.48 - s.recover * 0.68);
          P.torso = U.lerp(0.06 - 0.12 * s.windup, 0.16, ex);
          P.hx = -3 * s.windup + 5 * ex;
          P.nA = U.lerp(0.18 - 0.45 * s.windup, 1.26, ex);
          P.nE = U.lerp(1.05, -1.86, ex);
          P.grip = U.lerp(0.35, -0.42, ex);
          P.fA = 0.22; P.fE = 1.32;
          P.nT = 0.66 + 0.16 * ex; P.nS = -0.80; P.fT = -0.58; P.fS = 0.18;
          return true;
        },
        kick_roundhouse(P, { U, p }) {
          // Beat 3 Mafia Bố Già: Giữ thân trên kiêu bạc thẳng tắp, tung cước giày tây sắc lẹm tạt áo măng-tô
          const s = U.stage5(p, { a: 0.20, c: 0.42, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.46 - s.recover * 0.68);
          P.torso = U.lerp(0.06, -0.26, ex);
          P.head = 0.04 * ex;
          P.nT = U.lerp(0.55, 1.74, ex); P.nS = U.lerp(-1.25, 0.02, ex); P.nF = -0.35 * ex;
          P.fT = -0.36; P.fS = 0.08;
          P.nA = U.lerp(0.35, -0.32, ex); P.nE = 1.32;
          P.fA = 0.34; P.fE = 1.88;
          return true;
        },
        wk(P, { U, p }) {
          // W + K: Ủng Thân Khẳng Định Đế Đô — bước tiến nặng đạp thẳng đế giày vào ngực, tay xì gà vẫn điềm tĩnh
          const s = U.stage5(p, { a: 0.20, c: 0.40, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.68);
          P.torso = U.lerp(-0.08 * s.windup, 0.22, ex);
          P.lift = 3 * s.windup - 5 * ex;
          P.hx = -3 * s.windup + 8 * ex;
          P.nT = U.lerp(0.65, 1.46, ex); P.nS = U.lerp(-1.4, -0.02, ex); P.nF = 0.36 * ex;
          P.fT = -0.45; P.fS = 0.14;
          P.nA = U.lerp(0.4, -0.48, ex); P.nE = 0.92;
          P.fA = U.lerp(0.28, 0.56, ex); P.fE = 1.72;
          return true;
        },
        kick_sweep(P, { U, p }) {
          // S + K Bố Già Quét Gót: Tuyệt đối không ngồi bệt kiểu trẻ con! Thân vẫn đứng kiêu ngạo, quét giày thấp dọn đường
          const s = U.stage5(p, { a: 0.20, c: 0.42, i: 0.64, f: 0.86 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.7);
          P.lift = U.lerp(0, 9, ex);
          P.torso = U.lerp(0.04, 0.14, ex);
          P.head = -0.04;
          P.nT = U.lerp(0.45, 1.12, ex); P.nS = U.lerp(-1.15, -0.02, ex); P.nF = -0.25 * ex;
          P.fT = U.lerp(-0.25, 0.34, ex); P.fS = U.lerp(0.06, -1.16, ex);
          P.nA = U.lerp(0.3, -0.42, ex); P.nE = 0.65;
          P.fA = U.lerp(0.24, 0.86, ex); P.fE = 1.94;
          return true;
        },
        air_punch(P, { U, p }) {
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.60, f: 0.82 });
          const aim = Math.max(0, s.strike - s.recover * 0.6);
          P.torso = 0.12 - 0.18 * aim;
          P.nA = U.lerp(0.4, 1.15, aim); P.nE = 0.08;
          P.fA = 0.25; P.fE = 1.9;
          P.nT = 0.55; P.nS = -0.9; P.fT = -0.35; P.fS = -0.25;
          return true;
        },
        dodge(P, { U, p }) {
          // Lướt ngang ngả lưng né đạn kiểu Mafia boss, tà áo bay bổng
          const w = U.beat(p, 0.04, 0.96, 0.36);
          P.torso = U.lerp(0.12, -0.28, w); P.head = 0.14 * w;
          P.lift = 4 * w; P.hx = -6 * w;
          P.nT = U.lerp(0.58, 0.88, w); P.nS = U.lerp(-0.75, -1.15, w);
          P.fT = U.lerp(-0.52, -0.82, w); P.fS = 0.28;
          P.nA = 0.2; P.nE = 1.85; P.fA = -0.25; P.fE = 1.65;
          return true;
        },
        counter_hand_strike(P, { U, p }) {
          // 1. Hất áo đỡ đòn (0..0.2) -> 2. Rút súng gí sát thái dương đối thủ bóp cò (0.2..0.55) -> 3. Giật nòng + thu súng lạnh lùng
          const draw = U.clamp(p / 0.22);
          const fire = U.beat(p, 0.36, 0.62, 0.2);
          const rec = p > 0.72 ? U.easeInOut((p - 0.72) / 0.28) : 0;
          P.torso = U.lerp(0.1 - 0.12 * draw, 0.16, Math.min(1, draw * 1.4)) - 0.12 * fire;
          P.torso = U.lerp(P.torso, 0.12, rec);
          P.head = -0.05;
          P.nA = U.lerp(0.25, 1.56 - 0.14 * fire, draw);
          P.nA = U.lerp(P.nA, 0.45, rec);
          P.nE = U.lerp(1.9, 0.05 + 0.18 * fire, draw);
          P.nE = U.lerp(P.nE, 1.8, rec);
          P.fA = U.lerp(0.3, -0.35, draw); P.fE = 1.85;
          P.nT = 0.62; P.nS = -0.68; P.fT = -0.6; P.fS = 0.18;
          return true;
        },
        counter_leg_strike(P, { U, p }) {
          const s = U.stage5(p, { a: 0.20, c: 0.42, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.4 - s.recover * 0.65);
          P.torso = U.lerp(0.14, -0.38, ex); P.hx = 5 * ex;
          P.nT = U.lerp(0.55, 1.58, ex); P.nS = U.lerp(-0.7, -0.06, ex);
          P.fT = -0.6; P.fS = 0.2;
          P.nA = 0.35; P.nE = 1.75; P.fA = -0.3; P.fE = 1.65;
          return true;
        },
        boss_bash(P, { U, p }) {
          // Thiết Quyền Habana: Gồng xì gà lùi vai -> Lao đấm thép + Nã phát súng kết liễu -> Thu áo uy quyền
          const s = U.stage5(p, { a: 0.24, c: 0.42, i: 0.66, f: 0.85 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.72);
          P.torso = U.lerp(0.1 - 0.26 * s.windup, 0.42, ex);
          P.head = U.lerp(0.05, -0.15, ex);
          P.hx = -7 * s.windup + 9 * ex;
          P.nA = U.lerp(0.35 - 0.9 * s.windup, 1.54, ex);
          P.nE = U.lerp(1.9, 0.06, ex);
          P.fA = U.lerp(0.4 - 0.5 * s.windup, -0.38, ex); P.fE = 1.85;
          P.nT = 0.66 + 0.32 * ex; P.nS = -0.82;
          P.fT = -0.6 - 0.22 * ex; P.fS = 0.2;
          return true;
        },
        ultimate_barrage(P, { U, p }) {
          // Bão Đạn Hắc Kim (5 giai đoạn gun-kata):
          // Stg 1 (0..0.15): Bung măng-tô rút súng giương cao
          // Stg 2 (0.15..0.72): 3 tư thế bắn luân phiên: đứng bắn thẳng -> quỳ thấp bắn quét -> ngả người bắn dồn
          // Stg 3 (0.72..0.86): Phát đạn đại bác Magnum giật mạnh
          // Stg 4-5 (0.86..1.0): Hất nòng súng khói bay & buông áo măng-tô
          if (p < 0.15) {
            const w = U.easeInOut(p / 0.15);
            P.torso = U.lerp(0.14, -0.14, w); P.hx = -5 * w;
            P.nA = U.lerp(0.5, 2.15, w); P.nE = U.lerp(1.75, 0.25, w);
            P.fA = U.lerp(0.35, -0.45, w); P.fE = 1.6;
            P.nT = 0.6; P.nS = -0.78; P.fT = -0.58; P.fS = 0.18;
            return true;
          }
          if (p < 0.40) {
            const fire = Math.max(0, Math.sin((p - 0.15) * 48));
            P.torso = 0.12 - 0.06 * fire; P.hx = -2.5 * fire;
            P.nA = 1.54 - 0.12 * fire; P.nE = 0.05 + 0.14 * fire;
            P.fA = 1.28; P.fE = 0.55;
            P.nT = 0.56; P.nS = -0.5; P.fT = -0.62; P.fS = 0.16;
            return true;
          }
          if (p < 0.58) {
            // Hạ gối bắn quét thấp
            const kneel = U.easeInOut(U.clamp((p - 0.40) / 0.08));
            const fire = Math.max(0, Math.sin((p - 0.40) * 52));
            P.torso = U.lerp(0.12, 0.28, kneel) - 0.05 * fire;
            P.lift = 7 * kneel;
            P.nA = 1.44 - 0.12 * fire; P.nE = 0.08 + 0.12 * fire;
            P.fA = -0.35; P.fE = 1.7;
            P.nT = U.lerp(0.56, 1.05, kneel); P.nS = U.lerp(-0.5, -1.52, kneel);
            P.fT = -0.68; P.fS = 0.25;
            return true;
          }
          if (p < 0.72) {
            const fire = Math.max(0, Math.sin((p - 0.58) * 56));
            P.torso = -0.14 - 0.05 * fire; P.hx = -4 * fire;
            P.nA = 1.62 - 0.14 * fire; P.nE = 0.04 + 0.15 * fire;
            P.fA = 1.32; P.fE = 0.42;
            P.nT = 0.52; P.nS = -0.45; P.fT = -0.65; P.fS = 0.16;
            return true;
          }
          if (p < 0.86) {
            // Phát kết liễu giật nòng mạnh
            const blast = U.easeOutBack(U.clamp((p - 0.72) / 0.12), 1.4);
            P.torso = -0.28 * blast; P.hx = -8 * blast;
            P.nA = 1.85 * blast; P.nE = 0.12;
            P.fA = -0.5; P.fE = 1.6;
            P.nT = 0.65; P.nS = -0.7; P.fT = -0.72; P.fS = 0.22;
            return true;
          }
          const rec = U.easeInOutQuart((p - 0.86) / 0.14);
          P.torso = U.lerp(-0.28, 0.14, rec); P.hx = U.lerp(-8, 0, rec);
          P.nA = U.lerp(1.85, 0.55, rec); P.nE = U.lerp(0.12, 1.85, rec);
          P.fA = U.lerp(-0.5, 0.3, rec); P.fE = U.lerp(1.6, 1.95, rec);
          P.nT = 0.6; P.nS = -0.78; P.fT = -0.56; P.fS = 0.16;
          return true;
        }
      },
      emitSkillVFX(e, st, prevP, p, fx) {
        const cross = (t) => prevP < t && p >= t;
        const dir = e.facing || 1;
        const gx = e.x || 0, gy = e.y || 580, gz = e.z || 0;
        if (st === 'dodge' && cross(0.08)) {
          fx.createDust(gx, gy, 6, 30);
          fx.createBanknoteScatter(gx, gy - 20, 3);
        } else if (st === 'counter_hand_strike') {
          if (cross(0.06)) fx.createShockRing(gx, gy - 60, '#f59e0b');
          if (cross(0.38)) {
            fx.createMuzzleFlash(gx + dir * 72, gy - 84, dir, '#facc15');
            fx.createSonicBoomCone(gx + dir * 68, gy - 84, dir, '#ef4444');
          }
        } else if (st === 'boss_bash') {
          if (cross(0.12)) fx.createDust(gx, gy, 8, 36);
          if (cross(0.42)) {
            fx.createMuzzleFlash(gx + dir * 74, gy - 80, dir, '#f59e0b');
            fx.createShockRing(gx + dir * 56, gy - 65, '#dc2626');
          }
          if (cross(0.62)) fx.createBanknoteScatter(gx + dir * 40, gy - 30, 5);
        } else if (st === 'air_punch' && cross(0.35)) {
          fx.createMuzzleFlash(gx + dir * 62, gy + gz - 68, dir, '#facc15');
        } else if (st === 'punch_straight' && cross(0.36)) {
          fx.createEnergySparks(gx + dir * 52, gy - 80, 5);
        } else if (st === 'punch_hook' && cross(0.42)) {
          fx.createMuzzleFlash(gx + dir * 64, gy - 80, dir, '#f59e0b');
        } else if (st === 'kick_roundhouse' && cross(0.42)) {
          fx.createSonicBoomCone(gx + dir * 48, gy - 66, dir, '#f59e0b');
        } else if (st === 'wk' && cross(0.34)) {
          fx.createShockRing(gx + dir * 42, gy - 62, '#dc2626');
          fx.createBanknoteScatter(gx + dir * 24, gy - 32, 3);
        } else if (st === 'kick_sweep' && cross(0.42)) {
          fx.createDust(gx + dir * 36, gy, 8, 40);
          fx.createBanknoteScatter(gx + dir * 36, gy - 16, 4);
        } else if (st === 'ultimate_barrage') {
          const beats = [0.18, 0.26, 0.34, 0.43, 0.51, 0.60, 0.68];
          beats.forEach((b, idx) => {
            if (cross(b)) {
              const my = (idx >= 3 && idx <= 4) ? gy - 62 : gy - 82;
              fx.createMuzzleFlash(gx + dir * 78, my, dir, idx % 2 ? '#ef4444' : '#facc15');
            }
          });
          if (cross(0.74)) {
            fx.createMuzzleFlash(gx + dir * 82, gy - 86, dir, '#ffffff');
            fx.createSonicBoomCone(gx + dir * 70, gy - 82, dir, '#f59e0b');
            fx.createBanknoteScatter(gx + dir * 50, gy - 20, 10);
          }
        }
      }
    },

    finisher: {
      state: 'boss_bash',
      dur: 0.68,
      lunge: 460,
      shake: true,
      attack: { damage: 142, offsetX: 76, offsetY: -82, width: 122, height: 74, knockback: 500, knockdown: true, weight: 'ultimate', energyGain: 22, unblockable: true }
    },

    // =========================================================================
    // 5. NỘI TẠI THỰC CHIẾN (PASSIVES)
    // =========================================================================
    passives: {
      onApply(player) {
        player.dmgMul = (player.dmgMul || 1) * 1.06;
        player.damageReduction = Math.min(0.45, (player.damageReduction || 0) + 0.08);
        player.passive_nhanNgocHuyet = true;
        player.passive_hachTamXichHuyet = true;
        player.passive_longBoChanThien = true;
        player.passive_baKhiTocTruong = true;
      },
      onBeforeTakeDamage(player, ctx) {
        if (player.hp - ctx.amount < player.maxHp * 0.35 && !player._xichHuyetArmorTriggered) {
          player._xichHuyetArmorTriggered = true;
          const healAmt = Math.round(player.maxHp * 0.08);
          player.hp = Math.min(player.maxHp, player.hp + healAmt);
          const isTL = isThuongLuongSkin(player);
          const armorCol = isTL ? '#06b6d4' : '#f59e0b';
          if (typeof player.activateAuraArmor === 'function') {
            player.activateAuraArmor(3, armorCol);
          }
          if (window.effectManager) {
            window.effectManager.addFloatingText(isTL ? '🐉 THỦY LÂN HỘ THỂ!' : 'HẬU PHƯƠNG THÉP!', player.x, player.y - 150, 'ult');
            window.effectManager.createShockRing(player.x, player.y, armorCol);
            if (isTL) {
              if (typeof window.effectManager.createSerpentWaterPillar === 'function') {
                window.effectManager.createSerpentWaterPillar(player.x, player.y, 240, 58);
              }
              spawnThuongLuongWave(window.effectManager, player.x, player.y - 60, player.facing || 1, 22, 64);
            }
          }
        }
        return null;
      },
      onDodge(player, ctx) {
        if (ctx) ctx.dodgeSpeed = 480;
        const isTL = isThuongLuongSkin(player);
        if (window.effectManager) {
          window.effectManager.addFloatingText(isTL ? '🌊 LẶN SÓNG THUỒNG LUỒNG!' : 'KHÓI HABANA!', player.x, player.y - 140, 'dodge');
          window.effectManager.addGhostTrail(player, isTL ? 'rgba(6, 182, 212, 0.56)' : 'rgba(245, 158, 11, 0.45)');
          if (isTL) {
            if (typeof window.effectManager.createSerpentDashWake === 'function') {
              window.effectManager.createSerpentDashWake(player.x, player.y - 45, player.facing || 1);
            }
            window.effectManager.createShockRing(player.x, player.y, '#06b6d4');
            spawnThuongLuongWave(window.effectManager, player.x, player.y - 45, -(player.facing || 1), 14, 38);
          }
        }
      },
      onHandCounter(defender, attacker) {
        if (!attacker || attacker.isDead) return;
        const isTL = isThuongLuongSkin(defender);
        attacker.takeDamage(34, defender.facing * 260, true);
        attacker.stunTimer = Math.max(attacker.stunTimer || 0, 0.9);
        if (typeof attacker.poise === 'number') {
          attacker.poise = Math.max(0, attacker.poise - 14);
        }
        if (window.effectManager) {
          window.effectManager.addFloatingText(isTL ? '🐉 LONG VĨ QUẤT SÓNG!' : 'GÍ SÚNG GIẢM THANH!', attacker.x, attacker.y - 145, 'crit');
          window.effectManager.createShockRing(attacker.x, attacker.y, isTL ? '#06b6d4' : '#f59e0b');
          if (isTL) {
            if (typeof window.effectManager.createSerpentTidalSlash === 'function') {
              window.effectManager.createSerpentTidalSlash(attacker.x, attacker.y - 68, defender.facing || 1, 1.3);
            }
            if (typeof window.effectManager.createSerpentWaterPillar === 'function') {
              window.effectManager.createSerpentWaterPillar(attacker.x, attacker.y, 210, 48);
            }
            window.effectManager.createShockRing(attacker.x, attacker.y, '#ef4444');
            spawnThuongLuongWave(window.effectManager, attacker.x, attacker.y - 65, defender.facing || 1, 20, 46);
          }
        }
      },
      onLegCounter(defender, attacker) {
        const isTL = isThuongLuongSkin(defender);
        if (typeof defender.activateAuraArmor === 'function') {
          defender.activateAuraArmor(1, isTL ? '#06b6d4' : '#f59e0b');
        } else if (typeof defender.setAuraArmor === 'function') {
          defender.setAuraArmor('gold', 1.2);
        }
        if (attacker && !attacker.isDead) {
          attacker.speedMul = 0.65;
          attacker.slowTimer = Math.max(attacker.slowTimer || 0, 1.8);
          if (attacker.isBoss && typeof attacker.poise === 'number') {
            attacker.poise = Math.max(0, attacker.poise - 20);
          }
          if (window.effectManager) {
            if (typeof window.effectManager.createShockRing === 'function') window.effectManager.createShockRing(attacker.x, attacker.y || 580, isTL ? '#06b6d4' : '#f59e0b');
            if (isTL) {
              if (typeof window.effectManager.createSerpentWaterPillar === 'function') {
                window.effectManager.createSerpentWaterPillar(attacker.x, attacker.y || 580, 220, 52);
              }
              if (typeof window.effectManager.createSerpentTidalSlash === 'function') {
                window.effectManager.createSerpentTidalSlash(attacker.x, (attacker.y || 580) - 62, defender.facing || 1, 1.15);
              }
              spawnThuongLuongWave(window.effectManager, attacker.x, (attacker.y || 580) - 55, defender.facing || 1, 18, 42);
            }
            if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText(isTL ? '🌊 TRIỀU CƯỜNG KHÓA CHÂN (-20 POISE / +1 GIÁP)!' : '🔫 PHÁT BẮN BẺ KHỚP (-20 POISE / +1 GIÁP)!', attacker.x, (attacker.y || 580) - 165, 'crit');
          }
        }
      },
      onStanceSpecial(player) {
        const isTL = isThuongLuongSkin(player);
        player.nextHitCrit = true;
        player.stamina = Math.min(player.maxStamina || 100, (player.stamina || 0) + 10);
        if (typeof player.setAuraArmor === 'function') player.setAuraArmor('gold', 0.8);
        if (window.effectManager) {
          if (isTL) {
            if (typeof window.effectManager.createSerpentWaterPillar === 'function') {
              window.effectManager.createSerpentWaterPillar(player.x, player.y || 580, 230, 54);
            }
            if (typeof window.effectManager.createSerpentTidalSlash === 'function') {
              window.effectManager.createSerpentTidalSlash(player.x + (player.facing || 1) * 28, (player.y || 580) - 68, player.facing || 1, 1.1);
            }
            if (typeof window.effectManager.createShockRing === 'function') window.effectManager.createShockRing(player.x, player.y || 580, '#06b6d4');
            spawnThuongLuongWave(window.effectManager, player.x, (player.y || 580) - 55, player.facing || 1, 20, 48);
          } else if (typeof window.effectManager.createDust === 'function') {
            window.effectManager.createDust(player.x, player.y || 580, 10, 36);
          }
          if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText(isTL ? '🐉 HẢI KHÍ TỤ LỰC CHÍ MẠNG (+10 TL)!' : '🥃 KHÓI HABANA NẠP ĐẠN CHÍ MẠNG (+10 TL)!', player.x, (player.y || 580) - 175, 'heal');
        }
        return true;
      },
      onDodgeFollowup(player, btn) {
        const isTL = isThuongLuongSkin(player);
        if (btn === 'K') {
          player.startAttack('kick_push', 0.48, 225);
          player._moveVariant = 'wk';
          if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText(isTL ? '🌊 ĐẠP SÓNG THUỒNG LUỒNG!' : '🥾 ỦNG THÂN ĐẾ ĐÔ!', player.x, (player.y || 580) - 150, 'crit');
          }
          return true;
        }
        player.startAttack('punch_hook', 0.40, 190);
        if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText(isTL ? '🐉 QUẬT VÂY ĐỎ THỦY QUÁI!' : '🔫 QUẤT BÁNG SÚNG HẮC KIM!', player.x, (player.y || 580) - 150, 'dodge');
        }
        return true;
      },
      onAttackHit(attacker, defender, attackData, combatSystem, hitCtx) {
        if (!defender || defender.isDead) return;
        const isTL = isThuongLuongSkin(attacker);
        const isHeavyHit = !!(attackData && (attackData.weight === 'ultimate' || attackData.weight === 'heavy'));
        if (isTL && window.effectManager) {
          if (typeof window.effectManager.createSerpentTidalSlash === 'function') {
            window.effectManager.createSerpentTidalSlash(defender.x, (defender.y || 580) - 68, attacker.facing || 1, isHeavyHit ? 1.25 : 0.92);
          }
          spawnThuongLuongWave(window.effectManager, defender.x, (defender.y || 580) - 65, attacker.facing || 1, isHeavyHit ? 14 : 9, 32);
        }
        if (isHeavyHit) {
          if (typeof defender.poise === 'number') {
            defender.poise = Math.max(0, defender.poise - 8);
          }
          if (window.effectManager) {
            window.effectManager.createShockRing(defender.x, defender.y, isTL ? '#06b6d4' : '#f59e0b');
            if (isTL && typeof window.effectManager.createSerpentWaterPillar === 'function') {
              window.effectManager.createSerpentWaterPillar(defender.x, defender.y, 180, 42);
            }
          }
        }
        if (hitCtx && (hitCtx.isCrossCombo || hitCtx.effectiveMove === 'elbow_strike') && defender.type !== 'player') {
          defender.hp = Math.max(0, defender.hp - 14);
          if (defender.isBoss && typeof defender.poise === 'number') {
            defender.poise = Math.max(0, defender.poise - 8);
          }
          if (defender.hp <= 0) {
            defender.isDead = true;
            defender.isAttacking = false;
            if (typeof defender.setState === 'function') defender.setState('knockdown', 1.0);
          }
          if (window.effectManager) {
            if (isTL) {
              if (typeof window.effectManager.createSerpentTidalSlash === 'function') {
                window.effectManager.createSerpentTidalSlash(defender.x, (defender.y || 580) - 70, attacker.facing || 1, 1.38);
              }
              if (typeof window.effectManager.createSerpentWaterPillar === 'function') {
                window.effectManager.createSerpentWaterPillar(defender.x, defender.y || 580, 200, 46);
              }
              spawnThuongLuongWave(window.effectManager, defender.x, (defender.y || 580) - 72, attacker.facing || 1, 18, 38);
              if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText('🌊 THỦY LONG TRẢM (+14)!', defender.x, (defender.y || 580) - 165, 'crit');
            } else {
              if (typeof window.effectManager.createMuzzleFlash === 'function') window.effectManager.createMuzzleFlash(attacker.x + (attacker.facing || 1) * 55, (attacker.y || 580) - 78, attacker.facing || 1, '#facc15');
              if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText('🔫 BỒI ĐẠN GIẢM THANH (+14)!', defender.x, (defender.y || 580) - 165, 'crit');
            }
          }
        }
        if (hitCtx && hitCtx.effectiveMove === 'uppercut' && (defender.stunTimer > 0 || defender.guardBroken)) {
          attacker.nextHitCrit = true;
        }
      }
    },

    // =========================================================================
    // 6. TUYỆT KỸ THỰC CHIẾN (ULTIMATE: QUÂN ĐOÀN HẬU PHƯƠNG THÉP)
    // =========================================================================
    ultimateRuntime: {
      type: 'barrage',
      cinematic: {
        title: 'PHÓ VĂN ANH',
        ult: 'BÃO ĐẠN HẮC KIM',
        color: '#f59e0b',
        accent: '#dc2626',
        style: 'fire',
        duration: 1.5
      },
      // Rút súng lục giảm thanh, xả 12 phát đạn vàng vào mục tiêu phía trước rồi kết thúc bằng trận mưa tiền vàng nổ tung
      execute(player, st, dt, enemies, { p, hitEnemy }) {
        const fx = window.effectManager;

        // === TUYỆT KỸ ĐỘC QUYỀN SKIN THUỒNG LUỒNG: HÓA THUỒNG LUỒNG HẤT XUYÊN QUA ĐỊCH (12 NHỊP) -> BAY VÚT TRỜI -> ĐÁP LẠI ĐÚNG CHỖ ĐẬP MẠNH XUỐNG ĐẤT ===
        if (isThuongLuongSkin(player)) {
          const g = window.game;
          const minX = (g && g.arenaLocked && Number.isFinite(g.arenaMinX)) ? (g.arenaMinX + 40) : 70;
          const maxX = (g && g.arenaLocked && Number.isFinite(g.arenaMaxX)) ? (g.arenaMaxX - 40) : ((window.stageManager && window.stageManager.stageWidth ? window.stageManager.stageWidth - 70 : 1200));

          if (!player._tlInit) {
            player._tlInit = true;
            player._ultStep = 0;
            player._tlPhase = 1;
            player._tlOriginX = player.x;
            player._tlOriginY = player.y;
            player._tlDir = player.facing || 1;
            let focusTarget = null;
            let bestDist = 560;
            for (const e of enemies) {
              if (!e || e.isDead) continue;
              if ((e.x - player.x) * player._tlDir < -40) continue;
              const d = Math.hypot(e.x - player.x, (e.y - player.y) * 1.5);
              if (d < bestDist) { bestDist = d; focusTarget = e; }
            }
            const rawCross = focusTarget
              ? (focusTarget.x + player._tlDir * 150)
              : (player.x + player._tlDir * 290);
            player._tlCrossX = Math.max(minX, Math.min(maxX, rawCross));
            if (fx) {
              if (typeof fx.createSerpentWaterPillar === 'function') fx.createSerpentWaterPillar(player.x, player.y, 260, 62);
              if (typeof fx.createSerpentDashWake === 'function') fx.createSerpentDashWake(player.x, player.y - 48, player._tlDir);
              fx.createShockRing(player.x, player.y, '#06b6d4');
              fx.createShockRing(player.x, player.y, '#ef4444');
              spawnThuongLuongWave(fx, player.x, player.y - 60, player._tlDir, 26, 70);
              if (typeof fx.addFloatingText === 'function') {
                fx.addFloatingText('🐉 HÓA THUỒNG LUỒNG!', player.x, player.y - 165, 'ultimate');
              }
            }
          }

          const dir = player._tlDir || player.facing || 1;
          const ox = Number.isFinite(player._tlOriginX) ? player._tlOriginX : player.x;
          const cx = Number.isFinite(player._tlCrossX) ? player._tlCrossX : (ox + dir * 280);

          if (p < 0.48) {
            // PHA 1: Phi siêu nhanh hất xuyên qua người kẻ địch (12 nhịp chuẩn bão đạn Văn Anh)
            const t1 = Math.max(0, Math.min(1, p / 0.48));
            const easeOut = 1 - Math.pow(1 - t1, 2);
            player.x = ox + (cx - ox) * easeOut;
            player.vx = 0;
            player.z = -18 - Math.sin(t1 * Math.PI * 5) * 14;
            player.vz = 0;
            player.facing = dir;

            const shots = Math.min(12, Math.floor(t1 * 12) + 1);
            while ((player._ultStep || 0) < shots) {
              player._ultStep = (player._ultStep || 0) + 1;
              let target = null;
              let best = 560;
              for (const e of enemies) {
                if (!e || e.isDead) continue;
                if ((e.x - ox) * dir < -30) continue;
                const d = Math.hypot(e.x - ox, (e.y - player.y) * 1.5);
                if (d < best) { best = d; target = e; }
              }
              if (fx) {
                if (player._ultStep % 2 === 1 && typeof fx.createSerpentDashWake === 'function') {
                  fx.createSerpentDashWake(player.x, player.y + player.z - 42, dir);
                }
                if (player._ultStep % 3 === 0 && typeof fx.createSerpentTidalSlash === 'function') {
                  fx.createSerpentTidalSlash(player.x + dir * 28, player.y + player.z - 55, dir, 1.15);
                }
                spawnThuongLuongWave(fx, player.x - dir * 20, player.y + player.z - 45, -dir, 6, 30);
              }
              if (target) {
                // Chỉ xuyên qua đẹp mắt, không đẩy lùi (knockback = 0), giữ nguyên sát thương chuẩn Văn Anh mặc định (không P2W)
                hitEnemy(target, 22, 0, false);
                target.stunTimer = Math.max(target.stunTimer || 0, 0.25);
                if (typeof target.poise === 'number') target.poise = Math.max(0, target.poise - 2);
                if (fx && player._ultStep % 2 === 0 && typeof fx.createSerpentTidalSlash === 'function') {
                  fx.createSerpentTidalSlash(target.x, target.y - 68, dir, 1.05);
                }
              }
            }
          } else if (p < 0.76) {
            // PHA 2: Vút bay thẳng lên trời & lượn vòng quay về trên đỉnh vị trí ban đầu (_tlOriginX)
            const t2 = (p - 0.48) / 0.28;
            player.x = cx + (ox - cx) * (t2 * t2 * (3 - 2 * t2));
            player.vx = 0;
            player.z = -24 - Math.sin(t2 * Math.PI * 0.5) * 235;
            player.vz = 0;
            player.facing = (ox < cx) ? -1 : dir;
            if (player._tlPhase < 2) {
              player._tlPhase = 2;
              if (fx) {
                if (typeof fx.createSerpentWaterPillar === 'function') fx.createSerpentWaterPillar(cx, player.y, 280, 68);
                fx.createShockRing(cx, player.y, '#06b6d4');
                spawnThuongLuongWave(fx, cx, player.y - 60, -dir, 22, 65);
                if (typeof fx.addFloatingText === 'function') {
                  fx.addFloatingText('🌊 VÚT LÊN TRỜI CAO!', player.x, player.y + player.z - 110, 'crit');
                }
              }
            }
            if (fx && Math.random() < 0.65) {
              spawnThuongLuongWave(fx, player.x, player.y + player.z - 22, 0, 5, 48);
            }
          } else if (p < 1) {
            // PHA 3: Lao cắm đầu đáp lại ĐÚNG CHỖ ban đầu (_tlOriginX) đập mạnh xuống đất!
            const t3 = (p - 0.76) / 0.24;
            player.x = ox;
            player.vx = 0;
            player.z = -259 * Math.max(0, 1 - t3 * t3);
            player.vz = 0;
            player.facing = dir;
            if (fx && Math.random() < 0.8) {
              spawnThuongLuongWave(fx, player.x, player.y + player.z - 25, 0, 6, 44);
            }
          }

          if (p >= 1) {
            player.x = ox;
            player.vx = 0;
            player.z = 0;
            player.vz = 0;
            player.facing = dir;
            if (typeof player.activateAuraArmor === 'function') player.activateAuraArmor(2, '#06b6d4');
            if (fx) {
              if (typeof fx.createSerpentWaterPillar === 'function') {
                fx.createSerpentWaterPillar(player.x, player.y, 320, 86);
                fx.createSerpentWaterPillar(player.x - 135, player.y, 210, 52);
                fx.createSerpentWaterPillar(player.x + 135, player.y, 210, 52);
              }
              if (typeof fx.createSerpentTidalSlash === 'function') {
                fx.createSerpentTidalSlash(player.x + 48, player.y - 65, 1, 1.5);
                fx.createSerpentTidalSlash(player.x - 48, player.y - 65, -1, 1.5);
              }
              if (typeof fx.createUltimateBlast === 'function') {
                fx.createUltimateBlast(player.x, player.y - 48, { primary: '#06b6d4', secondary: '#dc2626', flash: '#e0f2fe' });
              }
              if (typeof fx.createGroundSlam === 'function') fx.createGroundSlam(player.x, player.y, 280);
              if (typeof fx.createGroundCrack === 'function') fx.createGroundCrack(player.x, player.y, 185, '#06b6d4');
              fx.createShockRing(player.x, player.y, '#06b6d4', 340);
              fx.createShockRing(player.x, player.y, '#ef4444', 250);
              fx.triggerScreenShake(26, 0.65);
              spawnThuongLuongWave(fx, player.x, player.y - 35, 0, 48, 210);
              if (typeof fx.addFloatingText === 'function') {
                fx.addFloatingText('💥 HẢI KHIẾU GIÁNG ĐỊA!', player.x, player.y - 185, 'ultimate');
              }
            }
            for (const e of enemies) {
              if (!e.isDead && Math.abs(e.x - player.x) < 380) {
                hitEnemy(e, 95, 16, true);
              }
            }
            player._tlInit = false;
            player._tlPhase = 0;
            player._tlOriginX = null;
            player._tlCrossX = null;
            player.hitTargets.clear();
            player.setState('idle');
          }
          return;
        }

        player.vx = -player.facing * 30 * (1 - p);
        const shots = Math.min(12, Math.floor(p * 12));
        while ((player._ultStep || 0) < shots && p < 1) {
          player._ultStep = (player._ultStep || 0) + 1;
          let target = null;
          let best = 560;
          for (const e of enemies) {
            if (e.isDead) continue;
            if ((e.x - player.x) * player.facing < -30) continue;
            const d = Math.hypot(e.x - player.x, (e.y - player.y) * 1.5);
            if (d < best) { best = d; target = e; }
          }
          const mx = player.x + player.facing * 78;
          const my = player.y - 80;
          if (fx && Array.isArray(fx.particles)) {
            for (let i = 0; i < 6; i++) {
              fx.particles.push({
                x: mx + player.facing * i * 6, y: my + (Math.random() - 0.5) * 4,
                vx: player.facing * (22 + Math.random() * 6), vy: (Math.random() - 0.5) * 0.6,
                size: 2.4, color: i % 2 ? '#fde68a' : '#f59e0b', alpha: 0.95,
                life: 0.22, maxLife: 0.22, gravity: 0
              });
            }
            fx.particles.push({
              x: mx - player.facing * 10, y: my + 10, vx: -player.facing * (1 + Math.random() * 2), vy: -2.2,
              size: 3.2, color: '#facc15', alpha: 0.9, life: 0.6, maxLife: 0.6, gravity: 0.18
            });
          }
          if (target) {
            hitEnemy(target, 22, 2, false);
            target.stunTimer = Math.max(target.stunTimer || 0, 0.25);
            if (typeof target.poise === 'number') target.poise = Math.max(0, target.poise - 2);
          }
        }
        if (fx && Math.random() < 0.3) fx.addGhostTrail(player, 'rgba(245, 158, 11, 0.4)');
        if (p >= 1) {
          if (typeof player.activateAuraArmor === 'function') player.activateAuraArmor(2, '#f59e0b');
          if (fx) {
            fx.createUltimateBlast(player.x + player.facing * 60, player.y - 55, { primary: '#f59e0b', secondary: '#dc2626', flash: '#facc15' });
            fx.createBanknoteScatter(player.x + player.facing * 50, player.y - 40, 12);
            fx.createShockRing(player.x, player.y, '#f59e0b');
            fx.triggerScreenShake(24, 0.6);
            if (Array.isArray(fx.particles)) {
              for (let i = 0; i < 36; i++) {
                fx.particles.push({
                  x: player.x + (Math.random() - 0.5) * 520, y: player.y - 260 - Math.random() * 120,
                  vx: (Math.random() - 0.5) * 1.5, vy: 3 + Math.random() * 4,
                  size: 3.5 + Math.random() * 3, color: Math.random() < 0.5 ? '#facc15' : '#f59e0b', alpha: 1,
                  life: 0.9, maxLife: 0.9, gravity: 0.2
                });
              }
            }
          }
          for (const e of enemies) {
            if (!e.isDead && Math.abs(e.x - player.x) < 380) hitEnemy(e, 95, 16, true);
          }
          player.hitTargets.clear();
          player.setState('idle');
        }
      }
    }
  });
})();