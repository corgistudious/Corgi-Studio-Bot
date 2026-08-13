const {
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  executeWarn
} = require(
  "../../services/moderation/warnService"
);

module.exports = {
  name: "warn",

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
            "🔒 Bạn cần quyền **Moderate Members** để sử dụng `?warn`.",

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
            "`?warn @User lý do`",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // REASON
      // args[0] = @User
      // =====================================

      const reason =
        args
          .slice(1)
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
            "❌ Bạn không thể Warn chính mình.",

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
            "❌ Không thể Warn Corgi-Bot.",

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
            "❌ Không thể Warn Server Owner.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // ROLE HIERARCHY
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
            "❌ Bạn không thể Warn thành viên có Role bằng hoặc cao hơn Role của bạn.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // SHARED WARN SERVICE
      // =====================================

      const result =
        await executeWarn({
          guild:
            message.guild,

          member,

          moderator:
            message.author,

          reason,

          commandName:
            "?warn"
        });

      // =====================================
      // SUCCESS EMBED
      // =====================================

      const embed =
        new EmbedBuilder()

          .setColor(
            0x57f287
          )

          .setTitle(
            "✅ Warn thành công"
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
                "⚠️ Hành động",

              value:
                "**WARN**",

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
          embed
        ],

        allowedMentions: {
          repliedUser: false,
          parse: []
        }
      });

      // =====================================
      // TERMINAL LOG
      // =====================================

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        `⚠️ PREFIX WARN CASE #${result.moderationCase.caseId}`
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
        `📝 Reason: ${result.reason}`
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );
    } catch (error) {
      console.error(
        "❌ Prefix Warn Error:",
        error
      );

      try {
        await message.reply({
          content:
            "❌ Không thể Warn thành viên.",

          allowedMentions: {
            repliedUser: false
          }
        });
      } catch {}
    }
  }
};