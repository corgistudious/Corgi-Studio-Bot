const { Events } = require('discord.js');
const { getGuildSettings } = require('../services/guildSettings');
const { checkAccess } = require('../services/accessControl');
const { isPremiumGuild, premiumMultiplier } = require('../services/premium');
const { mtx } = require('../services/i18n');
const Progression = require('../services/progression');

module.exports = {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const s = await getGuildSettings(message.guildId);
    const prefix = s.prefix || '?';
    const isPrefixCommand = message.content.startsWith(prefix);

    // XP is only earned from normal member chat messages.
    // Slash commands, buttons, selects and modals never reach messageCreate.
    // Prefix-command messages are explicitly excluded here so commands such as
    // ?profile, ?help, ?setup, games, etc. cannot generate progression XP.
    if (s.modules?.leveling !== false && !isPrefixCommand && message.content.trim().length > 0) {
      premiumMultiplier(message.guildId)
        .then(async (mult) => {
          const r = await Progression.awardMessageXp(message.author.id, mult);
          if (r.leveled > 0) {
            try {
              const { buildLevelCard } = require('../services/levelCard');
              const { AttachmentBuilder } = require('discord.js');
              const card = await buildLevelCard({
                user: message.author,
                profile: r.profile,
                lang: s.language
              });
              const file = new AttachmentBuilder(card, {
                name: `corgi-level-${r.profile.level}.png`
              });
              await message.channel.send({
                content: mtx(
                  s.language,
                  `🎉 ${message.author} reached **Level ${r.profile.level.toLocaleString()}**!`,
                  `🎉 ${message.author} đã đạt **Cấp ${r.profile.level.toLocaleString()}**!`
                ),
                files: [file]
              });
            } catch (e) {
              console.warn('Level-up card failed:', e.message);
              await message.channel
                .send(
                  mtx(
                    s.language,
                    `🎉 ${message.author} reached **Level ${r.profile.level.toLocaleString()}**!`,
                    `🎉 ${message.author} đã đạt **Cấp ${r.profile.level.toLocaleString()}**!`
                  )
                )
                .catch(() => {});
            }
          }
        })
        .catch((e) => console.warn('Progression XP failed:', e.message));
    }

    // V6 automatic mission progress: normal activity advances Global and Guild mission engines without manual setup.
    if (!isPrefixCommand && message.content.trim().length > 0) {
      require('../services/missionTracker').recordMessage(message.guildId,message.author.id).catch(e=>console.warn('Mission tracker:',e.message));
    }

    if (!isPrefixCommand) return;

    const parts = message.content.slice(prefix.length).trim().split(/\s+/);
    const name = (parts.shift() || '').toLowerCase();
    const c = client.prefixCommands.get(name);
    if (!c?.executePrefix) return;

    const access = await checkAccess({
      userId: message.author.id,
      guildId: message.guildId
    });
    if (!access.allowed) return message.reply(access.message).catch(() => {});

    const required = c.data?.toJSON?.().default_member_permissions;
    if (required && !message.member?.permissions?.has(BigInt(required))) {
      return message
        .reply(
          mtx(
            s.language,
            '❌ You do not have the required Discord permission for this command.',
            '❌ Bạn không có quyền Discord cần thiết để dùng lệnh này.'
          )
        )
        .catch(() => {});
    }

    if (c.premiumOnly && !(await isPremiumGuild(message.guildId))) {
      return message.reply(
        mtx(
          s.language,
          '💎 This command requires active Corgi Premium for this server.',
          '💎 Lệnh này yêu cầu Corgi Premium đang hoạt động cho server.'
        )
      );
    }

    try {
      await c.executePrefix(message, parts, client);
    } catch (e) {
      console.error(e);
      await message.channel.send(mtx(s.language, 'Command error.', 'Lệnh gặp lỗi.')).catch(() => {});
    }
  }
};
