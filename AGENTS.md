# AGENTS.md — MANDATORY INSTRUCTIONS FOR AI AGENTS

> **IMPORTANT**: This document is the mandatory entry point for every AI coding agent working on **VOVINAM: HUYẾT CHIẾN GIA TỘC**.
> You MUST read this document, understand all constraints, and execute the required verification steps before declaring any task complete.

---

## 1. PROJECT OVERVIEW

**VOVINAM: HUYẾT CHIẾN GIA TỘC** is a 2D martial arts action game built with **vanilla HTML5 Canvas and pure JavaScript**.
- **No bundler / No framework / No transpiler**: Code runs directly in the browser via standard `<script>` tags.
- **Global Architecture**: Systems and classes attach to `window` (e.g., `window.game`, `window.combatManager`, `window.characterRegistry`).
- **Load-Order Sensitive**: Classes use sequential inheritance. Script order in `index.html` is strictly controlled.
- **Save Persistence**: Game progress, achievements, character unlocks, and settings are stored in `localStorage` under key `vovinam_huyet_chinh_gia_toc`.
- **Core Philosophy**: **PRESERVE FIRST. IMPROVE SECOND.** The existing game is the source of truth and must be protected at all costs.

---

## 2. DOCUMENTATION DIRECTORY

Before modifying any code, consult the relevant technical documentation in `docs/`:

