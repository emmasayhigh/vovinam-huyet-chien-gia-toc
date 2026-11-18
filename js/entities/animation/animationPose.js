/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/animation/animationPose.js - Tinh pose xuong dung chung cho cac trang thai co ban.
 * Cac pose dac trung cua tung nhan vat (Nghi, Dinh An, Hoang Anh...) duoc tach rieng trong js/entities/characters/*.js.
 */

(function () {
const { AnimUtil, POSE_ALIAS } = window;

class SkeletalRendererPose extends window.SkeletalRendererBase {
  calculatePose(e) {
    const U = AnimUtil;
    const t = e.animTime || 0;
    const rawState = e.state || 'idle';
    const st = POSE_ALIAS[rawState] || rawState;
    const style = this.getStyle(e);
    const p = U.progress(e);
    const ch = U.cham(p);
    const ex = U.ext(p);
    const stg = U.stage5(p);
    const mix = (rest, cham, ext) => U.lerp(U.lerp(rest, cham, ch), ext, ex);

    const hasHoe = (style.weapon === 'hoe');
    const hasMaceShield = (style.weapon === 'mace' || style.shield);

    const P = {
      hx: 0, torso: 0.14, head: -0.05, lift: 0, roll: 0, fixedHy: 44, fixW: 0,
      grip: 0,
      nT: 0.62, nS: -0.82, nF: 0, fT: -0.55, fS: 0.15, fF: 0,
      nA: 0.7, nE: 1.8, fA: 0.35, fE: 1.95
    };

    const ctx = { e, style, U, t, p, ch, ex, stg, mix, hasHoe, hasMaceShield, rawState };

    if (window.CharacterRegistry) {
      window.CharacterRegistry.initEntityPose(P, e, ctx);
    }

    // Cho phép nhân vật xử lý theo rawState trước (tránh bị POSE_ALIAS đè lên ultimate / counter / combo riêng)
    const handledByCharacter = window.CharacterRegistry
      ? (window.CharacterRegistry.applyEntityPose(P, e, rawState, ctx) ||
         (rawState !== st && window.CharacterRegistry.applyEntityPose(P, e, st, ctx)))
      : false;

    if (!handledByCharacter) {
      switch (st) {
        case 'idle': {
          const b = Math.sin(t * 3.0);
          P.torso = 0.05 + 0.015 * b;
          P.hx = Math.sin(t * 1.5) * 0.8;
          const kneeB = Math.sin(t * 3.0) * 0.03;
          P.nT = 0.36 + kneeB;
          P.nS = -0.46 - kneeB * 1.1;
          P.fT = -0.32 - kneeB * 0.7;
          P.fS = 0.08 + kneeB * 0.8;
          P.lift = Math.sin(t * 3.0) * 1.2;
          P.nA = 0.86 + 0.03 * b;
          P.nE = 0.76 + 0.02 * b;
          P.fA = 0.16 - 0.03 * b;
          P.fE = 1.52;
          P.head = -0.02 + 0.015 * b;
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
          const c = t * 9 * dir, s = Math.sin(c), co = Math.cos(c);
          P.torso = isBackpedal ? 0.08 : 0.16;
          P.nT = 0.15 + 0.6 * s; P.nS = -(0.2 + 0.9 * Math.max(0, co));
          P.fT = 0.15 - 0.6 * s; P.fS = -(0.2 + 0.9 * Math.max(0, -co));
          if (isBackpedal) {
            P.nA = 0.42; P.nE = 1.08; P.fA = 0.48; P.fE = 1.15;
          } else {
            P.nA = 0.18 + 0.30 * s; P.nE = 0.88; P.fA = 0.32 - 0.30 * s; P.fE = 0.96;
          }
          break;
        }
        case 'run': {
          const c = t * 14, s = Math.sin(c), co = Math.cos(c);
          P.torso = 0.42; P.head = -0.2;
          P.nT = 0.2 + 0.95 * s; P.nS = -(0.3 + 1.25 * Math.max(0, co));
          P.fT = 0.2 - 0.95 * s; P.fS = -(0.3 + 1.25 * Math.max(0, -co));
          P.nF = -0.5 * Math.max(0, co); P.fF = -0.5 * Math.max(0, -co);
          P.nA = 0.05 - 0.65 * s; P.nE = 0.78; P.fA = 0.15 + 0.65 * s; P.fE = 0.82;
          break;
        }
        case 'jump_up': {
          P.torso = 0.1;
          P.nT = 1.0; P.nS = -1.7; P.fT = 0.35; P.fS = -1.1; P.nF = -0.5; P.fF = -0.5;
          P.nA = -0.55; P.nE = 0.95; P.fA = 1.45; P.fE = 0.65;
          break;
        }
        case 'jump_fall': {
          P.torso = 0.05;
          P.nT = 0.5; P.nS = -0.3; P.fT = -0.3; P.fS = -0.15;
          P.nA = 0.55; P.nE = 0.90; P.fA = 0.85; P.fE = 0.75;
          break;
        }
        case 'guard': {
          P.torso = 0.24; P.head = -0.1;
          P.nT = 0.85; P.nS = -1.25; P.fT = -0.7; P.fS = 0.2;
          P.nA = 0.52; P.nE = 1.12; P.fA = 0.88; P.fE = 1.05;
          break;
        }
        case 'punch_straight': {
          P.torso = mix(0.14, -0.05, 0.46);
          P.hx = mix(0, -2, 4);
          P.nA = mix(0.45, -0.15, 1.38); P.nE = mix(1.10, 1.35, 0.02);
          P.grip = style.weapon ? mix(0, 0.15, -0.95) : 0;
          P.fA = mix(0.28, -0.35, -0.45); P.fE = mix(1.25, 1.45, 1.55);
          P.nT = mix(0.62, 0.62, 0.85); P.nS = mix(-0.82, -0.82, -0.5);
          P.fT = mix(-0.55, -0.55, -0.75); P.fS = mix(0.15, 0.15, 0.25);
          break;
        }
        case 'punch_hook': {
          P.torso = mix(0.14, -0.25, 0.58);
          P.hx = mix(0, -3, 5);
          P.nA = mix(0.45, -0.45, 1.35); P.nE = mix(1.10, 1.25, 0.85);
          P.grip = style.weapon ? mix(0, 0.3, -0.78) : 0;
          P.fA = mix(0.28, 0.35, -0.15); P.fE = mix(1.25, 1.35, 1.30);
          P.nT = mix(0.62, 0.62, 0.85); P.nS = mix(-0.82, -0.82, -0.65);
          P.fT = mix(-0.55, -0.55, -0.7); P.fS = mix(0.15, 0.15, 0.2);
          break;
        }
        case 'air_punch': {
          P.torso = mix(0.18, -0.12, 0.56);
          P.head = -0.18;
          P.nT = 1.15; P.nS = -1.85; P.fT = 0.25; P.fS = -1.1;
          P.nA = mix(0.9, -0.35, 1.18); P.nE = mix(1.7, 1.9, 0.05);
          P.grip = style.weapon ? mix(0, 0.25, -0.85) : 0;
          P.fA = mix(0.5, 0.8, -0.45); P.fE = 2.0;
          break;
        }
        case 'hook_run': {
          P.torso = mix(0.28, -0.32, 0.68);
          P.hx = mix(0, -6, 10);
          P.nT = mix(0.7, 0.45, 1.15); P.nS = mix(-0.9, -0.7, -1.25);
          P.fT = mix(-0.6, -0.85, -0.95); P.fS = mix(0.2, 0.25, 0.3);
          P.nA = mix(0.6, -0.95, 1.65); P.nE = mix(1.7, 1.5, 0.85);
          P.grip = style.weapon ? mix(0, 0.3, -0.85) : 0;
          P.fA = mix(0.4, 0.9, -0.35); P.fE = 2.05;
          break;
        }
        case 'boss_stab': {
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
          P.torso = mix(0.2, -0.15, 0.58);
          P.head = -0.25;
          P.hx = mix(0, -4, 9);
          P.nA = mix(0.85, 0.5, 1.15); P.nE = mix(1.8, 1.95, 1.65);
          P.fA = mix(0.6, 0.4, 0.95); P.fE = 1.95;
          P.nT = mix(0.7, 0.55, 1.25); P.nS = mix(-0.9, -0.75, -1.45);
          P.fT = mix(-0.6, -0.8, -0.95); P.fS = 0.25;
          break;
        }
        case 'kick_push': {
          P.torso = mix(0.14, 0.22, -0.42);
          P.hx = mix(0, 2, -4);
          P.nT = mix(0.62, 1.3, 1.55); P.nS = mix(-0.82, -2.2, -0.05);
          P.fT = mix(-0.55, -0.2, -0.1); P.fS = mix(0.15, 0.1, 0.0);
          P.nA = mix(0.7, 0.9, 1.15); P.nE = mix(1.8, 1.6, 1.35);
          P.fA = mix(0.35, 0.2, -0.9); P.fE = mix(1.95, 1.5, 1.0);
          P.nF = U.lerp(0, P.nT + P.nS, ex);
          break;
        }
        case 'kick_roundhouse': {
          P.torso = mix(0.14, -0.1, -0.65);
          P.hx = mix(0, 3, 2);
          P.nT = mix(0.62, 1.15, 1.85); P.nS = mix(-0.82, -2.1, 0.2);
          P.fT = mix(-0.55, -0.3, -0.1); P.fS = mix(0.15, 0.3, 0.1);
          P.nA = mix(0.7, 0.8, -0.8); P.nE = mix(1.8, 1.5, 0.7);
          P.fA = mix(0.35, 0.9, 1.6); P.fE = mix(1.95, 1.7, 0.6);
          P.nF = U.lerp(0, P.nT + P.nS - Math.PI / 2, ex);
          break;
        }
        case 'flying_kick': {
          const f = U.clamp(p * 7);
          P.torso = U.lerp(0.1, -0.6, f);
          P.nT = U.lerp(1.0, 1.6, f); P.nS = U.lerp(-1.7, 0.05, f);
          P.fT = U.lerp(0.35, 0.25, f); P.fS = U.lerp(-1.1, -1.8, f);
          P.nA = U.lerp(2.0, -0.7, f); P.nE = U.lerp(0.4, 0.4, f);
          P.fA = U.lerp(1.6, 1.95, f); P.fE = 0.35;
          P.nF = U.lerp(0, P.nT + P.nS - Math.PI / 2, f);
          break;
        }
        case 'elbow_strike': {
          P.torso = mix(0.14, -0.18, 0.30);
          P.hx = mix(0, -3, 5);
          P.nT = mix(0.62, 0.7, 0.84); P.nS = mix(-0.82, -0.95, -0.74);
          P.fT = mix(-0.55, -0.6, -0.76); P.fS = mix(0.15, 0.2, 0.28);
          P.nA = mix(0.32, -0.25, 1.24); P.nE = mix(1.08, 1.15, -1.85);
          P.fA = mix(0.28, 0.32, -0.45); P.fE = mix(1.15, 1.15, 1.20);
          break;
        }
        case 'kick_sweep': {
          P.lift = mix(0, 16, 21);
          P.torso = mix(0.14, 0.48, 0.62);
          P.head = mix(-0.05, -0.15, -0.32);
          P.hx = mix(0, 4, -6);
          P.fT = mix(-0.55, 1.25, 1.4); P.fS = mix(0.15, -2.35, -2.5); P.fF = mix(0, 0.15, 0.25);
          P.nT = mix(0.62, 1.52, 1.62); P.nS = mix(-0.82, -0.05, 0.0);
          P.nF = -0.45;
          P.fA = mix(0.35, 1.15, 1.4); P.fE = mix(1.95, 0.35, 0.18);
          P.nA = mix(0.7, -0.65, -1.25); P.nE = mix(1.8, 0.8, 0.35);
          break;
        }
        case 'uppercut': {
          P.lift = mix(0, 9, -15);
          P.torso = mix(0.14, 0.38, -0.24);
          P.head = mix(-0.05, 0.12, -0.28);
          P.hx = mix(0, -3, 6);
          P.nT = mix(0.62, 0.98, 0.18); P.nS = mix(-0.82, -1.6, -0.25);
          P.fT = mix(-0.55, -0.75, -0.25); P.fS = mix(0.15, 0.45, 0.1);
          P.nA = mix(0.45, -0.25, 1.85); P.nE = mix(1.10, 1.45, 0.72);
          P.grip = style.weapon ? mix(0, -0.55, -0.25) : 0;
          P.fA = mix(0.28, 0.40, -0.35); P.fE = mix(1.25, 1.45, 1.35);
          break;
        }
        case 'dodge': {
          P.torso = 0.55; P.head = -0.3;
          P.nT = 1.15; P.nS = -1.85; P.fT = -0.4; P.fS = -1.0;
          P.nA = 0.22; P.nE = 1.15; P.fA = 0.45; P.fE = 1.10;
          break;
        }
        case 'landing': {
          P.torso = 0.10;
          P.head = 0.04;
          P.lift = 0;
          P.nT = 0.62; P.nS = -0.80; P.fT = -0.55; P.fS = 0.18;
          P.nA = 0.42; P.nE = 1.12; P.fA = 0.52; P.fE = 1.10;
          break;
        }
        case 'counter_hand_prep': {
          const sw = Math.sin(t * 7.5);
          P.torso = 0.18 + 0.02 * sw; P.head = -0.05;
          P.hx = sw * 1.5;
          P.nT = 0.72; P.nS = -1.05; P.fT = -0.6; P.fS = 0.22;
          P.nA = 0.62 + 0.06 * sw; P.nE = 1.05; P.fA = 0.92 - 0.04 * sw; P.fE = 0.98;
          break;
        }
        case 'counter_leg_prep': {
          const sw = Math.sin(t * 7.5);
          P.torso = 0.28 + 0.02 * sw; P.head = -0.1;
          P.lift = 4 + 1.2 * sw;
          P.hx = sw * 1.2;
          P.nT = 0.95; P.nS = -1.45; P.fT = -0.68; P.fS = 0.35;
          P.nA = 0.45 + 0.05 * sw; P.nE = 1.15; P.fA = 0.65 - 0.04 * sw; P.fE = 1.08;
          break;
        }
        case 'counter_hand_recovery': {
          P.torso = 0.32; P.head = 0.1;
          P.nT = 0.85; P.nS = -1.15; P.fT = -0.55; P.fS = 0.1;
          P.nA = 0.55; P.nE = 1.35; P.fA = 0.25; P.fE = 1.5;
          break;
        }
        case 'counter_leg_recovery': {
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
        case 'boss_swing': {
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
          const u = U.cham(p), d = U.ext(p);
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
          const u = U.cham(p), d = U.ext(p);
          P.torso = U.lerp(U.lerp(0.14, 0.3, u), -0.25, d);
          P.nA = U.lerp(U.lerp(0.5, -1.55, u), 2.4, d); P.nE = U.lerp(1.7, 0.25, Math.max(u, d));
          P.fA = 0.4; P.fE = 1.85;
          P.nT = mix(0.6, 0.85, d); P.nS = mix(-0.8, -1.2, d);
          P.fT = -0.5; P.fS = 0.15;
          break;
        }
        case 'boss_taunt': {
          const b = Math.sin(t * 4) * 0.05;
          P.torso = 0.1; P.head = -0.08;
          P.nA = 1.4 + b; P.nE = 0.12;
          P.fA = 0.5; P.fE = 1.7;
          P.nT = 0.5; P.nS = -0.7; P.fT = -0.5; P.fS = 0.2;
          P.hx = Math.sin(t * 2) * 1.5;
          break;
        }
        default: this.weaponPose(P, e, st); break;
      }
    }

    // Thế thủ cầm vũ khí (côn / đao / khiên) khi đứng hoặc đi
    if (e.stance && window.WP_STANCES && (st === 'idle' || st === 'walk')) {
      const S = window.WP_STANCES[e.stance];
      const o = S && S[st];
      if (o) for (const k in o) P[k] = o[k];
    }

    return P;
  }
}

window.SkeletalRendererPose = SkeletalRendererPose;
})();
