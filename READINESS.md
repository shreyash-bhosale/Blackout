# Blackout — Hackathon Submission & Demonstration Readiness (READINESS.md)

> **PromptWars &times; NIAT_Pune Cybersecurity & Data Privacy Hackathon**  
> *Checklist & Rehearsal Protocol for Technical Verification.*  
> *Rules: Distinguishes confirmed automated evidence from user-supplied environment confirmation.*

---

## 1. Environment Readiness Checklist

| Item | Requirement | Verification Status | Source of Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **Demo Machine Browser** | Chrome 120+, Edge 120+, Firefox 120+, or Safari 16.4+ | **[ ] Awaiting user confirmation** | State exact target browser on demo laptop. |
| **Browser Version** | Specific version string (e.g. Chrome 131.0.6778.86) | **[ ] Awaiting user confirmation** | Check via `chrome://version`. |
| **Operating System** | macOS, Linux, or Windows 11 | **[ ] Awaiting user confirmation** | e.g. macOS Sequoia 15.1 / Windows 11 23H2. |
| **JavaScript Enabled** | Standard browser JavaScript runtime | **[ ] Awaiting user confirmation** | Must be verified in target browser settings. |
| **Regex Lookbehind Support** | JavaScript engine supports `(?<=...)` and `(?<!...)` | **[ ] Awaiting user confirmation** | Required by phone/number detectors. Verified in Node.js v20+; must confirm in demo browser. |
| **Local File Access** | Standalone file opens via `file://` protocol | **Verified (Automated)** | Single static HTML file with all CSS/JS inlined. |
| **Offline Operation** | Works without active Internet connection | **Verified (Automated)** | Codebase contains 0 remote CDNs, fonts, or external assets; CSP strictly bars network. |
| **No External Assets Missing** | Zero missing images, fonts, or scripts | **Verified (Automated)** | Verified in `tests/hardening.test.js`. |
| **Noisy Sample Loads** | Click "Load noisy sample" populates 16 findings | **Verified (Automated)** | Verified in `tests/core.test.js` (Test 10). |
| **All 3 Redaction Modes** | Full, Partial, and Pseudonym modes update text | **Verified (Automated)** | Verified in `tests/core.test.js` (Test 8). |
| **Download Sanitized File** | Generates UTF-8 `.txt` and `.csv` Blob download | **Verified (Automated)** | Handled via `URL.createObjectURL(blob)` and `a.download`. |
| **Clipboard Copy** | Copies sanitized text with fallback | **Partially verified** | Clipboard API implemented with `document.execCommand('copy')` fallback; permissions depend on browser focus. |
| **Session Clear / Reset** | Wipes in-memory text, diffs, and audit table | **Verified (Automated)** | Wipes cached structures and sets `inEl.value = ""`. |

---

## 2. Browser Extension Readiness Checklist (Blackout Guard)

| Item | Requirement | Verification Status | Source of Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **Extension Exists** | Directory `./extension` contains all required files | **Verified** | Manifest, popup, content, pii-core, CSS, and test page present. |
| **Manifest Conformance** | Valid Manifest V3 specification | **Verified (Automated)** | `manifest_version: 3` verified in `tests/extension-hardening.test.js`. |
| **Minimal Permissions** | Strictly `["activeTab", "scripting"]` only | **Verified (Automated)** | Verified in `tests/extension-hardening.test.js`. Zero host permissions, zero storage. |
| **Loads Unpacked** | Loads without errors in `chrome://extensions` | **[ ] Awaiting user confirmation** | User must load unpacked in target demo browser. |
| **Local Test Page** | `extension/test-page.html` opens and renders fields | **Verified** | Static HTML testbed present in repository. |
| **Supported Inputs Scanned** | Scans text, email, textarea, contenteditable | **Verified (Automated)** | Verified in `tests/extension-flow.test.js` (Test B). |
| **Password Inputs Excluded** | `<input type="password">` never read or badged | **Verified (Automated)** | Verified in `tests/extension-flow.test.js` (Test B). Value property is never accessed. |
| **Hidden Inputs Excluded** | `<input type="hidden">` never read or badged | **Verified (Automated)** | Verified in `tests/extension-flow.test.js` (Test B). |
| **Same-Origin Iframes** | Scans accessible child frames | **Documented** | Injected via `allFrames: true` in `chrome.scripting.executeScript`. |
| **Shadow DOM Badges** | Visual indicators use isolated Shadow DOM | **Verified (Automated)** | Attached to host divs with `attachShadow({ mode: 'open' })`. |
| **In-Place Wipe** | Sanitizes inputs in selected mode | **Verified (Automated)** | Verified in `tests/extension-flow.test.js` (Test D). |
| **React-Controlled Inputs** | Prototype descriptor setters update React state | **Verified (Automated)** | Verified in `tests/extension-flow.test.js` (Test D & E). |
| **In-Memory Undo** | Restores previous values from memory snapshot | **Verified (Automated)** | Verified in `tests/extension-flow.test.js` (Test D & E). |
| **Repeated / Idempotent Clicks** | Repeated wipes do not corrupt or double-redact | **Verified (Automated)** | Verified in `tests/extension-flow.test.js` (Test D). |
| **Tab Isolation** | Undo snapshots exist strictly in tab RAM | **Verified (Automated)** | Variable is scoped inside content script closure per tab. |

---

## 3. Submission & Backup Readiness

