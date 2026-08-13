const {
  MessageFlags
} = require("discord.js");

const isDeveloper =
  require("../../utils/isDeveloper");

const getDeveloperSession =
  require("../../utils/getDeveloperSession");

const {
  getLevelProfile,
  getRequiredXp
} = require("../../services/levelService");

const {
  syncRemoteLevelRole
} = require("../../services/syncRemoteLevelRole");

const {
  createDeveloperAuditLog
} = require("../../services/developerAuditService");

module.exports = {
  customId: "dev_xp_reset",

  async execute(interaction) {
    try {
      // =====================================
      // DEVELOPER ONLY
      // =====================================
      if (
        !isDeveloper(
          interaction.user.id
        )
      ) {
        return interaction.reply({
          content:
            "🔐 Developer Only.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // REMOTE SESSION
      // =====================================
      const session =
        getDeveloperSession(
          interaction
        );

      if (!session) {
        return interaction.reply({
          content:
            "⌛ Remote Session đã hết hạn.\n\n" +
            "Hãy dùng `/dev` lại.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // GET PROFILE
      // =====================================
      const profile =
        await getLevelProfile(
          session.guildId,
          session.userId
        );

      if (!profile) {
        return interaction.reply({
          content:
            "❌ Không tìm thấy Level Profile của User.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // BEFORE STATE
      // =====================================
      const beforeLevel =
        Number(
          profile.level ?? 0
        );

      const beforeXp =
        Number(
          profile.xp ?? 0
        );

      // =====================================
      // RESET
      // =====================================
      profile.level = 0;

      profile.xp = 0;

      // Reset cooldown XP
      profile.lastXpAt = null;

      // =====================================
      // SAVE MONGODB
      // =====================================
      await profile.save();

      // =====================================
      // SYNC LEVEL ROLE
      //
      // Level = 0:
      // helper sẽ gỡ Level Role cũ.
      //
      // Nếu server có Level Role ở mốc 0,
      // helper có thể cấp Role Level 0.
      // =====================================
      const roleSync =
        await syncRemoteLevelRole(
          interaction.client,
          session.guildId,
          session.userId,
          profile.level
        );

      // =====================================
      // DEVELOPER AUDIT LOG
      // MongoDB + Discord developer-logs
      // =====================================
      const auditLog =
        await createDeveloperAuditLog({
          client:
            interaction.client,

          developerId:
            interaction.user.id,

          guildId:
            session.guildId,

          userId:
            session.userId,

          action:
            "RESET",

          amount:
            null,

          beforeLevel,

          beforeXp,

          afterLevel:
            profile.level,

          afterXp:
            profile.xp
        });

      // =====================================
      // ROLE STATUS
      // =====================================
      let roleStatus = "";

      if (
        roleSync?.addedRoleId
      ) {
        roleStatus +=
          `\n🎖️ Level Role mới: <@&${roleSync.addedRoleId}>`;
      }

      if (
        roleSync
          ?.removedRoleIds
          ?.length > 0
      ) {
        roleStatus +=
          `\n🧹 Đã gỡ **${roleSync.removedRoleIds.length}** Level Role cũ.`;
      }

      if (
        roleSync &&
        roleSync.success === false
      ) {
        roleStatus +=
          "\n⚠️ Không thể đồng bộ Level Role.";
      }

      // =====================================
      // AUDIT STATUS
      // =====================================
      const auditStatus =
        auditLog
          ? "\n📝 Developer Audit Log: **Đã lưu**"
          : "\n⚠️ Developer Audit Log: **Không thể lưu**";

      // =====================================
      // REQUIRED XP AT LEVEL 0
      // =====================================
      const requiredXp =
        getRequiredXp(
          profile.level
        );

      // =====================================
      // RESPONSE
      // =====================================
      await interaction.reply({
        content:
          `♻️ Đã Reset XP & Level của <@${session.userId}>.\n\n` +

          "**📊 Trước**\n" +
          `⭐ Level: **${beforeLevel}**\n` +
          `✨ XP: **${beforeXp.toLocaleString()}**\n\n` +

          "**♻️ Sau Reset**\n" +
          `⭐ Level: **0**\n` +
          `✨ XP: **0 / ${Number(requiredXp).toLocaleString()}**\n` +
          "⏱️ XP Cooldown: **Đã reset**" +

          roleStatus +
          auditStatus,

        flags:
          MessageFlags.Ephemeral
      });

      // =====================================
      // TERMINAL LOG
      // =====================================
      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        "♻️ DEVELOPER REMOTE XP/LEVEL RESET"
      );

      console.log(
        `👨‍💻 Developer: ${interaction.user.tag} (${interaction.user.id})`
      );

      console.log(
        `🌐 Guild: ${session.guildId}`
      );

      console.log(
        `👤 User: ${session.userId}`
      );

      console.log(
        `📊 Before: Level ${beforeLevel} | XP ${beforeXp}`
      );

      console.log(
        "♻️ After: Level 0 | XP 0"
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );
    } catch (error) {
      console.error(
        "❌ Dev XP Reset Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể Reset XP & Level từ xa.\n\n" +
              "Kiểm tra Terminal để xem lỗi.",

            flags:
              MessageFlags.Ephemeral
          });
        } else if (
          interaction.deferred
        ) {
          await interaction.editReply({
            content:
              "❌ Không thể Reset XP & Level từ xa."
          });
        }
      } catch (replyError) {
        console.error(
          "❌ Không thể gửi error response:",
          replyError
        );
      }
    }
  }
};