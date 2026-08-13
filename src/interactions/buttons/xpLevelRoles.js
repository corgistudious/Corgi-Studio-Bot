const {
  MessageFlags
} = require("discord.js");

const {
  getGuildSettings
} = require("../../services/guildSettingsService");

const {
  renderLevelRoles
} = require("../../services/setup/levelRolesRenderer");

const {
  canManageLevelSettings
} = require("../../utils/setupPermissions");

module.exports = {
  customId: "xp_level_roles",

  async execute(interaction) {
    try {
      // =====================================
      // PERMISSION
      // =====================================
      if (
        !canManageLevelSettings(
          interaction
        )
      ) {
        await interaction.reply({
          content:
            "🔒 Bạn không có quyền cấu hình **Level Roles**.\n\n" +
            "Chức năng này yêu cầu một trong các quyền:\n" +
            "• Server Owner\n" +
            "• Administrator\n" +
            "• Manage Server\n" +
            "• Bot Developer",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // LOAD SETTINGS
      // =====================================
      const settings =
        await getGuildSettings(
          interaction.guildId
        );

      // =====================================
      // OPEN LEVEL ROLES DASHBOARD
      // =====================================
      await interaction.update(
        renderLevelRoles(
          settings
        )
      );

      console.log(
        `🎖️ ${interaction.user.tag} mở Level Roles Dashboard ` +
        `tại ${interaction.guild.name}`
      );
    } catch (error) {
      console.error(
        "❌ XP Level Roles Error:",
        error
      );

      try {
        if (
          interaction.replied ||
          interaction.deferred
        ) {
          await interaction.followUp({
            content:
              "❌ Không thể mở Level Roles Dashboard.",
            flags:
              MessageFlags.Ephemeral
          });
        } else {
          await interaction.reply({
            content:
              "❌ Không thể mở Level Roles Dashboard.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch (replyError) {
        console.error(
          "❌ XP Level Roles Reply Error:",
          replyError
        );
      }
    }
  }
};