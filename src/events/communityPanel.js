const {
  Events,EmbedBuilder,ActionRowBuilder,StringSelectMenuBuilder,PermissionFlagsBits,ChannelType,
  ButtonBuilder,ButtonStyle
}=require('discord.js');
const CUI=require('../ui/community');
const CommunityPanel=require('../models/CommunityPanel');
const Ticket=require('../models/Ticket');
const ReactionRole=require('../models/ReactionRole');
const {getGuildSettings}=require('../services/guildSettings');
const {pick}=require('../services/i18n');

function vars(t,m){return String(t||'').replaceAll('{user}',m?`<@${m.id}>`:'@user').replaceAll('{username}',m?.user?.username||'username').replaceAll('{server}',m?.guild?.name||'Server').replaceAll('{count}',String(m?.guild?.memberCount||0));}
function embedFrom(o,m,extra=''){const e=new EmbedBuilder().setColor(0xF59E0B).setTitle(vars(o?.title||'Corgi Studio',m)).setDescription(`${vars(o?.description||'Configure this panel.',m)}${extra||''}`);if(o?.footer)e.setFooter({text:vars(o.footer,m)});if(o?.thumbnailUrl)e.setThumbnail(o.thumbnailUrl);if(o?.imageUrl)e.setImage(o.imageUrl);return e;}
function normalizedEmoji(raw){const x=String(raw||'').trim();if(!x||x.length>100||/\s/.test(x))return null;if(/^<a?:[A-Za-z0-9_]+:\d{15,25}>$/.test(x))return x;try{if(/\p{Emoji}/u.test(x))return x;}catch{}return null;}
function mappingExtra(c,s){const maps=c?.reaction?.mappings||[];if(!maps.length)return '';return `\n\n**${pick(s.language,'Reaction Roles','Reaction Roles')}**\n${maps.map(x=>`${x.emoji} → <@&${x.roleId}>`).join('\n')}`;}

async function publishReaction(i,c,s){
  const o=c.reaction||{},maps=o.mappings||[];
  if(!maps.length)return i.reply({content:pick(s.language,'❌ Add at least one Emoji → Role mapping before publishing.','❌ Hãy thêm ít nhất một liên kết Emoji → Role trước khi xuất bản.'),flags:64});
  const targetId=o.panelChannelId||i.channelId;
  const ch=await i.guild.channels.fetch(targetId).catch(()=>null);
  if(!ch?.isTextBased())return i.reply({content:pick(s.language,'❌ The configured panel channel is unavailable.','❌ Kênh đăng panel đã cấu hình không khả dụng.'),flags:64});
  const me=i.guild.members.me;
  const perms=ch.permissionsFor(me);
  if(!perms?.has([PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.AddReactions,PermissionFlagsBits.ReadMessageHistory]))return i.reply({content:pick(s.language,'❌ I need View Channel, Send Messages, Read Message History and Add Reactions in the target channel.','❌ Bot cần quyền Xem kênh, Gửi tin nhắn, Đọc lịch sử và Thêm Reaction tại kênh đích.'),flags:64});

  let msg=null;
  if(o.panelMessageId&&o.panelChannelId===targetId)msg=await ch.messages.fetch(o.panelMessageId).catch(()=>null);
  const payload={embeds:[embedFrom(o,i.member,mappingExtra(c,s))]};
  if(msg)await msg.edit(payload);else msg=await ch.send(payload);

  if(o.panelMessageId&&o.panelMessageId!==msg.id)await ReactionRole.deleteMany({guildId:i.guildId,messageId:o.panelMessageId});
  await ReactionRole.deleteMany({guildId:i.guildId,messageId:msg.id});
  await msg.reactions.removeAll().catch(()=>null);

  let ok=0,failed=[];
  for(const m of maps){
    try{
      await msg.react(m.emoji);
      await ReactionRole.findOneAndUpdate({messageId:msg.id,emoji:m.emoji},{guildId:i.guildId,channelId:ch.id,messageId:msg.id,emoji:m.emoji,roleId:m.roleId},{upsert:true,returnDocument:'after'});
      ok++;
    }catch{failed.push(m.emoji);}
  }
  await CommunityPanel.updateOne({guildId:i.guildId},{$set:{'reaction.panelChannelId':ch.id,'reaction.panelMessageId':msg.id}});
  return i.reply({content:pick(s.language,`✅ Reaction Role panel published in ${ch}. ${ok}/${maps.length} reaction(s) attached.${failed.length?` Failed: ${failed.join(' ')}`:''}`,`✅ Reaction Role panel đã xuất bản tại ${ch}. Đã gắn ${ok}/${maps.length} reaction.${failed.length?` Lỗi: ${failed.join(' ')}`:''}`),flags:64});
}

