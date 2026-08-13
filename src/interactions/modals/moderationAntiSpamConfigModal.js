const {
  MessageFlags
} = require("discord.js");

const {
  updateGuildSettings
} = require("../../services/guildSettingsService");

const {
  renderModeration
} = require("../../services/setup/moderationRenderer");

module.exports = {
  customId:
    "moderation_antispam_config_modal",

  async execute(interaction) {
    try {
      const maxMessages =
        Number(
          interaction.fields
            .getTextInputValue(
              "max_messages"
            )
        );

      const intervalSeconds =
        Number(
          interaction.fields
            .getTextInputValue(
              "interval_seconds"
            )
        );

      const timeoutSeconds =
        Number(
          interaction.fields
            .getTextInputValue(
              "timeout_seconds"
            )
        );

      // =====================================
      // VALIDATE MAX MESSAGES
      // =====================================
      if (
        !Number.isInteger(maxMessages) ||
        maxMessages < 2 ||
        maxMessages > 50
      ) {
        return interaction.reply({
          content:
            "❌ Số tin nhắn phải từ **2–50**.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // VALIDATE INTERVAL
      // =====================================
      if (
        !Number.isInteger(intervalSeconds) ||
        intervalSeconds < 1 ||
        intervalSeconds > 60
      ) {
        return interaction.reply({
          content:
            "❌ Khoảng thời gian phải từ **1–60 giây**.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // VALIDATE TIMEOUT
      // =====================================
      if (
        !Number.isInteger(timeoutSeconds) ||
        timeoutSeconds < 5 ||
        timeoutSeconds > 2419200
      ) {
        return interaction.reply({
          content:
            "❌ Timeout phải từ **5 giây đến 28 ngày**.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // SAVE
      // =====================================
      const updated =
        await updateGuildSettings(
          interaction.guildId,
          {
            $set: {
              "moderation.antiSpam.maxMessages":
                maxMessages,

              "moderation.antiSpam.intervalSeconds":
                intervalSeconds,

              "moderation.antiSpam.timeoutSeconds":
                timeoutSeconds
            }
          }
        );

      // =====================================
      // UPDATE DASHBOARD
      // =====================================
      await interaction.update(
        renderModeration(
          updated
        )
      );

      console.log(
        `⚙️ Anti Spam Config | Guild ${interaction.guildId} | ${maxMessages} msg/${intervalSeconds}s | Timeout ${timeoutSeconds}s`
      );
    } catch (error) {
      console.error(
        "❌ Anti Spam Config Modal Error:",
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "❌ Không thể lưu cấu hình Anti Spam.",
          flags:
            MessageFlags.Ephemeral
        });
      }
    }
  }
};