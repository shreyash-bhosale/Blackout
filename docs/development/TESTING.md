# Testing Guide

Blackout includes automated test suites covering unit algorithms, platform hardening, integration flows, and extension behavior.

## Test Commands
- **Master Test Runner:** `node scripts/run-tests.js`
- **Core Unit Tests:** `node tests/core.test.js`
- **Platform Hardening & CSP:** `node tests/hardening.test.js`
- **Integration & Diff Logic:** `node tests/integration.test.js`
- **Extension Core Parity:** `node tests/extension-core-sync.test.js`
- **Extension DOM Logic:** `node tests/extension-flow.test.js`
- **Extension Security:** `node tests/extension-hardening.test.js`
- **Architectural Integrity:** `node scripts/validate-structure.js`
