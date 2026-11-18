# CHANGE POLICY — VOVINAM: HUYẾT CHIẾN GIA TỘC

> **Document ID**: `DOC-POL-001`  
> **Last Verified**: November 2026 (v5.8.0)  
> **Enforcement Level**: STRICT / SELF-ENFORCING

---

## 1. CORE PHILOSOPHY

### PRESERVE FIRST. IMPROVE SECOND.
1. A new feature is **not successful** if it breaks or alters an existing feature.
2. A bug fix is **unacceptable** if it silently removes or alters an existing mechanic.
3. A code cleanup is **unacceptable** if it deletes code that has not been proven obsolete.
4. An implementation is **not complete** simply because the code compiles or loads.
5. The existing game is the product we must protect.

---

## 2. DEFAULT DENY POLICY

To prevent AI coding agents from making sprawling, uncoordinated, or destructive edits:

1. **Explicit Scope Required**: Every modification must operate against a defined **Task Specification** (`tasks/TASK-XXX.json`).
2. **Locked Working Tree**: Any file not listed in `allowedFiles` is **strictly off-limits**.
3. **Automated Enforcement**: The AI Pre-Commit Gate (`harness/gate.js`) inspects `git status` and `git diff`. If any unapproved file is modified, the gate immediately rejects the change with an exit code of `1`.
4. **Out-of-Scope Discovery**: If during development an agent discovers an external file must be altered, it MUST stop, state the architectural justification, outline affected dependencies, and request human approval. It must NEVER silently expand scope.

---

## 3. ZERO-DELETION BUDGET (DELETION PROTECTION)

Accidental deletion of existing logic under the guise of "refactoring" or "simplification" is the single greatest hazard of AI-assisted maintenance.

### 3.1 Default Budget: ZERO Deletions
The default permitted deletion budget for source files is **ZERO unrelated lines/functions**.

### 3.2 Prohibited Deletions
An agent must never:
- Delete existing functions, methods, or prototype extensions.
- Delete registered event listeners (`addEventListener` callbacks).
- Delete animation state handlers or keyframes.
- Delete UI elements, DOM containers, or modal dialogs from `index.html`.
- Delete CSS class selectors or layout rules.
- Delete audio synthesizers, SFX hooks, or kiai vocalizations.
- Delete game assets (images, cutscenes, backgrounds).
- Delete compatibility code or save sanitization fallbacks.

### 3.3 Authorization for Obsolete Code Removal
A deletion or replacement is only permitted if ALL of the following criteria are satisfied:
1. Documented evidence demonstrating the code is obsolete or defective.
2. Complete dependency audit confirming no other module calls the target code.
3. Verified drop-in replacement with identical or strictly superior public interface.
4. Dedicated regression test verifying no regression.
5. Explicit human approval documented in the task specification.

---

## 4. TASK SPECIFICATION SCHEMA

Every task must have an associated JSON file in the `tasks/` directory following this schema:

```json
{
  "taskId": "TASK-2026-001",
  "title": "Short descriptive title of the task",
  "objective": "Detailed explanation of what is being built or fixed",
  "requestedBehavior": "Specific observable gameplay or UI behaviors required",
  "allowedFiles": [
    "js/entities/characters/nghi.js",
    "tests/test_nghi_adjustment.js"
  ],
  "relatedFeatures": [
    "FEAT-CHR-001"
  ],
  "dependencies": [
    "characterRegistry",
    "CombatManager"
  ],
  "deletionBudget": {
    "allowedDeletedLines": 0,
    "authorizedRemovals": []
  },
  "requiredTests": [
    "tests/test_combat.js",
    "tests/test_nghi_adjustment.js"
  ],
  "acceptanceCriteria": [
    "All 19 pre-existing regression suites pass without error",
    "Browser smoke test reports 0 console errors",
    "No files outside allowedFiles are modified"
  ]
}
```

---

## 5. GIT SAFETY PROTOCOL

1. **Never run destructive Git commands**:
   - `git reset --hard` (FORBIDDEN)
   - `git clean -fd` (FORBIDDEN)
   - `git checkout -- .` (FORBIDDEN)
   - `git branch -D` on active branches (FORBIDDEN)
2. **Preserve User Changes**:
   - If uncommitted changes exist when entering the repository, they must be preserved in place.
   - Use non-destructive snapshots (`git stash create` and backup branches) to establish safety points.
3. **Commit Quality Gate**:
   - No commit is valid unless verified by `node harness/gate.js --task=tasks/TASK-XXX.json`.
