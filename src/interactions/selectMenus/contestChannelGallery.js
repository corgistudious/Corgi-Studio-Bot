const {
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

module.exports = {
  customId: "contest_channel_gallery",

  async execute(interaction) {
    try {
      await interaction.deferReply({
        flags: MessageFlags.Ephemeral
      });

      const contestId =
        interaction.customId.split(":")[1];

      const channelId =
        interaction.values[0];

      const contest =
        await Contest.findOne({
          _id: contestId,
          guildId: interaction.guildId
        });

      if (!contest) {
        return interaction.editReply({
          content:
            "❌ Không tìm thấy Contest."
        });
      }

      contest.galleryChannelId =
        channelId;

      await contest.save();

      await interaction.editReply({
        content:
          `✅ Gallery Channel đã được đặt thành <#${channelId}>.`
      });
    } catch (error) {
      console.error(
        "❌ Contest Gallery Channel Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể lưu Gallery Channel."
        });
      } catch {}
    }
  }
};