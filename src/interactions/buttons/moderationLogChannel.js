const {
  ChannelSelectMenuBuilder,
  ChannelType,
  ActionRowBuilder,
  MessageFlags
} = require("discord.js");

const {
  canManageGuild
} = require("../../utils/setupPermissions");

module.exports = {
  customId:
    "moderation_log_channel",

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

      const select =
        new ChannelSelectMenuBuilder()
          .setCustomId(
            "moderation_log_channel_select"
          )
          .setPlaceholder(
            "📜 Chọn Mod Log Channel"
          )
          .setChannelTypes(
            ChannelType.GuildText
          )
          .setMinValues(1)
          .setMaxValues(1);

      const row =
        new ActionRowBuilder()
          .addComponents(
            select
          );

      await interaction.reply({
        content:
          "📜 Chọn Channel nhận **Moderation Logs**:",
        components: [
          row
        ],
        flags:
          MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error(
        "❌ Moderation Log Channel Error:",
        error
      );
    }
  }
};