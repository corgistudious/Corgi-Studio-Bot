const {
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  getUserCases
} = require(
  "../../services/moderationCaseService"
);

function formatDuration(ms) {
  if (
    ms === null ||
    ms === undefined
  ) {
    return "—";
  }

  const seconds =
    Math.floor(
      Number(ms) / 1000
    );

  if (
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return "—";
  }

  if (
    seconds % 86400 === 0
  ) {
    return `${seconds / 86400} ngày`;
  }

  if (
    seconds % 3600 === 0
  ) {
    return `${seconds / 3600} giờ`;
  }

  if (
    seconds % 60 === 0
  ) {
    return `${seconds / 60} phút`;
  }

  return `${seconds} giây`;
}

module.exports = {
  name: "history",

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
            "🔒 Bạn cần quyền **Moderate Members** để sử dụng `?history`.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // TARGET USER
      // =====================================

      let targetUser = null;

      const mentionedUser =
        message.mentions.users.first();

      if (mentionedUser) {
        targetUser =
          mentionedUser;
      }

      // =====================================
      // USER ID SUPPORT
      // =====================================

      if (!targetUser && args[0]) {
        const userId =
          args[0].replace(
            /[<@!>]/g,
            ""
          );

        if (
          /^\d{17,20}$/.test(
            userId
          )
        ) {
          try {
            targetUser =
              await message.client.users.fetch(
                userId
              );
          } catch {}
        }
      }

      if (!targetUser) {
        return message.reply({
          content:
            "❌ Cách dùng:\n" +
            "`?history @User`\n\n" +
            "Hoặc:\n" +
            "`?history USER_ID`",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // LIMIT
      // =====================================

      let limit = 10;

      const limitArg =
        args.find(
          (arg) =>
            /^\d+$/.test(arg)
        );

      if (limitArg) {
        limit =
          Number(limitArg);
      }

      limit =
        Math.max(
          1,
          Math.min(
            limit,
            20
          )
        );

      // =====================================
      // DATABASE
      // =====================================

      const cases =
        await getUserCases(
          message.guild.id,
          targetUser.id,
          limit
        );

      if (
        !cases ||
        cases.length === 0
      ) {
        return message.reply({
          content:
            `📭 **${targetUser.tag}** chưa có Moderation Case nào trong server này.`,

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // CASE LIST
      // =====================================

      const description =
        cases
          .map(
            (item) => {
              const durationText =
                formatDuration(
                  item.duration
                );

              const statusText =
                item.active
                  ? "🟢 Active"
                  : "⚪ Closed";

              const timestamp =
                Math.floor(
                  new Date(
                    item.createdAt
                  ).getTime() /
                    1000
                );

              return (
                `**#${item.caseId} • ${item.type}**\n` +
                `📝 ${item.reason}\n` +
                `🛡️ <@${item.moderatorUserId}>\n` +
                `⏱️ ${durationText} • ${statusText}\n` +
                `<t:${timestamp}:R>`
              );
            }
          )
          .join(
            "\n\n"
          );

      // =====================================
      // EMBED
      // =====================================

      const embed =
        new EmbedBuilder()

          .setColor(
            0x5865f2
          )

          .setTitle(
            "📚 Moderation History"
          )

          .setDescription(
            description
          )

          .addFields(
            {
              name:
                "👤 Thành viên",

              value:
                `${targetUser}\n\`${targetUser.id}\``,

              inline:
                true
            },

            {
              name:
                "📋 Số Case",

              value:
                `**${cases.length}**`,

              inline:
                true
            }
          )

          .setThumbnail(
            targetUser.displayAvatarURL({
              size: 256
            })
          )

          .setFooter({
            text:
              "Corgi Studio • Prefix Moderation History"
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
      // TERMINAL
      // =====================================

      console.log(
        `📚 PREFIX HISTORY | ` +
        `${message.author.tag} | ` +
        `Target ${targetUser.tag} | ` +
        `Guild ${message.guild.id}`
      );
    } catch (error) {
      console.error(
        "❌ Prefix History Error:",
        error
      );

      try {
        await message.reply({
          content:
            "❌ Không thể tải lịch sử Moderation.",

          allowedMentions: {
            repliedUser: false
          }
        });
      } catch {}
    }
  }
};