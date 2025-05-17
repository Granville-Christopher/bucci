const mongoose = require('mongoose');

// Define the Message Schema
const textSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
    unique: false,
  },
  unread: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});


// Create and export the Message model
const Text = mongoose.model('Text', textSchema);
module.exports = Text;