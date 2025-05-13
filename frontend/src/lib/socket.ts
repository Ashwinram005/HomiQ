import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"], // Use WebSocket for a more reliable connection
  autoConnect: false, // Don't auto-connect right away, we'll connect manually
});

export default socket;
