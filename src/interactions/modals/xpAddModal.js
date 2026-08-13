const { MessageFlags } = require("discord.js");

const isDeveloper =
  require("../../utils/isDeveloper");

const getXpTargetId =
  require("../../utils/getXpTargetId");

const {
  getLevelProfile,
  getRequiredXp
} = require("../../services/levelService");

module.exports = {
  customId: "xp_add_modal",

  async execute(interaction) {
    if (!isDeveloper(interaction.user.id)) {
      return interaction.reply({
        content: "🔒 **Developer Only**",
        flags: MessageFlags.Ephemeral
      });
    }

    const userId = getXpTargetId(
      interaction.customId,
      "xp_add_modal_"
    );

    const amount = Number(
      interaction.fields.getTextInputValue("amount")
    );

    if (!userId || !Number.isInteger(amount) || amount <= 0) {
      return interaction.reply({
        content: "❌ Số XP không hợp lệ.",
        flags: MessageFlags.Ephemeral
      });
    }

    const profile = await getLevelProfile(
      interaction.guildId,
      userId
    );

    profile.xp += amount;

    let levelsGained = 0;

    while (
      profile.xp >= getRequiredXp(profile.level)
    ) {
      profile.xp -= getRequiredXp(profile.level);
      profile.level++;
      levelsGained++;
    }

    await profile.save();

    await interaction.reply({
      content:
        `✅ Đã cộng **${amount} XP** cho <@${userId}>.\n\n` +
        `⭐ Level: **${profile.level}**\n` +
        `✨ XP: **${profile.xp} / ${getRequiredXp(profile.level)}**` +
        (levelsGained > 0
          ? `\n🎉 Tăng **${levelsGained} Level**!`
          : ""),
      flags: MessageFlags.Ephemeral
    });
  }
};