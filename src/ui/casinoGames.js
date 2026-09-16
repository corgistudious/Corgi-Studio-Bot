const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,StringSelectMenuBuilder,ModalBuilder,TextInputBuilder,TextInputStyle,LabelBuilder}=require('discord.js');
const {pick}=require('../services/i18n');

function ownerGuard(owner){return String(owner);}
function sicboHome(owner,lang){
  const embed=new EmbedBuilder().setTitle(pick(lang,'🎲 SIC BO • BETTING TABLE','🎲 TÀI XỈU • BÀN CƯỢC')).setDescription(pick(lang,'Choose a betting area below. After choosing a bet, enter your 🌟Cstar wager in the popup.','Chọn khu vực cược bên dưới. Sau khi chọn cửa, nhập số 🌟Cstar muốn cược trong cửa sổ bật lên.')).addFields(
    {name:pick(lang,'Quick bets','Cược nhanh'),value:pick(lang,'Big / Small • Any Triple','Tài / Xỉu • Bộ ba bất kỳ'),inline:false},
    {name:pick(lang,'Advanced bets','Cược nâng cao'),value:pick(lang,'Total 4–17 • Single / Double / Triple 1–6 • Two-face Pair','Tổng 4–17 • Một mặt / Đôi / Bộ ba 1–6 • Cặp hai mặt'),inline:false},
  ).setFooter({text:pick(lang,'Big/Small lose when the dice form a triple.','Tài/Xỉu thua khi xúc xắc ra bộ ba.')});
  const quick=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`casino:sicbo:bet:big:${owner}`).setLabel(pick(lang,'Big','Tài')).setEmoji('⬆️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`casino:sicbo:bet:small:${owner}`).setLabel(pick(lang,'Small','Xỉu')).setEmoji('⬇️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`casino:sicbo:bet:anytriple:${owner}`).setLabel(pick(lang,'Any Triple','Bộ ba bất kỳ')).setEmoji('🎲').setStyle(ButtonStyle.Secondary),
  );
  const categories=new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`casino:sicbo:category:${owner}`).setPlaceholder(pick(lang,'Choose an advanced bet…','Chọn cửa cược nâng cao…')).addOptions(
    {label:pick(lang,'Total 4–17','Tổng 4–17'),value:'total',emoji:'➕'},
    {label:pick(lang,'Single face 1–6','Một mặt 1–6'),value:'single',emoji:'1️⃣'},
    {label:pick(lang,'Double 1–6','Đôi 1–6'),value:'double',emoji:'2️⃣'},
    {label:pick(lang,'Specific triple 1–6','Bộ ba cụ thể 1–6'),value:'triple',emoji:'3️⃣'},
    {label:pick(lang,'Two-face pair','Cặp hai mặt'),value:'pair',emoji:'🎯'},
  ));
  return {embeds:[embed],components:[quick,categories]};
}
function sicboChoices(owner,lang,category){
  let options=[]; let title='';
  if(category==='total'){title=pick(lang,'Choose total','Chọn tổng điểm');options=Array.from({length:14},(_,i)=>({label:`${i+4}`,value:`total${i+4}`}));}
  if(['single','double','triple'].includes(category)){const names={single:pick(lang,'Single','Một mặt'),double:pick(lang,'Double','Đôi'),triple:pick(lang,'Triple','Bộ ba')};title=names[category];options=Array.from({length:6},(_,i)=>({label:`${names[category]} ${i+1}`,value:`${category}${i+1}`,emoji:['⚀','⚁','⚂','⚃','⚄','⚅'][i]}));}
  if(category==='pair'){title=pick(lang,'Choose two different faces','Chọn hai mặt khác nhau');for(let a=1;a<=6;a++)for(let b=a+1;b<=6;b++)options.push({label:`${a} + ${b}`,value:`pair${a}${b}`});}
  const embed=new EmbedBuilder().setTitle(`🎲 ${title}`).setDescription(pick(lang,'Select a bet below. You will enter the wager next.','Chọn cửa cược bên dưới. Bước tiếp theo sẽ nhập tiền cược.'));
  const menu=new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`casino:sicbo:pick:${owner}`).setPlaceholder(title).addOptions(options));
  const back=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`casino:sicbo:home:x:${owner}`).setLabel(pick(lang,'Back','Quay lại')).setEmoji('↩️').setStyle(ButtonStyle.Secondary));
  return {embeds:[embed],components:[menu,back]};
}
function rouletteHome(owner,lang){
 const embed=new EmbedBuilder().setTitle('🎡 ROULETTE • EUROPEAN 0–36').setDescription(pick(lang,'Choose a common bet or open an advanced number bet. Then enter your 🌟Cstar wager.','Chọn cửa cược phổ biến hoặc mở cược số nâng cao. Sau đó nhập số 🌟Cstar muốn cược.')).addFields({name:pick(lang,'Outside bets','Cược ngoài'),value:pick(lang,'Red/Black • Odd/Even • 1–18/19–36 • Dozens • Columns','Đỏ/Đen • Chẵn/Lẻ • 1–18/19–36 • Dozen • Column')},{name:pick(lang,'Number bets','Cược số'),value:'Straight • Split • Street • Corner • Six Line • Zero Trio • 0-1-2-3 Basket'});
 const colors=new ActionRowBuilder().addComponents(
   new ButtonBuilder().setCustomId(`casino:roulette:bet:color~red:${owner}`).setLabel(pick(lang,'Red','Đỏ')).setEmoji('🔴').setStyle(ButtonStyle.Danger),
   new ButtonBuilder().setCustomId(`casino:roulette:bet:color~black:${owner}`).setLabel(pick(lang,'Black','Đen')).setEmoji('⚫').setStyle(ButtonStyle.Secondary),
   new ButtonBuilder().setCustomId(`casino:roulette:bet:parity~odd:${owner}`).setLabel(pick(lang,'Odd','Lẻ')).setStyle(ButtonStyle.Primary),
   new ButtonBuilder().setCustomId(`casino:roulette:bet:parity~even:${owner}`).setLabel(pick(lang,'Even','Chẵn')).setStyle(ButtonStyle.Primary),
 );
 const common=new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`casino:roulette:common:${owner}`).setPlaceholder(pick(lang,'More outside bets…','Thêm cửa cược ngoài…')).addOptions(
   {label:'1–18',value:'half~1-18'},{label:'19–36',value:'half~19-36'},
   {label:pick(lang,'1st Dozen • 1–12','Dozen 1 • 1–12'),value:'dozen~1'},{label:pick(lang,'2nd Dozen • 13–24','Dozen 2 • 13–24'),value:'dozen~2'},{label:pick(lang,'3rd Dozen • 25–36','Dozen 3 • 25–36'),value:'dozen~3'},
   {label:pick(lang,'Column 1','Cột 1'),value:'column~1'},{label:pick(lang,'Column 2','Cột 2'),value:'column~2'},{label:pick(lang,'Column 3','Cột 3'),value:'column~3'},
 ));
 const advanced=new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`casino:roulette:advanced:${owner}`).setPlaceholder(pick(lang,'Advanced number bets…','Cược số nâng cao…')).addOptions(
   {label:'Straight • 1',value:'straight'},{label:'Split • 2',value:'split'},{label:'Street • 3',value:'street'},{label:'Corner • 4',value:'corner'},{label:'Six Line • 6',value:'sixline'},{label:'Zero Trio • 0-1-2 / 0-2-3',value:'trio'},{label:'Basket • 0-1-2-3',value:'basket'},
 ));
 return {embeds:[embed],components:[colors,common,advanced]};
}
function wagerModal(game,selection,owner,lang){
 const modal=new ModalBuilder().setCustomId(`casinoModal:${game}:${selection}:${owner}`).setTitle(game==='sicbo'?pick(lang,'Sic Bo wager','Tiền cược Tài Xỉu'):pick(lang,'Roulette wager','Tiền cược Roulette'));
 const amount=new TextInputBuilder().setCustomId('amount').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('10 - 1,000,000');
 modal.addLabelComponents(new LabelBuilder().setLabel(pick(lang,'🌟Cstar wager','Số 🌟Cstar muốn cược')).setTextInputComponent(amount));
 return modal;
}
function rouletteAdvancedModal(type,owner,lang){
 const modal=new ModalBuilder().setCustomId(`casinoAdvanced:roulette:${type}:${owner}`).setTitle(pick(lang,'Roulette number bet','Cược số Roulette'));
 const hints={straight:'17',split:'1-2',street:'1-2-3',corner:'1-2-4-5',sixline:'1-2-3-4-5-6',trio:'0-1-2',basket:'0-1-2-3'};
 const pickInput=new TextInputBuilder().setCustomId('pick').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder(hints[type]||'17');
 const amount=new TextInputBuilder().setCustomId('amount').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('10 - 1,000,000');
 modal.addLabelComponents(
   new LabelBuilder().setLabel(pick(lang,'Number selection','Dãy số cược')).setDescription(pick(lang,'Use hyphens between numbers.','Dùng dấu gạch ngang giữa các số.')).setTextInputComponent(pickInput),
   new LabelBuilder().setLabel(pick(lang,'🌟Cstar wager','Số 🌟Cstar muốn cược')).setTextInputComponent(amount),
 );
 return modal;
}

module.exports={sicboHome,sicboChoices,rouletteHome,wagerModal,rouletteAdvancedModal,ownerGuard};
