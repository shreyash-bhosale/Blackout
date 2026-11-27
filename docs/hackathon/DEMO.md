# Blackout — Hackathon Demonstration Script (DEMO.md)

> **PromptWars &times; NIAT_Pune Cybersecurity & Data Privacy Hackathon**  
> *Target Duration: 4 Minutes (with 60-Second Backup)*  
> *Status: Evidence-Based (Reflecting Genuine Implementation)*

---

## 1. Demo Setup & Technical Prerequisites

Before stepping onto the stage or starting the presentation screen share, complete this checklist:

| Check | Item | Verification Action | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Local Web App Ready** | Open `pii-sanitizer.html` directly in Google Chrome / Edge (`file://` protocol). | [ ] Ready |
| 2 | **Console & Network Clean** | Press `F12` / `Cmd+Option+I`. Dock DevTools to the right. Select **Network** tab, check **Preserve log**, and click **Clear** (`🚫`). | [ ] Ready |
| 3 | **Storage Clean** | Select **Application** tab &rarr; Verify `localStorage`, `sessionStorage`, `IndexedDB`, and `Cookies` are completely empty. | [ ] Ready |
| 4 | **Extension Loaded** | Open `chrome://extensions` &rarr; Ensure **Blackout Guard** is loaded unpacked from `./extension` and pinned to toolbar. | [ ] Ready |
| 5 | **Extension Testbed Tab** | Open `extension/test-page.html` in a second browser tab. | [ ] Ready |
| 6 | **Downloads Cleared** | Clear or note the default browser download directory so the exported `.txt` file is instantly visible. | [ ] Ready |
| 7 | **Network Toggle Ready** | Know how to toggle Wi-Fi OFF or select **Offline** in the DevTools Network throttling dropdown. | [ ] Ready |

---

## 2. Four-Minute Master Demonstration Script

```
TIMELINE SUMMARY
[0:00 - 0:25] Beat 1: The Problem & Local Privacy Hook (25s)
[0:25 - 1:45] Beat 2: Core Web Application Demonstration (80s)
[1:45 - 2:30] Beat 3: Privacy & Zero-Network Proof (45s)
[2:30 - 3:20] Beat 4: Blackout Guard Browser Extension (50s)
[3:20 - 3:45] Beat 5: Honest Technical Limitations (25s)
[3:45 - 4:00] Beat 6: Conclusion & Realistic Next Step (15s)
```

---

### Beat 1 — 0:00 to 0:25: Hook (The Privacy Paradox)

- **Time:** 0:00 – 0:25 (25 seconds)
- **Spoken Lines:**
  > "Every single day, engineers, support reps, and researchers accidentally leak sensitive customer data when copying logs, support tickets, and resumes into cloud tools.
  > The irony is that most online sanitization tools ask you to upload your sensitive data to their cloud servers just to redact it.
  > We built **Blackout**: an autonomous, browser-only PII sanitizer where your sensitive text never leaves your device."
- **Action:** Stand by the laptop with `pii-sanitizer.html` open on screen. The interface is clean, dark, and focused.
- **What Judges See:** A clean, Apple-inspired privacy interface with empty input/output panes and zero active network connections.
- **Purpose:** Establish the core problem immediately and state the local-first solution without hyperbolic marketing claims.
- **Caution:** Do not claim Blackout "guarantees compliance" or "makes data completely anonymous." Stick to pattern detection.

---

### Beat 2 — 0:25 to 1:45: Web Application Walkthrough

- **Time:** 0:25 – 1:45 (80 seconds)
- **Spoken Lines:**
  > "Let's load our built-in noisy synthetic sample. With one click, Blackout ingests a messy support log containing credit cards, Aadhaar numbers, PAN cards, IP addresses, emails, and phone numbers.
  > Notice what happened in less than 20 milliseconds:
  > Blackout detected exactly 16 valid PII entities across 6 categories.
  > Crucially, look at what it did *not* flag:
  > In the sample, we planted a 16-digit number that fails the Luhn checksum, an invalid Aadhaar number that fails the Verhoeff dihedral group checksum, a fake PAN with an invalid status letter, and an out-of-range IP address: 999.12.1.5. None of those decoys were flagged. Blackout validates checksums and boundary rules, rather than blindly matching digit counts.
  > Now observe the redaction modes:
  > First, **Full Mask**: every finding is cleanly replaced with `[REDACTED]`.
  > Second, **Partial Mask**: it preserves contextual anchors for debugging—the last four digits of credit cards, the email domain, and the first two octets of IP addresses—while masking the sensitive payload.
  > Third, **Consistent Pseudonymization**: `EMAIL_01` and `CARD_01`. Even if an email appears in mixed casing across multiple lines, Blackout normalizes it so the same entity receives the exact same placeholder.
  > Below, the live Audit Inspection Table logs every detected entity with physical line numbers and replacement previews.
  > Finally, with one click on 'Download Sanitized', Blackout compiles a local UTF-8 file directly from in-memory blobs."
