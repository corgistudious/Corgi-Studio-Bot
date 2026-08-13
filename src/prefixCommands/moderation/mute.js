const {
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  executeMute
} = require(
  "../../services/moderation/muteService"
);

// =====================================
// PARSE DURATION
// =====================================

function parseDuration(input) {
  if (!input) {
    return null;
  }

  const match =
    input
      .trim()
      .toLowerCase()
      .match(
        /^(\d+)(s|m|h|d)$/
      );

  if (!match) {
    return null;
  }

  const amount =
    Number(match[1]);

  if (
    !Number.isInteger(amount) ||
    amount <= 0
  ) {
    return null;
  }

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return (
    amount *
    multipliers[match[2]]
  );
}

// =====================================
// COMMAND
// =====================================

module.exports = {
  name: "mute",

  aliases: [],

  async execute({
    message,
    args
  }) {
    try {
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
            "🔒 Bạn cần quyền **Moderate Members** để sử dụng `?mute`.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // TARGET
      // =====================================

      const member =
        message.mentions.members.first();

      if (!member) {
        return message.reply({
          content:
            "❌ Cách dùng:\n" +
            "`?mute @User 10m lý do`",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // DURATION
      // args[0] = @User
      // args[1] = duration
      // =====================================

      const durationInput =
        args[1];

      const durationMs =
        parseDuration(
          durationInput
        );

      if (!durationMs) {
        return message.reply({
          content:
            "❌ Thời gian Mute không hợp lệ.\n\n" +
            "Ví dụ:\n" +
            "`?mute @User 30s Spam`\n" +
            "`?mute @User 10m Spam`\n" +
            "`?mute @User 1h Spam`\n" +
            "`?mute @User 1d Spam`\n" +
            "`?mute @User 7d Spam`",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // MAXIMUM 28 DAYS
      // =====================================

      const MAX_MUTE =
        28 *
        24 *
        60 *
        60 *
        1000;

      if (
        durationMs >
        MAX_MUTE
      ) {
        return message.reply({
          content:
            "❌ Thời gian Mute không được vượt quá **28 ngày**.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // REASON
      // args[2...] = reason
      // =====================================

      const reason =
        args
          .slice(2)
          .join(" ")
          .trim() ||
        "Không có lý do.";

      // =====================================
      // SELF PROTECTION
      // =====================================

      if (
        member.id ===
        message.author.id
      ) {
        return message.reply({
          content:
            "❌ Bạn không thể Mute chính mình.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // BOT PROTECTION
      // =====================================

      if (
        member.id ===
        message.client.user.id
      ) {
        return message.reply({
          content:
            "❌ Không thể Mute Corgi-Bot.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // SERVER OWNER PROTECTION
      // =====================================

      if (
        member.id ===
        message.guild.ownerId
      ) {
        return message.reply({
          content:
            "❌ Không thể Mute Server Owner.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // MODERATOR ROLE HIERARCHY
      // =====================================

      if (
        message.author.id !==
          message.guild.ownerId &&
        message.member.roles.highest
          .comparePositionTo(
            member.roles.highest
          ) <= 0
      ) {
        return message.reply({
          content:
            "❌ Bạn không thể Mute thành viên có Role bằng hoặc cao hơn Role của bạn.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // SHARED MUTE SERVICE
      // =====================================

      const result =
        await executeMute({
          guild:
            message.guild,

          member,

          moderator:
            message.author,

          durationMs,

          reason,

          commandName:
            "?mute"
        });

      // =====================================
      // SUCCESS EMBED
      // =====================================

      const successEmbed =
        new EmbedBuilder()

          .setColor(
            0x57f287
          )

          .setTitle(
            "✅ Mute thành công"
          )

          .addFields(
            {
              name:
                "📋 Case",

              value:
                `**#${result.moderationCase.caseId}**`,

              inline:
                true
            },

            {
              name:
                "👤 Thành viên",

              value:
                `${member}`,

              inline:
                true
            },

            {
              name:
                "🔇 Hành động",

              value:
                "**MUTE**",

              inline:
                true
            },

            {
              name:
                "⏱️ Thời gian",

              value:
                `**${result.durationText}**`,

              inline:
                true
            },

            {
              name:
                "🔇 Mute Role",

              value:
                result.muteRoleStatus,

              inline:
                true
            },

            {
              name:
                "📩 DM",

              value:
                result.dmSent
                  ? "✅ Đã gửi"
                  : "⚠️ User tắt DM",

              inline:
                true
            },

            {
              name:
                "📜 Mod Log",

              value:
                result.logSent
                  ? "✅ Đã ghi"
                  : (
                      result.logChannelId
                        ? "⚠️ Không gửi được"
                        : "⚪ Chưa cấu hình"
                    ),

              inline:
                true
            },

            {
              name:
                "📝 Lý do",

              value:
                result.reason,

              inline:
                false
            }
          )

          .setThumbnail(
            member.user.displayAvatarURL({
              size: 256
            })
          )

          .setFooter({
            text:
              "Corgi Studio • Prefix Moderation"
          })

          .setTimestamp();

      // =====================================
      // RESPONSE
      // =====================================

      await message.reply({
        embeds: [
          successEmbed
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
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        `🔇 PREFIX MUTE CASE #${result.moderationCase.caseId}`
      );

      console.log(
        `🌐 Guild: ${message.guild.name} (${message.guild.id})`
      );

      console.log(
        `🛡️ Moderator: ${message.author.tag} (${message.author.id})`
      );

      console.log(
        `👤 Target: ${member.user.tag} (${member.id})`
      );

      console.log(
        `⏱️ Duration: ${result.durationText}`
      );

      console.log(
        `🔇 Mute Role: ${
          result.muteRoleAdded
            ? result.muteRole?.name
            : result.muteRoleStatus
        }`
      );

      console.log(
        `📝 Reason: ${result.reason}`
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );
    } catch (error) {
      console.error(
        "❌ Prefix Mute Error:",
        error
      );

      let errorMessage =
        "❌ Không thể Mute thành viên.";

      if (
        error?.message ===
        "MUTE_BOT_MISSING_MODERATE_MEMBERS"
      ) {
        errorMessage =
          "❌ Corgi-Bot chưa có quyền **Moderate Members**.";
      }

      if (
        error?.message ===
        "MUTE_MEMBER_NOT_MODERATABLE"
      ) {
        errorMessage =
          "❌ Corgi-Bot không thể Mute thành viên này.\n" +
          "Hãy kiểm tra Role của Bot có nằm **cao hơn Role của thành viên** hay không.";
      }

      try {
        await message.reply({
          content:
            errorMessage,

          allowedMentions: {
            repliedUser: false
          }
        });
      } catch {}
    }
  }
};