import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  contentType: {
    type: String, // 'post', 'comment', etc.
    required: true,
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "contentType",
  },
  reason: {
    type: String,
    required: true,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Report", reportSchema);
