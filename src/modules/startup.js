const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,ModalBuilder,TextInputBuilder,TextInputStyle}=require('discord.js');
const Company=require('../models/StartupCompany'),Profile=require('../models/StartupProfile'),{ensureWallet}=require('../services/economyWallet'),CFG=require('../services/startupConfig');
const {tx}=require('../services/i18n');
const LANGS=['en','vi'];
const tr=(en,vi)=>Object.fromEntries(LANGS.map(x=>[x,x==='vi'?vi:en]));
const S={title:tr('Startup • Real Business Management','Startup • Quản Trị Doanh Nghiệp'),none:tr('Create a company or accept an employment offer to begin.','Hãy thành lập công ty hoặc nhận lời mời làm việc để bắt đầu.'),create:tr('Create Company','Thành lập công ty'),cycle:tr('Run Business Cycle','Vận hành kỳ'),people:tr('People','Nhân sự'),product:tr('Products & R&D','Sản phẩm & R&D'),market:tr('Market & Operations','Thị trường & Vận hành'),finance:tr('Finance & Debt','Tài chính & Nợ'),shares:tr('Capital / IPO / Shares','Vốn / IPO / Cổ phiếu'),corp:tr('Corporate','Quản trị DN'),npc:tr('Hire NPC','Tuyển NPC'),invite:tr('Invite Player','Mời người thật'),train:tr('Train Staff','Đào tạo'),rd:tr('Develop Product','Phát triển SP'),marketing:tr('Marketing','Marketing'),ops:tr('Upgrade Operations','Nâng vận hành'),expand:tr('Expand Market','Mở rộng thị trường'),loan:tr('Take Loan','Vay vốn'),repay:tr('Repay Debt','Trả nợ'),dividend:tr('Pay Dividend','Trả cổ tức'),ipo:tr('IPO','IPO'),offers:tr('Employment Offers','Lời mời làm việc'),accept:tr('Accept','Nhận việc'),decline:tr('Decline','Từ chối')};
const T=(l,k)=>{
  const table=S[k];
  if(!table)return String(k);
  if(typeof table==='string')return table;
  return String(table[l] ?? table.en ?? Object.values(table)[0] ?? k);
};
const L=(lang,en,vi)=>lang==='vi'?vi:en;
const STATUS={
  PRIVATE:{en:'PRIVATE',vi:'TƯ NHÂN'},
  PUBLIC:{en:'PUBLIC',vi:'ĐẠI CHÚNG'},
  DISTRESS:{en:'DISTRESS',vi:'KHÓ KHĂN'},
  INSOLVENT:{en:'INSOLVENT',vi:'MẤT KHẢ NĂNG THANH TOÁN'},
  BANKRUPT:{en:'BANKRUPT',vi:'PHÁ SẢN'}
};
const statusText=(lang,status)=>STATUS[status]?.[lang]||STATUS[status]?.en||status;const money=n=>Math.round(Number(n)||0).toLocaleString();const pct=n=>`${(Number(n)||0).toFixed(1)}%`;
async function companies(uid){return Company.find({$or:[{founderId:String(uid)},{controllerId:String(uid)},{'shareholders.userId':String(uid)},{'workers.userId':String(uid)}]}).sort({valuation:-1}).limit(25);}
async function offers(uid){return Company.find({'pendingInvites.userId':String(uid)}).select('name pendingInvites controllerId').limit(10).lean();}
function ownership(c,uid){const s=c.shareholders.find(x=>x.userId===String(uid));return s?Number(s.shares||0)/Number(c.sharesOutstanding||1):0;}
function controller(c){let best=null;for(const s of c.shareholders){if(!best||s.shares>best.shares)best=s;}if(best&&best.shares/c.sharesOutstanding>CFG.TAKEOVER)c.controllerId=best.userId;}
function valuation(c){const equity=Math.max(0,c.assets+c.treasury-c.debt);const earnings=Math.max(0,c.profit)*8;const moat=1+c.brand/220+c.quality/250+c.market/35+c.rdLevel/25;return Math.max(c.capital,Math.round((equity+earnings)*moat*(1-c.risk/220)));}
async function payPlayer(uid,amount){if(!uid||amount<=0)return;const w=await ensureWallet(uid);w.cstar=Number(w.cstar||0)+Math.round(amount);await w.save();}
async function settle(c,force=0){if(c.status==='BANKRUPT')return c;const now=Date.now();let elapsed=force||Math.floor((now-new Date(c.lastCycleAt||now).getTime())/CFG.CYCLE_MS);elapsed=Math.max(0,Math.min(CFG.MAX_OFFLINE_CYCLES,elapsed));if(!elapsed)return c;for(let z=0;z<elapsed;z++){
 const ind=CFG.INDUSTRIES[c.industry]||CFG.INDUSTRIES.technology;const active=(c.workers||[]).filter(x=>x.active);const npc=active.filter(x=>x.kind==='NPC').length,humans=active.filter(x=>x.kind==='PLAYER');const skill=active.length?active.reduce((n,x)=>n+x.skill*x.morale/100,0)/active.length:45;
 c.employees=Math.max(1,active.length||c.employees||1);const capacity=Math.max(100,c.capacity)*(1+c.operationsLevel*.08)*(1+skill/250);const demand=(.45+c.brand/120+c.quality/150+c.satisfaction/200)*(1+c.market*.06);const units=Math.max(1,Math.floor(capacity*demand));const rev=Math.round(units*(8+c.rdLevel*2)*ind.growth);const payroll=active.reduce((n,x)=>n+Number(x.salary||0),0)+(active.length?0:180);const cogs=Math.round(rev*(1-ind.margin));const marketing=c.marketingLevel*220;const interest=(c.loans||[]).reduce((n,l)=>n+Math.round(l.balance*l.rate),0);const tax=Math.round(Math.max(0,rev-cogs-payroll-marketing-interest)*CFG.TAX_RATE);const exp=cogs+payroll+marketing+interest+tax;const profit=rev-exp;
 c.revenue+=rev;c.expenses+=exp;c.profit=profit;c.taxPaid+=tax;c.retainedEarnings+=profit;c.treasury=Math.max(0,c.treasury+profit);c.customers=Math.max(0,Math.round(c.customers*.96+units));c.inventory=Math.max(0,Math.round(c.inventory+capacity-units));c.satisfaction=Math.max(10,Math.min(100,c.satisfaction+(c.quality>55?.4:-.2)));c.brand=Math.min(100,Math.max(0,c.brand+(profit>0?.25:-.3)));c.quality=Math.min(100,Math.max(1,c.quality+c.rdLevel*.03));c.risk=Math.min(100,Math.max(3,c.risk+(profit<0?2:-.35)+(c.debt>c.assets?1:0)));c.credit=Math.min(850,Math.max(300,c.credit+(profit>0?2:-5)-(c.treasury===0?4:0)));c.assets=Math.max(0,c.assets+Math.max(0,profit*.08));c.cycleCount++;
 await Promise.all(humans.map(h=>payPlayer(h.userId,h.salary)));for(const l of c.loans||[]){if(l.balance>0){const principal=Math.min(l.balance,Math.max(0,Math.round(l.principal/l.term)));if(c.treasury>=principal){c.treasury-=principal;l.balance-=principal;l.paid+=principal;c.debt=Math.max(0,c.debt-principal);}}}
 if(c.treasury<=0&&profit<0)c.status=c.debt>c.assets?'INSOLVENT':'DISTRESS';else if(c.status==='DISTRESS'&&profit>0&&c.treasury>0)c.status=c.ticker?'PUBLIC':'PRIVATE';if(c.status==='INSOLVENT'&&c.cycleCount>5&&c.treasury===0&&c.debt>c.assets*1.5)c.status='BANKRUPT';
 }
 c.lastCycleAt=new Date(now);c.valuation=valuation(c);if(c.status==='PUBLIC')c.sharePrice=Math.max(.01,c.valuation/c.sharesOutstanding);controller(c);await c.save();return c;}
