const {
  PermissionFlagsBits,
  ChannelType
} = require("discord.js");

async function setupMuteRolePermissions(
  guild,
  role
) {
  const results = {
    success: 0,
    failed: 0
  };

  const channels =
    guild.channels.cache.values();

  for (const channel of channels) {
    try {
      // =====================================
      // TEXT / ANNOUNCEMENT / FORUM
      // =====================================
      if (
        channel.type === ChannelType.GuildText ||
        channel.type === ChannelType.GuildAnnouncement ||
        channel.type === ChannelType.GuildForum
      ) {
        await channel.permissionOverwrites.edit(
          role,
          {
            SendMessages: false,
            AddReactions: false,
            SendMessagesInThreads: false,
            CreatePublicThreads: false,
            CreatePrivateThreads: false
          },
          {
            reason:
              "Corgi Studio • Configure Mute Role"
          }
        );

        results.success += 1;

        continue;
      }

      // =====================================
      // VOICE / STAGE
      // =====================================
      if (
        channel.type === ChannelType.GuildVoice ||
        channel.type === ChannelType.GuildStageVoice
      ) {
        await channel.permissionOverwrites.edit(
          role,
          {
            Speak: false
          },
          {
            reason:
              "Corgi Studio • Configure Mute Role"
          }
        );

        results.success += 1;
      }
    } catch (error) {
      results.failed += 1;

      console.error(
        `❌ Không thể cấu hình Mute Role tại channel ${channel.name}:`,
        error.message
      );
    }
  }

  return results;
}

module.exports = {
  setupMuteRolePermissions
};