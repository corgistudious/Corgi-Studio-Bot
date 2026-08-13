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
  customId: "xp_remove_modal",

  async execute(interaction) {
    if (!isDeveloper(interaction.user.id)) {
      return interaction.reply({
        content: "🔒 **Developer Only**",
        flags: MessageFlags.Ephemeral
      });
    }

    const userId = getXpTargetId(
      interaction.customId,
      "xp_remove_modal_"
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

    profile.xp = Math.max(
      0,
      profile.xp - amount
    );

    await profile.save();

    await interaction.reply({
      content:
        `➖ Đã trừ **${amount} XP** của <@${userId}>.\n\n` +
        `⭐ Level: **${profile.level}**\n` +
        `✨ XP: **${profile.xp} / ${getRequiredXp(profile.level)}**`,
      flags: MessageFlags.Ephemeral
    });
  }
};