- **Actions:**
  1. Click **"Load noisy sample"**.
  2. Point to the chip counters: *16 detections, 15 unique entities*.
  3. Point to the left diff pane showing highlighted entities, and highlight that decoys (`0000...`, `999.12.1.5`) remain plain text.
  4. Click the radio button for **Partial** mode; observe the sanitized pane instantly update.
  5. Click the radio button for **Pseudonym** mode; observe `EMAIL_01`, `CARD_01` appear consistently.
  6. Scroll down briefly to show the **Audit Inspection Table** with line numbers and filter buttons.
  7. Click **"Download Sanitized (.txt)"**; show the file appearing instantly in the browser download bar.
- **What Judges See:** Instantaneous, synchronized multi-pane highlighting, zero lag, reactive diff views, and an exported file.
- **Purpose:** Demonstrate core detection, validation, multi-mode sanitization, and audit reporting.
- **Note on Unimplemented Features:** If judges ask about custom terms, click-to-jump, or risk scores:
  > *"Custom regex terms, click-to-review scrolling, and numerical risk scoring are documented as future architecture extensions in our PRD, but are intentionally not in this core MVP to maintain zero-dependency pure client determinism."*

---

### Beat 3 — 1:45 to 2:30: Privacy & Zero-Network Proof

- **Time:** 1:45 – 2:30 (45 seconds)
- **Spoken Lines:**
  > "Anyone can claim their software is private. Let's prove it live.
  > I'm opening Chrome Developer Tools on the Network tab.
  > Notice that during the entire loading, scanning, and sanitization workflow, exactly zero network requests were transmitted. No telemetry, no analytics, no fonts, no background fetch.
  > Now let's check browser storage: `localStorage` is empty. `sessionStorage` is empty. `IndexedDB` is empty. Cookies are empty. All processing happens strictly in volatile JavaScript heap memory.
  > To prove this is completely offline, let's set the Network to **Offline**—or pull the Wi-Fi plug entirely.
  > I'll paste new text into the editor. Blackout continues to detect, sanitize, and download without hesitation.
  > Furthermore, our page enforces a strict Content Security Policy meta tag with `connect-src 'none'` and `default-src 'none'`, meaning the browser itself physically blocks any outbound network call."
- **Actions:**
  1. Bring DevTools into view. Show the **Network** tab: zero requests recorded.
  2. Click into the **Application** tab: show `localStorage` (0 items), `IndexedDB` (empty).
  3. In DevTools Network tab, switch the throttling dropdown from **No throttling** to **Offline**.
  4. Type `Emergency contact: rahul@niat.edu.in and 9876543210` into the input textarea.
  5. Show that detection chips, diff panes, and audit rows update in real time while offline.
- **What Judges See:** DevTools proving zero network traffic, zero persistent storage, and 100% functionality while offline.
- **Purpose:** Provide incontrovertible technical proof of the local-first security architecture.

---

### Beat 4 — 2:30 to 3:20: Browser Extension (Blackout Guard)

- **Time:** 2:30 – 3:20 (50 seconds)
- **Spoken Lines:**
  > "A web app helps when you have files, but what about when employees type directly into customer support portals, CRM forms, or web editors?
  > That's why we built **Blackout Guard**, a companion Manifest V3 browser extension.
  > Here is our synthetic testbed page containing standard inputs, an email field, a multi-line textarea, a contenteditable div, and sensitive password and hidden token fields.
  > Let's open the Blackout Guard extension popup and click **'Scan this page'**.
  > Blackout Guard injects our pure detection core on demand. Notice the red outline indicators and 'PII' badges attached via Shadow DOM.
  > In the popup, we see masked previews only—such as `XXXX 1111`—never raw unmasked PII.
  > Crucially, look at the Password and Hidden fields: they have zero badges. Our content script strictly excludes sensitive credential fields before touching their values.
  > Now I select **Full Mask** and click **'Wipe all PII on this page'**.
  > All editable fields are sanitized in place. For modern frameworks like React, we invoke property descriptor prototype setters and dispatch bubbling input events so component state updates cleanly.
  > If a user makes a mistake, one click on **'Undo'** restores the in-memory snapshot immediately."
- **Actions:**
  1. Switch to the tab with `extension/test-page.html`.
  2. Click the **Blackout Guard** icon in the Chrome toolbar.
  3. Click **"Scan this page"**.
  4. Point to the red outlines and Shadow DOM badges next to the text, email, textarea, and contenteditable fields.
  5. Point out that the Password input and Hidden input remain completely untouched.
  6. Click **"Wipe all PII on this page"**. Observe all fields change to `[REDACTED]` and the React state counter update.
  7. Click **"Undo"**. Observe original synthetic values restored.
