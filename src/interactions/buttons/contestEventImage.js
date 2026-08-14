const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

module.exports = {
  customId: "contest_event_image",

  async execute(interaction) {
    try {
      if (!interaction.inGuild()) {
        return interaction.reply({
          content:
            "❌ Chức năng này chỉ sử dụng trong Server.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      const contest =
        await Contest.findOne({
          guildId:
            interaction.guildId,

          status: {
            $in: [
              "DRAFT",
              "SUBMISSION",
              "VOTING",
              "ENDED"
            ]
          }
        }).sort({
          createdAt: -1
        });

      if (!contest) {
        return interaction.reply({
          content:
            "⚠️ Server hiện không có Contest để cấu hình ảnh.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      const modal =
        new ModalBuilder()
          .setCustomId(
            `contest_event_image_modal:${contest._id}`
          )
          .setTitle(
            "Ảnh sự kiện Contest"
          );

      const imageInput =
        new TextInputBuilder()
          .setCustomId(
            "contest_event_image_url"
          )
          .setLabel(
            "URL ảnh sự kiện 1920x1080"
          )
          .setStyle(
            TextInputStyle.Short
          )
          .setPlaceholder(
            "https://example.com/event-image.png"
          )
          .setRequired(false)
          .setMaxLength(1000);

      if (contest.eventImageUrl) {
        imageInput.setValue(
          contest.eventImageUrl
        );
      }

      const row =
        new ActionRowBuilder()
          .addComponents(
            imageInput
          );

      modal.addComponents(
        row
      );

      await interaction.showModal(
        modal
      );
    } catch (error) {
      console.error(
        "❌ Contest Event Image Button Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể mở cấu hình ảnh sự kiện.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};