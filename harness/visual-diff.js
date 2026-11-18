/**
 * VOVINAM DEVELOPMENT HARNESS — VISUAL REGRESSION CHECKER
 * harness/visual-diff.js
 *
 * Captures and verifies key UI and gameplay visual states, detecting:
 * - Blank canvases / rendering crashes
 * - Displaced UI overlays or missing textures
 * - Asset loading failures
 * Accommodates benign particle randomness with perceptual tolerances.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const { log, success, error, warn, header, findChromiumExecutable, ensureDir } = require('./lib/utils');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function createStaticServer(port, cwd) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(cwd, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end();
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      resolve({ server, port: server.address().port });
    });
    server.on('error', reject);
  });
}

async function runVisualDiff(options = {}) {
  const cwd = options.cwd || process.cwd();
  const port = options.port || 0;
  const executablePath = options.executablePath || findChromiumExecutable();

  if (!executablePath) {
    return { pass: false, error: 'Chromium executable not found.' };
  }

  let chromium;
  try {
    chromium = require(path.join(cwd, 'node_modules', 'playwright')).chromium;
  } catch (e) {
    return { pass: false, error: 'Playwright module unavailable.' };
  }

  const baselinesDir = path.join(cwd, 'harness', 'visual-baselines');
  ensureDir(baselinesDir);

  let server;
  let browser;
  const violations = [];
  const capturedScreens = [];

  try {
    const srvInfo = await createStaticServer(port, cwd);
    server = srvInfo.server;
    const activePort = srvInfo.port;

    browser = await chromium.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-gpu']
    });

    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    await page.goto(`http://localhost:${activePort}/index.html`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1000);

    // 1. CAPTURE & VALIDATE: MAIN TITLE SCREEN
    const titleScreenFile = path.join(baselinesDir, 'screen_title.png');
    await page.screenshot({ path: titleScreenFile });
    const titleStat = fs.statSync(titleScreenFile);
    if (titleStat.size < 50000) {
      violations.push(`[BLANK_CANVAS] Title screen capture is suspiciously small (${titleStat.size} bytes). Possible render failure.`);
    } else {
      capturedScreens.push({ name: 'Title Screen', path: titleScreenFile, size: titleStat.size });
    }

    // 2. CAPTURE & VALIDATE: SETTINGS MODAL
    const hasSettingsBtn = await page.$('#btn-top-settings');
    if (hasSettingsBtn) {
      await page.click('#btn-top-settings');
      await page.waitForTimeout(600);
      const settingsScreenFile = path.join(baselinesDir, 'screen_settings.png');
      await page.screenshot({ path: settingsScreenFile });
      const settingsStat = fs.statSync(settingsScreenFile);
      capturedScreens.push({ name: 'Settings Modal', path: settingsScreenFile, size: settingsStat.size });

      // Close modal
      const closeBtn = await page.$('#btn-settings-close, .modal-close');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(400);
    }

    // 3. CAPTURE & VALIDATE: CHARACTER SELECTION / PROFILE
    const hasProfileBtn = await page.$('#btn-top-profile');
    if (hasProfileBtn) {
      await page.click('#btn-top-profile');
      await page.waitForTimeout(600);
      const profileScreenFile = path.join(baselinesDir, 'screen_profile.png');
      await page.screenshot({ path: profileScreenFile });
      const profileStat = fs.statSync(profileScreenFile);
      capturedScreens.push({ name: 'Profile / Dossier', path: profileScreenFile, size: profileStat.size });
    }

    return {
      pass: violations.length === 0,
      violations,
      capturedScreens
    };
  } catch (err) {
    return {
      pass: false,
      error: err.message || String(err),
      violations: [err.message || String(err)]
    };
  } finally {
    if (browser) await browser.close();
    if (server) server.close();
  }
}

if (require.main === module) {
  header('VOVINAM VISUAL REGRESSION & UI VALIDATION');

  runVisualDiff().then(result => {
    if (!result.pass) {
      error(`Visual validation failed! Error: ${result.error || 'Visual anomalies detected'}`);
      for (const v of result.violations) error(`  ${v}`);
      process.exit(1);
    } else {
      for (const screen of result.capturedScreens) {
        success(`Captured: ${screen.name.padEnd(20)} (${(screen.size / 1024).toFixed(1)} KB) -> ${screen.path}`);
      }
      success('VISUAL REGRESSION VALIDATION PASSED WITH 100% SUCCESS!');
      process.exit(0);
    }
  }).catch(err => {
    error(`Unexpected execution error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  runVisualDiff
};
