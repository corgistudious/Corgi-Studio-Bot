const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags
} = require("discord.js");

const isDeveloper =
  require("../../utils/isDeveloper");

module.exports = {
  customId: "dev_user_open",

  async execute(interaction) {
    try {
      if (
        !isDeveloper(
          interaction.user.id
        )
      ) {
        await interaction.reply({
          content:
            "🔐 Developer Only.",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      const session =
        interaction.client
          .developerSessions
          ?.get(
            interaction.user.id
          );

      if (!session) {
        await interaction.reply({
          content:
            "⌛ Remote Session đã hết hạn.\n\n" +
            "Hãy dùng `/dev` lại.",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      const modal =
        new ModalBuilder()
          .setCustomId(
            "dev_user_modal"
          )
          .setTitle(
            "Remote User Control"
          );

      const userIdInput =
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

      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(
            userIdInput
          )
      );

      await interaction.showModal(
        modal
      );
    } catch (error) {
      console.error(
        "❌ Dev User Open Error:",
        error
      );
    }
  }
};