const {
  SlashCommandBuilder,
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
  data:
    new SlashCommandBuilder()
      .setName("dev")
      .setDescription(
        "Developer Remote Control"
      ),

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
            "🔐 Lệnh này chỉ dành cho **Bot Developer**.",

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
      // SEND
      // =====================================
      await interaction.reply({
        ...dashboard,

        flags:
          MessageFlags.Ephemeral
      });

      console.log(
        `🔐 Developer ${interaction.user.tag} mở Remote Control`
      );
    } catch (error) {
      console.error(
        "❌ Developer Remote Control Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể mở Developer Remote Control.",

            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};