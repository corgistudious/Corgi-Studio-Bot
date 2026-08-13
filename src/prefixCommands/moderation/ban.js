const {
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  executeBan
} = require(
  "../../services/moderation/banService"
);

module.exports = {
  name: "ban",

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
            "🔒 Bạn cần quyền **Ban Members** để sử dụng `?ban`.",

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
            "`?ban @User lý do`\n\n" +
            "Ví dụ:\n" +
            "`?ban @User Vi phạm nội quy`",

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
            "❌ Bạn không thể Ban chính mình.",

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
            "❌ Không thể Ban Corgi-Bot.",

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
            "❌ Không thể Ban Server Owner.",

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
            "❌ Bạn không thể Ban thành viên có Role bằng hoặc cao hơn Role của bạn.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // SHARED BAN SERVICE
      // =====================================

      const result =
        await executeBan({
          guild:
            message.guild,

          member,

          moderator:
            message.author,

          reason,

          commandName:
            "?ban"
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
            "✅ Ban thành công"
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
                "🔨 Hành động",

              value:
                "**BAN**",

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
        `🔨 PREFIX BAN CASE #${result.moderationCase.caseId}`
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
        "❌ Prefix Ban Error:",
        error
      );

      let errorMessage =
        "❌ Không thể Ban thành viên.";

      if (
        error?.message ===
        "BAN_BOT_MEMBER_NOT_FOUND"
      ) {
        errorMessage =
          "❌ Không thể xác định quyền của Corgi-Bot.";
      }

      if (
        error?.message ===
        "BAN_BOT_MISSING_BAN_MEMBERS"
      ) {
        errorMessage =
          "❌ Corgi-Bot chưa có quyền **Ban Members**.";
      }

      if (
        error?.message ===
        "BAN_MEMBER_NOT_BANNABLE"
      ) {
        errorMessage =
          "❌ Corgi-Bot không thể Ban thành viên này.\n\n" +
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