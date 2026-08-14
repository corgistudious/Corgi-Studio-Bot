const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

const ContestVote =
  require("../../models/ContestVote");

module.exports = {
  customId:
    "contest_fraud_invalidate",

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

      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      // customId:
      // contest_fraud_invalidate:contestId:userId

      const parts =
        interaction.customId.split(":");

      const contestId =
        parts[1];

      const userId =
        parts[2];

      if (
        !contestId ||
        !userId
      ) {
        return interaction.editReply({
          content:
            "❌ Dữ liệu Review không hợp lệ."
        });
      }

      const guildId =
        interaction.guildId;

      // =====================================
      // FIND CONTEST
      // =====================================

      const contest =
        await Contest.findOne({
          _id:
            contestId,

          guildId
        });

      if (!contest) {
        return interaction.editReply({
          content:
            "❌ Không tìm thấy Contest."
        });
      }

      // =====================================
      // COUNT CURRENT VOTES
      // =====================================

      const voteCount =
        await ContestVote.countDocuments({
          guildId,

          contestId:
            contest._id,

          userId
        });

      if (voteCount === 0) {
        return interaction.editReply({
          content:
            `⚠️ <@${userId}> hiện không còn Vote nào trong Event này.`,

          embeds: [],
          components: []
        });
      }

      // =====================================
      // CONFIRMATION
      // =====================================

      const embed =
        new EmbedBuilder()
          .setColor(
            0xed4245
          )
          .setTitle(
            "⚠️ Xác nhận vô hiệu hóa Vote"
          )
          .setDescription(
            `Bạn đang chuẩn bị vô hiệu hóa Vote của <@${userId}>.\n\n` +
            `Hành động này sẽ loại **${voteCount} Vote** hiện tại của User khỏi Event **${contest.name}**.`
          )
          .addFields(
            {
              name:
                "🚫 Vote sẽ bị loại",

              value:
                String(
                  voteCount
                ),

              inline:
                true
            },

            {
              name:
                "👤 User",

              value:
                `<@${userId}>`,

              inline:
                true
            },

            {
              name:
                "🛡️ Lưu Audit",

              value:
                "✅ Có",

              inline:
                true
            },

            {
              name:
                "⚠️ Lưu ý",

              value:
                "User **không bị Ban**.\n" +
                "Audit Log **không bị xóa**.\n" +
                "Chỉ Vote trong Contest này bị xử lý.",

              inline:
                false
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Anti-Fraud Confirmation"
          })
          .setTimestamp();

      const row =
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(
                `contest_fraud_invalidate_confirm:${contest._id}:${userId}`
              )
              .setLabel(
                "Xác nhận vô hiệu hóa"
              )
              .setEmoji(
                "🚫"
              )
              .setStyle(
                ButtonStyle.Danger
              ),

            new ButtonBuilder()
              .setCustomId(
                "contest_fraud_cancel"
              )
              .setLabel(
                "Hủy"
              )
              .setEmoji(
                "✖️"
              )
              .setStyle(
                ButtonStyle.Secondary
              )
          );

      return interaction.editReply({
        embeds: [
          embed
        ],

        components: [
          row
        ]
      });
    } catch (error) {
      console.error(
        "❌ Contest Fraud Invalidate Error:",
        error
      );

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          return await interaction.editReply({
            content:
              "❌ Không thể mở xác nhận vô hiệu hóa Vote.",

            embeds: [],
            components: []
          });
        }

        return await interaction.reply({
          content:
            "❌ Không thể mở xác nhận vô hiệu hóa Vote.",

          flags:
            MessageFlags.Ephemeral
        });
      } catch {}
    }
  }
};