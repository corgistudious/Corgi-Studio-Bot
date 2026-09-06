const {SlashCommandBuilder}=require('discord.js');
const {PermissionFlagsBits,sendLog}=require('./_shared');
const {guildLang,pick}=require('../../services/i18n');
async function clearMessages(channel,amount){return channel.bulkDelete(amount,true);}
module.exports={
 data:new SlashCommandBuilder().setName('clear').setDescription('Delete recent messages').setDescriptionLocalizations({vi:'Xóa tin nhắn gần đây'}).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addIntegerOption(o=>o.setName('amount').setDescription('Number of messages 1-100').setDescriptionLocalizations({vi:'Số tin nhắn từ 1-100'}).setRequired(true).setMinValue(1).setMaxValue(100)),
 prefix:['clear','xoa'],
 async execute(i){const lang=await guildLang(i.guildId);const amount=i.options.getInteger('amount');const deleted=await clearMessages(i.channel,amount);await sendLog(i.guild,{title:pick(lang,'🧹 Messages Cleared','🧹 Đã xóa tin nhắn'),description:pick(lang,`${deleted.size} messages in ${i.channel} by ${i.user}`,`${deleted.size} tin nhắn tại ${i.channel} bởi ${i.user}`)});return i.reply({content:pick(lang,`✅ Deleted **${deleted.size}** messages.`,`✅ Đã xóa **${deleted.size}** tin nhắn.`),flags:64});},
 async executePrefix(m,args){const lang=await guildLang(m.guildId);const amount=Number(args[0]);if(!Number.isInteger(amount)||amount<1||amount>100)return m.reply(pick(lang,'Usage: `?clear 1-100`','Cách dùng: `?clear 1-100`'));const deleted=await clearMessages(m.channel,amount);await sendLog(m.guild,{title:pick(lang,'🧹 Messages Cleared','🧹 Đã xóa tin nhắn'),description:pick(lang,`${deleted.size} messages in ${m.channel} by ${m.author}`,`${deleted.size} tin nhắn tại ${m.channel} bởi ${m.author}`)});return m.reply(pick(lang,`✅ Deleted **${deleted.size}** messages.`,`✅ Đã xóa **${deleted.size}** tin nhắn.`));}
};
