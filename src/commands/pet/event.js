const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle}=require('discord.js');
const V=require('../../services/creatureV6'),{t}=require('../../services/creatureV6Locale');
async function panel(uid,lang='en'){
 const e=new EmbedBuilder().setColor(0xf1c40f).setTitle(`🎁 ${t(lang,'eventHub')}`).setDescription(lang==='vi'?'Nhận phúc lợi hằng ngày và dùng **Lucky Ticket** để quay thưởng. Pet **UR/GR** chỉ đến từ sự kiện/mảnh ghép, không rơi từ Hunt thường.':'Claim daily welfare and spend **Lucky Tickets** on the reward wheel. **UR/GR** Pets are event/fragment-only and never drop from normal Hunt.').addFields({name:`🎁 ${t(lang,'daily')}`,value:'100 CXu • 100 Essence • 1 Lucky Ticket',inline:false},{name:`🎡 ${t(lang,'wheel')}`,value:V.WHEEL.map(([x,w])=>`${w}% • ${x}`).join('\n'),inline:false});
 const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`ch6:event:daily:${uid}`).setLabel(`🎁 ${t(lang,'claim')}`).setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`ch6:event:spin:${uid}`).setLabel(`🎡 ${t(lang,'spin')}`).setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId(`ch6:event:rates:${uid}`).setLabel(`📊 ${t(lang,'rates')}`).setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId(`ch:nav:home:${uid}`).setLabel(`↩ ${t(lang,'back')}`).setStyle(ButtonStyle.Secondary));
 return{embeds:[e],components:[row]};
}
module.exports={panel};
