const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

const {
  getUserCases
} = require(
  "../../services/moderationCaseService"
);

// =====================================
// FORMAT CASE STATUS
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

      .setName("history")

      .setDescription(
        "Xem lịch sử Moderation của một thành viên."
      )

      .setDefaultMemberPermissions(
        PermissionFlagsBits.ModerateMembers
      )

      .addUserOption(
        (option) =>
          option
            .setName("user")
            .setDescription(
              "Thành viên cần xem lịch sử"
            )
            .setRequired(true)
      )

      .addIntegerOption(
        (option) =>
          option
            .setName("limit")
            .setDescription(
              "Số Case muốn xem (1-20)"
            )
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(20)
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
            "🔒 Bạn cần quyền **Moderate Members** để sử dụng `/history`."
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

      const limit =
        interaction.options.getInteger(
          "limit"
        ) || 10;

      // =====================================
      // GET CASES
      // =====================================

      const cases =
        await getUserCases(
          interaction.guild.id,
          user.id,
          limit
        );

      // =====================================
      // NO CASE
      // =====================================

      if (!cases.length) {
        const embed =
          new EmbedBuilder()

            .setColor(
              0x95a5a6
            )

            .setTitle(
              "📋 Moderation History"
            )

            .setDescription(
              `Không tìm thấy Moderation Case nào của ${user}.`
            )

            .setThumbnail(
              user.displayAvatarURL({
                size: 256
              })
            )

            .setFooter({
              text:
                `Corgi Studio • ${interaction.guild.name}`
            })

            .setTimestamp();

        return interaction.editReply({
          embeds: [
            embed
          ]
        });
      }

      // =====================================
      // BUILD CASE LIST
      // =====================================

      const caseLines =
        cases.map(
          (moderationCase) => {
            const type =
              String(
                moderationCase.type
              ).toUpperCase();

            const status =
              formatStatus(
                moderationCase.active
              );

            const reason =
              moderationCase.reason ||
              "Không có lý do.";

            const duration =
              formatDuration(
                moderationCase.duration
              );

            const timestamp =
              moderationCase.createdAt
                ? `<t:${Math.floor(
                    new Date(
                      moderationCase.createdAt
                    ).getTime() / 1000
                  )}:R>`
                : "Không rõ";

            let line =
              `**#${moderationCase.caseId}** • ` +
              `${formatType(type)} • ` +
              `${status}\n` +
              `> 📝 ${reason}\n` +
              `> ⏱️ ${duration} • ${timestamp}`;

            return line;
          }
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
            "📋 Moderation History"
          )

          .setDescription(
            `**Thành viên:** ${user}\n` +
            `\`${user.id}\`\n\n` +
            caseLines.join(
              "\n\n"
            )
          )

          .setThumbnail(
            user.displayAvatarURL({
              size: 256
            })
          )

          .setFooter({
            text:
              `Corgi Studio • ${interaction.guild.name} • ${cases.length} Case`
          })

          .setTimestamp();

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
        "❌ History Command Error:",
        error
      );

      const message =
        "❌ Không thể lấy lịch sử Moderation.";

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