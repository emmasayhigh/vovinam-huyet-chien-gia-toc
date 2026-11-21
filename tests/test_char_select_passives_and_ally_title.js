/**
 * Unit test for Character Select Passives subtabs and Ally Auto Card Title
 */
const fs = require('fs');
const assert = require('assert');

// 1. Verify index.html structure
const html = fs.readFileSync('index.html', 'utf8');

assert(html.includes('id="btn-cs-subtab-skills"'), 'index.html must have #btn-cs-subtab-skills');
assert(html.includes('id="btn-cs-subtab-passives"'), 'index.html must have #btn-cs-subtab-passives');
assert(html.includes('id="btn-cs-skills-toggle"'), 'index.html must have #btn-cs-skills-toggle');
assert(html.includes('id="cs-passives-list"'), 'index.html must have #cs-passives-list');
assert(html.includes('id="cs-skills-badges"'), 'index.html must have #cs-skills-badges');
console.log('✓ index.html contains all passives subtab and toggle elements');

// 2. Setup mock environment to load character modules and charSlots.js
global.window = global;
require('../js/entities/characters/characterRegistry.js');
require('../js/entities/characters/nghi.js');
require('../js/entities/characters/bichlam.js');
require('../js/entities/characters/huavudai.js');
require('../js/entities/characters/dinhan.js');
require('../js/entities/characters/hoanganh.js');
require('../js/entities/characters/dunghai.js');
require('../js/entities/characters/giangmanh.js');
require('../js/entities/characters/vananh.js');
require('../js/entities/characters/tiendang.js');
require('../js/entities/characters/thienkhanh.js');
require('../js/ui/menu/charSlots.js');

assert(Array.isArray(global.CHAR_SLOTS), 'CHAR_SLOTS should be an array');
assert(global.CHAR_SLOTS.length >= 10, 'CHAR_SLOTS should have at least 10 playable characters');

for (const slot of global.CHAR_SLOTS) {
  if (slot.id === 'coming_soon') continue;
  assert(Array.isArray(slot.passives), `Character ${slot.id} must have passives array`);
  assert.strictEqual(slot.passives.length, 4, `Character ${slot.id} must have exactly 4 passives`);
  for (const p of slot.passives) {
    assert(p.name, `Passive for ${slot.id} must have name`);
    assert(p.icon, `Passive for ${slot.id} must have icon`);
    assert(p.desc, `Passive for ${slot.id} must have desc`);
  }
  assert(Array.isArray(slot.skills), `Character ${slot.id} must have skills array`);
  const wuSkill = slot.skills.find((s) => s && typeof s.key === 'string' && s.key.replace(/\s+/g, '') === 'W+U');
  assert(wuSkill && wuSkill.name && wuSkill.desc, `Character ${slot.id} must describe its W+U skill in slot.skills`);
}
console.log('✓ All playable characters have 4 valid passives and W+U skill description');

// 3. Verify charSelectDeployment.js auto card title uses ally-auto-title
const deployJs = fs.readFileSync('js/ui/menu/charselect/charSelectDeployment.js', 'utf8');
assert(deployJs.includes('class="cs-card-name ally-auto-title"'), 'Auto card banner should use ally-auto-title');
assert(!deployJs.includes('class="cs-card-name ally-dock-name">TỰ ĐỘNG THEO TRUYỆN'), 'Auto card banner should not use ally-dock-name');
console.log('✓ Auto card banner uses ally-auto-title without dock ellipsis overlap');

// 4. Verify ally-select.css has ally-auto-title rule
const menuCss = fs.readFileSync('css/ally-select.css', 'utf8');
assert(menuCss.includes('.ally-auto-title'), 'ally-select.css should have styling for .ally-auto-title');
console.log('✓ ally-select.css has ally-auto-title rules');

console.log('\nAll tests passed in test_char_select_passives_and_ally_title.js!');
