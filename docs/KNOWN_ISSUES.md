# KNOWN ISSUES & BENIGN QUIRKS — VOVINAM: HUYẾT CHIẾN GIA TỘC

> **Document ID**: `DOC-ISS-001`  
> **Last Verified**: November 2026 (v5.8.0)  
> **Classification**: INFORMATIONAL / NON-DEFECT CATALOG

---

## 1. PURPOSE

This document catalogs pre-existing quirks, benign platform messages, and environment behaviors that are **NOT regressions**. Future AI agents must not misclassify these as new bugs or attempt invasive workarounds that risk breaking the game.

---

## 2. CATALOG OF BENIGN PHENOMENA

### 2.1 Git LF / CRLF Normalization Warnings
- **Symptoms**: `warning: in the working copy of '...', LF will be replaced by CRLF the next time Git touches it`.
- **Cause**: Windows operating system text file conventions vs Git core configuration (`core.autocrlf`).
- **Policy**: Expected and harmless. Do NOT run mass reformatters, newline converters, or `.gitattributes` rewrites that alter untouched files.

### 2.2 Browser AudioContext Autoplay Policy
- **Symptoms**: `The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.`
- **Cause**: Modern browser security specification preventing automated audio playback prior to initial user interaction (click, keypress).
- **Policy**: `js/core/audio.js` already resumes `AudioContext` on the first user click or key press. In automated headless test runs, audio context is safely bypassed or mocked.

### 2.3 Canvas Particle Randomness in Visual Testing
- **Symptoms**: Slight pixel differences in falling petals (`#menu-petals-canvas`) or spark emitters across screenshots.
- **Cause**: Procedural particle systems initialize with dynamic positions and velocities.
- **Policy**: Harmless. Visual regression comparisons use structural layout checks and perceptual thresholding rather than raw bitwise pixel comparison.

### 2.4 Pre-existing Uncommitted Files in Working Copy
- **Symptoms**: `git status` shows uncommitted changes on branch `master`.
- **Cause**: Ongoing development features (e.g. modular characters, 3-column ally screen, weapon throw) that are active in the working tree.
- **Policy**: These files are the **source of truth**. Never discard them with `git checkout -- .` or `git reset --hard`.
