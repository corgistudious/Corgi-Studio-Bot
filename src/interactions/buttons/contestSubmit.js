const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
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
  customId: "contest_submit",

  async execute(interaction) {
    try {
      if (!interaction.inGuild()) {
        return interaction.reply({
          content:
            "❌ Chỉ có thể gửi bài dự thi trong server.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      const contestId =
        getContestId(
          interaction.customId
        );

      const contest =
        await Contest.findOne({
          _id: contestId,
          guildId:
            interaction.guildId
        });

      if (!contest) {
        return interaction.reply({
          content:
            "❌ Event Contest không còn tồn tại.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // CONTEST STATUS
      // =====================================

      if (
        contest.status !==
        "SUBMISSION"
      ) {
        return interaction.reply({
          content:
            "🔒 Event hiện không nhận bài dự thi.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // DEADLINE
      // =====================================

      const now =
        new Date();

      if (
        contest.submissionEndAt &&
        now >
          contest.submissionEndAt
      ) {
        return interaction.reply({
          content:
            "⏰ Thời gian nhận bài của Event đã kết thúc.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // USER SUBMISSION LIMIT
      // =====================================

      const submissionCount =
        await ContestSubmission.countDocuments({
          contestId:
            contest._id,

          userId:
            interaction.user.id,

          status: {
            $in: [
              "PENDING",
              "APPROVED"
            ]
          }
        });

      if (
        submissionCount >=
        contest.maxSubmissionsPerUser
      ) {
        return interaction.reply({
          content:
            `⚠️ Bạn đã đạt giới hạn **${contest.maxSubmissionsPerUser} bài dự thi** cho Event này.`,
          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // MODAL
      // =====================================

      const modal =
        new ModalBuilder()
          .setCustomId(
            `contest_submit_modal:${contest._id}`
          )
          .setTitle(
            "Gửi bài dự thi"
          );

      const titleInput =
        new TextInputBuilder()
          .setCustomId(
            "submission_title"
          )
          .setLabel(
            "Tên tác phẩm"
          )
          .setStyle(
            TextInputStyle.Short
          )
          .setPlaceholder(
            "Ví dụ: Corgi Summer Island"
          )
          .setRequired(true)
          .setMaxLength(100);

      const descriptionInput =
        new TextInputBuilder()
          .setCustomId(
            "submission_description"
          )
          .setLabel(
            "Mô tả tác phẩm"
          )
          .setStyle(
            TextInputStyle.Paragraph
          )
          .setPlaceholder(
            "Giới thiệu ngắn về tác phẩm của bạn..."
          )
          .setRequired(false)
          .setMaxLength(1000);

      const urlInput =
        new TextInputBuilder()
          .setCustomId(
            "submission_url"
          )
          .setLabel(
            "Link ảnh / video / tác phẩm"
          )
          .setStyle(
            TextInputStyle.Short
          )
          .setPlaceholder(
            "https://..."
          )
          .setRequired(true)
          .setMaxLength(1000);

      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(
            titleInput
          ),

        new ActionRowBuilder()
          .addComponents(
            descriptionInput
          ),

        new ActionRowBuilder()
          .addComponents(
            urlInput
          )
      );

      await interaction.showModal(
        modal
      );
    } catch (error) {
      console.error(
        "❌ Contest Submit Button Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể mở form gửi bài.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};