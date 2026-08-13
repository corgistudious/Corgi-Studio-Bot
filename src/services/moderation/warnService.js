const {
  EmbedBuilder
} = require("discord.js");

const {
  createModerationCase
} = require(
  "../moderationCaseService"
);

const {
  getGuildSettings
} = require(
  "../guildSettingsService"
);

// =====================================
// WARN SERVICE
// =====================================

async function executeWarn({
  guild,
  member,
  moderator,
  reason,
  commandName = "warn"
}) {
  // =====================================
  // VALIDATE
  // =====================================

  if (!guild) {
    throw new Error(
      "WARN_GUILD_REQUIRED"
    );
  }

  if (!member) {
    throw new Error(
      "WARN_MEMBER_REQUIRED"
    );
  }

  if (!moderator) {
    throw new Error(
      "WARN_MODERATOR_REQUIRED"
    );
  }

  const cleanReason =
    reason?.trim() ||
    "Không có lý do.";

  // =====================================
  // CREATE CASE
  // =====================================

  const moderationCase =
    await createModerationCase({
      guildId:
        guild.id,

      targetUserId:
        member.id,

      moderatorUserId:
        moderator.id,

      type:
        "WARN",

      reason:
        cleanReason,

      duration:
        null
    });

  // =====================================
  // DM USER
  // =====================================

  let dmSent =
    false;

  try {
    const dmEmbed =
      new EmbedBuilder()
        .setColor(
          0xfee75c
        )
        .setTitle(
          "⚠️ Bạn đã nhận một cảnh cáo"
        )
        .setDescription(
          `Bạn đã bị cảnh cáo tại **${guild.name}**.`
        )
        .addFields(
          {
            name:
              "📋 Case ID",

            value:
              `**#${moderationCase.caseId}**`,

            inline:
              true
          },

          {
            name:
              "🛡️ Moderator",

            value:
              `<@${moderator.id}>`,

            inline:
              true
          },

          {
            name:
              "📝 Lý do",

            value:
              cleanReason,

            inline:
              false
          }
        )
        .setFooter({
          text:
            "Corgi Studio • Moderation System"
        })
        .setTimestamp();

    await member.send({
      embeds: [
        dmEmbed
      ]
    });

    dmSent =
      true;
  } catch {
    dmSent =
      false;
  }

  // =====================================
  // SETTINGS
  // =====================================

  const settings =
    await getGuildSettings(
      guild.id
    );

  const logChannelId =
    settings?.moderation
      ?.logChannelId;

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
            0xfee75c
          )
          .setTitle(
            `⚠️ Moderation Case #${moderationCase.caseId}`
          )
          .addFields(
            {
              name:
                "👤 Thành viên",

              value:
                `${member}\n\`${member.id}\``,

              inline:
                true
            },

            {
              name:
                "🛡️ Moderator",

              value:
                `<@${moderator.id}>\n\`${moderator.id}\``,

              inline:
                true
            },

            {
              name:
                "⚖️ Hành động",

              value:
                "**WARN**",

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
            },

            {
              name:
                "📩 DM User",

              value:
                dmSent
                  ? "✅ Đã gửi"
                  : "⚠️ Không gửi được",

              inline:
                true
            },

            {
              name:
                "📝 Lý do",

              value:
                cleanReason,

              inline:
                false
            }
          )
          .setThumbnail(
            member.user.displayAvatarURL({
              size: 256
            })
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
          "❌ Warn Service Mod Log Error:",
          error
        );

        logSent =
          false;
      }
    }
  }

  // =====================================
  // RETURN RESULT
  // =====================================

  return {
    moderationCase,
    dmSent,
    logSent,
    logChannelId,
    reason:
      cleanReason
  };
}

module.exports = {
  executeWarn
};