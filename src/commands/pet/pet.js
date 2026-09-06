const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function comingSoonEmbed() {
  return new EmbedBuilder()
    .setTitle('🐾 Pet Game • Coming Soon')
    .setDescription(`Pet Game is temporarily unavailable and is planned for a future Corgi-Bot update.

No Cstar will be charged and no Pet data will be changed while this feature is locked.`)
    .setFooter({ text: 'Corgi Studio • Coming Soon' })
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pet')
    .setDescription('Pet Game • Coming Soon'),
  prefix: ['pet'],
  async execute(i) {
    return i.reply({ embeds: [comingSoonEmbed()], flags: 64 });
  },
  async executePrefix(m) {
    return m.reply({ embeds: [comingSoonEmbed()] });
  },
};
