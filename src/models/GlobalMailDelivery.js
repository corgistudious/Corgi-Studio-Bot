const { Schema, model } = require('mongoose');

const schema = new Schema({
  mailId: { type: Schema.Types.ObjectId, ref: 'GlobalMail', required: true, index: true },
  guildId: { type: String, required: true, index: true },
  channelId: String,
  messageId: String,
  status: { type: String, enum: ['SENT', 'FAILED', 'SKIPPED'], required: true },
  error: { type: String, default: '', maxlength: 500 }
}, { timestamps: true, minimize: false });

schema.index({ mailId: 1, guildId: 1 }, { unique: true });
module.exports = model('GlobalMailDelivery', schema);
