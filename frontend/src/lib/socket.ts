import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"], // Optional: helps avoid fallback issues
  withCredentials: true,
  autoConnect:false
});

export default socket;