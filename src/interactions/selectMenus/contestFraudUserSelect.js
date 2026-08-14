const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

const ContestVote =
  require("../../models/ContestVote");

const ContestVoteAudit =
  require("../../models/ContestVoteAudit");

const ContestVoteReview =
  require("../../models/ContestVoteReview");

const {
  scanContestFraud
} =
  require("../../services/contestFraudService");

// =====================================
// RISK TEXT
// =====================================

function getRiskText(risk) {
  switch (risk) {
    case "HIGH":
      return "🔴 Cao";

    case "MEDIUM":
      return "🟠 Trung bình";

    case "LOW":
      return "🟡 Thấp";

    default:
      return "🟢 Bình thường";
  }
}

// =====================================
// REVIEW STATUS
// =====================================

function getReviewStatus(status) {
  switch (status) {
    case "APPROVED":
      return "✅ Giữ Vote";

    case "INVALIDATED":
      return "🚫 Đã vô hiệu hóa";

    case "PENDING":
      return "⏳ Chờ Admin Review";

    default:
      return "⚪ Chưa Review";
  }
}

// =====================================
// MODULE
// =====================================

module.exports = {
  customId:
    "contest_fraud_user_select",

  async execute(interaction) {
    try {
      if (!interaction.inGuild()) {
        return interaction.reply({
          content:
            "❌ Chức năng này chỉ sử dụng trong Server.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      // =====================================
      // SELECT VALUE
      // contestId:userId
      // =====================================

      const value =
        interaction.values?.[0];

      if (!value) {
        return interaction.editReply({
          content:
            "❌ User Review không hợp lệ."
        });
      }

      const [
        contestId,
        userId
      ] =
        value.split(":");

      if (
        !contestId ||
        !userId
      ) {
        return interaction.editReply({
          content:
            "❌ Dữ liệu User Review không hợp lệ."
        });
      }

      const guildId =
        interaction.guildId;

      // =====================================
      // FIND CONTEST
      // =====================================

      const contest =
        await Contest.findOne({
          _id:
            contestId,

          guildId
        });

      if (!contest) {
        return interaction.editReply({
          content:
            "❌ Không tìm thấy Contest."
        });
      }

      // =====================================
      // SCAN USER
      // =====================================

      const scan =
        await scanContestFraud({
          guildId,

          contestId:
            contest._id
        });

      const userStats =
        scan.allUsers.find(
          (item) =>
            String(
              item.userId
            ) ===
            String(
              userId
            )
        );

      if (!userStats) {
        return interaction.editReply({
          content:
            "❌ Không tìm thấy dữ liệu Anti-Fraud của User này."
        });
      }

      // =====================================
      // CURRENT VALID VOTES
      // =====================================

      const validVotes =
        await ContestVote
          .countDocuments({
            guildId,

            contestId:
              contest._id,

            userId
          });

      // =====================================
      // AUDIT COUNT
      // =====================================

      const auditCount =
        await ContestVoteAudit
          .countDocuments({
            guildId,

            contestId:
              contest._id,

            userId
          });

      // =====================================
      // REVIEW RECORD
      // =====================================

      let review =
        await ContestVoteReview
          .findOne({
            guildId,

            contestId:
              contest._id,

            userId
          });

      // =====================================
      // CREATE PENDING REVIEW IF NEEDED
      // =====================================

      if (!review) {
        review =
          await ContestVoteReview.create({
            guildId,

            contestId:
              contest._id,

            userId,

            status:
              "PENDING",

            riskLevel:
              userStats.risk,

            riskScore:
              userStats.score
          });
      } else {
        review.riskLevel =
          userStats.risk;

        review.riskScore =
          userStats.score;

        await review.save();
      }

      // =====================================
      // DETAILS
      // =====================================

      const detailLines =
        [];

      detailLines.push(
        `❤️ Vote thêm: **${userStats.voteAdded}**`
      );

      detailLines.push(
        `💔 Vote bỏ: **${userStats.voteRemoved}**`
      );

      if (
        userStats.blockedAccountAge
      ) {
        detailLines.push(
          `🆕 Account Age bị chặn: **${userStats.blockedAccountAge}**`
        );
      }

      if (
        userStats.blockedJoinAge
      ) {
        detailLines.push(
          `🚪 Join Age bị chặn: **${userStats.blockedJoinAge}**`
        );
      }

      if (
        userStats.blockedCooldown
      ) {
        detailLines.push(
          `⏱️ Cooldown bị chặn: **${userStats.blockedCooldown}**`
        );
      }

      if (
        userStats.blockedDuplicate
      ) {
        detailLines.push(
          `♻️ Duplicate bị chặn: **${userStats.blockedDuplicate}**`
        );
      }

      if (
        userStats.blockedMaxVotes
      ) {
        detailLines.push(
          `🚫 Max Vote bị chặn: **${userStats.blockedMaxVotes}**`
        );
      }

      // =====================================
      // EMBED
      // =====================================

      const embed =
        new EmbedBuilder()
          .setColor(
            userStats.risk ===
              "HIGH"
              ? 0xed4245
              : userStats.risk ===
                  "MEDIUM"
                ? 0xfee75c
                : 0x5865f2
          )
          .setTitle(
            "👤 Anti-Fraud — User Review"
          )
          .setDescription(
            `### <@${userId}>\n` +
            `Event: **${contest.name}**`
          )
          .addFields(
            {
              name:
                "⚠️ Risk",

              value:
                `${getRiskText(
                  userStats.risk
                )}\nScore: **${userStats.score}**`,

              inline:
                true
            },

            {
              name:
                "❤️ Vote hiện còn",

              value:
                String(
                  validVotes
                ),

              inline:
                true
            },

            {
              name:
                "📋 Audit Events",

              value:
                String(
                  auditCount
                ),

              inline:
                true
            },

            {
              name:
                "🔎 Chi tiết",

              value:
                detailLines.join(
                  "\n"
                ),

              inline:
                false
            },

            {
              name:
                "👮 Trạng thái Review",

              value:
                getReviewStatus(
                  review.status
                ),

              inline:
                false
            }
          )
          .setFooter({
            text:
              `User ID • ${userId}`
          })
          .setTimestamp();

      if (
        review.reviewedBy
      ) {
        embed.addFields({
          name:
            "🛡️ Admin Review",

          value:
            `<@${review.reviewedBy}>` +
            (
              review.reviewedAt
                ? ` • <t:${Math.floor(
                    new Date(
                      review.reviewedAt
                    ).getTime() /
                    1000
                  )}:f>`
                : ""
            ),

          inline:
            false
        });
      }

      // =====================================
      // ADMIN ACTION BUTTONS
      // =====================================

      const row =
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(
                `contest_fraud_approve:${contest._id}:${userId}`
              )
              .setLabel(
                "Giữ Vote"
              )
              .setEmoji(
                "✅"
              )
              .setStyle(
                ButtonStyle.Success
              )
              .setDisabled(
                review.status ===
                  "APPROVED"
              ),

            new ButtonBuilder()
              .setCustomId(
                `contest_fraud_invalidate:${contest._id}:${userId}`
              )
              .setLabel(
                "Vô hiệu hóa Vote"
              )
              .setEmoji(
                "🚫"
              )
              .setStyle(
                ButtonStyle.Danger
              )
              .setDisabled(
                review.status ===
                  "INVALIDATED"
              )
          );

      return interaction.editReply({
        embeds: [
          embed
        ],

        components: [
          row
        ]
      });
    } catch (error) {
      console.error(
        "❌ Contest Fraud User Select Error:",
        error
      );

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          return await interaction.editReply({
            content:
              "❌ Không thể mở User Review.",

            embeds: [],
            components: []
          });
        }

        return await interaction.reply({
          content:
            "❌ Không thể mở User Review.",

          flags:
            MessageFlags.Ephemeral
        });
      } catch {}
    }
  }
};