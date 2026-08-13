const {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits
} = require("discord.js");

const isDeveloper =
  require("../../utils/isDeveloper");

const {
  createModerationCase
} = require(
  "../../services/moderationCaseService"
);

const {
  getGuildSettings
} = require(
  "../../services/guildSettingsService"
);

module.exports = {
  customId:
    "moderation_warn_modal",

  async execute(interaction) {
    try {
      // =====================================
      // PERMISSION
      // =====================================

      const developer =
        isDeveloper(
          interaction.user.id
        );

      const allowed =
        developer ||
        interaction.member.permissions.has(
          PermissionFlagsBits.Administrator
        ) ||
        interaction.member.permissions.has(
          PermissionFlagsBits.ModerateMembers
        );

      if (!allowed) {
        return interaction.reply({
          content:
            "🔒 Bạn không có quyền Warn thành viên.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // INPUT
      // =====================================

      const userId =
        interaction.fields
          .getTextInputValue(
            "user_id"
          )
          .trim();

      const reason =
        interaction.fields
          .getTextInputValue(
            "reason"
          )
          .trim();

      // =====================================
      // VALIDATE ID
      // =====================================

      if (
        !/^\d{17,20}$/.test(
          userId
        )
      ) {
        return interaction.reply({
          content:
            "❌ Discord User ID không hợp lệ.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // FIND MEMBER
      // =====================================

      let member = null;

      try {
        member =
          await interaction.guild.members.fetch(
            userId
          );
      } catch {}

      if (!member) {
        return interaction.reply({
          content:
            "❌ Không tìm thấy thành viên này trong server.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // PROTECTION
      // =====================================

      if (
        member.id ===
        interaction.user.id
      ) {
        return interaction.reply({
          content:
            "❌ Bạn không thể Warn chính mình.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      if (
        member.id ===
        interaction.client.user.id
      ) {
        return interaction.reply({
          content:
            "❌ Không thể Warn Bot.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      if (
        member.id ===
        interaction.guild.ownerId
      ) {
        return interaction.reply({
          content:
            "❌ Không thể Warn Server Owner.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // ROLE HIERARCHY
      //
      // Developer Remote Control được phép
      // bỏ qua quyền Moderator của chính mình,
      // nhưng target protection vẫn giữ.
      // =====================================

      if (!developer) {
        if (
          interaction.member.roles.highest
            .comparePositionTo(
              member.roles.highest
            ) <= 0
        ) {
          return interaction.reply({
            content:
              "❌ Bạn không thể Warn thành viên có Role bằng hoặc cao hơn Role của bạn.",

            flags:
              MessageFlags.Ephemeral
          });
        }
      }

      // =====================================
      // CREATE CASE
      // =====================================

      const moderationCase =
        await createModerationCase({
          guildId:
            interaction.guildId,

          targetUserId:
            member.id,

          moderatorUserId:
            interaction.user.id,

          type:
            "WARN",

          reason
        });

      // =====================================
      // MEMBER DM
      // =====================================

      try {
        const dmEmbed =
          new EmbedBuilder()
            .setColor(
              0xfee75c
            )
            .setTitle(
              "⚠️ Bạn đã nhận một Warn"
            )
            .setDescription(
              `Bạn đã nhận cảnh cáo tại **${interaction.guild.name}**.`
            )
            .addFields(
              {
                name:
                  "📋 Case",

                value:
                  `#${moderationCase.caseId}`,

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
            .setFooter({
              text:
                "Corgi Studio • Moderation"
            })
            .setTimestamp();

        await member.send({
          embeds: [
            dmEmbed
          ]
        });
      } catch {
        // User có thể tắt DM.
      }

      // =====================================
      // MOD LOG
      // =====================================

      const settings =
        await getGuildSettings(
          interaction.guildId
        );

      const logChannelId =
        settings.moderation
          ?.logChannelId;

      if (logChannelId) {
        const logChannel =
          interaction.guild.channels.cache.get(
            logChannelId
          );

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
                    `<@${interaction.user.id}>`,

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
                    "📝 Lý do",

                  value:
                    reason,

                  inline:
                    false
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
              ]
            });
          } catch {}
        }
      }

      // =====================================
      // SUCCESS
      // =====================================

      await interaction.reply({
        content:
          `✅ Đã Warn ${member}.\n` +
          `📋 Case: **#${moderationCase.caseId}**\n` +
          `📝 Lý do: **${reason}**`,

        flags:
          MessageFlags.Ephemeral
      });

      console.log(
        `⚠️ WARN #${moderationCase.caseId} | ` +
        `${interaction.user.tag} → ${member.user.tag} | ` +
        `${interaction.guild.name}`
      );
    } catch (error) {
      console.error(
        "❌ Moderation Warn Modal Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể Warn thành viên.",

            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};