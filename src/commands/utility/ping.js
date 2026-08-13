const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription(
      "Kiểm tra trạng thái Corgi Studio Bot."
    ),

  async execute(interaction) {
    const startTime = Date.now();

    await interaction.reply({
      content: "🏓 Đang kiểm tra..."
    });

    const botLatency = Date.now() - startTime;

    const websocketPing = interaction.client.ws.ping;

    const apiLatency =
      websocketPing >= 0
        ? `${Math.round(websocketPing)}ms`
        : "Đang đo...";

    await interaction.editReply(
      `🔴 **Pong!**\n` +
      `🤖 Độ trễ Bot: **${botLatency}ms**\n` +
      `🌐 Độ trễ Discord API: **${apiLatency}**`
    );
  }
};