const { partial } = require("./partial-mask");
const { norm } = require("../normalization/normalize");

/**
 * Performs sanitization on text given findings in 'full', 'partial', or 'pseudo' mode.
 *
 * @param {string} text - Source text
 * @param {Array} findings - Non-overlapping finding items
 * @param {string} mode - 'full' | 'partial' | 'pseudo'
 * @returns {{ text: string, reps: Array<string> }} Sanitized text and replacements array
 */
function sanitize(text, findings, mode) {
  if (!text || typeof text !== "string") return { text: "", reps: [] };
  if (!findings || !Array.isArray(findings) || findings.length === 0) {
    return { text: text, reps: [] };
  }
  const map = new Map();
  const cnt = {};
  const reps = [];
  let out = "";
  let lastIdx = 0;

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    out += text.slice(lastIdx, f.start);
    let rep = "";
    if (mode === "full") {
      rep = "[REDACTED]";
    } else if (mode === "partial") {
      rep = partial(f);
    } else if (mode === "pseudo") {
      const key = f.type + "|" + norm(f);
      if (map.has(key)) {
        rep = map.get(key);
      } else {
        cnt[f.type] = (cnt[f.type] || 0) + 1;
        const numStr = String(cnt[f.type]).padStart(2, "0");
        rep = f.type + "_" + numStr;
        map.set(key, rep);
      }
    } else {
      rep = "[REDACTED]";
    }
    reps.push(rep);
    out += rep;
    lastIdx = f.end;
  }
  out += text.slice(lastIdx);
  return { text: out, reps: reps };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { sanitize };
}
