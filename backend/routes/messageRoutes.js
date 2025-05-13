const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getMessagesForChatRoom,
} = require("../controllers/messageController");

router.post("/send", sendMessage);
router.get("/:chatRoomId", getMessagesForChatRoom);
module.exports = router;
