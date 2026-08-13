const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

const {
  executeWarn
} = require(
  "../../services/moderation/warnService"
);

module.exports = {
  data:
    new SlashCommandBuilder()

      .setName("warn")

      .setDescription(
        "Cảnh cáo một thành viên trong server."
      )

      .setDefaultMemberPermissions(
        PermissionFlagsBits.ModerateMembers
      )

      .addUserOption(
        (option) =>
          option
            .setName("user")
            .setDescription(
              "Thành viên cần cảnh cáo"
            )
            .setRequired(true)
      )

      .addStringOption(
        (option) =>
          option
            .setName("reason")
            .setDescription(
              "Lý do cảnh cáo"
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
      // ACKNOWLEDGE NGAY
      // =====================================

      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      // =====================================
      // PERMISSION
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
            "🔒 Bạn cần quyền **Moderate Members** để sử dụng `/warn`."
        });
      }

      // =====================================
      // INPUT
      // =====================================

      const user =
        interaction.options.getUser(
          "user",
          true
        );

      const reason =
        interaction.options
          .getString(
            "reason",
            true
          )
          .trim();

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
      // TARGET PROTECTION
      // =====================================

      if (
        member.id ===
        interaction.user.id
      ) {
        return interaction.editReply({
          content:
            "❌ Bạn không thể Warn chính mình."
        });
      }

      if (
        member.id ===
        interaction.client.user.id
      ) {
        return interaction.editReply({
          content:
            "❌ Không thể Warn Corgi-Bot."
        });
      }

      if (
        member.id ===
        interaction.guild.ownerId
      ) {
        return interaction.editReply({
          content:
            "❌ Không thể Warn Server Owner."
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
            "❌ Bạn không thể Warn thành viên có Role bằng hoặc cao hơn Role của bạn."
        });
      }

      // =====================================
      // SHARED WARN SERVICE
      // =====================================

      const result =
        await executeWarn({
          guild:
            interaction.guild,

          member,

          moderator:
            interaction.user,

          reason,

          commandName:
            "/warn"
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
          embed
        ]
      });

      // =====================================
      // TERMINAL LOG
      // =====================================

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        `⚠️ WARN CASE #${result.moderationCase.caseId}`
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
        `📝 Reason: ${result.reason}`
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );
    } catch (error) {
      console.error(
        "❌ Warn Command Error:",
        error
      );

      // Unknown Interaction:
      // không cố gửi interaction lần nữa.
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
              "❌ Không thể Warn thành viên.",

            embeds: []
          });
        } else {
          await interaction.reply({
            content:
              "❌ Không thể Warn thành viên.",

            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch (
        replyError
      ) {
        console.error(
          "❌ Warn Error Response:",
          replyError
        );
      }
    }
  }
};