const { SlashCommandBuilder } = require('discord.js');
const UserEconomy = require('../../models/UserEconomy');
module.exports = {
  data: new SlashCommandBuilder().setName('balance').setDescription('View your Cstar balance'),
  prefix: ['balance','bal'],
  async execute(interaction) {
    const row = await UserEconomy.findOneAndUpdate({ guildId:interaction.guildId,userId:interaction.user.id },{$setOnInsert:{guildId:interaction.guildId,userId:interaction.user.id}},{upsert:true,returnDocument:'after'});
    return interaction.reply(`⭐ You have **${row.cstar} Cstar**.`);
  },
  async executePrefix(message) {
    const row = await UserEconomy.findOneAndUpdate({ guildId:message.guildId,userId:message.author.id },{$setOnInsert:{guildId:message.guildId,userId:message.author.id}},{upsert:true,returnDocument:'after'});
    return message.reply(`⭐ You have **${row.cstar} Cstar**.`);
  }
};
