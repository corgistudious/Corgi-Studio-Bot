const mongoose = require("mongoose");

const contestSubmissionSchema =
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

      userId: {
        type: String,
        required: true,
        index: true
      },

      // =====================================
      // SUBMISSION CONTENT
      // =====================================
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
      },

      description: {
        type: String,
        default: "",
        maxlength: 2000
      },

      contentType: {
        type: String,
        enum: [
          "IMAGE",
          "VIDEO",
          "MAP",
          "LINK"
        ],
        default: "IMAGE"
      },

      contentUrl: {
        type: String,
        required: true
      },

      thumbnailUrl: {
        type: String,
        default: null
      },

      // =====================================
      // APPROVAL
      // =====================================
      status: {
        type: String,
        enum: [
          "PENDING",
          "APPROVED",
          "REJECTED"
        ],
        default: "PENDING",
        index: true
      },

      approvedBy: {
        type: String,
        default: null
      },

      approvedAt: {
        type: Date,
        default: null
      },

      rejectedBy: {
        type: String,
        default: null
      },

      rejectedAt: {
        type: Date,
        default: null
      },

      rejectReason: {
        type: String,
        default: null,
        maxlength: 1000
      },

      // =====================================
      // VOTE CACHE
      // =====================================
      voteCount: {
        type: Number,
        default: 0,
        min: 0
      },

      // =====================================
      // DISCORD GALLERY MESSAGE
      // =====================================
      galleryChannelId: {
        type: String,
        default: null
      },

      galleryMessageId: {
        type: String,
        default: null
      }
    },
    {
      timestamps: true
    }
  );

contestSubmissionSchema.index({
  contestId: 1,
  userId: 1
});

contestSubmissionSchema.index({
  contestId: 1,
  voteCount: -1
});

module.exports =
  mongoose.model(
    "ContestSubmission",
    contestSubmissionSchema
  );