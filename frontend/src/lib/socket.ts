import { io } from "socket.io-client";

const socket = io("https://homiq.onrender.com", {
  autoConnect: false,
  transports: ["websocket"],
});

export default socket;
