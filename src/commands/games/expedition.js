const {SlashCommandBuilder}=require('discord.js');
const F=require('../../modules/frontier');
const {guildLang}=require('../../services/i18n');
module.exports={data:new SlashCommandBuilder().setName('expedition').setDescription('Launch or claim a Frontier expedition').setDescriptionLocalizations({vi:'Khởi hành hoặc nhận kết quả viễn chinh Frontier'}),prefix:["expedition"],async execute(i){const l=await guildLang(i.guildId);return i.reply(await F.actions.expedition(i.user.id,l));},async executePrefix(m){const l=await guildLang(m.guildId);return m.reply(await F.actions.expedition(m.author.id,l));}};
