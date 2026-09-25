const {SlashCommandBuilder}=require('discord.js');
const F=require('../../modules/frontier');
const {guildLang}=require('../../services/i18n');
module.exports={data:new SlashCommandBuilder().setName('base').setDescription('Build and upgrade your Frontier base').setDescriptionLocalizations({vi:'Xây dựng và nâng cấp căn cứ Frontier'}),prefix:["base"],async execute(i){const l=await guildLang(i.guildId);return i.reply(await F.actions.base(i.user.id,l));},async executePrefix(m){const l=await guildLang(m.guildId);return m.reply(await F.actions.base(m.author.id,l));}};
