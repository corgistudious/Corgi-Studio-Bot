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
  customId: "ticket_customize_panel",

  async execute(interaction) {
    const settings = await getGuildSettings(
      interaction.guildId
    );

    const panel =
      settings.ticket?.panel || {};

    const modal = new ModalBuilder()
      .setCustomId("ticket_panel_modal")
      .setTitle("Tùy chỉnh Ticket Panel");

    const titleInput = new TextInputBuilder()
      .setCustomId("ticket_panel_title")
      .setLabel("Tiêu đề")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100)
      .setValue(
        panel.title ||
          "🎫 Corgi Studio — Trung Tâm Hỗ Trợ"
      );

    const descriptionInput = new TextInputBuilder()
      .setCustomId("ticket_panel_description")
      .setLabel("Mô tả")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000)
      .setValue(
        panel.description ||
          "Bạn đang cần hỗ trợ từ đội ngũ Corgi Studio?"
      );

    const privateInput = new TextInputBuilder()
      .setCustomId("ticket_panel_private")
      .setLabel("Nội dung Riêng tư")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(300)
      .setValue(
        panel.privateText ||
          "Ticket chỉ hiển thị cho bạn và đội ngũ hỗ trợ."
      );

    const warningInput = new TextInputBuilder()
      .setCustomId("ticket_panel_warning")
      .setLabel("Lưu ý")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(300)
      .setValue(
        panel.warningText ||
          "Không tạo Ticket spam hoặc khi không cần thiết."
      );

    const buttonInput = new TextInputBuilder()
      .setCustomId("ticket_panel_button")
      .setLabel("Tên nút mở Ticket")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(80)
      .setValue(
        panel.buttonLabel ||
          "Mở Ticket"
      );

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descriptionInput),
      new ActionRowBuilder().addComponents(privateInput),
      new ActionRowBuilder().addComponents(warningInput),
      new ActionRowBuilder().addComponents(buttonInput)
    );

    await interaction.showModal(modal);
  }
};