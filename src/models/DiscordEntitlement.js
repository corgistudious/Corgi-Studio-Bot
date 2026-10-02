const { Schema, model } = require('mongoose');

const schema = new Schema({
  entitlementId: { type: String, unique: true, index: true, required: true },
  skuId: { type: String, index: true, required: true },
  applicationId: String,
  guildId: { type: String, index: true, required: true },
  userId: String,
  subscriptionId: String,
  type: Number,
  startsAt: Date,
  endsAt: Date,
  deleted: { type: Boolean, default: false, index: true },
  lastSeenAt: Date
}, { timestamps: true });

schema.index({ guildId: 1, skuId: 1, deleted: 1 });
module.exports = model('DiscordEntitlement', schema);
