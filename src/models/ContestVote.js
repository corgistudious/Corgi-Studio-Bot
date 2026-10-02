const { Schema, model } = require('mongoose');

const schema = new Schema({
  guildId: { type: String, index: true, required: true },
  contestId: { type: String, index: true, required: true },
  submissionId: { type: Schema.Types.ObjectId, ref: 'ContestSubmission', index: true, required: true },
  userId: { type: String, index: true, required: true }
}, { timestamps: true });

schema.index({ contestId: 1, submissionId: 1, userId: 1 }, { unique: true });
schema.index({ contestId: 1, userId: 1 });
module.exports = model('ContestVote', schema);
