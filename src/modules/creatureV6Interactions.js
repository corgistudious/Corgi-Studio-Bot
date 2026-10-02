const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle}=require('discord.js'),V=require('../services/creatureV6'),E=require('../commands/pet/event'),Inv=require('../services/creatureInventory'),H=require('./creatureHunt'),{t}=require('../services/creatureV6Locale');
async function handle(i,lang){
 const p=i.customId.split(':'),area=p[1],action=p[2],uid=p[3],num=p[4];
 if(String(i.user.id)!==String(uid))return i.followUp({content:lang==='vi'?'❌ Panel này thuộc về người chơi khác.':'❌ This panel belongs to another player.',flags:64});
 if(area==='inventory')return i.editReply({...await Inv.panel(uid,lang),attachments:[]});
 if(area==='event'){
  if(action==='open')return i.editReply({...await E.panel(uid,lang),attachments:[]});
  try{if(action==='daily'){const r=await V.daily(uid);return i.editReply({embeds:[new EmbedBuilder().setColor(0x57f287).setTitle(`🎁 ${t(lang,'daily')}`).setDescription(`✅ +${r.cxu} CXu • +${r.essence} Essence • +${r.ticket} Lucky Ticket`)],components:(await E.panel(uid,lang)).components})}if(action==='spin'){const r=await V.spin(uid);return i.editReply({embeds:[new EmbedBuilder().setColor(0xf1c40f).setTitle(`🎡 ${t(lang,'wheel')}`).setDescription(`✨ ${t(lang,'reward')}: **${r.prize}**`)],components:(await E.panel(uid,lang)).components})}if(action==='rates')return i.followUp({embeds:[new EmbedBuilder().setColor(0x3498db).setTitle(`📊 ${t(lang,'rates')}`).setDescription(V.WHEEL.map(([x,w])=>`**${w}%** • ${x}`).join('\n'))],flags:64});}catch(e){return i.followUp({content:`❌ ${e.message}`,flags:64})}
 }
 if(area==='pet'){
  if(action==='release')return i.editReply({embeds:[new EmbedBuilder().setColor(0xed4245).setTitle(`⚠️ ${t(lang,'release')}`).setDescription(`${lang==='vi'?'Pet đã thả sẽ **không thể khôi phục**. Pet Yêu thích/Khóa/Đội hình/Đồng hành được bảo vệ.':'Released Pets **cannot be restored**. Favorite/Locked/Team/Companion Pets are protected.'}`)],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`ch6:pet:releaseconfirm:${uid}:${num}`).setLabel(`🗑️ ${t(lang,'confirm')}`).setStyle(ButtonStyle.Danger),new ButtonBuilder().setCustomId(`ch:pet:view:${uid}:${num}`).setLabel(t(lang,'cancel')).setStyle(ButtonStyle.Secondary))],attachments:[]});
  try{
   if(action==='refine'){const r=await V.refine(uid,Number(num));return i.editReply({embeds:[new EmbedBuilder().setColor(0x9b59b6).setTitle(`🔮 ${t(lang,'refine')} • ${r.pet.name}`).setDescription(r.o.refine.map(x=>`**${x.tier}** • ${x.stat} **+${x.value}%**`).join('\n'))],components:(await H.petDetail(uid,num,lang)).components,attachments:[]})}
   if(action==='enhance'){const r=await V.enhance(uid,Number(num));return i.editReply({embeds:[new EmbedBuilder().setColor(r.success?0x57f287:0xed4245).setTitle(`⚒️ ${t(lang,'enhance')} • ${r.pet.name}`).setDescription(`${r.success?'✅':'❌'} **+${r.o.enhance}/15** • ${(r.chance*100).toFixed(0)}%\n🪨 -${r.costStone} Enhance Stone • 🪙 -${r.cxu.toLocaleString()} CXu`)],components:(await H.petDetail(uid,num,lang)).components,attachments:[]})}
   if(action==='releaseconfirm'){const r=await V.release(uid,Number(num));return i.editReply({embeds:[new EmbedBuilder().setColor(0xed4245).setTitle(`🗑️ ${t(lang,'release')}`).setDescription(`**${r.pet.name}**\n${t(lang,'reward')}: **${r.reward.cxu} CXu • ${r.reward.petEssence} Pet Essence**`)],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`ch:nav:collection:${uid}`).setLabel(lang==='vi'?'Bộ sưu tập':'Collection').setStyle(ButtonStyle.Primary))],attachments:[]})}
  }catch(e){return i.followUp({content:`❌ ${e.message}`,flags:64})}
 }
}
module.exports={handle};
