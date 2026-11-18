/**
 * Test suite for Character Passives UI & Combat Tenacity / Boss Anti-Stunlock
 */
const assert = require('assert');
const fs = require('fs');

// Mock browser environment
global.window = global;
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.performance = { now: () => Date.now() };
global.document = {
  getElementById: (id) => {
    return {
      id,
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        toggle(c, v) { if (v !== undefined) { v ? this._classes.add(c) : this._classes.delete(c); } else { this._classes.has(c) ? this._classes.delete(c) : this._classes.add(c); } },
        contains(c) { return this._classes.has(c); }
      },
      style: {},
      innerHTML: '',
      textContent: '',
      appendChild() {},
      addEventListener() {}
    };
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (tag) => ({
    tagName: tag,
    className: '',
    style: {},
    innerHTML: '',
    textContent: '',
    classList: {
      add() {}, remove() {}, toggle() {}, contains() { return false; }
    },
    appendChild() {},
    addEventListener() {}
  })
};

// Load charSlots
require('../js/ui/menu/charSlots.js');
const slots = window.CHAR_SLOTS;

console.log('=== TEST 1: PASSIVES DATA IN CHAR_SLOTS ===');
assert(Array.isArray(slots) && slots.length >= 7, 'CHAR_SLOTS has all character slots');
const playableIds = ['nghi', 'bichlam', 'huavudai', 'dinhan', 'hoanganh', 'dunghai', 'giangmanh'];
playableIds.forEach(id => {
  const s = slots.find(item => item.id === id);
  assert(s, `Slot for ${id} exists`);
  assert(Array.isArray(s.passives) && s.passives.length === 4, `${id} has exactly 4 passives`);
  s.passives.forEach((p, idx) => {
    assert(p.icon && p.name && p.type && p.desc, `${id} passive ${idx + 1} has complete metadata (icon, name, type, desc)`);
  });
  console.log(`✓ ${id.toUpperCase()}: 4 passives verified (${s.passives.map(p => p.name).join(' | ')})`);
});

console.log('\n=== TEST 2: INPUT MANAGER HOLD U + TAP J/K ===');
require('../js/core/input.js');
const input = new InputManager();

// Simulate holding U for 600ms, then pressing J
input.keys['KeyU'] = true;
input.lastKeyDownTime['KeyU'] = 1000;
input.justPressed['KeyU'] = false;

// Tap J at 1600ms
input.keys['KeyJ'] = true;
input.lastKeyDownTime['KeyJ'] = 1600;
input.justPressed['KeyJ'] = true;
input._counterHandHandled = false;

assert(input.consumeCounterHand() === true, 'Hold U + tap J triggers Hand Counter successfully');
console.log('✓ Hold U + tap J counter confirmed');

// Test U + K
input.keys['KeyU'] = true;
input.justPressed['KeyU'] = false;
input.keys['KeyK'] = true;
input.justPressed['KeyK'] = true;
input._counterLegHandled = false;
assert(input.consumeCounterLeg() === true, 'Hold U + tap K triggers Leg Counter successfully');
console.log('✓ Hold U + tap K counter confirmed');

console.log('\n=== ALL NEW SPEC TESTS PASSED! ===');
