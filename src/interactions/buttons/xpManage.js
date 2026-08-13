const {
  ActionRowBuilder,
  UserSelectMenuBuilder,
  EmbedBuilder,
  MessageFlags
} = require("discord.js");

const isDeveloper =
  require("../../utils/isDeveloper");

module.exports = {
  customId: "xp_manage",

  async execute(interaction) {
    if (!isDeveloper(interaction.user.id)) {
      await interaction.reply({
        content:
          "🔒 **Developer Only**\n\n" +
          "Chỉ Developer của Corgi-Bot mới được quản lý XP & Level.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(
        "🛠️ XP & Level — Developer Control"
      )
      .setDescription(
        "Chọn một thành viên bên dưới để quản lý XP và Level."
      )
      .addFields({
        name: "🔐 Quyền truy cập",
        value: "Developer Only"
      })
      .setFooter({
        text: "Corgi Studio • XP Management"
      });

    const userSelect =
      new UserSelectMenuBuilder()
        .setCustomId("xp_user_select")
        .setPlaceholder(
          "👤 Chọn thành viên"
        )
        .setMinValues(1)
        .setMaxValues(1);

    const row =
      new ActionRowBuilder()
        .addComponents(userSelect);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }
};