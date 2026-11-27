# Development Setup

## Prerequisites
- Any modern web browser (Google Chrome, Microsoft Edge, Brave, Safari, Firefox).
- Node.js (v18+) for running verification test suites.

## Local Execution
Start a lightweight static server:
```bash
python3 -m http.server 8080
```
Open [http://localhost:8080/index.html](http://localhost:8080/index.html) in your browser.

## Testing
Run the master automated test runner:
```bash
node scripts/run-tests.js
```
Or validate architectural boundaries:
```bash
node scripts/validate-structure.js
```
