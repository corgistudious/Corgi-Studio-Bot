const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const UserEconomy = require('../../models/UserEconomy');
const { guildLang, pick } = require('../../services/i18n');

const MIN_BET = 10;
const MAX_BET = 1_000_000;
const CURRENCY = '🌟Cstar';

async function ensureWallet(guildId, userId) {
  return UserEconomy.findOneAndUpdate(
    { guildId, userId },
    { $setOnInsert: { guildId, userId } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
}

async function settle(guildId, userId, bet, net) {
  const row = await ensureWallet(guildId, userId);
  if (row.cstar < bet) return { ok: false, balance: row.cstar };
  row.cstar = Math.max(0, row.cstar + net);
  await row.save();
  return { ok: true, balance: row.cstar };
}

function validateBet(value) {
  const bet = Number(value);
  return Number.isInteger(bet) && bet >= MIN_BET && bet <= MAX_BET;
}

function money(n) { return Number(n || 0).toLocaleString('en-US'); }
function outcomeLine(lang, net) {
  if (net > 0) return pick(lang, `✅ Profit: **+${money(net)} ${CURRENCY}**`, `✅ Lãi: **+${money(net)} ${CURRENCY}**`);
  if (net < 0) return pick(lang, `❌ Loss: **${money(net)} ${CURRENCY}**`, `❌ Thua: **${money(net)} ${CURRENCY}**`);
  return pick(lang, '➖ Push • bet returned', '➖ Hòa • hoàn cược');
}

function resultEmbed({ lang, title, description, net, balance, footer }) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(`${description}\n\n${outcomeLine(lang, net)}\n🌟 ${pick(lang,'Balance','Số dư')}: **${money(balance)} ${CURRENCY}**`)
    .setFooter({ text: footer || pick(lang, 'Corgi Studio • Entertainment only • No real-money value', 'Corgi Studio • Chỉ giải trí • Không có giá trị tiền thật') })
    .setTimestamp();
}

function dice() { return 1 + Math.floor(Math.random() * 6); }
const DICE = ['⚀','⚁','⚂','⚃','⚄','⚅'];

function cardDeck() {
  const suits = ['♠️','♥️','♦️','♣️'];
  const ranks = [2,3,4,5,6,7,8,9,10,11,12,13,14];
  const deck = [];
  for (const s of suits) for (const r of ranks) deck.push({r,s});
  for (let i=deck.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; }
  return deck;
}
function rankText(r){return r<=10?String(r):({11:'J',12:'Q',13:'K',14:'A'})[r];}
function handText(hand){return hand.map(c=>`${rankText(c.r)}${c.s}`).join('  ');}
function evaluate(hand){
  const ranks=hand.map(c=>c.r).sort((a,b)=>b-a); const counts=new Map(); ranks.forEach(r=>counts.set(r,(counts.get(r)||0)+1));
  const groups=[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]); const flush=hand.every(c=>c.s===hand[0].s);
  let uniq=[...new Set(ranks)]; if(uniq.includes(14))uniq=[...uniq,1]; uniq.sort((a,b)=>b-a);
  let straightHigh=0; for(let i=0;i<=uniq.length-5;i++){if(uniq[i]-uniq[i+4]===4){straightHigh=uniq[i];break;}}
  let cat=0,name='High Card',tie=ranks;
  if(straightHigh&&flush){cat=8;name='Straight Flush';tie=[straightHigh];}
  else if(groups[0][1]===4){cat=7;name='Four of a Kind';tie=[groups[0][0],groups[1][0]];}
  else if(groups[0][1]===3&&groups[1]?.[1]===2){cat=6;name='Full House';tie=[groups[0][0],groups[1][0]];}
  else if(flush){cat=5;name='Flush';tie=ranks;}
  else if(straightHigh){cat=4;name='Straight';tie=[straightHigh];}
  else if(groups[0][1]===3){cat=3;name='Three of a Kind';tie=[groups[0][0],...groups.filter(x=>x[1]===1).map(x=>x[0]).sort((a,b)=>b-a)];}
  else if(groups[0][1]===2&&groups[1]?.[1]===2){cat=2;name='Two Pair';tie=[Math.max(groups[0][0],groups[1][0]),Math.min(groups[0][0],groups[1][0]),groups.find(x=>x[1]===1)[0]];}
  else if(groups[0][1]===2){cat=1;name='One Pair';tie=[groups[0][0],...groups.filter(x=>x[1]===1).map(x=>x[0]).sort((a,b)=>b-a)];}
  return {cat,name,tie};
}
function compareHands(a,b){const A=evaluate(a),B=evaluate(b);if(A.cat!==B.cat)return {cmp:A.cat>B.cat?1:-1,A,B};const n=Math.max(A.tie.length,B.tie.length);for(let i=0;i<n;i++){if((A.tie[i]||0)!==(B.tie[i]||0))return {cmp:(A.tie[i]||0)>(B.tie[i]||0)?1:-1,A,B};}return {cmp:0,A,B};}
function pokerName(lang,name){const vi={ 'High Card':'Mậu thầu','One Pair':'Một đôi','Two Pair':'Hai đôi','Three of a Kind':'Bộ ba','Straight':'Sảnh','Flush':'Thùng','Full House':'Cù lũ','Four of a Kind':'Tứ quý','Straight Flush':'Thùng phá sảnh' };return lang==='vi'?(vi[name]||name):name;}