| Item | Action Required | Status |
| :--- | :--- | :---: |
| **USB Drive Backup** | Copy the entire `PromptWars_Hackthon` folder to a physical USB thumb drive. | [ ] Awaiting user action |
| **Backup Integrity Check** | Insert USB drive into a secondary laptop, double-click `pii-sanitizer.html`, verify it runs offline. | [ ] Awaiting user action |
| **Hosted Repository URL** | Public or private GitHub / GitLab repository link. | **[ ] Awaiting user confirmation** *(e.g. `https://github.com/username/blackout`)* |
| **Two-Minute Backup Video** | Screen recording demonstrating web app and extension workflow. | [ ] Awaiting user recording |

---

## 4. Two-Minute Backup Screen Recording Instructions

If the demo room loses Wi-Fi, the projector disconnects, or the demo laptop suffers a hardware freeze, having a local `.mp4` video on your desktop guarantees you can still present.

### Recording Protocol (Record with QuickTime, OBS, or Windows Game Bar):
1. **[0:00 - 0:15] Web App Launch:**
   - Show browser opening `file:///path/to/pii-sanitizer.html`.
   - Point to the clean dashboard and empty Network tab in DevTools.
2. **[0:15 - 0:45] Sample Scanning & Redaction:**
   - Click **"Load noisy sample"**.
   - Show 16 findings detected; point out that decoys (`0000...`, `999.12.1.5`) are ignored.
   - Switch between **Partial** and **Pseudonym** modes.
   - Show the **Audit Inspection Table** with physical line numbers.
   - Click **"Download Sanitized (.txt)"** and show the downloaded file.
3. **[0:45 - 1:15] Offline Proof:**
   - In DevTools Network tab, switch throttle to **Offline**.
   - Paste a new line: `Emergency: 9876543210, dev@blackout.privacy`.
   - Show that detection and diff highlighting occur instantly while completely offline.
4. **[1:15 - 1:45] Extension Workflow:**
   - Switch to `extension/test-page.html`.
   - Open **Blackout Guard** popup, click **"Scan this page"**.
   - Show red outlines and Shadow DOM badges on text inputs; show password/hidden fields untouched.
   - Select **Full Mask**, click **"Wipe all PII on this page"**.
   - Show values replaced with `[REDACTED]`. Click **"Undo"** and show restoration.
5. **[1:45 - 2:00] Guard Mode Paste Interception:**
   - Toggle **Guard Mode** ON.
   - Paste a synthetic card number into an input.
   - Show the in-page Shadow DOM warning modal (*Redact & Paste*, *Paste Anyway*, *Cancel*).
   - Click **"Redact and Paste"**. Show redacted insertion.

Save the file as `Blackout_Demo_Backup.mp4` on your desktop.

---

## 5. Live Website Extension Rehearsal Protocol

> **Default Rule:** The local test page (`extension/test-page.html`) is the **primary verified demonstration environment** for Blackout Guard.  
> If you plan to demonstrate Blackout Guard on a real external website during judging, you **must rehearse the site in advance**. Live sites frequently use custom shadow roots, canvas renderers, or strict input sanitizers.

### Rehearsal Protocol for External Sites:
*Until you perform this rehearsal on your specific site, mark the external site: **Not verified**.*

1. **Website & Target Form:** Name the exact URL (e.g. `https://httpbin.org/forms/post` or a synthetic internal CRM testbed).
2. **Synthetic Input Only:** **NEVER submit real personal data.** Use synthetic numbers: `4111 1111 1111 1111` or `9876543210`.
3. **Inspect Field Types:** Verify the fields are standard `<input type="text">`, `<textarea>`, or `contenteditable`.
4. **Test Scan:** Click **Scan this page**. Check if badges appear correctly without breaking page CSS layout.
5. **Test Wipe:** Click **Wipe all PII**. Verify that the text updates.
6. **Test Framework Binding:** Type a character after wiping to ensure the site's JavaScript framework (e.g. React/Angular) acknowledged the change and did not revert it.
7. **Test Undo:** Click **Undo**. Verify the synthetic value restores.
8. **Test Submission:** Submit the form to ensure no client-side validation errors occur due to custom attributes.

---

## 6. Ten-Minute Pre-Demo Run-Through Schedule

Perform this exact 10-minute check in the green room or demo booth 15 minutes before judging:

| Minute | Step | Verification Objective |
| :---: | :--- | :--- |
| **0:00–1:00** | **Browser Check** | Launch Chrome / Edge. Verify DevTools opens. Set zoom level to 110% or 125% for stage visibility. |
| **1:00–2:00** | **Open Web App** | Open `pii-sanitizer.html`. Verify title, theme, and clean initial layout. |
| **2:00–3:00** | **Verify Sample & Decoys** | Click **"Load noisy sample"**. Verify chips show 16 findings. Confirm decoys are not flagged. |
| **3:00–4:00** | **Verify Modes & Download** | Switch to **Partial**, then **Pseudo**. Click **Download**. Confirm `.txt` file downloads to disk. |
| **4:00–5:00** | **Verify Offline Behavior** | Set DevTools Network tab to **Offline**. Paste synthetic string. Verify detection runs. Set back to No throttling. |
| **5:00–6:00** | **Clear Network & Storage** | Clear DevTools Network log. Check `localStorage` and `IndexedDB` are empty. |
| **6:00–7:00** | **Open Extension Testbed** | In Tab 2, open `extension/test-page.html`. |
| **7:00–8:00** | **Test Extension Scan** | Open Blackout Guard popup. Click **Scan this page**. Verify badges appear and password input has 0 badges. |
| **8:00–9:00** | **Test Extension Wipe & Undo** | Click **Wipe all PII**. Verify `[REDACTED]` appears and React counter updates. Click **Undo**. |
| **9:00–10:00** | **Backup Video Ready** | Minimize backup video window behind the browser. Take a breath. You are 100% ready. |
