const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");

const isDeveloper =
  require("../../utils/isDeveloper");

const {
  getLevelProfile,
  getRequiredXp
} = require("../../services/levelService");

module.exports = {
  customId: "xp_user_select",

  async execute(interaction) {
    try {
      // ==============================
      // DEVELOPER ONLY
      // ==============================

      if (!isDeveloper(interaction.user.id)) {
        await interaction.reply({
          content:
            "🔒 **Developer Only**\n\n" +
            "Bạn không có quyền quản lý XP & Level.",
          flags: MessageFlags.Ephemeral
        });

        return;
      }

      // ==============================
      // ACKNOWLEDGE INTERACTION
      // ==============================

      await interaction.deferUpdate();

      console.log(
        `👤 XP User Select bởi ${interaction.user.tag}`
      );

      // ==============================
      // GET USER
      // ==============================

      const userId =
        interaction.values?.[0];

      if (!userId) {
        await interaction.editReply({
          content:
            "❌ Không lấy được thành viên đã chọn.",
          embeds: [],
          components: []
        });

        return;
      }

      console.log(
        `👤 XP Target User ID: ${userId}`
      );

      let user;

      try {
        user =
          await interaction.client.users.fetch(
            userId
          );
      } catch (error) {
        console.error(
          "❌ Không fetch được User:",
          error
        );

        await interaction.editReply({
          content:
            "❌ Không thể lấy thông tin thành viên.",
          embeds: [],
          components: []
        });

        return;
      }

      // ==============================
      // GET LEVEL PROFILE
      // ==============================

      let profile;

      try {
        profile =
          await getLevelProfile(
            interaction.guildId,
            userId
          );
      } catch (error) {
        console.error(
          "❌ Get Level Profile Error:",
          error
        );

        await interaction.editReply({
          content:
            "❌ Không thể đọc dữ liệu XP từ MongoDB.",
          embeds: [],
          components: []
        });

        return;
      }

      // ==============================
      // XP REQUIRED
      // ==============================

      const requiredXp =
        getRequiredXp(
          profile.level
        );

      // ==============================
      // EMBED
      // ==============================

      const embed =
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setAuthor({
            name:
              `${user.username} • XP Management`,
            iconURL:
              user.displayAvatarURL()
          })
          .setThumbnail(
            user.displayAvatarURL({
              size: 256
            })
          )
          .setDescription(
            "Quản lý XP và Level của thành viên này."
          )
          .addFields(
            {
              name: "👤 Thành viên",
              value:
                `${user}\n\`${user.id}\``,
              inline: false
            },
            {
              name: "⭐ Level",
              value:
                `**${profile.level ?? 0}**`,
              inline: true
            },
            {
              name: "✨ XP",
              value:
                `**${profile.xp ?? 0} / ${requiredXp}**`,
              inline: true
            },
            {
              name: "💬 Tin nhắn",
              value:
                `**${profile.totalMessages ?? 0}**`,
              inline: true
            }
          )
          .addFields({
            name: "🔐 Quyền quản lý",
            value:
              "Developer Only",
            inline: false
          })
          .setFooter({
            text:
              "Corgi Studio • Developer Control"
          })
          .setTimestamp();

      // ==============================
      // BUTTONS
      // ==============================

      const addXp =
        new ButtonBuilder()
          .setCustomId(
            `xp_add_${userId}`
          )
          .setLabel("Cộng XP")
          .setEmoji("➕")
          .setStyle(
            ButtonStyle.Success
          );

      const removeXp =
        new ButtonBuilder()
          .setCustomId(
            `xp_remove_${userId}`
          )
          .setLabel("Trừ XP")
          .setEmoji("➖")
          .setStyle(
            ButtonStyle.Danger
          );

      const setXp =
        new ButtonBuilder()
          .setCustomId(
            `xp_set_${userId}`
          )
          .setLabel("Đặt XP")
          .setEmoji("✨")
          .setStyle(
            ButtonStyle.Primary
          );

      const setLevel =
        new ButtonBuilder()
          .setCustomId(
            `level_set_${userId}`
          )
          .setLabel("Đặt Level")
          .setEmoji("⭐")
          .setStyle(
            ButtonStyle.Primary
          );

      const reset =
        new ButtonBuilder()
          .setCustomId(
            `xp_reset_${userId}`
          )
          .setLabel("Reset")
          .setEmoji("♻️")
          .setStyle(
            ButtonStyle.Secondary
          );

      const row =
        new ActionRowBuilder()
          .addComponents(
            addXp,
            removeXp,
            setXp,
            setLevel,
            reset
          );

      // ==============================
      // UPDATE MESSAGE
      // ==============================

      await interaction.editReply({
        embeds: [embed],
        components: [row]
      });

      console.log(
        `✅ Đã mở XP Management: ${user.tag}`
      );

    } catch (error) {
      console.error(
        "❌ XP User Select Error:",
        error
      );

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          await interaction.editReply({
            content:
              "❌ Có lỗi xảy ra khi mở XP Management.",
            embeds: [],
            components: []
          });
        } else {
          await interaction.reply({
            content:
              "❌ Có lỗi xảy ra khi mở XP Management.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch (replyError) {
        console.error(
          "❌ XP User Select Reply Error:",
          replyError
        );
      }
    }
  }
};