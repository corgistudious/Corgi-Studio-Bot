const {SlashCommandBuilder}=require('discord.js');
const F=require('../../modules/frontier');
const {guildLang}=require('../../services/i18n');
module.exports={data:new SlashCommandBuilder().setName('creature').setDescription('Train your best Frontier creature').setDescriptionLocalizations({vi:'Huấn luyện sinh vật Frontier tốt nhất'}),prefix:["creature"],async execute(i){const l=await guildLang(i.guildId);return i.reply(await F.actions.creature(i.user.id,l));},async executePrefix(m){const l=await guildLang(m.guildId);return m.reply(await F.actions.creature(m.author.id,l));}};
