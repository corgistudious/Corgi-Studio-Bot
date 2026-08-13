const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags
} = require("discord.js");

const isDeveloper =
  require("../../utils/isDeveloper");

const getXpTargetId =
  require("../../utils/getXpTargetId");

module.exports = {
  customId: "level_set",

  async execute(interaction) {
    if (!isDeveloper(interaction.user.id)) {
      await interaction.reply({
        content: "🔒 **Developer Only**",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    const userId =
      getXpTargetId(
        interaction.customId,
        "level_set_"
      );

    if (!userId) {
      return;
    }

    const modal =
      new ModalBuilder()
        .setCustomId(
          `level_set_modal_${userId}`
        )
        .setTitle("Đặt Level");

    const input =
      new TextInputBuilder()
        .setCustomId("level")
        .setLabel("Level mới")
        .setPlaceholder("Ví dụ: 10")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(5);

    modal.addComponents(
      new ActionRowBuilder()
        .addComponents(input)
    );

    await interaction.showModal(modal);
  }
};