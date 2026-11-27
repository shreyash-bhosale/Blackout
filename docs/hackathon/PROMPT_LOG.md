# Blackout — Hackathon Prompt Log (PROMPT_LOG.md)

> **PromptWars &times; NIAT_Pune Cybersecurity & Data Privacy Hackathon**  
> *Requirement: Transparent, authentic record of prompts used during development.*  
> *Authenticity Guarantee: No entries have been fabricated. Prompts below reflect verified files present in the repository.*

---

## 1. Prompt Engineering Log

| No. | Date and time | Tool or model | Prompt (verbatim) | What it produced | What I changed by hand |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | 2026-11-27 (Repository File: `Prompt/Blackout_Apple_Inspired_UI_UX_Master_Prompt.md`) | Antigravity AI Assistant | `Act as a world-class: Principal Product Designer, Senior UI/UX Designer, Frontend Architect, Interaction Designer, Motion Graphics Designer, GSAP Animation Specialist, Accessibility Engineer, Performance Engineer, Quality Assurance Engineer. Your task is to transform the existing Blackout project into a polished, premium, production-quality web experience. You are working inside an existing codebase. First inspect the entire project, understand its architecture, identify its existing functionality, and then implement the redesign. Do not simply create a visual mockup. Build a fully functional product with working interactions, real data, responsive layouts, smooth animations, and reliable user feedback.` *(Excerpt; full master prompt preserved in `Prompt/Blackout_Apple_Inspired_UI_UX_Master_Prompt.md`)* | Complete single-file web platform in `pii-sanitizer.html` containing CSS custom properties, responsive grid layout, theme toggles, dual-pane diff viewer, audit table, insights engine, and local file import/export. | Re-anchored exact `// CORE START` and `// CORE END` pure function boundaries; restored exact comment markers for test harness compatibility; verified zero-network CSP. |
| **2** | 2026-11-27 (Conversation Session Prompt: Blackout Guard Extension Master Prompt) | Antigravity AI Assistant | `Act as a senior browser-extension engineer, JavaScript security engineer, privacy-focused software architect, and quality-assurance engineer. You are working inside an existing Blackout project. Your task is to add a Chrome and Microsoft Edge extension called Blackout Guard, using Manifest V3. Your priorities, in order: 1. Preserve the existing web application's behavior. 2. Reuse the existing PII detection and sanitization logic exactly. 3. Implement the extension requirements without violating the privacy constraints. 4. Make scanning, wiping, and undo predictable and testable. 5. Verify behavior instead of assuming browser compatibility. 6. Document limitations and unverified behavior honestly.` | `extension/manifest.json`, `extension/popup.html`, `extension/popup.css`, `extension/popup.js`, `extension/content.js`, `extension/pii-core.js`, `extension/test-page.html`, `extension/README.md`, and automated test suites `tests/extension-core-sync.test.js`, `tests/extension-flow.test.js`, and `tests/extension-hardening.test.js`. | Added React prototype descriptor setters to ensure controlled component state synchronization; integrated Shadow DOM styling isolation for field badges and paste modal; added strict password/hidden input exclusion. |
| **3** | *Awaiting user entry* | *Awaiting user entry* | *[Paste exact user prompt here]* | *[Describe files and code generated]* | *[Describe any manual edits or fixes]* |

---

## 2. Authenticity & Maintenance Notice

> **Critical Submission Requirement:**  
> If earlier or additional prompt history is stored in your personal chat logs or platform session history:  
> **"Add your actual prompts verbatim from your chat history before submission."**  
> Do not retroactively fabricate timestamps, prompt text, or model names.

### Rules for Maintaining This Log:
1. **Record Prompts When Used:** Document prompts in real time as development occurs.
2. **Preserve Exact Wording:** Always copy-paste the exact prompt text without summarization or embellishment.
3. **Record the Tool/Model:** Name the actual model (e.g. Gemini 1.5 Pro, Claude 3.5 Sonnet, GPT-4o) and agent harness used.
4. **Explain What Was Generated:** State the concrete files, functions, or assets produced by the generation turn.
5. **Record Manual Edits:** Explicitly note what was modified, corrected, or rewritten by hand after generation.
6. **Zero Fabrication:** Never invent entries or retroactively construct prompts from memory.
