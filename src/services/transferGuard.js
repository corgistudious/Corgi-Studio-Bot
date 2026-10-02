const TransferLedger=require('../models/TransferLedger');
const UserProgress=require('../models/UserProgress');
const SocialProfile=require('../models/SocialProfile');
const UserEconomy=require('../models/UserEconomy');
const {ensureWallet,walletFilter}=require('./economyWallet');
const {parseMoney}=require('./numberFormat');
const DAY=86400000;
const POLICY={discordAgeDays:7,profileAgeDays:3,minLevel:3,minMessages:15,cooldownMs:60000,dailySendCap:2500000,dailyReceiveCap:5000000,dailyRecipients:5,receivedLockMs:6*3600000};
function since(ms=DAY){return new Date(Date.now()-ms)}
async function stats(uid){const [p,s]=await Promise.all([UserProgress.findOne({userId:String(uid)}).lean(),SocialProfile.findOne({userId:String(uid)}).lean()]);return{p,s};}
async function check({fromUser,toUser,amount}){
 amount=parseMoney(amount,{min:1});if(!Number.isFinite(amount)||amount<=0)return{ok:false,code:'INVALID_AMOUNT'};
 if(!fromUser||!toUser||fromUser.id===toUser.id||toUser.bot)return{ok:false,code:'INVALID_RECEIVER'};
 const now=Date.now();if(now-fromUser.createdTimestamp<POLICY.discordAgeDays*DAY||now-toUser.createdTimestamp<POLICY.discordAgeDays*DAY)return{ok:false,code:'ACCOUNT_TOO_NEW'};
 const [{p,s}]=await Promise.all([stats(fromUser.id)]);const born=new Date(p?.createdAt||s?.createdAt||now).getTime();
 if(!p||p.level<POLICY.minLevel||(p.totalMessages||0)<POLICY.minMessages||now-born<POLICY.profileAgeDays*DAY)return{ok:false,code:'PROGRESSION_REQUIRED'};
 const recent=await TransferLedger.find({fromId:fromUser.id,createdAt:{$gte:since()},status:'COMPLETED'}).lean();
 const sent=recent.reduce((n,x)=>n+x.amount,0);if(sent+amount>POLICY.dailySendCap)return{ok:false,code:'SEND_CAP'};
 if(new Set(recent.map(x=>x.toId).concat(toUser.id)).size>POLICY.dailyRecipients)return{ok:false,code:'RECIPIENT_CAP'};
 const last=recent[0];if(last&&now-new Date(last.createdAt).getTime()<POLICY.cooldownMs)return{ok:false,code:'COOLDOWN'};
 const received=await TransferLedger.find({toId:toUser.id,createdAt:{$gte:since()},status:'COMPLETED'}).lean();if(received.reduce((n,x)=>n+x.amount,0)+amount>POLICY.dailyReceiveCap)return{ok:false,code:'RECEIVE_CAP'};
 const freshIncoming=await TransferLedger.findOne({toId:fromUser.id,createdAt:{$gte:since(POLICY.receivedLockMs)},status:'COMPLETED'}).lean();if(freshIncoming)return{ok:false,code:'RECEIVED_LOCK'};
 return{ok:true,amount};
}
async function execute({fromUser,toUser,amount}){const gate=await check({fromUser,toUser,amount});if(!gate.ok)return gate;await Promise.all([ensureWallet(fromUser.id),ensureWallet(toUser.id)]);const from=await UserEconomy.findOneAndUpdate({...walletFilter(fromUser.id),cstar:{$gte:gate.amount}},{$inc:{cstar:-gate.amount}},{returnDocument:'after'});if(!from)return{ok:false,code:'INSUFFICIENT'};try{await UserEconomy.updateOne(walletFilter(toUser.id),{$inc:{cstar:gate.amount}});await TransferLedger.create({fromId:fromUser.id,toId:toUser.id,amount:gate.amount});return{ok:true,amount:gate.amount};}catch(e){await UserEconomy.updateOne(walletFilter(fromUser.id),{$inc:{cstar:gate.amount}}).catch(()=>{});throw e;}}
module.exports={POLICY,check,execute};
