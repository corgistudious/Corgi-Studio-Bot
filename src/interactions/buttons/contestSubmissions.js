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

module.exports = {
  customId: "contest_submissions",

  async execute(interaction) {
    try {
      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      // =====================================
      // FIND ACTIVE CONTEST
      // =====================================

      const contest =
        await Contest.findOne({
          guildId:
            interaction.guildId,

          status: {
            $in: [
              "DRAFT",
              "SUBMISSION",
              "VOTING",
              "ENDED"
            ]
          }
        }).sort({
          createdAt: -1
        });

      if (!contest) {
        return interaction.editReply({
          content:
            "⚠️ Hiện không có Event Contest nào để quản lý bài dự thi."
        });
      }

      // =====================================
      // FIND PENDING SUBMISSIONS
      // =====================================

      const submissions =
        await ContestSubmission
          .find({
            guildId:
              interaction.guildId,

            contestId:
              contest._id,

            status:
              "PENDING"
          })
          .sort({
            createdAt: 1
          })
          .limit(10);

      if (
        submissions.length === 0
      ) {
        const embed =
          new EmbedBuilder()
            .setColor(
              0x5865f2
            )
            .setTitle(
              "📥 Bài dự thi"
            )
            .setDescription(
              `Event **${contest.name}** hiện không có bài nào đang chờ duyệt.`
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
          embeds: [embed]
        });
      }

      // =====================================
      // FIRST SUBMISSION
      // =====================================

      const submission =
        submissions[0];

      const total =
        await ContestSubmission
          .countDocuments({
            guildId:
              interaction.guildId,

            contestId:
              contest._id,

            status:
              "PENDING"
          });

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
                `1/${total}`,
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
        "❌ Contest Submissions Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể tải bài dự thi.",
          embeds: [],
          components: []
        });
      } catch {}
    }
  }
};