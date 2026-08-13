const {
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  executeKick
} = require(
  "../../services/moderation/kickService"
);

module.exports = {
  name: "kick",

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
          PermissionFlagsBits.KickMembers
        ) ||
        message.member.permissions.has(
          PermissionFlagsBits.Administrator
        );

      if (!hasPermission) {
        return message.reply({
          content:
            "🔒 Bạn cần quyền **Kick Members** để sử dụng `?kick`.",

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
            "`?kick @User lý do`\n\n" +
            "Ví dụ:\n" +
            "`?kick @User Vi phạm nội quy`",

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
            "❌ Bạn không thể Kick chính mình.",

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
            "❌ Không thể Kick Corgi-Bot.",

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
            "❌ Không thể Kick Server Owner.",

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
            "❌ Bạn không thể Kick thành viên có Role bằng hoặc cao hơn Role của bạn.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // SHARED KICK SERVICE
      // =====================================

      const result =
        await executeKick({
          guild:
            message.guild,

          member,

          moderator:
            message.author,

          reason,

          commandName:
            "?kick"
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
            "✅ Kick thành công"
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
                `${result.targetTag}\n` +
                `\`${result.targetId}\``,

              inline:
                true
            },

            {
              name:
                "👢 Hành động",

              value:
                "**KICK**",

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
        `👢 PREFIX KICK CASE #${result.moderationCase.caseId}`
      );

      console.log(
        `🌐 Guild: ${message.guild.name} (${message.guild.id})`
      );

      console.log(
        `🛡️ Moderator: ${message.author.tag} (${message.author.id})`
      );

      console.log(
        `👤 Target: ${result.targetTag} (${result.targetId})`
      );

      console.log(
        `📝 Reason: ${result.reason}`
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );
    } catch (error) {
      console.error(
        "❌ Prefix Kick Error:",
        error
      );

      // =====================================
      // FRIENDLY SERVICE ERRORS
      // =====================================

      let errorMessage =
        "❌ Không thể Kick thành viên.";

      if (
        error?.message ===
        "KICK_BOT_MEMBER_NOT_FOUND"
      ) {
        errorMessage =
          "❌ Không thể xác định quyền của Corgi-Bot.";
      }

      if (
        error?.message ===
        "KICK_BOT_MISSING_KICK_MEMBERS"
      ) {
        errorMessage =
          "❌ Corgi-Bot chưa có quyền **Kick Members**.";
      }

      if (
        error?.message ===
        "KICK_MEMBER_NOT_KICKABLE"
      ) {
        errorMessage =
          "❌ Corgi-Bot không thể Kick thành viên này.\n\n" +
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