const { Events }=require('discord.js');
const { getGuildSettings }=require('../services/guildSettings');
const { checkAccess }=require('../services/accessControl');
const { isPremiumGuild }=require('../services/premium');
module.exports={name:Events.MessageCreate,async execute(message,client){if(message.author.bot||!message.guild)return;const s=await getGuildSettings(message.guildId);const p=s.prefix||'?';if(!message.content.startsWith(p))return;const parts=message.content.slice(p.length).trim().split(/\s+/);const name=(parts.shift()||'').toLowerCase();const c=client.prefixCommands.get(name);if(!c?.executePrefix)return;const access=await checkAccess({userId:message.author.id,guildId:message.guildId});if(!access.allowed)return message.reply(access.message).catch(()=>{});
// Prefix commands do not receive Discord's slash-command permission filtering,
// so mirror each command's default_member_permissions here.
const required=c.data?.toJSON?.().default_member_permissions;
if(required&&!message.member?.permissions?.has(BigInt(required)))return message.reply('❌ You do not have the required Discord permission for this command.').catch(()=>{});
if(c.premiumOnly&&!(await isPremiumGuild(message.guildId)))return message.reply('💎 This command requires active Corgi Premium for this server.');try{await c.executePrefix(message,parts,client);}catch(e){console.error(e);await message.reply('Command error.');}}};
