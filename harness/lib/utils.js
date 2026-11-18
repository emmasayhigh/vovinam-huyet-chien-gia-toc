/**
 * VOVINAM DEVELOPMENT HARNESS — UTILITIES
 * harness/lib/utils.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(msg, color = 'reset') {
  console.log(`${COLORS[color] || ''}${msg}${COLORS.reset}`);
}

function success(msg) {
  console.log(`${COLORS.green}✓ [PASS] ${msg}${COLORS.reset}`);
}

function warn(msg) {
  console.log(`${COLORS.yellow}⚠ [WARN] ${msg}${COLORS.reset}`);
}

function error(msg) {
  console.error(`${COLORS.red}✗ [FAIL] ${msg}${COLORS.reset}`);
}

function header(title) {
  const line = '═'.repeat(64);
  console.log(`\n${COLORS.cyan}${line}`);
  console.log(`   ${title}`);
  console.log(`${line}${COLORS.reset}\n`);
}

/**
 * Finds Chromium executable on current machine.
 */
function findChromiumExecutable() {
  const possiblePaths = [
    'C:\\Users\\ASUS\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe',
    'C:\\Users\\ASUS\\AppData\\Local\\ms-playwright\\chromium-1208\\chrome-win64\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Scan ms-playwright directory if exists
  const msPlaywrightDir = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (fs.existsSync(msPlaywrightDir)) {
    const entries = fs.readdirSync(msPlaywrightDir);
    for (const entry of entries) {
      if (entry.startsWith('chromium-')) {
        const candidate = path.join(msPlaywrightDir, entry, 'chrome-win64', 'chrome.exe');
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }

  return null;
}

/**
 * Safely runs a Git command and returns output.
 */
function git(args, cwd = process.cwd()) {
  try {
    return execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    return null;
  }
}

/**
 * Ensures directory exists.
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

module.exports = {
  COLORS,
  log,
  success,
  warn,
  error,
  header,
  findChromiumExecutable,
  git,
  ensureDir
};
