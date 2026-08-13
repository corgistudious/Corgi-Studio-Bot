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
  customId: "dev_level_set",

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
          "dev_level_set_modal"
        )
        .setTitle(
          "Remote • Đặt Level"
        );

    const input =
      new TextInputBuilder()
        .setCustomId(
          "level"
        )
        .setLabel(
          "Level mới"
        )
        .setPlaceholder(
          "Ví dụ: 10"
        )
        .setStyle(
          TextInputStyle.Short
        )
        .setRequired(true)
        .setMaxLength(5);

    modal.addComponents(
      new ActionRowBuilder()
        .addComponents(input)
    );

    await interaction.showModal(
      modal
    );
  }
};