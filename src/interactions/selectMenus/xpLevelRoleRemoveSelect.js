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
  customId:
    "xp_level_role_remove_select",

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
            "🔒 Bạn không có quyền xóa **Level Roles**.",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // SELECTED LEVEL
      // =====================================
      const selectedLevel =
        Number(
          interaction.values[0]
        );

      if (
        !Number.isInteger(
          selectedLevel
        ) ||
        selectedLevel < 1
      ) {
        await interaction.update({
          content:
            "❌ Mốc Level không hợp lệ.",
          components: []
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

      const currentRoles =
        settings.leveling?.levelRoles || [];

      if (
        !Array.isArray(
          currentRoles
        )
      ) {
        await interaction.update({
          content:
            "❌ Dữ liệu Level Roles không hợp lệ.",
          components: []
        });

        return;
      }

      // =====================================
      // FIND TARGET
      // =====================================
      const target =
        currentRoles.find(
          (item) =>
            Number(item.level) ===
            selectedLevel
        );

      if (!target) {
        await interaction.update({
          content:
            "⚠️ Mốc Level này không còn tồn tại.",
          components: []
        });

        return;
      }

      // =====================================
      // ROLE INFO
      // =====================================
      const role =
        interaction.guild.roles.cache.get(
          target.roleId
        );

      const roleName =
        role
          ? role.name
          : `Role ID ${target.roleId}`;

      // =====================================
      // ENSURE MANAGED HISTORY
      // =====================================
      if (
        !Array.isArray(
          settings.leveling.managedLevelRoleIds
        )
      ) {
        settings.leveling.managedLevelRoleIds = [];
      }

      // Role bị xóa khỏi active config,
      // nhưng vẫn phải giữ trong history
      // để Sync biết cần cleanup.
      if (
        target.roleId &&
        !settings.leveling.managedLevelRoleIds.includes(
          String(target.roleId)
        )
      ) {
        settings.leveling.managedLevelRoleIds.push(
          String(target.roleId)
        );
      }

      // =====================================
      // REMOVE ACTIVE LEVEL CONFIG
      // =====================================
      settings.leveling.levelRoles =
        currentRoles.filter(
          (item) =>
            Number(item.level) !==
            selectedLevel
        );

      // =====================================
      // SAVE
      // =====================================
      await settings.save();

      console.log(
        `🗑️ ${interaction.user.tag} xóa ` +
        `Level ${selectedLevel} → ${roleName} ` +
        `tại ${interaction.guild.name}`
      );

      // =====================================
      // UPDATE MESSAGE
      // =====================================
      await interaction.update({
        content:
          `✅ Đã xóa mốc **Level ${selectedLevel}**` +
          (
            role
              ? ` → ${role}`
              : ""
          ) +
          ".\n\n" +
          "🔄 Hãy dùng **Đồng bộ Roles** để cleanup role cũ khỏi thành viên.",
        components: []
      });

      // =====================================
      // REFRESH
      // =====================================
      const updatedSettings =
        await getGuildSettings(
          interaction.guildId
        );

      await interaction.followUp({
        ...renderLevelRoles(
          updatedSettings
        ),

        flags:
          MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error(
        "❌ XP Level Role Remove Select Error:",
        error
      );

      try {
        if (
          interaction.replied ||
          interaction.deferred
        ) {
          await interaction.followUp({
            content:
              "❌ Không thể xóa Level Role.",
            flags:
              MessageFlags.Ephemeral
          });
        } else {
          await interaction.reply({
            content:
              "❌ Không thể xóa Level Role.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};