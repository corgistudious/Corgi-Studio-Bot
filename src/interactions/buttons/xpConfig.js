const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
  PermissionFlagsBits
} = require("discord.js");

const {
  getGuildSettings
} = require("../../services/guildSettingsService");

module.exports = {
  customId: "xp_config",

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
            "để thay đổi cấu hình XP & Level.",

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

      const leveling =
        settings.leveling || {};

      // =====================================
      // MODAL
      // =====================================

      const modal =
        new ModalBuilder()
          .setCustomId(
            "xp_config_modal"
          )
          .setTitle(
            "Cấu hình XP & Level"
          );

      // =====================================
      // XP MIN
      // =====================================

      const xpMinInput =
        new TextInputBuilder()
          .setCustomId(
            "xp_min"
          )
          .setLabel(
            "XP tối thiểu mỗi lần"
          )
          .setStyle(
            TextInputStyle.Short
          )
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(4)
          .setValue(
            String(
              leveling.xpMin ?? 15
            )
          );

      // =====================================
      // XP MAX
      // =====================================

      const xpMaxInput =
        new TextInputBuilder()
          .setCustomId(
            "xp_max"
          )
          .setLabel(
            "XP tối đa mỗi lần"
          )
          .setStyle(
            TextInputStyle.Short
          )
          .setRequired(true)
          .setMaxLength(4)
          .setValue(
            String(
              leveling.xpMax ?? 25
            )
          );

      // =====================================
      // COOLDOWN
      // =====================================

      const cooldownInput =
        new TextInputBuilder()
          .setCustomId(
            "xp_cooldown"
          )
          .setLabel(
            "Cooldown XP (giây)"
          )
          .setStyle(
            TextInputStyle.Short
          )
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(5)
          .setValue(
            String(
              leveling.cooldown ?? 60
            )
          );

      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(
            xpMinInput
          ),

        new ActionRowBuilder()
          .addComponents(
            xpMaxInput
          ),

        new ActionRowBuilder()
          .addComponents(
            cooldownInput
          )
      );

      await interaction.showModal(
        modal
      );

    } catch (error) {
      console.error(
        "❌ XP Config Error:",
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
          "❌ Không thể mở cấu hình XP.",

        flags:
          MessageFlags.Ephemeral
      });
    }
  }
};