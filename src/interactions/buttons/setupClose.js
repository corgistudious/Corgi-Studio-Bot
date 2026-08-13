module.exports = {
  customId: "setup_close",

  async execute(interaction) {
    await interaction.update({
      content: "✅ Đã đóng bảng điều khiển Corgi Studio.",
      embeds: [],
      components: []
    });
  }
};