const { O } = require("../constants/tables");
const { luhn } = require("../validators/luhn");
const { verhoeff } = require("../validators/verhoeff");

/**
 * Ordered priority detector definitions.
 * Higher priority entries appear earlier in the array.
 */
const DETECTORS = [
  {
    type: "EMAIL",
    re: /(?<![a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?![a-zA-Z0-9._%+-])/g
  },
  {
    type: "CARD",
    re: /(?<!\d[ -]?)(?:\d[ -]?){12,18}\d(?![ -]?\d)/g,
    ok: luhn
  },
  {
    type: "AADHAAR",
    re: /(?<!\d[ -]?)[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}(?![ -]?\d)/g,
    ok: verhoeff
  },
  {
    type: "PAN",
    re: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
    ok: function(s) { return "PCHFATBLJG".indexOf(s[3]) !== -1; }
  },
  {
    type: "IP",
    re: new RegExp("(?<![\\d.])(?:" + O + "\\.){3}" + O + "(?!\\.?\\d)", "g")
  },
  {
    type: "IP",
    re: /(?<![0-9a-fA-F:])(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(?![0-9a-fA-F:])/gi
  },
  {
    type: "PHONE",
    re: /(?<!\d[ -]?)(?:(?:\+91|0091|0)[ -]?)?[6-9]\d{4}[ -]?\d{5}(?![ -]?\d)/g
  },
  {
    type: "PHONE",
    re: /(?<![\w+])\+(?!91[ -]?\d)\d{1,4}(?:[ -]?\d{2,5}){2,4}(?![ -]?\d)/g
  }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DETECTORS };
}
