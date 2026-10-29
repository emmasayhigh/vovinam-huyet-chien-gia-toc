/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/animation/animationPose.js - Tinh pose xuong cho tung trang thai.
 */

(function () {
const { AnimUtil, STYLE_DEFS, VARIANTS, ATTACK_STATES, POSE_ALIAS, POSE_KEYS, shadeColor, hashStr } = window;

class SkeletalRendererPose extends window.SkeletalRendererBase {
  calculatePose(e) {
    const U = AnimUtil;
    const t = e.animTime || 0;
    const st = POSE_ALIAS[e.state] || e.state || 'idle';
    const style = this.getStyle(e);
    const p = U.progress(e);
    const ch = U.cham(p);
    const ex = U.ext(p);
    const mix = (rest, cham, ext) => U.lerp(U.lerp(rest, cham, ch), ext, ex);

    const hasHoe = (style.weapon === 'hoe');
    const hasMaceShield = (style.weapon === 'mace' || style.shield);
    const isHoangAnh = (e.styleType === 'boss_hoanganh' || e.type === 'boss_hoanganh' || e.charId === 'hoanganh' || e.characterId === 'hoanganh');
    const isDinhAn = (e.styleType === 'boss_dinhan' || e.type === 'boss_dinhan' || e.charId === 'dinhan' || e.characterId === 'dinhan');

    const P = {
      hx: 0, torso: 0.14, head: -0.05, lift: 0, roll: 0, fixedHy: 44, fixW: 0,
      grip: hasHoe ? 1.16 : (style.weapon === 'mace' ? -0.34 : 0),
      nT: 0.62, nS: -0.82, nF: 0, fT: -0.55, fS: 0.15, fF: 0,
      nA: hasHoe ? 0.44 : 0.7,
      nE: hasHoe ? 0.64 : 1.8,
      fA: hasHoe ? 0.44 : 0.35,
      fE: hasHoe ? 0.64 : 1.95
    };

    // Cuốc: cán nằm NGANG qua hai nắm tay (vuông góc cẳng tay). Truyền: thân, cánh tay trên, cẳng tay, góc cán (tuyệt đối)
    const hoeArms = (torso, upper, fore, shaft) => {
      P.nA = upper - torso; P.nE = fore - upper; P.grip = shaft - fore;
      P.fA = P.nA; P.fE = P.nE;
    };

    switch (st) {
      case 'idle': {
        // Phó Đặng Hoàng Anh: Nếu có cuốc sắt thì cầm cuốc bằng 2 tay đĩnh đạc trước ngực
        if (hasHoe) {
          const b = Math.sin(t * 2.2);
          P.torso = 0.18 + 0.015 * b;
          P.head = -0.06;
          P.nT = 0.76; P.nS = -0.98;
          P.fT = -0.68; P.fS = 0.22;
          P.lift = Math.sin(t * 2.2) * 1.2;
          hoeArms(P.torso, 0.58 + 0.03 * b, 1.22, 2.38 + 0.04 * b);
          P.hx = Math.sin(t * 1.1) * 0.8;
          break;
        }
        // Triệu Đình An: Tay trái dựng Khiên Hổ Phù che ngực, tay phải giữ Thiết Chùy nghiêng 45 độ uy nghi (không che mặt)
        if (hasMaceShield) {
          const b = Math.sin(t * 2.2);
          P.torso = 0.16 + 0.012 * b;
          P.head = -0.05;
          P.nT = 0.78; P.nS = -1.0;
          P.fT = -0.68; P.fS = 0.24;
          P.lift = Math.sin(t * 2.2) * 1.0;
          P.nA = 0.34 + 0.03 * b; P.nE = 1.08; P.grip = -0.34;
          P.fA = 0.92 - 0.02 * b; P.fE = 0.96;
          P.hx = Math.sin(t * 1.1) * 0.6;
          break;
        }
        const b = Math.sin(t * 3.2);
        P.torso = 0.14 + 0.02 * b;
        P.hx = Math.sin(t * 1.6) * 1.2;
        // Nhún gối nhịp nhàng theo hơi thở võ thuật
        const kneeB = Math.sin(t * 3.2) * 0.05;
        P.nT = 0.62 + kneeB;
        P.nS = -0.82 - kneeB * 1.2;
        P.fT = -0.55 - kneeB * 0.8;
        P.fS = 0.15 + kneeB;
        P.lift = Math.sin(t * 3.2) * 1.8;
        P.nA = 0.7 + 0.04 * b;
        P.fA = 0.35 - 0.03 * b;
        P.head = -0.05 + 0.02 * b;
        break;
      }
      case 'captive': {
        P.torso = 0.45; P.head = 0.55;
        P.nA = 0.15; P.nE = 0.3; P.fA = -0.1; P.fE = 0.3;
        P.nT = 1.45; P.nS = -2.7; P.fT = 1.2; P.fS = -2.6;
        break;
      }
      case 'walk': {
        const isBackpedal = (e.vx * (e.facing || 1) < -10);
        const dir = isBackpedal ? -1 : 1;

        // Phó Đặng Hoàng Anh: Có cuốc sắt thì hai tay giữ cán cuốc nhịp nhàng theo bước chân
        if (hasHoe) {
          const c = t * 6.5 * dir;
          const s = Math.sin(c), co = Math.cos(c);
          P.torso = isBackpedal ? 0.10 : 0.20;
          P.nT = 0.25 + 0.52 * s; P.nS = -(0.3 + 0.85 * Math.max(0, co));
          P.fT = 0.25 - 0.52 * s; P.fS = -(0.3 + 0.85 * Math.max(0, -co));
          hoeArms(P.torso, 0.62 + 0.05 * s, 1.2, 2.34 + 0.06 * s);
          break;
        }
        // Triệu Đình An: Dựng khiên trước ngực, tay phải vung nhẹ Thiết Chùy theo bước tiến
        if (hasMaceShield) {
          const c = t * 6.0 * dir;
          const s = Math.sin(c), co = Math.cos(c);
          P.torso = isBackpedal ? 0.12 : 0.22;
          P.nT = 0.28 + 0.48 * s; P.nS = -(0.32 + 0.8 * Math.max(0, co));
          P.fT = 0.28 - 0.48 * s; P.fS = -(0.32 + 0.8 * Math.max(0, -co));
          P.nA = 0.32 + 0.06 * s; P.nE = 1.1; P.grip = -0.32;
          P.fA = 0.92 - 0.04 * s; P.fE = 0.95;
          break;
        }

        const c = t * 9 * dir, s = Math.sin(c), co = Math.cos(c);
        P.torso = isBackpedal ? 0.08 : 0.16;
        P.nT = 0.15 + 0.6 * s; P.nS = -(0.2 + 0.9 * Math.max(0, co));
        P.fT = 0.15 - 0.6 * s; P.fS = -(0.2 + 0.9 * Math.max(0, -co));
        if (isBackpedal) {
          P.nA = 0.85; P.nE = 1.4; P.fA = 0.45; P.fE = 1.6;
        } else {
          P.nA = 0.7 + 0.07 * s; P.fA = 0.35 - 0.07 * s;
        }
        break;
      }
      case 'run': {
        const c = t * 14, s = Math.sin(c), co = Math.cos(c);
        P.torso = 0.42; P.head = -0.2;
        P.nT = 0.2 + 0.95 * s; P.nS = -(0.3 + 1.25 * Math.max(0, co));
        P.fT = 0.2 - 0.95 * s; P.fS = -(0.3 + 1.25 * Math.max(0, -co));
        P.nF = -0.5 * Math.max(0, co); P.fF = -0.5 * Math.max(0, -co);
        if (hasHoe) {
          hoeArms(P.torso, 0.48 + 0.08 * s, 1.15, 2.28 + 0.08 * s);
          break;
        }
        if (hasMaceShield && isDinhAn) {
          P.nA = 0.28 - 0.22 * s; P.nE = 1.05; P.grip = -0.32;
          P.fA = 0.95; P.fE = 0.88;
          break;
        }
        P.nA = 0.35 - 1.1 * s; P.nE = 1.5; P.fA = 0.35 + 1.1 * s; P.fE = 1.5;
        break;
      }
      case 'jump_up': {
        P.torso = 0.1;
        P.nT = 1.0; P.nS = -1.7; P.fT = 0.35; P.fS = -1.1; P.nF = -0.5; P.fF = -0.5;
        if (hasHoe) {
          hoeArms(P.torso, 0.72, 1.32, 2.48);
          break;
        }
        P.nA = 2.2; P.nE = 0.3; P.fA = 1.6; P.fE = 0.4;
        break;
      }
      case 'jump_fall': {
        P.torso = 0.05;
        P.nT = 0.5; P.nS = -0.3; P.fT = -0.3; P.fS = -0.15;
        if (hasHoe) {
          hoeArms(P.torso, 0.55, 1.18, 2.32);
          break;
        }
        P.nA = 1.0; P.nE = 1.2; P.fA = 0.5; P.fE = 1.2;
        break;
      }
      case 'guard': {
        if (hasHoe) {
          P.torso = 0.24; P.head = -0.08;
          P.nT = 0.85; P.nS = -1.2; P.fT = -0.7; P.fS = 0.22;
          hoeArms(P.torso, 0.72, 1.38, 2.55);
          break;
        }
        if (hasMaceShield && isDinhAn) {
          P.torso = 0.22; P.head = -0.08;
          P.nT = 0.86; P.nS = -1.22; P.fT = -0.72; P.fS = 0.22;
          P.nA = 0.22; P.nE = 1.15; P.grip = -0.25;
          P.fA = 1.18; P.fE = 0.82;
          break;
        }
        P.torso = 0.26; P.head = -0.1;
        P.nT = 0.85; P.nS = -1.25; P.fT = -0.7; P.fS = 0.2;
        P.nA = 1.05; P.nE = 1.75; P.fA = 0.85; P.fE = 2.0;
        break;
      }
      case 'punch_straight': {
        const stDef = style;
        if (stDef.weapon === 'mace') {
          // Triệu Đình An: Nâng Thiết Chùy lên trên vai phải rồi giáng chéo xuống trước mặt, tay trái dựng Khiên hộ ngực
          P.torso = mix(0.16, -0.24, 0.44);
          P.head = mix(-0.05, 0.06, -0.12);
          P.hx = mix(0, -4, 7);
          P.nA = mix(0.34, 1.95, 0.68); P.nE = mix(1.08, 0.52, 0.14);
          P.grip = mix(-0.34, 0.25, -0.85);
          P.fA = mix(0.92, 1.08, 0.72); P.fE = mix(0.96, 0.88, 1.05);
          P.nT = mix(0.78, 0.65, 1.02); P.nS = mix(-1.0, -0.85, -0.58);
          P.fT = mix(-0.68, -0.72, -0.82); P.fS = mix(0.24, 0.2, 0.25);
          break;
        }
        if (stDef.weapon === 'hoe') {
          // Phó Đặng Hoàng Anh: Hai tay nắm chắc cán cuốc, thu lực bên sườn rồi đâm/bổ đầu cuốc lao thẳng tới trước
          P.torso = mix(0.18, -0.18, 0.46);
          P.head = mix(-0.06, 0.06, -0.12);
          P.hx = mix(0, -4, 8);
          hoeArms(
            P.torso,
            mix(0.58, 0.28, 1.18),
            mix(1.22, 0.92, 1.38),
            mix(2.38, 2.05, 1.56)
          );
          P.nT = mix(0.76, 0.55, 1.12); P.nS = mix(-0.98, -0.72, -1.22);
          P.fT = mix(-0.68, -0.82, -0.35); P.fS = mix(0.22, 0.15, 0.1);
          break;
        }
        P.torso = mix(0.14, -0.05, 0.46);
        P.hx = mix(0, -2, 4);
        P.nA = mix(0.7, 0.15, 1.35); P.nE = mix(1.8, 1.6, 0.02);
        P.grip = stDef.weapon ? mix(0, 0.15, -0.95) : 0;
        P.fA = mix(0.35, 0.6, -0.2); P.fE = mix(1.95, 2.1, 2.3);
        P.nT = mix(0.62, 0.62, 0.85); P.nS = mix(-0.82, -0.82, -0.5);
        P.fT = mix(-0.55, -0.55, -0.75); P.fS = mix(0.15, 0.15, 0.25);
        break;
      }
      case 'punch_hook': {
        const stDef = style;
        if (stDef.weapon === 'mace') {
          // Triệu Đình An: Mở rộng vai phải lấy đà rồi quét ngang Thiết Chùy ngàn cân phá thế
          P.torso = mix(0.16, -0.34, 0.52);
          P.head = mix(-0.05, 0.08, -0.14);
          P.hx = mix(0, -5, 8);
          P.nA = mix(0.34, -0.85, 1.42); P.nE = mix(1.08, 0.72, 0.12);
          P.grip = mix(-0.34, 0.35, -0.76);
          P.fA = mix(0.92, 1.12, 0.45); P.fE = mix(0.96, 0.85, 1.15);
          P.nT = mix(0.78, 0.68, 1.05); P.nS = mix(-1.0, -1.05, -0.65);
          P.fT = mix(-0.68, -0.65, -0.82); P.fS = mix(0.24, 0.2, 0.2);
          break;
        }
        if (stDef.weapon === 'hoe') {
          // Phó Đặng Hoàng Anh: Hai tay vung cuốc sắt qua vai rồi bổ quét vòng cung rộng phía trước
          P.torso = mix(0.18, -0.32, 0.48);
          P.head = mix(-0.06, 0.1, -0.14);
          P.hx = mix(0, -6, 8);
          hoeArms(
            P.torso,
            mix(0.58, 1.72, 0.88),
            mix(1.22, 1.98, 1.05),
            mix(2.38, 3.08, 1.38)
          );
          P.nT = mix(0.76, 0.62, 1.14); P.nS = mix(-0.98, -0.85, -1.18);
          P.fT = mix(-0.68, -0.78, -0.35); P.fS = mix(0.22, 0.2, 0.12);
          break;
        }
        P.torso = mix(0.14, -0.25, 0.58);
        P.hx = mix(0, -3, 5);
        P.nA = mix(0.7, -0.6, 1.55); P.nE = mix(1.8, 1.8, 1.2);
        P.grip = stDef.weapon ? mix(0, 0.3, -0.78) : 0;
        P.fA = mix(0.35, 0.8, 0.4); P.fE = 2.1;
        P.nT = mix(0.62, 0.62, 0.85); P.nS = mix(-0.82, -0.82, -0.65);
        P.fT = mix(-0.55, -0.55, -0.7); P.fS = mix(0.15, 0.15, 0.2);
        break;
      }
      case 'boss_bash': {
        // Triệu Đình An: Đưa Khiên Hổ Phù chắn ngay trước ngực lao ủi thẳng tới, tay phải thu Thiết Chùy lấy đà rồi bổ xuống
        if (!hasMaceShield && isDinhAn) {
          // Khi mặc Võ Phục Vovinam (tay không): Thiết Sơn Khảo / Song Chưởng Công Phá
          P.torso = mix(0.16, -0.22, 0.52);
          P.hx = mix(0, -4, 9);
          P.nA = mix(0.7, -0.35, 1.32); P.nE = mix(1.8, 1.65, 0.22);
          P.fA = mix(0.35, -0.2, 1.18); P.fE = mix(1.95, 1.7, 0.3);
          P.nT = mix(0.62, 0.52, 1.15); P.nS = mix(-0.82, -0.7, -1.35);
          P.fT = mix(-0.55, -0.75, -0.85); P.fS = mix(0.15, 0.2, 0.22);
          break;
        }
        const u = U.cham(p), d = U.ext(p);
        P.torso = U.lerp(U.lerp(0.16, 0.42, u), 0.48, d);
        P.head = U.lerp(-0.05, -0.18, Math.max(u, d));
        P.hx = U.lerp(U.lerp(0, 6, u), 10, d);
        // Tay trái (cầm khiên) đẩy thẳng tấm khiên ra phía trước ngực suốt pha lao ủi
        P.fA = U.lerp(U.lerp(0.92, 1.18, u), 1.32, d);
        P.fE = U.lerp(U.lerp(0.96, 0.72, u), 0.48, d);
        // Tay phải (cầm chùy) thu về sau nạp lực rồi vung bổ bồi thêm ở cuối cú húc
        P.nA = U.lerp(U.lerp(0.34, -0.45, u), 1.15, d);
        P.nE = U.lerp(U.lerp(1.08, 1.25, u), 0.22, d);
        P.grip = U.lerp(U.lerp(-0.34, 0.25, u), -0.82, d);
        P.nT = U.lerp(U.lerp(0.78, 1.05, u), 1.18, d);
        P.nS = U.lerp(U.lerp(-1.0, -1.35, u), -1.25, d);
        P.fT = U.lerp(U.lerp(-0.68, -0.78, u), -0.88, d);
        P.fS = 0.22;
        break;
      }
      case 'air_punch': {
        // Phi Quyền Vovinam trên không: co gối tụ lực rồi đấm/bổ vũ khí lao dốc từ trên xuống
        P.torso = mix(0.18, -0.12, 0.56);
        P.head = -0.18;
        P.nT = 1.15; P.nS = -1.85; P.fT = 0.25; P.fS = -1.1;
        if (hasHoe) {
          hoeArms(P.torso, mix(0.65, 1.85, 0.85), mix(1.25, 2.05, 1.0), mix(2.38, 3.05, 1.38));
          break;
        }
        P.nA = mix(0.9, -0.35, 1.18); P.nE = mix(1.7, 1.9, 0.05);
        P.grip = style.weapon ? mix(0, 0.25, -0.85) : 0;
        P.fA = mix(0.5, 0.8, -0.45); P.fE = 2.0;
        break;
      }
      case 'hook_run': {
        // Xung Quyền (Shift + J): lao thấp người, xoắn vai tung cú móc ngang / bổ vũ khí cực mạnh
        P.torso = mix(0.28, -0.32, 0.68);
        P.hx = mix(0, -6, 10);
        P.nT = mix(0.7, 0.45, 1.15); P.nS = mix(-0.9, -0.7, -1.25);
        P.fT = mix(-0.6, -0.85, -0.95); P.fS = mix(0.2, 0.25, 0.3);
        if (hasHoe) {
          hoeArms(P.torso, mix(0.6, 1.8, 0.92), mix(1.22, 2.0, 1.08), mix(2.38, 3.12, 1.36));
          break;
        }
        if (style.weapon === 'mace') {
          P.nA = mix(0.34, 1.95, 0.82); P.nE = mix(1.08, 0.5, 0.12);
          P.grip = mix(-0.34, 0.35, -0.88);
          P.fA = mix(0.92, 1.1, 0.55); P.fE = 0.95;
          break;
        }
        P.nA = mix(0.6, -0.95, 1.65); P.nE = mix(1.7, 1.5, 0.85);
        P.grip = style.weapon ? mix(0, 0.3, -0.85) : 0;
        P.fA = mix(0.4, 0.9, -0.35); P.fE = 2.05;
        break;
      }
      case 'boss_stab': {
        // Đòn đâm đoản đao / mã tấu hiểm hóc: hạ thấp trọng tâm, duỗi cổ tay phóng mũi đao thẳng tắp
        P.torso = mix(0.16, -0.22, 0.62);
        P.hx = mix(0, -5, 9);
        P.nA = mix(0.7, -0.4, 1.52); P.nE = mix(1.7, 1.9, 0.02);
        P.grip = mix(0, -0.25, -1.12);
        P.fA = mix(0.4, 0.85, -0.5); P.fE = 1.95;
        P.nT = mix(0.68, 0.5, 1.2); P.nS = mix(-0.85, -0.65, -1.35);
        P.fT = mix(-0.55, -0.75, -0.95); P.fS = 0.22;
        break;
      }
      case 'boss_riposte': {
        // Phản trảm chớp nhoáng: lách người về sau rồi vung đòn chém chéo
        P.torso = mix(0.14, -0.38, 0.54);
        P.hx = mix(0, -6, 7);
        P.nA = mix(0.8, 2.25, 0.65); P.nE = mix(1.6, 0.4, 0.1);
        P.grip = style.weapon ? mix(0, 0.32, -0.82) : 0;
        P.fA = mix(0.4, 1.2, -0.3); P.fE = 1.85;
        P.nT = mix(0.65, 0.4, 1.05); P.nS = mix(-0.82, -0.55, -1.1);
        P.fT = mix(-0.55, -0.75, -0.7); P.fS = 0.2;
        break;
      }
      case 'boss_upper': {
        // Thăng Long Quyền của Boss: khuỵu gối sâu rồi bốc ngược nắm đấm lên trời
        P.torso = mix(0.22, 0.48, -0.24);
        P.hx = mix(0, 3, -2);
        P.lift = mix(0, 4, -5);
        P.nA = mix(0.65, -0.75, 2.42); P.nE = mix(1.8, 1.9, 0.35);
        P.grip = style.weapon ? mix(0, -0.55, -0.25) : 0;
        P.fA = mix(0.4, 0.8, 0.15); P.fE = 2.0;
        P.nT = mix(0.65, 1.1, 0.45); P.nS = mix(-0.85, -1.45, -0.35);
        P.fT = mix(-0.55, -0.3, -0.75); P.fS = 0.2;
        break;
      }
      case 'overhead_smash': {
        // Đập búa ngàn cân từ đỉnh đầu xuống sàn (EnemyArmored)
        P.torso = mix(0.16, -0.36, 0.66);
        P.hx = mix(0, -5, 8);
        P.lift = mix(0, -3, 4);
        P.nA = mix(0.7, 2.65, 0.32); P.nE = mix(1.6, 0.25, 0.12);
        P.grip = style.weapon ? mix(0, 0.35, -0.88) : 0;
        P.fA = mix(0.5, 2.55, 0.28); P.fE = mix(1.6, 0.25, 0.12);
        P.nT = mix(0.65, 0.5, 1.15); P.nS = mix(-0.85, -0.6, -1.35);
        P.fT = mix(-0.55, -0.7, -0.45); P.fS = 0.2;
        break;
      }
      case 'ram_charge': {
        // Húc vai / khiên thiết giáp lao tới (EnemyShield / Brawler)
        P.torso = mix(0.2, -0.15, 0.58);
        P.head = -0.25;
        P.hx = mix(0, -4, 9);
        P.nA = mix(0.85, 0.5, 1.15); P.nE = mix(1.8, 1.95, 1.65);
        P.fA = mix(0.6, 0.4, 0.95); P.fE = 1.95;
        P.nT = mix(0.7, 0.55, 1.25); P.nS = mix(-0.9, -0.75, -1.45);
        P.fT = mix(-0.6, -0.8, -0.95); P.fS = 0.25;
        break;
      }
      case 'ultimate_bash': {
        // LÔI HỎA PHÁ TRẬN (Triệu Đình An): Pha 1 (p < 0.58) dựng Khiên Hổ Phù ủi thẳng kéo địch; Pha 2 (p >= 0.58) vung Thiết Chùy giáng Thiên Lôi vỡ đất!
        if (p < 0.58) {
          const rushK = U.easeOut(U.clamp(p / 0.18));
          P.torso = U.lerp(0.16, 0.46, rushK);
          P.head = U.lerp(-0.05, -0.22, rushK);
          P.hx = U.lerp(0, 10, rushK);
          // Tay trái đẩy Khiên chắn ngang ngực lao tới
          P.fA = U.lerp(0.92, 1.32, rushK);
          P.fE = U.lerp(0.96, 0.52, rushK);
          // Tay phải giương cao Thiết Chùy tích tụ lôi điện phía trên/sau vai
          P.nA = U.lerp(0.34, 2.25, rushK);
          P.nE = U.lerp(1.08, 0.38, rushK);
          P.grip = U.lerp(-0.34, 0.32, rushK);
          // Chân đạp lướt tốc độ cao
          const stride = Math.sin(t * 22);
          P.nT = 0.85 + 0.45 * stride; P.nS = -1.05 - 0.35 * Math.max(0, stride);
          P.fT = -0.55 - 0.45 * stride; P.fS = 0.2;
        } else {
          const slamP = U.clamp((p - 0.58) / 0.42);
          const slamK = U.easeOut(U.clamp(slamP / 0.35));
          P.torso = U.lerp(-0.18, 0.58, slamK);
          P.head = U.lerp(0.12, -0.18, slamK);
          P.lift = U.lerp(-4, 4, slamK);
          P.hx = U.lerp(-3, 11, slamK);
          // Tay phải bổ Thiết Chùy Sấm Sét từ đỉnh đầu giáng thẳng xuống đất
          P.nA = U.lerp(2.55, 0.32, slamK);
          P.nE = U.lerp(0.28, 0.12, slamK);
          P.grip = U.lerp(0.38, -0.92, slamK);
          // Tay khiên mở sang bên giữ thăng bằng
          P.fA = U.lerp(1.15, -0.15, slamK);
          P.fE = U.lerp(0.6, 1.15, slamK);
          P.nT = U.lerp(0.55, 1.15, slamK); P.nS = U.lerp(-0.7, -1.45, slamK);
          P.fT = U.lerp(-0.6, -0.82, slamK); P.fS = 0.22;
        }
        break;
      }
      case 'kick_push': {
        P.torso = mix(0.14, 0.22, -0.42);
        P.hx = mix(0, 2, -4);
        P.nT = mix(0.62, 1.3, 1.55); P.nS = mix(-0.82, -2.2, -0.05);
        P.fT = mix(-0.55, -0.2, -0.1); P.fS = mix(0.15, 0.1, 0.0);
        if (hasHoe) {
          hoeArms(P.torso, mix(0.58, 0.72, 0.35), mix(1.22, 1.35, 1.05), mix(2.38, 2.55, 2.15));
        } else {
          P.nA = mix(0.7, 0.9, 1.15); P.nE = mix(1.8, 1.6, 1.35);
          P.fA = mix(0.35, 0.2, -0.9); P.fE = mix(1.95, 1.5, 1.0);
        }
        P.nF = U.lerp(0, P.nT + P.nS, ex);
        break;
      }
      case 'kick_roundhouse': {
        P.torso = mix(0.14, -0.1, -0.65);
        P.hx = mix(0, 3, 2);
        P.nT = mix(0.62, 1.15, 1.85); P.nS = mix(-0.82, -2.1, 0.2);
        P.fT = mix(-0.55, -0.3, -0.1); P.fS = mix(0.15, 0.3, 0.1);
        if (hasHoe) {
          hoeArms(P.torso, mix(0.58, 0.65, 0.25), mix(1.22, 1.3, 0.95), mix(2.38, 2.5, 2.05));
        } else {
          P.nA = mix(0.7, 0.8, -0.8); P.nE = mix(1.8, 1.5, 0.7);
          P.fA = mix(0.35, 0.9, 1.6); P.fE = mix(1.95, 1.7, 0.6);
        }
        P.nF = U.lerp(0, P.nT + P.nS - Math.PI / 2, ex);
        break;
      }
      case 'flying_kick': {
        const f = U.clamp(p * 7);
        P.torso = U.lerp(0.1, -0.6, f);
        P.nT = U.lerp(1.0, 1.6, f); P.nS = U.lerp(-1.7, 0.05, f);
        P.fT = U.lerp(0.35, 0.25, f); P.fS = U.lerp(-1.1, -1.8, f);
        if (hasHoe) {
          hoeArms(P.torso, U.lerp(0.6, 0.2, f), U.lerp(1.2, 0.9, f), U.lerp(2.38, 2.0, f));
        } else {
          P.nA = U.lerp(2.0, -0.7, f); P.nE = U.lerp(0.4, 0.4, f);
          P.fA = U.lerp(1.6, 1.95, f); P.fE = 0.35;
        }
        P.nF = U.lerp(0, P.nT + P.nS - Math.PI / 2, f);
        break;
      }
      case 'elbow_strike': {
        // Đánh Chỏ / Thúc Cán Vũ Khí cự ly gần phá thủ
        P.torso = mix(0.14, -0.3, 0.5);
        P.hx = mix(0, -4, 5);
        P.nT = mix(0.62, 0.7, 0.8); P.nS = mix(-0.82, -0.95, -0.68);
        P.fT = mix(-0.55, -0.6, -0.72); P.fS = mix(0.15, 0.2, 0.24);
        if (hasHoe) {
          // Hoàng Anh nắm ngang thân cuốc thúc mạnh chuôi/cán cuốc vào ngực địch
          hoeArms(P.torso, mix(0.58, 0.25, 1.15), mix(1.22, 0.95, 1.55), mix(2.38, 2.55, 2.15));
          break;
        }
        if (hasMaceShield && isDinhAn) {
          // Đình An thúc mạnh cạnh Khiên Hổ Phù + khuỷu tay phá giáp
          P.fA = mix(0.92, 0.55, 1.38); P.fE = mix(0.96, 1.35, 0.52);
          P.nA = mix(0.34, 0.15, 0.85); P.nE = mix(1.08, 1.25, 0.65); P.grip = -0.34;
          break;
        }
        P.nA = mix(0.7, 0.95, 1.35); P.nE = mix(1.8, 0.55, 0.12);
        P.fA = mix(0.35, 0.75, 0.45); P.fE = mix(1.95, 1.7, 1.75);
        break;
      }
      case 'kick_sweep': {
        // Quét Trụ Vovinam (Xà Tấn): hạ sát mặt sàn, một tay chống đất làm tâm,
        // chân quét duỗi thẳng quét vòng tròn quét ngã toàn bộ đối thủ
        P.lift = mix(0, 16, 21);
        P.torso = mix(0.14, 0.48, 0.62);
        P.head = mix(-0.05, -0.15, -0.32);
        P.hx = mix(0, 4, -6);
        // Chân trụ (chân xa): gập sâu sát đất dưới hông
        P.fT = mix(-0.55, 1.25, 1.4); P.fS = mix(0.15, -2.35, -2.5); P.fF = mix(0, 0.15, 0.25);
        // Chân quét (chân gần): duỗi thẳng sát mặt sàn
        P.nT = mix(0.62, 1.52, 1.62); P.nS = mix(-0.82, -0.05, 0.0);
        P.nF = -0.45;
        if (hasHoe) {
          hoeArms(P.torso, mix(0.58, 0.8, 0.95), mix(1.22, 1.3, 1.4), mix(2.38, 2.2, 2.0));
          break;
        }
        // Tay chống đất (tay xa): cắm thẳng xuống sàn làm điểm tựa xoay
        P.fA = mix(0.35, 1.15, 1.4); P.fE = mix(1.95, 0.35, 0.18);
        // Tay vung thăng bằng (tay gần): giật mạnh ra sau đầu lấy đà xoay
        P.nA = mix(0.7, -0.65, -1.25); P.nE = mix(1.8, 0.8, 0.35);
        break;
      }
      case 'uppercut': {
        // Thôi Sơn Thượng (Đấm Móc Ngược / Hất Vũ Khí Lên Trời)
        P.lift = mix(0, 9, -15);
        P.torso = mix(0.14, 0.38, -0.24);
        P.head = mix(-0.05, 0.12, -0.28);
        P.hx = mix(0, -3, 6);
        // Chân: nén thấp gối rồi đạp thẳng lên trời
        P.nT = mix(0.62, 0.98, 0.18); P.nS = mix(-0.82, -1.6, -0.25);
        P.fT = mix(-0.55, -0.75, -0.25); P.fS = mix(0.15, 0.45, 0.1);
        if (hasHoe) {
          // Hoàng Anh hạ thấp mũi cuốc rồi hất tung lưỡi cuốc từ dưới đất vút lên cao
          hoeArms(P.torso, mix(0.58, 0.32, 1.78), mix(1.22, 0.55, 1.98), mix(2.38, 1.35, 2.78));
          break;
        }
        if (style.weapon === 'mace') {
          P.nA = mix(0.34, -0.45, 2.25); P.nE = mix(1.08, 1.25, 0.35);
          P.grip = mix(-0.34, -0.75, -0.25);
          P.fA = mix(0.92, 0.85, 0.45); P.fE = 0.95;
          break;
        }
        // Nắm đấm móc (tay gần): từ hông vung vụt lên trời, gập khuỷu tay 90 độ (không duỗi thẳng đơ)
        P.nA = mix(0.7, -0.35, 2.75); P.nE = mix(1.8, 2.15, 1.25);
        P.grip = style.weapon ? mix(0, -0.55, -0.25) : 0;
        // Tay thủ (tay xa): che cằm rồi giật về hông cân bằng lực
        P.fA = mix(0.35, 0.85, -0.35); P.fE = mix(1.95, 2.05, 1.7);
        break;
      }
      case 'scissor_kick': {
        const flip = U.clamp((p - 0.12) / 0.62);
        const open = Math.sin(U.clamp((p - 0.2) / 0.5) * Math.PI);
        P.roll = -U.easeInOut(flip) * Math.PI * 2;
        P.fixedHy = 40; P.fixW = 1;
        P.torso = 0.1;
        P.nT = 0.4 + 1.2 * open; P.nS = -0.2 - 0.3 * open;
        P.fT = -0.4 - 1.2 * open; P.fS = -0.2;
        P.nA = 1.6; P.nE = 0.4; P.fA = -1.4; P.fE = 0.4;
        break;
      }
      case 'dodge': {
        P.torso = 0.55; P.head = -0.3;
        P.nT = 1.15; P.nS = -1.85; P.fT = -0.4; P.fS = -1.0;
        if (hasHoe) {
          hoeArms(P.torso, 0.52, 1.18, 2.28);
          break;
        }
        P.nA = 0.9; P.nE = 1.7; P.fA = 0.7; P.fE = 1.9;
        break;
      }
      case 'landing': {
        // Tiếp đất võ thuật Vovinam: Đứng vững hai chân trên sàn, thân thẳng đĩnh đạc, đầu ngẩng cao quan sát đối thủ, hai tay thủ vững (không bị gục/khuỵu ngã)
        P.torso = 0.10;
        P.head = 0.04;
        P.lift = 0;
        P.nT = 0.62; P.nS = -0.80; P.fT = -0.55; P.fS = 0.18;
        if (hasHoe) {
          hoeArms(P.torso, 0.54, 1.18, 2.34);
          break;
        }
        P.nA = 0.82; P.nE = 1.55; P.fA = 0.45; P.fE = 1.72;
        break;
      }

      case 'counter_hand_prep': {
        // Vovinam Thủ Thế Bắt Đòn Tay / Chuẩn bị đòn: Đứng vững hai chân, hai tay dâng cao trước ngực, nhấp nhổm theo nhịp thở
        const sw = Math.sin(t * 7.5);
        P.torso = 0.18 + 0.02 * sw; P.head = -0.05;
        P.hx = sw * 1.5;
        P.nT = 0.72; P.nS = -1.05; P.fT = -0.6; P.fS = 0.22;
        if (hasHoe) {
          hoeArms(P.torso, 0.68 + 0.04 * sw, 1.32, 2.48 + 0.04 * sw);
          break;
        }
        P.nA = 1.25 + 0.06 * sw; P.nE = 1.45; P.fA = 1.1 - 0.04 * sw; P.fE = 1.6;
        break;
      }
      case 'counter_leg_prep': {
        // Vovinam Thủ Thế Gạt Phá Đòn Chân / Chuẩn bị cước: Chùng thấp trọng tâm, nhấc nhẹ chân trước
        const sw = Math.sin(t * 7.5);
        P.torso = 0.28 + 0.02 * sw; P.head = -0.1;
        P.lift = 4 + 1.2 * sw;
        P.hx = sw * 1.2;
        P.nT = 0.95; P.nS = -1.45; P.fT = -0.68; P.fS = 0.35;
        if (hasHoe) {
          hoeArms(P.torso, 0.55 + 0.04 * sw, 1.18, 2.30 + 0.04 * sw);
          break;
        }
        P.nA = 0.85 + 0.05 * sw; P.nE = 1.8; P.fA = 0.65 - 0.04 * sw; P.fE = 1.85;
        break;
      }
      case 'counter_hand_recovery': {
        // Bắt hụt đòn tay: hơi mất thăng bằng tiến về trước, hở sườn
        P.torso = 0.32; P.head = 0.1;
        P.nT = 0.85; P.nS = -1.15; P.fT = -0.55; P.fS = 0.1;
        P.nA = 0.55; P.nE = 1.35; P.fA = 0.25; P.fE = 1.5;
        break;
      }
      case 'counter_leg_recovery': {
        // Gạt hụt đòn chân: trọng tâm bị dồn, sơ hở phòng thủ
        P.torso = 0.38; P.head = 0.08;
        P.nT = 1.05; P.nS = -1.65; P.fT = -0.45; P.fS = 0.15;
        P.nA = 0.45; P.nE = 1.25; P.fA = 0.3; P.fE = 1.4;
        break;
      }
      case 'hurt': {
        const k = 1 - p;
        P.torso = -0.4 * k + 0.1 * (1 - k);
        P.head = -0.4 * k;
        P.hx = -5 * k;
        P.nA = 0.2 - 0.6 * k; P.nE = 0.9; P.fA = -0.3 * k; P.fE = 0.8;
        P.nT = 0.3; P.nS = -0.5; P.fT = -0.7; P.fS = 0.1;
        break;
      }
      case 'knockdown': {
        P.roll = -1.45; P.fixedHy = 9; P.fixW = 1; P.torso = 0.0; P.head = -0.15;
        P.nT = 0.25; P.nS = -0.2; P.fT = 0.5; P.fS = -0.1;
        P.nA = 0.9; P.nE = 0.3; P.fA = 0.6; P.fE = 0.3;
        break;
      }
      case 'getup': {
        const k = U.easeInOut(p);
        P.roll = U.lerp(-1.45, 0, k);
        P.fixedHy = U.lerp(9, 44, k); P.fixW = p < 0.75 ? 1 : 0;
        P.torso = U.lerp(0, 0.14, k);
        P.nT = U.lerp(0.25, 0.62, k); P.nS = U.lerp(-0.2, -0.82, k);
        break;
      }
      case 'victory': {
        const b = Math.sin(t * 5) * 0.06;
        P.torso = -0.05; P.head = -0.15;
        P.nT = 0.3; P.nS = -0.2; P.fT = -0.3; P.fS = 0.1;
        P.nA = 2.6 + b; P.nE = 0.3; P.fA = 2.4 - b; P.fE = 0.2;
        break;
      }
      case 'ultimate_flurry': {
        const c = t * 26;
        const a = Math.max(0, Math.sin(c)), b = Math.max(0, -Math.sin(c));
        const kk = Math.max(0, Math.sin(c / 2));
        P.torso = 0.35;
        P.nA = U.lerp(0.4, 1.25, a); P.nE = U.lerp(1.8, 0.1, a);
        P.fA = U.lerp(0.4, 1.25, b); P.fE = U.lerp(1.9, 0.1, b);
        P.nT = 0.5 + 0.9 * kk; P.nS = -0.8 + 0.8 * kk;
        P.fT = -0.5; P.fS = 0.1;
        break;
      }
      case 'ultimate_slam': {
        // Thổng Sơn Đại Chùy (Hoàng Anh): bật cao, giơ cuốc (hoặc song chưởng Vovinam) quá đầu -> lao xuống nện vỡ mặt đất -> khuỵu gối thu thế
        const airborne = (e.z || 0) < -2;
        if (airborne && (e.vz || 0) > 60) {
          // đang bay lên: co chân, hai tay vung cuốc / song chưởng lên cao quá đầu
          P.torso = -0.22; P.head = 0.12;
          P.nT = 1.1; P.nS = -1.8; P.fT = 0.5; P.fS = -1.3; P.nF = -0.4; P.fF = -0.4;
          if (hasHoe) {
            hoeArms(P.torso, 2.05, 2.35, 3.12);
          } else {
            P.nA = 2.65; P.nE = 0.35; P.fA = 2.45; P.fE = 0.4;
          }
        } else if (airborne) {
          // rơi xuống: thân chúi mạnh, cuốc / song chưởng bổ thẳng xuống
          P.torso = 0.58; P.head = -0.22;
          P.nT = 0.5; P.nS = -0.2; P.fT = -0.3; P.fS = -0.1;
          if (hasHoe) {
            hoeArms(P.torso, 0.92, 1.12, 1.42);
          } else {
            P.nA = 0.55; P.nE = 0.2; P.fA = 0.45; P.fE = 0.25;
          }
        } else {
          // chạm đất: khuỵu sâu, hai tay cắm mũi cuốc / song chưởng xuống nền đá
          const k = U.clamp(((e.stateTimer || 0) - (e._slamAt || 0)) / 0.5);
          const crouch = 1 - U.easeInOut(k);
          P.torso = 0.18 + 0.46 * crouch; P.head = -0.12 * crouch;
          P.nT = 0.72 + 0.58 * crouch; P.nS = -0.92 - 1.05 * crouch;
          P.fT = -0.62 + 0.78 * crouch; P.fS = 0.2 - 1.15 * crouch;
          if (hasHoe) {
            hoeArms(
              P.torso,
              0.58 + 0.24 * crouch,
              1.22 - 0.18 * crouch,
              2.38 - 1.02 * crouch
            );
          } else {
            P.nA = 0.7 - 0.45 * crouch; P.nE = 1.8 - 1.45 * crouch;
            P.fA = 0.35 - 0.15 * crouch; P.fE = 1.95 - 1.55 * crouch;
          }
          P.hx = 5 * crouch;
        }
        break;
      }
      // ---------------------------------------------------------------- POSE MỚI
      case 'boss_swing': {
        if (hasHoe) {
          // Hoàng Anh: kéo cuốc lên cao qua vai (telegraph rõ), dồn trọng tâm rồi bổ chéo xuống nặng nề
          const u = U.cham(p), d = U.ext(p);
          P.torso = U.lerp(U.lerp(0.18, -0.34, u), 0.5, d);
          P.head = U.lerp(-0.06, 0.12, d);
          P.lift = U.lerp(U.lerp(0, -2, u), 3, d);
          P.hx = U.lerp(U.lerp(0, -8, u), 10, d);
          hoeArms(P.torso,
            U.lerp(U.lerp(0.58, 1.82, u), 0.88, d),
            U.lerp(U.lerp(1.22, 2.05, u), 1.06, d),
            U.lerp(U.lerp(2.38, 3.12, u), 1.38, d));
          P.nT = U.lerp(U.lerp(0.76, 0.6, u), 1.02, d); P.nS = U.lerp(U.lerp(-0.98, -0.8, u), -1.25, d);
          P.fT = U.lerp(U.lerp(-0.68, -0.85, u), -0.35, d); P.fS = U.lerp(U.lerp(0.22, 0.3, u), 0.12, d);
          break;
        }
        // Gồng vũ khí ra sau rồi quét ngang một nhát lớn (tầm rộng, telegraph rõ)
        P.torso = mix(0.2, -0.28, 0.6);
        P.hx = mix(0, -6, 5);
        P.nA = mix(0.5, -1.15, 1.5); P.nE = mix(1.7, 1.5, 0.12);
        P.grip = style.weapon ? mix(0, 0.35, -0.82) : 0;
        P.fA = mix(0.3, -1.35, 1.38); P.fE = mix(1.9, 1.6, 0.18);
        P.nT = mix(0.6, 0.95, 1.25); P.nS = mix(-0.8, -1.45, -0.12);
        P.fT = mix(-0.5, -0.42, -0.32); P.fS = mix(0.15, 0.2, 0.1);
        break;
      }
      case 'boss_slam': {
        // Nện xuống đất: tay giơ cao rồi đập xuống, thân chúi tới
        const u = U.cham(p), d = U.ext(p);
        if (hasHoe) {
          // Hoàng Anh: nhún gối bật người, giơ cuốc quá đầu, rồi đáp xuống bổ thẳng mũi cuốc vào nền đá
          P.torso = U.lerp(U.lerp(0.18, -0.28, u), 0.58, d);
          P.head = U.lerp(-0.06, 0.16, d);
          P.lift = U.lerp(U.lerp(0, -5, u), 4, d);
          P.hx = U.lerp(U.lerp(0, -4, u), 9, d);
          hoeArms(P.torso,
            U.lerp(U.lerp(0.58, 2.05, u), 0.85, d),
            U.lerp(U.lerp(1.22, 2.28, u), 1.02, d),
            U.lerp(U.lerp(2.38, 3.15, u), 1.35, d));
          P.nT = U.lerp(U.lerp(0.76, 0.52, u), 1.05, d); P.nS = U.lerp(U.lerp(-0.98, -0.6, u), -1.32, d);
          P.fT = U.lerp(U.lerp(-0.68, -0.35, u), -0.48, d); P.fS = U.lerp(U.lerp(0.22, 0.12, u), 0.2, d);
          break;
        }
        P.torso = U.lerp(U.lerp(0.14, -0.18, u), 0.55, d);
        P.hx = mix(0, -3, 7);
        P.nA = U.lerp(U.lerp(0.5, 2.55, u), 0.38, d); P.nE = U.lerp(1.6, 0.18, Math.max(u, d));
        P.grip = style.weapon ? U.lerp(U.lerp(0, 0.35, u), -0.92, d) : 0;
        P.fA = U.lerp(U.lerp(0.35, 2.35, u), 0.32, d); P.fE = U.lerp(1.75, 0.25, Math.max(u, d));
        P.nT = mix(0.6, 1.05, d); P.nS = mix(-0.8, -1.5, d);
        P.fT = mix(-0.5, -0.4, d); P.fS = 0.15;
        break;
      }
      case 'boss_throw': {
        // Ném đồ môi trường: tay ra sau rồi vung tới
        const u = U.cham(p), d = U.ext(p);
        P.torso = U.lerp(U.lerp(0.14, 0.3, u), -0.25, d);
        P.nA = U.lerp(U.lerp(0.5, -1.55, u), 2.4, d); P.nE = U.lerp(1.7, 0.25, Math.max(u, d));
        P.fA = 0.4; P.fE = 1.85;
        P.nT = mix(0.6, 0.85, d); P.nS = mix(-0.8, -1.2, d);
        P.fT = -0.5; P.fS = 0.15;
        break;
      }
      case 'boss_taunt': {
        // Dừng lại nói (hội thoại giữa trận): chỉ tay về phía trước
        const b = Math.sin(t * 4) * 0.05;
        P.torso = 0.1; P.head = -0.08;
        P.nA = 1.4 + b; P.nE = 0.12;
        P.fA = 0.5; P.fE = 1.7;
        P.nT = 0.5; P.nS = -0.7; P.fT = -0.5; P.fS = 0.2;
        P.hx = Math.sin(t * 2) * 1.5;
        break;
      }
      // ===== BỘ ĐÒN VÕ THUẬT PHÓ ĐẶNG HOÀNG ANH: CUỐC SẮT & THÁI CỰC BÁT QUÁI CƯỚC =====
      case 'boss_thrust': {
        // Đột kích mũi cuốc xới đất: hai tay lao cán cuốc thẳng tới trước theo đinh tấn
        P.torso = mix(0.18, -0.15, 0.46);
        P.hx = mix(0, -4, 8);
        if (hasHoe) {
          hoeArms(P.torso, mix(0.58, 0.3, 1.22), mix(1.22, 0.95, 1.42), mix(2.38, 2.02, 1.56));
        } else {
          P.nA = mix(0.7, -0.2, 1.38); P.nE = mix(1.8, 1.6, 0.1);
          P.fA = mix(0.35, -0.1, 1.25); P.fE = mix(1.95, 1.7, 0.15);
        }
        P.nT = mix(0.7, 0.45, 1.15); P.nS = mix(-0.9, -0.6, -1.35);
        P.fT = mix(-0.6, -0.85, -0.2); P.fS = mix(0.2, 0.1, 0.05);
        break;
      }
      case 'boss_chain1': {
        // Hoành Tảo Sơn Hà: Quét cuốc vòng cung 120 độ mở màn
        P.torso = mix(0.18, -0.32, 0.48);
        P.hx = mix(0, -6, 8);
        if (hasHoe) {
          hoeArms(P.torso, mix(0.58, 1.78, 0.92), mix(1.22, 2.02, 1.08), mix(2.38, 3.12, 1.38));
        } else {
          P.nA = mix(0.7, -0.8, 1.48); P.nE = mix(1.8, 1.6, 0.25);
          P.fA = mix(0.35, 0.8, -0.3); P.fE = 1.9;
        }
        P.nT = mix(0.7, 0.85, 1.2); P.nS = mix(-0.9, -1.3, -0.3);
        P.fT = mix(-0.6, -0.5, -0.3); P.fS = mix(0.2, 0.15, 0.1);
        P.lift = mix(0, -2, 3); P.head = mix(-0.06, 0.1, -0.12);
        break;
      }
      case 'boss_chain2': {
        // Phục Địa Kích: Bổ ngược mũi cuốc từ dưới sàn hất lên cao
        P.torso = mix(0.2, 0.42, -0.22);
        P.hx = mix(0, 4, -3);
        if (hasHoe) {
          hoeArms(P.torso, mix(0.58, 0.35, 1.75), mix(1.22, 0.6, 1.98), mix(2.38, 1.32, 2.75));
        } else {
          P.nA = mix(0.7, -0.35, 2.45); P.nE = mix(1.8, 1.95, 0.45);
          P.fA = mix(0.35, 0.75, 0.1); P.fE = 1.9;
        }
        P.nT = mix(0.7, 0.9, 0.4); P.nS = mix(-0.9, -1.3, -0.8);
        P.fT = mix(-0.6, -0.4, -0.8); P.fS = mix(0.2, 0.15, 0.1);
        P.lift = mix(0, -2, 3); P.head = mix(-0.06, 0.15, -0.1);
        break;
      }
      case 'boss_chain3': {
        // Thái Cực Bát Quái Cước: Chống cán cuốc xuống đất xoay người quét cước vòng cầu
        const u = U.cham(p), d = U.ext(p);
        P.torso = U.lerp(U.lerp(0.18, 0.35, u), -0.35, d);
        P.hx = mix(0, 4, -6);
        if (hasHoe) {
          hoeArms(P.torso, U.lerp(0.58, 0.7, Math.max(u, d)), U.lerp(1.22, 1.32, Math.max(u, d)), U.lerp(2.38, 2.55, Math.max(u, d)));
        } else {
          P.nA = U.lerp(0.7, -0.5, d); P.nE = 1.4;
          P.fA = U.lerp(0.35, 1.2, d); P.fE = 1.5;
        }
        P.nT = mix(0.7, 1.1, 0.4); P.nS = mix(-0.9, -1.5, -0.8);
        P.fT = U.lerp(U.lerp(-0.6, -1.0, u), 1.65, d);
        P.fS = U.lerp(U.lerp(0.2, -0.8, u), -0.2, d);
        P.lift = U.lerp(0, 2, u) - 2 * d;
        P.head = U.lerp(-0.06, 0.12, d);
        break;
      }
      default: this.weaponPose(P, e, st); break;
    }

    // Thế thủ cầm vũ khí (côn / đao / khiên) khi đứng hoặc đi
    if (e.stance && window.WP_STANCES && (st === 'idle' || st === 'walk')) {
      const S = window.WP_STANCES[e.stance];
      const o = S && S[st];
      if (o) for (const k in o) P[k] = o[k];
    }

    // Đòn không dùng pose riêng cho chân sau (đứng vững) ở trạng thái locomotion
    return P;
  }

  // Pose đòn vũ khí theo dữ liệu (window.WP_POSES): rest -> wind -> strike -> rest
}

window.SkeletalRendererPose = SkeletalRendererPose;
})();
