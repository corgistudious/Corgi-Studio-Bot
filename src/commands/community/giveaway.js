const {SlashCommandBuilder,PermissionFlagsBits,ApplicationCommandOptionType}=require('discord.js');
const Giveaway=require('../../models/Giveaway');
const {guildLang,pick}=require('../../services/i18n');
const {isPremiumGuild}=require('../../services/premium');
const {buildGiveawayMessage,finishGiveaway}=require('../../modules/giveaway');
function parseDuration(v){const m=/^(\d+)(m|h|d|w)$/i.exec(String(v||'').trim());if(!m)return null;const n=+m[1],u=m[2].toLowerCase();return n*({m:60000,h:3600000,d:86400000,w:604800000}[u]);}
function validEmoji(v){return /^\p{Extended_Pictographic}$/u.test(v)||/^<a?:\w{2,32}:\d{15,22}>$/.test(v);}
const create=s=>s.setName('create').setDescription('Create a professional giveaway').setDescriptionLocalizations({vi:'Tạo Giveaway chuyên nghiệp'})
.addStringOption(o=>o.setName('prize').setDescription('Giveaway prize').setDescriptionLocalizations({vi:'Phần thưởng'}).setRequired(true).setMaxLength(200))
.addStringOption(o=>o.setName('duration').setDescription('10m, 2h, 3d, 1w').setDescriptionLocalizations({vi:'Thời gian: 10m, 2h, 3d, 1w'}).setRequired(true))
.addIntegerOption(o=>o.setName('winners').setDescription('Number of winners').setDescriptionLocalizations({vi:'Số người thắng'}).setMinValue(1).setMaxValue(20))
.addAttachmentOption(o=>o.setName('photo').setDescription('Upload giveaway image (no URL needed)').setDescriptionLocalizations({vi:'Chọn file ảnh Giveaway, không cần URL'}))
.addStringOption(o=>o.setName('image_shape').setDescription('Preferred image ratio').setDescriptionLocalizations({vi:'Tỷ lệ ảnh mong muốn'}).addChoices({name:'16:9 Banner',value:'16:9'},{name:'1:1 Square (3×3)',value:'1:1'}))
.addRoleOption(o=>o.setName('required_role').setDescription('Optional required role').setDescriptionLocalizations({vi:'Role bắt buộc (tùy chọn)'}))
.addIntegerOption(o=>o.setName('account_age').setDescription('Minimum Discord account age in days').setDescriptionLocalizations({vi:'Tuổi tài khoản tối thiểu (ngày)'}).setMinValue(0).setMaxValue(3650))
.addIntegerOption(o=>o.setName('server_age').setDescription('Minimum days in this server').setDescriptionLocalizations({vi:'Số ngày tối thiểu trong server'}).setMinValue(0).setMaxValue(3650))
.addIntegerOption(o=>o.setName('min_cstar').setDescription('Minimum 🌟Cstar required (not charged)').setDescriptionLocalizations({vi:'🌟Cstar tối thiểu, không trừ tiền'}).setMinValue(0).setMaxValue(1000000000))
.addStringOption(o=>o.setName('join_emoji').setDescription('Premium: custom join emoji; default 🔥').setDescriptionLocalizations({vi:'Premium: đổi emoji Join; mặc định 🔥'}).setMaxLength(100))
.addStringOption(o=>o.setName('description').setDescription('Optional giveaway description').setDescriptionLocalizations({vi:'Mô tả Giveaway (tùy chọn)'}).setMaxLength(1000));
module.exports={
 data:new SlashCommandBuilder().setName('giveaway').setDescription('Professional Corgi Giveaway').setDescriptionLocalizations({vi:'Giveaway Corgi chuyên nghiệp'}).addSubcommand(create)
 .addSubcommand(s=>s.setName('end').setDescription('End now').setDescriptionLocalizations({vi:'Kết thúc ngay'}).addStringOption(o=>o.setName('message_id').setDescription('Giveaway message ID').setRequired(true)))
 .addSubcommand(s=>s.setName('reroll').setDescription('Reroll winners').setDescriptionLocalizations({vi:'Quay lại người thắng'}).addStringOption(o=>o.setName('message_id').setDescription('Giveaway message ID').setRequired(true)))
 .addSubcommand(s=>s.setName('pause').setDescription('Pause giveaway').setDescriptionLocalizations({vi:'Tạm dừng Giveaway'}).addStringOption(o=>o.setName('message_id').setDescription('Giveaway message ID').setRequired(true)))
 .addSubcommand(s=>s.setName('resume').setDescription('Resume giveaway').setDescriptionLocalizations({vi:'Tiếp tục Giveaway'}).addStringOption(o=>o.setName('message_id').setDescription('Giveaway message ID').setRequired(true)))
 .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
 async execute(i,client){const lang=await guildLang(i.guildId),sub=i.options.getSubcommand();
  if(sub!=='create'){const g=await Giveaway.findOne({guildId:i.guildId,messageId:i.options.getString('message_id')});if(!g)return i.reply({content:pick(lang,'Giveaway not found.','Không tìm thấy Giveaway.'),flags:64});
   if(sub==='end'){if(g.status!=='active'&&g.status!=='paused')return i.reply({content:pick(lang,'This giveaway is already closed.','Giveaway này đã đóng.'),flags:64});await i.deferReply({flags:64});await finishGiveaway(g,client);return i.editReply(pick(lang,'✅ Giveaway ended.','✅ Giveaway đã kết thúc.'));}
   if(sub==='reroll'){if(g.status!=='ended')return i.reply({content:pick(lang,'End the giveaway before rerolling.','Hãy kết thúc Giveaway trước khi reroll.'),flags:64});await i.deferReply({flags:64});await finishGiveaway(g,client,{reroll:true});return i.editReply(pick(lang,'🎲 Winners rerolled.','🎲 Đã reroll người thắng.'));}
   const ch=await i.guild.channels.fetch(g.channelId).catch(()=>null),msg=ch?.isTextBased()?await ch.messages.fetch(g.messageId).catch(()=>null):null;
   if(sub==='pause'){if(g.status!=='active')return i.reply({content:pick(lang,'Giveaway is not active.','Giveaway không ở trạng thái hoạt động.'),flags:64});g.remainingMs=Math.max(1000,new Date(g.endsAt)-Date.now());g.status='paused';g.pausedAt=new Date();await g.save();if(msg)await msg.edit(buildGiveawayMessage(g,lang));return i.reply({content:pick(lang,'⏸️ Giveaway paused.','⏸️ Đã tạm dừng Giveaway.'),flags:64});}
   if(sub==='resume'){if(g.status!=='paused')return i.reply({content:pick(lang,'Giveaway is not paused.','Giveaway không ở trạng thái tạm dừng.'),flags:64});g.endsAt=new Date(Date.now()+(g.remainingMs||60000));g.status='active';g.pausedAt=undefined;await g.save();if(msg)await msg.edit(buildGiveawayMessage(g,lang));return i.reply({content:pick(lang,'▶️ Giveaway resumed.','▶️ Giveaway đã tiếp tục.'),flags:64});}
  }
  const ms=parseDuration(i.options.getString('duration'));if(!ms||ms<60000)return i.reply({content:pick(lang,'Duration must be at least 1m. Example: 30m, 2h, 3d, 1w.','Thời gian tối thiểu 1m. Ví dụ: 30m, 2h, 3d, 1w.'),flags:64});
  const photo=i.options.getAttachment('photo');if(photo&&!(photo.contentType||'').startsWith('image/'))return i.reply({content:pick(lang,'The uploaded file must be an image.','File tải lên phải là ảnh.'),flags:64});
  const shape=i.options.getString('image_shape')||'16:9';if(photo?.width&&photo?.height){const ratio=photo.width/photo.height,target=shape==='1:1'?1:16/9;if(Math.abs(ratio-target)>0.12)return i.reply({content:pick(lang,`The selected image is ${photo.width}×${photo.height}. Please upload an image close to ${shape}.`,`Ảnh đã chọn là ${photo.width}×${photo.height}. Hãy tải ảnh gần tỷ lệ ${shape}.`),flags:64});}
  let emoji=i.options.getString('join_emoji')||'🔥';if(emoji!=='🔥'){if(!(await isPremiumGuild(i.guildId)))return i.reply({content:pick(lang,'💎 Custom Giveaway emoji requires active Corgi Premium.','💎 Đổi emoji Giveaway yêu cầu Corgi Premium đang hoạt động.'),flags:64});if(!validEmoji(emoji))return i.reply({content:pick(lang,'Use one Unicode emoji or a valid Discord custom emoji.','Hãy dùng 1 emoji Unicode hoặc custom emoji Discord hợp lệ.'),flags:64});}
  await i.deferReply();const g=new Giveaway({guildId:i.guildId,channelId:i.channelId,prize:i.options.getString('prize'),description:i.options.getString('description')||'',winnerCount:i.options.getInteger('winners')||1,endsAt:new Date(Date.now()+ms),hostId:i.user.id,requiredRoleId:i.options.getRole('required_role')?.id,minAccountAgeDays:i.options.getInteger('account_age')||0,minServerAgeDays:i.options.getInteger('server_age')||0,minCstar:i.options.getInteger('min_cstar')||0,joinEmoji:emoji,imageUrl:photo?.url,imageShape:shape});
  const msg=await i.editReply(buildGiveawayMessage(g,lang));g.messageId=msg.id;await g.save();await msg.edit(buildGiveawayMessage(g,lang));
 },
 async executePrefix(message,args){return message.reply('ℹ️ Professional Giveaway creation uses `/giveaway create` so you can select roles and upload a photo file directly.');}
};
