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

function getContestId(customId) {
  return customId.split(":")[1];
}

async function enableGalleryVote(
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
              ButtonStyle.Danger
            )
            .setDisabled(false)
        );

    await message.edit({
      components: [row]
    });

    return true;
  } catch (error) {
    console.error(
      `⚠️ Không thể bật Vote cho ${submission._id}:`,
      error
    );

    return false;
  }
}

module.exports = {
  customId:
    "contest_open_vote",

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
            "❌ Không tìm thấy Contest này."
        });
      }

      if (
        contest.status !==
        "SUBMISSION"
      ) {
        return interaction.editReply({
          content:
            "⚠️ Contest hiện không ở trạng thái nhận bài."
        });
      }

      // =====================================
      // FIND APPROVED SUBMISSIONS
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
            "⚠️ Chưa có bài dự thi nào được duyệt.\nHãy duyệt ít nhất một bài trước khi mở Vote."
        });
      }

      // =====================================
      // OPEN VOTE
      // =====================================

      contest.status =
        "VOTING";

      contest.votingStartAt =
        new Date();

      await contest.save();

      // =====================================
      // ENABLE GALLERY BUTTONS
      // =====================================

      let enabledCount = 0;

      for (
        const submission
        of submissions
      ) {
        const enabled =
          await enableGalleryVote(
            interaction,
            submission
          );

        if (enabled) {
          enabledCount++;
        }
      }

      // =====================================
      // RESULT
      // =====================================

      const embed =
        new EmbedBuilder()
          .setColor(
            0x57f287
          )
          .setTitle(
            "🗳️ Đã mở bình chọn"
          )
          .setDescription(
            `Contest **${contest.name}** đã chuyển sang giai đoạn bình chọn.`
          )
          .addFields(
            {
              name:
                "📊 Trạng thái",
              value:
                "🗳️ Đang bình chọn",
              inline:
                true
            },

            {
              name:
                "🎨 Bài được duyệt",
              value:
                String(
                  submissions.length
                ),
              inline:
                true
            },

            {
              name:
                "❤️ Đã bật Vote",
              value:
                String(
                  enabledCount
                ),
              inline:
                true
            },

            {
              name:
                "👤 Giới hạn",
              value:
                `${contest.maxVotesPerUser} Vote / thành viên`,
              inline:
                true
            },

            {
              name:
                "⏰ Kết thúc Vote",
              value:
                contest.votingEndAt
                  ? `<t:${Math.floor(
                      contest.votingEndAt.getTime() /
                      1000
                    )}:f>`
                  : "Chưa thiết lập",
              inline:
                false
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Event Contest"
          })
          .setTimestamp();

      await interaction.editReply({
        embeds: [embed]
      });
    } catch (error) {
      console.error(
        "❌ Contest Open Vote Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể mở Vote."
        });
      } catch {}
    }
  }
};