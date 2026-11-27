const { VD, VP } = require("../constants/tables");

/**
 * Validates a 12-digit Aadhaar number using the Verhoeff dihedral group D5 checksum.
 * Discards non-digit characters and ensures first digit is in range 2-9.
 *
 * @param {string} s - Input string
 * @returns {boolean} True if checksum is valid
 */
function verhoeff(s) {
  const d = s.replace(/\D/g, "");
  if (d.length !== 12 || d[0] < "2" || d[0] > "9") return false;
  let c = 0;
  const rev = d.split("").reverse().map(Number);
  for (let i = 0; i < rev.length; i++) {
    c = VD[c][VP[i % 8][rev[i]]];
  }
  return c === 0;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { verhoeff };
}
