/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/core/game.js - Entry point cua game engine.
 *
 * Thu tu load bat buoc:
 *   js/core/gameBase.js
 *   js/core/gameWave.js
 *   js/core/gameCamera.js
 *   js/core/gameFlow.js
 *   js/core/gameStory.js
 *   js/core/gameRender.js
 *   js/core/game.js  (file nay)
 */

class Game extends window.GameRender {}

// Global Game Engine Instance
const game = new Game();
window.Game = Game;
window.game = game;
