const { Schema, model } = require('mongoose');

const schema = new Schema({
  key: { type: String, unique: true, default: 'global' },
  blacklistedGuilds: { type: [String], default: [] },
  blacklistedUsers: { type: [String], default: [] },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'Corgi-Bot is under maintenance.' },
  notes: { type: String, default: '' },
  progression: {
    xpMin: { type: Number, default: 15 },
    xpMax: { type: Number, default: 25 },
    cooldownSeconds: { type: Number, default: 60 },
    maxLevel: { type: Number, default: 100000 },
    curveBase: { type: Number, default: 250 },
    curveDivisor: { type: Number, default: 10 },
    curvePower: { type: Number, default: 1.35 }
  },
  ads: {
    enabled: { type: Boolean, default: true },
    minBudget: { type: Number, default: 100000, min: 1 },
    defaultDays: { type: Number, default: 7, min: 1, max: 30 },
    placementMultipliers: {
      HOME: { type: Number, default: 1.0, min: 0.1, max: 100 },
      TRENDING: { type: Number, default: 1.25, min: 0.1, max: 100 },
      VOTE: { type: Number, default: 1.0, min: 0.1, max: 100 },
      GAME_HUB: { type: Number, default: 1.25, min: 0.1, max: 100 },
      MARKETPLACE: { type: Number, default: 1.25, min: 0.1, max: 100 },
      LEADERBOARD: { type: Number, default: 1.5, min: 0.1, max: 100 },
      PROFILE: { type: Number, default: 1.0, min: 0.1, max: 100 },
      NEWS_FORUM: { type: Number, default: 1.0, min: 0.1, max: 100 },
      NETWORK: { type: Number, default: 2.0, min: 0.1, max: 100 }
    }
  },
  bank: {
    enabled: { type: Boolean, default: true },
    annualRatePercent: { type: Number, default: 5, min: 0, max: 1000 },
    compoundHours: { type: Number, default: 24, min: 1, max: 8760 },
    minDeposit: { type: Number, default: 100, min: 0 },
    maxBalance: { type: Number, default: 1000000000, min: 0 }
  },
  rankingRewards: {
    top1: { type: Number, default: 100000 },
    top2: { type: Number, default: 60000 },
    top3: { type: Number, default: 40000 },
    top4to10: { type: Number, default: 20000 },
    top11to100: { type: Number, default: 10000 }
  }
}, { timestamps: true });

module.exports = model('DeveloperSettings', schema);
