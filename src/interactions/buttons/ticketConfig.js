const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

module.exports = {
  customId: "ticket_config",

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("⚙️ Cấu hình chi tiết Ticket")
      .setDescription(
        "Chọn mục bạn muốn cấu hình bằng menu bên dưới."
      )
      .addFields(
        {
          name: "📁 Category",
          value: "Nơi các kênh Ticket mới sẽ được tạo."
        },
        {
          name: "🛡️ Staff Role",
          value: "Role được phép xem và hỗ trợ Ticket."
        },
        {
          name: "📜 Kênh Log",
          value: "Nơi bot ghi lại hoạt động Ticket."
        },
        {
          name: "📢 Kênh Panel",
          value: "Nơi bot đăng bảng mở Ticket."
        }
      )
      .setFooter({
        text: "Corgi Studio • Ticket Configuration"
      });

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_config_menu")
      .setPlaceholder("⚙️ Chọn mục cần cấu hình")
      .addOptions(
        {
          label: "Chọn Category",
          description: "Category chứa các Ticket",
          value: "category",
          emoji: "📁"
        },
        {
          label: "Chọn Staff Role",
          description: "Role nhân viên hỗ trợ",
          value: "staff_role",
          emoji: "🛡️"
        },
        {
          label: "Chọn kênh Log",
          description: "Kênh ghi lại hoạt động Ticket",
          value: "log_channel",
          emoji: "📜"
        },
        {
          label: "Chọn kênh Panel",
          description: "Kênh đăng bảng mở Ticket",
          value: "panel_channel",
          emoji: "📢"
        }
      );

    const row = new ActionRowBuilder()
      .addComponents(menu);

    await interaction.update({
      embeds: [embed],
      components: [row]
    });
  }
};