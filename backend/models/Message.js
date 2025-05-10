const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRoom", // Links this message to a specific chat room
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // The user who sent the message
    required: true,
  },
  content: {
    type: String, // The actual text of the message
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now, // When the message was sent
  },
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
