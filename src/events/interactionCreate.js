const {Events,ChannelType,PermissionFlagsBits,EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle}=require('discord.js');
const {canSetup}=require('../services/permissions');
const {getGuildSettings,toggleModule,setLanguage,setChannel,setPremiumBranding}=require('../services/guildSettings');
const {isPremiumGuild,PREMIUM_MODULES,applyPremiumBranding,recordPremiumAudit}=require('../services/premium');
const {checkAccess}=require('../services/accessControl');
const {sendDeveloperLog}=require('../services/developerLog');
const Ticket=require('../models/Ticket');
const Contest=require('../models/Contest');
const ContestSubmission=require('../models/ContestSubmission');
const ContestVote=require('../models/ContestVote');
const Giveaway=require('../models/Giveaway');
const {buildGiveawayMessage,eligibility}=require('../modules/giveaway');
const {findContest,checkEligibility:checkContestEligibility,postOrRefreshSubmission}=require('../modules/contest');
const {AttachmentBuilder}=require('discord.js');
const CommunityPanel=require('../models/CommunityPanel');
const {deliverTranscript}=require('../services/ticketTranscript');
const {sendLog}=require('../services/log');
const UI=require('../ui/setup');
const {compactNumber,parseMoney}=require('../services/numberFormat');
const DevUI=require('../ui/dev');
const DevControl=require('../services/devControl');
const EventControl=require('../modules/eventControl');
const {isDeveloper,isAuthorizedDeveloper}=require('../services/permissions');
const {mtx}=require('../services/i18n');
const ProgressionDev=require('../modules/progressionDev');
const GlobalCollection=require('../services/globalCollection');
const _gameLangCache=new Map();
async function fastGameLang(gid){const now=Date.now(),hit=_gameLangCache.get(String(gid));if(hit&&hit.until>now)return hit.lang;const s=await getGuildSettings(gid);const lang=s?.language||'en';_gameLangCache.set(String(gid),{lang,until:now+30000});return lang;}
async function guard(i){const s=i.guildId?await getGuildSettings(i.guildId):null;if(!i.guildId||!canSetup(i.member)){if(i.isRepliable())await i.reply({content:mtx(s?.language,'You need Manage Server or Administrator.','Bạn cần quyền Quản lý Server hoặc Administrator.'),flags:64});return false;}return true;}
async function createTicket(i){const s=await getGuildSettings(i.guildId);const lang=s.language;if(!s.modules.ticket)return i.reply({content:mtx(lang,'🎫 Ticket module is disabled.','🎫 Tính năng Ticket đang tắt.'),flags:64});const existing=await Ticket.findOne({guildId:i.guildId,ownerId:i.user.id,status:'open'}).lean();if(existing){const ch=await i.guild.channels.fetch(existing.channelId).catch(()=>null);if(ch)return i.reply({content:mtx(lang,`You already have an open ticket: ${ch}`,`Bạn đã có một Ticket đang mở: ${ch}`),flags:64});}
 const perms=[{id:i.guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},{id:i.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]},{id:i.guild.members.me.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ManageChannels,PermissionFlagsBits.ReadMessageHistory]}];
 const ch=await i.guild.channels.create({name:`ticket-${i.user.username}`.slice(0,90),type:ChannelType.GuildText,parent:s.channels?.ticketCategory||null,permissionOverwrites:perms,reason:mtx(lang,`Ticket opened by ${i.user.tag}`,`Ticket được mở bởi ${i.user.tag}`)});await Ticket.create({guildId:i.guildId,channelId:ch.id,ownerId:i.user.id});const e=new EmbedBuilder().setTitle(mtx(lang,'🎫 Support Ticket','🎫 Ticket Hỗ trợ')).setDescription(mtx(lang,`Hello ${i.user}, describe your issue clearly.\n\nWhen finished, press **Close Ticket**.`,`Xin chào ${i.user}, hãy mô tả vấn đề rõ ràng.\n\nKhi hoàn tất, nhấn **Đóng Ticket**.`)).setFooter({text:'Corgi Studio • Ticket System'}).setTimestamp();const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:close').setLabel(mtx(lang,'Close Ticket','Đóng Ticket')).setEmoji('🔒').setStyle(ButtonStyle.Danger));await ch.send({content:`${i.user}`,embeds:[e],components:[row]});return i.reply({content:mtx(lang,`✅ Ticket created: ${ch}`,`✅ Đã tạo Ticket: ${ch}`),flags:64});}
