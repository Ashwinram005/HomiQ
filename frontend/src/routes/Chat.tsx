import { useState, useEffect, useRef } from "react";
import socket from "@/lib/socket";
import {
  createRoute,
  redirect,
  RootRoute,
  useParams,
} from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { getUserIdFromToken } from "@/lib/getUserIdFromToken";

export const Chat = () => {
  const { roomid } = useParams({ from: "/chat/$roomid" });
  const userId = getUserIdFromToken();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRoomId, setChatRoomId] = useState(null); // State to store fetched chat room ID

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchChatRoom = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/chatroom/${userId}/${roomid}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          return; // or throw an error if needed
        }

        const data = await response.json();
        console.log("Chat room data:", data[0]._id);
      } catch (err) {
        console.error("Error fetching chat room:", err);
      }
    };

    fetchChatRoom();
    // Check if socket is already connected, if not, connect it
    if (!socket.connected) {
      socket.connect();
    }

    // Join the chat room when the component mounts
    socket.emit("joinRoom", roomid);
    console.log("User joined room:", roomid);

    // Listen for messages from the server
    const handleReceiveMessage = (message) => {
      console.log("Received message:", message);
      setMessages((prev) => [...prev, { ...message, sender: "other" }]); // Add message from other user
    };

    socket.on("receiveMessage", handleReceiveMessage);

    // Cleanup: Remove the event listener when component unmounts
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [roomid, userId]);

  useEffect(() => {
    // Scroll to the bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim() === "") return;

    const message = {
      text: newMessage,
      sender: "me", // Mark the sender as "me"
    };

    console.log("Sending message:", message);

    setMessages((prev) => [...prev, message]); // Add the message to state only for the sender

    socket.emit("sendMessage", {
      roomId: roomid,
      message,
    });

    setNewMessage(""); // Clear the input field
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 shadow-md flex justify-between items-center">
        <h2 className="text-xl font-bold">Chat Room</h2>
        <span className="text-sm opacity-80">Online</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-100 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === "me" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-xl px-4 py-3 max-w-[70%] text-sm shadow ${
                msg.sender === "me"
                  ? "bg-blue-600 text-white rounded-br-none ml-auto"
                  : "bg-white text-gray-800 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 bg-white flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 transition-all duration-200"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/chat/$roomid",
    component: Chat,
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) {
        return redirect({ to: "/" });
      }
    },
  });
