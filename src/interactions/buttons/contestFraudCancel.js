const {
  EmbedBuilder,
  MessageFlags
} = require("discord.js");

module.exports = {
  customId:
    "contest_fraud_cancel",

  async execute(interaction) {
    try {
      const embed =
        new EmbedBuilder()
          .setColor(
            0x5865f2
          )
          .setTitle(
            "✖️ Đã hủy"
          )
          .setDescription(
            "Không có Vote nào bị thay đổi."
          )
          .setFooter({
            text:
              "Corgi Studio • Anti-Fraud"
          })
          .setTimestamp();

      return interaction.update({
        embeds: [
          embed
        ],

        components: []
      });
    } catch (error) {
      console.error(
        "❌ Contest Fraud Cancel Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể xử lý thao tác.",

            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};