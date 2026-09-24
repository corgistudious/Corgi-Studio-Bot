const { SlashCommandBuilder } = require('discord.js');
const { isAuthorizedDeveloper } = require('../../services/permissions');
const UI = require('../../ui/dev');

module.exports = {
  data: new SlashCommandBuilder().setName('dev').setDescription('Open Developer Control Center'),
  prefix: ['dev'],
  async execute(interaction, client) {
    await interaction.deferReply({ flags: 64 });
    if (!(await isAuthorizedDeveloper(interaction.user.id))) return interaction.editReply({ content: 'Developer access only.' });
    return interaction.editReply(await UI.home(client));
  },
  async executePrefix(message) {
    if (!(await isAuthorizedDeveloper(message.author.id))) return message.reply('Developer access only.');
    return message.reply('🛠️ Developer Control Center is interactive. Use `/dev`.');
  }
};
