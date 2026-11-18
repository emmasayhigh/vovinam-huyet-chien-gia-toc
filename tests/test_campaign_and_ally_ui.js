/**
 * Test Suite: Campaign Hub 5-Pillar Redesign & Ally Select Card Polish
 * Verifies:
 * 1. #campaign-modal uses the 5 Vertical Illustrated Poster Pillars layout (.vov-campaign-screen, .vov-poster-card)
 * 2. All 5 pillars and their action buttons exist and wire to the right MenuManager / BossRushManager actions
 * 3. #ally-select-modal CSS fixes the vertical black bar bug (bottom: auto !important on .ally-dock-role)
 * 4. ALLIES_LIST uses clean martial emblems and preserves all required DOM classes/attributes
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
    if (condition) {
        passed++;
    } else {
        failed++;
        console.error('  ✗ FAIL:', msg);
    }
}

console.log('=== Running Campaign Hub 5-Pillar & Ally Select Polish Tests ===');

const rootDir = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const menuCss = [
    fs.readFileSync(path.join(rootDir, 'css/menu.css'), 'utf8'),
    fs.readFileSync(path.join(rootDir, 'css/ally-select.css'), 'utf8'),
    fs.readFileSync(path.join(rootDir, 'css/campaign-hub.css'), 'utf8')
].join('\n');
const menuBaseJs = fs.readFileSync(path.join(rootDir, 'js/ui/menu/menuBase.js'), 'utf8');
const charSelectDeployJs = fs.readFileSync(path.join(rootDir, 'js/ui/menu/charselect/charSelectDeployment.js'), 'utf8');

// 1. Verify index.html Campaign Hub 5-Pillar Structure
assert(indexHtml.includes('id="campaign-modal"') && indexHtml.includes('vov-campaign-screen'), 'index.html has #campaign-modal.vov-campaign-screen');
assert(indexHtml.includes('id="btn-campaign-close"') && indexHtml.includes('vov-back-plaque'), 'index.html has #btn-campaign-close with .vov-back-plaque');

const expectedPillars = [
    { cardId: 'card-campaign-continue', btnId: 'btn-campaign-continue', title: 'CỐT TRUYỆN' },
    { cardId: 'card-campaign-chapters', btnId: 'btn-campaign-chapters', title: 'CHƯƠNG HỒI' },
    { cardId: 'card-campaign-bossrush', btnId: 'btn-campaign-bossrush', title: 'LIÊN ĐẤU TRÙM' },
    { cardId: 'card-campaign-chronicles', btnId: 'btn-campaign-chronicles', title: 'BIÊN NIÊN SỬ' },
    { cardId: 'card-campaign-newgame', btnId: 'btn-campaign-newgame', title: 'HÀNH TRÌNH MỚI' }
];

for (const pillar of expectedPillars) {
    assert(indexHtml.includes(`id="${pillar.cardId}"`), `Campaign pillar card #${pillar.cardId} exists in index.html`);
    assert(indexHtml.includes(`id="${pillar.btnId}"`), `Campaign pillar button #${pillar.btnId} exists in index.html`);
    assert(indexHtml.includes(pillar.title), `Campaign pillar title "${pillar.title}" exists in index.html`);
}

// Verify dynamic stage progress IDs are preserved
assert(indexHtml.includes('id="campaign-cur-stage-name"'), '#campaign-cur-stage-name is preserved for dynamic campaign stage title');
assert(indexHtml.includes('id="campaign-cur-stage-desc"'), '#campaign-cur-stage-desc is preserved for dynamic campaign stage description');

// Verify special visual badges inspired by classic 5-pillar mode selection
assert(indexHtml.includes('vov-pennant-banner'), 'Pillar 1 has pennant banner (.vov-pennant-banner)');
assert(indexHtml.includes('vov-notif-badge'), 'Pillar 2 has corner notification badge (.vov-notif-badge)');
assert(indexHtml.includes('vov-fire-headline'), 'Pillar 3 has fiery headline (.vov-fire-headline)');
assert(indexHtml.includes('vov-poster-plate'), 'Pillars have Royal Vovinam Blue bottom title plates (.vov-poster-plate)');

// 2. Verify menuBase.js wires all 5 pillars
assert(menuBaseJs.includes("on('btn-campaign-bossrush'"), 'menuBase.js binds #btn-campaign-bossrush');
assert(menuBaseJs.includes("on('card-campaign-bossrush'"), 'menuBase.js binds #card-campaign-bossrush');
assert(menuBaseJs.includes("on('btn-campaign-chronicles'"), 'menuBase.js binds #btn-campaign-chronicles');
assert(menuBaseJs.includes("on('card-campaign-chronicles'"), 'menuBase.js binds #card-campaign-chronicles');

// 3. Verify css/menu.css styles for .vov-campaign-screen & #ally-select-modal bug fixes
assert(menuCss.includes('#campaign-modal.vov-campaign-screen'), 'css/menu.css defines #campaign-modal.vov-campaign-screen');
assert(menuCss.includes('.vov-posters-row'), 'css/menu.css defines .vov-posters-row');
assert(menuCss.includes('.vov-poster-card'), 'css/menu.css defines .vov-poster-card');
assert(menuCss.includes('.vov-poster-plate'), 'css/menu.css defines .vov-poster-plate');
assert(menuCss.includes('.vov-back-plaque'), 'css/menu.css defines .vov-back-plaque');

// Check that the black vertical bar bug in #ally-select-modal is fixed
const allyRoleMatch = menuCss.match(/#ally-select-modal\s+\.ally-cs-grid\s+\.cs-card-element\.ally-dock-role:not\(\.ally-auto-tag\)\s*\{([\s\S]*?)\}/);
assert(allyRoleMatch !== null, 'css/menu.css defines #ally-select-modal .ally-cs-grid .cs-card-element.ally-dock-role:not(.ally-auto-tag)');
if (allyRoleMatch) {
    assert(allyRoleMatch[1].includes('bottom: auto !important'), '.ally-dock-role resets bottom: auto !important to prevent vertical black bar stretching');
    assert(allyRoleMatch[1].includes('border-radius: 50%'), '.ally-dock-role uses circular emblem badge styling');
}

// Check that .cs-card-busy-badge is positioned cleanly at top-left instead of covering the face at top: 46%
const busyBadgeMatch = menuCss.match(/#ally-select-modal\s+\.cs-card-busy-badge\s*\{([\s\S]*?)\}/);
assert(busyBadgeMatch !== null, 'css/menu.css defines #ally-select-modal .cs-card-busy-badge');
if (busyBadgeMatch) {
    assert(busyBadgeMatch[1].includes('top: 5px'), '.cs-card-busy-badge is positioned at top: 5px so it does not cover the portrait face');
}

// 4. Verify charSelectDeployment.js uses clean martial emblems
assert(!charSelectDeployJs.includes("icon: '💼'"), 'charSelectDeployment.js removed tacky briefcase emoji');
assert(!charSelectDeployJs.includes("icon: '💻'"), 'charSelectDeployment.js removed tacky laptop emoji');
assert(charSelectDeployJs.includes("icon: '⚜'") && charSelectDeployJs.includes("icon: '⚡'"), 'charSelectDeployment.js uses clean martial emblems');

// 5. Verify dedicated 9:16 scenic backgrounds on Pillars 3, 4, 5
assert(indexHtml.includes("assets/images/cards/card_bossrush_arena.jpg"), 'Pillar 3 uses card_bossrush_arena.jpg');
assert(indexHtml.includes("assets/images/cards/card_chronicles_archive.jpg"), 'Pillar 4 uses card_chronicles_archive.jpg');
assert(indexHtml.includes("assets/images/cards/card_newgame_dawn.jpg"), 'Pillar 5 uses card_newgame_dawn.jpg');
assert(fs.existsSync(path.join(rootDir, 'assets/images/cards/card_bossrush_arena.jpg')), 'card_bossrush_arena.jpg exists on disk');
assert(fs.existsSync(path.join(rootDir, 'assets/images/cards/card_chronicles_archive.jpg')), 'card_chronicles_archive.jpg exists on disk');
assert(fs.existsSync(path.join(rootDir, 'assets/images/cards/card_newgame_dawn.jpg')), 'card_newgame_dawn.jpg exists on disk');

// 6. Verify flexible back-navigation to Campaign Hub (#campaign-modal)
const chroniclesJs = fs.readFileSync(path.join(rootDir, 'js/ui/menu/chronicles.js'), 'utf8');
const bossRushJs = fs.readFileSync(path.join(rootDir, 'js/features/bossRush.js'), 'utf8');
assert(menuBaseJs.includes('closeChapterMap()'), 'menuBase.js implements closeChapterMap() for returning to Campaign Hub');
assert(chroniclesJs.includes('_chroniclesFromCampaignHub') && chroniclesJs.includes('showCampaignHub()'), 'chronicles.js returns to Campaign Hub when opened from Campaign Hub');
assert(bossRushJs.includes('_returnToCampaignHub') && bossRushJs.includes('showCampaignHub()'), 'bossRush.js returns to Campaign Hub when opened from Campaign Hub');

// 7. Verify NaN% Energy HUD protection in playerBase.js & ui.js
const playerBaseJs = fs.readFileSync(path.join(rootDir, 'js/entities/player/playerBase.js'), 'utf8');
const uiJs = fs.readFileSync(path.join(rootDir, 'js/ui/ui.js'), 'utf8');
assert(playerBaseJs.includes('Number.isFinite(amount)') && playerBaseJs.includes('Number.isFinite(this.energy)'), 'playerBase.js guards addEnergy and consumeEnergy against NaN');
assert(uiJs.includes('Number.isFinite(currentEnergy)') && uiJs.includes('Number.isFinite(maxEnergy)'), 'ui.js guards updatePlayerEnergy against NaN and division by zero');

// 8. Verify Stage Clear "VỀ MENU" button (#btn-victory-menu) and Character Skills/Passives Runtime
const mainJs = fs.readFileSync(path.join(rootDir, 'js/core/main.js'), 'utf8');
const baseEnemyJs = fs.readFileSync(path.join(rootDir, 'js/entities/enemy/baseEnemy.js'), 'utf8');
const combatJs = fs.readFileSync(path.join(rootDir, 'js/combat/combat.js'), 'utf8');
const collectionsJs = fs.readFileSync(path.join(rootDir, 'js/ui/menu/collections.js'), 'utf8');
assert(indexHtml.includes('id="btn-victory-menu"') && indexHtml.includes('VỀ MENU'), 'index.html has #btn-victory-menu in #stage-clear-modal');
assert(mainJs.includes("getElementById('btn-victory-menu')") && mainJs.includes('returnToMenu()'), 'main.js wires #btn-victory-menu to returnToMenu()');
assert(baseEnemyJs.includes('this.slowTimer') && baseEnemyJs.includes('this.frozenTimer') && baseEnemyJs.includes('this.blindTimer'), 'baseEnemy.js ticks and applies slowTimer, frozenTimer, and blindTimer');
assert(combatJs.includes('window.CharacterRegistry.onGuardReflect(defender, attacker, riposteDmg)'), 'combat.js triggers onGuardReflect on mechRiposte block');

// 9. Verify separation between Player Profile (#player-profile-modal) and Character Dossier (#dossier-modal)
assert(indexHtml.includes('id="player-profile-modal"'), 'index.html has dedicated #player-profile-modal');
assert(indexHtml.includes('id="dossier-modal"'), 'index.html preserves #dossier-modal for character lore');
assert(indexHtml.includes('id="btn-top-dossier"'), 'index.html has dedicated #btn-top-dossier button on top bar');
assert(indexHtml.includes('id="btn-cs-open-dossier"'), 'index.html has #btn-cs-open-dossier button inside #char-select-modal');
assert(collectionsJs.includes('showPlayerProfile()') && collectionsJs.includes('showDossier()'), 'collections.js implements separate showPlayerProfile() and showDossier() methods');
assert(menuBaseJs.includes('computePlayerProfileProgress()'), 'menuBase.js dynamically computes player level, EXP, and rank title from SaveManager');
assert(mainJs.includes("bind('btn-top-profile', () => { if (menu()) menu().showPlayerProfile(); })"), 'main.js binds #btn-top-profile to showPlayerProfile()');
assert(mainJs.includes("bind('menu-player-bar', () => { if (menu()) menu().showPlayerProfile(); })"), 'main.js binds #menu-player-bar to showPlayerProfile()');
assert(mainJs.includes("bind('btn-top-dossier', () => { if (menu()) menu().showDossier(); })"), 'main.js binds #btn-top-dossier to showDossier()');

// 10. Verify Dual-Currency (Gold & Diamonds) + Shop Modal (#shop-modal) + 2 Canonical RTF Characters (Phó Văn Anh & Phó Tiến Đăng)
const saveJs = fs.readFileSync(path.join(rootDir, 'js/core/save.js'), 'utf8');
const vanAnhJs = fs.readFileSync(path.join(rootDir, 'js/entities/characters/vananh.js'), 'utf8');
const tienDangJs = fs.readFileSync(path.join(rootDir, 'js/entities/characters/tiendang.js'), 'utf8');
assert(indexHtml.includes('id="shop-modal"'), 'index.html has #shop-modal for Cửa Hàng Gia Tộc');
assert(indexHtml.includes('id="top-gold-pill"') && indexHtml.includes('id="top-diamond-pill"'), 'index.html has #top-gold-pill and #top-diamond-pill on Top Bar');
assert(indexHtml.includes('id="btn-top-shop"') && indexHtml.includes('id="btn-quick-shop"'), 'index.html has #btn-top-shop and #btn-quick-shop buttons');
assert(saveJs.includes('buyShopCharacter(charId, currency, price)') && saveJs.includes('getGold()') && saveJs.includes('getDiamonds()'), 'save.js implements getGold(), getDiamonds(), and buyShopCharacter()');
assert(vanAnhJs.includes("id: 'vananh'") && vanAnhJs.includes('Phó Văn Anh') && vanAnhJs.includes('ANH HAI — HẬU PHƯƠNG THÉP') && vanAnhJs.includes("shopCurrency: 'gold'"), 'vananh.js defines Phó Văn Anh (Anh Hai — Hậu Phương Thép) purchasable with Gold');
assert(tienDangJs.includes("id: 'tiendang'") && tienDangJs.includes('Phó Tiến Đăng') && tienDangJs.includes('ANH BA — TIÊN PHONG TÁC CHIẾN') && tienDangJs.includes("shopCurrency: 'gold'"), 'tiendang.js defines Phó Tiến Đăng (Anh Ba — Tiên Phong Tác Chiến) purchasable with Gold');
assert(collectionsJs.includes('showShop(') && collectionsJs.includes('purchaseShopCharacter(') && indexHtml.includes('id="shop-tabs-bar"'), 'collections.js & index.html implement separated Character (Gold) and Skin (Diamond) shop tabs');

console.log(`=== Campaign Hub & Ally UI Tests Complete: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
    process.exit(1);
}
