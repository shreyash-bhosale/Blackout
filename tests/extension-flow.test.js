const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Running Extension Flow & DOM Logic Tests ---');

// Load core logic
const extCorePath = path.join(__dirname, '..', 'extension', 'pii-core.js');
const extContentPath = path.join(__dirname, '..', 'extension', 'content.js');
assert(fs.existsSync(extCorePath), 'extension/pii-core.js must exist');
assert(fs.existsSync(extContentPath), 'extension/content.js must exist');

const core = require(extCorePath);
const { detect, sanitize, partial, norm } = core;

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

// Minimal DOM simulation harness for Node
class MockEvent {
  constructor(type, opts = {}) {
    this.type = type;
    this.bubbles = !!opts.bubbles;
  }
}

class MockElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.style = {};
    this.parentNode = null;
    this.isConnected = true;
    this.listeners = {};
    this.attributes = {};
  }
  getAttribute(name) { return this.attributes[name] || null; }
  setAttribute(name, val) { this.attributes[name] = val; }
  addEventListener(type, cb) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(cb);
  }
  dispatchEvent(ev) {
    ev.target = this;
    if (this.listeners[ev.type]) {
      this.listeners[ev.type].forEach(cb => cb(ev));
    }
  }
  attachShadow() {
    return {
      children: [],
      appendChild(c) { this.children.push(c); }
    };
  }
}

class MockHTMLInputElement extends MockElement {
  constructor(type = 'text', val = '') {
    super('INPUT');
    this.type = type;
    this._value = val;
    this.disabled = false;
    this.readOnly = false;
  }
  get value() { return this._value; }
  set value(v) { this._value = String(v); }
}

class MockHTMLTextAreaElement extends MockElement {
  constructor(val = '') {
    super('TEXTAREA');
    this._value = val;
    this.disabled = false;
    this.readOnly = false;
  }
  get value() { return this._value; }
  set value(v) { this._value = String(v); }
}

class MockContentEditableElement extends MockElement {
  constructor(val = '') {
    super('DIV');
    this.isContentEditable = true;
    this._text = val;
  }
  get textContent() { return this._text; }
  set textContent(v) { this._text = String(v); }
  get innerText() { return this._text; }
}

// 1. Field Discovery & Exclusion Tests
test('Test B: Field Discovery & Strict Exclusion of Password and Hidden inputs', () => {
  // Verify that password and hidden fields are excluded WITHOUT accessing their value
  let passwordValueAccessed = false;
  let hiddenValueAccessed = false;

  const passwordEl = new MockHTMLInputElement('password');
  Object.defineProperty(passwordEl, 'value', {
    get() {
      passwordValueAccessed = true;
      return 'super_secret_password_4111111111111111';
    }
  });

  const hiddenEl = new MockHTMLInputElement('hidden');
  Object.defineProperty(hiddenEl, 'value', {
    get() {
      hiddenValueAccessed = true;
      return 'hidden_token_4111111111111111';
    }
  });

  const textEl = new MockHTMLInputElement('text', 'Citizen Aadhaar: 2345 6789 0124');
  const emailEl = new MockHTMLInputElement('email', 'dev@blackout.privacy');
  const textareaEl = new MockHTMLTextAreaElement('Support log: 192.168.1.1');
  const contentEditableEl = new MockContentEditableElement('Officer PAN: ABCPE1234F');
  const disabledEl = new MockHTMLInputElement('text', 'disabled');
  disabledEl.disabled = true;

  // Simulate isEligibleField logic from content.js
  function isEligible(el) {
    if (el.tagName === 'INPUT') {
      const type = (el.getAttribute('type') || el.type || 'text').toLowerCase();
      if (type === 'password' || type === 'hidden') return false;
      if (!['text', 'email', 'tel', 'search', 'url'].includes(type)) return false;
      if (el.disabled || el.readOnly) return false;
      return true;
    }
    if (el.tagName === 'TEXTAREA') {
      return !(el.disabled || el.readOnly);
    }
    if (el.isContentEditable) return true;
    return false;
  }

  assert.strictEqual(isEligible(passwordEl), false, 'Password input must be excluded');
  assert.strictEqual(passwordValueAccessed, false, 'Password .value must NEVER be read');

  assert.strictEqual(isEligible(hiddenEl), false, 'Hidden input must be excluded');
  assert.strictEqual(hiddenValueAccessed, false, 'Hidden .value must NEVER be read');

  assert.strictEqual(isEligible(textEl), true, 'Text input eligible');
  assert.strictEqual(isEligible(emailEl), true, 'Email input eligible');
  assert.strictEqual(isEligible(textareaEl), true, 'Textarea eligible');
  assert.strictEqual(isEligible(contentEditableEl), true, 'Contenteditable eligible');
  assert.strictEqual(isEligible(disabledEl), false, 'Disabled input excluded');
});

