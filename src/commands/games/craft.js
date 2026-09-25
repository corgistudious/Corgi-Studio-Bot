const {SlashCommandBuilder}=require('discord.js');
const F=require('../../modules/frontier');
const {guildLang}=require('../../services/i18n');
module.exports={data:new SlashCommandBuilder().setName('craft').setDescription('Craft supplies for your Frontier journey').setDescriptionLocalizations({vi:'Chế tạo tiếp tế cho hành trình Frontier'}),prefix:["craft"],async execute(i){const l=await guildLang(i.guildId);return i.reply(await F.actions.craft(i.user.id,l));},async executePrefix(m){const l=await guildLang(m.guildId);return m.reply(await F.actions.craft(m.author.id,l));}};
