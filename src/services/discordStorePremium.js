const DiscordEntitlement = require('../models/DiscordEntitlement');
const { sendDeveloperLog } = require('./developerLog');

const STANDARD_SKU_ID = String(process.env.DISCORD_STANDARD_SKU_ID || '').trim();
const API = 'https://discord.com/api/v10';

function raw(entitlement) {
  if (!entitlement) return {};
  if (typeof entitlement.toJSON === 'function') return entitlement.toJSON();
  return entitlement;
}
function value(o, camel, snake) { return o?.[camel] ?? o?.[snake] ?? null; }
function normalize(entitlement) {
  const e = raw(entitlement);
  const id = String(value(e, 'id', 'id') || '');
  const skuId = String(value(e, 'skuId', 'sku_id') || '');
  const guildId = String(value(e, 'guildId', 'guild_id') || '');
  if (!id || !skuId || !guildId) return null;
  const starts = value(e, 'startsAt', 'starts_at');
  const ends = value(e, 'endsAt', 'ends_at');
  return {
    entitlementId: id,
    skuId,
    applicationId: String(value(e, 'applicationId', 'application_id') || ''),
    guildId,
    userId: value(e, 'userId', 'user_id') ? String(value(e, 'userId', 'user_id')) : undefined,
    subscriptionId: value(e, 'subscriptionId', 'subscription_id') ? String(value(e, 'subscriptionId', 'subscription_id')) : undefined,
    type: Number(value(e, 'type', 'type') || 0),
    startsAt: starts ? new Date(starts) : undefined,
    endsAt: ends ? new Date(ends) : undefined,
    deleted: Boolean(value(e, 'deleted', 'deleted')),
    lastSeenAt: new Date()
  };
}
function isStandardSku(skuId) { return Boolean(STANDARD_SKU_ID && String(skuId) === STANDARD_SKU_ID); }
function activeFilter(guildId) {
  return { guildId: String(guildId), skuId: STANDARD_SKU_ID, deleted: false, $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gt: new Date() } }] };
}
async function getActiveStoreEntitlement(guildId) {
  if (!STANDARD_SKU_ID || !guildId) return null;
  return DiscordEntitlement.findOne(activeFilter(guildId)).sort({ createdAt: -1 });
}
async function upsertEntitlement(entitlement) {
  const n = entitlement?.entitlementId ? entitlement : normalize(entitlement);
  if (!n || !isStandardSku(n.skuId)) return null;
  return DiscordEntitlement.findOneAndUpdate(
    { entitlementId: n.entitlementId },
    { $set: n },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}
async function fetchAllEntitlements() {
  if (!STANDARD_SKU_ID) return [];
  const appId = process.env.CLIENT_ID;
  const token = process.env.DISCORD_TOKEN;
  if (!appId || !token) throw new Error('CLIENT_ID or DISCORD_TOKEN is missing');
  const all = [];
  let after = null;
  for (let page = 0; page < 100; page++) {
    const qs = new URLSearchParams({ sku_ids: STANDARD_SKU_ID, limit: '100' });
    if (after) qs.set('after', after);
    const res = await fetch(`${API}/applications/${appId}/entitlements?${qs}`, { headers: { Authorization: `Bot ${token}` }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`List Entitlements failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    const rows = await res.json();
    if (!Array.isArray(rows)) throw new Error('List Entitlements returned an invalid payload');
    all.push(...rows);
    if (rows.length < 100) break;
    after = String(rows[rows.length - 1]?.id || '');
    if (!after) break;
  }
  return all;
}
async function reconcile(client) {
  if (!STANDARD_SKU_ID) return { enabled: false, count: 0 };
  const before = await DiscordEntitlement.find({ skuId: STANDARD_SKU_ID, deleted: false }).lean();
  const beforeActive = new Set(before.filter(x => !x.endsAt || new Date(x.endsAt) > new Date()).map(x => x.guildId));
  const rows = await fetchAllEntitlements();
  const seen = new Set();
  for (const row of rows) {
    const n = normalize(row);
    if (!n || !isStandardSku(n.skuId)) continue;
    seen.add(n.entitlementId);
    await upsertEntitlement(row);
  }
  if (seen.size) await DiscordEntitlement.updateMany({ skuId: STANDARD_SKU_ID, entitlementId: { $nin: [...seen] }, deleted: false }, { $set: { deleted: true, lastSeenAt: new Date() } });
  else await DiscordEntitlement.updateMany({ skuId: STANDARD_SKU_ID, deleted: false }, { $set: { deleted: true, lastSeenAt: new Date() } });

  const afterRows = await DiscordEntitlement.find({ skuId: STANDARD_SKU_ID, deleted: false }).lean();
  const afterActive = new Set(afterRows.filter(x => !x.endsAt || new Date(x.endsAt) > new Date()).map(x => x.guildId));
  const changed = new Set([...beforeActive, ...afterActive].filter(g => beforeActive.has(g) !== afterActive.has(g)));
  if (changed.size) {
    const { applyPremiumBranding } = require('./premium');
    for (const guildId of changed) {
      const guild = client.guilds.cache.get(String(guildId));
      if (guild) await applyPremiumBranding(guild).catch(e => console.warn(`[${guildId}] Discord Store branding sync:`, e.message));
    }
  }
  return { enabled: true, count: rows.length };
}
async function handleGateway(client, entitlement, eventName) {
  const n = normalize(entitlement);
  if (!n || !isStandardSku(n.skuId)) return;
  const before = Boolean(await getActiveStoreEntitlement(n.guildId));
  if (eventName === 'delete') n.deleted = true;
  await upsertEntitlement(n);
  const after = Boolean(await getActiveStoreEntitlement(n.guildId));
  if (before !== after) {
    const { recordPremiumAudit, applyPremiumBranding } = require('./premium');
    await recordPremiumAudit({ guildId: n.guildId, userId: n.userId, action: after ? 'GRANT' : (eventName === 'delete' ? 'REVOKE' : 'EXPIRE'), source: 'discord_store', details: `SKU ${n.skuId} • Entitlement ${n.entitlementId}` });
    await sendDeveloperLog(client, { title: after ? '🛒 Discord Store Premium Activated' : '🛒 Discord Store Premium Ended', description: `Guild: ${n.guildId}\nUser: ${n.userId || '-'}\nSKU: ${n.skuId}\nEntitlement: ${n.entitlementId}` }).catch(() => {});
    const guild = client.guilds.cache.get(n.guildId);
    if (guild) await applyPremiumBranding(guild).catch(e => console.warn(`[${n.guildId}] Discord Store branding event:`, e.message));
  }
}
function startDiscordStorePremium(client) {
  if (!STANDARD_SKU_ID) {
    console.log('🛒 Discord Store Premium: disabled (DISCORD_STANDARD_SKU_ID not set)');
    return;
  }
  client.on('entitlementCreate', e => void handleGateway(client, e, 'create').catch(err => console.error('Discord entitlementCreate:', err.message)));
  client.on('entitlementUpdate', e => void handleGateway(client, e, 'update').catch(err => console.error('Discord entitlementUpdate:', err.message)));
  client.on('entitlementDelete', e => void handleGateway(client, e, 'delete').catch(err => console.error('Discord entitlementDelete:', err.message)));
  const run = () => reconcile(client).then(r => console.log(`🛒 Discord Store Premium synced: ${r.count} entitlement(s)`)).catch(e => console.error('Discord Store Premium sync:', e.message));
  if (client.isReady()) void run(); else client.once('clientReady', () => void run());
  setInterval(() => void reconcile(client).catch(e => console.error('Discord Store Premium sync:', e.message)), 10 * 60 * 1000).unref();
}
module.exports = { STANDARD_SKU_ID, getActiveStoreEntitlement, reconcile, startDiscordStorePremium };
