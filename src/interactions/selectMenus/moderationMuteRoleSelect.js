const {
  MessageFlags,
  PermissionFlagsBits
} = require("discord.js");

const {
  updateGuildSettings,
  getGuildSettings
} = require("../../services/guildSettingsService");

const {
  setupMuteRolePermissions
} = require("../../services/setup/muteRoleService");

const {
  renderModeration
} = require("../../services/setup/moderationRenderer");

const {
  canManageGuild
} = require("../../utils/setupPermissions");

module.exports = {
  customId:
    "moderation_mute_role_select",

  async execute(interaction) {
    try {
      // =====================================
      // PERMISSION
      // =====================================
      if (
        !canManageGuild(
          interaction
        )
      ) {
        return interaction.reply({
          content:
            "🔒 Bạn không có quyền cấu hình Moderation.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // SELECTED ROLE
      // =====================================
      const roleId =
        interaction.values[0];

      const role =
        interaction.guild.roles.cache.get(
          roleId
        );

      if (!role) {
        return interaction.update({
          content:
            "❌ Không tìm thấy Role.",
          components: []
        });
      }

      // =====================================
      // @EVERYONE
      // =====================================
      if (
        role.id ===
        interaction.guild.id
      ) {
        return interaction.update({
          content:
            "❌ Không thể dùng **@everyone** làm Mute Role.",

          components: []
        });
      }

      // =====================================
      // MANAGED ROLE
      // =====================================
      if (role.managed) {
        return interaction.update({
          content:
            "❌ Không thể sử dụng Role do Discord hoặc Bot khác quản lý.",

          components: []
        });
      }

      // =====================================
      // BOT MEMBER
      // =====================================
      const botMember =
        interaction.guild.members.me;

      if (!botMember) {
        return interaction.update({
          content:
            "❌ Không thể xác định quyền của Bot.",

          components: []
        });
      }

      // =====================================
      // MANAGE ROLES
      // =====================================
      if (
        !botMember.permissions.has(
          PermissionFlagsBits.ManageRoles
        )
      ) {
        return interaction.update({
          content:
            "❌ Bot cần quyền **Manage Roles**.",

          components: []
        });
      }

      // =====================================
      // MANAGE CHANNELS
      // =====================================
      if (
        !botMember.permissions.has(
          PermissionFlagsBits.ManageChannels
        )
      ) {
        return interaction.update({
          content:
            "❌ Bot cần quyền **Manage Channels** để cấu hình quyền Mute Role.",

          components: []
        });
      }

      // =====================================
      // ROLE HIERARCHY
      // =====================================
      if (
        botMember.roles.highest
          .comparePositionTo(
            role
          ) <= 0
      ) {
        return interaction.update({
          content:
            "❌ Mute Role phải nằm **thấp hơn Role của Bot**.",

          components: []
        });
      }

      // =====================================
      // SAVE MUTE ROLE
      // =====================================
      await updateGuildSettings(
        interaction.guildId,
        {
          $set: {
            "moderation.muteRoleId":
              role.id
          }
        }
      );

      // =====================================
      // CONFIG CHANNEL PERMISSIONS
      // =====================================
      const result =
        await setupMuteRolePermissions(
          interaction.guild,
          role
        );

      console.log(
        `🔇 Mute Role | ${interaction.guild.name} → ${role.name}`
      );

      console.log(
        `📢 Channel Success: ${result.success} | Failed: ${result.failed}`
      );

      // =====================================
      // CONFIRM SELECT
      // =====================================
      await interaction.update({
        content:
          `✅ Đã đặt ${role} làm **Mute Role**.\n\n` +
          "🔇 Role này sẽ được cấp khi dùng `/mute` và gỡ khi dùng `/unmute`.\n\n" +
          `📢 Channel đã cấu hình: **${result.success}**\n` +
          `⚠️ Channel lỗi: **${result.failed}**`,

        components: []
      });

      // =====================================
      // LOAD FRESH SETTINGS
      // =====================================
      const updatedSettings =
        await getGuildSettings(
          interaction.guildId
        );

      // =====================================
      // SHOW REFRESHED DASHBOARD
      // =====================================
      await interaction.followUp({
        ...renderModeration(
          updatedSettings
        ),

        flags:
          MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error(
        "❌ Moderation Mute Role Select Error:",
        error
      );

      try {
        if (
          interaction.replied ||
          interaction.deferred
        ) {
          await interaction.followUp({
            content:
              "❌ Không thể cấu hình Mute Role.",

            flags:
              MessageFlags.Ephemeral
          });
        } else {
          await interaction.reply({
            content:
              "❌ Không thể cấu hình Mute Role.",

            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};