const DeveloperSettings = require('../models/DeveloperSettings');
const { isDeveloper } = require('./permissions');

let cache = { at: 0, value: null };
const CACHE_MS = 30_000;

async function getGlobalAccessSettings(force = false) {
  // Access policy changes invalidate this cache explicitly via devControl.
  // Do not put a database round-trip in Discord's interaction ACK path.
  if (!force && cache.value) return cache.value;
  const doc = await DeveloperSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global' } },
    { upsert: true, returnDocument: 'after' }
  ).lean();
  cache = { at: Date.now(), value: doc };
  return doc;
}

function invalidateAccessCache() { cache = { at: 0, value: null }; }

async function checkAccess({ userId, guildId, developerBypass = true }) {
  if (developerBypass && isDeveloper(userId)) return { allowed: true, reason: 'developer' };
  const s = await getGlobalAccessSettings();
  if (userId && s.blacklistedUsers?.includes(String(userId))) return { allowed: false, reason: 'user_blacklist', message: '⛔ Your account is blocked from using Corgi-Bot.' };
  if (guildId && s.blacklistedGuilds?.includes(String(guildId))) return { allowed: false, reason: 'guild_blacklist', message: '⛔ Corgi-Bot is disabled for this server.' };
  if (s.maintenanceMode) return { allowed: false, reason: 'maintenance', message: `🛠️ ${s.maintenanceMessage || 'Corgi-Bot is under maintenance.'}` };
  return { allowed: true, reason: 'ok' };
}

async function isGuildOperational(guildId) {
  const s = await getGlobalAccessSettings();
  return !s.maintenanceMode && !s.blacklistedGuilds?.includes(String(guildId));
}

module.exports = { getGlobalAccessSettings, invalidateAccessCache, checkAccess, isGuildOperational };
