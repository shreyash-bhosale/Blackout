# Blackout

> **Detect. Classify. Redact. Keep processing local.**  
> *PromptWars &times; NIAT_Pune Cybersecurity & Data Privacy Hackathon Challenge*

---

## 1. Project Overview

**Blackout** is an autonomous, browser-only, zero-dependency cybersecurity platform designed to detect and sanitize personally identifiable information (PII) directly inside the user's web browser. 

Traditional redaction and sanitization utilities defeat their own purpose: they require users to upload confidential application logs, customer tickets, resumes, or CSV datasets to cloud servers, introducing third-party data transit and storage liabilities.

Blackout inverts this model:
- **Zero Network Transmission:** All detection algorithms, mathematical checksum routines, and text sanitization engines execute exclusively in client-side JavaScript.
- **Zero Persistent Storage:** The application operates with zero browser persistence—no `localStorage`, `sessionStorage`, `IndexedDB`, or cookies. Data exists only in volatile browser memory.
- **Dual Form Factor:** In addition to the standalone single-file web platform ([pii-sanitizer.html](pii-sanitizer.html)), Blackout includes **Blackout Guard**, a Manifest V3 browser extension for on-demand form field scanning and real-time paste protection on live web pages.

---

## 2. Key Features

### Implemented & Verified
- **Deterministic Checksum-Backed PII Detection:** 8 prioritized detector rules covering Email, Credit Cards (Luhn), Aadhaar (Verhoeff), PAN (tax entity validation), IPv4, IPv6 (full 8-group), Indian Phone, and International Phone numbers.
- **Zero-Network Architecture & Strict CSP:** Enforced Content Security Policy meta tag (`connect-src 'none'`, `default-src 'none'`) barring all external network requests.
- **Three Core Redaction Modes (Web App):**
  - **Full Mask:** Universal `[REDACTED]` replacement.
  - **Partial Mask:** Preserves operational debugging context (card/Aadhaar last 4, email domain, first 2 IP octets).
  - **Consistent Pseudonymization:** Replaces entities with sequential tokens (`EMAIL_01`, `CARD_01`) using case/separator normalization to preserve referential integrity.
- **Reactive Side-by-Side Diff Panes:** Synchronized dual-pane editor with live entity highlighting and real-time line/character counters.
- **Live Audit Inspection Table:** Displays detected findings with physical document line numbers, category badges, original values, and replacement previews (up to 500 rows), filterable by category.
- **Local File Import & In-Memory Export:** Supports `.txt` and `.csv` files up to 5 MB via HTML5 File API; exports directly to `.sanitized.txt` or `.sanitized.csv` via in-memory Blob URLs.
- **One-Click Built-in Noisy Sample:** Instantly loads a curated synthetic benchmark containing 16 valid findings and deliberate decoy values.
- **Dark & Light Themes:** Toggleable interface with Apple-inspired visual aesthetics and responsive design.
- **Blackout Guard Chrome/Edge Extension (Manifest V3):** On-demand DOM field scanning, isolated Shadow DOM indicator badges, in-place wiping with React-compatible prototype setters, tab-scoped in-memory undo, and opt-in Guard Mode paste interception.

### Partially Implemented
- **CSV Column-Aware Handling:** Preserves raw CSV row structure, commas, and column integrity during string replacement, but does not present a spreadsheet-style tabular grid editor.
- **Guard Mode (Extension Stretch Feature):** Real-time paste interception and Shadow DOM decision modal (*Redact & Paste*, *Paste Anyway*, *Cancel*) implemented in extension code; verified in automated DOM flow tests, pending manual cross-site browser rehearsal.

### Planned (Not Implemented in Current Release)
- **Local WebAssembly Named Entity Recognition (NER):** Client-side model (ONNX/WASM) for unstructured contextual PII (person names, street addresses).
- **Custom User-Defined Regex Terms:** Interface for users to add arbitrary custom patterns during a session.
- **Compressed IPv6 Notation:** Parsing and expanding zero-compressed IPv6 addresses (`::1`).
- **Numerical Risk Scoring:** Quantitative document vulnerability score (documented as future triage heuristic in PRD, omitted from MVP to prioritize exact entity counting).

---

## 3. Supported PII Patterns & Validation

| PII Type | Detection Approach | Algorithmic Validation | Status |
| :--- | :--- | :--- | :---: |
| **Email** | Word-boundary RFC-like pattern | Syntax validation; valid TLD length $\ge 2$ | **Implemented** |
| **Credit Card** | 13–19 digits, single space/hyphen separators | **Luhn Checksum (Mod 10)**; rejects all-identical digit strings | **Implemented** |
| **Aadhaar** | 12 digits, first digit 2–9, optional 4-4-4 grouping | **Verhoeff Checksum** (dihedral group $D_5$ multiplication tables) | **Implemented** |
| **PAN Card** | Indian Tax ID (`[A-Z]{5}[0-9]{4}[A-Z]`) | 4th-character tax status validation (`P,C,H,F,A,T,B,L,J,G`) | **Implemented** |
| **IPv4 Address** | Dotted quad notation (`0–255.0–255.0–255.0–255`) | Numeric octet range enforcement ($0 \le \text{octet} \le 255$) | **Implemented** |
| **IPv6 Address** | Full eight 1–4 hexadecimal character groups | 8-group hexadecimal colon validation | **Implemented** |
| **Indian Phone** | 10 digits starting with 6–9 | Prefix validation (`+91`, `0091`, or `0`), negative digit lookarounds | **Implemented** |
| **Intl Phone** | E.164-style with `+` prefix and country code $\ne 91$ | Country code prefix structure, negative digit lookarounds | **Implemented** |
| **Person Names** | Requires Natural Language Processing / NER | Out of scope for regex (prevents mass false positives) | *Planned (WASM)* |
| **Street Address** | Requires Natural Language Processing / NER | Out of scope for regex | *Planned (WASM)* |

