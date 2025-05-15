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

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRoomId, setChatRoomId] = useState(null);
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, otherUserId, roomid }),
        });

        const roomData = await res.json();
        setChatRoomId(roomData._id);

        const msgRes = await fetch(
          `http://localhost:5000/api/messages/${roomData._id}`
        );
        const msgData = await msgRes.json();

        setMessages(
          (msgData.messages || []).map((msg) => ({
            text: msg.content,
            sender: msg.sender && msg.sender._id === userId ? "me" : "other",
            email: msg.sender?.email || "Unknown",
            timestamp:
              msg.createdAt || msg.timestamp || new Date().toISOString(),
          }))
        );
      } catch (error) {
        console.error("Error fetching chat room or messages:", error);
        setError("Failed to load messages. Please try again.");
      }
    };

    fetchChatRoomAndMessages();
    socket.emit("joinRoom", roomid);

    return () => {
      socket.off("receiveMessage");
      socket.disconnect();
    };
  }, [roomid, userId, otherUserId]);

  useEffect(() => {
    const handleReceiveMessage = (message) => {
      const isSenderMe = message.senderId === userId;
      const email = isSenderMe ? "You" : message.email;

      setMessages((prev) => [
        ...prev,
        {
          text: message.content,
          sender: isSenderMe ? "me" : "other",
          email,
          timestamp: message.timestamp || new Date().toISOString(),
        },
      ]);
    };

    socket.on("receiveMessage", handleReceiveMessage);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = {
      text: newMessage,
      sender: "me",
      timestamp: new Date().toISOString(),
      email: "You",
    };

    setMessages((prev) => [...prev, message]);

    try {
      const response = await fetch("http://localhost:5000/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatRoomId,
          senderId: userId,
          content: newMessage,
        }),
      });
      const data = await response.json();

      socket.emit("sendMessage", {
        roomId: roomid,
        message: {
          content: newMessage,
          senderId: userId,
          email: data.sender.email,
          timestamp: data.timestamp,
        },
      });

      if (!response.ok) {
        setError("Failed to save message.");
      }
    } catch (err) {
      setError("Error sending message.");
    }

    setNewMessage("");
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#f3e5f5] to-[#e3f2fd] text-slate-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#7e57c2] to-[#42a5f5] p-4 shadow-md text-white flex justify-between items-center">
        <h1 className="text-lg font-bold">💬 HomiQ Chat</h1>
        <span className="text-sm opacity-90 font-medium">
          Secure • Encrypted
        </span>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-5 space-y-4 custom-scroll">
        {error && <div className="text-red-600 font-semibold">{error}</div>}
        {messages.map((msg, index) => {
          const date = new Date(msg.timestamp);
          const time = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const dateStr = date.toLocaleDateString();

          const isMe = msg.sender === "me";

          return (
            <div
              key={index}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-3 rounded-2xl max-w-[80%] shadow-md text-sm ${
                  isMe
                    ? "bg-gradient-to-br from-[#26c6da] to-[#00acc1] text-white rounded-br-none"
                    : "bg-gradient-to-br from-[#d1c4e9] to-[#ede7f6] text-gray-900 rounded-bl-none"
                }`}
              >
                <div className="font-semibold text-xs opacity-80 mb-1">
                  {isMe ? "You" : msg.email}
                </div>
                <p className="break-words leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </p>
                <div className="text-[10px] text-right mt-1 opacity-70 italic">
                  {dateStr} • {time}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Footer */}
      <footer className="border-t bg-white p-4 flex items-center gap-3 shadow-inner">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault(); // Prevent newline
              sendMessage();
            }
            // Shift+Enter will just add a newline naturally
          }}
          className="flex-1 rounded-xl border border-gray-300 px-5 py-2 resize-none focus:ring-2 focus:ring-[#7e57c2] text-sm shadow-sm outline-none"
          placeholder="Type your message..."
          rows={2}
        />
        <button
          onClick={sendMessage}
          className="bg-gradient-to-r from-[#7e57c2] to-[#42a5f5] hover:scale-105 transition-transform duration-150 text-white px-5 py-2 rounded-full font-medium shadow-md"
        >
          Send
        </button>
      </footer>
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
