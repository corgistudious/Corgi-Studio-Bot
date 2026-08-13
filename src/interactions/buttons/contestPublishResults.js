const {
  EmbedBuilder,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

const ContestSubmission =
  require("../../models/ContestSubmission");

const ContestVote =
  require("../../models/ContestVote");

// =====================================
// GET CONTEST ID
// =====================================

function getContestId(customId) {
  return customId.split(":")[1];
}

// =====================================
// MEDAL
// =====================================

function getMedal(rank) {
  if (rank === 1) {
    return "🥇";
  }

  if (rank === 2) {
    return "🥈";
  }

  if (rank === 3) {
    return "🥉";
  }

  return "🏅";
}

// =====================================
// MODULE
// =====================================

module.exports = {
  customId:
    "contest_publish_results",

  async execute(interaction) {
    try {
      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      // =====================================
      // CONTEST ID
      // =====================================

      const contestId =
        getContestId(
          interaction.customId
        );

      // =====================================
      // FIND CONTEST
      // =====================================

      const contest =
        await Contest.findOne({
          _id:
            contestId,

          guildId:
            interaction.guildId
        });

      if (!contest) {
        return interaction.editReply({
          content:
            "❌ Không tìm thấy Contest."
        });
      }

      // =====================================
      // STATUS
      // =====================================

      if (
        contest.status !==
        "ENDED"
      ) {
        return interaction.editReply({
          content:
            contest.status ===
              "PUBLISHED"
              ? "⚠️ Kết quả Contest này đã được công bố."
              : "⚠️ Contest phải kết thúc trước khi công bố kết quả."
        });
      }

      // =====================================
      // RESULT CHANNEL
      // =====================================

      const resultChannelId =
        contest.resultChannelId;

      if (!resultChannelId) {
        return interaction.editReply({
          content:
            "❌ Contest chưa cấu hình **🏆 Result Channel**.\n" +
            "Vào **⚙️ Cấu hình Channel** và chọn Result Channel trước."
        });
      }

      const resultChannel =
        await interaction.guild.channels
          .fetch(
            resultChannelId
          )
          .catch(
            () => null
          );

      if (
        !resultChannel ||
        !resultChannel.isTextBased()
      ) {
        return interaction.editReply({
          content:
            "❌ Result Channel không hợp lệ hoặc bot không thể truy cập Channel."
        });
      }

      // =====================================
      // APPROVED SUBMISSIONS
      // =====================================

      const submissions =
        await ContestSubmission.find({
          guildId:
            interaction.guildId,

          contestId:
            contest._id,

          status:
            "APPROVED"
        });

      if (
        submissions.length === 0
      ) {
        return interaction.editReply({
          content:
            "⚠️ Không có bài hợp lệ để công bố kết quả."
        });
      }

      // =====================================
      // COUNT REAL VOTES
      // =====================================

      for (
        const submission
        of submissions
      ) {
        const voteCount =
          await ContestVote.countDocuments({
            guildId:
              interaction.guildId,

            contestId:
              contest._id,

            submissionId:
              submission._id
          });

        submission.voteCount =
          voteCount;

        await submission.save();
      }

      // =====================================
      // SORT BY VOTE
      // =====================================

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

          // Nếu bằng Vote:
          // bài gửi sớm hơn đứng trước
          // nhưng phần rank bên dưới
          // vẫn xử lý đồng hạng.

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

      let previousVote =
        null;

      let previousRank =
        0;

      const ranked =
        submissions.map(
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

      // =====================================
      // WINNER COUNT
      // =====================================

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

      // =====================================
      // RANKING TEXT
      // =====================================

      const rankingText =
        winners
          .map(
            ({
              submission,
              rank
            }) => {
              return (
                `${getMedal(rank)} **Hạng ${rank} — ${submission.title}**\n` +
                `👤 <@${submission.userId}>\n` +
                `❤️ **${submission.voteCount} Vote**`
              );
            }
          )
          .join(
            "\n\n"
          );

      // =====================================
      // PUBLIC RESULT EMBED
      // =====================================

      const resultEmbed =
        new EmbedBuilder()
          .setColor(
            0xf1c40f
          )
          .setTitle(
            "🏆 KẾT QUẢ EVENT CONTEST"
          )
          .setDescription(
            `🎉 **${contest.name}** đã chính thức khép lại!\n\n` +
            "Cảm ơn tất cả thành viên đã tham gia và bình chọn. ❤️"
          )
          .addFields(
            {
              name:
                "🏅 BẢNG XẾP HẠNG",

              value:
                rankingText ||
                "Không có kết quả.",

              inline:
                false
            },

            {
              name:
                "🎨 Tổng bài hợp lệ",

              value:
                String(
                  submissions.length
                ),

              inline:
                true
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Official Contest Results"
          })
          .setTimestamp();

      // =====================================
      // BANNER
      // =====================================

      if (contest.bannerUrl) {
        resultEmbed.setImage(
          contest.bannerUrl
        );
      }

      // =====================================
      // SEND TO RESULT CHANNEL
      // =====================================

      const message =
        await resultChannel.send({
          embeds: [
            resultEmbed
          ]
        });

      // =====================================
      // SAVE PUBLISHED STATE
      // =====================================

      contest.status =
        "PUBLISHED";

      contest.publishedAt =
        new Date();

      contest.resultsPublished =
        true;

      contest.resultsPublishedAt =
        new Date();

      contest.resultMessageId =
        message.id;

      // Không ghi đè resultChannelId.
      // Result Channel đã được Admin cấu hình.

      await contest.save();

      // =====================================
      // ADMIN RESPONSE
      // =====================================

      await interaction.editReply({
        content:
          `✅ Đã công bố kết quả **${contest.name}** tại <#${resultChannel.id}>.`
      });
    } catch (error) {
      console.error(
        "❌ Contest Publish Results Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể công bố kết quả Contest.",
          embeds: [],
          components: []
        });
      } catch {}
    }
  }
};