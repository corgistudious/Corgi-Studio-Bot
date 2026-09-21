const { Schema, model } = require('mongoose');
const schema = new Schema({
  code: { type: String, unique: true, index: true, required: true, uppercase: true, trim: true },
  type: { type: String, enum: ['CSTAR','PREMIUM','VIP'], required: true },
  cstarAmount: { type: Number, default: 0 },
  premiumTier: { type: String, enum: ['STANDARD'], default: 'STANDARD' },
  premiumDuration: { type: String, enum: ['7d','14d','21d','30d','1y','2y','5y','10y'] },
  vipTier: { type: String, enum: ['VIP','VIP+','VVIP','SVIP','SSVIP','SSSVIP'] },
  vipDuration: { type: String, enum: ['7d','14d','21d','30d','90d','1y'] },
  maxUses: { type: Number, default: 1, min: 0 },
  uses: { type: Number, default: 0, min: 0 },
  enabled: { type: Boolean, default: true },
  expiresAt: Date,
  usedBy: [{ userId: String, guildId: String, usedAt: { type: Date, default: Date.now } }]
}, { timestamps: true });
module.exports = model('RedeemKey', schema);
