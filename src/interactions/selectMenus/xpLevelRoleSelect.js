const {
  MessageFlags,
  PermissionsBitField
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
  customId: "xp_level_role_select",

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
            "🔒 Bạn không có quyền cấu hình **Level Roles**.",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // PENDING LEVEL
      // =====================================
      const key =
        `${interaction.guildId}:${interaction.user.id}`;

      const pending =
        interaction.client
          .levelRolePending
          ?.get(key);

      if (!pending) {
        await interaction.update({
          content:
            "⌛ Phiên cấu hình đã hết hạn.\n\n" +
            "Hãy quay lại **Level Roles → Thêm mốc**.",
          components: []
        });

        return;
      }

      // =====================================
      // PENDING TIMEOUT
      // =====================================
      if (
        Date.now() -
          pending.createdAt >
        5 * 60 * 1000
      ) {
        interaction.client
          .levelRolePending
          ?.delete(key);

        await interaction.update({
          content:
            "⌛ Phiên cấu hình đã hết hạn.\n\n" +
            "Hãy tạo lại mốc Level Role.",
          components: []
        });

        return;
      }

      const level =
        Number(
          pending.level
        );

      if (
        !Number.isInteger(level) ||
        level < 1 ||
        level > 10000
      ) {
        interaction.client
          .levelRolePending
          ?.delete(key);

        await interaction.update({
          content:
            "❌ Mốc Level không hợp lệ.",
          components: []
        });

        return;
      }

      // =====================================
      // ROLE ID
      // =====================================
      const roleId =
        interaction.values[0];

      if (!roleId) {
        await interaction.update({
          content:
            "❌ Không lấy được Role đã chọn.",
          components: []
        });

        return;
      }

      // =====================================
      // FETCH ROLE
      // =====================================
      let role =
        interaction.guild.roles.cache.get(
          roleId
        );

      if (!role) {
        try {
          role =
            await interaction.guild.roles.fetch(
              roleId
            );
        } catch {
          role = null;
        }
      }

      if (!role) {
        await interaction.update({
          content:
            "❌ Không tìm thấy Role này trong server.",
          components: []
        });

        return;
      }

      // =====================================
      // CHẶN @EVERYONE
      // =====================================
      if (
        role.id ===
        interaction.guild.id
      ) {
        await interaction.update({
          content:
            "❌ Không thể sử dụng **@everyone** làm Level Role.",
          components: []
        });

        return;
      }

      // =====================================
      // CHẶN MANAGED ROLE
      // =====================================
      if (role.managed) {
        await interaction.update({
          content:
            "❌ Không thể sử dụng Role được quản lý bởi **Bot / Integration**.",
          components: []
        });

        return;
      }

      // =====================================
      // CHẶN ADMIN ROLE
      // =====================================
      if (
        role.permissions.has(
          PermissionsBitField.Flags.Administrator
        )
      ) {
        await interaction.update({
          content:
            "🛡️ Không thể sử dụng Role có quyền **Administrator** làm Level Role.",
          components: []
        });

        return;
      }

      // =====================================
      // BOT MEMBER
      // =====================================
      let botMember =
        interaction.guild.members.me;

      if (!botMember) {
        try {
          botMember =
            await interaction.guild.members.fetchMe();
        } catch {
          botMember = null;
        }
      }

      if (!botMember) {
        await interaction.update({
          content:
            "❌ Không thể kiểm tra quyền của Corgi-Bot.",
          components: []
        });

        return;
      }

      // =====================================
      // MANAGE ROLES
      // =====================================
      if (
        !botMember.permissions.has(
          PermissionsBitField.Flags.ManageRoles
        )
      ) {
        await interaction.update({
          content:
            "❌ Corgi-Bot chưa có quyền **Manage Roles**.",
          components: []
        });

        return;
      }

      // =====================================
      // ROLE HIERARCHY
      // =====================================
      if (
        role.position >=
        botMember.roles.highest.position
      ) {
        await interaction.update({
          content:
            `❌ Corgi-Bot không thể quản lý ${role}.\n\n` +
            "Hãy đưa Role của **Corgi-Bot** lên cao hơn Role này.",
          components: []
        });

        return;
      }

      if (!role.editable) {
        await interaction.update({
          content:
            `❌ Corgi-Bot không thể cấp ${role}.`,
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

      if (!settings.leveling) {
        await interaction.update({
          content:
            "❌ Không tìm thấy cấu hình XP & Level.",
          components: []
        });

        return;
      }

      if (
        !Array.isArray(
          settings.leveling.levelRoles
        )
      ) {
        settings.leveling.levelRoles = [];
      }

      if (
        !Array.isArray(
          settings.leveling.managedLevelRoleIds
        )
      ) {
        settings.leveling.managedLevelRoleIds = [];
      }

      // =====================================
      // FIND EXISTING LEVEL
      // =====================================
      const existing =
        settings.leveling.levelRoles.find(
          (item) =>
            Number(item.level) ===
            level
        );

      // =====================================
      // LIMIT
      // =====================================
      const MAX_LEVEL_ROLES = 25;

      if (
        !existing &&
        settings.leveling.levelRoles.length >=
          MAX_LEVEL_ROLES
      ) {
        await interaction.update({
          content:
            `❌ Server đã đạt giới hạn **${MAX_LEVEL_ROLES} Level Roles**.`,
          components: []
        });

        return;
      }

      // =====================================
      // ADD / UPDATE
      // =====================================
      let updatedExisting = false;

      if (existing) {
        // Role cũ vẫn được giữ trong history
        if (
          existing.roleId &&
          !settings.leveling.managedLevelRoleIds.includes(
            String(existing.roleId)
          )
        ) {
          settings.leveling.managedLevelRoleIds.push(
            String(existing.roleId)
          );
        }

        existing.roleId =
          role.id;

        updatedExisting = true;
      } else {
        settings.leveling.levelRoles.push({
          level,
          roleId:
            role.id
        });
      }

      // =====================================
      // REGISTER MANAGED ROLE
      // =====================================
      if (
        !settings.leveling.managedLevelRoleIds.includes(
          role.id
        )
      ) {
        settings.leveling.managedLevelRoleIds.push(
          role.id
        );
      }

      // =====================================
      // SORT
      // =====================================
      settings.leveling.levelRoles.sort(
        (a, b) =>
          Number(a.level) -
          Number(b.level)
      );

      // =====================================
      // SAVE MONGODB
      // =====================================
      await settings.save();

      interaction.client
        .levelRolePending
        ?.delete(key);

      console.log(
        `🎖️ ${interaction.user.tag} ` +
        `${updatedExisting ? "cập nhật" : "thêm"} ` +
        `Level ${level} → ${role.name} ` +
        `tại ${interaction.guild.name}`
      );

      // =====================================
      // SUCCESS
      // =====================================
      await interaction.update({
        content:
          `${updatedExisting ? "🔄" : "✅"} ` +
          `${updatedExisting ? "Đã cập nhật" : "Đã thêm"} ` +
          `**Level ${level} → ${role}**.`,
        components: []
      });

      // =====================================
      // REFRESH DASHBOARD
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
        "❌ XP Level Role Select Error:",
        error
      );

      try {
        if (
          interaction.replied ||
          interaction.deferred
        ) {
          await interaction.followUp({
            content:
              "❌ Đã xảy ra lỗi khi lưu Level Role.",
            flags:
              MessageFlags.Ephemeral
          });
        } else {
          await interaction.reply({
            content:
              "❌ Đã xảy ra lỗi khi lưu Level Role.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};