const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

// =====================================
// GET CONTEST ID
// =====================================

function getContestId(customId) {
  return customId.split(":")[1];
}

// =====================================
// DISCORD TIME
// =====================================

function discordTime(date) {
  if (!date) {
    return "Chưa thiết lập";
  }

  return `<t:${Math.floor(
    new Date(date).getTime() / 1000
  )}:f>`;
}

// =====================================
// MODULE
// =====================================

module.exports = {
  customId: "contest_announce",

  async execute(interaction) {
    try {
      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      // =====================================
      // CONTEST ID
      // =====================================

      const contestId =
        getContestId(
          interaction.customId
        );

      // =====================================
      // FIND CONTEST
      // =====================================

      const contest =
        await Contest.findOne({
          _id: contestId,
          guildId:
            interaction.guildId
        });

      if (!contest) {
        return interaction.editReply({
          content:
            "❌ Không tìm thấy Contest này."
        });
      }

      // =====================================
      // EVENT CHANNEL
      // =====================================

      const eventChannelId =
        contest.submissionChannelId;

      if (!eventChannelId) {
        return interaction.editReply({
          content:
            "❌ Contest chưa cấu hình **📢 Event Channel**.\n" +
            "Vào **⚙️ Cấu hình Channel** và chọn Event Channel trước."
        });
      }

      const eventChannel =
        await interaction.guild.channels
          .fetch(
            eventChannelId
          )
          .catch(
            () => null
          );

      if (
        !eventChannel ||
        !eventChannel.isTextBased()
      ) {
        return interaction.editReply({
          content:
            "❌ Event Channel không hợp lệ hoặc bot không thể truy cập Channel."
        });
      }

      // =====================================
      // ANNOUNCEMENT EMBED
      // =====================================

      const embed =
        new EmbedBuilder()
          .setColor(
            0xf5a623
          )
          .setTitle(
            `🏆 ${contest.name}`
          )
          .setDescription(
            contest.description ||
              "Một Event Contest mới đã bắt đầu!"
          )
          .addFields(
            {
              name:
                "📥 Nhận bài dự thi",

              value:
                `${discordTime(
                  contest.submissionStartAt
                )}\n→ ${discordTime(
                  contest.submissionEndAt
                )}`,

              inline:
                false
            },

            {
              name:
                "🗳️ Bình chọn",

              value:
                `${discordTime(
                  contest.votingStartAt
                )}\n→ ${discordTime(
                  contest.votingEndAt
                )}`,

              inline:
                false
            },

            {
              name:
                "🏅 Số giải",

              value:
                String(
                  contest.winnerCount ||
                  3
                ),

              inline:
                true
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Event Contest"
          })
          .setTimestamp();

      // =====================================
      // BANNER
      // =====================================

      if (contest.bannerUrl) {
        embed.setImage(
          contest.bannerUrl
        );
      }

      // =====================================
      // SUBMIT BUTTON
      // =====================================

      const row =
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(
                `contest_submit:${contest._id}`
              )
              .setLabel(
                "Gửi bài dự thi"
              )
              .setEmoji(
                "📤"
              )
              .setStyle(
                ButtonStyle.Success
              )
          );

      // =====================================
      // SEND TO EVENT CHANNEL
      // =====================================

      const message =
        await eventChannel.send({
          embeds: [
            embed
          ],

          components: [
            row
          ]
        });

      // =====================================
      // SAVE ANNOUNCEMENT MESSAGE
      // =====================================

      contest.announcementMessageId =
        message.id;

      // Không ghi đè submissionChannelId.
      // Channel đã được Admin cấu hình trước.

      await contest.save();

      // =====================================
      // RESPONSE
      // =====================================

      await interaction.editReply({
        content:
          `✅ Đã đăng thông báo **${contest.name}** tại <#${eventChannel.id}>.`
      });
    } catch (error) {
      console.error(
        "❌ Contest Announce Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể đăng thông báo Contest.",
          embeds: [],
          components: []
        });
      } catch {}
    }
  }
};