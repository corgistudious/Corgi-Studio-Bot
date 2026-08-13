const {
  MessageFlags
} = require("discord.js");

const {
  updateGuildSettings
} = require("../../services/guildSettingsService");

module.exports = {
  customId: "ticket_panel_modal",

  async execute(interaction) {
    const title = interaction.fields
      .getTextInputValue("ticket_panel_title")
      .trim();

    const description = interaction.fields
      .getTextInputValue("ticket_panel_description")
      .trim();

    const privateText = interaction.fields
      .getTextInputValue("ticket_panel_private")
      .trim();

    const warningText = interaction.fields
      .getTextInputValue("ticket_panel_warning")
      .trim();

    const buttonLabel = interaction.fields
      .getTextInputValue("ticket_panel_button")
      .trim();

    await updateGuildSettings(
      interaction.guildId,
      {
        $set: {
          "ticket.panel.title": title,
          "ticket.panel.description": description,
          "ticket.panel.privateText": privateText,
          "ticket.panel.warningText": warningText,
          "ticket.panel.buttonLabel": buttonLabel
        }
      }
    );

    await interaction.reply({
      content:
        "✅ **Đã lưu giao diện Ticket Panel.**\n\n" +
        "Hãy nhấn **📤 Đăng Panel** để đăng phiên bản mới.",
      flags: MessageFlags.Ephemeral
    });

    console.log(
      `✏️ ${interaction.user.tag} đã chỉnh Ticket Panel tại ${interaction.guild.name}`
    );
  }
};