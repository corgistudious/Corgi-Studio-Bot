const {SlashCommandBuilder}=require('discord.js');
const F=require('../../modules/frontier');
const {guildLang}=require('../../services/i18n');
module.exports={data:new SlashCommandBuilder().setName('world').setDescription('Contribute to the permanent Frontier World Project').setDescriptionLocalizations({vi:'Đóng góp Dự Án Thế Giới Frontier vĩnh viễn'}),prefix:["world"],async execute(i){const l=await guildLang(i.guildId);return i.reply(await F.actions.world(i.user.id,l));},async executePrefix(m){const l=await guildLang(m.guildId);return m.reply(await F.actions.world(m.author.id,l));}};
