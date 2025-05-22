const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  createPost,
  getMyPosts,
  getOtherUsersPosts,
  getRoom,
  getRoomsByUser,
  updatePost,
} = require("../controllers/postController");

// Route to create a post (protected)
router.post("/", verifyToken, createPost);
router.get("/myPosts", verifyToken, getMyPosts);
router.get("/others", verifyToken, getOtherUsersPosts);
router.get("/:id", getRoom);
router.get("/user/:id", getRoomsByUser);
router.put("/:postId",updatePost);
module.exports = router;
