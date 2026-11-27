# Blackout: API and Endpoints

## 1. Summary

**Blackout has no HTTP API and no server endpoints.** There is no backend, so there are no routes to call, no authentication, and no request or response bodies on a network.

This is deliberate. The challenge requires that sensitive text is detected and redacted entirely on the client side, without sending data to any external server. The Content-Security-Policy in the page (`connect-src 'none'`) makes the browser block network connections from the page.

What the project does have is:

1. An **internal function interface**: the pure JavaScript functions that do the work (Section 2).
2. A set of **browser APIs** it relies on (Section 3).
3. A user-facing **interface contract** for inputs, outputs and errors (Section 4).

If a judge asks "what are your endpoints?", the accurate answer is: none, by design, and you can show it with the browser's Network tab.

## 2. Internal function interface

All logic lives in `pii-sanitizer.html`. The pure functions sit between the `// CORE START` and `// CORE END` comments and use no DOM, so they can be tested in Node (see `ARCHITECTURE.md`, Section 9).

### 2.1 `detect(text)`

Finds PII in a string.

| | |
|---|---|
| Input | `text`: string |
| Output | Array of findings, sorted by `start`, non-overlapping |
| Side effects | None |

Finding shape:

```js
{
  type:  'EMAIL' | 'CARD' | 'AADHAAR' | 'PAN' | 'IP' | 'PHONE',
  start: number,   // offset in text
  end:   number,   // exclusive
  value: string,   // matched original text
  pri:   number    // index of the matching detector (lower wins conflicts)
}
```

Example:

```js
detect('Mail amit@test.in or call 9876543210');
// [
//   { type: 'EMAIL', start: 5,  end: 17, value: 'amit@test.in', pri: 0 },
//   { type: 'PHONE', start: 26, end: 36, value: '9876543210',   pri: 6 }
// ]
```

### 2.2 `sanitize(text, findings, mode)`

Builds the redacted text.

| | |
|---|---|
| Input | `text`: string; `findings`: array returned by `detect(text)` for the same text; `mode`: `'full'`, `'partial'` or `'pseudo'` |
| Output | `{ text: string, reps: string[] }` where `reps[i]` replaces `findings[i]` |
| Side effects | None. Pseudonym mappings exist only during the call |

Passing findings from a different text than `text` produces wrong output; the function does not check this.

Example:

```js
const f = detect(text);
const { text: clean, reps } = sanitize(text, f, 'partial');
```

Mode behavior:

| Mode | Result |
|---|---|
| `full` | `[REDACTED]` for every finding |
| `partial` | Type-specific masking (for example `XXXX XXXX XXXX 1111`, `r***@example.com`, `192.168.X.X`) |
| `pseudo` | `EMAIL_01`, `PHONE_02` and so on; the same normalized value always gets the same placeholder within one call |

### 2.3 Validators

| Function | Input | Output | Rule |
|---|---|---|---|
| `luhn(s)` | string | boolean | Digits only, length 13 to 19, not all one repeated digit, passes the Luhn checksum |
| `verhoeff(s)` | string | boolean | Digits only, exactly 12 digits, passes the Verhoeff checksum |

### 2.4 Helpers

| Function | Purpose |
|---|---|
| `maskKeep(s, n, re)` | Replaces every character matching `re` with `X` except the last `n` such characters; other characters are kept |
| `partial(finding)` | Partial-mask string for one finding |
| `norm(finding)` | Normalized key used to decide whether two findings are the same value for pseudonymization |

### 2.5 Using it from Node (for tests)

```js
const fs = require('fs');
const html = fs.readFileSync('pii-sanitizer.html', 'utf8');
const core = html.match(/\/\/ CORE START([\s\S]*?)\/\/ CORE END/)[1];
const { detect, sanitize, luhn, verhoeff } =
  new Function(core + '; return { detect, sanitize, luhn, verhoeff }')();
```

The functions are not published as a package or ES module. They are plain functions inside a classic script. Whether they can be called by name from the browser console was not verified.

## 3. Browser APIs used

| API | Used for | Failure handling |
|---|---|---|
| `File.text()` | Reading an opened .txt or .csv locally | Shows "Could not read that file." |
| `Blob`, `URL.createObjectURL`, `<a download>` | Download of the sanitized file | Not verified in every browser; Copy is the fallback |
| `navigator.clipboard.writeText` | Copy sanitized text | Shows a message suggesting Download if the browser blocks it |
| `setTimeout` | 120 ms debounce on typing | None needed |

