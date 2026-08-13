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
  customId: "dev_level_set_modal",

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
      // GET LEVEL
      // =====================================
      const rawLevel =
        interaction.fields
          .getTextInputValue(
            "level"
          )
          .trim();

      const level =
        Number(rawLevel);

      // =====================================
      // VALIDATE LEVEL
      // =====================================
      if (
        !Number.isInteger(level) ||
        level < 0
      ) {
        return interaction.reply({
          content:
            "❌ Level phải là số nguyên từ **0** trở lên.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      if (level > 10000) {
        return interaction.reply({
          content:
            "❌ Level tối đa là **10,000**.",

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
      // SET LEVEL
      // =====================================
      profile.level =
        level;

      // Khi Developer đặt Level trực tiếp,
      // reset XP của level hiện tại về 0.
      profile.xp = 0;

      // =====================================
      // SAVE MONGODB
      // =====================================
      await profile.save();

      // =====================================
      // AUTO SYNC LEVEL ROLE
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
            "LEVEL_SET",

          // Với SET, amount là Level
          // mà Developer đặt.
          amount:
            level,

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
      // REQUIRED XP
      // =====================================
      const currentRequiredXp =
        getRequiredXp(
          profile.level
        );

      // =====================================
      // RESPONSE
      // =====================================
      await interaction.reply({
        content:
          `⭐ Đã đặt Level của <@${session.userId}> thành **${profile.level}**.\n\n` +

          "**📊 Trước**\n" +
          `⭐ Level: **${beforeLevel}**\n` +
          `✨ XP: **${beforeXp.toLocaleString()}**\n\n` +

          "**📈 Sau**\n" +
          `⭐ Level: **${profile.level}**\n` +
          `✨ XP: **${Number(profile.xp).toLocaleString()} / ${Number(currentRequiredXp).toLocaleString()}**` +

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
        "🔐 DEVELOPER REMOTE LEVEL SET"
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
        `⭐ Set Level: ${level}`
      );

      console.log(
        `📊 Before: Level ${beforeLevel} | XP ${beforeXp}`
      );

      console.log(
        `📈 After: Level ${profile.level} | XP ${profile.xp}`
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );
    } catch (error) {
      console.error(
        "❌ Dev Level Set Modal Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể đặt Level từ xa.\n\n" +
              "Kiểm tra Terminal để xem lỗi.",

            flags:
              MessageFlags.Ephemeral
          });
        } else if (
          interaction.deferred
        ) {
          await interaction.editReply({
            content:
              "❌ Không thể đặt Level từ xa."
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