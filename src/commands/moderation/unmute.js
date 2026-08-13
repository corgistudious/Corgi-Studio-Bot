const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

const {
  executeUnmute
} = require(
  "../../services/moderation/unmuteService"
);

module.exports = {
  data:
    new SlashCommandBuilder()

      .setName("unmute")

      .setDescription(
        "Gỡ Mute cho một thành viên."
      )

      .setDefaultMemberPermissions(
        PermissionFlagsBits.ModerateMembers
      )

      .addUserOption(
        (option) =>
          option
            .setName("user")
            .setDescription(
              "Thành viên cần gỡ Mute"
            )
            .setRequired(true)
      )

      .addStringOption(
        (option) =>
          option
            .setName("reason")
            .setDescription(
              "Lý do gỡ Mute"
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
            "🔒 Bạn cần quyền **Moderate Members** để sử dụng `/unmute`."
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

      const reason =
        interaction.options
          .getString(
            "reason"
          )
          ?.trim() ||
        "Không có lý do.";

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
            "❌ Bạn không thể dùng `/unmute` cho chính mình."
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
            "❌ Không thể dùng `/unmute` cho Corgi-Bot."
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
            "❌ Server Owner không thể bị Mute."
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
            "❌ Bạn không thể gỡ Mute cho thành viên có Role bằng hoặc cao hơn Role của bạn."
        });
      }

      // =====================================
      // SHARED UNMUTE SERVICE
      // =====================================

      const result =
        await executeUnmute({
          guild:
            interaction.guild,

          member,

          moderator:
            interaction.user,

          reason,

          commandName:
            "/unmute"
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
      // TERMINAL
      // =====================================

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        `🔊 UNMUTE CASE #${result.moderationCase.caseId}`
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
        "❌ Unmute Command Error:",
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
          "❌ Unmute Error Response:",
          replyError
        );
      }
    }
  }
};