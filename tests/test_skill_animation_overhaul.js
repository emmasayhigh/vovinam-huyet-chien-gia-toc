/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * tests/test_skill_animation_overhaul.js
 *
 * Kiểm thử toàn diện hệ thống Hoạt Ảnh Kỹ Năng 5 Giai Đoạn & Hiệu Chỉnh Tỷ Lệ Anime 2.0:
 * 1. AnimUtil.stage5(p) phủ đầy đủ 5 giai đoạn (Anticipation -> Cast -> Impact -> Follow-Through -> Recovery).
 * 2. Không còn POSE_ALIAS fallback cho bất kỳ Tuyệt Kỹ (ultimate_*) nào.
 * 3. EffectManager deterministic dt-driven (scheduledEffects, không setTimeout trong createUltimateBlast, particles <= maxParticles).
 * 4. Cả 9 nhân vật có tư thế Idle độc bản theo Concept 2D, tỷ lệ Anime (>= 6.4 đầu, headScale <= 0.82),
 *    pose riêng cho dodge / counter_hand_strike / counter_leg_strike / ultimate_*, trailProfile & emitSkillVFX riêng.
 * 5. Chế độ Võ phục Vovinam chuyển giao mượt mà về kỹ năng Ngô Nhất Nghị.
 * 6. Toàn bộ kỹ năng & tư thế render bình thường + Silhouette #000000 thuần túy 100% không rò màu.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.performance = { now: () => 2500 };
const memStore = {};
global.localStorage = {
  getItem: (k) => (k in memStore ? memStore[k] : null),
  setItem: (k, v) => { memStore[k] = String(v); },
  removeItem: (k) => { delete memStore[k]; }
};
global.requestAnimationFrame = () => 1;

function createSpyCtx(recordedColors) {
  let _fillStyle = '#000000';
  let _strokeStyle = '#000000';
  return {
    get fillStyle() { return _fillStyle; },
    set fillStyle(v) {
      _fillStyle = v;
      if (recordedColors && typeof v === 'string') recordedColors.push(v);
    },
    get strokeStyle() { return _strokeStyle; },
    set strokeStyle(v) {
      _strokeStyle = v;
      if (recordedColors && typeof v === 'string') recordedColors.push(v);
    },
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    shadowColor: 'transparent',
    shadowBlur: 0,
    save() {}, restore() {}, translate() {}, scale() {}, rotate() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, ellipse() {},
    rect() {}, roundRect() {}, stroke() {}, fill() {}, clip() {},
    fillRect() {}, strokeRect() {}, clearRect() {}, fillText() {}, strokeText() {},
    measureText: () => ({ width: 40 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} })
  };
}

const makeStubEl = () => ({
  width: 320,
  height: 420,
  textContent: '',
  innerHTML: '',
  style: {},
  dataset: {},
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  addEventListener() {},
  removeEventListener() {},
  appendChild() {},
  removeAttribute() {},
  setAttribute() {},
  getAttribute: () => null,
  querySelector: () => makeStubEl(),
  querySelectorAll: () => [],
  getContext: () => createSpyCtx(null)
});

global.document = {
  getElementById: () => makeStubEl(),
  querySelector: () => makeStubEl(),
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: () => makeStubEl(),
  body: makeStubEl()
};

const rootDir = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const scriptMatches = [...indexHtml.matchAll(/<script\s+src="([^"?]+)(?:\?[^"]*)?"/g)].map(m => m[1]);
for (const rel of scriptMatches) {
  if (rel.endsWith('main.js')) continue;
  require(path.join(rootDir, rel));
}

let passed = 0;
function check(cond, msg) {
  if (!cond) {
    console.error('❌ FAILED:', msg);
    process.exit(1);
  }
  passed++;
  console.log('✅ PASSED:', msg);
}

const NINE_HEROES = [
  { id: 'nghi', styleType: 'player' },
  { id: 'vananh', styleType: 'boss_vananh' },
  { id: 'tiendang', styleType: 'boss_tiendang' },
  { id: 'huavudai', styleType: 'npc_huavudai' },
  { id: 'bichlam', styleType: 'boss_bichlam' },
  { id: 'dinhan', styleType: 'boss_dinhan' },
  { id: 'hoanganh', styleType: 'boss_hoanganh' },
  { id: 'dunghai', styleType: 'boss_dunghai' },
  { id: 'giangmanh', styleType: 'boss_giangmanh' }
];

