const {
  getGuildSettings
} = require("../../services/guildSettingsService");

const {
  buildMainDashboard
} = require("../../services/dashboardRenderer");

module.exports = {
  customId: "setup_refresh",

  async execute(interaction) {
    const settings =
      await getGuildSettings(interaction.guildId);

    const dashboard =
      buildMainDashboard(settings);

    await interaction.update(dashboard);
  }
};