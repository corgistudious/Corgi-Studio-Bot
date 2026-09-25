const {SlashCommandBuilder}=require('discord.js');
const F=require('../../modules/frontier');
const {guildLang}=require('../../services/i18n');
module.exports={data:new SlashCommandBuilder().setName('explore').setDescription('Explore the current Frontier region').setDescriptionLocalizations({vi:'Khám phá khu vực Frontier hiện tại'}),prefix:["explore"],async execute(i){const l=await guildLang(i.guildId);return i.reply(await F.actions.explore(i.user.id,l));},async executePrefix(m){const l=await guildLang(m.guildId);return m.reply(await F.actions.explore(m.author.id,l));}};
