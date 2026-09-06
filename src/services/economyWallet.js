const UserEconomy = require('../models/UserEconomy');

// One Discord user = one shared wallet across every guild.
// We intentionally keep using the existing guildId field with a fixed sentinel
// so the current MongoDB compound unique index remains safe and no destructive
// schema/index migration is required.
const GLOBAL_WALLET_SCOPE = '__GLOBAL__';

function walletFilter(userId) {
  return { guildId: GLOBAL_WALLET_SCOPE, userId: String(userId) };
}

async function ensureWallet(userId) {
  const uid = String(userId);
  return UserEconomy.findOneAndUpdate(
    walletFilter(uid),
    { $setOnInsert: { guildId: GLOBAL_WALLET_SCOPE, userId: uid } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
}

async function getWallet(userId, { lean = false } = {}) {
  const q = UserEconomy.findOne(walletFilter(userId));
  return lean ? q.lean() : q;
}

module.exports = {
  GLOBAL_WALLET_SCOPE,
  walletFilter,
  ensureWallet,
  getWallet,
};