function summary(c,lang,uid){
  return `**${c.industry.toUpperCase()}**${c.ticker?` • **${c.ticker}**`:''}\n${L(lang,'Ownership','Sở hữu')}: **${pct(ownership(c,uid)*100)}** • ${L(lang,'Controller','Người điều hành')}: <@${c.controllerId}>`;
}
function card(c,lang,uid){
  const npcs=(c.workers||[]).filter(x=>x.kind==='NPC').length;
  const players=(c.workers||[]).filter(x=>x.kind==='PLAYER').length;

  return new EmbedBuilder()
    .setColor(c.status==='PUBLIC'?0x57F287:c.status==='DISTRESS'||c.status==='INSOLVENT'?0xED4245:0x5865F2)
    .setTitle(`🏢 ${c.name} • ${statusText(lang,c.status)}`)
    .setDescription(summary(c,lang,uid))
    .addFields(
      {name:`💰 ${L(lang,'Treasury','Ngân quỹ')}`,value:`${money(c.treasury)} CXu`,inline:true},
      {name:`📊 ${L(lang,'Valuation','Định giá')}`,value:`${money(c.valuation)} CXu`,inline:true},
      {name:`📈 ${L(lang,'Net Profit','Lợi nhuận ròng')}`,value:`${money(c.profit)} CXu`,inline:true},
      {name:`👥 ${L(lang,'Workforce','Nhân sự')}`,value:lang==='vi'?`${c.employees} • NPC ${npcs} • Người chơi ${players}`:`${c.employees} • NPC ${npcs} • Players ${players}`,inline:true},
      {name:`🧪 ${L(lang,'R&D / Quality','R&D / Chất lượng')}`,value:`Lv.${c.rdLevel} • ${Math.round(c.quality)}/100`,inline:true},
      {name:`📣 ${L(lang,'Brand / Market','Thương hiệu / Thị trường')}`,value:`${Math.round(c.brand)}/100 • ${c.market}/10`,inline:true},
      {name:`👤 ${L(lang,'Customers','Khách hàng')}`,value:money(c.customers),inline:true},
      {name:`🏭 ${L(lang,'Capacity / Inventory','Công suất / Tồn kho')}`,value:`${money(c.capacity)} / ${money(c.inventory)}`,inline:true},
      {name:`🏦 ${L(lang,'Debt','Nợ')}`,value:`${money(c.debt)} CXu`,inline:true},
      {name:`💳 ${L(lang,'Credit / Risk','Tín dụng / Rủi ro')}`,value:`${c.credit} / ${Math.round(c.risk)}%`,inline:true},
      {
        name:`📚 ${L(lang,'Lifetime','Toàn thời gian')}`,
        value:lang==='vi'
          ? `Doanh thu ${money(c.revenue)} • Chi phí ${money(c.expenses)} • Thuế ${money(c.taxPaid)}`
          : `Revenue ${money(c.revenue)} • Expenses ${money(c.expenses)} • Tax ${money(c.taxPaid)}`,
        inline:false
      }
    );
}
function rows(uid,c,lang){return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`startup:cycle:${c._id}:${uid}`).setLabel(T(lang,'cycle')).setEmoji('⚙️').setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`startup:people:${c._id}:${uid}`).setLabel(T(lang,'people')).setEmoji('👥').setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId(`startup:product:${c._id}:${uid}`).setLabel(T(lang,'product')).setEmoji('🧪').setStyle(ButtonStyle.Primary)),new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`startup:market:${c._id}:${uid}`).setLabel(T(lang,'market')).setEmoji('📣').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId(`startup:finance:${c._id}:${uid}`).setLabel(T(lang,'finance')).setEmoji('🏦').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId(`startup:shares:${c._id}:${uid}`).setLabel(T(lang,'shares')).setEmoji('📈').setStyle(ButtonStyle.Secondary)),new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`gh:refresh:${uid}`).setLabel('Game Hub').setEmoji('↩️').setStyle(ButtonStyle.Secondary))];}
function actionRows(uid,c,lang,type){const back=new ButtonBuilder().setCustomId(`startup:home:${c._id}:${uid}`).setLabel('←').setStyle(ButtonStyle.Secondary);if(type==='people')return[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`startup:npc:${c._id}:${uid}`).setLabel(T(lang,'npc')).setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`startup:invite:${c._id}:${uid}`).setLabel(T(lang,'invite')).setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId(`startup:train:${c._id}:${uid}`).setLabel(T(lang,'train')).setStyle(ButtonStyle.Secondary),back)];if(type==='product')return[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`startup:rd:${c._id}:${uid}`).setLabel(T(lang,'rd')).setStyle(ButtonStyle.Success),back)];if(type==='market')return[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`startup:marketing:${c._id}:${uid}`).setLabel(T(lang,'marketing')).setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`startup:ops:${c._id}:${uid}`).setLabel(T(lang,'ops')).setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId(`startup:expand:${c._id}:${uid}`).setLabel(T(lang,'expand')).setStyle(ButtonStyle.Secondary),back)];if(type==='finance')return[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`startup:loan:${c._id}:${uid}`).setLabel(T(lang,'loan')).setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId(`startup:repay:${c._id}:${uid}`).setLabel(T(lang,'repay')).setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`startup:dividend:${c._id}:${uid}`).setLabel(T(lang,'dividend')).setStyle(ButtonStyle.Secondary),back)];if(type==='shares')return[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`startup:ipo:${c._id}:${uid}`).setLabel(T(lang,'ipo')).setStyle(ButtonStyle.Success),back)];return rows(uid,c,lang);}
async function home(uid,lang){const cs=await companies(uid),os=await offers(uid);if(!cs.length){const comps=[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`startup:create:${uid}`).setLabel(T(lang,'create')).setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`gh:refresh:${uid}`).setLabel('Game Hub').setStyle(ButtonStyle.Secondary))];if(os.length)comps.unshift(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`startup:offers:${uid}`).setLabel(`${T(lang,'offers')} (${os.length})`).setStyle(ButtonStyle.Primary)));return{embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle(`🏢 ${T(lang,'title')}`).setDescription(T(lang,'none'))],components:comps};}const c=await settle(cs[0]);return{embeds:[card(c,lang,uid)],components:rows(uid,c,lang)};}
function modal(id,title,fields){const m=new ModalBuilder().setCustomId(id).setTitle(title);for(const [cid,label,ph] of fields)m.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(cid).setLabel(label).setPlaceholder(ph).setStyle(TextInputStyle.Short).setRequired(true)));return m;}
function canManage(c,uid){return String(c.controllerId)===String(uid);}
async function handle(i,lang){const p=i.customId.split(':'),a=p[1];if(a==='create'){const uid=p[2];if(String(i.user.id)!==uid)return;return i.showModal(modal(
  `startupmodal:create:${uid}`,
  L(lang,'Create Company','Thành lập công ty'),
  [
    ['name',L(lang,'Company name','Tên công ty'),'Corgi Labs'],
    ['industry',L(lang,'Industry','Ngành nghề'),'technology / esports / retail / food'],
    ['capital',L(lang,'Starting capital (CXu)','Vốn khởi điểm (CXu)'),'25000']
  ]
));}if(a==='offers'){const uid=p[2],os=await offers(uid);const e=new EmbedBuilder().setTitle(`💼 ${T(lang,'offers')}`).setDescription(os.map((c,n)=>`**${n+1}. ${c.name}**`).join('\n')||'—');const rr=[];for(const c of os.slice(0,2))rr.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`startup:accept:${c._id}:${uid}`).setLabel(`${T(lang,'accept')} • ${c.name}`.slice(0,80)).setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`startup:decline:${c._id}:${uid}`).setLabel(T(lang,'decline')).setStyle(ButtonStyle.Danger)));return i.editReply({embeds:[e],components:rr});}
 const id=p[2],uid=p[3];if(String(i.user.id)!==String(uid))return i.followUp({content:L(lang,'❌ Not your panel.','❌ Đây không phải bảng điều khiển của bạn.'),flags:64});let c=await Company.findById(id);if(!c)return i.editReply({content:L(lang,'❌ Company not found.','❌ Không tìm thấy công ty.'),embeds:[],components:[]});if(a==='accept'||a==='decline'){const inv=c.pendingInvites.find(x=>x.userId===uid);if(!inv)return i.editReply({content:L(lang,'Offer expired.','Lời mời đã hết hạn.'),components:[]});c.pendingInvites=c.pendingInvites.filter(x=>x.userId!==uid);if(a==='accept'){c.workers.push({kind:'PLAYER',userId:uid,name:`Player ${uid.slice(-4)}`,role:inv.role,salary:inv.salary,skill:55,morale:80});c.employees=c.workers.length;}await c.save();return i.editReply(await home(uid,lang));}
 c=await settle(c);if(a==='home')return i.editReply({embeds:[card(c,lang,uid)],components:rows(uid,c,lang)});if(!canManage(c,uid)&&!['people','product','market','finance','shares'].includes(a))return i.followUp({content:L(lang,'❌ Only the controlling shareholder can perform this action.','❌ Chỉ cổ đông kiểm soát mới có thể thực hiện hành động này.'),flags:64});
 if(a==='cycle'){c=await settle(c,1);return i.editReply({embeds:[card(c,lang,uid)],components:rows(uid,c,lang)});}if(['people','product','market','finance','shares'].includes(a)){return i.editReply({embeds:[card(c,lang,uid).setTitle(`${card(c,lang,uid).data.title} • ${T(lang,a==='people'?'people':a==='product'?'product':a==='market'?'market':a==='finance'?'finance':'shares')}`)],components:actionRows(uid,c,lang,a)});}if(a==='invite')return i.showModal(modal(
  `startupmodal:invite:${id}:${uid}`,
  L(lang,'Invite Player','Mời người chơi'),
  [
    ['user',L(lang,'Discord User ID','ID người dùng Discord'),'123456789'],
    ['role',L(lang,'Role','Vai trò'),L(lang,'Operations','Vận hành')],
    ['salary',L(lang,'Salary / cycle','Lương / kỳ'),'250']
  ]
));
 const spend=async(cost,fn)=>{if(c.treasury<cost)return false;c.treasury-=cost;fn();c.valuation=valuation(c);await c.save();return true;};
 if(a==='npc'){if(!await spend(CFG.NPC_HIRE,()=>{c.workers.push({kind:'NPC',name:`NPC #${c.workers.length+1}`,role:'Operations',salary:180,skill:45+Math.floor(Math.random()*20),morale:75});c.employees=c.workers.length;}))return i.followUp({content:L(lang,'❌ Insufficient company treasury.','❌ Ngân quỹ công ty không đủ.'),flags:64});}else if(a==='train'){await spend(CFG.TRAIN_COST,()=>{for(const w of c.workers){w.skill=Math.min(100,w.skill+3);w.morale=Math.min(100,w.morale+2);}});}else if(a==='rd'){await spend(CFG.RD_COST,()=>{c.rdLevel++;c.products++;c.productLines.push({name:`Product ${c.products}`,level:1,quality:Math.min(100,45+c.rdLevel*3),price:100+c.rdLevel*20,capacity:100+c.operationsLevel*20,demand:50+c.brand/5});c.quality=Math.min(100,c.quality+3);});}else if(a==='marketing'){await spend(CFG.MARKETING_COST,()=>{c.marketingLevel++;c.brand=Math.min(100,c.brand+4);});}else if(a==='ops'){await spend(CFG.OPS_COST,()=>{c.operationsLevel++;c.capacity=Math.round(c.capacity*1.2);c.assets+=CFG.OPS_COST*.7;});}else if(a==='expand'){await spend(CFG.EXPAND_COST*c.market,()=>{c.market=Math.min(10,c.market+1);c.brand=Math.min(100,c.brand+2);});}else if(a==='loan'){const limit=Math.max(10000,Math.round(c.valuation*CFG.LOAN_MULTIPLIER*(c.credit/850)*.1));const amount=Math.min(limit,Math.max(10000,Math.round(c.valuation*.1)));c.loans.push({principal:amount,balance:amount,rate:Math.max(.008,(850-c.credit)/10000+.008),term:12});c.debt+=amount;c.treasury+=amount;await c.save();}else if(a==='repay'){const amt=Math.min(c.treasury,Math.max(0,c.debt),50000);if(amt>0){c.treasury-=amt;c.debt-=amt;let left=amt;for(const l of c.loans){const x=Math.min(left,l.balance);l.balance-=x;l.paid+=x;left-=x;if(left<=0)break;}await c.save();}}else if(a==='dividend'){if(c.status!=='PUBLIC'||c.profit<=0)return i.followUp({content:L(lang,'❌ Dividends require a profitable public company.','❌ Chỉ công ty đại chúng có lợi nhuận mới có thể trả cổ tức.'),flags:64});const pool=Math.min(c.treasury,Math.round(Math.max(0,c.profit)*c.dividendRate));if(pool>0){await Promise.all(c.shareholders.map(s=>payPlayer(s.userId,pool*s.shares/c.sharesOutstanding)));c.treasury-=pool;c.lastDividend=pool;c.retainedEarnings-=pool;await c.save();}}else if(a==='ipo'){const q=CFG.IPO,ok=c.status==='PRIVATE'&&c.cycleCount>=q.cycles&&c.valuation>=q.valuation&&c.profit>=q.profit&&c.employees>=q.employees&&c.brand>=q.brand&&c.credit>=q.credit;if(!ok)return i.followUp({content:L(
lang,
`❌ IPO requirements not met:
• Operating history: ${q.cycles} cycles
• Valuation: ${money(q.valuation)} CXu
• Net profit: ${money(q.profit)} CXu
• Workforce: ${q.employees}
• Brand: ${q.brand}
• Credit: ${q.credit}`,
`❌ Chưa đủ điều kiện IPO:
• Thời gian hoạt động: ${q.cycles} kỳ
• Định giá: ${money(q.valuation)} CXu
• Lợi nhuận ròng: ${money(q.profit)} CXu
• Nhân sự: ${q.employees}
• Thương hiệu: ${q.brand}
• Tín dụng: ${q.credit}`
),flags:64});c.status='PUBLIC';c.ticker=(c.name.replace(/[^A-Za-z]/g,'').slice(0,5)||'CORGI').toUpperCase()+String(c._id).slice(-2).toUpperCase();c.sharePrice=Math.max(.01,c.valuation/c.sharesOutstanding);await c.save();}
 return i.editReply({embeds:[card(c,lang,uid)],components:rows(uid,c,lang)});}