async function closeTicket(i){
 const s=await getGuildSettings(i.guildId),lang=s.language;
 const t=await Ticket.findOne({channelId:i.channelId,status:{$in:['open','reopened']}});if(!t)return i.reply({content:mtx(lang,'This is not an open ticket.','Đây không phải Ticket đang mở.'),flags:64});
 const allowed=i.user.id===t.ownerId||i.member.permissions.has(PermissionFlagsBits.ManageChannels)||i.member.permissions.has(PermissionFlagsBits.ManageGuild);if(!allowed)return i.reply({content:mtx(lang,'You cannot close this ticket.','Bạn không thể đóng Ticket này.'),flags:64});
 await i.deferReply();
 const cfg=await CommunityPanel.findOne({guildId:i.guildId}).lean();const type=cfg?.ticket?.types?.find(x=>x.key===t.typeKey);
 const sent=await deliverTranscript({channel:i.channel,ticket:t,closer:i.user,settings:s,typeConfig:type});
 t.pendingCloseBy=i.user.id;t.pendingCloseAt=new Date();t.transcriptDeliveredAt=new Date();await t.save();
 const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:confirm-close').setLabel(mtx(lang,'Confirm & Close','Xác nhận & Đóng')).setEmoji('🔒').setStyle(ButtonStyle.Danger),new ButtonBuilder().setCustomId('ticket:cancel-close').setLabel(mtx(lang,'Keep Open','Giữ Ticket mở')).setStyle(ButtonStyle.Secondary));
 await i.editReply({content:mtx(lang,`📄 Transcript ready. A copy is attached here for you to save.${sent.dm?' A second copy was sent to your DM.':' DM delivery failed, so please save this copy.'}${sent.log?' Staff log also received a copy.':''}\n\nPress **Confirm & Close** when you are ready.`,`📄 Transcript đã sẵn sàng. Một bản được đính kèm ngay tại Ticket để bạn tự lưu.${sent.dm?' Một bản thứ hai đã gửi qua DM.':' Không gửi được DM, hãy lưu bản tại đây.'}${sent.log?' Staff Log cũng đã nhận một bản.':''}\n\nKhi đã lưu xong, nhấn **Xác nhận & Đóng**.`),files:[sent.attachment],components:[row]});
}
async function confirmCloseTicket(i){const s=await getGuildSettings(i.guildId),lang=s.language;const t=await Ticket.findOne({channelId:i.channelId,status:{$in:['open','reopened']}});if(!t)return i.reply({content:mtx(lang,'Ticket is already closed.','Ticket đã đóng.'),flags:64});const allowed=i.user.id===t.ownerId||i.user.id===t.pendingCloseBy||i.member.permissions.has(PermissionFlagsBits.ManageChannels)||i.member.permissions.has(PermissionFlagsBits.ManageGuild);if(!allowed)return i.reply({content:mtx(lang,'You cannot close this ticket.','Bạn không thể đóng Ticket này.'),flags:64});t.status='closed';t.closedBy=i.user.id;t.closedAt=new Date();t.pendingCloseBy=undefined;t.pendingCloseAt=undefined;await t.save();await i.update({content:mtx(lang,'🔒 Ticket closed. Transcript has been delivered. This channel will be deleted in 10 seconds.','🔒 Ticket đã đóng. Transcript đã được gửi. Kênh sẽ bị xóa sau 10 giây.'),components:[],attachments:[]}).catch(()=>i.reply({content:'🔒 Ticket closed.'}));setTimeout(()=>i.channel.delete(`Ticket closed by ${i.user.tag}`).catch(()=>{}),10000);}
async function cancelCloseTicket(i){const t=await Ticket.findOne({channelId:i.channelId,status:{$in:['open','reopened']}});if(t){t.pendingCloseBy=undefined;t.pendingCloseAt=undefined;await t.save();}return i.update({content:'↩️ Close cancelled. Ticket remains open.',components:[],attachments:[]});}
async function contestButton(i,client){
 const s=await getGuildSettings(i.guildId),lang=s?.language==='vi'?'vi':'en';
 const parts=i.customId.split(':'),action=parts[1],raw=parts.slice(2).join(':');
 if(action==='submit'||action==='info'){
   const c=await findContest(i.guildId,raw);if(!c)return i.reply({content:mtx(lang,'Contest not found.','Không tìm thấy cuộc thi.'),flags:64});
   if(c.status!=='SUBMISSION')return i.reply({content:mtx(lang,'Submissions are currently closed.','Hiện tại cuộc thi đã đóng nhận bài.'),flags:64});
   return i.reply({content:mtx(lang,`📥 Submit your entry with **/contest submit** and choose Contest ID **${c.contestId}**, then select your photo/video/file in the **file** option. No URL is needed.`,`📥 Gửi bài bằng **/contest submit**, chọn Contest ID **${c.contestId}**, sau đó chọn ảnh/video/file trực tiếp tại mục **file**. Không cần URL.`),flags:64});
 }
 if(action!=='vote')return;
 await i.deferReply({flags:64});
 const row=await ContestSubmission.findById(raw).catch(()=>null);if(!row)return i.editReply(mtx(lang,'This contest entry no longer exists.','Bài dự thi này không còn tồn tại.'));
 const c=await findContest(i.guildId,row.contestId);if(!c||c.status!=='VOTING'||(c.votingEndsAt&&c.votingEndsAt<=new Date()))return i.editReply(mtx(lang,'Voting is currently closed.','Bình chọn hiện đã đóng.'));
 if(row.status!=='APPROVED')return i.editReply(mtx(lang,'This entry is not eligible for voting.','Bài này không đủ điều kiện để bình chọn.'));
 const elig=await checkContestEligibility(c,i.member,lang);if(!elig.ok)return i.editReply(`❌ ${elig.reason}`);
 if(!c.allowSelfVote&&row.userId===i.user.id)return i.editReply(mtx(lang,'You cannot vote for your own entry.','Bạn không thể tự bình chọn bài của mình.'));
 const existing=await ContestVote.findOne({contestId:c.contestId,submissionId:row._id,userId:i.user.id});
 if(existing){await ContestVote.deleteOne({_id:existing._id});row.voteCount=Math.max(0,(row.voteCount||0)-1);await row.save();await postOrRefreshSubmission(client,c,row,lang);return i.editReply(mtx(lang,'↩️ Your vote was removed.','↩️ Đã hủy phiếu bình chọn của bạn.'));}
 const used=await ContestVote.countDocuments({contestId:c.contestId,userId:i.user.id});if(used>=c.votesPerUser)return i.editReply(mtx(lang,`You already used all ${c.votesPerUser} vote(s) allowed in this contest.`,`Bạn đã sử dụng đủ ${c.votesPerUser} phiếu được phép trong cuộc thi này.`));
 try{await ContestVote.create({guildId:i.guildId,contestId:c.contestId,submissionId:row._id,userId:i.user.id});}catch(e){if(e?.code===11000)return i.editReply(mtx(lang,'You already voted for this entry.','Bạn đã bình chọn bài này rồi.'));throw e;}
 row.voteCount=(row.voteCount||0)+1;await row.save();await postOrRefreshSubmission(client,c,row,lang);return i.editReply(mtx(lang,'❤️ Vote confirmed. Thank you!','❤️ Bình chọn thành công. Cảm ơn bạn!'));
}
module.exports={name:Events.InteractionCreate,async execute(i,client){try{
// Creature Hunt: ACK Discord BEFORE access/i18n/database work.
  const creatureInteraction =
    i.customId?.startsWith('ch:') ||
    i.customId?.startsWith('ch6:') ||
    i.customId?.startsWith('chs:') ||
    i.customId?.startsWith('gh:') ||
    i.customId?.startsWith('fish:') ||
    (i.customId?.startsWith('startup:') && !i.customId?.startsWith('startup:create:') && !i.customId?.startsWith('startup:invite:')) ||
      i.customId?.startsWith('pete:');

  if (
    creatureInteraction &&
    i.isMessageComponent() &&
    !i.deferred &&
    !i.replied
  ) {
    await i.deferUpdate();
  }

  const access=await checkAccess({userId:i.user?.id,guildId:i.guildId});
if(!access.allowed){if(i.isRepliable()){const payload={content:access.message,flags:64};if(i.replied||i.deferred)await i.followUp(payload).catch(()=>{});else await i.reply(payload).catch(()=>{});}return;}
if(i.customId?.startsWith('pete:')){if(!i.deferred&&!i.replied)await i.deferUpdate();return require('../modules/petEconomyUI').handle(i,await fastGameLang(i.guildId));}
if(i.customId?.startsWith('ch6:')){return require('../modules/creatureV6Interactions').handle(i,await fastGameLang(i.guildId));}
if(i.customId?.startsWith('chs:')){return require('../modules/creatureSocialInteractions').handle(i,await fastGameLang(i.guildId));}
if(i.customId?.startsWith('ch:')){return require('../modules/creatureHunt').handle(i,await fastGameLang(i.guildId));}
if(i.customId?.startsWith('gh:')){return require('../modules/gameHub').handle(i,await fastGameLang(i.guildId));}
if(i.customId?.startsWith('fish:')){return require('../modules/fishing').handle(i,await fastGameLang(i.guildId));}
if(i.customId?.startsWith('startupmodal:')&&i.isModalSubmit()){return require('../modules/startup').modalSubmit(i,await fastGameLang(i.guildId));}
if(i.customId?.startsWith('startup:')){return require('../modules/startup').handle(i,await fastGameLang(i.guildId));}
if(i.customId?.startsWith('clanhub:')){return require('../modules/clanHub').handle(i,await require('../services/i18n').guildLang(i.guildId));}
if(i.customId?.startsWith('market:')){return require('../modules/market').handle(i,await require('../services/i18n').guildLang(i.guildId));}
if(i.isChatInputCommand()){const c=client.commands.get(i.commandName);if(c?.premiumOnly&&!(await isPremiumGuild(i.guildId)))return i.reply({content:'💎 This command requires an active Corgi Premium subscription for this server.',flags:64});if(c)await c.execute(i,client);return;}
if(i.customId?.startsWith('eventcfg:')){if(!(await guard(i)))return;return EventControl.handle(i,client);}
if(i.isButton()&&i.customId==='ticket:create')return createTicket(i);
if(i.isButton()&&i.customId==='ticket:close')return closeTicket(i);
if(i.isButton()&&i.customId==='ticket:confirm-close')return confirmCloseTicket(i);
if(i.isButton()&&i.customId==='ticket:cancel-close')return cancelCloseTicket(i);
if(i.isButton()&&i.customId?.startsWith('contest:'))return contestButton(i,client);
if(i.isButton()&&(i.customId==='giveaway:join'||i.customId==='giveaway:leave')){
  await i.deferReply({flags:64});
  const g=await Giveaway.findOne({messageId:i.message.id});
  const s=await getGuildSettings(i.guildId),lang=s.language;
  if(!g||g.status!=='active'||new Date(g.endsAt)<=new Date())return i.editReply(mtx(lang,'This Giveaway is no longer accepting entries.','Giveaway này không còn nhận lượt tham gia.'));
  if(i.customId==='giveaway:leave'){
    if(!g.participants.includes(i.user.id))return i.editReply(mtx(lang,'You are not in this Giveaway.','Bạn chưa tham gia Giveaway này.'));
    g.participants.pull(i.user.id);await g.save();await i.message.edit(buildGiveawayMessage(g,lang)).catch(()=>{});return i.editReply(mtx(lang,'↩️ You left the Giveaway.','↩️ Bạn đã rời Giveaway.'));
  }
  if(g.participants.includes(i.user.id))return i.editReply(mtx(lang,'🔥 You already joined this Giveaway.','🔥 Bạn đã tham gia Giveaway này rồi.'));
  const check=await eligibility(g,i.member);if(!check.ok)return i.editReply(`❌ ${check.reason}`);
  g.participants.push(i.user.id);await g.save();await i.message.edit(buildGiveawayMessage(g,lang)).catch(()=>{});return i.editReply(mtx(lang,'🔥 Entry confirmed. Good luck!','🔥 Tham gia thành công. Chúc bạn may mắn!'));
}

if(i.isButton()&&i.customId?.startsWith('game:')){return require('../modules/games/engine').handleCardGameButton(i);}
if(i.isButton()&&i.customId?.startsWith('spin:')){
  const { runSpinAgain, cashOutSpin }=require('../modules/games/engine');
  const parts=i.customId.split(':');
  const action=parts[1];
  const bet=Number(parts[2])||0;
  const ownerId=action==='again'?parts[3]:parts[2];
  const s=await getGuildSettings(i.guildId);
  if(i.user.id!==ownerId)return i.reply({content:mtx(s.language,'This Spin session belongs to another player.','Phiên Spin này thuộc về người chơi khác.'),flags:64});
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
if(i.customId?.startsWith('globalmail:view:')&&i.isButton()){
  const parts=i.customId.split(':'),lang=parts[2]==='vi'?'vi':'en',mailId=parts[3],M=require('../services/globalMail'),GlobalMail=require('../models/GlobalMail');
  const mail=await GlobalMail.findById(mailId).lean();
  if(!mail||mail.status!=='PUBLISHED')return i.reply({content:mtx(lang,'❌ This mail is no longer available.','❌ Thư này hiện không còn khả dụng.'),flags:64});
  return i.reply({...M.messagePayload(mail,lang,{hideLanguageButtons:true}),flags:64});
}
if(i.customId?.startsWith('globalmail:claim:')&&i.isButton()){
  await i.deferReply({flags:64});
  const s=i.guildId?await getGuildSettings(i.guildId).catch(()=>({language:'en'})):{language:'en'},lang=s?.language||'en';
  try{const r=await require('../services/globalMail').claim(i.customId.split(':')[2],i.user.id);return i.editReply(mtx(lang,`🎁 Claimed **${compactNumber(r.mail.cstarAmount)} <:cxu_coin:1551759873241251912> CXu**!\nGlobal balance: **${compactNumber(r.wallet.cstar)} <:cxu_coin:1551759873241251912> CXu**.`,`🎁 Đã nhận **${compactNumber(r.mail.cstarAmount)} <:cxu_coin:1551759873241251912> CXu**!\nSố dư toàn cầu: **${compactNumber(r.wallet.cstar)} <:cxu_coin:1551759873241251912> CXu**.`));}catch(e){return i.editReply(`❌ ${e.message}`);}
}
if(i.customId?.startsWith('redeem:')){
  const Redeem=require('../commands/premium/redeem');const lang=await require('../services/i18n').guildLang(i.guildId);const parts=i.customId.split(':'),action=parts[1],ownerId=parts[2];
  if(i.user.id!==ownerId)return i.reply({content:mtx(lang,'❌ This Redeem panel belongs to another member. Use `/redeem` or `?redeem` to open your own panel.','❌ Bảng Redeem này thuộc về thành viên khác. Hãy dùng `/redeem` hoặc `?redeem` để mở bảng của riêng bạn.'),flags:64});
  if(action==='open'&&i.isButton())return i.showModal(Redeem.modal(lang,ownerId));
  if(action==='submit'&&i.isModalSubmit()){await i.deferReply({flags:64});const r=await Redeem.redeem(i.guildId,i.user.id,i.fields.getTextInputValue('key'),client,i.guild,lang);return i.editReply(r.ok?mtx(lang,`✅ **CD Key redeemed successfully!**
${r.msg}`,`✅ **Đổi CD Key thành công!**
${r.msg}`):`❌ ${r.msg}`);}return;
}
if(i.isModalSubmit()&&i.customId==='dev:modal:contribution'){if(!(await isAuthorizedDeveloper(i.user.id)))return i.reply({content:'Developer access only.',flags:64});await i.deferReply({flags:64});const G=require('../services/giftService');const uid=i.fields.getTextInputValue('userId').trim(),amount=Number(i.fields.getTextInputValue('amount'));if(!/^\d{15,25}$/.test(uid)||!Number.isFinite(amount))return i.editReply('❌ Invalid User ID or amount.');const w=await G.adjust(uid,amount);await sendDeveloperLog(client,{title:'💠 Contribution Adjusted',description:`Developer: ${i.user.id}\nUser: ${uid}\nDelta: ${amount}\nBalance: ${w.points}`});return i.editReply(`✅ <@${uid}> Contribution: **💎 ${w.points}**`);}
if(i.customId?.startsWith('progdev:')){if(!(await isAuthorizedDeveloper(i.user.id)))return i.reply({content:'Developer access only.',flags:64});return ProgressionDev.handle(i,client);}
if(i.customId?.startsWith('dev:')){
  if(!(await isAuthorizedDeveloper(i.user.id)))return i.reply({content:'Developer access only.',flags:64});
  if(i.isButton()){
    if(i.customId==='dev:close')return i.update({content:'Developer Control Center closed.',embeds:[],components:[]});
    if(i.customId==='dev:home'||i.customId==='dev:refresh')return i.update(await DevUI.home(client));
    if(i.customId==='dev:maintenance:on'){await DevControl.setMaintenance(true);await sendDeveloperLog(client,{title:'🛠️ Maintenance Enabled',description:`Developer: ${i.user.id}`});return i.update(await DevUI.system(client));}
    if(i.customId==='dev:maintenance:off'){await DevControl.setMaintenance(false);await sendDeveloperLog(client,{title:'🛠️ Maintenance Disabled',description:`Developer: ${i.user.id}`});return i.update(await DevUI.system(client));}
    if(i.customId==='dev:petcat:add')return i.showModal(DevUI.petCatalogAddModal());
    if(i.customId==='dev:petcat:asset')return i.showModal(DevUI.petCatalogAssetModal());
    if(i.customId==='dev:petcat:toggle')return i.showModal(DevUI.petCatalogToggleModal());
    if(i.customId==='dev:petcat:delete')return i.showModal(DevUI.petCatalogDeleteModal());
    if(i.customId==='dev:creaturev5:toggle'){const C=require('../services/creatureV5Config'),c=await C.get();await C.set({enabled:!c.enabled});return i.update(await DevUI.creatureV5());}
    if(i.customId==='dev:creaturev5:progression')return i.showModal(DevUI.creatureV5ProgressionModal());
    if(i.customId==='dev:creaturev5:recovery')return i.showModal(DevUI.creatureV5RecoveryModal());
    if(i.customId==='dev:creaturev5:rewards')return i.showModal(DevUI.creatureV5RewardsModal());
    if(i.customId==='dev:creaturev5:missions')return i.showModal(DevUI.creatureV5MissionsModal());
    if(i.customId==='dev:creaturev6:systems')return i.showModal(DevUI.creatureV6SystemsModal());
    if(i.customId==='dev:creaturev6:event')return i.showModal(DevUI.creatureV6EventModal());
    if(i.customId==='dev:creaturev5:resetAsk')return i.reply({content:'⚠️ Reset all Creature Hunt V5 Developer settings to balanced defaults? Player data/progression will NOT be reset.',components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('dev:creaturev5:resetConfirm').setLabel('Confirm V5 Reset').setStyle(ButtonStyle.Danger))],flags:64});
    if(i.customId==='dev:creaturev5:resetConfirm'){await require('../services/creatureV5Config').reset();return i.update({content:'✅ Creature Hunt V5 settings reset. Player data was preserved.',embeds:[],components:[]});}
    if(i.customId==='dev:premium:grant')return i.showModal(DevUI.premiumGrantModal());
    if(i.customId==='dev:premium:revoke')return i.showModal(DevUI.premiumRevokeModal());
    if(i.customId==='dev:key:cstar')return i.showModal(DevUI.keyCstarModal());
    if(i.customId==='dev:key:premium')return i.showModal(DevUI.keyPremiumModal());
    if(i.customId==='dev:key:disable')return i.showModal(DevUI.keyDisableModal());
    if(i.customId==='dev:verification:review')
      return i.showModal(DevUI.verificationUserModal('REVIEW'));

    if(i.customId==='dev:verification:approve')
      return i.showModal(DevUI.verificationUserModal('APPROVE'));

    if(i.customId==='dev:verification:reject')
      return i.showModal(DevUI.verificationUserModal('REJECT'));

    if(i.customId==='dev:verification:revoke')
      return i.showModal(DevUI.verificationUserModal('REVOKE'));
    if(i.customId==='dev:cstar:adjust')return i.showModal(DevUI.cstarModal());
    if(i.customId==='dev:contribution:adjust')return i.showModal(DevUI.contributionModal());
    if(i.customId==='dev:ctoken:adjust')return i.showModal(DevUI.ctokenModal());
    if(i.customId==='dev:bankads:configure')return i.showModal(DevUI.bankAdsModal());
    if(i.customId==='dev:ads:multipliers')return i.showModal(DevUI.adsMultipliersModal());
    if(i.customId==='dev:ads:cancel')return i.showModal(DevUI.adsCancelModal());
    if(i.customId==='dev:blacklist:guild')return i.showModal(DevUI.blacklistModal('guild'));
    if(i.customId==='dev:blacklist:user')return i.showModal(DevUI.blacklistModal('user'));
    if(i.customId==='dev:webroles:set')return i.showModal(DevUI.webRoleModal());
    if(i.customId==='dev:title:create')return i.showModal(DevUI.titleCreateModal());
    if(i.customId==='dev:title:grant')return i.showModal(DevUI.titleGrantModal());
    if(i.customId==='dev:title:revoke')return i.showModal(DevUI.titleRevokeModal());
    if(i.customId==='dev:title:toggle')return i.showModal(DevUI.titleToggleModal());
    if(i.customId==='dev:mail:compose')return i.showModal(DevUI.mailComposeModal());
    if(i.customId==='dev:mail:image')return i.showModal(DevUI.mailImageModal());
    if(i.customId==='dev:cosmetic:refresh')return i.update(await DevUI.cosmetics());

    if(i.customId==='dev:cosmetic:edit')
      return i.showModal(DevUI.cosmeticKeyModal('edit'));

    if(i.customId==='dev:cosmetic:toggle')
      return i.showModal(DevUI.cosmeticKeyModal('toggle'));

    if(i.customId==='dev:cosmetic:delete')
      return i.showModal(DevUI.cosmeticKeyModal('delete'));

    if(i.customId==='dev:fishing:general')return i.showModal(DevUI.fishingGeneralModal());
    if(i.customId==='dev:fishing:rarity')return i.showModal(DevUI.fishingRarityModal());
    if(i.customId==='dev:fishing:bait')return i.showModal(DevUI.fishingBaitModal());
    if(i.customId==='dev:fishing:rod')return i.showModal(DevUI.fishingRodModal());
    if(i.customId==='dev:fishing:score')return i.showModal(DevUI.fishingScoreModal());
    if(i.customId==='dev:fishing:resetAsk')return i.reply({content:'⚠️ Reset ALL Fishing Developer settings to defaults?',components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('dev:fishing:resetConfirm').setLabel('Confirm Reset').setStyle(ButtonStyle.Danger))],flags:64});
    if(i.customId==='dev:fishing:resetConfirm'){await require('../services/fishingSettings').reset(i.user.id);await sendDeveloperLog(client,{title:'🎣 Fishing Settings Reset',description:`Developer: ${i.user.id}`});return i.update({content:'✅ Fishing settings reset to defaults.',components:[]});}
    if(i.customId==='dev:mail:preview'){const M=require('../services/globalMail'),d=await M.latestDraft(i.user.id);if(!d)return i.reply({content:'❌ No active draft.',flags:64});const en=M.messagePayload(d,'en',{hideLanguageButtons:true}),vi=M.messagePayload(d,'vi',{hideLanguageButtons:true});return i.reply({embeds:[...en.embeds,...vi.embeds],flags:64});}
    if(i.customId==='dev:mail:discard'){const M=require('../services/globalMail'),d=await M.latestDraft(i.user.id);if(!d)return i.reply({content:'❌ No active draft.',flags:64});await M.cancelDraft(d._id,i.user.id);return i.update(await DevUI.globalMail(i.user.id));}
    if(i.customId==='dev:mail:send'){await i.deferUpdate();const M=require('../services/globalMail'),d=await M.latestDraft(i.user.id);if(!d)return i.editReply(await DevUI.globalMail(i.user.id));const sent=await M.publish(client,d._id,i.user.id);await sendDeveloperLog(client,{title:'📬 Global Mail Broadcast',description:`Developer: ${i.user.id}\nMail: ${sent.title}\nSent: ${sent.deliverySummary.sent}\nFailed: ${sent.deliverySummary.failed}\nSkipped: ${sent.deliverySummary.skipped}\n<:cxu_coin:1551759873241251912> CXu: ${sent.cstarAmount}`});return i.editReply(await DevUI.globalMail(i.user.id));}
  }
  if(i.isStringSelectMenu()&&i.customId==='dev:cosmetic:createType'){
    const type=i.values[0];
    if(['FRAME','BACKGROUND','NAMEPLATE','EFFECT'].includes(type))
      return i.showModal(DevUI.cosmeticImageModal(type));
    if(['ACCENT','TITLE'].includes(type))
      return i.showModal(DevUI.cosmeticTextModal(type));
    return i.reply({content:'❌ Invalid cosmetic type.',flags:64});
  }

  
  if(i.isStringSelectMenu()&&i.customId==='dev:verification:badge'){
    const badgeType=i.values[0];
    if(!['BLUE','PURPLE'].includes(badgeType))
      return i.reply({content:'❌ Invalid verification badge.',flags:64});

    return i.showModal(
      DevUI.verificationUserModal('APPROVE',badgeType)
    );
  }

  if(i.isStringSelectMenu()&&i.customId==='dev:page'){
    const p=i.values[0];
    if(p==='system')return i.update(await DevUI.system(client));
    if(p==='servers')return i.update(await DevUI.servers(client));
    if(p==='premium')return i.update(await DevUI.premium());
    if(p==='keys')return i.update(await DevUI.keys());
    if(p==='cstar')return i.update(DevUI.cstar());
    if(p==='contribution')return i.update(await DevUI.contribution());
    if(p==='bankads')return i.update(await DevUI.bankAds());
    if(p==='ctoken')return i.update(await DevUI.ctoken());
    if(p==='adsanalytics')return i.update(await DevUI.adsAnalytics());
    if(p==='leveling')return i.update(await require('../services/progressionDev').levelPage());
    if(p==='creaturev5')return i.update(await DevUI.creatureV5());
    if(p==='fishing')return i.update(await DevUI.fishing());
    if(p==='titles')return i.update(await DevUI.titles());
    if(p==='verification')return i.update(await DevUI.verification());
    if(p==='cosmetics')return i.update(await DevUI.cosmetics());
    if(p==='globalmail')return i.update(await DevUI.globalMail(i.user.id));
    if(p==='webroles')return i.update(await DevUI.webRoles());
    if(p==='blacklist')return i.update(await DevUI.blacklist());
  }
  if(i.isModalSubmit()&&i.customId.startsWith('dev:modal:petcat:')){
    await i.deferReply({flags:64});
    try{
      const A=require('../services/petCatalogAdmin'),kind=i.customId.split(':')[3];let pet;
      if(kind==='add'){
        const [id,name]=i.fields.getTextInputValue('identity').split('|').map(x=>x.trim());
        const [rarity,element,group='HUNT']=i.fields.getTextInputValue('meta').split('|').map(x=>x.trim().toUpperCase());
        const [hp,atk,def,spd,aptitude]=i.fields.getTextInputValue('stats').split('|').map(x=>Number(x.trim()));
        const att=i.fields.getUploadedFiles('petAsset',true)?.first();if(!att)throw Error('Thiếu asset Pet.');
        pet=await A.add({id,name,rarity,element,group,hp,atk,def,spd,aptitude,huntable:i.fields.getTextInputValue('huntable').trim()!=='0',assetUrl:att.url});
      }else if(kind==='asset'){
        const att=i.fields.getUploadedFiles('petAsset',true)?.first();if(!att)throw Error('Thiếu asset mới.');pet=await A.replaceAsset(i.fields.getTextInputValue('id').trim(),att.url);
      }else if(kind==='toggle')pet=A.setEnabled(i.fields.getTextInputValue('id').trim(),i.fields.getTextInputValue('enabled').trim()!=='0');
      else if(kind==='delete'){if(i.fields.getTextInputValue('confirm').trim().toUpperCase()!=='DELETE')throw Error('Xác nhận không đúng.');pet=A.retire(i.fields.getTextInputValue('id').trim(),{deleteAsset:true});}
      return i.editReply(`✅ Pet **${pet.name}** (\`${pet.id}\`) đã cập nhật. Catalog/cache có hiệu lực ngay.${pet.retired?' Asset riêng đã xóa; dữ liệu Pet người chơi đang sở hữu vẫn được giữ.':''}`);
    }catch(e){return i.editReply(`❌ ${e.message}`);}
  }
  if(i.isModalSubmit()&&i.customId.startsWith('dev:modal:creaturev6:')){try{const D=require('../models/DeveloperSettings'),kind=i.customId.split(':')[3],parts=id=>i.fields.getTextInputValue(id).split('|').map(x=>Number(x.trim()));let set={};if(kind==='systems'){const [refineStoneBaseCost,multiReleaseMax]=parts('refine'),[refineEnabled,enhanceEnabled,releaseEnabled,multiReleaseEnabled]=parts('switches');set={'creatureV5.refineStoneBaseCost':refineStoneBaseCost,'creatureV5.multiReleaseMax':multiReleaseMax,'creatureV5.refineEnabled':!!refineEnabled,'creatureV5.enhanceEnabled':!!enhanceEnabled,'creatureV5.releaseEnabled':!!releaseEnabled,'creatureV5.multiReleaseEnabled':!!multiReleaseEnabled};}if(kind==='event'){const [eventsEnabled,wheelEnabled]=parts('switches');set={'creatureV5.eventsEnabled':!!eventsEnabled,'creatureV5.wheelEnabled':!!wheelEnabled};}await D.findOneAndUpdate({key:'global'},{$set:set},{upsert:true});return i.reply({content:'✅ Đã lưu cấu hình Creature Hunt. Dữ liệu người chơi được giữ nguyên.',flags:64});}catch(e){return i.reply({content:`❌ ${e.message}`,flags:64});}}
  if(i.isModalSubmit()&&i.customId.startsWith('dev:modal:creaturev5:')){
    try{
      const C=require('../services/creatureV5Config'),kind=i.customId.split(':')[3],parts=id=>i.fields.getTextInputValue(id).split('|').map(x=>Number(x.trim()));let patch={};
      if(kind==='progression'){const [maxStars,starEssenceBase]=parts('values'),[levelUpCxuBase,levelUpCxuPerLevel]=parts('levelCxu');if(!(maxStars>=1&&maxStars<=20&&starEssenceBase>=1&&levelUpCxuBase>=0&&levelUpCxuPerLevel>=0))throw Error('Invalid Stars/Essence/CXu values');patch={maxStars:Math.floor(maxStars),starEssenceBase:Math.floor(starEssenceBase),levelUpCxuBase:Math.floor(levelUpCxuBase),levelUpCxuPerLevel:Math.floor(levelUpCxuPerLevel)};}
      if(kind==='recovery'){const [recoveryFullMinutes,recoveryKoMinutes]=parts('times'),[ready,heal]=parts('rates');if(!(recoveryFullMinutes>=1&&recoveryKoMinutes>=1&&ready>=1&&ready<=100&&heal>=0&&heal<=100))throw Error('Invalid recovery values');patch={recoveryFullMinutes,recoveryKoMinutes,minBattlePct:ready/100,winHealPct:heal/100};}
      if(kind==='rewards'){const [adventureEssenceBase,adventureEssenceStage]=parts('adventure'),[adventureXpBase,adventureXpStage]=parts('adventureXp'),[bossEssenceBase,bossEssenceStage]=parts('boss'),[bossXpBase,bossXpStage]=parts('bossXp'),[adventureCxuBase,adventureCxuStage,bossCxuBase,bossCxuStage]=parts('cxu');if([adventureEssenceBase,adventureEssenceStage,adventureXpBase,adventureXpStage,bossEssenceBase,bossEssenceStage,bossXpBase,bossXpStage,adventureCxuBase,adventureCxuStage,bossCxuBase,bossCxuStage].some(x=>!Number.isFinite(x)||x<0))throw Error('Invalid reward values');patch={adventureEssenceBase,adventureEssenceStage,adventureXpBase,adventureXpStage,bossEssenceBase,bossEssenceStage,bossXpBase,bossXpStage,adventureCxuBase,adventureCxuStage,bossCxuBase,bossCxuStage};}
      if(kind==='missions'){const [dailyHunts,dailyBattles]=parts('dailyReq'),[dailyEssence,dailyGreat,dailyCxu]=parts('dailyReward'),[weeklyCaptures,weeklyBoss]=parts('weeklyReq'),[weeklyEssence,weeklyUltra,weeklyCelestial,weeklyCxu]=parts('weeklyReward');if([dailyHunts,dailyBattles,dailyEssence,dailyGreat,dailyCxu,weeklyCaptures,weeklyBoss,weeklyEssence,weeklyUltra,weeklyCelestial,weeklyCxu].some(x=>!Number.isFinite(x)||x<0)||dailyHunts<1||dailyBattles<1||weeklyCaptures<1||weeklyBoss<1)throw Error('Invalid mission values');patch={dailyHunts,dailyBattles,dailyEssence,dailyGreat,dailyCxu,weeklyCaptures,weeklyBoss,weeklyEssence,weeklyUltra,weeklyCelestial,weeklyCxu};}
      await C.set(patch);return i.reply({content:'✅ Creature Hunt V5 configuration saved. Changes apply globally; player data was preserved.',flags:64});
    }catch(e){return i.reply({content:`❌ ${e.message}`,flags:64});}
  }
  if(i.isModalSubmit()&&i.customId==='dev:modal:adsMultipliers'){
    try{
      const parse=(id)=>{
        const a=i.fields.getTextInputValue(id).split('|').map(x=>Number(x.trim()));
        if(a.length!==3||a.some(x=>!Number.isFinite(x)||x<0.1||x>100))throw new Error('INVALID_MULTIPLIERS');
        return a;
      };
      const a=parse('group1'),b=parse('group2'),c=parse('group3');
      const D=require('../models/DeveloperSettings');
      await D.findOneAndUpdate(
        {key:'global'},
        {$set:{
          'ads.placementMultipliers.HOME':a[0],
          'ads.placementMultipliers.TRENDING':a[1],
          'ads.placementMultipliers.VOTE':a[2],
          'ads.placementMultipliers.GAME_HUB':b[0],
          'ads.placementMultipliers.MARKETPLACE':b[1],
          'ads.placementMultipliers.LEADERBOARD':b[2],
          'ads.placementMultipliers.PROFILE':c[0],
          'ads.placementMultipliers.NEWS_FORUM':c[1],
          'ads.placementMultipliers.NETWORK':c[2]
        },$setOnInsert:{key:'global'}},
        {upsert:true,returnDocument:'after',setDefaultsOnInsert:true}
      );
      return i.reply({content:'✅ Ads placement multipliers updated.',flags:64});
    }catch(e){
      return i.reply({content:`❌ ${e.message}`,flags:64});
    }
  }

  if(i.isModalSubmit()&&i.customId==='dev:modal:adsCancel'){
    try{
      const id=i.fields.getTextInputValue('campaignId').trim();
      if(!/^[a-f0-9]{24}$/i.test(id))return i.reply({content:'❌ Invalid campaign ID.',flags:64});
      const Ad=require('../models/AdCampaign');
      const row=await Ad.findOneAndUpdate(
        {_id:id,status:'ACTIVE'},
        {$set:{status:'CANCELLED',endsAt:new Date()}},
        {returnDocument:'after'}
      );
      if(!row)return i.reply({content:'❌ Campaign not found or no longer active.',flags:64});
      return i.reply({content:`✅ Campaign \`${id}\` cancelled. CToken is not refunded.`,flags:64});
    }catch(e){
      return i.reply({content:`❌ ${e.message}`,flags:64});
    }
  }

  if(i.isModalSubmit()&&i.customId==='dev:modal:bankads'){try{const [on,apy,hours]=i.fields.getTextInputValue('bank').split('|').map(x=>x.trim()),[min,max]=i.fields.getTextInputValue('limits').split('|').map(x=>x.trim()),[adsOn,budget,days]=i.fields.getTextInputValue('ads').split('|').map(x=>x.trim());const num=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));await require('../services/bankService').setConfig({enabled:on.toUpperCase()==='ON',annualRatePercent:num(apy,0,1000),compoundHours:num(hours,1,8760),minDeposit:num(min,0,1e9),maxBalance:num(max,1,1e12)});const D=require('../models/DeveloperSettings'),d=await D.findOneAndUpdate({key:'global'},{$setOnInsert:{key:'global'}},{upsert:true,returnDocument:'after',setDefaultsOnInsert:true});d.ads.enabled=adsOn.toUpperCase()==='ON';d.ads.minBudget=num(budget,1,1e12);d.ads.defaultDays=num(days,1,30);await d.save();return i.reply({content:'✅ CXu Bank & Ads configuration saved.',flags:64});}catch(e){return i.reply({content:`❌ ${e.message}`,flags:64});}}
  if(i.isModalSubmit()){

    if(i.customId.startsWith('dev:modal:cosmeticCreateImage:')){
      try{
        const type=i.customId.split(':')[4];
        const Admin=require('../services/globalCosmeticAdmin');
        const Storage=require('../services/cosmeticAssetStorage');

        const key=i.fields.getTextInputValue('key').trim().toLowerCase();
        const name=i.fields.getTextInputValue('name').trim();
        const price=i.fields.getTextInputValue('price').trim();
        const rarity=i.fields.getTextInputValue('rarity').trim().toUpperCase();

        const att=i.fields.getUploadedFiles('imageFile',true)?.first();

        if(!att || !(att.contentType||'').startsWith('image/'))
          return i.reply({
            content:'❌ Please upload a valid image file.',
            flags:64
          });

        const saved=await Storage.save(type,key,att);

        try{
          const item=await Admin.create({
            key,
            type,
            name,
            price,
            rarity,
            value:saved.reference
          });

          await sendDeveloperLog(client,{
            title:'🛍️ Global Cosmetic Created',
            description:
              `Developer: ${i.user.id}\n`+
              `Key: ${item.key}\n`+
              `Type: ${item.type}\n`+
              `Name: ${item.name}\n`+
              `Price: ${compactNumber(item.price)} CXu`
          });

          return i.reply({
            content:
              `✅ Created **${item.name}**\n`+
              `Type: **${item.type}**\n`+
              `Key: \`${item.key}\`\n`+
              `Price: **${compactNumber(item.price)} <:cxu_coin:1551759873241251912> CXu**\n`+
              `Rarity: **${item.rarity}**`,
            flags:64
          });
        }catch(e){
          await Storage.remove(saved.reference).catch(()=>{});
          throw e;
        }

      }catch(e){
        return i.reply({content:`❌ ${e.message}`,flags:64});
      }
    }

    if(i.customId.startsWith('dev:modal:cosmeticCreateText:')){
      try{
        const type=i.customId.split(':')[4];
        const Admin=require('../services/globalCosmeticAdmin');

        const item=await Admin.create({
          key:i.fields.getTextInputValue('key'),
          type,
          name:i.fields.getTextInputValue('name'),
          price:i.fields.getTextInputValue('price'),
          rarity:i.fields.getTextInputValue('rarity'),
          value:i.fields.getTextInputValue('value')
        });

        await sendDeveloperLog(client,{
          title:'🛍️ Global Cosmetic Created',
          description:
            `Developer: ${i.user.id}\n`+
            `Key: ${item.key}\n`+
            `Type: ${item.type}\n`+
            `Name: ${item.name}\n`+
            `Price: ${compactNumber(item.price)} CXu`
        });

        return i.reply({
          content:
            `✅ Created **${item.name}**\n`+
            `Type: **${item.type}**\n`+
            `Key: \`${item.key}\`\n`+
            `Price: **${compactNumber(item.price)} <:cxu_coin:1551759873241251912> CXu**\n`+
            `Rarity: **${item.rarity}**`,
          flags:64
        });

      }catch(e){
        return i.reply({content:`❌ ${e.message}`,flags:64});
      }
    }

    if(i.customId==='dev:modal:cosmeticEdit'){
      try{
        const Admin=require('../services/globalCosmeticAdmin');

        const item=await Admin.edit(
          i.fields.getTextInputValue('key'),
          {
            name:i.fields.getTextInputValue('name'),
            price:i.fields.getTextInputValue('price'),
            rarity:i.fields.getTextInputValue('rarity'),
            value:i.fields.getTextInputValue('value')
          }
        );

        await sendDeveloperLog(client,{
          title:'✏️ Global Cosmetic Edited',
          description:
            `Developer: ${i.user.id}\n`+
            `Key: ${item.key}\n`+
            `Name: ${item.name}`
        });

        return i.reply({
          content:`✅ Updated **${item.name}** (\`${item.key}\`).`,
          flags:64
        });

      }catch(e){
        return i.reply({content:`❌ ${e.message}`,flags:64});
      }
    }

    if(i.customId==='dev:modal:cosmeticToggle'){
      try{
        const Admin=require('../services/globalCosmeticAdmin');
        const item=await Admin.toggle(
          i.fields.getTextInputValue('key')
        );

        await sendDeveloperLog(client,{
          title:'🔘 Global Cosmetic Status Changed',
          description:
            `Developer: ${i.user.id}\n`+
            `Key: ${item.key}\n`+
            `Enabled: ${item.enabled}`
        });

        return i.reply({
          content:
            `${item.enabled?'🟢':'🔴'} **${item.name}** is now `+
            `**${item.enabled?'ENABLED':'DISABLED'}**.`,
          flags:64
        });

      }catch(e){
        return i.reply({content:`❌ ${e.message}`,flags:64});
      }
    }

    if(i.customId==='dev:modal:cosmeticDelete'){
      try{
        const Admin=require('../services/globalCosmeticAdmin');
        const Storage=require('../services/cosmeticAssetStorage');

        const item=await Admin.remove(
          i.fields.getTextInputValue('key')
        );

        // Keep the stored asset after catalog removal.
        // Existing owners may still own or have this cosmetic equipped.

        await sendDeveloperLog(client,{
          title:'🗃️ Global Cosmetic Retired',
          description:
            `Developer: ${i.user.id}\n`+
            `Key: ${item.key}\n`+
            `Name: ${item.name}`
        });

        return i.reply({
          content:`🗃️ Retired **${item.name}** (\`${item.key}\`).`,
          flags:64
        });

      }catch(e){
        return i.reply({content:`❌ ${e.message}`,flags:64});
      }
    }
    if(i.isModalSubmit()&&i.customId?.startsWith('startupmodal:')){return require('../modules/startup').modalSubmit(i,await fastGameLang(i.guildId));}
    if(i.customId==='dev:modal:fishingGeneral'){const F=require('../services/fishingSettings'),on=x=>String(x).trim().toUpperCase()==='ON',feat=i.fields.getTextInputValue('features').split('|');await F.setGeneral({enabled:on(i.fields.getTextInputValue('enabled')),cooldownMs:Number(i.fields.getTextInputValue('cooldown'))*1000,starterBait:Number(i.fields.getTextInputValue('starter')),maxBag:Number(i.fields.getTextInputValue('bag')),sellAllEnabled:on(feat[0]),rankingEnabled:on(feat[1])},i.user.id);await sendDeveloperLog(client,{title:'🎣 Fishing General Updated',description:`Developer: ${i.user.id}`});return i.reply({content:'✅ Fishing general settings saved.',flags:64});}
    if(i.customId==='dev:modal:fishingRarity'){await require('../services/fishingSettings').setRarities(i.fields.getTextInputValue('rates'),i.user.id);return i.reply({content:'✅ Fishing rarity rates saved. Total = 100%.',flags:64});}
    if(i.customId==='dev:modal:fishingBait'){await require('../services/fishingSettings').setBait(i.fields.getTextInputValue('key').trim().toLowerCase(),i.fields.getTextInputValue('values'),i.user.id);return i.reply({content:'✅ Fishing bait settings saved.',flags:64});}
    if(i.customId==='dev:modal:fishingRod'){await require('../services/fishingSettings').setRod(Number(i.fields.getTextInputValue('level')),i.fields.getTextInputValue('values'),i.user.id);return i.reply({content:'✅ Fishing rod settings saved.',flags:64});}
    if(i.customId==='dev:modal:fishingScore'){await require('../services/fishingSettings').setScore(i.fields.getTextInputValue('values'),i.user.id);return i.reply({content:'✅ Fishing ranking score weights saved.',flags:64});}
    if(i.customId==='dev:modal:premiumGrant'){const p=await DevControl.addPremium(i.fields.getTextInputValue('guildId').trim(),i.fields.getTextInputValue('userId').trim(),i.fields.getTextInputValue('duration').trim(),i.user.id);await sendDeveloperLog(client,{title:'💎 Premium Granted / Extended',description:`Developer: ${i.user.id}\nGuild: ${p.guildId}\nUntil: ${p.expiresAt.toISOString()}`});const g=client.guilds.cache.get(p.guildId);if(g)await applyPremiumBranding(g);return i.reply({content:`✅ Premium granted/extended until <t:${Math.floor(p.expiresAt.getTime()/1000)}:F>.`,flags:64});}
    if(i.customId==='dev:modal:premiumRevoke'){const gid=i.fields.getTextInputValue('guildId').trim();const n=await DevControl.revokePremium(gid,i.user.id);const g=client.guilds.cache.get(gid);if(g)await applyPremiumBranding(g);await sendDeveloperLog(client,{title:'💎 Premium Revoked',description:`Developer: ${i.user.id}\nGuild: ${gid}\nRecords removed: ${n}`});return i.reply({content:`✅ Revoked **${n}** Premium record(s).`,flags:64});}
    if(i.customId==='dev:modal:keyCstar'){const k=await DevControl.createRedeemKey({type:'CSTAR',customCode:i.fields.getTextInputValue('customCode').trim(),amount:parseMoney(i.fields.getTextInputValue('amount'),{min:1}),maxUses:Number(i.fields.getTextInputValue('maxUses')),expiresDays:Number(i.fields.getTextInputValue('expiresDays'))});await sendDeveloperLog(client,{title:'🔑 <:cxu_coin:1551759873241251912> CXu Key Created',description:`Developer: ${i.user.id}\nKey: ${k.code}\nAmount: ${k.cstarAmount}\nMax uses: ${k.maxUses}`});return i.reply({content:`✅ <:cxu_coin:1551759873241251912> CXu key created: \`${k.code}\` • **${k.cstarAmount} <:cxu_coin:1551759873241251912> CXu** • max uses **${k.maxUses}**`,flags:64});}
    if(i.customId==='dev:modal:keyPremium'){const k=await DevControl.createRedeemKey({type:'PREMIUM',customCode:i.fields.getTextInputValue('customCode').trim(),premiumTier:'STANDARD',duration:i.fields.getTextInputValue('duration').trim(),maxUses:Number(i.fields.getTextInputValue('maxUses')),expiresDays:Number(i.fields.getTextInputValue('expiresDays'))});await sendDeveloperLog(client,{title:'🔑 Premium Key Created',description:`Developer: ${i.user.id}\nKey: ${k.code}\nDuration: ${k.premiumDuration}\nMax uses: ${k.maxUses}`});return i.reply({content:`✅ Premium key created: \`${k.code}\` • **${k.premiumDuration}** • max uses **${k.maxUses}**`,flags:64});}
    if(i.customId==='dev:modal:keyDisable'){const k=await DevControl.disableKey(i.fields.getTextInputValue('code'));if(k)await sendDeveloperLog(client,{title:'🔑 CD Key Disabled',description:`Developer: ${i.user.id}\nKey: ${k.code}`});return i.reply({content:k?`✅ Disabled \`${k.code}\`.`:'❌ Key not found.',flags:64});}
    if(i.customId==='dev:modal:cstar'){const uid=i.fields.getTextInputValue('userId'),delta=parseMoney(i.fields.getTextInputValue('delta'),{min:-Number.MAX_SAFE_INTEGER,max:Number.MAX_SAFE_INTEGER});const u=await DevControl.adjustCstar(null,uid,delta);await sendDeveloperLog(client,{title:'⭐ Global <:cxu_coin:1551759873241251912> CXu Adjusted',description:`Developer: ${i.user.id}\nUser: ${uid}\nDelta: ${delta}\nGlobal balance: ${u.cstar}`});return i.reply({content:`✅ New global <:cxu_coin:1551759873241251912> CXu balance: **${u.cstar} <:cxu_coin:1551759873241251912> CXu**.`,flags:64});}
    if(i.customId==='dev:modal:ctoken'){
      const uid=i.fields.getTextInputValue('userId').trim();
      const raw=i.fields.getTextInputValue('delta').trim();
      if(!/^\d{15,25}$/.test(uid))return i.reply({content:'❌ Invalid Discord User ID.',flags:64});
      const delta=parseMoney(raw,{min:-Number.MAX_SAFE_INTEGER,max:Number.MAX_SAFE_INTEGER});
      if(!Number.isSafeInteger(delta)||delta===0)return i.reply({content:'❌ CToken amount must be valid, for example `100`, `2.5K` or `-50`.',flags:64});

      const CToken=require('../services/cTokenService');
      try{
        const wallet=delta>0
          ? await CToken.grant(uid,delta)
          : await CToken.remove(uid,Math.abs(delta));

        await sendDeveloperLog(client,{
          title:'🎟️ CToken Adjusted',
          description:`Developer: ${i.user.id}\nUser: ${uid}\nDelta: ${delta>0?'+':''}${delta}\nBalance: ${wallet.balance}`
        });

        return i.reply({
          content:`✅ <@${uid}> CToken ${delta>0?'granted':'removed'}: **${delta>0?'+':''}${compactNumber(delta)}**\n🎟️ New balance: **${compactNumber(wallet.balance)} CToken**.`,
          flags:64
        });
      }catch(e){
        if(e?.message==='INSUFFICIENT_CTOKEN')
          return i.reply({content:'❌ Cannot remove that amount: the user does not have enough CToken.',flags:64});
        if(e?.message==='INVALID_CTOKEN_AMOUNT')
          return i.reply({content:'❌ Invalid CToken amount.',flags:64});
        throw e;
      }
    }
    if(i.customId?.startsWith('dev:modal:verification:')){
      const V=require('../services/profileVerification');
      const parts=i.customId.split(':');
      const action=parts[3];
      const badgeType=parts[4]==='NONE'?'':parts[4];

      const userId=i.fields.getTextInputValue('userId');
      const note=i.fields.getTextInputValue('note');

      const row=await V.manage({
        userId,
        action,
        badgeType,
        note,
        actorId:i.user.id
      });

      const badge=V.BADGES[row.badgeType];

      await sendDeveloperLog(client,{
        title:'✅ Profile Verification Updated',
        description:
          `Developer: ${i.user.id}\n`+
          `User: ${row.userId}\n`+
          `Status: ${row.status}\n`+
          `Badge: ${row.badgeType||'NONE'}`
      });

      return i.reply({
        content:
          `✅ Verification for <@${row.userId}> → **${row.status}**`+
          (badge?` • ${badge.icon} **${badge.en}**`:'')+
          '.',
        flags:64
      });
    }
    if(i.customId==='dev:modal:titleCreate'){const T=require('../services/customTitles');const t=await T.create({key:i.fields.getTextInputValue('key'),name:i.fields.getTextInputValue('name'),emoji:i.fields.getTextInputValue('emoji'),durationDays:i.fields.getTextInputValue('durationDays'),description:i.fields.getTextInputValue('description'),actorId:i.user.id});await sendDeveloperLog(client,{title:'🏷️ Custom Title Created',description:`Developer: ${i.user.id}\n${t.emoji} ${t.name} (${t.key})`});return i.reply({content:`✅ Created ${t.emoji} **${t.name}** • \`${t.key}\`.`,flags:64});}
    if(i.customId==='dev:modal:titleGrant'){const uid=i.fields.getTextInputValue('userId').trim();if(!/^\d{15,25}$/.test(uid))return i.reply({content:'❌ Invalid Discord User ID.',flags:64});const r=await require('../services/customTitles').grant(uid,i.fields.getTextInputValue('key'),i.user.id);await sendDeveloperLog(client,{title:'🏷️ Custom Title Granted',description:`Developer: ${i.user.id}\nUser: ${uid}\nTitle: ${r.title.key}`});return i.reply({content:`✅ Granted ${r.title.emoji} **${r.title.name}** to <@${uid}>${r.expiresAt?` until <t:${Math.floor(r.expiresAt.getTime()/1000)}:F>`:' permanently'}.`,flags:64});}
    if(i.customId==='dev:modal:titleRevoke'){const uid=i.fields.getTextInputValue('userId').trim();if(!/^\d{15,25}$/.test(uid))return i.reply({content:'❌ Invalid Discord User ID.',flags:64});const key=i.fields.getTextInputValue('key').trim().toUpperCase();await require('../services/customTitles').revoke(uid,key);await sendDeveloperLog(client,{title:'🏷️ Custom Title Revoked',description:`Developer: ${i.user.id}\nUser: ${uid}\nTitle: ${key}`});return i.reply({content:`✅ Revoked \`${key}\` from <@${uid}>.`,flags:64});}
    if(i.customId==='dev:modal:titleToggle'){const t=await require('../services/customTitles').toggle(i.fields.getTextInputValue('key'),i.user.id);return i.reply({content:`✅ ${t.emoji} **${t.name}** is now **${t.enabled?'ENABLED':'DISABLED'}**.`,flags:64});}
    if(i.customId==='dev:modal:mailCompose'){const M=require('../services/globalMail');const raw=i.fields.getTextInputValue('options').trim(),parts=raw?raw.split('|').map(x=>x.trim()):[],cstar=parts[0]||'0',expiresDays=parts[1]||'0';const d=await M.createDraft({actorId:i.user.id,titleEn:i.fields.getTextInputValue('titleEn'),bodyEn:i.fields.getTextInputValue('bodyEn'),titleVi:i.fields.getTextInputValue('titleVi'),bodyVi:i.fields.getTextInputValue('bodyVi'),cstarAmount:cstar,expiresDays});return i.reply({content:`✅ Global Mail draft saved in **EN + VI**.\n🇺🇸 **${d.titleEn}**\n🇻🇳 **${d.titleVi}**\n<:cxu_coin:1551759873241251912> CXu attachment: **${compactNumber(d.cstarAmount)}**\nUse **Image** in the panel if you want to attach artwork, then Preview or Broadcast.`,flags:64});}
    if(i.customId==='dev:modal:mailImage'){const M=require('../services/globalMail');const att=i.fields.getUploadedFiles('imageFile',true)?.first();if(!att||!(att.contentType||'').startsWith('image/'))return i.reply({content:'❌ Please upload an image file.',flags:64});const d=await M.setDraftImage(i.user.id,att.url);return i.reply({content:`✅ Global Mail image attached to draft **${d._id}**.`,flags:64});}
        if(i.customId==='dev:modal:webrole'){const uid=i.fields.getTextInputValue('userId').trim(),role=i.fields.getTextInputValue('role').trim().toLowerCase();const r=await require('../services/webRoleService').set(uid,role,i.user.id);await sendDeveloperLog(client,{title:'👥 Website Role Changed',description:`Developer: ${i.user.id}\nUser: ${uid}\nRole: ${r.role}`});return i.reply({content:`✅ Website role for <@${uid}> is now **${r.role.toUpperCase()}**.`,flags:64});}
        if(i.customId.startsWith('dev:modal:blacklist:')){const kind=i.customId.split(':')[3];const r=await DevControl.toggleBlacklist(kind,i.fields.getTextInputValue('id'));await sendDeveloperLog(client,{title:'🛡️ Blacklist Changed',description:`Developer: ${i.user.id}\n${kind}: ${r.id}\nState: ${r.blocked?'BLACKLISTED':'UNBLOCKED'}`});return i.reply({content:`✅ ${kind} \`${r.id}\` is now **${r.blocked?'BLACKLISTED':'UNBLOCKED'}**.`,flags:64});}
  }
  return;
}
if(i.customId?.startsWith('profile:')&&i.isButton()){
  if(!i.deferred&&!i.replied)await i.deferReply({flags:64});
  const [,action,targetId,viewerId]=i.customId.split(':'),lang=await require('../services/i18n').guildLang(i.guildId),Profile=require('../commands/progression/profile');
  if(String(i.user.id)!==String(viewerId))return i.editReply({content:'❌ This Profile Hub belongs to another viewer.'});
  if(action==='details')return i.editReply({embeds:[await Profile.details(targetId,lang)]});
  if(action==='missions'){if(targetId!==i.user.id)return i.editReply({content:mtx(lang,'Missions are private to their owner.','Nhiệm vụ chỉ hiển thị cho chủ hồ sơ.')});const M=require('../commands/progression/missions');return i.editReply({embeds:[await M.panel(targetId,lang)]});}
  if(action==='ranking'){const R=require('../commands/progression/ranking');return i.editReply({embeds:[await R.build(client,lang)]});}
  if(action==='customize')return i.editReply({content:mtx(lang,'✨ Use `/customize bio` to edit About Me and `/customize equip` to equip owned frame/background/accent/nameplate/title cosmetics.','✨ Dùng `/customize bio` để sửa giới thiệu và `/customize equip` để trang bị frame/background/accent/nameplate/title đã sở hữu.')});
}
if(i.customId?.startsWith('social:')&&i.isButton()&&!i.customId.startsWith('social:collection:')){
  const lang=await require('../services/i18n').guildLang(i.guildId),Social=require('../services/socialProfile');const [,action,targetId]=i.customId.split(':');
  if(action==='collection'){const p=await Social.ensure(targetId);return i.reply({content:mtx(lang,`🎨 Collection: **${p.ownedCosmetics.length}** cosmetic(s)\n${p.ownedCosmetics.map(x=>`• ${x}`).join('\n').slice(0,1500)}`,`🎨 Bộ sưu tập: **${p.ownedCosmetics.length}** cosmetic\n${p.ownedCosmetics.map(x=>`• ${x}`).join('\n').slice(0,1500)}`),flags:64});}
  try{const r=action==='like'?await Social.toggleLike(i.user.id,targetId):await Social.toggleFollow(i.user.id,targetId);return i.reply({content:action==='like'?(r.liked?mtx(lang,'❤️ Profile liked.','❤️ Đã thích hồ sơ.'):mtx(lang,'💔 Like removed.','💔 Đã bỏ thích.')):(r.following?mtx(lang,'➕ Now following this profile.','➕ Đã theo dõi hồ sơ.'):mtx(lang,'➖ Unfollowed.','➖ Đã bỏ theo dõi.')),flags:64});}catch(e){return i.reply({content:mtx(lang,'❌ You cannot use this action on your own profile.','❌ Bạn không thể dùng thao tác này với hồ sơ của chính mình.'),flags:64});}
}
// ===== GLOBAL PROFILE COLLECTION =====
if(i.customId?.startsWith('social:collection:')){
  const targetId=i.customId.split(':')[2];

  if(!targetId)
    return i.reply({content:`❌ ${require('../services/i18n').t(await require('../services/i18n').guildLang(i.guildId),'v6.collection.invalidProfile')}`,flags:64});

  const lang=await require('../services/i18n').guildLang(i.guildId);

  const payload=await GlobalCollection.home(
    targetId,
    i.user.id,
    lang
  );

  return i.reply({...payload,flags:64});
}

