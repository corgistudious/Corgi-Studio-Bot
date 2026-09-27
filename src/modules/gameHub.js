const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle}=require('discord.js');
const {mtx}=require('../services/i18n');

function home(uid,lang){
 const e=new EmbedBuilder()
  .setColor(0x5865F2)
  .setTitle('🎮 Corgi Game Hub')
  .setDescription(mtx(lang,'Creature collection plus the classic Corgi-Bot games. Sic Bo and Roulette open their action tables immediately — no extra hub tab.','Sưu tập Pet cùng các game Corgi-Bot quen thuộc. Tài Xỉu và Roulette mở thẳng bàn hành động — không qua tab con.'))
  .addFields(
   {name:'🐾 Creature Hunt',value:mtx(lang,'**NEW • V1** — Hunt 64 creatures, capture them, build a 3-Pet team and play PvP.','**MỚI • V1** — Săn 64 Pet, thu phục, lập đội 3 Pet và PvP.'),inline:false},
   {name:'🎣 Corgi Fishing',value:mtx(lang,'Catch, collect, sell, upgrade rods and chase rare fish.','Câu cá, sưu tầm, bán cá, nâng cần và săn cá hiếm.'),inline:false},
   {name:'🎲 Casino & Social Games',value:mtx(lang,'Sic Bo • Roulette • Poker • Liêng • Spin • Lottery remain available.','Giữ lại Tài Xỉu • Roulette • Poker • Liêng • Spin • Lottery.'),inline:false}
  )
  .setFooter({text:mtx(lang,'Game Hub • Creature Hunt + Fishing + Classic Games','Game Hub • Creature Hunt + Câu cá + Game cổ điển')});
 const row1=new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`gh:pet:${uid}`).setLabel('Creature Hunt').setEmoji('🐾').setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId(`gh:fishing:${uid}`).setLabel(mtx(lang,'Fishing','Câu cá')).setEmoji('🎣').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId(`gh:taixiu:${uid}`).setLabel(mtx(lang,'Sic Bo','Tài Xỉu')).setEmoji('🎲').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId(`gh:roulette:${uid}`).setLabel('Roulette').setEmoji('🎡').setStyle(ButtonStyle.Primary)
 );
 const row2=new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`gh:classic:${uid}`).setLabel(mtx(lang,'Other Games','Game khác')).setEmoji('🕹️').setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId(`gh:refresh:${uid}`).setLabel(mtx(lang,'Refresh','Làm mới')).setEmoji('🔄').setStyle(ButtonStyle.Secondary)
 );
 return{embeds:[e],components:[row1,row2]};
}

function classic(uid,lang){
 const e=new EmbedBuilder().setColor(0x5865F2).setTitle(mtx(lang,'🕹️ Classic Games','🕹️ Game cổ điển')).setDescription(mtx(lang,'These games remain enabled and keep their existing CXu gameplay.','Các game này vẫn được giữ nguyên và tiếp tục dùng CXu.')).addFields(
  {name:'🃏 Poker',value:'`/poker bet:<CXu>` • `?poker <CXu>`',inline:false},
  {name:'🂡 Liêng',value:'`/lieng bet:<CXu>` • `?lieng <CXu>`',inline:false},
  {name:'🎰 Spin',value:'`/spin bet:<CXu>` • `?spin <CXu>`',inline:false},
  {name:'🎟️ Lottery',value:'`/lottery buy` • `/lottery status`',inline:false}
 );
 const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`gh:refresh:${uid}`).setLabel(mtx(lang,'Back to Game Hub','Về Game Hub')).setEmoji('↩️').setStyle(ButtonStyle.Secondary));
 return{embeds:[e],components:[row]};
}

async function handle(i,lang){
 const[,a,owner]=i.customId.split(':');
 if(String(i.user.id)!==String(owner))return i.reply({content:mtx(lang,'❌ This Game Hub belongs to another player.','❌ Game Hub này thuộc người chơi khác.'),flags:64});
 if(a==='pet')return i.update(await require('./creatureHunt').home(owner,lang));
 if(a==='fishing')return i.update(await require('./fishing').home(owner,lang));
 // Direct-action game buttons: no intermediate Game Hub tab.
 if(a==='taixiu')return i.update(require('../ui/casinoGames').sicboHome(owner,lang));
 if(a==='roulette')return i.update(require('../ui/casinoGames').rouletteHome(owner,lang));
 if(a==='classic')return i.update(classic(owner,lang));
 return i.update(home(owner,lang));
}
module.exports={home,classic,handle};
