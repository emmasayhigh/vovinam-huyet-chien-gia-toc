/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/audio.js - Web Audio API Procedural Synthesizer & Dynamic BGM Engine
 * 100% Thuần Web Audio API - Không phụ thuộc file âm thanh ngoài
 *
 * Âm nhạc theo PHE PHÁI:
 *  - hua     : công nghiệp, bí ẩn (trống nhanh, bass gầm)
 *  - doclap  : áp sát, dồn dập (bến cảng)
 *  - pho     : công nghệ, tiết chế có nhịp điện
 *  - ngo     : lạnh, căng thẳng, ít nốt
 *  - trieu   : trang trọng nhưng có sức ép (chuông đại điện)
 *  - vovinam : trống nhanh, đòn võ thuật mạnh (nhân vật chính)
 */

const MAIN_THEME_BGM_SRC = 'assets/audio/main_theme.mp3';
const PVP_THEME_BGM_SRC = 'assets/audio/pvp_theme.mp3';
const DOJO_THEME_BGM_SRC = 'assets/audio/dojo_theme.mp3';
const BOSS_THEME_BGM_SRC = 'assets/audio/boss_theme.mp3';

const BGM_TRACK_MAP = {
  main: { prop: 'bgmAudio', src: MAIN_THEME_BGM_SRC },
  pvp: { prop: 'pvpAudio', src: PVP_THEME_BGM_SRC },
  dojo: { prop: 'dojoAudio', src: DOJO_THEME_BGM_SRC },
  boss: { prop: 'bossAudio', src: BOSS_THEME_BGM_SRC }
};