if(i.isStringSelectMenu()&&i.customId?.startsWith('collection:type:')){
  const targetId=i.customId.split(':')[2];

  if(!targetId)
    return i.reply({content:`❌ ${require('../services/i18n').t(await require('../services/i18n').guildLang(i.guildId),'v6.collection.invalidProfile')}`,flags:64});

  const type=i.values[0];
  const lang=await require('../services/i18n').guildLang(i.guildId);

  const payload=await GlobalCollection.category(
    targetId,
    i.user.id,
    type,
    lang
  );

  return i.update(payload);
}

if(i.isStringSelectMenu()&&i.customId?.startsWith('collection:equip:')){
  const targetId=i.customId.split(':')[2];

  if(targetId!==i.user.id)
    return i.reply({
      content:`❌ ${require('../services/i18n').t(await require('../services/i18n').guildLang(i.guildId),'v6.collection.ownProfileOnly')}`,
      flags:64
    });

  const key=i.values[0];

  await GlobalCollection.equip(
    targetId,
    key
  );

  const lang=await require('../services/i18n').guildLang(i.guildId);

  const type=String(key).split(':')[0].toUpperCase();

  const payload=await GlobalCollection.category(
    targetId,
    i.user.id,
    type,
    lang
  );

  return i.update(payload);
}
// ===== END GLOBAL PROFILE COLLECTION =====