const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
function rouletteColor(n){return n===0?'green':RED.has(n)?'red':'black';}
function colorIcon(c){return c==='red'?'🔴':c==='black'?'⚫':'🟢';}

async function runTaixiu({guildId,userId,bet,pickValue}){
  const lang=await guildLang(guildId); if(!validateBet(bet))return {error:pick(lang,`Bet must be between 10 and 1,000,000 ${CURRENCY}.`,`Mức cược phải từ 10 đến 1.000.000 ${CURRENCY}.`)}; const d=[dice(),dice(),dice()]; const sum=d.reduce((a,b)=>a+b,0); const result=sum>=11?'tai':'xiu'; const net=result===pickValue?bet:-bet; const settled=await settle(guildId,userId,bet,net); if(!settled.ok)return {error:pick(lang,`Not enough ${CURRENCY}.`,`Bạn không đủ ${CURRENCY}.`)};
  const choice=pickValue==='tai'?'TÀI':'XỈU'; const resultName=result==='tai'?'TÀI':'XỈU';
  return {embed:resultEmbed({lang,title:'🎲 TÀI XỈU • CORGI CASINO',description:`${DICE[d[0]-1]} ${DICE[d[1]-1]} ${DICE[d[2]-1]}\n**${d.join(' + ')} = ${sum} → ${resultName}**\n${pick(lang,'Your pick','Bạn chọn')}: **${choice}** • ${pick(lang,'Bet','Cược')}: **${money(bet)} ${CURRENCY}**`,net,balance:settled.balance})};
}

async function runPoker({guildId,userId,bet}){
  const lang=await guildLang(guildId); if(!validateBet(bet))return {error:pick(lang,`Bet must be between 10 and 1,000,000 ${CURRENCY}.`,`Mức cược phải từ 10 đến 1.000.000 ${CURRENCY}.`)}; const deck=cardDeck(),you=deck.splice(0,5),dealer=deck.splice(0,5); const r=compareHands(you,dealer); const net=r.cmp>0?bet:r.cmp<0?-bet:0; const settled=await settle(guildId,userId,bet,net); if(!settled.ok)return {error:pick(lang,`Not enough ${CURRENCY}.`,`Bạn không đủ ${CURRENCY}.`)};
  return {embed:resultEmbed({lang,title:'🃏 POKER • HEADS-UP',description:`**${pick(lang,'Your hand','Bài của bạn')}**\n${handText(you)}\n→ **${pokerName(lang,r.A.name)}**\n\n**Dealer**\n${handText(dealer)}\n→ **${pokerName(lang,r.B.name)}**\n\n${pick(lang,'Bet','Cược')}: **${money(bet)} ${CURRENCY}**`,net,balance:settled.balance})};
}

async function runRoulette({guildId,userId,bet,pickValue}){
  const lang=await guildLang(guildId); if(!validateBet(bet))return {error:pick(lang,`Bet must be between 10 and 1,000,000 ${CURRENCY}.`,`Mức cược phải từ 10 đến 1.000.000 ${CURRENCY}.`)}; const raw=String(pickValue||'').trim().toLowerCase(); let kind,value;
  if(/^\d+$/.test(raw)&&Number(raw)>=0&&Number(raw)<=36){kind='number';value=Number(raw);} else if(['red','black','green','do','đỏ','den','đen','xanh'].includes(raw)){kind='color';value=['red','do','đỏ'].includes(raw)?'red':['black','den','đen'].includes(raw)?'black':'green';} else return {error:pick(lang,'Pick red, black, green, or a number from 0 to 36.','Chọn red/black/green (đỏ/đen/xanh) hoặc một số từ 0 đến 36.')};
  const n=Math.floor(Math.random()*37),c=rouletteColor(n); let net=-bet;
  if(kind==='number'&&value===n)net=bet*35; else if(kind==='color'&&value===c)net=value==='green'?bet*17:bet;
  const settled=await settle(guildId,userId,bet,net); if(!settled.ok)return {error:pick(lang,`Not enough ${CURRENCY}.`,`Bạn không đủ ${CURRENCY}.`)};
  const chosen=kind==='number'?`#${value}`:`${colorIcon(value)} ${value.toUpperCase()}`;
  return {embed:resultEmbed({lang,title:'🎡 ROULLETTE • LIVE TABLE',description:`${pick(lang,'Ball landed on','Bi dừng tại')}: **${colorIcon(c)} ${n} • ${c.toUpperCase()}**\n${pick(lang,'Your pick','Bạn chọn')}: **${chosen}**\n${pick(lang,'Bet','Cược')}: **${money(bet)} ${CURRENCY}**`,net,balance:settled.balance})};
}

