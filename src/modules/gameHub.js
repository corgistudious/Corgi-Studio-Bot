const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle}=require('discord.js');
const {mtx}=require('../services/i18n');
function home(uid,l){
  const e=new EmbedBuilder().setColor(0x5865F2).setTitle('🎮 Corgi Game Hub')
    .setDescription(mtx(l,'Choose a game. All gameplay is button-first.','Chọn trò chơi. Toàn bộ gameplay ưu tiên thao tác bằng nút.'))
    .addFields(
      {name:'🎣 Fishing',value:'Fishdex • rods • bait • selling • ranking',inline:true},
      {name:'🏢 Startup',value:'staff/NPC • finance • products • growth • IPO',inline:true},
      {name:'🐾 Pet Hunt',value:'Dynamic pets • Orb • collection • team • PvE/PvP',inline:true},
      {name:'🦀 Bầu Cua',value:'30-second shared betting round • `/baucua`',inline:true},
      {name:'🎲 Lớn / Nhỏ',value:'30-second shared betting round • `/lon-nho`',inline:true}
    );
  const r=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`gh:fishing:${uid}`).setLabel('Fishing').setEmoji('🎣').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`gh:startup:${uid}`).setLabel('Startup').setEmoji('🏢').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`gh:pet:${uid}`).setLabel('Pet Hunt').setEmoji('🐾').setStyle(ButtonStyle.Secondary)
  );
  return {embeds:[e],components:[r]};
}
async function handle(i,l){
  const[,a,uid]=i.customId.split(':');
  if(String(i.user.id)!==uid)return i.followUp({content:'❌ This Game Hub belongs to another player.',flags:64});
  if(a==='fishing')return i.editReply(await require('./fishing').home(uid,l));
  if(a==='startup')return i.editReply(await require('./startup').home(uid,l));
  if(a==='pet')return i.editReply(await require('./creatureHunt').home(uid,l));
  return i.editReply(home(uid,l));
}
module.exports={home,handle};
