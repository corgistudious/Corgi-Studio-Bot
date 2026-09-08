const { Schema, model } = require('mongoose');

const schema = new Schema({
  userId: { type: String, unique: true, index: true, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'REVIEW', 'APPROVED', 'REJECTED', 'REVOKED'],
    default: 'PENDING',
    index: true,
  },
  badgeType: {
    type: String,
    enum: ['', 'BLUE', 'RED', 'YELLOW', 'PURPLE'],
    default: '',
  },
  note: { type: String, default: '', maxlength: 1000 },
  requestedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: { type: String, default: '' },
}, { timestamps: true, minimize: false });

module.exports = model('ProfileVerification', schema);
