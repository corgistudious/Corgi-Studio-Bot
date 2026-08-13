const {
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  MessageFlags
} = require("discord.js");

const {
  canManageGuild
} = require("../../utils/setupPermissions");

module.exports = {
  customId: "moderation_mute_role",

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
        new RoleSelectMenuBuilder()
          .setCustomId(
            "moderation_mute_role_select"
          )
          .setPlaceholder(
            "🔇 Chọn Role dùng cho Mute"
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
          "🔇 Chọn Role sẽ được cấp cho thành viên khi dùng `/mute`:",
        components: [
          row
        ],
        flags:
          MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error(
        "❌ Moderation Mute Role Button Error:",
        error
      );
    }
  }
};