/**
 * VOVINAM DEVELOPMENT HARNESS — AI PRE-COMMIT QUALITY GATE
 * harness/gate.js
 *
 * Mandatory pre-commit / pre-integration gate for all AI coding agents.
 * Physically blocks commits if any check fails.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { log, success, error, warn, header, git } = require('./lib/utils');
const { validateChangeControl } = require('./change-control');
const { checkInterfaces } = require('./interface-guard');
const { runAllTests } = require('./run-tests');
const { runBrowserSmoke } = require('./browser-smoke');
const { generateVerificationReport } = require('./generate-report');

async function runQualityGate(options = {}) {
  const cwd = options.cwd || process.cwd();
  const taskFile = options.taskFile || null;
  const skipVisual = !!options.skipVisual;
  const baseRef = options.baseRef || null;

  header('VOVINAM AI PRE-COMMIT QUALITY GATE');

  // Load Task Specification if provided
  let task = null;
  if (taskFile && fs.existsSync(taskFile)) {
    try {
      task = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
      log(`Active Task ID: ${task.taskId} — "${task.title}"`, 'cyan');
    } catch (e) {
      error(`Failed to parse task specification: ${taskFile}`);
      return { pass: false, error: 'Invalid task specification' };
    }
  } else if (taskFile) {
    error(`Task file not found: ${taskFile}`);
    return { pass: false, error: 'Task file not found' };
  } else {
    log('No --task specified. Operating in General Repository Quality Audit mode.', 'gray');
  }

  const allViolations = [];
  const allWarnings = [];

  // =========================================================================
  // GATE 1: CHANGE CONTROL & DELETION BUDGET (DEFAULT DENY)
  // =========================================================================
  log('\n[GATE 1/5] Checking Scope & Deletion Budget...', 'bright');
  const changeControl = validateChangeControl({ task, baseRef, cwd });

  if (!changeControl.pass) {
    for (const v of changeControl.violations) {
      error(v);
      allViolations.push(v);
    }
  } else {
    success(`Scope verified (${changeControl.changedFiles.length} files modified, 0 unauthorized deletions).`);
  }

  // =========================================================================
  // GATE 2: PROTECTED INTERFACE GUARD
  // =========================================================================
  log('\n[GATE 2/5] Checking Protected Interfaces & API Signatures...', 'bright');
  const interfaceResult = checkInterfaces(cwd);

  if (!interfaceResult.pass) {
    for (const v of interfaceResult.violations) {
      error(v);
      allViolations.push(v);
    }
  } else {
    success(`All ${interfaceResult.checkedCount} critical interface signatures verified.`);
  }

  // =========================================================================
  // GATE 3: SCRIPT LOAD ORDER & HTML INTEGRITY
  // =========================================================================
  log('\n[GATE 3/5] Validating index.html Script Tags & Load Order...', 'bright');
  const scriptValidation = spawnSync('node', ['tests/validate_index_scripts.js'], {
    cwd,
    encoding: 'utf8'
  });

  const buildPass = scriptValidation.status === 0;
  if (!buildPass) {
    error('Script validation failed in index.html!');
    if (scriptValidation.stderr) log(scriptValidation.stderr, 'red');
    allViolations.push('Script validation failed: error loading scripts in index.html');
  } else {
    success('All 81 scripts in index.html load cleanly in correct sequence.');
  }

  // =========================================================================
  // GATE 4: AUTOMATED REGRESSION TEST SUITE
  // =========================================================================
  log('\n[GATE 4/5] Executing Complete Regression Test Suite...', 'bright');
  const testResults = runAllTests({ cwd });

  if (!testResults.pass) {
    error(`Regression test suite failed (${testResults.failedSuites} failing suites)!`);
    for (const s of testResults.suites.filter(s => !s.pass)) {
      error(`  - ${s.file} (Exit code: ${s.exitCode})`);
      allViolations.push(`Test failure in suite: ${s.file}`);
    }
  } else {
    success(`All ${testResults.totalSuites} regression test suites passed (${testResults.totalDuration}).`);
  }

  // =========================================================================
  // GATE 5: REAL HEADLESS BROWSER SMOKE TEST
  // =========================================================================
  let smokeResult = { pass: true };
  if (!skipVisual) {
    log('\n[GATE 5/5] Executing Headless Browser Smoke Check...', 'bright');
    smokeResult = await runBrowserSmoke({ cwd });

    if (!smokeResult.pass) {
      error(`Browser smoke test failed: ${smokeResult.error || 'Console or DOM errors'}`);
      if (smokeResult.pageErrors) {
        for (const e of smokeResult.pageErrors) allViolations.push(`Browser page error: ${e}`);
      }
      if (smokeResult.consoleErrors) {
        for (const e of smokeResult.consoleErrors) allViolations.push(`Browser console error: ${e}`);
      }
    } else {
      success('Browser smoke passed: 0 console errors, Canvas initialized, singletons intact.');
    }
  } else {
    log('\n[GATE 5/5] Browser smoke test skipped (--skip-visual).', 'gray');
  }

  // =========================================================================
  // REPORT GENERATION
  // =========================================================================
  const filesAdded = changeControl.changedFiles.filter(f => f.status === 'A' || f.status === '??').map(f => f.path);
  const filesModified = changeControl.changedFiles.filter(f => f.status === 'M').map(f => f.path);
  const filesDeleted = changeControl.changedFiles.filter(f => f.status === 'D').map(f => f.path);

  const { report, jsonPath, mdPath } = generateVerificationReport({
    cwd,
    task,
    filesAdded,
    filesModified,
    filesDeleted,
    testsExecuted: testResults.totalSuites,
    testsPassed: testResults.passedSuites,
    testsFailed: testResults.failedSuites,
    buildStatus: buildPass ? 'PASS' : 'FAIL',
    changeControlStatus: changeControl.pass ? 'PASS' : 'FAIL',
    interfaceGuardStatus: interfaceResult.pass ? 'PASS' : 'FAIL',
    visualStatus: skipVisual ? 'SKIPPED_BENIGN' : (smokeResult.pass ? 'PASS' : 'FAIL'),
    violations: allViolations,
    warnings: allWarnings
  });

  console.log('\n' + '═'.repeat(64));
  log(`PRE-COMMIT QUALITY GATE RESULT: ${report.classification}`, report.classification === 'PASS' ? 'green' : 'red');
  log(`Verification report written to: ${jsonPath}`, 'cyan');
  console.log('═'.repeat(64) + '\n');

  return {
    pass: report.classification === 'PASS' || report.classification === 'PASS_WITH_WARNINGS',
    classification: report.classification,
    report,
    jsonPath,
    mdPath
  };
}

if (require.main === module) {
  let taskFile = null;
  let skipVisual = false;
  let baseRef = null;

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--task=')) taskFile = arg.split('=')[1];
    if (arg === '--skip-visual') skipVisual = true;
    if (arg.startsWith('--base=')) baseRef = arg.split('=')[1];
  }

  runQualityGate({ taskFile, skipVisual, baseRef }).then(res => {
    if (res.pass) {
      success('TASK VERIFICATION PASSED! READY FOR COMMIT.');
      process.exit(0);
    } else {
      error(`TASK VERIFICATION FAILED (${res.classification})! COMMIT REJECTED.`);
      process.exit(1);
    }
  }).catch(err => {
    error(`Gate runner encountered an unhandled exception: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  runQualityGate
};
