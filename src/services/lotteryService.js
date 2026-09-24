const {compactNumber}=require('./numberFormat');
const LotteryTicket=require('../models/LotteryTicket');
const UserEconomy=require('../models/UserEconomy');
const {walletFilter}=require('./economyWallet');
const {guildLang,mtx}=require('./i18n');
function sample(count,max){const s=new Set();while(s.size<count)s.add(1+Math.floor(Math.random()*max));return [...s].sort((a,b)=>a-b);}
function prize(matches,power,bet){const m={5:50,4:10,3:3,2:1};let mult=m[matches]||0;if(power)mult+=matches===5?50:matches>=3?5:1;return Math.floor(bet*mult);}
async function settleDue(client){
 const due=await LotteryTicket.find({status:'pending',drawAt:{$lte:new Date()}}).limit(100);
 for(const t of due){
  const win=sample(5,69),pb=1+Math.floor(Math.random()*26),matches=t.mainNumbers.filter(n=>win.includes(n)).length,power=t.powerNumber===pb,payout=prize(matches,power,t.bet);
  const claimed=await LotteryTicket.findOneAndUpdate({_id:t._id,status:'pending'},{$set:{status:'drawn',winningMain:win,winningPower:pb,payout,settledAt:new Date()}},{returnDocument:'after'});if(!claimed)continue;
  if(payout>0)await UserEconomy.updateOne(walletFilter(t.userId),{$inc:{cstar:payout}});
  const lang=await guildLang(t.guildId).catch(()=> 'en');const user=await client.users.fetch(t.userId).catch(()=>null);
  if(user)await user.send(mtx(lang,`🎟️ **Lottery draw complete**\nYour ticket: **${t.mainNumbers.join(' ')} | PB ${t.powerNumber}**\nDraw: **${win.join(' ')} | PB ${pb}**\nMatches: **${matches}${power?' + Power Ball':''}**\nReward: **${compactNumber(payout)} <:cxu_coin:1551759873241251912> CXu**`,`🎟️ **Xổ số đã mở thưởng**\nVé của bạn: **${t.mainNumbers.join(' ')} | Số đặc biệt ${t.powerNumber}**\nKết quả: **${win.join(' ')} | Số đặc biệt ${pb}**\nTrùng: **${matches}${power?' + số đặc biệt':''}**\nThưởng: **${compactNumber(payout)} <:cxu_coin:1551759873241251912> CXu**`)).catch(()=>null);
 }
}
function startLotteryService(client){setInterval(()=>settleDue(client).catch(e=>console.error('Lottery settlement:',e)),60_000).unref();setTimeout(()=>settleDue(client).catch(()=>{}),10_000).unref();}
module.exports={startLotteryService,sample};
