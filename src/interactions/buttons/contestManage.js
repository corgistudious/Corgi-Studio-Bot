const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

const ContestSubmission =
  require("../../models/ContestSubmission");

const ContestVote =
  require("../../models/ContestVote");

// =====================================
// STATUS TEXT
// =====================================

function getStatusText(
  status
) {
  switch (status) {
    case "DRAFT":
      return "⚪ Bản nháp";

    case "SUBMISSION":
      return "🟢 Đang nhận bài";

    case "VOTING":
      return "🗳️ Đang bình chọn";

    case "ENDED":
      return "🔴 Đã kết thúc";

    case "PUBLISHED":
      return "🏆 Đã công bố";

    default:
      return "❓ Không xác định";
  }
}

// =====================================
// DISCORD TIME
// =====================================

function discordTime(
  date
) {
  if (!date) {
    return "Chưa thiết lập";
  }

  return `<t:${Math.floor(
    new Date(date).getTime() /
    1000
  )}:f>`;
}

// =====================================
// CHANNEL TEXT
// =====================================

function getChannelText(
  channelId
) {
  return channelId
    ? `<#${channelId}>`
    : "❌ Chưa thiết lập";
}

// =====================================
// MODULE
// =====================================

module.exports = {
  customId:
    "contest_manage",

  async execute(interaction) {
    try {
      // =====================================
      // GUILD ONLY
      // =====================================

      if (!interaction.inGuild()) {
        return interaction.reply({
          content:
            "❌ Chỉ có thể quản lý Contest trong server.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      const guildId =
        interaction.guildId;

      // =====================================
      // FIND ACTIVE CONTEST
      // =====================================

      const contest =
        await Contest.findOne({
          guildId,

          status: {
            $in: [
              "DRAFT",
              "SUBMISSION",
              "VOTING",
              "ENDED"
            ]
          }
        })
          .sort({
            createdAt: -1
          });

      if (!contest) {
        return interaction.editReply({
          content:
            "⚠️ Server hiện không có Event Contest nào đang hoạt động.",

          embeds: [],
          components: []
        });
      }

      // =====================================
      // STATISTICS
      // =====================================

      const [
        totalSubmissions,
        approvedSubmissions,
        pendingSubmissions,
        totalVotes
      ] = await Promise.all([
        ContestSubmission
          .countDocuments({
            guildId,

            contestId:
              contest._id
          }),

        ContestSubmission
          .countDocuments({
            guildId,

            contestId:
              contest._id,

            status:
              "APPROVED"
          }),

        ContestSubmission
          .countDocuments({
            guildId,

            contestId:
              contest._id,

            status:
              "PENDING"
          }),

        ContestVote
          .countDocuments({
            guildId,

            contestId:
              contest._id
          })
      ]);

      // =====================================
      // EMBED
      // =====================================

      const embed =
        new EmbedBuilder()
          .setColor(
            0xf5a623
          )
          .setTitle(
            "⚙️ Corgi Studio — Quản Lý Contest"
          )
          .setDescription(
            `## 🏆 ${contest.name}\n` +
            `${contest.description || "Không có mô tả."}`
          )
          .addFields(
            {
              name:
                "📊 Trạng thái",

              value:
                getStatusText(
                  contest.status
                ),

              inline:
                true
            },

            {
              name:
                "👑 Số giải",

              value:
                String(
                  contest.winnerCount ||
                  3
                ),

              inline:
                true
            },

            {
              name:
                "👤 Người tạo",

              value:
                contest.createdBy
                  ? `<@${contest.createdBy}>`
                  : "Không xác định",

              inline:
                true
            },

            {
              name:
                "📥 Thời gian nhận bài",

              value:
                `${discordTime(
                  contest.submissionStartAt
                )}\n→ ${discordTime(
                  contest.submissionEndAt
                )}`,

              inline:
                false
            },

            {
              name:
                "🗳️ Thời gian bình chọn",

              value:
                `${discordTime(
                  contest.votingStartAt
                )}\n→ ${discordTime(
                  contest.votingEndAt
                )}`,

              inline:
                false
            },

            {
              name:
                "📨 Tổng bài",

              value:
                String(
                  totalSubmissions
                ),

              inline:
                true
            },

            {
              name:
                "✅ Đã duyệt",

              value:
                String(
                  approvedSubmissions
                ),

              inline:
                true
            },

            {
              name:
                "⏳ Chờ duyệt",

              value:
                String(
                  pendingSubmissions
                ),

              inline:
                true
            },

            {
              name:
                "❤️ Tổng Vote",

              value:
                String(
                  totalVotes
                ),

              inline:
                true
            },

            {
              name:
                "🌐 Server",

              value:
                interaction.guild?.name ||
                guildId,

              inline:
                true
            },

            {
              name:
                "📢 Event Channel",

              value:
                getChannelText(
                  contest.submissionChannelId
                ),

              inline:
                false
            },

            {
              name:
                "🖼️ Gallery Channel",

              value:
                getChannelText(
                  contest.galleryChannelId
                ),

              inline:
                false
            },

            {
              name:
                "🏆 Result Channel",

              value:
                getChannelText(
                  contest.resultChannelId
                ),

              inline:
                false
            },

            {
              name:
                "🖼️ Ảnh sự kiện",

              value:
                contest.eventImageUrl
                  ? "✅ Đã thiết lập"
                  : "❌ Chưa thiết lập",

              inline:
                false
            },

            {
              name:
                "🛡️ Anti-Fraud",

              value:
                contest.antiFraud?.enabled === false
                  ? "🔴 Đang tắt"
                  : "🟢 Đang bật",

              inline:
                true
            }
          )
          .setFooter({
            text:
              `Contest ID • ${contest._id}`
          })
          .setTimestamp();

      // =====================================
      // PREVIEW EVENT IMAGE
      // =====================================

      if (
        contest.eventImageUrl
      ) {
        embed.setImage(
          contest.eventImageUrl
        );
      }

      // =====================================
      // ROW 1
      // CONFIGURATION
      // =====================================

      const row1 =
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(
                "contest_channel_config"
              )
              .setLabel(
                "Cấu hình Channel"
              )
              .setEmoji(
                "⚙️"
              )
              .setStyle(
                ButtonStyle.Primary
              ),

            new ButtonBuilder()
              .setCustomId(
                "contest_event_image"
              )
              .setLabel(
                "Ảnh sự kiện"
              )
              .setEmoji(
                "🖼️"
              )
              .setStyle(
                ButtonStyle.Secondary
              ),

            new ButtonBuilder()
              .setCustomId(
                "contest_fraud_review"
              )
              .setLabel(
                "Anti-Fraud"
              )
              .setEmoji(
                "🛡️"
              )
              .setStyle(
                ButtonStyle.Secondary
              )
          );

      // =====================================
      // ROW 2
      // EVENT MANAGEMENT
      // =====================================

      const row2 =
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(
                `contest_announce:${contest._id}`
              )
              .setLabel(
                "Đăng thông báo"
              )
              .setEmoji(
                "📢"
              )
              .setStyle(
                ButtonStyle.Primary
              ),

            new ButtonBuilder()
              .setCustomId(
                `contest_submissions_manage:${contest._id}`
              )
              .setLabel(
                "Bài dự thi"
              )
              .setEmoji(
                "📥"
              )
              .setStyle(
                ButtonStyle.Secondary
              ),

            new ButtonBuilder()
              .setCustomId(
                `contest_refresh:${contest._id}`
              )
              .setLabel(
                "Làm mới"
              )
              .setEmoji(
                "🔄"
              )
              .setStyle(
                ButtonStyle.Secondary
              )
          );

      // =====================================
      // ROW 3
      // VOTE / END / DELETE
      // =====================================

      const row3 =
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(
                `contest_open_vote:${contest._id}`
              )
              .setLabel(
                "Mở Vote"
              )
              .setEmoji(
                "🗳️"
              )
              .setStyle(
                ButtonStyle.Success
              )
              .setDisabled(
                contest.status !==
                  "SUBMISSION"
              ),

            new ButtonBuilder()
              .setCustomId(
                `contest_end:${contest._id}`
              )
              .setLabel(
                "Kết thúc"
              )
              .setEmoji(
                "🛑"
              )
              .setStyle(
                ButtonStyle.Danger
              )
              .setDisabled(
                contest.status ===
                  "ENDED" ||
                contest.status ===
                  "PUBLISHED"
              ),

            new ButtonBuilder()
              .setCustomId(
                `contest_delete:${contest._id}`
              )
              .setLabel(
                "Xóa Event"
              )
              .setEmoji(
                "🗑️"
              )
              .setStyle(
                ButtonStyle.Danger
              )
          );

      // =====================================
      // RESPONSE
      // =====================================

      return interaction.editReply({
        content: null,

        embeds: [
          embed
        ],

        components: [
          row1,
          row2,
          row3
        ]
      });
    } catch (error) {
      console.error(
        "❌ Contest Manage Error:",
        error
      );

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          return await interaction.editReply({
            content:
              "❌ Không thể mở bảng quản lý Contest.",

            embeds: [],
            components: []
          });
        }

        return await interaction.reply({
          content:
            "❌ Không thể mở bảng quản lý Contest.",

          flags:
            MessageFlags.Ephemeral
        });
      } catch {}
    }
  }
};