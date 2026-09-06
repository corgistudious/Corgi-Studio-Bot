const {Events,ChannelType,PermissionFlagsBits,EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle}=require('discord.js');
const {canSetup}=require('../services/permissions');
const {getGuildSettings,toggleModule,setLanguage,setChannel,setPremiumBranding}=require('../services/guildSettings');
const {isPremiumGuild,PREMIUM_MODULES,applyPremiumBranding,recordPremiumAudit}=require('../services/premium');
const {checkAccess}=require('../services/accessControl');
const {sendDeveloperLog}=require('../services/developerLog');
const Ticket=require('../models/Ticket');
const Contest=require('../models/Contest');
const Giveaway=require('../models/Giveaway');
const {buildGiveawayMessage,eligibility}=require('../modules/giveaway');
const {AttachmentBuilder}=require('discord.js');
const {sendLog}=require('../services/log');
const UI=require('../ui/setup');
const DevUI=require('../ui/dev');
const DevControl=require('../services/devControl');
const {isDeveloper}=require('../services/permissions');
const {pick}=require('../services/i18n');
async function guard(i){const s=i.guildId?await getGuildSettings(i.guildId):null;if(!i.guildId||!canSetup(i.member)){if(i.isRepliable())await i.reply({content:pick(s?.language,'You need Manage Server or Administrator.','Bạn cần quyền Quản lý Server hoặc Administrator.'),flags:64});return false;}return true;}
async function createTicket(i){const s=await getGuildSettings(i.guildId);const lang=s.language;if(!s.modules.ticket)return i.reply({content:pick(lang,'🎫 Ticket module is disabled.','🎫 Tính năng Ticket đang tắt.'),flags:64});const existing=await Ticket.findOne({guildId:i.guildId,ownerId:i.user.id,status:'open'}).lean();if(existing){const ch=await i.guild.channels.fetch(existing.channelId).catch(()=>null);if(ch)return i.reply({content:pick(lang,`You already have an open ticket: ${ch}`,`Bạn đã có một Ticket đang mở: ${ch}`),flags:64});}
 const perms=[{id:i.guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},{id:i.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]},{id:i.guild.members.me.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ManageChannels,PermissionFlagsBits.ReadMessageHistory]}];
 const ch=await i.guild.channels.create({name:`ticket-${i.user.username}`.slice(0,90),type:ChannelType.GuildText,parent:s.channels?.ticketCategory||null,permissionOverwrites:perms,reason:pick(lang,`Ticket opened by ${i.user.tag}`,`Ticket được mở bởi ${i.user.tag}`)});await Ticket.create({guildId:i.guildId,channelId:ch.id,ownerId:i.user.id});const e=new EmbedBuilder().setTitle(pick(lang,'🎫 Support Ticket','🎫 Ticket Hỗ trợ')).setDescription(pick(lang,`Hello ${i.user}, describe your issue clearly.\n\nWhen finished, press **Close Ticket**.`,`Xin chào ${i.user}, hãy mô tả vấn đề rõ ràng.\n\nKhi hoàn tất, nhấn **Đóng Ticket**.`)).setFooter({text:'Corgi Studio • Ticket System'}).setTimestamp();const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:close').setLabel(pick(lang,'Close Ticket','Đóng Ticket')).setEmoji('🔒').setStyle(ButtonStyle.Danger));await ch.send({content:`${i.user}`,embeds:[e],components:[row]});return i.reply({content:pick(lang,`✅ Ticket created: ${ch}`,`✅ Đã tạo Ticket: ${ch}`),flags:64});}
