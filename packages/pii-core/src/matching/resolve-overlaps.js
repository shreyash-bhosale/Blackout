const { DETECTORS } = require("../detectors/index");

/**
 * Scans text using ordered detectors and resolves overlapping intervals.
 * Returns sorted, non-overlapping finding candidates.
 *
 * @param {string} text - Raw input text
 * @returns {Array<Object>} Accepted findings sorted by physical start offset
 */
function detect(text) {
  if (!text || typeof text !== "string") return [];
  const candidates = [];
  for (let pri = 0; pri < DETECTORS.length; pri++) {
    const d = DETECTORS[pri];
    const regex = new RegExp(d.re.source, d.re.flags);
    let m;
    while ((m = regex.exec(text)) !== null) {
      const val = m[0];
      if (d.ok && !d.ok(val)) continue;
      candidates.push({
        type: d.type,
        start: m.index,
        end: m.index + val.length,
        value: val,
        pri: pri
      });
      if (regex.lastIndex === m.index) regex.lastIndex++;
    }
  }

  candidates.sort(function(a, b) {
    if (a.pri !== b.pri) return a.pri - b.pri;
    return (b.end - b.start) - (a.end - a.start);
  });

  const used = new Uint8Array(text.length);
  const accepted = [];
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    let overlap = false;
    for (let k = c.start; k < c.end; k++) {
      if (used[k]) {
        overlap = true;
        break;
      }
    }
    if (!overlap) {
      for (let k = c.start; k < c.end; k++) used[k] = 1;
      accepted.push(c);
    }
  }

  accepted.sort(function(a, b) {
    return a.start - b.start;
  });
  return accepted;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { detect };
}
