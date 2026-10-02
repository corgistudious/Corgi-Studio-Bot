const {SlashCommandBuilder}=require('discord.js');
const Hub=require('../../modules/gameHub');
const {guildLang}=require('../../services/i18n');
module.exports={data:new SlashCommandBuilder().setName('game').setDescription('Open Corgi Game Hub').setDescriptionLocalizations({vi:'Mở Corgi Game Hub'}),prefix:['game'],async execute(i){if(!i.deferred&&!i.replied)await i.deferReply();const l=await guildLang(i.guildId);return i.editReply(Hub.home(i.user.id,l));},async executePrefix(m){const l=await guildLang(m.guildId);return m.reply(Hub.home(m.author.id,l));}};
