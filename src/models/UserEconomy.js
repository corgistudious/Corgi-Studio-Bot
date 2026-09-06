const { Schema, model } = require('mongoose');
const schema = new Schema({
  guildId: { type: String, index: true, required: true },
  userId: { type: String, index: true, required: true },
  cstar: { type: Number, default: 0, min: 0 },
  spinPending: { type: Number, default: 0, min: 0 },
  lastDailyAt: Date,
  inventory: { type: Map, of: Number, default: {} }
}, { timestamps: true });
schema.index({ guildId: 1, userId: 1 }, { unique: true });
module.exports = model('UserEconomy', schema);
