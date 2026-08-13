const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags
} = require("discord.js");

const {
  canManageLevelSettings
} = require("../../utils/setupPermissions");

module.exports = {
  customId: "xp_level_role_add",

  async execute(interaction) {
    try {
      // =====================================
      // PERMISSION
      // =====================================
      if (
        !canManageLevelSettings(
          interaction
        )
      ) {
        await interaction.reply({
          content:
            "🔒 Bạn không có quyền thêm **Level Role**.\n\n" +
            "Chức năng này yêu cầu:\n" +
            "• Server Owner\n" +
            "• Administrator\n" +
            "• Manage Server\n" +
            "• Bot Developer",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // MODAL
      // =====================================
      const modal =
        new ModalBuilder()
          .setCustomId(
            "xp_level_role_add_modal"
          )
          .setTitle(
            "Thêm Level Role"
          );

      // =====================================
      // LEVEL INPUT
      // =====================================
      const levelInput =
        new TextInputBuilder()
          .setCustomId(
            "level"
          )
          .setLabel(
            "Mốc Level"
          )
          .setPlaceholder(
            "Ví dụ: 5"
          )
          .setStyle(
            TextInputStyle.Short
          )
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(5);

      const row =
        new ActionRowBuilder()
          .addComponents(
            levelInput
          );

      modal.addComponents(
        row
      );

      // =====================================
      // SHOW MODAL
      // =====================================
      await interaction.showModal(
        modal
      );

      console.log(
        `➕ ${interaction.user.tag} mở Add Level Role ` +
        `tại ${interaction.guild.name}`
      );
    } catch (error) {
      console.error(
        "❌ XP Level Role Add Error:",
        error
      );
    }
  }
};