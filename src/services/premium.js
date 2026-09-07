const { ChannelType, PermissionFlagsBits } = require('discord.js');
const Premium = require('../models/Premium');
const PremiumAudit = require('../models/PremiumAudit');
const GuildSettings = require('../models/GuildSettings');
const { sendDeveloperLog } = require('./developerLog');
const DURATIONS = {'7d':7,'14d':14,'21d':21,'30d':30,'1y':365,'2y':730,'5y':1825,'10y':3650};
const PREMIUM_COMMANDS = new Set();
const PREMIUM_MODULES = new Set();
const PREMIUM_TIERS=['STANDARD','STAR','PLUS','PRO','ULTRA'];
const TIER_MULTIPLIER={STANDARD:1,STAR:2,PLUS:3,PRO:4,ULTRA:5};

async function audit(data) {
  try { return await PremiumAudit.create(data); } catch (e) { console.warn('Premium audit failed:', e.message); return null; }
}

async function grantPremium(guildId, userId, duration, meta = {}) {
  guildId = String(guildId); userId = String(userId);
  const tier=PREMIUM_TIERS.includes(String(meta.tier||'STANDARD').toUpperCase())?String(meta.tier||'STANDARD').toUpperCase():'STANDARD';
  const days = DURATIONS[duration]; if (!days) throw new Error('Invalid premium duration');
  const now = new Date();
  const current = await Premium.findOne({ guildId }).sort({ expiresAt: -1 });
  const wasActive = Boolean(current?.expiresAt && current.expiresAt > now);
  const base = wasActive ? current.expiresAt : now;
  const expiresAt = new Date(base.getTime() + days * 86400000);
  let doc;
  if (current) {
    await Premium.deleteMany({ guildId, _id: { $ne: current._id } });
    current.userId = userId;
    current.tier = tier;
    current.expiresAt = expiresAt;
    current.expiredProcessedAt = undefined;
    doc = await current.save();
  } else {
    doc = await Premium.create({ guildId, userId, tier, expiresAt });
  }
  await GuildSettings.findOneAndUpdate({ guildId }, { $set: { 'premiumBranding.useCorgiStudioEmoji': true } }, { upsert: true, setDefaultsOnInsert: true });
  await audit({ guildId, userId, actorId: meta.actorId, action: wasActive ? 'EXTEND' : (meta.source === 'redeem' ? 'REDEEM' : 'GRANT'), source: meta.source || 'developer', duration, expiresAt });
  await syncSupportEntitlement(meta.client,userId,tier,expiresAt,doc).catch(()=>{});
  return doc;
}

async function getActivePremium(guildId) { return Premium.findOne({ guildId: String(guildId), expiresAt: { $gt: new Date() } }).sort({ expiresAt: -1 }); }
async function isPremiumGuild(guildId) { return Boolean(guildId && await getActivePremium(guildId)); }
async function getPremiumStatus(guildId) {
  const row = await Premium.findOne({ guildId: String(guildId) }).sort({ expiresAt: -1 }).lean();
  if (!row) return { active: false, record: null, remainingMs: 0 };
  const remainingMs = Math.max(0, new Date(row.expiresAt).getTime() - Date.now());
  return { active: remainingMs > 0, record: row, remainingMs };
}
async function revokePremium(guildId, meta = {}) {
  guildId = String(guildId);
  const current = await Premium.find({ guildId }).lean();
  const r = await Premium.deleteMany({ guildId });
  if (current.length) await audit({ guildId, actorId: meta.actorId, action: 'REVOKE', source: meta.source || 'developer', details: `Removed ${r.deletedCount || 0} record(s)` });
  return r.deletedCount || 0;
}
async function recordPremiumAudit(data){return audit(data);}
async function recentPremiumHistory(guildId, limit = 10) {
  const q = guildId ? { guildId: String(guildId) } : {};
  return PremiumAudit.find(q).sort({ createdAt: -1 }).limit(limit).lean();
}

