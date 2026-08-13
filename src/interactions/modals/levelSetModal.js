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
  customId: "level_set_modal",

  async execute(interaction) {
    if (!isDeveloper(interaction.user.id)) {
      return interaction.reply({
        content: "🔒 **Developer Only**",
        flags: MessageFlags.Ephemeral
      });
    }

    const userId = getXpTargetId(
      interaction.customId,
      "level_set_modal_"
    );

    const newLevel = Number(
      interaction.fields.getTextInputValue("level")
    );

    if (
      !userId ||
      !Number.isInteger(newLevel) ||
      newLevel < 0 ||
      newLevel > 10000
    ) {
      return interaction.reply({
        content:
          "❌ Level phải là số nguyên từ **0 - 10000**.",
        flags: MessageFlags.Ephemeral
      });
    }

    const profile = await getLevelProfile(
      interaction.guildId,
      userId
    );

    profile.level = newLevel;

    // Khi đặt Level thủ công,
    // XP của level hiện tại trở về 0.
    profile.xp = 0;

    await profile.save();

    await interaction.reply({
      content:
        `⭐ Đã đặt Level của <@${userId}> thành **${newLevel}**.\n\n` +
        `✨ XP: **0 / ${getRequiredXp(newLevel)}**`,
      flags: MessageFlags.Ephemeral
    });

    console.log(
      `🔐 ${interaction.user.tag} đặt Level ${newLevel} cho ${userId}`
    );
  }
};