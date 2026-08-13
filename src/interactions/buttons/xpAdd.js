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
  customId: "xp_add",

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
        "xp_add_"
      );

    if (!userId) {
      await interaction.reply({
        content:
          "❌ Không xác định được thành viên.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    const modal =
      new ModalBuilder()
        .setCustomId(
          `xp_add_modal_${userId}`
        )
        .setTitle("Cộng XP");

    const input =
      new TextInputBuilder()
        .setCustomId("amount")
        .setLabel("Số XP muốn cộng")
        .setPlaceholder("Ví dụ: 100")
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