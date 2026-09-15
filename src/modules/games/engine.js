const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const UserEconomy = require('../../models/UserEconomy');
const { ensureWallet: ensureGlobalWallet, walletFilter } = require('../../services/economyWallet');
const { guildLang, pick } = require('../../services/i18n');

const MIN_BET = 10;
const MAX_BET = 1_000_000;
const CURRENCY = '🌟Cstar';

async function ensureWallet(_guildId, userId) {
  return ensureGlobalWallet(userId);
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

async function debit(userId,amount){
  await ensureGlobalWallet(userId);
  return UserEconomy.findOneAndUpdate({...walletFilter(userId),cstar:{$gte:amount}},{$inc:{cstar:-amount}},{returnDocument:'after'});
}
async function credit(userId,amount){return UserEconomy.findOneAndUpdate(walletFilter(userId),{$inc:{cstar:Math.max(0,amount)}},{returnDocument:'after'});}
function sicboBet(raw){
 const x=String(raw||'').toLowerCase().replace(/\s+/g,'');
 if(['tai','big'].includes(x))return {kind:'big',label:'TÀI / BIG'};
 if(['xiu','small'].includes(x))return {kind:'small',label:'XỈU / SMALL'};
 if(x==='anytriple'||x==='triple')return {kind:'anytriple',label:'ANY TRIPLE'};
 let m=x.match(/^total(4|5|6|7|8|9|10|11|12|13|14|15|16|17)$/);if(m)return {kind:'total',n:+m[1],label:`TOTAL ${m[1]}`};
 m=x.match(/^(single|double|triple)([1-6])$/);if(m)return {kind:m[1],n:+m[2],label:`${m[1].toUpperCase()} ${m[2]}`};
 m=x.match(/^pair([1-6])([1-6])$/);if(m&&m[1]!==m[2])return {kind:'pair',a:+m[1],b:+m[2],label:`PAIR ${m[1]}+${m[2]}`};
 return null;
}
function sicboPayout(spec,d){
 const sum=d.reduce((a,b)=>a+b,0),counts=n=>d.filter(x=>x===n).length,triple=d[0]===d[1]&&d[1]===d[2];
 if(spec.kind==='big')return !triple&&sum>=11&&sum<=17?1:0;if(spec.kind==='small')return !triple&&sum>=4&&sum<=10?1:0;
 if(spec.kind==='single'){const c=counts(spec.n);return c?c:0;}if(spec.kind==='double')return counts(spec.n)>=2?10:0;if(spec.kind==='triple')return counts(spec.n)===3?180:0;if(spec.kind==='anytriple')return triple?30:0;
 if(spec.kind==='pair')return counts(spec.a)&&counts(spec.b)?5:0;
 if(spec.kind==='total'){const pay={4:50,5:18,6:14,7:12,8:8,9:6,10:6,11:6,12:6,13:8,14:12,15:14,16:18,17:50};return sum===spec.n?pay[sum]:0;}return 0;
}
async function runTaixiu({guildId,userId,bet,pickValue}){
 const lang=await guildLang(guildId);if(!validateBet(bet))return {error:pick(lang,`Bet must be between 10 and 1,000,000 ${CURRENCY}.`,`Mức cược phải từ 10 đến 1.000.000 ${CURRENCY}.`)};
 const spec=sicboBet(pickValue);if(!spec)return {error:pick(lang,'Invalid Sic Bo bet. Use Big/Small, Total 4–17, Single/Double/Triple 1–6, Any Triple, or Pair such as pair12.','Cửa Sic Bo không hợp lệ. Dùng Tài/Xỉu, Tổng 4–17, Một mặt/Cặp/Bộ ba 1–6, Bộ ba bất kỳ hoặc cặp hai mặt như pair12.')};
 const wallet=await debit(userId,bet);if(!wallet)return {error:pick(lang,`Not enough ${CURRENCY}.`,`Bạn không đủ ${CURRENCY}.`)};
 const d=[dice(),dice(),dice()],sum=d.reduce((a,b)=>a+b,0),mult=sicboPayout(spec,d),returned=mult?bet*(mult+1):0;if(returned)await credit(userId,returned);const balance=wallet.cstar+returned,net=returned-bet;
 return {embed:resultEmbed({lang,title:pick(lang,'🎲 SIC BO • ADVANCED TABLE','🎲 TÀI XỈU • BÀN SIC BO NÂNG CAO'),description:`${DICE[d[0]-1]} ${DICE[d[1]-1]} ${DICE[d[2]-1]}\n**${d.join(' + ')} = ${sum}**\n${pick(lang,'Your bet','Cửa cược')}: **${spec.label}**\n${pick(lang,'Payout','Tỷ lệ trả')}: **×${mult}**`,net,balance})};
}

function bestFive(cards){let best=null;for(let a=0;a<cards.length-4;a++)for(let b=a+1;b<cards.length-3;b++)for(let c=b+1;c<cards.length-2;c++)for(let d=b+1;d<cards.length-1;d++){if(d<=c)continue;for(let e=d+1;e<cards.length;e++){const h=[cards[a],cards[b],cards[c],cards[d],cards[e]],ev=evaluate(h);if(!best||compareEval(ev,best.ev)>0)best={hand:h,ev};}}return best;}
function compareEval(A,B){if(A.cat!==B.cat)return A.cat>B.cat?1:-1;for(let i=0;i<Math.max(A.tie.length,B.tie.length);i++){const a=A.tie[i]||0,b=B.tie[i]||0;if(a!==b)return a>b?1:-1;}return 0;}
function gameButtons(game,userId,stage,lang){return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`game:${game}:check:${userId}`).setLabel(pick(lang,'Check / Continue','Theo / Tiếp tục')).setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId(`game:${game}:bet:${userId}`).setLabel(pick(lang,'Bet again','Cược thêm')).setEmoji('🌟').setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId(`game:${game}:fold:${userId}`).setLabel(pick(lang,'Fold','Bỏ bài')).setStyle(ButtonStyle.Danger))];}
function pokerEmbed(s,lang,reveal=false){const street=s.stage==='flop'?'FLOP':s.stage==='turn'?'TURN':s.stage==='river'?'RIVER':'SHOWDOWN';return new EmbedBuilder().setTitle(pick(lang,'🃏 POKER • TEXAS HOLD’EM','🃏 POKER • TEXAS HOLD’EM')).setDescription(`**${pick(lang,'Your cards','Bài của bạn')}**\n${handText(s.playerCards)}\n\n**${pick(lang,'Community cards','Bài chung')} • ${street}**\n${handText(s.community)}\n\n**${pick(lang,'Dealer','Nhà cái')}**\n${reveal?handText(s.dealerCards):'🂠  🂠'}\n\n🌟 ${pick(lang,'Total wager','Tổng cược')}: **${money(s.totalBet)} ${CURRENCY}**`).setFooter({text:pick(lang,'Check to continue, Bet again to add the opening bet, or Fold.','Theo để tiếp tục, Cược thêm để thêm đúng mức cược mở đầu, hoặc Bỏ bài.')});}
async function runPoker({guildId,userId,bet}){const GameSession=require('../../models/GameSession');const lang=await guildLang(guildId);if(!validateBet(bet))return {error:pick(lang,`Bet must be between 10 and 1,000,000 ${CURRENCY}.`,`Mức cược phải từ 10 đến 1.000.000 ${CURRENCY}.`)};const active=await GameSession.findOne({game:'poker',guildId,userId,status:'active'});if(active)return {error:pick(lang,'Finish your current Poker hand first.','Hãy hoàn thành ván Poker hiện tại trước.')};const wallet=await debit(userId,bet);if(!wallet)return {error:pick(lang,`Not enough ${CURRENCY}.`,`Bạn không đủ ${CURRENCY}.`)};const deck=cardDeck(),playerCards=deck.splice(0,2),dealerCards=deck.splice(0,2),community=deck.splice(0,3);const s=await GameSession.create({game:'poker',guildId,userId,bet,totalBet:bet,deck,playerCards,dealerCards,community,stage:'flop',expiresAt:new Date(Date.now()+15*60_000)});return {embed:pokerEmbed(s,lang),components:gameButtons('poker',userId,'flop',lang)};}

