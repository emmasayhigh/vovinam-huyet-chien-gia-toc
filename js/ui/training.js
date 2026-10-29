/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/training.js - Entry point cua Vo Duong.
 *
 * Thu tu load bat buoc:
 *   js/data/training.js
 *   js/ui/training/trainingDummy.js
 *   js/ui/training/trainingManagerBase.js
 *   js/ui/training/trainingModes.js
 *   js/ui/training/trainingManagerOverlay.js
 *   js/ui/training.js  (file nay)
 */

class TrainingManager extends window.TrainingManagerOverlay {}

const trainingManager = new TrainingManager();
window.TrainingManager = TrainingManager;
window.trainingManager = trainingManager;
