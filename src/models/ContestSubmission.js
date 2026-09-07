const { Schema, model } = require('mongoose');

const schema = new Schema({
  guildId: { type: String, index: true, required: true },
  contestId: { type: String, index: true, required: true },
  userId: { type: String, index: true, required: true },
  entryNo: { type: Number, required: true },
  entryId: { type: String, required: true, index: true },
  caption: { type: String, default: '' },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video', 'file'], default: 'file' },
  fileName: String,
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'DISQUALIFIED'], default: 'PENDING', index: true },
  reviewReason: String,
  reviewedBy: String,
  reviewedAt: Date,
  galleryMessageId: String,
  voteCount: { type: Number, default: 0, min: 0 }
}, { timestamps: true, minimize: false });

schema.index({ contestId: 1, entryNo: 1 }, { unique: true });
schema.index({ contestId: 1, entryId: 1 }, { unique: true });
schema.index({ contestId: 1, userId: 1, createdAt: 1 });
module.exports = model('ContestSubmission', schema);
