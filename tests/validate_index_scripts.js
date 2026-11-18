const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const scriptRegex = /<script\s+src=["']([^"']+)["']\s*><\/script>/g;
let match;
const scripts = [];
while ((match = scriptRegex.exec(html)) !== null) {
  scripts.push(match[1].split('?')[0]);
}
console.log('Found scripts count in index.html:', scripts.length);

// Mock minimal browser globals
global.window = global;
global.window.addEventListener = () => {};
global.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: (id) => ({
    classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
    addEventListener: () => {},
    appendChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    style: {},
    getContext: () => ({
      fillRect: () => {}, clearRect: () => {}, createRadialGradient: () => ({ addColorStop: () => {} }),
      createLinearGradient: () => ({ addColorStop: () => {} }), save: () => {}, restore: () => {},
      beginPath: () => {}, arc: () => {}, ellipse: () => {}, fill: () => {}, stroke: () => {},
      moveTo: () => {}, lineTo: () => {}, closePath: () => {}, quadraticCurveTo: () => {}, bezierCurveTo: () => {},
      translate: () => {}, scale: () => {}
    })
  }),
  createElement: (tag) => ({
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    addEventListener: () => {},
    appendChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    style: {}
  }),
  addEventListener: () => {},
  querySelectorAll: () => []
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.requestAnimationFrame = () => {};

let errorCount = 0;
for (const s of scripts) {
  try {
    const fullPath = path.resolve(__dirname, '..', s);
    require(fullPath);
    console.log('✓ Loaded:', s);
  } catch (err) {
    console.error('✗ ERROR loading ' + s + ':', err);
    errorCount++;
  }
}
console.log('Load test completed. Errors:', errorCount);
process.exit(errorCount > 0 ? 1 : 0);
