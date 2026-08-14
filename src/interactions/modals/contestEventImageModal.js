const {
  EmbedBuilder,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

function getContestId(customId) {
  return customId.split(":")[1];
}

function isValidHttpUrl(value) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

module.exports = {
  customId:
    "contest_event_image_modal",

  async execute(interaction) {
    try {
      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      const contestId =
        getContestId(
          interaction.customId
        );

      const rawUrl =
        interaction.fields
          .getTextInputValue(
            "contest_event_image_url"
          )
          .trim();

      const contest =
        await Contest.findOne({
          _id:
            contestId,

          guildId:
            interaction.guildId
        });

      if (!contest) {
        return interaction.editReply({
          content:
            "❌ Không tìm thấy Contest."
        });
      }

      // Để trống = xóa ảnh
      if (!rawUrl) {
        contest.eventImageUrl =
          null;

        await contest.save();

        return interaction.editReply({
          content:
            "✅ Đã xóa ảnh sự kiện của Contest."
        });
      }

      if (
        !isValidHttpUrl(
          rawUrl
        )
      ) {
        return interaction.editReply({
          content:
            "❌ URL ảnh không hợp lệ.\nHãy sử dụng URL bắt đầu bằng `http://` hoặc `https://`."
        });
      }

      contest.eventImageUrl =
        rawUrl;

      await contest.save();

      const embed =
        new EmbedBuilder()
          .setColor(
            0x57f287
          )
          .setTitle(
            "✅ Đã lưu ảnh sự kiện"
          )
          .setDescription(
            `Ảnh đã được áp dụng cho **${contest.name}**.\n\n` +
            "Khuyến nghị ảnh nguồn: **1920×1080 (16:9)**."
          )
          .setImage(
            rawUrl
          )
          .setFooter({
            text:
              "Corgi Studio • Contest Event Image"
          })
          .setTimestamp();

      await interaction.editReply({
        embeds: [
          embed
        ]
      });
    } catch (error) {
      console.error(
        "❌ Contest Event Image Modal Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể lưu ảnh sự kiện.",
          embeds: []
        });
      } catch {}
    }
  }
};