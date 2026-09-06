const {
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const { STATS_REFRESH_MS } = require('../../config/constants');
const GuildSettings = require('../../models/GuildSettings');
const { isGuildOperational } = require('../../services/accessControl');

const STAT_DEFINITIONS = [
  { key: 'members', emoji: '👥', label: 'Members', value: (guild) => guild.memberCount },
  { key: 'humans', emoji: '👤', label: 'Humans', value: (guild) => Math.max(0, guild.memberCount - guild.members.cache.filter((m) => m.user.bot).size) },
  { key: 'bots', emoji: '🤖', label: 'Bots', value: (guild) => guild.members.cache.filter((m) => m.user.bot).size },
  { key: 'boosts', emoji: '🚀', label: 'Boosts', value: (guild) => guild.premiumSubscriptionCount ?? 0 },
];

function lockedOverwrites(guild) {
  return [
    {
      id: guild.roles.everyone.id,
      allow: [PermissionFlagsBits.ViewChannel],
      deny: [
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.Stream,
        PermissionFlagsBits.UseVAD,
      ],
    },
  ];
}

function statName(def, guild) {
  return `${def.emoji} ${def.label}: ${def.value(guild)}`;
}

async function ensureStatsBoard(guild, settings) {
  // Warm the member cache once so Humans/Bots are accurate when the bot has GuildMembers intent.
  await guild.members.fetch().catch(() => null);

  let category = null;
  if (settings.channels?.stats) {
    category = await guild.channels.fetch(settings.channels.stats).catch(() => null);
    if (category?.type !== ChannelType.GuildCategory) category = null;
  }

  if (!category) {
    category = await guild.channels.create({
      name: '📊 SERVER STATS',
      type: ChannelType.GuildCategory,
      permissionOverwrites: lockedOverwrites(guild),
      reason: 'Corgi-Bot locked voice stats board',
    });
    settings.channels.stats = category.id;
  }

  const ids = settings.statsVoiceChannels || {};
  const nextIds = {};

  for (const def of STAT_DEFINITIONS) {
    let channel = ids[def.key]
      ? await guild.channels.fetch(ids[def.key]).catch(() => null)
      : null;

    if (!channel || channel.type !== ChannelType.GuildVoice) {
      channel = await guild.channels.create({
        name: statName(def, guild),
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: lockedOverwrites(guild),
        reason: `Corgi-Bot server stat: ${def.label}`,
      });
    } else {
      const changes = {};
      if (channel.parentId !== category.id) changes.parent = category.id;
      const wanted = statName(def, guild);
      if (channel.name !== wanted) changes.name = wanted;
      if (Object.keys(changes).length) await channel.edit(changes).catch(() => null);
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        ViewChannel: true,
        Connect: false,
        Speak: false,
        Stream: false,
        UseVAD: false,
      }).catch(() => null);
    }

    nextIds[def.key] = channel.id;
  }

  settings.statsVoiceChannels = nextIds;
  settings.statsMessageId = undefined; // V4.3 no longer uses a text stats message.
  await settings.save();
  return { category, channels: nextIds };
}

async function updateStatsBoard(guild, settings) {
  const ids = settings.statsVoiceChannels || {};
  if (!settings.channels?.stats || !Object.keys(ids).length) return false;

  let changed = false;
  for (const def of STAT_DEFINITIONS) {
    const id = ids[def.key];
    if (!id) continue;
    const channel = guild.channels.cache.get(id) || await guild.channels.fetch(id).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildVoice) continue;
    const wanted = statName(def, guild);
    // The service checks every 3s but only edits Discord when a number actually changed.
    if (channel.name !== wanted) {
      await channel.setName(wanted, 'Corgi-Bot real-time server stats').catch((e) => {
        console.warn(`Stats rename failed (${def.key}):`, e.message);
      });
      changed = true;
    }
  }
  return changed;
}

function startStatsService(client) {
  let running = false;
  setInterval(async () => {
    if (running || !client.isReady()) return;
    running = true;
    try {
      const settings = await GuildSettings.find({
        'modules.stats': true,
        'channels.stats': { $exists: true, $ne: null },
      });

      for (const s of settings) {
        try {
          const guild = client.guilds.cache.get(s.guildId);
          if (!guild || !(await isGuildOperational(s.guildId))) continue;
          await updateStatsBoard(guild, s);
        } catch (e) {
          console.error('stats tick', e.message);
        }
      }
    } finally {
      running = false;
    }
  }, STATS_REFRESH_MS).unref();
}

module.exports = { startStatsService, ensureStatsBoard, updateStatsBoard };
