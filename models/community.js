// models/community.js
const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  coverImage: String,
  category: {
    type: String,
    enum: ["Tech", "Social", "Gaming", "Local", "Other"],
    default: "Other",
  },
  tags: [String],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Community', communitySchema);