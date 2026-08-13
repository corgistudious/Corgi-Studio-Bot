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
  customId: "autorole_toggle",

  async execute(interaction) {
    const settings = await getGuildSettings(
      interaction.guildId
    );

    const newStatus = !settings.autoRole.enabled;

    const updated = await updateGuildSettings(
      interaction.guildId,
      {
        $set: {
          "autoRole.enabled": newStatus
        }
      }
    );

    const embed = new EmbedBuilder()
      .setColor(
        updated.autoRole.enabled
          ? 0x57f287
          : 0xed4245
      )
      .setTitle("🎭 Cấu hình Auto Role")
      .setDescription(
        "Tự động cấp Role cho thành viên mới khi tham gia server."
      )
      .addFields(
        {
          name: "Trạng thái",
          value: updated.autoRole.enabled
            ? "🟢 Đang bật"
            : "🔴 Đang tắt",
          inline: true
        },
        {
          name: "Role tự động",
          value: updated.autoRole.roleId
            ? `<@&${updated.autoRole.roleId}>`
            : "Chưa thiết lập",
          inline: true
        }
      );

    const toggleButton = new ButtonBuilder()
      .setCustomId("autorole_toggle")
      .setLabel(
        updated.autoRole.enabled
          ? "Tắt Auto Role"
          : "Bật Auto Role"
      )
      .setEmoji(
        updated.autoRole.enabled
          ? "🔴"
          : "🟢"
      )
      .setStyle(
        updated.autoRole.enabled
          ? ButtonStyle.Danger
          : ButtonStyle.Success
      );

    const roleButton = new ButtonBuilder()
      .setCustomId("autorole_select_role")
      .setLabel("Chọn Role")
      .setEmoji("🎭")
      .setStyle(ButtonStyle.Primary);

    const backButton = new ButtonBuilder()
      .setCustomId("setup_back")
      .setLabel("Quay lại")
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
      .addComponents(
        toggleButton,
        roleButton,
        backButton
      );

    await interaction.update({
      embeds: [embed],
      components: [row]
    });
  }
};