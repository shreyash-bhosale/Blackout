# Blackout Web Application (`apps/web`)

> Client-side privacy workspace for PII detection, classification, diff inspection, and sanitization.

## Architecture
- **Zero-Network Content Security Policy:** Hardware-enforced `connect-src 'none'`.
- **Zero Persistent Storage:** Transient heap-memory state; automatically purged on tab close or session wipe.
- **WebGL Mesh Drift:** High-performance, GPU-accelerated backdrop providing aesthetic motion with minimal CPU overhead.
- **Reactive Side-by-Side Panes:** Synchronized dual-pane diff with line numbering, category badges, and character counters.
- **Multi-Mode Sanitization:** Full (`[REDACTED]`), Partial (`XXXX 1111`), and Pseudonymization (`CARD_01`).

## Directory Structure
- `index.html`: Web application presentation shell.
- `styles/`: Modular design tokens, layouts, and components.
- `scripts/`: Modular application scripts (WebGL canvas, core integration, and UI controller).
