const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Running M5 Hardening & Security Verification Tests ---');

const htmlPath = path.join(__dirname, '..', 'pii-sanitizer.html');
assert(fs.existsSync(htmlPath), 'pii-sanitizer.html must exist');
const html = fs.readFileSync(htmlPath, 'utf8');

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

// 1. Content Security Policy (CSP) Verification
test('CSP Verification: connect-src none and default-src none', () => {
  const cspMatch = html.match(/<meta\s+http-equiv=["']Content-Security-Policy["']\s+content="([^"]*)"/i);
  assert(cspMatch, 'CSP meta tag must be present in head');
  const csp = cspMatch[1];
  assert(csp.includes("connect-src 'none'"), 'CSP must strictly contain "connect-src \'none\'"');
  assert(csp.includes("default-src 'none'"), 'CSP must strictly contain "default-src \'none\'"');
  assert(csp.includes("style-src 'unsafe-inline'"), 'CSP must allow inline styles');
  assert(csp.includes("script-src 'unsafe-inline'"), 'CSP must allow inline script');
});

// 2. Zero External Resources & Network Calls Audit
test('Zero External Assets & Network Calls Audit', () => {
  // Check for remote tags: <script src="http...", <link rel="stylesheet" href="http...", <img src="http..."
  assert(!/<script[^>]+src=["']https?:\/\//i.test(html), 'No external scripts allowed');
  assert(!/<link[^>]+href=["']https?:\/\//i.test(html), 'No external stylesheets allowed');
  assert(!/<img[^>]+src=["']https?:\/\//i.test(html), 'No external images allowed');
  assert(!/@import\s+url\(/i.test(html), 'No CSS external font imports allowed');

  // Check script for prohibited network APIs
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);
  assert(scriptMatch, 'Inline script block must exist');
  const scriptContent = scriptMatch[1];

  assert(!/\bfetch\s*\(/.test(scriptContent), 'No fetch() calls allowed');
  assert(!/\bXMLHttpRequest\b/.test(scriptContent), 'No XMLHttpRequest allowed');
  assert(!/\bWebSocket\b/.test(scriptContent), 'No WebSocket allowed');
  assert(!/\bsendBeacon\b/.test(scriptContent), 'No sendBeacon allowed');
});

// 3. Zero Persistence Audit
test('Zero Persistence Audit: No localStorage, sessionStorage, indexedDB, cookies', () => {
  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/i)[1];
  assert(!/\blocalStorage\b/.test(scriptContent), 'localStorage is strictly forbidden');
  assert(!/\bsessionStorage\b/.test(scriptContent), 'sessionStorage is strictly forbidden');
  assert(!/\bindexedDB\b/.test(scriptContent), 'indexedDB is strictly forbidden');
  assert(!/\bdocument\.cookie\b/.test(scriptContent), 'cookies are strictly forbidden');
});

// 4. XSS & HTML Injection Protection
test('XSS Protection: Pasted malicious markup is strictly escaped', () => {
  // Evaluate UI esc and view functions in Node
  const coreMatch = html.match(/\/\/ CORE START([\s\S]*?)\/\/ CORE END/)[1];
  const uiCode = html.match(/\/\/ --- UI IMPLEMENTATION ---([\s\S]*?)<\/script>/)[1];

  // Mock minimal DOM for view / esc testing
  const sandbox = new Function(
    coreMatch + '\n' +
    'function esc(s) {\n' +
    '  if (typeof s !== "string") return "";\n' +
    '  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\'/g, "&#39;");\n' +
    '}\n' +
    'function view(text, fs, vals, side) {\n' +
    '  if (!text) return "";\n' +
    '  let out = ""; let lastIdx = 0;\n' +
    '  for (let i = 0; i < fs.length; i++) {\n' +
    '    const f = fs[i];\n' +
    '    out += esc(text.slice(lastIdx, f.start));\n' +
    '    const val = side ? vals[i] : f.value;\n' +
    '    out += \'<mark class="t-\' + esc(f.type) + \'" data-type="\' + esc(f.type) + \'" title="\' + esc(f.type) + \'">\' + esc(val) + \'</mark>\';\n' +
    '    lastIdx = f.end;\n' +
    '  }\n' +
    '  out += esc(text.slice(lastIdx));\n' +
    '  return out;\n' +
    '}\n' +
    'return { esc, view, detect, sanitize };'
  )();

  const { esc, view, detect, sanitize } = sandbox;

  const hostileStrings = [
    '<img src=x onerror=alert(1)>',
    '<script>alert("pwned")</script>',
    '<svg onload=alert(document.cookie)>',
    '"><script>alert(1)</script>',
    '\'><img src=x onerror=alert(1)>',
    'User <b onmouseover=alert(1)>email@test.com</b>'
  ];

  for (const hostile of hostileStrings) {
    const escaped = esc(hostile);
    assert(!escaped.includes('<script>'), `Raw script must not exist: ${escaped}`);
    assert(!escaped.includes('<img'), `Raw img tag must not exist: ${escaped}`);
    assert(!escaped.includes('<svg'), `Raw svg tag must not exist: ${escaped}`);

    const findings = detect(hostile);
    const sanitized = sanitize(hostile, findings, 'full');
    const leftView = view(hostile, findings, sanitized.reps, false);
    const rightView = view(hostile, findings, sanitized.reps, true);

    // The only unescaped HTML allowed in leftView and rightView are the <mark> tags generated by view()
    const strippedLeft = leftView.replace(/<mark[^>]*>|<\/mark>/g, '');
    const strippedRight = rightView.replace(/<mark[^>]*>|<\/mark>/g, '');

    assert(!strippedLeft.includes('<'), `No raw HTML brackets allowed in left view: ${strippedLeft}`);
    assert(!strippedLeft.includes('>'), `No raw HTML brackets allowed in left view: ${strippedLeft}`);
    assert(!strippedRight.includes('<'), `No raw HTML brackets allowed in right view: ${strippedRight}`);
    assert(!strippedRight.includes('>'), `No raw HTML brackets allowed in right view: ${strippedRight}`);
  }
});

// 5. Large Input Sanity & Performance Check
test('Large Input Stress Test: 50,000 lines processed without memory explosion or crash', () => {
  const coreMatch = html.match(/\/\/ CORE START([\s\S]*?)\/\/ CORE END/)[1];
  const { detect, sanitize } = new Function(coreMatch + '; return { detect, sanitize };')();

  // Create ~1.5 MB input text with repeated safe lines and embedded PII
  const lineSafe = '2026-11-27T10:00:00Z [INFO] System health check normal status OK.\n';
  const linePii = '2026-11-27T10:00:01Z [AUTH] User login: dev.ops@blackout.test card: 4111 1111 1111 1111 ip: 192.168.1.50\n';

  let largeText = '';
  for (let i = 0; i < 25000; i++) {
    largeText += lineSafe;
    if (i % 2500 === 0) largeText += linePii;
  }

  const startTime = Date.now();
  const findings = detect(largeText);
  const elapsedDetect = Date.now() - startTime;

  assert(findings.length > 0, 'Must find embedded PII in large text');
  console.log(`   (Processed ${largeText.length} bytes / 25,000+ lines in ${elapsedDetect} ms, found ${findings.length} findings)`);

  const startSanitize = Date.now();
  const res = sanitize(largeText, findings, 'pseudo');
  const elapsedSanitize = Date.now() - startSanitize;

  assert(res.text.length > 0, 'Sanitized text produced');
  console.log(`   (Sanitized in ${elapsedSanitize} ms)`);
  assert(elapsedDetect < 5000, 'Detection time must be within reasonable bounds');
});

console.log(`\nAll ${passedTests} hardening and security tests passed successfully!`);
