const {
  MessageFlags
} = require("discord.js");

const {
  updateGuildSettings
} = require("../../services/guildSettingsService");

module.exports = {
  customId: "autorole_role_select",

  async execute(interaction) {
    const roleId = interaction.values[0];

    const role =
      interaction.guild.roles.cache.get(roleId);

    if (!role) {
      await interaction.reply({
        content:
          "❌ Không tìm thấy Role đã chọn.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    if (role.id === interaction.guild.id) {
      await interaction.reply({
        content:
          "❌ Không thể sử dụng @everyone làm Auto Role.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    if (role.managed) {
      await interaction.reply({
        content:
          "❌ Role này được Discord hoặc bot khác quản lý.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    const botMember =
      interaction.guild.members.me;

    if (
      !botMember ||
      role.position >=
        botMember.roles.highest.position
    ) {
      await interaction.reply({
        content:
          "❌ Corgi-Bot không thể cấp Role này.\n\n" +
          "Hãy vào **Server Settings → Roles** và kéo Role của Corgi-Bot lên trên Role bạn muốn cấp.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    await updateGuildSettings(
      interaction.guildId,
      {
        $set: {
          "autoRole.roleId": roleId
        }
      }
    );

    await interaction.update({
      content:
        `✅ Đã đặt ${role} làm **Auto Role**.`,
      components: []
    });

    console.log(
      `🎭 Auto Role của ${interaction.guild.name}: ${role.name}`
    );
  }
};