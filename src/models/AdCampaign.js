const { Schema, model } = require('mongoose');

const schema = new Schema({
  ownerId: {
    type: String,
    index: true,
    required: true
  },

  title: {
    type: String,
    required: true,
    maxlength: 80
  },

  targetUrl: {
    type: String,
    required: true,
    maxlength: 500
  },

  description: {
    type: String,
    default: '',
    maxlength: 240
  },

  imageUrl: {
    type: String,
    default: '',
    maxlength: 1000
  },

  placement: {
    type: String,
    enum: ['HOME', 'TRENDING', 'VOTE', 'GAME_HUB', 'MARKETPLACE', 'LEADERBOARD', 'PROFILE', 'NEWS_FORUM', 'NETWORK'],
    required: true
  },

  budget: {
    type: Number,
    required: true,
    min: 1
  },

  placementMultiplier: {
    type: Number,
    default: 1,
    min: 0.1
  },

  chargedCToken: {
    type: Number,
    default: 0,
    min: 0
  },

  status: {
    type: String,
    enum: ['ACTIVE', 'ENDED', 'CANCELLED'],
    default: 'ACTIVE',
    index: true
  },

  startsAt: Date,
  endsAt: Date,

  impressions: {
    type: Number,
    default: 0,
    min: 0
  },

  clicks: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = model('AdCampaign', schema);
