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

function getSubmissionId(customId) {
  return customId.split(":")[1];
}

// =====================================
// UPDATE GALLERY MESSAGE
// =====================================

async function updateGalleryMessage(
  interaction,
  contest,
  submission
) {
  try {
    if (
      !submission.galleryChannelId ||
      !submission.galleryMessageId
    ) {
      return;
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
      return;
    }

    const message =
      await channel.messages
        .fetch(
          submission.galleryMessageId
        )
        .catch(() => null);

    if (!message) {
      return;
    }

    const embed =
      new EmbedBuilder()
        .setColor(0xf5a623)
        .setTitle(
          `🎨 ${submission.title}`
        )
        .setDescription(
          submission.description ||
          "Không có mô tả."
        )
        .addFields(
          {
            name: "👤 Tác giả",
            value:
              `<@${submission.userId}>`,
            inline: true
          },
          {
            name: "🏆 Event",
            value:
              contest.name,
            inline: true
          },
          {
            name: "❤️ Vote",
            value:
              String(
                submission.voteCount
              ),
            inline: true
          },
          {
            name: "🔗 Tác phẩm",
            value:
              `[Xem tác phẩm](${submission.contentUrl})`,
            inline: false
          }
        )
        .setFooter({
          text:
            "Corgi Studio • Contest Gallery"
        })
        .setTimestamp(
          submission.createdAt
        );

    if (
      submission.contentUrl &&
      /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(
        submission.contentUrl
      )
    ) {
      embed.setImage(
        submission.contentUrl
      );
    }

    const row =
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(
              `contest_vote:${submission._id}`
            )
            .setLabel(
              `Vote • ${submission.voteCount}`
            )
            .setEmoji("❤️")
            .setStyle(
              ButtonStyle.Danger
            )
            .setDisabled(
              contest.status !==
                "VOTING"
            )
        );

    await message.edit({
      embeds: [embed],
      components: [row]
    });
  } catch (error) {
    console.error(
      "⚠️ Không thể cập nhật Gallery:",
      error
    );
  }
}

module.exports = {
  customId: "contest_vote",

  async execute(interaction) {
    try {
      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      // Không cho bot Vote
      if (interaction.user.bot) {
        return interaction.editReply({
          content:
            "❌ Bot không thể tham gia bình chọn."
        });
      }

      const submissionId =
        getSubmissionId(
          interaction.customId
        );

      // =====================================
      // FIND SUBMISSION
      // =====================================

      const submission =
        await ContestSubmission.findOne({
          _id:
            submissionId,

          guildId:
            interaction.guildId,

          status:
            "APPROVED"
        });

      if (!submission) {
        return interaction.editReply({
          content:
            "❌ Không tìm thấy bài dự thi hoặc bài chưa được duyệt."
        });
      }

      // =====================================
      // FIND CONTEST
      // =====================================

      const contest =
        await Contest.findOne({
          _id:
            submission.contestId,

          guildId:
            interaction.guildId
        });

      if (!contest) {
        return interaction.editReply({
          content:
            "❌ Event Contest không còn tồn tại."
        });
      }

      // =====================================
      // CHECK VOTING STATUS
      // =====================================

      if (
        contest.status !==
        "VOTING"
      ) {
        return interaction.editReply({
          content:
            "🔒 Event hiện không mở bình chọn."
        });
      }

      const now =
        new Date();

      if (
        contest.votingEndAt &&
        now >
          contest.votingEndAt
      ) {
        return interaction.editReply({
          content:
            "⏰ Thời gian bình chọn đã kết thúc."
        });
      }

      // =====================================
      // EXISTING VOTE ON THIS SUBMISSION
      // =====================================

      const existingVote =
        await ContestVote.findOne({
          contestId:
            contest._id,

          submissionId:
            submission._id,

          userId:
            interaction.user.id
        });

      // =====================================
      // REMOVE VOTE
      // =====================================

      if (existingVote) {
        if (
          !contest.allowVoteRemove
        ) {
          return interaction.editReply({
            content:
              "⚠️ Bạn đã Vote bài này rồi và Event không cho phép bỏ Vote."
          });
        }

        await ContestVote.deleteOne({
          _id:
            existingVote._id
        });

        // Đếm lại từ DB thay vì -1 thủ công
        const realVoteCount =
          await ContestVote.countDocuments({
            contestId:
              contest._id,

            submissionId:
              submission._id
          });

        submission.voteCount =
          realVoteCount;

        await submission.save();

        await updateGalleryMessage(
          interaction,
          contest,
          submission
        );

        return interaction.editReply({
          content:
            `💔 Bạn đã bỏ Vote cho **${submission.title}**.\n❤️ Tổng Vote hiện tại: **${realVoteCount}**`
        });
      }

      // =====================================
      // USER TOTAL VOTES
      // =====================================

      const userVoteCount =
        await ContestVote.countDocuments({
          contestId:
            contest._id,

          userId:
            interaction.user.id
        });

      if (
        userVoteCount >=
        contest.maxVotesPerUser
      ) {
        return interaction.editReply({
          content:
            `⚠️ Bạn đã sử dụng hết **${contest.maxVotesPerUser} lượt Vote** trong Event này.`
        });
      }

      // =====================================
      // CREATE VOTE
      // =====================================

      try {
        await ContestVote.create({
          guildId:
            interaction.guildId,

          contestId:
            contest._id,

          submissionId:
            submission._id,

          userId:
            interaction.user.id
        });
      } catch (error) {
        // Mongo unique index chống double-click
        if (
          error?.code === 11000
        ) {
          return interaction.editReply({
            content:
              "⚠️ Vote của bạn đã được ghi nhận rồi."
          });
        }

        throw error;
      }

      // =====================================
      // RECALCULATE VOTES
      // =====================================

      const realVoteCount =
        await ContestVote.countDocuments({
          contestId:
            contest._id,

          submissionId:
            submission._id
        });

      submission.voteCount =
        realVoteCount;

      await submission.save();

      // =====================================
      // UPDATE GALLERY
      // =====================================

      await updateGalleryMessage(
        interaction,
        contest,
        submission
      );

      // =====================================
      // SUCCESS
      // =====================================

      await interaction.editReply({
        content:
          `❤️ Bạn đã Vote cho **${submission.title}**!\n❤️ Tổng Vote hiện tại: **${realVoteCount}**`
      });
    } catch (error) {
      console.error(
        "❌ Contest Vote Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể xử lý Vote."
        });
      } catch {}
    }
  }
};