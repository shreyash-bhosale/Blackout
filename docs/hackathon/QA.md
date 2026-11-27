# Blackout — Technical Judge Q&A Guide (QA.md)

> **PromptWars &times; NIAT_Pune Cybersecurity & Data Privacy Hackathon**  
> *Objective: Direct, credible, honest technical answers for judges and technical auditors.*  
> *Voice: First-person plural ("We"), concise, technically grounded, zero marketing inflation.*

---

## 1. Product & Problem

### Q1: What problem does Blackout solve?
**Answer:**  
We solve the "privacy paradox" of data redaction. Developers, IT staff, support agents, and researchers frequently need to sanitize sensitive documents—such as server logs, customer tickets, resumes, or CSV data—before sharing them with team members, vendors, or LLMs. However, almost all existing online redaction tools require users to upload their sensitive files to an external cloud server, which itself creates a severe data exposure risk. Blackout inverts this model: all detection, checksum validation, and text redaction execute entirely inside the user's browser, meaning sensitive text never leaves their local device.

### Q2: Who would use it?
**Answer:**  
Our primary users are:
1. **Software & DevOps Engineers:** Cleaning application stack traces, auth tokens, database logs, and IP addresses before posting to Slack, GitHub, or issue trackers.
2. **Customer Support Specialists:** Redacting customer emails, phone numbers, and payment details before escalating tickets to engineering.
3. **Data Science & AI Researchers:** Sanitizing local CSV datasets and text corpora before passing prompts to third-party commercial LLM APIs.
4. **Compliance & HR Teams:** Masking national identity numbers (Aadhaar, PAN) and contact information in candidate resumes or internal records.

### Q3: Why is this problem important?
**Answer:**  
Data breaches frequently occur not through sophisticated zero-day exploits, but through routine operational carelessness—pasting a production log with real credit card numbers into a public forum or unvetted web tool. Furthermore, strict regulatory frameworks like India's DPDP Act and the EU's GDPR impose heavy financial and legal penalties for unauthorized processing or transmission of personal data. A local-first utility completely eliminates third-party transmission liability during data preparation.

### Q4: What makes Blackout different from online redaction tools?
**Answer:**  
Three key architectural differences:
1. **Physical Zero-Network Execution:** Traditional tools use client-server architectures with backends running Python or Node. Blackout is delivered as a single static file with an enforced Content Security Policy (`connect-src 'none'`) that physically bars outbound network traffic.
2. **Algorithmic Validation:** Rather than relying purely on loose regular expressions, we implement mathematical checksums (Luhn for credit cards and Verhoeff dihedral group $D_5$ for Aadhaar), drastically reducing false positives.
3. **Dual Form-Factor:** In addition to the standalone web utility, we provide **Blackout Guard**, a Manifest V3 browser extension that brings the identical detection engine directly to live form inputs on the web.

