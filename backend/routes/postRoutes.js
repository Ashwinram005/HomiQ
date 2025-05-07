const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { createPost } = require("../controllers/postController");

// Route to create a post (protected)
router.post("/", verifyToken, createPost);

module.exports = router;
