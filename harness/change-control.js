/**
 * VOVINAM DEVELOPMENT HARNESS — CHANGE CONTROL & DELETION PROTECTION
 * harness/change-control.js
 *
 * Enforces:
 * 1. Default Deny Policy (all modified files must be explicitly approved in task spec).
 * 2. Zero-Deletion Budget (unauthorized function/listener/file removals strictly blocked).
 */

const fs = require('fs');
const path = require('path');
const { log, success, error, warn, header, git } = require('./lib/utils');

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

/**
 * Parses git status to get all modified, added, deleted, or untracked files.
 */
function getChangedFiles(baseRef = null, cwd = process.cwd()) {
  let output;
  if (baseRef) {
    output = git(`diff --name-status ${baseRef}`, cwd);
  } else {
    // Check working tree against HEAD
    output = git('status --porcelain', cwd);
  }

  if (!output) return [];

  const files = [];
  const lines = output.split('\n').filter(Boolean);

  for (const line of lines) {
    if (baseRef) {
      const parts = line.trim().split(/\s+/);
      const status = parts[0];
      const filePath = normalizePath(parts.slice(1).join(' '));
      files.push({ status, path: filePath });
    } else {
      const status = line.substring(0, 2).trim();
      const filePath = normalizePath(line.substring(3).trim());
      files.push({ status, path: filePath });
    }
  }
  return files;
}

/**
 * Analyzes diff for deletions and removed function signatures.
 */
