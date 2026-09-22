const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
  FileUploadBuilder, LabelBuilder
} = require('discord.js');
const Dev = require('../services/devControl');

const footer = e => e.setFooter({ text: 'Corgi Studio • Developer Control' }).setTimestamp();
const backRow = () => new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('dev:home').setLabel('Home').setEmoji('🏠').setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId('dev:refresh').setLabel('Refresh').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId('dev:close').setLabel('Close').setEmoji('✖️').setStyle(ButtonStyle.Danger)
);

async function home(client) {
  const s = await Dev.getSystemSnapshot(client);
  const db = ['Disconnected','Connected','Connecting','Disconnecting'][s.dbState] || `State ${s.dbState}`;
  const uptime = Math.floor(s.uptime / 1000);
  const e = footer(new EmbedBuilder()
    .setTitle('🛠️ Corgi-Bot • Developer Control Center')
    .setDescription('Global developer administration. These controls are separate from `/setup` server configuration.')
    .addFields(
      { name:'🤖 Bot', value:`Guilds: **${s.guilds}**\nApprox. members: **${s.users}**\nPing: **${s.ping} ms**\nUptime: **${uptime}s**`, inline:true },
      { name:'🗄️ Database', value:`MongoDB: **${db}**\nEconomy profiles: **${s.economyCount}**\nRedeem keys: **${s.keyCount}**`, inline:true },
      { name:'💎 Premium', value:`Active: **${s.activePremium}**`, inline:true },
      { name:'🛡️ Safety', value:`Maintenance: **${s.maintenanceMode ? 'ON' : 'OFF'}**\nBlocked guilds: **${s.blacklistedGuilds}**\nBlocked users: **${s.blacklistedUsers}**`, inline:true },
      { name:'🧠 AI', value: process.env.GROQ_API_KEY ? '✅ Groq API configured' : '⚠️ Groq API not configured', inline:true },
      { name:'📡 Developer Log', value: process.env.DEVELOPER_LOG_CHANNEL_ID ? `Configured: <#${process.env.DEVELOPER_LOG_CHANNEL_ID}>` : 'Not configured', inline:true }
    ));
  const menu = new StringSelectMenuBuilder().setCustomId('dev:page').setPlaceholder('Choose developer tool…').addOptions(
    {label:'System & Services',value:'system',emoji:'🖥️',description:'Runtime, database, AI and maintenance'},
    {label:'Servers',value:'servers',emoji:'🌐',description:'View guilds using Corgi-Bot'},
    {label:'Premium',value:'premium',emoji:'💎',description:'Grant, revoke and inspect Premium'},
    {label:'CD Keys',value:'keys',emoji:'🔑',description:'Create, list and disable redeem keys'},
    {label:'🪙 CXu Economy',value:'cstar',emoji:'⭐',description:'Add or subtract 🪙 CXu'},
    {label:'Level & EXP',value:'leveling',emoji:'⚔️',description:'Global EXP curve and cooldown'},
    {label:'Global Ranking',value:'ranking',emoji:'🏆',description:'Weekly rewards and Approve Reward'},
    {label:'Fishing',value:'fishing',emoji:'🎣',description:'Global Fishing gameplay configuration'},
    {label:'Game Tournaments',value:'tournaments',emoji:'🏆',description:'Schedule monthly Game Hub tournaments'},
    {label:'Seasonal Events',value:'seasonal',emoji:'🎊',description:'Enable holidays, dates, drops and CXu boxes'},
    {label:'VIP Profile',value:'vipprofile',emoji:'👑',description:'VIP CD Keys and 🪙 CXu prices'},
    {label:'Custom Profile Titles',value:'titles',emoji:'🏷️',description:'Create, grant and revoke profile titles'},
    {label:'Profile Verification',value:'verification',emoji:'✅',description:'Review and assign verification badges'},
    {label:'Global Mail',value:'globalmail',emoji:'📬',description:'Broadcast announcements + optional 🪙 CXu'},
    {label:'Blacklist',value:'blacklist',emoji:'🛡️',description:'Block/unblock guilds or users'}
  );
  return { embeds:[e], components:[new ActionRowBuilder().addComponents(menu), backRow()] };
}

