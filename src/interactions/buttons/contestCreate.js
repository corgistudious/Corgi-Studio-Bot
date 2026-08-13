const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

module.exports = {
  customId: "contest_create",

  async execute(interaction) {
    try {
      const modal = new ModalBuilder()
        .setCustomId("contest_create_modal")
        .setTitle("Tạo Event Contest");

      const nameInput = new TextInputBuilder()
        .setCustomId("contest_name")
        .setLabel("Tên sự kiện")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Ví dụ: Corgi Summer Contest 2026")
        .setRequired(true)
        .setMaxLength(100);

      const descriptionInput = new TextInputBuilder()
        .setCustomId("contest_description")
        .setLabel("Mô tả sự kiện")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Nhập nội dung hoặc thể lệ ngắn của sự kiện...")
        .setRequired(false)
        .setMaxLength(2000);

      const submissionEndInput = new TextInputBuilder()
        .setCustomId("contest_submission_end")
        .setLabel("Hạn gửi bài")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("2026-08-20 23:59")
        .setRequired(true)
        .setMaxLength(30);

      const votingEndInput = new TextInputBuilder()
        .setCustomId("contest_voting_end")
        .setLabel("Hạn bình chọn")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("2026-08-25 23:59")
        .setRequired(true)
        .setMaxLength(30);

      const winnerCountInput = new TextInputBuilder()
        .setCustomId("contest_winner_count")
        .setLabel("Số người chiến thắng")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("3")
        .setValue("3")
        .setRequired(true)
        .setMaxLength(2);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(descriptionInput),
        new ActionRowBuilder().addComponents(submissionEndInput),
        new ActionRowBuilder().addComponents(votingEndInput),
        new ActionRowBuilder().addComponents(winnerCountInput)
      );

      await interaction.showModal(modal);
    } catch (error) {
      console.error(
        "❌ Contest Create Button Error:",
        error
      );
    }
  }
};