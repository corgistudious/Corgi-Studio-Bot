const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

function getContestId(customId) {
  return customId.split(":")[1];
}

module.exports = {
  customId: "contest_delete",

  async execute(interaction) {
    try {
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
            "❌ Không tìm thấy Contest này.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      const embed =
        new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle(
            "⚠️ Xác nhận xóa Event Contest"
          )
          .setDescription(
            `Bạn có chắc muốn xóa:\n\n` +
            `## 🏆 ${contest.name}\n\n` +
            "Hành động này không thể hoàn tác."
          )
          .addFields({
            name:
              "⚠️ Cảnh báo",
            value:
              "Bài dự thi và Vote liên quan cũng sẽ được xóa."
          });

      const row =
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(
                `contest_delete_confirm:${contest._id}`
              )
              .setLabel(
                "Xác nhận xóa"
              )
              .setEmoji("🗑️")
              .setStyle(
                ButtonStyle.Danger
              ),

            new ButtonBuilder()
              .setCustomId(
                `contest_refresh:${contest._id}`
              )
              .setLabel(
                "Hủy"
              )
              .setEmoji("✖️")
              .setStyle(
                ButtonStyle.Secondary
              )
          );

      await interaction.reply({
        embeds: [embed],
        components: [row],
        flags:
          MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error(
        "❌ Contest Delete Error:",
        error
      );
    }
  }
};