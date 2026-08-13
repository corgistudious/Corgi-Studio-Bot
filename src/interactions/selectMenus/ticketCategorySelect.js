const {
  ChannelType,
  MessageFlags
} = require("discord.js");

const {
  updateGuildSettings
} = require("../../services/guildSettingsService");

const {
  renderTicketSettings
} = require("../../services/setup/ticketRenderer");

module.exports = {
  customId: "ticket_category_select",

  async execute(interaction) {
    const categoryId =
      interaction.values[0];

    const category =
      interaction.guild.channels.cache.get(
        categoryId
      );

    if (
      !category ||
      category.type !== ChannelType.GuildCategory
    ) {
      await interaction.reply({
        content:
          "❌ Category không hợp lệ.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    await updateGuildSettings(
      interaction.guildId,
      {
        $set: {
          "ticket.categoryId": categoryId
        }
      }
    );

    console.log(
      `📁 Ticket Category: ${category.name}`
    );

    await renderTicketSettings(
      interaction
    );
  }
};