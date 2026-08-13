const {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType
} = require("discord.js");

module.exports = {
  customId: "ticket_config_menu",

  async execute(interaction) {
    const selected = interaction.values[0];

    // ==========================
    // CATEGORY
    // ==========================
    if (selected === "category") {
      const menu = new ChannelSelectMenuBuilder()
        .setCustomId("ticket_category_select")
        .setPlaceholder("📁 Chọn Category")
        .setChannelTypes(
          ChannelType.GuildCategory
        )
        .setMinValues(1)
        .setMaxValues(1);

      const row = new ActionRowBuilder()
        .addComponents(menu);

      await interaction.update({
        content:
          "📁 **Chọn Category chứa các Ticket**",
        embeds: [],
        components: [row]
      });

      return;
    }

    // ==========================
    // STAFF ROLE
    // ==========================
    if (selected === "staff_role") {
      const menu = new RoleSelectMenuBuilder()
        .setCustomId("ticket_staff_role_select")
        .setPlaceholder("🛡️ Chọn Staff Role")
        .setMinValues(1)
        .setMaxValues(1);

      const row = new ActionRowBuilder()
        .addComponents(menu);

      await interaction.update({
        content:
          "🛡️ **Chọn Role được phép hỗ trợ Ticket**",
        embeds: [],
        components: [row]
      });

      return;
    }

    // ==========================
    // LOG CHANNEL
    // ==========================
    if (selected === "log_channel") {
      const menu = new ChannelSelectMenuBuilder()
        .setCustomId("ticket_log_channel_select")
        .setPlaceholder("📜 Chọn kênh Log")
        .setChannelTypes(
          ChannelType.GuildText
        )
        .setMinValues(1)
        .setMaxValues(1);

      const row = new ActionRowBuilder()
        .addComponents(menu);

      await interaction.update({
        content:
          "📜 **Chọn kênh ghi Log Ticket**",
        embeds: [],
        components: [row]
      });

      return;
    }

    // ==========================
    // PANEL CHANNEL
    // ==========================
    if (selected === "panel_channel") {
      const menu = new ChannelSelectMenuBuilder()
        .setCustomId("ticket_panel_channel_select")
        .setPlaceholder("📢 Chọn kênh Panel")
        .setChannelTypes(
          ChannelType.GuildText
        )
        .setMinValues(1)
        .setMaxValues(1);

      const row = new ActionRowBuilder()
        .addComponents(menu);

      await interaction.update({
        content:
          "📢 **Chọn kênh đăng Ticket Panel**",
        embeds: [],
        components: [row]
      });
    }
  }
};