async function closeTicket(i){const s=await getGuildSettings(i.guildId);const lang=s.language;const t=await Ticket.findOne({channelId:i.channelId,status:'open'});if(!t)return i.reply({content:pick(lang,'This is not an open ticket.','Đây không phải Ticket đang mở.'),flags:64});const member=i.member;const allowed=i.user.id===t.ownerId||member.permissions.has(PermissionFlagsBits.ManageChannels)||member.permissions.has(PermissionFlagsBits.ManageGuild);if(!allowed)return i.reply({content:pick(lang,'You cannot close this ticket.','Bạn không thể đóng Ticket này.'),flags:64});
 const msgs=await i.channel.messages.fetch({limit:100}).catch(()=>null);let transcript='';if(msgs){const arr=[...msgs.values()].sort((a,b)=>a.createdTimestamp-b.createdTimestamp);transcript=arr.map(m=>`[${new Date(m.createdTimestamp).toISOString()}] ${m.author?.tag||'Unknown'}: ${m.cleanContent||''}${m.attachments?.size?' | Attachments: '+[...m.attachments.values()].map(a=>a.url).join(', '):''}`).join('\n');}
 t.status='closed';t.closedBy=i.user.id;t.closedAt=new Date();await t.save();await i.reply({content:pick(lang,'🔒 Ticket closed. Transcript is being saved. This channel will be deleted in 5 seconds.','🔒 Ticket đã đóng. Transcript đang được lưu. Kênh sẽ bị xóa sau 5 giây.')});
 try{if(s.channels?.logs){const ch=await i.guild.channels.fetch(s.channels.logs).catch(()=>null);if(ch?.isTextBased()){const att=new AttachmentBuilder(Buffer.from(transcript||'No messages.','utf8'),{name:`ticket-${t.id}.txt`});await ch.send({content:pick(lang,`🎫 Ticket transcript • Owner <@${t.ownerId}> • Closed by ${i.user}`,`🎫 Transcript Ticket • Chủ Ticket <@${t.ownerId}> • Đóng bởi ${i.user}`),files:[att]});}}}catch(e){console.warn('Transcript save failed:',e.message)}
 setTimeout(()=>i.channel.delete(pick(lang,`Ticket closed by ${i.user.tag}`,`Ticket được đóng bởi ${i.user.tag}`)).catch(()=>{}),5000);}
