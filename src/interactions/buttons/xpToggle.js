const {
  MessageFlags,
  PermissionFlagsBits
} = require("discord.js");

const {
  getGuildSettings
} = require("../../services/guildSettingsService");

const {
  renderXpLevel
} = require("../../services/setup/xpLevelRenderer");

module.exports = {
  customId: "xp_toggle",

  async execute(interaction) {
    try {
      // =====================================
      // SERVER CONFIG PERMISSION
      // Owner / Admin / Manager / Moderator
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

      if (!canManageConfig) {
        await interaction.reply({
          content:
            "🔒 **Không có quyền**\n\n" +
            "Bạn cần là **Server Owner**, " +
            "có quyền **Administrator**, " +
            "**Manage Server** hoặc **Moderate Members** " +
            "để thay đổi cấu hình XP.",

          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // GET SETTINGS
      // =====================================

      const settings =
        await getGuildSettings(
          interaction.guildId
        );

      if (!settings.leveling) {
        settings.leveling = {};
      }

      // =====================================
      // TOGGLE XP
      // =====================================

      settings.leveling.enabled =
        !(settings.leveling.enabled ?? true);

      await settings.save();

      // =====================================
      // UPDATE DASHBOARD
      // =====================================

      await interaction.update(
        renderXpLevel(
          settings,
          false,
          canManageConfig
        )
      );

      console.log(
        `⚙️ ${interaction.user.tag} → XP ${
          settings.leveling.enabled
            ? "ON"
            : "OFF"
        } tại Guild ${interaction.guildId}`
      );

    } catch (error) {
      console.error(
        "❌ XP Toggle Error:",
        error
      );

      if (
        interaction.replied ||
        interaction.deferred
      ) {
        return;
      }

      await interaction.reply({
        content:
          "❌ Không thể thay đổi trạng thái XP.",

        flags:
          MessageFlags.Ephemeral
      });
    }
  }
};