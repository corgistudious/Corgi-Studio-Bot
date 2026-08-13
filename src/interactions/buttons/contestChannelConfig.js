const {
  EmbedBuilder,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

module.exports = {
  customId: "contest_channel_config",

  async execute(interaction) {
    try {
      await interaction.deferReply({
        flags: MessageFlags.Ephemeral
      });

      // =====================================
      // FIND LATEST CONTEST
      // =====================================

      const contest =
        await Contest.findOne({
          guildId: interaction.guildId
        }).sort({
          createdAt: -1
        });

      if (!contest) {
        return interaction.editReply({
          content:
            "⚠️ Server chưa có Contest nào.\nHãy tạo Event trước."
        });
      }

      // =====================================
      // EMBED
      // =====================================

      const embed =
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(
            "⚙️ Cấu hình Channel Contest"
          )
          .setDescription(
            `Đang cấu hình Event **${contest.name}**.\n\n` +
            "Chọn riêng từng Channel bên dưới."
          )
          .addFields(
            {
              name: "📢 Event Channel",
              value:
                contest.submissionChannelId
                  ? `<#${contest.submissionChannelId}>`
                  : "❌ Chưa thiết lập",
              inline: false
            },
            {
              name: "🖼️ Gallery Channel",
              value:
                contest.galleryChannelId
                  ? `<#${contest.galleryChannelId}>`
                  : "❌ Chưa thiết lập",
              inline: false
            },
            {
              name: "🏆 Result Channel",
              value:
                contest.resultChannelId
                  ? `<#${contest.resultChannelId}>`
                  : "❌ Chưa thiết lập",
              inline: false
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Contest Configuration"
          })
          .setTimestamp();

      // =====================================
      // EVENT CHANNEL
      // =====================================

      const eventSelect =
        new ChannelSelectMenuBuilder()
          .setCustomId(
            `contest_channel_event:${contest._id}`
          )
          .setPlaceholder(
            "📢 Chọn Event Channel"
          )
          .setChannelTypes(
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement
          )
          .setMinValues(1)
          .setMaxValues(1);

      // =====================================
      // GALLERY CHANNEL
      // =====================================

      const gallerySelect =
        new ChannelSelectMenuBuilder()
          .setCustomId(
            `contest_channel_gallery:${contest._id}`
          )
          .setPlaceholder(
            "🖼️ Chọn Gallery Channel"
          )
          .setChannelTypes(
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement
          )
          .setMinValues(1)
          .setMaxValues(1);

      // =====================================
      // RESULT CHANNEL
      // =====================================

      const resultSelect =
        new ChannelSelectMenuBuilder()
          .setCustomId(
            `contest_channel_result:${contest._id}`
          )
          .setPlaceholder(
            "🏆 Chọn Result Channel"
          )
          .setChannelTypes(
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement
          )
          .setMinValues(1)
          .setMaxValues(1);

      const row1 =
        new ActionRowBuilder()
          .addComponents(
            eventSelect
          );

      const row2 =
        new ActionRowBuilder()
          .addComponents(
            gallerySelect
          );

      const row3 =
        new ActionRowBuilder()
          .addComponents(
            resultSelect
          );

      await interaction.editReply({
        embeds: [embed],
        components: [
          row1,
          row2,
          row3
        ]
      });
    } catch (error) {
      console.error(
        "❌ Contest Channel Config Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể mở cấu hình Channel.",
          embeds: [],
          components: []
        });
      } catch {}
    }
  }
};