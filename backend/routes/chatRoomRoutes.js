const express = require("express");
const { createChatRoom } = require("../controllers/chatRoomController"); // Import the controller
const router = express.Router();

// POST route to create a new chat room
router.post("/create", createChatRoom);

module.exports = router; 