const {
  MessageFlags
} = require("discord.js");

const {
  getGuildSettings,
  updateGuildSettings
} = require("../../services/guildSettingsService");

const {
  renderModeration
} = require("../../services/setup/moderationRenderer");

module.exports = {
  customId:
    "moderation_antispam_toggle",

  async execute(interaction) {
    try {
      if (!interaction.guildId) {
        return interaction.reply({
          content:
            "❌ Không thể sử dụng chức năng này ngoài server.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      const settings =
        await getGuildSettings(
          interaction.guildId
        );

      const current =
        settings.moderation
          ?.antiSpam
          ?.enabled ?? false;

      const newEnabled =
        !current;

      const updated =
        await updateGuildSettings(
          interaction.guildId,
          {
            $set: {
              "moderation.antiSpam.enabled":
                newEnabled
            }
          }
        );

      await interaction.update(
        renderModeration(
          updated
        )
      );

      console.log(
        `🛡️ Anti Spam ${newEnabled ? "ON" : "OFF"} | Guild ${interaction.guildId}`
      );
    } catch (error) {
      console.error(
        "❌ Moderation Anti Spam Toggle Error:",
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "❌ Không thể thay đổi trạng thái Anti Spam.",
          flags:
            MessageFlags.Ephemeral
        });
      }
    }
  }
};