const {
  EmbedBuilder,
  PermissionFlagsBits
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
// KICK SERVICE
// =====================================

async function executeKick({
  guild,
  member,
  moderator,
  reason,
  commandName = "kick"
}) {
  // =====================================
  // VALIDATE
  // =====================================

  if (!guild) {
    throw new Error(
      "KICK_GUILD_REQUIRED"
    );
  }

  if (!member) {
    throw new Error(
      "KICK_MEMBER_REQUIRED"
    );
  }

  if (!moderator) {
    throw new Error(
      "KICK_MODERATOR_REQUIRED"
    );
  }

  const cleanReason =
    reason?.trim() ||
    "Không có lý do.";

  // =====================================
  // BOT MEMBER
  // =====================================

  const botMember =
    guild.members.me;

  if (!botMember) {
    throw new Error(
      "KICK_BOT_MEMBER_NOT_FOUND"
    );
  }

  // =====================================
  // BOT PERMISSION
  // =====================================

  if (
    !botMember.permissions.has(
      PermissionFlagsBits.KickMembers
    )
  ) {
    throw new Error(
      "KICK_BOT_MISSING_KICK_MEMBERS"
    );
  }

  // =====================================
  // BOT ROLE HIERARCHY
  // =====================================

  if (!member.kickable) {
    throw new Error(
      "KICK_MEMBER_NOT_KICKABLE"
    );
  }

  // =====================================
  // SAVE TARGET INFO
  // =====================================
  // Sau khi Kick, GuildMember không còn
  // trong server nên lưu thông tin trước.
  // =====================================

  const targetId =
    member.id;

  const targetTag =
    member.user.tag;

  const targetMention =
    `<@${targetId}>`;

  const targetAvatar =
    member.user.displayAvatarURL({
      size: 256
    });

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
  // DM BEFORE KICK
  // =====================================

  let dmSent =
    false;

  try {
    const dmEmbed =
      new EmbedBuilder()

        .setColor(
          0xed4245
        )

        .setTitle(
          "👢 Bạn đã bị Kick"
        )

        .setDescription(
          `Bạn đã bị Kick khỏi **${guild.name}**.`
        )

        .addFields(
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
  // KICK
  // =====================================
  // Chỉ tạo Case nếu Kick thành công.
  // =====================================

  await member.kick(
    `${moderator.tag}: ${cleanReason}`
  );

  // =====================================
  // CREATE CASE
  // =====================================

  const moderationCase =
    await createModerationCase({
      guildId:
        guild.id,

      targetUserId:
        targetId,

      moderatorUserId:
        moderator.id,

      type:
        "KICK",

      reason:
        cleanReason,

      duration:
        null,

      active:
        false
    });

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
            0xed4245
          )

          .setTitle(
            `👢 Moderation Case #${moderationCase.caseId}`
          )

          .addFields(
            {
              name:
                "👤 Thành viên",

              value:
                `${targetMention}\n` +
                `\`${targetId}\``,

              inline:
                true
            },

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
                "⚖️ Hành động",

              value:
                "**KICK**",

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
            targetAvatar
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
          "❌ Kick Service Mod Log Error:",
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

    targetId,

    targetTag,

    targetMention,

    targetAvatar,

    reason:
      cleanReason
  };
}

module.exports = {
  executeKick
};