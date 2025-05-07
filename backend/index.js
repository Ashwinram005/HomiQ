// server.js
const express = require("express");
const connectDB = require("./db"); // Import the database connection
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes"); // Importing the user routes
const postRoutes = require("./routes/postRoutes");
const cors = require("cors");
dotenv.config();

const app = express();
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());

// Connect to MongoDB
connectDB();
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  3;
});
