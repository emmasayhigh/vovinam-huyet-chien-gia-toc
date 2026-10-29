/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/world/stages.js - Entry point cua he thong man choi.
 *
 * Thu tu load bat buoc:
 *   js/data/stages.js
 *   js/world/stageManager.js
 *   js/world/stageRenderer.js
 *   js/world/stages.js  (file nay)
 */

class StageManager extends window.StageManagerRenderer {}

// Global Stage Manager
const stageManager = new StageManager();
window.stageManager = stageManager;
window.StageManager = StageManager;
