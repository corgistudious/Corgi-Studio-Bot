const mongoose = require("mongoose");

const contestVoteSchema =
  new mongoose.Schema(
    {
      guildId: {
        type: String,
        required: true,
        index: true
      },

      contestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contest",
        required: true,
        index: true
      },

      submissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ContestSubmission",
        required: true,
        index: true
      },

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

// Một user không được vote cùng một bài 2 lần
contestVoteSchema.index(
  {
    contestId: 1,
    submissionId: 1,
    userId: 1
  },
  {
    unique: true
  }
);

// Dùng khi đếm tổng số vote của user
contestVoteSchema.index({
  contestId: 1,
  userId: 1
});

module.exports =
  mongoose.model(
    "ContestVote",
    contestVoteSchema
  );