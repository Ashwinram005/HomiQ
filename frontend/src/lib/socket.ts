import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // Backend server with socket.io

export const socket: Socket = io(SOCKET_URL, {
  autoConnect:false,
  transports: ["websocket"], // Use WebSocket transport only to avoid 404s
});

export default socket;
