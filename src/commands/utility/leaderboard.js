const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const {
  getLeaderboard,
  getRequiredXp
} = require("../../services/levelService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription(
      "Xem bảng xếp hạng XP & Level của server."
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const profiles =
        await getLeaderboard(
          interaction.guildId,
          10
        );

      if (
        !profiles ||
        profiles.length === 0
      ) {
        await interaction.editReply({
          content:
            "📊 Server chưa có dữ liệu XP & Level."
        });

        return;
      }

      const ranking = [];

      let realPosition = 0;

      for (const profile of profiles) {
        let member = null;

        try {
          member =
            await interaction.guild.members.fetch(
              profile.userId
            );
        } catch {
          continue;
        }

        if (
          !member ||
          member.user.bot
        ) {
          continue;
        }

        realPosition += 1;

        const requiredXp =
          getRequiredXp(
            profile.level
          );

        let medal;

        if (realPosition === 1) {
          medal = "🥇";
        } else if (
          realPosition === 2
        ) {
          medal = "🥈";
        } else if (
          realPosition === 3
        ) {
          medal = "🥉";
        } else {
          medal =
            `**#${realPosition}**`;
        }

        ranking.push(
          `${medal} ${member}\n` +
          `⭐ Level **${profile.level}** • ` +
          `✨ **${profile.xp} / ${requiredXp} XP** • ` +
          `💬 **${profile.totalMessages ?? 0}** tin nhắn`
        );

        if (realPosition >= 10) {
          break;
        }
      }

      if (ranking.length === 0) {
        await interaction.editReply({
          content:
            "📊 Chưa có thành viên hợp lệ trong bảng xếp hạng."
        });

        return;
      }

      const embed =
        new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle(
            "🏆 Corgi Studio Leaderboard"
          )
          .setDescription(
            ranking.join("\n\n")
          )
          .setThumbnail(
            interaction.guild.iconURL({
              size: 256
            })
          )
          .setFooter({
            text:
              "Corgi Studio • XP & Level System"
          })
          .setTimestamp();

      await interaction.editReply({
        embeds: [embed]
      });

      console.log(
        `🏆 /leaderboard | ${interaction.user.tag} | ${ranking.length} users`
      );
    } catch (error) {
      console.error(
        "❌ Leaderboard Command Error:",
        error
      );

      try {
        await interaction.editReply({
          content:
            "❌ Không thể tải Leaderboard lúc này."
        });
      } catch {}
    }
  }
};