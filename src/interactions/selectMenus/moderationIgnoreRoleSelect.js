const {
  MessageFlags
} = require("discord.js");

const {
  updateGuildSettings
} = require("../../services/guildSettingsService");

const {
  canManageGuild
} = require("../../utils/setupPermissions");

module.exports = {
  customId:
    "moderation_ignore_role_select",

  async execute(interaction) {
    try {
      if (
        !canManageGuild(
          interaction
        )
      ) {
        return interaction.reply({
          content:
            "🔒 Bạn không có quyền cấu hình Anti Spam.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      const roleId =
        interaction.values[0];

      const role =
        interaction.guild.roles.cache.get(
          roleId
        );

      if (!role) {
        return interaction.update({
          content:
            "❌ Không tìm thấy Role này.",
          components: []
        });
      }

      if (
        role.id ===
        interaction.guild.id
      ) {
        return interaction.update({
          content:
            "❌ Không thể dùng **@everyone** làm Role miễn Anti Spam.",
          components: []
        });
      }

      await updateGuildSettings(
        interaction.guildId,
        {
          $set: {
            "moderation.antiSpam.ignoredRoleId":
              role.id
          }
        }
      );

      await interaction.update({
        content:
          `✅ Đã đặt ${role} làm Role **miễn Anti Spam**.`,
        components: []
      });

      console.log(
        `🎭 Anti Spam Ignore Role | ${interaction.guild.name} → ${role.name}`
      );
    } catch (error) {
      console.error(
        "❌ Moderation Ignore Role Select Error:",
        error
      );
    }
  }
};