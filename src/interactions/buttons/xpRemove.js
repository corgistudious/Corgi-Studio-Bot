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
  customId: "xp_remove",

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
        "xp_remove_"
      );

    if (!userId) {
      return;
    }

    const modal =
      new ModalBuilder()
        .setCustomId(
          `xp_remove_modal_${userId}`
        )
        .setTitle("Trừ XP");

    const input =
      new TextInputBuilder()
        .setCustomId("amount")
        .setLabel("Số XP muốn trừ")
        .setPlaceholder("Ví dụ: 50")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(8);

    modal.addComponents(
      new ActionRowBuilder()
        .addComponents(input)
    );

    await interaction.showModal(modal);
  }
};