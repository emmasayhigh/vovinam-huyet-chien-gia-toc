/**
 * NHÂN VẬT: NGÔ NHẤT NGHỊ (Mặc định)
 * js/entities/characters/nghi.js
 * Chứa toàn bộ: Hồ sơ, UI chọn tướng, Ngoại hình, Hoạt ảnh, Chỉ số sát thương, Nội tại & Tuyệt kỹ.
 */

(function () {
  window.CharacterRegistry.register({
    id: 'nghi',
    uiSlotOrder: 0,

    // =========================================================================
    // 1. NGOẠI HÌNH & TRANG PHỤC (STYLE_DEFS)
    // =========================================================================
    appearance: {
      styleKey: 'player',
      style: {
        scale: 1.24,
        archetype: 'vovinam_master',
        rig: {
          shW: 12.6, waW: 8.8, hipW: 10.6, chestOut: 14.0,
          thighLen: 25, calfLen: 26, armUpper: 18.5, armFore: 17.5,
          spineH: 33, neckLen: 14.0, nShX: -5.0, nShY: -2.4, fShX: 5.0, fShY: -1.8,
          hipHalf: 4.1, footPad: 4, headScale: 0.81, limbBulk: 1.06, armBulk: 1.02
        },
        baggyPants: true,
        skin: '#eab68d',
        hair: '#1c1816',
        hairStyle: 'nghi_hero',
        jawStyle: 'youth',
        gi: '#203764',
        pants: '#1d315c',
        cuffTrim: '#9b2226',
        belt: '#151821',
        beltTrim: '#eab308',
        legStripe: '#d4a017',
        thighDragon: true,
        bareVChest: true,
        nameTag: true,
        bareForearms: true,
        patch: true,
        aura: '#38bdf8',
        shoes: 'kungfu',
        shoeColor: '#0f1117',
        eyeColor: '#b45309'
      }
    },

    // =========================================================================
    // 2. HỒ SƠ CỐT TRUYỆN (ROSTER DOSSIER)
    // =========================================================================
    dossier: {
      id: 'nghi',
      name: 'Ngô Nhất Nghị',
      title: 'SÁT THẦN VIỆT VÕ ĐẠO',
      faction: 'vovinam',
      styleType: 'player',
      portrait: 'player',
      playable: true,
      isDefault: true,
      role: 'Nhân vật chính, cao thủ Vovinam, hộ vệ số một của Hứa Vũ Đại.',
      motive: 'Bảo vệ ông chủ và tìm ra sự thật sau hồ sơ bí mật — dù sự thật có quay lưng với ông ta.',
      bio: 'Nghị lớn lên trong võ đường, được đào tạo theo Việt Võ Đạo. Hắn không quan tâm chính trị gia tộc, chỉ quan tâm ai đang nói dối. Đêm nay hắn một mình đột nhập căn cứ đối địch để giải cứu Hứa Vũ Đại — và rồi phát hiện mình đang đứng giữa một ván cờ lớn hơn mình tưởng.',
      fightingStyle: 'Tốc độ cao, combo liên hoàn, đấm – đá – né – phản đòn, đòn chân bay biểu diễn, áp sát và thoát vòng vây.',
      strengths: 'Nhanh, nhiều đòn nối, Perfect Dodge gây sát thương phản công lớn, hồi năng lượng liên tục.',
      weaknesses: 'Sức chống chịu không quá cao; tung đòn mạnh sai thời điểm sẽ bị phản công.',
      skills: [
        { name: 'Liên Hoàn Quyền Cước', desc: 'J→J→K và J→K→K: chuỗi đấm đá nối mượt, chốt bằng đòn bật lùi.' },
        { name: 'Đòn Thế Vovinam Mở Rộng', desc: 'Giữ ↑ + J: Đấm Móc Lên hất tung đối thủ. Giữ ↓ + J: Đánh Chỏ phá thủ. Giữ ↓ + K: Quét Trụ đòn thấp quật ngã. Shift + J: Lao Tới Đấm Móc. Trên không + J: Phi Quyền.' },
        { name: 'Đòn Chân Kẹp', desc: 'Khi áp sát và đã nối 2 đòn: nhảy kẹp cổ quật ngã (không áp dụng lên boss).' },
        { name: 'Phản Đòn Hoàn Hảo', desc: 'L đúng lúc đối thủ ra đòn → time-slow → đòn trừng phạt bạo kích.' },
        { name: 'Đá Bay Phi Thân', desc: 'Nhảy + K: lao xuyên đối thủ, sát thương cao, có knockdown.' }
      ],
      ultimate: { name: 'LONG HỔ XUẤT SƠN', desc: 'Chuỗi đòn liên hoàn xanh lam + nổ năng lượng cuối, gây sát thương diện rộng toàn màn.' },
      stats: { power: 3, speed: 5, defense: 2, technique: 5, range: 2 },
      relations: [
        { who: 'Hứa Vũ Đại', rel: 'Ông chủ — người hắn trung thành' },
        { who: 'Phó Đặng Hoàng Anh', rel: 'Đối trọng về phong cách: nhanh vs nặng' },
        { who: 'Ngô Giang Mạnh', rel: 'Cùng họ nhưng không cùng mục đích' }
      ],
      events: [
        'Hồi I: Đột nhập, đánh bại Long Vương, giải cứu Hứa Vũ Đại',
        'Hồi II: Nhận lệnh truy tìm kẻ bán đứng',
        'Hồi V: Đối mặt Đoạn Nghĩa Đài'
      ],
      unlock: { type: 'default', text: 'Nhân vật mặc định — luôn mở khóa' }
    },

    // =========================================================================
    // 3. THẺ CHỌN NHÂN VẬT (CHAR_SLOTS UI)
    // =========================================================================
    uiSlot: {
      id: 'nghi',
      slotName: 'NGÔ NHẤT NGHỊ',
      fullName: 'NGÔ NHẤT NGHỊ',
      title: 'SÁT THẦN VIỆT VÕ ĐẠO',
      tagline: 'Khí phách — Chính nghĩa — Bất khuất',
      element: '🥋',
      color: '#00d2ff',
      image: 'assets/images/characters/char_hero_nghi.png',
      bio: 'Ngô Nhất Nghị luôn đặt tinh thần thượng võ lên hàng đầu. Với ý chí kiên cường và trái tim chân thành, cậu luôn chiến đấu để bảo vệ những điều mình tin tưởng và truy tìm sự thật.',
      stats: { power: 85, speed: 95, defense: 60, technique: 90 },
      skills: [
        { key: 'J / K', icon: '👊', name: 'Quyền Cước Liên Hoàn', desc: 'Chuỗi đấm đá Vovinam nối mượt, chốt bằng đòn bật lùi.' },
        { key: 'W+J / S+J', icon: '🥋', name: 'Đấm Móc & Đánh Chỏ', desc: 'W+J: Đấm Móc Lên hất tung đối thủ. S+J: Đánh Chỏ phá vỡ phòng thủ.' },
        { key: 'W+K (hoặc J→J→K)', icon: '⚡', name: 'Đòn Chân Kẹp Vovinam', desc: 'Đặc trưng Vovinam: áp sát kẹp cổ, phá khiên và quật ngã đối thủ.' },
        { key: 'U+J / U+K', icon: '🛡️', name: 'Phản Đòn Tay & Chân', desc: 'Đỡ & phản kích MỌI đòn đánh, lập tức phá vỡ Bá Thể Đỏ.' },
        { key: 'I', icon: '🐉', name: 'Long Hổ Xuất Sơn', desc: 'Tuyệt kỹ Vovinam: liên hoàn sấm sét chấn động toàn trường.' }
      ],
      passives: [
        { icon: '👁️', name: 'Cương Nhu Phối Triển', type: 'BỊ ĐỘNG', desc: 'Nối combo 5/10/15 hit giúp tăng 15% tốc đánh và hồi phục 3% Thể Lực & Năng Lượng.' },
        { icon: '🥋', name: 'Bất Khuất Thân Pháp', type: 'BỊ ĐỘNG', desc: 'Bá thể kháng khựng khi tung chuỗi đòn; tăng 25% thời gian bất tử (i-frame) khi né tránh.' },
        { icon: '⚡', name: 'Kẹp Cổ Triệt Hạ', type: 'CHỦ ĐỘNG [W+K áp sát]', desc: 'Đòn chân kẹp trứ danh Vovinam: áp sát kẹp cổ, phá tan khiên thủ và quật ngã đối phương.' },
        { icon: '🛡️', name: 'Gạt Quyền Phản Chưởng', type: 'CHỦ ĐỘNG [U+J/U+K]', desc: 'Đón đỡ đòn địch hoàn hảo, nạp ngay 25 Năng Lượng và nhận Siêu Giáp phản kích trong 1.5s.' }
      ],
      mechanic: 'Võ thuật Vovinam - Linh hoạt, mạnh mẽ, đa dạng thế tấn.',
      quote: '“Không chỉ là võ, đó là đạo!”'
    },

    // =========================================================================
    // 4. CHỈ SỐ CHIẾN ĐẤU & SÁT THƯƠNG ĐÒN ĐÁNH
    // =========================================================================
    combat: {
      hp: 1120,
      speed: 235,
      runSpeed: 390,
      jumpForce: 520,
      damage: 1.28,
      reach: 1.05,
      knockback: 1,
      energyGain: 1.25,
      noWhiffStun: true,
      finisher: 'scissor',
      ultimateState: 'ultimate_flurry',
      ultimateType: 'flurry',
      mechanic: 'Combo liên hoàn + Đòn chân kẹp + Miễn khựng khi hụt chiêu'
    },

    // Có thể tùy chỉnh riêng sát thương/tầm đánh của từng chiêu tại đây khi cập nhật
    moveOverrides: {},

    // =========================================================================
    // 5. HOẠT ẢNH ĐẶC TRƯNG 5 GIAI ĐOẠN (NGÔ NHẤT NGHỊ — TÔNG CHỦ VOVINAM)
    // =========================================================================
    animation: {
      signatureStates: ['ultimate_flurry', 'scissor_kick'],
      trailProfile: {
        primary: '#38bdf8',
        secondary: '#facc15',
        core: '#ffffff',
        width: 12,
        dual: true,
        dodgeGhost: 'rgba(56, 189, 248, 0.52)'
      },
      skillCatalog: [
        { id: 'punch_straight', input: 'J', name: 'Đấm Thẳng Cương Nhu', dur: 0.34, category: 'combo' },
        { id: 'punch_hook', input: 'J → J', name: 'Đấm Móc Vovinam', dur: 0.42, category: 'combo' },
        { id: 'kick_push', input: 'K', name: 'Đá Tống Trước', dur: 0.52, category: 'combo' },
        { id: 'kick_roundhouse', input: 'K → K', name: 'Đá Tạt Cạnh Vòng Cầu', dur: 0.60, category: 'combo' },
        { id: 'wk', input: 'W + K', name: 'Song Phi Tiêu Cước / Kẹp Cổ', dur: 0.52, category: 'special' },
        { id: 'uppercut', input: 'W + J', name: 'Móc Ngược Long Quyền', dur: 0.52, category: 'special' },
        { id: 'elbow_strike', input: 'S + J', name: 'Chỏ Lái Sơn Cương', dur: 0.46, category: 'special' },
        { id: 'kick_sweep', input: 'S + K', name: 'Quét Trụ Nhu Quyền', dur: 0.66, category: 'special' },
        { id: 'hook_run', input: 'Shift + J', name: 'Xung Quyền Bạch Hổ', dur: 0.48, category: 'special' },
        { id: 'air_punch', input: 'Space + J', name: 'Phi Quyền Không Trung', dur: 0.38, category: 'aerial' },
        { id: 'flying_kick', input: 'Space + K', name: 'Song Phi Cước', dur: 0.55, category: 'aerial' },
        { id: 'dodge', input: 'L', name: 'Né Thân Nhu Bộ', dur: 0.28, category: 'defense' },
        { id: 'counter_hand_strike', input: 'U + J', name: 'Phản Đòn Song Chưởng Vovinam', dur: 0.42, category: 'counter' },
        { id: 'counter_leg_strike', input: 'U + K', name: 'Phản Cước Hồi Long', dur: 0.48, category: 'counter' },
        { id: 'scissor_kick', input: 'W + K / Finisher', name: 'Đòn Chân Số 7: Kẹp Cổ Quật Ngã', dur: 0.70, category: 'finisher' },
        { id: 'ultimate_flurry', input: 'I', name: 'Tuyệt Kỹ: Long Hổ Xuất Sơn', dur: 1.40, category: 'ultimate' }
      ],
      poses: {
        idle(P, { t }) {
          const b = Math.sin(t * 3.0);
          const kneeB = Math.sin(t * 3.0) * 0.03;
          P.torso = 0.05 + 0.015 * b;
          P.head = -0.02 + 0.015 * b;
          P.hx = Math.sin(t * 1.5) * 0.8;
          P.lift = Math.sin(t * 3.0) * 1.2;
          P.nT = 0.42 + kneeB; P.nS = -0.52 - kneeB;
          P.fT = -0.36 - kneeB * 0.7; P.fS = 0.12 + kneeB * 0.8;
          // Thế thủ Vovinam chuẩn phong thái concept: tay phải nắm chặt thu hông sẵn sàng, tay trái mở chưởng giơ cao bảo vệ mặt & phô huy hiệu ngực
          P.nA = -0.18 + 0.03 * b; P.nE = 1.72 + 0.02 * b;
          P.fA = 0.58 - 0.02 * b; P.fE = 1.78;
          return true;
        },
        punch_straight(P, { U, p }) {
          // Beat 1 Tam Bộ Liên Hoàn: Xoay hông đấm thẳng Cương Nhu, tay sau ép sườn nạp lực Beat 2
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.54, f: 0.78 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.6);
          P.torso = 0.10 - 0.12 * s.windup + 0.16 * ex;
          P.head = -0.04 - 0.06 * ex;
          P.hx = -3 * s.windup + 5 * ex;
          P.nA = U.lerp(0.38 - 0.72 * s.windup, 1.18, ex);
          P.nE = U.lerp(1.15, 0.05, ex);
          P.fA = U.lerp(0.28, -0.52, ex); P.fE = 1.20;
          P.nT = 0.64 + 0.24 * ex; P.nS = -0.84 - 0.16 * ex;
          P.fT = -0.58 - 0.14 * ex; P.fS = 0.16;
          return true;
        },
        punch_hook(P, { U, p }) {
          // Beat 2: Tiếp nối đà xoay Beat 1 -> Hạ trọng tâm bật chéo Đấm Móc Vovinam giữ trục cho Beat 3
          const s = U.stage5(p, { a: 0.20, c: 0.38, i: 0.56, f: 0.80 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.52 - s.recover * 0.65);
          P.torso = 0.12 - 0.18 * s.windup + 0.16 * ex;
          P.lift = 3 * s.windup;
          P.hx = -4 * s.windup + 6 * ex;
          P.nA = U.lerp(0.32 - 0.85 * s.windup, 1.18, ex);
          P.nE = U.lerp(1.18, 0.48, ex);
          P.fA = U.lerp(0.32, -0.58, ex); P.fE = 1.22;
          P.nT = 0.72 + 0.26 * ex; P.nS = -0.98; P.fT = -0.64; P.fS = 0.22;
          return true;
        },
        elbow_strike(P, { U, p }) {
          // Chỏ Lái Sơn Cương: Đạp trụ gài cẳng tay gập kín vào ngực, phóng đỉnh khuỷu tay Vovinam cắm thẳng tầm sườn
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.58, f: 0.80 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.52 - s.recover * 0.68);
          P.torso = U.lerp(0.14 - 0.14 * s.windup, 0.24, ex);
          P.lift = 4 * s.windup;
          P.hx = -3 * s.windup + 6 * ex;
          P.nA = U.lerp(0.24 - 0.55 * s.windup, 1.32, ex);
          P.nE = U.lerp(1.10, -1.96, ex);
          P.fA = U.lerp(0.28, -0.45, ex); P.fE = 1.25;
          P.nT = 0.78 + 0.18 * ex; P.nS = -0.92; P.fT = -0.68; P.fS = 0.24;
          return true;
        },
        kick_roundhouse(P, { U, p }) {
          // Beat 3 Vovinam Tam Bộ Liên Hoàn: Xoay hông từ Beat 2 -> Bật người vung cước vòng cầu xé gió
          const s = U.stage5(p, { a: 0.20, c: 0.40, i: 0.60, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.52 - s.recover * 0.68);
          P.torso = U.lerp(0.18 * s.windup + 0.08, -0.44, ex);
          P.head = 0.06 * ex;
          P.lift = 4 * s.windup - 9 * ex;
          P.nT = U.lerp(0.78 - 0.35 * s.windup, 2.08, ex);
          P.nS = U.lerp(-1.55, 0.04, ex);
          P.nF = -0.48 * ex;
          P.fT = -0.35; P.fS = 0.08;
          P.nA = U.lerp(0.65, -0.52, ex); P.nE = 1.52;
          P.fA = U.lerp(0.25, 1.18, ex); P.fE = 1.42;
          return true;
        },
        wk(P, { U, p }) {
          // W + K: Song Phi Tiêu Cước Vovinam lao vút về trước (hạ thấp khác hẳn kick_push đứng)
          const prep = p < 0.16 ? U.easeInOut(p / 0.16) : 0;
          const leap = U.beat(p, 0.12, 0.78, 0.48);
          const rec = p > 0.78 ? U.easeInOutQuart((p - 0.78) / 0.22) : 0;
          P.torso = U.lerp(0.36 * prep, 0.24 * leap, leap) * (1 - rec) + 0.06 * rec;
          P.head = -0.14 * leap;
          P.lift = 7 * prep - 15 * leap;
          P.nT = U.lerp(0.85, 1.72, leap) * (1 - rec) + 0.36 * rec;
          P.nS = U.lerp(-1.35, -0.04, leap) * (1 - rec) - 0.44 * rec;
          P.nF = 0.28 * leap;
          P.fT = U.lerp(-0.45, 0.72, leap) * (1 - rec) - 0.32 * rec;
          P.fS = U.lerp(0.15, -1.48, leap) * (1 - rec);
          P.nA = U.lerp(0.75, -0.82, leap); P.nE = 1.15;
          P.fA = U.lerp(0.2, 1.25, leap); P.fE = 1.28;
          return true;
        },
        kick_sweep(P, { U, p }) {
          // S + K Nhu Quyền Quét Trụ: Hạ cực thấp, chống nhẹ mũi tay sau thăng bằng, vung quét sát đất
          const s = U.stage5(p, { a: 0.20, c: 0.38, i: 0.62, f: 0.84 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.48 - s.recover * 0.72);
          P.lift = U.lerp(8 * s.windup, 19, ex);
          P.torso = U.lerp(0.18, 0.44, ex);
          P.head = -0.22 * ex;
          P.nT = U.lerp(0.78, 1.38, ex); P.nS = U.lerp(-1.45, -0.02, ex); P.nF = -0.32 * ex;
          P.fT = U.lerp(-0.42, 0.85, ex); P.fS = U.lerp(0.15, -1.95, ex);
          P.nA = U.lerp(0.55, 0.96, ex); P.nE = U.lerp(1.15, 0.65, ex);
          P.fA = U.lerp(0.2, -0.58, ex); P.fE = U.lerp(1.2, 0.18, ex);
          return true;
        },
        dodge(P, { U, p }) {
          const w = U.beat(p, 0.02, 0.96, 0.36);
          P.torso = 0.52 * w + 0.14 * (1 - w);
          P.head = -0.25 * w;
          P.lift = 6 * w;
          P.nT = 0.92 * w + 0.62 * (1 - w); P.nS = -1.45 * w - 0.82 * (1 - w);
          P.fT = -0.78 * w - 0.55 * (1 - w); P.fS = 0.35;
          P.nA = U.lerp(0.7, -0.45, w); P.nE = 1.65;
          P.fA = U.lerp(0.35, 1.15, w); P.fE = 1.55;
          return true;
        },
        counter_hand_prep(P, { U, t }) {
          const pulse = Math.sin(t * 14) * 0.03;
          P.torso = 0.08 + pulse; P.head = -0.06;
          P.nT = 0.82; P.nS = -1.05; P.fT = -0.65; P.fS = 0.22;
          P.nA = 1.05; P.nE = 1.25; P.fA = 1.18; P.fE = 1.15;
          return true;
        },
        counter_leg_prep(P, { U, t }) {
          const pulse = Math.sin(t * 14) * 0.03;
          P.torso = 0.22 + pulse; P.lift = 3;
          P.nT = 1.08; P.nS = -1.65; P.fT = -0.45; P.fS = 0.18;
          P.nA = 0.45; P.nE = 1.85; P.fA = 1.05; P.fE = 1.3;
          return true;
        },
        counter_hand_strike(P, { U, p }) {
          // Bắt tay chuyển hướng (0..0.2) -> Tung Song Chưởng Long Hổ (0.2..0.6) -> Quán tính & Hồi thế
          const s = U.stage5(p, { a: 0.18, c: 0.38, i: 0.58, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.5 - s.recover * 0.7);
          P.torso = U.lerp(0.06 - 0.16 * s.windup, 0.24, ex);
          P.hx = -4 * s.windup + 7 * ex;
          P.nA = U.lerp(0.55 - 0.85 * s.windup, 1.16, ex);
          P.nE = U.lerp(1.15, 0.08, ex);
          P.fA = U.lerp(0.68 - 0.55 * s.windup, 1.02, ex);
          P.fE = U.lerp(1.15, 0.12, ex);
          P.nT = 0.72 + 0.35 * ex; P.nS = -1.05;
          P.fT = -0.65 - 0.22 * ex; P.fS = 0.18;
          return true;
        },
        counter_leg_strike(P, { U, p }) {
          // Hạ trọng tâm né đòn -> Quét Hồi Long Vòng Lên -> Thu chân vững tấn
          const s = U.stage5(p, { a: 0.20, c: 0.40, i: 0.60, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.7);
          P.torso = U.lerp(0.28 + 0.2 * s.windup, -0.34, ex);
          P.head = 0.08 * ex;
          P.nT = U.lerp(0.85, 2.05, ex); P.nS = U.lerp(-1.3, 0.05, ex); P.nF = -0.3 * ex;
          P.fT = -0.58; P.fS = 0.24;
          P.nA = U.lerp(0.6, -0.65, ex); P.nE = 1.2;
          P.fA = U.lerp(0.9, 1.35, ex); P.fE = 1.4;
          return true;
        },
        scissor_kick(P, { U, p }) {
          // 1. Lấy đà bật nhảy (0..0.16) -> 2. Kẹp cổ xoay 360° (0.16..0.72) -> 3. Vung theo đà & hạ thế Vovinam (0.72..1.0)
          const prep = p < 0.16 ? U.easeInOut(p / 0.16) : 0;
          const flip = U.clamp((p - 0.16) / 0.56);
          const open = Math.sin(U.clamp((p - 0.18) / 0.54) * Math.PI);
          const rec = p > 0.74 ? U.easeInOut((p - 0.74) / 0.26) : 0;
          P.roll = -U.easeInOut(flip) * Math.PI * 2;
          P.fixedHy = 40; P.fixW = p < 0.85 ? 1 : (1 - (p - 0.85) / 0.15);
          P.torso = U.lerp(0.32 * prep + 0.1 * (1 - prep), 0.14, rec);
          P.lift = p < 0.16 ? 8 * prep : (p < 0.78 ? -16 * open : -4 * (1 - rec));
          P.nT = U.lerp(0.4 + 1.28 * open, 0.62, rec);
          P.nS = U.lerp(-0.2 - 0.35 * open, -0.82, rec);
          P.fT = U.lerp(-0.4 - 1.25 * open, -0.55, rec);
          P.fS = U.lerp(-0.2, 0.15, rec);
          P.nA = U.lerp(1.65, 0.7, rec); P.nE = U.lerp(0.35, 1.8, rec);
          P.fA = U.lerp(-1.45, 0.35, rec); P.fE = U.lerp(0.35, 1.95, rec);
          return true;
        },
        ultimate_flurry(P, { U, p, t }) {
          // 5 giai đoạn Long Hổ Xuất Sơn:
          // Stg 1 (0..0.16): Mã Bộ nạp khí Long Hổ hai tay ép hông
          // Stg 2 (0.16..0.68): Liên hoàn 6 chiêu Quyền Cước tốc biến
          // Stg 3 (0.68..0.84): Song Chưởng Long Hổ Phá Trận (Climax Thrust)
          // Stg 4-5 (0.84..1.0): Theo đà & Thu thế Nghiêm Lễ Vovinam
          if (p < 0.16) {
            const w = U.easeInOut(p / 0.16);
            P.torso = 0.14 - 0.28 * w; P.head = 0.08 * w; P.hx = -6 * w; P.lift = 7 * w;
            P.nT = U.lerp(0.62, 0.98, w); P.nS = U.lerp(-0.82, -1.42, w);
            P.fT = U.lerp(-0.55, -0.88, w); P.fS = U.lerp(0.15, 0.38, w);
            P.nA = U.lerp(0.7, -0.65, w); P.nE = 2.05;
            P.fA = U.lerp(0.35, -0.55, w); P.fE = 2.1;
            return true;
          }
          if (p < 0.68) {
            const u = (p - 0.16) / 0.52;
            const c = u * Math.PI * 7.5;
            const a = Math.max(0, Math.sin(c)), b = Math.max(0, -Math.sin(c));
            const kk = Math.max(0, Math.sin(c * 0.5));
            P.torso = 0.36; P.head = -0.14; P.hx = 4 * (a + b);
            P.nA = U.lerp(0.25, 1.48, a); P.nE = U.lerp(1.85, 0.06, a);
            P.fA = U.lerp(0.25, 1.48, b); P.fE = U.lerp(1.9, 0.06, b);
            P.nT = 0.48 + 1.05 * kk; P.nS = -0.85 + 0.85 * kk;
            P.fT = -0.55; P.fS = 0.14;
            return true;
          }
          if (p < 0.84) {
            const c = U.easeOutBack(U.clamp((p - 0.68) / 0.10), 1.35);
            P.torso = U.lerp(0.25, 0.42, c); P.head = -0.18 * c; P.hx = 10 * c;
            P.nA = U.lerp(-0.4, 1.56, c); P.nE = U.lerp(1.9, 0.05, c);
            P.fA = U.lerp(-0.3, 1.48, c); P.fE = U.lerp(1.9, 0.08, c);
            P.nT = 0.92; P.nS = -1.18; P.fT = -0.85; P.fS = 0.28;
            return true;
          }
          const rec = U.easeInOutQuart((p - 0.84) / 0.16);
          P.torso = U.lerp(0.42, 0.14, rec); P.head = U.lerp(-0.18, -0.05, rec); P.hx = U.lerp(10, 0, rec);
          P.nA = U.lerp(1.56, 0.72, rec); P.nE = U.lerp(0.05, 1.82, rec);
          P.fA = U.lerp(1.48, 0.38, rec); P.fE = U.lerp(0.08, 1.95, rec);
          P.nT = U.lerp(0.92, 0.62, rec); P.nS = U.lerp(-1.18, -0.82, rec);
          P.fT = U.lerp(-0.85, -0.55, rec); P.fS = U.lerp(0.28, 0.15, rec);
          return true;
        }
      },
      emitSkillVFX(e, st, prevP, p, fx) {
        const cross = (t) => prevP < t && p >= t;
        const dir = e.facing || 1;
        const gx = e.x || 0, gy = e.y || 580, gz = e.z || 0;
        if (st === 'dodge' && cross(0.08)) {
          fx.createDust(gx, gy, 7, 36);
          fx.createEnergySparks(gx, gy + gz - 52, 6);
        } else if (st === 'counter_hand_strike') {
          if (cross(0.05)) fx.createShockRing(gx, gy - 55, '#38bdf8');
          if (cross(0.36)) {
            fx.createDragonTigerLotus(gx + dir * 48, gy + gz - 60, dir, 96, 0.42);
            fx.createSonicBoomCone(gx + dir * 32, gy + gz - 62, dir, '#38bdf8');
          }
        } else if (st === 'counter_leg_strike' && cross(0.38)) {
          fx.createDragonTigerLotus(gx + dir * 44, gy - 30, dir, 86, 0.38);
          fx.createGroundCrack(gx + dir * 36, gy, 70, '#38bdf8');
        } else if (st === 'scissor_kick') {
          if (cross(0.16)) fx.createDust(gx, gy, 10, 42);
          if (cross(0.42)) fx.createDragonTigerLotus(gx + dir * 25, gy + gz - 72, dir, 110, 0.48);
          if (cross(0.68)) fx.createShockRing(gx + dir * 30, gy - 32, '#facc15');
        } else if (st === 'ultimate_flurry') {
          if (cross(0.06)) fx.createDragonTigerLotus(gx, gy - 48, dir, 92, 0.42);
          if (cross(0.68)) {
            fx.createSonicBoomCone(gx + dir * 56, gy - 62, dir, '#facc15');
            fx.createDragonTigerLotus(gx + dir * 58, gy - 62, dir, 130, 0.52);
          }
        } else if (st === 'punch_straight' && cross(0.34)) {
          fx.createEnergySparks(gx + dir * 48, gy - 78, 5);
        } else if (st === 'punch_hook' && cross(0.36)) {
          fx.createSonicBoomCone(gx + dir * 36, gy - 76, dir, '#38bdf8');
        } else if (st === 'wk') {
          if (cross(0.16)) fx.createDust(gx, gy, 8, 38);
          if (cross(0.34)) fx.createDragonTigerLotus(gx + dir * 44, gy + gz - 66, dir, 92, 0.38);
        } else if (st === 'kick_sweep' && cross(0.42)) {
          fx.createDust(gx + dir * 32, gy, 10, 46);
          fx.createGroundCrack(gx + dir * 40, gy, 72, '#38bdf8');
        } else if (cross(0.36) && (st === 'uppercut' || st === 'hook_run' || st === 'kick_roundhouse')) {
          fx.createSonicBoomCone(gx + dir * 34, gy + gz - 56, dir, '#38bdf8');
        }
      }
    },

    // =========================================================================
    // 6. NỘI TẠI THỰC CHIẾN (PASSIVES)
    // =========================================================================
    passives: {
      onApply(player) {
        player.passive_cuongNhu = true;
        player.passive_batKhuat = true;
        player.passive_phanChau = true;
        player.dodgeIframeMul = 1.25;
        player._cuongNhuSpeedTimer = 0;
      },
      onUpdate(player, dt) {
        if (player._cuongNhuSpeedTimer > 0) {
          player._cuongNhuSpeedTimer = Math.max(0, player._cuongNhuSpeedTimer - dt);
          if (player._cuongNhuSpeedTimer <= 0) {
            player.speed = player._baseSpeed || 230;
          }
        }
      },
      onDodge(player) {
        player.setAuraArmor('white', 0.6);
      },
      onHandCounter(defender) {
        defender.setAuraArmor('gold', 1.8);
        defender.superArmorTimer = 1.8;
        defender.superArmor = true;
        if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText('🟡 KIM CANG 1.8s (+25 NỘ)!', defender.x, defender.y - 190, 'heal');
        }
      },
      onLegCounter(defender) {
        defender.stamina = Math.min(defender.maxStamina || 100, (defender.stamina || 0) + 25);
        defender.kickCooldown = 0;
        defender.nextHitCrit = true;
        if (window.effectManager) {
          if (typeof window.effectManager.createShockRing === 'function') {
            window.effectManager.createShockRing(defender.x, defender.y || 580, '#38bdf8');
          }
          if (typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText('🥋 HỒI LONG ĐOẠT CƯỚC (+25 TL / BẠO KÍCH)!', defender.x, (defender.y || 580) - 185, 'crit');
          }
        }
      },
      onStanceSpecial(player) {
        player.spamStack = 0;
        if (typeof player.addEnergy === 'function') player.addEnergy(15);
        if (typeof player.setAuraArmor === 'function') player.setAuraArmor('white', 0.45);
        if (window.effectManager) {
          if (typeof window.effectManager.createDragonTigerLotus === 'function') {
            window.effectManager.createDragonTigerLotus(player.x, (player.y || 580) - 55, player.facing || 1, 95, 0.42);
          }
          if (typeof window.effectManager.createShockRing === 'function') {
            window.effectManager.createShockRing(player.x, player.y || 580, '#00f0ff');
          }
          if (typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText('🐉 LONG HỔ TỤ KHÍ (+15 NỘ / 0.45s BẤT HOẠI)!', player.x, (player.y || 580) - 175, 'ultimate');
          }
        }
        return true;
      },
      onDodgeFollowup(player, btn) {
        if (btn === 'K') {
          player.startAttack('kick_roundhouse', 0.56, 200);
          if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText('⚡ PHI LONG VÒNG CƯỚC!', player.x, (player.y || 580) - 150, 'crit');
          }
          return true;
        }
        player.startAttack('hook_run', 0.44, 240);
        if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText('👊 XUNG QUYỀN BẠCH HỔ!', player.x, (player.y || 580) - 150, 'dodge');
        }
        return true;
      },
      onAttackHit(attacker, defender, attackData, combatSystem, hitCtx) {
        if (combatSystem && combatSystem.comboCount >= 3) {
          attacker.stamina = Math.min(attacker.maxStamina || 100, (attacker.stamina || 0) + 3);
          attacker.addEnergy ? attacker.addEnergy(3) : (attacker.energy = Math.min(attacker.maxEnergy || 100, (attacker.energy || 0) + 3));
          if (combatSystem.comboCount % 4 === 0 && attacker.hp > 0 && attacker.hp < (attacker.maxHp || 1120)) {
            attacker.hp = Math.min(attacker.maxHp || 1120, attacker.hp + 8);
            if (window.uiManager && typeof window.uiManager.updatePlayerHp === 'function') {
              window.uiManager.updatePlayerHp(attacker.hp, attacker.maxHp);
            }
          }
          attacker._cuongNhuSpeedTimer = 3.0;
          attacker.speed = Math.round((attacker._baseSpeed || 230) * 1.15);
          if (attacker.stateDuration > 0.22 && !attacker._cuongNhuHasted) {
            attacker._cuongNhuHasted = true;
            attacker.stateDuration *= 0.87;
          }
          if (window.uiManager && typeof window.uiManager.updatePlayerEnergy === 'function') {
            window.uiManager.updatePlayerEnergy(attacker.energy, attacker.maxEnergy);
          }
          if (combatSystem.comboCount % 5 === 0 && window.effectManager) {
            window.effectManager.addFloatingText('CƯƠNG NHU (+15% TỐC ĐÁNH & +3% NỘ)', attacker.x, attacker.y - 140, 'heal');
          }
        } else {
          attacker._cuongNhuHasted = false;
        }
        if (hitCtx && hitCtx.isCrossCombo) {
          attacker.stamina = Math.min(attacker.maxStamina || 100, (attacker.stamina || 0) + 5);
          if (typeof attacker.addEnergy === 'function') attacker.addEnergy(4);
          if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
            window.effectManager.addFloatingText('🥋 CƯƠNG NHU ĐỔI NHỊP (+5 TL / +4 NỘ)!', attacker.x, (attacker.y || 580) - 160, 'heal');
          }
        }
        if (hitCtx && hitCtx.effectiveMove === 'elbow_strike' && defender && defender.isBoss && typeof defender.poise === 'number') {
          defender.poise = Math.max(0, defender.poise - 15);
        }
        if (hitCtx && hitCtx.effectiveMove === 'uppercut' && typeof attacker.dodgeCooldown === 'number') {
          attacker.dodgeCooldown = Math.max(0, attacker.dodgeCooldown - 1.0);
        }
      }
    },

    // =========================================================================
    // 7. TUYỆT KỸ THỰC CHIẾN (ULTIMATE: LONG HỔ XUẤT SƠN)
    // =========================================================================
    ultimateRuntime: {
      type: 'flurry',
      cinematic: {
        title: 'NGÔ NHẤT NGHỊ',
        ult: 'LONG HỔ XUẤT SƠN',
        color: '#00f0ff',
        accent: '#ffd700',
        style: 'lightning',
        duration: 1.4
      },
      execute(player, st, dt, enemies) {
        player.invincibleTimer = 0.2;
        player.vx = player.facing * 430;
        if (window.effectManager) {
          if (Math.random() < 0.7) window.effectManager.addGhostTrail(player, 'rgba(0, 230, 255, 0.75)');
          if (Math.random() < 0.45) window.effectManager.createLightningArc(player.x - player.facing * 30, player.y - 50, player.x + player.facing * 75, player.y - 45 + (Math.random() - 0.5) * 40, '#00f0ff', 1);
          if (Math.random() < 0.4) window.effectManager.createEnergySparks(player.x, player.y - 45, 4);
        }

        let flurryDragIdx = 0;
        for (const enemy of enemies) {
          if (enemy.isDead) continue;
          const inReach = (Math.abs(enemy.x - player.x) < 140 && Math.abs(enemy.y - player.y) < 70) || player.hitTargets.has(enemy.id);
          if (inReach) {
            player.hitTargets.add(enemy.id);
            if (!enemy.isRemotePlayer && !enemy.isBoss) {
              enemy.x = player.x + player.facing * (48 + flurryDragIdx * 12);
              enemy.y = player.y;
              enemy.vx = player.vx;
              enemy.vz = 0;
              enemy.z = 0;
              enemy.state = 'hurt';
              enemy.stateTimer = 0;
              enemy.stateDuration = 0.25;
            }
            flurryDragIdx++;

            const lastHit = player._ultData[enemy.id] || 0;
            if (player.stateTimer - lastHit >= 0.16) {
              player._ultData[enemy.id] = player.stateTimer;
              enemy.takeDamage(35, player.facing * 2, false);
              if (window.audioManager) window.audioManager.playPunch();
              if (window.effectManager) {
                window.effectManager.createHitSparks(enemy.x, enemy.y - 50, 8, true);
                window.effectManager.createDimensionalSlash(enemy.x, enemy.y - 50, (Math.random() - 0.5) * 0.8, 110, '#00f0ff');
              }
              if (window.combatSystem) window.combatSystem.registerHit(true, enemy, 35, true);
            }
          }
        }

        if (player.stateTimer >= player.stateDuration) {
          if (window.effectManager) {
            window.effectManager.createUltimateBlast(player.x + player.facing * 40, player.y - 50, { primary: '#38bdf8', secondary: '#facc15', flash: '#38bdf8' });
            window.effectManager.createGroundCrack(player.x + player.facing * 40, player.y, 180, '#00f0ff');
            window.effectManager.createGroundCrack(player.x + player.facing * 40, player.y, 130, '#ffd700');
            window.effectManager.createShockRing(player.x + player.facing * 40, player.y, '#ffd700');
            window.effectManager.triggerScreenShake(24, 0.55);
            window.effectManager.triggerFlash('#00f0ff', 0.75);
          }
          for (const enemy of enemies) {
            if (!enemy.isDead && (Math.abs(enemy.x - player.x) < 185 || player.hitTargets.has(enemy.id))) {
              enemy.takeDamage(320, player.facing * 14, true);
            }
          }
          player.hitTargets.clear();
          player.setState('idle');
        }
      }
    }
  });
})();

