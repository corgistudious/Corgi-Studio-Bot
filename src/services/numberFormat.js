const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

function compactNumber(value, maxDecimals = 1) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '0';
  const sign = n < 0 ? '-' : '';
  let v = Math.abs(n);
  if (v < 1000) return sign + Math.floor(v).toLocaleString('en-US');
  let tier = Math.min(Math.floor(Math.log10(v) / 3), SUFFIXES.length - 1);
  let scaled = v / Math.pow(1000, tier);
  if (scaled >= 999.95 && tier < SUFFIXES.length - 1) { tier += 1; scaled /= 1000; }
  const decimals = scaled >= 100 ? 0 : scaled >= 10 ? Math.min(1, maxDecimals) : maxDecimals;
  return sign + scaled.toFixed(decimals).replace(/\.0+$|(?<=\.[0-9]*?)0+$/g, '') + SUFFIXES[tier];
}

function parseFlexibleNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const raw = String(value || '').trim().replace(/[,_\s]/g, '');
  const m = raw.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))([a-zA-Z]{0,2})$/);
  if (!m) return NaN;
  const suffix = m[2].toLowerCase();
  const map = {k:1,m:2,b:3,t:4,qa:5,qi:6,sx:7,sp:8,oc:9,no:10,dc:11};
  const tier = suffix ? map[suffix] : 0;
  if (tier === undefined) return NaN;
  const out = Number(m[1]) * Math.pow(1000, tier);
  return Number.isFinite(out) ? out : NaN;
}

function parseMoney(value, {min=0,max=Number.MAX_SAFE_INTEGER,integer=true}={}) {
  let n = parseFlexibleNumber(value);
  if (!Number.isFinite(n)) return NaN;
  if (integer) n = Math.floor(n);
  return n >= min && n <= max ? n : NaN;
}

module.exports = { compactNumber, parseFlexibleNumber, parseMoney };
