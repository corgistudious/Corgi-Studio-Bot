const { Schema, model } = require('mongoose');

const schema = new Schema({
  userId: { type: String, unique: true, index: true, required: true },
  bio: { type: String, default: '', maxlength: 180 },
  likes: { type: [String], default: [] },
  followers: { type: [String], default: [] },
  following: { type: [String], default: [] },
  stars: { type: [String], default: [] },
  cosmetics: { type: [String], default: [] },
  profileViews: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, minimize: false });

module.exports = model('SocialProfile', schema);
