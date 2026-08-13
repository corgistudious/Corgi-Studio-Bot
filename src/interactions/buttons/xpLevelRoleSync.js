const {
  MessageFlags
} = require("discord.js");

const Level =
  require("../../models/Level");

const {
  getGuildSettings
} = require("../../services/guildSettingsService");

const {
  syncLevelRole
} = require("../../services/levelRoleService");

const {
  canManageLevelSettings
} = require("../../utils/setupPermissions");

module.exports = {
  customId: "xp_level_role_sync",

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
            "🔒 Bạn không có quyền đồng bộ **Level Roles**.",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // DEFER
      // Đồng bộ có thể mất vài giây
      // =====================================
      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      // =====================================
      // LOAD SETTINGS
      // =====================================
      const settings =
        await getGuildSettings(
          interaction.guildId
        );

      const levelRoles =
        settings.leveling?.levelRoles || [];

      // =====================================
      // KIỂM TRA LEVEL ROLES
      // =====================================
      if (
        !Array.isArray(levelRoles) ||
        levelRoles.length === 0
      ) {
        await interaction.editReply({
          content:
            "⚪ Server chưa cấu hình **Level Roles**."
        });

        return;
      }

      // =====================================
      // LOAD LEVEL PROFILES
      // =====================================
      const profiles =
        await Level.find({
          guildId:
            interaction.guildId
        });

      if (
        profiles.length === 0
      ) {
        await interaction.editReply({
          content:
            "⚪ Server chưa có dữ liệu XP/Level để đồng bộ."
        });

        return;
      }

      // =====================================
      // COUNTERS
      // =====================================
      let processed = 0;
      let changed = 0;
      let unchanged = 0;
      let notInServer = 0;
      let failed = 0;

      // =====================================
      // SYNC MEMBERS
      // =====================================
      for (
        const profile
        of profiles
      ) {
        try {
          let member = null;

          try {
            member =
              await interaction.guild.members.fetch(
                profile.userId
              );
          } catch {
            member = null;
          }

          // User không còn trong server
          if (!member) {
            notInServer += 1;

            continue;
          }

          // Bỏ qua bot
          if (
            member.user.bot
          ) {
            unchanged += 1;

            continue;
          }

          processed += 1;

          const result =
            await syncLevelRole(
              member,
              Number(
                profile.level
              ),
              settings
            );

          if (
            result?.changed
          ) {
            changed += 1;
          } else {
            unchanged += 1;
          }
        } catch (memberError) {
          failed += 1;

          console.error(
            `❌ Level Role Sync Member Error (${profile.userId}):`,
            memberError
          );
        }
      }

      // =====================================
      // RESULT
      // =====================================
      await interaction.editReply({
        content:
          "🔄 **Đồng bộ Level Roles hoàn tất!**\n\n" +

          `👥 Đã kiểm tra: **${processed}**\n` +
          `🎖️ Đã thay đổi Role: **${changed}**\n` +
          `✅ Đã đúng Role: **${unchanged}**\n` +
          `🚪 Không còn trong server: **${notInServer}**\n` +
          `❌ Lỗi: **${failed}**`
      });

      console.log(
        `🔄 Level Role Sync hoàn tất tại ${interaction.guild.name} | ` +
        `Processed: ${processed} | ` +
        `Changed: ${changed} | ` +
        `Unchanged: ${unchanged} | ` +
        `Left: ${notInServer} | ` +
        `Failed: ${failed}`
      );
    } catch (error) {
      console.error(
        "❌ XP Level Role Sync Error:",
        error
      );

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          await interaction.editReply({
            content:
              "❌ Không thể hoàn thành đồng bộ Level Roles."
          });
        } else {
          await interaction.reply({
            content:
              "❌ Không thể hoàn thành đồng bộ Level Roles.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};