if(!i.customId?.startsWith('setup:'))return;if(!(await guard(i)))return;
if(i.isButton()){if(i.customId==='setup:close'){const s=await getGuildSettings(i.guildId);return i.update({content:mtx(s.language,'Control Center closed.','Đã đóng Trung tâm điều khiển.'),embeds:[],components:[]});}if(i.customId==='setup:home'||i.customId==='setup:refresh'){const s=await getGuildSettings(i.guildId);return i.update(await UI.buildSetupHome(i.guild,s));}if(i.customId==='setup:premium:corgiEmoji'){if(!(await isPremiumGuild(i.guildId))){const s=await getGuildSettings(i.guildId);return i.reply({content:mtx(s.language,'💎 Premium is required for this customization.','💎 Tùy chỉnh này yêu cầu Corgi Premium đang hoạt động.'),flags:64});}const s=await getGuildSettings(i.guildId);const enabled=!s.premiumBranding?.useCorgiStudioEmoji;await setPremiumBranding(i.guildId,{useCorgiStudioEmoji:enabled});await recordPremiumAudit({guildId:i.guildId,userId:i.user.id,actorId:i.user.id,action:'BRANDING',source:'setup',details:`Corgi Studio emoji ${enabled?'enabled':'disabled'}`});const n=await getGuildSettings(i.guildId);return i.update(await UI.buildPremium(i.guild,n));}if(i.customId.startsWith('setup:premium:')){if(!(await isPremiumGuild(i.guildId)))return i.reply({content:'💎 Premium is required for this customization.',flags:64});const kind=i.customId.split(':')[2];const s=await getGuildSettings(i.guildId);return i.showModal(UI.premiumModal(kind,s.premiumBranding?.[kind==='name'?'botName':'emojiTheme']||'',s));}}
if(i.isStringSelectMenu()){const s=await getGuildSettings(i.guildId);if(i.customId==='setup:page'){const p=i.values[0];if(p==='modules')return i.update(await UI.buildModules(i.guild,s));if(p==='channels')return i.update(await UI.buildChannels(i.guild,s));if(p==='stats')return i.update(await require('../ui/stats').buildStatsPage(i.guild,s));if(p==='events'){const EventUI=require('../ui/events');return i.update(await EventUI.buildEventCenter(i.guild,s));}if(p==='community'){const CUI=require('../ui/community');return i.update(await CUI.home(i.guildId,s));}if(p==='premium')return i.update(await UI.buildPremium(i.guild,s));if(p==='language')return i.update(await UI.buildLanguage(i.guild,s));}if(i.customId==='setup:toggle'){const mod=i.values[0];if(PREMIUM_MODULES.has(mod)&&!(await isPremiumGuild(i.guildId)))return i.reply({content:mtx(s.language,'💎 This module requires active Corgi Premium.','💎 Tính năng này yêu cầu Corgi Premium đang hoạt động.'),flags:64});const n=await toggleModule(i.guildId,mod);return i.update(await UI.buildModules(i.guild,n));}if(i.customId==='setup:setlanguage'){const n=await setLanguage(i.guildId,i.values[0]);const lang=await require('../services/i18n').guildLang(i.guildId);await i.update(await UI.buildLanguage(i.guild,n));try{const gs=await Giveaway.find({guildId:i.guildId,status:{$in:['active','paused']}});for(const g of gs){const ch=await i.guild.channels.fetch(g.channelId).catch(()=>null);const msg=ch?.isTextBased()?await ch.messages.fetch(g.messageId).catch(()=>null):null;if(msg)await msg.edit(buildGiveawayMessage(g,lang)).catch(()=>{});}const cs=await Contest.find({guildId:i.guildId,status:{$in:['SUBMISSION','REVIEW','VOTING','ENDED','PUBLISHED']}});const {refreshContestMessage,refreshGallery}=require('../modules/contest');for(const c of cs){await refreshContestMessage(client,c,lang).catch(()=>{});await refreshGallery(client,c,lang).catch(()=>{});}}catch(e){console.warn('Language UI sync failed:',e.message);}return;}if(i.customId==='setup:channelkey'){return i.update({embeds:i.message.embeds,components:[UI.channelPicker(i.values[0],s),(await UI.buildChannels(i.guild,s)).components[1]]});}}
if(i.isChannelSelectMenu()&&i.customId.startsWith('setup:setchannel:')){const key=i.customId.split(':')[2];const n=await setChannel(i.guildId,key,i.values[0]);return i.update(await UI.buildChannels(i.guild,n));}
if(i.isModalSubmit()&&i.customId.startsWith('setup:premiumModal:')){if(!(await isPremiumGuild(i.guildId))){const s=await getGuildSettings(i.guildId);return i.reply({content:mtx(s.language,'Premium expired.','Premium đã hết hạn.'),flags:64});}const kind=i.customId.split(':')[2],value=i.fields.getTextInputValue('value').trim();const patch={};if(kind==='name')patch.botName=value;if(kind==='emoji')patch.emojiTheme=value;await setPremiumBranding(i.guildId,patch);await recordPremiumAudit({guildId:i.guildId,userId:i.user.id,actorId:i.user.id,action:'BRANDING',source:'setup',details:`Updated ${kind}`});await sendDeveloperLog(client,{title:'💎 Premium Branding Updated',description:`Guild: ${i.guildId}\nUser: ${i.user.id}\nSetting: ${kind}`});try{const { applyPremiumBranding }=require('../services/premium');await applyPremiumBranding(i.guild);}catch(e){console.warn('Premium branding Discord update failed:',e.message);}return i.reply({content:`💎 Premium setting saved: **${kind}**.`,flags:64});}
}catch(e){console.error(e);if(i.isRepliable()){const s=i.guildId?await getGuildSettings(i.guildId).catch(()=>null):null;const msg=mtx(s?.language,'An unexpected error occurred.','Đã xảy ra lỗi không mong muốn.');if(i.replied||i.deferred)await i.followUp({content:msg,flags:64}).catch(()=>{});else await i.reply({content:msg,flags:64}).catch(()=>{});}}}};
