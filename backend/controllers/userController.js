const User = require("../models/User"); // Import User model
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // Import JWT for token generation

const registerUser = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({ email, password });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
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
      token, // Sending back the JWT token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerUser, loginUser };
