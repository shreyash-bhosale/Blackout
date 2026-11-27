/**
 * Normalizes detected entities for consistent intra-document pseudonymization.
 *
 * @param {Object} f - Finding object with type and value
 * @returns {string} Normalized identifier key
 */
function norm(f) {
  if (!f || !f.value) return "";
  if (f.type === "EMAIL") return f.value.toLowerCase();
  if (f.type === "PAN" || f.type === "IP") return f.value.toUpperCase();
  let d = f.value.replace(/\D/g, "");
  if (/^0091\d{10}$/.test(d)) d = d.slice(4);
  else if (/^(?:91|00)\d{10}$/.test(d)) d = d.slice(2);
  else if (/^0\d{10}$/.test(d)) d = d.slice(1);
  return d;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { norm };
}
