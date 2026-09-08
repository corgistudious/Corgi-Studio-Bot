const {
  ChannelType,
  PermissionFlagsBits,
  GatewayIntentBits,
} = require('discord.js');
const { STATS_REFRESH_MS } = require('../../config/constants');
const GuildSettings = require('../../models/GuildSettings');
const { isGuildOperational } = require('../../services/accessControl');
const { isPremiumGuild } = require('../../services/premium');

const FREE_STAT_KEYS = ['members', 'humans', 'bots', 'roles'];
const PREMIUM_STAT_KEYS = [
  'online', 'boosts', 'boostLevel', 'emojis', 'stickers', 'categories',
  'textChannels', 'voiceChannels', 'stageChannels', 'forums',
  'announcements', 'threads', 'events',
];

function isStatsOwnedChannel(channel, guild) {
  const settings = guild.__corgiStatsSettings;
  const categoryId = settings?.channels?.stats;
  const statIds = settings?.statsVoiceChannels?.toObject?.() || settings?.statsVoiceChannels || {};
  const ownedIds = new Set([categoryId, ...Object.values(statIds)].filter(Boolean).map(String));
  return ownedIds.has(String(channel.id)) || (categoryId && String(channel.parentId) === String(categoryId));
}

function countNonStatsChannels(guild, predicate) {
  return guild.channels.cache.filter(c => !isStatsOwnedChannel(c, guild) && predicate(c)).size;
}

const STAT_DEFINITIONS = [
  { key:'members', emoji:'👥', free:true, en:'Members', vi:'Thành viên', value:g=>g.memberCount },
  { key:'humans', emoji:'👤', free:true, en:'Humans', vi:'Người dùng', value:g=>Math.max(0,g.memberCount-g.members.cache.filter(m=>m.user.bot).size) },
  { key:'bots', emoji:'🤖', free:true, en:'Bots', vi:'Bot', value:g=>g.members.cache.filter(m=>m.user.bot).size },
  { key:'roles', emoji:'🎭', free:true, en:'Roles', vi:'Vai trò', value:g=>g.roles.cache.size },
  { key:'online', emoji:'🟢', en:'Online', vi:'Trực tuyến', value:g=>{
    if(!g.client.options.intents.has(GatewayIntentBits.GuildPresences)) return 'N/A';
    return g.members.cache.filter(m=>m.presence?.status && m.presence.status!=='offline').size;
  }},
  { key:'boosts', emoji:'🚀', en:'Boosts', vi:'Lượt Boost', value:g=>g.premiumSubscriptionCount??0 },
  { key:'boostLevel', emoji:'💎', en:'Boost Level', vi:'Cấp Boost', value:g=>g.premiumTier??0 },
  { key:'emojis', emoji:'😀', en:'Emojis', vi:'Emoji', value:g=>g.emojis.cache.size },
  { key:'stickers', emoji:'🎨', en:'Stickers', vi:'Sticker', value:g=>g.stickers.cache.size },
  { key:'categories', emoji:'📁', en:'Categories', vi:'Danh mục', value:g=>countNonStatsChannels(g,c=>c.type===ChannelType.GuildCategory) },
  { key:'textChannels', emoji:'💬', en:'Text Channels', vi:'Kênh chữ', value:g=>countNonStatsChannels(g,c=>c.type===ChannelType.GuildText) },
  { key:'voiceChannels', emoji:'🔊', en:'Voice Channels', vi:'Kênh thoại', value:g=>countNonStatsChannels(g,c=>c.type===ChannelType.GuildVoice) },
  { key:'stageChannels', emoji:'🎙️', en:'Stage Channels', vi:'Kênh sân khấu', value:g=>countNonStatsChannels(g,c=>c.type===ChannelType.GuildStageVoice) },
  { key:'forums', emoji:'📝', en:'Forums', vi:'Diễn đàn', value:g=>countNonStatsChannels(g,c=>c.type===ChannelType.GuildForum) },
  { key:'announcements', emoji:'📢', en:'Announcements', vi:'Kênh thông báo', value:g=>countNonStatsChannels(g,c=>c.type===ChannelType.GuildAnnouncement) },
  { key:'threads', emoji:'🧵', en:'Threads', vi:'Chủ đề', value:g=>countNonStatsChannels(g,c=>[ChannelType.PublicThread,ChannelType.PrivateThread,ChannelType.AnnouncementThread].includes(c.type)) },
  { key:'events', emoji:'📅', en:'Events', vi:'Sự kiện', value:g=>g.scheduledEvents.cache.size },
];

