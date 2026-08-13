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
    "moderation_ignore_channel",

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

      const select =
        new ChannelSelectMenuBuilder()
          .setCustomId(
            "moderation_ignore_channel_select"
          )
          .setPlaceholder(
            "📢 Chọn Channel được miễn Anti Spam"
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
          "📢 Chọn Channel sẽ được **bỏ qua Anti Spam**:",
        components: [
          row
        ],
        flags:
          MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error(
        "❌ Moderation Ignore Channel Error:",
        error
      );
    }
  }
};