const {
  MessageFlags
} = require("discord.js");

const isDeveloper =
  require("../../utils/isDeveloper");

const {
  renderDeveloperAuditLogs
} = require("../../services/developerAuditRenderer");

module.exports = {
  customId: "dev_audit_logs",

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
      // LOAD PAGE 1
      // =====================================
      const payload =
        await renderDeveloperAuditLogs(
          interaction.client,
          0
        );

      // =====================================
      // UPDATE CURRENT DASHBOARD
      // =====================================
      await interaction.update(
        payload
      );

      console.log(
        `📜 Developer Audit Logs mở bởi ${interaction.user.tag}`
      );
    } catch (error) {
      console.error(
        "❌ Dev Audit Logs Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể mở Developer Audit Logs.",

            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};