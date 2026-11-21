/**
 * NHÂN VẬT: TRIỆU ĐÌNH AN
 * js/entities/characters/dinhan.js
 * Chứa toàn bộ: Hồ sơ, UI chọn tướng, Ngoại hình, Hoạt ảnh Chùy & Khiên, Chỉ số sát thương, Nội tại, Tuyệt kỹ & Đồng minh.
 */

(function () {
  window.CharacterRegistry.register({
    id: 'dinhan',
    uiSlotOrder: 3,

    // =========================================================================
    // 1. NGOẠI HÌNH & TRANG PHỤC (STYLE_DEFS)
    // =========================================================================
    appearance: {
      styleKey: 'boss_dinhan',
      style: {
        scale: 1.34,
        archetype: 'phoenix_general',
        rig: {
          shW: 15.2, waW: 11.6, hipW: 12.8, chestOut: 16.5,
          thighLen: 27.5, calfLen: 28, armUpper: 20, armFore: 19,
          spineH: 37, neckLen: 14.4, nShX: -6.4, nShY: -2.6, fShX: 6.2, fShY: -2.0,
          hipHalf: 5.0, footPad: 4, headScale: 0.80, limbBulk: 1.18, armBulk: 1.12
        },
        skin: '#d4a179',
        hair: '#1c1917',
        hairStyle: 'buzz',
        jawStyle: 'rugged_square',
        stubbleJaw: true,
        gi: '#991b1b',
        pants: '#451215',
        belt: '#b91c1c',
        shield: true,
        weapon: 'mace',
        weaponLen: 48,
        armor: true,
        cape: true,
        helmet: 'golden_lion',
        metal: '#eab308',
        aura: '#f59e0b',
        under: '#7f1d1d',
        shoes: 'general_greaves',
        eyeColor: '#d97706'
      }
    },

    // =========================================================================
    // 2. HỒ SƠ CỐT TRUYỆN (ROSTER DOSSIER)
    // =========================================================================
    dossier: {
      id: 'dinhan',
      name: 'Triệu Đình An',
      title: 'CẬN VỆ TRUNG THÀNH',
      faction: 'trieu',
      styleType: 'boss_dinhan',
      portrait: 'boss_dinhan',
      playable: true,
      role: 'Cận vệ trung thành của Triệu Vinh Tâm — trận đánh riêng trước khi gặp Vinh Tâm.',
      motive: 'Trung thành tuyệt đối: nếu hắn gục ngã, Vinh Tâm sẽ không bao giờ quỳ.',
      fightingStyle: 'Phòng thủ tốt, chuỗi đòn nặng, chiếm không gian bằng thân hình và tầm đánh dài.',
      strengths: 'Giảm sát thương thụ động, thủ thế thường xuyên, chuỗi 3 đòn nặng kiểm soát khu vực.',
      weaknesses: 'Bị phá thế thủ bằng đòn unblockable (đòn chân kẹp / tuyệt kỹ / Perfect Counter); hạ thủ là lộ sơ hở.',
      skills: [
        { name: 'Thủ Thế Triệu Gia', desc: 'Giảm 45% sát thương thụ động.' },
        { name: 'Chuỗi Đòn Nặng', desc: '3 đòn liên hoàn chậm nhưng rộng, mỗi đòn đẩy lùi.' },
        { name: 'Chiếm Không Gian', desc: 'Đứng chắn giữa sân, buộc người chơi phải vòng hoặc phá thế.' },
        { name: 'Thiết Bích Cố Thủ [W+U]', desc: 'Hồi ngay +40 điểm Khiên Thủ và kích hoạt 1.5s Giáp Kim Cang Vàng chống ngắt chiêu (CD 6s).' },
        { name: 'Phá Thế Thủ', desc: 'Đòn unblockable phá thủ — đó là cửa thắng.' }
      ],
      ultimate: { name: 'XUNG KÍCH KHỐI VŨ', desc: 'Lao tới bằng vai, húc văng mọi thứ trên đường đi.' },
      stats: { power: 4, speed: 2, defense: 5, technique: 3, range: 4 },
      relations: [
        { who: 'Triệu Vinh Tâm', rel: 'Chủ nhân — tuyệt đối trung thành' },
        { who: 'Ngô Nhất Nghị', rel: 'Kẻ phải vượt qua hắn mới vào được đại điện' },
        { who: 'Đình Bích Lâm', rel: 'Từng đối đầu — mối hận nhỏ' }
      ],
      events: ['Hồi IV: Trận đánh riêng trước Triệu Vinh Tâm'],
      unlock: { type: 'stage', stage: 9, text: 'Hoàn thành Màn 9 (Ngoại Thành Triệu Gia)' }
    },

    // =========================================================================
    // 3. THẺ CHỌN NHÂN VẬT (CHAR_SLOTS UI)
    // =========================================================================
    uiSlot: {
      id: 'dinhan',
      slotName: 'TRIỆU ĐÌNH AN',
      fullName: 'TRIỆU ĐÌNH AN',
      title: 'CẬN VỆ TRUNG THÀNH',
      tagline: 'Trung dũng — Bất hoại — Vạn phu mạc địch',
      element: '🛡️',
      color: '#d4a017',
      image: 'assets/images/characters/char_dinhan.png',
      vovinamImage: 'assets/images/characters/char_dinhan_vovinam.png',
      bio: 'Cận vệ số một của Triệu gia, khoác lên mình chiến giáp phụng hoàng. Một lời hứa trung thành nặng tựa thái sơn, sẵn sàng lấy thân mình làm khiên chắn.',
      stats: { power: 90, speed: 50, defense: 100, technique: 75 },
      skills: [
        { key: 'J / K', icon: '🔨', name: 'Trọng Chùy Phá Trận', desc: 'Vung đại chùy càn quét khiến kẻ địch bật ngã.' },
        { key: 'L', icon: '🛡️', name: 'Thiết Bích Trụ Tấn', desc: 'Giảm 45% mọi sát thương nhận vào khi thủ thế.' },
        { key: 'U+J / U+K', icon: '⚡', name: 'Khiên Kích Phản Chấn', desc: 'Dùng chiến khiên húc văng đối thủ khi chúng tấn công.' },
        { key: 'W+U', icon: '🛡️', name: 'Thiết Bích Cố Thủ', desc: 'Hồi ngay +40 điểm Khiên Thủ và kích hoạt 1.5s Giáp Kim Cang Vàng đứng vững chống ngắt chiêu (CD 6s).' },
        { key: 'I', icon: '🔥', name: 'Phụng Hoàng Liệt Lôi', desc: 'Tuyệt kỹ: bọc lôi hỏa lao thẳng húc tan nát tiền tuyến.' }
      ],
      passives: [
        { icon: '🛡️', name: 'Thiết Bích Kim Cương', type: 'BỊ ĐỘNG', desc: 'Giảm vĩnh viễn 25% mọi sát thương nhận vào; miễn nhiễm bị đấm ngắt chiêu bởi đòn nhẹ.' },
        { icon: '🔥', name: 'Phụng Hoàng Hộ Tâm', type: 'BỊ ĐỘNG', desc: 'Khi giữ thế thủ [U], phản ngược 40% sát thương của đòn tấn công về phía kẻ thù.' },
        { icon: '⚡', name: 'Khiên Kích Phá Giáp', type: 'CHỦ ĐỘNG [U+J]', desc: 'Dùng chiến khiên húc văng đối phương, làm choáng 1.5s và đánh sập thế phòng ngự.' },
        { icon: '🔨', name: 'Trọng Chùy Chấn Địa', type: 'BỊ ĐỘNG', desc: 'Mọi đòn quét chùy (K) tạo dư chấn phạm vi nhỏ làm chậm tốc độ kẻ địch 30% trong 2s.' }
      ],
      mechanic: 'Giảm sát thương thụ động — Trọng kích bạt sơn — Thiết bích phòng thủ.',
      quote: '“Còn Đình An ở đây, không một kẻ nào có thể vượt qua lằn ranh này!”'
    },

    // =========================================================================
    // 4. CHỈ SỐ CHIẾN ĐẤU, ĐÒN ĐÁNH & FINISHER
    // =========================================================================
    combat: {
      hp: 1080,
      speed: 200,
      runSpeed: 320,
      jumpForce: 475,
      damage: 1.25,
      reach: 1.1,
      knockback: 1.25,
      energyGain: 1.0,
      attackDurationMul: 1.22,
      maxKickCooldown: 0.36,
      finisher: 'bash',
      ultimateState: 'ultimate_bash',
      ultimateType: 'bash',
      damageReduction: 0.20,
      mechanic: 'Giảm sát thương thụ động + thủ thế + chuỗi đòn nặng'
    },

    moveOverrides: {},

    finisher: {
      state: 'boss_bash',
      dur: 0.7,
      lunge: 470,
      shake: true,
      attack: {
        damage: 120,
        offsetX: 74,
        offsetY: -84,
        width: 118,
        height: 72,
        knockback: 470,
        knockdown: true,
        weight: 'ultimate',
        energyGain: 20,
        unblockable: true
      }
    },

    // =========================================================================
    // 5. HOẠT ẢNH XƯƠNG ĐẶC TRƯNG (THIẾT CHÙY & KHIÊN HỔ PHÙ)
    // =========================================================================
    animation: {
      signatureStates: ['boss_bash', 'ultimate_bash'],
      trailProfile: {
        primary: '#f97316',
        secondary: '#facc15',
        core: '#fef9c3',
        width: 14,
        dual: false,
        dodgeGhost: 'rgba(245, 158, 11, 0.5)'
      },
      skillCatalog: [
        { id: 'punch_straight', input: 'J', name: 'Quét Thiết Chùy Phá Giáp', dur: 0.34, category: 'combo' },
        { id: 'punch_hook', input: 'J → J', name: 'Hoành Tảo Chùy Bát Giác', dur: 0.42, category: 'combo' },
        { id: 'kick_push', input: 'K', name: 'Đá Húc Thiết Giáp', dur: 0.52, category: 'combo' },
        { id: 'kick_roundhouse', input: 'K → K', name: 'Trọng Cước Chiến Tướng', dur: 0.60, category: 'combo' },
        { id: 'wk', input: 'W + K', name: 'Thiết Kỵ Phụng Hoàng Tông', dur: 0.52, category: 'special' },
        { id: 'uppercut', input: 'W + J', name: 'Phụng Hoàng Khởi Chùy', dur: 0.52, category: 'special' },
        { id: 'elbow_strike', input: 'S + J', name: 'Đập Mép Khiên Hổ Phù', dur: 0.46, category: 'special' },
        { id: 'kick_sweep', input: 'S + K', name: 'Giậm Đất Quét Trụ', dur: 0.66, category: 'special' },
        { id: 'hook_run', input: 'Shift + J', name: 'Xung Phong Trọng Giáp', dur: 0.48, category: 'special' },
        { id: 'air_punch', input: 'Space + J', name: 'Bổ Chùy Trên Không', dur: 0.38, category: 'aerial' },
        { id: 'flying_kick', input: 'Space + K', name: 'Phi Giáp Trấn Sơn', dur: 0.55, category: 'aerial' },
        { id: 'dodge', input: 'L', name: 'Thiết Bích Hoành Di', dur: 0.28, category: 'defense' },
        { id: 'counter_hand_strike', input: 'U + J', name: 'Phản Đòn: Khiên Chấn Thiết Chùy', dur: 0.42, category: 'counter' },
        { id: 'counter_leg_strike', input: 'U + K', name: 'Phản Đòn: Hổ Phù Quét Trận', dur: 0.48, category: 'counter' },
        { id: 'boss_bash', input: 'Finisher', name: 'Hỏa Liên Xung Kích', dur: 0.70, category: 'finisher' },
        { id: 'ultimate_bash', input: 'I', name: 'Tuyệt Kỹ: Lôi Hỏa Phá Trận', dur: 1.50, category: 'ultimate' }
      ],
      initPose(P, { style }) {
        if (style && style.weapon === 'mace') {
          P.grip = -0.34;
        }
      },
      poses: {
        idle(P, { t, hasMaceShield }) {
          if (!hasMaceShield) return false;
          const b = Math.sin(t * 2.2);
          P.torso = 0.03 + 0.01 * b;
          P.head = -0.02;
          P.nT = 0.28 + 0.015 * b; P.nS = -0.34 - 0.015 * b;
          P.fT = -0.26 - 0.015 * b; P.fS = 0.05 + 0.015 * b;
          P.lift = Math.sin(t * 2.2) * 0.8;
          // Dáng Đại Tướng đứng thẳng sừng sững: chùy hạ chếch mở rộng giáp ngực Phụng Hoàng, khiên giữ gọn ngang sườn trước
          P.nA = 0.24 + 0.02 * b; P.nE = 0.34; P.grip = -0.26;
          P.fA = 0.44 - 0.02 * b; P.fE = 1.04;
          P.hx = Math.sin(t * 1.1) * 0.5;
          return true;
        },
        walk(P, { e, t, hasMaceShield }) {
          if (!hasMaceShield) return false;
          const isBackpedal = (e.vx * (e.facing || 1) < -10);
          const dir = isBackpedal ? -1 : 1;
          const c = t * 6.0 * dir;
          const s = Math.sin(c), co = Math.cos(c);
          P.torso = isBackpedal ? 0.12 : 0.22;
          P.nT = 0.28 + 0.48 * s; P.nS = -(0.32 + 0.8 * Math.max(0, co));
          P.fT = 0.28 - 0.48 * s; P.fS = -(0.32 + 0.8 * Math.max(0, -co));
          P.nA = 0.32 + 0.06 * s; P.nE = 1.1; P.grip = -0.32;
          P.fA = 0.92 - 0.04 * s; P.fE = 0.95;
          return true;
        },
        run(P, { t, hasMaceShield }) {
          if (!hasMaceShield) return false;
          const c = t * 14, s = Math.sin(c), co = Math.cos(c);
          P.torso = 0.42; P.head = -0.2;
          P.nT = 0.2 + 0.95 * s; P.nS = -(0.3 + 1.25 * Math.max(0, co));
          P.fT = 0.2 - 0.95 * s; P.fS = -(0.3 + 1.25 * Math.max(0, -co));
          P.nF = -0.5 * Math.max(0, co); P.fF = -0.5 * Math.max(0, -co);
          P.nA = 0.28 - 0.22 * s; P.nE = 1.05; P.grip = -0.32;
          P.fA = 0.95; P.fE = 0.88;
          return true;
        },
        guard(P, { hasMaceShield }) {
          if (!hasMaceShield) return false;
          P.torso = 0.22; P.head = -0.08;
          P.nT = 0.86; P.nS = -1.22; P.fT = -0.72; P.fS = 0.22;
          P.nA = 0.22; P.nE = 1.15; P.grip = -0.25;
          P.fA = 1.18; P.fE = 0.82;
          return true;
        },
        punch_straight(P, { style, mix }) {
          if (!style || style.weapon !== 'mace') return false;
          P.torso = mix(0.16, -0.24, 0.44);
          P.head = mix(-0.05, 0.06, -0.12);
          P.hx = mix(0, -4, 7);
          P.nA = mix(0.34, 1.95, 0.68); P.nE = mix(1.08, 0.52, 0.14);
          P.grip = mix(-0.34, 0.25, -0.85);
          P.fA = mix(0.92, 1.08, 0.72); P.fE = mix(0.96, 0.88, 1.05);
          P.nT = mix(0.78, 0.65, 1.02); P.nS = mix(-1.0, -0.85, -0.58);
          P.fT = mix(-0.68, -0.72, -0.82); P.fS = mix(0.24, 0.2, 0.25);
          return true;
        },
        punch_hook(P, { style, mix }) {
          if (!style || style.weapon !== 'mace') return false;
          P.torso = mix(0.14, -0.26, 0.28);
          P.head = mix(-0.05, 0.08, -0.12);
          P.hx = mix(0, -5, 6);
          P.nA = mix(0.32, -0.75, 1.18); P.nE = mix(1.06, 0.72, 0.14);
          P.grip = mix(-0.34, 0.35, -0.82);
          P.fA = mix(0.92, 1.10, 0.45); P.fE = mix(0.96, 0.85, 1.05);
          P.nT = mix(0.78, 0.68, 1.05); P.nS = mix(-1.0, -1.05, -0.65);
          P.fT = mix(-0.68, -0.65, -0.82); P.fS = mix(0.24, 0.2, 0.2);
          return true;
        },
        kick_roundhouse(P, { U, p, hasMaceShield }) {
          if (!hasMaceShield) return false;
          // Beat 3 Đại Tướng: Dựng khiên hộ ngực, thu thiết chùy ra sau vặn xoáy tung trọng cước bọc thép
          const s = U.stage5(p, { a: 0.20, c: 0.40, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.44 - s.recover * 0.7);
          P.torso = U.lerp(0.14, -0.16, ex);
          P.head = 0.04 * ex;
          P.nA = U.lerp(0.32, -0.58, ex); P.nE = 0.68; P.grip = -0.36;
          P.fA = U.lerp(0.85, 1.24, ex); P.fE = 0.78;
          P.nT = U.lerp(0.65, 1.48, ex); P.nS = U.lerp(-1.2, -0.02, ex); P.nF = 0.25 * ex;
          P.fT = -0.36; P.fS = 0.10;
          return true;
        },
        wk(P, { U, p, hasMaceShield }) {
          if (!hasMaceShield) return false;
          // W + K: Thiết Kỵ Phụng Hoàng Tông — ôm khiên hổ phù che mặt húc gối thiết giáp & giậm tung ngực địch
          const s = U.stage5(p, { a: 0.18, c: 0.38, i: 0.60, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.46 - s.recover * 0.7);
          P.torso = U.lerp(0.18, 0.34, ex);
          P.lift = 3 * s.windup - 5 * ex;
          P.nA = U.lerp(0.35, -0.78, ex); P.nE = 0.55; P.grip = -0.45;
          P.fA = U.lerp(0.88, 1.42, ex); P.fE = 0.72;
          P.nT = U.lerp(0.75, 1.56, ex); P.nS = U.lerp(-1.45, -0.04, ex); P.nF = 0.32 * ex;
          P.fT = -0.52; P.fS = 0.18;
          return true;
        },
        kick_sweep(P, { U, p, hasMaceShield }) {
          if (!hasMaceShield) return false;
          // S + K: Giậm Đất Tảo Thiết Cước — quỳ gối nửa thế, dìm khiên thấp đồng thời quét chùy & giày đồng phá địa
          const s = U.stage5(p, { a: 0.20, c: 0.40, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.44 - s.recover * 0.72);
          P.lift = U.lerp(4 * s.windup, 11, ex);
          P.torso = U.lerp(0.14, 0.26, ex);
          P.nA = U.lerp(-0.45 * s.windup + 0.3, 0.42, ex); P.nE = 0.22; P.grip = U.lerp(0.2, -0.78, ex);
          P.fA = U.lerp(0.95, 0.68, ex); P.fE = 0.62;
          P.nT = U.lerp(0.55, 1.16, ex); P.nS = U.lerp(-1.15, -0.02, ex);
          P.fT = U.lerp(-0.32, 0.68, ex); P.fS = U.lerp(0.12, -1.65, ex);
          return true;
        },
        boss_bash(P, { U, p, mix, hasMaceShield }) {
          if (!hasMaceShield) {
            P.torso = mix(0.16, -0.22, 0.52);
            P.hx = mix(0, -4, 9);
            P.nA = mix(0.7, -0.35, 1.32); P.nE = mix(1.8, 1.65, 0.22);
            P.fA = mix(0.35, -0.2, 1.18); P.fE = mix(1.95, 1.7, 0.3);
            P.nT = mix(0.62, 0.52, 1.15); P.nS = mix(-0.82, -0.7, -1.35);
            P.fT = mix(-0.55, -0.75, -0.85); P.fS = mix(0.15, 0.2, 0.22);
            return true;
          }
          const u = U.cham(p), d = U.ext(p);
          P.torso = U.lerp(U.lerp(0.16, 0.42, u), 0.48, d);
          P.head = U.lerp(-0.05, -0.18, Math.max(u, d));
          P.hx = U.lerp(U.lerp(0, 6, u), 10, d);
          P.fA = U.lerp(U.lerp(0.92, 1.18, u), 1.32, d);
          P.fE = U.lerp(U.lerp(0.96, 0.72, u), 0.48, d);
          P.nA = U.lerp(U.lerp(0.34, -0.45, u), 1.15, d);
          P.nE = U.lerp(U.lerp(1.08, 1.25, u), 0.22, d);
          P.grip = U.lerp(U.lerp(-0.34, 0.25, u), -0.82, d);
          P.nT = U.lerp(U.lerp(0.78, 1.05, u), 1.18, d);
          P.nS = U.lerp(U.lerp(-1.0, -1.35, u), -1.25, d);
          P.fT = U.lerp(U.lerp(-0.68, -0.78, u), -0.88, d);
          P.fS = 0.22;
          return true;
        },
        hook_run(P, { style, mix }) {
          if (!style || style.weapon !== 'mace') return false;
          P.torso = mix(0.28, -0.32, 0.68);
          P.hx = mix(0, -6, 10);
          P.nT = mix(0.7, 0.45, 1.15); P.nS = mix(-0.9, -0.7, -1.25);
          P.fT = mix(-0.6, -0.85, -0.95); P.fS = mix(0.2, 0.25, 0.3);
          P.nA = mix(0.34, 1.95, 0.82); P.nE = mix(1.08, 0.5, 0.12);
          P.grip = mix(-0.34, 0.35, -0.88);
          P.fA = mix(0.92, 1.1, 0.55); P.fE = 0.95;
          return true;
        },
        elbow_strike(P, { mix, hasMaceShield }) {
          if (!hasMaceShield) return false;
          P.torso = mix(0.14, -0.3, 0.5);
          P.hx = mix(0, -4, 5);
          P.nT = mix(0.62, 0.7, 0.8); P.nS = mix(-0.82, -0.95, -0.68);
          P.fT = mix(-0.55, -0.6, -0.72); P.fS = mix(0.15, 0.2, 0.24);
          P.fA = mix(0.92, 0.55, 1.38); P.fE = mix(0.96, 1.35, 0.52);
          P.nA = mix(0.34, 0.15, 0.85); P.nE = mix(1.08, 1.25, 0.65); P.grip = -0.34;
          return true;
        },
        uppercut(P, { style, mix }) {
          if (!style || style.weapon !== 'mace') return false;
          P.lift = mix(0, 9, -15);
          P.torso = mix(0.14, 0.38, -0.24);
          P.head = mix(-0.05, 0.12, -0.28);
          P.hx = mix(0, -3, 6);
          P.nT = mix(0.62, 0.98, 0.18); P.nS = mix(-0.82, -1.6, -0.25);
          P.fT = mix(-0.55, -0.75, -0.25); P.fS = mix(0.15, 0.45, 0.1);
          P.nA = mix(0.34, -0.45, 2.25); P.nE = mix(1.08, 1.25, 0.35);
          P.grip = mix(-0.34, -0.75, -0.25);
          P.fA = mix(0.92, 0.85, 0.45); P.fE = 0.95;
          return true;
        },
        dodge(P, { U, p, hasMaceShield }) {
          if (!hasMaceShield) return false;
          const w = U.beat(p, 0.02, 0.96, 0.4);
          P.torso = U.lerp(0.16, 0.38, w); P.lift = 5 * w;
          P.fA = U.lerp(0.92, 1.38, w); P.fE = 0.75;
          P.nA = U.lerp(0.34, -0.35, w); P.nE = 1.15; P.grip = -0.34;
          P.nT = 0.88; P.nS = -1.2; P.fT = -0.75; P.fS = 0.26;
          return true;
        },
        counter_hand_strike(P, { U, p, hasMaceShield }) {
          if (!hasMaceShield) return false;
          // Giơ khiên đỡ nổ giáp (0..0.22) -> Bổ Thiết Chùy Bát Giác đập tan mặt đất (0.22..0.64) -> Đứng uy vũ
          const block = U.beat(p, 0.0, 0.32, 0.25);
          const s = U.stage5(p, { a: 0.24, c: 0.44, i: 0.64, f: 0.85 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.4 - s.recover * 0.7);
          P.torso = U.lerp(0.18 - 0.22 * s.windup, 0.34, ex);
          P.fA = U.lerp(1.12 * block + 0.8 * (1 - block), 0.35, ex); P.fE = 0.85;
          P.nA = U.lerp(0.34 + 1.24 * s.windup, 0.65, ex);
          P.nE = U.lerp(1.05, 0.14, ex);
          P.grip = U.lerp(-0.34 + 0.55 * s.windup, -0.92, ex);
          P.nT = 0.78 + 0.28 * ex; P.nS = -1.05; P.fT = -0.68; P.fS = 0.22;
          return true;
        },
        counter_leg_strike(P, { U, p, hasMaceShield }) {
          if (!hasMaceShield) return false;
          const s = U.stage5(p, { a: 0.20, c: 0.42, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.4 - s.recover * 0.68);
          P.torso = U.lerp(0.18, -0.32, ex);
          P.nT = U.lerp(0.75, 1.48, ex); P.nS = U.lerp(-1.0, -0.08, ex);
          P.fA = U.lerp(0.92, 1.45, ex); P.fE = 0.65;
          P.nA = 0.28; P.nE = 1.1; P.grip = -0.34;
          return true;
        },
        ultimate_bash(P, { U, t, p }) {
          // 5 giai đoạn Lôi Hỏa Phá Trận:
          // Stg 1 (0..0.16): Chéo Khiên & Thiết Chùy thắp sáng Đôi Cánh Phụng Hoàng
          // Stg 2 (0.16..0.56): Xung Phong Phalanx húc khiên kéo vệt lửa hoàng kim
          // Stg 3 (0.56..0.84): Nhảy bổ Thiết Chùy Sấm Sét kích nổ Vòm Hỏa Liên
          // Stg 4-5 (0.84..1.0): Quán tính cắm chùy & Đứng thẳng hiên ngang
          if (p < 0.16) {
            const w = U.easeInOut(p / 0.16);
            P.torso = U.lerp(0.16, -0.18, w); P.head = 0.08 * w; P.hx = -6 * w; P.lift = 6 * w;
            P.fA = U.lerp(0.92, 1.65, w); P.fE = 0.65;
            P.nA = U.lerp(0.34, 2.25, w); P.nE = 0.45; P.grip = U.lerp(-0.34, 0.35, w);
            P.nT = 0.82; P.nS = -1.15; P.fT = -0.7; P.fS = 0.26;
            return true;
          }
          if (p < 0.56) {
            const rushK = U.easeOut(U.clamp((p - 0.16) / 0.14));
            P.torso = U.lerp(0.16, 0.48, rushK); P.head = -0.22 * rushK; P.hx = 10 * rushK;
            P.fA = U.lerp(0.92, 1.38, rushK); P.fE = 0.55;
            P.nA = U.lerp(0.34, -0.55, rushK); P.nE = 1.1; P.grip = -0.32;
            const stride = Math.sin(t * 24);
            P.nT = 0.85 + 0.48 * stride; P.nS = -1.05 - 0.35 * Math.max(0, stride);
            P.fT = -0.55 - 0.48 * stride; P.fS = 0.2;
            return true;
          }
          if (p < 0.84) {
            const slamP = U.clamp((p - 0.56) / 0.28);
            const hoist = slamP < 0.32 ? U.easeOutCubic(slamP / 0.32) : 1;
            const smash = slamP > 0.28 ? U.easeOutBack(U.clamp((slamP - 0.28) / 0.32), 1.3) : 0;
            P.torso = U.lerp(-0.24 * hoist, 0.62, smash);
            P.head = U.lerp(0.14, -0.2, smash);
            P.lift = U.lerp(-18 * hoist, 6, smash);
            P.hx = U.lerp(-4, 11, smash);
            P.nA = U.lerp(2.65 * hoist, 0.32, smash);
            P.nE = U.lerp(0.28, 0.1, smash);
            P.grip = U.lerp(0.42, -0.94, smash);
            P.fA = U.lerp(1.25, -0.2, smash); P.fE = U.lerp(0.6, 1.15, smash);
            P.nT = U.lerp(0.55, 1.15, smash); P.nS = U.lerp(-0.7, -1.45, smash);
            P.fT = -0.78; P.fS = 0.22;
            return true;
          }
          const rec = U.easeInOutQuart((p - 0.84) / 0.16);
          P.torso = U.lerp(0.62, 0.16, rec); P.lift = U.lerp(6, 0, rec);
          P.nA = U.lerp(0.32, 0.34, rec); P.nE = U.lerp(0.1, 1.08, rec);
          P.grip = U.lerp(-0.94, -0.34, rec);
          P.fA = U.lerp(-0.2, 0.92, rec); P.fE = U.lerp(1.15, 0.96, rec);
          P.nT = U.lerp(1.15, 0.78, rec); P.nS = U.lerp(-1.45, -1.0, rec);
          P.fT = -0.68; P.fS = 0.24;
          return true;
        }
      },
      emitSkillVFX(e, st, prevP, p, fx) {
        const cross = (t) => prevP < t && p >= t;
        const dir = e.facing || 1;
        const gx = e.x || 0, gy = e.y || 580;
        if (st === 'dodge' && cross(0.08)) {
          fx.createDust(gx, gy, 10, 42);
          fx.createPhoenixWingFlare(gx, gy - 55, dir, 0.32);
        } else if (st === 'counter_hand_strike') {
          if (cross(0.06)) fx.createPhoenixWingFlare(gx, gy - 62, dir, 0.36);
          if (cross(0.42)) {
            fx.createSacredDome(gx + dir * 48, gy, 118, 0.42);
            fx.createGroundCrack(gx + dir * 48, gy, 105, '#f59e0b');
          }
        } else if (st === 'punch_hook' && cross(0.38)) {
          fx.createEnergySparks(gx + dir * 64, gy - 72, 7);
        } else if (st === 'wk' && cross(0.34)) {
          fx.createPhoenixWingFlare(gx, gy - 58, dir, 0.34);
          fx.createSonicBoomCone(gx + dir * 48, gy - 62, dir, '#f97316');
        } else if (st === 'kick_roundhouse' && cross(0.42)) {
          fx.createGroundCrack(gx + dir * 50, gy, 88, '#f59e0b');
        } else if (st === 'kick_sweep' && cross(0.42)) {
          fx.createGroundCrack(gx + dir * 56, gy, 110, '#f59e0b');
          fx.createDust(gx + dir * 42, gy, 12, 48);
        } else if (st === 'boss_bash') {
          if (cross(0.12)) fx.createPhoenixWingFlare(gx, gy - 58, dir, 0.42);
          if (cross(0.44)) fx.createSacredDome(gx + dir * 56, gy, 110, 0.38);
        } else if (st === 'ultimate_bash') {
          if (cross(0.06)) fx.createPhoenixWingFlare(gx, gy - 62, dir, 0.5);
          if (cross(0.24)) fx.createSonicBoomCone(gx + dir * 42, gy - 60, dir, '#f97316');
          if (cross(0.68)) {
            fx.createSacredDome(gx + dir * 50, gy, 165, 0.52);
            fx.createPhoenixWingFlare(gx + dir * 30, gy - 65, dir, 0.55);
          }
        }
      }
    },

    // =========================================================================
    // 6. NỘI TẠI THỰC CHIẾN (PASSIVES)
    // =========================================================================
    passives: {
      onApply(player) {
        player.damageReduction = 0.25;
        player.passive_thietBich = true;
        player.passive_phungHoang = true;
        player.passive_khienKich = true;
        player.passive_trongChuy = true;
      },
      onGuardReflect(defender, attacker, blockedDamage) {
        if (attacker && typeof attacker.takeDamage === 'function') {
          const reflectDmg = Math.max(12, Math.round(blockedDamage * 0.8));
          attacker.takeDamage(reflectDmg, defender.facing * 6, false);
          if (window.effectManager) {
            window.effectManager.addFloatingText('PHỤNG HOÀNG PHẢN CHẤN ' + reflectDmg, attacker.x, attacker.y - 140, 'crit');
          }
        }
      },
      onDodge(player) {
        player.setAuraArmor('gold', 2.0);
        if (typeof player.guardGauge === 'number') {
          player.guardGauge = Math.min(player.maxGuardGauge || 100, player.guardGauge + 25);
        }
        if (window.effectManager) {
          window.effectManager.addFloatingText('🛡️ THIẾT BÍCH TRỤ TẤN!', player.x, player.y - 145, 'heal');
        }
      },
      onHandCounter(defender, attacker) {
        defender.setAuraArmor('gold', 2.0);
        if (attacker) {
          attacker.stunTimer = Math.max(attacker.stunTimer || 0, 1.5);
          attacker.state = 'hurt';
          attacker.stateDuration = 1.5;
          if (attacker.isBoss) attacker.poise = Math.max(0, (attacker.poise || 100) - 50);
          if (window.effectManager) {
            window.effectManager.addFloatingText('PHÁ THẾ THỦ (CHOÁNG 1.5s)!', attacker.x, attacker.y - 150, 'crit');
          }
        }
      },
      onLegCounter(defender) {
        if (typeof defender.guardGauge === 'number') {
          defender.guardGauge = Math.min(defender.maxGuardGauge || 100, defender.guardGauge + 45);
        }
        const enemies = (window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : [];
        for (const e of enemies) {
          if (!e || e.isDead) continue;
          if (Math.hypot(e.x - defender.x, e.y - defender.y) <= 180) {
            e.speedMul = 0.65;
            e.slowTimer = Math.max(e.slowTimer || 0, 3.0);
          }
        }
        if (window.effectManager) {
          if (typeof window.effectManager.createGroundCrack === 'function') window.effectManager.createGroundCrack(defender.x, defender.y || 580, 125, '#f97316');
          if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText('🛡️ HỔ PHÙ QUÉT TRẬN (+45 KHIÊN)!', defender.x, (defender.y || 580) - 180, 'heal');
        }
      },
      onStanceSpecial(player) {
        if (typeof player.guardGauge === 'number') {
          player.guardGauge = Math.min(player.maxGuardGauge || 100, player.guardGauge + 40);
        }
        if (typeof player.setAuraArmor === 'function') player.setAuraArmor('gold', 1.5);
        if (window.effectManager) {
          if (typeof window.effectManager.createShockRing === 'function') window.effectManager.createShockRing(player.x, player.y || 580, '#f59e0b');
          if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText('🛡️ THIẾT BÍCH CỐ THỦ (+40 KHIÊN / KIM CANG)!', player.x, (player.y || 580) - 175, 'heal');
        }
        return true;
      },
      onDodgeFollowup(player, btn) {
        if (btn === 'K') {
          player.startAttack('kick_push', 0.50, 220);
          player._moveVariant = 'wk';
          if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText('🔥 THIẾT KỴ PHỤNG HOÀNG TÔNG!', player.x, (player.y || 580) - 150, 'crit');
          }
          return true;
        }
        player.startAttack('elbow_strike', 0.44, 175);
        if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText('🛡️ ĐẬP MÉP KHIÊN HỔ PHÙ!', player.x, (player.y || 580) - 150, 'dodge');
        }
        return true;
      },
      onAttackHit(attacker, defender, attackData, combatSystem, hitCtx) {
        if (attackData && attackData.isKick && defender && !defender.isDead) {
          defender.speedMul = 0.7;
          defender.slowTimer = 2.0;
          if (window.game && Array.isArray(window.game.enemies)) {
            window.game.enemies.forEach((e) => {
              if (e && !e.isDead && Math.hypot(e.x - defender.x, e.y - defender.y) < 150) {
                e.speedMul = 0.7;
                e.slowTimer = 2.0;
              }
            });
          }
          if (window.effectManager) {
            window.effectManager.createShockRing(defender.x, defender.y || 580, '#f59e0b');
            window.effectManager.addFloatingText('CHẤN ĐỊA (-30% TỐC)', defender.x, defender.y - 135, 'stale');
          }
        }
        if (hitCtx && hitCtx.isCrossCombo && defender && !defender.isDead) {
          defender.hp = Math.max(0, defender.hp - 24);
          if (defender.hp <= 0) {
            defender.isDead = true;
            defender.isAttacking = false;
            if (typeof defender.setState === 'function') defender.setState('knockdown', 1.0);
          }
          if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText('🔨 TRỌNG CHÙY BỒI ĐỊA (+24)!', defender.x, (defender.y || 580) - 155, 'crit');
          }
        }
        if (hitCtx && hitCtx.effectiveMove === 'wk' && typeof attacker.guardGauge === 'number') {
          attacker.guardGauge = Math.min(attacker.maxGuardGauge || 100, attacker.guardGauge + 15);
        }
        if (hitCtx && hitCtx.effectiveMove === 'elbow_strike' && defender && !defender.isDead) {
          if (combatSystem && typeof combatSystem.applyStun === 'function') {
            combatSystem.applyStun(defender, true, 0.9, 18);
          } else {
            defender.stunTimer = Math.max(defender.stunTimer || 0, 0.9);
          }
        }
      }
    },

    // =========================================================================
    // 7. TUYỆT KỸ THỰC CHIẾN (ULTIMATE: LÔI HỎA PHÁ TRẬN)
    // =========================================================================
    ultimateRuntime: {
      type: 'bash',
      cinematic: {
        title: 'TRIỆU ĐÌNH AN',
        ult: 'LÔI HỎA PHÁ TRẬN',
        color: '#f59e0b',
        accent: '#facc15',
        style: 'thunder',
        duration: 1.15
      },
      execute(player, st, dt, enemies, { p, hitEnemy }) {
        if (p < 0.6) {
          player.vx = player.facing * 760;
          if (window.effectManager) {
            if (Math.random() < 0.75) window.effectManager.addGhostTrail(player, 'rgba(250, 204, 21, 0.85)');
            if (Math.random() < 0.45) window.effectManager.createSonicBoomCone(player.x + player.facing * 40, player.y - 50, player.facing, '#f59e0b');
            if (Math.random() < 0.4) window.effectManager.createLightningArc(player.x - player.facing * 20, player.y - 45, player.x + player.facing * 55, player.y - 45, '#facc15');
          }
          let bashIdx = 0;
          for (const e of enemies) {
            if (e.isDead) continue;
            const inReach = (Math.abs(e.x - player.x) < 145 && Math.abs(e.y - player.y) < 70) || player.hitTargets.has(e.id);
            if (inReach) {
              const isFirst = !player.hitTargets.has(e.id);
              player.hitTargets.add(e.id);
              e.x = player.x + player.facing * (52 + bashIdx * 12);
              e.y = player.y;
              e.vx = player.vx;
              e.vz = 0;
              e.z = 0;
              e.state = 'hurt';
              e.stateTimer = 0;
              e.stateDuration = 0.35;
              bashIdx++;

              if (isFirst) {
                hitEnemy(e, 85, 3, false);
                if (window.effectManager) {
                  window.effectManager.triggerScreenShake(12, 0.25);
                  window.effectManager.createHitSparks(e.x, e.y - 60, 10, true);
                  window.effectManager.createShockRing(e.x, e.y, '#f59e0b');
                }
                if (window.audioManager) window.audioManager.playBlock();
              }
            }
          }
        } else if (!player._ultHitDone) {
          player._ultHitDone = true;
          player.vx = 0;
          const impactX = player.x + player.facing * 50;
          if (window.effectManager) {
            window.effectManager.createThunderStrike(impactX, player.y, '#facc15');
            window.effectManager.createUltimateBlast(impactX, player.y - 40, { primary: '#f97316', secondary: '#fef08a', flash: '#facc15' });
            window.effectManager.createSacredDome(impactX, player.y, 175, 0.52);
            window.effectManager.createGroundCrack(impactX, player.y, 180, '#f59e0b');
            window.effectManager.createDust(impactX, player.y, 30, 200);
            window.effectManager.triggerScreenShake(26, 0.65);
            window.effectManager.triggerFlash('#facc15', 0.7);
          }
          if (window.audioManager) {
            window.audioManager.playHeavyHit();
            window.audioManager.playGong(0.85);
          }
          for (const e of enemies) {
            if (!e.isDead && (Math.abs(e.x - impactX) < 230 || player.hitTargets.has(e.id))) {
              hitEnemy(e, 310, 26, true);
            }
          }
        } else {
          player.vx = 0;
        }
        if (p >= 1 || player.stateTimer >= player.stateDuration) {
          player.hitTargets.clear();
          player.setState('idle');
        }
      }
    },

    // =========================================================================
    // 8. HỖ TRỢ ĐỒNG MINH CHI VIỆN (ALLY SYSTEM)
    // =========================================================================
    ally: {
      profile: {
        id: 'dinhan',
        name: 'Triệu Đình An',
        title: 'Cận Vệ Thiết Bích',
        icon: '🛡️',
        role: 'Khiên Hộ Vệ & Cản Bước',
        roleColor: '#d97706',
        styleType: 'boss_dinhan',
        speed: 180,
        dmg: 74,
        hp: 1250,
        quote: 'Có ta đứng trước, chủ nhân cứ yên tâm mà tiến.',
        activeSkill: {
          name: 'Kim Cương Hộ Thuẫn',
          cd: '4.5s',
          desc: 'Tạo lá chắn năng lượng bọc quanh người chơi, hấp thụ 100 sát thương bảo hộ kiên cố.'
        },
        passiveAura: {
          name: 'Khiêu Khích Thiết Bích',
          desc: 'Thu hút sự chú ý của kẻ địch và boss về phía Đình An trong 2.5s để người chơi an tâm phản công.'
        },
        coopSkill: {
          name: 'Thiết Bích Thần Chùy',
          desc: 'Đập chùy kết hợp quyền cước gây sát thương và xô dạt đối thủ.'
        }
      },
      coopBaseDamage: 240,
      modifyDamageTaken(ally, amount) {
        return Math.round(amount * 0.85);
      },
      onUpdate(ally, dt, player, enemies) {
        if (player && (!player.shieldHp || player.shieldHp <= 0)) {
          player.shieldHp = 100;
          if (window.effectManager) {
            window.effectManager.addFloatingText('LÁ CHẮN 100 HP!', player.x, player.y - 165, 'heal');
            window.effectManager.createShockRing(player.x, player.y, '#f59e0b');
          }
        }
        if (ally.specialTimer >= 4.5) {
          ally.specialTimer = 0;
          if (window.effectManager) {
            window.effectManager.createShockRing(ally.x, ally.y, '#d97706');
            window.effectManager.addFloatingText('KHIÊU KHÍCH HỘ VỆ!', ally.x, ally.y - 150, 'warn');
          }
          (enemies || []).forEach((e) => {
            if (!e.isDead && Math.hypot(e.x - ally.x, e.y - ally.y) < 320) {
              e.target = ally;
              const isBossE = !!(e.isBoss || String(e.type || '').startsWith('boss_'));
              if (isBossE) {
                e.takeDamage(15, 0, false);
              } else {
                e.takeDamage(35, Math.sign(e.x - ally.x) * 5, false);
                if (typeof e.setState === 'function') e.setState('hurt', 0.4);
              }
            }
          });
        }
      },
      onBasicAttack(ally, target, dmg, isBossTarget) {
        target.takeDamage(dmg, isBossTarget ? 0 : ally.facing * 8, !isBossTarget);
        if (!isBossTarget && typeof target.setState === 'function') target.setState('knockdown', 1.2);
        if (window.audioManager) window.audioManager.playExplosion();
        if (window.effectManager) {
          window.effectManager.createShockRing(target.x, target.y, '#d4a017');
          window.effectManager.addFloatingText('XUNG KÍCH!', target.x, target.y - 140, 'crit');
        }
      }
    }
  });
})();