async function joinContest(i){const s=await getGuildSettings(i.guildId);const lang=s.language;const c=await Contest.findOne({messageId:i.message.id,status:'open'});if(!c)return i.reply({content:pick(lang,'This contest is no longer active.','Cuộc thi này không còn hoạt động.'),flags:64});if(c.endsAt&&c.endsAt<=new Date())return i.reply({content:pick(lang,'This contest has ended.','Cuộc thi đã kết thúc.'),flags:64});if(c.entries.includes(i.user.id))return i.reply({content:pick(lang,'You already joined this contest.','Bạn đã tham gia cuộc thi này rồi.'),flags:64});c.entries.push(i.user.id);await c.save();const e=EmbedBuilder.from(i.message.embeds[0]);const desc=(e.data.description||'').replace(/👥 (Entries|Người tham gia): \*\*\d+\*\*/g,`👥 ${pick(lang,'Entries','Người tham gia')}: **${c.entries.length}**`);e.setDescription(desc);await i.message.edit({embeds:[e]}).catch(()=>{});return i.reply({content:pick(lang,'🏆 You joined the contest!','🏆 Bạn đã tham gia cuộc thi!'),flags:64});}
module.exports={name:Events.InteractionCreate,async execute(i,client){try{
const access=await checkAccess({userId:i.user?.id,guildId:i.guildId});
if(!access.allowed){if(i.isRepliable()){const payload={content:access.message,flags:64};if(i.replied||i.deferred)await i.followUp(payload).catch(()=>{});else await i.reply(payload).catch(()=>{});}return;}
if(i.isChatInputCommand()){const c=client.commands.get(i.commandName);if(c?.premiumOnly&&!(await isPremiumGuild(i.guildId)))return i.reply({content:'💎 This command requires an active Corgi Premium subscription for this server.',flags:64});if(c)await c.execute(i,client);return;}
if(i.isButton()&&i.customId==='ticket:create')return createTicket(i);
if(i.isButton()&&i.customId==='ticket:close')return closeTicket(i);
if(i.isButton()&&i.customId==='contest:join')return joinContest(i);
if(i.isButton()&&(i.customId==='giveaway:join'||i.customId==='giveaway:leave')){
  await i.deferReply({flags:64});
  const g=await Giveaway.findOne({messageId:i.message.id});
  const s=await getGuildSettings(i.guildId),lang=s.language;
  if(!g||g.status!=='active'||new Date(g.endsAt)<=new Date())return i.editReply(pick(lang,'This Giveaway is no longer accepting entries.','Giveaway này không còn nhận lượt tham gia.'));
  if(i.customId==='giveaway:leave'){
    if(!g.participants.includes(i.user.id))return i.editReply(pick(lang,'You are not in this Giveaway.','Bạn chưa tham gia Giveaway này.'));
    g.participants.pull(i.user.id);await g.save();await i.message.edit(buildGiveawayMessage(g,lang)).catch(()=>{});return i.editReply(pick(lang,'↩️ You left the Giveaway.','↩️ Bạn đã rời Giveaway.'));
  }
  if(g.participants.includes(i.user.id))return i.editReply(pick(lang,'🔥 You already joined this Giveaway.','🔥 Bạn đã tham gia Giveaway này rồi.'));
  const check=await eligibility(g,i.member);if(!check.ok)return i.editReply(`❌ ${check.reason}`);
  g.participants.push(i.user.id);await g.save();await i.message.edit(buildGiveawayMessage(g,lang)).catch(()=>{});return i.editReply(pick(lang,'🔥 Entry confirmed. Good luck!','🔥 Tham gia thành công. Chúc bạn may mắn!'));
}

if(i.isButton()&&i.customId?.startsWith('spin:')){
  const { runSpinAgain, cashOutSpin }=require('../modules/games/engine');
  const parts=i.customId.split(':');
  const action=parts[1];
  const bet=Number(parts[2])||0;
  const ownerId=action==='again'?parts[3]:parts[2];
  const s=await getGuildSettings(i.guildId);
  if(i.user.id!==ownerId)return i.reply({content:pick(s.language,'This Spin session belongs to another player.','Phiên Spin này thuộc về người chơi khác.'),flags:64});
  if(action==='again'){
    const r=await runSpinAgain({guildId:i.guildId,userId:i.user.id,bet});
    if(r.error)return i.reply({content:r.error,flags:64});
    return i.update({embeds:[r.embed],components:r.components});
  }
  if(action==='cashout'){
    const r=await cashOutSpin({guildId:i.guildId,userId:i.user.id});
    if(r.error)return i.reply({content:r.error,flags:64});
    return i.update({embeds:[r.embed],components:r.components});
  }
}
if(i.customId?.startsWith('dev:')){
  if(!isDeveloper(i.user.id))return i.reply({content:'Developer access only.',flags:64});
  if(i.isButton()){
    if(i.customId==='dev:close')return i.update({content:'Developer Control Center closed.',embeds:[],components:[]});
    if(i.customId==='dev:home'||i.customId==='dev:refresh')return i.update(await DevUI.home(client));
    if(i.customId==='dev:maintenance:on'){await DevControl.setMaintenance(true);await sendDeveloperLog(client,{title:'🛠️ Maintenance Enabled',description:`Developer: ${i.user.id}`});return i.update(await DevUI.system(client));}
    if(i.customId==='dev:maintenance:off'){await DevControl.setMaintenance(false);await sendDeveloperLog(client,{title:'🛠️ Maintenance Disabled',description:`Developer: ${i.user.id}`});return i.update(await DevUI.system(client));}
    if(i.customId==='dev:premium:grant')return i.showModal(DevUI.premiumGrantModal());
    if(i.customId==='dev:premium:revoke')return i.showModal(DevUI.premiumRevokeModal());
    if(i.customId==='dev:key:cstar')return i.showModal(DevUI.keyCstarModal());
    if(i.customId==='dev:key:premium')return i.showModal(DevUI.keyPremiumModal());
    if(i.customId==='dev:key:disable')return i.showModal(DevUI.keyDisableModal());
    if(i.customId==='dev:cstar:adjust')return i.showModal(DevUI.cstarModal());
    if(i.customId==='dev:blacklist:guild')return i.showModal(DevUI.blacklistModal('guild'));
    if(i.customId==='dev:blacklist:user')return i.showModal(DevUI.blacklistModal('user'));
  }
  if(i.isStringSelectMenu()&&i.customId==='dev:page'){
    const p=i.values[0];
    if(p==='system')return i.update(await DevUI.system(client));
    if(p==='servers')return i.update(await DevUI.servers(client));
    if(p==='premium')return i.update(await DevUI.premium());
    if(p==='keys')return i.update(await DevUI.keys());
    if(p==='cstar')return i.update(DevUI.cstar());
    if(p==='blacklist')return i.update(await DevUI.blacklist());
  }
  if(i.isModalSubmit()){
    if(i.customId==='dev:modal:premiumGrant'){const p=await DevControl.addPremium(i.fields.getTextInputValue('guildId').trim(),i.fields.getTextInputValue('userId').trim(),i.fields.getTextInputValue('duration').trim(),i.user.id);await sendDeveloperLog(client,{title:'💎 Premium Granted / Extended',description:`Developer: ${i.user.id}\nGuild: ${p.guildId}\nUntil: ${p.expiresAt.toISOString()}`});const g=client.guilds.cache.get(p.guildId);if(g)await applyPremiumBranding(g);return i.reply({content:`✅ Premium granted/extended until <t:${Math.floor(p.expiresAt.getTime()/1000)}:F>.`,flags:64});}
    if(i.customId==='dev:modal:premiumRevoke'){const gid=i.fields.getTextInputValue('guildId').trim();const n=await DevControl.revokePremium(gid,i.user.id);const g=client.guilds.cache.get(gid);if(g)await applyPremiumBranding(g);await sendDeveloperLog(client,{title:'💎 Premium Revoked',description:`Developer: ${i.user.id}\nGuild: ${gid}\nRecords removed: ${n}`});return i.reply({content:`✅ Revoked **${n}** Premium record(s).`,flags:64});}
    if(i.customId==='dev:modal:keyCstar'){const k=await DevControl.createRedeemKey({type:'CSTAR',amount:Number(i.fields.getTextInputValue('amount')),maxUses:Number(i.fields.getTextInputValue('maxUses')),expiresDays:Number(i.fields.getTextInputValue('expiresDays'))});await sendDeveloperLog(client,{title:'🔑 🌟Cstar Key Created',description:`Developer: ${i.user.id}\nKey: ${k.code}\nAmount: ${k.cstarAmount}\nMax uses: ${k.maxUses}`});return i.reply({content:`✅ 🌟Cstar key created: \`${k.code}\` • **${k.cstarAmount} 🌟Cstar** • max uses **${k.maxUses}**`,flags:64});}
    if(i.customId==='dev:modal:keyPremium'){const k=await DevControl.createRedeemKey({type:'PREMIUM',duration:i.fields.getTextInputValue('duration').trim(),maxUses:Number(i.fields.getTextInputValue('maxUses')),expiresDays:Number(i.fields.getTextInputValue('expiresDays'))});await sendDeveloperLog(client,{title:'🔑 Premium Key Created',description:`Developer: ${i.user.id}\nKey: ${k.code}\nDuration: ${k.premiumDuration}\nMax uses: ${k.maxUses}`});return i.reply({content:`✅ Premium key created: \`${k.code}\` • **${k.premiumDuration}** • max uses **${k.maxUses}**`,flags:64});}
    if(i.customId==='dev:modal:keyDisable'){const k=await DevControl.disableKey(i.fields.getTextInputValue('code'));if(k)await sendDeveloperLog(client,{title:'🔑 CD Key Disabled',description:`Developer: ${i.user.id}\nKey: ${k.code}`});return i.reply({content:k?`✅ Disabled \`${k.code}\`.`:'❌ Key not found.',flags:64});}
    if(i.customId==='dev:modal:cstar'){const uid=i.fields.getTextInputValue('userId'),delta=Number(i.fields.getTextInputValue('delta'));const u=await DevControl.adjustCstar(null,uid,delta);await sendDeveloperLog(client,{title:'⭐ Global 🌟Cstar Adjusted',description:`Developer: ${i.user.id}\nUser: ${uid}\nDelta: ${delta}\nGlobal balance: ${u.cstar}`});return i.reply({content:`✅ New global 🌟Cstar balance: **${u.cstar} 🌟Cstar**.`,flags:64});}
        if(i.customId.startsWith('dev:modal:blacklist:')){const kind=i.customId.split(':')[3];const r=await DevControl.toggleBlacklist(kind,i.fields.getTextInputValue('id'));await sendDeveloperLog(client,{title:'🛡️ Blacklist Changed',description:`Developer: ${i.user.id}\n${kind}: ${r.id}\nState: ${r.blocked?'BLACKLISTED':'UNBLOCKED'}`});return i.reply({content:`✅ ${kind} \`${r.id}\` is now **${r.blocked?'BLACKLISTED':'UNBLOCKED'}**.`,flags:64});}
  }
  return;
}
if(!i.customId?.startsWith('setup:'))return;if(!(await guard(i)))return;
if(i.isButton()){if(i.customId==='setup:close'){const s=await getGuildSettings(i.guildId);return i.update({content:pick(s.language,'Control Center closed.','Đã đóng Trung tâm điều khiển.'),embeds:[],components:[]});}if(i.customId==='setup:home'||i.customId==='setup:refresh'){const s=await getGuildSettings(i.guildId);return i.update(await UI.buildSetupHome(i.guild,s));}if(i.customId==='setup:premium:corgiEmoji'){if(!(await isPremiumGuild(i.guildId))){const s=await getGuildSettings(i.guildId);return i.reply({content:pick(s.language,'💎 Premium is required for this customization.','💎 Tùy chỉnh này yêu cầu Corgi Premium đang hoạt động.'),flags:64});}const s=await getGuildSettings(i.guildId);const enabled=!s.premiumBranding?.useCorgiStudioEmoji;await setPremiumBranding(i.guildId,{useCorgiStudioEmoji:enabled});await recordPremiumAudit({guildId:i.guildId,userId:i.user.id,actorId:i.user.id,action:'BRANDING',source:'setup',details:`Corgi Studio emoji ${enabled?'enabled':'disabled'}`});const n=await getGuildSettings(i.guildId);return i.update(await UI.buildPremium(i.guild,n));}if(i.customId.startsWith('setup:premium:')){if(!(await isPremiumGuild(i.guildId)))return i.reply({content:'💎 Premium is required for this customization.',flags:64});const kind=i.customId.split(':')[2];const s=await getGuildSettings(i.guildId);return i.showModal(UI.premiumModal(kind,s.premiumBranding?.[kind==='name'?'botName':kind==='avatar'?'avatarUrl':'emojiTheme']||'',s));}}
if(i.isStringSelectMenu()){const s=await getGuildSettings(i.guildId);if(i.customId==='setup:page'){const p=i.values[0];if(p==='modules')return i.update(UI.buildModules(s));if(p==='channels')return i.update(UI.buildChannels(s));if(p==='premium')return i.update(await UI.buildPremium(i.guild,s));if(p==='language')return i.update(UI.buildLanguage(s));}if(i.customId==='setup:toggle'){const mod=i.values[0];if(mod==='pet')return i.reply({content:pick(s.language,'🐾 Pet Game is Coming Soon and cannot be enabled yet.','🐾 Pet Game sắp ra mắt và hiện chưa thể bật.'),flags:64});if(PREMIUM_MODULES.has(mod)&&!(await isPremiumGuild(i.guildId)))return i.reply({content:pick(s.language,'💎 This module requires active Corgi Premium.','💎 Tính năng này yêu cầu Corgi Premium đang hoạt động.'),flags:64});const n=await toggleModule(i.guildId,mod);return i.update(UI.buildModules(n));}if(i.customId==='setup:setlanguage'){const n=await setLanguage(i.guildId,i.values[0]);return i.update(UI.buildLanguage(n));}if(i.customId==='setup:channelkey'){return i.update({embeds:i.message.embeds,components:[UI.channelPicker(i.values[0],s),UI.buildChannels(s).components[1]]});}}
if(i.isChannelSelectMenu()&&i.customId.startsWith('setup:setchannel:')){const key=i.customId.split(':')[2];const n=await setChannel(i.guildId,key,i.values[0]);return i.update(UI.buildChannels(n));}
if(i.isModalSubmit()&&i.customId.startsWith('setup:premiumModal:')){if(!(await isPremiumGuild(i.guildId))){const s=await getGuildSettings(i.guildId);return i.reply({content:pick(s.language,'Premium expired.','Premium đã hết hạn.'),flags:64});}const kind=i.customId.split(':')[2],value=i.fields.getTextInputValue('value').trim();const patch={};if(kind==='name')patch.botName=value;if(kind==='avatar'){try{const u=new URL(value);if(u.protocol!=='https:')throw 0;}catch{const s=await getGuildSettings(i.guildId);return i.reply({content:pick(s.language,'Avatar must be a valid HTTPS URL.','Avatar phải là URL HTTPS hợp lệ.'),flags:64});}patch.avatarUrl=value;}if(kind==='emoji')patch.emojiTheme=value;await setPremiumBranding(i.guildId,patch);await recordPremiumAudit({guildId:i.guildId,userId:i.user.id,actorId:i.user.id,action:'BRANDING',source:'setup',details:`Updated ${kind}`});await sendDeveloperLog(client,{title:'💎 Premium Branding Updated',description:`Guild: ${i.guildId}\nUser: ${i.user.id}\nSetting: ${kind}`});try{if(kind==='name')await i.guild.members.me.setNickname(value);if(kind==='avatar'&&process.env.ALLOW_GLOBAL_AVATAR_BRANDING==='true')await client.user.setAvatar(value);}catch(e){console.warn('Premium branding Discord update failed:',e.message);}return i.reply({content:kind==='avatar'&&process.env.ALLOW_GLOBAL_AVATAR_BRANDING!=='true'?`💎 Avatar URL saved. Global bot avatar change is disabled. Set ALLOW_GLOBAL_AVATAR_BRANDING=true only if you want this Premium server to change the avatar for the bot account across every guild.`:`💎 Premium setting saved: **${kind}**.`,flags:64});}
}catch(e){console.error(e);if(i.isRepliable()){const s=i.guildId?await getGuildSettings(i.guildId).catch(()=>null):null;const msg=pick(s?.language,'An unexpected error occurred.','Đã xảy ra lỗi không mong muốn.');if(i.replied||i.deferred)await i.followUp({content:msg,flags:64}).catch(()=>{});else await i.reply({content:msg,flags:64}).catch(()=>{});}}}};
