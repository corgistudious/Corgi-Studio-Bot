const {
  MessageFlags,
  PermissionFlagsBits
} = require("discord.js");

const {
  renderWelcomeSettings
} = require("../../services/setup/welcomeRenderer");

const {
  renderAutoRoleSettings
} = require("../../services/setup/autoRoleRenderer");

const {
  renderTicketSettings
} = require("../../services/setup/ticketRenderer");

const {
  renderXpLevel
} = require("../../services/setup/xpLevelRenderer");

const {
  renderModeration
} = require("../../services/setup/moderationRenderer");

const {
  getGuildSettings
} = require("../../services/guildSettingsService");

const isDeveloper =
  require("../../utils/isDeveloper");

module.exports = {
  customId: "setup_main_menu",

  async execute(interaction) {
    try {
      const selected =
        interaction.values[0];

      // =====================================
      // WELCOME
      // =====================================

      if (
        selected ===
        "welcome"
      ) {
        await renderWelcomeSettings(
          interaction
        );

        return;
      }

      // =====================================
      // AUTO ROLE
      // =====================================

      if (
        selected ===
        "autorole"
      ) {
        await renderAutoRoleSettings(
          interaction
        );

        return;
      }

      // =====================================
      // TICKET
      // =====================================

      if (
        selected ===
        "ticket"
      ) {
        await renderTicketSettings(
          interaction
        );

        return;
      }

      // =====================================
      // XP & LEVEL
      // =====================================

      if (
        selected ===
        "leveling"
      ) {
        const settings =
          await getGuildSettings(
            interaction.guildId
          );

        // =====================================
        // BOT DEVELOPER
        // =====================================

        const developer =
          isDeveloper(
            interaction.user.id
          );

        // =====================================
        // SERVER CONFIG PERMISSION
        //
        // Owner
        // Administrator
        // Manage Server
        // Moderate Members
        // =====================================

        const canManageConfig =
          interaction.guild.ownerId ===
            interaction.user.id ||
          interaction.member.permissions.has(
            PermissionFlagsBits.Administrator
          ) ||
          interaction.member.permissions.has(
            PermissionFlagsBits.ManageGuild
          ) ||
          interaction.member.permissions.has(
            PermissionFlagsBits.ModerateMembers
          );

        // =====================================
        // RENDER XP & LEVEL
        // =====================================

        await interaction.update(
          renderXpLevel(
            settings,
            developer,
            canManageConfig
          )
        );

        return;
      }

      // =====================================
      // MODERATION & ANTI SPAM
      // =====================================

      if (
        selected ===
        "moderation"
      ) {
        const settings =
          await getGuildSettings(
            interaction.guildId
          );

        await interaction.update(
          renderModeration(
            settings
          )
        );

        return;
      }

      // =====================================
      // GENERAL
      // =====================================

      if (
        selected ===
        "general"
      ) {
        await interaction.reply({
          content:
            "🚧 Module **General** đang được phát triển.",

          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // LOGS
      // =====================================

      if (
        selected ===
        "logs"
      ) {
        await interaction.reply({
          content:
            "🚧 Module **Logs** đang được phát triển.",

          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // GIVEAWAY
      // =====================================

      if (
        selected ===
        "giveaway"
      ) {
        await interaction.reply({
          content:
            "🚧 Module **Giveaway** đang được phát triển.",

          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // SURVEY
      // =====================================

      if (
        selected ===
        "survey"
      ) {
        await interaction.reply({
          content:
            "🚧 Module **Survey** đang được phát triển.",

          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // UNKNOWN
      // =====================================

      await interaction.reply({
        content:
          `❌ Không nhận diện được module: **${selected}**`,

        flags:
          MessageFlags.Ephemeral
      });

    } catch (error) {
      console.error(
        "❌ Setup Main Menu Error:",
        error
      );

      try {
        if (
          interaction.replied ||
          interaction.deferred
        ) {
          await interaction.followUp({
            content:
              "❌ Không thể mở module này.",

            flags:
              MessageFlags.Ephemeral
          });
        } else {
          await interaction.reply({
            content:
              "❌ Không thể mở module này.",

            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};