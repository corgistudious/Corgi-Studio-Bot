const {
  EmbedBuilder
} = require("discord.js");

const DeveloperAuditLog =
  require("../models/DeveloperAuditLog");

// =====================================
// ACTION DISPLAY
// =====================================

const ACTION_NAMES = {
  XP_ADD: "➕ Cộng XP",
  XP_REMOVE: "➖ Trừ XP",
  XP_SET: "✨ Đặt XP",

  LEVEL_ADD: "⬆️ Tăng Level",
  LEVEL_REMOVE: "⬇️ Giảm Level",
  LEVEL_SET: "⭐ Đặt Level",

  RESET: "♻️ Reset XP & Level"
};

// =====================================
// ACTION COLOR
// =====================================

const ACTION_COLORS = {
  XP_ADD: 0x57f287,
  XP_REMOVE: 0xed4245,
  XP_SET: 0x5865f2,

  LEVEL_ADD: 0x57f287,
  LEVEL_REMOVE: 0xed4245,
  LEVEL_SET: 0x5865f2,

  RESET: 0xfee75c
};

// =====================================
// CREATE AUDIT LOG
// =====================================

async function createDeveloperAuditLog({
  client,

  developerId,
  guildId,
  userId,

  action,
  amount = null,

  beforeLevel = 0,
  beforeXp = 0,

  afterLevel = 0,
  afterXp = 0
}) {
  try {
    // =====================================
    // SAVE MONGODB
    // =====================================

    const log =
      await DeveloperAuditLog.create({
        developerId,
        guildId,
        userId,

        action,
        amount,

        before: {
          level:
            beforeLevel,

          xp:
            beforeXp
        },

        after: {
          level:
            afterLevel,

          xp:
            afterXp
        }
      });

    console.log(
      `📝 Developer Audit | ` +
      `${action} | ` +
      `${guildId}/${userId}`
    );

    // =====================================
    // DISCORD LOG
    // =====================================

    if (client) {
      await sendDeveloperDiscordLog({
        client,

        developerId,
        guildId,
        userId,

        action,
        amount,

        beforeLevel,
        beforeXp,

        afterLevel,
        afterXp,

        logId:
          log._id.toString()
      });
    }

    return log;
  } catch (error) {
    console.error(
      "❌ Developer Audit Log Error:",
      error
    );

    return null;
  }
}

// =====================================
// SEND DISCORD LOG
// =====================================

async function sendDeveloperDiscordLog({
  client,

  developerId,
  guildId,
  userId,

  action,
  amount,

  beforeLevel,
  beforeXp,

  afterLevel,
  afterXp,

  logId
}) {
  try {
    const channelId =
      process.env
        .DEVELOPER_LOG_CHANNEL_ID;

    if (!channelId) {
      console.warn(
        "⚠️ DEVELOPER_LOG_CHANNEL_ID chưa được cấu hình."
      );

      return false;
    }

    // =====================================
    // FETCH LOG CHANNEL
    // =====================================

    let channel = null;

    try {
      channel =
        await client.channels.fetch(
          channelId
        );
    } catch {
      channel = null;
    }

    if (
      !channel ||
      !channel.isTextBased()
    ) {
      console.warn(
        "⚠️ Không tìm thấy Developer Log Channel."
      );

      return false;
    }

    // =====================================
    // TARGET GUILD
    // =====================================

    const guild =
      client.guilds.cache.get(
        guildId
      );

    // =====================================
    // FETCH DEVELOPER
    // =====================================

    let developer = null;

    try {
      developer =
        await client.users.fetch(
          developerId
        );
    } catch {
      developer = null;
    }

    // =====================================
    // FETCH TARGET USER
    // =====================================

    let targetUser = null;

    try {
      targetUser =
        await client.users.fetch(
          userId
        );
    } catch {
      targetUser = null;
    }

    // =====================================
    // ACTION NAME
    // =====================================

    const actionName =
      ACTION_NAMES[action] ||
      action;

    const color =
      ACTION_COLORS[action] ||
      0x5865f2;

    // =====================================
    // EMBED
    // =====================================

    const embed =
      new EmbedBuilder()

        .setColor(
          color
        )

        .setTitle(
          "🔐 Developer Remote Action"
        )

        .setDescription(
          `**${actionName}**`
        )

        .addFields(
          {
            name:
              "👨‍💻 Developer",

            value:
              developer
                ? `${developer}\n\`${developer.id}\``
                : `\`${developerId}\``,

            inline:
              true
          },

          {
            name:
              "👤 Target User",

            value:
              targetUser
                ? `${targetUser}\n\`${targetUser.id}\``
                : `\`${userId}\``,

            inline:
              true
          },

          {
            name:
              "🌐 Target Guild",

            value:
              guild
                ? `${guild.name}\n\`${guild.id}\``
                : `\`${guildId}\``,

            inline:
              false
          },

          {
            name:
              "📊 Trước",

            value:
              `⭐ Level: **${beforeLevel}**\n` +
              `✨ XP: **${Number(beforeXp).toLocaleString()}**`,

            inline:
              true
          },

          {
            name:
              "📈 Sau",

            value:
              `⭐ Level: **${afterLevel}**\n` +
              `✨ XP: **${Number(afterXp).toLocaleString()}**`,

            inline:
              true
          }
        );

    // =====================================
    // AMOUNT
    // =====================================

    if (
      amount !== null &&
      amount !== undefined
    ) {
      embed.addFields({
        name:
          "🛠️ Giá trị thay đổi",

        value:
          `**${Number(amount).toLocaleString()}**`,

        inline:
          false
      });
    }

    // =====================================
    // TARGET AVATAR
    // =====================================

    if (targetUser) {
      embed.setThumbnail(
        targetUser.displayAvatarURL({
          size: 256
        })
      );
    }

    // =====================================
    // FOOTER
    // =====================================

    embed
      .setFooter({
        text:
          `Corgi Studio • Audit ID ${logId}`
      })

      .setTimestamp();

    // =====================================
    // SEND
    // =====================================

    await channel.send({
      embeds: [
        embed
      ],

      allowedMentions: {
        parse: []
      }
    });

    console.log(
      `📜 Developer Log gửi thành công → ${channel.id}`
    );

    return true;
  } catch (error) {
    console.error(
      "❌ Developer Discord Log Error:",
      error
    );

    return false;
  }
}

module.exports = {
  createDeveloperAuditLog,
  sendDeveloperDiscordLog
};