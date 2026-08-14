const mongoose = require("mongoose");

// =====================================
// CONTEST SCHEMA
// =====================================

const contestSchema =
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
      // BASIC INFORMATION
      // =====================================

      name: {
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

      bannerUrl: {
        type: String,
        default: null
      },

      // Ảnh Event 16:9 hiển thị cuối Embed
      eventImageUrl: {
        type: String,
        default: null
      },

      // =====================================
      // EVENT STATUS
      // =====================================

      status: {
        type: String,

        enum: [
          "DRAFT",
          "SUBMISSION",
          "VOTING",
          "ENDED",
          "PUBLISHED"
        ],

        default: "DRAFT",
        index: true
      },

      // =====================================
      // EVENT TIME
      // =====================================

      submissionStartAt: {
        type: Date,
        default: null
      },

      submissionEndAt: {
        type: Date,
        default: null
      },

      votingStartAt: {
        type: Date,
        default: null
      },

      votingEndAt: {
        type: Date,
        default: null
      },

      endedAt: {
        type: Date,
        default: null
      },

      publishedAt: {
        type: Date,
        default: null
      },

      // =====================================
      // CONTEST CHANNELS
      // =====================================

      submissionChannelId: {
        type: String,
        default: null
      },

      galleryChannelId: {
        type: String,
        default: null
      },

      resultChannelId: {
        type: String,
        default: null
      },

      // =====================================
      // SUBMISSION SETTINGS
      // =====================================

      maxSubmissionsPerUser: {
        type: Number,
        default: 1,
        min: 1,
        max: 20
      },

      requireApproval: {
        type: Boolean,
        default: true
      },

      allowedTypes: {
        type: [String],

        enum: [
          "IMAGE",
          "VIDEO",
          "MAP",
          "LINK"
        ],

        default: [
          "IMAGE",
          "VIDEO",
          "MAP",
          "LINK"
        ]
      },

      // =====================================
      // VOTING SETTINGS
      // =====================================

      maxVotesPerUser: {
        type: Number,
        default: 1,
        min: 1,
        max: 100
      },

      allowVoteRemove: {
        type: Boolean,
        default: true
      },

      showVoteCount: {
        type: Boolean,
        default: true
      },

      // =====================================
      // ANTI FRAUD
      // =====================================

      antiFraud: {
        enabled: {
          type: Boolean,
          default: true
        },

        // Tuổi tài khoản Discord tối thiểu
        // để được phép Vote.
        minAccountAgeDays: {
          type: Number,
          default: 7,
          min: 0,
          max: 3650
        },

        // Thời gian Member phải ở trong Server
        // trước khi được phép Vote.
        minGuildJoinHours: {
          type: Number,
          default: 24,
          min: 0,
          max: 87600
        },

        // Dùng cho Part 3 sau này.
        voteCooldownSeconds: {
          type: Number,
          default: 3,
          min: 0,
          max: 3600
        },

        // Có thể dùng sau để yêu cầu Role.
        requireRoleId: {
          type: String,
          default: null
        },

        // Có thể dùng sau để yêu cầu Level.
        minLevel: {
          type: Number,
          default: 0,
          min: 0
        }
      },

      // =====================================
      // RESULT SETTINGS
      // =====================================

      winnerCount: {
        type: Number,
        default: 3,
        min: 1,
        max: 20
      },

      resultsPublished: {
        type: Boolean,
        default: false
      },

      resultsPublishedAt: {
        type: Date,
        default: null
      },

      // =====================================
      // DISCORD MESSAGE IDS
      // =====================================

      announcementMessageId: {
        type: String,
        default: null
      },

      resultMessageId: {
        type: String,
        default: null
      },

      // =====================================
      // CREATOR
      // =====================================

      createdBy: {
        type: String,
        required: true
      }
    },

    {
      timestamps: true
    }
  );

// =====================================
// INDEXES
// =====================================

contestSchema.index({
  guildId: 1,
  status: 1
});

contestSchema.index({
  guildId: 1,
  createdAt: -1
});

// =====================================
// MODEL
// =====================================

module.exports =
  mongoose.model(
    "Contest",
    contestSchema
  );