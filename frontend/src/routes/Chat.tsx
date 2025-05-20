import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  createRoute,
  redirect,
  RootRoute,
  useParams,
} from "@tanstack/react-router";
import socket from "@/lib/socket";
import { isAuthenticated } from "@/lib/auth";
import { ChatList } from "./ChatList";

interface Message {
  _id?: string;
  chatId: string;
  text: string;
  sender: "user" | "owner";
  senderEmail: string;
  receiverEmail: string;
  timestamp: string | Date;
}

async function fetchRoom(roomId: string) {
  const res = await fetch(`http://localhost:5000/api/posts/${roomId}`);
  const data = await res.json();
  if (!data.success) throw new Error("Failed to fetch room");
  return data.data;
}

async function fetchUserByEmail(email: string) {
  const res = await fetch(
    `http://localhost:5000/api/users/by-email?email=${email}`
  );
  const data = await res.json();
  if (!data.success) throw new Error("Failed to fetch user");
  return data.data;
}

async function startOrFetchChat(
  userId: string,
  otherUserId: string,
  roomId: string
) {
  const res = await fetch(`http://localhost:5000/api/chatroom/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, otherUserId, roomId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error("Failed to create or fetch chatroom");
  return data.data;
}

async function fetchMessages(
  chatId: string,
  senderEmail: string,
  receiverEmail: string
) {
  const res = await fetch(`http://localhost:5000/api/messages/${chatId}`);
  const data = await res.json();
  if (!data.success) throw new Error("Failed to fetch messages");
  return data.messages.map((msg: any) => ({
    ...msg,
    text: msg.content,
    senderEmail: msg.sender.email,
    receiverEmail:
      senderEmail === msg.sender.email ? receiverEmail : senderEmail,
    sender: msg.sender.email === senderEmail ? "user" : "owner",
    timestamp: msg.timestamp, // <-- FIX HERE: use timestamp instead of createdAt
  }));
}

// Helper function to format timestamp safely
const formatTimestamp = (timestamp: string | Date | undefined) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export function Chat() {
  const params = useParams({ from: "/chat/$roomId" });
  const roomId = params.roomId ?? "";

  const rawEmail = localStorage.getItem("email") ?? "";
  const senderEmail = rawEmail.replace(/^"|"$/g, "").trim();

  const [receiverEmail, setReceiverEmail] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { data: roomData } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoom(roomId),
    enabled: !!roomId,
  });

  useEffect(() => {
    if (roomData?.email) {
      setReceiverEmail(roomData.email.replace(/^"|"$/g, "").trim());
    }
  }, [roomData]);

  const { data: senderUser } = useQuery({
    queryKey: ["user", senderEmail],
    queryFn: () => fetchUserByEmail(senderEmail),
    enabled: !!senderEmail && !!roomData,
  });

  const { data: receiverUser } = useQuery({
    queryKey: ["user", receiverEmail],
    queryFn: () => fetchUserByEmail(receiverEmail),
    enabled: !!receiverEmail,
  });

  const { data: chat } = useQuery({
    queryKey: ["chat", senderUser?._id, receiverUser?._id, roomId],
    queryFn: () => startOrFetchChat(senderUser!._id, receiverUser!._id, roomId),
    enabled: !!senderUser && !!receiverUser && !!roomId,
  });

  useEffect(() => {
    if (!chat?._id) return;
    fetchMessages(chat._id, senderEmail, receiverEmail)
      .then(setMessages)
      .catch(console.error);
  }, [chat?._id, senderEmail, receiverEmail]);

  useEffect(() => {
    if (!chat?._id) return;

    if (!socket.connected) socket.connect();
    socket.emit("joinRoom", chat._id);

    const handleReceiveMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [chat?._id]);

  const sendMessage = async () => {
    if (!input.trim() || !chat?._id || !senderUser) return;

    const content = input.trim();
    setInput("");

    try {
      const res = await fetch("http://localhost:5000/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatRoomId: chat._id,
          senderId: senderUser._id,
          content,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        console.error("Send failed:", data.message);
        return;
      }

      const newMsg: Message = {
        _id: data.message._id,
        chatId: chat._id,
        text: data.message.content,
        sender: senderUser._id === chat.userId ? "user" : "owner",
        senderEmail,
        receiverEmail,
        timestamp: data.message.timestamp, // use timestamp from response too
      };

      socket.emit("sendMessage", { roomId: chat._id, message: newMsg });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex-1 max-w-full flex flex-col md:flex-row gap-6 px-4 py-6">
      <ChatList />
      <div className="w-full h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="sticky top-0 z-10 bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow-md">
          <h2 className="text-2xl font-semibold tracking-wide">Chat Room</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-800">
          {messages.length ? (
            messages.map((msg, i) => {
              const isSender = msg.senderEmail === senderEmail;
              return (
                <div
                  key={msg._id || i}
                  className={`flex ${
                    isSender ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl p-4 max-w-[70%] break-words whitespace-pre-wrap shadow-md transition-all duration-200 ${
                      isSender
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
                    }`}
                  >
                    <div
                      className={`text-xs font-semibold mb-1 ${
                        isSender
                          ? "text-gray-100 dark:text-gray-300"
                          : "text-blue-400" /* Changed receiver email color */
                      }`}
                    >
                      {msg.senderEmail}
                    </div>
                    <div className="text-sm">{msg.text}</div>
                    <div className="text-[11px] text-right mt-2 text-gray-400 dark:text-gray-500">
                      {formatTimestamp(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No messages yet.
            </p>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={sendMessage}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2 rounded-full transition-all duration-150"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/chat/$roomId",
    component: Chat,
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) return redirect({ to: "/" });
    },
  });