const DEF_BY_KEY = new Map(STAT_DEFINITIONS.map(d=>[d.key,d]));
const warmedGuilds = new Set();
const premiumCache = new Map();

function lockedOverwrites(guild) {
  return [{
    id: guild.roles.everyone.id,
    allow: [PermissionFlagsBits.ViewChannel],
    deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream, PermissionFlagsBits.UseVAD],
  }];
}

function lang(settings){ return settings?.language==='vi'?'vi':'en'; }
function label(def, settings){ return lang(settings)==='vi'?def.vi:def.en; }
function categoryName(settings){ return lang(settings)==='vi'?'📊 THỐNG KÊ SERVER':'📊 SERVER STATS'; }
function statName(def, guild, settings){ return `${def.emoji} ${label(def,settings)}: ${def.value(guild)}`; }
function freeConfiguredKeys(settings){
  const raw = Array.isArray(settings?.statsConfig?.freeEnabled) ? settings.statsConfig.freeEnabled : FREE_STAT_KEYS;
  return raw.filter(k=>FREE_STAT_KEYS.includes(k));
}
function premiumConfiguredKeys(settings){
  const raw = Array.isArray(settings?.statsConfig?.premiumEnabled) ? settings.statsConfig.premiumEnabled : [];
  return raw.filter(k=>PREMIUM_STAT_KEYS.includes(k));
}
async function premiumActiveCached(guildId){
  const hit=premiumCache.get(guildId),now=Date.now();
  if(hit&&now-hit.at<30000)return hit.active;
  const active=await isPremiumGuild(guildId);
  premiumCache.set(guildId,{active,at:now});
  return active;
}
function clearPremiumCache(guildId){ premiumCache.delete(String(guildId)); }

async function activeStatKeys(settings, premiumActive){
  return [...freeConfiguredKeys(settings), ...(premiumActive?premiumConfiguredKeys(settings):[])];
}

async function warmMembers(guild){
  if(warmedGuilds.has(guild.id))return;
  await guild.members.fetch().catch(()=>null);
  warmedGuilds.add(guild.id);
}

async function ensureStatsBoard(guild, settings, options={}) {
  guild.__corgiStatsSettings = settings;
  await warmMembers(guild);
  const premiumActive = options.premiumActive ?? await isPremiumGuild(guild.id);
  const wantedKeys = await activeStatKeys(settings,premiumActive);

  let category=null;
  if(settings.channels?.stats){
    category=await guild.channels.fetch(settings.channels.stats).catch(()=>null);
    if(category?.type!==ChannelType.GuildCategory)category=null;
  }
  if(!category){
    category=await guild.channels.create({
      name:categoryName(settings), type:ChannelType.GuildCategory,
      permissionOverwrites:lockedOverwrites(guild), reason:'Corgi-Bot locked voice stats board',
    });
    settings.channels.stats=category.id;
  }else if(category.name!==categoryName(settings)){
    await category.setName(categoryName(settings),'Corgi-Bot language sync').catch(()=>null);
  }

  const ids=settings.statsVoiceChannels?.toObject?.()||settings.statsVoiceChannels||{};
  const nextIds={};

  for(const key of wantedKeys){
    const def=DEF_BY_KEY.get(key); if(!def)continue;
    let channel=ids[key]?await guild.channels.fetch(ids[key]).catch(()=>null):null;
    if(!channel||channel.type!==ChannelType.GuildVoice){
      channel=await guild.channels.create({
        name:statName(def,guild,settings), type:ChannelType.GuildVoice, parent:category.id,
        permissionOverwrites:lockedOverwrites(guild), reason:`Corgi-Bot server stat: ${def.en}`,
      });
    }else{
      const changes={};
      if(channel.parentId!==category.id)changes.parent=category.id;
      const wanted=statName(def,guild,settings); if(channel.name!==wanted)changes.name=wanted;
      if(Object.keys(changes).length)await channel.edit(changes).catch(()=>null);
      await channel.permissionOverwrites.edit(guild.roles.everyone,{ViewChannel:true,Connect:false,Speak:false,Stream:false,UseVAD:false}).catch(()=>null);
    }
    nextIds[key]=channel.id;
  }

  // Remove any Stats channel that the server has disabled. Premium-only channels are also removed when Premium expires.
  for(const key of Object.keys(ids)){
    if(wantedKeys.includes(key))continue;
    if(!DEF_BY_KEY.has(key))continue;
    const channel=await guild.channels.fetch(ids[key]).catch(()=>null);
    if(channel?.type===ChannelType.GuildVoice)await channel.delete('Corgi-Bot stat disabled or unavailable').catch(()=>null);
  }

  settings.statsVoiceChannels=nextIds;
  settings.statsMessageId=undefined;
  await settings.save();
  return {category,channels:nextIds,premiumActive,wantedKeys};
}

