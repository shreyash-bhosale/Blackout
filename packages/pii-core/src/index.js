/**
 * @file packages/pii-core/src/index.js
 * @description Canonical universal aggregator for Blackout PII Detection & Sanitization Core.
 * Evaluates identically in Node.js, Web Browsers, and Web Workers / Content Scripts.
 */

const { VD, VP, O } = require("./constants/tables");
const { verhoeff } = require("./validators/verhoeff");
const { luhn } = require("./validators/luhn");
const { DETECTORS } = require("./detectors/index");
const { detect } = require("./matching/resolve-overlaps");
const { maskKeep, partial } = require("./sanitizers/partial-mask");
const { norm } = require("./normalization/normalize");
const { sanitize } = require("./sanitizers/index");

const PiiCore = {
  VD,
  VP,
  O,
  verhoeff,
  luhn,
  DETECTORS,
  detect,
  maskKeep,
  partial,
  norm,
  sanitize
};

// CommonJS export
if (typeof module !== "undefined" && module.exports) {
  module.exports = PiiCore;
}

// Browser / Global export
if (typeof window !== "undefined") {
  window.__BLACKOUT_CORE__ = PiiCore;
}
if (typeof globalThis !== "undefined") {
  globalThis.__BLACKOUT_CORE__ = PiiCore;
}
