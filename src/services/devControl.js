const crypto = require('crypto');
const mongoose = require('mongoose');
const Premium = require('../models/Premium');
const RedeemKey = require('../models/RedeemKey');
const UserEconomy = require('../models/UserEconomy');
const { ensureWallet, walletFilter, GLOBAL_WALLET_SCOPE } = require('./economyWallet');
const DeveloperSettings = require('../models/DeveloperSettings');
const { grantPremium, revokePremium: revokePremiumService, recentPremiumHistory, DURATIONS } = require('./premium');
const Progression = require('./progression');
const { invalidateAccessCache } = require('./accessControl');

async function getDevSettings() { return DeveloperSettings.findOneAndUpdate({ key: 'global' }, { $setOnInsert: { key: 'global' } }, { upsert: true, returnDocument: 'after' }); }
async function getSystemSnapshot(client) {
  const [activePremium,keyCount,economyCount,settings]=await Promise.all([Premium.countDocuments({expiresAt:{$gt:new Date()}}),RedeemKey.countDocuments({}),UserEconomy.countDocuments({guildId:GLOBAL_WALLET_SCOPE}),getDevSettings()]);
  return {guilds:client.guilds.cache.size,users:client.guilds.cache.reduce((n,g)=>n+(g.memberCount||0),0),ping:client.ws.ping,uptime:client.uptime||0,dbState:mongoose.connection.readyState,activePremium,keyCount,economyCount,maintenanceMode:settings.maintenanceMode,blacklistedGuilds:settings.blacklistedGuilds.length,blacklistedUsers:settings.blacklistedUsers.length};
}
function makeKeyCode(prefix='CORGI'){const p=()=>crypto.randomBytes(3).toString('hex').toUpperCase();return `${prefix}-${p()}-${p()}-${p()}`;}
async function createRedeemKey({type,amount,duration,tier,premiumTier='STANDARD',vipDuration,maxUses=1,expiresDays=0,customCode=''}){if(!['CSTAR','PREMIUM','VIP'].includes(type))throw new Error('Invalid key type');if(type==='CSTAR'&&(!Number.isFinite(amount)||amount<=0))throw new Error('🪙 CXu amount must be greater than 0');if(type==='PREMIUM'&&!DURATIONS[duration])throw new Error('Invalid Premium duration');if(type==='VIP'&&(!Progression.VIP_TIERS.includes(tier)||!Progression.VIP_DURATION_MS[vipDuration]))throw new Error('Invalid VIP tier or duration');maxUses=Number(maxUses);if(!Number.isFinite(maxUses)||maxUses<0)maxUses=1;maxUses=maxUses===0?0:Math.max(1,Math.min(100000,Math.floor(maxUses)));const expiresAt=Number(expiresDays)>0?new Date(Date.now()+Number(expiresDays)*86400000):undefined;const requested=String(customCode||'').trim().toUpperCase();if(requested&&!/^[A-Z0-9_-]{3,48}$/.test(requested))throw new Error('Custom CD Key must be 3-48 characters using letters, numbers, - or _.');const payload=code=>({code,type,cstarAmount:type==='CSTAR'?Math.floor(amount):0,premiumDuration:type==='PREMIUM'?duration:undefined,premiumTier:type==='PREMIUM'?'STANDARD':undefined,vipTier:type==='VIP'?tier:undefined,vipDuration:type==='VIP'?vipDuration:undefined,maxUses,expiresAt});if(requested){try{return await RedeemKey.create(payload(requested));}catch(e){if(e?.code===11000)throw new Error('This custom CD Key already exists.');throw e;}}for(let a=0;a<5;a++){const code=makeKeyCode(type==='PREMIUM'?'PREM':type==='VIP'?'VIP':'CSTAR');try{return await RedeemKey.create(payload(code));}catch(e){if(e?.code!==11000)throw e;}}throw new Error('Could not generate a unique key');}
async function listRecentKeys(limit=10){return RedeemKey.find({}).sort({createdAt:-1}).limit(limit).lean();}
async function disableKey(code){return RedeemKey.findOneAndUpdate({code:String(code).trim().toUpperCase()},{$set:{enabled:false}},{returnDocument:'after'});}
async function addPremium(guildId,userId,duration,actorId){return grantPremium(String(guildId),String(userId),duration,{actorId,source:'developer'});}
async function revokePremium(guildId,actorId){return revokePremiumService(String(guildId),{actorId,source:'developer'});}
async function listPremium(limit=10){return Premium.find({expiresAt:{$gt:new Date()}}).sort({expiresAt:1}).limit(limit).lean();}
async function premiumHistory(limit=8){return recentPremiumHistory(null,limit);}
async function adjustCstar(_guildId,userId,delta){userId=String(userId);delta=Math.trunc(Number(delta));if(!Number.isFinite(delta)||delta===0)throw new Error('Amount must be a non-zero integer');await ensureWallet(userId);const d=await UserEconomy.findOne(walletFilter(userId));if(d.cstar+delta<0)throw new Error(`Insufficient 🪙 CXu. Current balance: ${d.cstar}`);d.cstar+=delta;await d.save();return d;}
async function toggleBlacklist(kind,id){if(!['guild','user'].includes(kind))throw new Error('Invalid blacklist type');id=String(id).trim();if(!/^\d{15,25}$/.test(id))throw new Error('Discord ID is invalid');const s=await getDevSettings();const field=kind==='guild'?'blacklistedGuilds':'blacklistedUsers';const exists=s[field].includes(id);await DeveloperSettings.updateOne({key:'global'},exists?{$pull:{[field]:id}}:{$addToSet:{[field]:id}});invalidateAccessCache();return{blocked:!exists,kind,id};}
async function setMaintenance(enabled){const r=await DeveloperSettings.findOneAndUpdate({key:'global'},{$set:{maintenanceMode:Boolean(enabled)}},{upsert:true,returnDocument:'after'});invalidateAccessCache();return r;}
module.exports={getDevSettings,getSystemSnapshot,createRedeemKey,listRecentKeys,disableKey,addPremium,revokePremium,listPremium,premiumHistory,adjustCstar,toggleBlacklist,setMaintenance};
