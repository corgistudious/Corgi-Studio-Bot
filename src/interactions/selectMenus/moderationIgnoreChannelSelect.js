const {
  MessageFlags,
  ChannelType
} = require("discord.js");

const {
  updateGuildSettings
} = require("../../services/guildSettingsService");

const {
  canManageGuild
} = require("../../utils/setupPermissions");

module.exports = {
  customId:
    "moderation_ignore_channel_select",

  async execute(interaction) {
    try {
      if (
        !canManageGuild(
          interaction
        )
      ) {
        return interaction.reply({
          content:
            "🔒 Bạn không có quyền cấu hình Anti Spam.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      const channelId =
        interaction.values[0];

      const channel =
        interaction.guild.channels.cache.get(
          channelId
        );

      if (
        !channel ||
        channel.type !==
          ChannelType.GuildText
      ) {
        return interaction.update({
          content:
            "❌ Channel không hợp lệ.",
          components: []
        });
      }

      await updateGuildSettings(
        interaction.guildId,
        {
          $set: {
            "moderation.antiSpam.ignoredChannelId":
              channel.id
          }
        }
      );

      await interaction.update({
        content:
          `✅ Đã đặt ${channel} làm Channel **miễn Anti Spam**.`,
        components: []
      });

      console.log(
        `📢 Anti Spam Ignore Channel | ${interaction.guild.name} → #${channel.name}`
      );
    } catch (error) {
      console.error(
        "❌ Moderation Ignore Channel Select Error:",
        error
      );
    }
  }
};