const {
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  executeUnban
} = require(
  "../../services/moderation/unbanService"
);

module.exports = {
  name: "unban",

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
      // MODERATOR PERMISSION
      // =====================================

      const hasPermission =
        message.member.permissions.has(
          PermissionFlagsBits.BanMembers
        ) ||
        message.member.permissions.has(
          PermissionFlagsBits.Administrator
        );

      if (!hasPermission) {
        return message.reply({
          content:
            "🔒 Bạn cần quyền **Ban Members** để sử dụng `?unban`.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // USER ID
      // =====================================

      const userId =
        args[0]?.trim();

      if (
        !userId ||
        !/^\d{17,20}$/.test(userId)
      ) {
        return message.reply({
          content:
            "❌ Cách dùng:\n" +
            "`?unban USER_ID lý do`\n\n" +
            "Ví dụ:\n" +
            "`?unban 123456789012345678 Gỡ Ban`",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // REASON
      // args[0] = User ID
      // =====================================

      const reason =
        args
          .slice(1)
          .join(" ")
          .trim() ||
        "Không có lý do.";

      // =====================================
      // PROTECT BOT
      // =====================================

      if (
        userId ===
        message.client.user.id
      ) {
        return message.reply({
          content:
            "❌ Không thể sử dụng `?unban` cho Corgi-Bot.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // PROTECT SERVER OWNER
      // =====================================

      if (
        userId ===
        message.guild.ownerId
      ) {
        return message.reply({
          content:
            "❌ Server Owner không thể bị Ban.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // SHARED UNBAN SERVICE
      // =====================================

      const result =
        await executeUnban({
          guild:
            message.guild,

          userId,

          moderator:
            message.author,

          reason,

          commandName:
            "?unban"
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
            "✅ Unban thành công"
          )

          .setDescription(
            `Đã gỡ Ban cho **${result.targetTag}**.`
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
                "👤 User ID",

              value:
                `\`${result.userId}\``,

              inline:
                true
            },

            {
              name:
                "🔓 Hành động",

              value:
                "**UNBAN**",

              inline:
                true
            },

            {
              name:
                "📩 DM",

              value:
                result.dmSent
                  ? "✅ Đã gửi"
                  : "⚠️ Không gửi được",

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
            result.targetAvatar
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
        `🔓 PREFIX UNBAN CASE #${result.moderationCase.caseId}`
      );

      console.log(
        `🌐 Guild: ${message.guild.name} (${message.guild.id})`
      );

      console.log(
        `🛡️ Moderator: ${message.author.tag} (${message.author.id})`
      );

      console.log(
        `👤 Target: ${result.targetTag} (${result.userId})`
      );

      console.log(
        `📝 Reason: ${result.reason}`
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );
    } catch (error) {
      console.error(
        "❌ Prefix Unban Error:",
        error
      );

      // =====================================
      // FRIENDLY SERVICE ERRORS
      // =====================================

      let errorMessage =
        "❌ Không thể gỡ Ban người dùng.";

      if (
        error?.message ===
        "UNBAN_USER_ID_INVALID"
      ) {
        errorMessage =
          "❌ User ID không hợp lệ.";
      }

      if (
        error?.message ===
        "UNBAN_BOT_MEMBER_NOT_FOUND"
      ) {
        errorMessage =
          "❌ Không thể xác định quyền của Corgi-Bot.";
      }

      if (
        error?.message ===
        "UNBAN_BOT_MISSING_BAN_MEMBERS"
      ) {
        errorMessage =
          "❌ Corgi-Bot chưa có quyền **Ban Members**.";
      }

      if (
        error?.message ===
        "UNBAN_USER_NOT_BANNED"
      ) {
        errorMessage =
          `⚠️ User ID \`${args[0] || "Unknown"}\` hiện **không bị Ban** trong server.`;
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