const {
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  MessageFlags
} = require("discord.js");

const {
  canManageGuild
} = require("../../utils/setupPermissions");

module.exports = {
  customId: "moderation_ignore_role",

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
        new RoleSelectMenuBuilder()
          .setCustomId(
            "moderation_ignore_role_select"
          )
          .setPlaceholder(
            "🎭 Chọn Role được miễn Anti Spam"
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
          "🎭 Chọn Role sẽ được **bỏ qua Anti Spam**:",
        components: [
          row
        ],
        flags:
          MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error(
        "❌ Moderation Ignore Role Error:",
        error
      );
    }
  }
};