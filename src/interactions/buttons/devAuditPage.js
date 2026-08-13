const {
  MessageFlags
} = require("discord.js");

const isDeveloper =
  require("../../utils/isDeveloper");

const {
  renderDeveloperAuditLogs
} = require("../../services/developerAuditRenderer");

module.exports = {
  customId:
    "dev_audit_page",

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
      // CUSTOM ID FORMAT
      //
      // dev_audit_page:prev:0
      // dev_audit_page:refresh:0
      // dev_audit_page:next:1
      // =====================================
      const parts =
        interaction.customId
          .split(":");

      if (
        parts.length !== 3 ||
        parts[0] !==
          "dev_audit_page"
      ) {
        return interaction.reply({
          content:
            "❌ Audit Page ID không hợp lệ.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      const action =
        parts[1];

      const page =
        Number(
          parts[2]
        );

      // =====================================
      // VALIDATE ACTION
      // =====================================
      if (
        ![
          "prev",
          "refresh",
          "next"
        ].includes(
          action
        )
      ) {
        return interaction.reply({
          content:
            "❌ Audit Page Action không hợp lệ.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // VALIDATE PAGE
      // =====================================
      if (
        !Number.isInteger(page) ||
        page < 0
      ) {
        return interaction.reply({
          content:
            "❌ Trang Audit Log không hợp lệ.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // RENDER
      // =====================================
      const payload =
        await renderDeveloperAuditLogs(
          interaction.client,
          page
        );

      // =====================================
      // UPDATE
      // =====================================
      await interaction.update(
        payload
      );

      console.log(
        `📜 Audit Logs | ` +
        `${interaction.user.tag} | ` +
        `${action} → Trang ${page + 1}`
      );
    } catch (error) {
      console.error(
        "❌ Dev Audit Page Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể chuyển trang Audit Logs.",

            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};