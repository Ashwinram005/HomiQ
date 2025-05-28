const express = require("express");
const {
  registerUser,
  loginUser,
  getUserByEmail,
  verifyPassword,
  changePassword,
  changeName,
} = require("../controllers/userController");
const verifyToken = require("../middleware/authMiddleware"); // Import token verification middleware
const { verifyOtp } = require("../controllers/otpController");
const router = express.Router();

// Controller functions (we'll write them next)

// User registration route
router.post("/register", registerUser);
router.post("/verify-otp",verifyOtp);
router.post("/login", loginUser);
router.get("/by-email", getUserByEmail);
router.post("/verify-password", verifyPassword);
router.post("/change-password", changePassword);
router.put("/update-name", changeName);
router.get("/validate-token", verifyToken, (req, res) => {
  res.status(200).json({ message: "Token is valid" });
});

module.exports = router;
