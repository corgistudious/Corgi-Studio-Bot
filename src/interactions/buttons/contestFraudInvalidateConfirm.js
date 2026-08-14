const {
  EmbedBuilder,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

const ContestVote =
  require("../../models/ContestVote");

const ContestSubmission =
  require("../../models/ContestSubmission");

const ContestVoteReview =
  require("../../models/ContestVoteReview");

// =====================================
// MODULE
// =====================================

module.exports = {
  customId:
    "contest_fraud_invalidate_confirm",

  async execute(interaction) {
    try {
      // =====================================
      // GUILD ONLY
      // =====================================

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
      //
      // contest_fraud_invalidate_confirm:
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
            "❌ Dữ liệu xác nhận không hợp lệ."
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
      // FIND CURRENT USER VOTES
      // =====================================

      const votes =
        await ContestVote
          .find({
            guildId,

            contestId:
              contest._id,

            userId
          })
          .lean();

      if (
        votes.length === 0
      ) {
        return interaction.editReply({
          content:
            `⚠️ <@${userId}> hiện không còn Vote nào để vô hiệu hóa.`,

          embeds: [],
          components: []
        });
      }

      // =====================================
      // UNIQUE SUBMISSION IDS
      // =====================================

      const submissionIds =
        [
          ...new Set(
            votes.map(
              (vote) =>
                String(
                  vote.submissionId
                )
            )
          )
        ];

      // =====================================
      // DELETE USER VOTES
      // =====================================

      const deleteResult =
        await ContestVote.deleteMany({
          guildId,

          contestId:
            contest._id,

          userId
        });

      const invalidatedCount =
        deleteResult.deletedCount ||
        0;

      // =====================================
      // RECALCULATE EACH SUBMISSION
      // =====================================

      for (
        const submissionId
        of submissionIds
      ) {
        try {
          const realVoteCount =
            await ContestVote
              .countDocuments({
                guildId,

                contestId:
                  contest._id,

                submissionId
              });

          await ContestSubmission
            .updateOne(
              {
                _id:
                  submissionId,

                guildId,

                contestId:
                  contest._id
              },

              {
                $set: {
                  voteCount:
                    realVoteCount
                }
              }
            );
        } catch (updateError) {
          console.error(
            `⚠️ Không thể cập nhật Vote Count cho Submission ${submissionId}:`,
            updateError
          );
        }
      }

      // =====================================
      // SAVE ADMIN REVIEW
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
                  "INVALIDATED",

                reviewedBy:
                  interaction.user.id,

                reviewedAt:
                  new Date(),

                note:
                  "Admin vô hiệu hóa Vote của User.",

                invalidatedVoteCount:
                  invalidatedCount
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
      // RESULT EMBED
      // =====================================

      const embed =
        new EmbedBuilder()
          .setColor(
            0xed4245
          )
          .setTitle(
            "🚫 Anti-Fraud — Đã vô hiệu hóa Vote"
          )
          .setDescription(
            `Vote của <@${userId}> đã được vô hiệu hóa trong Event **${contest.name}**.`
          )
          .addFields(
            {
              name:
                "🚫 Vote đã loại",

              value:
                String(
                  invalidatedCount
                ),

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
                "📊 Trạng thái",

              value:
                "INVALIDATED",

              inline:
                true
            },

            {
              name:
                "🗂️ Submission cập nhật",

              value:
                String(
                  submissionIds.length
                ),

              inline:
                true
            },

            {
              name:
                "📋 Audit Log",

              value:
                "✅ Giữ nguyên",

              inline:
                true
            },

            {
              name:
                "👤 User",

              value:
                "Không bị Ban",

              inline:
                true
            }
          )
          .setFooter({
            text:
              `Review ID • ${review._id}`
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
        "❌ Contest Fraud Invalidate Confirm Error:",
        error
      );

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          return await interaction.editReply({
            content:
              "❌ Không thể vô hiệu hóa Vote.",

            embeds: [],
            components: []
          });
        }

        return await interaction.reply({
          content:
            "❌ Không thể vô hiệu hóa Vote.",

          flags:
            MessageFlags.Ephemeral
        });
      } catch {}
    }
  }
};