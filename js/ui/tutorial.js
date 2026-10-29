/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/tutorial.js - Entry point cua tutorial tan thu.
 *
 * Thu tu load bat buoc:
 *   js/ui/tutorial/tutorialDummy.js
 *   js/ui/tutorial/tutorialManagerBase.js
 *   js/ui/tutorial/tutorialManagerOverlay.js
 *   js/ui/tutorial.js  (file nay)
 */

class TutorialManager extends window.TutorialManagerOverlay {}

const tutorialManager = new TutorialManager();
window.TutorialManager = TutorialManager;
window.tutorialManager = tutorialManager;
