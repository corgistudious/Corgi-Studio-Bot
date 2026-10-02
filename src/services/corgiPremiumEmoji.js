const path = require('path');
const fs = require('fs');
const { getGuildSettings, setPremiumBranding } = require('./guildSettings');
const { isPremiumGuild } = require('./premium');

const ASSET_DIR = path.join(__dirname, '../../assets/corgi-premium');
const COUNT = 28;
const PREFIX = 'corgi_cs_';
const emojiName = (n) => `${PREFIX}${String(n).padStart(2, '0')}`;

// One private source set owned by the Discord application.
// These emojis are rendered by Corgi-Bot only after the guild Premium gate passes.
async function syncCorgiPremiumEmojis(client) {
  if (!client.application) await client.application.fetch();
  const existing = await client.application.emojis.fetch();
  let created = 0;

  for (let n = 1; n <= COUNT; n++) {
    const name = emojiName(n);
    if (existing.some((e) => e.name === name)) continue;
    const attachment = path.join(ASSET_DIR, `${name}_128.png`);
    if (!fs.existsSync(attachment)) continue;
    try {
      await client.application.emojis.create({ attachment, name });
      created++;
    } catch (error) {
      console.warn(`Premium application emoji ${name} sync failed:`, error.message);
    }
  }

  if (created) console.log(`🐶 Synced ${created} Corgi Studio Premium application emoji(s).`);
  return client.application.emojis.fetch();
}

// V4.10.2 migration cleanup: remove only guild emoji IDs that Corgi-Bot
// previously tracked/installed. Never delete unrelated server emojis.
async function removeLegacyCorgiGuildEmojis(guild) {
  if (!guild) return { deleted: 0 };
  const settings = await getGuildSettings(guild.id);
  const trackedIds = new Set(settings.premiumBranding?.corgiEmojiIds || []);
  if (!trackedIds.size) return { deleted: 0 };

  const emojis = await guild.emojis.fetch().catch(() => null);
  if (!emojis) return { deleted: 0 };

  let deleted = 0;
  for (const id of trackedIds) {
    const emoji = emojis.get(id);
    if (!emoji) continue;
    try {
      await emoji.delete('Corgi Premium migrated to application emoji access');
      deleted++;
    } catch (error) {
      console.warn(`[${guild.id}] Could not remove legacy Corgi emoji ${emoji.name}:`, error.message);
    }
  }

  await setPremiumBranding(guild.id, { corgiEmojiIds: [] });
  if (deleted) console.log(`🐶 Removed ${deleted} legacy Corgi guild emoji(s) from ${guild.name} (${guild.id}).`);
  return { deleted };
}

async function premiumEmojiEnabled(guildId) {
  if (!guildId || !(await isPremiumGuild(guildId))) return false;
  const settings = await getGuildSettings(guildId);
  return settings.premiumBranding?.useCorgiStudioEmoji === true;
}

// Premium gate: non-Premium guilds receive only the normal fallback.
// The application emoji is never copied into the guild emoji picker.
async function getCorgiEmoji(client, guildId, number = 1, fallback = '🐶') {
  if (!(await premiumEmojiEnabled(guildId))) return fallback;
  try {
    if (!client.application) await client.application.fetch();
    const cache = client.application.emojis.cache.size
      ? client.application.emojis.cache
      : await client.application.emojis.fetch();
    const emoji = cache.find((e) => e.name === emojiName(number));
    return emoji ? emoji.toString() : fallback;
  } catch {
    return fallback;
  }
}

module.exports = {
  syncCorgiPremiumEmojis,
  removeLegacyCorgiGuildEmojis,
  premiumEmojiEnabled,
  getCorgiEmoji,
  emojiName
};
