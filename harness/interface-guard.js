/**
 * VOVINAM DEVELOPMENT HARNESS — PROTECTED INTERFACE GUARD
 * harness/interface-guard.js
 *
 * Verifies that core public APIs, class signatures, and required contracts
 * have not been deleted, renamed, or modified destructively.
 */

const fs = require('fs');
const path = require('path');
const { log, success, error, warn, header } = require('./lib/utils');

const PROTECTED_CONTRACTS = [
  {
    name: 'CombatSystem',
    file: 'js/combat/combat.js',
    requiredMethods: [
      'update',
      'registerHit',
      'hasUpgrade',
      'applyUpgrade',
      'resetStageStats',
      'resetRunUpgrades'
    ]
  },
  {
    name: 'SaveManager',
    file: 'js/core/save.js',
    requiredMethods: [
      'persist',
      'load',
      'sanitize',
      'createDefaults',
      'ensureCleanResetOnce',
      'isStageUnlocked',
      'completeStage'
    ]
  },
  {
    name: 'PlayerBase',
    file: 'js/entities/player/playerBase.js',
    requiredMethods: [
      'update',
      'setState'
    ]
  },
  {
    name: 'PlayerInput',
    file: 'js/entities/player/playerInput.js',
    requiredMethods: [
      'handlePlayerInput'
    ]
  },
  {
    name: 'BaseEnemy',
    file: 'js/entities/enemy/baseEnemy.js',
    requiredMethods: [
      'update',
      'takeDamage',
      'setState',
      'avoidObstacles',
      'selectCombatTarget',
      'setAuraArmor',
      'hasAuraArmor',
      'clearAuraArmor'
    ]
  },
  {
    name: 'CharacterRegistrySystem',
    file: 'js/entities/characters/characterRegistry.js',
    requiredMethods: [
      'register',
      'get',
      'resolveForEntity',
      'buildRosterEntry',
      'buildCharactersMap',
      'buildStyleDefsMap',
      'buildCharSlotsList'
    ]
  },
  {
    name: 'StageManager',
    file: 'js/world/stageManager.js',
    requiredMethods: [
      'getCurrentStage',
      'setStage',
      'cancelDialogue',
      'playDialogueSequence',
      'showNextDialogue',
      'advanceDialogue',
      'skipDialogue'
    ]
  },
  {
    name: 'AllySystem',
    file: 'js/entities/allySystem.js',
    requiredMethods: [
      'summonAlly',
      'canSummon',
      'getBestAvailableAlly',
      'update',
      'reset'
    ]
  },
  {
    name: 'InputHandler',
    file: 'js/core/input.js',
    requiredMethods: [
      'setBinding',
      'resetDefaultBindings',
      'formatKeyName',
      'consumeCounterHand',
      'consumeCounterLeg',
      'isActionJustPressed'
    ]
  },
  {
    name: 'AudioManager',
    file: 'js/core/audio.js',
    requiredMethods: [
      'setBossPhase',
      'playAchievementFanfare'
    ]
  }
];

function checkInterfaces(cwd = process.cwd()) {
  const violations = [];
  const checked = [];

  for (const contract of PROTECTED_CONTRACTS) {
    const filePath = path.join(cwd, contract.file);
    if (!fs.existsSync(filePath)) {
      violations.push(`[MISSING_SOURCE_FILE] Protected contract file '${contract.file}' does not exist.`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    for (const method of contract.requiredMethods) {
      // Regex checking for class method, prototype method, or object method definition
      const regex = new RegExp(`(?:${method}\\s*\\([^)]*\\)|${method}\\s*=\\s*function|prototype\\.${method}\\s*=|${contract.name}\\.prototype\\.${method}\\s*=)`);
      if (!regex.test(content)) {
        violations.push(`[BROKEN_INTERFACE] ${contract.name} is missing required method '${method}' in '${contract.file}'.`);
      } else {
        checked.push(`${contract.name}.${method}()`);
      }
    }
  }

  return {
    pass: violations.length === 0,
    violations,
    checkedCount: checked.length,
    checked
  };
}

if (require.main === module) {
  header('VOVINAM PROTECTED INTERFACE GUARD');

  const result = checkInterfaces();
  log(`Total protected interfaces checked: ${result.checkedCount}`);

  if (result.pass) {
    success(`All ${result.checkedCount} protected interfaces are intact and verified!`);
    process.exit(0);
  } else {
    error(`Interface violations detected (${result.violations.length}):`);
    for (const v of result.violations) {
      error(`  ${v}`);
    }
    process.exit(1);
  }
}

module.exports = {
  checkInterfaces,
  PROTECTED_CONTRACTS
};