function parseNums(raw){return String(raw||'').split(/[-,\s]+/).filter(Boolean).map(Number);}
function sameSet(a,b){return a.length===b.length&&[...a].sort((x,y)=>x-y).every((x,i)=>x===[...b].sort((x,y)=>x-y)[i]);}
function rouletteSpec(kind,raw){const k=String(kind||'').toLowerCase(),nums=parseNums(raw);if(k==='straight'&&nums.length===1&&nums[0]>=0&&nums[0]<=36)return {k,nums,pay:35};
 if(k==='split'&&nums.length===2){const [a,b]=[...nums].sort((x,y)=>x-y);const valid=(a===0&&[1,2,3].includes(b))||(a>=1&&b<=36&&((b-a===1&&Math.floor((a-1)/3)===Math.floor((b-1)/3))||b-a===3));if(valid)return {k,nums,pay:17};}
 if(k==='street'&&nums.length===3){const n=[...nums].sort((x,y)=>x-y);if(n[0]>=1&&n[0]%3===1&&n[1]===n[0]+1&&n[2]===n[0]+2)return {k,nums,pay:11};}
 if(k==='trio'&&nums.length===3&&(sameSet(nums,[0,1,2])||sameSet(nums,[0,2,3])))return {k,nums,pay:11};
 if(k==='corner'&&nums.length===4){const n=[...nums].sort((x,y)=>x-y),a=n[0];if(a>=1&&a<=32&&a%3!==0&&sameSet(n,[a,a+1,a+3,a+4]))return {k,nums,pay:8};}
 if(k==='basket'&&nums.length===4&&sameSet(nums,[0,1,2,3]))return {k,nums,pay:8};
 if(k==='sixline'&&nums.length===6){const n=[...nums].sort((x,y)=>x-y),a=n[0];if(a>=1&&a<=31&&a%3===1&&sameSet(n,[a,a+1,a+2,a+3,a+4,a+5]))return {k,nums,pay:5};}
 if(k==='dozen'&&['1','2','3'].includes(String(raw)))return {k,n:+raw,pay:2};if(k==='column'&&['1','2','3'].includes(String(raw)))return {k,n:+raw,pay:2};if(k==='color'&&['red','black','do','đỏ','den','đen'].includes(String(raw).toLowerCase()))return {k,v:['red','do','đỏ'].includes(String(raw).toLowerCase())?'red':'black',pay:1};if(k==='parity'&&['odd','even','le','lẻ','chan','chẵn'].includes(String(raw).toLowerCase()))return {k,v:['odd','le','lẻ'].includes(String(raw).toLowerCase())?'odd':'even',pay:1};if(k==='half'&&['1-18','19-36'].includes(String(raw)))return {k,v:String(raw),pay:1};return null;}
