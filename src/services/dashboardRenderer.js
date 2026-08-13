const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

function status(enabled) {
  return enabled ? "🟢 Bật" : "🔴 Tắt";
}

function buildMainDashboard(settings) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🐶 Corgi Studio — Bảng Điều Khiển")
    .setDescription(
      "Quản lý các chức năng của bot trực tiếp trong Discord.\n\n" +
      "Chọn một hệ thống ở menu bên dưới để bắt đầu cấu hình."
    )
    .addFields(
      {
        name: "👋 Welcome",
        value: status(settings.welcome.enabled),
        inline: true
      },
      {
        name: "🎭 Auto Role",
        value: status(settings.autoRole.enabled),
        inline: true
      },
      {
        name: "🎫 Ticket",
        value: status(settings.ticket.enabled),
        inline: true
      },
      {
        name: "📊 XP & Level",
        value: status(settings.leveling.enabled),
        inline: true
      },
      {
        name: "📜 Logs",
        value: status(settings.logs.enabled),
        inline: true
      },
      {
        name: "🛡 Anti Spam",
        value: status(
          settings.moderation.antiSpam.enabled
        ),
        inline: true
      }
    )
    .setFooter({
      text: "Corgi Studio • Bot Management System"
    })
    .setTimestamp();

  const menu = new StringSelectMenuBuilder()
    .setCustomId("setup_main_menu")
    .setPlaceholder("⚙️ Chọn hệ thống cần cấu hình")
    .addOptions(
      {
        label: "General",
        description: "Cài đặt chung của bot",
        value: "general",
        emoji: "⚙️"
      },
      {
        label: "Welcome",
        description: "Cấu hình chào mừng thành viên",
        value: "welcome",
        emoji: "👋"
      },
      {
        label: "Auto Role",
        description: "Tự động cấp role",
        value: "autorole",
        emoji: "🎭"
      },
      {
        label: "Ticket",
        description: "Hệ thống hỗ trợ Ticket",
        value: "ticket",
        emoji: "🎫"
      },
      {
        label: "XP & Level",
        description: "Hệ thống cấp độ",
        value: "leveling",
        emoji: "📊"
      },
      {
        label: "Logs",
        description: "Nhật ký hoạt động server",
        value: "logs",
        emoji: "📜"
      },
      {
        label: "Moderation",
        description: "Anti Spam và quản trị",
        value: "moderation",
        emoji: "🛡️"
      },
      {
        label: "Giveaway",
        description: "Quản lý Giveaway",
        value: "giveaway",
        emoji: "🎉"
      },
      {
        label: "Survey",
        description: "Quản lý khảo sát",
        value: "survey",
        emoji: "📝"
      }
    );

  const menuRow = new ActionRowBuilder()
    .addComponents(menu);

  const refreshButton = new ButtonBuilder()
    .setCustomId("setup_refresh")
    .setLabel("Làm mới")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const closeButton = new ButtonBuilder()
    .setCustomId("setup_close")
    .setLabel("Đóng")
    .setEmoji("✖️")
    .setStyle(ButtonStyle.Danger);

  const buttonRow = new ActionRowBuilder()
    .addComponents(
      refreshButton,
      closeButton
    );

  return {
    embeds: [embed],
    components: [
      menuRow,
      buttonRow
    ]
  };
}

module.exports = {
  buildMainDashboard
};