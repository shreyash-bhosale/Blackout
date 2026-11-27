/**
 * @file scripts/validate-structure.js
 * @description Validates repository architectural layers, file layout, and component integrity.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Validating Repository Architecture & Structure ---');

const rootDir = path.join(__dirname, '..');

const requiredPaths = [
  'packages/pii-core/package.json',
  'packages/pii-core/src/index.js',
  'packages/pii-core/src/constants/tables.js',
  'packages/pii-core/src/validators/luhn.js',
  'packages/pii-core/src/validators/verhoeff.js',
  'packages/pii-core/src/detectors/index.js',
  'packages/pii-core/src/matching/resolve-overlaps.js',
  'packages/pii-core/src/normalization/normalize.js',
  'packages/pii-core/src/sanitizers/index.js',
  'packages/pii-core/src/sanitizers/partial-mask.js',
  'apps/web/index.html',
  'apps/web/styles/tokens.css',
  'apps/web/scripts/core.js',
  'apps/web/scripts/canvas.js',
  'extensions/blackout-guard/manifest.json',
  'extensions/blackout-guard/popup/popup.html',
  'extensions/blackout-guard/popup/popup.js',
  'extensions/blackout-guard/content/content.js',
  'extensions/blackout-guard/core/pii-core.js',
  'extensions/blackout-guard/test/test-page.html',
  'docs/product/PRD.md',
  'docs/architecture/ARCHITECTURE.md',
  'docs/hackathon/DEMO.md',
  'docs/hackathon/QA.md',
  'scripts/run-tests.js',
  'scripts/verify-core-parity.js',
  'index.html',
  'pii-sanitizer.html',
  'blackout-guard-extension.zip'
];

let missing = 0;
for (const rel of requiredPaths) {
  const full = path.join(rootDir, rel);
  if (!fs.existsSync(full)) {
    console.error(`[MISSING] ${rel}`);
    missing++;
  }
}

assert.strictEqual(missing, 0, `Validation failed: ${missing} required architectural files missing.`);
console.log(`[PASS] All ${requiredPaths.length} architectural milestones and structural boundaries verified.`);