async function modalSubmit(i,lang){
try {
const p=i.customId.split(':'),a=p[1];if(a==='create'){const uid=p[2];if(String(i.user.id)!==uid)return;await i.deferReply({flags:64});const name=i.fields.getTextInputValue('name').trim();
const rawIndustry=i.fields.getTextInputValue('industry').trim().toLowerCase();
const industryAliases={
  esport:'esports',
  esports:'esports',
  gaming:'esports',
  game:'esports',
  tech:'technology',
  technology:'technology',
  retail:'retail',
  food:'food',
  logistics:'logistics',
  manufacturing:'manufacturing',
  agriculture:'agriculture',
  mining:'mining',
  energy:'energy',
  entertainment:'entertainment',
  construction:'construction',
  finance:'finance',
  healthcare:'healthcare'
};
const industry=industryAliases[rawIndustry]||rawIndustry;
const capital=Math.floor(Number(i.fields.getTextInputValue('capital')));
const ind=CFG.INDUSTRIES[industry];if(!ind)return i.editReply(L(lang,'❌ Invalid industry. Available: technology, esports, retail, food, logistics, manufacturing, agriculture, mining, energy, entertainment, construction, finance, healthcare.','❌ Ngành nghề không hợp lệ. Có thể dùng: technology, esports, retail, food, logistics, manufacturing, agriculture, mining, energy, entertainment, construction, finance, healthcare.'));
if(!Number.isFinite(capital)||capital<ind.capital)return i.editReply(
  lang==='vi'
    ? `❌ Vốn tối thiểu cho **${industry}**: ${money(ind.capital)} CXu.`
    : `❌ Minimum capital for **${industry}**: ${money(ind.capital)} CXu.`
);const w=await ensureWallet(uid);if(w.cstar<capital)return i.editReply(L(lang,'❌ Insufficient CXu.','❌ Không đủ CXu.'));w.cstar-=capital;await w.save();const c=await Company.create({name,industry,founderId:uid,controllerId:uid,treasury:capital,capital,assets:Math.round(capital*.35),valuation:capital,workers:[{kind:'NPC',name:'Founder Assistant',role:'Operations',salary:0,skill:50,morale:85}],shareholders:[{userId:uid,shares:1000000}]});await Profile.findOneAndUpdate({userId:uid},{$setOnInsert:{userId:uid},$addToSet:{companyIds:c._id},$inc:{createdCompanies:1}},{upsert:true});return i.editReply({content:L(lang,'✅ Company created.','✅ Thành lập công ty thành công.'),embeds:[card(c,lang,uid)],components:rows(uid,c,lang)});}if(a==='invite'){const id=p[2],uid=p[3];if(String(i.user.id)!==uid)return;await i.deferReply({flags:64});const c=await Company.findById(id);if(!c||!canManage(c,uid))return i.editReply(L(lang,'❌ Access denied.','❌ Bạn không có quyền thực hiện thao tác này.'));const user=i.fields.getTextInputValue('user').replace(/\D/g,''),role=i.fields.getTextInputValue('role').trim().slice(0,32),salary=Math.max(0,Math.floor(Number(i.fields.getTextInputValue('salary'))||0));if(!user)return i.editReply(L(lang,'❌ Invalid user ID.','❌ ID người dùng không hợp lệ.'));c.pendingInvites=c.pendingInvites.filter(x=>x.userId!==user);c.pendingInvites.push({userId:user,role,salary});await c.save();return i.editReply(
  lang==='vi'
    ? `✅ Đã gửi lời mời làm việc tới <@${user}>. Họ có thể mở **Game Hub → Startup** để nhận việc.`
    : `✅ Employment offer sent to <@${user}>. They can open **Game Hub → Startup** to accept it.`
);
}
} catch (err) {
  console.error('🔥 STARTUP MODAL ERROR:', err);

  try {
    if (i.deferred || i.replied) {
      await i.editReply({
        content: lang === 'vi'
          ? '❌ Không thể xử lý yêu cầu Startup. Lỗi đã được ghi vào hệ thống.'
          : '❌ Unable to process the Startup request. The error has been logged.',
        embeds: [],
        components: []
      });
    } else {
      await i.reply({
        content: lang === 'vi'
          ? '❌ Không thể xử lý yêu cầu Startup. Lỗi đã được ghi vào hệ thống.'
          : '❌ Unable to process the Startup request. The error has been logged.',
        flags: 64
      });
    }
  } catch (replyErr) {
    console.error('🔥 STARTUP ERROR REPLY FAILED:', replyErr);
  }
}
}
module.exports={home,handle,modalSubmit,settle};
