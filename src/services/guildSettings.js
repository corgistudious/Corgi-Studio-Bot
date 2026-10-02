const GuildSettings = require('../models/GuildSettings');

const CACHE_MS = 60_000;
const cache = new Map();

function invalidateGuildSettingsCache(guildId) {
  if (guildId === undefined || guildId === null) {
    cache.clear();
    return;
  }
  cache.delete(String(guildId));
}

async function getGuildSettings(guildId, force = false) {
  const key = String(guildId);
  const hit = cache.get(key);

  if (!force && hit && Date.now() - hit.at < CACHE_MS) {
    return hit.value;
  }

  let doc = await GuildSettings.findOne({ guildId });

  if (!doc) {
    doc = await GuildSettings.findOneAndUpdate(
      { guildId },
      { $setOnInsert: { guildId } },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true
      }
    );
  }

  cache.set(key, { at: Date.now(), value: doc });
  return doc;
}

async function setLanguage(guildId, language) {
  const supported = require('../config/languages').map(x => x.id);
  if (!supported.includes(language)) throw new Error('Unsupported language');

  const doc = await GuildSettings.findOneAndUpdate(
    { guildId },
    { $set: { language } },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true
    }
  );

  invalidateGuildSettingsCache(guildId);
  return doc;
}

async function toggleModule(guildId, moduleName) {
  if (moduleName === 'pet') throw new Error('PET_COMING_SOON');

  const s = await getGuildSettings(guildId, true);

  if (!s.modules || !(moduleName in s.modules)) {
    throw new Error('Unknown module');
  }

  s.modules[moduleName] = !s.modules[moduleName];
  await s.save();

  invalidateGuildSettingsCache(guildId);
  return s;
}

async function setChannel(guildId, key, value) {
  const allowed = [
    'welcome',
    'leave',
    'logs',
    'moderationLogs',
    'stats',
    'ticketCategory',
    'globalMail',
    'marketAnnouncements'
  ];

  if (!allowed.includes(key)) throw new Error('Unknown channel setting');

  const doc = await GuildSettings.findOneAndUpdate(
    { guildId },
    { $set: { [`channels.${key}`]: value } },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true
    }
  );

  invalidateGuildSettingsCache(guildId);
  return doc;
}

async function setPremiumBranding(guildId, patch) {
  const $set = {};

  for (const [key, value] of Object.entries(patch || {})) {
    $set[`premiumBranding.${key}`] = value;
  }

  const doc = await GuildSettings.findOneAndUpdate(
    { guildId },
    { $set },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true
    }
  );

  invalidateGuildSettingsCache(guildId);
  return doc;
}

module.exports = {
  getGuildSettings,
  setLanguage,
  toggleModule,
  setChannel,
  setPremiumBranding,
  invalidateGuildSettingsCache
};