// 1. 5-Stage Choreography Utility
const AU = window.AnimUtil;
check(!!AU && typeof AU.stage5 === 'function', 'AnimUtil.stage5() sẵn sàng');
const expectedStages = [
  { p: 0.05, stage: 0, name: 'anticipation' },
  { p: 0.25, stage: 1, name: 'cast' },
  { p: 0.45, stage: 2, name: 'impact' },
  { p: 0.72, stage: 3, name: 'follow_through' },
  { p: 0.92, stage: 4, name: 'recovery' }
];
for (const sample of expectedStages) {
  const s = AU.stage5(sample.p);
  check(s && s.stageIndex === sample.stage && s.stage === sample.name && s.localT >= 0 && s.localT <= 1,
    `AnimUtil.stage5(${sample.p}) -> stage ${sample.stage} (${sample.name})`);
}

// 2. Zero POSE_ALIAS ultimate fallbacks
const aliases = window.POSE_ALIAS || {};
const aliasUlts = Object.keys(aliases).filter(k => k.startsWith('ultimate_'));
check(aliasUlts.length === 0, `Không còn ultimate_* fallback trong POSE_ALIAS (found: ${aliasUlts.length})`);

// 3. Deterministic EffectManager & bounded particles
check(typeof window.EffectManager === 'function', 'window.EffectManager constructor được export cho Showcase & Demo');
const effectsSrc = fs.readFileSync(path.join(rootDir, 'js/core/effects.js'), 'utf8');
const blastMatch = effectsSrc.match(/createUltimateBlast[\s\S]{0,1800}/);
check(blastMatch && !blastMatch[0].includes('setTimeout'), 'EffectManager.createUltimateBlast không sử dụng setTimeout');

const fx = new window.EffectManager();
fx.createUltimateBlast(300, 520, '#38bdf8');
check(Array.isArray(fx.scheduledEffects) && fx.scheduledEffects.length > 0, 'createUltimateBlast đẩy burst vào scheduledEffects deterministic queue');
for (let i = 0; i < 40; i++) fx.update(0.016);
check(fx.scheduledEffects.length === 0, 'EffectManager.update(dt) giải phóng hết scheduledEffects theo thời gian');

for (let i = 0; i < 1500; i++) {
  fx._pushParticle({ x: 100, y: 100, vx: 10, vy: -10, color: '#ffffff', life: 0.5, maxLife: 0.5, size: 4, alpha: 1 });
}
check(fx.particles.length <= fx.maxParticles, `Hạt EffectManager bị giới hạn an toàn (${fx.particles.length} <= ${fx.maxParticles})`);
fx.clearSkillEffects();
check(fx.particles.length === 0 && fx.scheduledEffects.length === 0, 'clearSkillEffects() dọn sạch toàn bộ particle & scheduledEffects');

// 4. Kiểm tra 9 nhân vật: Skill Catalog, Pose riêng, Idle độc bản, Tỷ lệ Anime, Trail, VFX & Silhouette
const renderer = window.skeletalRenderer;
const registry = window.CharacterRegistry;
const idleSignatures = new Set();
const trailSignatures = new Set();
const ultStatesSeen = new Set();

