const {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  MessageFlags
} = require("discord.js");

const {
  getGuildSettings
} = require("../../services/guildSettingsService");

const {
  canManageLevelSettings
} = require("../../utils/setupPermissions");

module.exports = {
  customId: "xp_level_role_remove",

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
            "🔒 Bạn không có quyền xóa **Level Roles**.\n\n" +
            "Chức năng này yêu cầu:\n" +
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

      const levelRoles =
        settings.leveling?.levelRoles || [];

      // =====================================
      // KHÔNG CÓ LEVEL ROLE
      // =====================================
      if (
        !Array.isArray(levelRoles) ||
        levelRoles.length === 0
      ) {
        await interaction.reply({
          content:
            "⚪ Server chưa có **Level Role** nào để xóa.",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // SORT LEVEL ROLES
      // =====================================
      const sortedRoles =
        [...levelRoles]
          .sort(
            (a, b) =>
              Number(a.level) -
              Number(b.level)
          )
          .slice(0, 25);

      // =====================================
      // BUILD OPTIONS
      // =====================================
      const options =
        sortedRoles.map(
          (item) => {
            const role =
              interaction.guild.roles.cache.get(
                item.roleId
              );

            return {
              label:
                `Level ${item.level}`,

              description:
                role
                  ? `Xóa ${role.name}`
                  : "Role không còn tồn tại",

              value:
                String(item.level),

              emoji:
                "🗑️"
            };
          }
        );

      // =====================================
      // SELECT MENU
      // =====================================
      const select =
        new StringSelectMenuBuilder()
          .setCustomId(
            "xp_level_role_remove_select"
          )
          .setPlaceholder(
            "🗑️ Chọn mốc Level cần xóa"
          )
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            options
          );

      const row =
        new ActionRowBuilder()
          .addComponents(
            select
          );

      // =====================================
      // SEND
      // =====================================
      await interaction.reply({
        content:
          "🗑️ **Xóa Level Role**\n\n" +
          "Chọn mốc Level bạn muốn xóa khỏi server:",
        components: [
          row
        ],
        flags:
          MessageFlags.Ephemeral
      });

      console.log(
        `🗑️ ${interaction.user.tag} mở Remove Level Role ` +
        `tại ${interaction.guild.name}`
      );
    } catch (error) {
      console.error(
        "❌ XP Level Role Remove Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể mở danh sách Level Roles.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};