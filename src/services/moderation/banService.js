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
// BAN SERVICE
// =====================================

async function executeBan({
  guild,
  member,
  moderator,
  reason,
  commandName = "ban"
}) {
  // =====================================
  // VALIDATE
  // =====================================

  if (!guild) {
    throw new Error(
      "BAN_GUILD_REQUIRED"
    );
  }

  if (!member) {
    throw new Error(
      "BAN_MEMBER_REQUIRED"
    );
  }

  if (!moderator) {
    throw new Error(
      "BAN_MODERATOR_REQUIRED"
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
      "BAN_BOT_MEMBER_NOT_FOUND"
    );
  }

  // =====================================
  // BOT PERMISSION
  // =====================================

  if (
    !botMember.permissions.has(
      PermissionFlagsBits.BanMembers
    )
  ) {
    throw new Error(
      "BAN_BOT_MISSING_BAN_MEMBERS"
    );
  }

  // =====================================
  // BOT ROLE HIERARCHY
  // =====================================

  if (!member.bannable) {
    throw new Error(
      "BAN_MEMBER_NOT_BANNABLE"
    );
  }

  // =====================================
  // SAVE TARGET INFO
  // =====================================
  // Sau khi Ban, member sẽ rời Guild.
  // Lưu thông tin trước khi Ban.
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
  // DM BEFORE BAN
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
          "🔨 Bạn đã bị Ban"
        )

        .setDescription(
          `Bạn đã bị Ban khỏi **${guild.name}**.`
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
  // BAN
  // =====================================
  // Chỉ tạo Case nếu Ban thành công.
  // =====================================

  await member.ban({
    reason:
      `${moderator.tag}: ${cleanReason}`
  });

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
        "BAN",

      reason:
        cleanReason,

      duration:
        null,

      active:
        true
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
            `🔨 Moderation Case #${moderationCase.caseId}`
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
                "**BAN**",

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
          "❌ Ban Service Mod Log Error:",
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
  executeBan
};