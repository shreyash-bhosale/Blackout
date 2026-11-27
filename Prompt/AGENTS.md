# AGENTS.md

Instructions for AI coding agents (and humans) working on this repository.

Many coding agents read a file named `AGENTS.md` from the repo root. If your tool expects a different filename or location for project rules, copy this content there. Whether Google Antigravity uses this exact file was not verified.

## 1. Project in one paragraph

**Blackout** is a browser-only PII sanitizer built for the PromptWars x NIAT_Pune Cybersecurity & Data Privacy challenge. A user pastes text or opens a `.txt` / `.csv` file. The app detects emails, phone numbers, IP addresses, Indian PAN and Aadhaar numbers, and credit card numbers; redacts them in one of three modes (full, partial, pseudonymize); shows a side-by-side diff with counts and an audit log; and exports the sanitized file. **All processing happens in the browser. Nothing is sent to any server.**

## 2. Hard constraints (never violate)

These come from the challenge brief and the product's core promise. If a task seems to require breaking one, stop and ask.

1. **No network access from the page.** No `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, analytics, telemetry, or remote logging. Keep the Content-Security-Policy meta tag (`connect-src 'none'`, `default-src 'none'`).
2. **No external resources.** No CDN scripts, web fonts, remote images, or remote stylesheets. Everything is inline in the single HTML file.
3. **No persistence.** Do not use `localStorage`, `sessionStorage`, `IndexedDB`, or cookies. Do not add a database or backend.
4. **Never insert user text as raw HTML.** Pasted content is untrusted. Use the existing `esc()` helper or `textContent`. Never use `innerHTML` with unescaped user-derived strings.
5. **Credit cards must pass Luhn** before being flagged. Aadhaar must pass Verhoeff. Do not remove validators to "catch more".
6. **No overlapping findings.** Every character belongs to at most one finding.
7. **Do not log or print real PII** in code, tests, comments, commit messages or sample data. Use synthetic values only.

## 3. Repository layout

```
pii-sanitizer.html   the entire app: HTML + CSS + JS
PRD.md               product requirements (if present in the repo)
ARCHITECTURE.md      how the code is structured
DATABASE.md          explains there is no database, and the in-memory data model
API.md               explains there is no HTTP API, and documents the internal function interface
AGENTS.md            this file
```

Inside `pii-sanitizer.html`, the script has two parts:

- **Core**, between the comments `// CORE START` and `// CORE END`: pure functions with no DOM access (`verhoeff`, `luhn`, `DETECTORS`, `detect`, `maskKeep`, `partial`, `norm`, `sanitize`).
- **UI**, after the core: rendering, event handlers, file loading, download and copy.

**Keep the core pure.** Do not reference `document`, `window` or any DOM API inside the core markers. The test approach depends on this. Do not move or rename the marker comments.

## 4. How to run and test

There is no build step, package manager or install.

- **Run:** open `pii-sanitizer.html` in a modern browser (current Chrome, Edge, Firefox, or Safari 16.4+; the code uses regex lookbehind).
- **Test the core in Node:** extract the code between the markers and evaluate it.

```js
const fs = require('fs');
const html = fs.readFileSync('pii-sanitizer.html', 'utf8');
const core = html.match(/\/\/ CORE START([\s\S]*?)\/\/ CORE END/)[1];
const { detect, sanitize, luhn, verhoeff } =
  new Function(core + '; return { detect, sanitize, luhn, verhoeff }')();
```

A test file for this does not exist in the repo yet. If you create one, put it in `tests/core.test.js` and run it with `node tests/core.test.js`.

**Minimum test cases to keep passing:**

- Valid card, valid Aadhaar, valid PAN, IPv4, email, and Indian mobile are detected.
- Decoys are NOT flagged: Luhn-failing 16-digit numbers, an Aadhaar-shaped number failing Verhoeff, a PAN with an invalid 4th letter, `999.12.1.5`, `0000000000000000`.
- No two findings overlap.
- In pseudonym mode, `A@x.com` and `a@X.com` share one placeholder.
- Full, partial and pseudonym outputs match the documented formats.

