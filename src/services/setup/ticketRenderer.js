const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const {
  getGuildSettings
} = require("../guildSettingsService");

async function renderTicketSettings(interaction) {
  const settings = await getGuildSettings(
    interaction.guildId
  );

  const enabled =
    settings.ticket?.enabled ?? false;

  const embed = new EmbedBuilder()
    .setColor(
      enabled
        ? 0x57f287
        : 0xed4245
    )
    .setTitle("🎫 Cấu hình Ticket")
    .setDescription(
      "Quản lý hệ thống hỗ trợ Ticket của Corgi Studio."
    )
    .addFields(
      {
        name: "Trạng thái",
        value: enabled
          ? "🟢 Đang bật"
          : "🔴 Đang tắt",
        inline: true
      },
      {
        name: "Category",
        value:
          settings.ticket?.categoryId
            ? `<#${settings.ticket.categoryId}>`
            : "Chưa thiết lập",
        inline: true
      },
      {
        name: "Staff Role",
        value:
          settings.ticket?.staffRoleId
            ? `<@&${settings.ticket.staffRoleId}>`
            : "Chưa thiết lập",
        inline: true
      },
      {
        name: "Kênh Log",
        value:
          settings.ticket?.logChannelId
            ? `<#${settings.ticket.logChannelId}>`
            : "Chưa thiết lập",
        inline: true
      },
      {
        name: "Kênh Panel",
        value:
          settings.ticket?.panelChannelId
            ? `<#${settings.ticket.panelChannelId}>`
            : "Chưa thiết lập",
        inline: true
      }
    )
    .setFooter({
      text: "Corgi Studio • Ticket System"
    });

  const toggleButton = new ButtonBuilder()
    .setCustomId("ticket_toggle")
    .setLabel(
      enabled
        ? "Tắt Ticket"
        : "Bật Ticket"
    )
    .setEmoji(
      enabled
        ? "🔴"
        : "🟢"
    )
    .setStyle(
      enabled
        ? ButtonStyle.Danger
        : ButtonStyle.Success
    );

  const configButton = new ButtonBuilder()
    .setCustomId("ticket_config")
    .setLabel("Cấu hình")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Primary);

  const customizeButton = new ButtonBuilder()
    .setCustomId("ticket_customize_panel")
    .setLabel("Tùy chỉnh Panel")
    .setEmoji("✏️")
    .setStyle(ButtonStyle.Secondary);

  const panelButton = new ButtonBuilder()
    .setCustomId("ticket_panel")
    .setLabel("Đăng Panel")
    .setEmoji("📤")
    .setStyle(ButtonStyle.Secondary);

  const backButton = new ButtonBuilder()
    .setCustomId("setup_back")
    .setLabel("Quay lại")
    .setEmoji("⬅️")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder()
    .addComponents(
      toggleButton,
      configButton,
      customizeButton,
      panelButton,
      backButton
    );

  await interaction.update({
    embeds: [embed],
    components: [row]
  });
}

module.exports = {
  renderTicketSettings
};