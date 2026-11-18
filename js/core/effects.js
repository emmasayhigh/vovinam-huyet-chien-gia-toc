/**
 * VOVINAM: SÁT THẦN GIẢI CỨU HỨA VŨ ĐẠI
 * js/effects.js - Particle Systems, Screen Shake, Weather, Slash Arcs, Ground Cracks & Impact Stars
 */

class EffectManager {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.ghostTrails = [];
    this.rainDrops = [];
    this.ripples = [];
    this.impactStars = [];
    this.groundCracks = [];
    this.lightningArcs = [];
    this.dimensionalSlashes = [];
    this.magmaCraters = [];
    this.sonicCones = [];
    this.thunderStrikes = [];
    this.skillProps = [];
    this.scheduledEffects = [];
    this.maxParticles = 480;
    this.cinematic = null;
    this.finisherCutIn = null;

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.shakeDirX = 0;
    this.shakeDirY = 0;

    // Hit Flash
    this.flashAlpha = 0;
    this.flashColor = '#ffffff';

    // Slow Motion (Bullet time)
    this.timeScale = 1.0;
    this.slowMoDuration = 0;

    // Mưa môi trường (Màn 1)
    this.isRaining = true;
    this.initRain(150);
    this._spriteCache = {};
    this._getEffectSprite('tieuquy_imp', 'assets/images/effects/tieuquy_imp.png');
    this._getEffectSprite('croc_lower', 'assets/images/effects/croc_body_lower.png');
    this._getEffectSprite('croc_upper', 'assets/images/effects/croc_upper_jaw.png');
  }

  /**
   * Tải lười sprite hiệu ứng/triệu hồi (an toàn cả trên Node headless).
   */
  _getEffectSprite(key, src) {
    if (typeof Image === 'undefined') return null;
    if (!this._spriteCache[key]) {
      const img = new Image();
      img.src = src;
      this._spriteCache[key] = img;
    }
    const cached = this._spriteCache[key];
    return (cached && cached.complete && cached.naturalWidth > 0) ? cached : null;
  }

  initRain(count = 220) {
    this.rainDrops = [];
    for (let i = 0; i < count; i++) {
      this.rainDrops.push({
        x: Math.random() * 1700 - 150,
        y: Math.random() * 850 - 100,
        speed: 14 + Math.random() * 9,
        length: 16 + Math.random() * 12,
        alpha: 0.18 + Math.random() * 0.32
      });
    }
  }

  setWeather(stageNumber) {
    this.currentStageNumber = stageNumber;
    this.isRaining = (stageNumber === 1);
    this.isStorming = (stageNumber === 11);
    this.isMountainMist = (stageNumber === 8);
    this.isIndustrialSparks = (stageNumber === 2);
    if (this.isRaining && (!this.rainDrops || this.rainDrops.length < 200)) {
      this.initRain(220);
    }
  }

  triggerScreenShake(intensity = 8, duration = 0.25, dirX = 0, dirY = 0) {
    const fx = window.fxSettings;
    if (fx) {
      if (fx.shakeScale !== undefined) {
        intensity *= fx.shakeScale;
      } else if (fx.reduceShake) {
        intensity *= 0.3;
        duration *= 0.7;
      }
    }
    if (intensity <= 0.05) return;
    // Giới hạn trên: rung quá mạnh làm mất phương hướng
    intensity = Math.min(intensity, 14);
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
    this.shakeDirX = dirX;
    this.shakeDirY = dirY;
  }

  triggerFlash(color = '#ffffff', alpha = 0.6) {
    const fx = window.fxSettings;
    if (fx && fx.reduceFlash) alpha *= 0.25;
    this.flashColor = color;
    this.flashAlpha = alpha;
  }

  triggerSlowMo(scale = 0.25, duration = 0.35) {
    this.timeScale = scale;
    this.slowMoDuration = duration;
  }

  // Tạo tia lửa va chạm phong cách Arcade Beat'em up (Streak Sparks + Impact Starburst)
  createHitSparks(x, y, count = 10, isCrit = false, colorOpts = null) {
    const customBase = typeof colorOpts === 'string'
      ? colorOpts
      : (Array.isArray(colorOpts) ? colorOpts[0] : (colorOpts && colorOpts.base));
    const customAlt = (Array.isArray(colorOpts) ? colorOpts[1] : (colorOpts && colorOpts.alt)) || '#ffffff';
    const baseColor = customBase || (isCrit ? '#ffd700' : '#ff3344');
    const altColor = customBase ? customAlt : (isCrit ? '#fffbeb' : '#00f0ff');

    // 1. Ngôi sao va chạm (Impact Starburst)
    this.impactStars.push({
      x: x,
      y: y,
      size: isCrit ? 36 : 22,
      color: customBase || (isCrit ? '#ffd700' : '#ffffff'),
      fringe: baseColor,
      alpha: 1.0,
      life: isCrit ? 0.22 : 0.15,
      maxLife: isCrit ? 0.22 : 0.15,
      rotation: Math.random() * Math.PI
    });

    // 2. Tia lửa vận tốc (Streak sparks với motion blur)
    const pCount = Math.min(22, count + (isCrit ? 6 : 0));
    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * (isCrit ? 11 : 7);
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 2.2 + Math.random() * 2.2,
        color: Math.random() > 0.45 ? baseColor : altColor,
        alpha: 1.0,
        life: 0.18 + Math.random() * 0.18,
        maxLife: 0.36,
        gravity: 0.18,
        isStreak: true
      });
    }

    // 3. Sóng chấn động ánh sáng
    if (isCrit && this.shockwaves.length < 8) {
      this.shockwaves.push({
        x: x,
        y: y,
        radius: 8,
        maxRadius: isCrit ? 56 : 34,
        color: customBase || (isCrit ? '#ffd700' : '#00d2ff'),
        alpha: 0.85,
        lineWidth: isCrit ? 3.5 : 2.5
      });
    }
  }

  // Vết nứt mặt đất khi nện búa/đòn nặng (Ground Crack)
  createGroundCrack(x, y, radius = 80, color = '#7dd3fc') {
    const branches = [];
    const numBranches = 4;
    for (let b = 0; b < numBranches; b++) {
      const angle = (b / numBranches) * Math.PI + (Math.random() - 0.5) * 0.45;
      const pts = [{ x: x, y: y }];
      let cx = x, cy = y;
      const segs = 3 + Math.floor(Math.random() * 3);
      const step = (radius / segs);
      for (let s = 1; s <= segs; s++) {
        cx += Math.cos(angle) * step + (Math.random() - 0.5) * 14;
        cy += Math.sin(angle) * (step * 0.35) + (Math.random() - 0.5) * 6; // Dẹt theo trục Y của góc nhìn 2.5D
        pts.push({ x: cx, y: cy });
      }
      branches.push(pts);
    }

    this.groundCracks.push({
      branches: branches,
      color: color,
      alpha: 1.0,
      life: 1.2,
      maxLife: 1.2
    });

    // Bắn mảnh đá vụn
    for (let i = 0; i < 14; i++) {
      const angle = -Math.PI * 0.1 - Math.random() * Math.PI * 0.8;
      const spd = 3.5 + Math.random() * 7;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 35,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3.5 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#64748b' : color,
        alpha: 1.0,
        life: 0.45 + Math.random() * 0.3,
        maxLife: 0.75,
        gravity: 0.35,
        isDebris: true
      });
    }
  }

  // Khí Vovinam (Blue Chi / Việt Võ Đạo Energy)
  createEnergySparks(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = 2 + Math.random() * 4.5;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 22,
        y: y + (Math.random() - 0.5) * 22,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#00e5ff' : '#0066ff',
        alpha: 0.95,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        gravity: -0.05,
        isStreak: true
      });
    }
  }

  // Bụi đất khi dậm nhảy, tiếp đất hoặc ngã (Dust puff)
  createDust(x, y, count = 8, spread = 30) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * spread,
        y: y,
        vx: (Math.random() - 0.5) * 3.5,
        vy: -0.6 - Math.random() * 1.6,
        size: 4 + Math.random() * 5,
        color: '#94a3b8',
        alpha: 0.55,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
        gravity: 0.02
      });
    }
  }

  // Đẩy hạt có giới hạn bộ nhớ để tránh rò rỉ khi spam skill
  _pushParticle(p) {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }
    this.particles.push(p);
  }

  clearSkillEffects() {
    this.particles.length = 0;
    this.shockwaves.length = 0;
    this.ghostTrails.length = 0;
    this.impactStars.length = 0;
    this.groundCracks.length = 0;
    this.lightningArcs.length = 0;
    this.dimensionalSlashes.length = 0;
    this.magmaCraters.length = 0;
    this.sonicCones.length = 0;
    this.thunderStrikes.length = 0;
    this.skillProps.length = 0;
    this.scheduledEffects.length = 0;
  }

  scheduleEffect(delaySec, fn) {
    if (typeof fn !== 'function') return;
    if (delaySec <= 0) { fn(); return; }
    this.scheduledEffects.push({ timer: delaySec, fn });
  }

  // ---- HIỆU ỨNG KỸ NĂNG ĐẶC TRƯNG THEO BẢN SẮC NHÂN VẬT ----

  // 1. Vovinam Long Hổ / Hoa Sen Thanh Kim (Ngô Nhất Nghị & Trang phục Vovinam)
  createDragonTigerLotus(x, y, dir = 1, radius = 85, duration = 0.45) {
    this.skillProps.push({
      kind: 'lotus', x, y, dir, radius: 14, maxRadius: radius,
      rot: 0, spin: 4.5 * dir, color: '#38bdf8', accent: '#facc15',
      life: duration, maxLife: duration, alpha: 1
    });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      this._pushParticle({
        x: x + Math.cos(a) * 10, y: y + Math.sin(a) * 10,
        vx: Math.cos(a) * (3.2 + Math.random() * 4.5) + dir * 2.2,
        vy: Math.sin(a) * (2.6 + Math.random() * 3.5) - 0.8,
        size: 3 + Math.random() * 3.2,
        color: i % 3 === 0 ? '#facc15' : '#38bdf8',
        alpha: 0.95, life: 0.28 + Math.random() * 0.2, maxLife: 0.48,
        gravity: -0.02, isStreak: true
      });
    }
  }

  // 2. Muzzle Flash + Vỏ Đạn Đồng + Tàn Tro Đô-la (Phó Văn Anh)
  createMuzzleFlash(x, y, dir = 1, color = '#facc15') {
    this.skillProps.push({
      kind: 'muzzle', x, y, dir, radius: 34, maxRadius: 42,
      rot: (Math.random() - 0.5) * 0.25, spin: 0, color, accent: '#ef4444',
      life: 0.14, maxLife: 0.14, alpha: 1
    });
    for (let i = 0; i < 10; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      const spd = 7 + Math.random() * 9;
      this._pushParticle({
        x, y,
        vx: Math.cos(spread) * dir * spd,
        vy: Math.sin(spread) * spd - 0.4,
        size: 2.4 + Math.random() * 2.6,
        color: i % 3 === 0 ? '#ffffff' : (i % 2 === 0 ? '#facc15' : '#f97316'),
        alpha: 1, life: 0.18 + Math.random() * 0.14, maxLife: 0.32,
        gravity: 0.04, isStreak: true
      });
    }
    this.createBrassShell(x - dir * 10, y - 4, dir);
  }

  createBrassShell(x, y, dir = 1) {
    this.skillProps.push({
      kind: 'shell', x, y, dir, vx: -dir * (1.8 + Math.random() * 2.4),
      vy: -(3.2 + Math.random() * 2.6), rot: Math.random() * Math.PI,
      spin: (Math.random() > 0.5 ? 1 : -1) * 14, color: '#eab308', accent: '#fef08a',
      life: 0.55, maxLife: 0.55, alpha: 1
    });
  }

  createBanknoteScatter(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      this.skillProps.push({
        kind: 'note', x: x + (Math.random() - 0.5) * 60, y: y - 40 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 4.5, vy: -1.8 - Math.random() * 2.4,
        rot: Math.random() * Math.PI, spin: (Math.random() - 0.5) * 7,
        color: i % 3 === 0 ? '#ef4444' : '#fde047', accent: '#78350f',
        life: 0.75 + Math.random() * 0.35, maxLife: 1.1, alpha: 1
      });
    }
  }

  // 3. Lưới Lục Giác Lượng Tử & Vệt Glitch (Phó Tiến Đăng)
  createQuantumLockOn(x, y, radius = 64, duration = 0.42) {
    this.skillProps.push({
      kind: 'hex_lock', x, y, dir: 1, radius: radius * 1.35, maxRadius: radius,
      rot: 0, spin: 5.5, color: '#00d2ff', accent: '#a5f3fc',
      life: duration, maxLife: duration, alpha: 1
    });
  }

  createCyberHexBurst(x, y, dir = 1, color = '#00d2ff') {
    this.skillProps.push({
      kind: 'hex_burst', x, y, dir, radius: 16, maxRadius: 72,
      rot: Math.random() * Math.PI, spin: 3.0 * dir, color, accent: '#ffffff',
      life: 0.28, maxLife: 0.28, alpha: 1
    });
    for (let i = 0; i < 12; i++) {
      const ang = (Math.random() - 0.5) * 1.4;
      const spd = 4.5 + Math.random() * 7.5;
      this._pushParticle({
        x, y, vx: dir * Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        size: 2.8 + Math.random() * 2.6, color: i % 2 === 0 ? color : '#e0f2fe',
        alpha: 0.95, life: 0.22 + Math.random() * 0.16, maxLife: 0.38,
        gravity: 0, isStreak: true
      });
    }
  }

  // 4. Ấn Ký Gia Chủ & Cột Truy Sát Đế Vương (Hứa Vũ Đại)
  createImperialSeal(x, y, radius = 78, duration = 0.55, color = '#dc2626') {
    this.skillProps.push({
      kind: 'imperial_seal', x, y, dir: 1, radius: radius * 0.4, maxRadius: radius,
      rot: 0, spin: 2.2, color, accent: '#facc15',
      life: duration, maxLife: duration, alpha: 1
    });
  }

  createOrbitalPillar(x, y, color = '#f43f5e') {
    this.skillProps.push({
      kind: 'orbital_pillar', x, y, dir: 1, radius: 34, maxRadius: 56,
      rot: 0, spin: 0, color, accent: '#fef08a',
      life: 0.36, maxLife: 0.36, alpha: 1
    });
    this.createGroundCrack(x, y, 75, '#facc15');
    this.createShockRing(x, y - 10, color);
  }

  // 5. Lốc Xoáy Thanh Phong (Hứa Bích Lâm)
  createWindVortex(x, y, dir = 1, radius = 58, duration = 0.36) {
    this.skillProps.push({
      kind: 'wind_vortex', x, y, dir, radius: radius * 0.45, maxRadius: radius,
      rot: 0, spin: 10 * dir, color: '#22c55e', accent: '#bef264',
      life: duration, maxLife: duration, alpha: 1
    });
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      this._pushParticle({
        x: x + Math.cos(a) * 16, y: y + Math.sin(a) * 14,
        vx: dir * (3.5 + Math.random() * 5.5), vy: -1.5 - Math.random() * 2.5,
        size: 2.8 + Math.random() * 2.8, color: i % 3 === 0 ? '#ffffff' : '#4ade80',
        alpha: 0.9, life: 0.25 + Math.random() * 0.2, maxLife: 0.45,
        gravity: -0.04, isStreak: true
      });
    }
  }

  // 6. Cánh Phụng Hoàng & Vòm Hỏa Liên (Triệu Đình An)
  createPhoenixWingFlare(x, y, dir = 1, duration = 0.45) {
    this.skillProps.push({
      kind: 'phoenix_wings', x, y, dir, radius: 22, maxRadius: 96,
      rot: 0, spin: 0, color: '#f97316', accent: '#fef08a',
      life: duration, maxLife: duration, alpha: 1
    });
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI * 0.9 + Math.random() * Math.PI * 0.8;
      this._pushParticle({
        x: x + (Math.random() - 0.5) * 32, y: y - Math.random() * 35,
        vx: Math.cos(a) * (2 + Math.random() * 4) - dir * 1.4,
        vy: Math.sin(a) * (2.5 + Math.random() * 4) - 1.2,
        size: 3.2 + Math.random() * 3.5, color: i % 3 === 0 ? '#fef08a' : '#f97316',
        alpha: 0.95, life: 0.3 + Math.random() * 0.25, maxLife: 0.55,
        gravity: -0.06, isStreak: true
      });
    }
  }

  createSacredDome(x, y, radius = 140, duration = 0.46) {
    this.skillProps.push({
      kind: 'sacred_dome', x, y, dir: 1, radius: 18, maxRadius: radius,
      rot: 0, spin: 0, color: '#f59e0b', accent: '#fef08a',
      life: duration, maxLife: duration, alpha: 1
    });
  }

  // 7. Đá Vỡ & Bụi Địa Chấn Sơn Cước (Phó Đặng Hoàng Anh)
  createEarthShardBurst(x, y, dir = 1, count = 12) {
    for (let i = 0; i < count; i++) {
      const spd = 2.8 + Math.random() * 5.2;
      const up = -(3.5 + Math.random() * 5.5);
      this.skillProps.push({
        kind: 'rock', x: x + (Math.random() - 0.5) * 44, y: y - 4,
        dir, vx: ((Math.random() - 0.5) * 2 + dir * 0.45) * spd, vy: up,
        rot: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 11,
        radius: 4 + Math.random() * 5,
        color: i % 3 === 0 ? '#d97706' : '#78350f', accent: '#fde68a',
        life: 0.48 + Math.random() * 0.25, maxLife: 0.73, alpha: 1
      });
    }
  }

  // 8. Huyễn Ảnh Đao Khí & Phi Tiêu Tản Mạn (Phó Dung Hải)
  createShadowDecoyCut(x, y, dir = 1, color = '#f43f5e') {
    this.createDimensionalSlash(x + (Math.random() - 0.5) * 32, y - 55, (Math.random() - 0.5) * 0.9, 130, color);
    this.createDimensionalSlash(x + (Math.random() - 0.5) * 32, y - 55, Math.PI * 0.5 + (Math.random() - 0.5) * 0.6, 120, '#0f172a');
    this.createShurikenBurst(x, y - 48, dir, 4);
  }

  createShurikenBurst(x, y, dir = 1, count = 5) {
    for (let i = 0; i < count; i++) {
      const ang = (i - (count - 1) / 2) * 0.28 + (dir < 0 ? Math.PI : 0);
      const spd = 6.5 + Math.random() * 4;
      this.skillProps.push({
        kind: 'shuriken', x, y, dir,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        rot: 0, spin: 18, radius: 7,
        color: '#e2e8f0', accent: '#f43f5e',
        life: 0.34, maxLife: 0.34, alpha: 1
      });
    }
  }

  // 9. Trận Đồ Hàn Băng & Mảnh Băng Vỡ (Ngô Giang Mạnh)
  createFrostMandala(x, y, radius = 92, duration = 0.62) {
    this.skillProps.push({
      kind: 'frost_mandala', x, y, dir: 1, radius: radius * 0.25, maxRadius: radius,
      rot: 0, spin: 2.8, color: '#7dd3fc', accent: '#ffffff',
      life: duration, maxLife: duration, alpha: 1
    });
  }

  createIceShatterBurst(x, y, count = 16) {
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + Math.random() * 0.2;
      const spd = 3.5 + Math.random() * 6.5;
      this.skillProps.push({
        kind: 'ice_shard', x, y, dir: 1,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 1.5,
        rot: ang, spin: (Math.random() - 0.5) * 8,
        radius: 5 + Math.random() * 5,
        color: i % 2 === 0 ? '#bae6fd' : '#38bdf8', accent: '#ffffff',
        life: 0.42 + Math.random() * 0.22, maxLife: 0.64, alpha: 1
      });
    }
  }

  // 10. Hiệu ứng Cá Sấu Đỏ Mũi Đớp Lên & Thủy Triều Sông Cửu Long (Ông Năm Chèo SSS)
  createCrocodileBite(x, y, dir = 1, scale = 1.0) {
    this.skillProps.push({
      kind: 'croc_bite',
      x,
      y,
      dir: dir || 1,
      scale: scale || 1.0,
      rot: 0,
      spin: 0,
      radius: 82 * (scale || 1.0),
      color: '#0f766e',
      accent: '#ef4444',
      life: 0.56,
      maxLife: 0.56,
      alpha: 1.0
    });
    this.createShockRing(x, y, '#0ea5e9');
    this.createShockRing(x, y, '#ef4444');
    for (let i = 0; i < 18; i++) {
      const spread = (Math.random() - 0.5) * 5.2;
      this._pushParticle({
        x: x + (Math.random() - 0.5) * 34 * scale,
        y: y - 10 - Math.random() * 36 * scale,
        vx: spread + (dir || 1) * 1.4,
        vy: -3.2 - Math.random() * 5.8,
        size: 3.0 + Math.random() * 3.8,
        color: i % 5 === 0 ? '#ef4444' : (i % 3 === 0 ? '#facc15' : '#38bdf8'),
        alpha: 1.0,
        life: 0.46 + Math.random() * 0.22,
        maxLife: 0.68,
        gravity: 0.16,
        isStreak: true
      });
    }
  }

  createCrocodileTailSweep(x, y, dir = 1, radius = 92) {
    this.skillProps.push({
      kind: 'croc_tail_sweep',
      x,
      y,
      dir: dir || 1,
      rot: 0,
      spin: (dir || 1) * 11,
      radius: radius * 0.45,
      maxRadius: radius,
      color: '#0ea5e9',
      accent: '#10b981',
      life: 0.42,
      maxLife: 0.42,
      alpha: 1.0
    });
  }

  createWaterSlashArc(x, y, dir = 1, angle = 0, radius = 68) {
    this.skillProps.push({
      kind: 'croc_slash',
      x,
      y,
      dir: dir || 1,
      vx: (dir || 1) * 1.6,
      vy: 0,
      rot: angle,
      spin: (dir || 1) * 3.8,
      radius,
      color: '#0ea5e9',
      accent: '#ef4444',
      life: 0.30,
      maxLife: 0.30,
      alpha: 1.0
    });
  }

  // Châu Ngọc Thiên Khánh: Vòng kiếm khí Kiếm Xu Đồng Đốt & Quái Hỏa Âm Binh triệu hồi
  createFlameCoinSlash(x, y, dir = 1, angle = 0, radius = 72) {
    this.skillProps.push({
      kind: 'flame_coin_slash',
      x,
      y,
      dir: dir || 1,
      vx: (dir || 1) * 1.9,
      vy: 0,
      rot: angle,
      spin: (dir || 1) * 4.6,
      radius,
      color: '#f97316',
      accent: '#dc2626',
      life: 0.34,
      maxLife: 0.34,
      alpha: 1.0
    });
  }

  createTaoistFiend(fiend) {
    if (!fiend) return;
    this.skillProps.push({
      kind: 'taoist_fiend',
      fiend,
      x: fiend.x,
      y: fiend.y,
      rot: 0,
      spin: 0,
      life: fiend.life || 6.0,
      maxLife: fiend.maxLife || 6.0,
      alpha: 1.0
    });
  }

  // Hiệu ứng Sóng Năng Lượng Tuyệt Kỹ (Ultimate Shockwave Blast — dùng delta time, đa bảng màu)
  createUltimateBlast(x, y, opts = {}) {
    const primary = opts.primary || '#00e5ff';
    const secondary = opts.secondary || '#ffffff';
    const flashCol = opts.flash || primary;
    const count = opts.particles || 48;

    this.triggerFlash(flashCol, opts.flashAlpha !== undefined ? opts.flashAlpha : 0.78);
    this.triggerScreenShake(opts.shake || 16, opts.shakeDur || 0.52);
    if (opts.slowMo !== false) {
      this.triggerSlowMo(opts.slowScale || 0.24, opts.slowDur || 0.36);
    }

    for (let i = 0; i < 4; i++) {
      this.scheduleEffect(i * 0.055, () => {
        this.shockwaves.push({
          x: x,
          y: y,
          radius: 12 + i * 16,
          maxRadius: (opts.maxRadius || 190) + i * 42,
          color: i % 2 === 0 ? primary : secondary,
          alpha: 1.0,
          lineWidth: 5.5 - i
        });
      });
    }

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4.2 + Math.random() * 12;
      this._pushParticle({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3.2 + Math.random() * 5.0,
        color: i % 3 === 0 ? secondary : primary,
        alpha: 1.0,
        life: 0.42 + Math.random() * 0.36,
        maxLife: 0.78,
        gravity: opts.gravity !== undefined ? opts.gravity : 0.06,
        isStreak: true
      });
    }
  }

  /**
   * Xóa sạch tàn dư hiệu ứng & vật triệu hồi (Tiểu Quỷ, Cá Sấu...) khi chuyển màn hoặc thoát Võ Đường.
   */
  clearCombatEffects() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.ghostTrails = [];
    this.ripples = [];
    this.impactStars = [];
    this.groundCracks = [];
    this.lightningArcs = [];
    this.dimensionalSlashes = [];
    this.magmaCraters = [];
    this.sonicCones = [];
    this.thunderStrikes = [];
    this.skillProps = [];
    this.scheduledEffects = [];
    this.cinematic = null;
    this.finisherCutIn = null;
  }

  // Kích hoạt Trình diễn Điện ảnh Tuyệt Kỹ (Cinematic Ultimate Presentation)
  triggerUltimateCinematic(charName, ultName, color = '#00f0ff', accent = '#ffd700', style = 'lightning') {
    this.cinematic = {
      active: true,
      timer: 1.25,
      maxTimer: 1.25,
      charName: charName || 'VIỆT VÕ SÁT THẦN',
      ultName: ultName || 'LONG HỔ XUẤT SƠN',
      color: color,
      accent: accent,
      style: style,
      speedlines: Array.from({ length: 28 }, () => ({
        angle: Math.random() * Math.PI * 2,
        len: 180 + Math.random() * 260,
        dist: 220 + Math.random() * 280,
        speed: 12 + Math.random() * 16,
        alpha: 0.35 + Math.random() * 0.45
      }))
    };
    this.triggerFlash(color, 0.7);
    this.triggerSlowMo(0.18, 0.45);
    this.triggerScreenShake(14, 0.35);
  }

  // Kích hoạt Khoảnh Khắc Tuyệt Kỹ Thủy Mặc / Hắc Ám (Signature Vovinam Finisher & Scissor-Kick Cut-in)
  triggerFinisherMoment(worldX, worldY, label = 'ĐÒN CHÂN KẸP CỔ', color = '#00f0ff', accent = '#ffd700') {
    this.finisherCutIn = {
      active: true,
      timer: 0.42,
      maxTimer: 0.42,
      worldX: worldX,
      worldY: worldY,
      label: label,
      color: color,
      accent: accent,
      speedlines: Array.from({ length: 22 }, (_, idx) => ({
        angle: (idx / 22) * Math.PI * 2 + (Math.random() - 0.5) * 0.12,
        inner: 90 + Math.random() * 70,
        len: 160 + Math.random() * 220,
        width: 1.5 + Math.random() * 2.2
      }))
    };
    this.createHitSparks(worldX, worldY, 18, true);
    this.triggerFlash(color, 0.45);
    this.triggerSlowMo(0.22, 0.28);
    this.triggerScreenShake(12, 0.32);
    if (window.game && typeof window.game.triggerCameraPunch === 'function') {
      window.game.triggerCameraPunch(1.08, 0.32, worldX, worldY);
    }
  }

  // Tia sét liên kết (Lightning Arc)
  createLightningArc(x1, y1, x2, y2, color = '#00f0ff', branches = 1) {
    const segments = 6;
    const pts = [{ x: x1, y: y1 }];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const nx = -dy / (dist || 1);
    const ny = dx / (dist || 1);

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const jitter = (Math.random() - 0.5) * 28;
      pts.push({
        x: x1 + dx * t + nx * jitter,
        y: y1 + dy * t + ny * jitter
      });
    }
    pts.push({ x: x2, y: y2 });

    this.lightningArcs.push({
      pts: pts,
      color: color,
      alpha: 1.0,
      life: 0.2,
      maxLife: 0.2,
      width: 2.8
    });

    // Nhánh phụ nhỏ
    if (branches > 0 && pts.length > 3) {
      const mid = pts[2];
      const bPts = [{ x: mid.x, y: mid.y }];
      const bAngle = Math.random() * Math.PI * 2;
      const bLen = 35 + Math.random() * 45;
      bPts.push({ x: mid.x + Math.cos(bAngle) * bLen * 0.5 + (Math.random() - 0.5) * 15, y: mid.y + Math.sin(bAngle) * bLen * 0.5 });
      bPts.push({ x: mid.x + Math.cos(bAngle) * bLen, y: mid.y + Math.sin(bAngle) * bLen });
      this.lightningArcs.push({
        pts: bPts,
        color: '#ffffff',
        alpha: 0.9,
        life: 0.16,
        maxLife: 0.16,
        width: 1.6
      });
    }
  }

  // Vết cắt không gian băng giá / trảm kích (Dimensional Slash)
  createDimensionalSlash(x, y, angle = -0.3, length = 220, color = '#38bdf8') {
    this.dimensionalSlashes.push({
      x: x,
      y: y,
      angle: angle,
      length: length,
      color: color,
      alpha: 1.0,
      life: 0.35,
      maxLife: 0.35,
      width: 5
    });

    // Tia băng vỡ vụn
    for (let i = 0; i < 18; i++) {
      const pAngle = angle + (Math.random() - 0.5) * 1.2 + (Math.random() > 0.5 ? Math.PI : 0);
      const spd = 3 + Math.random() * 8;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 30,
        vx: Math.cos(pAngle) * spd,
        vy: Math.sin(pAngle) * spd,
        size: 2.5 + Math.random() * 3.5,
        color: Math.random() > 0.4 ? color : '#ffffff',
        alpha: 1.0,
        life: 0.3 + Math.random() * 0.25,
        maxLife: 0.55,
        gravity: 0.1,
        isStreak: true
      });
    }
  }

  // Hố nứt dung nham địa chấn (Magma Crater - Hoàng Anh)
  createMagmaCrater(x, y, radius = 170) {
    this.createGroundCrack(x, y, radius, '#f97316');
    this.createGroundCrack(x, y, radius * 0.7, '#facc15');
    this.magmaCraters.push({
      x: x,
      y: y,
      radius: radius,
      alpha: 1.0,
      life: 1.4,
      maxLife: 1.4
    });

    // Bắn tàn lửa dung nham & mảnh đá núi lửa
    for (let i = 0; i < 28; i++) {
      const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
      const spd = 4 + Math.random() * 11;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 50,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 5,
        color: Math.random() > 0.5 ? '#ea580c' : (Math.random() > 0.3 ? '#facc15' : '#78350f'),
        alpha: 1.0,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        gravity: 0.38,
        isDebris: true
      });
    }
  }

  // Nón sóng xung kích siêu thanh (Sonic Boom Cone - Đình An charge)
  createSonicBoomCone(x, y, facing = 1, color = '#f59e0b') {
    this.sonicCones.push({
      x: x,
      y: y,
      facing: facing,
      color: color,
      alpha: 0.95,
      size: 30,
      maxSize: 130,
      life: 0.22,
      maxLife: 0.22
    });
  }

  // Cột sét trời giáng (Thunder Strike - Đình An slam)
  createThunderStrike(x, y, color = '#facc15') {
    this.thunderStrikes.push({
      x: x,
      y: y,
      color: color,
      alpha: 1.0,
      life: 0.28,
      maxLife: 0.28,
      width: 18
    });
    this.createShockRing(x, y, color);
    this.createGroundCrack(x, y, 150, color);
    this.triggerScreenShake(18, 0.4);
    this.triggerFlash(color, 0.6);

    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 4 + Math.random() * 10;
      this.particles.push({
        x: x,
        y: y - 20,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 2,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.35 ? color : '#ffffff',
        alpha: 1.0,
        life: 0.35 + Math.random() * 0.3,
        maxLife: 0.65,
        gravity: 0.15,
        isStreak: true
      });
    }
  }

  // Thêm vệt tàn ảnh (Ghost Trail / Motion Blur)
  addGhostTrail(entity, color = 'rgba(0, 160, 255, 0.5)') {
    if (!entity._pose || this.ghostTrails.length > 8) return;
    this.ghostTrails.push({
      type: entity.type,
      styleType: entity.styleType,
      x: entity.x,
      y: entity.y,
      z: entity.z || 0,
      facing: entity.facing,
      state: entity.state,
      frozenPose: Object.assign({}, entity._pose),
      ghostColor: color,
      color: color,
      alpha: 0.55,
      life: 0.24,
      maxLife: 0.24
    });
  }

  // Vòng sóng mặt đất nhẹ (không flash, không slow-mo) dùng cho đòn diện rộng của boss
  createShockRing(x, y, color = '#ffd700') {
    for (let i = 0; i < 2; i++) {
      this.shockwaves.push({
        x: x,
        y: y - 6,
        radius: 14 + i * 14,
        maxRadius: 160 + i * 40,
        color: color,
        alpha: 0.9,
        lineWidth: 4.5 - i
      });
    }
  }

  // Chữ nổi hiển thị sát thương hoặc kỹ thuật (Floating text với pop-in scale)
  addFloatingText(text, x, y, type = 'normal') {
    let color = '#ffffff';
    let size = 18;
    let prefix = '';

    if (type === 'crit') {
      color = '#ffd700';
      size = 25;
      prefix = 'CRIT! ';
    } else if (type === 'dodge') {
      color = '#00f0ff';
      size = 20;
    } else if (type === 'block') {
      color = '#94a3b8';
      size = 17;
    } else if (type === 'counter') {
      color = '#ff2244';
      size = 25;
    } else if (type === 'taunt') {
      color = '#fbbf24';
      size = 18;
    } else if (type === 'weak') {
      color = '#facc15';
      size = 23;
    } else if (type === 'stale') {
      color = '#9ca3af';
      size = 16;
    } else if (type === 'warn') {
      color = '#fbbf24';
      size = 20;
    } else if (type === 'heal') {
      color = '#4ade80';
      size = 21;
    } else if (type === 'bleed') {
      color = '#ef4444';
      size = 21;
    } else if (type === 'stun') {
      color = '#f59e0b';
      size = 23;
    }

    const fx = window.fxSettings;
    if (fx && fx.hideDamageNumbers && (type === 'damage' || type === 'crit')) {
      return;
    }
    const maxLife = type === 'taunt' ? 2.4 : 0.85;
    this.floatingTexts.push({
      text: prefix + text,
      x: x,
      y: y - 20,
      vy: type === 'taunt' ? -0.5 : -2.0,
      color: color,
      size: size,
      alpha: 1.0,
      life: maxLife,
      maxLife: maxLife
    });
  }

  // Cập nhật Logic Theo Delta Time
  update(rawDt) {
    // Xử lý Slow Motion
    let dt = rawDt;
    if (this.slowMoDuration > 0) {
      dt = rawDt * this.timeScale;
      this.slowMoDuration -= rawDt;
      if (this.slowMoDuration <= 0) {
        this.timeScale = 1.0;
      }
    }

    // Hệ số chuẩn hóa 60FPS giúp hạt/mưa/chữ nổi mượt như nhau trên màn hình 60Hz, 120Hz, 144Hz, 240Hz
    const dtScale = Math.min(3.0, dt * 60);

    // Cập nhật Rung Màn Hình (Screen Shake có định hướng)
    if (this.shakeDuration > 0) {
      this.shakeDuration -= rawDt;
      const randX = (Math.random() - 0.5) * 2;
      const randY = (Math.random() - 0.5) * 2;
      const dirBiasX = this.shakeDirX ? Math.sin(this.shakeDuration * 90) * this.shakeDirX * 0.45 : 0;
      const dirBiasY = this.shakeDirY ? Math.sin(this.shakeDuration * 90) * this.shakeDirY * 0.45 : 0;
      this.shakeOffsetX = (randX * 0.75 + dirBiasX) * this.shakeIntensity;
      this.shakeOffsetY = (randY * 0.75 + dirBiasY) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - rawDt * 18);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeDirX = 0;
      this.shakeDirY = 0;
    }

    // Flash màn hình
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - rawDt * 4);
    }

    // Bộ đếm kích hoạt VFX theo delta time (thay thế hoàn toàn setTimeout)
    for (let i = this.scheduledEffects.length - 1; i >= 0; i--) {
      const se = this.scheduledEffects[i];
      se.timer -= dt;
      if (se.timer <= 0) {
        this.scheduledEffects.splice(i, 1);
        try { se.fn(); } catch (err) { /* ignore */ }
      }
    }

    // Cập nhật Vật thể VFX kỹ năng chuyên biệt (Mandala, Cột sáng, Mảnh băng/đá, Đạn, Lốc gió)
    for (let i = this.skillProps.length - 1; i >= 0; i--) {
      const sp = this.skillProps[i];
      sp.life -= dt;
      if (sp.life <= 0) {
        this.skillProps.splice(i, 1);
        continue;
      }
      const prog = 1 - sp.life / sp.maxLife;
      sp.alpha = prog < 0.15 ? (prog / 0.15) : (sp.life / (sp.maxLife * 0.85));
      sp.rot += (sp.spin || 0) * dt;
      if (sp.vx !== undefined) {
        sp.x += sp.vx * dtScale;
        sp.y += (sp.vy || 0) * dtScale;
        if (sp.kind === 'shell' || sp.kind === 'rock' || sp.kind === 'ice_shard') {
          sp.vy += 0.22 * dtScale;
        } else if (sp.kind === 'note') {
          sp.vy += 0.04 * dtScale;
          sp.vx *= Math.pow(0.96, dtScale);
        }
      } else if (sp.maxRadius) {
        sp.radius += (sp.maxRadius - sp.radius) * Math.min(1, 10 * dt);
      }
    }

    // Cập nhật Hạt (Particles - chuẩn hóa theo dtScale & giới hạn bộ nhớ)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dtScale;
      p.y += p.vy * dtScale;
      p.vy += p.gravity * dtScale;
      p.alpha = p.life / p.maxLife;
    }

    // Cập nhật Ngôi sao va chạm (Impact Stars)
    for (let i = this.impactStars.length - 1; i >= 0; i--) {
      const st = this.impactStars[i];
      st.life -= dt;
      if (st.life <= 0) {
        this.impactStars.splice(i, 1);
        continue;
      }
      st.alpha = st.life / st.maxLife;
      st.rotation += 8 * dt;
    }

    // Cập nhật Vết nứt mặt đất (Ground Cracks)
    for (let i = this.groundCracks.length - 1; i >= 0; i--) {
      const gc = this.groundCracks[i];
      gc.life -= dt;
      if (gc.life <= 0) {
        this.groundCracks.splice(i, 1);
        continue;
      }
      gc.alpha = Math.min(1.0, gc.life / 0.45);
    }

    // Cập nhật Sóng Chấn Động (Shockwaves)
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += (s.maxRadius - s.radius) * 15 * dt;
      s.alpha -= 2.2 * dt;
      if (s.alpha <= 0 || s.radius >= s.maxRadius * 0.98) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Cập nhật Tàn Ảnh (Ghost Trails)
    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      const g = this.ghostTrails[i];
      g.life -= dt;
      if (g.life <= 0) {
        this.ghostTrails.splice(i, 1);
        continue;
      }
      g.alpha = (g.life / g.maxLife) * 0.55;
    }

    // Cập nhật Chữ Nổi (Floating Texts - chuẩn hóa theo dtScale)
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dtScale;
      ft.vy *= Math.pow(0.94, dtScale);
      ft.alpha = Math.min(1.0, ft.life / 0.25);
    }

    // Cập nhật Mưa (Rain) & Vòng gợn nước (Ripples - vá lỗi rò rỉ bộ nhớ)
    if (this.isRaining || this.isStorming) {
      for (let i = 0; i < this.rainDrops.length; i++) {
        const r = this.rainDrops[i];
        r.y += r.speed * dtScale;
        r.x -= 2.5 * dtScale;

        if (r.y > 680) {
          if (Math.random() < 0.1 && this.ripples.length < 60) {
            this.ripples.push({
              x: r.x,
              y: 670 + Math.random() * 20,
              radius: 1,
              maxRadius: 6 + Math.random() * 6,
              alpha: 0.35
            });
          }
          r.y = -20;
          r.x = Math.random() * 1600 - 150;
        }
      }
    }

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += (rip.maxRadius - rip.radius) * 6 * dt;
      rip.alpha -= 0.85 * dt;
      if (rip.alpha <= 0 || rip.radius >= rip.maxRadius * 0.96) {
        this.ripples.splice(i, 1);
      }
    }

    // Cập nhật Trình diễn Điện ảnh Tuyệt kỹ (Cinematic Ultimate)
    if (this.cinematic && this.cinematic.active) {
      this.cinematic.timer -= rawDt;
      if (this.cinematic.timer <= 0) {
        this.cinematic.active = false;
      }
    }

    // Cập nhật Khoảnh Khắc Tuyệt Kỹ Thủy Mặc / Hắc Ám (Finisher Cut-In)
    if (this.finisherCutIn && this.finisherCutIn.active) {
      this.finisherCutIn.timer -= rawDt;
      if (this.finisherCutIn.timer <= 0) {
        this.finisherCutIn.active = false;
      }
    }

    // Cập nhật Tia sét (Lightning Arcs)
    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      const la = this.lightningArcs[i];
      la.life -= dt;
      if (la.life <= 0) {
        this.lightningArcs.splice(i, 1);
        continue;
      }
      la.alpha = la.life / la.maxLife;
    }

    // Cập nhật Vết chém không gian (Dimensional Slashes)
    for (let i = this.dimensionalSlashes.length - 1; i >= 0; i--) {
      const ds = this.dimensionalSlashes[i];
      ds.life -= dt;
      if (ds.life <= 0) {
        this.dimensionalSlashes.splice(i, 1);
        continue;
      }
      ds.alpha = ds.life / ds.maxLife;
    }

    // Cập nhật Hố nứt dung nham (Magma Craters)
    for (let i = this.magmaCraters.length - 1; i >= 0; i--) {
      const mc = this.magmaCraters[i];
      mc.life -= dt;
      if (mc.life <= 0) {
        this.magmaCraters.splice(i, 1);
        continue;
      }
      mc.alpha = Math.min(1.0, mc.life / 0.5);
    }

    // Cập nhật Nón sóng âm (Sonic Boom Cones)
    for (let i = this.sonicCones.length - 1; i >= 0; i--) {
      const sc = this.sonicCones[i];
      sc.life -= dt;
      if (sc.life <= 0) {
        this.sonicCones.splice(i, 1);
        continue;
      }
      const progress = 1 - sc.life / sc.maxLife;
      sc.size += (sc.maxSize - sc.size) * 12 * dt;
      sc.alpha = 1 - progress;
    }

    // Cập nhật Cột sét trời giáng (Thunder Strikes)
    for (let i = this.thunderStrikes.length - 1; i >= 0; i--) {
      const ts = this.thunderStrikes[i];
      ts.life -= dt;
      if (ts.life <= 0) {
        this.thunderStrikes.splice(i, 1);
        continue;
      }
      ts.alpha = ts.life / ts.maxLife;
    }

    return dt;
  }

  // Vẽ các hiệu ứng thế giới (theo tọa độ camera)
  renderWorld(ctx, camera) {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // 1. Vết nứt mặt đất (Ground Cracks)
    for (const gc of this.groundCracks) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, gc.alpha));
      ctx.strokeStyle = gc.color;
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const branch of gc.branches) {
        ctx.beginPath();
        for (let j = 0; j < branch.length; j++) {
          if (j === 0) ctx.moveTo(branch[j].x, branch[j].y);
          else ctx.lineTo(branch[j].x, branch[j].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Gợn nước trên mặt đất
    ctx.lineWidth = 1;
    for (const rip of this.ripples) {
      if (!rip || rip.radius <= 0) continue;
      ctx.strokeStyle = `rgba(180, 220, 255, ${rip.alpha})`;
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y, rip.radius * 2, rip.radius, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Hố nứt dung nham địa chấn (Magma Craters)
    for (const mc of this.magmaCraters) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, mc.alpha));
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createRadialGradient(mc.x, mc.y, 10, mc.x, mc.y, mc.radius);
      grad.addColorStop(0, 'rgba(251, 146, 60, 0.85)');
      grad.addColorStop(0.4, 'rgba(234, 88, 12, 0.55)');
      grad.addColorStop(1, 'rgba(120, 53, 15, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(mc.x, mc.y, mc.radius, mc.radius * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Cột sét trời giáng (Thunder Strikes)
    for (const ts of this.thunderStrikes) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, ts.alpha));
      ctx.globalCompositeOperation = 'lighter';
      // Trục sét chính từ bầu trời
      ctx.strokeStyle = ts.color;
      ctx.lineWidth = ts.width * (0.6 + 0.4 * ts.alpha);
      ctx.beginPath();
      ctx.moveTo(ts.x + (Math.random() - 0.5) * 8, ts.y - 700);
      ctx.lineTo(ts.x + (Math.random() - 0.5) * 14, ts.y - 420);
      ctx.lineTo(ts.x + (Math.random() - 0.5) * 10, ts.y - 200);
      ctx.lineTo(ts.x, ts.y);
      ctx.stroke();

      // Tâm sét trắng lóa
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = ts.width * 0.35;
      ctx.stroke();
      ctx.restore();
    }

    // 5. Tia sét liên kết (Lightning Arcs)
    for (const la of this.lightningArcs) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, la.alpha));
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = la.color;
      ctx.lineWidth = la.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let j = 0; j < la.pts.length; j++) {
        if (j === 0) ctx.moveTo(la.pts[j].x, la.pts[j].y);
        else ctx.lineTo(la.pts[j].x, la.pts[j].y);
      }
      ctx.stroke();
      // Lõi sáng trắng
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, la.width * 0.4);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Vết chém không gian băng giá (Dimensional Slashes)
    for (const ds of this.dimensionalSlashes) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, ds.alpha));
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(ds.x, ds.y);
      ctx.rotate(ds.angle);
      const half = ds.length * 0.5;

      // Hào quang cắt
      ctx.strokeStyle = ds.color;
      ctx.lineWidth = ds.width;
      ctx.beginPath();
      ctx.moveTo(-half, 0);
      ctx.lineTo(half, 0);
      ctx.stroke();

      // Lõi trắng sắc bén
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = ds.width * 0.4;
      ctx.stroke();

      // Kim cương băng tại tâm
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 7. Nón sóng âm (Sonic Boom Cones)
    for (const sc of this.sonicCones) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, sc.alpha));
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = sc.color;
      ctx.lineWidth = 3.5;
      ctx.translate(sc.x, sc.y);
      ctx.scale(sc.facing, 0.45);
      ctx.beginPath();
      ctx.arc(0, 0, sc.size, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
      ctx.restore();
    }

    // 8. Hạt hiệu ứng (Particles - vẽ streak khi di chuyển nhanh)
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      const spd = Math.hypot(p.vx, p.vy);
      if (p.isStreak || spd > 2.5) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1.8, p.size * 0.75);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 9. Ngôi sao va chạm Comic Arcade (Impact Starbursts)
    for (const st of this.impactStars) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.max(0, Math.min(1, st.alpha));
      ctx.translate(st.x, st.y);
      ctx.rotate(st.rotation);
      const r = st.size * (1 - (st.life / st.maxLife) * 0.25);

      // Cánh sao nhọn 4 cạnh
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(0, 0, r * 0.2, 0);
      ctx.lineTo(r, 0);
      ctx.quadraticCurveTo(0, 0, 0, r * 0.2);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, -r * 0.2, 0);
      ctx.lineTo(-r, 0);
      ctx.quadraticCurveTo(0, 0, 0, -r * 0.2);
      ctx.closePath();
      ctx.fill();

      // Tâm trắng lóe sáng
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 10. Sóng chấn động (Shockwaves)
    for (const s of this.shockwaves) {
      if (!s || s.radius <= 0) continue;
      ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth || 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 10b. Hình học Kỹ năng Đặc trưng theo Từng Nhân Vật (Mandalas, Seals, Phoenix Wings, Gunfire, Vortex, Shards)
    for (const sp of this.skillProps) {
      const al = Math.max(0, Math.min(1, sp.alpha));
      ctx.save();
      ctx.globalAlpha = al;
      ctx.translate(sp.x, sp.y);

      if (sp.kind === 'frost_mandala') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.rotate(sp.rot);
        ctx.strokeStyle = sp.color;
        ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(0, 0, sp.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, sp.radius * 0.72, 0, Math.PI * 2); ctx.stroke();
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * sp.radius, Math.sin(a) * sp.radius);
          ctx.lineTo(Math.cos(a + Math.PI * 2 / 3) * sp.radius, Math.sin(a + Math.PI * 2 / 3) * sp.radius);
          ctx.stroke();
          ctx.fillStyle = sp.accent;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * sp.radius * 0.86, Math.sin(a) * sp.radius * 0.86, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (sp.kind === 'imperial_seal') {
        ctx.scale(1, 0.42);
        ctx.rotate(sp.rot);
        ctx.strokeStyle = sp.accent;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, sp.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = sp.color;
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(0, 0, sp.radius * 0.74, 0, Math.PI * 2); ctx.stroke();
        for (let k = 0; k < 4; k++) {
          const a = (k * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * sp.radius, Math.sin(a) * sp.radius);
          ctx.lineTo(Math.cos(a + Math.PI / 2) * sp.radius, Math.sin(a + Math.PI / 2) * sp.radius);
          ctx.stroke();
        }
      } else if (sp.kind === 'orbital_pillar') {
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(-sp.radius, 0, sp.radius, 0);
        g.addColorStop(0, 'rgba(244,63,94,0)');
        g.addColorStop(0.35, sp.color);
        g.addColorStop(0.5, '#ffffff');
        g.addColorStop(0.65, sp.color);
        g.addColorStop(1, 'rgba(244,63,94,0)');
        ctx.fillStyle = g;
        ctx.fillRect(-sp.radius, -420, sp.radius * 2, 420);
      } else if (sp.kind === 'hex_lock' || sp.kind === 'hex_burst') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.rotate(sp.rot);
        ctx.strokeStyle = sp.color;
        ctx.lineWidth = sp.kind === 'hex_lock' ? 2.6 : 3.2;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3;
          const vx = Math.cos(a) * sp.radius, vy = Math.sin(a) * sp.radius;
          if (k === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
        }
        ctx.closePath(); ctx.stroke();
        ctx.strokeStyle = sp.accent; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(0, 0, sp.radius * 0.56, 0, Math.PI * 2); ctx.stroke();
      } else if (sp.kind === 'muzzle') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.scale(sp.dir, 1);
        ctx.rotate(sp.rot);
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(sp.radius, -sp.radius * 0.34);
        ctx.lineTo(sp.radius * 0.62, 0);
        ctx.lineTo(sp.radius * 1.15, sp.radius * 0.04);
        ctx.lineTo(sp.radius * 0.6, 0);
        ctx.lineTo(sp.radius * 0.9, sp.radius * 0.34);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(10, 0, 12, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      } else if (sp.kind === 'shell') {
        ctx.rotate(sp.rot);
        ctx.fillStyle = sp.color;
        ctx.fillRect(-4, -1.6, 8, 3.2);
        ctx.fillStyle = sp.accent;
        ctx.fillRect(-1, -1.2, 4, 1.4);
      } else if (sp.kind === 'note') {
        ctx.rotate(sp.rot);
        ctx.fillStyle = sp.color;
        ctx.fillRect(-6, -3.5, 12, 7);
        ctx.strokeStyle = sp.accent; ctx.lineWidth = 1;
        ctx.strokeRect(-6, -3.5, 12, 7);
      } else if (sp.kind === 'wind_vortex') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.rotate(sp.rot);
        for (let r = 0; r < 3; r++) {
          ctx.strokeStyle = r === 0 ? sp.accent : sp.color;
          ctx.lineWidth = 3.2 - r * 0.7;
          ctx.beginPath();
          ctx.arc(0, 0, sp.radius * (0.45 + r * 0.26), r * 1.4, r * 1.4 + Math.PI * 1.35);
          ctx.stroke();
        }
      } else if (sp.kind === 'phoenix_wings') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.scale(sp.dir, 1);
        for (const sign of [-1, 1]) {
          ctx.strokeStyle = sp.color;
          ctx.lineWidth = 4.2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-sp.radius * 0.65, -sp.radius * 0.55 * sign, -sp.radius * 1.15, -sp.radius * 0.15 * sign);
          ctx.stroke();
          ctx.strokeStyle = sp.accent; ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(-4, 0);
          ctx.quadraticCurveTo(-sp.radius * 0.55, -sp.radius * 0.35 * sign, -sp.radius * 0.9, -sp.radius * 0.08 * sign);
          ctx.stroke();
        }
      } else if (sp.kind === 'sacred_dome') {
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(0, 0, sp.radius * 0.25, 0, 0, sp.radius);
        g.addColorStop(0, 'rgba(254,240,138,0.08)');
        g.addColorStop(0.75, 'rgba(249,115,22,0.42)');
        g.addColorStop(1, 'rgba(249,115,22,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, sp.radius, Math.PI, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = sp.accent; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(0, 0, sp.radius, Math.PI, Math.PI * 2); ctx.stroke();
      } else if (sp.kind === 'lotus') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.rotate(sp.rot);
        ctx.strokeStyle = sp.color; ctx.lineWidth = 2.6;
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4;
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * sp.radius * 0.45, Math.sin(a) * sp.radius * 0.45, sp.radius * 0.45, sp.radius * 0.16, a, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.strokeStyle = sp.accent; ctx.lineWidth = 2.0;
        ctx.beginPath(); ctx.arc(0, 0, sp.radius * 0.52, 0, Math.PI * 2); ctx.stroke();
      } else if (sp.kind === 'rock' || sp.kind === 'ice_shard') {
        ctx.rotate(sp.rot);
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.moveTo(sp.radius, 0);
        ctx.lineTo(-sp.radius * 0.6, -sp.radius * 0.55);
        ctx.lineTo(-sp.radius * 0.9, sp.radius * 0.35);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = sp.accent; ctx.lineWidth = 1.2; ctx.stroke();
      } else if (sp.kind === 'shuriken') {
        ctx.rotate(sp.rot);
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          const a = (k * Math.PI) / 2;
          ctx.lineTo(Math.cos(a) * sp.radius, Math.sin(a) * sp.radius);
          ctx.lineTo(Math.cos(a + Math.PI / 4) * sp.radius * 0.3, Math.sin(a + Math.PI / 4) * sp.radius * 0.3);
        }
        ctx.closePath(); ctx.fill();
      } else if (sp.kind === 'croc_bite') {
        const sc = sp.scale || 1.0;
        const prog = Math.max(0, Math.min(1, 1 - (sp.life / (sp.maxLife || 0.56))));
        const rise = prog < 0.45 ? (1 - Math.pow(1 - prog / 0.45, 2)) : 1;
        const crocLower = this._getEffectSprite('croc_lower', 'assets/images/effects/croc_body_lower.png');
        const crocUpper = this._getEffectSprite('croc_upper', 'assets/images/effects/croc_upper_jaw.png');

        if (crocLower && crocUpper) {
          ctx.save();
          ctx.scale(sp.dir || 1, 1);

          // Vòng xoáy sóng nước dưới mặt đất khi cá sấu trồi lên
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.78)';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.ellipse(2 * sc, 22 * sc, 46 * sc, 10 * sc, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Trồi lên từ dưới mặt nước sân khấu, mở rộng hàm rồi sập chặt tạo xung kích cắn
          const size = 198 * sc;
          ctx.beginPath();
          ctx.rect(-size, -260 * sc, size * 2, 278 * sc);
          ctx.clip();

          const drawX = -size * 0.58;
          const drawY = (18 - rise * 176) * sc;
          const hx = drawX + 0.5908 * size;
          const hy = drawY + 0.3281 * size;

          // Góc mở/ngậm khớp hàm trên (Canvas: âm = ngẩng mở to, dương = sập xuống ngoạm khít hàm dưới)
          const jawAngle = prog < 0.46
            ? -0.15 + prog * 0.12
            : Math.min(0.56, -0.095 + (prog - 0.46) * 2.95);

          ctx.drawImage(crocLower, drawX, drawY, size, size);
          ctx.save();
          ctx.translate(hx, hy);
          ctx.rotate(jawAngle);
          ctx.drawImage(crocUpper, -0.5908 * size, -0.3281 * size, size, size);
          ctx.restore();

          // Tia chớp đỏ-vàng lúc hai hàm ngậm chặt cắn mục tiêu
          if (prog >= 0.46 && prog <= 0.78) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 4.2;
            ctx.beginPath();
            ctx.arc(hx + 34 * sc, hy + 8 * sc, 26 * sc, -0.9, 0.9);
            ctx.stroke();
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.arc(hx + 34 * sc, hy + 8 * sc, 17 * sc, -1.2, 1.2);
            ctx.stroke();
          }
          ctx.restore();
          ctx.restore();
          continue;
        }

        const jawY = (20 - rise * 82) * sc;
        const jawOpen = prog < 0.46
          ? (0.64 - prog * 0.35)
          : Math.max(0.03, 0.44 - (prog - 0.46) * 2.2);

        // Cột nước & xoáy sông đỏ-ngọc dâng lên từ mặt đất
        ctx.save();
        ctx.scale(sp.dir || 1, 1);
        const wGrad = ctx.createLinearGradient(0, 26 * sc, 0, jawY - 14 * sc);
        wGrad.addColorStop(0, 'rgba(14, 165, 233, 0.72)');
        wGrad.addColorStop(0.55, 'rgba(20, 184, 166, 0.50)');
        wGrad.addColorStop(1, 'rgba(239, 68, 68, 0.28)');
        ctx.fillStyle = wGrad;
        ctx.beginPath();
        ctx.moveTo(-40 * sc, 26 * sc);
        ctx.quadraticCurveTo(-20 * sc, jawY * 0.5, -24 * sc, jawY + 12 * sc);
        ctx.lineTo(30 * sc, jawY + 12 * sc);
        ctx.quadraticCurveTo(24 * sc, jawY * 0.5, 42 * sc, 26 * sc);
        ctx.closePath();
        ctx.fill();

        // Vòng xoáy chân cột nước dưới mặt đất
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.78)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(2 * sc, 22 * sc, 42 * sc, 9 * sc, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Đầu Cá Sấu Đỏ Mũi lao chéo từ dưới lên đớp mồi
        ctx.translate(0, jawY);
        ctx.rotate(-Math.PI * 0.44);

        // Hào quang đỏ-ngọc quanh đầu cá sấu
        const headAura = ctx.createRadialGradient(22 * sc, 0, 6 * sc, 22 * sc, 0, 74 * sc);
        headAura.addColorStop(0, 'rgba(239, 68, 68, 0.34)');
        headAura.addColorStop(0.6, 'rgba(20, 184, 166, 0.22)');
        headAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = headAura;
        ctx.beginPath();
        ctx.arc(22 * sc, 0, 74 * sc, 0, Math.PI * 2);
        ctx.fill();

        // Hàm trên (mõm vảy xanh lục bảo + chóp Mũi Đỏ Rực + 8 răng nanh)
        ctx.save();
        ctx.rotate(-jawOpen);
        ctx.fillStyle = '#064e3b';
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-14 * sc, -22 * sc);
        ctx.quadraticCurveTo(28 * sc, -26 * sc, 74 * sc, -8 * sc);
        ctx.lineTo(70 * sc, 0);
        ctx.lineTo(-10 * sc, 2 * sc);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Răng nanh hàm trên
        ctx.fillStyle = '#f8fafc';
        for (let t = 0; t < 7; t++) {
          const tx = (8 + t * 9.2) * sc;
          ctx.beginPath();
          ctx.moveTo(tx - 3 * sc, 0);
          ctx.lineTo(tx, (t === 6 ? 11 : 8) * sc);
          ctx.lineTo(tx + 3 * sc, 0);
          ctx.closePath();
          ctx.fill();
        }
        // Con mắt cá sấu hung dữ (đỏ rực lõi vàng)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(22 * sc, -14 * sc, 7 * sc, 4.2 * sc, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.fillRect(21 * sc, -17 * sc, 2 * sc, 6 * sc);

        // Chóp Mũi Đỏ Rực đặc trưng (Cá Sấu Đỏ Mũi)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(71 * sc, -7 * sc, 6.2 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fecaca';
        ctx.beginPath();
        ctx.arc(70 * sc, -8.5 * sc, 2.2 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Hàm dưới
        ctx.save();
        ctx.rotate(jawOpen * 0.85);
        ctx.fillStyle = '#0f766e';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-12 * sc, 0);
        ctx.lineTo(68 * sc, 2 * sc);
        ctx.quadraticCurveTo(42 * sc, 20 * sc, -14 * sc, 18 * sc);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Răng hàm dưới
        ctx.fillStyle = '#f8fafc';
        for (let t = 0; t < 6; t++) {
          const tx = (12 + t * 9.2) * sc;
          ctx.beginPath();
          ctx.moveTo(tx - 2.8 * sc, 1 * sc);
          ctx.lineTo(tx, -8 * sc);
          ctx.lineTo(tx + 2.8 * sc, 1 * sc);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // Tia chớp đỏ-vàng lúc hai hàm ngậm chặt cắn mục tiêu
        if (prog >= 0.45 && prog <= 0.78) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 4.2;
          ctx.beginPath();
          ctx.arc(46 * sc, 0, 26 * sc, -0.9, 0.9);
          ctx.stroke();
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(46 * sc, 0, 17 * sc, -1.2, 1.2);
          ctx.stroke();
        }
        ctx.restore();
      } else if (sp.kind === 'croc_tail_sweep') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.rotate(sp.rot);
        ctx.strokeStyle = sp.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, sp.radius, 0, Math.PI * 1.45);
        ctx.stroke();
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(0, 0, sp.radius * 0.76, Math.PI * 0.5, Math.PI * 1.9);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        for (let k = 0; k < 5; k++) {
          const ang = k * 0.42;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * sp.radius, Math.sin(ang) * sp.radius, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (sp.kind === 'croc_slash') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.scale(sp.dir || 1, 1);
        ctx.rotate(sp.rot);
        ctx.strokeStyle = sp.color;
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.arc(0, 0, sp.radius, -1.05, 1.05);
        ctx.stroke();
        ctx.strokeStyle = sp.accent || '#ef4444';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(4, 0, sp.radius * 0.85, -0.9, 0.9);
        ctx.stroke();
      } else if (sp.kind === 'flame_coin_slash') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.scale(sp.dir || 1, 1);
        ctx.rotate(sp.rot);
        ctx.strokeStyle = sp.accent || '#dc2626';
        ctx.lineWidth = 6.2;
        ctx.beginPath();
        ctx.arc(0, 0, sp.radius, -1.15, 1.15);
        ctx.stroke();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(3, 0, sp.radius * 0.88, -0.95, 0.95);
        ctx.stroke();
        for (let k = -2; k <= 2; k++) {
          const ang = k * 0.42;
          const cx = Math.cos(ang) * sp.radius;
          const cy = Math.sin(ang) * sp.radius;
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(cx, cy, 3.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(cx - 1.1, cy - 1.1, 2.2, 2.2);
        }
      } else if (sp.kind === 'taoist_fiend' && sp.fiend) {
        const f = sp.fiend;
        ctx.restore(); // reset from sp.x/sp.y so we always track live f.x, f.y
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, sp.alpha * 0.95));
        ctx.translate(f.x, f.y);
        const dir = f.facing >= 0 ? 1 : -1;
        const bob = Math.sin(performance.now() * 0.015 + (f.seed || 0)) * 3.5;
        ctx.scale(dir, 1);
        // Vòng bùa chú đỏ dưới chân quái triệu hồi
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.72)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 2, 22, 7, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';

        const impSprite = this._getEffectSprite('tieuquy_imp', 'assets/images/effects/tieuquy_imp.png');
        if (impSprite) {
          const lunging = f.slashTimer > 0;
          const size = 98;
          ctx.save();
          ctx.translate(lunging ? 8 : 0, bob + (lunging ? -4 : 0));
          if (lunging) ctx.rotate(0.14);
          ctx.drawImage(impSprite, -size * 0.5, -size + 8, size, size);
          if (lunging) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(22, -32, 24, -0.75, 0.75);
            ctx.stroke();
          }
          ctx.restore();
        } else {
          // Thân hình Âm Binh Lửa Đỏ (fallback khi chạy headless không tải ảnh)
          ctx.fillStyle = '#18181b';
          ctx.beginPath();
          ctx.moveTo(-12, -2 + bob); ctx.lineTo(-9, -36 + bob); ctx.lineTo(10, -34 + bob); ctx.lineTo(14, 0 + bob);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.6; ctx.stroke();
          ctx.fillStyle = '#27272a';
          ctx.beginPath(); ctx.arc(1, -43 + bob, 9.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#f97316';
          ctx.beginPath(); ctx.moveTo(-5, -50 + bob); ctx.lineTo(-9, -60 + bob); ctx.lineTo(0, -52 + bob); ctx.fill();
          ctx.beginPath(); ctx.moveTo(4, -50 + bob); ctx.lineTo(9, -60 + bob); ctx.lineTo(8, -50 + bob); ctx.fill();
          ctx.fillStyle = '#facc15';
          ctx.beginPath(); ctx.arc(5, -44 + bob, 2.2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#dc2626'; ctx.fillRect(4, -52 + bob, 4, 9);
          const lunge = f.slashTimer > 0 ? 10 : 0;
          ctx.strokeStyle = f.slashTimer > 0 ? '#facc15' : '#ea580c';
          ctx.lineWidth = f.slashTimer > 0 ? 3.5 : 2.2;
          ctx.beginPath();
          ctx.moveTo(8, -28 + bob); ctx.lineTo(22 + lunge, -24 + bob);
          ctx.moveTo(8, -22 + bob); ctx.lineTo(20 + lunge, -18 + bob);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 11. Chữ nổi hiển thị sát thương (Pop-in animation scale)
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, Math.min(1, ft.alpha));
      ctx.globalAlpha = alpha;
      const age = ft.maxLife ? (ft.maxLife - ft.life) : 0.1;
      const popScale = age < 0.14 ? 1 + 0.45 * Math.sin((age / 0.14) * Math.PI) : 1.0;
      const fontSize = Math.round(ft.size * popScale);

      ctx.font = `900 ${fontSize}px "Cinzel", "Montserrat", sans-serif`;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.lineWidth = Math.max(3, fontSize * 0.18);
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.restore();
  }

  // Vẽ các hiệu ứng lớp phủ màn hình (Screen overlays, Rain & Cinematic Ultimate)
  renderScreen(ctx, width, height) {
    ctx.save();

    // 1. Hiệu ứng Thời Tiết & Khí Quyển Theo Màn (Atmospheric Weather)
    if (this.isRaining || this.isStorming) {
      const stormColor = this.isStorming ? 'rgba(239, 68, 68, 0.32)' : 'rgba(180, 210, 240, 0.28)';
      const slant = this.isStorming ? 7 : 4;
      ctx.strokeStyle = stormColor;
      ctx.lineWidth = this.isStorming ? 1.5 : 1.2;
      ctx.beginPath();
      for (const r of this.rainDrops) {
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - slant, r.y + r.length);
      }
      ctx.stroke();
    }

    // 2. Trình diễn Điện ảnh Tuyệt Kỹ (Cinematic Letterbox, Anime Speedlines & Martial Banner)
    if (this.cinematic && this.cinematic.active) {
      const c = this.cinematic;
      const progress = c.timer / c.maxTimer; // 1 -> 0
      const inPhase = progress > 0.8 ? (1 - progress) / 0.2 : (progress < 0.25 ? progress / 0.25 : 1);
      const barH = Math.round(52 * inPhase);

      // 2a. Letterbox Bars (Viền đen điện ảnh trên và dưới)
      if (barH > 0) {
        ctx.fillStyle = '#05070e';
        ctx.fillRect(0, 0, width, barH);
        ctx.fillRect(0, height - barH, width, barH);

        // Đường chỉ laser vàng / theme color phát sáng ở mép thanh đen
        ctx.strokeStyle = c.accent || '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, barH);
        ctx.lineTo(width, barH);
        ctx.stroke();

        ctx.strokeStyle = c.color || '#00f0ff';
        ctx.beginPath();
        ctx.moveTo(0, height - barH);
        ctx.lineTo(width, height - barH);
        ctx.stroke();
      }

      // 2b. Dark Vignette (Tập trung ánh nhìn vào trung tâm nhân vật)
      const vig = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.2, width * 0.5, height * 0.5, width * 0.72);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, `rgba(3, 7, 18, ${0.65 * inPhase})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      // 2c. Anime Speedlines (Tia tốc độ hướng tâm)
      if (c.speedlines && inPhase > 0.3) {
        ctx.save();
        ctx.translate(width * 0.5, height * 0.48);
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 1.8;
        ctx.globalAlpha = 0.45 * inPhase;
        for (const line of c.speedlines) {
          ctx.beginPath();
          const cos = Math.cos(line.angle);
          const sin = Math.sin(line.angle);
          ctx.moveTo(cos * line.dist, sin * line.dist);
          ctx.lineTo(cos * (line.dist + line.len), sin * (line.dist + line.len));
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2d. Khung Banner Thư Pháp Tuyệt Kỹ (Martial Arts Calligraphic Banner)
      if (inPhase > 0.2) {
        ctx.save();
        ctx.globalAlpha = inPhase;
        const bannerW = Math.min(width * 0.88, 760);
        const bannerH = 74;
        const bx = (width - bannerW) * 0.5;
        const by = height - barH - bannerH - 14;

        // Nền kính mờ công nghệ cao
        const bgGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
        bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
        bgGrad.addColorStop(0.2, 'rgba(15, 23, 42, 0.92)');
        bgGrad.addColorStop(0.5, 'rgba(11, 15, 25, 0.98)');
        bgGrad.addColorStop(0.8, 'rgba(15, 23, 42, 0.92)');
        bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(bx, by, bannerW, bannerH);

        // Viền ánh kim
        const borderGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
        borderGrad.addColorStop(0, 'rgba(255,255,255,0)');
        borderGrad.addColorStop(0.3, c.color);
        borderGrad.addColorStop(0.5, '#ffffff');
        borderGrad.addColorStop(0.7, c.accent);
        borderGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bannerW, bannerH);

        // Dòng phụ đề trên: VIỆT VÕ TRẤN PHÁI • [TÊN NHÂN VẬT]
        ctx.textAlign = 'center';
        ctx.font = '900 12px "Montserrat", sans-serif';
        ctx.fillStyle = c.accent || '#ffd700';
        ctx.fillText(`⚡ TUYỆT KỸ TRẤN PHÁI • [ ${c.charName} ] ⚡`, width * 0.5, by + 24);

        // Tiêu đề tuyệt kỹ chính (Chữ lớn phát sáng rực rỡ)
        ctx.font = '900 30px "Cinzel", "Montserrat", sans-serif';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.lineWidth = 6;
        ctx.strokeText(c.ultName, width * 0.5, by + 58);

        const textGrad = ctx.createLinearGradient(0, by + 30, 0, by + 65);
        textGrad.addColorStop(0, '#ffffff');
        textGrad.addColorStop(0.6, c.color);
        textGrad.addColorStop(1, c.accent);
        ctx.fillStyle = textGrad;
        ctx.fillText(c.ultName, width * 0.5, by + 58);
        ctx.restore();
      }
    }

    // 2e. Khoảnh Khắc Tuyệt Kỹ Thủy Mặc / Hắc Ám (Signature Finisher & Scissor-Kick Cut-in)
    if (this.finisherCutIn && this.finisherCutIn.active) {
      const fc = this.finisherCutIn;
      const p = fc.timer / fc.maxTimer;
      const env = p > 0.75 ? (1 - p) / 0.25 : (p < 0.3 ? p / 0.3 : 1);
      const camX = (window.game && window.game.camera) ? window.game.camera.x : 0;
      const camY = (window.game && window.game.camera) ? window.game.camera.y : 0;
      const focusX = Math.max(120, Math.min(width - 120, fc.worldX - camX));
      const focusY = Math.max(120, Math.min(height - 120, fc.worldY - camY));

      ctx.save();
      // Làm tối hậu cảnh kiểu thủy mặc tương phản cao
      const rad = ctx.createRadialGradient(focusX, focusY, 55, focusX, focusY, width * 0.7);
      rad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      rad.addColorStop(0.45, `rgba(2, 6, 23, ${0.42 * env})`);
      rad.addColorStop(1, `rgba(2, 6, 23, ${0.78 * env})`);
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, width, height);

      // Các đường tốc độ hội tụ vào điểm siết đòn
      ctx.translate(focusX, focusY);
      ctx.strokeStyle = fc.color || '#00f0ff';
      ctx.globalAlpha = 0.55 * env;
      for (const sl of fc.speedlines) {
        ctx.lineWidth = sl.width;
        ctx.beginPath();
        const c = Math.cos(sl.angle);
        const s = Math.sin(sl.angle);
        ctx.moveTo(c * sl.inner, s * sl.inner);
        ctx.lineTo(c * (sl.inner + sl.len), s * (sl.inner + sl.len));
        ctx.stroke();
      }

      // Vòng ấn chú chữ thập lóe sáng tại tâm va chạm
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = fc.accent || '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 48 + (1 - p) * 45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Flash chớp trắng / đỏ / xanh
    if (this.flashAlpha > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }
}

// Global Effect Manager
const effectManager = new EffectManager();
window.effectManager = effectManager;

window.EffectManager = EffectManager;
window.fxSettings = window.fxSettings || {
  reduceShake: false,
  reduceFlash: false,
  hideDamageNumbers: false,
  shakeScale: 1.0,
  load() {
    try {
      const saved = localStorage.getItem('vovinam_fx_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.reduceShake = !!parsed.reduceShake;
        this.reduceFlash = !!parsed.reduceFlash;
        this.hideDamageNumbers = !!parsed.hideDamageNumbers;
        if (typeof parsed.shakeScale === 'number') {
          this.shakeScale = parsed.shakeScale;
        } else {
          this.shakeScale = this.reduceShake ? 0.3 : 1.0;
        }
      }
    } catch (err) {}
  },
  save() {
    try {
      localStorage.setItem('vovinam_fx_settings', JSON.stringify({
        reduceShake: this.reduceShake,
        reduceFlash: this.reduceFlash,
        hideDamageNumbers: this.hideDamageNumbers,
        shakeScale: this.shakeScale
      }));
    } catch (err) {}
  }
};
window.fxSettings.load();
