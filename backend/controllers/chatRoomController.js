// controllers/chatRoomController.js
const ChatRoom = require("../models/ChatRoom");
const User = require("../models/User");

// Controller to create a new chat room
const createChatRoom = async (req, res) => {
  const { userId1, userId2 } = req.body; // Get user IDs from the request body
  
  try {
    // Find both users from the database using their IDs
    const user1 = await User.findById(userId1);
    const user2 = await User.findById(userId2);

    if (!user1 || !user2) {
      return res.status(404).json({ message: "One or both users not found" });
    }

    // Create a new chat room with the two users as participants
    const newChatRoom = new ChatRoom({
      participants: [userId1, userId2]
    });

    await newChatRoom.save(); // Save the chat room in the database

    // Send a success response
    res.status(200).json({ message: "Chat room created successfully", chatRoom: newChatRoom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export the controller function
module.exports = {
  createChatRoom
};
