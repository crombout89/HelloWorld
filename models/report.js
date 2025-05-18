const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  contentType: { type: String, required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.Report || mongoose.model("Report", reportSchema);
