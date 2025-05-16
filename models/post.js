const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },
  body: {
    type: String,
    required: true,
    trim: true,
  },
  tags: [String],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  visibility: {
    type: String,
    enum: ["public", "members"],
    default: "members",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Post", postSchema);
