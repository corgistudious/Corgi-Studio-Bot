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
// UNMUTE SERVICE
// =====================================

async function executeUnmute({
  guild,
  member,
  moderator,
  reason,
  commandName = "unmute"
}) {
  // =====================================
  // VALIDATE
  // =====================================

  if (!guild) {
    throw new Error(
      "UNMUTE_GUILD_REQUIRED"
    );
  }

  if (!member) {
    throw new Error(
      "UNMUTE_MEMBER_REQUIRED"
    );
  }

  if (!moderator) {
    throw new Error(
      "UNMUTE_MODERATOR_REQUIRED"
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
      "UNMUTE_BOT_MEMBER_NOT_FOUND"
    );
  }

  // =====================================
  // SETTINGS
  // =====================================

  const settings =
    await getGuildSettings(
      guild.id
    );

  const moderation =
    settings?.moderation || {};

  const muteRoleId =
    moderation.muteRoleId ||
    null;

  const logChannelId =
    moderation.logChannelId ||
    null;

  // =====================================
  // CURRENT MUTE STATE
  // =====================================

  const hasTimeout =
    member.communicationDisabledUntilTimestamp &&
    member.communicationDisabledUntilTimestamp >
      Date.now();

  const hasMuteRole =
    muteRoleId
      ? member.roles.cache.has(
          muteRoleId
        )
      : false;

  // =====================================
  // NOTHING TO REMOVE
  // =====================================

  if (
    !hasTimeout &&
    !hasMuteRole
  ) {
    throw new Error(
      "UNMUTE_MEMBER_NOT_MUTED"
    );
  }

  // =====================================
  // REMOVE DISCORD TIMEOUT
  // =====================================

  let timeoutRemoved =
    false;

  let timeoutStatus =
    "⚪ Không có Timeout";

  if (hasTimeout) {
    if (
      !botMember.permissions.has(
        PermissionFlagsBits.ModerateMembers
      )
    ) {
      throw new Error(
        "UNMUTE_BOT_MISSING_MODERATE_MEMBERS"
      );
    }

    if (!member.moderatable) {
      throw new Error(
        "UNMUTE_MEMBER_NOT_MODERATABLE"
      );
    }

    await member.timeout(
      null,
      `${moderator.tag}: ${cleanReason}`
    );

    timeoutRemoved =
      true;

    timeoutStatus =
      "✅ Đã gỡ";
  }

  // =====================================
  // REMOVE MUTE ROLE
  // =====================================

  let muteRole = null;

  let muteRoleRemoved =
    false;

  let muteRoleStatus =
    muteRoleId
      ? "⚪ User không có Mute Role"
      : "⚪ Chưa cấu hình";

  if (
    muteRoleId &&
    hasMuteRole
  ) {
    muteRole =
      guild.roles.cache.get(
        muteRoleId
      );

    if (!muteRole) {
      try {
        muteRole =
          await guild.roles.fetch(
            muteRoleId
          );
      } catch {
        muteRole =
          null;
      }
    }

    if (!muteRole) {
      muteRoleStatus =
        "⚠️ Không tìm thấy Role";
    } else if (
      muteRole.managed
    ) {
      muteRoleStatus =
        "⚠️ Role không thể quản lý";
    } else if (
      !botMember.permissions.has(
        PermissionFlagsBits.ManageRoles
      )
    ) {
      muteRoleStatus =
        "⚠️ Bot thiếu Manage Roles";
    } else if (
      botMember.roles.highest
        .comparePositionTo(
          muteRole
        ) <= 0
    ) {
      muteRoleStatus =
        "⚠️ Mute Role cao hơn bot";
    } else {
      try {
        await member.roles.remove(
          muteRole,
          `Corgi Studio Unmute | ${moderator.tag}: ${cleanReason}`
        );

        muteRoleRemoved =
          true;

        muteRoleStatus =
          "✅ Đã gỡ";
      } catch (error) {
        console.error(
          "❌ Unmute Service Role Error:",
          error
        );

        muteRoleStatus =
          "⚠️ Không thể gỡ Role";
      }
    }
  }

  // =====================================
  // VERIFY RESULT
  // =====================================

  const timeoutStillActive =
    member.communicationDisabledUntilTimestamp &&
    member.communicationDisabledUntilTimestamp >
      Date.now();

  if (
    hasTimeout &&
    timeoutStillActive
  ) {
    throw new Error(
      "UNMUTE_TIMEOUT_REMOVE_FAILED"
    );
  }

  const muteRoleStillActive =
    muteRoleId
      ? member.roles.cache.has(
          muteRoleId
        )
      : false;

  if (
    hasMuteRole &&
    muteRoleStillActive
  ) {
    throw new Error(
      "UNMUTE_ROLE_REMOVE_FAILED"
    );
  }

  // =====================================
  // CLOSE ACTIVE TIMEOUT CASE
  // =====================================

  let closedTimeoutCase =
    null;

  try {
    const existingCases =
      await getUserCases(
        guild.id,
        member.id,
        100
      );

    const activeTimeoutCase =
      existingCases.find(
        (item) =>
          String(item.type)
            .toUpperCase() ===
            "TIMEOUT" &&
          item.active === true
      );

    if (activeTimeoutCase) {
      closedTimeoutCase =
        await setCaseActive(
          guild.id,
          activeTimeoutCase.caseId,
          false
        );

      console.log(
        `🔒 Closed TIMEOUT Case #${activeTimeoutCase.caseId} | ` +
        `${guild.id}/${member.id}`
      );
    }
  } catch (caseError) {
    console.error(
      "❌ Unmute Close TIMEOUT Case Error:",
      caseError
    );
  }

  // =====================================
  // CREATE UNMUTE CASE
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
        "UNMUTE",

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
          "🔊 Bạn đã được Unmute"
        )

        .setDescription(
          `Bạn đã được gỡ Mute tại **${guild.name}**.`
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
            `🔊 Moderation Case #${moderationCase.caseId}`
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
                "**UNMUTE**",

              inline:
                true
            },

            {
              name:
                "⏱️ Timeout",

              value:
                timeoutStatus,

              inline:
                true
            },

            {
              name:
                "🔇 Mute Role",

              value:
                muteRoleStatus,

              inline:
                true
            },

            {
              name:
                "🔒 Case cũ",

              value:
                closedTimeoutCase
                  ? `#${closedTimeoutCase.caseId} → ⚪ Closed`
                  : "⚪ Không tìm thấy Case TIMEOUT Active",

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
          "❌ Unmute Service Mod Log Error:",
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

    closedTimeoutCase,

    dmSent,

    logSent,

    logChannelId,

    hasTimeout,

    timeoutRemoved,

    timeoutStatus,

    hasMuteRole,

    muteRole,

    muteRoleRemoved,

    muteRoleStatus,

    reason:
      cleanReason
  };
}

// =====================================
// EXPORT
// =====================================

module.exports = {
  executeUnmute
};