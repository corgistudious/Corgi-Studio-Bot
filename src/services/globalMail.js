const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const GlobalMail=require('../models/GlobalMail');
const Delivery=require('../models/GlobalMailDelivery');
const Claim=require('../models/GlobalMailClaim');
const UserEconomy=require('../models/UserEconomy');
const {ensureWallet,walletFilter}=require('./economyWallet');
const {getGuildSettings}=require('./guildSettings');
const {mtx}=require('./i18n');

async function createDraft({actorId,title,titleEn,bodyEn,titleVi,bodyVi,imageUrl,cstarAmount,expiresDays}){
  titleEn=String(titleEn||title||'').trim();bodyEn=String(bodyEn||'').trim();titleVi=String(titleVi||'').trim();bodyVi=String(bodyVi||'').trim();
  if(!titleEn||!bodyEn||!titleVi||!bodyVi)throw new Error('Both English and Vietnamese title/message are required.');
  const amount=Math.max(0,Math.min(1e12,Math.floor(Number(cstarAmount)||0)));const days=Math.max(0,Math.min(3650,Math.floor(Number(expiresDays)||0)));
  await GlobalMail.updateMany({createdBy:String(actorId),status:'DRAFT'},{$set:{status:'CANCELLED'}});
  return GlobalMail.create({createdBy:String(actorId),title:titleEn,body:bodyEn,titleEn,bodyEn,titleVi,bodyVi,imageUrl:String(imageUrl||'').trim(),cstarAmount:amount,expiresAt:days?new Date(Date.now()+days*86400000):undefined});
}
async function latestDraft(actorId){return GlobalMail.findOne({createdBy:String(actorId),status:'DRAFT'}).sort({createdAt:-1});}
async function latest(limit=8){return GlobalMail.find({status:'PUBLISHED'}).sort({publishedAt:-1}).limit(limit).lean();}
async function setDraftImage(actorId,imageUrl){
  const draft=await latestDraft(actorId);if(!draft)throw new Error('No active draft.');
  draft.imageUrl=String(imageUrl||'').trim();await draft.save();return draft;
}
function localizedContent(mail,lang='en'){
  const vi=lang==='vi';
  return {title:String((vi?mail.titleVi:mail.titleEn)||mail.title||'Global Mail'),body:String((vi?mail.bodyVi:mail.bodyEn)||mail.body||'')};
}
function messagePayload(mail,lang='en',options={}){
  const content=localizedContent(mail,lang);
  const e=new EmbedBuilder().setColor(0xF59E0B).setTitle(`📬 ${content.title}`).setDescription(content.body).setFooter({text:'Corgi-Bot • Global Mail'}).setTimestamp(mail.publishedAt||mail.createdAt||new Date());
  if(mail.imageUrl)e.setImage(mail.imageUrl);
  if(mail.cstarAmount>0)e.addFields({name:'🪙 CXu',value:mtx(lang,`Attachment: **${Number(mail.cstarAmount).toLocaleString()} 🪙 CXu**
Claim once per Discord account.`,`Đính kèm: **${Number(mail.cstarAmount).toLocaleString()} 🪙 CXu**
Mỗi tài khoản Discord chỉ nhận 1 lần.`)});
  if(mail.expiresAt)e.addFields({name:mtx(lang,'⏳ Claim deadline','⏳ Hạn nhận'),value:`<t:${Math.floor(new Date(mail.expiresAt).getTime()/1000)}:F>`});
  const components=[];
  if(!options.hideLanguageButtons)components.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`globalmail:view:vi:${mail._id}`).setLabel('Tiếng Việt').setEmoji('🇻🇳').setStyle(lang==='vi'?ButtonStyle.Primary:ButtonStyle.Secondary),new ButtonBuilder().setCustomId(`globalmail:view:en:${mail._id}`).setLabel('English').setEmoji('🇺🇸').setStyle(lang==='en'?ButtonStyle.Primary:ButtonStyle.Secondary)));
  if(mail.cstarAmount>0)components.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`globalmail:claim:${mail._id}`).setLabel(mtx(lang,'Claim 🪙 CXu','Nhận 🪙 CXu')).setEmoji('🎁').setStyle(ButtonStyle.Success)));
  return {embeds:[e],components};
}
function canSend(ch,guild){if(!ch?.isTextBased?.()||ch.type===ChannelType.GuildVoice)return false;const me=guild.members.me;const p=ch.permissionsFor(me);return p?.has([PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.EmbedLinks]);}
async function findChannel(guild){
  const s=await getGuildSettings(guild.id).catch(()=>null);const preferred=[s?.channels?.globalMail,guild.systemChannelId,s?.channels?.logs,s?.channels?.welcome].filter(Boolean);
  for(const id of preferred){const ch=await guild.channels.fetch(id).catch(()=>null);if(canSend(ch,guild))return ch;}
  return guild.channels.cache.filter(c=>[ChannelType.GuildText,ChannelType.GuildAnnouncement].includes(c.type)&&canSend(c,guild)).sort((a,b)=>a.rawPosition-b.rawPosition).first()||null;
}
async function publish(client,mailId,actorId){
  const mail=await GlobalMail.findById(mailId);if(!mail||mail.status!=='DRAFT')throw new Error('Draft not found or already published.');
  mail.status='PUBLISHED';mail.publishedAt=new Date();mail.publishedBy=String(actorId);await mail.save();
  let sent=0,failed=0,skipped=0;
  for(const guild of client.guilds.cache.values()){
    let rec={mailId:mail._id,guildId:guild.id,status:'SKIPPED'};
    try{const ch=await findChannel(guild);if(!ch){skipped++;rec.error='No writable text/announcement channel';}
      else{const s=await getGuildSettings(guild.id).catch(()=>({language:'en'}));const msg=await ch.send(messagePayload(mail,s?.language||'en'));sent++;rec={...rec,status:'SENT',channelId:ch.id,messageId:msg.id};}
    }catch(e){failed++;rec.status='FAILED';rec.error=String(e.message||e).slice(0,500);}
    await Delivery.findOneAndUpdate({mailId:mail._id,guildId:guild.id},{$set:rec},{upsert:true,returnDocument:'after'}).catch(()=>{});
  }
  mail.deliverySummary={sent,failed,skipped};await mail.save();return mail;
}
async function cancelDraft(mailId,actorId){return GlobalMail.findOneAndUpdate({_id:mailId,createdBy:String(actorId),status:'DRAFT'},{$set:{status:'CANCELLED'}},{returnDocument:'after'});}
async function claim(mailId,userId){
  const mail=await GlobalMail.findById(mailId);if(!mail||mail.status!=='PUBLISHED')throw new Error('This mail is not available.');if(mail.cstarAmount<=0)throw new Error('This mail has no 🪙 CXu attachment.');if(mail.expiresAt&&mail.expiresAt<=new Date())throw new Error('This mail reward has expired.');
  const uid=String(userId),mid=String(mail._id);await ensureWallet(uid);
  const wallet=await UserEconomy.findOneAndUpdate({...walletFilter(uid),claimedGlobalMailIds:{$ne:mid}},{$inc:{cstar:mail.cstarAmount},$addToSet:{claimedGlobalMailIds:mid}},{returnDocument:'after'});
  if(!wallet)throw new Error('You already claimed this mail reward.');
  await Claim.findOneAndUpdate({mailId:mail._id,userId:uid},{$setOnInsert:{mailId:mail._id,userId:uid,amount:mail.cstarAmount,claimedAt:new Date()}},{upsert:true,returnDocument:'after'}).catch(()=>{});
  return {mail,wallet};
}
async function stats(mailId){const [deliveries,claims]=await Promise.all([Delivery.find({mailId}).lean(),Claim.countDocuments({mailId})]);return{deliveries,claims};}
module.exports={createDraft,latestDraft,latest,setDraftImage,localizedContent,messagePayload,publish,cancelDraft,claim,stats};
