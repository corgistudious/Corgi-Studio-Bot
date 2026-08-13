const {
  EmbedBuilder,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

const ContestSubmission =
  require("../../models/ContestSubmission");

const ContestVote =
  require("../../models/ContestVote");

function getContestId(customId) {
  return customId.split(":")[1];
}

module.exports = {
  customId:
    "contest_delete_confirm",

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
          _id: contestId,
          guildId:
            interaction.guildId
        });

      if (!contest) {
        return interaction.editReply({
          content:
            "❌ Contest không còn tồn tại."
        });
      }

      const contestName =
        contest.name;

      // =====================================
      // DELETE RELATED DATA
      // =====================================

      await ContestVote.deleteMany({
        contestId:
          contest._id
      });

      await ContestSubmission.deleteMany({
        contestId:
          contest._id
      });

      await Contest.deleteOne({
        _id:
          contest._id
      });

      // =====================================
      // SUCCESS
      // =====================================

      const embed =
        new EmbedBuilder()
          .setColor(
            0x57f287
          )
          .setTitle(
            "🗑️ Đã xóa Event Contest"
          )
          .setDescription(
            `Contest **${contestName}** đã được xóa khỏi hệ thống.`
          )
          .addFields({
            name:
              "🧹 Dữ liệu",
            value:
              "Event, bài dự thi và Vote liên quan đã được xóa."
          })
          .setFooter({
            text:
              "Corgi Studio • Event Contest"
          })
          .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
        components: []
      });
    } catch (error) {
      console.error(
        "❌ Contest Delete Confirm Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể xóa Contest."
        });
      } catch {}
    }
  }
};