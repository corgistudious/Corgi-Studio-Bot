require('dotenv').config();
const mongoose = require('mongoose');
const { connectDatabase } = require('../src/services/database');
const UserEconomy = require('../src/models/UserEconomy');
const { GLOBAL_WALLET_SCOPE } = require('../src/services/economyWallet');

function mapInventory(value) {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (typeof value.toObject === 'function') value = value.toObject();
  return { ...value };
}

function mergeInventoryMax(target, source) {
  const out = { ...target };
  for (const [key, raw] of Object.entries(mapInventory(source))) {
    const qty = Math.max(0, Number(raw) || 0);
    out[key] = Math.max(Number(out[key]) || 0, qty);
  }
  return out;
}

async function main() {
  await connectDatabase();

  const rows = await UserEconomy.find({}).lean();
  const groups = new Map();
  for (const row of rows) {
    const uid = String(row.userId || '');
    if (!uid) continue;
    if (!groups.has(uid)) groups.set(uid, []);
    groups.get(uid).push(row);
  }

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const [userId, userRows] of groups.entries()) {
    // Migration policy: NEVER SUM per-guild balances. We take the largest
    // observed wallet values so a user cannot receive duplicate currency.
    const cstar = Math.max(0, ...userRows.map(r => Number(r.cstar) || 0));
    const spinPending = Math.max(0, ...userRows.map(r => Number(r.spinPending) || 0));

    const lastDailyAt = userRows
      .map(r => r.lastDailyAt ? new Date(r.lastDailyAt) : null)
      .filter(Boolean)
      .sort((a, b) => b - a)[0] || null;

    let inventory = {};
    for (const row of userRows) inventory = mergeInventoryMax(inventory, row.inventory);

    const existing = userRows.find(r => r.guildId === GLOBAL_WALLET_SCOPE);
    const update = {
      guildId: GLOBAL_WALLET_SCOPE,
      userId,
      cstar,
      spinPending,
      inventory,
      ...(lastDailyAt ? { lastDailyAt } : {}),
    };

    if (!existing) {
      await UserEconomy.create(update);
      created++;
    } else {
      const oldInv = JSON.stringify(mapInventory(existing.inventory));
      const newInv = JSON.stringify(inventory);
      const same = Number(existing.cstar || 0) === cstar
        && Number(existing.spinPending || 0) === spinPending
        && String(existing.lastDailyAt || '') === String(lastDailyAt || '')
        && oldInv === newInv;
      if (same) unchanged++;
      else {
        await UserEconomy.updateOne({ _id: existing._id }, { $set: update });
        updated++;
      }
    }
  }

  const globalCount = await UserEconomy.countDocuments({ guildId: GLOBAL_WALLET_SCOPE });
  console.log('====================================');
  console.log('✅ GLOBAL 🌟CSTAR WALLET MIGRATION COMPLETE');
  console.log(`👤 Users scanned: ${groups.size}`);
  console.log(`🆕 Global wallets created: ${created}`);
  console.log(`🔄 Global wallets updated: ${updated}`);
  console.log(`➖ Global wallets unchanged: ${unchanged}`);
  console.log(`🌐 Total global wallets: ${globalCount}`);
  console.log('ℹ️ Legacy per-server rows were kept for rollback safety.');
  console.log('ℹ️ Balance policy: highest per-server balance, never summed.');
  console.log('====================================');
}

main()
  .catch(err => {
    console.error('❌ Global wallet migration failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
