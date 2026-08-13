const {
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  getModerationCase
} = require(
  "../../services/moderationCaseService"
);

// =====================================
// FORMAT DURATION
// =====================================

function formatDuration(ms) {
  if (
    ms === null ||
    ms === undefined
  ) {
    return "Không có";
  }

  const totalSeconds =
    Math.floor(
      Number(ms) / 1000
    );

  if (
    !Number.isFinite(totalSeconds) ||
    totalSeconds <= 0
  ) {
    return "Không có";
  }

  const days =
    Math.floor(
      totalSeconds / 86400
    );

  const hours =
    Math.floor(
      (totalSeconds % 86400) / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );

  const seconds =
    totalSeconds % 60;

  const parts = [];

  if (days > 0) {
    parts.push(`${days} ngày`);
  }

  if (hours > 0) {
    parts.push(`${hours} giờ`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} phút`);
  }

  if (
    seconds > 0 &&
    days === 0
  ) {
    parts.push(`${seconds} giây`);
  }

  return (
    parts.join(" ") ||
    "Không có"
  );
}

// =====================================
// CASE COLOR
// =====================================

function getCaseColor(type) {
  switch (
    String(type).toUpperCase()
  ) {
    case "WARN":
      return 0xfee75c;

    case "TIMEOUT":
      return 0xf0b232;

    case "KICK":
      return 0xe67e22;

    case "BAN":
      return 0xed4245;

    case "UNBAN":
      return 0x57f287;

    case "UNMUTE":
      return 0x57f287;

    default:
      return 0x5865f2;
  }
}

module.exports = {
  name: "case",

  aliases: [],

  async execute({
    message,
    args
  }) {
    try {
      // =====================================
      // GUILD ONLY
      // =====================================

      if (!message.guild) {
        return;
      }

      // =====================================
      // PERMISSION
      // =====================================

      const hasPermission =
        message.member.permissions.has(
          PermissionFlagsBits.ModerateMembers
        ) ||
        message.member.permissions.has(
          PermissionFlagsBits.Administrator
        );

      if (!hasPermission) {
        return message.reply({
          content:
            "🔒 Bạn cần quyền **Moderate Members** để sử dụng `?case`.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // CASE ID
      // =====================================

      const caseId =
        Number(
          args[0]
        );

      if (
        !Number.isInteger(caseId) ||
        caseId < 1
      ) {
        return message.reply({
          content:
            "❌ Cách dùng:\n" +
            "`?case 15`",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // DATABASE
      // =====================================

      const moderationCase =
        await getModerationCase(
          message.guild.id,
          caseId
        );

      if (!moderationCase) {
        return message.reply({
          content:
            `❌ Không tìm thấy Moderation Case **#${caseId}** trong server này.`,

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // FETCH USERS
      // =====================================

      let targetUser = null;
      let moderatorUser = null;

      try {
        targetUser =
          await message.client.users.fetch(
            moderationCase.targetUserId
          );
      } catch {}

      try {
        moderatorUser =
          await message.client.users.fetch(
            moderationCase.moderatorUserId
          );
      } catch {}

      const targetText =
        targetUser
          ? `${targetUser.tag}\n\`${targetUser.id}\``
          : `<@${moderationCase.targetUserId}>\n\`${moderationCase.targetUserId}\``;

      const moderatorText =
        moderatorUser
          ? `${moderatorUser.tag}\n\`${moderatorUser.id}\``
          : `<@${moderationCase.moderatorUserId}>\n\`${moderationCase.moderatorUserId}\``;

      // =====================================
      // STATUS
      // =====================================

      const statusText =
        moderationCase.active
          ? "🟢 Active"
          : "⚪ Closed";

      const durationText =
        formatDuration(
          moderationCase.duration
        );

      const createdTimestamp =
        Math.floor(
          new Date(
            moderationCase.createdAt
          ).getTime() / 1000
        );

      // =====================================
      // EMBED
      // =====================================

      const embed =
        new EmbedBuilder()

          .setColor(
            getCaseColor(
              moderationCase.type
            )
          )

          .setTitle(
            `📋 Moderation Case #${moderationCase.caseId}`
          )

          .addFields(
            {
              name:
                "⚖️ Hành động",

              value:
                `**${moderationCase.type}**`,

              inline:
                true
            },

            {
              name:
                "📌 Trạng thái",

              value:
                statusText,

              inline:
                true
            },

            {
              name:
                "⏱️ Thời hạn",

              value:
                durationText,

              inline:
                true
            },

            {
              name:
                "👤 Thành viên",

              value:
                targetText,

              inline:
                true
            },

            {
              name:
                "🛡️ Moderator",

              value:
                moderatorText,

              inline:
                true
            },

            {
              name:
                "📝 Lý do",

              value:
                moderationCase.reason ||
                "Không có lý do.",

              inline:
                false
            },

            {
              name:
                "🕒 Thời gian tạo",

              value:
                `<t:${createdTimestamp}:F>\n` +
                `<t:${createdTimestamp}:R>`,

              inline:
                false
            }
          )

          .setFooter({
            text:
              `Corgi Studio • Case #${moderationCase.caseId}`
          })

          .setTimestamp();

      if (targetUser) {
        embed.setThumbnail(
          targetUser.displayAvatarURL({
            size: 256
          })
        );
      }

      // =====================================
      // SEND
      // =====================================

      await message.reply({
        embeds: [
          embed
        ],

        allowedMentions: {
          repliedUser: false,
          parse: []
        }
      });

      // =====================================
      // TERMINAL
      // =====================================

      console.log(
        `📋 PREFIX CASE VIEW | ` +
        `#${moderationCase.caseId} | ` +
        `${message.author.tag} | ` +
        `Guild ${message.guild.id}`
      );
    } catch (error) {
      console.error(
        "❌ Prefix Case Error:",
        error
      );

      try {
        await message.reply({
          content:
            "❌ Không thể tải Moderation Case.",

          allowedMentions: {
            repliedUser: false
          }
        });
      } catch {}
    }
  }
};