const en = require('../locales/en');
const vi = require('../locales/vi');
const locales = { en, vi };
function format(str, vars={}) { return Object.entries(vars).reduce((s,[k,v]) => s.replaceAll(`{${k}}`, String(v)), str); }
function t(lang, key, vars={}) { const dict = locales[lang] || en; return format(dict[key] || en[key] || key, vars); }
module.exports = { t };
