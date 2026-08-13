const {
  MessageFlags,
  PermissionFlagsBits
} = require("discord.js");

const {
  updateGuildSettings
} = require("../../services/guildSettingsService");

module.exports = {
  customId: "xp_config_modal",

  async execute(interaction) {
    try {
      const canManageConfig =
        interaction.guild.ownerId === interaction.user.id ||
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
            "Bạn cần là **Server Owner**, **Administrator**, " +
            "**Manage Server** hoặc **Moderator** để thay đổi cấu hình XP.",

          flags: MessageFlags.Ephemeral
        });

        return;
      }

      const xpMinRaw =
        interaction.fields
          .getTextInputValue("xp_min")
          .trim();

      const xpMaxRaw =
        interaction.fields
          .getTextInputValue("xp_max")
          .trim();

      const cooldownRaw =
        interaction.fields
          .getTextInputValue("xp_cooldown")
          .trim();

      const xpMin = Number(xpMinRaw);
      const xpMax = Number(xpMaxRaw);
      const cooldown = Number(cooldownRaw);

      if (
        !Number.isInteger(xpMin) ||
        !Number.isInteger(xpMax) ||
        !Number.isInteger(cooldown)
      ) {
        await interaction.reply({
          content:
            "❌ XP Min, XP Max và Cooldown phải là **số nguyên**.",

          flags: MessageFlags.Ephemeral
        });

        return;
      }

      if (xpMin < 1) {
        await interaction.reply({
          content:
            "❌ XP Min phải từ **1** trở lên.",

          flags: MessageFlags.Ephemeral
        });

        return;
      }

      if (xpMax < xpMin) {
        await interaction.reply({
          content:
            "❌ XP Max phải lớn hơn hoặc bằng XP Min.",

          flags: MessageFlags.Ephemeral
        });

        return;
      }

      if (xpMax > 1000) {
        await interaction.reply({
          content:
            "❌ XP Max không được vượt quá **1000**.",

          flags: MessageFlags.Ephemeral
        });

        return;
      }

      if (
        cooldown < 5 ||
        cooldown > 86400
      ) {
        await interaction.reply({
          content:
            "❌ Cooldown phải nằm trong khoảng **5 - 86400 giây**.",

          flags: MessageFlags.Ephemeral
        });

        return;
      }

      await updateGuildSettings(
        interaction.guildId,
        {
          $set: {
            "leveling.xpMin": xpMin,
            "leveling.xpMax": xpMax,
            "leveling.cooldown": cooldown
          }
        }
      );

      await interaction.reply({
        content:
          "✅ **Đã cập nhật cấu hình XP & Level**\n\n" +
          `⚡ XP Min: **${xpMin}**\n` +
          `⚡ XP Max: **${xpMax}**\n` +
          `⏱️ Cooldown: **${cooldown} giây**`,

        flags: MessageFlags.Ephemeral
      });

      console.log(
        `⚙️ ${interaction.user.tag} cập nhật XP tại ` +
        `${interaction.guild.name}: ` +
        `${xpMin}-${xpMax} XP / ${cooldown}s`
      );

    } catch (error) {
      console.error(
        "❌ XP Config Modal Error:",
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
          "❌ Không thể lưu cấu hình XP.",

        flags: MessageFlags.Ephemeral
      });
    }
  }
};