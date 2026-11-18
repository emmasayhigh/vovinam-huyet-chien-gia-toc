/**
 * VOVINAM DEVELOPMENT HARNESS — REGRESSION TEST RUNNER
 * harness/run-tests.js
 *
 * Discovers and runs all test suites in tests/, aggregates results,
 * writes machine-readable reports, and enforces zero-regression tolerance.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { log, success, error, warn, header, ensureDir } = require('./lib/utils');

function runAllTests(options = {}) {
  const cwd = options.cwd || process.cwd();
  const testsDir = path.join(cwd, 'tests');

  if (!fs.existsSync(testsDir)) {
    return {
      pass: false,
      total: 0,
      passed: 0,
      failed: 0,
      suites: [],
      error: 'tests directory not found'
    };
  }

  const testFiles = fs.readdirSync(testsDir)
    .filter(file => file.endsWith('.js') && (file.startsWith('test_') || file.startsWith('validate_')))
    .sort();

  const suites = [];
  let allPass = true;
  const startTime = Date.now();

  for (const file of testFiles) {
    const fullPath = path.join(testsDir, file);
    const suiteStart = Date.now();

    const result = spawnSync('node', [fullPath], {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const duration = ((Date.now() - suiteStart) / 1000).toFixed(2);
    const pass = result.status === 0;

    if (!pass) {
      allPass = false;
    }

    suites.push({
      file,
      pass,
      status: pass ? 'PASSED' : 'FAILED',
      duration: `${duration}s`,
      exitCode: result.status,
      stdout: result.stdout ? result.stdout.slice(-1000) : '',
      stderr: result.stderr ? result.stderr.slice(-1000) : ''
    });
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const passedCount = suites.filter(s => s.pass).length;
  const failedCount = suites.filter(s => !s.pass).length;

  const summary = {
    pass: allPass,
    timestamp: new Date().toISOString(),
    totalDuration: `${totalDuration}s`,
    totalSuites: suites.length,
    passedSuites: passedCount,
    failedSuites: failedCount,
    suites
  };

  // Write machine-readable report
  const reportsDir = path.join(cwd, 'harness', 'reports');
  ensureDir(reportsDir);
  fs.writeFileSync(path.join(reportsDir, 'latest-test-run.json'), JSON.stringify(summary, null, 2), 'utf8');

  return summary;
}

if (require.main === module) {
  header('VOVINAM AUTOMATED REGRESSION TEST SUITE');

  const summary = runAllTests();

  for (const s of summary.suites) {
    if (s.pass) {
      success(`Suite: ${s.file.padEnd(42)} (${s.duration})`);
    } else {
      error(`Suite: ${s.file.padEnd(42)} (${s.duration}) — Exit Code: ${s.exitCode}`);
      if (s.stderr) {
        log(`    Stderr: ${s.stderr.trim()}`, 'red');
      }
    }
  }

  const line = '─'.repeat(64);
  console.log(`\n${line}`);
  log(`Total Suites: ${summary.totalSuites} | Passed: ${summary.passedSuites} | Failed: ${summary.failedSuites} | Time: ${summary.totalDuration}`, summary.pass ? 'green' : 'red');
  console.log(`${line}\n`);

  if (summary.pass) {
    success('ALL REGRESSION TEST SUITES PASSED WITH ZERO REGRESSIONS!');
    process.exit(0);
  } else {
    error('ONE OR MORE REGRESSION TEST SUITES FAILED!');
    process.exit(1);
  }
}

module.exports = {
  runAllTests
};
