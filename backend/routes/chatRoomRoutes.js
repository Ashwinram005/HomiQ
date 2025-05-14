// routes/chatroomRoutes.js
const express = require("express");
const router = express.Router();
const {
  createChatRoom,
  getUserChatRooms,
} = require("../controllers/chatRoomController"); // Import the controller

// POST route to create a new chat room
router.post("/create", createChatRoom);
router.get("/:userId/:roomid", getUserChatRooms); 

module.exports = router;
