const { Schema, model } = require('mongoose');

const schema = new Schema({
  key: { type: String, unique: true, index: true, required: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  emoji: { type: String, default: '🏷️', trim: true, maxlength: 80 },
  description: { type: String, default: '', trim: true, maxlength: 300 },
  durationDays: { type: Number, default: 0, min: 0, max: 36500 },
  enabled: { type: Boolean, default: true, index: true },
  createdBy: { type: String, required: true },
  updatedBy: { type: String, default: '' }
}, { timestamps: true, minimize: false });

module.exports = model('CustomTitle', schema);
