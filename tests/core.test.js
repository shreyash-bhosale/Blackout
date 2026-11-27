const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Extract and evaluate CORE logic from pii-sanitizer.html
const htmlPath = path.join(__dirname, '..', 'pii-sanitizer.html');
assert(fs.existsSync(htmlPath), 'pii-sanitizer.html must exist');
const html = fs.readFileSync(htmlPath, 'utf8');

const match = html.match(/\/\/ CORE START([\s\S]*?)\/\/ CORE END/);
assert(match && match[1], 'Exact // CORE START ... // CORE END block must exist');

const coreCode = match[1];
const core = new Function(coreCode + '; return { verhoeff, luhn, DETECTORS, detect, maskKeep, partial, norm, sanitize };')();
const { verhoeff, luhn, DETECTORS, detect, maskKeep, partial, norm, sanitize } = core;

console.log('--- Running Core Logic Unit Tests ---');

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err);
    process.exitCode = 1;
  }
}

// Checksum helper to dynamically compute valid Verhoeff Aadhaar numbers
const VD = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];
const VP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];
const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];
function calcVerhoeff(numStr) {
  let c = 0;
  const rev = numStr.split('').reverse().map(Number);
  for (let i = 0; i < rev.length; i++) {
    c = VD[c][VP[(i + 1) % 8][rev[i]]];
  }
  return inv[c];
}

// 1. Verhoeff Tests
test('Verhoeff algorithm: validation and decoy rejection', () => {
  const base1 = '23456789012';
  const valid1 = base1 + calcVerhoeff(base1); // '234567890124'
  assert.strictEqual(verhoeff(valid1), true, 'Valid Aadhaar passes');
  assert.strictEqual(verhoeff('2345 6789 0124'), true, 'Formatted valid Aadhaar passes');
  assert.strictEqual(verhoeff('2345-6789-0124'), true, 'Hyphenated valid Aadhaar passes');

  // Corrupted checksum
  assert.strictEqual(verhoeff('234567890125'), false, 'Bad checksum rejected');
  // First digit out of range 2-9
  assert.strictEqual(verhoeff('134567890120'), false, 'Leading digit 1 rejected');
  assert.strictEqual(verhoeff('034567890120'), false, 'Leading digit 0 rejected');
  // Length != 12
  assert.strictEqual(verhoeff('23456789012'), false, '11 digits rejected');
  assert.strictEqual(verhoeff('2345678901245'), false, '13 digits rejected');
});

// 2. Luhn Tests
test('Luhn algorithm: card validation and decoy rejection', () => {
  // Known valid 16-digit cards
  assert.strictEqual(luhn('4111 1111 1111 1111'), true, 'Valid test Visa passes');
  assert.strictEqual(luhn('4000 1234 5678 9017'), true, 'Valid computed card passes');
  assert.strictEqual(luhn('4111-1111-1111-1111'), true, 'Hyphenated card passes');

  // Decoys
  assert.strictEqual(luhn('1234 5678 9012 3456'), false, 'Luhn-failing 16-digit number rejected');
  assert.strictEqual(luhn('4111 1111 1111 1112'), false, 'Corrupted card rejected');
  assert.strictEqual(luhn('0000 0000 0000 0000'), false, 'All-same digit 0 rejected');
  assert.strictEqual(luhn('1111 1111 1111 1111'), false, 'All-same digit 1 rejected');
  assert.strictEqual(luhn('12345'), false, 'Too short card rejected');
  assert.strictEqual(luhn('12345678901234567890'), false, '20 digits rejected');
});

// 3. Positive Detection Tests for all categories
test('Positive detection: all categories detected with correct spans', () => {
  const text = `
    Email: dev@blackout.privacy
    Card: 4111 1111 1111 1111
    Aadhaar: 2345 6789 0124
    PAN: ABCPE1234F
    IPv4: 192.168.1.1
    IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
    Phone IN: +91 98765 43210
    Phone IN bare: 9876543210
    Phone Intl: +1 415 555 2671
  `;
  const findings = detect(text);
  assert.strictEqual(findings.length, 9, `Expected 9 findings, got ${findings.length}`);
  const types = findings.map(f => f.type);
  assert.deepStrictEqual(types, ['EMAIL', 'CARD', 'AADHAAR', 'PAN', 'IP', 'IP', 'PHONE', 'PHONE', 'PHONE']);

  // Check each finding span exactly matches original text
  for (const f of findings) {
    assert.strictEqual(text.slice(f.start, f.end), f.value);
  }
});

