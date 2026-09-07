const { Schema, model } = require('mongoose');

const schema = new Schema({
  guildId: { type: String, unique: true, index: true, required: true },
  giveaway: { type: Schema.Types.Mixed, default: {} },
  contest: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true, minimize: false });

module.exports = model('EventDraft', schema);