async function applyPremiumBranding(guild) {
  if (!guild) return;
  const active = await isPremiumGuild(guild.id);
  const s = await GuildSettings.findOne({ guildId: guild.id }).lean();
  if (!s?.premiumBranding) return;
  if (!active) {
    if (guild.members.me?.nickname) await guild.members.me.setNickname(null, 'Corgi Premium expired').catch(() => null);
    const { removeLegacyCorgiGuildEmojis } = require('./corgiPremiumEmoji');
    await removeLegacyCorgiGuildEmojis(guild).catch(e => console.warn('Legacy Premium guild emoji cleanup:', e.message));
    return;
  }
  const name = s.premiumBranding.botName?.trim();
  if (name && guild.members.me?.nickname !== name) await guild.members.me.setNickname(name, 'Corgi Premium branding').catch(() => null);
  // V4.10.2: Premium Corgi emojis stay application-owned and are gated by guild Premium.
  // Remove any guild copies installed by V4.10.1 so Nitro cannot reuse those copies elsewhere.
  const { removeLegacyCorgiGuildEmojis } = require('./corgiPremiumEmoji');
  await removeLegacyCorgiGuildEmojis(guild).catch(e => console.warn('Legacy Premium guild emoji cleanup:', e.message));
}


async function premiumMultiplier(guildId){const p=await getActivePremium(guildId);return p?TIER_MULTIPLIER[p.tier||'STANDARD']||1:1;}
async function syncSupportEntitlement(client,userId,tier,expiresAt,premiumDoc=null){
  if(!client||!process.env.CORGI_SUPPORT_GUILD_ID)return {ok:false};
  const eligible=['STAR','PLUS','PRO','ULTRA'].includes(String(tier||'STANDARD').toUpperCase())&&new Date(expiresAt)>new Date();
  const g=client.guilds.cache.get(process.env.CORGI_SUPPORT_GUILD_ID);if(!g)return {ok:false};
  const m=await g.members.fetch(String(userId)).catch(()=>null);if(!m)return {ok:false,reason:'member-not-in-support-guild'};
  const entitlementRole=process.env.CORGI_SUPPORT_ROLE_ID;
  if(entitlementRole){if(eligible)await m.roles.add(entitlementRole,'Corgi Premium support entitlement').catch(()=>null);else await m.roles.remove(entitlementRole,'Corgi Premium support entitlement ended').catch(()=>null);}
  let ch=premiumDoc?.supportChannelId?await g.channels.fetch(premiumDoc.supportChannelId).catch(()=>null):null;
  if(eligible){
    if(!ch){
      const perms=[{id:g.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},{id:m.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]}];
      if(process.env.CORGI_SUPPORT_STAFF_ROLE_ID)perms.push({id:process.env.CORGI_SUPPORT_STAFF_ROLE_ID,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.ManageMessages]});
      perms.push({id:g.members.me.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.ManageChannels]});
      ch=await g.channels.create({name:`premium-${m.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,80),type:ChannelType.GuildText,parent:process.env.CORGI_SUPPORT_CATEGORY_ID||null,topic:`Corgi Premium ${tier} private support • User ${m.id}`,permissionOverwrites:perms,reason:`Premium ${tier} support channel`}).catch(()=>null);
      if(ch){await ch.send(`👑 Welcome ${m} to your private **Corgi Premium ${tier}** support channel. Corgi Support Staff can assist you here.`).catch(()=>{});if(premiumDoc){premiumDoc.supportChannelId=ch.id;premiumDoc.supportLockedAt=undefined;await premiumDoc.save().catch(()=>{});}}
    }else{await ch.permissionOverwrites.edit(m.id,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true,AttachFiles:true}).catch(()=>{});await ch.setTopic(`Corgi Premium ${tier} private support • User ${m.id}`).catch(()=>{});if(ch.name.startsWith('closed-'))await ch.setName(`premium-${m.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,80)).catch(()=>{});}
  }else if(ch){await ch.permissionOverwrites.edit(m.id,{ViewChannel:false,SendMessages:false}).catch(()=>{});if(!ch.name.startsWith('closed-'))await ch.setName(`closed-${ch.name}`.slice(0,100)).catch(()=>{});await ch.send('🔒 Premium support access has ended. This channel is now locked.').catch(()=>{});if(premiumDoc){premiumDoc.supportLockedAt=new Date();await premiumDoc.save().catch(()=>{});}}
  return {ok:true,eligible,channelId:ch?.id||null};
}