// ─────────────────────────────────────────────────────────────
// SPIN 12 CON GIÁP
// Bet is deducted immediately. Winnings are held in spinPending
// until the player presses “Rút 🌟Cstar”. This is virtual currency only.
// ─────────────────────────────────────────────────────────────
const ZODIAC = [
  { emoji:'🐭', vi:'Tý',   en:'Rat',     mult:2.0 },
  { emoji:'🐮', vi:'Sửu',  en:'Ox',      mult:2.0 },
  { emoji:'🐯', vi:'Dần',  en:'Tiger',   mult:2.2 },
  { emoji:'🐱', vi:'Mão',  en:'Rabbit',  mult:2.2 },
  { emoji:'🐲', vi:'Thìn', en:'Dragon',  mult:8.0 },
  { emoji:'🐍', vi:'Tỵ',   en:'Snake',   mult:2.5 },
  { emoji:'🐎', vi:'Ngọ',  en:'Horse',   mult:2.8 },
  { emoji:'🐐', vi:'Mùi',  en:'Goat',    mult:2.8 },
  { emoji:'🐵', vi:'Thân', en:'Monkey',  mult:3.0 },
  { emoji:'🐔', vi:'Dậu',  en:'Rooster', mult:3.2 },
  { emoji:'🐶', vi:'Tuất', en:'Dog',     mult:3.5 },
  { emoji:'🐷', vi:'Hợi',  en:'Pig',     mult:3.5 },
];
const PAYLINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];
function zodiacPick(){ return ZODIAC[Math.floor(Math.random()*ZODIAC.length)]; }
function spinBoard(){ return Array.from({length:9}, zodiacPick); }
function boardText(board){
  const row = n => board.slice(n,n+3).map(x=>x.emoji).join('  │  ');
  return `┏━━━━━━━━━━━━━━━┓\n┃  ${row(0)}  ┃\n┃  ${row(3)}  ┃\n┃  ${row(6)}  ┃\n┗━━━━━━━━━━━━━━━┛`;
}
function evaluateSpin(board, bet){
  const wins=[];
  for(const line of PAYLINES){
    const [a,b,c]=line;
    if(board[a].emoji===board[b].emoji && board[b].emoji===board[c].emoji){
      wins.push({animal:board[a], line, payout:Math.floor(bet*board[a].mult)});
    }
  }
  return {wins,payout:wins.reduce((s,x)=>s+x.payout,0)};
}
function spinButtons(userId,bet,pending,disabled=false){
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`spin:again:${bet}:${userId}`).setLabel('Quay tiếp').setEmoji('🎰').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`spin:cashout:${userId}`).setLabel('Rút 🌟Cstar').setEmoji('💸').setStyle(ButtonStyle.Success).setDisabled(disabled || pending<=0),
  )];
}
function spinEmbed({lang,board,bet,payout,pending,balance,wins,cashedOut=0}){
  const hit = wins?.length
    ? wins.map(w=>`${w.animal.emoji} **${lang==='vi'?w.animal.vi:w.animal.en} ×${w.animal.mult}**  →  +${money(w.payout)} ${CURRENCY}`).join('\n')
    : pick(lang,'No winning line this round.','Chưa có hàng trúng ở lượt này.');
  const status = cashedOut>0
    ? `\n\n💸 ${pick(lang,'Cashed out','Đã rút')}: **+${money(cashedOut)} ${CURRENCY}**`
    : '';
  return new EmbedBuilder()
    .setTitle(pick(lang,'🎰 CORGI SPIN • 12 ZODIAC','🎰 CORGI SPIN • 12 CON GIÁP'))
    .setDescription(`${boardText(board)}\n\n${hit}${status}`)
    .addFields(
      {name:pick(lang,'Bet','Cược'),value:`**${money(bet)} ${CURRENCY}**`,inline:true},
      {name:pick(lang,'Round reward','Thưởng lượt'),value:`**+${money(payout)} ${CURRENCY}**`,inline:true},
      {name:pick(lang,'Pending cashout','Chờ rút'),value:`**${money(pending)} ${CURRENCY}**`,inline:true},
      {name:pick(lang,'Wallet','Ví hiện tại'),value:`**${money(balance)} ${CURRENCY}**`,inline:true},
    )
    .setFooter({text:pick(lang,'Corgi Studio • Virtual entertainment currency only','Corgi Studio • Tiền ảo giải trí • Không có giá trị tiền thật')})
    .setTimestamp();
}
async function performSpin({guildId,userId,bet}){
  const lang=await guildLang(guildId);
  if(!validateBet(bet)) return {error:pick(lang,`Bet must be between 10 and 1,000,000 ${CURRENCY}.`,`Mức cược phải từ 10 đến 1.000.000 ${CURRENCY}.`)};
  await ensureWallet(guildId,userId);
  const board=spinBoard();
  const {wins,payout}=evaluateSpin(board,bet);
  const row=await UserEconomy.findOneAndUpdate(
    {guildId,userId,cstar:{$gte:bet}},
    {$inc:{cstar:-bet,spinPending:payout}},
    {returnDocument:'after'},
  );
  if(!row) return {error:pick(lang,`Not enough ${CURRENCY}.`,`Bạn không đủ ${CURRENCY}.`)};
  return {
    embed:spinEmbed({lang,board,bet,payout,pending:row.spinPending||0,balance:row.cstar,wins}),
    components:spinButtons(userId,bet,row.spinPending||0),
  };
}
async function runSpin(args){ return performSpin(args); }
async function runSpinAgain(args){ return performSpin(args); }
async function cashOutSpin({guildId,userId}){
  const lang=await guildLang(guildId);
  await ensureWallet(guildId,userId);
  const before=await UserEconomy.findOneAndUpdate(
    {guildId,userId,spinPending:{$gt:0}},
    [{$set:{cstar:{$add:['$cstar','$spinPending']},spinPending:0}}],
    {returnDocument:'before'},
  );
  if(!before) return {error:pick(lang,`There is no ${CURRENCY} waiting to cash out.`,`Bạn chưa có ${CURRENCY} nào đang chờ rút.`)};
  const amount=Math.max(0,before.spinPending||0);
  const balance=(before.cstar||0)+amount;
  const embed=new EmbedBuilder()
    .setTitle(pick(lang,'💸 SPIN CASHOUT COMPLETE','💸 RÚT 🌟CSTAR THÀNH CÔNG'))
    .setDescription(`${pick(lang,'Cashed out from your Spin session','Đã rút thưởng từ phiên Spin')}: **+${money(amount)} ${CURRENCY}**\n\n🌟 ${pick(lang,'New balance','Số dư mới')}: **${money(balance)} ${CURRENCY}**`)
    .setFooter({text:pick(lang,'Corgi Studio • Virtual entertainment currency only','Corgi Studio • Tiền ảo giải trí • Không có giá trị tiền thật')})
    .setTimestamp();
  return {embed,components:[],amount};
}

