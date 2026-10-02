const {SlashCommandBuilder}=require('discord.js');
const {ensureWallet}=require('../../services/economyWallet');
const {guildLang,mtx}=require('../../services/i18n');
const {compactNumber}=require('../../services/numberFormat');
async function row(userId){return ensureWallet(userId);}
module.exports={
  data:new SlashCommandBuilder().setName('balance').setDescription('View your global CXu balance').setDescriptionLocalizations({vi:'Xem ví CXu liên server'}),
  prefix:['balance','bal'],
  async execute(i){const lang=await guildLang(i.guildId),u=i.options?.getUser?.('user')||i.user,x=await row(u.id);return i.reply(mtx(lang,`⭐ ${u}'s global balance: **${compactNumber(x.cstar)} <:cxu_coin:1551759873241251912> CXu**.`,`⭐ Ví liên server của ${u}: **${compactNumber(x.cstar)} <:cxu_coin:1551759873241251912> CXu**.`));},
  async executePrefix(m){const lang=await guildLang(m.guildId),u=m.mentions.users.first()||m.author,x=await row(u.id);return m.reply(mtx(lang,`⭐ ${u}'s global balance: **${compactNumber(x.cstar)} <:cxu_coin:1551759873241251912> CXu**.`,`⭐ Ví liên server của ${u}: **${compactNumber(x.cstar)} <:cxu_coin:1551759873241251912> CXu**.`));}
};