function startPremiumService(client) {
  let running = false;
  let legacyCleanupSeeded = false;
  const pendingLegacyCleanup = new Set();

  const seedLegacyCleanup = () => {
    if (legacyCleanupSeeded || !client.isReady()) return;
    legacyCleanupSeeded = true;
    for (const guildId of client.guilds.cache.keys()) pendingLegacyCleanup.add(guildId);
  };

  const runCycle = async () => {
    if (running || !client.isReady()) return;
    running = true;
    try {
      // V4.10.2.1 migration: every guild the bot is currently in gets one
      // cleanup attempt, independent of Premium/branding query state. The
      // cleanup function itself only deletes IDs previously tracked by
      // Corgi-Bot, so unrelated server emojis are never touched.
      seedLegacyCleanup();
      if (pendingLegacyCleanup.size) {
        const { removeLegacyCorgiGuildEmojis } = require('./corgiPremiumEmoji');
        for (const guildId of [...pendingLegacyCleanup]) {
          const guild = client.guilds.cache.get(guildId);
          if (!guild) {
            pendingLegacyCleanup.delete(guildId);
            continue;
          }
          try {
            await removeLegacyCorgiGuildEmojis(guild);
            pendingLegacyCleanup.delete(guildId);
          } catch (e) {
            console.warn(`[${guildId}] Legacy Premium guild emoji cleanup:`, e.message);
          }
        }
      }

      const expired = await Premium.find({ expiresAt: { $lte: new Date() }, expiredProcessedAt: { $exists: false } });
      for (const p of expired) {
        p.expiredProcessedAt = new Date(); await p.save();
        await audit({ guildId:p.guildId,userId:p.userId,action:'EXPIRE',source:'system',expiresAt:p.expiresAt });
        await sendDeveloperLog(client,{title:'💎 Premium Expired',description:`Guild: ${p.guildId}\nUser: ${p.userId}\nExpired: ${p.expiresAt.toISOString()}`});
        await syncSupportEntitlement(client,p.userId,p.tier,p.expiresAt,p).catch(()=>{});
      }

      const branded = await GuildSettings.find({ $or: [
        { 'premiumBranding.botName': { $exists: true, $nin: [null, ''] } },
        { 'premiumBranding.useCorgiStudioEmoji': true }
      ] }).select('guildId premiumBranding').lean();
      for (const s of branded) {
        const guild = client.guilds.cache.get(s.guildId);
        if (guild) await applyPremiumBranding(guild);
      }
    } catch (e) {
      console.error('Premium service:', e.message);
    } finally {
      running = false;
    }
  };

  // Run migration/service immediately after Discord is ready instead of
  // waiting for the first 60-second interval.
  if (client.isReady()) void runCycle();
  else client.once('clientReady', () => void runCycle());

  setInterval(() => void runCycle(), 60000).unref();
}

module.exports = { PREMIUM_TIERS,TIER_MULTIPLIER,premiumMultiplier,syncSupportEntitlement, grantPremium, getActivePremium, isPremiumGuild, getPremiumStatus, revokePremium, recentPremiumHistory, recordPremiumAudit, applyPremiumBranding, startPremiumService, DURATIONS, PREMIUM_COMMANDS, PREMIUM_MODULES };
