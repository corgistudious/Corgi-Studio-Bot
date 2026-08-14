const {
  EmbedBuilder,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

const ContestVoteReview =
  require("../../models/ContestVoteReview");

const {
  scanContestFraud
} =
  require("../../services/contestFraudService");

// =====================================
// MODULE
// =====================================

module.exports = {
  customId:
    "contest_fraud_approve",

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
      // customId:
      // contest_fraud_approve:
      // contestId:userId
      // =====================================

      const parts =
        interaction.customId
          .split(":");

      const contestId =
        parts[1];

      const userId =
        parts[2];

      if (
        !contestId ||
        !userId
      ) {
        return interaction.editReply({
          content:
            "❌ Dữ liệu Review không hợp lệ."
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
      // GET CURRENT RISK
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
      // SAVE ADMIN DECISION
      // =====================================

      const review =
        await ContestVoteReview
          .findOneAndUpdate(
            {
              guildId,

              contestId:
                contest._id,

              userId
            },

            {
              $set: {
                status:
                  "APPROVED",

                riskLevel:
                  userStats.risk,

                riskScore:
                  userStats.score,

                reviewedBy:
                  interaction.user.id,

                reviewedAt:
                  new Date(),

                note:
                  "Admin giữ nguyên Vote.",

                invalidatedVoteCount:
                  0
              }
            },

            {
              new: true,
              upsert: true,

              setDefaultsOnInsert:
                true
            }
          );

      // =====================================
      // RESULT
      // =====================================

      const embed =
        new EmbedBuilder()
          .setColor(
            0x57f287
          )
          .setTitle(
            "✅ Anti-Fraud — Giữ Vote"
          )
          .setDescription(
            `Admin đã xác nhận **giữ nguyên Vote** của <@${userId}>.`
          )
          .addFields(
            {
              name:
                "🏆 Event",

              value:
                contest.name,

              inline:
                false
            },

            {
              name:
                "⚠️ Risk Score",

              value:
                `${review.riskLevel} • ${review.riskScore}`,

              inline:
                true
            },

            {
              name:
                "🛡️ Reviewed By",

              value:
                `<@${interaction.user.id}>`,

              inline:
                true
            },

            {
              name:
                "❤️ Vote",

              value:
                "✅ Được giữ nguyên",

              inline:
                false
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Anti-Fraud Admin Review"
          })
          .setTimestamp();

      return interaction.editReply({
        embeds: [
          embed
        ],

        components: []
      });
    } catch (error) {
      console.error(
        "❌ Contest Fraud Approve Error:",
        error
      );

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          return await interaction.editReply({
            content:
              "❌ Không thể lưu quyết định Admin.",

            embeds: [],
            components: []
          });
        }

        return await interaction.reply({
          content:
            "❌ Không thể lưu quyết định Admin.",

          flags:
            MessageFlags.Ephemeral
        });
      } catch {}
    }
  }
};