### Q5: What happens when a user enters unsupported information?
**Answer:**  
If a user inputs personal information that does not match one of our 8 supported pattern detectors (for example, a person's name, home street address, medical condition, or passport number), Blackout will not flag or redact it. It remains untouched in the sanitized output. We explicitly state this boundary on screen so users never mistake Blackout for a universal anonymization tool.

---

## 2. Architecture & Privacy

### Q6: Why did you choose a browser-only architecture?
**Answer:**  
Because the absolute best way to secure sensitive data is to never transmit or store it in the first place. By running entirely in client-side JavaScript, we eliminate server infrastructure, database storage, TLS transit risks, cloud vendor compromise vectors, and remote logging. The user's device is the only environment that ever touches the raw data.

### Q7: Why is there no backend?
**Answer:**  
A backend is completely unnecessary for pattern detection, checksum validation, and string replacement. Modern browser JavaScript engines (V8, JavaScriptCore, SpiderMonkey) easily process tens of thousands of lines of text in milliseconds. Adding a backend would introduce latency, operational costs, network dependency, attack surfaces, and legal compliance obligations while providing zero user benefit.

### Q8: How do you know data does not leave the browser?
**Answer:**  
We verify this through four concrete technical layers:
1. **Code Audit:** There are zero instances of `fetch()`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon()`, or dynamic script loaders in our codebase, verified by automated regex scanning in `tests/hardening.test.js` and `tests/extension-hardening.test.js`.
2. **Content Security Policy (CSP):** The HTML includes `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; img-src data:;">`. Even if malicious text attempted to trigger an outbound request, the browser's networking engine blocks it unconditionally.
3. **Live Network Monitoring:** Inspecting the browser's Developer Tools Network tab during execution shows exactly zero HTTP/HTTPS requests.
4. **Offline Capability:** Disabling Wi-Fi or setting Network Throttling to "Offline" does not degrade or halt application processing in any way.

### Q9: Does Blackout store original documents?
**Answer:**  
No. Blackout does not access `localStorage`, `sessionStorage`, `IndexedDB`, or browser `Cookies`. All text, parsed tokens, and intermediate detection structures exist exclusively in temporary JavaScript heap memory. When the user closes the tab or refreshes the page, the memory is reclaimed by the browser's garbage collector.

### Q10: Does it use AI or external APIs?
**Answer:**  
No. Blackout does not call OpenAI, Anthropic, Google Gemini, or any remote AI model. All detection is deterministic, rule-based, and algorithmic. This ensures zero latency, zero API costs, full offline operation, and 100% predictable, reproducible outputs.

### Q11: What happens when the internet is disabled?
**Answer:**  
The application operates identically. Because there are no external dependencies, CDNs, or web fonts, pulling the network cable or operating in an air-gapped environment results in zero loss of functionality.

### Q12: What does the Content Security Policy do?
**Answer:**  
Our CSP meta tag establishes a strict sandbox boundary enforced by the browser kernel:
- `connect-src 'none'`: Drops all outbound network attempts (fetch, XHR, WebSocket, Beacon).
- `default-src 'none'`: Disallows loading any external resources by default.
- `style-src 'unsafe-inline'` & `script-src 'unsafe-inline'`: Allows only inline CSS and JavaScript bundled directly in the file.
- `img-src data:`: Allows only local inline SVG/data URIs.

### Q13: Does local processing guarantee privacy?
**Answer:**  
Local processing guarantees that the *application itself* does not transmit, leak, or store your data. However, it does not guarantee absolute privacy against external vectors outside our control—such as host-level keyloggers, screen recording spyware, malicious third-party browser extensions with broad permissions, or shoulder surfing. Security is defense-in-depth; Blackout secures the application layer completely.

---

## 3. Detection & Accuracy

### Q14: How does PII detection work?
**Answer:**  
Detection operates via a deterministic pipeline:
1. **Pattern Matching:** Input text is evaluated against 8 prioritized regular expression rules using negative lookbehind and lookahead assertions to avoid matching digit fragments.
2. **Algorithmic Validation:** Candidates matching credit card or Aadhaar patterns are passed through dedicated mathematical checksum routines.
3. **Disjoint Interval Resolution:** Candidate findings are sorted by detector priority (0 to 7) and length descending. Candidates are resolved greedily into disjoint non-overlapping spans.

### Q15: Why did you choose pattern matching and validation instead of AI?
**Answer:**  
Three reasons:
1. **Privacy & Independence:** Running an LLM requires either sending text to a cloud server (violating our core promise) or bundling multi-gigabyte local models that crash standard browsers.
2. **Speed & Efficiency:** Deterministic regex and checksums process 50,000 lines of text in under 25 milliseconds with zero hardware acceleration requirements.
3. **Determinism:** Regex and checksum algorithms produce 100% reproducible results with no hallucinations or non-deterministic variance.

### Q16: How do you validate credit card numbers?
**Answer:**  
Candidate numbers containing 13 to 19 digits (with optional single spaces or hyphens) must satisfy two conditions:
1. **Luhn Algorithm (Modulus 10):** Doubling every second digit from right to left, summing the digits, and verifying the total is divisible by 10.
2. **Decoy Rejection:** Repeated-digit strings (e.g. `0000 0000 0000 0000` or `1111 1111 1111 1111`), which mathematically pass Luhn, are explicitly identified and rejected.

### Q17: How do you validate Aadhaar-format values?
**Answer:**  
A candidate 12-digit sequence (with optional 4-4-4 grouping) must satisfy:
1. First digit must be between 2 and 9 (UIDAI standard).
2. Must validate against the **Verhoeff checksum algorithm**, which operates over the non-commutative dihedral group $D_5$ using permutation and multiplication tables. This catches all single-digit entry errors and adjacent transposition errors.

### Q18: How do you validate PAN-format values?
**Answer:**  
Indian Permanent Account Numbers follow the format `[A-Z]{5}[0-9]{4}[A-Z]`. Beyond the character pattern, our detector enforces the official Income Tax Department 4th-character tax status requirement: the fourth character must strictly be one of `P` (Individual), `C` (Company), `H` (HUF), `F` (Firm), `A` (AOP), `T` (Trust), `B` (BOI), `L` (Local Authority), `J` (Artificial Juridical Person), or `G` (Government). Strings with arbitrary letters like `ABCXE1234F` are rejected.

### Q19: What about false positives?
**Answer:**  
False positives occur when a non-sensitive string matches both the structure and checksum of a supported entity. For example, a 10-digit customer order number or database ID starting with 6–9 could match the Indian mobile pattern. We mitigate false positives through checksums (Luhn and Verhoeff), strict digit boundary assertions (`(?<!\d)` and `(?!\d)`), and PAN 4th-character validation.

### Q20: What about false negatives?
**Answer:**  
False negatives occur when sensitive data is structured abnormally or obfuscated (e.g. spelling out numbers in words "four one one one", non-standard punctuation, or compressed IPv6 addresses like `::1`). Contextual entities (person names, home addresses) are also not detected by design.

### Q21: How did you measure detection accuracy?
**Answer:**  
"We have tested selected valid patterns and deliberate decoys, but we have not established a statistically representative precision or recall score."  
To establish formal precision/recall metrics, we would need to benchmark the system against a standardized, labeled multi-thousand document benchmark dataset (such as the Enron email dataset or synthetic HIPAA/GDPR corpora) across varied domains. Our current automated test suite verifies 100% accuracy against our curated positive test fixtures and deliberate decoy fixtures.

### Q22: Can the application detect names and addresses?
**Answer:**  
No. Person names and street addresses are unstructured and context-dependent. Detecting them reliably requires Named Entity Recognition (NER) trained on linguistic context. Attempting to match names with regular expressions leads to massive false-positive rates on common dictionary words. We document this honestly as a known boundary.

### Q23: Can it detect compressed IPv6?
**Answer:**  
No. Our detector currently matches full eight-group hexadecimal IPv6 addresses (e.g. `2001:0db8:85a3:0000:0000:8a2e:0370:7334`). Compressed forms using double-colon abbreviations (like `::1` or `fe80::1`) are not currently matched by the static regex.

### Q24: Can it detect every possible phone number?
**Answer:**  
No. We support standard 10-digit Indian mobile numbers (with optional `+91`, `0091`, or `0` prefix) and international numbers starting with a `+` and non-91 country code. Local fixed-line numbers without country codes, non-standard extension formats, or vanity numbers (e.g. `1-800-FLOWERS`) are not detected.

### Q25: What is the difference between finding a pattern and proving that a value belongs to a real person?
**Answer:**  
Blackout identifies **syntactic form and mathematical validity**, not real-world identity association. For example, `4111 1111 1111 1111` is a synthetic Visa test card number that passes the Luhn checksum, so Blackout redacts it. Blackout does not connect to Visa or credit bureaus to check if an account exists. In privacy defense, redacting any validly formatted credential prevents exposure regardless of whether the account is currently active.

---

## 4. Risk Scoring & Classification

### Q26: How is the risk score calculated?
**Answer:**  
A numerical risk score is **not currently implemented** in the web application or browser extension. The PRD discusses risk scoring as a conceptual triage heuristic, but our production build focuses strictly on verified entity counting, category aggregation, and distribution metrics.

### Q27: Why are different PII categories weighted differently?
**Answer:**  
In risk analysis, different categories carry different threat levels. For instance, direct financial credentials (credit cards) or national biometric identifiers (Aadhaar) present immediate fraud and identity theft threats, whereas an IP address or business email presents lower direct compromise severity. However, because we have not implemented a formal numerical score, we present raw category counts and allow the human auditor to assess impact.

### Q28: Is the score an industry standard?
**Answer:**  
No. Even where risk scoring heuristics are proposed in cybersecurity literature, there is no universally accepted ISO or NIST standard for a single "document risk score." Any single-number score is an arbitrary heuristic, which is why Blackout prioritizes transparent entity counting over opaque risk scores.

### Q29: Does a low score mean a document is safe?
**Answer:**  
No. Even a single leaked credit card number or private email can lead to severe compromise. Users should never treat heuristic metrics as a safety certificate.

---

## 5. Redaction Modes & Integrity

### Q30: What are the three redaction modes?
**Answer:**  
1. **Full Mask (`full`):** Replaces every finding with `[REDACTED]`. Best for external public disclosure.
2. **Partial Mask (`partial`):** Preserves minimal structural characters (e.g. last 4 digits of cards/phones/Aadhaar, email domain, first two IP octets) so engineers can correlate logs while obscuring sensitive data.
3. **Consistent Pseudonymization (`pseudo`):** Replaces entities with sequential category-specific identifiers (`EMAIL_01`, `CARD_01`).

*(Note: Blackout Guard browser extension also provides a 4th mode: **Delete**, which strips detected spans entirely).*

### Q31: What is pseudonymization?
**Answer:**  
Pseudonymization replaces private identifiers with non-identifying artificial aliases (pseudonyms) such that the data cannot be attributed to a specific person without additional separate information.

### Q32: Why does consistent pseudonymization matter?
**Answer:**  
Consistency ensures referential integrity within a dataset. If `alice@cybercorp.in` appears on lines 4, 12, and 85, replacing all occurrences with `EMAIL_01` allows developers and analytics pipelines to trace user sessions, debug multi-step workflows, and observe entity interactions without ever knowing Alice's real identity. Our `norm()` function guarantees that case variants (`Alice@corp.com` vs `alice@CORP.COM`) map to the exact same pseudonym.

### Q33: Can partially masked values still identify someone?
**Answer:**  
Yes. Under certain conditions, partial masking may leave enough quasi-identifiers (such as a unique corporate domain `john***@rarestartup.io` or combined last-4 card digits) to allow re-identification via linkage attacks. Partial masking is an engineering compromise for debugging, not an anonymization guarantee.

### Q34: Does a successful re-scan prove a document is anonymous?
**Answer:**  
No. A clean re-scan only proves that **no known patterns remain** among the 8 supported detectors. It does not prove that contextual PII (names, employer, locations) has been eliminated. We strictly state "No supported PII patterns detected" rather than "The document is safe."

---

## 6. Browser Extension (Blackout Guard)

### Q35: Can Blackout Guard work on any website?
**Answer:**  
It works on standard HTML pages with standard editable form fields. However, browser security models strictly prohibit extensions from running on browser internal pages (`chrome://*`, `edge://*`, `about:*`) and web store domains (`chromewebstore.google.com`). On these pages, Blackout Guard detects the restriction and displays an explicit notice.

### Q36: Which input types are supported?
**Answer:**  
We support:
- `<input>` elements of type `text`, `email`, `tel`, `search`, and `url`.
- `<textarea>` multi-line inputs.
- Elements with `contenteditable="true"` or `contenteditable=""`.

### Q37: What happens to password fields?
**Answer:**  
Password inputs (`<input type="password">`) are **strictly excluded** in `content.js` before any property or value is accessed. They are never read, never scanned, never highlighted, and never modified.

### Q38: What happens to hidden fields?
**Answer:**  
Hidden inputs (`<input type="hidden">`) frequently contain CSRF tokens, session IDs, or state parameters. Reading or modifying them would break web application security and functionality. They are strictly excluded before value access.

### Q39: Does it support iframes?
**Answer:**  
It supports **same-origin iframes**, where the parent document has permission to inspect child frame DOM trees. It does not inspect cross-origin iframes due to browser-enforced cross-origin security boundaries.

### Q40: Does it support Google Docs or canvas-based editors?
**Answer:**  
No. Google Docs and similar modern collaborative suites render documents onto an HTML5 `<canvas>` element rather than standard DOM text nodes. Canvas pixels cannot be selected, scanned, or replaced via DOM text manipulation.

### Q41: Does it support React-controlled inputs?
**Answer:**  
Yes. Modern reactive frameworks (React, Vue, Angular) override input `.value` property setters. If an extension simply assigns `el.value = x`, the internal component state is not updated. Blackout Guard looks up the native prototype descriptor (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set`), applies the value, and dispatches synthetic bubbling `input` and `change` events so component state updates properly.

### Q42: Does Undo always work?
**Answer:**  
Undo works for fields wiped within the active page session by restoring an in-memory snapshot. However, if the user reloads the tab, navigates to a new URL, or closes the tab, the in-memory snapshot is discarded to prevent sensitive data lingering in RAM.

### Q43: How are browser permissions handled?
**Answer:**  
Blackout Guard enforces strict least privilege under Manifest V3:
- Only declares `["activeTab", "scripting"]`.
- `activeTab` only activates when the user clicks the extension popup.
- Zero host permissions (no `<all_urls>`).
- Zero background service workers.
- Zero storage permissions.

---

## 7. Compliance & Future Roadmap

### Q44: Is Blackout GDPR compliant?
**Answer:**  
"We are not claiming GDPR or DPDP compliance. Blackout is a prototype that helps detect and redact selected PII patterns locally. Formal compliance requires broader legal, organizational, technical, and operational controls."  
What Blackout *does* provide is a technical tool that dramatically lowers GDPR violation risks by preventing accidental data transmission during text preparation.

### Q45: Is Blackout DPDP compliant?
**Answer:**  
Similarly, we make no legal claim of DPDP compliance. However, by supporting India-specific identifiers (Aadhaar with Verhoeff validation, PAN with tax category validation, and Indian mobile numbering rules), Blackout directly addresses the primary data elements governed by India's Digital Personal Data Protection Act.

### Q46: Can it replace a professional data anonymization solution?
**Answer:**  
No. Enterprise anonymization suites (such as differential privacy engines or k-anonymity pipelines) involve complex statistical transformations, risk modeling, and full-corpus NER. Blackout is a focused, client-side triage and redaction tool designed for fast operational hygiene.

### Q47: What are the current limitations?
**Answer:**  
1. No contextual entity detection (names, physical addresses, organization names).
2. Compressed IPv6 notation (`::1`) is not detected.
3. Phone detection is format-based and can match 10-digit serial numbers starting with 6–9.
4. Canvas-based editors (Google Docs) cannot be scanned by the extension.
5. In-memory undo snapshots are destroyed on page reload.

### Q48: What would you build next?
**Answer:**  
Our immediate engineering roadmap:
1. **Local WebAssembly NER:** Compiling a quantized, lightweight ONNX model (e.g. TinyBERT or MobileBERT) to WebAssembly to perform client-side Named Entity Recognition for person names without breaking the zero-network constraint.
2. **Compressed IPv6 Expansion:** Adding parser logic to expand `::` notation before regex evaluation.
3. **Structured PDF Export:** Allowing users to import and redact text extracted from local PDF documents using client-side `pdf.js`.
