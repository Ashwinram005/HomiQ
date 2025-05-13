const mongoose = require("mongoose");
const ChatRoom = require("../models/ChatRoom");

const createChatRoom = async (req, res) => {
  try {
    const { user1, user2 } = req.body;

    // Check if user1 and user2 are valid ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(user1) ||
      !mongoose.Types.ObjectId.isValid(user2)
    ) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }

    // Use 'new' keyword to create ObjectId instances
    const user1Id = new mongoose.Types.ObjectId(user1);
    const user2Id = new mongoose.Types.ObjectId(user2);

    // Create a new chat room with ObjectId participants
    const newChatRoom = new ChatRoom({
      participants: [user1Id, user2Id], // Store ObjectIds in the participants array
    });

    // Save the new chat room to the database
    await newChatRoom.save();

    // Respond with the created chat room
    res.status(201).json(newChatRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating chat room" });
  }
};

const getUserChatRooms = async (req, res) => {
  try {
    const { userId } = req.params;

    const chatRooms = await ChatRoom.find({ participants: userId })
      .populate("participants", "email") // Optional: return user details
      .sort({ updatedAt: -1 }); // Show latest chats first

    res.status(200).json(chatRooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching chat rooms" });
  }
};

module.exports = {
  createChatRoom,
  getUserChatRooms, // 👈 export the new function
};
