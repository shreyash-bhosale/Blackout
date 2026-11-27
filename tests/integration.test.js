const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Running Integration & Platform Flow Tests ---');

const htmlPath = path.join(__dirname, '..', 'pii-sanitizer.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const coreMatch = html.match(/\/\/ CORE START([\s\S]*?)\/\/ CORE END/)[1];
const core = new Function(coreMatch + '; return { verhoeff, luhn, DETECTORS, detect, maskKeep, partial, norm, sanitize };')();
const { detect, sanitize, norm } = core;

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

// 1. CSV Structure Preservation & Redaction Integration
test('CSV Handling: structure, column count, and commas are preserved', () => {
  const csvInput = `id,name,email,card,notes\n1,Alice,alice@example.com,4111 1111 1111 1111,"Normal transaction"\n2,Bob,bob@corp.org,4000 1234 5678 9017,"Backup card"`;
  const findings = detect(csvInput);
  assert.strictEqual(findings.length, 4, 'Should detect 2 emails and 2 cards in CSV');

  // Test full mask
  const full = sanitize(csvInput, findings, 'full');
  const fullLines = full.text.split('\n');
  assert.strictEqual(fullLines.length, 3, 'CSV row count unchanged');
  for (const line of fullLines) {
    // Column count should remain 5 columns
    // Simple split for unquoted columns
    const cols = line.split(',');
    assert(cols.length >= 5, 'Must maintain at least 5 columns');
  }
  assert(full.text.includes('[REDACTED]'), 'Contains redactions');
  assert(!full.text.includes('alice@example.com'), 'Original email removed');
  assert(!full.text.includes('4111 1111 1111 1111'), 'Original card removed');

  // Test pseudonym mode on CSV
  const pseudo = sanitize(csvInput, findings, 'pseudo');
  assert(pseudo.text.includes('EMAIL_01'));
  assert(pseudo.text.includes('EMAIL_02'));
  assert(pseudo.text.includes('CARD_01'));
  assert(pseudo.text.includes('CARD_02'));
});

// 2. Highlighting & View Escaping Integration
test('View Rendering: tags are well-formed and inner text is sanitized/highlighted', () => {
  function esc(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function view(text, fs, vals, side) {
    if (!text) return '';
    let out = '';
    let lastIdx = 0;
    for (let i = 0; i < fs.length; i++) {
      const f = fs[i];
      out += esc(text.slice(lastIdx, f.start));
      const val = side ? vals[i] : f.value;
      out += '<mark class="t-' + esc(f.type) + '" data-type="' + esc(f.type) + '" title="' + esc(f.type) + '">' + esc(val) + '</mark>';
      lastIdx = f.end;
    }
    out += esc(text.slice(lastIdx));
    return out;
  }

  const sample = 'User: test@domain.com, Aadhaar: 2345 6789 0124';
  const findings = detect(sample);
  const sanitized = sanitize(sample, findings, 'partial');

  const leftHtml = view(sample, findings, sanitized.reps, false);
  const rightHtml = view(sample, findings, sanitized.reps, true);

  // Left must contain original value inside mark
  assert(leftHtml.includes('<mark class="t-EMAIL" data-type="EMAIL" title="EMAIL">test@domain.com</mark>'));
  assert(leftHtml.includes('<mark class="t-AADHAAR" data-type="AADHAAR" title="AADHAAR">2345 6789 0124</mark>'));

  // Right must contain masked value inside mark
  assert(rightHtml.includes('<mark class="t-EMAIL" data-type="EMAIL" title="EMAIL">t***@domain.com</mark>'));
  assert(rightHtml.includes('<mark class="t-AADHAAR" data-type="AADHAAR" title="AADHAAR">XXXX XXXX 0124</mark>'));
});

// 3. Category Breakdown Insights Accuracy
test('Insights Engine: mathematical counts & percentages match findings', () => {
  const text = `
    Email: a@b.com, c@d.org
    Card: 4111 1111 1111 1111
    IP: 192.168.1.1
  `;
  const findings = detect(text);
  assert.strictEqual(findings.length, 4);

  const counts = { EMAIL: 0, CARD: 0, AADHAAR: 0, PAN: 0, IP: 0, PHONE: 0 };
  const unique = new Set();
  for (const f of findings) {
    counts[f.type] = (counts[f.type] || 0) + 1;
    unique.add(f.type + '|' + norm(f));
  }

  assert.strictEqual(counts.EMAIL, 2);
  assert.strictEqual(counts.CARD, 1);
  assert.strictEqual(counts.IP, 1);
  assert.strictEqual(counts.AADHAAR, 0);
  assert.strictEqual(unique.size, 4);

  // Percentages
  assert.strictEqual(Math.round((counts.EMAIL / findings.length) * 100), 50);
  assert.strictEqual(Math.round((counts.CARD / findings.length) * 100), 25);
  assert.strictEqual(Math.round((counts.IP / findings.length) * 100), 25);
});

// 4. Line Number Calculation in Audit Engine
test('Audit Line Numbering: binary search offsets match exact physical lines', () => {
  function lineStarts(t) {
    const starts = [0];
    for (let i = 0; i < t.length; i++) {
      if (t[i] === '\n') starts.push(i + 1);
    }
    return starts;
  }
  function lineOf(starts, offset) {
    let low = 0, high = starts.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (starts[mid] <= offset) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return high + 1;
  }

  const multiLine = 'Line 1 safe\nLine 2 safe\nLine 3 has dev@blackout.test\nLine 4 safe\nLine 5 has 192.168.0.1\n';
  const starts = lineStarts(multiLine);
  const findings = detect(multiLine);

  assert.strictEqual(findings.length, 2);
  assert.strictEqual(lineOf(starts, findings[0].start), 3, 'dev@blackout.test is on line 3');
  assert.strictEqual(lineOf(starts, findings[1].start), 5, '192.168.0.1 is on line 5');
});

console.log(`\nAll ${passed} integration and platform flow tests passed successfully!`);
