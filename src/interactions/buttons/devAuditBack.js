const {
  MessageFlags
} = require("discord.js");

const isDeveloper =
  require("../../utils/isDeveloper");

const {
  buildDeveloperDashboard
} = require(
  "../../services/developerDashboardRenderer"
);

module.exports = {
  customId:
    "dev_audit_back",

  async execute(interaction) {
    try {
      // =====================================
      // DEVELOPER ONLY
      // =====================================
      if (
        !isDeveloper(
          interaction.user.id
        )
      ) {
        return interaction.reply({
          content:
            "🔐 Developer Only.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // BUILD DASHBOARD
      // =====================================
      const dashboard =
        buildDeveloperDashboard(
          interaction.client
        );

      // =====================================
      // RETURN
      // =====================================
      await interaction.update(
        dashboard
      );

      console.log(
        `🏠 ${interaction.user.tag} quay lại Developer Dashboard`
      );
    } catch (error) {
      console.error(
        "❌ Developer Audit Back Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể quay lại Developer Dashboard.",

            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};