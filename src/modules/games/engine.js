const { EmbedBuilder } = require('discord.js');
const UserEconomy = require('../../models/UserEconomy');
const { guildLang, pick } = require('../../services/i18n');

const MIN_BET = 10;
const MAX_BET = 1_000_000;

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

function money(n) { return Number(n).toLocaleString('en-US'); }
function outcomeLine(lang, net) {
  if (net > 0) return pick(lang, `✅ Profit: **+${money(net)} Cstar**`, `✅ Lãi: **+${money(net)} Cstar**`);
  if (net < 0) return pick(lang, `❌ Loss: **${money(net)} Cstar**`, `❌ Thua: **${money(net)} Cstar**`);
  return pick(lang, '➖ Push • bet returned', '➖ Hòa • hoàn cược');
}

function resultEmbed({ lang, title, description, net, balance, footer }) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(`${description}\n\n${outcomeLine(lang, net)}\n⭐ ${pick(lang,'Balance','Số dư')}: **${money(balance)} Cstar**`)
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
  const lang=await guildLang(guildId); if(!validateBet(bet))return {error:pick(lang,'Bet must be between 10 and 1,000,000 Cstar.','Mức cược phải từ 10 đến 1.000.000 Cstar.')}; const d=[dice(),dice(),dice()]; const sum=d.reduce((a,b)=>a+b,0); const result=sum>=11?'tai':'xiu'; const net=result===pickValue?bet:-bet; const settled=await settle(guildId,userId,bet,net); if(!settled.ok)return {error:pick(lang,'Not enough Cstar.','Bạn không đủ Cstar.')};
  const choice=pickValue==='tai'?pick(lang,'TÀI','TÀI'):pick(lang,'XỈU','XỈU');
  const resultName=result==='tai'?'TÀI':'XỈU';
  return {embed:resultEmbed({lang,title:'🎲 TÀI XỈU • CORGI CASINO',description:`${DICE[d[0]-1]} ${DICE[d[1]-1]} ${DICE[d[2]-1]}\n**${d.join(' + ')} = ${sum} → ${resultName}**\n${pick(lang,'Your pick','Bạn chọn')}: **${choice}** • ${pick(lang,'Bet','Cược')}: **${money(bet)} Cstar**`,net,balance:settled.balance})};
}

async function runPoker({guildId,userId,bet}){
  const lang=await guildLang(guildId); if(!validateBet(bet))return {error:pick(lang,'Bet must be between 10 and 1,000,000 Cstar.','Mức cược phải từ 10 đến 1.000.000 Cstar.')}; const deck=cardDeck(),you=deck.splice(0,5),dealer=deck.splice(0,5); const r=compareHands(you,dealer); const net=r.cmp>0?bet:r.cmp<0?-bet:0; const settled=await settle(guildId,userId,bet,net); if(!settled.ok)return {error:pick(lang,'Not enough Cstar.','Bạn không đủ Cstar.')};
  return {embed:resultEmbed({lang,title:'🃏 POKER • HEADS-UP',description:`**${pick(lang,'Your hand','Bài của bạn')}**\n${handText(you)}\n→ **${pokerName(lang,r.A.name)}**\n\n**Dealer**\n${handText(dealer)}\n→ **${pokerName(lang,r.B.name)}**\n\n${pick(lang,'Bet','Cược')}: **${money(bet)} Cstar**`,net,balance:settled.balance})};
}

