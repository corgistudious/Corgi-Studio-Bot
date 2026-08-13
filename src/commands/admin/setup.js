const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

const {
  getGuildSettings
} = require(
  "../../services/guildSettingsService"
);

const {
  buildMainDashboard
} = require(
  "../../services/dashboardRenderer"
);

module.exports = {
  data:
    new SlashCommandBuilder()
      .setName("setup")
      .setDescription(
        "Mở bảng điều khiển Corgi Studio Bot."
      )
      .setDefaultMemberPermissions(
        PermissionFlagsBits.Administrator
      ),

  async execute(interaction) {
    try {
      // =====================================
      // GUILD ONLY
      // =====================================
      if (
        !interaction.inGuild()
      ) {
        await interaction.reply({
          content:
            "❌ Lệnh này chỉ có thể sử dụng trong server.",

          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // ACKNOWLEDGE NGAY
      //
      // Không chạy MongoDB / renderer
      // trước deferReply.
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

      // =====================================
      // BUILD DASHBOARD
      // =====================================
      const dashboard =
        buildMainDashboard(
          settings
        );

      // =====================================
      // SEND DASHBOARD
      // =====================================
      await interaction.editReply(
        dashboard
      );

      console.log(
        `⚙️ ${interaction.user.tag} mở /setup tại ${interaction.guild.name}`
      );
    } catch (error) {
      console.error(
        "❌ Setup Command Error:",
        error
      );

      // =====================================
      // UNKNOWN INTERACTION
      //
      // Interaction đã hết hạn.
      // Tuyệt đối không cố reply tiếp.
      // =====================================
      if (
        error?.code === 10062
      ) {
        console.warn(
          "⚠️ /setup interaction đã hết hạn trước khi Discord nhận phản hồi."
        );

        return;
      }

      // =====================================
      // ALREADY ACKNOWLEDGED / UNKNOWN WEBHOOK
      // =====================================
      if (
        error?.code === 40060 ||
        error?.code === 10015
      ) {
        console.warn(
          `⚠️ Không thể phản hồi /setup thêm lần nữa. Discord code: ${error.code}`
        );

        return;
      }

      // =====================================
      // NORMAL ERROR RESPONSE
      // =====================================
      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          await interaction.editReply({
            content:
              "❌ Không thể mở bảng điều khiển `/setup` lúc này.",

            embeds: [],

            components: []
          });
        } else {
          await interaction.reply({
            content:
              "❌ Không thể mở bảng điều khiển `/setup` lúc này.",

            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch (
        replyError
      ) {
        console.error(
          "❌ Setup Error Reply:",
          replyError
        );
      }
    }
  }
};