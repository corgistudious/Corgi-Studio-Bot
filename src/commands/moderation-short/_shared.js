const { PermissionFlagsBits } = require('discord.js');
const Warning = require('../../models/Warning');
const { sendLog } = require('../../services/log');
const { guildLang, pick } = require('../../services/i18n');
function parseUserId(raw='') { return raw.replace(/[<@!>]/g, ''); }
async function memberFromPrefix(m, raw) { const id=parseUserId(raw); if(!id)return null; return m.guild.members.fetch(id).catch(()=>null); }
function reason(args,start=1,fallback='No reason provided'){return args.slice(start).join(' ')||fallback;}
async function warn(guild,user,moderator,why){const lang=await guildLang(guild.id);await Warning.create({guildId:guild.id,userId:user.id,moderatorId:moderator.id,reason:why});await user.send(pick(lang,`⚠️ You were warned in **${guild.name}**: ${why}`,`⚠️ Bạn đã bị cảnh cáo tại **${guild.name}**: ${why}`)).catch(()=>{});await sendLog(guild,{title:pick(lang,'⚠️ Member Warned','⚠️ Thành viên bị cảnh cáo'),description:pick(lang,`${user} • ${why}\nModerator: ${moderator}`,`${user} • ${why}\nNgười kiểm duyệt: ${moderator}`)});}
module.exports={PermissionFlagsBits,Warning,sendLog,memberFromPrefix,reason,warn,guildLang,pick};
