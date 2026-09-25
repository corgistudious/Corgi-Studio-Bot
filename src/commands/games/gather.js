const {SlashCommandBuilder}=require('discord.js');
const F=require('../../modules/frontier');
const {guildLang}=require('../../services/i18n');
module.exports={data:new SlashCommandBuilder().setName('gather').setDescription('Gather resources in your Frontier region').setDescriptionLocalizations({vi:'Thu thập tài nguyên tại Frontier'}),prefix:["gather"],async execute(i){const l=await guildLang(i.guildId);return i.reply(await F.actions.gather(i.user.id,l));},async executePrefix(m){const l=await guildLang(m.guildId);return m.reply(await F.actions.gather(m.author.id,l));}};
