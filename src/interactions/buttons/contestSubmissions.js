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
      // =====================================
      // GUILD ONLY
      // =====================================

      if (!interaction.inGuild()) {
        return interaction.reply({
          content:
            "❌ Chức năng Contest chỉ sử dụng trong Server.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      // Acknowledge ngay để Discord không timeout
      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      const guildId =
        interaction.guildId;

      // =====================================
      // FIND CONTEST OF THIS GUILD ONLY
      // =====================================

      const contest =
        await Contest.findOne({
          guildId,

          status: {
            $in: [
              "DRAFT",
              "SUBMISSION",
              "VOTING",
              "ENDED"
            ]
          }
        })
          .sort({
            createdAt: -1
          });

      if (!contest) {
        return interaction.editReply({
          content:
            "⚠️ Server này hiện không có Event Contest nào để quản lý bài dự thi.",
          embeds: [],
          components: []
        });
      }

      // =====================================
      // PENDING SUBMISSIONS
      // THIS GUILD + THIS CONTEST ONLY
      // =====================================

      const submissions =
        await ContestSubmission
          .find({
            guildId,

            contestId:
              contest._id,

            status:
              "PENDING"
          })
          .sort({
            createdAt: 1
          })
          .limit(10);

      // =====================================
      // EMPTY
      // =====================================

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
          content: null,
          embeds: [
            embed
          ],
          components: []
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
            guildId,

            contestId:
              contest._id,

            status:
              "PENDING"
          });

      // =====================================
      // SAFE VALUES
      // =====================================

      const title =
        String(
          submission.title ||
          "Không có tiêu đề"
        ).slice(
          0,
          200
        );

      const description =
        String(
          submission.description ||
          "Không có mô tả."
        ).slice(
          0,
          1000
        );

      const contentUrl =
        String(
          submission.contentUrl ||
          "Không có liên kết."
        ).slice(
          0,
          1000
        );

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
            `### 🎨 ${title}`
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
                description,

              inline:
                false
            },

            {
              name:
                "🔗 Tác phẩm",

              value:
                contentUrl,

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
            submission.createdAt ||
            new Date()
          );

      // =====================================
      // IMAGE PREVIEW
      // =====================================

      if (
        submission.contentUrl &&
        /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(
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
              .setEmoji(
                "✅"
              )
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
              .setEmoji(
                "❌"
              )
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
              .setEmoji(
                "➡️"
              )
              .setStyle(
                ButtonStyle.Secondary
              )
              .setDisabled(
                total <= 1
              )
          );

      // =====================================
      // RESPONSE
      // =====================================

      return interaction.editReply({
        content: null,
        embeds: [
          embed
        ],
        components: [
          row
        ]
      });
    } catch (error) {
      console.error(
        "❌ Contest Submissions Error:",
        error
      );

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          return await interaction.editReply({
            content:
              "❌ Không thể tải bài dự thi.",
            embeds: [],
            components: []
          });
        }

        return await interaction.reply({
          content:
            "❌ Không thể tải bài dự thi.",
          flags:
            MessageFlags.Ephemeral
        });
      } catch (
        replyError
      ) {
        if (
          replyError?.code !==
          10062
        ) {
          console.error(
            "❌ Contest Submissions Reply Error:",
            replyError
          );
        }
      }
    }
  }
};