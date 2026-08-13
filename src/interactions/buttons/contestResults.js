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
// MEDAL
// =====================================

function getMedal(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";

  return "🏅";
}

// =====================================
// BUILD RANKING
// =====================================

async function buildRanking(
  guildId,
  contest
) {
  const submissions =
    await ContestSubmission.find({
      guildId,
      contestId: contest._id,
      status: "APPROVED"
    });

  // Đếm lại Vote thật từ MongoDB
  for (
    const submission
    of submissions
  ) {
    const voteCount =
      await ContestVote.countDocuments({
        guildId,
        contestId:
          contest._id,
        submissionId:
          submission._id
      });

    submission.voteCount =
      voteCount;

    await submission.save();
  }

  submissions.sort(
    (a, b) => {
      if (
        b.voteCount !==
        a.voteCount
      ) {
        return (
          b.voteCount -
          a.voteCount
        );
      }

      return (
        new Date(
          a.createdAt
        ).getTime() -
        new Date(
          b.createdAt
        ).getTime()
      );
    }
  );

  // =====================================
  // TIE RANKING
  // =====================================

  let previousVote = null;
  let previousRank = 0;

  return submissions.map(
    (
      submission,
      index
    ) => {
      let rank;

      if (
        previousVote !== null &&
        submission.voteCount ===
          previousVote
      ) {
        rank =
          previousRank;
      } else {
        rank =
          index + 1;
      }

      previousVote =
        submission.voteCount;

      previousRank =
        rank;

      return {
        submission,
        rank
      };
    }
  );
}

module.exports = {
  customId:
    "contest_results",

  async execute(interaction) {
    try {
      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      // =====================================
      // FIND LATEST ENDED CONTEST
      // =====================================

      const contest =
        await Contest.findOne({
          guildId:
            interaction.guildId,

          status: {
            $in: [
              "ENDED",
              "PUBLISHED"
            ]
          }
        }).sort({
          updatedAt: -1
        });

      if (!contest) {
        return interaction.editReply({
          content:
            "⚠️ Chưa có Contest nào đã kết thúc để xem kết quả."
        });
      }

      // =====================================
      // RANKING
      // =====================================

      const ranked =
        await buildRanking(
          interaction.guildId,
          contest
        );

      if (
        ranked.length === 0
      ) {
        return interaction.editReply({
          content:
            "⚠️ Contest không có bài APPROVED để xếp hạng."
        });
      }

      const winnerCount =
        Math.max(
          1,
          contest.winnerCount ||
          3
        );

      const winners =
        ranked.filter(
          (item) =>
            item.rank <=
            winnerCount
        );

      const rankingText =
        winners
          .map(
            ({
              submission,
              rank
            }) =>
              `${getMedal(rank)} **Hạng ${rank} — ${submission.title}**\n` +
              `👤 <@${submission.userId}>\n` +
              `❤️ **${submission.voteCount} Vote**`
          )
          .join(
            "\n\n"
          );

      // =====================================
      // RESULT EMBED
      // =====================================

      const embed =
        new EmbedBuilder()
          .setColor(
            0xf1c40f
          )
          .setTitle(
            "🏆 Kết quả Event Contest"
          )
          .setDescription(
            `Kết quả của **${contest.name}**`
          )
          .addFields(
            {
              name:
                "🏅 Bảng xếp hạng",
              value:
                rankingText,
              inline:
                false
            },

            {
              name:
                "🎨 Tổng bài hợp lệ",
              value:
                String(
                  ranked.length
                ),
              inline:
                true
            },

            {
              name:
                "📊 Trạng thái",
              value:
                contest.status ===
                  "PUBLISHED"
                  ? "📢 Đã công bố"
                  : "🛑 Đã kết thúc",
              inline:
                true
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Contest Results"
          })
          .setTimestamp();

      // =====================================
      // PUBLISH BUTTON
      // =====================================

      const row =
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(
                `contest_publish_results:${contest._id}`
              )
              .setLabel(
                contest.status ===
                  "PUBLISHED"
                  ? "Đã công bố"
                  : "Công bố kết quả"
              )
              .setEmoji("📢")
              .setStyle(
                ButtonStyle.Success
              )
              .setDisabled(
                contest.status ===
                  "PUBLISHED"
              )
          );

      await interaction.editReply({
        embeds: [embed],
        components: [row]
      });
    } catch (error) {
      console.error(
        "❌ Contest Results Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể tải kết quả Contest.",
          embeds: [],
          components: []
        });
      } catch {}
    }
  }
};