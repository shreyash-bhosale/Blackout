# Blackout Security & Privacy Architecture

## Non-Negotiable Tenets
1. **100% Client-Side Processing:** All pattern detection, Luhn card verification, and Verhoeff Aadhaar verification execute locally in tab memory.
2. **Zero Network Transmission:** An enforced Content Security Policy (`connect-src 'none'`) guarantees no data leaves the browser.
3. **Zero Persistent Storage:** No `localStorage`, `sessionStorage`, `IndexedDB`, or cookies are ever accessed for PII storage.
4. **Least Privilege Manifest V3:** The Blackout Guard extension declares only `activeTab` and `scripting` permissions, with zero host permissions or background listeners.
5. **DOM Form Field Safety:** Inputs of type `password` and `hidden` are strictly excluded prior to value inspection.