async function updateStatsBoard(guild, settings, options={}) {
  guild.__corgiStatsSettings = settings;
  const ids=settings.statsVoiceChannels?.toObject?.()||settings.statsVoiceChannels||{};
  if(!settings.channels?.stats||!Object.keys(ids).length)return false;
  await warmMembers(guild);

  const premiumActive=options.premiumActive ?? await premiumActiveCached(guild.id);
  const wantedKeys=await activeStatKeys(settings,premiumActive);
  const existingKeys=Object.keys(ids).filter(k=>ids[k]);
  const needsReconcile=existingKeys.some(k=>!wantedKeys.includes(k))||wantedKeys.some(k=>!ids[k]);
  if(needsReconcile){await ensureStatsBoard(guild,settings,{premiumActive});return true;}

  let changed=false;
  const category=guild.channels.cache.get(settings.channels.stats)||await guild.channels.fetch(settings.channels.stats).catch(()=>null);
  if(category?.type===ChannelType.GuildCategory&&category.name!==categoryName(settings)){
    await category.setName(categoryName(settings),'Corgi-Bot language sync').catch(()=>null);changed=true;
  }

  for(const key of wantedKeys){
    const def=DEF_BY_KEY.get(key),id=ids[key]; if(!def||!id)continue;
    const channel=guild.channels.cache.get(id)||await guild.channels.fetch(id).catch(()=>null);
    if(!channel||channel.type!==ChannelType.GuildVoice)continue;
    const wanted=statName(def,guild,settings);
    // Poll every 3 seconds, but only rename when the displayed value/language changed.
    if(channel.name!==wanted){
      await channel.setName(wanted,'Corgi-Bot real-time server stats').catch(e=>console.warn(`Stats rename failed (${key}):`,e.message));
      changed=true;
    }
  }
  return changed;
}

function startStatsService(client){
  let running=false;
  setInterval(async()=>{
    if(running||!client.isReady())return;
    running=true;
    try{
      const settings=await GuildSettings.find({'modules.stats':true,'channels.stats':{$exists:true,$ne:null}});
      for(const s of settings){
        try{
          const guild=client.guilds.cache.get(s.guildId);
          if(!guild||!(await isGuildOperational(s.guildId)))continue;
          await updateStatsBoard(guild,s);
        }catch(e){console.error('stats tick',e.message);}
      }
    }finally{running=false;}
  },STATS_REFRESH_MS).unref();
}

module.exports={
  startStatsService,ensureStatsBoard,updateStatsBoard,clearPremiumCache,
  FREE_STAT_KEYS,PREMIUM_STAT_KEYS,STAT_DEFINITIONS,DEF_BY_KEY,freeConfiguredKeys,premiumConfiguredKeys,
};