async function system(client) {
  const s = await Dev.getSystemSnapshot(client);
  const e = footer(new EmbedBuilder().setTitle('🖥️ System & Services').addFields(
    {name:'WebSocket',value:`Ping: **${s.ping} ms**\nReady: **${client.isReady() ? 'Yes' : 'No'}**`,inline:true},
    {name:'MongoDB',value:`readyState: **${s.dbState}**`,inline:true},
    {name:'Background Services',value:'Stats: enabled by guild settings\nGiveaway scheduler: running\nContest scheduler: running',inline:false},
    {name:'AI',value:process.env.GROQ_API_KEY?'Groq API configured.':'Groq API not configured.',inline:true},
    {name:'Maintenance',value:s.maintenanceMode?'🔴 ON':'🟢 OFF',inline:true}
  ));
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('dev:maintenance:on').setLabel('Maintenance ON').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('dev:maintenance:off').setLabel('Maintenance OFF').setStyle(ButtonStyle.Success)
  );
  return {embeds:[e],components:[row,backRow()]};
}

async function servers(client) {
  const guilds = [...client.guilds.cache.values()].sort((a,b)=>(b.memberCount||0)-(a.memberCount||0));
  const lines = guilds.slice(0,20).map((g,n)=>`${n+1}. **${g.name}** — ${g.memberCount || 0} members\n   \`${g.id}\``);
  const e = footer(new EmbedBuilder().setTitle(`🌐 Servers • ${guilds.length}`).setDescription(lines.join('\n') || 'Bot is not in any guild.'));
  return {embeds:[e],components:[backRow()]};
}

async function premium() {
  const [rows,history] = await Promise.all([Dev.listPremium(10),Dev.premiumHistory(6)]);
  const desc = rows.length ? rows.map(p=>`💎 Guild \`${p.guildId}\` • User <@${p.userId}> • <t:${Math.floor(new Date(p.expiresAt).getTime()/1000)}:R>`).join('\n') : 'No active Premium records.';
  const hist=history.length?history.map(x=>`• **${x.action}** • Guild \`${x.guildId}\`${x.duration?` • ${x.duration}`:''} • <t:${Math.floor(new Date(x.createdAt).getTime()/1000)}:R>`).join('\n'):'No history yet.';
  const e = footer(new EmbedBuilder().setTitle('💎 Premium Administration').setDescription(desc).addFields({name:'Recent Premium activity',value:hist.slice(0,1024)}));
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('dev:premium:grant').setLabel('Grant / Extend').setEmoji('➕').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('dev:premium:revoke').setLabel('Revoke Guild Premium').setEmoji('🗑️').setStyle(ButtonStyle.Danger)
  );
  return {embeds:[e],components:[row,backRow()]};
}

async function keys() {
  const rows = await Dev.listRecentKeys(10);
  const desc = rows.length ? rows.map(k=>`🔑 \`${k.code}\` • **${k.type}** • ${k.enabled?'✅':'⛔'} • ${k.maxUses===0?`${k.uses}/♾️ Unlimited`:`${k.uses}/${k.maxUses}`}${k.type==='PREMIUM'?` • ${k.premiumDuration}`:k.type==='VIP'?` • ${k.vipTier} ${k.vipDuration}`:` • ${k.cstarAmount} 🪙 CXu`}`).join('\n') : 'No redeem keys.';
  const e = footer(new EmbedBuilder().setTitle('🔑 CD Key Administration').setDescription(desc));
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('dev:key:cstar').setLabel('Create 🪙 CXu Key').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('dev:key:premium').setLabel('Create Premium Key').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('dev:key:disable').setLabel('Disable Key').setStyle(ButtonStyle.Danger)
  );
  return {embeds:[e],components:[row,backRow()]};
}

function cstar() {
  const e = footer(new EmbedBuilder().setTitle('⭐ 🪙 CXu Economy Control').setDescription('Adjust a member’s GLOBAL 🪙 CXu wallet by User ID. The same balance is used in every server. Negative values subtract 🪙 CXu; balance can never go below 0.'));
  const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('dev:cstar:adjust').setLabel('Adjust 🪙 CXu').setEmoji('⭐').setStyle(ButtonStyle.Primary));
  return {embeds:[e],components:[row,backRow()]};
}

