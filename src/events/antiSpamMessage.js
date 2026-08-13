const {
  Events,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  getGuildSettings
} = require("../services/guildSettingsService");

const {
  createModerationCase
} = require("../services/moderationCaseService");

// =====================================
// MEMORY CACHE
// guildId:userId -> timestamps[]
// =====================================

const messageTracker =
  new Map();

// =====================================
// PUNISHMENT COOLDOWN
// guildId:userId -> timestamp
// =====================================

const punishmentCooldown =
  new Map();

module.exports = {
  name: Events.MessageCreate,

  async execute(message) {
    try {
      // =====================================
      // BASIC CHECKS
      // =====================================

      if (!message.guild) {
        return;
      }

      if (message.author.bot) {
        return;
      }

      if (!message.member) {
        return;
      }

      // =====================================
      // LOAD SETTINGS
      // =====================================

      const settings =
        await getGuildSettings(
          message.guild.id
        );

      const moderation =
        settings.moderation || {};

      const antiSpam =
        moderation.antiSpam || {};

      if (
        antiSpam.enabled !== true
      ) {
        return;
      }

      // =====================================
      // CONFIG
      // =====================================

      const maxMessages =
        Number(
          antiSpam.maxMessages ?? 5
        );

      const intervalSeconds =
        Number(
          antiSpam.intervalSeconds ?? 5
        );

      const timeoutSeconds =
        Number(
          antiSpam.timeoutSeconds ?? 60
        );

      // =====================================
      // INVALID CONFIG PROTECTION
      // =====================================

      if (
        !Number.isFinite(maxMessages) ||
        maxMessages < 2 ||
        !Number.isFinite(intervalSeconds) ||
        intervalSeconds < 1 ||
        !Number.isFinite(timeoutSeconds) ||
        timeoutSeconds < 5
      ) {
        return;
      }

      // =====================================
      // IGNORE CHANNEL
      // =====================================

      if (
        antiSpam.ignoredChannelId &&
        message.channel.id ===
          antiSpam.ignoredChannelId
      ) {
        return;
      }

      // =====================================
      // IGNORE ROLE
      // =====================================

      if (
        antiSpam.ignoredRoleId &&
        message.member.roles.cache.has(
          antiSpam.ignoredRoleId
        )
      ) {
        return;
      }

      // =====================================
      // SERVER OWNER
      // =====================================

      if (
        message.author.id ===
        message.guild.ownerId
      ) {
        return;
      }

      // =====================================
      // ADMINISTRATOR
      // =====================================

      if (
        message.member.permissions.has(
          PermissionFlagsBits.Administrator
        )
      ) {
        return;
      }

      // =====================================
      // IGNORE VALID PREFIX COMMANDS
      //
      // Chỉ bỏ qua command thật sự tồn tại.
      // ?abc không tồn tại vẫn bị tính spam.
      // =====================================

      const content =
        message.content.trimStart();

      if (
        content.startsWith("?")
      ) {
        const commandName =
          content
            .slice(1)
            .trim()
            .split(/\s+/)[0]
            ?.toLowerCase();

        if (
          commandName &&
          message.client.prefixCommands?.has(
            commandName
          )
        ) {
          return;
        }
      }

      // =====================================
      // TRACK MESSAGE
      // =====================================

      const key =
        `${message.guild.id}:${message.author.id}`;

      const now =
        Date.now();

      const intervalMs =
        intervalSeconds * 1000;

      const oldTimestamps =
        messageTracker.get(key) || [];

      const timestamps =
        oldTimestamps.filter(
          (timestamp) =>
            now - timestamp <=
            intervalMs
        );

      timestamps.push(now);

      messageTracker.set(
        key,
        timestamps
      );

      // =====================================
      // NOT SPAM YET
      // =====================================

      if (
        timestamps.length <
        maxMessages
      ) {
        return;
      }

      // =====================================
      // PUNISHMENT COOLDOWN
      // =====================================

      const lastPunishment =
        punishmentCooldown.get(
          key
        ) || 0;

      if (
        now - lastPunishment <
        10000
      ) {
        return;
      }

      punishmentCooldown.set(
        key,
        now
      );

      // Reset tracker ngay
      messageTracker.delete(
        key
      );

      // =====================================
      // CHECK MODERATABLE
      // =====================================

      if (
        !message.member.moderatable
      ) {
        console.warn(
          `⚠️ Anti Spam không thể timeout ${message.author.tag} (${message.author.id}) tại Guild ${message.guild.id}`
        );

        return;
      }

      // =====================================
      // TIMEOUT
      // =====================================

      const timeoutMs =
        Math.min(
          timeoutSeconds,
          2419200
        ) * 1000;

      const reason =
        `Corgi Studio Anti Spam: ${maxMessages} tin nhắn/${intervalSeconds} giây`;

      await message.member.timeout(
        timeoutMs,
        reason
      );

      // =====================================
      // CREATE MODERATION CASE
      //
      // Timeout phải thành công trước
      // rồi mới tạo Case.
      // =====================================

      let moderationCase =
        null;

      try {
        moderationCase =
          await createModerationCase({
            guildId:
              message.guild.id,

            targetUserId:
              message.author.id,

            moderatorUserId:
              message.client.user.id,

            type:
              "TIMEOUT",

            reason,

            duration:
              timeoutMs,

            active:
              true
          });
      } catch (caseError) {
        console.error(
          "❌ Anti Spam Case Error:",
          caseError
        );
      }

      console.log(
        `🛡️ ANTI SPAM | ` +
        `${message.author.tag} | ` +
        `Guild ${message.guild.id} | ` +
        `Timeout ${timeoutSeconds}s` +
        (
          moderationCase
            ? ` | Case #${moderationCase.caseId}`
            : " | Case FAILED"
        )
      );

      // =====================================
      // WARNING MESSAGE
      // =====================================

      try {
        const warning =
          await message.channel.send({
            content:
              `🛡️ <@${message.author.id}> đã bị timeout **${timeoutSeconds} giây** vì gửi tin nhắn quá nhanh.`,

            allowedMentions: {
              users: [
                message.author.id
              ]
            }
          });

        setTimeout(
          () => {
            warning
              .delete()
              .catch(() => {});
          },
          10000
        );
      } catch {}

      // =====================================
      // MODERATION LOG
      // =====================================

      const logChannelId =
        moderation.logChannelId;

      if (!logChannelId) {
        return;
      }

      let logChannel =
        message.guild.channels.cache.get(
          logChannelId
        );

      if (!logChannel) {
        try {
          logChannel =
            await message.guild.channels.fetch(
              logChannelId
            );
        } catch {
          logChannel =
            null;
        }
      }

      if (
        !logChannel ||
        !logChannel.isTextBased()
      ) {
        return;
      }

      // =====================================
      // LOG EMBED
      // =====================================

      const logEmbed =
        new EmbedBuilder()

          .setColor(
            0xed4245
          )

          .setTitle(
            "🛡️ Anti Spam — Auto Moderation"
          )

          .addFields(
            {
              name:
                "📋 Case",

              value:
                moderationCase
                  ? `**#${moderationCase.caseId}**`
                  : "⚠️ Không tạo được",

              inline:
                true
            },

            {
              name:
                "👤 Thành viên",

              value:
                `<@${message.author.id}>\n` +
                `\`${message.author.id}\``,

              inline:
                true
            },

            {
              name:
                "🤖 Moderator",

              value:
                `<@${message.client.user.id}>\n` +
                "`Auto Moderation`",

              inline:
                true
            },

            {
              name:
                "📢 Kênh",

              value:
                `<#${message.channel.id}>`,

              inline:
                true
            },

            {
              name:
                "🚨 Phát hiện",

              value:
                `**${maxMessages} tin nhắn / ${intervalSeconds} giây**`,

              inline:
                false
            },

            {
              name:
                "🔇 Hình phạt",

              value:
                `Timeout **${timeoutSeconds} giây**`,

              inline:
                true
            },

            {
              name:
                "⚖️ Hành động",

              value:
                "**TIMEOUT**",

              inline:
                true
            },

            {
              name:
                "📝 Lý do",

              value:
                reason,

              inline:
                false
            }
          )

          .setThumbnail(
            message.author.displayAvatarURL({
              size: 256
            })
          )

          .setFooter({
            text:
              "Corgi Studio • Auto Moderation"
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
      } catch (error) {
        console.error(
          "❌ Không thể gửi Anti Spam Log:",
          error
        );
      }
    } catch (error) {
      console.error(
        "❌ Anti Spam Message Error:",
        error
      );
    }
  }
};