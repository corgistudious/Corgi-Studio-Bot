const mongoose = require("mongoose");

// =====================================
// CONTEST VOTE REVIEW
// =====================================
//
// Lưu quyết định thủ công của Admin
// đối với User bị Anti-Fraud đánh dấu.
//
// KHÔNG tự động ban.
// KHÔNG tự động xóa dữ liệu Audit.
// =====================================

const contestVoteReviewSchema =
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

      userId: {
        type: String,
        required: true,
        index: true
      },

      // =====================================
      // REVIEW STATUS
      // =====================================

      status: {
        type: String,

        enum: [
          "PENDING",
          "APPROVED",
          "INVALIDATED"
        ],

        default: "PENDING",
        index: true
      },

      // =====================================
      // FRAUD INFORMATION
      // =====================================

      riskLevel: {
        type: String,

        enum: [
          "NORMAL",
          "LOW",
          "MEDIUM",
          "HIGH"
        ],

        default: "NORMAL"
      },

      riskScore: {
        type: Number,
        default: 0,
        min: 0
      },

      // =====================================
      // ADMIN DECISION
      // =====================================

      reviewedBy: {
        type: String,
        default: null
      },

      reviewedAt: {
        type: Date,
        default: null
      },

      note: {
        type: String,
        default: null,
        maxlength: 500
      },

      // =====================================
      // INVALIDATED VOTES
      // =====================================
      //
      // Khi Admin vô hiệu hóa Vote,
      // lưu số Vote đã bị loại.
      // =====================================

      invalidatedVoteCount: {
        type: Number,
        default: 0,
        min: 0
      }
    },

    {
      timestamps: true
    }
  );

// =====================================
// UNIQUE REVIEW
// =====================================
//
// Mỗi User chỉ có 1 Review
// trong một Contest.
// =====================================

contestVoteReviewSchema.index(
  {
    guildId: 1,
    contestId: 1,
    userId: 1
  },
  {
    unique: true
  }
);

// =====================================
// ADMIN QUERY INDEX
// =====================================

contestVoteReviewSchema.index({
  guildId: 1,
  contestId: 1,
  status: 1,
  riskScore: -1
});

// =====================================
// MODEL
// =====================================

module.exports =
  mongoose.model(
    "ContestVoteReview",
    contestVoteReviewSchema
  );