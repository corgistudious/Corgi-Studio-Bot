const path = require('path');
const fs = require('fs');
const { getGuildSettings } = require('./guildSettings');
const { isPremiumGuild } = require('./premium');

const ASSET_DIR = path.join(__dirname, '../../assets/corgi-premium');
const COUNT = 28;
const emojiName = (n) => `corgi_cs_${String(n).padStart(2, '0')}`;

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
      console.warn(`Premium emoji ${name} sync failed:`, error.message);
    }
  }
  if (created) console.log(`🐶 Synced ${created} Corgi Studio Premium emoji(s).`);
  return client.application.emojis.fetch();
}

async function premiumEmojiEnabled(guildId) {
  if (!guildId || !(await isPremiumGuild(guildId))) return false;
  const settings = await getGuildSettings(guildId);
  return settings.premiumBranding?.useCorgiStudioEmoji === true;
}

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

module.exports = { syncCorgiPremiumEmojis, premiumEmojiEnabled, getCorgiEmoji, emojiName };
