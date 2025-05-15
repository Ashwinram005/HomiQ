import { useState, useEffect, useRef } from "react";
import socket from "@/lib/socket";
import {
  createRoute,
  redirect,
  RootRoute,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { getUserIdFromToken } from "@/lib/getUserIdFromToken";
import { isAuthenticated } from "@/lib/auth";

export const Chat = () => {
  const { roomid } = useParams({ from: "/chat/$roomid" });
  const userId = getUserIdFromToken();
  const { otherUserId } = useSearch({ from: "/chat/$roomid" });
  console.log("UserId", userId);
  console.log("OtherUserId", otherUserId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRoomId, setChatRoomId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const fetchChatRoomAndMessages = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      try {
        const res = await fetch("http://localhost:5000/api/chatroom/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, otherUserId, roomid }),
        });

        const roomData = await res.json();
        console.log("roomData:", roomData);
        setChatRoomId(roomData._id); // ✅ Add this line!
        const msgRes = await fetch(
          `http://localhost:5000/api/messages/${roomData._id}`
        );
        const msgData = await msgRes.json();
        console.log("msgData:", msgData);
        setMessages(
          (msgData.messages || []).map((msg) => ({
            text: msg.content,
            sender: msg.sender._id === userId ? "me" : "other",
          }))
        );
      } catch (error) {
        console.error("Error fetching chat room or messages:", error);
      }
    };
    fetchChatRoomAndMessages();
    socket.emit("joinRoom", roomid);
    return () => {
      socket.off("receiveMessage");
      socket.disconnect();
    };
  }, [roomid, userId]);

  useEffect(() => {
    const handleReceiveMessage = (message) => {
      setMessages((prev) => [
        ...prev,
        {
          text: message.content,
          sender:
            message.sender && message.sender._id === userId ? "me" : "other", // ✅ Fix here
        },
      ]);
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [userId]); // add userId as dependency

  useEffect(() => {
    // Scroll to the bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    const message = { text: newMessage, sender: "me" };

    setMessages((prev) => [...prev, message]);
    setLoading(false); // ✅ Add this here

    socket.emit("sendMessage", {
      roomId: roomid,
      message: {
        content: newMessage,
        senderId: userId,
      },
    });

    try {
      console.log("ChatroomId", chatRoomId);
      const response = await fetch("http://localhost:5000/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatRoomId: chatRoomId,
          senderId: userId,
          content: newMessage,
        }),
      });

      if (!response.ok) {
        setError("Failed to save message.");
      }
    } catch (err) {
      setError("Error sending message.");
    }

    setNewMessage(""); // Clear the input field
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 shadow-md flex justify-between items-center">
        <h2 className="text-xl font-bold">Chat Room</h2>
        <span className="text-sm opacity-80">Online</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-100 space-y-3">
        {error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          messages.map((msg, index) => (
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
          ))
        )}
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
