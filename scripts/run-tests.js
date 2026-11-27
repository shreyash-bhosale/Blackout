/**
 * @file scripts/run-tests.js
 * @description Master test runner executing unit, integration, hardening, extension, and parity test suites.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('================================================================');
console.log(' BLACKOUT MASTER TEST SUITE — EXECUTION AUDIT');
console.log('================================================================\n');

const rootDir = path.join(__dirname, '..');
const testFiles = [
  'tests/core.test.js',
  'tests/hardening.test.js',
  'tests/integration.test.js',
  'tests/extension-core-sync.test.js',
  'tests/extension-flow.test.js',
  'tests/extension-hardening.test.js',
  'scripts/verify-core-parity.js'
];

let totalFailed = 0;

for (const tf of testFiles) {
  const fullPath = path.join(rootDir, tf);
  try {
    console.log(`\n>>> Executing suite: ${tf}`);
    execSync(`node "${fullPath}"`, { stdio: 'inherit', cwd: rootDir });
  } catch (err) {
    console.error(`[ERROR] Test suite failed: ${tf}`);
    totalFailed++;
  }
}

console.log('\n================================================================');
if (totalFailed === 0) {
  console.log(' ALL SUITES PASSED — 100% GREEN (Zero Regressions)');
  console.log('================================================================');
  process.exit(0);
} else {
  console.error(` ${totalFailed} SUITE(S) FAILED`);
  console.log('================================================================');
  process.exit(1);
}
