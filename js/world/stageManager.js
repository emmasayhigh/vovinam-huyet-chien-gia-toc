/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/world/stageManager.js - Quan ly man hien tai va hang doi hoi thoai.
 *
 * Du lieu man choi nam o js/data/stages.js. Phan ve parallax nam o
 * js/world/stageRenderer.js.
 */

class StageManagerBase {
  constructor() {
    this.currentStageIndex = 1;
    this.stageWidth = 2600; // Chieu dai san khau cuon ngang
    this.dialogueQueue = [];
    this.currentDialogue = null;
    this.dialogueCallback = null;

    this.stages = window.STAGE_DEFINITIONS;
  }

  getCurrentStage() {
    return this.stages[this.currentStageIndex];
  }

  setStage(stageNum) {
    if (this.stages[stageNum]) {
      this.currentStageIndex = stageNum;
    }
  }

  // ==========================================================================
  // HỆ THỐNG HỘI THOẠI ĐIỆN ẢNH (CINEMATIC DIALOGUE QUEUE)
  // ==========================================================================
  playDialogueSequence(dialogueList, onComplete) {
    this.dialogueQueue = [...dialogueList];
    this.dialogueCallback = onComplete;
    this.showNextDialogue();
  }

  showNextDialogue() {
    if (this.dialogueQueue.length === 0) {
      if (window.uiManager) window.uiManager.hideDialogue();
      if (this.dialogueCallback) {
        const cb = this.dialogueCallback;
        this.dialogueCallback = null;
        cb();
      }
      return;
    }

    const item = this.dialogueQueue.shift();
    this.currentDialogue = item;
    if (window.uiManager) {
      window.uiManager.showDialogue(item.speaker, item.text, item.avatar);
    }
    if (window.audioManager) {
      window.audioManager.playClick();
    }
  }

  advanceDialogue() {
    this.showNextDialogue();
  }

  skipDialogue() {
    this.dialogueQueue = [];
    if (window.uiManager) window.uiManager.hideDialogue();
    if (this.dialogueCallback) {
      const cb = this.dialogueCallback;
      this.dialogueCallback = null;
      cb();
    }
  }
}

window.StageManagerBase = StageManagerBase;
