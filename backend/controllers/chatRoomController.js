const mongoose = require("mongoose");
const ChatRoom = require("../models/ChatRoom");

const createChatRoom = async (req, res) => {
  const { userId, otherUserId, roomid } = req.body;

  // Validate if userId and otherUserId are provided
  if (!userId || !otherUserId) {
    return res.status(400).json({
      message: "Missing User IDs",
      error: true,
      success: false,
    });
  }

  try {
    // Try to find an existing chat room with the same participants and roomId if provided
    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [userId, otherUserId], $size: 2 },
      ...(roomid ? { roomId: roomid } : {}),
    });
    // If no existing chat room is found, create a new one
    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        participants: [userId, otherUserId],
        roomId: roomid || null,
      });
      console.log(chatRoom , 'chatRoom')
    }

    // Return the found or newly created chat room
    return res.json(chatRoom);
  } catch (error) {
    // Error handling
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

const getUserChatRooms = async (req, res) => {
  try {
    const { userId, roomId } = req.params;

    // Validate userId and roomId
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(roomId)
    ) {
      return res.status(400).json({ message: "Invalid userId or roomId" });
    }

    // Fetch chat rooms for the user and roomId
    const chatRooms = await ChatRoom.find({
      participants: new mongoose.Types.ObjectId(userId),
      roomId: new mongoose.Types.ObjectId(roomId),
    })
      .populate("participants", "email") // Populate with user email
      .populate("latestMessage") // Populate with latest message details
      .sort({ updatedAt: -1 });

    if (!chatRooms || chatRooms.length === 0) {
      return res.status(404).json({ message: "No chat rooms found" });
    }

    res.status(200).json(chatRooms);
  } catch (err) {
    console.error("Error fetching chat rooms:", err);
    res.status(500).json({ message: "Error fetching chat rooms" });
  }
};

module.exports = {
  createChatRoom,
  getUserChatRooms,
};
