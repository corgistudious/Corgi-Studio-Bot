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
  customId: "dev_user_modal",

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
      // REMOTE SESSION
      // =====================================
      const session =
        interaction.client
          .developerSessions
          ?.get(
            interaction.user.id
          );

      if (!session) {
        await interaction.reply({
          content:
            "⌛ Remote Session đã hết hạn.\n\n" +
            "Hãy dùng `/dev` lại.",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // TARGET GUILD
      // =====================================
      const guild =
        interaction.client.guilds.cache.get(
          session.guildId
        );

      if (!guild) {
        await interaction.reply({
          content:
            "❌ Bot không còn hoạt động trong Guild đích.",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // USER ID
      // =====================================
      const userId =
        interaction.fields
          .getTextInputValue(
            "user_id"
          )
          .trim();

      if (
        !/^\d{17,20}$/.test(
          userId
        )
      ) {
        await interaction.reply({
          content:
            "❌ Discord User ID không hợp lệ.",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // FETCH DISCORD USER
      // =====================================
      let user = null;

      try {
        user =
          await interaction.client.users.fetch(
            userId
          );
      } catch {
        user = null;
      }

      if (!user) {
        await interaction.reply({
          content:
            "❌ Không tìm thấy Discord User này.",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // CHECK MEMBER IN TARGET GUILD
      // =====================================
      let member = null;

      try {
        member =
          await guild.members.fetch(
            userId
          );
      } catch {
        member = null;
      }

      if (!member) {
        await interaction.reply({
          content:
            `❌ ${user.tag} không phải thành viên của **${guild.name}**.`,
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // GET LEVEL PROFILE
      // =====================================
      const profile =
        await getLevelProfile(
          guild.id,
          user.id
        );

      const requiredXp =
        getRequiredXp(
          profile.level
        );

      // =====================================
      // SAVE TARGET USER TO SESSION
      // =====================================
      session.userId =
        user.id;

      session.updatedAt =
        Date.now();

      interaction.client
        .developerSessions
        .set(
          interaction.user.id,
          session
        );

      // =====================================
      // EMBED
      // =====================================
      const embed =
        new EmbedBuilder()
          .setColor(
            0x8b5cf6
          )

          .setTitle(
            "🔐 Developer XP/Level Control"
          )

          .setDescription(
            `Remote Control tại **${guild.name}**`
          )

          .setThumbnail(
            user.displayAvatarURL({
              size: 256
            })
          )

          .addFields(
            {
              name:
                "👤 User",

              value:
                `${user}\n\`${user.id}\``,

              inline:
                false
            },

            {
              name:
                "🌐 Guild",

              value:
                `${guild.name}\n\`${guild.id}\``,

              inline:
                false
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
                "💬 Messages",

              value:
                `**${profile.totalMessages ?? 0}**`,

              inline:
                true
            }
          )

          .setFooter({
            text:
              "Corgi Studio • Developer Remote Control"
          })

          .setTimestamp();

      // =====================================
      // ROW 1 — XP CONTROL
      // =====================================

      const addXp =
        new ButtonBuilder()
          .setCustomId(
            "dev_xp_add"
          )
          .setLabel(
            "Cộng XP"
          )
          .setEmoji(
            "➕"
          )
          .setStyle(
            ButtonStyle.Success
          );

      const removeXp =
        new ButtonBuilder()
          .setCustomId(
            "dev_xp_remove"
          )
          .setLabel(
            "Trừ XP"
          )
          .setEmoji(
            "➖"
          )
          .setStyle(
            ButtonStyle.Danger
          );

      const setXp =
        new ButtonBuilder()
          .setCustomId(
            "dev_xp_set"
          )
          .setLabel(
            "Đặt XP"
          )
          .setEmoji(
            "✨"
          )
          .setStyle(
            ButtonStyle.Primary
          );

      const setLevel =
        new ButtonBuilder()
          .setCustomId(
            "dev_level_set"
          )
          .setLabel(
            "Đặt Level"
          )
          .setEmoji(
            "⭐"
          )
          .setStyle(
            ButtonStyle.Primary
          );

      const reset =
        new ButtonBuilder()
          .setCustomId(
            "dev_xp_reset"
          )
          .setLabel(
            "Reset"
          )
          .setEmoji(
            "♻️"
          )
          .setStyle(
            ButtonStyle.Secondary
          );

      const xpRow =
        new ActionRowBuilder()
          .addComponents(
            addXp,
            removeXp,
            setXp,
            setLevel,
            reset
          );

      // =====================================
      // ROW 2 — LEVEL CONTROL
      // =====================================

      const addLevel =
        new ButtonBuilder()
          .setCustomId(
            "dev_level_add"
          )
          .setLabel(
            "Tăng Level"
          )
          .setEmoji(
            "⬆️"
          )
          .setStyle(
            ButtonStyle.Success
          );

      const removeLevel =
        new ButtonBuilder()
          .setCustomId(
            "dev_level_remove"
          )
          .setLabel(
            "Giảm Level"
          )
          .setEmoji(
            "⬇️"
          )
          .setStyle(
            ButtonStyle.Danger
          );

      const levelRow =
        new ActionRowBuilder()
          .addComponents(
            addLevel,
            removeLevel
          );

      // =====================================
      // SEND
      // =====================================
      await interaction.reply({
        embeds: [
          embed
        ],

        components: [
          xpRow,
          levelRow
        ],

        flags:
          MessageFlags.Ephemeral
      });

      console.log(
        `🔐 Remote User Control | ` +
        `${interaction.user.tag} → ` +
        `${guild.name} → ` +
        `${user.tag}`
      );
    } catch (error) {
      console.error(
        "❌ Dev User Modal Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể mở Developer XP/Level Control.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};