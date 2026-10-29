/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/menu.js - Entry point cua he thong menu.
 *
 * Thu tu load bat buoc:
 *   js/ui/menu/charSlots.js
 *   js/ui/menu/menuBase.js
 *   js/ui/menu/charSelect.js
 *   js/ui/menu/collections.js
 *   js/ui/menu/settings.js
 *   js/ui/menu/chronicles.js
 *   js/ui/menu.js  (file nay)
 */

class MenuManager extends window.MenuManagerChronicles {}

const menuManager = new MenuManager();
window.menuManager = menuManager;
window.MenuManager = MenuManager;
