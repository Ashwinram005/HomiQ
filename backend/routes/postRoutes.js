const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { createPost, getMyPosts } = require("../controllers/postController");

// Route to create a post (protected)
router.post("/", verifyToken, createPost);
router.get("/myPosts", verifyToken, getMyPosts);

module.exports = router;
