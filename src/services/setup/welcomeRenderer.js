const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const {
  getGuildSettings
} = require("../guildSettingsService");

async function renderWelcomeSettings(interaction) {
  const settings = await getGuildSettings(
    interaction.guildId
  );

  const enabled = settings.welcome.enabled;

  const embed = new EmbedBuilder()
    .setColor(
      enabled
        ? 0x57f287
        : 0xed4245
    )
    .setTitle("👋 Cấu hình Welcome")
    .setDescription(
      "Quản lý hệ thống chào mừng thành viên mới."
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
        name: "Kênh Welcome",
        value:
          settings.welcome.channelId
            ? `<#${settings.welcome.channelId}>`
            : "Chưa thiết lập",
        inline: true
      },
      {
        name: "Tin nhắn",
        value:
          settings.welcome.message ||
          "Chưa thiết lập"
      }
    )
    .setFooter({
      text:
        "Corgi Studio • Welcome System"
    });

  const toggleButton =
    new ButtonBuilder()
      .setCustomId("welcome_toggle")
      .setLabel(
        enabled
          ? "Tắt Welcome"
          : "Bật Welcome"
      )
      .setEmoji(
        enabled ? "🔴" : "🟢"
      )
      .setStyle(
        enabled
          ? ButtonStyle.Danger
          : ButtonStyle.Success
      );

  const channelButton =
    new ButtonBuilder()
      .setCustomId(
        "welcome_select_channel"
      )
      .setLabel("Chọn kênh")
      .setEmoji("📢")
      .setStyle(
        ButtonStyle.Primary
      );

  const messageButton =
    new ButtonBuilder()
      .setCustomId(
        "welcome_edit_message"
      )
      .setLabel("Sửa tin nhắn")
      .setEmoji("✏️")
      .setStyle(
        ButtonStyle.Secondary
      );

  const backButton =
    new ButtonBuilder()
      .setCustomId("setup_back")
      .setLabel("Quay lại")
      .setEmoji("⬅️")
      .setStyle(
        ButtonStyle.Secondary
      );

  const row =
    new ActionRowBuilder()
      .addComponents(
        toggleButton,
        channelButton,
        messageButton,
        backButton
      );

  await interaction.update({
    embeds: [embed],
    components: [row]
  });
}

module.exports = {
  renderWelcomeSettings
};