---

## 4. Redaction Modes

1. **Full Mask (`full`):**
   - Replaces all detected spans with `[REDACTED]`.
   - *Example:* `User contact 4111 1111 1111 1111` &rarr; `User contact [REDACTED]`
2. **Partial Mask (`partial`):**
   - Retains structural context while obscuring sensitive payloads.
   - *Cards / Aadhaar / Phones:* Retains last 4 digits (`XXXX XXXX XXXX 1111`, `XXXX XXXX 0124`, `XXXXXX4321`).
   - *Email:* Retains first character and domain (`a***@cybercorp.in`).
   - *IPv4:* Retains first two octets (`192.168.X.X`).
   - *PAN:* Retains last 4 characters (`XXXXXX234F`).
3. **Consistent Pseudonymization (`pseudo`):**
   - Replaces identifiers with sequential aliases (`EMAIL_01`, `CARD_01`, `PHONE_01`).
   - Normalization via `norm()` guarantees that case variants (`Alice@corp.com` and `alice@CORP.COM`) or formatted phone numbers (`+91 98765 43210` and `9876543210`) map to the exact same pseudonym throughout the document.

---

## 5. Technical Architecture

Blackout separates pure algorithmic core functions from UI rendering and DOM manipulation:

```mermaid
flowchart TD
    subgraph Web App Context
        A[User Text Input / File Drop] --> B[// CORE START: detect]
        B --> C{Prioritized Evaluation}
        C -->|Checksums: Luhn / Verhoeff| D[Disjoint Interval Resolver]
        D --> E[// CORE START: sanitize]
        E --> F[Reactive View Renderer: view]
        F --> G[Synchronized Diff Panes]
        F --> H[Audit Inspection Table]
        F --> I[In-Memory Blob Exporter]
    end

    subgraph Browser Extension Context
        J[Web Page DOM] --> K[content.js Field Scanner]
        K -->|Exclude Password & Hidden| L[pii-core.js: detect]
        L --> M[Shadow DOM Badges Attached]
        M --> N[popup.js: WIPE Trigger]
        N --> O[Prototype Value Setters]
        O --> P[In-Memory Undo Snapshot]
    end
```

### Architecture Highlights
- **Core Pure Functions:** Enclosed between `// CORE START` and `// CORE END` in [pii-sanitizer.html](pii-sanitizer.html). Contains zero DOM or window references, making it directly testable in Node.js and reusable in the extension.
- **Extension Synchronization:** [extension/pii-core.js](extension/pii-core.js) is a verbatim copy of the web app core. Parity is enforced by automated test [tests/extension-core-sync.test.js](tests/extension-core-sync.test.js).
- **Shadow DOM Isolation:** Extension indicators and Guard modals attach to Shadow DOM roots (`attachShadow({ mode: 'open' })`) to prevent host page CSS collisions.

---

## 6. How to Run the Web Application

Blackout has **zero build steps, zero package installations, and zero server requirements**.

### Running Locally
1. Clone or download this repository to your local machine.
2. Double-click [pii-sanitizer.html](pii-sanitizer.html) (or [index.html](index.html)) to open it directly in any modern browser (Chrome, Edge, Firefox, Safari 16.4+).
3. Alternatively, open your browser and navigate to the file URL:
   ```text
   file:///path/to/PromptWars_Hackthon/pii-sanitizer.html
   ```

*Note: The application requires a browser with JavaScript enabled and standard regex lookbehind support.*

---

## 7. How to Load the Browser Extension Unpacked

The companion extension **Blackout Guard** runs in Google Chrome, Microsoft Edge, and any Chromium-based browser.

*(Verify against current Chrome / Edge documentation).*

### Setup Steps
1. Open Google Chrome and enter `chrome://extensions` in the address bar (or `edge://extensions` in Microsoft Edge).
2. Enable the **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button.
4. Browse to and select the `extension/` directory inside this repository:
   ```text
   /path/to/PromptWars_Hackthon/extension
   ```
5. Click the puzzle-piece icon in the browser toolbar and pin **Blackout Guard**.
6. Open [extension/test-page.html](extension/test-page.html) to test on-demand scanning, field badging, in-place wiping, and undo.

---

## 8. Prove It Yourself — Privacy & Zero-Network Verification

