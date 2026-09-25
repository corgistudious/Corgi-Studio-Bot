const {SlashCommandBuilder}=require('discord.js');
const F=require('../../modules/frontier');
const {guildLang}=require('../../services/i18n');
module.exports={data:new SlashCommandBuilder().setName('travel').setDescription('Travel to your next unlocked Frontier region').setDescriptionLocalizations({vi:'Di chuyển tới khu vực Frontier đã mở'}),prefix:["travel"],async execute(i){const l=await guildLang(i.guildId);return i.reply(await F.actions.travel(i.user.id,l));},async executePrefix(m){const l=await guildLang(m.guildId);return m.reply(await F.actions.travel(m.author.id,l));}};