const BGM_THEMES = {
  hua:     { bpm: 128, bass: [55, 55, 65.41, 55, 58.27, 55, 49, 55],      wave: 'sawtooth', industrial: true,  hats: 'double', gong: false, lead: false },
  doclap:  { bpm: 136, bass: [65.41, 65.41, 73.42, 87.31, 65.41, 58.27, 65.41, 98], wave: 'triangle', industrial: false, hats: 'double', gong: false, lead: false },
  pho:     { bpm: 120, bass: [61.74, 61.74, 73.42, 61.74, 55, 61.74, 82.41, 73.42], wave: 'sawtooth', industrial: false, hats: 'single', gong: false, lead: true },
  ngo:     { bpm: 104, bass: [49, 49, 58.27, 49, 43.65, 49, 55, 43.65],   wave: 'sine',     industrial: false, hats: 'sparse',  gong: false, lead: false },
  trieu:   { bpm: 96,  bass: [65.41, 65.41, 58.27, 65.41, 51.91, 65.41, 49, 55], wave: 'triangle', industrial: false, hats: 'sparse',  gong: true,  lead: false },
  vovinam: { bpm: 132, bass: [55, 55, 65.41, 73.42, 82.41, 55, 98, 82.41], wave: 'triangle', industrial: false, hats: 'double', gong: false, lead: false }
};

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.isMuted = false;
    this.musicPlaying = false;
    this.currentStage = 1;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.bpm = 125;
    this.initialized = false;

    // Âm lượng theo cài đặt người chơi (đồng bộ từ SaveManager)
    this.musicVolume = 0.45;
    this.sfxVolume = 0.85;
    this.masterVolume = 0.75;
    this.baseMaster = 0.75;

    // Chủ đề nhạc theo PHE PHÁI của màn chơi
    this.theme = BGM_THEMES.vovinam;
    // Kho track âm thanh ngoài (Howler.js / Audio HTML5 nếu nạp thêm .mp3/.ogg)
    this.externalTracks = {};

    // Nhạc nền chính thức MP3 phát xuyên suốt Menu & Chiến đấu (kèm nhạc riêng cho 1v1 PvP, Võ Đường & Đánh Boss)
    this.mainThemeSrc = MAIN_THEME_BGM_SRC;
    this.pvpThemeSrc = PVP_THEME_BGM_SRC;
    this.dojoThemeSrc = DOJO_THEME_BGM_SRC;
    this.bossThemeSrc = BOSS_THEME_BGM_SRC;
    this.bgmAudio = null;
    this.pvpAudio = null;
    this.dojoAudio = null;
    this.bossAudio = null;
    this.activeBgmKey = 'main'; // 'main' | 'pvp' | 'dojo' | 'boss'
    this.bgmWanted = true;
    this._bgmDuckMul = 1.0;
    this._bgmDuckTimer = null;
  }

  _ensureTrackAudio(key = 'main') {
    const spec = BGM_TRACK_MAP[key] || BGM_TRACK_MAP.main;
    if (this[spec.prop]) return this[spec.prop];
    if (typeof Audio === 'undefined' || typeof window === 'undefined') return null;
    try {
      const a = new Audio(spec.src);
      a.loop = true;
      a.preload = 'auto';
      a.volume = this._getEffectiveBgmVolume();
      this[spec.prop] = a;
      return a;
    } catch (_) {
      return null;
    }
  }

  _ensureMainThemeAudio() {
    return this._ensureTrackAudio('main');
  }

  _getActiveBgmAudio() {
    const spec = BGM_TRACK_MAP[this.activeBgmKey] || BGM_TRACK_MAP.main;
    return this[spec.prop] || null;
  }

  _getEffectiveBgmVolume() {
    if (this.isMuted) return 0;
    const mv = (typeof this.musicVolume === 'number' && isFinite(this.musicVolume)) ? this.musicVolume : 0.45;
    const master = (typeof this.masterVolume === 'number' && isFinite(this.masterVolume)) ? this.masterVolume : 0.75;
    const duck = (typeof this._bgmDuckMul === 'number' && isFinite(this._bgmDuckMul)) ? this._bgmDuckMul : 1.0;
    return Math.max(0, Math.min(1, mv * master * duck));
  }

  _syncBgmAudioState() {
    const activeKey = BGM_TRACK_MAP[this.activeBgmKey] ? this.activeBgmKey : 'main';
    let active = null;
    for (const [k, spec] of Object.entries(BGM_TRACK_MAP)) {
      const el = this[spec.prop];
      if (!el) continue;
      if (k === activeKey) {
        active = el;
      } else {
        try {
          if (!el.paused && typeof el.pause === 'function') el.pause();
        } catch (_) {}
      }
    }

    if (!active) return false;
    active.volume = this._getEffectiveBgmVolume();
    if (!this.bgmWanted || this.isMuted || !this.musicPlaying) {
      try {
        if (!active.paused && typeof active.pause === 'function') active.pause();
      } catch (_) {}
      return false;
    }
    try {
      if (active.paused && typeof active.play === 'function') {
        const res = active.play();
        if (res && typeof res.catch === 'function') {
          res.catch(() => {
            this._scheduleBgmUnlockRetry();
          });
        }
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  _scheduleBgmUnlockRetry() {
    if (this._bgmRetryBound || typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
    this._bgmRetryBound = true;
    const retry = () => {
      this._bgmRetryBound = false;
      if (this.bgmWanted && !this.isMuted && this.musicPlaying) {
        this._syncBgmAudioState();
      }
    };
    document.addEventListener('pointerdown', retry, { once: true, passive: true });
    document.addEventListener('keydown', retry, { once: true });
  }

  /**
   * Đăng ký file âm thanh thật (.mp3/.ogg) qua Howler.js (nếu có) hoặc HTMLAudioElement.
   */
  registerTrack(key, src, opts = {}) {
    if (!key || !src || typeof window === 'undefined') return null;
    if (typeof window.Howl === 'function') {
      this.externalTracks[key] = { kind: 'howl', track: new window.Howl({ src: [src], loop: !!opts.loop, volume: opts.volume ?? this.sfxVolume }) };
    } else if (typeof Audio !== 'undefined') {
      const a = new Audio(src);
      a.loop = !!opts.loop;
      this.externalTracks[key] = { kind: 'html', track: a };
    }
    return this.externalTracks[key] || null;
  }

  playExternalTrack(key, volume = null) {
    if (this.isMuted) return false;
    const entry = this.externalTracks && this.externalTracks[key];
    if (!entry) return false;
    const vol = Math.max(0, Math.min(1, (volume ?? this.sfxVolume) * (this.masterVolume ?? 0.75)));
    try {
      if (entry.kind === 'howl') {
        entry.track.volume(vol);
        entry.track.play();
      } else {
        entry.track.currentTime = 0;
        entry.track.volume = vol;
        entry.track.play().catch(() => {});
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.baseMaster, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported on this browser:", e);
    }
  }

  unlock() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        const p = this.ctx.resume();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (err) {}
    }
    // Đồng bộ âm lượng với cài đặt đã lưu (chỉ làm lần đầu sau khi init)
    if (!this._settingsApplied) {
      if (window.saveManager && window.saveManager.data && window.saveManager.data.settings) {
        this.applySettings(window.saveManager.data.settings);
      }
      this._settingsApplied = true;
    }
    if (this.bgmWanted !== false) {
      this._switchToTrack(this.activeBgmKey || 'main');
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.baseMaster, this.ctx.currentTime);
    }
    this._syncBgmAudioState();
    if (window.saveManager) window.saveManager.setSetting('muted', this.isMuted);
    return !this.isMuted;
  }

  // --- ĐIỀU CHỈNH ÂM LƯỢNG (đồng bộ với cài đặt lưu) ---
  applySettings(settings) {
    if (!settings) return;
    if (typeof settings.musicVolume === 'number') this.setMusicVolume(settings.musicVolume);
    if (typeof settings.sfxVolume === 'number') this.setSfxVolume(settings.sfxVolume);
    if (typeof settings.muted === 'boolean') {
      this.isMuted = settings.muted;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.baseMaster, this.ctx.currentTime);
      }
      this._syncBgmAudioState();
    }
  }

  setMusicVolume(v, persist = true) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
    this._syncBgmAudioState();
    if (persist && window.saveManager) window.saveManager.setSetting('musicVolume', this.musicVolume);
  }

  setSfxVolume(v) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
    if (window.saveManager) window.saveManager.setSetting('sfxVolume', this.sfxVolume);
  }

  // --- WHITE NOISE GENERATOR UTILITY (Cache dùng chung, tránh cấp phát liên tục gây lag) ---
  createNoiseBuffer(duration = 1.0) {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  getNoiseBuffer() {
    if (!this.sharedNoiseBuffer && this.ctx) {
      this.sharedNoiseBuffer = this.createNoiseBuffer(1.0);
    }
    return this.sharedNoiseBuffer;
  }

  // --- SOUND EFFECTS (SFX) ---

  // Tiếng Đấm Cơ Bản (Snappy Punch - biến thiên cao độ tự nhiên ±8%, throttle tránh chồng âm)
  playPunch() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    if (now - (this.lastPunchTime || 0) < 0.045) return;
    this.lastPunchTime = now;
    const pitch = 0.92 + Math.random() * 0.16;

    // Thump oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(165 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(44 * pitch, now + 0.12);

    gain.gain.setValueAtTime(0.72, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);

    // Noise snap (sử dụng buffer được cache)
    const noiseBuf = this.getNoiseBuffer();
    if (noiseBuf) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(920 * pitch, now);
      filter.Q.setValueAtTime(3, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.09);
    }
  }

  // Tiếng Đá / Đòn Nặng (Heavy Kick - biến thiên cao độ ±8%, throttle tránh chồng âm)
  playKick() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    if (now - (this.lastKickTime || 0) < 0.045) return;
    this.lastKickTime = now;
    const pitch = 0.92 + Math.random() * 0.16;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(225 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(32 * pitch, now + 0.22);

    gain.gain.setValueAtTime(0.92, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.23);

    // Mid crack (sử dụng buffer được cache)
    const noiseBuf = this.getNoiseBuffer();
    if (noiseBuf) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1450 * pitch, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.52, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.13);
    }
  }

  // Tiếng Đòn Nặng / Tuyệt Kỹ Trúng Mục Tiêu (Heavy Impact + Sub-bass)
  playHeavyHit() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const pitch = 0.94 + Math.random() * 0.12;

    // Sub thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(24, now + 0.35);
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain); gain.connect(this.sfxGain);
    osc.start(now); osc.stop(now + 0.36);

    // Metal clang
    const noiseBuf = this.getNoiseBuffer();
    if (noiseBuf) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400 * pitch, now);
      filter.frequency.exponentialRampToValueAtTime(700, now + 0.25);
      filter.Q.setValueAtTime(1.5, now);
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.55, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      noise.connect(filter); filter.connect(ng); ng.connect(this.sfxGain);
      noise.start(now); noise.stop(now + 0.3);
    }
  }

  // Tiếng nhịp tim trầm khi sinh lực dưới 25%
  playLowHpPulse() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    [0, 0.16].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 72 : 58, now + offset);
      osc.frequency.exponentialRampToValueAtTime(28, now + offset + 0.11);
      g.gain.setValueAtTime(idx === 0 ? 0.22 : 0.15, now + offset);
      g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.13);
    });
  }

  // Tiếng gõ chữ nhẹ khi chạy hội thoại cốt truyện
  playTypeBlip() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    if (now - (this._lastBlipTime || 0) < 0.035) return;
    this._lastBlipTime = now;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(640 + Math.random() * 140, now);
    g.gain.setValueAtTime(0.055, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.028);
  }

  // Tiếng Boss Chuyển Giai Đoạn / Hàm Lệnh (Phase Shift)
  playBossPhase() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    [196, 233.08, 293.66].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(900, now);
      gain.gain.setValueAtTime(0.22, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.5);
      osc.connect(f); f.connect(gain); gain.connect(this.sfxGain);
      osc.start(now + i * 0.06); osc.stop(now + i * 0.06 + 0.52);
    });
    // Gong cho phe Triệu
    this.playGong(0.5);
  }

  // Tiếng Chuông Đại Điện (phe Triệu)
  playGong(volume = 0.35) {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    [110, 164.81, 220, 277.18].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i % 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(volume / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
      osc.connect(gain); gain.connect(this.sfxGain);
      osc.start(now); osc.stop(now + 1.65);
    });
  }

  // Tiếng Vung Tay / Gió Cuộn (Whoosh)
  playWhoosh() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const noiseBuf = this.getNoiseBuffer();
    if (noiseBuf) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.18);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.19);
    }
  }

  // Tiếng Né Đòn (Dodge Swoosh)
  playDodge() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);

    this.playWhoosh();
  }

  // Tiếng Né Hoàn Hảo (Perfect Dodge Chime + Slowdown)
  playPerfectDodge() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Harmonic chime chords
    [880, 1320, 1760].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.25, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.03);
      osc.stop(now + 0.52);
    });
  }

  // Tiếng Đòn Kẹp Cổ Vovinam & Quật Ngã (Scissor Clamp & Slam)
  playScissorClamp() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Snap 1: Clamp
    this.playWhoosh();

    setTimeout(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // Heavy floor slam
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.35);

      gain.gain.setValueAtTime(0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.36);
    }, 280);
  }

  // Tiếng Hét Khí Công Vovinam Đa Dạng (Procedural Martial Arts Kiai / Shouts)
  playVovinamKiai(type = 'heavy', charId = 'nghi') {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Đặc trưng thanh âm theo từng võ sĩ
    const CHAR_PITCH = {
      nghi:     { pitch: 225, formant: 750,  q: 3.5, breathMul: 1.0 },
      dinhan:   { pitch: 155, formant: 600,  q: 4.2, breathMul: 1.4 },
      dunghai:  { pitch: 275, formant: 920,  q: 3.0, breathMul: 0.9 },
      hoanganh: { pitch: 175, formant: 650,  q: 4.0, breathMul: 1.3 },
      vinhtam:  { pitch: 165, formant: 680,  q: 4.5, breathMul: 1.2 },
      bichlam:  { pitch: 260, formant: 880,  q: 3.2, breathMul: 0.95 }
    };
    const cMeta = CHAR_PITCH[charId] || CHAR_PITCH.nghi;
    let baseFreq = cMeta.pitch;
    let duration = 0.22;
    let gainVal = 0.55;
    let formantFreq = cMeta.formant;
    let endFreqMul = 0.65;

    if (type === 'punch') {
      // Tiếng hét dứt khoát "HỚ!" / "TÁP!"
      baseFreq *= 1.15;
      duration = 0.13;
      gainVal = 0.52;
      formantFreq = cMeta.formant * 1.2;
      endFreqMul = 0.75;
    } else if (type === 'kick') {
      // Tiếng hét trầm hùng "HÂY!"
      baseFreq *= 1.05;
      duration = 0.24;
      gainVal = 0.65;
      formantFreq = cMeta.formant * 1.05;
      endFreqMul = 0.60;
    } else if (type === 'counter') {
      // Tiếng quát bắt đòn uy quyền "DÔÔÔ!" / "BẮT!"
      baseFreq *= 1.22;
      duration = 0.32;
      gainVal = 0.78;
      formantFreq = cMeta.formant * 0.9;
      endFreqMul = 0.85;
    } else if (type === 'scissor') {
      // Bay kẹp cổ "HÚT - QUẬT!"
      baseFreq *= 1.35;
      duration = 0.36;
      gainVal = 0.82;
      formantFreq = cMeta.formant * 1.1;
      endFreqMul = 0.55;
    } else if (type === 'ultimate') {
      // Tuyệt kỹ đại bác "HÁÁÁT - LONG HỔ!"
      baseFreq *= 1.45;
      duration = 0.58;
      gainVal = 0.92;
      formantFreq = cMeta.formant * 1.15;
      endFreqMul = 0.70;
    } else if (type === 'dodge') {
      // Thở dốc né đòn "HỰ!"
      baseFreq *= 0.9;
      duration = 0.12;
      gainVal = 0.40;
      formantFreq = cMeta.formant * 0.8;
      endFreqMul = 0.5;
    } else if (type === 'salute') {
      baseFreq *= 0.85;
      duration = 0.28;
      gainVal = 0.48;
    }

    // Voice Formant Oscillator (Sawtooth qua bộ lọc mô phỏng nguyên âm tiếng Việt)
    const osc = this.ctx.createOscillator();
    const voiceGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * endFreqMul, now + duration);

    // Formant filter (nguyên âm Â / A / Ô / U)
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(formantFreq, now);
    f1.Q.setValueAtTime(cMeta.q, now);

    voiceGain.gain.setValueAtTime(0.001, now);
    voiceGain.gain.linearRampToValueAtTime(gainVal, now + 0.025);
    voiceGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(f1);
    f1.connect(voiceGain);
    voiceGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);

    // Thêm luồng hơi thở xuất kình / khí công
    const noiseBuf = this.getNoiseBuffer();
    if (noiseBuf) {
      const breath = this.ctx.createBufferSource();
      breath.buffer = noiseBuf;
      const bFilter = this.ctx.createBiquadFilter();
      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(1150, now);
      const bGain = this.ctx.createGain();
      bGain.gain.setValueAtTime(gainVal * 0.35 * cMeta.breathMul, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.75);

      breath.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(this.sfxGain);
      breath.start(now);
      breath.stop(now + duration);
    }
  }

  // Nhạc Hiệu Khải Hoàn Thành Tựu (Achievement Fanfare)
  playAchievementFanfare() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Chùm arpeggio vàng kim: C5, E5, G5, B5, C6
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const dur = idx === notes.length - 1 ? 0.85 : 0.35;
      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.26, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + dur + 0.05);
    });
  }

  // Tiếng Kích Hoạt Tuyệt Kỹ: Long Hổ Xuất Sơn (Ultimate Burst)
  playUltimateBurst() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Power build-up sweep
    const sweep = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(80, now);
    sweep.frequency.exponentialRampToValueAtTime(1200, now + 0.45);

    sweepGain.gain.setValueAtTime(0.1, now);
    sweepGain.gain.linearRampToValueAtTime(0.65, now + 0.4);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    sweep.connect(sweepGain);
    sweepGain.connect(this.sfxGain);
    sweep.start(now);
    sweep.stop(now + 0.52);

    // Tiger Roar / Blast Explosion
    setTimeout(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Sub explosion
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(120, t);
      boom.frequency.exponentialRampToValueAtTime(20, t + 0.8);

      boomGain.gain.setValueAtTime(1.0, t);
      boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      boom.connect(boomGain);
      boomGain.connect(this.sfxGain);
      boom.start(t);
      boom.stop(t + 0.86);

      // Noise blast
      const noiseBuf = this.getNoiseBuffer();
      if (noiseBuf) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, t);
        filter.frequency.exponentialRampToValueAtTime(150, t + 0.6);

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.7, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.65);
      }
    }, 450);
  }

  // Tiếng Bị Trúng Đòn (Hurt)
  playHurt() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Tiếng Đỡ Đòn / Khiên Sắt (Guard Block)
  playBlock() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Tiếng Cảnh Báo Boss Tung Đòn Mạnh (Warning Flash)
  playWarning() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.setValueAtTime(850, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Tiếng Bước Chân (Footstep)
  playFootstep() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // UI Click
  playClick() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Chiến Thắng Màn Chơi (Victory Fanfare)
  playVictory() {
    if (!this.initialized || this.isMuted) return;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C - E - G - C - E - G
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.3, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.42);
    });
  }

  // Thất Bại (Defeat Tone)
  playDefeat() {
    if (!this.initialized || this.isMuted) return;
    const notes = [220, 207.65, 196, 174.61]; // Descending A - G# - G - F
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.22);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      gain.gain.setValueAtTime(0.35, now + idx * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.22 + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.22);
      osc.stop(now + idx * 0.22 + 0.46);
    });
  }

  // Tiếng Chuông Nhặt Manh Mối / Thư Tịch (Investigation Chime)
  playChime() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [1046.50, 1318.51, 1567.98, 2093.00]; // C6 - E6 - G6 - C7
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.22, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.46);
    });
  }

  // Tiếng Giải Mã Thành Công / Hoàn Tất Bằng Chứng (Success Chime)
  playSuccess() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.28, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.52);
    });
  }

  // Tiếng Lật Giấy / Mở Cuộn Thư (Paper Rustle)
  playPaper() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const noiseBuf = this.getNoiseBuffer();
    if (noiseBuf) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.Q.setValueAtTime(1.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.15);
    }
  }

  // Tiếng Nổ Lớn / Bom Đạn / Phá Hủy Môi Trường (Heavy Explosion)
  playExplosion() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Sub-bass sweep
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.65);

    oscGain.gain.setValueAtTime(0.9, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.6);

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.72);

    // Crackle & rumble noise
    const noiseBuf = this.getNoiseBuffer();
    if (noiseBuf) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const nFilter = this.ctx.createBiquadFilter();
      nFilter.type = 'lowpass';
      nFilter.frequency.setValueAtTime(1200, now);
      nFilter.frequency.exponentialRampToValueAtTime(90, now + 0.8);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.8, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.88);
    }
  }

  // ==========================================================================
  // BGM ENGINE (NHẠC NỀN MP3 CHÍNH THỨC + PVP + VÕ ĐƯỜNG + BOSS + WEB AUDIO FALLBACK)
  // ==========================================================================
  _switchToTrack(targetKey = 'main', fallbackMain = false) {
    const key = BGM_TRACK_MAP[targetKey] ? targetKey : 'main';
    const prevKey = this.activeBgmKey;
    const switched = prevKey !== key;
    if (switched && prevKey && prevKey !== 'main' && BGM_TRACK_MAP[prevKey]) {
      const prevEl = this[BGM_TRACK_MAP[prevKey].prop];
      if (prevEl) {
        try { prevEl.currentTime = 0; } catch (_) {}
      }
    }
    this.activeBgmKey = key;
    this.bgmWanted = true;
    this.musicPlaying = true;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    const a = this._ensureTrackAudio(key);
    if (a) {
      if (switched && key !== 'main' && a.paused) {
        try { a.currentTime = 0; } catch (_) {}
      }
      this._syncBgmAudioState();
      return true;
    }
    if (fallbackMain && key !== 'main') {
      return this._switchToTrack('main', false);
    }
    return false;
  }

  startMenuBGM() {
    return this._switchToTrack('main', false);
  }

  startPvPBGM() {
    return this._switchToTrack('pvp', true);
  }

  startDojoBGM() {
    return this._switchToTrack('dojo', true);
  }

  startBossBGM() {
    return this._switchToTrack('boss', true);
  }

  duckBGM(factor = 0.28, durationMs = 2200) {
    this._bgmDuckMul = Math.max(0.05, Math.min(1, Number(factor) || 0.28));
    this._syncBgmAudioState();
    if (this._bgmDuckTimer) {
      clearTimeout(this._bgmDuckTimer);
      this._bgmDuckTimer = null;
    }
    if (durationMs > 0) {
      this._bgmDuckTimer = setTimeout(() => {
        this._bgmDuckTimer = null;
        this._bgmDuckMul = 1.0;
        this._syncBgmAudioState();
      }, durationMs);
    }
  }

  startStageBGM(stageNumber = 1, factionId = null) {
    if (!this.initialized) this.init();
    this.currentStage = stageNumber;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }

    // Chọn chủ đề nhạc theo PHE PHÁI của màn chơi (giữ metadata cho UI / fallback)
    const meta = window.STORY_META && window.STORY_META.stages ? window.STORY_META.stages[stageNumber] : null;
    const fid = factionId || (meta && meta.faction) || (stageNumber >= 2 ? 'hua' : 'hua');
    this.theme = BGM_THEMES[fid] || BGM_THEMES.hua;

    this.activeBgmKey = 'main';
    this.bgmWanted = true;
    this.musicPlaying = true;
    this.bgmStep = 0;
    this.bgmIntensity = 1;
    this.bossPhase = 1;
    this.baseBpm = this.theme.bpm || 120;
    this.bpm = this.baseBpm;

    const a = !this.useProceduralBGM ? this._ensureTrackAudio('main') : null;
    if (a) {
      this._syncBgmAudioState();
      return;
    }
    this.restartBGMLoop();
  }

  restartBGMLoop() {
    if (this._getActiveBgmAudio() && !this.useProceduralBGM) return;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    const stepDurationMs = (60 / this.bpm / 4) * 1000; // 16th note
    this.bgmTimer = setInterval(() => {
      if (!this.musicPlaying || this.isMuted) return;
      this.tickBGMStep();
      this.bgmStep = (this.bgmStep + 1) % 32;
    }, stepDurationMs);
  }

  // Tăng cường độ nhạc & đổi nhịp theo PHASE của BOSS (Interactive Dynamic BGM)
  setBossPhase(phase = 1, hpPercent = 1) {
    if (!this.musicPlaying) return;
    this.bossPhase = phase;
    let targetBpm = this.baseBpm || 120;
    let amp = 1.0;
    if (phase >= 3 || hpPercent <= 0.35) {
      targetBpm = Math.round((this.baseBpm || 120) * 1.25); // +25% BPM dồn dập
      amp = 1.35;
    } else if (phase >= 2 || hpPercent <= 0.65) {
      targetBpm = Math.round((this.baseBpm || 120) * 1.12); // +12% BPM kịch tính
      amp = 1.18;
    }
    this.bgmIntensity = amp;
    if (Math.abs((this.bpm || 120) - targetBpm) >= 2) {
      this.bpm = targetBpm;
      this.restartBGMLoop();
    }
  }

  // Tăng cường độ nhạc khi boss xuất hiện / chuyển giai đoạn
  setBGMIntensity(v) {
    this.bgmIntensity = Math.max(1, Math.min(1.4, v));
  }

  stopBGM(pauseTrack = true) {
    this.musicPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (pauseTrack) {
      this.bgmWanted = false;
      this._syncBgmAudioState();
    }
  }

  tickBGMStep() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const step = this.bgmStep;
    const theme = this.theme || BGM_THEMES.vovinam;
    const amp = this.bgmIntensity || 1;
    const isRage = (this.bossPhase || 1) >= 3 || amp >= 1.3;
    const isPhase2 = (this.bossPhase || 1) >= 2 || amp >= 1.15;

    // 1. KICK DRUM (Phase 3: Trống dồn nhịp kép 16th, Phase 2: Dậm nhịp 4, Phase 1: Nhịp 4)
    const kickHit = isRage ? (step % 2 === 0) : (isPhase2 ? (step % 4 === 0 || step === 10) : (step % 4 === 0));
    if (kickHit) {
      const kick = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(isRage ? 160 : 140, now);
      kick.frequency.exponentialRampToValueAtTime(36, now + 0.12);

      kickGain.gain.setValueAtTime(0.35 * amp, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + (isRage ? 0.09 : 0.12));

      kick.connect(kickGain);
      kickGain.connect(this.musicGain);
      kick.start(now);
      kick.stop(now + 0.13);
    }

    // 2. SNARE / CLAP (Phách 4, 12, và bổ sung phách 2, 6 khi Boss Nộ)
    const snareHit = isRage ? (step % 4 === 2 || step % 8 === 4) : (step % 8 === 4);
    if (snareHit) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isRage ? 1400 : 1200, now);

      const snareGain = this.ctx.createGain();
      snareGain.gain.setValueAtTime((isRage ? 0.32 : 0.25) * amp, now);
      snareGain.gain.exponentialRampToValueAtTime(0.001, now + (isRage ? 0.08 : 0.1));

      noise.connect(filter);
      filter.connect(snareGain);
      snareGain.connect(this.musicGain);
      noise.start(now, 0, isRage ? 0.08 : 0.1);
    }

    // 3. HI-HAT (tùy theo phe phái: sparse / single / double)
    const hats = isRage ? 'double' : (theme.hats || 'double');
    const hatOn = hats === 'sparse' ? (step % 8 === 0) : (hats === 'single' ? (step % 4 === 0) : (step % 2 === 0));
    if (hatOn) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(isRage ? 6500 : 5000, now);

      const hatGain = this.ctx.createGain();
      hatGain.gain.setValueAtTime((step % 4 === 2 ? 0.16 : 0.09) * amp, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      noise.connect(filter);
      filter.connect(hatGain);
      hatGain.connect(this.musicGain);
      noise.start(now, 0, 0.04);
    }

    // 4. BASSLINE theo phe phái
    const bassScale = theme.bass;
    if (step % 2 === 0 || (isRage && step % 4 === 3)) {
      const noteIdx = Math.floor(step / 4) % bassScale.length;
      const freq = bassScale[noteIdx];

      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.type = isRage ? 'sawtooth' : (theme.wave || 'triangle');
      bass.frequency.setValueAtTime(freq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isRage ? 580 : 380, now);
      filter.frequency.exponentialRampToValueAtTime(140, now + 0.12);

      bassGain.gain.setValueAtTime((isRage ? 0.32 : 0.28) * amp, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      bass.connect(filter);
      filter.connect(bassGain);
      bassGain.connect(this.musicGain);
      bass.start(now);
      bass.stop(now + 0.15);
    }

    // 5. ARP ĐIỆN TỬ (khi có lead hoặc khi Boss bước vào Phase 2-3)
    if ((theme.lead || isPhase2) && step % 2 === 1) {
      const arp = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      arp.type = 'square';
      const scale = [246.94, 293.66, 329.63, 392, 440, 523.25];
      arp.frequency.setValueAtTime(scale[(step >> 1) % scale.length] * (isRage ? 1.5 : 1), now);
      g.gain.setValueAtTime((isRage ? 0.10 : 0.07) * amp, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      arp.connect(g); g.connect(this.musicGain);
      arp.start(now); arp.stop(now + 0.11);
    }

    // 6. CHUÔNG ĐẠI ĐIỆN (phe Triệu)
    if (theme.gong && step === 0) this.playGong(0.28);

    // 7. TIẾNG THÉP CÔNG NGHIỆP (phe Hứa Vũ Đại)
    if (theme.industrial && step % 8 === 6) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.Q.setValueAtTime(6, now);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.12 * amp, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      noise.connect(filter); filter.connect(g); g.connect(this.musicGain);
      noise.start(now, 0, 0.15);
    }

    // 8. ÂM HƯỞNG NGŨ CUNG VÕ HIỆP (Vovinam / Triệu Gia)
    if ((theme === BGM_THEMES.vovinam || theme === BGM_THEMES.trieu) && (step === 0 || step === 6 || step === 12 || step === 18)) {
      const pluck = this.ctx.createOscillator();
      const pg = this.ctx.createGain();
      const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0];
      pluck.type = 'triangle';
      pluck.frequency.setValueAtTime(pentatonic[(step / 6) % pentatonic.length], now);
      pg.gain.setValueAtTime(0.085 * amp, now);
      pg.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      pluck.connect(pg); pg.connect(this.musicGain);
      pluck.start(now); pluck.stop(now + 0.24);
    }
  }

  /** Hiệu ứng leng keng đồng xu + lửa táp cho Kiếm Xu Thiên Khánh */
  playCoinSwordSlash() {
    if (this.playExternalTrack('coin_sword_slash')) return;
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    [1380, 2090].forEach((freq, idx) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, now + idx * 0.03);
      o.frequency.exponentialRampToValueAtTime(freq * 1.18, now + 0.14);
      g.gain.setValueAtTime(0.12, now + idx * 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      o.connect(g); g.connect(this.sfxGain);
      o.start(now + idx * 0.03); o.stop(now + 0.2);
    });
  }
}

// Khởi tạo Singleton Sound Instance với Proxy bảo vệ chống crash game loop nếu gọi hàm âm thanh chưa định nghĩa
const rawAudioManager = new SoundEngine();
const audioManager = new Proxy(rawAudioManager, {
  get(target, prop, receiver) {
    if (prop in target) {
      const val = Reflect.get(target, prop, receiver);
      return typeof val === 'function' ? val.bind(target) : val;
    }
    if (typeof prop === 'string' && prop.startsWith('play')) {
      return () => {}; // Fallback an toàn: no-op, không bao giờ ném TypeError làm đơ game
    }
    return undefined;
  }
});
window.audioManager = audioManager;