// 4. Decoy Rejection Tests
test('Decoy rejection: invalid patterns must never be flagged', () => {
  const decoys = `
    Decoy Card (Luhn fail): 1234 5678 9012 3456
    Decoy Aadhaar (Verhoeff fail): 2345 6789 0125
    Decoy PAN (Invalid 4th letter X): ABCXE1234F
    Decoy IPv4 (999 out of range): 999.12.1.5
    Decoy All Zeros: 0000 0000 0000 0000
    Decoy Short IP: 192.168.1
  `;
  const findings = detect(decoys);
  assert.strictEqual(findings.length, 0, `Decoys must produce 0 findings, but got ${findings.length}: ${JSON.stringify(findings)}`);
});

// 5. Overlap Resolution & Priority Order
test('Overlap resolution: priority order and disjoint intervals', () => {
  // Detector array priority: EMAIL (0) > CARD (1) > AADHAAR (2) > PAN (3) > IPv4 (4) > IPv6 (5) > PHONE (6, 7)
  // Ensure findings never share any index
  const text = `Contact 4111111111111111@company.com or 234567890124 and +919876543210`;
  const findings = detect(text);
  for (let i = 0; i < findings.length - 1; i++) {
    assert(findings[i].end <= findings[i + 1].start, `Overlap detected between ${findings[i].value} and ${findings[i + 1].value}`);
  }
  // The email with card-like localpart should be detected as EMAIL (pri 0 wins)
  assert.strictEqual(findings[0].type, 'EMAIL');
});

// 6. Digit Boundary Protection
test('Digit boundary protection: do not extract valid suffix from longer digit sequence', () => {
  // A 20-digit string containing a valid card or phone inside it
  const text = '999941111111111111119999';
  const findings = detect(text);
  assert.strictEqual(findings.length, 0, `Must not match partial digits from longer digit sequence`);
});

// 7. Pseudonym Consistency & Normalization
test('Pseudonym consistency: repeated and normalized values share placeholder', () => {
  const text = `
    Email 1: Alice@Example.com
    Email 2: ALICE@example.COM
    Email 3: bob@company.org
    Phone 1: +91 98765 43210
    Phone 2: 9876543210
    Phone 3: +1 415 555 2671
  `;
  const findings = detect(text);
  const { reps, text: sanitized } = sanitize(text, findings, 'pseudo');

  // Reps for Email 1 and Email 2 must be identical EMAIL_01
  assert.strictEqual(reps[0], 'EMAIL_01');
  assert.strictEqual(reps[1], 'EMAIL_01');
  // Email 3 gets EMAIL_02
  assert.strictEqual(reps[2], 'EMAIL_02');

  // Phone 1 (+91 98765 43210) and Phone 2 (9876543210) must both normalize to PHONE_01
  assert.strictEqual(reps[3], 'PHONE_01');
  assert.strictEqual(reps[4], 'PHONE_01');
  // Phone 3 gets PHONE_02
  assert.strictEqual(reps[5], 'PHONE_02');
});

// 8. Redaction Modes
test('Redaction modes: Full, Partial, and Pseudonym formats match specs', () => {
  const text = `User amit.kumar@cybercorp.in with card 4111 1111 1111 1111 and Aadhaar 2345 6789 0124, PAN ABCPE1234F, IP 192.168.1.100.`;
  const findings = detect(text);

  // Full Mode
  const full = sanitize(text, findings, 'full');
  assert(full.text.includes('[REDACTED]'));
  assert.strictEqual(full.reps.every(r => r === '[REDACTED]'), true);

  // Partial Mode
  const partialRes = sanitize(text, findings, 'partial');
  assert(partialRes.text.includes('a***@cybercorp.in'), 'Email partial format check');
  assert(partialRes.text.includes('XXXX XXXX XXXX 1111'), 'Card partial format check');
  assert(partialRes.text.includes('XXXX XXXX 0124'), 'Aadhaar partial format check');
  assert(partialRes.text.includes('XXXXXX234F'), 'PAN partial format check');
  assert(partialRes.text.includes('192.168.X.X'), 'IPv4 partial format check');
});

// 9. Edge Cases: Empty, whitespace, no PII, large text
test('Edge cases: empty, whitespace, large input', () => {
  assert.deepStrictEqual(detect(''), []);
  assert.deepStrictEqual(sanitize('', [], 'full'), { text: '', reps: [] });
  assert.deepStrictEqual(detect('    \n\t   '), []);
  assert.strictEqual(sanitize('Clean text without any PII.', [], 'full').text, 'Clean text without any PII.');

  // Large input test
  const largeChunk = 'This is safe server log line 12345 with no PII whatsoever.\n'.repeat(1000);
  const largeFindings = detect(largeChunk);
  assert.strictEqual(largeFindings.length, 0);
});

