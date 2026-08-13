const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags
} = require("discord.js");

const {
  getGuildSettings
} = require("../../services/guildSettingsService");

module.exports = {
  customId:
    "moderation_antispam_config",

  async execute(interaction) {
    try {
      const settings =
        await getGuildSettings(
          interaction.guildId
        );

      const antiSpam =
        settings.moderation
          ?.antiSpam || {};

      const modal =
        new ModalBuilder()
          .setCustomId(
            "moderation_antispam_config_modal"
          )
          .setTitle(
            "Cấu hình Anti Spam"
          );

      const maxMessages =
        new TextInputBuilder()
          .setCustomId(
            "max_messages"
          )
          .setLabel(
            "Số tin nhắn tối đa"
          )
          .setStyle(
            TextInputStyle.Short
          )
          .setRequired(true)
          .setValue(
            String(
              antiSpam.maxMessages ??
              5
            )
          )
          .setPlaceholder(
            "Ví dụ: 5"
          );

      const interval =
        new TextInputBuilder()
          .setCustomId(
            "interval_seconds"
          )
          .setLabel(
            "Khoảng thời gian kiểm tra (giây)"
          )
          .setStyle(
            TextInputStyle.Short
          )
          .setRequired(true)
          .setValue(
            String(
              antiSpam.intervalSeconds ??
              5
            )
          )
          .setPlaceholder(
            "Ví dụ: 5"
          );

      const timeout =
        new TextInputBuilder()
          .setCustomId(
            "timeout_seconds"
          )
          .setLabel(
            "Thời gian Timeout (giây)"
          )
          .setStyle(
            TextInputStyle.Short
          )
          .setRequired(true)
          .setValue(
            String(
              antiSpam.timeoutSeconds ??
              60
            )
          )
          .setPlaceholder(
            "Ví dụ: 60"
          );

      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(
            maxMessages
          ),

        new ActionRowBuilder()
          .addComponents(
            interval
          ),

        new ActionRowBuilder()
          .addComponents(
            timeout
          )
      );

      await interaction.showModal(
        modal
      );
    } catch (error) {
      console.error(
        "❌ Anti Spam Config Button Error:",
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "❌ Không thể mở cấu hình Anti Spam.",
          flags:
            MessageFlags.Ephemeral
        });
      }
    }
  }
};