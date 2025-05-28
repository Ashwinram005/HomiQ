const User = require("../models/User"); // Import User model
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // Import JWT for token generation
const Otp = require("../models/Otp");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "santhoshkannan525@gmail.com",
    pass: "cwsk vnmz djcw rakg",
  },
});

const registerUser = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ email });
    const existingName = await User.findOne({ name });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    if (existingName) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }
    console.log("hi");
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await Otp.deleteMany({ email });
    await Otp.create({ email, name, otp, expiresAt, password });
    await transporter.sendMail({
      from: "santhoshkannan525@gmail.com",
      to: email,
      subject: "OTP verification",
      text: `Your OTP is ${otp}. It will expire in 5 minutes`,
    });
    return res.json({
      message: "OTP sent successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Login function
const loginUser = async (req, res) => {
  const { email, password } = req.body; // Get email and password from request body

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // If user doesn't exist, send error response
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare the entered password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // If credentials are correct, generate a JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // Token will expire in 1 hour
    });

    // Send the JWT token back in the response
    res.status(200).json({
      message: "Login successful",
      token,
      email, // Sending back the JWT token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

async function getUserByEmail(req, res) {
  const { email } = req.query;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }
    return res.status(200).json({
      data: user,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

const verifyPassword = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ valid: false });

    const isMatch = await bcrypt.compare(password, user.password);
    return res.status(200).json({ valid: isMatch });
  } catch (err) {
    res.status(500).json({ valid: false });
  }
};

async function changePassword(req, res) {
  const { email, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });

    if (newPassword.length < 10) {
      return res
        .status(400)
        .json({ message: "New password must be at least 10 characters" });
    }

    // Assign the plain new password — the middleware will hash it
    user.password = newPassword;

    // Save user - pre('save') middleware will hash the password automatically
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error in changePassword:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function changeName(req, res) {
  const { newName, email } = req.body;

  try {
    const user = await User.findOne({ name: newName });
    if (user) {
      return res.status(400).json({
        message: "Name already exists",
        error: true,
        success: false,
      });
    }

    const updateUser = await User.findOneAndUpdate(
      { email },
      { name: newName }
    );
    if (updateUser)
      return res.status(200).json({
        message: "Name Changed Successfully",
        error: false,
        success: true,
      });
    else
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserByEmail,
  verifyPassword,
  changePassword,
  changeName,
};
