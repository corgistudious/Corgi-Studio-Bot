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
  customId: "dev_xp_remove",

  async execute(interaction) {
    if (
      !isDeveloper(
        interaction.user.id
      )
    ) {
      return interaction.reply({
        content:
          "🔐 Developer Only.",
        flags:
          MessageFlags.Ephemeral
      });
    }

    if (
      !getDeveloperSession(
        interaction
      )
    ) {
      return interaction.reply({
        content:
          "⌛ Remote Session không hợp lệ. Hãy dùng `/dev` lại.",
        flags:
          MessageFlags.Ephemeral
      });
    }

    const modal =
      new ModalBuilder()
        .setCustomId(
          "dev_xp_remove_modal"
        )
        .setTitle(
          "Remote • Trừ XP"
        );

    const input =
      new TextInputBuilder()
        .setCustomId(
          "amount"
        )
        .setLabel(
          "Số XP muốn trừ"
        )
        .setPlaceholder(
          "Ví dụ: 100"
        )
        .setStyle(
          TextInputStyle.Short
        )
        .setRequired(true)
        .setMaxLength(10);

    modal.addComponents(
      new ActionRowBuilder()
        .addComponents(input)
    );

    await interaction.showModal(
      modal
    );
  }
};