for (const hero of NINE_HEROES) {
  const def = registry.get(hero.id);
  check(!!def, `Đã đăng ký module nhân vật ${hero.id}`);
  const ultState = def.combat && def.combat.ultimateState;
  check(typeof ultState === 'string' && ultState.startsWith('ultimate_'), `${hero.id}: có combat.ultimateState '${ultState}'`);
  ultStatesSeen.add(ultState);

  // Skill catalog
  const catalog = registry.getSkillCatalog(hero.id);
  check(Array.isArray(catalog) && catalog.length >= 14, `${hero.id}: catalog có ${catalog.length} kỹ năng (>= 14)`);
  check(catalog.some(s => s.id === ultState), `${hero.id}: catalog chứa tuyệt kỹ riêng ${ultState}`);

  // Animation pose overrides
  const poses = (def.animation && def.animation.poses) || {};
  for (const reqPose of ['idle', 'dodge', 'counter_hand_strike', 'counter_leg_strike', ultState]) {
    check(typeof poses[reqPose] === 'function', `${hero.id}: sở hữu choreography riêng cho '${reqPose}'`);
  }

  // Stylized Anime Proportions & Unique Idle Pose
  const entityBase = {
    id: `skill_test_${hero.id}`,
    charId: hero.id,
    characterId: hero.id,
    type: hero.styleType,
    styleType: hero.styleType,
    state: 'idle',
    stateTimer: 0.25,
    stateDuration: 0.6,
    animTime: 0.4,
    facing: 1,
    armed: true,
    x: 160,
    y: 360,
    z: 0
  };
  const st = renderer.getStyle(entityBase);
  const rig = st.rig || {};
  const hs = rig.headScale || 0.80;
  const totalH = (rig.thighLen || 25) + (rig.calfLen || 25) + (rig.footPad || 3.4) + (rig.spineH || 33) + (rig.neckLen || 6.5) + 8;
  const headRatio = totalH / (19.6 * hs);
  check(hs <= 0.82 && headRatio >= 6.4, `${hero.id}: tỷ lệ Stylized Anime đạt ${headRatio.toFixed(2)} đầu (headScale=${hs})`);

  const idleP = renderer.calculatePose(entityBase, st);
  const idleSig = [
    idleP.torso.toFixed(2),
    idleP.nT.toFixed(2),
    idleP.fT.toFixed(2),
    idleP.nA.toFixed(2),
    idleP.fA.toFixed(2),
    idleP.nE.toFixed(2)
  ].join('|');
  idleSignatures.add(idleSig);

  // Trail profile
  const tp = registry.getTrailProfile(entityBase, st);
  check(!!tp && typeof tp.primary === 'string' && typeof tp.width === 'number', `${hero.id}: có trailProfile (${tp.primary})`);
  trailSignatures.add(`${tp.primary}|${tp.core}|${tp.style || ''}`);

  // Emit Skill VFX cleanly across progress intervals
  const testFx = new window.EffectManager();
  const dummyTarget = [{ x: 260, y: 360, z: 0, hp: 500, maxHp: 500, width: 42, height: 96 }];
  const vfxStates = ['punch_straight', 'counter_hand_strike', 'counter_leg_strike', 'dodge', ultState];
  for (const vst of vfxStates) {
    const eVfx = Object.assign({}, entityBase, { state: vst });
    for (let k = 0; k < 10; k++) {
      registry.emitSkillVFX(eVfx, vst, k / 10, (k + 1) / 10, testFx, dummyTarget);
    }
  }
  const totalSpawned = testFx.particles.length + testFx.skillProps.length +
    testFx.dimensionalSlashes.length + testFx.shockwaves.length +
    testFx.lightningArcs.length + testFx.magmaCraters.length;
  check(totalSpawned > 0, `${hero.id}: emitSkillVFX tạo được hiệu ứng hình ảnh riêng (${totalSpawned} phần tử)`);

  // Render normal + 100% pure black Silhouette across key skill states
  for (const rst of ['idle', 'dodge', 'punch_straight', 'counter_hand_strike', 'counter_leg_strike', ultState]) {
    const ent = Object.assign({}, entityBase, { state: rst, stateTimer: 0.36, stateDuration: 0.8 });
    renderer.render(createSpyCtx(null), ent, { x: 0, y: 0 });

    const silColors = [];
    renderer.render(createSpyCtx(silColors), Object.assign({}, ent, { _silhouetteColor: '#000000' }), { x: 0, y: 0 });
    const nonBlack = silColors.filter(c => c !== '#000000');
    check(nonBlack.length === 0, `${hero.id} [${rst}]: Silhouette 100% đen thuần (0 màu rò rỉ)`);
  }
}

check(ultStatesSeen.size === 9, `Tất cả 9 nhân vật có 9 Tuyệt Kỹ hoàn toàn độc lập (${ultStatesSeen.size}/9)`);
check(idleSignatures.size === 9, `Tất cả 9 nhân vật có 9 tư thế Idle khác nhau hoàn toàn (${idleSignatures.size}/9)`);
check(trailSignatures.size >= 7, `Các nhân vật có hồ sơ vệt đánh Trail riêng biệt (${trailSignatures.size} cấu hình khác nhau)`);

// 5. Vovinam skin purely cosmetic check (keeps character's own identity & animations)
const vanAnhVov = {
  id: 'vov_swap_test',
  charId: 'vananh',
  characterId: 'vananh',
  type: 'boss_vananh',
  styleType: 'boss_vananh',
  vovinamSkin: true,
  equippedSkin: 'vovinam',
  state: 'ultimate_barrage',
  stateTimer: 0.4,
  stateDuration: 1.5,
  animTime: 0.5,
  facing: 1,
  x: 160,
  y: 360,
  z: 0
};
check(registry.resolveForEntity(vanAnhVov).id === 'vananh', 'Trang phục Vovinam trên vananh chỉ đổi áo, giữ nguyên bộ chiêu thức vananh');
const vovP = renderer.calculatePose(vanAnhVov, renderer.getStyle(vanAnhVov));
check(Number.isFinite(vovP.torso) && Number.isFinite(vovP.nA), 'Trang phục Vovinam giữ nguyên ultimate_barrage của vananh mượt mà không NaN');

// 6. Verify Showcase & Char Select Demo integration
const showcasePath = path.join(rootDir, 'harness/preview_skill_showcase.html');
const charDemoSrc = fs.readFileSync(path.join(rootDir, 'js/ui/menu/charselect/charSelectDemo.js'), 'utf8');
check(fs.existsSync(showcasePath), 'harness/preview_skill_showcase.html tồn tại');
check(charDemoSrc.includes('new window.EffectManager') && charDemoSrc.includes('emitSkillVFX'),
  'charSelectDemo.js tích hợp live EffectManager & CharacterRegistry.emitSkillVFX');

