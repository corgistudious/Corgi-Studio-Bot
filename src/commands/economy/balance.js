const {SlashCommandBuilder}=require('discord.js');
const {ensureWallet}=require('../../services/economyWallet');
const {guildLang,pick}=require('../../services/i18n');
async function row(userId){return ensureWallet(userId);}
module.exports={
  data:new SlashCommandBuilder().setName('balance').setDescription('View your global 🌟Cstar balance').setDescriptionLocalizations({vi:'Xem ví 🌟Cstar liên server'}),
  prefix:['balance','bal'],
  async execute(i){const lang=await guildLang(i.guildId),u=i.options?.getUser?.('user')||i.user,x=await row(u.id);return i.reply(pick(lang,`⭐ ${u}'s global balance: **${x.cstar.toLocaleString()} 🌟Cstar**.`,`⭐ Ví liên server của ${u}: **${x.cstar.toLocaleString()} 🌟Cstar**.`));},
  async executePrefix(m){const lang=await guildLang(m.guildId),u=m.mentions.users.first()||m.author,x=await row(u.id);return m.reply(pick(lang,`⭐ ${u}'s global balance: **${x.cstar.toLocaleString()} 🌟Cstar**.`,`⭐ Ví liên server của ${u}: **${x.cstar.toLocaleString()} 🌟Cstar**.`));}
};
