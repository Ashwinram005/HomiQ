// routes/chatroomRoutes.js
const express = require("express");
const router = express.Router();
const {
  createChatRoom,
  getUserChatRooms,
  getOwnerChatRooms,
} = require("../controllers/chatRoomController"); // Import the controller

// POST route to create a new chat room
router.post("/create", createChatRoom);
router.get("/userchatroom/:userId", getUserChatRooms);
router.get("/ownerchatroom/:userId", getOwnerChatRooms);

module.exports = router;
