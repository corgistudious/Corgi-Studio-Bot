const {
  ChannelSelectMenuBuilder,
  ChannelType,
  ActionRowBuilder,
  MessageFlags
} = require("discord.js");

const {
  canManageLevelSettings
} = require("../../utils/setupPermissions");

module.exports = {
  customId: "xp_level_channel",

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
            "🔒 Bạn không có quyền cấu hình **Kênh Level Up**.\n\n" +
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
      // CHANNEL SELECT MENU
      // =====================================
      const channelSelect =
        new ChannelSelectMenuBuilder()
          .setCustomId(
            "xp_level_channel_select"
          )
          .setPlaceholder(
            "📢 Chọn kênh thông báo Level Up"
          )
          .setChannelTypes(
            ChannelType.GuildText
          )
          .setMinValues(1)
          .setMaxValues(1);

      const row =
        new ActionRowBuilder()
          .addComponents(
            channelSelect
          );

      // =====================================
      // SEND
      // =====================================
      await interaction.reply({
        content:
          "📢 **Kênh thông báo Level Up**\n\n" +
          "Chọn kênh mà Corgi Studio sẽ gửi Level Card khi thành viên lên cấp:",
        components: [
          row
        ],
        flags:
          MessageFlags.Ephemeral
      });

      console.log(
        `📢 ${interaction.user.tag} mở Level Up Channel Settings ` +
        `tại ${interaction.guild.name}`
      );
    } catch (error) {
      console.error(
        "❌ XP Level Channel Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể mở cấu hình Kênh Level Up.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};