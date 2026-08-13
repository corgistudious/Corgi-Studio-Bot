const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");

const isDeveloper =
  require("../../utils/isDeveloper");

module.exports = {
  customId: "dev_guild_select",

  async execute(interaction) {
    try {
      // =====================================
      // DEVELOPER ONLY
      // =====================================
      if (
        !isDeveloper(
          interaction.user.id
        )
      ) {
        await interaction.reply({
          content:
            "🔐 Developer Only.",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // TARGET GUILD
      // =====================================
      const guildId =
        interaction.values[0];

      const guild =
        interaction.client.guilds.cache.get(
          guildId
        );

      if (!guild) {
        await interaction.update({
          content:
            "❌ Bot không còn hoạt động trong server này.",
          embeds: [],
          components: []
        });

        return;
      }

      // =====================================
      // REMOTE SESSION
      // =====================================
      if (
        !interaction.client
          .developerSessions
      ) {
        interaction.client
          .developerSessions =
          new Map();
      }

      interaction.client
        .developerSessions
        .set(
          interaction.user.id,
          {
            guildId:
              guild.id,

            createdAt:
              Date.now()
          }
        );

      // =====================================
      // EMBED
      // =====================================
      const embed =
        new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle(
            "🛰️ Remote Server Control"
          )
          .setDescription(
            `Đã kết nối tới **${guild.name}**.`
          )
          .addFields(
            {
              name:
                "🌐 Server",
              value:
                guild.name,
              inline:
                true
            },
            {
              name:
                "🆔 Guild ID",
              value:
                `\`${guild.id}\``,
              inline:
                true
            },
            {
              name:
                "👥 Members",
              value:
                `\`${guild.memberCount}\``,
              inline:
                true
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Remote Developer Session"
          })
          .setTimestamp();

      // =====================================
      // USER CONTROL BUTTON
      // =====================================
      const userButton =
        new ButtonBuilder()
          .setCustomId(
            "dev_user_open"
          )
          .setLabel(
            "Quản lý User"
          )
          .setEmoji("👤")
          .setStyle(
            ButtonStyle.Primary
          );

      const closeButton =
        new ButtonBuilder()
          .setCustomId(
            "dev_remote_close"
          )
          .setLabel(
            "Đóng"
          )
          .setEmoji("✖️")
          .setStyle(
            ButtonStyle.Danger
          );

      const row =
        new ActionRowBuilder()
          .addComponents(
            userButton,
            closeButton
          );

      // =====================================
      // UPDATE
      // =====================================
      await interaction.update({
        embeds: [
          embed
        ],

        components: [
          row
        ]
      });

      console.log(
        `🛰️ Developer ${interaction.user.tag} ` +
        `kết nối remote → ${guild.name}`
      );
    } catch (error) {
      console.error(
        "❌ Dev Guild Select Error:",
        error
      );
    }
  }
};