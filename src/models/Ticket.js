const mongoose =
  require("mongoose");

const ticketSchema =
  new mongoose.Schema(
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

      channelId: {
        type: String,
        required: true,
        unique: true
      },

      status: {
        type: String,
        enum: [
          "open",
          "closed"
        ],
        default: "open"
      },

      claimedBy: {
        type: String,
        default: null
      },

      claimedAt: {
        type: Date,
        default: null
      },

      openedAt: {
        type: Date,
        default: Date.now
      },

      closedAt: {
        type: Date,
        default: null
      },

      closedBy: {
        type: String,
        default: null
      }
    },
    {
      timestamps: true
    }
  );

ticketSchema.index({
  guildId: 1,
  userId: 1,
  status: 1
});

module.exports =
  mongoose.model(
    "Ticket",
    ticketSchema
  );