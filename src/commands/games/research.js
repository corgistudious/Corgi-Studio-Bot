const {SlashCommandBuilder}=require('discord.js');
const F=require('../../modules/frontier');
const {guildLang}=require('../../services/i18n');
module.exports={data:new SlashCommandBuilder().setName('research').setDescription('Research Frontier artifacts and lore').setDescriptionLocalizations({vi:'Nghiên cứu cổ vật và lore Frontier'}),prefix:["research"],async execute(i){const l=await guildLang(i.guildId);return i.reply(await F.actions.research(i.user.id,l));},async executePrefix(m){const l=await guildLang(m.guildId);return m.reply(await F.actions.research(m.author.id,l));}};
