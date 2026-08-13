const {
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  executeUnmute
} = require(
  "../../services/moderation/unmuteService"
);

module.exports = {
  name: "unmute",

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
            "🔒 Bạn cần quyền **Moderate Members** để sử dụng `?unmute`.",

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
            "`?unmute @User lý do`",

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
            "❌ Bạn không thể dùng `?unmute` cho chính mình.",

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
            "❌ Không thể dùng `?unmute` cho Corgi-Bot.",

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
            "❌ Server Owner không thể bị Mute.",

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
            "❌ Bạn không thể gỡ Mute cho thành viên có Role bằng hoặc cao hơn Role của bạn.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // SHARED UNMUTE SERVICE
      // =====================================

      const result =
        await executeUnmute({
          guild:
            message.guild,

          member,

          moderator:
            message.author,

          reason,

          commandName:
            "?unmute"
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
            "✅ Unmute thành công"
          )

          .setDescription(
            `${member} đã được gỡ Mute.`
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
                "🔊 Hành động",

              value:
                "**UNMUTE**",

              inline:
                true
            },

            {
              name:
                "⏱️ Discord Timeout",

              value:
                result.timeoutStatus,

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
        `🔊 PREFIX UNMUTE CASE #${result.moderationCase.caseId}`
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
        `⏱️ Timeout Removed: ${result.timeoutRemoved}`
      );

      console.log(
        `🔇 Mute Role Removed: ${result.muteRoleRemoved}`
      );

      console.log(
        `📝 Reason: ${result.reason}`
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );
    } catch (error) {
      console.error(
        "❌ Prefix Unmute Error:",
        error
      );

      // =====================================
      // FRIENDLY SERVICE ERRORS
      // =====================================

      let errorMessage =
        "❌ Không thể gỡ Mute cho thành viên.";

      if (
        error?.message ===
        "UNMUTE_MEMBER_NOT_MUTED"
      ) {
        errorMessage =
          "⚠️ Thành viên này hiện **không bị Mute**.";
      }

      if (
        error?.message ===
        "UNMUTE_BOT_MISSING_MODERATE_MEMBERS"
      ) {
        errorMessage =
          "❌ Corgi-Bot cần quyền **Moderate Members** để gỡ Discord Timeout.";
      }

      if (
        error?.message ===
        "UNMUTE_MEMBER_NOT_MODERATABLE"
      ) {
        errorMessage =
          "❌ Corgi-Bot không thể gỡ Discord Timeout của thành viên này.\n" +
          "Hãy kiểm tra thứ tự Role của Bot.";
      }

      if (
        error?.message ===
        "UNMUTE_TIMEOUT_REMOVE_FAILED"
      ) {
        errorMessage =
          "❌ Không thể gỡ Discord Timeout khỏi thành viên.";
      }

      if (
        error?.message ===
        "UNMUTE_ROLE_REMOVE_FAILED"
      ) {
        errorMessage =
          "❌ Không thể gỡ **Mute Role** khỏi thành viên.\n\n" +
          "Hãy kiểm tra quyền **Manage Roles** và thứ tự Role của Corgi-Bot.";
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