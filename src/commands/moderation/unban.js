const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

const {
  executeUnban
} = require(
  "../../services/moderation/unbanService"
);

module.exports = {
  data:
    new SlashCommandBuilder()

      .setName("unban")

      .setDescription(
        "Gỡ Ban cho một người dùng bằng User ID."
      )

      .setDefaultMemberPermissions(
        PermissionFlagsBits.BanMembers
      )

      .addStringOption(
        (option) =>
          option
            .setName("user-id")
            .setDescription(
              "Discord User ID cần gỡ Ban"
            )
            .setRequired(true)
            .setMinLength(17)
            .setMaxLength(20)
      )

      .addStringOption(
        (option) =>
          option
            .setName("reason")
            .setDescription(
              "Lý do gỡ Ban"
            )
            .setRequired(false)
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
          PermissionFlagsBits.BanMembers
        ) ||
        interaction.member.permissions.has(
          PermissionFlagsBits.Administrator
        );

      if (!hasPermission) {
        return interaction.editReply({
          content:
            "🔒 Bạn cần quyền **Ban Members** để sử dụng `/unban`."
        });
      }

      // =====================================
      // OPTIONS
      // =====================================

      const userId =
        interaction.options
          .getString(
            "user-id",
            true
          )
          .trim();

      const reason =
        interaction.options
          .getString(
            "reason"
          )
          ?.trim() ||
        "Không có lý do.";

      // =====================================
      // VALIDATE USER ID
      // =====================================

      if (
        !/^\d{17,20}$/.test(
          userId
        )
      ) {
        return interaction.editReply({
          content:
            "❌ User ID không hợp lệ.\n\n" +
            "Ví dụ: `123456789012345678`"
        });
      }

      // =====================================
      // PROTECT BOT ID
      // =====================================

      if (
        userId ===
        interaction.client.user.id
      ) {
        return interaction.editReply({
          content:
            "❌ Không thể sử dụng `/unban` cho Corgi-Bot."
        });
      }

      // =====================================
      // PROTECT SERVER OWNER
      // =====================================

      if (
        userId ===
        interaction.guild.ownerId
      ) {
        return interaction.editReply({
          content:
            "❌ Server Owner không thể bị Ban."
        });
      }

      // =====================================
      // SHARED UNBAN SERVICE
      // =====================================

      const result =
        await executeUnban({
          guild:
            interaction.guild,

          userId,

          moderator:
            interaction.user,

          reason,

          commandName:
            "/unban"
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
      // TERMINAL
      // =====================================

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        `🔓 UNBAN CASE #${result.moderationCase.caseId}`
      );

      console.log(
        `🌐 Guild: ${interaction.guild.name} (${interaction.guild.id})`
      );

      console.log(
        `🛡️ Moderator: ${interaction.user.tag} (${interaction.user.id})`
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
        "❌ Unban Command Error:",
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
          "⚠️ User ID này hiện **không bị Ban** trong server.";
      }

      // =====================================
      // UNKNOWN INTERACTION
      // =====================================

      if (
        error?.code === 10062
      ) {
        return;
      }

      // =====================================
      // ERROR RESPONSE
      // =====================================

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
          "❌ Unban Error Response:",
          replyError
        );
      }
    }
  }
};