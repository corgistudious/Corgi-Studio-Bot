const {
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  MessageFlags
} = require("discord.js");

const {
  canManageLevelSettings
} = require("../../utils/setupPermissions");

module.exports = {
  customId: "xp_level_role_add_modal",

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
      // LẤY LEVEL TỪ MODAL
      // =====================================
      const levelRaw =
        interaction.fields
          .getTextInputValue(
            "level"
          )
          .trim();

      const level =
        Number(levelRaw);

      // =====================================
      // VALIDATE LEVEL
      // =====================================
      if (
        !Number.isInteger(level) ||
        level < 1 ||
        level > 10000
      ) {
        await interaction.reply({
          content:
            "❌ Level phải là số nguyên từ **1 - 10000**.",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // PENDING STORAGE
      // =====================================
      if (
        !interaction.client
          .levelRolePending
      ) {
        interaction.client
          .levelRolePending =
          new Map();
      }

      const key =
        `${interaction.guildId}:${interaction.user.id}`;

      interaction.client
        .levelRolePending
        .set(
          key,
          {
            level,
            createdAt:
              Date.now()
          }
        );

      // =====================================
      // TỰ XÓA SAU 5 PHÚT
      // =====================================
      setTimeout(
        () => {
          const pending =
            interaction.client
              .levelRolePending
              ?.get(key);

          if (!pending) {
            return;
          }

          const expired =
            Date.now() -
              pending.createdAt >=
            5 * 60 * 1000;

          if (expired) {
            interaction.client
              .levelRolePending
              .delete(key);

            console.log(
              `⌛ Level Role Pending hết hạn: ${key}`
            );
          }
        },
        5 * 60 * 1000
      );

      // =====================================
      // ROLE SELECT MENU
      // =====================================
      const roleSelect =
        new RoleSelectMenuBuilder()
          .setCustomId(
            "xp_level_role_select"
          )
          .setPlaceholder(
            `🎖️ Chọn Role cho Level ${level}`
          )
          .setMinValues(1)
          .setMaxValues(1);

      const row =
        new ActionRowBuilder()
          .addComponents(
            roleSelect
          );

      // =====================================
      // SEND SELECT
      // =====================================
      await interaction.reply({
        content:
          `⭐ Mốc Level: **${level}**\n\n` +
          "Bây giờ hãy chọn Role thành viên sẽ nhận:",
        components: [
          row
        ],
        flags:
          MessageFlags.Ephemeral
      });

      console.log(
        `🎖️ ${interaction.user.tag} chọn mốc ` +
        `Level ${level} tại ${interaction.guild.name}`
      );
    } catch (error) {
      console.error(
        "❌ XP Level Role Add Modal Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể xử lý mốc Level.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};