const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags
} = require("discord.js");

const isDeveloper =
  require("../../utils/isDeveloper");

const getDeveloperSession =
  require("../../utils/getDeveloperSession");

module.exports = {
  customId: "dev_level_remove",

  async execute(interaction) {
    try {
      if (!isDeveloper(interaction.user.id)) {
        return interaction.reply({
          content: "🔐 Developer Only.",
          flags: MessageFlags.Ephemeral
        });
      }

      if (!getDeveloperSession(interaction)) {
        return interaction.reply({
          content:
            "⌛ Remote Session không hợp lệ. Hãy dùng `/dev` lại.",
          flags: MessageFlags.Ephemeral
        });
      }

      const modal =
        new ModalBuilder()
          .setCustomId("dev_level_remove_modal")
          .setTitle("Remote • Giảm Level");

      const input =
        new TextInputBuilder()
          .setCustomId("amount")
          .setLabel("Số Level muốn giảm")
          .setPlaceholder("Ví dụ: 1")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(5);

      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(input)
      );

      await interaction.showModal(modal);
    } catch (error) {
      console.error(
        "❌ Dev Level Remove Error:",
        error
      );
    }
  }
};