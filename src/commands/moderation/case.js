const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

const {
  getModerationCase
} = require(
  "../../services/moderationCaseService"
);

// =====================================
// FORMAT STATUS
// =====================================

function formatStatus(active) {
  return active
    ? "🟢 Active"
    : "⚪ Closed";
}

// =====================================
// FORMAT DURATION
// =====================================

function formatDuration(ms) {
  if (
    ms === null ||
    ms === undefined
  ) {
    return "Không có";
  }

  const seconds =
    Math.floor(
      Number(ms) / 1000
    );

  if (
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return "Không có";
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

// =====================================
// FORMAT TYPE
// =====================================

function formatType(type) {
  const types = {
    WARN: "⚠️ WARN",
    TIMEOUT: "🔇 TIMEOUT",
    UNMUTE: "🔊 UNMUTE",
    KICK: "👢 KICK",
    BAN: "🔨 BAN",
    UNBAN: "🔓 UNBAN"
  };

  return (
    types[type] ||
    `📋 ${type}`
  );
}

// =====================================
// COMMAND
// =====================================

module.exports = {
  data:
    new SlashCommandBuilder()

      .setName("case")

      .setDescription(
        "Xem thông tin chi tiết một Moderation Case."
      )

      .setDefaultMemberPermissions(
        PermissionFlagsBits.ModerateMembers
      )

      .addIntegerOption(
        (option) =>
          option
            .setName("case-id")
            .setDescription(
              "Case ID cần xem"
            )
            .setRequired(true)
            .setMinValue(1)
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
      // DEFER
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
            "🔒 Bạn cần quyền **Moderate Members** để sử dụng `/case`."
        });
      }

      // =====================================
      // OPTIONS
      // =====================================

      const caseId =
        interaction.options.getInteger(
          "case-id",
          true
        );

      // =====================================
      // GET CASE
      // =====================================

      const moderationCase =
        await getModerationCase(
          interaction.guild.id,
          caseId
        );

      // =====================================
      // NOT FOUND
      // =====================================

      if (!moderationCase) {
        return interaction.editReply({
          content:
            `❌ Không tìm thấy **Case #${caseId}** trong server này.`
        });
      }

      // =====================================
      // DATA
      // =====================================

      const type =
        String(
          moderationCase.type
        ).toUpperCase();

      const targetUserId =
        String(
          moderationCase.targetUserId
        );

      const moderatorUserId =
        String(
          moderationCase.moderatorUserId
        );

      const reason =
        moderationCase.reason ||
        "Không có lý do.";

      const status =
        formatStatus(
          moderationCase.active
        );

      const duration =
        formatDuration(
          moderationCase.duration
        );

      const createdAt =
        moderationCase.createdAt
          ? `<t:${Math.floor(
              new Date(
                moderationCase.createdAt
              ).getTime() / 1000
            )}:F>`
          : "Không rõ";

      const updatedAt =
        moderationCase.updatedAt
          ? `<t:${Math.floor(
              new Date(
                moderationCase.updatedAt
              ).getTime() / 1000
            )}:F>`
          : "Không rõ";

      // =====================================
      // EMBED
      // =====================================

      const embed =
        new EmbedBuilder()

          .setColor(
            moderationCase.active
              ? 0xed4245
              : 0x95a5a6
          )

          .setTitle(
            `📋 Moderation Case #${caseId}`
          )

          .addFields(
            {
              name:
                "⚖️ Hành động",

              value:
                formatType(type),

              inline:
                true
            },

            {
              name:
                "📊 Trạng thái",

              value:
                status,

              inline:
                true
            },

            {
              name:
                "👤 User",

              value:
                `<@${targetUserId}>\n\`${targetUserId}\``,

              inline:
                true
            },

            {
              name:
                "🛡️ Moderator",

              value:
                `<@${moderatorUserId}>\n\`${moderatorUserId}\``,

              inline:
                true
            },

            {
              name:
                "⏱️ Duration",

              value:
                duration,

              inline:
                true
            },

            {
              name:
                "📅 Created",

              value:
                createdAt,

              inline:
                true
            },

            {
              name:
                "📝 Lý do",

              value:
                reason,

              inline:
                false
            },

            {
              name:
                "🔄 Updated",

              value:
                updatedAt,

              inline:
                false
            }
          )

          .setFooter({
            text:
              `Corgi Studio • ${interaction.guild.name}`
          })

          .setTimestamp();

      // =====================================
      // TRY USER AVATAR
      // =====================================

      try {
        const targetUser =
          await interaction.client.users.fetch(
            targetUserId
          );

        embed.setThumbnail(
          targetUser.displayAvatarURL({
            size: 256
          })
        );
      } catch {
        // Không làm hỏng Case nếu user
        // không còn fetch được.
      }

      // =====================================
      // REPLY
      // =====================================

      return interaction.editReply({
        embeds: [
          embed
        ]
      });

    } catch (error) {
      console.error(
        "❌ Case Command Error:",
        error
      );

      const message =
        "❌ Không thể lấy thông tin Moderation Case.";

      if (
        interaction.deferred ||
        interaction.replied
      ) {
        return interaction.editReply({
          content:
            message
        });
      }

      return interaction.reply({
        content:
          message,

        flags:
          MessageFlags.Ephemeral
      });
    }
  }
};