const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const DeveloperAuditLog =
  require("../models/DeveloperAuditLog");

const LOGS_PER_PAGE = 10;

const ACTION_NAMES = {
  XP_ADD: "➕ Cộng XP",
  XP_REMOVE: "➖ Trừ XP",
  XP_SET: "✨ Đặt XP",

  LEVEL_ADD: "⬆️ Tăng Level",
  LEVEL_REMOVE: "⬇️ Giảm Level",
  LEVEL_SET: "⭐ Đặt Level",

  RESET: "♻️ Reset XP & Level"
};

function formatNumber(value) {
  const number =
    Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString();
}

function formatDiscordTime(date) {
  if (!date) {
    return "Không xác định";
  }

  const time =
    new Date(date).getTime();

  if (!Number.isFinite(time)) {
    return "Không xác định";
  }

  const timestamp =
    Math.floor(
      time / 1000
    );

  return `<t:${timestamp}:R>`;
}

function userMention(userId) {
  if (!userId) {
    return "`Unknown`";
  }

  return `<@${userId}>`;
}

async function renderDeveloperAuditLogs(
  client,
  page = 0
) {
  try {
    // =====================================
    // TOTAL LOGS
    // =====================================
    const totalLogs =
      await DeveloperAuditLog
        .countDocuments();

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          totalLogs /
          LOGS_PER_PAGE
        )
      );

    // =====================================
    // SAFE PAGE
    // =====================================
    const requestedPage =
      Number(page);

    const safePage =
      Math.max(
        0,
        Math.min(
          Number.isInteger(
            requestedPage
          )
            ? requestedPage
            : 0,

          totalPages - 1
        )
      );

    // =====================================
    // LOAD LOGS
    // =====================================
    const logs =
      await DeveloperAuditLog
        .find()
        .sort({
          createdAt: -1
        })
        .skip(
          safePage *
          LOGS_PER_PAGE
        )
        .limit(
          LOGS_PER_PAGE
        )
        .lean();

    // =====================================
    // EMBED
    // =====================================
    const embed =
      new EmbedBuilder()
        .setColor(
          0x5865f2
        )
        .setTitle(
          "📜 Developer Audit Logs"
        )
        .setDescription(
          "Lịch sử thao tác của **Developer Remote Control**.\n\n" +
          "Các thao tác XP/Level mới nhất được hiển thị trước."
        );

    // =====================================
    // EMPTY
    // =====================================
    if (logs.length === 0) {
      embed.addFields({
        name:
          "📭 Chưa có dữ liệu",

        value:
          "Chưa có Developer Audit Log nào được lưu.",

        inline:
          false
      });
    }

    // =====================================
    // LOG ITEMS
    // =====================================
    for (
      let index = 0;
      index < logs.length;
      index++
    ) {
      const log =
        logs[index];

      const number =
        safePage *
          LOGS_PER_PAGE +
        index +
        1;

      const actionName =
        ACTION_NAMES[
          log.action
        ] ||
        log.action ||
        "Unknown";

      // =====================================
      // GUILD
      // =====================================
      let guildName =
        "Unknown Guild";

      if (log.guildId) {
        const guild =
          client.guilds.cache.get(
            log.guildId
          );

        if (guild) {
          guildName =
            guild.name;
        } else {
          guildName =
            `Guild ${log.guildId}`;
        }
      }

      // =====================================
      // BEFORE / AFTER
      // =====================================
      const beforeLevel =
        formatNumber(
          log.before?.level
        );

      const beforeXp =
        formatNumber(
          log.before?.xp
        );

      const afterLevel =
        formatNumber(
          log.after?.level
        );

      const afterXp =
        formatNumber(
          log.after?.xp
        );

      // =====================================
      // VALUE
      // =====================================
      let value =
        `👨‍💻 Developer: ${userMention(log.developerId)}\n` +
        `👤 User: ${userMention(log.userId)}\n` +
        `🌐 Guild: **${guildName}**\n\n` +

        `📊 **Trước**\n` +
        `⭐ Level: **${beforeLevel}**\n` +
        `✨ XP: **${beforeXp}**\n\n` +

        `📈 **Sau**\n` +
        `⭐ Level: **${afterLevel}**\n` +
        `✨ XP: **${afterXp}**\n`;

      // =====================================
      // AMOUNT
      // =====================================
      if (
        log.amount !== null &&
        log.amount !== undefined
      ) {
        value +=
          `\n🛠️ Giá trị: **${formatNumber(log.amount)}**`;
      }

      value +=
        `\n🕒 ${formatDiscordTime(log.createdAt)}`;

      // =====================================
      // ADD FIELD
      // =====================================
      embed.addFields({
        name:
          `#${number} • ${actionName}`,

        value,

        inline:
          false
      });
    }

    // =====================================
    // FOOTER
    // =====================================
    embed
      .setFooter({
        text:
          `Corgi Studio • Trang ${safePage + 1}/${totalPages} • ${totalLogs} Logs`
      })
      .setTimestamp();

    // =====================================
    // UNIQUE CUSTOM IDS
    // =====================================

    const previousPage =
      Math.max(
        0,
        safePage - 1
      );

    const nextPage =
      Math.min(
        totalPages - 1,
        safePage + 1
      );

    // =====================================
    // PREVIOUS
    // =====================================
    const previousButton =
      new ButtonBuilder()
        .setCustomId(
          `dev_audit_page:prev:${previousPage}`
        )
        .setLabel(
          "Trước"
        )
        .setEmoji(
          "⬅️"
        )
        .setStyle(
          ButtonStyle.Secondary
        )
        .setDisabled(
          safePage <= 0
        );

    // =====================================
    // REFRESH
    // =====================================
    const refreshButton =
      new ButtonBuilder()
        .setCustomId(
          `dev_audit_page:refresh:${safePage}`
        )
        .setLabel(
          "Làm mới"
        )
        .setEmoji(
          "🔄"
        )
        .setStyle(
          ButtonStyle.Primary
        );

    // =====================================
    // NEXT
    // =====================================
    const nextButton =
      new ButtonBuilder()
        .setCustomId(
          `dev_audit_page:next:${nextPage}`
        )
        .setLabel(
          "Sau"
        )
        .setEmoji(
          "➡️"
        )
        .setStyle(
          ButtonStyle.Secondary
        )
        .setDisabled(
          safePage >=
          totalPages - 1
        );

    // =====================================
    // BACK
    // =====================================
    const backButton =
      new ButtonBuilder()
        .setCustomId(
          "dev_audit_back"
        )
        .setLabel(
          "Quay lại"
        )
        .setEmoji(
          "🏠"
        )
        .setStyle(
          ButtonStyle.Danger
        );

    // =====================================
    // ROW
    // =====================================
    const row =
      new ActionRowBuilder()
        .addComponents(
          previousButton,
          refreshButton,
          nextButton,
          backButton
        );

    return {
      embeds: [
        embed
      ],

      components: [
        row
      ]
    };
  } catch (error) {
    console.error(
      "❌ Developer Audit Renderer Error:",
      error
    );

    const errorEmbed =
      new EmbedBuilder()
        .setColor(
          0xed4245
        )
        .setTitle(
          "❌ Audit Logs Error"
        )
        .setDescription(
          "Không thể tải Developer Audit Logs."
        )
        .setTimestamp();

    const backButton =
      new ButtonBuilder()
        .setCustomId(
          "dev_audit_back"
        )
        .setLabel(
          "Quay lại"
        )
        .setEmoji(
          "🏠"
        )
        .setStyle(
          ButtonStyle.Secondary
        );

    const errorRow =
      new ActionRowBuilder()
        .addComponents(
          backButton
        );

    return {
      embeds: [
        errorEmbed
      ],

      components: [
        errorRow
      ]
    };
  }
}

module.exports = {
  renderDeveloperAuditLogs,
  LOGS_PER_PAGE
};