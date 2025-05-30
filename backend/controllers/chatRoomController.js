const mongoose = require("mongoose");
const ChatRoom = require("../models/ChatRoom");
const Post = require("../models/Post"); // Needed for post data
const User = require("../models/User");

const createChatRoom = async (req, res) => {
  const { userId, otherUserId, roomId } = req.body;

  if (!userId || !otherUserId || !roomId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Check if chat room already exists
    let existingChat = await ChatRoom.findOne({
      participants: { $all: [userId, otherUserId] },
      roomId: roomId,
    });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    // Create new chat room
    const newChatRoom = new ChatRoom({
      participants: [userId, otherUserId],
      roomId: roomId,
    });

    await newChatRoom.save();
    res.status(201).json(newChatRoom);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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
        updatedAt: room.updatedAt,
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

async function getChats(req, res) {
  try {
    const identifier = req.params.userId;
    let user;
    if (identifier.length === 24) {
      user = await User.findById(identifier);
    } else {
      user = await User.findOne({ email: identifier });
    }
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    const chats = await ChatRoom.find({ participants: user._id }) // ✅
      .populate("participants", "email name")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "email" },
      })
      .sort({ updatedAt: -1 });

    const formattedChats = chats.map((chat) => ({
      _id: chat._id,
      participants: chat.participants,
      roomId: chat.roomId || null,
      latestMessage: chat.latestMessage,
      updatedAt: chat.updatedAt,
    }));

    return res.json({ chats: formattedChats, error: false, success: true });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

// GET /api/chatroom/:chatId
const getChatRoomById = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid chatId" });
    }
    const chatRoom = await ChatRoom.findById(chatId)
      .populate("roomId", "title email postedBy")
      .populate("participants", "email");

    if (!chatRoom) {
      return res
        .status(404)
        .json({ success: false, message: "ChatRoom not found" });
    }
    res.json({ success: true, data: chatRoom });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createChatRoom,
  getUserChatRooms,
  getOwnerChatRooms,
  getChats,
  getChatRoomById,
};
