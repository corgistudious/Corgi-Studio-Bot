const { SlashCommandBuilder } = require('discord.js');
const RedeemKey = require('../../models/RedeemKey');
const UserEconomy = require('../../models/UserEconomy');
const { grantPremium, applyPremiumBranding } = require('../../services/premium');
const { sendDeveloperLog } = require('../../services/developerLog');

async function redeem(guildId,userId,raw,client,guild){
  const code=String(raw||'').trim().toUpperCase(); const now=new Date();
  const key=await RedeemKey.findOneAndUpdate({code,enabled:true,uses:{$lt:100000},$expr:{$lt:['$uses','$maxUses']},$or:[{expiresAt:{$exists:false}},{expiresAt:null},{expiresAt:{$gt:now}}],usedBy:{$not:{$elemMatch:{userId:String(userId),guildId:String(guildId)}}}},{$inc:{uses:1},$push:{usedBy:{userId:String(userId),guildId:String(guildId),usedAt:now}}},{returnDocument:'after'});
  if(!key)return {ok:false,msg:'Invalid, expired, disabled, exhausted, or already used key.'};
  try{
    let reward;
    if(key.type==='CSTAR'){
      const u=await UserEconomy.findOneAndUpdate({guildId,userId},{$setOnInsert:{guildId,userId},$inc:{cstar:key.cstarAmount}},{upsert:true,returnDocument:'after'}); reward=`+${key.cstarAmount} Cstar ⭐ • Balance: ${u.cstar}`;
    }else{
      const p=await grantPremium(guildId,userId,key.premiumDuration,{actorId:userId,source:'redeem'}); reward=`Premium ${key.premiumDuration} • active until <t:${Math.floor(p.expiresAt.getTime()/1000)}:F>`; if(guild)await applyPremiumBranding(guild);
    }
    await sendDeveloperLog(client,{title:'🔑 CD Key Redeemed',description:`Guild: ${guildId}\nUser: ${userId}\nKey: ${code}\nReward: ${reward}`});
    return {ok:true,msg:reward};
  }catch(e){
    await RedeemKey.updateOne({_id:key._id},{$inc:{uses:-1},$pull:{usedBy:{userId:String(userId),guildId:String(guildId)}}}).catch(()=>{}); throw e;
  }
}
module.exports={
 data:new SlashCommandBuilder().setName('redeem').setDescription('Redeem a Corgi-Bot CD Key').addStringOption(o=>o.setName('key').setDescription('CD Key').setRequired(true)),prefix:['redeem'],
 async execute(i,client){const r=await redeem(i.guildId,i.user.id,i.options.getString('key'),client,i.guild);return i.reply({content:r.ok?`✅ Redeemed: **${r.msg}**`:`❌ ${r.msg}`,flags:64});},
 async executePrefix(m,args,client){if(!args[0])return m.reply('Usage: `?redeem KEY`');const r=await redeem(m.guildId,m.author.id,args[0],client,m.guild);return m.reply(r.ok?`✅ Redeemed: **${r.msg}**`:`❌ ${r.msg}`);}
};
