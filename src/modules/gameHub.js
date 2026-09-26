const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle}=require('discord.js');
const {mtx}=require('../services/i18n');
function home(uid,lang){
 const e=new EmbedBuilder().setColor(0x5865F2).setTitle('🎮 Corgi Game Hub').setDescription(mtx(lang,'Your game library. Each game keeps its own progression and economy rules. More games will be added through future updates.','Thư viện trò chơi của bạn. Mỗi game có tiến trình và luật kinh tế riêng. Các game mới sẽ được bổ sung qua từng bản cập nhật.')).addFields(
 {name:'🎣 Corgi Fishing',value:mtx(lang,'**LIVE** • Catch, collect, sell, upgrade rods and chase rare fish.','**ĐANG MỞ** • Câu cá, sưu tầm, bán cá, nâng cần và săn cá hiếm.'),inline:false},
 {name:'🌾 Corgi Farm',value:mtx(lang,'**LIVE** • Plant crops, harvest, manage seeds, raise animals, process goods and complete orders.','**ĐANG MỞ** • Trồng trọt, thu hoạch, quản lý giống, nuôi vật nuôi, chế biến và hoàn thành đơn hàng.'),inline:false},
 {name:'🌍 Corgi Frontier',value:mtx(lang,'**Independent World** • Frontier is no longer inside Game Hub. Use `/frontier` for the survival exploration adventure.','**Thế giới độc lập** • Frontier đã tách khỏi Game Hub. Dùng `/frontier` để bắt đầu hành trình sinh tồn khai phá.'),inline:false}
 ).setFooter({text:mtx(lang,'Game Hub • Fishing + Farming • More games coming later','Game Hub • Fishing + Nông Trại • Sẽ bổ sung thêm game')});
 const row=new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`gh:fishing:${uid}`).setLabel(mtx(lang,'Fishing','Câu cá')).setEmoji('🎣').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId(`gh:farm:${uid}`).setLabel(mtx(lang,'Farm','Nông trại')).setEmoji('🌾').setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId(`gh:refresh:${uid}`).setLabel(mtx(lang,'Refresh','Làm mới')).setEmoji('🔄').setStyle(ButtonStyle.Secondary)
 );return{embeds:[e],components:[row]};
}
async function handle(i,lang){const[,a,owner]=i.customId.split(':');if(String(i.user.id)!==String(owner))return i.reply({content:mtx(lang,'❌ This Game Hub belongs to another player.','❌ Game Hub này thuộc người chơi khác.'),flags:64});if(a==='fishing')return i.update(await require('./fishing').home(owner,lang));if(a==='farm')return i.update(await require('./farm').home(owner,lang));return i.update(home(owner,lang));}
module.exports={home,handle};
