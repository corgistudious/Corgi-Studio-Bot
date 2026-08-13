const mongoose = require("mongoose");

const developerAuditLogSchema =
  new mongoose.Schema(
    {
      developerId: {
        type: String,
        required: true,
        index: true
      },

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

      action: {
        type: String,
        required: true,

        enum: [
          "XP_ADD",
          "XP_REMOVE",
          "XP_SET",
          "LEVEL_ADD",
          "LEVEL_REMOVE",
          "LEVEL_SET",
          "RESET"
        ]
      },

      amount: {
        type: Number,
        default: null
      },

      before: {
        level: {
          type: Number,
          default: 0
        },

        xp: {
          type: Number,
          default: 0
        }
      },

      after: {
        level: {
          type: Number,
          default: 0
        },

        xp: {
          type: Number,
          default: 0
        }
      }
    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    "DeveloperAuditLog",
    developerAuditLogSchema
  );