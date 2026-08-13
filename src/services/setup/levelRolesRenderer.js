const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

function renderLevelRoles(settings) {
  const levelRoles =
    settings.leveling?.levelRoles || [];

  let roleText =
    "⚪ Chưa có mốc Level Role nào.";

  if (levelRoles.length > 0) {
    roleText =
      [...levelRoles]
        .sort(
          (a, b) =>
            Number(a.level) -
            Number(b.level)
        )
        .map(
          (item) =>
            `⭐ Level **${item.level}** → <@&${item.roleId}>`
        )
        .join("\n");
  }

  const embed =
    new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(
        "🎖️ Cấu hình Level Roles"
      )
      .setDescription(
        "Thiết lập Role tự động theo mốc Level riêng cho server này.\n\n" +
        "Khi thành viên đạt một mốc mới, bot sẽ cấp Role cao nhất phù hợp."
      )
      .addFields({
        name: "📋 Các mốc hiện tại",
        value: roleText
      })
      .setFooter({
        text:
          "Corgi Studio • Server Level Roles"
      })
      .setTimestamp();

  const addButton =
    new ButtonBuilder()
      .setCustomId(
        "xp_level_role_add"
      )
      .setLabel(
        "Thêm mốc"
      )
      .setEmoji("➕")
      .setStyle(
        ButtonStyle.Success
      );

  const removeButton =
    new ButtonBuilder()
      .setCustomId(
        "xp_level_role_remove"
      )
      .setLabel(
        "Xóa mốc"
      )
      .setEmoji("🗑️")
      .setStyle(
        ButtonStyle.Danger
      );

  const syncButton =
    new ButtonBuilder()
      .setCustomId(
        "xp_level_role_sync"
      )
      .setLabel(
        "Đồng bộ Roles"
      )
      .setEmoji("🔄")
      .setStyle(
        ButtonStyle.Primary
      );

  const backButton =
    new ButtonBuilder()
      .setCustomId(
        "xp_level_roles_back"
      )
      .setLabel(
        "Quay lại"
      )
      .setEmoji("⬅️")
      .setStyle(
        ButtonStyle.Secondary
      );

  const row =
    new ActionRowBuilder()
      .addComponents(
        addButton,
        removeButton,
        syncButton,
        backButton
      );

  return {
    embeds: [embed],
    components: [row]
  };
}

module.exports = {
  renderLevelRoles
};