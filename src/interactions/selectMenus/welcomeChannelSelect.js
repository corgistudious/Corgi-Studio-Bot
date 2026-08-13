const {
  updateGuildSettings
} = require("../../services/guildSettingsService");

module.exports = {
  customId: "welcome_channel_select",

  async execute(interaction) {
    const channelId = interaction.values[0];

    const channel =
      interaction.guild.channels.cache.get(channelId);

    if (!channel) {
      await interaction.update({
        content: "❌ Không tìm thấy kênh đã chọn.",
        components: []
      });

      return;
    }

    await updateGuildSettings(
      interaction.guildId,
      {
        $set: {
          "welcome.channelId": channelId
        }
      }
    );

    await interaction.update({
      content:
        `✅ Đã đặt ${channel} làm **kênh Welcome**.`,
      components: []
    });

    console.log(
      `👋 Welcome channel của ${interaction.guild.name}: ${channel.name}`
    );
  }
};