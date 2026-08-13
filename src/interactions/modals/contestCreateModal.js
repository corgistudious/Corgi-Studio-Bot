const {
  EmbedBuilder,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

function parseDate(value) {
  const normalized =
    value.trim().replace(" ", "T");

  const date =
    new Date(normalized);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

module.exports = {
  customId: "contest_create_modal",

  async execute(interaction) {
    try {
      if (!interaction.inGuild()) {
        return interaction.reply({
          content:
            "❌ Chỉ có thể tạo sự kiện trong server.",
          flags:
            MessageFlags.Ephemeral
        });
      }

      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      const name =
        interaction.fields
          .getTextInputValue(
            "contest_name"
          )
          .trim();

      const description =
        interaction.fields
          .getTextInputValue(
            "contest_description"
          )
          .trim();

      const submissionEndRaw =
        interaction.fields
          .getTextInputValue(
            "contest_submission_end"
          )
          .trim();

      const votingEndRaw =
        interaction.fields
          .getTextInputValue(
            "contest_voting_end"
          )
          .trim();

      const winnerCountRaw =
        interaction.fields
          .getTextInputValue(
            "contest_winner_count"
          )
          .trim();

      const submissionEndAt =
        parseDate(
          submissionEndRaw
        );

      const votingEndAt =
        parseDate(
          votingEndRaw
        );

      const winnerCount =
        Number(
          winnerCountRaw
        );

      if (!submissionEndAt) {
        return interaction.editReply({
          content:
            "❌ Hạn gửi bài không hợp lệ.\nVí dụ: `2026-08-20 23:59`"
        });
      }

      if (!votingEndAt) {
        return interaction.editReply({
          content:
            "❌ Hạn bình chọn không hợp lệ.\nVí dụ: `2026-08-25 23:59`"
        });
      }

      if (
        votingEndAt <=
        submissionEndAt
      ) {
        return interaction.editReply({
          content:
            "❌ Hạn bình chọn phải sau hạn gửi bài."
        });
      }

      if (
        !Number.isInteger(
          winnerCount
        ) ||
        winnerCount < 1 ||
        winnerCount > 20
      ) {
        return interaction.editReply({
          content:
            "❌ Số người chiến thắng phải từ `1` đến `20`."
        });
      }

      const existingContest =
        await Contest.findOne({
          guildId:
            interaction.guildId,

          status: {
            $in: [
              "DRAFT",
              "SUBMISSION",
              "VOTING"
            ]
          }
        });

      if (existingContest) {
        return interaction.editReply({
          content:
            "⚠️ Server hiện đã có một Event Contest đang hoạt động.\nHãy kết thúc hoặc quản lý sự kiện đó trước khi tạo mới."
        });
      }

      const now =
        new Date();

      const contest =
        await Contest.create({
          guildId:
            interaction.guildId,

          name,

          description,

          status:
            "SUBMISSION",

          submissionStartAt:
            now,

          submissionEndAt,

          votingStartAt:
            submissionEndAt,

          votingEndAt,

          winnerCount,

          createdBy:
            interaction.user.id
        });

      const embed =
        new EmbedBuilder()
          .setColor(
            0x57f287
          )
          .setTitle(
            "✅ Đã tạo Event Contest"
          )
          .setDescription(
            `**${contest.name}** đã được tạo thành công.`
          )
          .addFields(
            {
              name:
                "📥 Nhận bài",
              value:
                `<t:${Math.floor(
                  contest.submissionStartAt.getTime() /
                    1000
                )}:f>\n→ <t:${Math.floor(
                  contest.submissionEndAt.getTime() /
                    1000
                )}:f>`,
              inline:
                false
            },
            {
              name:
                "🗳️ Bình chọn",
              value:
                `<t:${Math.floor(
                  contest.votingStartAt.getTime() /
                    1000
                )}:f>\n→ <t:${Math.floor(
                  contest.votingEndAt.getTime() /
                    1000
                )}:f>`,
              inline:
                false
            },
            {
              name:
                "🏆 Người chiến thắng",
              value:
                String(
                  contest.winnerCount
                ),
              inline:
                true
            },
            {
              name:
                "📊 Trạng thái",
              value:
                "🟢 Đang nhận bài",
              inline:
                true
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Event Contest"
          })
          .setTimestamp();

      await interaction.editReply({
        embeds: [embed]
      });
    } catch (error) {
      console.error(
        "❌ Contest Create Modal Error:",
        error
      );

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          await interaction.editReply({
            content:
              "❌ Không thể tạo Event Contest."
          });
        } else {
          await interaction.reply({
            content:
              "❌ Không thể tạo Event Contest.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};