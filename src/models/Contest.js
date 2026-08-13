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

      // Channel đăng thông báo Event
      // và nút gửi bài
      submissionChannelId: {
        type: String,
        default: null
      },

      // Channel đăng các bài
      // đã được Admin APPROVED
      galleryChannelId: {
        type: String,
        default: null
      },

      // Channel công bố
      // kết quả cuối cùng
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

      // Tổng số lượt Vote
      // một thành viên được dùng
      // trong toàn Event.
      maxVotesPerUser: {
        type: Number,
        default: 1,
        min: 1,
        max: 100
      },

      // Cho phép thành viên
      // bấm lại để bỏ Vote.
      allowVoteRemove: {
        type: Boolean,
        default: true
      },

      // Hiển thị Vote công khai
      // trên Gallery.
      showVoteCount: {
        type: Boolean,
        default: true
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

      // Giữ field này để tương thích
      // với các bản Contest cũ.
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

      // Tin nhắn thông báo Event
      announcementMessageId: {
        type: String,
        default: null
      },

      // Tin nhắn công bố kết quả
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

// Tìm Contest theo Server + Status
contestSchema.index({
  guildId: 1,
  status: 1
});

// Tìm Event mới nhất
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