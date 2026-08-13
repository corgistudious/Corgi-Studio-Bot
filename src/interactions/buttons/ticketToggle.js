const {
  updateGuildSettings,
  getGuildSettings
} = require("../../services/guildSettingsService");

const {
  renderTicketSettings
} = require("../../services/setup/ticketRenderer");

module.exports = {
  customId: "ticket_toggle",

  async execute(interaction) {
    const settings = await getGuildSettings(
      interaction.guildId
    );

    const newStatus =
      !(settings.ticket?.enabled ?? false);

    await updateGuildSettings(
      interaction.guildId,
      {
        $set: {
          "ticket.enabled":
            newStatus
        }
      }
    );

    await renderTicketSettings(
      interaction
    );

    console.log(
      `🎫 Ticket ${
        newStatus ? "BẬT" : "TẮT"
      } tại ${interaction.guild.name}`
    );
  }
};