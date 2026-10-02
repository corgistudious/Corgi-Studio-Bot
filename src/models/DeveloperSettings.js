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
  creatureV5: {
    enabled: { type: Boolean, default: true },
    maxStars: { type: Number, default: 10, min: 1, max: 20 },
    starEssenceBase: { type: Number, default: 250, min: 1 },
    recoveryFullMinutes: { type: Number, default: 20, min: 1, max: 1440 },
    recoveryKoMinutes: { type: Number, default: 30, min: 1, max: 1440 },
    minBattlePct: { type: Number, default: .20, min: .01, max: 1 },
    winHealPct: { type: Number, default: .08, min: 0, max: 1 },
    adventureEssenceBase: { type: Number, default: 35, min: 0 }, adventureEssenceStage: { type: Number, default: 5, min: 0 },
    bossEssenceBase: { type: Number, default: 120, min: 0 }, bossEssenceStage: { type: Number, default: 18, min: 0 },
    adventureXpBase: { type: Number, default: 30, min: 0 }, adventureXpStage: { type: Number, default: 4, min: 0 },
    bossXpBase: { type: Number, default: 100, min: 0 }, bossXpStage: { type: Number, default: 10, min: 0 },
    adventureCxuBase: { type: Number, default: 20, min: 0 }, adventureCxuStage: { type: Number, default: 2, min: 0 },
    bossCxuBase: { type: Number, default: 80, min: 0 }, bossCxuStage: { type: Number, default: 8, min: 0 },
    levelUpCxuBase: { type: Number, default: 100, min: 0 }, levelUpCxuPerLevel: { type: Number, default: 25, min: 0 },
    dailyEssence: { type: Number, default: 300, min: 0 }, dailyGreat: { type: Number, default: 2, min: 0 }, dailyCxu: { type: Number, default: 250, min: 0 },
    weeklyEssence: { type: Number, default: 1200, min: 0 }, weeklyUltra: { type: Number, default: 2, min: 0 }, weeklyCelestial: { type: Number, default: 1, min: 0 }, weeklyCxu: { type: Number, default: 1000, min: 0 },
    dailyHunts: { type: Number, default: 5, min: 1 }, dailyBattles: { type: Number, default: 3, min: 1 }, weeklyCaptures: { type: Number, default: 15, min: 1 }, weeklyBoss: { type: Number, default: 3, min: 1 },
    refineEnabled:{type:Boolean,default:true},enhanceEnabled:{type:Boolean,default:true},releaseEnabled:{type:Boolean,default:true},multiReleaseEnabled:{type:Boolean,default:true},eventsEnabled:{type:Boolean,default:true},wheelEnabled:{type:Boolean,default:true},refineStoneBaseCost:{type:Number,default:2,min:1},multiReleaseMax:{type:Number,default:50,min:1,max:100},protectHighRarity:{type:Boolean,default:true}
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
