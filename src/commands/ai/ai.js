const {SlashCommandBuilder}=require('discord.js');
const {askAI}=require('../../services/ai');
const {guildLang,pick}=require('../../services/i18n');
module.exports={
 data:new SlashCommandBuilder().setName('ai').setDescription('Ask Corgi AI anything • Free').setDescriptionLocalizations({vi:'Hỏi Corgi AI bất kỳ điều gì • Miễn phí'}).addStringOption(o=>o.setName('question').setDescription('Your question or request').setDescriptionLocalizations({vi:'Câu hỏi hoặc yêu cầu của bạn'}).setMaxLength(1500).setRequired(true)),
 prefix:['ai'],
 async execute(i){const lang=await guildLang(i.guildId);await i.deferReply();try{const a=await askAI(i.options.getString('question'),{language:lang});return i.editReply(a.slice(0,1900));}catch(e){return i.editReply(pick(lang,`🤖 AI is unavailable: ${e.message}`,`🤖 AI hiện không khả dụng: ${e.message}`));}},
 async executePrefix(m,args){const lang=await guildLang(m.guildId);const q=args.join(' ');if(!q)return m.reply(pick(lang,'Usage: `?ai <question>`','Cách dùng: `?ai <câu hỏi>`'));try{return m.reply((await askAI(q,{language:lang})).slice(0,1900));}catch(e){return m.reply(pick(lang,`AI unavailable: ${e.message}`,`AI hiện không khả dụng: ${e.message}`));}}
};
