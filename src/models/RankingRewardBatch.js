const { Schema, model } = require('mongoose');
const rewardSchema = new Schema({
  userId: String,
  rank: Number,
  cstar: Number,
  title: String,
  titleExpiresAt: Date
}, { _id: false });
const schema = new Schema({
  weekKey: { type: String, unique: true, index: true, required: true },
  approvedBy: { type: String, required: true },
  approvedAt: { type: Date, default: Date.now },
  rewards: { type: [rewardSchema], default: [] }
}, { timestamps: true });
module.exports = model('RankingRewardBatch', schema);
