import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Replace with your backend if deployed

export default socket;

