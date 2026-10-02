const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle}=require('discord.js');
const S=require('./creatureService'),{t}=require('./creatureV6Locale');
const ORBS=[['basic','Basic Orb'],['great','Great Orb'],['ultra','Ultra Orb'],['celestial','Celestial Orb'],['secret','Secret Orb']];
async function panel(uid,lang='en'){
 const p=await S.profile(uid),m=p.materials||{},orbs=p.orbs||{};
 const orbLines=ORBS.map(([k,n])=>`◉ **${n}** × ${orbs[k]||0}`).join('\n');
 const matLines=[['Refine Shard',m.refineShard],['Refine Stone',m.refineStone],['Enhance Stone',m.enhanceStone],['Lucky Ticket',m.luckyTicket],['Pet Essence',m.petEssence]].map(([n,v])=>`• **${n}** × ${v||0}`).join('\n');
 const e=new EmbedBuilder().setColor(0x5865f2).setTitle(`🎒 ${t(lang,'inventory')}`).setDescription(`**◉ ${t(lang,'orbs')}**\n${orbLines}\n\n**🧪 ${t(lang,'petMaterials')}**\n${matLines}\n\n${lang==='vi'?'Vật phẩm chỉ được tiêu hao tại đúng hệ thống. Orb dùng khi Săn Pet; nguyên liệu Tẩy/Cường hóa chỉ dùng khi bạn xác nhận thao tác.':'Items are consumed only by their proper system. Orbs are used during Hunt; Refine/Enhance materials are consumed only after confirmation.'}`);
 const row=new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`ch:nav:hunt:${uid}`).setLabel(`◉ ${lang==='vi'?'Dùng Orb':'Use Orbs'}`).setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId(`ch:nav:collection:${uid}`).setLabel(`🐾 ${lang==='vi'?'Chọn Pet':'Choose Pet'}`).setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId(`ch6:event:open:${uid}`).setLabel(`🎁 ${t(lang,'eventHub')}`).setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId(`ch:nav:home:${uid}`).setLabel(`🏠 ${t(lang,'back')}`).setStyle(ButtonStyle.Secondary));
 return{embeds:[e],components:[row]};
}
module.exports={panel};