async function blacklist() {
  const s=await Dev.getDevSettings();
  const e=footer(new EmbedBuilder().setTitle('🛡️ Blacklist Control').setDescription(`Blocked guilds: **${s.blacklistedGuilds.length}**\nBlocked users: **${s.blacklistedUsers.length}**\n\nUse the buttons to toggle an ID. This stores the list centrally in MongoDB.`));
  const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('dev:blacklist:guild').setLabel('Toggle Guild').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('dev:blacklist:user').setLabel('Toggle User').setStyle(ButtonStyle.Danger)
  );
  return {embeds:[e],components:[row,backRow()]};
}

function input(id,label,placeholder,required=true,style=TextInputStyle.Short){return new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(id).setLabel(label).setPlaceholder(placeholder).setRequired(required).setStyle(style));}
function premiumGrantModal(){return new ModalBuilder().setCustomId('dev:modal:premiumGrant').setTitle('Grant / Extend Premium').addComponents(input('guildId','Guild ID','123456789012345678'),input('userId','User ID / purchaser ID','123456789012345678'),input('duration','Duration','7d, 14d, 21d, 30d, 1y, 2y, 5y, 10y'));}
function premiumRevokeModal(){return new ModalBuilder().setCustomId('dev:modal:premiumRevoke').setTitle('Revoke Guild Premium').addComponents(input('guildId','Guild ID','123456789012345678'));}
function keyCstarModal(){return new ModalBuilder().setCustomId('dev:modal:keyCstar').setTitle('Create 🪙 CXu Key').addComponents(input('customCode','Custom Key (optional)','Corgi2026 / CorgiTanThu',false),input('amount','🪙 CXu Amount','1000'),input('maxUses','Maximum Uses (0 = Unlimited)','1'),input('expiresDays','Expires After Days (0 = never)','0'));}
function keyPremiumModal(){return new ModalBuilder().setCustomId('dev:modal:keyPremium').setTitle('Create Premium Key').addComponents(input('customCode','Custom Key (optional)','Corgi2026 / CorgiTanThu',false),input('duration','Premium Duration','7d, 14d, 21d, 30d, 1y, 2y, 5y, 10y'),input('maxUses','Maximum Uses (0 = Unlimited)','1'),input('expiresDays','Key Expires After Days (0 = never)','0'));}
function keyDisableModal(){return new ModalBuilder().setCustomId('dev:modal:keyDisable').setTitle('Disable CD Key').addComponents(input('code','CD Key','PREM-XXXXXX-XXXXXX-XXXXXX'));}
function cstarModal(){return new ModalBuilder().setCustomId('dev:modal:cstar').setTitle('Adjust Global 🪙 CXu').addComponents(input('userId','User ID','123456789012345678'),input('delta','Amount (+ add / - subtract)','1000 or -500'));}
function blacklistModal(kind){return new ModalBuilder().setCustomId(`dev:modal:blacklist:${kind}`).setTitle(`Toggle ${kind} blacklist`).addComponents(input('id',`${kind==='guild'?'Guild':'User'} ID`,'123456789012345678'));}


