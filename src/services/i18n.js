const en = require('../locales/en');
const vi = require('../locales/vi');
const { getGuildSettings } = require('./guildSettings');

const locales = { en, vi };

function format(str, vars = {}) {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), String(str));
}

function t(lang, key, vars = {}) {
  const dict = locales[lang] || en;
  return format(dict[key] || en[key] || key, vars);
}

function pick(lang, english, vietnamese) {
  return lang === 'vi' ? vietnamese : english;
}

async function guildLang(guildId) {
  if (!guildId) return 'en';
  const settings = await getGuildSettings(guildId);
  return settings?.language === 'vi' ? 'vi' : 'en';
}

module.exports = { t, pick, guildLang };