async function runLottery({guildId,userId,bet,number}){
  const lang=await guildLang(guildId); if(!validateBet(bet))return {error:pick(lang,`Bet must be between 10 and 1,000,000 ${CURRENCY}.`,`Mức cược phải từ 10 đến 1.000.000 ${CURRENCY}.`)}; const n=1+Math.floor(Math.random()*99); const distance=Math.abs(n-number); let mult=0;if(n===number)mult=50;else if(distance===1)mult=3;else if(String(n).padStart(2,'0').split('').reverse().join('')===String(number).padStart(2,'0'))mult=5; const payout=bet*mult,net=payout-bet; const settled=await settle(guildId,userId,bet,net); if(!settled.ok)return {error:pick(lang,`Not enough ${CURRENCY}.`,`Bạn không đủ ${CURRENCY}.`)};
  return {embed:resultEmbed({lang,title:'🎟️ CORGI LOTTERY • 1–99',description:`${pick(lang,'Winning number','Số trúng thưởng')}: **${String(n).padStart(2,'0')}**\n${pick(lang,'Your number','Số của bạn')}: **${String(number).padStart(2,'0')}**\n${pick(lang,'Multiplier','Hệ số')}: **×${mult}**\n${pick(lang,'Bet','Cược')}: **${money(bet)} ${CURRENCY}**`,net,balance:settled.balance})};
}

module.exports={MIN_BET,MAX_BET,CURRENCY,validateBet,runTaixiu,runPoker,runRoulette,runSpin,runSpinAgain,cashOutSpin,runLottery};
