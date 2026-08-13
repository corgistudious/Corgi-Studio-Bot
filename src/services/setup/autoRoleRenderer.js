const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const {
  getGuildSettings
} = require("../guildSettingsService");

async function renderAutoRoleSettings(
  interaction
) {
  const settings = await getGuildSettings(
    interaction.guildId
  );

  const enabled =
    settings.autoRole.enabled;

  const embed = new EmbedBuilder()
    .setColor(
      enabled
        ? 0x57f287
        : 0xed4245
    )
    .setTitle(
      "🎭 Cấu hình Auto Role"
    )
    .setDescription(
      "Tự động cấp Role cho thành viên mới khi tham gia server."
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
        name: "Role tự động",
        value:
          settings.autoRole.roleId
            ? `<@&${settings.autoRole.roleId}>`
            : "Chưa thiết lập",
        inline: true
      }
    )
    .setFooter({
      text:
        "Corgi Studio • Auto Role System"
    });

  const toggleButton =
    new ButtonBuilder()
      .setCustomId(
        "autorole_toggle"
      )
      .setLabel(
        enabled
          ? "Tắt Auto Role"
          : "Bật Auto Role"
      )
      .setEmoji(
        enabled ? "🔴" : "🟢"
      )
      .setStyle(
        enabled
          ? ButtonStyle.Danger
          : ButtonStyle.Success
      );

  const roleButton =
    new ButtonBuilder()
      .setCustomId(
        "autorole_select_role"
      )
      .setLabel("Chọn Role")
      .setEmoji("🎭")
      .setStyle(
        ButtonStyle.Primary
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
        roleButton,
        backButton
      );

  await interaction.update({
    embeds: [embed],
    components: [row]
  });
}

module.exports = {
  renderAutoRoleSettings
};