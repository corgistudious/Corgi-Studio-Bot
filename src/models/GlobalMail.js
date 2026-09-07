const { Schema, model } = require('mongoose');

const schema = new Schema({
  createdBy: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  body: { type: String, required: true, trim: true, maxlength: 3500 },
  titleEn: { type: String, default: '', trim: true, maxlength: 200 },
  bodyEn: { type: String, default: '', trim: true, maxlength: 3500 },
  titleVi: { type: String, default: '', trim: true, maxlength: 200 },
  bodyVi: { type: String, default: '', trim: true, maxlength: 3500 },
  imageUrl: { type: String, default: '', trim: true, maxlength: 1000 },
  cstarAmount: { type: Number, default: 0, min: 0, max: 1000000000000 },
  expiresAt: Date,
  status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'CANCELLED'], default: 'DRAFT', index: true },
  publishedAt: Date,
  publishedBy: String,
  deliverySummary: {
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 }
  }
}, { timestamps: true, minimize: false });

module.exports = model('GlobalMail', schema);
