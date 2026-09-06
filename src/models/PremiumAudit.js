const { Schema, model } = require('mongoose');

const schema = new Schema({
  guildId: { type: String, index: true, required: true },
  userId: String,
  actorId: String,
  action: { type: String, enum: ['GRANT','EXTEND','REDEEM','REVOKE','EXPIRE','BRANDING'], required: true },
  source: { type: String, default: 'system' },
  duration: String,
  expiresAt: Date,
  details: String
}, { timestamps: true });

schema.index({ guildId: 1, createdAt: -1 });
module.exports = model('PremiumAudit', schema);