function analyzeDiffDeletions(baseRef = null, cwd = process.cwd()) {
  const diffCmd = baseRef ? `diff -U0 ${baseRef}` : 'diff -U0 HEAD';
  const diffOutput = git(diffCmd, cwd) || '';

  const deletions = {
    totalDeletedLines: 0,
    deletedFunctions: [],
    deletedEventListeners: [],
    deletedCssSelectors: [],
    filesWithDeletions: {}
  };

  const lines = diffOutput.split('\n');
  let currentFile = null;

  for (const line of lines) {
    if (line.startsWith('--- a/')) {
      currentFile = normalizePath(line.replace('--- a/', ''));
    } else if (line.startsWith('+++ b/')) {
      // file change header
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      const deletedLine = line.substring(1).trim();
      if (!deletedLine) continue; // ignore blank deleted lines

      // Ignore config and documentation files from source code deletion budget
      if (currentFile) {
        const isExcluded = ['package.json', 'package-lock.json', 'README.md'].includes(currentFile) ||
                           currentFile.startsWith('harness/') ||
                           currentFile.startsWith('docs/') ||
                           currentFile.startsWith('tasks/');
        if (isExcluded) continue;
      }

      deletions.totalDeletedLines++;
      if (currentFile) {
        deletions.filesWithDeletions[currentFile] = (deletions.filesWithDeletions[currentFile] || 0) + 1;
      }

      // Detect function deletion
      const fnMatch = deletedLine.match(/(?:function\s+([a-zA-Z0-9_$]+)|([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{|([a-zA-Z0-9_$]+)\s*:\s*function)/);
      if (fnMatch && !deletedLine.includes('//') && !deletedLine.startsWith('*')) {
        const fnName = fnMatch[1] || fnMatch[2] || fnMatch[3];
        if (fnName && !['if', 'for', 'while', 'switch', 'catch'].includes(fnName)) {
          // Check if function STILL exists in the modified file (e.g. signature was simply updated)
          const fullPath = path.join(cwd, currentFile);
          const fileStillHasFunction = fs.existsSync(fullPath) && fs.readFileSync(fullPath, 'utf8').includes(fnName);
          if (!fileStillHasFunction) {
            deletions.deletedFunctions.push({ file: currentFile, name: fnName, line: deletedLine });
          }
        }
      }

      // Detect event listener deletion
      if (deletedLine.includes('addEventListener') || deletedLine.includes('.on(')) {
        deletions.deletedEventListeners.push({ file: currentFile, line: deletedLine });
      }

      // Detect CSS selector deletion
      if (currentFile && currentFile.endsWith('.css') && deletedLine.includes('{')) {
        deletions.deletedCssSelectors.push({ file: currentFile, line: deletedLine });
      }
    }
  }

  return deletions;
}

/**
 * Validates changes against task specification and deletion budget.
 */
function validateChangeControl(options = {}) {
  const cwd = options.cwd || process.cwd();
  const taskSpec = options.task || null;
  const baseRef = options.baseRef || null;

  const violations = [];
  const warnings = [];

  const changedFiles = getChangedFiles(baseRef, cwd);
  const deletions = analyzeDiffDeletions(baseRef, cwd);

  // 1. DEFAULT DENY: Check allowed files if task spec is provided
  if (taskSpec && Array.isArray(taskSpec.allowedFiles)) {
    const allowed = taskSpec.allowedFiles.map(normalizePath);

    // Filter out harness reports, task specs, config, and docs which are auto-generated
    const ignorePrefixes = ['harness/reports/', 'tasks/', 'docs/', 'package.json', 'package-lock.json'];

    for (const file of changedFiles) {
      if (ignorePrefixes.some(prefix => file.path.startsWith(prefix))) {
        continue;
      }
      if (!allowed.includes(file.path)) {
        violations.push(`[SCOPE_VIOLATION] File '${file.path}' is modified but NOT listed in task.allowedFiles.`);
      }
    }
  }

  // 2. DELETION BUDGET ENFORCEMENT
  let maxAllowedDeletions = 0;
  let authorizedRemovals = [];

  if (taskSpec && taskSpec.deletionBudget) {
    maxAllowedDeletions = taskSpec.deletionBudget.allowedDeletedLines || 0;
    authorizedRemovals = taskSpec.deletionBudget.authorizedRemovals || [];
  }

  if (deletions.totalDeletedLines > maxAllowedDeletions) {
    violations.push(
      `[DELETION_BUDGET_EXCEEDED] Deleted ${deletions.totalDeletedLines} lines (budget: ${maxAllowedDeletions}).`
    );
  }

  for (const fn of deletions.deletedFunctions) {
    const isAuthorized = authorizedRemovals.some(auth => auth.name === fn.name && auth.file === fn.file);
    if (!isAuthorized) {
      violations.push(`[UNAUTHORIZED_FUNCTION_DELETION] Function '${fn.name}' in '${fn.file}' was removed without authorization.`);
    }
  }

  for (const el of deletions.deletedEventListeners) {
    violations.push(`[UNAUTHORIZED_LISTENER_DELETION] Event listener in '${el.file}' was removed: "${el.line}"`);
  }

  return {
    pass: violations.length === 0,
    violations,
    warnings,
    changedFiles,
    deletions
  };
}

// CLI Execution
if (require.main === module) {
  header('VOVINAM CHANGE CONTROL & DELETION PROTECTION GATE');

  let taskFile = null;
  let baseRef = null;

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--task=')) taskFile = arg.split('=')[1];
    if (arg.startsWith('--base=')) baseRef = arg.split('=')[1];
  }

  let task = null;
  if (taskFile && fs.existsSync(taskFile)) {
    try {
      task = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
      log(`Active Task Specification: ${task.taskId} — "${task.title}"`, 'cyan');
    } catch (e) {
      error(`Failed to parse task file: ${taskFile}`);
      process.exit(1);
    }
  } else if (taskFile) {
    warn(`Task file not found: ${taskFile}. Operating in general audit mode.`);
  } else {
    log('Running in baseline change audit mode (no task file specified).', 'gray');
  }

  const result = validateChangeControl({ task, baseRef });

  log(`Changed files detected: ${result.changedFiles.length}`);
  for (const f of result.changedFiles) {
    log(`  [${f.status}] ${f.path}`, 'gray');
  }

  log(`Total deleted lines: ${result.deletions.totalDeletedLines}`);

  if (result.pass) {
    success('Change control and deletion budget verified successfully!');
    process.exit(0);
  } else {
    error('Change control violations detected:');
    for (const v of result.violations) {
      error(`  ${v}`);
    }
    process.exit(1);
  }
}

module.exports = {
  validateChangeControl,
  getChangedFiles,
  analyzeDiffDeletions
};
