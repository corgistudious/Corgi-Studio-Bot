const CustomTitle = require('../models/CustomTitle');
const UserProgress = require('../models/UserProgress');
const Progression = require('./progression');

function normKey(v='') { return String(v).trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,32); }
async function list(limit=20){ return CustomTitle.find({}).sort({createdAt:-1}).limit(limit).lean(); }
async function get(key){ return CustomTitle.findOne({key:normKey(key)}); }
async function create({key,name,emoji,description,durationDays,actorId}){
  key=normKey(key); if(!key) throw new Error('Title key is required (A-Z, 0-9, _ or -).');
  name=String(name||'').trim(); if(!name) throw new Error('Title name is required.');
  const days=Math.max(0,Math.min(36500,Math.floor(Number(durationDays)||0)));
  return CustomTitle.create({key,name,emoji:String(emoji||'🏷️').trim()||'🏷️',description:String(description||'').trim(),durationDays:days,createdBy:String(actorId)});
}
async function toggle(key,actorId){ const t=await get(key); if(!t) throw new Error('Custom title not found.'); t.enabled=!t.enabled;t.updatedBy=String(actorId);await t.save();return t; }
async function grant(userId,key,actorId){
  const t=await get(key); if(!t||!t.enabled) throw new Error('Custom title not found or disabled.');
  const p=await Progression.ensureProgress(String(userId)); const now=new Date();
  const expiresAt=t.durationDays>0?new Date(now.getTime()+t.durationDays*86400000):undefined;
  const old=p.customTitles.find(x=>x.titleKey===t.key);
  if(old){old.grantedAt=now;old.expiresAt=expiresAt;old.grantedBy=String(actorId);}else p.customTitles.push({titleKey:t.key,grantedAt:now,expiresAt,grantedBy:String(actorId)});
  p.activeCustomTitleKey=t.key; await p.save(); return {profile:p,title:t,expiresAt};
}
async function revoke(userId,key){
  key=normKey(key); const p=await Progression.ensureProgress(String(userId));
  p.customTitles=p.customTitles.filter(x=>x.titleKey!==key); if(p.activeCustomTitleKey===key)p.activeCustomTitleKey=''; await p.save(); return p;
}
async function resolveActive(profile){
  if(!profile?.activeCustomTitleKey)return null; const now=new Date();
  const grant=profile.customTitles.find(x=>x.titleKey===profile.activeCustomTitleKey);
  if(!grant || (grant.expiresAt&&grant.expiresAt<=now)){profile.activeCustomTitleKey=''; if(grant)profile.customTitles=profile.customTitles.filter(x=>x.titleKey!==grant.titleKey);await profile.save();return null;}
  const title=await CustomTitle.findOne({key:grant.titleKey,enabled:true}).lean(); if(!title){profile.activeCustomTitleKey='';await profile.save();return null;}
  return {title,grant};
}
module.exports={normKey,list,get,create,toggle,grant,revoke,resolveActive};
