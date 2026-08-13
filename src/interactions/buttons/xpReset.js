const {
  MessageFlags
} = require("discord.js");

const isDeveloper =
  require("../../utils/isDeveloper");

const getXpTargetId =
  require("../../utils/getXpTargetId");

const {
  getLevelProfile
} = require("../../services/levelService");

module.exports = {
  customId: "xp_reset",

  async execute(interaction) {
    if (!isDeveloper(interaction.user.id)) {
      await interaction.reply({
        content: "🔒 **Developer Only**",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    const userId =
      getXpTargetId(
        interaction.customId,
        "xp_reset_"
      );

    if (!userId) {
      await interaction.reply({
        content:
          "❌ Không xác định được thành viên.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    const profile =
      await getLevelProfile(
        interaction.guildId,
        userId
      );

    profile.xp = 0;
    profile.level = 0;
    profile.lastXpAt = null;

    await profile.save();

    await interaction.reply({
      content:
        `♻️ Đã reset XP & Level của <@${userId}>.\n\n` +
        "⭐ Level: **0**\n" +
        "✨ XP: **0**",
      flags: MessageFlags.Ephemeral
    });

    console.log(
      `🔐 Developer ${interaction.user.tag} reset XP/Level của ${userId}`
    );
  }
};