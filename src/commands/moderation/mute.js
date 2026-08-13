const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
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
  data:
    new SlashCommandBuilder()

      .setName("mute")

      .setDescription(
        "Tạm khóa chat một thành viên trong server."
      )

      .setDefaultMemberPermissions(
        PermissionFlagsBits.ModerateMembers
      )

      // USER
      .addUserOption(
        (option) =>
          option
            .setName("user")
            .setDescription(
              "Thành viên cần Mute"
            )
            .setRequired(true)
      )

      // DURATION
      .addStringOption(
        (option) =>
          option
            .setName("duration")
            .setDescription(
              "Thời gian: 30s, 10m, 1h, 1d, 7d..."
            )
            .setRequired(true)
            .setMaxLength(10)
      )

      // REASON
      .addStringOption(
        (option) =>
          option
            .setName("reason")
            .setDescription(
              "Lý do Mute"
            )
            .setRequired(true)
            .setMinLength(2)
            .setMaxLength(500)
      ),

  async execute(interaction) {
    try {
      // =====================================
      // GUILD ONLY
      // =====================================

      if (!interaction.inGuild()) {
        return interaction.reply({
          content:
            "❌ Lệnh này chỉ có thể sử dụng trong server.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // DEFER NGAY
      // =====================================

      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      // =====================================
      // MODERATOR PERMISSION
      // =====================================

      const hasPermission =
        interaction.member.permissions.has(
          PermissionFlagsBits.ModerateMembers
        ) ||
        interaction.member.permissions.has(
          PermissionFlagsBits.Administrator
        );

      if (!hasPermission) {
        return interaction.editReply({
          content:
            "🔒 Bạn cần quyền **Moderate Members** để sử dụng `/mute`."
        });
      }

      // =====================================
      // OPTIONS
      // =====================================

      const user =
        interaction.options.getUser(
          "user",
          true
        );

      const durationInput =
        interaction.options
          .getString(
            "duration",
            true
          )
          .trim();

      const reason =
        interaction.options
          .getString(
            "reason",
            true
          )
          .trim();

      // =====================================
      // PARSE DURATION
      // =====================================

      const durationMs =
        parseDuration(
          durationInput
        );

      if (!durationMs) {
        return interaction.editReply({
          content:
            "❌ Thời gian Mute không hợp lệ.\n\n" +
            "Ví dụ:\n" +
            "`30s` = 30 giây\n" +
            "`10m` = 10 phút\n" +
            "`1h` = 1 giờ\n" +
            "`1d` = 1 ngày\n" +
            "`7d` = 7 ngày"
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
        return interaction.editReply({
          content:
            "❌ Thời gian Mute không được vượt quá **28 ngày**."
        });
      }

      // =====================================
      // FETCH MEMBER
      // =====================================

      let member = null;

      try {
        member =
          await interaction.guild.members.fetch(
            user.id
          );
      } catch {
        member = null;
      }

      if (!member) {
        return interaction.editReply({
          content:
            "❌ Không tìm thấy thành viên này trong server."
        });
      }

      // =====================================
      // SELF PROTECTION
      // =====================================

      if (
        member.id ===
        interaction.user.id
      ) {
        return interaction.editReply({
          content:
            "❌ Bạn không thể Mute chính mình."
        });
      }

      // =====================================
      // BOT PROTECTION
      // =====================================

      if (
        member.id ===
        interaction.client.user.id
      ) {
        return interaction.editReply({
          content:
            "❌ Không thể Mute Corgi-Bot."
        });
      }

      // =====================================
      // SERVER OWNER PROTECTION
      // =====================================

      if (
        member.id ===
        interaction.guild.ownerId
      ) {
        return interaction.editReply({
          content:
            "❌ Không thể Mute Server Owner."
        });
      }

      // =====================================
      // MODERATOR ROLE HIERARCHY
      // =====================================

      if (
        interaction.user.id !==
          interaction.guild.ownerId &&
        interaction.member.roles.highest
          .comparePositionTo(
            member.roles.highest
          ) <= 0
      ) {
        return interaction.editReply({
          content:
            "❌ Bạn không thể Mute thành viên có Role bằng hoặc cao hơn Role của bạn."
        });
      }

      // =====================================
      // SHARED MUTE SERVICE
      // =====================================

      const result =
        await executeMute({
          guild:
            interaction.guild,

          member,

          moderator:
            interaction.user,

          durationMs,

          reason,

          commandName:
            "/mute"
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
            user.displayAvatarURL({
              size: 256
            })
          )

          .setFooter({
            text:
              "Corgi Studio • Moderation System"
          })

          .setTimestamp();

      // =====================================
      // RESPONSE
      // =====================================

      await interaction.editReply({
        embeds: [
          successEmbed
        ]
      });

      // =====================================
      // TERMINAL LOG
      // =====================================

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        `🔇 MUTE CASE #${result.moderationCase.caseId}`
      );

      console.log(
        `🌐 Guild: ${interaction.guild.name} (${interaction.guild.id})`
      );

      console.log(
        `🛡️ Moderator: ${interaction.user.tag} (${interaction.user.id})`
      );

      console.log(
        `👤 Target: ${user.tag} (${user.id})`
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
        "❌ Mute Command Error:",
        error
      );

      // =====================================
      // FRIENDLY SERVICE ERRORS
      // =====================================

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
          "❌ Corgi-Bot không thể Mute thành viên này.\n\n" +
          "Hãy kiểm tra Role của Bot có nằm **cao hơn Role của thành viên** hay không.";
      }

      // Không cố reply lại interaction đã hết hạn
      if (
        error?.code === 10062
      ) {
        return;
      }

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          await interaction.editReply({
            content:
              errorMessage,

            embeds: []
          });
        } else {
          await interaction.reply({
            content:
              errorMessage,

            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch (
        replyError
      ) {
        console.error(
          "❌ Mute Error Response:",
          replyError
        );
      }
    }
  }
};