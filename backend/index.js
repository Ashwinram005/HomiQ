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

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
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

    // Notify everyone in the room (except the sender) to refresh chat list
    socket.to(chatId).emit("roomUpdated", { chatId });

    // Optionally: also send it back to the one who joined
    socket.emit("roomUpdated", { chatId });
  });

  socket.on("sendMessage", (data) => {
    const { chatId, message, senderEmail, receiverEmail } = data;

    // Send message to current chat room
    io.to(chatId).emit("receiveMessage", message);

    // Broadcast ChatList update to sender & receiver (not chat-specific)
    io.emit("chatListUpdated", { chatId, senderEmail, receiverEmail });
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
