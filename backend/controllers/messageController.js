const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");

const sendMessage = async (req, res) => {
  try {
    const { chatRoomId, senderId, content } = req.body;

    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom)
      return res
        .status(404)
        .json({ success: false, message: "Chat room not found" });

    const message = new Message({
      chatRoom: chatRoomId,
      sender: senderId,
      content,
    });

    const savedMessage = await message.save();
    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      latestMessage: savedMessage._id,
    });

    const populatedMessage = await savedMessage.populate("sender", "email");

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getMessagesForChatRoom = async (req, res) => {
  try {
    const { chatRoomId } = req.params;

    const messages = await Message.find({ chatRoom: chatRoomId })
      .populate("sender", "email")
      .sort({ timestamp: 1 });

    res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { sendMessage, getMessagesForChatRoom };
