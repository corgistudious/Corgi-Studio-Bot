const {Events,PermissionFlagsBits}=require('discord.js');
const {canSetup}=require('../services/permissions');
const {getGuildSettings}=require('../services/guildSettings');
const {isPremiumGuild}=require('../services/premium');
const {ensureStatsBoard,FREE_STAT_KEYS,PREMIUM_STAT_KEYS,clearPremiumCache,freeConfiguredKeys,premiumConfiguredKeys}=require('../modules/stats');
const StatsUI=require('../ui/stats');
const SetupUI=require('../ui/setup');
const {pick}=require('../services/i18n');

module.exports={name:Events.InteractionCreate,async execute(i){
  if(!i.customId?.startsWith('statscfg:'))return;
  const s=await getGuildSettings(i.guildId);
  if(!canSetup(i.member))return i.reply({content:pick(s.language,'You need Manage Server or Administrator.','Bạn cần quyền Quản lý Server hoặc Administrator.'),flags:64});

  if(i.customId==='statscfg:back'){
    await i.deferUpdate();
    return i.editReply(await SetupUI.buildSetupHome(i.guild,s));
  }
  if(i.customId==='statscfg:refresh'){
    await i.deferUpdate();
    return i.editReply(await StatsUI.buildStatsPage(i.guild,s));
  }

  if(i.customId==='statscfg:ensure'){
    if(!i.guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels))return i.reply({content:pick(s.language,'❌ I need Manage Channels permission.','❌ Bot cần quyền Quản lý kênh.'),flags:64});
    await i.deferReply({flags:64});
    s.modules.stats=true;await s.save();
    clearPremiumCache(i.guildId);
    const r=await ensureStatsBoard(i.guild,s);
    return i.editReply({content:pick(s.language,`✅ Stats Board is ready in **${r.category.name}**.`,`✅ Stats Board đã sẵn sàng tại **${r.category.name}**.`)});
  }

  const isFreeAction=['statscfg:freeToggle','statscfg:freeAll','statscfg:freeNone'].includes(i.customId);
  const isPremiumAction=['statscfg:premiumToggle','statscfg:premiumAll','statscfg:premiumNone'].includes(i.customId);
  if(!isFreeAction&&!isPremiumAction)return;

  if(isPremiumAction&&!(await isPremiumGuild(i.guildId)))return i.reply({content:pick(s.language,'💎 Active Corgi Premium is required to customize advanced Stats.','💎 Cần Corgi Premium đang hoạt động để tùy chỉnh Stats nâng cao.'),flags:64});

  await i.deferUpdate();

  let freeEnabled=freeConfiguredKeys(s);
  let premiumEnabled=premiumConfiguredKeys(s);

  if(i.customId==='statscfg:freeToggle'&&i.isStringSelectMenu()){
    const key=i.values[0];if(FREE_STAT_KEYS.includes(key))freeEnabled=freeEnabled.includes(key)?freeEnabled.filter(x=>x!==key):[...freeEnabled,key];
  }else if(i.customId==='statscfg:freeAll')freeEnabled=[...FREE_STAT_KEYS];
  else if(i.customId==='statscfg:freeNone')freeEnabled=[];
  else if(i.customId==='statscfg:premiumToggle'&&i.isStringSelectMenu()){
    const key=i.values[0];if(PREMIUM_STAT_KEYS.includes(key))premiumEnabled=premiumEnabled.includes(key)?premiumEnabled.filter(x=>x!==key):[...premiumEnabled,key];
  }else if(i.customId==='statscfg:premiumAll')premiumEnabled=[...PREMIUM_STAT_KEYS];
  else if(i.customId==='statscfg:premiumNone')premiumEnabled=[];

  s.statsConfig=s.statsConfig||{};
  s.statsConfig.freeEnabled=freeEnabled;
  s.statsConfig.premiumEnabled=premiumEnabled;
  s.modules.stats=true;
  await s.save();
  clearPremiumCache(i.guildId);

  if(i.guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)){
    const premium=await isPremiumGuild(i.guildId);
    await ensureStatsBoard(i.guild,s,{premiumActive:premium}).catch(e=>console.warn('Stats board reconcile:',e.message));
  }
  const fresh=await getGuildSettings(i.guildId);
  return i.editReply(await StatsUI.buildStatsPage(i.guild,fresh));
}};
