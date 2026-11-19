/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/save.js - Hệ thống lưu tiến trình localStorage (có kiểm tra & nâng cấp dữ liệu)
 *
 * Dữ liệu lưu:
 *  - Chương/màn đã hoàn thành
 *  - Nhân vật đã mở khóa + nhân vật đang chọn
 *  - Nhiệm vụ phụ đã làm
 *  - Lựa chọn cốt truyện quan trọng (3 lựa chọn -> 4 kết thúc)
 *  - Kết thúc đã đạt, thành tích
 *  - Cài đặt âm thanh
 */

const SAVE_KEY = 'vovinam_huyet_chinh_gia_toc';
const SAVE_VERSION = 5;
const FRESH_RESET_KEY = 'vovinam_clean_reset_2026_v1';

class SaveManager {
  constructor() {
    this.key = SAVE_KEY;
    this.version = SAVE_VERSION;
    this.ensureCleanResetOnce();
    this.data = this.createDefaults();
    this.load();
  }

  ensureCleanResetOnce() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem(FRESH_RESET_KEY) !== '1') {
        localStorage.removeItem(this.key);
        localStorage.removeItem('vovinam_fx_settings');
        localStorage.setItem(FRESH_RESET_KEY, '1');
      }
    } catch (e) {
      // Ignore storage access errors
    }
  }

  createDefaults() {
    return {
      version: SAVE_VERSION,
      createdAt: Date.now(),
      currentStage: 1,            // màn chơi gợi ý khi bấm "Tiếp tục"
      selectedCharacter: 'nghi',  // nhân vật đang chọn
      completedStages: [],        // id màn đã hoàn thành
      unlockedCharacters: ['nghi'],
      missionsDone: [],           // id nhiệm vụ phụ đã hoàn thành
      choices: {},                // { rescue: 'break'|'proof', mountain: 'withdraw'|'listen', danghai: 'handover'|'spare' }
      endings: [],                // id kết thúc đã đạt
      bossesDefeated: [],         // id boss đã hạ
      achievements: [],           // id thành tích
      dialogueSeen: [],           // id cảnh đã xem (để bỏ qua cinematic lần 2)
      // Hệ thống điều tra & Huyết Án Họ Phó:
      evidenceFound: [],          // id bằng chứng đã tìm thấy
      evidenceCustody: {},        // { [docId]: 'nghi' | 'mocdang' | 'dunghai' | 'hoanganh' | 'huavudai' | 'public' | 'destroyed' }
      evidenceDestroyed: [],      // id bằng chứng bị tiêu huỷ
      evidenceDecoded: [],        // id bằng chứng đã giải mã
      characterTrust: {           // Mức độ tin nhiệm của từng nhân vật (0 - 100)
        mocdang: 50,
        dunghai: 30,
        hoanganh: 40,
        huavudai: 60,
        giangmanh: 20
      },
      storyFlags: {},             // Cờ sự kiện & bí mật đã mở
      allyAvailability: {         // Đồng minh sẵn sàng chi viện trong chiến đấu
        hoanganh: false,
        dunghai: false,
        mocdang: false,
        bichlam: false,
        dinhan: false,
        huavudai: false,
        giangmanh: false
      },
      selectedAlly: 'auto',       // Đồng minh viện trợ đang chọn ('auto' hoặc charId)
      flashbackChoices: [],       // Quyết định trong hồi ức Dung Hải
      stats: { totalHits: 0, bestCombo: 0, perfectDodges: 0, stagesCleared: 0 },
      settings: { musicVolume: 0.45, sfxVolume: 0.85, muted: false },

      // ==========================================
      // CÁC HỆ THỐNG MỚI ĐƯỢC BỔ SUNG:
      // ==========================================
      stageBestRecords: {},       // { [stageId]: { rank, score, timeStr, timeSec, maxCombo, hits, hpPercent, dodges, counters, sideDone, date } }
      deductionsSolved: [],       // [deductionId] id các suy luận đúng đã giải quyết
      bossRecords: {},            // { [bossId]: { [modifier]: { cleared, rank, score, timeStr, date } } }
      tutorialCompleted: false,   // Đã hoàn thành tương tác hướng dẫn
      tutorialSkipped: false,     // Đã bỏ qua hướng dẫn
      trainingDrillsCompleted: [],// Các bài tập luyện võ đã hoàn thành
      trainingFreeUnlocked: false,// Đã mở khóa chế độ Luyện tự do
      equippedSkins: {},          // { [charId]: 'default' | 'vovinam' }
      customKeybindings: null,    // Tùy chỉnh phím điều khiển
      gold: 600,                  // Tiền tệ Vàng (🪙) dùng trong Cửa Hàng Gia Tộc
      diamonds: 25,               // Tiền tệ Kim Cương (💎) dùng trong Cửa Hàng Gia Tộc
      shopPurchases: []           // Danh sách vật phẩm / nhân vật đã mua trong Shop
    };
  }

  // -------------------------------------------------------------------------
  // KIỂM TRA DỮ LIỆU CŨ / HỎNG (để bản nâng cấp không làm crash phiên bản mới)
  // -------------------------------------------------------------------------
  sanitize(raw) {
    const def = this.createDefaults();
    if (!raw || typeof raw !== 'object') return def;
    const out = def;

    out.version = SAVE_VERSION;
    out.createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : def.createdAt;
    out.currentStage = this.clampInt(raw.currentStage, 1, 20, 1);
    out.selectedCharacter = typeof raw.selectedCharacter === 'string' ? raw.selectedCharacter : 'nghi';

    out.completedStages = this.cleanArray(raw.completedStages, 'number');
    out.unlockedCharacters = this.cleanArray(raw.unlockedCharacters, 'string');
    out.missionsDone = this.cleanArray(raw.missionsDone, 'string');
    out.endings = this.cleanArray(raw.endings, 'string');
    out.bossesDefeated = this.cleanArray(raw.bossesDefeated, 'string');
    out.achievements = this.cleanArray(raw.achievements, 'string');
    out.dialogueSeen = this.cleanArray(raw.dialogueSeen, 'string');

    // Nâng cấp mảng điều tra & tin nhiệm
    out.evidenceFound = this.cleanArray(raw.evidenceFound, 'string');
    out.evidenceDestroyed = this.cleanArray(raw.evidenceDestroyed, 'string');
    out.evidenceDecoded = this.cleanArray(raw.evidenceDecoded, 'string');
    out.flashbackChoices = this.cleanArray(raw.flashbackChoices, 'string');

    if (raw.evidenceCustody && typeof raw.evidenceCustody === 'object') {
      out.evidenceCustody = Object.assign({}, raw.evidenceCustody);
    }
    if (raw.characterTrust && typeof raw.characterTrust === 'object') {
      ['mocdang', 'dunghai', 'hoanganh', 'huavudai', 'giangmanh'].forEach((k) => {
        if (typeof raw.characterTrust[k] === 'number') {
          out.characterTrust[k] = this.clampInt(raw.characterTrust[k], 0, 100, def.characterTrust[k]);
        }
      });
    }
    if (raw.storyFlags && typeof raw.storyFlags === 'object') {
      out.storyFlags = Object.assign({}, raw.storyFlags);
    }
    if (raw.allyAvailability && typeof raw.allyAvailability === 'object') {
      out.allyAvailability = Object.assign({}, def.allyAvailability, raw.allyAvailability);
    } else {
      out.allyAvailability = Object.assign({}, def.allyAvailability);
    }

    if (!out.unlockedCharacters.includes('nghi')) out.unlockedCharacters.unshift('nghi');

    // Tự động khôi phục mở khóa nhân vật & đồng minh dựa trên màn đã hoàn thành hoặc boss đã hạ
    const addUnlock = (id) => {
      if (id && !out.unlockedCharacters.includes(id)) out.unlockedCharacters.push(id);
      if (id && out.allyAvailability) out.allyAvailability[id] = true;
    };
    if (out.completedStages.includes(20) || out.completedStages.includes(11) || out.bossesDefeated.includes('giangmanh') || out.achievements.includes('beat_giangmanh')) {
      addUnlock('giangmanh');
    }
    if (out.completedStages.includes(4) || out.completedStages.includes(5) || out.bossesDefeated.includes('longvuong') || out.bossesDefeated.includes('huavudai')) {
      addUnlock('huavudai');
    }
    if (out.completedStages.includes(9) || out.bossesDefeated.includes('bichlam')) {
      addUnlock('bichlam');
    }
    if (out.completedStages.includes(13) || out.bossesDefeated.includes('dunghai')) {
      addUnlock('dunghai');
    }
    if (out.completedStages.includes(15) || out.bossesDefeated.includes('hoanganh')) {
      addUnlock('hoanganh');
    }
    if (out.completedStages.includes(16) || out.bossesDefeated.includes('dinhan')) {
      addUnlock('dinhan');
    }

    // Đồng bộ 2 chiều giữa mở khóa nhân vật và mở khóa đồng minh (chỉ áp dụng cho 7 đồng minh chính thức)
    const ALLY_KEYS = ['hoanganh', 'dunghai', 'mocdang', 'bichlam', 'dinhan', 'huavudai', 'giangmanh'];
    out.unlockedCharacters.forEach((cId) => {
      if (cId && ALLY_KEYS.includes(cId) && out.allyAvailability) out.allyAvailability[cId] = true;
    });
    if (out.allyAvailability) {
      Object.keys(out.allyAvailability).forEach((k) => {
        if (!ALLY_KEYS.includes(k)) delete out.allyAvailability[k];
      });
    }
    Object.keys(out.allyAvailability).forEach((aId) => {
      if (out.allyAvailability[aId] && aId !== 'mocdang' && !out.unlockedCharacters.includes(aId)) {
        out.unlockedCharacters.push(aId);
      }
    });
    // Mộc Đăng là quân sư / đồng minh hỗ trợ gia tộc từ Màn 2 hoặc khi đã vượt Màn 1
    if ((out.completedStages && out.completedStages.length > 0) || out.currentStage >= 2) {
      out.allyAvailability.mocdang = true;
    }

    if (raw.choices && typeof raw.choices === 'object') {
      ['rescue', 'mountain', 'danghai'].forEach((k) => {
        if (typeof raw.choices[k] === 'string') out.choices[k] = raw.choices[k];
      });
    }

    if (raw.stats && typeof raw.stats === 'object') {
      out.stats.totalHits = this.clampInt(raw.stats.totalHits, 0, 1e9, 0);
      out.stats.bestCombo = this.clampInt(raw.stats.bestCombo, 0, 1e6, 0);
      out.stats.perfectDodges = this.clampInt(raw.stats.perfectDodges, 0, 1e9, 0);
      out.stats.stagesCleared = this.clampInt(raw.stats.stagesCleared, 0, 999, 0);
    }

    if (raw.settings && typeof raw.settings === 'object') {
      out.settings.musicVolume = this.clampNum(raw.settings.musicVolume, 0, 1, def.settings.musicVolume);
      out.settings.sfxVolume = this.clampNum(raw.settings.sfxVolume, 0, 1, def.settings.sfxVolume);
      out.settings.muted = !!raw.settings.muted;
    }

    // Nâng cấp dữ liệu hệ thống mới
    if (raw.stageBestRecords && typeof raw.stageBestRecords === 'object') {
      out.stageBestRecords = Object.assign({}, raw.stageBestRecords);
    }
    out.deductionsSolved = this.cleanArray(raw.deductionsSolved, 'string');
    if (raw.bossRecords && typeof raw.bossRecords === 'object') {
      out.bossRecords = Object.assign({}, raw.bossRecords);
    }
    out.tutorialCompleted = !!raw.tutorialCompleted;
    out.tutorialSkipped = !!raw.tutorialSkipped;
    out.trainingDrillsCompleted = this.cleanArray(raw.trainingDrillsCompleted, 'string');
    out.trainingFreeUnlocked = !!raw.trainingFreeUnlocked;
    if (raw.equippedSkins && typeof raw.equippedSkins === 'object') {
      out.equippedSkins = Object.assign({}, raw.equippedSkins);
      if (out.equippedSkins.nghi) out.equippedSkins.nghi = 'default';
    }
    out.selectedAlly = typeof raw.selectedAlly === 'string' ? raw.selectedAlly : 'auto';
    if (raw.customKeybindings && typeof raw.customKeybindings === 'object') {
      out.customKeybindings = Object.assign({}, raw.customKeybindings);
    }

    out.shopPurchases = this.cleanArray(raw.shopPurchases, 'string');
    out.shopPurchases.forEach((pId) => {
      if (pId && !pId.startsWith('skin_') && !['namcheo', 'thantrung', 'chodoinon', 'hoxam'].includes(pId) && !out.unlockedCharacters.includes(pId)) {
        out.unlockedCharacters.push(pId);
      }
    });

    if (typeof raw.gold === 'number' && isFinite(raw.gold)) {
      out.gold = this.clampInt(raw.gold, 0, 1e9, def.gold);
    } else {
      out.gold = def.gold + (out.completedStages.length * 450) + (out.bossesDefeated.length * 150);
    }
    if (typeof raw.diamonds === 'number' && isFinite(raw.diamonds)) {
      out.diamonds = this.clampInt(raw.diamonds, 0, 1e9, def.diamonds);
    } else {
      out.diamonds = def.diamonds + (out.completedStages.length * 20) + (out.bossesDefeated.length * 10);
    }

    return out;
  }

  cleanArray(v, type) {
    if (!Array.isArray(v)) return [];
    return v.filter((x) => (type === 'number' ? typeof x === 'number' : typeof x === 'string'));
  }

  clampNum(v, a, b, fb) {
    const n = Number(v);
    if (!isFinite(n)) return fb;
    return Math.max(a, Math.min(b, n));
  }

  clampInt(v, a, b, fb) {
    const n = parseInt(v, 10);
    if (!isFinite(n)) return fb;
    return Math.max(a, Math.min(b, n));
  }

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      this.data = this.sanitize(parsed);
    } catch (e) {
      console.warn('[Save] Dữ liệu lưu hỏng, khởi tạo lại:', e && e.message);
      this.data = this.createDefaults();
    }
  }

  persist(skipCloud = false) {
    try {
      this.data.version = SAVE_VERSION;
      localStorage.setItem(this.key, JSON.stringify(this.data));
      if (!skipCloud && typeof window !== 'undefined' && window.accountManager && typeof window.accountManager.scheduleCloudSync === 'function') {
        window.accountManager.scheduleCloudSync();
      }
    } catch (e) {
      console.warn('[Save] Không thể ghi localStorage:', e && e.message);
    }
  }

  // Xóa tiến trình nhưng GIỮ cài đặt âm thanh
  resetProgress() {
    const keepSettings = Object.assign({}, this.data.settings);
    this.data = this.createDefaults();
    this.data.settings = keepSettings;
    this.data.tutorialCompleted = false;
    this.data.tutorialSkipped = false;
    this.data.currentStage = 1;
    this.data.completedStages = [];
    this.persist();
  }

  // -------------------------------------------------------------------------
  // TRUY VẤN TIẾN TRÌNH
  // -------------------------------------------------------------------------
  isStageUnlocked(stageId) {
    const s = Number(stageId);
    if (!isFinite(s) || s <= 1) return true;
    // Đã hoàn thành màn này rồi -> luôn coi là mở khóa (tránh hiển thị "khóa + đã qua" mâu thuẫn)
    if (this.data.completedStages.includes(s)) return true;
    // Màn phụ (nhiệm vụ phụ) được mở khi hoàn thành màn cha
    const sideOf = (window.STORY_META && window.STORY_META.sideOf[s]) || null;
    if (sideOf && !this.data.completedStages.includes(sideOf)) return false;
    // Màn chính: hoàn thành màn trước đó
    const mainOf = (window.STORY_META && window.STORY_META.mainOrder[s]) || null;
    const prev = mainOf ? mainOf.prev : s - 1;
    if (prev === null || prev === undefined) return true;
    return this.data.completedStages.includes(prev);
  }

  completeStage(stageId) {
    const id = Number(stageId);
    if (!isFinite(id) || id < 1) return;
    if (!this.data.completedStages.includes(id)) {
      this.data.completedStages.push(id);
      this.data.stats.stagesCleared++;
    }
    const meta = window.STORY_META && window.STORY_META.stages && window.STORY_META.stages[id];
    const isSide = !!(window.STORY_META && window.STORY_META.sideOf && window.STORY_META.sideOf[id]) || id === 5;
    if (!isSide) {
      let nextMain = id;
      if (meta && meta.next) {
        nextMain = Math.min(20, meta.next);
      } else if (id === 4) {
        nextMain = 6;
      } else if (id < 20) {
        nextMain = id + 1;
      } else {
        nextMain = 20;
      }
      this.data.currentStage = Math.min(20, Math.max(this.data.currentStage || 1, nextMain));
    } else {
      this.data.currentStage = this.clampInt(this.data.currentStage, 1, 20, 1);
    }
    this.persist();
  }

  isMissionDone(id) {
    return this.data.missionsDone.includes(id);
  }

  completeMission(id) {
    if (!this.data.missionsDone.includes(id)) {
      this.data.missionsDone.push(id);
      this.persist();
    }
  }

  isCharacterUnlocked(id) {
    return this.data.unlockedCharacters.includes(id);
  }

  unlockCharacter(id) {
    if (!id) return false;
    let changed = false;
    if (!this.data.unlockedCharacters.includes(id)) {
      this.data.unlockedCharacters.push(id);
      changed = true;
    }
    // Mở khóa nhân vật đồng thời mở khóa đồng minh tương ứng (nếu thuộc nhóm 7 đồng minh)
    const ALLY_KEYS = ['hoanganh', 'dunghai', 'mocdang', 'bichlam', 'dinhan', 'huavudai', 'giangmanh'];
    if (!this.data.allyAvailability) this.data.allyAvailability = {};
    if (ALLY_KEYS.includes(id) && !this.data.allyAvailability[id]) {
      this.data.allyAvailability[id] = true;
      changed = true;
    }
    if (changed) this.persist();
    return true;
  }

  isAllyUnlocked(id) {
    if (!id || id === 'auto' || id === 'none') return true;
    if (id === 'mocdang') {
      return !!(this.data.allyAvailability && this.data.allyAvailability.mocdang) ||
             (this.data.completedStages && this.data.completedStages.length > 0) ||
             (this.data.currentStage >= 2);
    }
    const charUnlocked = this.isCharacterUnlocked(id);
    const allyUnlocked = !!(this.data.allyAvailability && this.data.allyAvailability[id]);
    return charUnlocked || allyUnlocked;
  }

  unlockAlly(id) {
    if (!id) return false;
    let changed = false;
    if (!this.data.allyAvailability) this.data.allyAvailability = {};
    if (!this.data.allyAvailability[id]) {
      this.data.allyAvailability[id] = true;
      changed = true;
    }
    // Mở khóa đồng minh đồng thời mở khóa nhân vật (nếu không phải chỉ là trợ thủ như Mộc Đăng)
    if (id !== 'mocdang' && !this.data.unlockedCharacters.includes(id)) {
      this.data.unlockedCharacters.push(id);
      changed = true;
    }
    if (changed) this.persist();
    return true;
  }

  recordChoice(key, value) {
    this.data.choices[key] = value;
    this.persist();
  }

  getChoice(key) {
    return this.data.choices[key] || null;
  }

  unlockEnding(id) {
    if (!id) return false;
    if (this.data.endings.includes(id)) return false;
    this.data.endings.push(id);
    this.persist();
    return true;
  }

  hasEnding(id) {
    return this.data.endings.includes(id);
  }

  defeatBoss(id) {
    if (!id) return false;
    if (this.data.bossesDefeated.includes(id)) return false;
    this.data.bossesDefeated.push(id);
    this.persist();
    return true;
  }

  unlockAchievement(id) {
    if (!id || this.data.achievements.includes(id)) return false;
    this.data.achievements.push(id);
    this.persist();

    // Tự động kích hoạt hiệu ứng thông báo Cúp Danh Dự và âm thanh khải hoàn
    const meta = window.STORY_META && window.STORY_META.achievements ? window.STORY_META.achievements.find(a => a.id === id) : null;
    if (meta && window.uiManager && typeof window.uiManager.showAchievementToast === 'function') {
      window.uiManager.showAchievementToast(meta.name, meta.desc);
    }
    return true;
  }

  hasAchievement(id) {
    return this.data.achievements.includes(id);
  }

  markDialogueSeen(id) {
    if (!id || this.data.dialogueSeen.includes(id)) return;
    this.data.dialogueSeen.push(id);
    this.persist();
  }

  hasSeenDialogue(id) {
    return this.data.dialogueSeen.includes(id);
  }

  addStats(patch) {
    if (!patch) return;
    if (patch.hits) this.data.stats.totalHits += patch.hits;
    if (patch.perfectDodges) this.data.stats.perfectDodges += patch.perfectDodges;
    if (patch.bestCombo && patch.bestCombo > this.data.stats.bestCombo) {
      this.data.stats.bestCombo = patch.bestCombo;
    }
    this.persist();
  }

  setSetting(k, v) {
    if (!(k in this.data.settings)) return;
    this.data.settings[k] = v;
    this.persist();
  }

  // =========================================================================
  // HELPER METHODS: HỆ THỐNG MỚI (XẾP HẠNG, SUY LUẬN, TÁI ĐẤU, TUTORIAL, LUYỆN VÕ)
  // =========================================================================
  recordStageBest(stageId, record) {
    if (!stageId || !record) return false;
    const sId = String(stageId);
    const prev = this.data.stageBestRecords[sId];
    const rankOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 };
    const prevRankVal = prev ? (rankOrder[prev.rank] || 0) : 0;
    const newRankVal = rankOrder[record.rank] || 0;

    if (!prev || newRankVal > prevRankVal || ((record.score || 0) > (prev.score || 0) && newRankVal >= prevRankVal)) {
      this.data.stageBestRecords[sId] = Object.assign({}, record, { date: Date.now() });
      this.persist();
      return true;
    }
    return false;
  }

  getStageBest(stageId) {
    return this.data.stageBestRecords[String(stageId)] || null;
  }

  solveDeduction(id, trustEffects = null, flag = null) {
    if (!id || this.data.deductionsSolved.includes(id)) return false;
    this.data.deductionsSolved.push(id);
    if (trustEffects && typeof trustEffects === 'object') {
      for (const [charKey, delta] of Object.entries(trustEffects)) {
        this.adjustTrust(charKey, delta);
      }
    }
    if (flag) {
      this.setStoryFlag(flag, true);
    }
    this.persist();
    return true;
  }

  isDeductionSolved(id) {
    return this.data.deductionsSolved.includes(id);
  }

  adjustTrust(charKey, delta) {
    if (!charKey || !this.data.characterTrust) return;
    if (this.data.characterTrust[charKey] === undefined) {
      this.data.characterTrust[charKey] = 50;
    }
    this.data.characterTrust[charKey] = Math.max(0, Math.min(100, this.data.characterTrust[charKey] + delta));
    this.persist();
  }

  setStoryFlag(flag, value = true) {
    if (!flag) return;
    if (!this.data.storyFlags) this.data.storyFlags = {};
    this.data.storyFlags[flag] = value;
    this.persist();
  }

  recordBossBest(bossId, modifier, record) {
    if (!bossId || !modifier || !record) return false;
    if (!this.data.bossRecords[bossId]) this.data.bossRecords[bossId] = {};
    const prev = this.data.bossRecords[bossId][modifier];
    if (!prev || (record.score || 0) > (prev.score || 0)) {
      this.data.bossRecords[bossId][modifier] = Object.assign({}, record, { date: Date.now() });
      this.persist();
      return true;
    }
    return false;
  }

  getBossBest(bossId, modifier) {
    return (this.data.bossRecords[bossId] && this.data.bossRecords[bossId][modifier]) || null;
  }

  completeTutorial() {
    this.data.tutorialCompleted = true;
    this.persist();
  }

  skipTutorial() {
    this.data.tutorialSkipped = true;
    this.persist();
  }

  isTutorialNeeded() {
    if (!this.data) return false;
    if (this.data.tutorialCompleted || this.data.tutorialSkipped) return false;
    if (this.data.completedStages && this.data.completedStages.length > 0) return false;
    return true;
  }

  recordTrainingDrill(drillId) {
    if (!drillId) return;
    if (!this.data.trainingDrillsCompleted.includes(drillId)) {
      this.data.trainingDrillsCompleted.push(drillId);
      this.persist();
    }
  }

  unlockTrainingFree() {
    this.data.trainingFreeUnlocked = true;
    this.persist();
  }

  getEquippedSkin(charId) {
    if (!charId) return 'default';
    if (!this.data || !this.data.equippedSkins) return 'default';
    const eq = this.data.equippedSkins[charId] || 'default';
    if (charId === 'nghi' && eq === 'vovinam') return 'default';
    return eq;
  }

  isSkinEquipped(charId, skinName) {
    return this.getEquippedSkin(charId) === skinName;
  }

  isSkinUnlocked(charId, skinName) {
    if (!skinName || skinName === 'default' || skinName === 'vovinam') return true;
    const reg = (typeof window !== 'undefined' && window.SkinRegistry) ? window.SkinRegistry : null;
    if (reg && typeof reg.getSkin === 'function') {
      const sk = reg.getSkin(charId, skinName);
      if (sk && sk.id === skinName && sk.shopSkin === false) return true;
    }
    const purchases = (this.data && Array.isArray(this.data.shopPurchases)) ? this.data.shopPurchases : [];
    const purchaseKey = `skin_${charId}_${skinName}`;
    return purchases.includes(purchaseKey) || purchases.includes(skinName);
  }

  setSkinEquipped(charId, skinName) {
    if (!this.data.equippedSkins) this.data.equippedSkins = {};
    const resolved = skinName || 'default';
    this.data.equippedSkins[charId] = (charId === 'nghi' && resolved === 'vovinam') ? 'default' : resolved;
    this.persist();
  }

  buyShopSkin(skinPurchaseId, charId, skinId, currency, price) {
    if (!skinPurchaseId || !charId || !skinId) return { ok: false, reason: 'invalid_id' };
    if (this.isSkinUnlocked(charId, skinId)) {
      return { ok: false, reason: 'already_unlocked' };
    }
    const cost = Math.max(0, Math.round(Number(price) || 0));
    const isDiamond = currency === 'diamond' || currency === 'diamonds';
    if (isDiamond) {
      if (!this.spendDiamonds(cost)) {
        return { ok: false, reason: 'insufficient_diamonds' };
      }
    } else {
      if (!this.spendGold(cost)) {
        return { ok: false, reason: 'insufficient_gold' };
      }
    }
    if (!Array.isArray(this.data.shopPurchases)) this.data.shopPurchases = [];
    if (!this.data.shopPurchases.includes(skinPurchaseId)) {
      this.data.shopPurchases.push(skinPurchaseId);
    }
    this.setSkinEquipped(charId, skinId);
    this.persist();
    return { ok: true, skinPurchaseId, charId, skinId, currency: isDiamond ? 'diamond' : 'gold', price: cost };
  }

  setSelectedAlly(allyId) {
    this.data.selectedAlly = allyId || 'auto';
    this.persist();
  }

  // =========================================================================
  // HỆ THỐNG TIỀN TỆ (VÀNG 🪙 & KIM CƯƠNG 💎) & CỬA HÀNG GIA TỘC
  // =========================================================================
  getGold() {
    return typeof this.data.gold === 'number' && isFinite(this.data.gold) ? this.data.gold : 0;
  }

  getDiamonds() {
    return typeof this.data.diamonds === 'number' && isFinite(this.data.diamonds) ? this.data.diamonds : 0;
  }

  addGold(amount) {
    const n = Math.max(0, Math.round(Number(amount) || 0));
    if (n <= 0) return this.getGold();
    this.data.gold = this.clampInt(this.getGold() + n, 0, 1e9, 0);
    this.persist();
    return this.data.gold;
  }

  addDiamonds(amount) {
    const n = Math.max(0, Math.round(Number(amount) || 0));
    if (n <= 0) return this.getDiamonds();
    this.data.diamonds = this.clampInt(this.getDiamonds() + n, 0, 1e9, 0);
    this.persist();
    return this.data.diamonds;
  }

  spendGold(amount) {
    const n = Math.max(0, Math.round(Number(amount) || 0));
    if (this.getGold() < n) return false;
    this.data.gold = this.getGold() - n;
    this.persist();
    return true;
  }

  spendDiamonds(amount) {
    const n = Math.max(0, Math.round(Number(amount) || 0));
    if (this.getDiamonds() < n) return false;
    this.data.diamonds = this.getDiamonds() - n;
    this.persist();
    return true;
  }

  buyShopCharacter(charId, currency, price) {
    if (!charId) return { ok: false, reason: 'invalid_id' };
    if (this.isCharacterUnlocked(charId)) {
      return { ok: false, reason: 'already_unlocked' };
    }
    const cost = Math.max(0, Math.round(Number(price) || 0));
    const isDiamond = currency === 'diamond' || currency === 'diamonds';
    if (isDiamond) {
      if (!this.spendDiamonds(cost)) {
        return { ok: false, reason: 'insufficient_diamonds' };
      }
    } else {
      if (!this.spendGold(cost)) {
        return { ok: false, reason: 'insufficient_gold' };
      }
    }
    if (!Array.isArray(this.data.shopPurchases)) this.data.shopPurchases = [];
    if (!this.data.shopPurchases.includes(charId)) {
      this.data.shopPurchases.push(charId);
    }
    this.unlockCharacter(charId);
    this.persist();
    return { ok: true, charId, currency: isDiamond ? 'diamond' : 'gold', price: cost };
  }
}

SaveManager.SAVE_VERSION = SAVE_VERSION;

const saveManager = new SaveManager();
window.saveManager = saveManager;
window.SaveManager = SaveManager;

