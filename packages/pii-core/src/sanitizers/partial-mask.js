/**
 * Replaces matching characters in s with 'X' except for the last n matches.
 */
function maskKeep(s, n, re) {
  const chars = s.split("");
  const matchIdxs = [];
  const r = new RegExp(re.source);
  for (let i = 0; i < chars.length; i++) {
    if (r.test(chars[i])) matchIdxs.push(i);
  }
  const keepSet = new Set(matchIdxs.slice(-n));
  for (let i = 0; i < matchIdxs.length; i++) {
    const idx = matchIdxs[i];
    if (!keepSet.has(idx)) chars[idx] = "X";
  }
  return chars.join("");
}

/**
 * Returns a structurally informative partial mask of a finding.
 *
 * @param {Object} f - Finding object
 * @returns {string} Partially masked string
 */
function partial(f) {
  if (!f || !f.value) return "[REDACTED]";
  if (f.type === "CARD" || f.type === "AADHAAR" || f.type === "PHONE") {
    return maskKeep(f.value, 4, /\d/);
  }
  if (f.type === "PAN") {
    return f.value.slice(0, -4).replace(/./g, "X") + f.value.slice(-4);
  }
  if (f.type === "EMAIL") {
    const at = f.value.indexOf("@");
    if (at <= 0) return "[REDACTED]";
    return f.value[0] + "***" + f.value.slice(at);
  }
  if (f.type === "IP") {
    if (f.value.indexOf(".") !== -1) {
      const p = f.value.split(".");
      return p[0] + "." + p[1] + ".X.X";
    }
    const p = f.value.split(":");
    return p[0] + ":XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX";
  }
  return "[REDACTED]";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { maskKeep, partial };
}