| Document | Purpose |
| :--- | :--- |
| [docs/PROJECT_MAP.md](file:///c:/Users/ASUS/Desktop/edunext/cucuvababa/docs/PROJECT_MAP.md) | Full directory tree, script roles, asset catalog, stylesheets, and entry points. |
| [docs/ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/edunext/cucuvababa/docs/ARCHITECTURE.md) | Game loop, state machines, inheritance chains, window globals, script load order. |
| [docs/FEATURE_REGISTRY.md](file:///c:/Users/ASUS/Desktop/edunext/cucuvababa/docs/FEATURE_REGISTRY.md) | Comprehensive inventory of existing features, statuses, interfaces, dependencies, and tests. |
| [docs/GAMEPLAY_SYSTEMS.md](file:///c:/Users/ASUS/Desktop/edunext/cucuvababa/docs/GAMEPLAY_SYSTEMS.md) | In-depth breakdown of combat, dodge [L], counters [U+J] & [U+K], boss poise, armors, and AI. |
| [docs/DEPENDENCY_MAP.md](file:///c:/Users/ASUS/Desktop/edunext/cucuvababa/docs/DEPENDENCY_MAP.md) | Script loading graph, module coupling, DOM selector requirements, and asset links. |
| [docs/CHANGE_POLICY.md](file:///c:/Users/ASUS/Desktop/edunext/cucuvababa/docs/CHANGE_POLICY.md) | Default Deny policy, zero-deletion budget, change authorization, task spec format. |
| [docs/TEST_STRATEGY.md](file:///c:/Users/ASUS/Desktop/edunext/cucuvababa/docs/TEST_STRATEGY.md) | Test pyramid: Node regression suites, DOM simulation, Playwright browser smoke & visual diffs. |
| [docs/BASELINE_REPORT.md](file:///c:/Users/ASUS/Desktop/edunext/cucuvababa/docs/BASELINE_REPORT.md) | Verified baseline of working game state (v5.8.0, 19 test suites passing, zero console errors). |
| [docs/KNOWN_ISSUES.md](file:///c:/Users/ASUS/Desktop/edunext/cucuvababa/docs/KNOWN_ISSUES.md) | Known benign behaviors, platform quirks, and non-regression items. |

---

## 3. STRICT CHANGE RULES & PROHIBITIONS

### Prohibited Actions:
1. **NO Destructive Git Operations**: Never run `git reset --hard`, `git clean -fd`, `git checkout -- .`, or force-push.
2. **NO Uncommitted Overwrite**: Never overwrite or discard user changes in progress.
3. **NO Scope Expansion (Default Deny)**: Never touch files outside the task's explicitly authorized `allowedFiles` list.
4. **NO Silent Deletions**: Deletion budget is **ZERO** unrelated lines/functions. Never remove functions, event listeners, animation states, UI elements, CSS selectors, or mechanics under the guise of "cleanup".
5. **NO Mass-Reformatting**: Never run auto-formatters (Prettier, ESLint `--fix`, Beautify) across untouched files.
6. **NO Simplified Replacements**: Never replace an existing system with a simplified mock or stub.
7. **NO False Verification**: Never mark a task as `PASS` if any test was skipped, failed, or simulated as passing.

---

## 4. MANDATORY 10-STEP AI WORKFLOW

Every task undertaken by an AI agent must strictly follow these 10 steps:

```
[1. UNDERSTAND] ────► [2. ESTABLISH BASELINE] ────► [3. DEFINE SCOPE]
                                                            │
[6. INSPECT DIFF] ◄─── [5. IMPLEMENT MINIMAL] ◄─── [4. IDENTIFY RISKS]
       │
       ▼
[7. RUN REGRESSION] ──► [8. VISUAL CHECK] ──► [9. SELF-REVIEW] ──► [10. REPORT]
```

1. **UNDERSTAND**: Read this `AGENTS.md`, `docs/PROJECT_MAP.md`, and the relevant feature in `docs/FEATURE_REGISTRY.md`.
2. **ESTABLISH BASELINE**: Run `npm test` or `node harness/run-tests.js` to ensure the existing game passes all 19 test suites before touching anything.
3. **DEFINE SCOPE**: Create or verify a Task Specification (`tasks/TASK-XXX.json`) listing exact `allowedFiles`, affected features, and required tests.
4. **IDENTIFY RISKS**: Check `docs/DEPENDENCY_MAP.md` for upstream and downstream effects.
5. **IMPLEMENT**: Make the minimal, focused change necessary to fulfill the request. Never rewrite adjacent code.
6. **INSPECT DIFF**: Run `git diff` and verify that only approved files were modified and that no deletions occurred outside authorization.
7. **RUN REGRESSION TESTS**: Run `npm run harness:gate` or `node harness/gate.js --task=tasks/TASK-XXX.json`.
8. **VISUAL VERIFICATION**: Run browser smoke test (`node harness/browser-smoke.js`) to confirm zero console errors and intact UI layout.
9. **SELF-REVIEW**: Audit for duplicate listeners, broken global references, missing cleanup, or stale variables.
10. **REPORT**: Generate a machine-readable verification report (`harness/reports/verification-report.json`) and present a truthful summary.

---

## 5. RUNNING THE VERIFICATION HARNESS

The project includes an automated development harness to protect the game:

```bash
# 1. Run all regression test suites (19 suites, >100 checks)
npm run harness:test
# or: node harness/run-tests.js

# 2. Run the full AI Pre-Commit Quality Gate
npm run harness:gate
# or: node harness/gate.js --task=tasks/YOUR_TASK.json

# 3. Run headless browser smoke check (loads game in real browser, checks errors)
node harness/browser-smoke.js

# 4. Generate structured verification report
npm run harness:report
# or: node harness/generate-report.js

# 5. Run the Harness Acceptance Self-Test
npm run harness:acceptance
# or: node harness/test-harness.js
```

---

## 6. EVIDENCE REQUIRED BEFORE COMPLETION

To claim completion of any coding task, the AI agent MUST provide:
1. **Task ID & Scope**: List of files authorized and touched.
2. **Git Diff Summary**: Output of `git diff --stat` showing zero unauthorized file modifications.
3. **Deletion Audit**: Confirmation that deletion budget was respected (0 unauthorized deletions).
4. **Test Execution Evidence**: Console output of `node harness/gate.js` with all tests passing.
5. **Browser Smoke Status**: Confirmation of 0 console errors in real browser environment.
6. **Verification Report**: Path to generated `harness/reports/verification-report.json` with status `PASS`.
