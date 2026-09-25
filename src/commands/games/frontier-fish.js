const {SlashCommandBuilder}=require('discord.js');
const F=require('../../modules/frontier');
const {guildLang}=require('../../services/i18n');
module.exports={data:new SlashCommandBuilder().setName('frontier-fish').setDescription('Fish in your current Frontier region').setDescriptionLocalizations({vi:'Câu cá tại khu vực Frontier hiện tại'}),prefix:["frontierfish", "ffish"],async execute(i){const l=await guildLang(i.guildId);return i.reply(await F.actions.fish(i.user.id,l));},async executePrefix(m){const l=await guildLang(m.guildId);return m.reply(await F.actions.fish(m.author.id,l));}};
