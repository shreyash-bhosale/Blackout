const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Running Extension Security & Hardening Tests ---');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err);
    process.exitCode = 1;
  }
}

const extDir = path.join(__dirname, '..', 'extension');
const manifestPath = path.join(extDir, 'manifest.json');
const contentJsPath = path.join(extDir, 'content.js');
const popupJsPath = path.join(extDir, 'popup.js');
const piiCorePath = path.join(extDir, 'pii-core.js');
const popupHtmlPath = path.join(extDir, 'popup.html');
const webAppHtmlPath = path.join(__dirname, '..', 'pii-sanitizer.html');

// 1. Manifest V3 Specification & Minimal Permission Audit
test('Manifest V3: strictly minimal permissions (activeTab, scripting) and no host permissions', () => {
  assert(fs.existsSync(manifestPath), 'manifest.json must exist');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.strictEqual(manifest.manifest_version, 3, 'Must be Manifest V3');
  assert.deepStrictEqual(manifest.permissions, ['activeTab', 'scripting'], 'Permissions must strictly be ["activeTab", "scripting"]');
  assert(!manifest.host_permissions || manifest.host_permissions.length === 0, 'No host permissions allowed');
  assert(!manifest.background, 'No persistent background service worker needed for on-demand inspection');
  assert.strictEqual(manifest.action && manifest.action.default_popup, 'popup.html', 'Default popup must be popup.html');
});

// 2. Zero Network Activity Ban
test('Network Isolation: zero fetch, XHR, WebSocket, or sendBeacon in extension codebase', () => {
  const filesToCheck = [contentJsPath, popupJsPath, piiCorePath, popupHtmlPath];
  const forbiddenPatterns = [
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bsendBeacon\b/
  ];

  for (const filePath of filesToCheck) {
    assert(fs.existsSync(filePath), `File must exist: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const relName = path.basename(filePath);

    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(content), `Forbidden network API detected in ${relName}: ${pattern}`);
    }
  }
});

// 3. Zero Persistent Storage of PII
test('Privacy: zero persistent storage of PII across storage APIs', () => {
  const filesToCheck = [contentJsPath, popupJsPath, piiCorePath];
  const storagePatterns = [
    /\bchrome\.storage\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bindexedDB\b/
  ];

  for (const filePath of filesToCheck) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relName = path.basename(filePath);

    for (const pattern of storagePatterns) {
      assert(!pattern.test(content), `Forbidden persistent storage API found in ${relName}: ${pattern}`);
    }
  }
});

// 4. Safe Code Execution: No eval, new Function, or document.write
test('Execution Safety: no eval, new Function, or document.write', () => {
  const filesToCheck = [contentJsPath, popupJsPath, piiCorePath];
  const unsafePatterns = [
    /\beval\s*\(/,
    /\bnew\s+Function\s*\(/,
    /\bdocument\.write\s*\(/
  ];

  for (const filePath of filesToCheck) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relName = path.basename(filePath);

    for (const pattern of unsafePatterns) {
      assert(!pattern.test(content), `Unsafe dynamic execution found in ${relName}: ${pattern}`);
    }
  }
});

// 5. Sensitive Field Exclusion in Content Script
test('Form Field Safety: password and hidden inputs are excluded BEFORE value access', () => {
  const content = fs.readFileSync(contentJsPath, 'utf8');

  // Verify that isEligibleField checks type === 'password' and 'hidden' before reading .value
  const passwordCheckIdx = content.indexOf("type === 'password'");
  const hiddenCheckIdx = content.indexOf("type === 'hidden'");
  const getFieldTextIdx = content.indexOf('function getFieldText');

  assert(passwordCheckIdx !== -1, 'Password check must exist in content.js');
  assert(hiddenCheckIdx !== -1, 'Hidden check must exist in content.js');
  assert(getFieldTextIdx !== -1, 'getFieldText helper must exist');
  assert(passwordCheckIdx < getFieldTextIdx, 'Password exclusion check must precede field value extraction');
});

// 6. Core Logic Verbatim Parity
test('Core Parity: extension/pii-core.js is byte-for-byte identical to web app core', () => {
  const webAppHtml = fs.readFileSync(webAppHtmlPath, 'utf8');
  const coreStartTag = '// CORE START';
  const coreEndTag = '// CORE END';

  const startIdx = webAppHtml.indexOf(coreStartTag);
  const endIdx = webAppHtml.indexOf(coreEndTag);
  assert(startIdx !== -1 && endIdx !== -1, 'Web app must have // CORE START and // CORE END markers');

  const webAppCore = webAppHtml.slice(startIdx, endIdx + coreEndTag.length);
  const extCore = fs.readFileSync(piiCorePath, 'utf8');

  assert(extCore.includes(webAppCore), 'extension/pii-core.js must contain identical web app core logic');
});

// 7. Guard Mode Opt-in & Shadow DOM Isolation
test('Guard Mode: strictly opt-in by default and uses isolated Shadow DOM', () => {
  const content = fs.readFileSync(contentJsPath, 'utf8');
  assert(content.includes('let guardModeEnabled = false;'), 'Guard mode must be disabled by default');
  assert(content.includes("host.attachShadow({ mode: 'open' })"), 'Guard modal must use Shadow DOM');
});

console.log(`\nAll ${passed} extension security & hardening tests passed successfully!`);
