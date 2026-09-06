const { PermissionFlagsBits } = require('discord.js');
const Warning = require('../../models/Warning');
const { sendLog } = require('../../services/log');

function parseUserId(raw='') { return raw.replace(/[<@!>]/g, ''); }
async function memberFromPrefix(m, raw) {
  const id = parseUserId(raw);
  if (!id) return null;
  return m.guild.members.fetch(id).catch(() => null);
}
function reason(args, start=1) { return args.slice(start).join(' ') || 'No reason provided'; }
async function warn(guild, user, moderator, why) {
  await Warning.create({guildId:guild.id,userId:user.id,moderatorId:moderator.id,reason:why});
  await user.send(`⚠️ You were warned in **${guild.name}**: ${why}`).catch(()=>{});
  await sendLog(guild,{title:'⚠️ Member Warned',description:`${user} • ${why}\nModerator: ${moderator}`});
}
module.exports={PermissionFlagsBits,Warning,sendLog,memberFromPrefix,reason,warn};
