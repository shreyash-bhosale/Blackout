/**
 * Validates payment card numbers (13-19 digits) using the Luhn mod-10 algorithm.
 * Rejects repeated-digit decoys (e.g., 1111111111111111).
 *
 * @param {string} s - Input string
 * @returns {boolean} True if valid card number
 */
function luhn(s) {
  const d = s.replace(/\D/g, "");
  if (d.length < 13 || d.length > 19) return false;
  if (/^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let digit = parseInt(d[i], 10);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { luhn };
}