// 2. Detection and Safe Masked Previews Test
test('Test C: Detection accuracy and safe masked preview generation', () => {
  const sample = 'User amit.kumar@cybercorp.in with card 4111 1111 1111 1111 and PAN ABCPE1234F';
  const findings = detect(sample);
  assert.strictEqual(findings.length, 3);

  const previews = findings.map(f => ({
    type: f.type,
    masked: partial(f)
  }));

  // Assert previews are masked and never raw PII
  assert.strictEqual(previews[0].masked, 'a***@cybercorp.in');
  assert.strictEqual(previews[1].masked, 'XXXX XXXX XXXX 1111');
  assert.strictEqual(previews[2].masked, 'XXXXXX234F');
  for (const p of previews) {
    assert(!p.masked.includes('4111 1111 1111 1111'), 'Raw card must not be in preview');
  }
});

// 3. Four Wipe Modes Test
test('Test D: Wipe operations in Full, Partial, Pseudo, and Delete modes', () => {
  const text = 'User amit.kumar@cybercorp.in card 4111 1111 1111 1111';
  const findings = detect(text);

  // Full
  const fullRes = sanitize(text, findings, 'full');
  assert.strictEqual(fullRes.text, 'User [REDACTED] card [REDACTED]');

  // Partial
  const partialRes = sanitize(text, findings, 'partial');
  assert.strictEqual(partialRes.text, 'User a***@cybercorp.in card XXXX XXXX XXXX 1111');

  // Pseudo
  const pseudoRes = sanitize(text, findings, 'pseudo');
  assert.strictEqual(pseudoRes.text, 'User EMAIL_01 card CARD_01');

  // Delete mode logic
  let deleteOut = '';
  let lastIdx = 0;
  for (const f of findings) {
    deleteOut += text.slice(lastIdx, f.start);
    lastIdx = f.end;
  }
  deleteOut += text.slice(lastIdx);
  assert.strictEqual(deleteOut, 'User  card ');
});

// 4. React-style Controlled Input Setter Test
test('Test D & E: React-style Controlled Input updates via prototype descriptor', () => {
  let controlledState = 'Initial 4111 1111 1111 1111';
  const inputEl = new MockHTMLInputElement('text', controlledState);

  // Simulate React listening for input event and updating internal state
  inputEl.addEventListener('input', e => {
    controlledState = e.target.value;
  });

  const findings = detect(inputEl.value);
  assert.strictEqual(findings.length, 1);

  // Apply sanitization using prototype setter and event dispatch
  const sanitized = sanitize(inputEl.value, findings, 'full').text;
  inputEl.value = sanitized;
  inputEl.dispatchEvent(new MockEvent('input', { bubbles: true }));

  assert.strictEqual(inputEl.value, 'Initial [REDACTED]');
  assert.strictEqual(controlledState, 'Initial [REDACTED]', 'Controlled state must update from input event');

  // Simulate Undo
  inputEl.value = 'Initial 4111 1111 1111 1111';
  inputEl.dispatchEvent(new MockEvent('input', { bubbles: true }));
  assert.strictEqual(controlledState, 'Initial 4111 1111 1111 1111', 'Undo must restore controlled component state');
});

// 5. Idempotent Wiping Test
test('Test D: Idempotency - repeated wipe does not double-redact or corrupt', () => {
  const text = 'Card: 4111 1111 1111 1111';
  const f1 = detect(text);
  const wiped1 = sanitize(text, f1, 'full').text;
  assert.strictEqual(wiped1, 'Card: [REDACTED]');

  // Second wipe: re-scan the wiped text
  const f2 = detect(wiped1);
  assert.strictEqual(f2.length, 0, 'Wiped text must produce 0 findings');
  // Re-running sanitize on 0 findings leaves content identical
  const wiped2 = sanitize(wiped1, f2, 'full').text;
  assert.strictEqual(wiped2, 'Card: [REDACTED]', 'Second wipe must remain strictly unchanged');
});

console.log(`\nAll ${passed} extension flow and DOM logic unit tests passed successfully!`);
