const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");

const Ticket =
  require("../../models/Ticket");

module.exports = {
  customId: "ticket_close",

  async execute(interaction) {
    const ticket =
      await Ticket.findOne({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        status: "open"
      });

    if (!ticket) {
      await interaction.reply({
        content:
          "❌ Ticket này không còn hoạt động.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    const confirmButton =
      new ButtonBuilder()
        .setCustomId(
          "ticket_close_confirm"
        )
        .setLabel("Xác nhận đóng")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

    const cancelButton =
      new ButtonBuilder()
        .setCustomId(
          "ticket_close_cancel"
        )
        .setLabel("Hủy")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Secondary);

    const row =
      new ActionRowBuilder()
        .addComponents(
          confirmButton,
          cancelButton
        );

    await interaction.reply({
      content:
        "⚠️ **Bạn có chắc muốn đóng Ticket này không?**\n\n" +
        "Ticket sẽ bị đóng và channel sẽ được xóa.",
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }
};