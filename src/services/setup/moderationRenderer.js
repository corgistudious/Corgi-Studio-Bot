const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

function renderModeration(settings) {
  const moderation =
    settings.moderation || {};

  const antiSpam =
    moderation.antiSpam || {};

  // =====================================
  // SETTINGS
  // =====================================

  const enabled =
    antiSpam.enabled ?? false;

  const maxMessages =
    antiSpam.maxMessages ?? 5;

  const intervalSeconds =
    antiSpam.intervalSeconds ?? 5;

  const timeoutSeconds =
    antiSpam.timeoutSeconds ?? 60;

  const logChannelId =
    moderation.logChannelId || null;

  const muteRoleId =
    moderation.muteRoleId || null;

  const ignoredRoleId =
    antiSpam.ignoredRoleId || null;

  const ignoredChannelId =
    antiSpam.ignoredChannelId || null;

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
        "🛡️ Moderation & Anti Spam"
      )

      .setDescription(
        "Quản lý hệ thống chống spam và cấu hình Moderation của server.\n\n" +
        "⚖️ Các chức năng quản trị thành viên được sử dụng bằng Slash Command:\n" +
        "`/warn` • `/mute` • `/unmute` • `/kick` • `/ban` • `/unban`"
      )

      .addFields(
        {
          name:
            "🚨 Anti Spam",

          value:
            enabled
              ? "🟢 Đang bật"
              : "🔴 Đang tắt",

          inline:
            true
        },

        {
          name:
            "💬 Giới hạn",

          value:
            `\`${maxMessages}\` tin nhắn`,

          inline:
            true
        },

        {
          name:
            "⏱️ Khoảng thời gian",

          value:
            `\`${intervalSeconds}\` giây`,

          inline:
            true
        },

        {
          name:
            "🔇 Timeout Anti Spam",

          value:
            `\`${timeoutSeconds}\` giây`,

          inline:
            true
        },

        {
          name:
            "📜 Mod Log",

          value:
            logChannelId
              ? `<#${logChannelId}>`
              : "⚪ Chưa thiết lập",

          inline:
            true
        },

        {
          name:
            "🔇 Mute Role",

          value:
            muteRoleId
              ? `<@&${muteRoleId}>`
              : "⚪ Chưa thiết lập",

          inline:
            true
        },

        {
          name:
            "🎭 Bỏ qua Role",

          value:
            ignoredRoleId
              ? `<@&${ignoredRoleId}>`
              : "⚪ Không có",

          inline:
            true
        },

        {
          name:
            "📢 Bỏ qua Channel",

          value:
            ignoredChannelId
              ? `<#${ignoredChannelId}>`
              : "⚪ Không có",

          inline:
            true
        },

        {
          name:
            "⚖️ Lệnh Moderation",

          value:
            "`/warn` • `/mute` • `/unmute` • `/kick` • `/ban` • `/unban`",

          inline:
            false
        }
      )

      .setFooter({
        text:
          "Corgi Studio • Moderation System"
      })

      .setTimestamp();

  // =====================================
  // ROW 1 — ANTI SPAM
  // =====================================

  const toggle =
    new ButtonBuilder()
      .setCustomId(
        "moderation_antispam_toggle"
      )

      .setLabel(
        enabled
          ? "Tắt Anti Spam"
          : "Bật Anti Spam"
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

  const config =
    new ButtonBuilder()
      .setCustomId(
        "moderation_antispam_config"
      )

      .setLabel(
        "Cấu hình Anti Spam"
      )

      .setEmoji(
        "⚙️"
      )

      .setStyle(
        ButtonStyle.Primary
      );

  const logChannel =
    new ButtonBuilder()
      .setCustomId(
        "moderation_log_channel"
      )

      .setLabel(
        "Mod Log"
      )

      .setEmoji(
        "📜"
      )

      .setStyle(
        ButtonStyle.Secondary
      );

  const row1 =
    new ActionRowBuilder()
      .addComponents(
        toggle,
        config,
        logChannel
      );

  // =====================================
  // ROW 2 — MODERATION CONFIG
  // =====================================

  const muteRole =
    new ButtonBuilder()
      .setCustomId(
        "moderation_mute_role"
      )

      .setLabel(
        "Mute Role"
      )

      .setEmoji(
        "🔇"
      )

      .setStyle(
        ButtonStyle.Secondary
      );

  const ignoredRole =
    new ButtonBuilder()
      .setCustomId(
        "moderation_ignore_role"
      )

      .setLabel(
        "Bỏ qua Role"
      )

      .setEmoji(
        "🎭"
      )

      .setStyle(
        ButtonStyle.Secondary
      );

  const ignoredChannel =
    new ButtonBuilder()
      .setCustomId(
        "moderation_ignore_channel"
      )

      .setLabel(
        "Bỏ qua Channel"
      )

      .setEmoji(
        "📢"
      )

      .setStyle(
        ButtonStyle.Secondary
      );

  const row2 =
    new ActionRowBuilder()
      .addComponents(
        muteRole,
        ignoredRole,
        ignoredChannel
      );

  // =====================================
  // ROW 3 — BACK
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

  const row3 =
    new ActionRowBuilder()
      .addComponents(
        back
      );

  // =====================================
  // RESULT
  // =====================================

  return {
    embeds: [
      embed
    ],

    components: [
      row1,
      row2,
      row3
    ]
  };
}

module.exports = {
  renderModeration
};