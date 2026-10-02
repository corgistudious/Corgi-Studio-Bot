const { Schema, model } = require('mongoose');

const schema = new Schema({
  contestId: { type: String, unique: true, sparse: true, index: true },
  guildId: { type: String, index: true, required: true },
  eventChannelId: String,
  galleryChannelId: String,
  resultChannelId: String,
  channelId: String, // legacy compatibility
  messageId: String,
  title: { type: String, required: true },
  description: { type: String, default: '' },
  bannerUrl: String,
  bannerShape: { type: String, enum: ['16:9', '1:1'], default: '16:9' },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMISSION', 'REVIEW', 'VOTING', 'ENDED', 'PUBLISHED', 'CANCELLED', 'open', 'ended'],
    default: 'SUBMISSION',
    index: true
  },
  submissionEndsAt: Date,
  votingEndsAt: Date,
  votingDurationMs: { type: Number, default: 86400000, min: 60000 },
  endsAt: Date, // legacy compatibility
  createdBy: String,
  requiredRoleId: String,
  minAccountAgeDays: { type: Number, default: 0, min: 0 },
  minServerAgeDays: { type: Number, default: 0, min: 0 },
  maxEntriesPerUser: { type: Number, default: 1, min: 1, max: 10 },
  votesPerUser: { type: Number, default: 1, min: 1, max: 20 },
  allowSelfVote: { type: Boolean, default: false },
  reviewRequired: { type: Boolean, default: true },
  hideVoteCount: { type: Boolean, default: false },
  topCount: { type: Number, default: 3, min: 1, max: 10 },
  publishedAt: Date,
  endedAt: Date,
  entries: { type: [String], default: [] }, // legacy compatibility
  winnerId: String // legacy compatibility
}, { timestamps: true, minimize: false });

schema.index({ guildId: 1, createdAt: -1 });
module.exports = model('Contest', schema);
