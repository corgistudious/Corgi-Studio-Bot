const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
  PermissionFlagsBits
} = require("discord.js");

const isDeveloper =
  require("../../utils/isDeveloper");

module.exports = {
  customId:
    "moderation_warn",

  async execute(interaction) {
    try {
      // =====================================
      // PERMISSION
      // =====================================

      const developer =
        isDeveloper(
          interaction.user.id
        );

      const allowed =
        developer ||
        interaction.member.permissions.has(
          PermissionFlagsBits.Administrator
        ) ||
        interaction.member.permissions.has(
          PermissionFlagsBits.ModerateMembers
        );

      if (!allowed) {
        return interaction.reply({
          content:
            "🔒 Bạn cần quyền **Moderate Members** để Warn thành viên.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // MODAL
      // =====================================

      const modal =
        new ModalBuilder()
          .setCustomId(
            "moderation_warn_modal"
          )
          .setTitle(
            "⚠️ Warn thành viên"
          );

      // =====================================
      // USER ID
      // =====================================

      const userId =
        new TextInputBuilder()
          .setCustomId(
            "user_id"
          )
          .setLabel(
            "Discord User ID"
          )
          .setPlaceholder(
            "Ví dụ: 123456789012345678"
          )
          .setStyle(
            TextInputStyle.Short
          )
          .setRequired(true)
          .setMinLength(17)
          .setMaxLength(20);

      // =====================================
      // REASON
      // =====================================

      const reason =
        new TextInputBuilder()
          .setCustomId(
            "reason"
          )
          .setLabel(
            "Lý do Warn"
          )
          .setPlaceholder(
            "Nhập lý do vi phạm..."
          )
          .setStyle(
            TextInputStyle.Paragraph
          )
          .setRequired(true)
          .setMinLength(2)
          .setMaxLength(500);

      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(
            userId
          ),

        new ActionRowBuilder()
          .addComponents(
            reason
          )
      );

      await interaction.showModal(
        modal
      );
    } catch (error) {
      console.error(
        "❌ Moderation Warn Button Error:",
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "❌ Không thể mở Warn.",

          flags:
            MessageFlags.Ephemeral
        });
      }
    }
  }
};