// routes/chatroomRoutes.js
const express = require("express");
const router = express.Router();
const {
  createChatRoom,
  getUserChatRooms,
  getOwnerChatRooms,
  getChats,
} = require("../controllers/chatRoomController"); // Import the controller

// POST route to create a new chat room
router.post("/create", createChatRoom);
router.get("/userchatroom/:userId", getUserChatRooms);
router.get("/ownerchatroom/:userId", getOwnerChatRooms);
router.get("/user/:userId", getChats);

module.exports = router;
