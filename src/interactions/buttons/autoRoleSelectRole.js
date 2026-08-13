const {
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  MessageFlags
} = require("discord.js");

module.exports = {
  customId: "autorole_select_role",

  async execute(interaction) {
    const menu = new RoleSelectMenuBuilder()
      .setCustomId("autorole_role_select")
      .setPlaceholder("🎭 Chọn Role tự động")
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder()
      .addComponents(menu);

    await interaction.reply({
      content:
        "🎭 **Chọn Auto Role**\n\n" +
        "Chọn Role mà thành viên mới sẽ được nhận.",
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }
};