const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("contest")
    .setDescription(
      "Quản lý hệ thống Event Contest của Corgi Studio"
    ),

  async execute(interaction) {
    try {
      // =====================================
      // GUILD ONLY
      // =====================================
      if (!interaction.guild) {
        return interaction.reply({
          content:
            "❌ Lệnh này chỉ có thể sử dụng trong Server.",
          ephemeral: true
        });
      }

      // =====================================
      // CONTEST DASHBOARD
      // =====================================
      const embed = new EmbedBuilder()
        .setColor(0xf5a623)
        .setTitle(
          "🏆 Corgi Studio — Event Contest"
        )
        .setDescription(
          "Quản lý hệ thống **Sự kiện & Cuộc thi** của Corgi Studio.\n\n" +
          "Tại đây bạn có thể tạo sự kiện, quản lý bài dự thi, " +
          "mở bình chọn và công bố kết quả."
        )
        .addFields(
          {
            name: "🎪 Sự kiện",
            value:
              "Chưa có sự kiện đang hoạt động.",
            inline: false
          },
          {
            name: "📊 Trạng thái",
            value:
              "⚪ Chưa thiết lập",
            inline: true
          },
          {
            name: "🗳️ Bình chọn",
            value:
              "⚪ Chưa mở",
            inline: true
          }
        )
        .setFooter({
          text:
            "Corgi Studio • Event Contest System"
        })
        .setTimestamp();

      // =====================================
      // BUTTONS
      // =====================================
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(
              "contest_create"
            )
            .setLabel(
              "Tạo sự kiện"
            )
            .setEmoji("➕")
            .setStyle(
              ButtonStyle.Success
            ),

          new ButtonBuilder()
            .setCustomId(
              "contest_manage"
            )
            .setLabel(
              "Quản lý"
            )
            .setEmoji("⚙️")
            .setStyle(
              ButtonStyle.Primary
            ),

          new ButtonBuilder()
            .setCustomId(
              "contest_submissions"
            )
            .setLabel(
              "Bài dự thi"
            )
            .setEmoji("📥")
            .setStyle(
              ButtonStyle.Secondary
            ),

          new ButtonBuilder()
            .setCustomId(
              "contest_results"
            )
            .setLabel(
              "Kết quả"
            )
            .setEmoji("🏆")
            .setStyle(
              ButtonStyle.Secondary
            )
        );

      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
    } catch (error) {
      console.error(
        "❌ Contest Command Error:",
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "❌ Không thể mở Event Contest Dashboard.",
          ephemeral: true
        });
      }
    }
  }
};