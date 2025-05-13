// server.js
const express = require("express");
const http = require("http"); // To use with socket.io
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
    origin: "http://localhost:3000", // Or replace this with your frontend URL
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

  // Listen for incoming messages
  socket.on("sendMessage", (data) => {
    console.log("Message received: ", data);

    // You can broadcast this message to others or save it in DB, etc.
    // Broadcast the message to the other users in the chat room
    socket.broadcast.emit("newMessage", data);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  3;
});
