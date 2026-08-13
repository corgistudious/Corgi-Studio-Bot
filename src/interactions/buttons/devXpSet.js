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
  customId: "dev_xp_set",

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
          "dev_xp_set_modal"
        )
        .setTitle(
          "Remote • Đặt XP"
        );

    const input =
      new TextInputBuilder()
        .setCustomId(
          "amount"
        )
        .setLabel(
          "XP mới"
        )
        .setPlaceholder(
          "Ví dụ: 250"
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