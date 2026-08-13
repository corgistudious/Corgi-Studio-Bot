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
  customId: "dev_xp_set_modal",

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
          content: "🔐 Developer Only.",
          flags: MessageFlags.Ephemeral
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
          flags: MessageFlags.Ephemeral
        });
      }

      // =====================================
      // GET XP
      // =====================================
      const rawAmount =
        interaction.fields
          .getTextInputValue("amount")
          .trim();

      const amount =
        Number(rawAmount);

      // =====================================
      // VALIDATE
      // =====================================
      if (
        !Number.isInteger(amount) ||
        amount < 0
      ) {
        return interaction.reply({
          content:
            "❌ XP phải là số nguyên từ **0** trở lên.",
          flags: MessageFlags.Ephemeral
        });
      }

      if (amount > 100000000) {
        return interaction.reply({
          content:
            "❌ Không thể đặt quá **100,000,000 XP**.",
          flags: MessageFlags.Ephemeral
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
          flags: MessageFlags.Ephemeral
        });
      }

      // =====================================
      // BEFORE
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
      // SET XP
      // =====================================
      profile.xp =
        amount;

      // =====================================
      // AUTO LEVEL UP
      //
      // Ví dụ:
      // Level 5
      // Set XP = 5000
      //
      // Nếu vượt XP yêu cầu,
      // XP dư sẽ chuyển sang level tiếp theo.
      // =====================================
      while (
        profile.level < 10000 &&
        profile.xp >=
          getRequiredXp(
            profile.level
          )
      ) {
        const requiredXp =
          getRequiredXp(
            profile.level
          );

        profile.xp -=
          requiredXp;

        profile.level += 1;
      }

      // =====================================
      // MAX LEVEL
      // =====================================
      if (
        profile.level >= 10000
      ) {
        profile.level = 10000;
        profile.xp = 0;
      }

      // =====================================
      // SAVE
      // =====================================
      await profile.save();

      // =====================================
      // SYNC LEVEL ROLE
      // =====================================
      const roleSync =
        await syncRemoteLevelRole(
          interaction.client,
          session.guildId,
          session.userId,
          profile.level
        );

      // =====================================
      // AUDIT LOG
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
            "XP_SET",

          amount,

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

      const currentRequiredXp =
        getRequiredXp(
          profile.level
        );

      // =====================================
      // RESPONSE
      // =====================================
      await interaction.reply({
        content:
          `✨ Đã đặt XP cho <@${session.userId}>.\n\n` +

          "**📊 Trước**\n" +
          `⭐ Level: **${beforeLevel}**\n` +
          `✨ XP: **${beforeXp.toLocaleString()}**\n\n` +

          "**📈 Sau**\n" +
          `⭐ Level: **${profile.level}**\n` +
          `✨ XP: **${Number(profile.xp).toLocaleString()} / ${Number(currentRequiredXp).toLocaleString()}**\n\n` +

          `🎯 Giá trị XP đã đặt: **${amount.toLocaleString()}**` +

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
        "🔐 DEVELOPER REMOTE XP SET"
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
        `✨ Set XP: ${amount}`
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
        "❌ Dev XP Set Modal Error:",
        error
      );

      try {
        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ Không thể đặt XP từ xa.\n\n" +
              "Kiểm tra Terminal để xem lỗi.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};