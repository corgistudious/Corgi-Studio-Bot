const { Schema, model } = require('mongoose');
const schema = new Schema({
  weekKey: { type: String, index: true, required: true },
  userId: { type: String, index: true, required: true },
  xp: { type: Number, default: 0, min: 0, index: true },
  messages: { type: Number, default: 0, min: 0 },
  lastXpAt: Date
}, { timestamps: true });
schema.index({ weekKey: 1, userId: 1 }, { unique: true });
schema.index({ weekKey: 1, xp: -1, userId: 1 });
module.exports = model('WeeklyProgress', schema);
