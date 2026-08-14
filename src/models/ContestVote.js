const mongoose = require("mongoose");

// =====================================
// CONTEST VOTE SCHEMA
// =====================================

const contestVoteSchema =
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
      // CONTEST
      // =====================================

      contestId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "Contest",

        required:
          true,

        index:
          true
      },

      // =====================================
      // SUBMISSION
      // =====================================

      submissionId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "ContestSubmission",

        required:
          true,

        index:
          true
      },

      // =====================================
      // USER
      // =====================================

      userId: {
        type: String,
        required: true,
        index: true
      }
    },

    {
      timestamps: true
    }
  );

// =====================================
// UNIQUE VOTE
// =====================================
//
// Một User chỉ có tối đa 1 Vote
// cho cùng 1 Submission
// trong cùng 1 Contest
// của cùng 1 Guild.
//
// Đây là lớp chống double-vote
// trực tiếp ở MongoDB.
//
// Dù User spam button đồng thời,
// MongoDB vẫn chỉ cho tồn tại 1 record.
// =====================================

contestVoteSchema.index(
  {
    guildId: 1,
    contestId: 1,
    submissionId: 1,
    userId: 1
  },

  {
    unique: true,
    name:
      "uniq_contest_submission_user_vote"
  }
);

// =====================================
// USER VOTE COUNT PER EVENT
// =====================================
//
// Dùng để kiểm tra:
// maxVotesPerUser
// =====================================

contestVoteSchema.index(
  {
    guildId: 1,
    contestId: 1,
    userId: 1
  },

  {
    name:
      "contest_user_vote_lookup"
  }
);

// =====================================
// COUNT SUBMISSION VOTES
// =====================================

contestVoteSchema.index(
  {
    guildId: 1,
    contestId: 1,
    submissionId: 1
  },

  {
    name:
      "submission_vote_count_lookup"
  }
);

// =====================================
// CONTEST AUDIT LOOKUP
// =====================================

contestVoteSchema.index(
  {
    guildId: 1,
    contestId: 1,
    createdAt: -1
  },

  {
    name:
      "contest_vote_audit_lookup"
  }
);

// =====================================
// MODEL
// =====================================

module.exports =
  mongoose.model(
    "ContestVote",
    contestVoteSchema
  );