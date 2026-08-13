const {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  MessageFlags
} = require("discord.js");

module.exports = {
  customId: "welcome_select_channel",

  async execute(interaction) {
    const channelMenu = new ChannelSelectMenuBuilder()
      .setCustomId("welcome_channel_select")
      .setPlaceholder("📢 Chọn kênh Welcome")
      .setMinValues(1)
      .setMaxValues(1)
      .addChannelTypes(
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement
      );

    const row = new ActionRowBuilder()
      .addComponents(channelMenu);

    await interaction.reply({
      content:
        "📢 **Chọn kênh Welcome**\n\n" +
        "Hãy chọn kênh mà bot sẽ gửi lời chào khi có thành viên mới.",
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }
};