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

// =====================================
// GET SUBMISSION ID
// =====================================

function getSubmissionId(customId) {
  return customId.split(":")[1];
}

// =====================================
// MODULE
// =====================================

module.exports = {
  customId:
    "contest_submission_approve",

  async execute(interaction) {
    try {
      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      // =====================================
      // SUBMISSION ID
      // =====================================

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
            interaction.guildId
        });

      if (!submission) {
        return interaction.editReply({
          content:
            "❌ Không tìm thấy bài dự thi."
        });
      }

      if (
        submission.status !==
        "PENDING"
      ) {
        return interaction.editReply({
          content:
            `⚠️ Bài này hiện đang ở trạng thái **${submission.status}**.`
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
            "❌ Không tìm thấy Event Contest của bài này."
        });
      }

      // =====================================
      // GALLERY CHANNEL
      // =====================================

      const galleryChannelId =
        contest.galleryChannelId;

      if (!galleryChannelId) {
        return interaction.editReply({
          content:
            "❌ Contest chưa cấu hình **🖼️ Gallery Channel**.\n" +
            "Vào **⚙️ Cấu hình Channel** và chọn Gallery Channel trước."
        });
      }

      const galleryChannel =
        await interaction.guild.channels
          .fetch(
            galleryChannelId
          )
          .catch(
            () => null
          );

      if (
        !galleryChannel ||
        !galleryChannel.isTextBased()
      ) {
        return interaction.editReply({
          content:
            "❌ Gallery Channel không hợp lệ hoặc bot không thể gửi tin nhắn vào Channel."
        });
      }

      // =====================================
      // APPROVE DATABASE
      // =====================================

      submission.status =
        "APPROVED";

      submission.approvedBy =
        interaction.user.id;

      submission.approvedAt =
        new Date();

      submission.rejectedBy =
        null;

      submission.rejectedAt =
        null;

      submission.rejectReason =
        null;

      await submission.save();

      // =====================================
      // GALLERY EMBED
      // =====================================

      const galleryEmbed =
        new EmbedBuilder()
          .setColor(
            0xf5a623
          )
          .setTitle(
            `🎨 ${submission.title}`
          )
          .setDescription(
            submission.description ||
              "Không có mô tả."
          )
          .addFields(
            {
              name:
                "👤 Tác giả",

              value:
                `<@${submission.userId}>`,

              inline:
                true
            },

            {
              name:
                "🏆 Event",

              value:
                contest.name,

              inline:
                true
            },

            {
              name:
                "❤️ Vote",

              value:
                String(
                  submission.voteCount ||
                  0
                ),

              inline:
                true
            },

            {
              name:
                "🔗 Tác phẩm",

              value:
                `[Xem tác phẩm](${submission.contentUrl})`,

              inline:
                false
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Contest Gallery"
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
        galleryEmbed.setImage(
          submission.contentUrl
        );
      }

      // =====================================
      // VOTE BUTTON
      // =====================================
      // Khi bài vừa được duyệt, Vote vẫn khóa.
      // contestOpenVote sẽ mở khi Event
      // chuyển sang VOTING.
      // =====================================

      const voteRow =
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(
                `contest_vote:${submission._id}`
              )
              .setLabel(
                `Vote • ${submission.voteCount || 0}`
              )
              .setEmoji(
                "❤️"
              )
              .setStyle(
                ButtonStyle.Secondary
              )
              .setDisabled(
                true
              )
          );

      // =====================================
      // SEND TO GALLERY
      // =====================================

      let galleryMessage;

      try {
        galleryMessage =
          await galleryChannel.send({
            embeds: [
              galleryEmbed
            ],

            components: [
              voteRow
            ]
          });
      } catch (sendError) {
        // Nếu gửi Gallery thất bại,
        // rollback về PENDING.

        submission.status =
          "PENDING";

        submission.approvedBy =
          null;

        submission.approvedAt =
          null;

        await submission.save();

        throw sendError;
      }

      // =====================================
      // SAVE GALLERY MESSAGE
      // =====================================

      submission.galleryChannelId =
        galleryChannel.id;

      submission.galleryMessageId =
        galleryMessage.id;

      await submission.save();

      // Không tự thay đổi contest.galleryChannelId.
      // Gallery Channel do Admin cấu hình.

      // =====================================
      // SUCCESS
      // =====================================

      const successEmbed =
        new EmbedBuilder()
          .setColor(
            0x57f287
          )
          .setTitle(
            "✅ Đã duyệt bài dự thi"
          )
          .setDescription(
            `**${submission.title}** đã được duyệt và đăng lên Gallery.`
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
                "✅ APPROVED",

              inline:
                true
            },

            {
              name:
                "🖼️ Gallery",

              value:
                `<#${galleryChannel.id}>`,

              inline:
                true
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Contest Moderation"
          })
          .setTimestamp();

      await interaction.editReply({
        embeds: [
          successEmbed
        ]
      });
    } catch (error) {
      console.error(
        "❌ Contest Submission Approve Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể duyệt hoặc đăng bài lên Gallery.",
          embeds: []
        });
      } catch {}
    }
  }
};