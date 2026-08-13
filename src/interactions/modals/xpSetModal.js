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
  customId: "xp_set_modal",

  async execute(interaction) {
    if (!isDeveloper(interaction.user.id)) {
      return interaction.reply({
        content: "🔒 **Developer Only**",
        flags: MessageFlags.Ephemeral
      });
    }

    const userId = getXpTargetId(
      interaction.customId,
      "xp_set_modal_"
    );

    const amount = Number(
      interaction.fields.getTextInputValue("amount")
    );

    if (
      !userId ||
      !Number.isInteger(amount) ||
      amount < 0
    ) {
      return interaction.reply({
        content: "❌ XP phải là số nguyên từ **0** trở lên.",
        flags: MessageFlags.Ephemeral
      });
    }

    const profile = await getLevelProfile(
      interaction.guildId,
      userId
    );

    profile.xp = amount;

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
        `✨ Đã đặt XP của <@${userId}>.\n\n` +
        `⭐ Level: **${profile.level}**\n` +
        `✨ XP: **${profile.xp} / ${getRequiredXp(profile.level)}**` +
        (levelsGained > 0
          ? `\n🎉 Tăng **${levelsGained} Level**.`
          : ""),
      flags: MessageFlags.Ephemeral
    });
  }
};