async function titles(){
  const T=require('../services/customTitles');const rows=await T.list(15);
  const desc=rows.length?rows.map(t=>`${t.enabled?'✅':'⛔'} ${t.emoji||'🏷️'} **${t.name}** • \`${t.key}\`${t.durationDays?` • ${t.durationDays}d`:' • permanent'}`).join('\n'):'No custom titles yet.';
  const e=footer(new EmbedBuilder().setTitle('🏷️ Custom Profile Titles').setDescription(`${desc}\n\nDeveloper-only catalog. Granting a title makes it the member’s active custom profile title without deleting Weekly Ranking title history.`));
  const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('dev:title:create').setLabel('Create Title').setEmoji('➕').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('dev:title:grant').setLabel('Grant to User').setEmoji('🎁').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('dev:title:revoke').setLabel('Revoke from User').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('dev:title:toggle').setLabel('Enable / Disable').setStyle(ButtonStyle.Secondary)
  );
  return {embeds:[e],components:[row,backRow()]};
}
async function globalMail(actorId){
  const M=require('../services/globalMail');const [draft,recent]=await Promise.all([M.latestDraft(actorId),M.latest(5)]);
  const draftText=draft?`🇺🇸 **${draft.titleEn||draft.title}**\n🇻🇳 **${draft.titleVi||draft.title}**\n🪙 CXu: **${Number(draft.cstarAmount||0).toLocaleString()}**\nExpires: ${draft.expiresAt?`<t:${Math.floor(new Date(draft.expiresAt).getTime()/1000)}:R>`:'Never'}\nDraft ID: \`${draft._id}\``:'No active draft.';
  const hist=recent.length?recent.map(x=>`• **${x.title}** — ${x.deliverySummary?.sent||0} sent / ${x.deliverySummary?.failed||0} failed / ${x.deliverySummary?.skipped||0} skipped`).join('\n'):'No broadcasts yet.';
  const e=footer(new EmbedBuilder().setTitle('📬 Global Mail Center').setDescription('Developer-only broadcast panel. One message is posted to every server where Corgi-Bot can find a writable text/announcement channel. 🪙 CXu attachments can be claimed only once per Discord account, even if the same user is in multiple servers.').addFields({name:'Current Draft',value:draftText.slice(0,1024)},{name:'Recent Broadcasts',value:hist.slice(0,1024)}));
  const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('dev:mail:compose').setLabel(draft?'Replace Draft':'Compose Mail').setEmoji('✍️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('dev:mail:preview').setLabel('Preview').setEmoji('👁️').setStyle(ButtonStyle.Secondary).setDisabled(!draft),
    new ButtonBuilder().setCustomId('dev:mail:image').setLabel('Image').setEmoji('🖼️').setStyle(ButtonStyle.Secondary).setDisabled(!draft),
    new ButtonBuilder().setCustomId('dev:mail:send').setLabel('Broadcast').setEmoji('📨').setStyle(ButtonStyle.Success).setDisabled(!draft),
    new ButtonBuilder().setCustomId('dev:mail:discard').setLabel('Discard').setStyle(ButtonStyle.Danger).setDisabled(!draft)
  );
  return {embeds:[e],components:[row,backRow()]};
}

async function verification(){
  const V=require('../services/profileVerification');
  const rows=await V.recent(12);
  const labels={PENDING:'🕓 PENDING',REVIEW:'🔎 REVIEW',APPROVED:'✅ APPROVED',REJECTED:'❌ REJECTED',REVOKED:'⛔ REVOKED'};
  const desc=rows.length?rows.map(x=>{const b=V.BADGES[x.badgeType];return `${labels[x.status]||x.status} • <@${x.userId}>${b?` • ${b.icon} ${b.en}`:''}\n\`${x.userId}\``;}).join('\n'):'No verification records yet.';
  const e=footer(new EmbedBuilder().setTitle('✅ Profile Verification Review').setDescription(`${desc}\n\nVerification is Developer-reviewed in stages. Corgi-Bot stores only review status/type/note — do not store raw identity documents in the bot database.`).addFields(
    {name:'🔵 Blue',value:'Verified real-account identity',inline:true},
    {name:'🔴 Red',value:'Corgi-Bot Developer',inline:true},
    {name:'🟡 Yellow',value:'Administration / management',inline:true},
    {name:'🟣 Purple',value:'Corgi-Bot Partner',inline:true}
  ));
  const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('dev:verification:manage').setLabel('Review / Update Verification').setEmoji('✅').setStyle(ButtonStyle.Primary));
  return {embeds:[e],components:[row,backRow()]};
}
function verificationModal(){return new ModalBuilder().setCustomId('dev:modal:verification').setTitle('Profile Verification Review').addComponents(
  input('userId','Discord User ID','123456789012345678'),
  input('action','Action','PENDING / REVIEW / APPROVE / REJECT / REVOKE'),
  input('badgeType','Badge: BLUE / RED / YELLOW / PURPLE','BLUE',false),
  input('note','Internal review note (optional)','Reviewed by Developer',false,TextInputStyle.Paragraph)
);}

