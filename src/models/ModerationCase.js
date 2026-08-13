const mongoose = require("mongoose");

const moderationCaseSchema =
  new mongoose.Schema(
    {
      // =====================================
      // GUILD
      // =====================================
      guildId: {
        type: String,
        required: true,
        index: true
      },

      // =====================================
      // CASE ID
      // =====================================
      caseId: {
        type: Number,
        required: true
      },

      // =====================================
      // TARGET USER
      // =====================================
      targetUserId: {
        type: String,
        required: true,
        index: true
      },

      // =====================================
      // MODERATOR
      // =====================================
      moderatorUserId: {
        type: String,
        required: true
      },

      // =====================================
      // ACTION TYPE
      // =====================================
      type: {
        type: String,
        required: true,

        enum: [
          "WARN",
          "TIMEOUT",
          "UNMUTE",
          "KICK",
          "BAN",
          "UNBAN"
        ]
      },

      // =====================================
      // REASON
      // =====================================
      reason: {
        type: String,
        default:
          "Không có lý do."
      },

      // =====================================
      // DURATION
      //
      // TIMEOUT / MUTE lưu milliseconds
      // Các hành động khác = null
      // =====================================
      duration: {
        type: Number,
        default: null
      },

      // =====================================
      // ACTIVE
      // =====================================
      active: {
        type: Boolean,
        default: true
      }
    },
    {
      timestamps: true
    }
  );

// =====================================
// UNIQUE CASE ID PER GUILD
// =====================================

moderationCaseSchema.index(
  {
    guildId: 1,
    caseId: 1
  },
  {
    unique: true
  }
);

// =====================================
// USER HISTORY INDEX
// =====================================

moderationCaseSchema.index({
  guildId: 1,
  targetUserId: 1,
  createdAt: -1
});

// =====================================
// EXPORT
// =====================================

module.exports =
  mongoose.model(
    "ModerationCase",
    moderationCaseSchema
  );