const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

const {
  executeBan
} = require(
  "../../services/moderation/banService"
);

module.exports = {
  data:
    new SlashCommandBuilder()

      .setName("ban")

      .setDescription(
        "Ban một thành viên khỏi server."
      )

      .setDefaultMemberPermissions(
        PermissionFlagsBits.BanMembers
      )

      .addUserOption(
        (option) =>
          option
            .setName("user")
            .setDescription(
              "Thành viên cần Ban"
            )
            .setRequired(true)
      )

      .addStringOption(
        (option) =>
          option
            .setName("reason")
            .setDescription(
              "Lý do Ban"
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
          PermissionFlagsBits.BanMembers
        ) ||
        interaction.member.permissions.has(
          PermissionFlagsBits.Administrator
        );

      if (!hasPermission) {
        return interaction.editReply({
          content:
            "🔒 Bạn cần quyền **Ban Members** để sử dụng `/ban`."
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
      // SELF PROTECTION
      // =====================================

      if (
        member.id ===
        interaction.user.id
      ) {
        return interaction.editReply({
          content:
            "❌ Bạn không thể Ban chính mình."
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
            "❌ Không thể Ban Corgi-Bot."
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
            "❌ Không thể Ban Server Owner."
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
            "❌ Bạn không thể Ban thành viên có Role bằng hoặc cao hơn Role của bạn."
        });
      }

      // =====================================
      // SHARED BAN SERVICE
      // =====================================

      const result =
        await executeBan({
          guild:
            interaction.guild,

          member,

          moderator:
            interaction.user,

          reason,

          commandName:
            "/ban"
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
        `🔨 BAN CASE #${result.moderationCase.caseId}`
      );

      console.log(
        `🌐 Guild: ${interaction.guild.name} (${interaction.guild.id})`
      );

      console.log(
        `🛡️ Moderator: ${interaction.user.tag} (${interaction.user.id})`
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
        "❌ Ban Command Error:",
        error
      );

      // =====================================
      // FRIENDLY SERVICE ERRORS
      // =====================================

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
          "❌ Ban Error Response:",
          replyError
        );
      }
    }
  }
};