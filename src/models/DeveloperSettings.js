const { Schema, model } = require('mongoose');

const schema = new Schema({
  key: { type: String, unique: true, default: 'global' },
  blacklistedGuilds: { type: [String], default: [] },
  blacklistedUsers: { type: [String], default: [] },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'Corgi-Bot is under maintenance.' },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = model('DeveloperSettings', schema);
