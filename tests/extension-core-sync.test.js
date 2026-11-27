const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Running Test A: Core Synchronization Test ---');

const htmlPath = path.join(__dirname, '..', 'pii-sanitizer.html');
const extCorePath = path.join(__dirname, '..', 'extension', 'pii-core.js');

assert(fs.existsSync(htmlPath), 'pii-sanitizer.html must exist');
assert(fs.existsSync(extCorePath), 'extension/pii-core.js must exist');

const html = fs.readFileSync(htmlPath, 'utf8');
const extCode = fs.readFileSync(extCorePath, 'utf8');

const htmlMatch = html.match(/\/\/ CORE START([\s\S]*?)\/\/ CORE END/);
const extMatch = extCode.match(/\/\/ CORE START([\s\S]*?)\/\/ CORE END/);

assert(htmlMatch && htmlMatch[1], 'pii-sanitizer.html must have exact CORE block');
assert(extMatch && extMatch[1], 'extension/pii-core.js must have exact CORE block');

// Assert byte-for-byte exact equality between the two CORE blocks
assert.strictEqual(
  extMatch[1].trim(),
  htmlMatch[1].trim(),
  'The PII CORE block in extension/pii-core.js must be a 100% verbatim copy of pii-sanitizer.html'
);

console.log('[PASS] Core synchronization test passed: extension/pii-core.js matches pii-sanitizer.html verbatim.');