function titleCreateModal(){return new ModalBuilder().setCustomId('dev:modal:titleCreate').setTitle('Create Custom Profile Title').addComponents(input('key','Unique Key','FOUNDER'),input('name','Display Name','Founder'),input('emoji','Emoji / icon','👑',false),input('durationDays','Duration days (0 = permanent)','0'),input('description','Description','Optional title description',false,TextInputStyle.Paragraph));}
function titleGrantModal(){return new ModalBuilder().setCustomId('dev:modal:titleGrant').setTitle('Grant Custom Title').addComponents(input('userId','Discord User ID','123456789012345678'),input('key','Title Key','FOUNDER'));}
function titleRevokeModal(){return new ModalBuilder().setCustomId('dev:modal:titleRevoke').setTitle('Revoke Custom Title').addComponents(input('userId','Discord User ID','123456789012345678'),input('key','Title Key','FOUNDER'));}
function titleToggleModal(){return new ModalBuilder().setCustomId('dev:modal:titleToggle').setTitle('Enable / Disable Title').addComponents(input('key','Title Key','FOUNDER'));}
function mailComposeModal(){return new ModalBuilder().setCustomId('dev:modal:mailCompose').setTitle('Compose Global Mail • EN + VI').addComponents(input('titleEn','English Title','System Announcement'),input('bodyEn','English Message','Write the English announcement...',true,TextInputStyle.Paragraph),input('titleVi','Tiêu đề Tiếng Việt','Thông báo hệ thống'),input('bodyVi','Nội dung Tiếng Việt','Nhập nội dung Tiếng Việt...',true,TextInputStyle.Paragraph),input('options','Options: CXu | days','1000 | 7',false));}
function mailImageModal(){return new ModalBuilder().setCustomId('dev:modal:mailImage').setTitle('Global Mail • Image').addComponents(new LabelBuilder().setLabel('Attach image').setDescription('Upload one image directly from Discord.').setFileUploadComponent(new FileUploadBuilder().setCustomId('imageFile').setRequired(true).setMinValues(1).setMaxValues(1)));}

async function fishing(){
  const F=require('../services/fishingSettings'),c=await F.get();
  const rarity=Object.entries(c.rarityChances).map(([k,v])=>`${k} ${v}%`).join(' • ');
  const e=footer(new EmbedBuilder().setTitle('🎣 Fishing Configuration').setDescription('Global settings stored in MongoDB. Changes apply to new Fishing actions without changing existing catches, Fishdex, CXu or progression.').addFields(
    {name:'⚙️ General',value:`Fishing: **${c.enabled?'ON':'OFF'}**\nCooldown: **${c.cooldownMs/1000}s**\nStarter bait: **${c.starterBait}**\nBag limit: **${c.maxBag}**`,inline:true},
    {name:'🛡️ Features',value:`Sell All: **${c.sellAllEnabled?'ON':'OFF'}**\nGlobal Ranking: **${c.rankingEnabled?'ON':'OFF'}**`,inline:true},
    {name:'🎲 Rarity chances',value:rarity.slice(0,1024)},
    {name:'🪱 Baits',value:Object.entries(c.baits).map(([k,b])=>`**${k}** • ${b.cost} CXu/${b.qty} • luck ${b.luck} • weight ${b.weight}`).join('\n').slice(0,1024)},
    {name:'🎣 Rods',value:c.rods.map((r,i)=>`**${i}. ${r.nameEn}** • ${r.fish} fish / ${r.kg}kg / ${r.cost} CXu • luck ${r.luck} • x${r.weight}`).join('\n').slice(0,1024)}
  ));
  const r1=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('dev:fishing:general').setLabel('General').setEmoji('⚙️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('dev:fishing:rarity').setLabel('Rarity Rates').setEmoji('🎲').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('dev:fishing:bait').setLabel('Bait').setEmoji('🪱').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('dev:fishing:rod').setLabel('Rod').setEmoji('🎣').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('dev:fishing:score').setLabel('Ranking Score').setEmoji('🏆').setStyle(ButtonStyle.Secondary));
  const r2=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('dev:fishing:resetAsk').setLabel('Reset Defaults').setEmoji('♻️').setStyle(ButtonStyle.Danger));
  return {embeds:[e],components:[r1,r2,backRow()]};
}
function fishingGeneralModal(){return new ModalBuilder().setCustomId('dev:modal:fishingGeneral').setTitle('Fishing • General').addComponents(input('enabled','Fishing enabled: ON / OFF','ON'),input('cooldown','Cooldown seconds','8'),input('starter','Starter Basic Bait','20'),input('bag','Bag limit','250'),input('features','Sell All | Ranking (ON/OFF)','ON | ON'));}
function fishingRarityModal(){return new ModalBuilder().setCustomId('dev:modal:fishingRarity').setTitle('Fishing • Rarity Rates').addComponents(input('rates','Rates (must total 100%)','N=55,R=25,VR=10,UR=5,E=2.5,L=1.3,M=.7,GR=.3,SR=.12,SSR=.06,??=.02',true,TextInputStyle.Paragraph));}
function fishingBaitModal(){return new ModalBuilder().setCustomId('dev:modal:fishingBait').setTitle('Fishing • Bait').addComponents(input('key','Bait key','basic / worm / shrimp / glow'),input('values','cost | qty | luck | weight','100 | 10 | 0 | 0'));}
function fishingRodModal(){return new ModalBuilder().setCustomId('dev:modal:fishingRod').setTitle('Fishing • Rod').addComponents(input('level','Rod level (0-6)','1'),input('values','fish | kg | cost | luck | weight','50 | 100 | 2500 | .02 | 1.08'));}
function fishingScoreModal(){return new ModalBuilder().setCustomId('dev:modal:fishingScore').setTitle('Fishing • Ranking Score').addComponents(input('values','catch | weight | dex | bestWeight','2 | .4 | 250 | 2'));}

