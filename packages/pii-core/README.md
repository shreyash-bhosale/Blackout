# @blackout/pii-core

> Canonical, pure-JavaScript PII detection, classification, and sanitization engine.

## Architectural Principles
- **100% Pure JavaScript:** Zero DOM dependencies, zero node-specific APIs, zero external packages.
- **Mathematical Integrity:** Algorithmic verification via Luhn checksum and Verhoeff dihedral group $D_5$ permutations.
- **Deterministic & Ephemeral:** Pure state transitions without persistent storage or side effects.
- **Universal Portability:** Seamlessly consumable by Node.js test suites, browser runtimes (`apps/web`), and Chrome/Edge extensions (`extensions/blackout-guard`).

## API Reference
- `detect(text)`: Scans input text and returns non-overlapping, prioritized PII findings.
- `sanitize(text, findings, mode)`: Transforms text according to `'full'`, `'partial'`, or `'pseudo'` modes.
- `verhoeff(str)`: Verhoeff checksum algorithm for 12-digit Aadhaar identifiers.
- `luhn(str)`: Luhn checksum formula for credit/debit card numbers.
- `partial(finding)`: Produces masked representations preserving structural debugging context.
- `norm(finding)`: Normalizes entities for consistent intra-document pseudonymization.
