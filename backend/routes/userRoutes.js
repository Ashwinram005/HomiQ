const express = require("express");
const { registerUser, loginUser } = require("../controllers/userController");
const verifyToken = require("../middleware/authMiddleware"); // Import token verification middleware
const router = express.Router();

// Controller functions (we'll write them next)

// User registration route
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/validate-token", verifyToken, (req, res) => {
  res.status(200).json({ message: "Token is valid" });
});

module.exports = router;
