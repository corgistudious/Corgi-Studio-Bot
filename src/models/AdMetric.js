const { Schema, model } = require('mongoose');

const schema = new Schema({
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'AdCampaign',
    required: true,
    index: true
  },

  placement: {
    type: String,
    enum: [
      'HOME',
      'TRENDING',
      'VOTE',
      'GAME_HUB',
      'MARKETPLACE',
      'LEADERBOARD',
      'PROFILE',
      'NEWS_FORUM',
      'NETWORK'
    ],
    required: true,
    index: true
  },

  day: {
    type: String,
    required: true,
    index: true
  },

  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23
  },

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

schema.index(
  { campaignId: 1, placement: 1, day: 1, hour: 1 },
  { unique: true }
);

module.exports = model('AdMetric', schema);