// 10. Built-in Noisy Sample Test: Exactly 16 findings and 0 decoys flagged
test('Built-in Noisy Sample: produces exactly 16 findings and 0 decoys', () => {
  const noisySample = `======================================================================
INCIDENT AUDIT LOG - SYSTEM ESCALATION #8492
Security & Privacy Engineering Operations
======================================================================

[SECTION 1: INCIDENT REPORTERS & STAKEHOLDERS]
Primary Reporter: amit.kumar@cybercorp.in
Secondary Escalation: amit.kumar@cybercorp.in
Security Liaison (Case variant): AMIT.KUMAR@CYBERCORP.IN
External Compliance Auditor: support.lead@external-audit.com

[SECTION 2: TRANSACTION & FINANCIAL LOGS]
Customer Settlement Primary Card: 4111 1111 1111 1111
Emergency Backup Corporate Card: 4000 1234 5678 9017
Decoy Transaction Ref (Luhn fail - NOT PII): 1234 5678 9012 3456
Decoy Zero Balance Test (All zeroes - NOT PII): 0000 0000 0000 0000

[SECTION 3: CITIZEN IDENTITY VERIFICATION]
Primary KYC Aadhaar ID: 2345 6789 0124
Authorized Nominee Aadhaar: 5432 1098 7652
Decoy Invalid Aadhaar (Verhoeff fail - NOT PII): 2345 6789 0125
Officer Primary PAN: ABCPE1234F
Entity Corporate PAN: XYZCA5678K
Decoy Entity Reg (Invalid 4th letter - NOT PII): ABCXE1234F

[SECTION 4: NETWORK DIAGNOSTICS & TELEMETRY]
Internal Gateway IPv4: 192.168.1.100
Core Infrastructure Subnet IPv4: 10.0.4.254
Decoy Broadcast Metric (Octet 999 - NOT PII): 999.12.1.5
Decoy Partial Octet: 192.168.1
Edge Border Router IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334

[SECTION 5: COMMUNICATIONS & ON-CALL ROSTER]
Duty Officer India (+91 format): +91 98765 43210
Alternate On-Call Local: 9876543210
International Operations Liaison: +1 415 555 2671
Decoy Serial Code (15 digits): 987654321098765

======================================================================
END OF LOG
======================================================================`;

  const findings = detect(noisySample);
  assert.strictEqual(findings.length, 16, `Expected exactly 16 findings, but got ${findings.length}`);

  // Assert no overlap
  for (let i = 0; i < findings.length - 1; i++) {
    assert(findings[i].end <= findings[i + 1].start, 'Findings must not overlap');
  }

  // Verify category breakdown:
  // 4 EMAIL, 2 CARD, 2 AADHAAR, 2 PAN, 3 IP (2 IPv4 + 1 IPv6), 3 PHONE (2 IN + 1 INTL)
  const counts = {};
  findings.forEach(f => { counts[f.type] = (counts[f.type] || 0) + 1; });
  assert.strictEqual(counts.EMAIL, 4, '4 Emails');
  assert.strictEqual(counts.CARD, 2, '2 Cards');
  assert.strictEqual(counts.AADHAAR, 2, '2 Aadhaars');
  assert.strictEqual(counts.PAN, 2, '2 PANs');
  assert.strictEqual(counts.IP, 3, '3 IPs (2 IPv4, 1 IPv6)');
  assert.strictEqual(counts.PHONE, 3, '3 Phones');

  // Verify none of the decoys were flagged
  const values = findings.map(f => f.value);
  assert(!values.some(v => v.includes('1234 5678 9012 3456')), 'Decoy Luhn fail must not be flagged');
  assert(!values.some(v => v.includes('0000 0000 0000 0000')), 'Decoy all zeroes must not be flagged');
  assert(!values.some(v => v.includes('2345 6789 0125')), 'Decoy Aadhaar Verhoeff fail must not be flagged');
  assert(!values.some(v => v.includes('ABCXE1234F')), 'Decoy PAN invalid 4th letter must not be flagged');
  assert(!values.some(v => v.includes('999.12.1.5')), 'Decoy IP must not be flagged');
});

console.log(`\nAll ${passedTests} unit tests passed successfully!`);
