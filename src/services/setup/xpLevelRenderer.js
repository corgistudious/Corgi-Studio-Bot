const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

function renderXpLevel(
  settings,
  isDev = false,
  canManageConfig = false
) {
  const leveling =
    settings.leveling || {};

  const enabled =
    leveling.enabled ?? true;

  const xpMin =
    leveling.xpMin ?? 15;

  const xpMax =
    leveling.xpMax ?? 25;

  const cooldown =
    leveling.cooldown ?? 60;

  const levelUpChannelId =
    leveling.levelUpChannelId || null;

  const levelRoles =
    leveling.levelRoles || [];

  // =====================================
  // LEVEL UP CHANNEL DISPLAY
  // =====================================

  const channelDisplay =
    levelUpChannelId
      ? `<#${levelUpChannelId}>`
      : "⚪ Chưa thiết lập";

  // =====================================
  // LEVEL ROLES DISPLAY
  // =====================================

  let levelRolesDisplay =
    "⚪ Chưa thiết lập";

  if (
    Array.isArray(levelRoles) &&
    levelRoles.length > 0
  ) {
    const sortedRoles =
      [...levelRoles]
        .sort(
          (a, b) =>
            Number(a.level) -
            Number(b.level)
        )
        .slice(0, 5);

    levelRolesDisplay =
      sortedRoles
        .map(
          (item) =>
            `Level **${item.level}** → <@&${item.roleId}>`
        )
        .join("\n");

    if (levelRoles.length > 5) {
      levelRolesDisplay +=
        `\n... và **${levelRoles.length - 5}** mốc khác`;
    }
  }

  // =====================================
  // EMBED
  // =====================================

  const embed =
    new EmbedBuilder()
      .setColor(
        enabled
          ? 0x57f287
          : 0xed4245
      )

      .setTitle(
        "📊 Cấu hình XP & Level"
      )

      .setDescription(
        "Quản lý hệ thống XP & Level của Corgi Studio.\n\n" +
        "⚙️ **Server Configuration** cho phép Server Owner / Manager tùy chỉnh cấu hình của server.\n" +
        "🔐 **XP Manager** quản lý trực tiếp XP / Level của User và chỉ dành cho Bot Developer."
      )

      .addFields(
        {
          name:
            "📡 Trạng thái XP",

          value:
            enabled
              ? "🟢 Đang bật"
              : "🔴 Đang tắt",

          inline:
            true
        },

        {
          name:
            "⚡ XP",

          value:
            `\`${xpMin} - ${xpMax}\` XP`,

          inline:
            true
        },

        {
          name:
            "⏱️ Cooldown",

          value:
            `\`${cooldown}\` giây`,

          inline:
            true
        },

        {
          name:
            "🎖️ Level Roles",

          value:
            levelRolesDisplay,

          inline:
            false
        },

        {
          name:
            "📢 Kênh Level Up",

          value:
            channelDisplay,

          inline:
            false
        },

        {
          name:
            "⚙️ Server Configuration",

          value:
            canManageConfig
              ? "✅ Bạn có quyền quản lý cấu hình Server."
              : "🔒 Cần quyền Server Owner / Administrator / Manage Server / Moderator.",

          inline:
            false
        },

        {
          name:
            "🔐 XP Manager",

          value:
            isDev
              ? "✅ Bạn có quyền Bot Developer."
              : "🔒 Các thao tác cộng/trừ/đặt XP và Level chỉ dành cho Bot Developer.",

          inline:
            false
        }
      )

      .setFooter({
        text:
          isDev
            ? "Corgi Studio • Developer + Server Configuration"
            : "Corgi Studio • Server Configuration"
      })

      .setTimestamp();

  // =====================================
  // SERVER CONFIGURATION
  // OWNER / ADMIN / MANAGER / MODERATOR
  // =====================================

  const toggle =
    new ButtonBuilder()
      .setCustomId(
        "xp_toggle"
      )

      .setLabel(
        enabled
          ? "Tắt XP"
          : "Bật XP"
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
      )

      .setDisabled(
        !canManageConfig
      );

  const config =
    new ButtonBuilder()
      .setCustomId(
        "xp_config"
      )

      .setLabel(
        "XP Config"
      )

      .setEmoji(
        "⚙️"
      )

      .setStyle(
        ButtonStyle.Primary
      )

      .setDisabled(
        !canManageConfig
      );

  // =====================================
  // XP MANAGER
  // DEVELOPER ONLY
  // =====================================

  const manage =
    new ButtonBuilder()
      .setCustomId(
        "xp_manage"
      )

      .setLabel(
        "Quản lý XP"
      )

      .setEmoji(
        "🛠️"
      )

      .setStyle(
        ButtonStyle.Secondary
      )

      .setDisabled(
        !isDev
      );

  // =====================================
  // SERVER CONFIGURATION BUTTONS
  // =====================================

  const levelRoleButton =
    new ButtonBuilder()
      .setCustomId(
        "xp_level_roles"
      )

      .setLabel(
        "Level Roles"
      )

      .setEmoji(
        "🎖️"
      )

      .setStyle(
        ButtonStyle.Primary
      )

      .setDisabled(
        !canManageConfig
      );

  const levelChannelButton =
    new ButtonBuilder()
      .setCustomId(
        "xp_level_channel"
      )

      .setLabel(
        "Kênh Level Up"
      )

      .setEmoji(
        "📢"
      )

      .setStyle(
        ButtonStyle.Primary
      )

      .setDisabled(
        !canManageConfig
      );

  // =====================================
  // BACK
  // =====================================

  const back =
    new ButtonBuilder()
      .setCustomId(
        "setup_back"
      )

      .setLabel(
        "Quay lại"
      )

      .setEmoji(
        "⬅️"
      )

      .setStyle(
        ButtonStyle.Secondary
      );

  // =====================================
  // ROW 1
  // SERVER CONFIGURATION
  // =====================================

  const serverRow =
    new ActionRowBuilder()
      .addComponents(
        levelRoleButton,
        levelChannelButton
      );

  // =====================================
  // ROW 2
  // XP CONFIG + XP MANAGER
  // =====================================

  const developerRow =
    new ActionRowBuilder()
      .addComponents(
        toggle,
        config,
        manage,
        back
      );

  // =====================================
  // RETURN
  // =====================================

  return {
    embeds: [
      embed
    ],

    components: [
      serverRow,
      developerRow
    ]
  };
}

module.exports = {
  renderXpLevel
};