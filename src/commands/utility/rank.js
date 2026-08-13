const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder
} = require("discord.js");

const {
  getLevelProfile,
  getRequiredXp,
  getRankPosition
} = require(
  "../../services/levelService"
);

const {
  createLevelCard
} = require(
  "../../services/levelCardService"
);

module.exports = {
  data:
    new SlashCommandBuilder()

      .setName("rank")

      .setDescription(
        "Xem Level, XP và thứ hạng của bạn hoặc thành viên khác."
      )

      .addUserOption(
        (option) =>
          option
            .setName("user")

            .setDescription(
              "Thành viên muốn xem Rank"
            )

            .setRequired(false)
      ),

  async execute(interaction) {
    try {
      // =====================================
      // DEFER
      // =====================================

      await interaction.deferReply();

      // =====================================
      // USER
      // =====================================

      const user =
        interaction.options.getUser(
          "user"
        ) ||
        interaction.user;

      // =====================================
      // PROFILE
      // =====================================

      const profile =
        await getLevelProfile(
          interaction.guildId,
          user.id
        );

      // =====================================
      // REQUIRED XP
      // =====================================

      const requiredXp =
        getRequiredXp(
          profile.level
        );

      // =====================================
      // RANK POSITION
      // =====================================

      const rankPosition =
        await getRankPosition(
          interaction.guildId,
          user.id
        );

      // =====================================
      // PROGRESS %
      // =====================================

      let percentage =
        requiredXp > 0
          ? Math.floor(
              (
                profile.xp /
                requiredXp
              ) * 100
            )
          : 0;

      percentage =
        Math.max(
          0,
          Math.min(
            percentage,
            100
          )
        );

      // =====================================
      // CREATE LEVEL CARD
      // =====================================

      let attachment = null;

      try {
        const cardBuffer =
          await createLevelCard({
            user,

            level:
              profile.level,

            xp:
              profile.xp,

            requiredXp
          });

        attachment =
          new AttachmentBuilder(
            cardBuffer,
            {
              name:
                "corgi-rank-card.png"
            }
          );

        console.log(
          `🎨 Rank Card: ` +
          `${user.tag} | ` +
          `Rank #${rankPosition ?? "?"} | ` +
          `Level ${profile.level} | ` +
          `${profile.xp}/${requiredXp} XP`
        );
      } catch (cardError) {
        console.error(
          "❌ Rank Card Error:",
          cardError
        );
      }

      // =====================================
      // EMBED
      // =====================================

      const embed =
        new EmbedBuilder()

          .setColor(
            0x8b5cf6
          )

          .setAuthor({
            name:
              `${user.username} • Rank`,

            iconURL:
              user.displayAvatarURL()
          })

          .setTitle(
            "🏆 Corgi Studio Rank"
          )

          .setDescription(
            `${user} đang ở **Level ${profile.level}**`
          )

          .addFields(
            {
              name:
                "🏆 Xếp hạng server",

              value:
                rankPosition
                  ? `**#${rankPosition}**`
                  : "**Chưa xếp hạng**",

              inline:
                true
            },

            {
              name:
                "⭐ Level",

              value:
                `**${profile.level}**`,

              inline:
                true
            },

            {
              name:
                "✨ XP",

              value:
                `**${profile.xp} / ${requiredXp}**`,

              inline:
                true
            },

            {
              name:
                "📊 Tiến độ",

              value:
                `**${percentage}%**`,

              inline:
                true
            },

            {
              name:
                "💬 Tin nhắn",

              value:
                `**${profile.totalMessages ?? 0}**`,

              inline:
                true
            }
          )

          .setThumbnail(
            user.displayAvatarURL({
              size: 256
            })
          )

          .setFooter({
            text:
              "Corgi Studio • XP & Level System"
          })

          .setTimestamp();

      // =====================================
      // CARD IMAGE
      // =====================================

      if (attachment) {
        embed.setImage(
          "attachment://corgi-rank-card.png"
        );
      }

      // =====================================
      // PAYLOAD
      // =====================================

      const payload = {
        embeds: [
          embed
        ]
      };

      if (attachment) {
        payload.files = [
          attachment
        ];
      }

      // =====================================
      // SEND
      // =====================================

      await interaction.editReply(
        payload
      );

      console.log(
        `🏆 /rank | ` +
        `${interaction.user.tag} xem ${user.tag} | ` +
        `Rank #${rankPosition ?? "?"} | ` +
        `Level ${profile.level} | ` +
        `XP ${profile.xp}/${requiredXp}`
      );
    } catch (error) {
      console.error(
        "❌ Rank Command Error:",
        error
      );

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          await interaction.editReply({
            content:
              "❌ Không thể hiển thị Rank lúc này."
          });
        } else {
          await interaction.reply({
            content:
              "❌ Không thể hiển thị Rank lúc này.",

            ephemeral:
              true
          });
        }
      } catch (replyError) {
        console.error(
          "❌ Rank Reply Error:",
          replyError
        );
      }
    }
  }
};