module.exports={name:Events.InteractionCreate,async execute(i){
  if(!i.customId?.startsWith('community:'))return;
  const p=i.customId.split(':');
    const [s,c]=await Promise.all([getGuildSettings(i.guildId),CUI.cfg(i.guildId)]);

  if(i.isStringSelectMenu()&&i.customId==='community:ticket:create'){
    const type=c.ticket.types.find(x=>x.key===i.values[0]&&x.enabled);if(!type)return i.reply({content:pick(s.language,'❌ Ticket type unavailable.','❌ Loại Ticket không khả dụng.'),flags:64});
    const existing=await Ticket.findOne({guildId:i.guildId,ownerId:i.user.id,status:{$in:['open','reopened']}}).lean();
    if(existing){const x=await i.guild.channels.fetch(existing.channelId).catch(()=>null);if(x)return i.reply({content:pick(s.language,`You already have an open ticket: ${x}`,`Bạn đã có một Ticket đang mở: ${x}`),flags:64});}
    const last=await Ticket.findOne({guildId:i.guildId}).sort({ticketNo:-1}).lean(),no=(last?.ticketNo||0)+1;
    const staffRoleId=type.staffRoleId||c.ticket.staffRoleId||null;
    const perms=[{id:i.guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},{id:i.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]},{id:i.guild.members.me.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ManageChannels,PermissionFlagsBits.ReadMessageHistory]}];
    if(staffRoleId)perms.push({id:staffRoleId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]});
    const ch=await i.guild.channels.create({name:`${type.prefix||'TKT'}-${String(no).padStart(6,'0')}`,type:ChannelType.GuildText,parent:type.categoryId||s.channels?.ticketCategory||null,permissionOverwrites:perms});
    await Ticket.create({guildId:i.guildId,channelId:ch.id,ownerId:i.user.id,ticketNo:no,typeKey:type.key,typeName:type.name});
    const e=new EmbedBuilder().setColor(0xF59E0B).setTitle(`${type.emoji||'🎫'} ${type.name} • #${String(no).padStart(6,'0')}`).setDescription(`Owner: ${i.user}\nType: **${type.name}**\n\n${pick(s.language,'Please describe your request clearly.','Hãy mô tả yêu cầu của bạn thật rõ ràng.')}`).setTimestamp();
    const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:close').setLabel(pick(s.language,'Close','Đóng')).setEmoji('🔒').setStyle(ButtonStyle.Danger));
    await ch.send({content:`${i.user}${staffRoleId?` <@&${staffRoleId}>`:''}`,embeds:[e],components:[row],allowedMentions:{users:[i.user.id],roles:staffRoleId?[staffRoleId]:[]}});
    return i.reply({content:pick(s.language,`✅ Ticket created: ${ch}`,`✅ Đã tạo Ticket: ${ch}`),flags:64});
  }

  if(!i.member?.permissions?.has(PermissionFlagsBits.ManageGuild))return i.reply({content:pick(s.language,'❌ Manage Server required.','❌ Cần quyền Quản lý Server.'),flags:64});

  if(i.isButton()&&p[1]==='home')return i.update(await CUI.home(i.guildId,s));
  if(i.isButton()&&['welcome','ticket','reaction'].includes(p[1])&&!p[2])return i.update(await CUI.page(i.guildId,p[1],s,c));

  if(i.isButton()&&i.customId==='community:ticket:staff')return i.reply({content:pick(s.language,'Choose the Staff Role that should be added and mentioned when a ticket opens:','Chọn Role Staff sẽ được thêm vào Ticket và được tag khi Ticket mở:'),components:[CUI.ticketStaffRolePicker(s)],flags:64});
  if(i.isRoleSelectMenu()&&i.customId==='community:ticket:staffpick'){
    const role=await i.guild.roles.fetch(i.values[0]).catch(()=>null);
    if(!role||role.id===i.guild.roles.everyone.id)return i.reply({content:pick(s.language,'❌ Please choose a normal Staff Role, not @everyone.','❌ Hãy chọn Role Staff bình thường, không chọn @everyone.'),flags:64});
    await CommunityPanel.updateOne({guildId:i.guildId},{$set:{'ticket.staffRoleId':role.id}});
    return i.update({content:pick(s.language,`✅ Staff Role set to ${role}. Members do not need this role to open tickets; it is only added and mentioned for Staff.`,`✅ Đã đặt Role Staff là ${role}. Member không cần Role này để mở Ticket; Role chỉ được thêm và tag cho Staff.`),components:[]});
  }

  if(i.isButton()&&p[2]==='edit'){
    if(p[1]==='welcome')return i.showModal(CUI.modal('welcome',c,s));
    return i.showModal(CUI.modal(p[1],c,s));
  }

  if(i.isModalSubmit()&&p[1]==='modal'){
    const kind=p[2],patch={};
    for(const k of ['title','description','footer'])patch[k]=i.fields.getTextInputValue(k).trim();
    const thumbnail=i.fields.getUploadedFiles('thumbnailFile',false)?.first()||null;
    const image=i.fields.getUploadedFiles('imageFile',false)?.first()||null;
    for(const [label,att] of [['thumbnail',thumbnail],['image',image]]){
      if(att&&!(att.contentType||'').startsWith('image/'))return i.reply({content:pick(s.language,`❌ ${label} must be an image file.`,`❌ ${label==='thumbnail'?'Thumbnail':'Ảnh lớn'} phải là tệp ảnh.`),flags:64});
    }
    if(thumbnail){patch.thumbnailUrl=thumbnail.url;if(kind==='welcome'||kind==='leave')patch.thumbnailMode='custom';}
    if(image)patch.imageUrl=image.url;
    await CommunityPanel.updateOne({guildId:i.guildId},{$set:Object.fromEntries(Object.entries(patch).map(([k,v])=>[`${kind}.${k}`,v]))});
    return i.reply({content:pick(s.language,'✅ Saved. Uploaded images were attached directly from Discord. Use Preview / Publish.','✅ Đã lưu. Ảnh được đính kèm trực tiếp từ Discord. Hãy dùng Xem trước / Xuất bản.'),flags:64});
  }

  // Reaction Role Builder: choose Role -> enter Emoji -> save mapping.
  if(i.isButton()&&i.customId==='community:reaction:add'){
    const maps=c.reaction?.mappings||[];if(maps.length>=20)return i.reply({content:pick(s.language,'❌ Discord supports up to 20 reactions per message. Remove one mapping first.','❌ Discord hỗ trợ tối đa 20 reaction trên một tin nhắn. Hãy xóa bớt một liên kết.'),flags:64});
    return i.reply({content:pick(s.language,'Choose the Role for this reaction:','Chọn Role cho reaction này:'),components:[CUI.reactionRolePicker(s)],flags:64});
  }
  if(i.isRoleSelectMenu()&&i.customId==='community:reaction:rolepick'){
    const role=await i.guild.roles.fetch(i.values[0]).catch(()=>null);
    if(!role||role.id===i.guild.roles.everyone.id||role.managed)return i.reply({content:pick(s.language,'❌ That role cannot be assigned by Reaction Role.','❌ Role này không thể được cấp bằng Reaction Role.'),flags:64});
    if(!i.guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)||role.position>=i.guild.members.me.roles.highest.position)return i.reply({content:pick(s.language,'❌ Move the Corgi-Bot role above the selected role and give it Manage Roles.','❌ Hãy đưa Role Corgi-Bot lên trên Role đã chọn và cấp quyền Quản lý Role.'),flags:64});
    return i.showModal(CUI.reactionEmojiModal(role.id,s));
  }
  if(i.isModalSubmit()&&p[1]==='reaction'&&p[2]==='emoji'){
    const roleId=p[3],emoji=normalizedEmoji(i.fields.getTextInputValue('emoji'));
    if(!emoji)return i.reply({content:pick(s.language,'❌ Invalid emoji. Use one Unicode emoji or a custom emoji like <:name:id>.','❌ Emoji không hợp lệ. Dùng một Unicode emoji hoặc custom emoji dạng <:name:id>.'),flags:64});
    const fresh=await CUI.cfg(i.guildId),maps=[...(fresh.reaction?.mappings||[])];
    const existing=maps.findIndex(x=>x.emoji===emoji);
    if(existing>=0)maps[existing].roleId=roleId;else{
      if(maps.length>=20)return i.reply({content:pick(s.language,'❌ Maximum 20 mappings reached.','❌ Đã đạt tối đa 20 liên kết.'),flags:64});
      maps.push({emoji,roleId});
    }
    await CommunityPanel.updateOne({guildId:i.guildId},{$set:{'reaction.mappings':maps}});
    return i.reply({content:pick(s.language,`✅ Saved ${emoji} → <@&${roleId}>.`,`✅ Đã lưu ${emoji} → <@&${roleId}>.`),flags:64});
  }
  if(i.isButton()&&i.customId==='community:reaction:remove'){
    const row=CUI.reactionRemoveMenu(c,s);if(!row)return i.reply({content:pick(s.language,'No mappings to remove.','Không có liên kết nào để xóa.'),flags:64});
    return i.reply({content:pick(s.language,'Choose a mapping to remove:','Chọn liên kết cần xóa:'),components:[row],flags:64});
  }
  if(i.isStringSelectMenu()&&i.customId==='community:reaction:removeSelect'){
    const idx=Number(i.values[0]),maps=[...(c.reaction?.mappings||[])];if(!Number.isInteger(idx)||!maps[idx])return i.reply({content:pick(s.language,'Mapping not found.','Không tìm thấy liên kết.'),flags:64});
    const [removed]=maps.splice(idx,1);await CommunityPanel.updateOne({guildId:i.guildId},{$set:{'reaction.mappings':maps}});
    return i.update({content:pick(s.language,`✅ Removed ${removed.emoji} → <@&${removed.roleId}>.`,`✅ Đã xóa ${removed.emoji} → <@&${removed.roleId}>.`),components:[]});
  }
  if(i.isButton()&&i.customId==='community:reaction:channel')return i.reply({content:pick(s.language,'Choose where the Reaction Role panel will be published:','Chọn kênh sẽ đăng Reaction Role panel:'),components:[CUI.reactionChannelPicker(s)],flags:64});
  if(i.isChannelSelectMenu()&&i.customId==='community:reaction:channelpick'){
    await CommunityPanel.updateOne({guildId:i.guildId},{$set:{'reaction.panelChannelId':i.values[0]}});
    return i.update({content:pick(s.language,`✅ Panel channel set to <#${i.values[0]}>.`,`✅ Đã chọn kênh panel: <#${i.values[0]}>.`),components:[]});
  }

  if(i.isButton()&&p[2]==='preview'){
    const o=c[p[1]];
    if(p[1]==='ticket'){
      const menu=new StringSelectMenuBuilder().setCustomId('community:ticket:create').setPlaceholder(pick(s.language,'Choose ticket type','Chọn loại Ticket')).addOptions(c.ticket.types.filter(x=>x.enabled).slice(0,25).map(x=>({label:x.name,value:x.key,emoji:x.emoji,description:x.description?.slice(0,100)})));
      return i.reply({embeds:[embedFrom(o,i.member)],components:[new ActionRowBuilder().addComponents(menu)],flags:64});
    }
    if(p[1]==='reaction')return i.reply({embeds:[embedFrom(o,i.member,mappingExtra(c,s))],flags:64});
    return i.reply({embeds:[embedFrom(o,i.member)],flags:64});
  }

  if(i.isButton()&&p[2]==='publish'){
    if(p[1]==='reaction')return publishReaction(i,c,s);
    const o=c[p[1]],ch=i.channel;
    if(p[1]==='ticket'){
      const menu=new StringSelectMenuBuilder().setCustomId('community:ticket:create').setPlaceholder(pick(s.language,'Choose ticket type','Chọn loại Ticket')).addOptions(c.ticket.types.filter(x=>x.enabled).slice(0,25).map(x=>({label:x.name,value:x.key,emoji:x.emoji,description:x.description?.slice(0,100)})));
      await ch.send({embeds:[embedFrom(o,i.member)],components:[new ActionRowBuilder().addComponents(menu)]});
    }else await ch.send({embeds:[embedFrom(o,i.member)]});
    return i.reply({content:pick(s.language,'✅ Panel published in this channel.','✅ Panel đã được xuất bản trong kênh này.'),flags:64});
  }
}};
