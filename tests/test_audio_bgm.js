/**
 * TEST SUITE: MAIN THEME MP3 BGM & VOLUME/MUTE SYNC (TASK-026)
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: MAIN THEME BGM ===');

// 1. Asset file existence check
const mp3Path = path.resolve(__dirname, '../assets/audio/main_theme.mp3');
assert.ok(fs.existsSync(mp3Path), 'assets/audio/main_theme.mp3 must exist');
const mp3Size = fs.statSync(mp3Path).size;
assert.ok(mp3Size > 1000000, `assets/audio/main_theme.mp3 size (${mp3Size}) must be > 1MB`);
console.log(`✓ Asset check passed: main_theme.mp3 (${mp3Size} bytes)`);

// 2. Mock DOM / Audio / WebAudio environment
const createdAudios = [];
class MockAudio {
  constructor(src) {
    this.src = src;
    this.loop = false;
    this.preload = 'none';
    this.volume = 1;
    this.paused = true;
    this.currentTime = 0;
    this.playCount = 0;
    this.pauseCount = 0;
    createdAudios.push(this);
  }
  play() {
    this.paused = false;
    this.playCount += 1;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
    this.pauseCount += 1;
  }
}

global.window = global;
global.Audio = MockAudio;
global.AudioContext = class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.state = 'running';
    this.destination = {};
  }
  resume() { return Promise.resolve(); }
  createGain() {
    return {
      gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {}
    };
  }
  createBuffer() { return { getChannelData: () => new Float32Array(4410) }; }
};
global.document = { addEventListener() {} };
global.saveManager = {
  data: { settings: { musicVolume: 0.6, sfxVolume: 0.8, muted: false } },
  setSetting(k, v) { this.data.settings[k] = v; }
};

require(path.resolve(__dirname, '../js/core/audio.js'));
const am = window.audioManager;
assert.ok(am, 'window.audioManager initialized');

// 3. Unlock starts Menu MP3 BGM seamlessly
am.unlock();
assert.strictEqual(createdAudios.length, 1, 'Creates single main_theme Audio instance');
const bgm = am.bgmAudio;
assert.ok(bgm, 'bgmAudio attached to audioManager');
assert.strictEqual(bgm.src, 'assets/audio/main_theme.mp3', 'Uses main_theme.mp3 source');
assert.strictEqual(bgm.loop, true, 'BGM loops continuously');
assert.strictEqual(bgm.paused, false, 'unlock() starts playing menu BGM');
assert.ok(Math.abs(bgm.volume - 0.6 * 0.75) < 0.001, `Applies saved musicVolume * masterVolume (got ${bgm.volume})`);

// 4. Transitioning to combat stage & boss phase keeps MP3 BGM playing without procedural timer
am.startStageBGM(4);
assert.strictEqual(am.bgmTimer, null, 'Does not start procedural bgmTimer when MP3 track is active');
assert.strictEqual(bgm.playCount, 1, 'Does not restart MP3 when already playing from Menu into Stage');
am.setBossPhase(3, 0.25);
assert.strictEqual(am.bgmTimer, null, 'setBossPhase does not start procedural bgmTimer over MP3 track');

// 5. Volume slider sync (live non-persisted drag & persisted commit)
am.setMusicVolume(0.2, false);
assert.ok(Math.abs(bgm.volume - 0.2 * 0.75) < 0.001, 'setMusicVolume updates bgmAudio.volume live');
assert.strictEqual(global.saveManager.data.settings.musicVolume, 0.6, 'persist=false defers saveManager write while dragging');
am.setMusicVolume(0.8, true);
assert.ok(Math.abs(bgm.volume - 0.8 * 0.75) < 0.001, 'setMusicVolume(0.8, true) updates bgmAudio.volume');
assert.strictEqual(global.saveManager.data.settings.musicVolume, 0.8, 'persist=true updates saveManager');

// 6. Ducking during fanfare keeps track running at reduced volume then restores
am.duckBGM(0.25, 0);
assert.ok(Math.abs(bgm.volume - 0.8 * 0.75 * 0.25) < 0.001, 'duckBGM lowers volume cleanly during fanfare');
am._bgmDuckMul = 1.0;
am._syncBgmAudioState();

// 7. Mute / Unmute toggles playback cleanly
const unmutedAfterFirstToggle = am.toggleMute();
assert.strictEqual(unmutedAfterFirstToggle, false, 'First toggleMute mutes audio');
assert.strictEqual(bgm.paused, true, 'Mute pauses MP3 BGM');
assert.strictEqual(bgm.volume, 0, 'Mute zeroes MP3 BGM volume');

const unmutedAfterSecondToggle = am.toggleMute();
assert.strictEqual(unmutedAfterSecondToggle, true, 'Second toggleMute unmutes audio');
assert.strictEqual(bgm.paused, false, 'Unmute resumes MP3 BGM');
assert.ok(Math.abs(bgm.volume - 0.8 * 0.75) < 0.001, 'Unmute restores MP3 BGM volume');

// 8. Explicit stopBGM pauses track, startMenuBGM resumes
am.stopBGM();
assert.strictEqual(bgm.paused, true, 'stopBGM pauses track');
am.startMenuBGM();
assert.strictEqual(bgm.paused, false, 'startMenuBGM resumes track');
assert.strictEqual(createdAudios.length, 1, 'Never leaks duplicate Audio objects');

console.log('✓ ALL MAIN THEME BGM TESTS PASSED!');
