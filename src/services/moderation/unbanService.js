const {
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  createModerationCase,
  getUserCases,
  setCaseActive
} = require(
  "../moderationCaseService"
);

const {
  getGuildSettings
} = require(
  "../guildSettingsService"
);

// =====================================
// UNBAN SERVICE
// =====================================

async function executeUnban({
  guild,
  userId,
  moderator,
  reason,
  commandName = "unban"
}) {
  // =====================================
  // VALIDATE
  // =====================================

  if (!guild) {
    throw new Error(
      "UNBAN_GUILD_REQUIRED"
    );
  }

  if (!moderator) {
    throw new Error(
      "UNBAN_MODERATOR_REQUIRED"
    );
  }

  if (
    !userId ||
    !/^\d{17,20}$/.test(userId)
  ) {
    throw new Error(
      "UNBAN_USER_ID_INVALID"
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
      "UNBAN_BOT_MEMBER_NOT_FOUND"
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
      "UNBAN_BOT_MISSING_BAN_MEMBERS"
    );
  }

  // =====================================
  // CHECK BAN
  // =====================================

  let banInfo = null;

  try {
    banInfo =
      await guild.bans.fetch(
        userId
      );
  } catch {
    banInfo = null;
  }

  if (!banInfo) {
    throw new Error(
      "UNBAN_USER_NOT_BANNED"
    );
  }

  // =====================================
  // SAVE USER INFO
  // =====================================

  const bannedUser =
    banInfo.user;

  const targetTag =
    bannedUser.tag ||
    bannedUser.username ||
    userId;

  const targetAvatar =
    bannedUser.displayAvatarURL({
      size: 256
    });

  // =====================================
  // UNBAN
  // =====================================
  // Discord phải xác nhận Unban thành công
  // trước khi cập nhật Case.
  // =====================================

  await guild.members.unban(
    userId,
    `${moderator.tag}: ${cleanReason}`
  );

  // =====================================
  // CLOSE ACTIVE BAN CASE
  // =====================================

  let closedBanCase =
    null;

  try {
    const existingCases =
      await getUserCases(
        guild.id,
        userId,
        100
      );

    const activeBanCase =
      existingCases.find(
        (item) =>
          String(item.type)
            .toUpperCase() ===
            "BAN" &&
          item.active === true
      );

    if (activeBanCase) {
      closedBanCase =
        await setCaseActive(
          guild.id,
          activeBanCase.caseId,
          false
        );

      console.log(
        `🔒 Closed BAN Case #${activeBanCase.caseId} | ` +
        `${guild.id}/${userId}`
      );
    }
  } catch (caseError) {
    console.error(
      "❌ Unban Close BAN Case Error:",
      caseError
    );
  }

  // =====================================
  // CREATE UNBAN CASE
  // =====================================

  const moderationCase =
    await createModerationCase({
      guildId:
        guild.id,

      targetUserId:
        userId,

      moderatorUserId:
        moderator.id,

      type:
        "UNBAN",

      reason:
        cleanReason,

      duration:
        null,

      active:
        false
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
          0x57f287
        )

        .setTitle(
          "🔓 Ban đã được gỡ"
        )

        .setDescription(
          `Bạn đã được gỡ Ban tại **${guild.name}**.`
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

    await bannedUser.send({
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
            0x57f287
          )

          .setTitle(
            `🔓 Moderation Case #${moderationCase.caseId}`
          )

          .addFields(
            {
              name:
                "👤 Người dùng",

              value:
                `${targetTag}\n` +
                `\`${userId}\``,

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
                "**UNBAN**",

              inline:
                true
            },

            {
              name:
                "🔒 Case cũ",

              value:
                closedBanCase
                  ? `#${closedBanCase.caseId} → ⚪ Closed`
                  : "⚪ Không tìm thấy Case BAN Active",

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
          "❌ Unban Service Mod Log Error:",
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

    closedBanCase,

    bannedUser,

    targetTag,

    targetAvatar,

    userId,

    dmSent,

    logSent,

    logChannelId,

    reason:
      cleanReason
  };
}

// =====================================
// EXPORT
// =====================================

module.exports = {
  executeUnban
};