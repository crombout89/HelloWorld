const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,

  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
  coverImage: String,

  host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
    default: null,
  },

  location: {
    name: String,
    address: String,
    lat: Number,
    lon: Number,
  },

  startTime: Date,
  endTime: Date,

  visibility: {
    type: String,
    enum: ["public", "friends", "invite"],
    default: "public",
  },

  invitees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  rsvp: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: { type: String, enum: ["going", "interested", "declined"] },
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Event", eventSchema);
