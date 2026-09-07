const {Events,PermissionFlagsBits}=require('discord.js');
const {canSetup}=require('../services/permissions');
const {getGuildSettings}=require('../services/guildSettings');
const {isPremiumGuild}=require('../services/premium');
const {ensureStatsBoard,PREMIUM_STAT_KEYS,clearPremiumCache}=require('../modules/stats');
const StatsUI=require('../ui/stats');
const SetupUI=require('../ui/setup');
const {pick}=require('../services/i18n');

module.exports={name:Events.InteractionCreate,async execute(i){
  if(!i.customId?.startsWith('statscfg:'))return;
  const s=await getGuildSettings(i.guildId);
  if(!canSetup(i.member))return i.reply({content:pick(s.language,'You need Manage Server or Administrator.','Bạn cần quyền Quản lý Server hoặc Administrator.'),flags:64});

  if(i.customId==='statscfg:back')return i.update(await SetupUI.buildSetupHome(i.guild,s));
  if(i.customId==='statscfg:refresh')return i.update(await StatsUI.buildStatsPage(i.guild,s));

  if(i.customId==='statscfg:ensure'){
    if(!i.guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels))return i.reply({content:pick(s.language,'❌ I need Manage Channels permission.','❌ Bot cần quyền Quản lý kênh.'),flags:64});
    s.modules.stats=true;await s.save();
    clearPremiumCache(i.guildId);
    const r=await ensureStatsBoard(i.guild,s);
    await i.reply({content:pick(s.language,`✅ Stats Board is ready in **${r.category.name}**.`,`✅ Stats Board đã sẵn sàng tại **${r.category.name}**.`),flags:64});
    const fresh=await getGuildSettings(i.guildId);return;
  }

  const premium=await isPremiumGuild(i.guildId);
  if(!premium)return i.reply({content:pick(s.language,'💎 Active Corgi Premium is required to customize advanced Stats.','💎 Cần Corgi Premium đang hoạt động để tùy chỉnh Stats nâng cao.'),flags:64});

  let enabled=Array.isArray(s?.statsConfig?.premiumEnabled)?[...s.statsConfig.premiumEnabled]:[];
  if(i.customId==='statscfg:toggle'&&i.isStringSelectMenu()){
    const key=i.values[0];if(!PREMIUM_STAT_KEYS.includes(key))return;
    enabled=enabled.includes(key)?enabled.filter(x=>x!==key):[...enabled,key];
  }else if(i.customId==='statscfg:all')enabled=[...PREMIUM_STAT_KEYS];
  else if(i.customId==='statscfg:none')enabled=[];
  else return;

  s.statsConfig=s.statsConfig||{};s.statsConfig.premiumEnabled=enabled;s.modules.stats=true;await s.save();
  clearPremiumCache(i.guildId);
  if(i.guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels))await ensureStatsBoard(i.guild,s,{premiumActive:true}).catch(e=>console.warn('Stats board reconcile:',e.message));
  const fresh=await getGuildSettings(i.guildId);
  return i.update(await StatsUI.buildStatsPage(i.guild,fresh));
}};
