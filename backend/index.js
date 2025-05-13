// server.js
const express = require("express");
const http = require("http");
const connectDB = require("./db"); // Import the database connection
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes"); // Importing the user routes
const postRoutes = require("./routes/postRoutes");
const chatRoomRoutes = require("./routes/chatRoomRoutes");
const messageRoutes = require("./routes/messageRoutes");

const cors = require("cors");
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000", // Or replace with your frontend URL
    methods: ["GET", "POST"],
  },
});

app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());

// Connect to MongoDB
connectDB();

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chatroom", chatRoomRoutes);
app.use("/api/messages", messageRoutes);

io.on("connection", (socket) => {
  console.log("A user connected");

  // Listen for a message event from the client
  socket.on("sendMessage", (messageData) => {
    console.log("Message received:", messageData);

    // Broadcast the message to all connected users
    io.emit("receiveMessage", messageData);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
