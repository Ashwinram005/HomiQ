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

const getMessagesForChatRoom = async (req, res) => {
  try {
    const { chatRoomId } = req.params;

    // Find all messages in the chat room
    const messages = await Message.find({ chatRoom: chatRoomId }).populate(
      "sender",
      "email"
    ); // This will populate the sender field with the name and email of the user

    if (!messages.length) {
      return res.status(404).json({ message: "No messages found" });
    }

    res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { sendMessage, getMessagesForChatRoom };
