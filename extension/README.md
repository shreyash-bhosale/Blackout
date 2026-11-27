# Blackout Guard — Privacy-First Browser Extension

> **Chrome & Microsoft Edge Extension (Manifest V3)**  
> *Form & Field PII Detection and Redaction directly in your browser. Zero network. Zero storage.*

---

## 1. Overview

**Blackout Guard** is a Manifest V3 browser extension built for Google Chrome, Microsoft Edge, and Chromium-based browsers. It brings the deterministic, checksum-validated PII detection and sanitization engine of **Blackout** directly to web forms, text areas, search bars, customer support portals, and rich-text editors on any web page.

With Blackout Guard, users can:
- **Scan on Demand:** Inspect all user-editable fields on the active page for 8 types of sensitive PII (Email, Credit Card, Aadhaar, PAN, IPv4, IPv6, Indian Phone, International Phone).
- **Inspect Safely:** Review masked previews (`XXXX XXXX XXXX 1111`, `a***@corp.in`) without exposing raw PII in the popup.
- **Redact in 4 Modes:** Choose between **Full Mask** (`[REDACTED]`), **Partial Mask**, **Pseudonymization**, or **Delete**.
- **Undo Safely:** Restore fields from an in-memory snapshot within the active browsing session.
- **Guard Mode (Opt-in Stretch Feature):** Real-time paste interception that catches sensitive clipboard text before it is pasted into any form field, presenting an isolated in-page decision modal (*Redact & Paste*, *Paste Anyway*, or *Cancel*).

---

## 2. Installation (Developer Mode / Unpacked)

### Google Chrome & Chromium Browsers
1. Open Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top right corner.
3. Click the **Load unpacked** button.
4. Select the `extension/` directory from this repository:
   ```
   /path/to/PromptWars_Hackthon/extension
   ```
5. The **Blackout Guard** icon will appear in your extensions toolbar. Click the puzzle icon and pin Blackout Guard for easy access.

### Microsoft Edge
1. Open Edge and navigate to `edge://extensions`.
2. Toggle on **Developer mode** in the left sidebar.
3. Click **Load unpacked**.
4. Select the `extension/` directory.

---

## 3. Plain-Language Permissions Review

Blackout Guard enforces the principle of least privilege:

| Permission | Justification |
| :--- | :--- |
| `activeTab` | Grants temporary access to the active page **only when the user explicitly clicks the extension icon**. The extension cannot read pages in the background, cannot monitor browsing history, and has no visibility into other tabs. |
| `scripting` | Enables on-demand injection of `pii-core.js` and `content.js` into the active tab when the user requests a scan or activates Guard Mode. |

### Forbidden & Banned Capabilities
- **NO `<all_urls>` or wildcard host permissions:** The extension cannot read web pages passively or intercept network traffic.
- **NO network access:** Zero `fetch()`, `XMLHttpRequest`, `WebSocket`, or `sendBeacon()`.
- **NO persistent storage of PII:** Zero `chrome.storage`, `localStorage`, `sessionStorage`, or `IndexedDB` usage for user text or findings.
- **NO background worker:** No persistent background script or service worker running in the background.

---

## 4. Architecture & File Structure

```
extension/
├── manifest.json       # Manifest V3 configuration with minimal permissions
├── popup.html          # Extension popup UI (scan, mode selector, metrics, preview)
├── popup.css           # Apple-inspired dark aesthetic styling matching Blackout
├── popup.js            # Popup controller, tab messaging, and state coordination
├── content.js          # DOM field scanner, Shadow DOM badges, React prototype setters, Guard modal
├── pii-core.js         # Exact byte-for-byte copy of CORE logic from pii-sanitizer.html
├── test-page.html      # Local testbed with synthetic form fields, iframe, and React simulation
└── README.md           # This extension documentation
```

### Core Logic Synchronization
`extension/pii-core.js` is kept in strict byte-for-byte synchronization with the `// CORE START` to `// CORE END` block in `pii-sanitizer.html`. Any change to detector regular expressions, Luhn checksums, or Verhoeff tables is validated by automated test `tests/extension-core-sync.test.js`.

---

## 5. Security & Isolation Model

### 1. Strict Password & Hidden Field Immunity
Inputs with `type="password"` or `type="hidden"` are unconditionally excluded in `content.js` **before** any property is accessed. Their values are never read, scanned, displayed, or modified.

### 2. Shadow DOM Visual Isolation
- Detection badges attached to flagged fields use open Shadow DOM hosts, ensuring host page CSS cannot break badge styles or leak page styles into the badge.
- Guard Mode paste alert modals are rendered inside a full-screen backdrop Shadow DOM host attached to `document.body`.

### 3. React & Modern Framework Support
Modern reactive frameworks (React, Angular, Vue) override standard `.value` properties on form inputs. Blackout Guard uses prototype property descriptors (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set`) and dispatches synthetic bubbling `input` and `change` events so component state updates properly.

### 4. Oversized Field Safeguard
Fields containing more than 200,000 characters are skipped during scanning to preserve tab responsiveness, and counted under "Oversized Skipped".

---

## 6. Manual Browser Verification Checklist

To verify Blackout Guard in a real browser:

1. **Load Test Page:**
   - In Chrome or Edge, open `extension/test-page.html` as a file URL or via local HTTP server.
2. **Scan Fields:**
   - Click the **Blackout Guard** extension icon.
   - Click **"Scan this page"**.
   - Verify that:
     - Eligible fields (Text, Email, Textarea, ContentEditable) show red outline rings and count badges.
     - Password and Hidden fields have NO indicators and are completely untouched.
     - Detection Summary shows correct counts (Email, Card, Aadhaar, PAN, IP, Phone).
     - Masked Previews show obscured text only (e.g. `XXXX XXXX XXXX 1111`).
3. **Execute Wipe:**
   - Select a mode (e.g. **Full Mask** or **Partial**).
   - Click **"Wipe all PII on this page"**.
   - Verify that field values update immediately and React simulated component state updates.
4. **Test Undo:**
   - Click **"Undo"**.
   - Verify that all modified fields immediately restore their original values.
5. **Test Guard Mode (Opt-in Stretch Feature):**
   - Toggle **Guard Mode** ON in the popup.
   - Copy a synthetic PII string: `Support ticket: 9876543210 and amit@cybercorp.in`.
   - Paste into any input field.
   - Verify the Blackout Guard warning modal appears with 3 buttons:
     - Click **Redact and Paste** -> Verify redacted content is inserted.
     - Try again with **Paste Anyway** -> Verify raw content is inserted.
     - Try again with **Cancel** -> Verify nothing is inserted.
6. **Restricted Page Check:**
   - Navigate to `chrome://settings` or `chrome.google.com/webstore`.
   - Open popup: Verify alert "This page does not allow browser extensions to scan its content" appears and buttons are safely disabled.

---

## 7. Automated Test Suites

The extension is accompanied by 3 dedicated Node.js test suites:

```bash
# 1. Verify byte-for-byte parity between extension core and web app
node tests/extension-core-sync.test.js

# 2. Verify field discovery, exclusion of password/hidden, React setters, and wipe modes
node tests/extension-flow.test.js

# 3. Verify MV3 permissions, zero network, zero persistent PII, and security hardening
node tests/extension-hardening.test.js
```