We encourage judges and technical auditors to independently verify our privacy guarantees:

1. Open [pii-sanitizer.html](pii-sanitizer.html) in Google Chrome.
2. Open Developer Tools (`F12` or `Cmd + Option + I`).
3. Select the **Network** tab. Check **Preserve log** and click **Clear** (`🚫`).
4. Paste sensitive text or click **Load noisy sample**. Switch redaction modes, download sanitized output, and copy to clipboard.
5. **Inspect the Network tab:** Exactly zero HTTP/HTTPS, WebSocket, or Beacon requests will be recorded.
6. Select the **Application** tab:
   - Check **Local Storage:** `0 items`
   - Check **Session Storage:** `0 items`
   - Check **IndexedDB:** `No databases`
   - Check **Cookies:** `0 cookies`
7. In the Network tab throttling dropdown, select **Offline** (or disconnect your Wi-Fi entirely). Repeat the workflow. The application functions completely with zero degradation.

*What this proves:* Blackout transmits zero data over the network and persists zero data to disk.  
*What this does not prove:* It does not guarantee immunity from host-level malware (e.g. keyloggers or screen recorders) running on the operating system.

---

## 9. Known Limitations

- **No Named Entity Recognition (NER):** Person names, organization titles, and physical street addresses are not detected.
- **Compressed IPv6:** Addresses using double-colon compression (e.g. `::1`, `fe80::1`) are not matched; full 8-group addresses are required.
- **Format-Based Phone Detection:** 10-digit account or transaction numbers starting with 6–9 may produce false positives under Indian phone patterns.
- **Canvas-Based Web Editors:** The browser extension cannot inspect or manipulate canvas-rendered text engines like Google Docs.
- **Volatile Tab Undo:** Extension in-memory undo snapshots are destroyed when the tab is navigated or reloaded.

---

## 10. Automated Testing

Blackout includes a comprehensive 6-suite automated test harness runnable directly in Node.js without package installs:

```bash
# Run all 6 test suites:
node tests/core.test.js && \
node tests/hardening.test.js && \
node tests/integration.test.js && \
node tests/extension-core-sync.test.js && \
node tests/extension-flow.test.js && \
node tests/extension-hardening.test.js
```

### Test Suite Descriptions
| Suite | What It Tests |
| :--- | :--- |
| `tests/core.test.js` | 10 unit tests for Luhn, Verhoeff, 8 detectors, decoy rejection, overlap resolution, and pseudonym normalization. |
| `tests/hardening.test.js` | 5 security tests checking CSP meta tags, zero network calls, zero storage, XSS escaping, and 50,000-line stress tests. |
| `tests/integration.test.js` | 4 platform flow tests checking CSV column preservation, view escaping, metric engine mathematics, and audit line numbering. |
| `tests/extension-core-sync.test.js` | Byte-for-byte exact parity test between `pii-sanitizer.html` core and `extension/pii-core.js`. |
| `tests/extension-flow.test.js` | 5 DOM simulation tests verifying field discovery, password/hidden exclusion without value reading, React prototype setters, and idempotency. |
| `tests/extension-hardening.test.js` | 7 compliance tests checking Manifest V3 permissions (`activeTab`, `scripting`), zero network, zero persistent storage, and Guard mode Shadow DOM isolation. |

**Current Status:** All 32 automated tests pass with 0 failures.

---

## 11. Documentation Index

- [DEMO.md](DEMO.md) — 4-minute master presentation script and 60-second backup demo.
- [QA.md](QA.md) — Comprehensive technical judge Q&A guide (48 questions answered).
- [READINESS.md](READINESS.md) — Hackathon demonstration checklist and live rehearsal protocol.
- [PROMPT_LOG.md](PROMPT_LOG.md) — Authentic prompt history log template and development chronicle.
- [extension/README.md](extension/README.md) — Complete guide to Blackout Guard Chrome/Edge extension.
- [Prompt/AGENTS.md](Prompt/AGENTS.md) — Hard architectural constraints and rules for coding agents.
- [Prompt/Blackout_PRD.md](Prompt/Blackout_PRD.md) — Product Requirements Document and specifications.
- [Prompt/ARCHITECTURE.md](Prompt/ARCHITECTURE.md) — Codebase architecture, data flow, and IPC design.
- [Prompt/DATABASE.md](Prompt/DATABASE.md) — In-memory data model and zero-persistence policy.
- [Prompt/API.md](Prompt/API.md) — Internal JavaScript function interfaces and extension IPC specification.

---

## 12. Responsible Use Note

Blackout is an open-source technical prototype developed for the **PromptWars &times; NIAT_Pune Cybersecurity & Data Privacy Hackathon Challenge**. It is designed to assist engineers, researchers, and administrators in mitigating sensitive data exposure by redacting supported syntactic PII patterns locally. 

Pattern-based redaction does not guarantee complete anonymization, nor does using this tool certify legal compliance with GDPR, HIPAA, or the Digital Personal Data Protection (DPDP) Act. Formal compliance requires comprehensive organizational, physical, legal, and operational controls.
