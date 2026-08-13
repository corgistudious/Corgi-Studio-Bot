const {
  Events,
  EmbedBuilder,
  AttachmentBuilder
} = require("discord.js");

const {
  getGuildSettings
} = require("../services/guildSettingsService");

const {
  addMessageXp,
  getRequiredXp
} = require("../services/levelService");

const {
  createLevelCard
} = require("../services/levelCardService");

const {
  syncLevelRole
} = require("../services/levelRoleService");

module.exports = {
  name: Events.MessageCreate,

  async execute(message) {
    try {
      // =====================================
      // CHỈ HOẠT ĐỘNG TRONG SERVER
      // =====================================
      if (!message.guild) {
        return;
      }

      // =====================================
      // KHÔNG CỘNG XP CHO BOT
      // =====================================
      if (message.author.bot) {
        return;
      }

      // =====================================
      // KHÔNG CỘNG XP CHO PREFIX COMMAND
      // =====================================

      if (
          message.content
         .trimStart()
         .startsWith("?")
        ) {
         return;
      }

      console.log(
        `💬 XP Event nhận message từ: ${message.author.tag}`
      );

      // =====================================
      // LẤY SETTINGS CỦA SERVER
      // =====================================
      const settings =
        await getGuildSettings(
          message.guild.id
        );

      const leveling =
        settings.leveling || {};

      // =====================================
      // XP ĐANG TẮT
      // =====================================
      if (leveling.enabled === false) {
        console.log(
          `⛔ XP đang tắt tại ${message.guild.name}`
        );

        return;
      }

      // =====================================
      // CẤU HÌNH XP
      // =====================================
      const xpMin =
        Number(
          leveling.xpMin ?? 15
        );

      const xpMax =
        Number(
          leveling.xpMax ?? 25
        );

      const cooldown =
        Number(
          leveling.cooldown ?? 60
        );

      // =====================================
      // KIỂM TRA CẤU HÌNH
      // =====================================
      if (
        !Number.isFinite(xpMin) ||
        !Number.isFinite(xpMax) ||
        !Number.isFinite(cooldown) ||
        xpMin < 1 ||
        xpMax < xpMin ||
        cooldown < 0
      ) {
        console.error(
          "❌ Cấu hình XP không hợp lệ:",
          {
            xpMin,
            xpMax,
            cooldown
          }
        );

        return;
      }

      // =====================================
      // RANDOM XP
      // =====================================
      const xpAmount =
        Math.floor(
          Math.random() *
            (xpMax - xpMin + 1)
        ) + xpMin;

      // =====================================
      // CỘNG XP
      // =====================================
      const result =
        await addMessageXp({
          guildId:
            message.guild.id,

          userId:
            message.author.id,

          xpAmount,

          cooldownSeconds:
            cooldown
        });

      // =====================================
      // COOLDOWN
      // =====================================
      if (result.gainedXp === 0) {
        console.log(
          `⏱️ ${message.author.tag} đang trong XP cooldown`
        );

        return;
      }

      const currentRequiredXp =
        getRequiredXp(
          result.profile.level
        );

      console.log(
        `✨ ${message.author.tag} ` +
        `+${result.gainedXp} XP | ` +
        `Level ${result.profile.level} | ` +
        `XP ${result.profile.xp}/${currentRequiredXp}`
      );

      // =====================================
      // CHƯA LEVEL UP
      // =====================================
      if (!result.leveledUp) {
        return;
      }

      // =====================================
      // LEVEL UP
      // =====================================
      const requiredXp =
        getRequiredXp(
          result.profile.level
        );

      console.log(
        `⭐ ${message.author.tag} lên Level ${result.profile.level}`
      );

      // =====================================
      // LEVEL ROLE THEO SERVER
      // =====================================
      let levelRole = null;
      let roleChanged = false;

      try {
        const member =
          await message.guild.members.fetch(
            message.author.id
          );

        const roleResult =
          await syncLevelRole(
            member,
            result.profile.level,
            settings
          );

        levelRole =
          roleResult?.role || null;

        roleChanged =
          roleResult?.changed || false;

        if (
          levelRole &&
          roleChanged
        ) {
          console.log(
            `🎖️ Level Role Sync: ` +
            `${message.author.tag} → ${levelRole.name}`
          );
        }
      } catch (roleError) {
        console.error(
          "❌ Level Role Error:",
          roleError
        );
      }

      // =====================================
      // TẠO LEVEL CARD ĐỘNG
      // =====================================
      let attachment = null;

      try {
        const cardBuffer =
          await createLevelCard({
            user:
              message.author,

            level:
              result.profile.level,

            xp:
              result.profile.xp,

            requiredXp
          });

        attachment =
          new AttachmentBuilder(
            cardBuffer,
            {
              name:
                "corgi-level-up.png"
            }
          );

        console.log(
          `🎨 Đã tạo Level Card: ` +
          `${message.author.tag} | ` +
          `Level ${result.profile.level} | ` +
          `${result.profile.xp}/${requiredXp} XP`
        );
      } catch (cardError) {
        console.error(
          "❌ Level Card Error:",
          cardError
        );
      }

      // =====================================
      // LEVEL UP EMBED
      // =====================================
      const embed =
        new EmbedBuilder()
          .setColor(
            0xf1c40f
          )

          .setAuthor({
            name:
              `${message.author.username} • LEVEL UP!`,

            iconURL:
              message.author.displayAvatarURL()
          })

          .setTitle(
            `🎉 Bạn đã đạt Level ${result.profile.level}!`
          )

          .setDescription(
            `Chúc mừng ${message.author}! ` +
            `Bạn vừa đạt một cấp độ mới. ⭐`
          )

          .addFields(
            {
              name:
                "⭐ Level",

              value:
                `**${result.profile.level}**`,

              inline:
                true
            },

            {
              name:
                "✨ XP hiện tại",

              value:
                `**${result.profile.xp} / ${requiredXp}**`,

              inline:
                true
            }
          )

          .setFooter({
            text:
              "Corgi Studio • XP & Level System"
          })

          .setTimestamp();

      // =====================================
      // LEVEL ROLE FIELD
      // =====================================
      if (
        levelRole &&
        roleChanged
      ) {
        embed.addFields({
          name:
            "🎖️ Level Role mới",

          value:
            `Bạn đã nhận ${levelRole}!`,

          inline:
            false
        });
      }

      // =====================================
      // CARD IMAGE
      // =====================================
      if (attachment) {
        embed.setImage(
          "attachment://corgi-level-up.png"
        );
      }

      // =====================================
      // CHỌN KÊNH GỬI LEVEL UP
      // =====================================
      let targetChannel =
        message.channel;

      const levelUpChannelId =
        leveling.levelUpChannelId;

      if (levelUpChannelId) {
        const configuredChannel =
          message.guild.channels.cache.get(
            levelUpChannelId
          );

        if (
          configuredChannel &&
          configuredChannel.isTextBased()
        ) {
          targetChannel =
            configuredChannel;
        }
      }

      // =====================================
      // PAYLOAD
      // =====================================
      const payload = {
        embeds: [
          embed
        ],

        allowedMentions: {
          users: [
            message.author.id
          ],

          roles:
            levelRole &&
            roleChanged
              ? [
                  levelRole.id
                ]
              : []
        }
      };

      if (attachment) {
        payload.files = [
          attachment
        ];
      }

      // =====================================
      // GỬI DISCORD
      // =====================================
      await targetChannel.send(
        payload
      );

      console.log(
        `✅ Đã gửi thông báo Level Up cho ${message.author.tag} ` +
        `tại #${targetChannel.name}`
      );
    } catch (error) {
      console.error(
        "❌ XP Message Error:",
        error
      );
    }
  }
};