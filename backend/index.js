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
    origin: "*", // Or replace with your frontend URL
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
  console.log(`🔌 User connected: ${socket.id}`);
  // Join room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`👥 User joined room: ${roomId}`);
  });

  // Listen for new messages
  socket.on("sendMessage", (data) => {
    console.log("📨 Received message:", data);

    const { roomId, message } = data;
    socket.to(roomId).emit("receiveMessage", message); // 👈 This excludes the sender
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
