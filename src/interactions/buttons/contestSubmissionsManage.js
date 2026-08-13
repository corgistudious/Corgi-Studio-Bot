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

module.exports = {
  customId:
    "contest_submissions_manage",

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
            "❌ Không tìm thấy Event Contest."
        });
      }

      // =====================================
      // FIND PENDING SUBMISSIONS
      // =====================================

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
          })
          .limit(10);

      // =====================================
      // NO SUBMISSIONS
      // =====================================

      if (
        submissions.length === 0
      ) {
        const emptyEmbed =
          new EmbedBuilder()
            .setColor(
              0x5865f2
            )
            .setTitle(
              "📥 Bài dự thi"
            )
            .setDescription(
              `Hiện tại **${contest.name}** không có bài nào đang chờ duyệt.`
            )
            .addFields({
              name:
                "📊 Trạng thái",
              value:
                "✅ Không có bài PENDING."
            })
            .setFooter({
              text:
                "Corgi Studio • Contest Moderation"
            })
            .setTimestamp();

        return interaction.editReply({
          embeds: [
            emptyEmbed
          ]
        });
      }

      // =====================================
      // CURRENT SUBMISSION
      // =====================================

      const submission =
        submissions[0];

      const position = 1;

      const total =
        await ContestSubmission
          .countDocuments({
            contestId:
              contest._id,

            status:
              "PENDING"
          });

      // =====================================
      // EMBED
      // =====================================

      const embed =
        new EmbedBuilder()
          .setColor(
            0xfee75c
          )
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
                `${position}/${total}`,
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

      // =====================================
      // IMAGE PREVIEW
      // =====================================

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

      // =====================================
      // BUTTONS
      // =====================================

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
                total <= 1
              )
          );

      await interaction.editReply({
        embeds: [embed],
        components: [row]
      });
    } catch (error) {
      console.error(
        "❌ Contest Submissions Manage Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể tải danh sách bài dự thi.",
          embeds: [],
          components: []
        });
      } catch {}
    }
  }
};