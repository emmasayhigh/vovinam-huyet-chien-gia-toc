/**
 * VOVINAM DEVELOPMENT HARNESS — RECOVERY & CHECKPOINT MANAGER
 * harness/recovery.js
 *
 * Implements non-destructive recovery and baseline snapshot tracking.
 * Strictly adheres to Git safety: never runs destructive resets or cleans.
 */

const fs = require('fs');
const path = require('path');
const { log, success, error, warn, header, git, ensureDir } = require('./lib/utils');

const CHECKPOINTS_FILE = path.join(__dirname, 'checkpoints.json');

function loadCheckpoints() {
  if (fs.existsSync(CHECKPOINTS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINTS_FILE, 'utf8'));
    } catch (_) {}
  }
  return [];
}

function saveCheckpoints(list) {
  fs.writeFileSync(CHECKPOINTS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

/**
 * Creates a non-destructive safety snapshot of current working tree.
 */
function createCheckpoint(name = null) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const checkpointName = name || `checkpoint-${timestamp}`;

  // Use git stash create to build commit object without touching working tree
  const commitSha = git('stash create');
  if (!commitSha) {
    // If working tree is completely clean, use HEAD commit
    const headSha = git('rev-parse HEAD');
    return recordCheckpoint(checkpointName, headSha, 'Clean HEAD baseline');
  }

  // Create safety branch/ref pointing to the stash commit
  const refName = `harness-checkpoints/${checkpointName}`;
  git(`branch ${refName} ${commitSha}`);

  return recordCheckpoint(checkpointName, commitSha, `Working tree snapshot (${refName})`);
}

function recordCheckpoint(name, sha, description) {
  const checkpoints = loadCheckpoints();
  const entry = {
    name,
    sha,
    description,
    createdAt: new Date().toISOString()
  };
  checkpoints.unshift(entry);
  saveCheckpoints(checkpoints);
  return entry;
}

function listCheckpoints() {
  return loadCheckpoints();
}

/**
 * Safely restores a specific file or tree by first saving a backup stash.
 */
function safeRestoreFile(filePath, targetRef = 'backup/user-wip-baseline') {
  // Never run git reset --hard
  log(`Safely restoring file '${filePath}' from ref '${targetRef}'...`, 'cyan');

  // Verify ref exists
  const refSha = git(`rev-parse --verify ${targetRef}`);
  if (!refSha) {
    error(`Target reference '${targetRef}' does not exist.`);
    return false;
  }

  // Backup current version if file exists
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.bak-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    log(`Safety backup created: ${backupPath}`, 'gray');
  }

  // Checkout file from ref
  const res = git(`checkout ${targetRef} -- "${filePath}"`);
  success(`Restored '${filePath}' successfully from '${targetRef}'.`);
  return true;
}

if (require.main === module) {
  header('VOVINAM RECOVERY & CHECKPOINT MANAGER');

  const args = process.argv.slice(2);
  const action = args[0] || 'list';

  if (action === 'create') {
    const name = args[1] || null;
    const cp = createCheckpoint(name);
    success(`Checkpoint created: "${cp.name}" (SHA: ${cp.sha.substring(0, 8)})`);
  } else if (action === 'restore') {
    const file = args[1];
    const ref = args[2] || 'backup/user-wip-baseline';
    if (!file) {
      error('Usage: node harness/recovery.js restore <file-path> [ref]');
      process.exit(1);
    }
    safeRestoreFile(file, ref);
  } else {
    const list = listCheckpoints();
    log(`Total recorded checkpoints: ${list.length}`);
    for (const cp of list) {
      log(`• [${cp.createdAt}] ${cp.name} -> ${cp.sha.substring(0, 8)} (${cp.description})`, 'cyan');
    }
  }
}

module.exports = {
  createCheckpoint,
  listCheckpoints,
  safeRestoreFile
};