async function runRoulette({guildId,userId,bet,pickValue}){
  const lang=await guildLang(guildId); if(!validateBet(bet))return {error:pick(lang,'Bet must be between 10 and 1,000,000 Cstar.','Mức cược phải từ 10 đến 1.000.000 Cstar.')}; const raw=String(pickValue||'').trim().toLowerCase(); let kind,value;
  if(/^\d+$/.test(raw)&&Number(raw)>=0&&Number(raw)<=36){kind='number';value=Number(raw);} else if(['red','black','green','do','đỏ','den','đen','xanh'].includes(raw)){kind='color';value=['red','do','đỏ'].includes(raw)?'red':['black','den','đen'].includes(raw)?'black':'green';} else return {error:pick(lang,'Pick red, black, green, or a number from 0 to 36.','Chọn red/black/green (đỏ/đen/xanh) hoặc một số từ 0 đến 36.')};
  const n=Math.floor(Math.random()*37),c=rouletteColor(n); let net=-bet;
  if(kind==='number'&&value===n)net=bet*35; else if(kind==='color'&&value===c)net=value==='green'?bet*17:bet;
  const settled=await settle(guildId,userId,bet,net); if(!settled.ok)return {error:pick(lang,'Not enough Cstar.','Bạn không đủ Cstar.')};
  const chosen=kind==='number'?`#${value}`:`${colorIcon(value)} ${value.toUpperCase()}`;
  return {embed:resultEmbed({lang,title:'🎡 ROULLETTE • LIVE TABLE',description:`${pick(lang,'Ball landed on','Bi dừng tại')}: **${colorIcon(c)} ${n} • ${c.toUpperCase()}**\n${pick(lang,'Your pick','Bạn chọn')}: **${chosen}**\n${pick(lang,'Bet','Cược')}: **${money(bet)} Cstar**`,net,balance:settled.balance})};
}

async function runSpin({guildId,userId,bet}){
  const lang=await guildLang(guildId); if(!validateBet(bet))return {error:pick(lang,'Bet must be between 10 and 1,000,000 Cstar.','Mức cược phải từ 10 đến 1.000.000 Cstar.')}; const wheel=[{m:0,w:28,e:'💥'},{m:.5,w:18,e:'🪙'},{m:1,w:18,e:'⭐'},{m:1.5,w:14,e:'💎'},{m:2,w:10,e:'🔥'},{m:3,w:7,e:'👑'},{m:5,w:4,e:'🌟'},{m:10,w:1,e:'🏆'}]; const total=wheel.reduce((a,x)=>a+x.w,0);let r=Math.random()*total,slot=wheel[0];for(const x of wheel){r-=x.w;if(r<=0){slot=x;break;}} const payout=Math.floor(bet*slot.m),net=payout-bet; const settled=await settle(guildId,userId,bet,net); if(!settled.ok)return {error:pick(lang,'Not enough Cstar.','Bạn không đủ Cstar.')};
  return {embed:resultEmbed({lang,title:'🎰 LUCKY SPIN • CORGI WHEEL',description:`╔═══ 🎡 ═══╗\n       ${slot.e} **×${slot.m}** ${slot.e}\n╚═════════╝\n${pick(lang,'Bet','Cược')}: **${money(bet)} Cstar** • ${pick(lang,'Payout','Trả thưởng')}: **${money(payout)} Cstar**`,net,balance:settled.balance})};
}

async function runLottery({guildId,userId,bet,number}){
  const lang=await guildLang(guildId); if(!validateBet(bet))return {error:pick(lang,'Bet must be between 10 and 1,000,000 Cstar.','Mức cược phải từ 10 đến 1.000.000 Cstar.')}; const n=1+Math.floor(Math.random()*99); const distance=Math.abs(n-number); let mult=0;if(n===number)mult=50;else if(distance===1)mult=3;else if(String(n).padStart(2,'0').split('').reverse().join('')===String(number).padStart(2,'0'))mult=5; const payout=bet*mult,net=payout-bet; const settled=await settle(guildId,userId,bet,net); if(!settled.ok)return {error:pick(lang,'Not enough Cstar.','Bạn không đủ Cstar.')};
  return {embed:resultEmbed({lang,title:'🎟️ CORGI LOTTERY • 1–99',description:`${pick(lang,'Winning number','Số trúng thưởng')}: **${String(n).padStart(2,'0')}**\n${pick(lang,'Your number','Số của bạn')}: **${String(number).padStart(2,'0')}**\n${pick(lang,'Multiplier','Hệ số')}: **×${mult}**\n${pick(lang,'Bet','Cược')}: **${money(bet)} Cstar**`,net,balance:settled.balance})};
}

module.exports={MIN_BET,MAX_BET,validateBet,runTaixiu,runPoker,runRoulette,runSpin,runLottery};
