const { Schema, model } = require('mongoose');

const schema = new Schema({
  mailId: { type: Schema.Types.ObjectId, ref: 'GlobalMail', required: true, index: true },
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  claimedAt: { type: Date, default: Date.now }
}, { timestamps: true });

schema.index({ mailId: 1, userId: 1 }, { unique: true });
module.exports = model('GlobalMailClaim', schema);
