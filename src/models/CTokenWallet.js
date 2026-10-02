const { Schema, model } = require('mongoose');

const schema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  balance: {
    type: Number,
    default: 0,
    min: 0
  },

  lifetimeGranted: {
    type: Number,
    default: 0,
    min: 0
  },

  lifetimeSpent: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = model('CTokenWallet', schema);
