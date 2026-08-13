const {
  PermissionFlagsBits
} = require("discord.js");

const {
  getGuildSettings
} = require("../../services/guildSettingsService");

const {
  renderXpLevel
} = require("../../services/setup/xpLevelRenderer");

const isDeveloper =
  require("../../utils/isDeveloper");

module.exports = {
  customId: "xp_level_roles_back",

  async execute(interaction) {
    try {
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
      // BACK TO XP DASHBOARD
      // =====================================

      await interaction.update(
        renderXpLevel(
          settings,
          developer,
          canManageConfig
        )
      );

      console.log(
        `⬅️ ${interaction.user.tag} quay lại XP & Level Dashboard`
      );

    } catch (error) {
      console.error(
        "❌ XP Level Roles Back Error:",
        error
      );
    }
  }
};