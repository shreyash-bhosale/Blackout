/**
 * @file scripts/verify-core-parity.js
 * @description Verifies that all distribution targets (web app, extension, and modular packages)
 * share byte-for-byte or functional parity with the canonical PII core implementation.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Verifying Core Parity & Synchronization ---');

const rootDir = path.join(__dirname, '..');
const canonicalCorePath = path.join(rootDir, 'extension', 'pii-core.js');
const htmlPath = path.join(rootDir, 'pii-sanitizer.html');
const indexHtmlPath = path.join(rootDir, 'index.html');

assert(fs.existsSync(canonicalCorePath), 'extension/pii-core.js must exist');
assert(fs.existsSync(htmlPath), 'pii-sanitizer.html must exist');
assert(fs.existsSync(indexHtmlPath), 'index.html must exist');

const extCore = fs.readFileSync(canonicalCorePath, 'utf8');
const piiHtml = fs.readFileSync(htmlPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const extMatch = extCore.match(/\/\/ CORE START([\s\S]*?)\/\/ CORE END/);
const piiMatch = piiHtml.match(/\/\/ CORE START([\s\S]*?)\/\/ CORE END/);
const indexMatch = indexHtml.match(/\/\/ CORE START([\s\S]*?)\/\/ CORE END/);

assert(extMatch, 'extension/pii-core.js missing // CORE START .. // CORE END block');
assert(piiMatch, 'pii-sanitizer.html missing // CORE START .. // CORE END block');
assert(indexMatch, 'index.html missing // CORE START .. // CORE END block');

assert.strictEqual(
  extMatch[1].trim(),
  piiMatch[1].trim(),
  'FAIL: extension/pii-core.js does not match pii-sanitizer.html CORE block'
);

assert.strictEqual(
  extMatch[1].trim(),
  indexMatch[1].trim(),
  'FAIL: extension/pii-core.js does not match index.html CORE block'
);

// Verify canonical package export functionality
const pkgCore = require(path.join(rootDir, 'packages', 'pii-core', 'src', 'index.js'));
assert(typeof pkgCore.detect === 'function', 'packages/pii-core must export detect()');
assert(typeof pkgCore.sanitize === 'function', 'packages/pii-core must export sanitize()');
assert(typeof pkgCore.verhoeff === 'function', 'packages/pii-core must export verhoeff()');
assert(typeof pkgCore.luhn === 'function', 'packages/pii-core must export luhn()');

// Verify identical detection across implementations
const sample = 'Audit check: 4111 1111 1111 1111, dev@blackout.privacy, 192.168.1.1, Aadhaar 2345 6789 0124';
const extPkg = require(canonicalCorePath);
const fExt = extPkg.detect(sample);
const fPkg = pkgCore.detect(sample);

assert.strictEqual(fExt.length, fPkg.length, 'Detection count parity mismatch');
for (let i = 0; i < fExt.length; i++) {
  assert.strictEqual(fExt[i].type, fPkg[i].type, `Finding ${i} type mismatch`);
  assert.strictEqual(fExt[i].start, fPkg[i].start, `Finding ${i} start mismatch`);
  assert.strictEqual(fExt[i].end, fPkg[i].end, `Finding ${i} end mismatch`);
  assert.strictEqual(fExt[i].value, fPkg[i].value, `Finding ${i} value mismatch`);
}

console.log('[PASS] Full core parity verified across canonical package, extension, and web applications.');