function rouletteWin(s,n){if(s.k==='straight'||s.k==='split'||s.k==='street'||s.k==='corner'||s.k==='sixline')return s.nums.includes(n);if(n===0)return false;if(s.k==='dozen')return n>=((s.n-1)*12+1)&&n<=s.n*12;if(s.k==='column')return ((n-1)%3)+1===s.n;if(s.k==='color')return rouletteColor(n)===s.v;if(s.k==='parity')return (n%2?'odd':'even')===s.v;if(s.k==='half')return s.v==='1-18'?n<=18:n>=19;return false;}
async function runRoulette({guildId,userId,bet,betType,pickValue}){const lang=await guildLang(guildId);if(!validateBet(bet))return {error:pick(lang,`Bet must be between 10 and 1,000,000 ${CURRENCY}.`,`Mức cược phải từ 10 đến 1.000.000 ${CURRENCY}.`)};const spec=rouletteSpec(betType,pickValue);if(!spec)return {error:pick(lang,'Invalid Roulette selection for that bet type.','Lựa chọn Roulette không hợp lệ với loại cược này.')};const wallet=await debit(userId,bet);if(!wallet)return {error:pick(lang,`Not enough ${CURRENCY}.`,`Bạn không đủ ${CURRENCY}.`)};const n=Math.floor(Math.random()*37),c=rouletteColor(n),win=rouletteWin(spec,n),returned=win?bet*(spec.pay+1):0;if(returned)await credit(userId,returned);return {embed:resultEmbed({lang,title:'🎡 ROULETTE • FULL TABLE',description:`${pick(lang,'Ball','Bi')}: **${colorIcon(c)} ${n} • ${c.toUpperCase()}**\n${pick(lang,'Bet type','Loại cược')}: **${String(betType).toUpperCase()}**\n${pick(lang,'Selection','Lựa chọn')}: **${pickValue}**\n${pick(lang,'Payout','Tỷ lệ trả')}: **${win?`×${spec.pay}`:'×0'}**`,net:returned-bet,balance:wallet.cstar+returned})};}

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
function spinButtons(userId,bet,pending,lang,disabled=false){
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`spin:again:${bet}:${userId}`).setLabel(pick(lang,'Spin again','Quay tiếp')).setEmoji('🎰').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`spin:cashout:${userId}`).setLabel(pick(lang,'Cash out 🌟Cstar','Rút 🌟Cstar')).setEmoji('💸').setStyle(ButtonStyle.Success).setDisabled(disabled || pending<=0),
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
    {...walletFilter(userId),cstar:{$gte:bet}},
    {$inc:{cstar:-bet,spinPending:payout}},
    {returnDocument:'after'},
  );
  if(!row) return {error:pick(lang,`Not enough ${CURRENCY}.`,`Bạn không đủ ${CURRENCY}.`)};
  return {
    embed:spinEmbed({lang,board,bet,payout,pending:row.spinPending||0,balance:row.cstar,wins}),
    components:spinButtons(userId,bet,row.spinPending||0,lang),
  };
}
async function runSpin(args){ return performSpin(args); }
async function runSpinAgain(args){ return performSpin(args); }
async function cashOutSpin({guildId,userId}){
  const lang=await guildLang(guildId);
  await ensureWallet(guildId,userId);
  const before=await UserEconomy.findOneAndUpdate(
    {...walletFilter(userId),spinPending:{$gt:0}},
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

function liengEval(cards){const rs=cards.map(c=>c.r),sorted=[...rs].sort((a,b)=>a-b),counts=new Map();rs.forEach(r=>counts.set(r,(counts.get(r)||0)+1));const triple=[...counts.entries()].find(x=>x[1]===3);if(triple)return {cat:4,name:'Three of a Kind',tie:[triple[0]]};const vals=sorted.map(r=>r===14?1:r);const straight=(vals[2]-vals[0]===2&&new Set(vals).size===3)||(new Set(rs).size===3&&rs.includes(14)&&rs.includes(13)&&rs.includes(12));if(straight)return {cat:3,name:'Liêng',tie:[rs.includes(14)&&rs.includes(13)?14:Math.max(...vals)]};const faces=rs.filter(r=>r>=11||r===14).length;if(faces===3)return {cat:2,name:'Ảnh',tie:[...rs].sort((a,b)=>b-a)};const points=rs.reduce((a,r)=>a+(r>=10?0:r),0)%10;return {cat:1,name:'Points',tie:[points,...rs.sort((a,b)=>b-a)]};}
function liengName(lang,n){const en={'Three of a Kind':'Three of a Kind','Liêng':'Straight','Ảnh':'Three Face Cards','Points':'Points'};return lang==='vi'?n:(en[n]||n);}
function liengEmbed(s,lang,reveal=false){const ev=liengEval(s.playerCards);return new EmbedBuilder().setTitle(pick(lang,'🂡 LIENG • THREE-CARD TABLE','🂡 LIÊNG • BÀN 3 LÁ')).setDescription(`**${pick(lang,'Your cards','Bài của bạn')}**\n${handText(s.playerCards)}\n→ **${liengName(lang,ev.name)}${ev.name==='Points'?` ${ev.tie[0]}`:''}**\n\n**${pick(lang,'Dealer','Nhà cái')}**\n${reveal?handText(s.dealerCards):'🂠  🂠  🂠'}\n\n🌟 ${pick(lang,'Total wager','Tổng cược')}: **${money(s.totalBet)} ${CURRENCY}**`).setFooter({text:pick(lang,'Check to showdown, Bet again to raise once, or Fold.','Theo để lật bài, Cược thêm để tố thêm một lần, hoặc Bỏ bài.')});}
async function runLieng({guildId,userId,bet}){const GameSession=require('../../models/GameSession');const lang=await guildLang(guildId);if(!validateBet(bet))return {error:pick(lang,`Bet must be between 10 and 1,000,000 ${CURRENCY}.`,`Mức cược phải từ 10 đến 1.000.000 ${CURRENCY}.`)};if(await GameSession.findOne({game:'lieng',guildId,userId,status:'active'}))return {error:pick(lang,'Finish your current Liêng hand first.','Hãy hoàn thành ván Liêng hiện tại trước.')};const wallet=await debit(userId,bet);if(!wallet)return {error:pick(lang,`Not enough ${CURRENCY}.`,`Bạn không đủ ${CURRENCY}.`)};const deck=cardDeck(),playerCards=deck.splice(0,3),dealerCards=deck.splice(0,3);const s=await GameSession.create({game:'lieng',guildId,userId,bet,totalBet:bet,playerCards,dealerCards,stage:'betting',expiresAt:new Date(Date.now()+10*60_000)});return {embed:liengEmbed(s,lang),components:gameButtons('lieng',userId,'betting',lang)};}
function compareLieng(a,b){const A=liengEval(a),B=liengEval(b);return compareEval(A,B);}

async function buyLottery({guildId,userId,bet}){
 const LotteryTicket=require('../../models/LotteryTicket');const {sample}=require('../../services/lotteryService');const lang=await guildLang(guildId);if(!validateBet(bet))return {error:pick(lang,`Ticket price must be between 10 and 1,000,000 ${CURRENCY}.`,`Giá vé phải từ 10 đến 1.000.000 ${CURRENCY}.`)};const wallet=await debit(userId,bet);if(!wallet)return {error:pick(lang,`Not enough ${CURRENCY}.`,`Bạn không đủ ${CURRENCY}.`)};const mainNumbers=sample(5,69),powerNumber=1+Math.floor(Math.random()*26),drawAt=new Date(Date.now()+24*60*60*1000);const t=await LotteryTicket.create({guildId,userId,bet,mainNumbers,powerNumber,drawAt});return {embed:new EmbedBuilder().setTitle(pick(lang,'🎟️ LOTTERY • TICKET PURCHASED','🎟️ XỔ SỐ • ĐÃ MUA VÉ')).setDescription(`${pick(lang,'Your random numbers','Bộ số ngẫu nhiên của bạn')}:\n**${mainNumbers.join('  ')} | ${pick(lang,'PB','SĐB')} ${powerNumber}**\n\n${pick(lang,'Draw time','Mở thưởng')}: <t:${Math.floor(drawAt.getTime()/1000)}:F> • <t:${Math.floor(drawAt.getTime()/1000)}:R>\n${pick(lang,'The ticket is not drawn immediately. Results are settled automatically after 24 hours.','Vé không mở thưởng ngay. Kết quả được tự động đối chiếu sau 24 giờ.')}\n🌟 ${pick(lang,'Balance','Số dư')}: **${money(wallet.cstar)} ${CURRENCY}**`).setFooter({text:`Ticket ${t._id}`})};}
async function lotteryStatus({guildId,userId}){const LotteryTicket=require('../../models/LotteryTicket');const lang=await guildLang(guildId);const rows=await LotteryTicket.find({guildId,userId}).sort({createdAt:-1}).limit(5).lean();if(!rows.length)return {error:pick(lang,'You have no Lottery tickets yet.','Bạn chưa có vé Xổ số nào.')};return {embed:new EmbedBuilder().setTitle(pick(lang,'🎟️ LOTTERY • MY TICKETS','🎟️ XỔ SỐ • VÉ CỦA TÔI')).setDescription(rows.map(t=>`**${t.mainNumbers.join(' ')} | ${pick(lang,'PB','SĐB')} ${t.powerNumber}**\n${t.status==='pending'?`${pick(lang,'Draw','Mở thưởng')}: <t:${Math.floor(new Date(t.drawAt).getTime()/1000)}:R>`:`${pick(lang,'Result','Kết quả')}: ${t.winningMain.join(' ')} | ${pick(lang,'PB','SĐB')} ${t.winningPower} • **+${money(t.payout)} ${CURRENCY}**`}`).join('\n\n'))};}

module.exports={MIN_BET,MAX_BET,CURRENCY,validateBet,runTaixiu,runPoker,runRoulette,runSpin,runSpinAgain,cashOutSpin,buyLottery,lotteryStatus,runLieng,pokerEmbed,liengEmbed,gameButtons,handText,bestFive,pokerName,liengEval,liengName,compareLieng,compareEval,credit,debit};
