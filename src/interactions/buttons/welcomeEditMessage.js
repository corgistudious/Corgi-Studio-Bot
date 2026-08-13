const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

const {
  getGuildSettings
} = require("../../services/guildSettingsService");

module.exports = {
  customId: "welcome_edit_message",

  async execute(interaction) {
    const settings = await getGuildSettings(
      interaction.guildId
    );

    const modal = new ModalBuilder()
      .setCustomId("welcome_message_modal")
      .setTitle("Chỉnh sửa tin nhắn Welcome");

    const messageInput = new TextInputBuilder()
      .setCustomId("welcome_message_input")
      .setLabel("Tin nhắn chào mừng")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(
        "Chào mừng {user} đến với {server}! 🎉"
      )
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(1000);

    if (settings.welcome.message) {
      messageInput.setValue(
        settings.welcome.message.slice(0, 1000)
      );
    }

    const row = new ActionRowBuilder()
      .addComponents(messageInput);

    modal.addComponents(row);

    await interaction.showModal(modal);
  }
};