- **What Judges See:** A native extension scanning, badging, wiping, and restoring live form fields in real time without touching credentials.
- **Purpose:** Demonstrate practical, real-world workflow integration and least-privilege extension architecture.
- **Caution / Fallback:** If the browser extension fails to inject due to browser security settings on stage, say:
  > *"Because extension injection requires active tab permissions, we also provide the verified offline test harness in `tests/extension-flow.test.js` which verifies all 5 DOM and setter flows."*

---

### Beat 5 — 3:20 to 3:45: Honest Technical Limitations

- **Time:** 3:20 – 3:45 (25 seconds)
- **Spoken Lines:**
  > "As security engineers, we believe in radical transparency about what Blackout does and does *not* do:
  > First, Blackout detects structured, pattern-based PII: emails, cards, Aadhaar, PAN, IPs, and phone numbers. Unstructured contextual entities—like person names or physical street addresses—require heavy Natural Language Processing models, which are out of scope for this lightweight zero-dependency release.
  > Second, pattern detection can produce false positives on edge cases, such as 10-digit account numbers that resemble Indian phone numbers.
  > Third, while partial masking and pseudonymization reduce exposure risk, they do not constitute a legal guarantee of full anonymization under GDPR or DPDP.
  > We built Blackout as an effective local-first risk mitigation tool, not a magical compliance silver bullet."
- **Actions:** Bring up the Settings & Privacy tab or point to the disclaimers on screen. Speak clearly and candidly.
- **What Judges See:** A mature, self-aware engineering team that understands privacy law, threat models, and algorithmic limits.
- **Purpose:** Earn maximum credibility with skeptical cybersecurity and compliance judges.

---

### Beat 6 — 3:45 to 4:00: Closing & Future Roadmap

- **Time:** 3:45 – 4:00 (15 seconds)
- **Spoken Lines:**
  > "In summary: Blackout delivers client-side PII detection and redaction across both web applications and live forms with zero network footprint and zero server dependencies.
  > Our next milestone is embedding a compiled client-side WebAssembly ONNX model to bring local Named Entity Recognition for person names without breaking our zero-network promise.
  > Thank you, and we welcome your technical questions."
- **Action:** Open the floor to judges. Keep DevTools visible.
- **What Judges See:** Professional closing slide or clear dashboard view ready for Q&A.

---

## 3. Sixty-Second Backup Demonstration (Lightning Slot)

When judges give a strict 1-minute time limit, use this compressed script:

| Time | Spoken Lines | Exact Actions | What Judges See |
| :---: | :--- | :--- | :--- |
| **0:00–0:10** | "Blackout is a browser-only PII sanitizer. It solves the privacy paradox: sanitizing sensitive logs and text without uploading data to any cloud server." | Open `pii-sanitizer.html`. DevTools Network tab visible. | Clean, dark dashboard. Zero network traffic. |
| **0:10–0:25** | "Clicking 'Load noisy sample' detects 16 valid entities across emails, credit cards, Aadhaar, PAN, IPs, and phones in 15 ms, while rejecting Luhn and Verhoeff decoy numbers." | Click **"Load noisy sample"**. Point to chips and diff pane. | 16 findings detected; invalid decoys ignored; live diff highlighted. |
| **0:25–0:38** | "We can toggle between Full Mask, Partial Mask, and Consistent Pseudonymization, review physical line numbers in the audit log, and export directly via in-memory blobs." | Click **Partial**, then **Pseudo**. Click **Download**. | Reactive diff updates; sanitized `.txt` downloaded locally. |
| **0:38–0:50** | "Our companion Chrome extension brings this to live web forms, wiping inputs and intercepting pastes without ever reading password fields." | Switch to `test-page.html`, open popup, click **Scan**, then **Wipe**. | Input fields redacting in place with Shadow DOM badges. |
| **0:50–1:00** | "Every byte is processed locally in browser RAM with zero network requests and strict CSP. We detect structured PII today, with local WASM NER planned next. Thank you!" | Point to DevTools Network tab showing 0 requests. | Proof of zero network calls. |

---

## 4. Emergency Contingency Protocols

| Failure Scenario | Immediate Action | Spoken Fallback |
| :--- | :--- | :--- |
| **Browser Crashes or Closes** | Re-open Chrome, double-click `pii-sanitizer.html` from the project folder. Takes 3 seconds. | *"Because Blackout has zero build steps and zero servers, recovering is as fast as opening any HTML file."* |
| **Extension Doesn't Inject** | Switch to `tests/` in terminal, run `node tests/extension-flow.test.js`. | *"Our extension flow is backed by 5 automated headless DOM tests covering field discovery, password protection, and React setters."* |
| **Sample Doesn't Load** | Paste backup sample from `Prompt/Blackout_PRD.md` or type a quick string: `test@corp.com, card 4111 1111 1111 1111`. | *"We can paste any raw text directly into the editor for instant real-time scanning."* |
| **Projector Fails / Screen Disconnects** | Have a team member show the backup 2-minute video on an iPad/laptop screen directly to the judges. | *"While the AV is resetting, here is our 2-minute verified screen recording showing live execution."* |
