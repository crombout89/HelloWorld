// models/community.js
const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
  coverImage: String,
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Community', communitySchema);