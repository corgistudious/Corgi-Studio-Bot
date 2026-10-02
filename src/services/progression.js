const UserProgress = require('../models/UserProgress');
const DeveloperSettings = require('../models/DeveloperSettings');
const UserEconomy = require('../models/UserEconomy');
const { ensureWallet, walletFilter } = require('./economyWallet');

const TITLE_RULES = [];

async function settings(){
  return DeveloperSettings.findOneAndUpdate({key:'global'},{$setOnInsert:{key:'global'}},{upsert:true,returnDocument:'after',setDefaultsOnInsert:true});
}
function weekInfo(date=new Date()){
  const d=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));
  const day=(d.getUTCDay()+6)%7;
  const start=new Date(d);start.setUTCDate(d.getUTCDate()-day);start.setUTCHours(0,0,0,0);
  const end=new Date(start.getTime()+7*86400000);
  const jan4=new Date(Date.UTC(start.getUTCFullYear(),0,4));
  const jan4day=(jan4.getUTCDay()+6)%7;
  const week1=new Date(jan4);week1.setUTCDate(jan4.getUTCDate()-jan4day);week1.setUTCHours(0,0,0,0);
  const week=Math.floor((start-week1)/(7*86400000))+1;
  return {key:`${start.getUTCFullYear()}-W${String(week).padStart(2,'0')}`,start,end};
}
function xpNeeded(level,cfg){
  if(level>=cfg.maxLevel)return 0;
  return Math.max(1,Math.floor(cfg.curveBase*Math.pow(1+level/cfg.curveDivisor,cfg.curvePower)));
}
async function ensureProgress(userId){
  return UserProgress.findOneAndUpdate({userId:String(userId)},{$setOnInsert:{userId:String(userId)}},{upsert:true,returnDocument:'after',setDefaultsOnInsert:true});
}
async function awardMessageXp(userId,multiplier=1){
  const cfg=(await settings()).progression;
  const p=await ensureProgress(userId);
  const now=new Date();
  if(p.lastXpAt && now-p.lastXpAt < Math.max(5,cfg.cooldownSeconds)*1000)return {awarded:0,profile:p};
  if(p.level>=cfg.maxLevel)return {awarded:0,profile:p};
  const min=Math.max(1,Math.floor(cfg.xpMin));const max=Math.max(min,Math.floor(cfg.xpMax));
  const baseGained=Math.floor(Math.random()*(max-min+1))+min;
  const gained=baseGained*Math.max(1,Math.min(5,Math.floor(Number(multiplier)||1)));
  p.xp+=gained;p.totalXp+=gained;p.totalMessages+=1;p.lastXpAt=now;
  let leveled=0;
  while(p.level<cfg.maxLevel){const need=xpNeeded(p.level,cfg);if(p.xp<need)break;p.xp-=need;p.level+=1;leveled+=1;}
  if(p.level>=cfg.maxLevel)p.xp=0;
  await p.save();
  return {awarded:gained,leveled,profile:p};
}
async function ranks(userId){
  const uid=String(userId),p=await ensureProgress(uid),wallet=await ensureWallet(uid);
  const [globalAhead,wealthAhead]=await Promise.all([
    UserProgress.countDocuments({$or:[{totalXp:{$gt:p.totalXp}},{totalXp:p.totalXp,userId:{$lt:uid}}]}),
    UserEconomy.countDocuments({guildId:'__GLOBAL__',$or:[{cstar:{$gt:wallet.cstar}},{cstar:wallet.cstar,userId:{$lt:uid}}]})
  ]);
  return {globalRank:globalAhead+1,weeklyRank:null,weeklyXp:0,wealthRank:wealthAhead+1};
}
async function leaderboard(kind='global',limit=10){
  limit=Math.max(1,Math.min(100,Number(limit)||10));
  return UserProgress.find({}).sort({totalXp:-1,userId:1}).limit(limit).lean();
}
async function setUserLevelXp(userId,level,xp){
  const cfg=(await settings()).progression;
  level=Math.max(1,Math.min(cfg.maxLevel,Math.floor(Number(level)||1)));
  const need=xpNeeded(level,cfg);
  xp=level>=cfg.maxLevel?0:Math.max(0,Math.min(Math.max(0,need-1),Math.floor(Number(xp)||0)));
  let total=xp;
  for(let l=1;l<level;l++)total+=xpNeeded(l,cfg);
  return UserProgress.findOneAndUpdate({userId:String(userId)},{$set:{level,xp,totalXp:total},$setOnInsert:{userId:String(userId)}},{upsert:true,returnDocument:'after',setDefaultsOnInsert:true});
}
async function updateProgressionConfig(patch){
  const s=await settings();const current=typeof s.progression?.toObject==='function'?s.progression.toObject():s.progression;const next={...(current||{}),...patch};
  next.xpMin=Math.max(1,Math.min(100000,Math.floor(Number(next.xpMin)||15)));next.xpMax=Math.max(next.xpMin,Math.min(100000,Math.floor(Number(next.xpMax)||25)));
  next.cooldownSeconds=Math.max(5,Math.min(3600,Math.floor(Number(next.cooldownSeconds)||60)));next.maxLevel=Math.max(100,Math.min(100000,Math.floor(Number(next.maxLevel)||100000)));
  next.curveBase=Math.max(10,Math.min(1000000,Number(next.curveBase)||250));next.curveDivisor=Math.max(1,Math.min(100000,Number(next.curveDivisor)||10));next.curvePower=Math.max(1.01,Math.min(3,Number(next.curvePower)||1.35));
  return DeveloperSettings.findOneAndUpdate({key:'global'},{$set:{progression:next}},{returnDocument:'after'});
}



async function clearExpiredTitle(p){if(p.activeTitle&&p.activeTitleExpiresAt&&p.activeTitleExpiresAt<=new Date()){p.activeTitle='';p.activeTitleExpiresAt=null;await p.save();}return p;}
module.exports={TITLE_RULES,settings,weekInfo,xpNeeded,ensureProgress,awardMessageXp,ranks,leaderboard,setUserLevelXp,updateProgressionConfig,clearExpiredTitle};
