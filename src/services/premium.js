const Premium = require('../models/Premium');
const PremiumAudit = require('../models/PremiumAudit');
const GuildSettings = require('../models/GuildSettings');
const { sendDeveloperLog } = require('./developerLog');
const DURATIONS = {'7d':7,'14d':14,'21d':21,'30d':30,'1y':365,'2y':730,'5y':1825,'10y':3650};
const PREMIUM_COMMANDS = new Set();
const PREMIUM_MODULES = new Set();

async function audit(data) {
  try { return await PremiumAudit.create(data); } catch (e) { console.warn('Premium audit failed:', e.message); return null; }
}

async function grantPremium(guildId, userId, duration, meta = {}) {
  guildId = String(guildId); userId = String(userId);
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
    current.expiresAt = expiresAt;
    current.expiredProcessedAt = undefined;
    doc = await current.save();
  } else {
    doc = await Premium.create({ guildId, userId, expiresAt });
  }
  await GuildSettings.findOneAndUpdate({ guildId }, { $set: { 'premiumBranding.useCorgiStudioEmoji': true } }, { upsert: true, setDefaultsOnInsert: true });
  await audit({ guildId, userId, actorId: meta.actorId, action: wasActive ? 'EXTEND' : (meta.source === 'redeem' ? 'REDEEM' : 'GRANT'), source: meta.source || 'developer', duration, expiresAt });
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
  else client.once('ready', () => void runCycle());

  setInterval(() => void runCycle(), 60000).unref();
}

module.exports = { grantPremium, getActivePremium, isPremiumGuild, getPremiumStatus, revokePremium, recentPremiumHistory, recordPremiumAudit, applyPremiumBranding, startPremiumService, DURATIONS, PREMIUM_COMMANDS, PREMIUM_MODULES };
