const {
  EmbedBuilder,
  MessageFlags
} = require("discord.js");

const ContestSubmission =
  require("../../models/ContestSubmission");

function getSubmissionId(customId) {
  return customId.split(":")[1];
}

module.exports = {
  customId:
    "contest_submission_reject_modal",

  async execute(interaction) {
    try {
      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      const submissionId =
        getSubmissionId(
          interaction.customId
        );

      const reason =
        interaction.fields
          .getTextInputValue(
            "reject_reason"
          )
          .trim();

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

      submission.status =
        "REJECTED";

      submission.rejectedBy =
        interaction.user.id;

      submission.rejectedAt =
        new Date();

      submission.rejectReason =
        reason;

      submission.approvedBy =
        null;

      submission.approvedAt =
        null;

      await submission.save();

      const embed =
        new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle(
            "❌ Đã từ chối bài dự thi"
          )
          .setDescription(
            `**${submission.title}** đã bị từ chối.`
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
                "📝 Lý do",
              value:
                reason,
              inline:
                false
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Contest Moderation"
          })
          .setTimestamp();

      await interaction.editReply({
        embeds: [embed]
      });
    } catch (error) {
      console.error(
        "❌ Contest Submission Reject Modal Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể từ chối bài dự thi."
        });
      } catch {}
    }
  }
};