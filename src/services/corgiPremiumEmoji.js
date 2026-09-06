const path = require('path');
const fs = require('fs');
const { PermissionFlagsBits } = require('discord.js');
const { getGuildSettings } = require('./guildSettings');
const { isPremiumGuild } = require('./premium');

const ASSET_DIR = path.join(__dirname, '../../assets/corgi-premium');
const COUNT = 28;
const PREFIX = 'corgi_cs_';
const emojiName = (n) => `${PREFIX}${String(n).padStart(2, '0')}`;

// Keep one application-level source set for bot messages/components.
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

function managedGuildEmoji(emoji) {
  return Boolean(emoji?.name && emoji.name.startsWith(PREFIX));
}

async function removeCorgiGuildEmojis(guild) {
  if (!guild) return { deleted: 0 };
  const emojis = await guild.emojis.fetch();
  const settings = await getGuildSettings(guild.id);
  const trackedIds = new Set(settings.premiumBranding?.corgiEmojiIds || []);
  const managed = emojis.filter((emoji) => trackedIds.has(emoji.id));
  let deleted = 0;
  for (const emoji of managed.values()) {
    try {
      await emoji.delete('Corgi Premium disabled or expired');
      deleted++;
    } catch (error) {
      console.warn(`[${guild.id}] Could not delete Premium emoji ${emoji.name}:`, error.message);
    }
  }
  if (trackedIds.size) await require('./guildSettings').setPremiumBranding(guild.id, { corgiEmojiIds: [] });
  if (deleted) console.log(`🐶 Removed ${deleted} Corgi Premium guild emoji(s) from ${guild.name} (${guild.id}).`);
  return { deleted };
}

async function syncCorgiGuildEmojis(guild) {
  if (!guild) return { created: 0, existing: 0 };
  const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
  if (!me?.permissions.has(PermissionFlagsBits.ManageGuildExpressions)) {
    console.warn(`[${guild.id}] Corgi Premium emoji sync requires Manage Expressions permission.`);
    return { created: 0, existing: 0, missingPermission: true };
  }

  const emojis = await guild.emojis.fetch();
  const settings = await getGuildSettings(guild.id);
  const trackedIds = new Set(settings.premiumBranding?.corgiEmojiIds || []);
  let created = 0;
  let existingCount = 0;
  for (let n = 1; n <= COUNT; n++) {
    const name = emojiName(n);
    const existingEmoji = emojis.find((e) => e.name === name);
    if (existingEmoji) {
      existingCount++;
      trackedIds.add(existingEmoji.id);
      continue;
    }
    const attachment = path.join(ASSET_DIR, `${name}_128.png`);
    if (!fs.existsSync(attachment)) {
      console.warn(`Missing Premium emoji asset: ${attachment}`);
      continue;
    }
    try {
      const emoji = await guild.emojis.create({ attachment, name, reason: 'Corgi Premium emoji pack' });
      trackedIds.add(emoji.id);
      created++;
    } catch (error) {
      console.warn(`[${guild.id}] Premium guild emoji ${name} sync failed:`, error.message);
    }
  }
  await require('./guildSettings').setPremiumBranding(guild.id, { corgiEmojiIds: [...trackedIds] });
  if (created) console.log(`🐶 Installed ${created} Corgi Premium guild emoji(s) in ${guild.name} (${guild.id}).`);
  return { created, existing: existingCount };
}

async function reconcileCorgiGuildEmojis(guild) {
  if (!guild) return;
  const active = await isPremiumGuild(guild.id);
  const settings = await getGuildSettings(guild.id);
  const enabled = settings.premiumBranding?.useCorgiStudioEmoji === true;
  if (active && enabled) return syncCorgiGuildEmojis(guild);
  return removeCorgiGuildEmojis(guild);
}

async function premiumEmojiEnabled(guildId) {
  if (!guildId || !(await isPremiumGuild(guildId))) return false;
  const settings = await getGuildSettings(guildId);
  return settings.premiumBranding?.useCorgiStudioEmoji === true;
}

async function getCorgiEmoji(client, guildId, number = 1, fallback = '🐶') {
  if (!(await premiumEmojiEnabled(guildId))) return fallback;
  try {
    const guild = client.guilds.cache.get(String(guildId));
    if (guild) {
      const guildEmojis = guild.emojis.cache.size ? guild.emojis.cache : await guild.emojis.fetch();
      const guildEmoji = guildEmojis.find((e) => e.name === emojiName(number));
      if (guildEmoji) return guildEmoji.toString();
    }
    if (!client.application) await client.application.fetch();
    const cache = client.application.emojis.cache.size ? client.application.emojis.cache : await client.application.emojis.fetch();
    const emoji = cache.find((e) => e.name === emojiName(number));
    return emoji ? emoji.toString() : fallback;
  } catch {
    return fallback;
  }
}

module.exports = {
  syncCorgiPremiumEmojis,
  syncCorgiGuildEmojis,
  removeCorgiGuildEmojis,
  reconcileCorgiGuildEmojis,
  premiumEmojiEnabled,
  getCorgiEmoji,
  emojiName
};
