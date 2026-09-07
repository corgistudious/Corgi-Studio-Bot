const P=require('../services/progression');const UI=require('../services/progressionDev');const Dev=require('../services/devControl');const DeveloperSettings=require('../models/DeveloperSettings');const {sendDeveloperLog}=require('../services/developerLog');
async function handle(i,client){
  if(i.isButton()){
    if(i.customId==='progdev:level:edit')return i.showModal(await UI.levelModal());
    if(i.customId==='progdev:level:advanced')return i.showModal(await UI.advancedLevelModal());
    if(i.customId==='progdev:level:user')return i.showModal(UI.userLevelModal());
    if(i.customId==='progdev:ranking:edit')return i.showModal(await UI.rewardModal());
    if(i.customId==='progdev:ranking:approve'){await i.deferReply({flags:64});try{const b=await P.approveRewards(i.user.id);await sendDeveloperLog(client,{title:'🏆 Weekly Ranking Rewards Approved',description:`Developer: ${i.user.id}\nSeason: ${b.weekKey}\nRecipients: ${b.rewards.length}`});return i.editReply(`✅ **${b.weekKey}** rewards sent automatically to **${b.rewards.length}** ranked member(s). Titles expire 7 days from approval.`);}catch(e){return i.editReply(`❌ ${e.message}`);}}
    if(i.customId==='progdev:vip:key')return i.showModal(UI.vipKeyModal());
    if(i.customId==='progdev:vip:prices')return i.showModal(await UI.vipPriceModal());
    if(i.customId==='progdev:vip:sssvip')return i.showModal(await UI.sssvipPriceModal());
  }
  if(i.isModalSubmit()){
    if(i.customId==='progdev:modal:level'){await P.updateProgressionConfig({xpMin:i.fields.getTextInputValue('xpMin'),xpMax:i.fields.getTextInputValue('xpMax'),cooldownSeconds:i.fields.getTextInputValue('cooldown'),curveBase:i.fields.getTextInputValue('curveBase'),curvePower:i.fields.getTextInputValue('curvePower')});await sendDeveloperLog(client,{title:'⚔️ Progression Config Updated',description:`Developer: ${i.user.id}`});return i.reply({content:'✅ Global Level & EXP configuration saved.',flags:64});}
    if(i.customId==='progdev:modal:userlevel'){const uid=i.fields.getTextInputValue('userId').trim();if(!/^\d{15,25}$/.test(uid))return i.reply({content:'❌ Invalid Discord User ID.',flags:64});const p=await P.setUserLevelXp(uid,i.fields.getTextInputValue('level'),i.fields.getTextInputValue('xp'));await sendDeveloperLog(client,{title:'⚔️ User Level/EXP Adjusted',description:`Developer: ${i.user.id}\nUser: ${uid}\nLevel: ${p.level}\nEXP: ${p.xp}\nTotal EXP: ${p.totalXp}`});return i.reply({content:`✅ User <@${uid}> set to **Lv.${p.level}** with **${p.xp} EXP**.`,flags:64});}
    if(i.customId==='progdev:modal:advancedlevel'){await P.updateProgressionConfig({maxLevel:i.fields.getTextInputValue('maxLevel'),curveDivisor:i.fields.getTextInputValue('curveDivisor')});return i.reply({content:'✅ Advanced Level curve saved.',flags:64});}
    if(i.customId==='progdev:modal:rewards'){await P.updateRewardConfig({top1:i.fields.getTextInputValue('top1'),top2:i.fields.getTextInputValue('top2'),top3:i.fields.getTextInputValue('top3'),top4to10:i.fields.getTextInputValue('top4to10'),top11to100:i.fields.getTextInputValue('top11to100')});return i.reply({content:'✅ Weekly Top reward configuration saved.',flags:64});}
    if(i.customId==='progdev:modal:vipprices'){const data={};for(const k of ['VIP','VIP_PLUS','VVIP','SVIP','SSVIP'])data[`vipPrices.${k}`]=Math.max(0,Math.floor(Number(i.fields.getTextInputValue(k))||0));await DeveloperSettings.updateOne({key:'global'},{$set:data});return i.reply({content:'✅ VIP prices saved. SSSVIP remains at its current price.',flags:64});}
    if(i.customId==='progdev:modal:sssvipprice'){const price=Math.max(0,Math.floor(Number(i.fields.getTextInputValue('SSSVIP'))||0));await DeveloperSettings.updateOne({key:'global'},{$set:{'vipPrices.SSSVIP':price}});return i.reply({content:`✅ SSSVIP price saved: ${price.toLocaleString()} 🌟Cstar / 30d.`,flags:64});}
    if(i.customId==='progdev:modal:vipkey'){try{const k=await Dev.createRedeemKey({type:'VIP',tier:i.fields.getTextInputValue('tier').trim().toUpperCase().replace('VIP PLUS','VIP+'),vipDuration:i.fields.getTextInputValue('duration').trim(),maxUses:Number(i.fields.getTextInputValue('maxUses')),expiresDays:Number(i.fields.getTextInputValue('expiresDays'))});await sendDeveloperLog(client,{title:'🔑 VIP Profile Key Created',description:`Developer: ${i.user.id}\nKey: ${k.code}\nTier: ${k.vipTier}\nDuration: ${k.vipDuration}`});return i.reply({content:`✅ VIP key: \`${k.code}\` • **${k.vipTier}** • **${k.vipDuration}** • max uses **${k.maxUses}**`,flags:64});}catch(e){return i.reply({content:`❌ ${e.message}`,flags:64});}}
  }
}
module.exports={handle};
