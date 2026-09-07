const { Schema, model } = require('mongoose');

const titleHistorySchema = new Schema({
  name: { type: String, required: true },
  count: { type: Number, default: 1, min: 1 },
  lastEarnedAt: { type: Date, default: Date.now }
}, { _id: false });

const schema = new Schema({
  userId: { type: String, unique: true, index: true, required: true },
  level: { type: Number, default: 1, min: 1, max: 100000 },
  xp: { type: Number, default: 0, min: 0 },
  totalXp: { type: Number, default: 0, min: 0, index: true },
  totalMessages: { type: Number, default: 0, min: 0 },
  lastXpAt: Date,
  activeTitle: { type: String, default: '' },
  activeTitleExpiresAt: Date,
  titleHistory: { type: [titleHistorySchema], default: [] },
  weeklyWins: { type: Number, default: 0, min: 0 },
  bestWeeklyRank: { type: Number, default: null },
  vipTier: { type: String, enum: ['', 'VIP', 'VIP+', 'VVIP', 'SVIP', 'SSVIP', 'SSSVIP'], default: '' },
  vipExpiresAt: Date,
  vipSource: { type: String, enum: ['', 'CDKEY', 'CSTAR'], default: '' },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true, minimize: false });

schema.index({ totalXp: -1, userId: 1 });
module.exports = model('UserProgress', schema);
