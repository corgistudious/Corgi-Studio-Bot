const {
  MessageFlags,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const {
  updateGuildSettings
} = require("../../services/guildSettingsService");

const {
  canManageGuild
} = require("../../utils/setupPermissions");

module.exports = {
  customId:
    "moderation_log_channel_select",

  async execute(interaction) {
    try {
      if (
        !canManageGuild(
          interaction
        )
      ) {
        return interaction.reply({
          content:
            "🔒 Bạn không có quyền cấu hình Moderation.",
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

      const botMember =
        interaction.guild.members.me;

      const permissions =
        channel.permissionsFor(
          botMember
        );

      if (
        !permissions?.has(
          PermissionsBitField.Flags.ViewChannel
        ) ||
        !permissions?.has(
          PermissionsBitField.Flags.SendMessages
        ) ||
        !permissions?.has(
          PermissionsBitField.Flags.EmbedLinks
        )
      ) {
        return interaction.update({
          content:
            "❌ Bot cần quyền **View Channel + Send Messages + Embed Links** trong channel này.",
          components: []
        });
      }

      await updateGuildSettings(
        interaction.guildId,
        {
          $set: {
            "moderation.logChannelId":
              channel.id
          }
        }
      );

      await interaction.update({
        content:
          `✅ Đã đặt ${channel} làm **Moderation Log Channel**.`,
        components: []
      });

      console.log(
        `📜 Moderation Log Channel | ${interaction.guild.name} → #${channel.name}`
      );
    } catch (error) {
      console.error(
        "❌ Moderation Log Channel Select Error:",
        error
      );
    }
  }
};