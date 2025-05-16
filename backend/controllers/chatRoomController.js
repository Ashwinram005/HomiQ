const mongoose = require("mongoose");
const ChatRoom = require("../models/ChatRoom");
const Post = require("../models/Post"); // Needed for post data

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
      console.log(chatRoom, "chatRoom");
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
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // Step 1: Find chat rooms where user is a participant
    const chatRooms = await ChatRoom.find({
      participants: userId,
    })
      .populate({
        path: "roomId",
        select: "title postedBy",
      })
      .populate("participants", "email")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    // Step 2: Filter out chat rooms where user is the post owner
    const filteredRooms = chatRooms.filter((room) => {
      return room.roomId?.postedBy?.toString() !== userId;
    });

    if (filteredRooms.length === 0) {
      return res.status(404).json({ message: "No relevant chat rooms found" });
    }

    // Step 3: Format the response
    const result = filteredRooms.map((room) => {
      const otherUser = room.participants.find(
        (p) => p._id.toString() !== userId
      );

      return {
        _id: room._id,
        roomId: room.roomId?._id,
        postTitle: room.roomId?.title || "Untitled Post",
        postOwner: room.roomId?.postedBy,

        otherUserEmail: otherUser?.email || "Unknown",
        otherUserId: otherUser?._id, // <== Add this
        latestMessage: room.latestMessage || null,
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching chat rooms:", err);
    res.status(500).json({ message: "Error fetching chat rooms" });
  }
};

const getOwnerChatRooms = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // Step 1: Get all chat rooms where the user is a participant
    const chatRooms = await ChatRoom.find({
      participants: userId,
    })
      .populate({
        path: "roomId",
        select: "title postedBy",
      })
      .populate("participants", "email")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    // Step 2: Filter only chat rooms where the current user is the post owner
    const filteredRooms = chatRooms.filter((room) => {
      return room.roomId?.postedBy?.toString() === userId;
    });

    if (filteredRooms.length === 0) {
      return res.status(404).json({ message: "No owner chat rooms found" });
    }

    // Step 3: Format the response
    const result = filteredRooms.map((room) => {
      const otherUser = room.participants.find(
        (p) => p._id.toString() !== userId
      );

      return {
        _id: room._id, // Chat room ID
        roomId: room.roomId?._id, // Post ID
        postTitle: room.roomId?.title || "", // Title of the post
        postOwner: room.roomId?.postedBy, // Owner ID (should match userId)
        otherUserEmail: otherUser?.email || "Unknown",
        otherUserId: otherUser?._id, // <== Add this
        // The person who contacted the post
        latestMessage: room.latestMessage || null, // Last message in the chat
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching owner chat rooms:", err);
    res.status(500).json({ message: "Error fetching owner chat rooms" });
  }
};

module.exports = {
  createChatRoom,
  getUserChatRooms,
  getOwnerChatRooms,
};
