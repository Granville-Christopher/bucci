const mongoose = require("mongoose");

const AdminMessageSchema = new mongoose.Schema({
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  unread: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("AdminMessage", AdminMessageSchema);