**Browser testing cannot be done by Node.** UI behavior (sample loader, file open, download, copy, theme, mobile layout) must be checked in a real browser. Do not claim UI behavior works unless you actually ran it.

## 5. Coding conventions

- Vanilla JavaScript, no frameworks, no dependencies, no build tooling.
- Keep everything in the single HTML file unless the maintainers ask to split it.
- Use the existing style: compact functions, `const`/`let`, no semicolon-free style changes in unrelated code.
- Do not reformat or reorganize code you are not changing. Keep diffs small and focused.
- Detector order in `DETECTORS` **is** the priority. Changing order changes behavior; add a test when you do.
- Plain-language, specific UI messages. Errors say what happened and what to do next.
- Preserve accessibility: labeled controls, visible focus, `role="status"` on the status line, light and dark theme support.

## 6. Common tasks

### Add a new PII type

1. Add an entry to `DETECTORS` (position sets priority), with a validator if the identifier has a checksum or strict format.
2. Add a label to `LABEL`.
3. Add a color variable (`--TYPE`) and a `.t-TYPE` CSS rule.
4. Add a case to `partial()`.
5. Check `norm()` for sensible pseudonym matching.
6. Add positive and decoy tests.
7. Update `ARCHITECTURE.md` and `API.md` if behavior or shapes changed.

### Change redaction format

Edit `sanitize()` or `partial()` only. Update the formats table in `ARCHITECTURE.md` and the sample expectations in tests.

### Tighten or loosen a regex

Run the full test list. Check for false positives on long digit sequences, and for regexes that could backtrack badly on large input (not benchmarked at the 5 MB limit).

## 7. Known limitations (do not "fix" silently)

- Names, addresses and other contextual PII are not detected (needs NER).
- Compressed IPv6 (`::1` style) is not detected; PAN must be uppercase.
- A real card glued to extra digits can be missed.
- Phone detection is format-based and may flag non-phone 10-digit numbers starting 6 to 9.
- The audit table shows original values by design.

If you change any of these, update the documentation and tests in the same change.

## 8. Rules for honest reporting

- Base claims on the code you actually read or ran. If you did not verify something, say "not verified".
- Never invent features, files, libraries, benchmarks, or test results.
- Do not claim the app is "secure", "compliant" or "anonymizing". It reduces risk by redacting patterns; it is not a legal guarantee.
- When you finish a task, state exactly what you changed, what you tested, how, and what you did not test.

## 9. Definition of done

A change is done when:

- All hard constraints in Section 2 still hold.
- Core tests pass (or you clearly state they were not run).
- No new network calls, external resources, or storage APIs were introduced.
- User-derived text is still escaped everywhere it is rendered.
- Related docs are updated.
- The summary of your work lists what was and was not verified.

## 10. When to stop and ask

Stop and ask the maintainers before:

- Adding a backend, database, API route, analytics, or any third-party script.
- Adding a dependency or build step.
- Weakening the CSP.
- Changing what data is stored or sent anywhere.
- Removing a validator or a mandatory feature from the challenge brief.

## 11. Blackout Guard Extension Rules

When modifying or maintaining the browser extension under `extension/`:
1. **Manifest V3 and Minimal Permissions:** The extension must use Manifest V3. Permissions are strictly limited to `["activeTab", "scripting"]`. No `<all_urls>`, no host permissions, no storage permissions, and no persistent background workers.
2. **Zero Network & Zero Persistence:** Just like the web application, the extension has zero network access and never persists user text, detected findings, or undo snapshots in `chrome.storage`, `localStorage`, `sessionStorage`, or `IndexedDB`.
3. **Strict Password & Hidden Protection:** Fields with `type="password"` or `type="hidden"` must be excluded unconditionally in `content.js` before their value property is accessed.
4. **Core Parity Invariant:** `extension/pii-core.js` must remain identical byte-for-byte to `pii-sanitizer.html` between `// CORE START` and `// CORE END`. Always run `node tests/extension-core-sync.test.js`.
5. **DOM Style Isolation:** Indicator badges and Guard Mode modals must be rendered within open Shadow DOM hosts to prevent collision with host page styles.
6. **Controlled Inputs:** Value updates must use prototype property descriptors (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set`) and dispatch bubbling `input` and `change` events.
