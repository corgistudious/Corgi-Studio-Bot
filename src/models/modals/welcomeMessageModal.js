const {
  MessageFlags
} = require("discord.js");

const {
  updateGuildSettings
} = require("../../services/guildSettingsService");

module.exports = {
  customId: "welcome_message_modal",

  async execute(interaction) {
    const message = interaction.fields
      .getTextInputValue("welcome_message_input")
      .trim();

    if (!message) {
      await interaction.reply({
        content: "❌ Tin nhắn Welcome không được để trống.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    await updateGuildSettings(
      interaction.guildId,
      {
        $set: {
          "welcome.message": message
        }
      }
    );

    await interaction.reply({
      content:
        "✅ **Đã lưu tin nhắn Welcome!**\n\n" +
        "Bạn có thể sử dụng:\n" +
        "`{user}` — mention thành viên\n" +
        "`{username}` — tên thành viên\n" +
        "`{server}` — tên server\n" +
        "`{memberCount}` — số thành viên",
      flags: MessageFlags.Ephemeral
    });

    console.log(
      `✏️ ${interaction.user.tag} đã cập nhật Welcome message tại ${interaction.guild.name}`
    );
  }
};