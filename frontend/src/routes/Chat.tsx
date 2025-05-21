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

// Fetch chat room by chatId
async function fetchChatRoom(chatId: string) {
  const res = await fetch(`http://localhost:5000/api/chatroom/${chatId}`);
  const data = await res.json();
  if (!data.success) throw new Error("Failed to fetch chatroom");
  return data.data; // Should contain participants, roomId, latestMessage, etc
}

// Fetch post by roomId (post ID)
async function fetchRoom(roomId: string) {
  const res = await fetch(`http://localhost:5000/api/posts/${roomId}`);
  const data = await res.json();
  if (!data.success) throw new Error("Failed to fetch room");
  return data.data;
}

// Fetch user by userId or email
async function fetchUser(userIdOrEmail: string) {
  // If it's 24 length string, treat as id else email
  const url =
    userIdOrEmail.length === 24
      ? `http://localhost:5000/api/users/${userIdOrEmail}`
      : `http://localhost:5000/api/users/by-email?email=${encodeURIComponent(
          userIdOrEmail
        )}`;

  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error("Failed to fetch user");
  return data.data;
}

// Fetch messages by chatId
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
    timestamp: msg.timestamp,
  }));
}

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
  const { chatId } = useParams({ from: "/chat/$chatId" });

  const rawEmail = localStorage.getItem("email") ?? "";
  const senderEmail = rawEmail.replace(/^"|"$/g, "").trim();

  const [receiverEmail, setReceiverEmail] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch chat room by chatId
  const { data: chatRoom, isLoading: chatRoomLoading } = useQuery({
    queryKey: ["chatRoom", chatId],
    queryFn: () => fetchChatRoom(chatId),
    enabled: !!chatId,
  });

  // console.log("ChatRoom", chatRoom);

  // Fetch room (post) data by roomId from chatRoom
  const roomId = chatRoom?.roomId?._id || "";
  const { data: roomData } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoom(roomId),
    enabled: !!roomId,
  });

  // Determine receiverEmail (other participant)
  useEffect(() => {
    if (!chatRoom) return;
    const otherParticipant = chatRoom.participants.find(
      (p: any) => p.email !== senderEmail
    );
    if (otherParticipant) setReceiverEmail(otherParticipant.email);
  }, [chatRoom, senderEmail]);
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      // console.log("📥 Received in:", chatId, msg);
    });
  }, [chatId]);

  // Fetch sender user info (to get _id)
  const { data: senderUser } = useQuery({
    queryKey: ["user", senderEmail],
    queryFn: () => fetchUser(senderEmail),
    enabled: !!senderEmail,
  });

  // Fetch receiver user info
  const { data: receiverUser } = useQuery({
    queryKey: ["user", receiverEmail],
    queryFn: () => fetchUser(receiverEmail),
    enabled: !!receiverEmail,
  });

  // Fetch messages for this chat
  useEffect(() => {
    if (!chatId || !senderEmail || !receiverEmail) return;

    fetchMessages(chatId, senderEmail, receiverEmail)
      .then(setMessages)
      .catch(console.error);
  }, [chatId, senderEmail, receiverEmail]);

  // Socket setup for real-time messages
  useEffect(() => {
    if (!chatId) return;
    if (!socket.connected) socket.connect();

    socket.emit("joinRoom", chatId);
    console.log(chatId, "Join chatId");
    const handleReceiveMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.emit("leaveRoom", chatId); // Add this to leave previous room
    };
  }, [chatId]);

  // Send message handler
  const sendMessage = async () => {
    console.log("Send chatId", chatId);
    // console.log("Send", senderUser);
    if (!input.trim() || !chatId || !senderUser) return;

    const content = input.trim();
    setInput("");

    try {
      const res = await fetch("http://localhost:5000/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatRoomId: chatId,
          senderId: senderUser._id,
          content,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        console.error("Send failed:", data.message);
        return;
      }
      const senderInRoom = chatRoom?.participants.find(
        (p) => p.email === senderEmail
      );
      const newMsg: Message = {
        _id: data.message._id,
        chatId,
        text: data.message.content,
        sender: senderUser._id === senderInRoom?._id ? "user" : "owner",
        senderEmail,
        receiverEmail,
        timestamp: data.message.timestamp,
      };

      socket.emit("sendMessage", { chatId, message: newMsg });

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

  if (chatRoomLoading) return <div>Loading chat...</div>;

  return (
    <div className="flex-1 max-w-full flex flex-col md:flex-row gap-6 px-4 py-6">
      <ChatList />
      <div className="w-full h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="sticky top-0 z-10 bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow-md">
          <h2 className="text-2xl font-semibold tracking-wide">Chat Room</h2>
          <div>
            <small>Post: {roomData?.title || "Untitled"}</small>
          </div>
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
                          : "text-blue-400"
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

        <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/chat/$chatId",
    component: Chat,
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) return redirect({ to: "/" });
    },
  });
