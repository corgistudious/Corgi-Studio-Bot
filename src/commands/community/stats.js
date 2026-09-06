const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { getGuildSettings } = require('../../services/guildSettings');
const { ensureStatsBoard } = require('../../modules/stats');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Create/repair the locked voice-channel server stats board')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const me = interaction.guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.editReply('❌ I need **Manage Channels** permission to create the locked voice stats board.');
    }

    const settings = await getGuildSettings(interaction.guildId);
    settings.modules.stats = true;
    await settings.save();

    const result = await ensureStatsBoard(interaction.guild, settings);
    return interaction.editReply(
      `✅ Voice Stats Board is ready in **${result.category.name}**.\n` +
      '🔒 All stat voice channels are locked: members can see them but cannot connect.\n' +
      '⚡ Values are checked every 3 seconds and channel names are only edited when a number changes.'
    );
  },
};
