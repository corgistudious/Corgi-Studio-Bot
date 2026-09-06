const { Schema, model } = require('mongoose');
const schema = new Schema({
  guildId: { type: String, index: true, required: true },
  userId: { type: String, index: true, required: true },
  expiresAt: { type: Date, required: true },
  expiredProcessedAt: Date
}, { timestamps: true });
schema.index({ guildId:1, userId:1 }, { unique:true });
module.exports = model('Premium', schema);
