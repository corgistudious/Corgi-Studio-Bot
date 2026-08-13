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

function getContestId(customId) {
  return customId.split(":")[1];
}

// =====================================
// DISABLE VOTE BUTTON
// =====================================

async function disableVoteButton(
  interaction,
  submission
) {
  try {
    if (
      !submission.galleryChannelId ||
      !submission.galleryMessageId
    ) {
      return false;
    }

    const channel =
      await interaction.guild.channels
        .fetch(
          submission.galleryChannelId
        )
        .catch(() => null);

    if (
      !channel ||
      !channel.isTextBased()
    ) {
      return false;
    }

    const message =
      await channel.messages
        .fetch(
          submission.galleryMessageId
        )
        .catch(() => null);

    if (!message) {
      return false;
    }

    const row =
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(
              `contest_vote:${submission._id}`
            )
            .setLabel(
              `Vote • ${submission.voteCount || 0}`
            )
            .setEmoji("❤️")
            .setStyle(
              ButtonStyle.Secondary
            )
            .setDisabled(true)
        );

    await message.edit({
      components: [row]
    });

    return true;
  } catch (error) {
    console.error(
      `⚠️ Không thể khóa Vote của ${submission._id}:`,
      error
    );

    return false;
  }
}

// =====================================
// MEDAL
// =====================================

function getMedal(position) {
  if (position === 1) {
    return "🥇";
  }

  if (position === 2) {
    return "🥈";
  }

  if (position === 3) {
    return "🥉";
  }

  return "🏅";
}

module.exports = {
  customId: "contest_end",

  async execute(interaction) {
    try {
      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      const contestId =
        getContestId(
          interaction.customId
        );

      // =====================================
      // FIND CONTEST
      // =====================================

      const contest =
        await Contest.findOne({
          _id: contestId,
          guildId:
            interaction.guildId
        });

      if (!contest) {
        return interaction.editReply({
          content:
            "❌ Không tìm thấy Contest."
        });
      }

      // Chỉ kết thúc khi đang Voting
      if (
        contest.status !==
        "VOTING"
      ) {
        return interaction.editReply({
          content:
            `⚠️ Contest hiện đang ở trạng thái **${contest.status}**.\nChỉ Contest đang **VOTING** mới có thể kết thúc.`
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
            "⚠️ Contest không có bài APPROVED để tính kết quả."
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
      // SORT
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
      // RANK WITH TIES
      // =====================================

      let previousVote = null;
      let previousRank = 0;

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
              // Đồng số Vote = đồng hạng
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
      // WINNERS
      // =====================================

      const winnerCount =
        Math.max(
          1,
          contest.winnerCount || 3
        );

      const winners =
        ranked.filter(
          (item) =>
            item.rank <=
            winnerCount
        );

      // =====================================
      // END CONTEST FIRST
      // =====================================

      contest.status =
        "ENDED";

      contest.endedAt =
        new Date();

      await contest.save();

      // =====================================
      // DISABLE ALL VOTE BUTTONS
      // =====================================

      let disabledCount = 0;

      for (
        const submission
        of submissions
      ) {
        const disabled =
          await disableVoteButton(
            interaction,
            submission
          );

        if (disabled) {
          disabledCount++;
        }
      }

      // =====================================
      // BUILD RANKING
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
      // ADMIN RESULT
      // =====================================

      const embed =
        new EmbedBuilder()
          .setColor(
            0xf1c40f
          )
          .setTitle(
            "🏆 Contest đã kết thúc"
          )
          .setDescription(
            `**${contest.name}** đã đóng bình chọn thành công.`
          )
          .addFields(
            {
              name:
                "📊 Trạng thái",
              value:
                "🛑 ENDED",
              inline:
                true
            },

            {
              name:
                "🎨 Tổng bài",
              value:
                String(
                  submissions.length
                ),
              inline:
                true
            },

            {
              name:
                "🔒 Gallery đã khóa",
              value:
                `${disabledCount}/${submissions.length}`,
              inline:
                true
            },

            {
              name:
                "🏆 Kết quả tạm thời",
              value:
                rankingText ||
                "Không có kết quả.",
              inline:
                false
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Contest Results"
          })
          .setTimestamp();

      await interaction.editReply({
        embeds: [embed]
      });
    } catch (error) {
      console.error(
        "❌ Contest End Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể kết thúc Contest.",
          embeds: [],
          components: []
        });
      } catch {}
    }
  }
};