// CORE START
const VD = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const VP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

const O = "(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";

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
// CORE END

if (typeof window !== "undefined") {
  window.__BLACKOUT_CORE__ = { verhoeff, luhn, DETECTORS, detect, maskKeep, partial, norm, sanitize };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { verhoeff, luhn, DETECTORS, detect, maskKeep, partial, norm, sanitize };
}
