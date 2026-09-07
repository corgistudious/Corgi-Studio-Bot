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
  rankingRewards: {
    top1: { type: Number, default: 100000 },
    top2: { type: Number, default: 60000 },
    top3: { type: Number, default: 40000 },
    top4to10: { type: Number, default: 20000 },
    top11to100: { type: Number, default: 10000 }
  },
  vipPrices: {
    VIP: { type: Number, default: 250000 },
    VIP_PLUS: { type: Number, default: 500000 },
    VVIP: { type: Number, default: 1000000 },
    SVIP: { type: Number, default: 2500000 },
    SSVIP: { type: Number, default: 5000000 },
    SSSVIP: { type: Number, default: 10000000 }
  }
}, { timestamps: true });

module.exports = model('DeveloperSettings', schema);
