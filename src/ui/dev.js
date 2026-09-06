const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle
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
    {label:'Cstar Economy',value:'cstar',emoji:'⭐',description:'Add or subtract Cstar'},
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
  const desc = rows.length ? rows.map(k=>`🔑 \`${k.code}\` • **${k.type}** • ${k.enabled?'✅':'⛔'} • ${k.uses}/${k.maxUses}${k.type==='PREMIUM'?` • ${k.premiumDuration}`:` • ${k.cstarAmount} ⭐`}`).join('\n') : 'No redeem keys.';
  const e = footer(new EmbedBuilder().setTitle('🔑 CD Key Administration').setDescription(desc));
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('dev:key:cstar').setLabel('Create Cstar Key').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('dev:key:premium').setLabel('Create Premium Key').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('dev:key:disable').setLabel('Disable Key').setStyle(ButtonStyle.Danger)
  );
  return {embeds:[e],components:[row,backRow()]};
}

function cstar() {
  const e = footer(new EmbedBuilder().setTitle('⭐ Cstar Economy Control').setDescription('Adjust a member’s Cstar balance by Guild ID + User ID. Negative values subtract Cstar; balance can never go below 0.'));
  const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('dev:cstar:adjust').setLabel('Adjust Cstar').setEmoji('⭐').setStyle(ButtonStyle.Primary));
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
function keyCstarModal(){return new ModalBuilder().setCustomId('dev:modal:keyCstar').setTitle('Create Cstar Key').addComponents(input('amount','Cstar Amount','1000'),input('maxUses','Maximum Uses','1'),input('expiresDays','Expires After Days (0 = never)','0'));}
function keyPremiumModal(){return new ModalBuilder().setCustomId('dev:modal:keyPremium').setTitle('Create Premium Key').addComponents(input('duration','Premium Duration','7d, 14d, 21d, 30d, 1y, 2y, 5y, 10y'),input('maxUses','Maximum Uses','1'),input('expiresDays','Key Expires After Days (0 = never)','0'));}
function keyDisableModal(){return new ModalBuilder().setCustomId('dev:modal:keyDisable').setTitle('Disable CD Key').addComponents(input('code','CD Key','PREM-XXXXXX-XXXXXX-XXXXXX'));}
function cstarModal(){return new ModalBuilder().setCustomId('dev:modal:cstar').setTitle('Adjust Cstar').addComponents(input('guildId','Guild ID','123456789012345678'),input('userId','User ID','123456789012345678'),input('delta','Amount (+ add / - subtract)','1000 or -500'));}
function blacklistModal(kind){return new ModalBuilder().setCustomId(`dev:modal:blacklist:${kind}`).setTitle(`Toggle ${kind} blacklist`).addComponents(input('id',`${kind==='guild'?'Guild':'User'} ID`,'123456789012345678'));}

module.exports={home,system,servers,premium,keys,cstar,blacklist,premiumGrantModal,premiumRevokeModal,keyCstarModal,keyPremiumModal,keyDisableModal,cstarModal,blacklistModal};
