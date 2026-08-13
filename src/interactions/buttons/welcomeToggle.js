const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const {
  getGuildSettings,
  updateGuildSettings
} = require("../../services/guildSettingsService");

module.exports = {
  customId: "welcome_toggle",

  async execute(interaction) {
    const settings =
      await getGuildSettings(interaction.guildId);

    const newStatus =
      !settings.welcome.enabled;

    const updated =
      await updateGuildSettings(
        interaction.guildId,
        {
          $set: {
            "welcome.enabled": newStatus
          }
        }
      );

    const embed = new EmbedBuilder()
      .setColor(
        updated.welcome.enabled
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
          value: updated.welcome.enabled
            ? "🟢 Đang bật"
            : "🔴 Đang tắt",
          inline: true
        },
        {
          name: "Kênh Welcome",
          value: updated.welcome.channelId
            ? `<#${updated.welcome.channelId}>`
            : "Chưa thiết lập",
          inline: true
        },
        {
          name: "Tin nhắn",
          value:
            updated.welcome.message ||
            "Chưa thiết lập"
        }
      );

    const toggleButton =
      new ButtonBuilder()
        .setCustomId("welcome_toggle")
        .setLabel(
          updated.welcome.enabled
            ? "Tắt Welcome"
            : "Bật Welcome"
        )
        .setEmoji(
          updated.welcome.enabled
            ? "🔴"
            : "🟢"
        )
        .setStyle(
          updated.welcome.enabled
            ? ButtonStyle.Danger
            : ButtonStyle.Success
        );

    const backButton =
      new ButtonBuilder()
        .setCustomId("setup_back")
        .setLabel("Quay lại")
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Secondary);

    const row =
      new ActionRowBuilder()
        .addComponents(
          toggleButton,
          channelButton,
          mesageButton,
          backButton
        );

    await interaction.update({
      embeds: [embed],
      components: [row]
    });
  }
};