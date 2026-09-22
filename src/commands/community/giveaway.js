const {SlashCommandBuilder,PermissionFlagsBits}=require('discord.js');
const Giveaway=require('../../models/Giveaway');
const {guildLang,mtx}=require('../../services/i18n');
const {getGuildSettings}=require('../../services/guildSettings');
const {buildGiveawayMessage,finishGiveaway}=require('../../modules/giveaway');
const EventUI=require('../../ui/events');

module.exports={
 data:new SlashCommandBuilder().setName('giveaway').setDescription('Giveaway quick controls').setDescriptionLocalizations({vi:'Điều khiển nhanh Giveaway'})
 .addSubcommand(s=>s.setName('panel').setDescription('Open Giveaway Builder').setDescriptionLocalizations({vi:'Mở bảng cấu hình Giveaway'}))
 .addSubcommand(s=>s.setName('end').setDescription('End now').setDescriptionLocalizations({vi:'Kết thúc ngay'}).addStringOption(o=>o.setName('message_id').setDescription('Giveaway message ID').setRequired(true)))
 .addSubcommand(s=>s.setName('reroll').setDescription('Reroll winners').setDescriptionLocalizations({vi:'Quay lại người thắng'}).addStringOption(o=>o.setName('message_id').setDescription('Giveaway message ID').setRequired(true)))
 .addSubcommand(s=>s.setName('pause').setDescription('Pause giveaway').setDescriptionLocalizations({vi:'Tạm dừng Giveaway'}).addStringOption(o=>o.setName('message_id').setDescription('Giveaway message ID').setRequired(true)))
 .addSubcommand(s=>s.setName('resume').setDescription('Resume giveaway').setDescriptionLocalizations({vi:'Tiếp tục Giveaway'}).addStringOption(o=>o.setName('message_id').setDescription('Giveaway message ID').setRequired(true)))
 .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
 async execute(i,client){const lang=await guildLang(i.guildId),sub=i.options.getSubcommand();
  if(sub==='panel'){const s=await getGuildSettings(i.guildId);return i.reply({...await EventUI.buildGiveawayBuilder(i.guildId,s.language),flags:64});}
  const g=await Giveaway.findOne({guildId:i.guildId,messageId:i.options.getString('message_id')});if(!g)return i.reply({content:mtx(lang,'Giveaway not found.','Không tìm thấy Giveaway.'),flags:64});
  if(sub==='end'){if(g.status!=='active'&&g.status!=='paused')return i.reply({content:mtx(lang,'This giveaway is already closed.','Giveaway này đã đóng.'),flags:64});await i.deferReply({flags:64});await finishGiveaway(g,client);return i.editReply(mtx(lang,'✅ Giveaway ended.','✅ Giveaway đã kết thúc.'));}
  if(sub==='reroll'){if(g.status!=='ended')return i.reply({content:mtx(lang,'End the giveaway before rerolling.','Hãy kết thúc Giveaway trước khi reroll.'),flags:64});await i.deferReply({flags:64});await finishGiveaway(g,client,{reroll:true});return i.editReply(mtx(lang,'🎲 Winners rerolled.','🎲 Đã reroll người thắng.'));}
  const ch=await i.guild.channels.fetch(g.channelId).catch(()=>null),msg=ch?.isTextBased()?await ch.messages.fetch(g.messageId).catch(()=>null):null;
  if(sub==='pause'){if(g.status!=='active')return i.reply({content:mtx(lang,'Giveaway is not active.','Giveaway không ở trạng thái hoạt động.'),flags:64});g.remainingMs=Math.max(1000,new Date(g.endsAt)-Date.now());g.status='paused';g.pausedAt=new Date();await g.save();if(msg)await msg.edit(buildGiveawayMessage(g,lang));return i.reply({content:mtx(lang,'⏸️ Giveaway paused.','⏸️ Đã tạm dừng Giveaway.'),flags:64});}
  if(sub==='resume'){if(g.status!=='paused')return i.reply({content:mtx(lang,'Giveaway is not paused.','Giveaway không ở trạng thái tạm dừng.'),flags:64});g.endsAt=new Date(Date.now()+(g.remainingMs||60000));g.status='active';g.pausedAt=undefined;await g.save();if(msg)await msg.edit(buildGiveawayMessage(g,lang));return i.reply({content:mtx(lang,'▶️ Giveaway resumed.','▶️ Giveaway đã tiếp tục.'),flags:64});}
 },
 async executePrefix(message){const lang=await guildLang(message.guildId);return message.reply(mtx(lang,'🎁 Use `/setup` → **Events** → **Giveaway Builder** to configure a Giveaway. Quick actions remain under `/giveaway`.','🎁 Dùng `/setup` → **Sự kiện** → **Tạo Giveaway** để cấu hình. Các thao tác nhanh vẫn nằm trong `/giveaway`.'));}
};
