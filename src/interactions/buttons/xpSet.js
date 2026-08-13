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
  customId: "xp_set",

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
        "xp_set_"
      );

    if (!userId) {
      return;
    }

    const modal =
      new ModalBuilder()
        .setCustomId(
          `xp_set_modal_${userId}`
        )
        .setTitle("Đặt XP");

    const input =
      new TextInputBuilder()
        .setCustomId("amount")
        .setLabel("XP mới")
        .setPlaceholder("Ví dụ: 250")
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