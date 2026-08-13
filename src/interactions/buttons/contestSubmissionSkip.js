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

function getParts(customId) {
  const parts =
    customId.split(":");

  return {
    contestId:
      parts[1],

    currentSubmissionId:
      parts[2]
  };
}

module.exports = {
  customId:
    "contest_submission_skip",

  async execute(interaction) {
    try {
      await interaction.deferUpdate();

      const {
        contestId,
        currentSubmissionId
      } = getParts(
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
            "❌ Không tìm thấy Contest.",
          embeds: [],
          components: []
        });
      }

      const submissions =
        await ContestSubmission
          .find({
            contestId:
              contest._id,

            guildId:
              interaction.guildId,

            status:
              "PENDING"
          })
          .sort({
            createdAt: 1
          });

      if (
        submissions.length === 0
      ) {
        return interaction.editReply({
          content:
            "✅ Không còn bài nào đang chờ duyệt.",
          embeds: [],
          components: []
        });
      }

      let currentIndex =
        submissions.findIndex(
          (item) =>
            String(item._id) ===
            String(
              currentSubmissionId
            )
        );

      if (
        currentIndex === -1
      ) {
        currentIndex = 0;
      }

      const nextIndex =
        (
          currentIndex + 1
        ) %
        submissions.length;

      const submission =
        submissions[nextIndex];

      const embed =
        new EmbedBuilder()
          .setColor(0xfee75c)
          .setTitle(
            "📥 Bài dự thi đang chờ duyệt"
          )
          .setDescription(
            `### 🎨 ${submission.title}`
          )
          .addFields(
            {
              name:
                "👤 Người gửi",
              value:
                `<@${submission.userId}>`,
              inline:
                true
            },
            {
              name:
                "📊 Trạng thái",
              value:
                "⏳ Chờ duyệt",
              inline:
                true
            },
            {
              name:
                "📑 Bài",
              value:
                `${nextIndex + 1}/${submissions.length}`,
              inline:
                true
            },
            {
              name:
                "📝 Mô tả",
              value:
                submission.description ||
                "Không có mô tả.",
              inline:
                false
            },
            {
              name:
                "🔗 Tác phẩm",
              value:
                submission.contentUrl,
              inline:
                false
            },
            {
              name:
                "🆔 Submission ID",
              value:
                `\`${submission._id}\``,
              inline:
                false
            }
          )
          .setFooter({
            text:
              `Contest • ${contest.name}`
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
                `contest_submission_approve:${submission._id}`
              )
              .setLabel(
                "Duyệt"
              )
              .setEmoji("✅")
              .setStyle(
                ButtonStyle.Success
              ),

            new ButtonBuilder()
              .setCustomId(
                `contest_submission_reject:${submission._id}`
              )
              .setLabel(
                "Từ chối"
              )
              .setEmoji("❌")
              .setStyle(
                ButtonStyle.Danger
              ),

            new ButtonBuilder()
              .setCustomId(
                `contest_submission_skip:${contest._id}:${submission._id}`
              )
              .setLabel(
                "Bài tiếp theo"
              )
              .setEmoji("➡️")
              .setStyle(
                ButtonStyle.Secondary
              )
              .setDisabled(
                submissions.length <= 1
              )
          );

      await interaction.editReply({
        content: null,
        embeds: [embed],
        components: [row]
      });
    } catch (error) {
      console.error(
        "❌ Contest Submission Skip Error:",
        error
      );

      try {
        await interaction.followUp({
          content:
            "❌ Không thể chuyển sang bài tiếp theo.",
          flags:
            MessageFlags.Ephemeral
        });
      } catch {}
    }
  }
};