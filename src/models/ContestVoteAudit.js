const mongoose = require("mongoose");

// =====================================
// CONTEST VOTE AUDIT SCHEMA
// =====================================

const contestVoteAuditSchema =
  new mongoose.Schema(
    {
      guildId: {
        type: String,
        required: true,
        index: true
      },

      contestId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Contest",
        required: true,
        index: true
      },

      submissionId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "ContestSubmission",
        default: null,
        index: true
      },

      userId: {
        type: String,
        required: true,
        index: true
      },

      // =====================================
      // ACTION
      // =====================================

      action: {
        type: String,

        enum: [
          "VOTE_ADDED",
          "VOTE_REMOVED",
          "BLOCKED_ACCOUNT_AGE",
          "BLOCKED_JOIN_AGE",
          "BLOCKED_COOLDOWN",
          "BLOCKED_MAX_VOTES",
          "BLOCKED_DUPLICATE"
        ],

        required: true,
        index: true
      },

      // =====================================
      // SHORT REASON
      // =====================================

      reason: {
        type: String,
        default: null,
        maxlength: 200
      }
    },

    {
      timestamps: true
    }
  );

// =====================================
// INDEXES
// =====================================

// Admin xem lịch sử một Contest
contestVoteAuditSchema.index({
  guildId: 1,
  contestId: 1,
  createdAt: -1
});

// Kiểm tra hành vi của một User
contestVoteAuditSchema.index({
  guildId: 1,
  contestId: 1,
  userId: 1,
  createdAt: -1
});

// Part 5 dùng để tìm các hành động bị chặn
contestVoteAuditSchema.index({
  guildId: 1,
  contestId: 1,
  action: 1,
  createdAt: -1
});

// =====================================
// MODEL
// =====================================

module.exports =
  mongoose.model(
    "ContestVoteAudit",
    contestVoteAuditSchema
  );