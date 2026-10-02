const CTokenWallet = require('../models/CTokenWallet');

function normalizeAmount(amount) {
  const n = Math.floor(Number(amount));
  if (!Number.isSafeInteger(n) || n <= 0) {
    throw new Error('INVALID_CTOKEN_AMOUNT');
  }
  return n;
}

async function ensureWallet(userId) {
  return CTokenWallet.findOneAndUpdate(
    { userId: String(userId) },
    { $setOnInsert: { userId: String(userId) } },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true
    }
  );
}

async function getBalance(userId) {
  const wallet = await ensureWallet(userId);
  return wallet.balance;
}

async function grant(userId, amount) {
  const value = normalizeAmount(amount);

  return CTokenWallet.findOneAndUpdate(
    { userId: String(userId) },
    {
      $inc: {
        balance: value,
        lifetimeGranted: value
      },
      $setOnInsert: {
        userId: String(userId)
      }
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true
    }
  );
}

async function remove(userId, amount) {
  const value = normalizeAmount(amount);

  const wallet = await CTokenWallet.findOneAndUpdate(
    {
      userId: String(userId),
      balance: { $gte: value }
    },
    {
      $inc: {
        balance: -value
      }
    },
    {
      returnDocument: 'after'
    }
  );

  if (!wallet) throw new Error('INSUFFICIENT_CTOKEN');
  return wallet;
}

async function spend(userId, amount) {
  const value = normalizeAmount(amount);

  const wallet = await CTokenWallet.findOneAndUpdate(
    {
      userId: String(userId),
      balance: { $gte: value }
    },
    {
      $inc: {
        balance: -value,
        lifetimeSpent: value
      }
    },
    {
      returnDocument: 'after'
    }
  );

  if (!wallet) throw new Error('INSUFFICIENT_CTOKEN');
  return wallet;
}

async function refundSpend(userId, amount) {
  const value = normalizeAmount(amount);

  const wallet = await CTokenWallet.findOneAndUpdate(
    {
      userId: String(userId),
      lifetimeSpent: { $gte: value }
    },
    {
      $inc: {
        balance: value,
        lifetimeSpent: -value
      }
    },
    {
      returnDocument: 'after'
    }
  );

  if (!wallet) throw new Error('INVALID_CTOKEN_REFUND');
  return wallet;
}

module.exports = {
  ensureWallet,
  getBalance,
  grant,
  remove,
  spend,
  refundSpend
};
