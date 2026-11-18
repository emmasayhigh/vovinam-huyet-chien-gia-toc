/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * tests/test_character_visual_fidelity.js
 *
 * Kiểm thử hệ thống dựng hình nhân vật HTML5 Canvas (9 nhân vật chính):
 * - Mỗi nhân vật sở hữu tỷ lệ cơ thể (rig) & archetype riêng biệt.
 * - Khớp các chi tiết tạo hình sát với concept art 2D.
 * - Tính toán khung xương skeleton(pose, st) ổn định trên mọi tư thế.
 * - Render bình thường, chế độ Silhouette đen thuần 100%, trang phục Vovinam, Portrait & SkinCard hoạt động không lỗi.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.performance = { now: () => 1234 };
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
  width: 300,
  height: 400,
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

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scriptMatches = [...indexHtml.matchAll(/<script\s+src="([^"?]+)(?:\?[^"]*)?"/g)].map(m => m[1]);
for (const rel of scriptMatches) {
  if (rel.endsWith('main.js')) continue;
  require(path.join(__dirname, '..', rel));
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

const NINE_CHARS = [
  { id: 'nghi', styleType: 'player', archetype: 'vovinam_master' },
  { id: 'vananh', styleType: 'boss_vananh', archetype: 'mafia_overcoat' },
  { id: 'tiendang', styleType: 'boss_tiendang', archetype: 'cyber_trench' },
  { id: 'huavudai', styleType: 'npc_huavudai', archetype: 'patriarch_draped_suit' },
  { id: 'bichlam', styleType: 'boss_bichlam', archetype: 'street_brawler_gi' },
  { id: 'dinhan', styleType: 'boss_dinhan', archetype: 'phoenix_general' },
  { id: 'hoanganh', styleType: 'boss_hoanganh', archetype: 'mountain_guardian' },
  { id: 'dunghai', styleType: 'boss_dunghai', archetype: 'shinobi_assassin' },
  { id: 'giangmanh', styleType: 'boss_giangmanh', archetype: 'patriarch_sword_robe' }
];

const renderer = window.skeletalRenderer;
check(!!renderer, 'window.skeletalRenderer khởi tạo thành công');
check(window.SkeletalRendererBody.prototype instanceof window.SkeletalRendererArchetypes, 'Kế thừa SkeletalRendererBody -> SkeletalRendererArchetypes');

// 1. Kiểm tra tính độc lập của 9 Archetype & Tỷ lệ cơ thể (rig)
const archetypesSeen = new Set();
const rigSignatures = new Set();
const hairStylesSeen = new Set();

for (const c of NINE_CHARS) {
  const def = window.CharacterRegistry.get(c.id);
  assert(def && def.appearance && def.appearance.style, `Missing style definition for ${c.id}`);
  const st = renderer.getStyle({ type: c.styleType, styleType: c.styleType, charId: c.id });
  check(st.archetype === c.archetype, `${c.id}: đúng archetype '${c.archetype}'`);
  check(st.rig && typeof st.rig.shW === 'number' && typeof st.rig.spineH === 'number', `${c.id}: có dữ liệu tỷ lệ xương rig`);
  archetypesSeen.add(st.archetype);
  hairStylesSeen.add(st.hairStyle);
  rigSignatures.add(`${st.rig.shW}|${st.rig.waW}|${st.rig.spineH}|${st.rig.thighLen}|${st.rig.limbBulk}`);
}

check(archetypesSeen.size === 9, 'Tất cả 9 nhân vật sở hữu 9 archetype trang phục riêng biệt');
check(rigSignatures.size === 9, 'Tất cả 9 nhân vật sở hữu 9 bộ tỷ lệ cơ thể (rig) khác nhau');
check(hairStylesSeen.size === 9, 'Tất cả 9 nhân vật sở hữu 9 kiểu tóc / mũ riêng biệt');

// 2. Kiểm tra sửa lỗi sai lệch concept art 2D
const stNghi = renderer.getStyle({ type: 'player', charId: 'nghi' });
check(stNghi.bareVChest && stNghi.nameTag && stNghi.thighDragon && stNghi.cuffTrim === '#9b2226', 'Ngô Nhất Nghị: cổ V lộ ngực, thẻ ngực, họa tiết rồng đùi, viền cổ tay đỏ');

const stVanAnh = renderer.getStyle({ type: 'boss_vananh', charId: 'vananh' });
check(stVanAnh.drapedOvercoat && stVanAnh.cigar && stVanAnh.vestColor === '#6b1d2f', 'Phó Văn Anh: áo khoác khoác vai + áo gile đỏ rượu + xì gà');

const stTienDang = renderer.getStyle({ type: 'boss_tiendang', charId: 'tiendang' });
check(stTienDang.cyberTrench && stTienDang.quantumGauntlets && !!stTienDang.glowingEyes, 'Phó Tiến Đăng: cyber trench + găng lượng tử + mắt phát sáng');

const stHuaVuDai = renderer.getStyle({ type: 'npc_huavudai', charId: 'huavudai' });
check(!stHuaVuDai.beard && stHuaVuDai.drapedOvercoat && stHuaVuDai.cane && stHuaVuDai.cuffRedEmbroidery, 'Hứa Vũ Đại: cạo sạch râu (không beard đen), áo choàng vai thêu đỏ + gậy');

const stBichLam = renderer.getStyle({ type: 'boss_bichlam', charId: 'bichlam' });
check(!stBichLam.scarf && stBichLam.stripedWraps && stBichLam.vest, 'Đình Bích Lâm: bỏ khăn cổ, áo gile lục không tay + băng quấn sọc tay');
check(typeof renderer._materialFill === 'function' && renderer._materialFill(null, { _solid: '#000000' }, 'gold', 0, 0, 10, 10, '#f59e0b') === '#000000', 'Material Shading System giữ nguyên 100% chế độ Solid/Silhouette');

const stDinhAn = renderer.getStyle({ type: 'boss_dinhan', charId: 'dinhan' });
check(stDinhAn.helmet === 'golden_lion' && stDinhAn.shield && stDinhAn.weapon === 'mace' && stDinhAn.cape, 'Triệu Đình An: mũ Phụng Hoàng + khiên + chùy + áo choàng đỏ');

const stHoangAnh = renderer.getStyle({ type: 'boss_hoanganh', charId: 'hoanganh' });
check(stHoangAnh.wovenHat && !stHoangAnh.furMantle && !stHoangAnh.beard && stHoangAnh.mountainWraps && stHoangAnh.scar && stHoangAnh.weapon === 'hoe', 'Phó Đặng Hoàng Anh: nón đan sau lưng, bỏ lông thú/râu hộp, sẹo mắt, xà cạp tay + thiết cuốc');

const stDungHai = renderer.getStyle({ type: 'boss_dunghai', charId: 'dunghai' });
check(!stDungHai.ninjaHood && !stDungHai.mask && stDungHai.crimsonScarf && stDungHai.shinobiArmor, 'Phó Dung Hải: bỏ mũ trùm/che mặt, lộ tóc gai + khăn đỏ bay dài + giáp vai thép');

const stGiangManh = renderer.getStyle({ type: 'boss_giangmanh', charId: 'giangmanh' });
check(stGiangManh.wideSleeves && stGiangManh.highCollar && stGiangManh.frostBlade && stGiangManh.hairStyle === 'giangmanh_topknot', 'Ngô Giang Mạnh: tay áo bào rộng, cổ đứng, búi tóc bạc, Hàn Băng Kiếm');

// 3. Kiểm tra toàn bộ pose & chế độ render (Bình thường, Silhouette #000000, Võ Phục Vovinam, Portrait, SkinCard)
const POSES = ['idle', 'walk', 'run', 'punch_hook', 'kick_roundhouse', 'guard', 'hurt'];
for (const c of NINE_CHARS) {
  for (const pose of POSES) {
    const entity = {
      id: `test_${c.id}_${pose}`,
      type: c.styleType,
      styleType: c.styleType,
      charId: c.id,
      characterId: c.id,
      state: pose,
      stateTimer: 0.2,
      stateDuration: 0.45,
      animTime: 0.35,
      vx: pose === 'run' ? 220 : 0,
      facing: 1,
      armed: true,
      x: 150,
      y: 300,
      z: 0
    };

    // Normal render
    const ctxNormal = createSpyCtx(null);
    renderer.render(ctxNormal, entity, { x: 0, y: 0 });

    // Pure black Silhouette render: MỌI màu vẽ đều phải là '#000000'
    const silColors = [];
    const ctxSil = createSpyCtx(silColors);
    renderer.render(ctxSil, Object.assign({}, entity, { _silhouetteColor: '#000000' }), { x: 0, y: 0 });
    const nonBlack = silColors.filter(col => col !== '#000000');
    check(silColors.length > 0 && nonBlack.length === 0, `${c.id} [${pose}]: Silhouette đen thuần 100% không rò màu (leaked: ${[...new Set(nonBlack)].join(', ')})`);
  }

  // Vovinam skin render
  const vovEntity = {
    id: `test_vov_${c.id}`,
    type: c.styleType,
    styleType: c.styleType,
    charId: c.id,
    characterId: c.id,
    vovinamSkin: true,
    state: 'idle',
    animTime: 0.3,
    facing: 1,
    x: 150,
    y: 300,
    z: 0
  };
  const vovSt = renderer.getStyle(vovEntity);
  if (c.id !== 'nghi') {
    check(!vovSt.drapedOvercoat && !vovSt.cyberTrench && !vovSt.wovenHat && !vovSt.crimsonScarf && !vovSt.stripedWraps && !vovSt.shinobiArmor && vovSt.patch === true, `${c.id}: skin Vovinam dọn sạch phụ kiện trang phục gốc, giữ patch Vovinam`);
  }
  renderer.render(createSpyCtx(null), vovEntity, { x: 0, y: 0 });

  // Portrait & SkinCard
  const portCanvas = makeStubEl();
  portCanvas.width = 96; portCanvas.height = 96;
  renderer.drawPortrait(portCanvas, c.styleType, false, false);
  const def = window.CharacterRegistry.get(c.id);
  renderer.drawSkinCardArt(makeStubEl(), def.dossier, 'default');
  renderer.drawSkinCardArt(makeStubEl(), def.dossier, 'vovinam');
}

// Kiểm tra độ thoáng khuôn mặt (không bị cánh tay, cẳng tay, vai, cổ áo/khăn, tay áo rộng, vũ khí che khuất)
{
  const distSegPt = (pt, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    if (l2 < 1e-6) return Math.hypot(pt[0] - a[0], pt[1] - a[1]);
    const t = Math.max(0, Math.min(1, ((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dy) / l2));
    return Math.hypot(pt[0] - (a[0] + t * dx), pt[1] - (a[1] + t * dy));
  };
  const faceFeaturePts = (jt, st) => {
    const hs = (st.rig && st.rig.headScale) || 0.80;
    const c = Math.cos(jt.ha), s = Math.sin(jt.ha);
    const toW = (lx, ly) => [jt.head[0] + (lx * c - ly * s) * hs, jt.head[1] + (lx * s + ly * c) * hs];
    return {
      eye: toW(5.0, -1.0),
      nose: toW(9.0, 0.8),
      mouth: toW(5.4, 5.6),
      chin: toW(2.5, 9.2)
    };
  };
  const FACE_STATES = [
    { state: 'idle', phases: [0.35] },
    { state: 'walk', phases: [0.15, 0.45, 0.75] },
    { state: 'run', phases: [0.15, 0.45, 0.75] },
    { state: 'punch_straight', phases: [0.2, 0.4, 0.65] },
    { state: 'punch_hook', phases: [0.2, 0.4, 0.65] },
    { state: 'elbow_strike', phases: [0.2, 0.4, 0.65] },
    { state: 'uppercut', phases: [0.2, 0.4, 0.65] },
    { state: 'kick_roundhouse', phases: [0.2, 0.45, 0.7] },
    { state: 'wk', phases: [0.2, 0.45, 0.7] },
    { state: 'kick_sweep', phases: [0.2, 0.45, 0.7] },
    { state: 'counter_hand_strike', phases: [0.25, 0.5] },
    { state: 'hurt', phases: [0.25] }
  ];
  const HERO_TYPES = [
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
  for (const h of HERO_TYPES) {
    const idleEnt = {
      id: 'fv_' + h.id, type: h.styleType, styleType: h.styleType, charId: h.id,
      state: 'idle', stateTimer: 0.35, stateDuration: 0.45, animTime: 0.35,
      vx: 0, facing: 1, armed: true, x: 0, y: 0, z: 0
    };
    const iSt = renderer.getStyle(idleEnt);
    const iJt = renderer.skeleton(renderer.calculatePose(idleEnt), iSt);
    const iF = faceFeaturePts(iJt, iSt);
    const collarTopY =
      iSt.archetype === 'patriarch_sword_robe' ? iJt.sh[1] - 5.2 :
      iSt.archetype === 'cyber_trench' ? iJt.sh[1] - 4.6 :
      iSt.archetype === 'shinobi_assassin' ? iJt.sh[1] - 4.3 : iJt.sh[1];
    check(collarTopY >= iF.chin[1] + 0.5, `${h.id}: cổ áo/khăn cổ nằm dưới cằm (${collarTopY.toFixed(1)} >= ${(iF.chin[1] + 0.5).toFixed(1)})`);
    check(iJt.nSh[1] >= iF.chin[1] + 3.0, `${h.id}: khớp vai gần không nâng che cằm ở tư thế idle`);

    let overlapCount = 0;
    let firstOverlap = '';
    for (const sInfo of FACE_STATES) {
      for (const ph of sInfo.phases) {
        const e = {
          id: 'fv_' + h.id, type: h.styleType, styleType: h.styleType, charId: h.id,
          state: sInfo.state, stateTimer: ph * 0.45, stateDuration: 0.45, animTime: ph * 2.0,
          vx: sInfo.state === 'run' ? 220 : (sInfo.state === 'walk' ? 95 : 0),
          facing: 1, armed: true, x: 0, y: 0, z: 0
        };
        const st = renderer.getStyle(e);
        const jt = renderer.skeleton(renderer.calculatePose(e), st);
        renderer.applyWeaponGrip(jt, st);
        const f = faceFeaturePts(jt, st);
        const bulk = (st.rig && (st.rig.armBulk || st.rig.limbBulk)) || 1.0;
        const pts4 = [f.eye, f.nose, f.mouth, f.chin];
        const pts3 = [f.eye, f.nose, f.mouth];
        const dFore = Math.min(...pts4.map(pt => distSegPt(pt, jt.nElb, jt.nHand))) - 4.2 * bulk;
        const dUpper = Math.min(...pts3.map(pt => distSegPt(pt, jt.nSh, jt.nElb))) - 5.0 * bulk;
        const dHand = Math.min(...pts3.map(pt => Math.hypot(jt.nHand[0] - pt[0], jt.nHand[1] - pt[1]))) - 3.8;
        if (dFore < 1.5 || dUpper < 1.0 || dHand < 2.0) {
          overlapCount++;
          if (!firstOverlap) firstOverlap = `${sInfo.state}@${ph}`;
        }
      }
    }
    check(overlapCount === 0, `${h.id}: mặt & mắt luôn thông thoáng trên mọi tư thế cốt lõi (${overlapCount} lỗi${firstOverlap ? ': ' + firstOverlap : ''})`);

    const def = window.CharacterRegistry.get(h.id);
    check(Boolean(def && def.animation && def.animation.poses && typeof def.animation.poses.elbow_strike === 'function'), `${h.id}: có pose elbow_strike riêng biệt`);
    const mkAttackEnt = (stName) => ({
      id: 'fv_' + h.id, type: h.styleType, styleType: h.styleType, charId: h.id,
      state: stName, stateTimer: 0.22, stateDuration: 0.45, animTime: 0.22,
      vx: 0, facing: 1, armed: true, x: 0, y: 0, z: 0
    });
    const jtElb = renderer.skeleton(renderer.calculatePose(mkAttackEnt('elbow_strike')), iSt);
    const jtStr = renderer.skeleton(renderer.calculatePose(mkAttackEnt('punch_straight')), iSt);
    const sepDist = Math.hypot(jtElb.nHand[0] - jtStr.nHand[0], jtElb.nHand[1] - jtStr.nHand[1]);
    const forearmDirDelta = Math.hypot(
      (jtElb.nHand[0] - jtElb.nElb[0]) - (jtStr.nHand[0] - jtStr.nElb[0]),
      (jtElb.nHand[1] - jtElb.nElb[1]) - (jtStr.nHand[1] - jtStr.nElb[1])
    );
    check(sepDist > 12 && (jtElb.nHand[0] <= jtElb.nElb[0] + 4 || forearmDirDelta > 12), `${h.id}: elbow_strike có hình thế cẳng tay/vũ khí khác biệt rõ rệt với punch_straight (Δhand=${sepDist.toFixed(1)}, Δdir=${forearmDirDelta.toFixed(1)})`);
    const sc = window.CharacterRegistry.getSparkColors({ type: h.styleType, charId: h.id });
    check(Boolean(sc && sc.base && sc.alt), `${h.id}: có bảng màu Hit-Spark riêng biệt (${sc && sc.base})`);
  }

  const dunghaiUpEnt = {
    id: 'fv_dunghai_up', type: 'player', styleType: 'player', charId: 'dunghai',
    state: 'uppercut', stateTimer: 0.22, stateDuration: 0.45, animTime: 0.22,
    vx: 0, facing: 1, armed: true, x: 0, y: 0, z: 0
  };
  const dSt = renderer.getStyle(dunghaiUpEnt);
  const dUpJt = renderer.skeleton(renderer.calculatePose(dunghaiUpEnt), dSt);
  check(Math.hypot(dUpJt.nHand[0] - dUpJt.fHand[0], dUpJt.nHand[1] - dUpJt.fHand[1]) > 14, 'dunghai.uppercut cân bằng tay trước-sau bất đối xứng rõ ràng');
}

check(true, 'Tất cả 9 nhân vật vượt qua kiểm thử tạo hình, khung xương, silhouette & render');
console.log(`\n🎉 TỔNG KẾT TEST VISUAL FIDELITY: ${passed} checks PASSED!`);
