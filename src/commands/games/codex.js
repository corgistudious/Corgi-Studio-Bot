const {SlashCommandBuilder}=require('discord.js');
const F=require('../../modules/frontier');
const {guildLang}=require('../../services/i18n');
module.exports={data:new SlashCommandBuilder().setName('codex').setDescription('Open your Frontier Codex').setDescriptionLocalizations({vi:'Mở Frontier Codex của bạn'}),prefix:["codex"],async execute(i){const l=await guildLang(i.guildId);return i.reply(await F.actions.codex(i.user.id,l));},async executePrefix(m){const l=await guildLang(m.guildId);return m.reply(await F.actions.codex(m.author.id,l));}};
