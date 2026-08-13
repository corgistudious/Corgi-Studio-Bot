const {
  EmbedBuilder,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

const ContestSubmission =
  require("../../models/ContestSubmission");

function getContestId(customId) {
  return customId.split(":")[1];
}

function isValidUrl(value) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

module.exports = {
  customId:
    "contest_submit_modal",

  async execute(interaction) {
    try {
      if (!interaction.inGuild()) {
        return interaction.reply({
          content:
            "❌ Chỉ có thể gửi bài trong server.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      const contestId =
        getContestId(
          interaction.customId
        );

      // =====================================
      // GET INPUT
      // =====================================

      const title =
        interaction.fields
          .getTextInputValue(
            "submission_title"
          )
          .trim();

      const description =
        interaction.fields
          .getTextInputValue(
            "submission_description"
          )
          .trim();

      const contentUrl =
        interaction.fields
          .getTextInputValue(
            "submission_url"
          )
          .trim();

      // =====================================
      // VALIDATE URL
      // =====================================

      if (
        !isValidUrl(
          contentUrl
        )
      ) {
        return interaction.editReply({
          content:
            "❌ Link tác phẩm không hợp lệ. Link phải bắt đầu bằng `http://` hoặc `https://`."
        });
      }

      // =====================================
      // FIND CONTEST
      // =====================================

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
            "❌ Event Contest không còn tồn tại."
        });
      }

      // =====================================
      // CHECK STATUS AGAIN
      // =====================================

      if (
        contest.status !==
        "SUBMISSION"
      ) {
        return interaction.editReply({
          content:
            "🔒 Event hiện không nhận bài dự thi."
        });
      }

      const now =
        new Date();

      if (
        contest.submissionEndAt &&
        now >
          contest.submissionEndAt
      ) {
        return interaction.editReply({
          content:
            "⏰ Thời gian nhận bài đã kết thúc."
        });
      }

      // =====================================
      // CHECK LIMIT AGAIN
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
        return interaction.editReply({
          content:
            `⚠️ Bạn đã đạt giới hạn **${contest.maxSubmissionsPerUser} bài dự thi**.`
        });
      }

      // =====================================
      // CREATE SUBMISSION
      // =====================================

      const submission =
        await ContestSubmission.create({
          guildId:
            interaction.guildId,

          contestId:
            contest._id,

          userId:
            interaction.user.id,

          title,

          description,

          contentType:
            "LINK",

          contentUrl,

          status:
            contest.requireApproval
              ? "PENDING"
              : "APPROVED",

          approvedBy:
            contest.requireApproval
              ? null
              : interaction.user.id,

          approvedAt:
            contest.requireApproval
              ? null
              : new Date()
        });

      // =====================================
      // SUCCESS
      // =====================================

      const statusText =
        submission.status ===
        "PENDING"
          ? "⏳ Chờ Admin duyệt"
          : "✅ Đã được duyệt";

      const embed =
        new EmbedBuilder()
          .setColor(
            submission.status ===
              "PENDING"
              ? 0xfee75c
              : 0x57f287
          )
          .setTitle(
            "📥 Đã nhận bài dự thi"
          )
          .setDescription(
            `Bài của bạn đã được gửi tới **${contest.name}**.`
          )
          .addFields(
            {
              name:
                "🎨 Tác phẩm",
              value:
                submission.title,
              inline:
                false
            },
            {
              name:
                "📊 Trạng thái",
              value:
                statusText,
              inline:
                true
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
              "Corgi Studio • Event Contest"
          })
          .setTimestamp();

      await interaction.editReply({
        embeds: [embed]
      });
    } catch (error) {
      console.error(
        "❌ Contest Submit Modal Error:",
        error
      );

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          await interaction.editReply({
            content:
              "❌ Không thể gửi bài dự thi."
          });
        } else {
          await interaction.reply({
            content:
              "❌ Không thể gửi bài dự thi.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};