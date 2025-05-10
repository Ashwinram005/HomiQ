const mongoose = require('mongoose');
const ChatRoom = require('../models/ChatRoom');

const createChatRoom = async (req, res) => {
  try {
    const { user1, user2 } = req.body;

    // Check if user1 and user2 are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(user1) || !mongoose.Types.ObjectId.isValid(user2)) {
      return res.status(400).json({ message: 'Invalid user IDs' });
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
    res.status(500).json({ message: 'Error creating chat room' });
  }
};

module.exports = {
  createChatRoom,
};
