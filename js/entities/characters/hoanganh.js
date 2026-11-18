/**
 * NHÂN VẬT: PHÓ ĐẶNG HOÀNG ANH
 * js/entities/characters/hoanganh.js
 * Chứa toàn bộ: Hồ sơ, UI chọn tướng, Ngoại hình, Hoạt ảnh Cuốc Sắt & Bát Quái Cước, Chỉ số sát thương, Nội tại, Tuyệt kỹ & Đồng minh.
 */

(function () {
  function hoeArms(P, torso, upper, fore, shaft) {
    P.nA = upper - torso;
    P.nE = fore - upper;
    P.grip = shaft - fore;
    P.fA = P.nA;
    P.fE = P.nE;
  }

  window.CharacterRegistry.register({
    id: 'hoanganh',
    uiSlotOrder: 4,

    // =========================================================================
    // 1. NGOẠI HÌNH & TRANG PHỤC (STYLE_DEFS)
    // =========================================================================
    appearance: {
      styleKey: 'boss_hoanganh',
      style: {
        scale: 1.32,
        archetype: 'mountain_guardian',
        rig: {
          shW: 14.4, waW: 11.2, hipW: 12.4, chestOut: 15.8,
          thighLen: 24.5, calfLen: 25, armUpper: 19, armFore: 18,
          spineH: 34, neckLen: 13.8, nShX: -5.8, nShY: -2.5, fShX: 5.6, fShY: -1.8,
          hipHalf: 4.9, footPad: 4, headScale: 0.82, limbBulk: 1.15, armBulk: 1.10
        },
        baggyPants: true,
        skin: '#c99468',
        hair: '#1f1812',
        hairStyle: 'hoanganh_buzz',
        jawStyle: 'rugged_square',
        stubbleJaw: true,
        gi: '#5c5b3e',
        pants: '#3f3e29',
        belt: '#991b1b',
        wovenHat: true,
        mountainWraps: true,
        sleeveless: true,
        weapon: 'hoe',
        scar: true,
        aura: '#f59e0b',
        under: '#2f2e1f',
        wrapColor: '#6b4226',
        shoes: 'shin_wraps',
        eyeColor: '#d97706'
      }
    },

    // =========================================================================
    // 2. HỒ SƠ CỐT TRUYỆN (ROSTER DOSSIER)
    // =========================================================================
    dossier: {
      id: 'hoanganh',
      name: 'Phó Đặng Hoàng Anh',
      title: 'TRẤN THỦ THẬP VẠN ĐẠI SƠN',
      faction: 'pho',
      styleType: 'boss_hoanganh',
      portrait: 'boss_hoanganh',
      playable: true,
      role: 'Võ sĩ trấn thủ Thập Vạn Đại Sơn — đối trọng với tốc độ của Ngô Nhất Nghị.',
      motive: 'Bảo vệ gia đình, vùng đất và di nguyện của người đã khuất. Không vì tiền thưởng, không vì danh tiếng.',
      bio: 'Hoàng Anh sống bằng luật của núi: ai bước qua ranh giới, người đó phải trả giá. Hắn biết hồ sơ bí mật nằm trong tay ai, và hắn không định giao nó cho bất kỳ ai đang ra lệnh từ xa.',
      fightingStyle: 'Chậm nhưng mạnh, tầm đánh rộng, đỡ đòn và phản công, đòn nặng rung mặt đất, gián đoạn combo thiếu tính toán. Vũ khí nhận diện: cây cuốc sắt đặc chế.',
      strengths: 'Sức mạnh vượt trội, kiểm soát khoảng cách, super armor với đòn nhẹ, AoE mặt đất bắt buộc phải nhảy.',
      weaknesses: 'Sau mỗi đòn rộng là khoảng trống rõ ràng — đọc nhịp và phản công đúng lúc là con đường thắng.',
      skills: [
        { name: 'Quét Cuốc Ngang', desc: 'Tầm rộng lớn, telegraph rõ, lùi lại là né được.' },
        { name: 'Đập Mặt Đất', desc: 'Rung động AoE — chỉ an toàn khi đang ở trên không.' },
        { name: 'Chuỗi Liên Hoàn Nặng', desc: 'Giai đoạn 3: 3 đòn liên tiếp, mỗi đòn đều báo trước.' },
        { name: 'Xem Nhẹ Đòn Nhẹ', desc: 'Super armor: đòn thường gây 50% và không làm hắn chùn bước.' }
      ],
      ultimate: { name: 'THỔNG SƠN CHÙY', desc: 'Nện cuốc xuống đất: sóng xung kích 2 bên + knockdown diện rộng.' },
      stats: { power: 5, speed: 2, defense: 5, technique: 3, range: 5 },
      relations: [
        { who: 'Ngô Nhất Nghị', rel: 'Đối trọng phong cách: nặng vs nhanh' },
        { who: 'Phó Mộc Đăng', rel: 'Cùng họ nhưng khác cách nhìn về hồ sơ' },
        { who: 'Hứa Vũ Đại', rel: 'Không tin một lời nào từ mạng lưới ngầm' }
      ],
      events: [
        'Hồi III: Đối đầu Nghị trên núi — bước ngoặt về lựa chọn',
        'Chọn "Ở lại nghe sự thật" sẽ mở Kết Thức Chân Tướng'
      ],
      unlock: { type: 'stage', stage: 8, text: 'Hoàn thành Hồi III (Màn 8 — Thập Vạn Đại Sơn)' }
    },

    // =========================================================================
    // 3. THẺ CHỌN NHÂN VẬT (CHAR_SLOTS UI)
    // =========================================================================
    uiSlot: {
      id: 'hoanganh',
      slotName: 'PHÓ ĐẶNG HOÀNG ANH',
      fullName: 'PHÓ ĐẶNG HOÀNG ANH',
      title: 'TRẤN THỦ THẬP VẠN ĐẠI SƠN',
      tagline: 'Hùng cứ đại sơn — Cuốc sắt bạt địa',
      element: '⛰️',
      color: '#f59e0b',
      image: 'assets/images/characters/char_hoanganh.png',
      vovinamImage: 'assets/images/characters/char_hoanganh_vovinam.png',
      bio: 'Trấn thủ Thập Vạn Đại Sơn, sống theo luật của núi rừng. Sức mạnh bẩm sinh dời non lấp bể, coi nhẹ những đòn tấn công tầm thường của kẻ địch.',
      stats: { power: 100, speed: 55, defense: 90, technique: 70 },
      skills: [
        { key: 'J / K', icon: '⛏️', name: 'Thiết Cuốc Trảm', desc: 'Quét cuốc sắt ngang người với phạm vi cực rộng.' },
        { key: 'L', icon: '🛡️', name: 'Bá Thể Sơn Cước', desc: 'Super Armor: không bị ngắt chiêu bởi đòn đánh nhẹ.' },
        { key: 'U+J / U+K', icon: '🌋', name: 'Đập Nát Địa Tầng', desc: 'Nện cuốc xuống đất tạo sóng xung kích chấn động sàn đấu.' },
        { key: 'I', icon: '💥', name: 'Thống Sơn Đại Chùy', desc: 'Tuyệt kỹ: bổ trời giáng đất chấn nổ toàn bộ khu vực.' }
      ],
      passives: [
        { icon: '⛰️', name: 'Thập Vạn Sơn Lực', type: 'BỊ ĐỘNG', desc: 'Bá Thể Sơn Cước: miễn nhiễm hoàn toàn trạng thái khựng từ đòn thường; tăng 25% công kích.' },
        { icon: '⛏️', name: 'Cuốc Sắt Càn Quét', type: 'BỊ ĐỘNG', desc: 'Tầm đánh càn quét (Cleave AoE) tăng 50%, chém trúng toàn bộ kẻ địch trong diện tích quét.' },
        { icon: '🌋', name: 'Đập Nát Địa Tầng', type: 'CHỦ ĐỘNG [U+J]', desc: 'Nện cuốc xuống nền đất tạo chấn địa rung chuyển toàn sân, quật ngã kẻ địch dưới mặt đất.' },
        { icon: '🌿', name: 'Nham Thạch Hồi Phục', type: 'BỊ ĐỘNG', desc: 'Đứng yên 2s không nhận đòn sẽ bắt đầu hồi phục 25 HP mỗi giây cho đến khi đầy bình.' }
      ],
      mechanic: 'Super Armor bá thể — AoE mặt đất — Tầm đánh càn quét.',
      quote: '“Bước qua ranh giới núi rừng này, ngươi phải để mạng lại!”'
    },

    // =========================================================================
    // 4. CHỈ SỐ CHIẾN ĐẤU, ĐÒN ĐÁNH & FINISHER
    // =========================================================================
    combat: {
      hp: 1100,
      speed: 195,
      runSpeed: 310,
      jumpForce: 480,
      damage: 1.30,
      reach: 1.15,
      knockback: 1.3,
      energyGain: 0.95,
      attackDurationMul: 1.26,
      maxKickCooldown: 0.38,
      finisher: 'heavy',
      ultimateState: 'ultimate_slam',
      ultimateType: 'slam',
      superArmor: true,
      armorThreshold: 40,
      mechanic: 'Super armor + AoE mặt đất + tầm đánh rộng'
    },

    moveOverrides: {},

    finisher: {
      state: 'boss_slam',
      dur: 0.75,
      lunge: 190,
      shake: true,
      attack: {
        damage: 130,
        offsetX: 70,
        offsetY: -80,
        width: 106,
        height: 72,
        knockback: 300,
        knockdown: true,
        weight: 'ultimate',
        energyGain: 20,
        unblockable: true
      }
    },

    // =========================================================================
    // 5. HOẠT ẢNH XƯƠNG ĐẶC TRƯNG (CUỐC SẮT & THÁI CỰC BÁT QUÁI CƯỚC)
    // =========================================================================
    animation: {
      signatureStates: ['ultimate_slam', 'boss_thrust', 'boss_chain1', 'boss_chain2', 'boss_chain3'],
      trailProfile: {
        primary: '#f97316',
        secondary: '#fbbf24',
        core: '#fef3c7',
        width: 14,
        dual: false,
        dodgeGhost: 'rgba(249, 115, 22, 0.48)'
      },
      skillCatalog: [
        { id: 'punch_straight', input: 'J', name: 'Quét Cuốc Thổ Địa', dur: 0.34, category: 'combo' },
        { id: 'punch_hook', input: 'J → J', name: 'Phang Cuốc Đại Lực', dur: 0.42, category: 'combo' },
        { id: 'kick_push', input: 'K', name: 'Đá Đạp Núi Lở', dur: 0.52, category: 'combo' },
        { id: 'kick_roundhouse', input: 'K → K', name: 'Thái Cực Bát Quái Cước', dur: 0.60, category: 'combo' },
        { id: 'wk', input: 'W + K', name: 'Sơn Thần Xung Cước', dur: 0.52, category: 'special' },
        { id: 'uppercut', input: 'W + J', name: 'Hất Cuốc Khai Thạch', dur: 0.52, category: 'special' },
        { id: 'elbow_strike', input: 'S + J', name: 'Thúc Cán Thiết Cuốc', dur: 0.46, category: 'special' },
        { id: 'kick_sweep', input: 'S + K', name: 'Quét Trụ Sơn Cước', dur: 0.66, category: 'special' },
        { id: 'hook_run', input: 'Shift + J', name: 'Càn Quét Bão Bụi', dur: 0.48, category: 'special' },
        { id: 'air_punch', input: 'Space + J', name: 'Giáng Chùy Sơn Nhạc', dur: 0.38, category: 'aerial' },
        { id: 'flying_kick', input: 'Space + K', name: 'Phi Cước Trấn Sơn', dur: 0.55, category: 'aerial' },
        { id: 'dodge', input: 'L', name: 'Lao Vai Độc Ngưu', dur: 0.28, category: 'defense' },
        { id: 'counter_hand_strike', input: 'U + J', name: 'Phản Đòn: Bổ Cuốc Liệt Địa', dur: 0.42, category: 'counter' },
        { id: 'counter_leg_strike', input: 'U + K', name: 'Phản Đòn: Quét Cước Trấn Đá', dur: 0.48, category: 'counter' },
        { id: 'boss_slam', input: 'Finisher', name: 'Khai Sơn Phá Thạch', dur: 0.75, category: 'finisher' },
        { id: 'ultimate_slam', input: 'I', name: 'Tuyệt Kỹ: Thống Sơn Đại Chùy', dur: 1.25, category: 'ultimate' }
      ],
      initPose(P, { hasHoe }) {
        if (hasHoe) {
          P.grip = 1.16;
          P.nA = 0.44;
          P.nE = 0.64;
          P.fA = 0.44;
          P.fE = 0.64;
        }
      },
      poses: {
        idle(P, { t, hasHoe }) {
          if (!hasHoe) return false;
          const b = Math.sin(t * 2.2);
          P.torso = 0.06 + 0.012 * b;
          P.head = -0.02;
          P.nT = 0.46 + 0.015 * b; P.nS = -0.58 - 0.015 * b;
          P.fT = -0.40 - 0.015 * b; P.fS = 0.14 + 0.015 * b;
          P.lift = Math.sin(t * 2.2) * 0.9;
          hoeArms(P, P.torso, 0.46 + 0.02 * b, 1.16, 2.52 + 0.03 * b);
          P.hx = Math.sin(t * 1.1) * 0.6;
          return true;
        },
        walk(P, { e, t, hasHoe }) {
          if (!hasHoe) return false;
          const isBackpedal = (e.vx * (e.facing || 1) < -10);
          const dir = isBackpedal ? -1 : 1;
          const c = t * 6.5 * dir;
          const s = Math.sin(c), co = Math.cos(c);
          P.torso = isBackpedal ? 0.10 : 0.20;
          P.nT = 0.25 + 0.52 * s; P.nS = -(0.3 + 0.85 * Math.max(0, co));
          P.fT = 0.25 - 0.52 * s; P.fS = -(0.3 + 0.85 * Math.max(0, -co));
          hoeArms(P, P.torso, 0.62 + 0.05 * s, 1.2, 2.34 + 0.06 * s);
          return true;
        },
        run(P, { t, hasHoe }) {
          if (!hasHoe) return false;
          const c = t * 14, s = Math.sin(c), co = Math.cos(c);
          P.torso = 0.42; P.head = -0.2;
          P.nT = 0.2 + 0.95 * s; P.nS = -(0.3 + 1.25 * Math.max(0, co));
          P.fT = 0.2 - 0.95 * s; P.fS = -(0.3 + 1.25 * Math.max(0, -co));
          P.nF = -0.5 * Math.max(0, co); P.fF = -0.5 * Math.max(0, -co);
          hoeArms(P, P.torso, 0.48 + 0.08 * s, 1.15, 2.28 + 0.08 * s);
          return true;
        },
        jump_up(P, { hasHoe }) {
          if (!hasHoe) return false;
          P.torso = 0.1;
          P.nT = 1.0; P.nS = -1.7; P.fT = 0.35; P.fS = -1.1; P.nF = -0.5; P.fF = -0.5;
          hoeArms(P, P.torso, 0.72, 1.32, 2.48);
          return true;
        },
        jump_fall(P, { hasHoe }) {
          if (!hasHoe) return false;
          P.torso = 0.05;
          P.nT = 0.5; P.nS = -0.3; P.fT = -0.3; P.fS = -0.15;
          hoeArms(P, P.torso, 0.55, 1.18, 2.32);
          return true;
        },
        guard(P, { hasHoe }) {
          if (!hasHoe) return false;
          P.torso = 0.24; P.head = -0.08;
          P.nT = 0.85; P.nS = -1.2; P.fT = -0.7; P.fS = 0.22;
          hoeArms(P, P.torso, 0.72, 1.38, 2.55);
          return true;
        },
        punch_straight(P, { style, mix }) {
          if (!style || style.weapon !== 'hoe') return false;
          P.torso = mix(0.18, -0.18, 0.46);
          P.head = mix(-0.06, 0.06, -0.12);
          P.hx = mix(0, -4, 8);
          hoeArms(P, P.torso, mix(0.58, 0.28, 1.18), mix(1.22, 0.92, 1.38), mix(2.38, 2.05, 1.56));
          P.nT = mix(0.76, 0.55, 1.12); P.nS = mix(-0.98, -0.72, -1.22);
          P.fT = mix(-0.68, -0.82, -0.35); P.fS = mix(0.22, 0.15, 0.1);
          return true;
        },
        punch_hook(P, { style, mix }) {
          if (!style || style.weapon !== 'hoe') return false;
          P.torso = mix(0.18, -0.32, 0.48);
          P.head = mix(-0.06, 0.1, -0.14);
          P.hx = mix(0, -6, 8);
          hoeArms(P, P.torso, mix(0.58, 1.72, 0.88), mix(1.22, 1.98, 1.05), mix(2.38, 3.08, 1.38));
          P.nT = mix(0.76, 0.62, 1.14); P.nS = mix(-0.98, -0.85, -1.18);
          P.fT = mix(-0.68, -0.78, -0.35); P.fS = mix(0.22, 0.2, 0.12);
          return true;
        },
        air_punch(P, { mix, hasHoe }) {
          if (!hasHoe) return false;
          P.torso = mix(0.18, -0.12, 0.56);
          P.head = -0.18;
          P.nT = 1.15; P.nS = -1.85; P.fT = 0.25; P.fS = -1.1;
          hoeArms(P, P.torso, mix(0.65, 1.85, 0.85), mix(1.25, 2.05, 1.0), mix(2.38, 3.05, 1.38));
          return true;
        },
        hook_run(P, { mix, hasHoe }) {
          if (!hasHoe) return false;
          P.torso = mix(0.28, -0.32, 0.68);
          P.hx = mix(0, -6, 10);
          P.nT = mix(0.7, 0.45, 1.15); P.nS = mix(-0.9, -0.7, -1.25);
          P.fT = mix(-0.6, -0.85, -0.95); P.fS = mix(0.2, 0.25, 0.3);
          hoeArms(P, P.torso, mix(0.6, 1.8, 0.92), mix(1.22, 2.0, 1.08), mix(2.38, 3.12, 1.36));
          return true;
        },
        kick_push(P, { U, ex, mix, hasHoe }) {
          if (!hasHoe) return false;
          P.torso = mix(0.14, 0.22, -0.42);
          P.hx = mix(0, 2, -4);
          P.nT = mix(0.62, 1.3, 1.55); P.nS = mix(-0.82, -2.2, -0.05);
          P.fT = mix(-0.55, -0.2, -0.1); P.fS = mix(0.15, 0.1, 0.0);
          hoeArms(P, P.torso, mix(0.58, 0.72, 0.35), mix(1.22, 1.35, 1.05), mix(2.38, 2.55, 2.15));
          P.nF = U.lerp(0, P.nT + P.nS, ex);
          return true;
        },
        kick_roundhouse(P, { U, ex, mix, hasHoe }) {
          if (!hasHoe) return false;
          // Beat 3 Sơn Cước: Vác cuốc sát vai sau lấy đối trọng -> Quét gót núi lở tầm cao
          P.torso = mix(0.18, -0.22, -0.45);
          P.lift = -6 * ex;
          P.hx = mix(0, 2, -2);
          P.nT = mix(0.62, 1.05, 1.72); P.nS = mix(-0.82, -1.85, 0.04);
          P.fT = mix(-0.55, -0.35, -0.22); P.fS = mix(0.15, 0.25, 0.12);
          hoeArms(P, P.torso, mix(0.58, 0.42, 0.18), mix(1.22, 1.1, 0.85), mix(2.38, 2.3, 1.85));
          P.nF = U.lerp(0, P.nT + P.nS - Math.PI / 2, ex);
          return true;
        },
        wk(P, { U, p, hasHoe }) {
          if (!hasHoe) return false;
          // W + K: Sơn Thần Xung Cước — khoác thiết cuốc chéo vai lao người đạp tung vách đá
          const s = U.stage5(p, { a: 0.18, c: 0.38, i: 0.60, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.7);
          P.torso = U.lerp(0.12, 0.32, ex);
          P.lift = 4 * s.windup - 6 * ex;
          P.hx = -3 * s.windup + 8 * ex;
          P.nT = U.lerp(0.65, 1.44, ex); P.nS = U.lerp(-1.55, 0.02, ex); P.nF = 0.36 * ex;
          P.fT = -0.52; P.fS = 0.16;
          hoeArms(P, P.torso, U.lerp(0.58, 0.28, ex), U.lerp(1.22, 0.88, ex), U.lerp(2.38, 1.78, ex));
          return true;
        },
        flying_kick(P, { U, p, hasHoe }) {
          if (!hasHoe) return false;
          const f = U.clamp(p * 7);
          P.torso = U.lerp(0.1, -0.6, f);
          P.nT = U.lerp(1.0, 1.6, f); P.nS = U.lerp(-1.7, 0.05, f);
          P.fT = U.lerp(0.35, 0.25, f); P.fS = U.lerp(-1.1, -1.8, f);
          hoeArms(P, P.torso, U.lerp(0.6, 0.2, f), U.lerp(1.2, 0.9, f), U.lerp(2.38, 2.0, f));
          P.nF = U.lerp(0, P.nT + P.nS - Math.PI / 2, f);
          return true;
        },
        elbow_strike(P, { mix, hasHoe }) {
          if (!hasHoe) return false;
          P.torso = mix(0.14, -0.10, 0.28);
          P.hx = mix(0, -3, 6);
          P.nT = mix(0.62, 0.7, 0.86); P.nS = mix(-0.82, -0.95, -0.78);
          P.fT = mix(-0.55, -0.6, -0.78); P.fS = mix(0.15, 0.2, 0.28);
          hoeArms(P, P.torso, mix(0.58, 0.20, 1.42), mix(1.22, 0.90, -0.45), mix(2.38, 2.55, 1.48));
          return true;
        },
        kick_sweep(P, { mix, hasHoe }) {
          if (!hasHoe) return false;
          P.lift = mix(0, 16, 21);
          P.torso = mix(0.14, 0.48, 0.62);
          P.head = mix(-0.05, -0.15, -0.32);
          P.hx = mix(0, 4, -6);
          P.fT = mix(-0.55, 1.25, 1.4); P.fS = mix(0.15, -2.35, -2.5); P.fF = mix(0, 0.15, 0.25);
          P.nT = mix(0.62, 1.52, 1.62); P.nS = mix(-0.82, -0.05, 0.0);
          P.nF = -0.45;
          hoeArms(P, P.torso, mix(0.58, 0.8, 0.95), mix(1.22, 1.3, 1.4), mix(2.38, 2.2, 2.0));
          return true;
        },
        uppercut(P, { mix, hasHoe }) {
          if (!hasHoe) return false;
          P.lift = mix(0, 9, -15);
          P.torso = mix(0.14, 0.38, -0.24);
          P.head = mix(-0.05, 0.12, -0.28);
          P.hx = mix(0, -3, 6);
          P.nT = mix(0.62, 0.98, 0.18); P.nS = mix(-0.82, -1.6, -0.25);
          P.fT = mix(-0.55, -0.75, -0.25); P.fS = mix(0.15, 0.45, 0.1);
          hoeArms(P, P.torso, mix(0.58, 0.32, 1.78), mix(1.22, 0.55, 1.98), mix(2.38, 1.35, 2.78));
          return true;
        },
        dodge(P, { U, p, hasHoe }) {
          if (!hasHoe) return false;
          const w = U.beat(p, 0.02, 0.96, 0.38);
          P.torso = U.lerp(0.18, 0.56, w); P.head = -0.3 * w; P.lift = 5 * w;
          P.nT = 0.88; P.nS = -1.25; P.fT = -0.68; P.fS = 0.25;
          hoeArms(P, P.torso, 0.42, 1.05, 2.2);
          return true;
        },
        counter_hand_strike(P, { U, p, hasHoe }) {
          if (!hasHoe) return false;
          const s = U.stage5(p, { a: 0.22, c: 0.44, i: 0.64, f: 0.86 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.4 - s.recover * 0.7);
          P.torso = U.lerp(0.18 - 0.32 * s.windup, 0.58, ex);
          P.hx = -5 * s.windup + 10 * ex; P.lift = -4 * s.windup + 5 * ex;
          hoeArms(P, P.torso,
            U.lerp(0.58 + 1.48 * s.windup, 0.82, ex),
            U.lerp(1.22 + 1.08 * s.windup, 1.0, ex),
            U.lerp(2.38 + 0.78 * s.windup, 1.32, ex));
          P.nT = 0.76 + 0.32 * ex; P.nS = -1.0 - 0.3 * ex;
          return true;
        },
        counter_leg_strike(P, { U, p, hasHoe }) {
          if (!hasHoe) return false;
          const s = U.stage5(p, { a: 0.20, c: 0.42, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.4 - s.recover * 0.68);
          P.torso = U.lerp(0.24, -0.52, ex);
          P.nT = U.lerp(0.7, 1.88, ex); P.nS = U.lerp(-1.1, 0.04, ex);
          P.fT = -0.55; P.fS = 0.22;
          hoeArms(P, P.torso, 0.5, 1.15, 2.25);
          return true;
        },
        jump(P, { hasHoe }) {
          if (!hasHoe) return false;
          P.torso = -0.14; P.head = -0.08;
          P.nT = 1.15; P.nS = -1.85; P.fT = -0.4; P.fS = -1.0;
          hoeArms(P, P.torso, 0.52, 1.18, 2.28);
          return true;
        },
        landing(P, { hasHoe }) {
          if (!hasHoe) return false;
          P.torso = 0.10;
          P.head = 0.04;
          P.lift = 0;
          P.nT = 0.62; P.nS = -0.80; P.fT = -0.55; P.fS = 0.18;
          hoeArms(P, P.torso, 0.54, 1.18, 2.34);
          return true;
        },
        counter_hand_prep(P, { t, hasHoe }) {
          if (!hasHoe) return false;
          const sw = Math.sin(t * 7.5);
          P.torso = 0.18 + 0.02 * sw; P.head = -0.05;
          P.hx = sw * 1.5;
          P.nT = 0.72; P.nS = -1.05; P.fT = -0.6; P.fS = 0.22;
          hoeArms(P, P.torso, 0.68 + 0.04 * sw, 1.32, 2.48 + 0.04 * sw);
          return true;
        },
        counter_leg_prep(P, { t, hasHoe }) {
          if (!hasHoe) return false;
          const sw = Math.sin(t * 7.5);
          P.torso = 0.28 + 0.02 * sw; P.head = -0.1;
          P.lift = 4 + 1.2 * sw;
          P.hx = sw * 1.2;
          P.nT = 0.95; P.nS = -1.45; P.fT = -0.68; P.fS = 0.35;
          hoeArms(P, P.torso, 0.55 + 0.04 * sw, 1.18, 2.30 + 0.04 * sw);
          return true;
        },
        ultimate_slam(P, { e, U, hasHoe }) {
          const airborne = (e.z || 0) < -2;
          if (airborne && (e.vz || 0) > 60) {
            P.torso = -0.22; P.head = 0.12;
            P.nT = 1.1; P.nS = -1.8; P.fT = 0.5; P.fS = -1.3; P.nF = -0.4; P.fF = -0.4;
            if (hasHoe) hoeArms(P, P.torso, 2.05, 2.35, 3.12);
            else { P.nA = 2.65; P.nE = 0.35; P.fA = 2.45; P.fE = 0.4; }
          } else if (airborne) {
            P.torso = 0.58; P.head = -0.22;
            P.nT = 0.5; P.nS = -0.2; P.fT = -0.3; P.fS = -0.1;
            if (hasHoe) hoeArms(P, P.torso, 0.92, 1.12, 1.42);
            else { P.nA = 0.55; P.nE = 0.2; P.fA = 0.45; P.fE = 0.25; }
          } else {
            const k = U.clamp(((e.stateTimer || 0) - (e._slamAt || 0)) / 0.5);
            const crouch = 1 - U.easeInOut(k);
            P.torso = 0.18 + 0.46 * crouch; P.head = -0.12 * crouch;
            P.nT = 0.72 + 0.58 * crouch; P.nS = -0.92 - 1.05 * crouch;
            P.fT = -0.62 + 0.78 * crouch; P.fS = 0.2 - 1.15 * crouch;
            if (hasHoe) {
              hoeArms(P, P.torso, 0.58 + 0.24 * crouch, 1.22 - 0.18 * crouch, 2.38 - 1.02 * crouch);
            } else {
              P.nA = 0.7 - 0.45 * crouch; P.nE = 1.8 - 1.45 * crouch;
              P.fA = 0.35 - 0.15 * crouch; P.fE = 1.95 - 1.55 * crouch;
            }
            P.hx = 5 * crouch;
          }
          return true;
        },
        boss_swing(P, { U, p, hasHoe }) {
          if (!hasHoe) return false;
          const u = U.cham(p), d = U.ext(p);
          P.torso = U.lerp(U.lerp(0.18, -0.34, u), 0.5, d);
          P.head = U.lerp(-0.06, 0.12, d);
          P.lift = U.lerp(U.lerp(0, -2, u), 3, d);
          P.hx = U.lerp(U.lerp(0, -8, u), 10, d);
          hoeArms(P, P.torso,
            U.lerp(U.lerp(0.58, 1.82, u), 0.88, d),
            U.lerp(U.lerp(1.22, 2.05, u), 1.06, d),
            U.lerp(U.lerp(2.38, 3.12, u), 1.38, d));
          P.nT = U.lerp(U.lerp(0.76, 0.6, u), 1.02, d); P.nS = U.lerp(U.lerp(-0.98, -0.8, u), -1.25, d);
          P.fT = U.lerp(U.lerp(-0.68, -0.85, u), -0.35, d); P.fS = U.lerp(U.lerp(0.22, 0.3, u), 0.12, d);
          return true;
        },
        boss_slam(P, { U, p, hasHoe }) {
          if (!hasHoe) return false;
          const u = U.cham(p), d = U.ext(p);
          P.torso = U.lerp(U.lerp(0.18, -0.28, u), 0.58, d);
          P.head = U.lerp(-0.06, 0.16, d);
          P.lift = U.lerp(U.lerp(0, -5, u), 4, d);
          P.hx = U.lerp(U.lerp(0, -4, u), 9, d);
          hoeArms(P, P.torso,
            U.lerp(U.lerp(0.58, 2.05, u), 0.85, d),
            U.lerp(U.lerp(1.22, 2.28, u), 1.02, d),
            U.lerp(U.lerp(2.38, 3.15, u), 1.35, d));
          P.nT = U.lerp(U.lerp(0.76, 0.52, u), 1.05, d); P.nS = U.lerp(U.lerp(-0.98, -0.6, u), -1.32, d);
          P.fT = U.lerp(U.lerp(-0.68, -0.35, u), -0.48, d); P.fS = U.lerp(U.lerp(0.22, 0.12, u), 0.2, d);
          return true;
        },
        boss_thrust(P, { mix, hasHoe }) {
          P.torso = mix(0.18, -0.15, 0.46);
          P.hx = mix(0, -4, 8);
          if (hasHoe) {
            hoeArms(P, P.torso, mix(0.58, 0.3, 1.22), mix(1.22, 0.95, 1.42), mix(2.38, 2.02, 1.56));
          } else {
            P.nA = mix(0.7, -0.2, 1.38); P.nE = mix(1.8, 1.6, 0.1);
            P.fA = mix(0.35, -0.1, 1.25); P.fE = mix(1.95, 1.7, 0.15);
          }
          P.nT = mix(0.7, 0.45, 1.15); P.nS = mix(-0.9, -0.6, -1.35);
          P.fT = mix(-0.6, -0.85, -0.2); P.fS = mix(0.2, 0.1, 0.05);
          return true;
        },
        boss_chain1(P, { mix, hasHoe }) {
          P.torso = mix(0.18, -0.32, 0.48);
          P.hx = mix(0, -6, 8);
          if (hasHoe) {
            hoeArms(P, P.torso, mix(0.58, 1.78, 0.92), mix(1.22, 2.02, 1.08), mix(2.38, 3.12, 1.38));
          } else {
            P.nA = mix(0.7, -0.8, 1.48); P.nE = mix(1.8, 1.6, 0.25);
            P.fA = mix(0.35, 0.8, -0.3); P.fE = 1.9;
          }
          P.nT = mix(0.7, 0.85, 1.2); P.nS = mix(-0.9, -1.3, -0.3);
          P.fT = mix(-0.6, -0.5, -0.3); P.fS = mix(0.2, 0.15, 0.1);
          P.lift = mix(0, -2, 3); P.head = mix(-0.06, 0.1, -0.12);
          return true;
        },
        boss_chain2(P, { mix, hasHoe }) {
          P.torso = mix(0.2, 0.42, -0.22);
          P.hx = mix(0, 4, -3);
          if (hasHoe) {
            hoeArms(P, P.torso, mix(0.58, 0.35, 1.75), mix(1.22, 0.6, 1.98), mix(2.38, 1.32, 2.75));
          } else {
            P.nA = mix(0.7, -0.35, 2.45); P.nE = mix(1.8, 1.95, 0.45);
            P.fA = mix(0.35, 0.75, 0.1); P.fE = 1.9;
          }
          P.nT = mix(0.7, 0.9, 0.4); P.nS = mix(-0.9, -1.3, -0.8);
          P.fT = mix(-0.6, -0.4, -0.8); P.fS = mix(0.2, 0.15, 0.1);
          P.lift = mix(0, -2, 3); P.head = mix(-0.06, 0.15, -0.1);
          return true;
        },
        boss_chain3(P, { U, p, mix, hasHoe }) {
          const u = U.cham(p), d = U.ext(p);
          P.torso = U.lerp(U.lerp(0.18, 0.35, u), -0.35, d);
          P.hx = mix(0, 4, -6);
          if (hasHoe) {
            hoeArms(P, P.torso, U.lerp(0.58, 0.7, Math.max(u, d)), U.lerp(1.22, 1.32, Math.max(u, d)), U.lerp(2.38, 2.55, Math.max(u, d)));
          } else {
            P.nA = U.lerp(0.7, -0.5, d); P.nE = 1.4;
            P.fA = U.lerp(0.35, 1.2, d); P.fE = 1.5;
          }
          P.nT = mix(0.7, 1.1, 0.4); P.nS = mix(-0.9, -1.5, -0.8);
          P.fT = U.lerp(U.lerp(-0.6, -1.0, u), 1.65, d);
          P.fS = U.lerp(U.lerp(0.2, -0.8, u), -0.2, d);
          P.lift = U.lerp(0, 2, u) - 2 * d;
          P.head = U.lerp(-0.06, 0.12, d);
          return true;
        }
      },
      emitSkillVFX(e, st, prevP, p, fx) {
        const cross = (t) => prevP < t && p >= t;
        const dir = e.facing || 1;
        const gx = e.x || 0, gy = e.y || 580;
        if (st === 'dodge' && cross(0.08)) {
          fx.createDust(gx, gy, 12, 46);
          fx.createEarthShardBurst(gx, gy, dir, 5);
        } else if (st === 'punch_hook' && cross(0.38)) {
          fx.createEarthShardBurst(gx + dir * 56, gy - 60, dir, 6);
        } else if ((st === 'wk' || st === 'kick_roundhouse') && cross(0.38)) {
          fx.createEarthShardBurst(gx + dir * 48, gy - 42, dir, 8);
          fx.createDust(gx + dir * 28, gy, 8, 38);
        } else if (st === 'kick_sweep' && cross(0.42)) {
          fx.createEarthShardBurst(gx + dir * 48, gy - 12, dir, 10);
          fx.createGroundCrack(gx + dir * 46, gy, 95, '#eab308');
        } else if (st === 'counter_hand_strike' && cross(0.42)) {
          fx.createEarthShardBurst(gx + dir * 56, gy, dir, 14);
          fx.createGroundCrack(gx + dir * 56, gy, 130, '#f59e0b');
        } else if (st === 'boss_slam') {
          if (cross(0.14)) fx.createDust(gx, gy, 9, 40);
          if (cross(0.42)) {
            fx.createEarthShardBurst(gx + dir * 60, gy, dir, 14);
            fx.createGroundCrack(gx + dir * 60, gy, 145, '#f97316');
          }
        } else if (st === 'ultimate_slam') {
          if (cross(0.08)) fx.createEarthShardBurst(gx, gy, dir, 8);
          if (cross(0.62)) {
            fx.createEarthShardBurst(gx, gy, dir, 18);
            fx.createEarthShardBurst(gx, gy, -dir, 14);
          }
        }
      }
    },

    // =========================================================================
    // 6. NỘI TẠI THỰC CHIẾN (PASSIVES)
    // =========================================================================
    passives: {
      onApply(player) {
        player.superArmor = true;
        player._baseSuperArmor = true;
        player.dmgMul = (player.dmgMul || 1) * 1.25;
        player.reachMul = 1.5;
        player.passive_thapVan = true;
        player.passive_cuocSat = true;
        player.passive_dapNat = true;
        player.passive_nhamThach = true;
      },
      onUpdate(player, dt) {
        if (player.isDead) return;
        const sinceHit = (player.attackClock || 0) - (player._lastDamagedAt || -99);
        if (player.state === 'idle' && player.stateTimer >= 2.0 && sinceHit >= 2.0 && player.hp < player.maxHp) {
          player.hp = Math.min(player.maxHp, player.hp + 25 * dt);
          if (window.uiManager && typeof window.uiManager.updatePlayerHp === 'function') {
            window.uiManager.updatePlayerHp(Math.round(player.hp), player.maxHp);
          }
          if (Math.random() < 0.15 && window.effectManager) {
            window.effectManager.addFloatingText('+HP', player.x + (Math.random() * 20 - 10), (player.y || 580) - 130, 'heal');
          }
        }
      },
      onBeforeTakeDamage(player) {
        player._lastDamagedAt = player.attackClock || 0;
        return null;
      },
      onDodge(player) {
        player.setAuraArmor('red', 2.5, 150, 4);
      },
      onAttackHit(attacker, defender, attackData, combatSystem, hitCtx) {
        if (defender && !defender.isDead && defender.type !== 'player') {
          if (hitCtx && hitCtx.isCrossCombo) {
            const pullX = (attacker.x || 0) + (attacker.facing || 1) * 52;
            defender.x = defender.x + (pullX - defender.x) * 0.45;
          }
          if (hitCtx && hitCtx.effectiveMove === 'uppercut') {
            defender.hp = Math.max(0, defender.hp - 22);
            if (defender.hp <= 0) {
              defender.isDead = true;
              defender.isAttacking = false;
              if (typeof defender.setState === 'function') defender.setState('knockdown', 1.0);
            }
            if (window.effectManager && typeof window.effectManager.createEarthShardBurst === 'function') {
              window.effectManager.createEarthShardBurst(defender.x, defender.y || 580, attacker.facing || 1, 6);
            }
          }
          if (hitCtx && hitCtx.effectiveMove === 'kick_sweep' && defender.isBoss && typeof defender.poise === 'number') {
            defender.poise = Math.max(0, defender.poise - 24);
          }
        }
        if (!defender || !window.game || !Array.isArray(window.game.enemies)) return;
        const cleaveDmg = Math.max(10, Math.round(((attackData && attackData.damage) || 32) * 0.35));
        window.game.enemies.forEach((e) => {
          if (e && e !== defender && !e.isDead && (!attacker.hitTargets || !attacker.hitTargets.has(e.id))) {
            if (Math.hypot(e.x - defender.x, e.y - defender.y) < 135) {
              if (attacker.hitTargets) attacker.hitTargets.add(e.id);
              e.takeDamage(cleaveDmg, attacker.facing * 6, false);
              if (window.effectManager) {
                window.effectManager.createHitSparks(e.x, (e.y || 580) - 70, 5, false);
              }
            }
          }
        });
      },
      onHandCounter(defender) {
        defender.setAuraArmor('red', 3.0, 160, 5);
        if (window.game && window.game.enemies) {
          window.game.enemies.forEach((e) => {
            if (!e.isDead && Math.hypot(e.x - defender.x, e.y - defender.y) < 220) {
              e.takeDamage(55, defender.facing * 10, true);
            }
          });
        }
        if (window.effectManager) {
          window.effectManager.createGroundCrack(defender.x, defender.y, 140, '#f59e0b');
        }
      },
      onLegCounter(defender, attacker) {
        const healAmt = Math.round((defender.maxHp || 1100) * 0.08);
        defender.hp = Math.min(defender.maxHp || 1100, defender.hp + healAmt);
        if (window.uiManager && typeof window.uiManager.updatePlayerHp === 'function') {
          window.uiManager.updatePlayerHp(Math.round(defender.hp), defender.maxHp);
        }
        if (attacker && attacker.isBoss && typeof attacker.poise === 'number') {
          attacker.poise = Math.max(0, attacker.poise - 45);
        }
        const enemies = (window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : [];
        let idx = 0;
        for (const e of enemies) {
          if (!e || e.isDead) continue;
          if (Math.hypot(e.x - defender.x, e.y - defender.y) <= 230) {
            e.x = defender.x + (defender.facing || 1) * (58 + idx * 16);
            e.y = defender.y;
            idx++;
          }
        }
        if (window.effectManager) {
          if (typeof window.effectManager.createShockRing === 'function') window.effectManager.createShockRing(defender.x, defender.y || 580, '#f97316');
          if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText(`⛰️ BÁT QUÁI THU GOM (+${healAmt} HP)!`, defender.x, (defender.y || 580) - 180, 'heal');
        }
      },
      onStanceSpecial(player) {
        player.hp = Math.min(player.maxHp || 1100, player.hp + 55);
        if (window.uiManager && typeof window.uiManager.updatePlayerHp === 'function') {
          window.uiManager.updatePlayerHp(Math.round(player.hp), player.maxHp);
        }
        if (typeof player.setAuraArmor === 'function') player.setAuraArmor('red', 2.5, 150, 4);
        if (window.effectManager) {
          if (typeof window.effectManager.createGroundCrack === 'function') window.effectManager.createGroundCrack(player.x, player.y || 580, 120, '#f59e0b');
          if (typeof window.effectManager.addFloatingText === 'function') window.effectManager.addFloatingText('⛰️ SƠN NHẠC TRẤN THẾ (+55 HP)!', player.x, (player.y || 580) - 175, 'heal');
        }
        return true;
      },
      onDodgeFollowup(player, btn) {
        if (btn === 'K') {
          player.startAttack('kick_push', 0.50, 210);
          player._moveVariant = 'wk';
          if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText('⛰️ SƠN THẦN XUNG CƯỚC!', player.x, (player.y || 580) - 150, 'crit');
          }
          return true;
        }
        player.startAttack('uppercut', 0.48, 175);
        if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText('⛏️ HẤT CUỐC KHAI THẠCH!', player.x, (player.y || 580) - 150, 'dodge');
        }
        return true;
      }
    },

    // =========================================================================
    // 7. TUYỆT KỸ THỰC CHIẾN (ULTIMATE: THỐNG SƠN ĐẠI CHÙY)
    // =========================================================================
    ultimateRuntime: {
      type: 'slam',
      cinematic: {
        title: 'PHÓ ĐẶNG HOÀNG ANH',
        ult: 'THỐNG SƠN ĐẠI CHÙY',
        color: '#f97316',
        accent: '#ef4444',
        style: 'magma',
        duration: 1.25
      },
      execute(player, st, dt, enemies, { p, hitEnemy }) {
        if (!player._ultInit) {
          player._ultInit = true;
          player.vz = 560;
          player.z = -0.5;
        }
        if (!player._ultHitDone) {
          player.vx = 0;
          if (window.effectManager && Math.random() < 0.6) window.effectManager.createEnergySparks(player.x, player.y - 60, 4);
          for (const e of enemies) {
            if (!e.isDead && Math.abs(e.x - player.x) < 180 && Math.abs(e.y - player.y) < 70) {
              e.x += (player.x - e.x) * 3 * dt;
              e.y += (player.y - e.y) * 3 * dt;
            }
          }
        }
        const landed = player.z === 0 && player.stateTimer > 0.25;
        if ((landed && !player._ultHitDone) || (p > 0.8 && !player._ultHitDone)) {
          player._ultHitDone = true;
          player._slamAt = player.stateTimer;
          player.z = 0;
          player.vz = 0;
          if (window.effectManager) {
            window.effectManager.createMagmaCrater(player.x, player.y, 190);
            window.effectManager.createShockRing(player.x, player.y, '#f97316');
            window.effectManager.createShockRing(player.x, player.y, '#facc15');
            window.effectManager.createDust(player.x, player.y, 35, 210);
            window.effectManager.triggerScreenShake(26, 0.65);
            window.effectManager.triggerFlash('#f97316', 0.65);
          }
          if (window.audioManager) window.audioManager.playScissorClamp();
          for (const e of enemies) {
            if (!e.isDead && Math.abs(e.x - player.x) < 235 && Math.abs(e.y - player.y) < 85) {
              hitEnemy(e, 260, 14, true);
            }
          }
        }
        if (player._ultHitDone && !(player._ultFlags & 1) && player.stateTimer - player._slamAt > 0.18) {
          player._ultFlags |= 1;
          if (window.effectManager) {
            window.effectManager.createShockRing(player.x - 200, player.y, '#f97316');
            window.effectManager.createShockRing(player.x + 200, player.y, '#f97316');
            window.effectManager.createGroundCrack(player.x - 200, player.y, 110, '#facc15');
            window.effectManager.createGroundCrack(player.x + 200, player.y, 110, '#facc15');
            window.effectManager.triggerScreenShake(12, 0.3);
          }
          for (const e of enemies) {
            if (!e.isDead && Math.abs(e.x - player.x) >= 150 && Math.abs(e.x - player.x) < 380 && Math.abs(e.y - player.y) < 85) {
              hitEnemy(e, 140, 12, true);
            }
          }
        }
        if (p >= 1 || player.stateTimer >= player.stateDuration) {
          player.z = 0;
          player.vz = 0;
          player.setState('idle');
        }
      }
    },

    // =========================================================================
    // 8. HỖ TRỢ ĐỒNG MINH CHI VIỆN (ALLY SYSTEM)
    // =========================================================================
    ally: {
      profile: {
        id: 'hoanganh',
        name: 'Phó Đặng Hoàng Anh',
        title: 'Thần Cước Trấn Sơn',
        icon: '⛰️',
        role: 'Lực Điền Tanker & Cản Địch',
        roleColor: '#f59e0b',
        styleType: 'boss_hoanganh',
        speed: 195,
        dmg: 82,
        hp: 1300,
        quote: 'Thân này như núi, cước này như sấm. Đứng vững, và đừng run sợ.',
        activeSkill: {
          name: 'Địa Chấn Trấn Sơn',
          cd: '4.5s',
          desc: 'Dẫm đất gây địa chấn diện rộng (240px), quật ngã lính thường và phá thế đứng của Boss.'
        },
        passiveAura: {
          name: 'Bá Thể Kim Cang',
          desc: 'Hoàng Anh nhận giảm 20% sát thương, vững vàng thu hút hỏa lực lính thường.'
        },
        coopSkill: {
          name: 'Thần Cước Phá Thiên',
          desc: 'Cú đá song sát sấm sét phối hợp cùng người chơi càn quét kẻ thù.'
        }
      },
      coopBaseDamage: 270,
      onSpawn(ally) {
        ally.superArmor = false;
        ally.armorThreshold = 25;
      },
      modifyDamageTaken(ally, amount) {
        return Math.round(amount * 0.80);
      },
      onUpdate(ally, dt, player, enemies) {
        if (ally.specialTimer >= 4.5) {
          ally.specialTimer = 0;
          if (window.audioManager && typeof window.audioManager.playExplosion === 'function') {
            window.audioManager.playExplosion();
          }
          if (window.effectManager) {
            if (window.effectManager.triggerScreenShake) window.effectManager.triggerScreenShake(8, 0.25);
            else if (window.effectManager.screenShake) window.effectManager.screenShake(8, 0.25);
            window.effectManager.createShockRing(ally.x, ally.y, '#f59e0b');
            window.effectManager.addFloatingText('ĐỊA CHẤN TRẤN SƠN!', ally.x, ally.y - 150, 'crit');
          }
          (enemies || []).forEach((e) => {
            if (!e.isDead && Math.hypot(e.x - ally.x, e.y - ally.y) < 240) {
              const isBossE = !!(e.isBoss || String(e.type || '').startsWith('boss_'));
              if (isBossE) {
                e.takeDamage(40, 0, false);
                if (!e.allyCcImmunityTimer || e.allyCcImmunityTimer <= 0) {
                  e.poise = Math.max(0, (e.poise || 50) - 8);
                  e.allyCcImmunityTimer = 4.5;
                }
              } else {
                e.takeDamage(75, Math.sign(e.x - ally.x) * 6, true);
                e.poise = Math.max(0, (e.poise || 50) - 35);
              }
            }
          });
        }
      },
      onBasicAttack(ally, target, dmg, isBossTarget) {
        if (isBossTarget) {
          target.takeDamage(dmg, 0, false);
          if (!target.allyCcImmunityTimer || target.allyCcImmunityTimer <= 0) {
            target.poise = Math.max(0, (target.poise || 50) - 6);
            target.allyCcImmunityTimer = 4.5;
          }
        } else {
          target.takeDamage(dmg, ally.facing * 8, true);
          target.poise = Math.max(0, (target.poise || 50) - 35);
        }
        if (window.audioManager) window.audioManager.playHeavyHit();
        if (window.effectManager) {
          window.effectManager.createShockRing(target.x, target.y, '#ffd700');
          window.effectManager.addFloatingText('SƠN CƯỚC!', ally.x, ally.y - 140, 'crit');
        }
      }
    }
  });
})();