function tournamentModal(){return new ModalBuilder().setCustomId('dev:modal:tournamentCreate').setTitle('Schedule Game Tournament').addComponents(input('name','Tournament name','October Pet Arena Cup'),input('gameId','Game ID','pet-arena'),input('registrationAt','Registration opens (ISO)','2026-10-01T00:00:00-04:00'),input('startsAt','Tournament starts (ISO)','2026-10-15T18:00:00-04:00'),input('endsAt','End | Max | Reward | Rules','2026-10-16T18:00:00-04:00 | 32 | 10000 | Highest score wins',true,TextInputStyle.Paragraph));}


async function seasonal(){const S=require('../models/SeasonalEvent');await require('../services/seasonalService').seed();const rows=await S.find().sort({key:1}).lean();const e=footer(new EmbedBuilder().setTitle('🎊 Seasonal Event Control').setDescription('Global holiday events. Valid Game Hub actions can drop event materials. Crafting exchanges **1 crafted item → 1 Gift Box**.').addFields({name:'Events',value:rows.map(x=>`${x.enabled?'🟢':'⚫'} **${x.key}** • ${x.startAt?`<t:${Math.floor(new Date(x.startAt).getTime()/1000)}:d>`:'no start'} → ${x.endAt?`<t:${Math.floor(new Date(x.endAt).getTime()/1000)}:d>`:'no end'} • 🎁 ${x.cstarMin}-${x.cstarMax} CXu`).join('\n').slice(0,1024)}));const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('dev:seasonal:configure').setLabel('Configure Event').setEmoji('⚙️').setStyle(ButtonStyle.Primary));return{embeds:[e],components:[row,backRow()]};}
function seasonalModal(){return new ModalBuilder().setCustomId('dev:modal:seasonal').setTitle('Seasonal Event Configuration').addComponents(input('key','Event key','christmas'),input('enabled','Enabled: ON / OFF','ON'),input('dates','Start ISO | End ISO','2026-12-01T00:00:00-05:00 | 2026-12-31T23:59:59-05:00'),input('reward','Gift Box CXu min | max','250 | 5000'),input('dropMultiplier','Drop multiplier (0.1 - 10)','1'));}

module.exports={home,system,servers,premium,keys,cstar,blacklist,titles,verification,globalMail,fishing,fishingGeneralModal,fishingRarityModal,fishingBaitModal,fishingRodModal,fishingScoreModal,premiumGrantModal,premiumRevokeModal,keyCstarModal,keyPremiumModal,keyDisableModal,cstarModal,blacklistModal,verificationModal,titleCreateModal,titleGrantModal,titleRevokeModal,titleToggleModal,mailComposeModal,mailImageModal,tournamentModal,seasonal,seasonalModal};
