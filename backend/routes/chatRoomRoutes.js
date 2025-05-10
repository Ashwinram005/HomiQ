// routes/chatroomRoutes.js
const express = require("express");
const router = express.Router();
const { createChatRoom } = require("../controllers/chatRoomController"); // Import the controller

// POST route to create a new chat room
router.post("/create", createChatRoom);

module.exports = router;