Network APIs (`fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`) are not used, and the CSP would block them if they were.

## 4. User-facing interface contract

### Inputs

| Input | Accepted | Limits |
|---|---|---|
| Pasted text | Any text | No hard limit in code; very large inputs not performance tested |
| File | `.txt` or `.csv`, chosen by file extension | 5 MB maximum |
| Redaction mode | Full, partial, pseudonymize | Exactly one selected |

### Outputs

| Output | Format |
|---|---|
| Side-by-side diff | HTML, escaped, with colored highlights per type |
| Counts | Total, per type, and unique values |
| Audit table | Type, line number, original value, replacement (first 500 rows) |
| Download | `<name>.sanitized.txt` or `<name>.sanitized.csv`, UTF-8 |
| Clipboard | Sanitized text |

### Error messages shown to the user

| Condition | Message |
|---|---|
| Wrong file type | "Only .txt and .csv files are supported." |
| File over 5 MB | "File is larger than 5 MB." |
| File read failure | "Could not read that file." |
| Clipboard blocked | "Copy blocked by the browser; use Download instead." |

## 5. If an HTTP API were ever needed (proposal, not implemented)

None of this exists. It is documented so the trade-off is clear.

A hosted endpoint would mean the user's sensitive text travels to a server, which **contradicts the core promise of this product**. Prefer these alternatives first:

1. Publish the core as a **local library** (for example an npm package) so developers can call `detect` and `sanitize` in their own process.
2. Build a **browser extension** that sanitizes text locally before the user pastes it into a web form.
3. Offer a **self-hosted CLI** that runs on the user's own machine.

If a server API is ever required, a minimal design sketch:

| | |
|---|---|
| Endpoint | `POST /v1/sanitize` |
| Request | `{ "text": string, "mode": "full" \| "partial" \| "pseudo" }` |
| Response | `{ "text": string, "findings": [{ "type": string, "line": number }] }` (no original values) |
| Requirements | TLS, authentication, rate limiting, a request size cap, no logging of request bodies, no storage of text, and the product copy updated so it no longer claims that data never leaves the browser |

This sketch has not been designed in detail, built or security reviewed.

## 6. Questions for the team

1. Is any server-side component actually required by the challenge? The brief says the opposite.
2. If integrations matter, would a local library or browser extension satisfy them without breaking the privacy promise?

## 7. Blackout Guard Extension IPC Message Interface

The browser extension establishes internal communication between `popup.js` and `content.js` via `chrome.tabs.sendMessage`:

### 1. `SCAN`
- **Direction:** `popup.js` -> `content.js`
- **Request:** `{ action: "SCAN" }`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "fieldsScanned": 5,
      "framesScanned": 1,
      "skippedOversized": 0,
      "totalFindings": 4,
      "categoryCounts": { "EMAIL": 2, "CARD": 1, "PAN": 1 },
      "previews": [{ "type": "EMAIL", "masked": "a***@corp.in" }],
      "undoAvailable": false
    }
  }
  ```

### 2. `WIPE`
- **Direction:** `popup.js` -> `content.js`
- **Request:** `{ action: "WIPE", mode: "full" | "partial" | "pseudo" | "delete" }`
- **Response:**
  ```json
  {
    "success": true,
    "wipedCount": 3,
    "undoAvailable": true
  }
  ```

### 3. `UNDO`
- **Direction:** `popup.js` -> `content.js`
- **Request:** `{ action: "UNDO" }`
- **Response:**
  ```json
  {
    "success": true,
    "restoredCount": 3
  }
  ```

### 4. `SET_GUARD_MODE`
- **Direction:** `popup.js` -> `content.js`
- **Request:** `{ action: "SET_GUARD_MODE", enabled: true | false, mode: "full" | "partial" | "pseudo" | "delete" }`
- **Response:** `{ "success": true, "enabled": boolean }`

### 5. `GET_GUARD_MODE`
- **Direction:** `popup.js` -> `content.js`
- **Request:** `{ action: "GET_GUARD_MODE" }`
- **Response:** `{ "success": true, "enabled": boolean }`
