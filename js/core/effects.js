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
  }

  initRain(count = 150) {
    this.rainDrops = [];
    for (let i = 0; i < count; i++) {
      this.rainDrops.push({
        x: Math.random() * 1600 - 150,
        y: Math.random() * 800 - 100,
        speed: 12 + Math.random() * 8,
        length: 14 + Math.random() * 10,
        alpha: 0.15 + Math.random() * 0.25
      });
    }
  }

  setWeather(stageNumber) {
    this.isRaining = (stageNumber === 1);
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
  createHitSparks(x, y, count = 10, isCrit = false) {
    const baseColor = isCrit ? '#ffd700' : '#ff3344';
    const altColor = isCrit ? '#fffbeb' : '#00f0ff';

    // 1. Ngôi sao va chạm (Impact Starburst)
    this.impactStars.push({
      x: x,
      y: y,
      size: isCrit ? 36 : 22,
      color: isCrit ? '#ffd700' : '#ffffff',
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
        color: isCrit ? '#ffd700' : '#00d2ff',
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

  // Hiệu ứng Sóng Năng Lượng Tuyệt Kỹ (Ultimate Shockwave Blast)
  createUltimateBlast(x, y) {
    this.triggerFlash('#00f0ff', 0.85);
    this.triggerScreenShake(18, 0.6);
    this.triggerSlowMo(0.2, 0.45);

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.shockwaves.push({
          x: x,
          y: y,
          radius: 12 + i * 16,
          maxRadius: 190 + i * 45,
          color: i % 2 === 0 ? '#00e5ff' : '#ffffff',
          alpha: 1.0,
          lineWidth: 5.5 - i
        });
      }, i * 65);
    }

    // Tung toé năng lượng rồng hổ
    for (let i = 0; i < 55; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4.5 + Math.random() * 13;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3.5 + Math.random() * 5.5,
        color: Math.random() > 0.3 ? '#00e5ff' : '#ffffff',
        alpha: 1.0,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        gravity: 0.08,
        isStreak: true
      });
    }
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

    // Cập nhật Hạt (Particles - chuẩn hóa theo dtScale)
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
    if (this.isRaining) {
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
      ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth || 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();
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

    // 1. Mưa màn 1
    if (this.isRaining) {
      ctx.strokeStyle = 'rgba(180, 210, 240, 0.28)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const r of this.rainDrops) {
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - 4, r.y + r.length);
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
