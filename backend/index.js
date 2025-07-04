const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./db");

const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const chatRoomRoutes = require("./routes/chatRoomRoutes");
const messageRoutes = require("./routes/messageRoutes");
const cloudinaryRoutes = require("./routes/cloudinaryRoutes");
const User = require("./models/User");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "https://homi-q.vercel.app",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/cloudinary", cloudinaryRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chatroom", chatRoomRoutes);
app.use("/api/messages", messageRoutes);

io.on("connection", (socket) => {
  //console.log(`🟢 Socket connected: ${socket.id}`);
  socket.on("joinRoom", (chatId) => {
    socket.join(chatId);
    console.log("joinRoom", chatId);
  });

  socket.on("sendMessage", async ({ chatId, message, sender }) => {
    const user = await User.findById(sender).select("email");
    const senderEmail = user?.email || "Unknown";
    const msg = {
      content: message, // ✅ message is just a string now
      sender,
      senderName: message.senderName,
      timestamp: new Date().toISOString(),
      chatRoom: chatId,
    };

    // Send message to current chat room
    socket.to(chatId).emit("receiveMessage", msg);
    io.to(chatId).emit("updateMessage", msg);
    // Broadcast ChatList update to sender & receiver (not chat-specific)
  });

  socket.on("leaveRoom", (chatId) => {
    console.log(`User ${socket.id} left chat room ${chatId}`);
    socket.leave(chatId);
  });
  socket.on("disconnect", () => {
    //console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
