const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags
} = require("discord.js");

const ContestSubmission =
  require("../../models/ContestSubmission");

function getSubmissionId(customId) {
  return customId.split(":")[1];
}

module.exports = {
  customId:
    "contest_submission_reject",

  async execute(interaction) {
    try {
      const submissionId =
        getSubmissionId(
          interaction.customId
        );

      const submission =
        await ContestSubmission.findOne({
          _id:
            submissionId,

          guildId:
            interaction.guildId
        });

      if (!submission) {
        return interaction.reply({
          content:
            "❌ Không tìm thấy bài dự thi.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      if (
        submission.status !==
        "PENDING"
      ) {
        return interaction.reply({
          content:
            `⚠️ Bài này hiện đang ở trạng thái **${submission.status}**.`,
          flags:
            MessageFlags.Ephemeral
        });
      }

      const modal =
        new ModalBuilder()
          .setCustomId(
            `contest_submission_reject_modal:${submission._id}`
          )
          .setTitle(
            "Từ chối bài dự thi"
          );

      const reasonInput =
        new TextInputBuilder()
          .setCustomId(
            "reject_reason"
          )
          .setLabel(
            "Lý do từ chối"
          )
          .setStyle(
            TextInputStyle.Paragraph
          )
          .setPlaceholder(
            "Ví dụ: Bài chưa đúng chủ đề sự kiện..."
          )
          .setRequired(true)
          .setMinLength(2)
          .setMaxLength(1000);

      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(
            reasonInput
          )
      );

      await interaction.showModal(
        modal
      );
    } catch (error) {
      console.error(
        "❌ Contest Submission Reject Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể mở form từ chối.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};