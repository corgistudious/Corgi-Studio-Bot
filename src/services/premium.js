
const Premium = require('../models/Premium');
const PremiumAudit = require('../models/PremiumAudit');
const GuildSettings = require('../models/GuildSettings');
const { sendDeveloperLog } = require('./developerLog');
const DURATIONS = {'7d':7,'14d':14,'21d':21,'30d':30,'1y':365,'2y':730,'5y':1825,'10y':3650};
const PREMIUM_COMMANDS = new Set();
const PREMIUM_MODULES = new Set();
const PREMIUM_TIERS=['STANDARD'];

async function audit(data) {
  try { return await PremiumAudit.create(data); } catch (e) { console.warn('Premium audit failed:', e.message); return null; }
}

async function grantPremium(guildId, userId, duration, meta = {}) {
  guildId = String(guildId); userId = String(userId);
  const tier='STANDARD';
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
  return doc;
}

async function getActivePremium(guildId) {
  guildId = String(guildId);
  const manual = await Premium.findOne({ guildId, expiresAt: { $gt: new Date() } }).sort({ expiresAt: -1 });
  if (manual) return manual;
  const { getActiveStoreEntitlement } = require('./discordStorePremium');
  const store = await getActiveStoreEntitlement(guildId);
  if (!store) return null;
  return { guildId, userId: store.userId, tier: 'STANDARD', expiresAt: store.endsAt || null, source: 'discord_store', entitlementId: store.entitlementId, skuId: store.skuId };
}
async function isPremiumGuild(guildId) { return Boolean(guildId && await getActivePremium(guildId)); }
async function getPremiumStatus(guildId) {
  guildId = String(guildId);
  const active = await getActivePremium(guildId);
  if (active) {
    const store = active.source === 'discord_store';
    const remainingMs = active.expiresAt ? Math.max(0, new Date(active.expiresAt).getTime() - Date.now()) : null;
    return { active: true, record: active, remainingMs, source: store ? 'discord_store' : 'manual' };
  }
  const row = await Premium.findOne({ guildId }).sort({ expiresAt: -1 }).lean();
  if (row) return { active: false, record: row, remainingMs: 0, source: 'manual' };
  return { active: false, record: null, remainingMs: 0, source: null };
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
  const branding = s?.premiumBranding || {};

  // V4.19.1: Premium visual identity lives inside embeds/panels only.
  // Never PATCH the per-guild bot avatar, preventing Discord AVATAR_RATE_LIMIT.
  if (!active) {
    if (guild.members.me?.nickname) await guild.members.me.setNickname(null, 'Corgi Premium expired').catch(() => null);
  } else {
    const name = branding.botName?.trim();
    if (name && guild.members.me?.nickname !== name) await guild.members.me.setNickname(name, 'Corgi Premium branding').catch(() => null);
  }

  const { removeLegacyCorgiGuildEmojis } = require('./corgiPremiumEmoji');
  await removeLegacyCorgiGuildEmojis(guild).catch(e => console.warn('Legacy Premium guild emoji cleanup:', e.message));
}

async function premiumMultiplier(guildId){return 1;}

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

        // Expiration is processed only once. Reset the per-guild Premium identity here,
        // instead of retrying avatar changes every 60 seconds.
        const expiredGuild = client.guilds.cache.get(String(p.guildId));
        if (expiredGuild) {
          await applyPremiumBranding(expiredGuild)
            .catch(e => console.warn(`[${p.guildId}] Premium branding expiry:`, e.message));
        }
      }

      // IMPORTANT: do not re-apply Premium avatar/branding here.
      // Guild nickname/avatar persist on Discord across bot restarts.
      // Branding is applied only on grant/redeem/custom-branding changes,
      // revoke, or the one-time expiration handling above.
    } catch (e) {
      console.error('Premium service:', e.message);
    } finally {
      running = false;
    }
  };

  // Run maintenance immediately after Discord is ready instead of waiting
  // for the first 60-second interval. This does not re-upload Premium avatars.
  if (client.isReady()) void runCycle();
  else client.once('clientReady', () => void runCycle());

  setInterval(() => void runCycle(), 60000).unref();
}

module.exports = { PREMIUM_TIERS,premiumMultiplier, grantPremium, getActivePremium, isPremiumGuild, getPremiumStatus, revokePremium, recentPremiumHistory, recordPremiumAudit, applyPremiumBranding, startPremiumService, DURATIONS, PREMIUM_COMMANDS, PREMIUM_MODULES };
