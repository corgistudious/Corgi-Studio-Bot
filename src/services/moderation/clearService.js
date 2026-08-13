const {
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  getGuildSettings
} = require(
  "../guildSettingsService"
);

// =====================================
// CLEAR SERVICE
// =====================================

async function executeClear({
  guild,
  channel,
  moderator,
  amount,
  commandName = "clear"
}) {
  // =====================================
  // VALIDATE
  // =====================================

  if (!guild) {
    throw new Error(
      "CLEAR_GUILD_REQUIRED"
    );
  }

  if (!channel) {
    throw new Error(
      "CLEAR_CHANNEL_REQUIRED"
    );
  }

  if (!moderator) {
    throw new Error(
      "CLEAR_MODERATOR_REQUIRED"
    );
  }

  if (
    !Number.isInteger(amount) ||
    amount < 1 ||
    amount > 100
  ) {
    throw new Error(
      "CLEAR_AMOUNT_INVALID"
    );
  }

  // =====================================
  // BOT MEMBER
  // =====================================

  const botMember =
    guild.members.me;

  if (!botMember) {
    throw new Error(
      "CLEAR_BOT_MEMBER_NOT_FOUND"
    );
  }

  // =====================================
  // BOT PERMISSION
  // =====================================

  if (
    !botMember.permissions.has(
      PermissionFlagsBits.ManageMessages
    )
  ) {
    throw new Error(
      "CLEAR_BOT_MISSING_MANAGE_MESSAGES"
    );
  }

  // =====================================
  // CHANNEL SUPPORT
  // =====================================

  if (
    typeof channel.bulkDelete !==
    "function"
  ) {
    throw new Error(
      "CLEAR_CHANNEL_NOT_SUPPORTED"
    );
  }

  // =====================================
  // DELETE MESSAGES
  // =====================================

  let deleted;

  try {
    deleted =
      await channel.bulkDelete(
        amount,
        true
      );
  } catch (error) {
    console.error(
      "❌ Clear Service Delete Error:",
      error
    );

    throw new Error(
      "CLEAR_DELETE_FAILED"
    );
  }

  const deletedCount =
    deleted?.size || 0;

  // =====================================
  // SETTINGS
  // =====================================

  const settings =
    await getGuildSettings(
      guild.id
    );

  const logChannelId =
    settings?.moderation
      ?.logChannelId ||
    null;

  // =====================================
  // MOD LOG
  // =====================================

  let logSent =
    false;

  if (logChannelId) {
    let logChannel =
      guild.channels.cache.get(
        logChannelId
      );

    if (!logChannel) {
      try {
        logChannel =
          await guild.channels.fetch(
            logChannelId
          );
      } catch {
        logChannel =
          null;
      }
    }

    if (
      logChannel &&
      logChannel.isTextBased()
    ) {
      const logEmbed =
        new EmbedBuilder()
          .setColor(
            0x5865f2
          )
          .setTitle(
            "🧹 Tin nhắn đã được dọn"
          )
          .addFields(
            {
              name:
                "🛡️ Moderator",

              value:
                `<@${moderator.id}>\n` +
                `\`${moderator.id}\``,

              inline:
                true
            },

            {
              name:
                "📢 Channel",

              value:
                `${channel}`,

              inline:
                true
            },

            {
              name:
                "🗑️ Đã xóa",

              value:
                `**${deletedCount}** tin nhắn`,

              inline:
                true
            },

            {
              name:
                "⌨️ Command",

              value:
                `\`${commandName}\``,

              inline:
                true
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Moderation System"
          })
          .setTimestamp();

      try {
        await logChannel.send({
          embeds: [
            logEmbed
          ],

          allowedMentions: {
            parse: []
          }
        });

        logSent =
          true;
      } catch (error) {
        console.error(
          "❌ Clear Service Mod Log Error:",
          error
        );
      }
    }
  }

  // =====================================
  // RETURN RESULT
  // =====================================

  return {
    deletedCount,
    logSent,
    logChannelId
  };
}

module.exports = {
  executeClear
};