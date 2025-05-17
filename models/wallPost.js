const mongoose = require("mongoose");

const wallPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: { type: String, required: true, trim: true },
  reactions: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      type: {
        type: String,
        enum: ["like", "love", "laugh", "wow", "sad", "dislike"],
      },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WallPost", wallPostSchema);
