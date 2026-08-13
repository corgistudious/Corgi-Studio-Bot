const mongoose = require("mongoose");

const levelSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      index: true
    },

    userId: {
      type: String,
      required: true,
      index: true
    },

    xp: {
      type: Number,
      default: 0
    },

    level: {
      type: Number,
      default: 0
    },

    totalMessages: {
      type: Number,
      default: 0
    },

    lastXpAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

levelSchema.index(
  {
    guildId: 1,
    userId: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model(
  "Level",
  levelSchema
);