// V3.0 Verification: 27 Bespoke Choreographies (J+J+K, W+K, S+K), Pose Uniqueness Without VFX, and Disable-VFX Hook
const V3_HEROES = [
  { id: 'nghi', styleType: 'player' },
  { id: 'vananh', styleType: 'boss_vananh' },
  { id: 'tiendang', styleType: 'boss_tiendang' },
  { id: 'huavudai', styleType: 'npc_huavudai' },
  { id: 'bichlam', styleType: 'boss_bichlam' },
  { id: 'dinhan', styleType: 'boss_dinhan' },
  { id: 'hoanganh', styleType: 'boss_hoanganh' },
  { id: 'dunghai', styleType: 'boss_dunghai' },
  { id: 'giangmanh', styleType: 'boss_giangmanh' }
];
const v3Renderer = new window.SkeletalRenderer();
const sampleV3Pose = (hero, state, dur, p, moveVariant) => {
  const ent = {
    id: hero.id, characterId: hero.id, charId: hero.id, styleType: hero.styleType,
    facing: 1, vx: 0, vy: 0, z: 0, isDead: false, rageActive: false,
    state, stateDuration: dur, stateTimer: dur * p, _moveVariant: moveVariant || null
  };
  const pose = v3Renderer.calculatePose(ent);
  return [pose.torso, pose.lift, pose.nT, pose.nS, pose.fT, pose.fS, pose.nA, pose.nE, pose.fA, pose.fE, pose.grip]
    .map(v => Math.round((Number(v) || 0) * 10)).join('|');
};

const jjkSigs = new Set();
const wkSigs = new Set();
const skSigs = new Set();

for (const h of V3_HEROES) {
  const mod = registry.get(h.id);
  const poses = mod && mod.animation && mod.animation.poses;
  check(poses && typeof poses.punch_straight === 'function', `${h.id} có poses.punch_straight riêng (J+J+K Beat 1)`);
  check(poses && typeof poses.punch_hook === 'function', `${h.id} có poses.punch_hook riêng (J+J+K Beat 2)`);
  check(poses && typeof poses.kick_roundhouse === 'function', `${h.id} có poses.kick_roundhouse riêng (J+J+K Beat 3)`);
  check(poses && typeof poses.wk === 'function', `${h.id} có poses.wk riêng (W+K)`);
  check(poses && typeof poses.kick_sweep === 'function', `${h.id} có poses.kick_sweep riêng (S+K)`);

  const jjkSig = sampleV3Pose(h, 'kick_roundhouse', 0.60, 0.46, null);
  const wkSig = sampleV3Pose(h, 'kick_push', 0.52, 0.45, 'wk');
  const kPushSig = sampleV3Pose(h, 'kick_push', 0.52, 0.45, null);
  const skSig = sampleV3Pose(h, 'kick_sweep', 0.66, 0.48, null);

  jjkSigs.add(jjkSig);
  wkSigs.add(wkSig);
  skSigs.add(skSig);

  check(wkSig !== skSig, `${h.id}: W+K khác hoàn toàn S+K (không đối xứng gương)`);
  check(wkSig !== kPushSig, `${h.id}: W+K khác biệt rõ ràng so với K thường (kick_push)`);

  // Verify Disable-VFX hook stops VFX spawning cleanly
  const noVfxFx = new window.EffectManager();
  registry.emitSkillVFX({ characterId: h.id, charId: h.id, styleType: h.styleType, facing: 1, x: 200, y: 580, _disableVfx: true }, 'kick_push', 0.0, 0.6, noVfxFx, []);
  const spawnedNoVfx = noVfxFx.particles.length + noVfxFx.skillProps.length + noVfxFx.dimensionalSlashes.length + noVfxFx.shockwaves.length;
  check(spawnedNoVfx === 0, `${h.id}: Disable-VFX chặn hoàn toàn particle/VFX khi kiểm tra silhouette`);
}

check(jjkSigs.size === 9, `Tất cả 9/9 nhân vật có silhouette J+J+K Beat 3 khác biệt hoàn toàn (${jjkSigs.size}/9)`);
check(wkSigs.size === 9, `Tất cả 9/9 nhân vật có silhouette W+K khác biệt hoàn toàn (${wkSigs.size}/9)`);
check(skSigs.size === 9, `Tất cả 9/9 nhân vật có silhouette S+K khác biệt hoàn toàn (${skSigs.size}/9)`);

console.log(`\n🎉 ALL ${passed} CHECKS PASSED in test_skill_animation_overhaul.js!\n`);
