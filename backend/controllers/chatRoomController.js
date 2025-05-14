const mongoose = require("mongoose");
const ChatRoom = require("../models/ChatRoom");

const createChatRoom = async (req, res) => {
  try {
    const { user1, user2, roomId } = req.body;

    // Validate input IDs
    if (
      !mongoose.Types.ObjectId.isValid(user1) ||
      !mongoose.Types.ObjectId.isValid(user2) ||
      !mongoose.Types.ObjectId.isValid(roomId)
    ) {
      return res.status(400).json({ message: "Invalid user or room ID(s)" });
    }

    const user1Id = new mongoose.Types.ObjectId(user1);
    const user2Id = new mongoose.Types.ObjectId(user2);
    const roomObjectId = new mongoose.Types.ObjectId(roomId);

    // Check if a chat room already exists for these users and this post
    const existingRoom = await ChatRoom.findOne({
      participants: { $all: [user1Id, user2Id], $size: 2 },
      roomId: roomObjectId, 
    });

    if (existingRoom) {
      return res.status(200).json(existingRoom);
    }

    // Create a new chat room
    const newChatRoom = new ChatRoom({
      participants: [user1Id, user2Id],
      roomId: roomObjectId,
    });

    await newChatRoom.save();
    res.status(201).json(newChatRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating chat room" });
  }
};

const getUserChatRooms = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const chatRooms = await ChatRoom.find({ participants: userId })
      .populate("participants", "email")
      .populate("latestMessage") // Optional: Populate last message if needed
      .sort({ updatedAt: -1 });

    res.status(200).json(chatRooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching chat rooms" });
  }
};

module.exports = {
  createChatRoom,
  getUserChatRooms,
};
