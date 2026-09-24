const WebRole=require('../models/WebRole');
const ROLES=['member','reviewer','admin','developer'];
const RANK={member:0,reviewer:1,admin:2,developer:3};
function normalize(role){const r=String(role||'').trim().toLowerCase();if(!ROLES.includes(r))throw new Error('INVALID_WEB_ROLE');return r;}
async function get(discordId){const id=String(discordId||'').trim();const row=await WebRole.findOne({discordId:id}).lean();return row?.role||'member';}
async function has(discordId,need='reviewer'){const role=await get(discordId);return RANK[role]>=(RANK[normalize(need)]??1);}
async function set(discordId,role,actorId){const id=String(discordId||'').trim();if(!/^\d{15,25}$/.test(id))throw new Error('INVALID_DISCORD_ID');const next=normalize(role);if(next==='member'){await WebRole.deleteOne({discordId:id});return {discordId:id,role:'member',grantedBy:String(actorId||''),grantedAt:new Date()};}return WebRole.findOneAndUpdate({discordId:id},{$set:{role:next,grantedBy:String(actorId||''),grantedAt:new Date()}},{upsert:true,returnDocument:'after',setDefaultsOnInsert:true}).lean();}
async function list(limit=20){return WebRole.find({role:{$ne:'member'}}).sort({updatedAt:-1}).limit(Math.max(1,Math.min(50,Number(limit)||20))).lean();}
module.exports={ROLES,RANK,get,has,set,list};
