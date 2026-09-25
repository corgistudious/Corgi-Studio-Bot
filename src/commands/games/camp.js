const {SlashCommandBuilder}=require('discord.js');
const F=require('../../modules/frontier');
const {guildLang}=require('../../services/i18n');
module.exports={data:new SlashCommandBuilder().setName('camp').setDescription('Camp and restore Frontier energy').setDescriptionLocalizations({vi:'Cắm trại và hồi năng lượng Frontier'}),prefix:["camp"],async execute(i){const l=await guildLang(i.guildId);return i.reply(await F.actions.camp(i.user.id,l));},async executePrefix(m){const l=await guildLang(m.guildId);return m.reply(await F.actions.camp(m.author.id,l));}};
