module.exports = {
  customId: "ticket_close_cancel",

  async execute(interaction) {
    await interaction.update({
      content:
        "✅ Đã hủy thao tác đóng Ticket.",
      components: []
    });
  }
};