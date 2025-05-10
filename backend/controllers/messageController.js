const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");

const sendMessage = async (req, res) => {
  try {
    const { chatRoomId, senderId, content } = req.body;

    // Validate chat room
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom)
      return res.status(404).json({ message: "Chat room not found" });

    // Create and save message
    const message = new Message({
      chatRoom: chatRoomId,
      sender: senderId,
      content,
    });

    const savedMessage = await message.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { sendMessage };
