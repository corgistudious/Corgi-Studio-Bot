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
// FORMAT DURATION
// =====================================

function formatDuration(ms) {
  const seconds =
    Math.floor(ms / 1000);

  if (
    seconds % 86400 === 0
  ) {
    return `${seconds / 86400} ngày`;
  }

  if (
    seconds % 3600 === 0
  ) {
    return `${seconds / 3600} giờ`;
  }

  if (
    seconds % 60 === 0
  ) {
    return `${seconds / 60} phút`;
  }

  return `${seconds} giây`;
}

// =====================================
// MUTE SERVICE
// =====================================

async function executeMute({
  guild,
  member,
  moderator,
  durationMs,
  reason,
  commandName = "mute"
}) {
  // =====================================
  // VALIDATE
  // =====================================

  if (!guild) {
    throw new Error(
      "MUTE_GUILD_REQUIRED"
    );
  }

  if (!member) {
    throw new Error(
      "MUTE_MEMBER_REQUIRED"
    );
  }

  if (!moderator) {
    throw new Error(
      "MUTE_MODERATOR_REQUIRED"
    );
  }

  if (
    !Number.isFinite(durationMs) ||
    durationMs <= 0
  ) {
    throw new Error(
      "MUTE_DURATION_INVALID"
    );
  }

  const MAX_MUTE =
    28 *
    24 *
    60 *
    60 *
    1000;

  if (durationMs > MAX_MUTE) {
    throw new Error(
      "MUTE_DURATION_TOO_LONG"
    );
  }

  const cleanReason =
    reason?.trim() ||
    "Không có lý do.";

  const durationText =
    formatDuration(durationMs);

  // =====================================
  // BOT MEMBER
  // =====================================

  const botMember =
    guild.members.me;

  if (!botMember) {
    throw new Error(
      "MUTE_BOT_MEMBER_NOT_FOUND"
    );
  }

  // =====================================
  // BOT MODERATE PERMISSION
  // =====================================

  if (
    !botMember.permissions.has(
      PermissionFlagsBits.ModerateMembers
    )
  ) {
    throw new Error(
      "MUTE_BOT_MISSING_MODERATE_MEMBERS"
    );
  }

  // =====================================
  // BOT ROLE HIERARCHY
  // =====================================

  if (!member.moderatable) {
    throw new Error(
      "MUTE_MEMBER_NOT_MODERATABLE"
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
    moderation.muteRoleId || null;

  const logChannelId =
    moderation.logChannelId || null;

  // =====================================
  // PREPARE MUTE ROLE
  // =====================================

  let muteRole = null;

  if (muteRoleId) {
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
        muteRole = null;
      }
    }
  }

  // =====================================
  // DM BEFORE MUTE
  // =====================================

  let dmSent = false;

  try {
    const dmEmbed =
      new EmbedBuilder()
        .setColor(
          0x5865f2
        )
        .setTitle(
          "🔇 Bạn đã bị Mute"
        )
        .setDescription(
          `Bạn đã bị tạm khóa chat tại **${guild.name}**.`
        )
        .addFields(
          {
            name:
              "⏱️ Thời gian",

            value:
              `**${durationText}**`,

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

    dmSent = true;
  } catch {
    dmSent = false;
  }

  // =====================================
  // APPLY DISCORD TIMEOUT
  // =====================================

  await member.timeout(
    durationMs,
    `${moderator.tag}: ${cleanReason}`
  );

  // =====================================
  // ADD MUTE ROLE
  // =====================================

  let muteRoleAdded = false;

  let muteRoleStatus =
    "⚪ Chưa cấu hình";

  if (muteRoleId) {
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
        if (
          !member.roles.cache.has(
            muteRole.id
          )
        ) {
          await member.roles.add(
            muteRole,
            `Corgi Studio Mute | ${moderator.tag}: ${cleanReason}`
          );
        }

        muteRoleAdded = true;

        muteRoleStatus =
          `✅ ${muteRole}`;
      } catch (error) {
        console.error(
          "❌ Mute Service Role Error:",
          error
        );

        muteRoleStatus =
          "⚠️ Không thể cấp Role";
      }
    }
  }

  // =====================================
  // CREATE MODERATION CASE
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
        "TIMEOUT",

      reason:
        cleanReason,

      duration:
        durationMs
    });

  // =====================================
  // MOD LOG
  // =====================================

  let logSent = false;

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
        logChannel = null;
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
            `🔇 Moderation Case #${moderationCase.caseId}`
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
                "**MUTE**",

              inline:
                true
            },

            {
              name:
                "⏱️ Thời gian",

              value:
                `**${durationText}**`,

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

        logSent = true;
      } catch (error) {
        console.error(
          "❌ Mute Service Mod Log Error:",
          error
        );

        logSent = false;
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

    muteRoleId,

    muteRole,

    muteRoleAdded,

    muteRoleStatus,

    durationMs,

    durationText,

    reason:
      cleanReason
  };
}

module.exports = {
  executeMute,
  formatDuration
};