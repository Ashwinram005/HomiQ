// Chat.tsx
import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  createRoute,
  redirect,
  RootRoute,
  useParams,
} from "@tanstack/react-router";
import socket from "@/lib/socket";
import { ChatList } from "./ChatList";
import { isAuthenticated } from "@/lib/auth";
import { FaComments, FaTimes } from "react-icons/fa";

interface Message {
  _id?: string;
  chatId: string;
  text: string;
  sender: "user" | "owner";
  senderEmail: string;
  receiverEmail: string;
  timestamp: string | Date;
}

async function fetchChatRoom(chatId: string) {
  const res = await fetch(`http://localhost:5000/api/chatroom/${chatId}`);
  const data = await res.json();
  if (!data.success) throw new Error("Failed to fetch chatroom");
  return data.data;
}

async function fetchRoom(roomId: string) {
  const res = await fetch(`http://localhost:5000/api/posts/${roomId}`);
  const data = await res.json();
  if (!data.success) throw new Error("Failed to fetch room");
  return data.data;
}

async function fetchUser(userIdOrEmail: string) {
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
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export function Chat() {
  const { chatId } = useParams({ from: "/chat/$chatId" });

  const rawEmail = localStorage.getItem("email") ?? "";
  const senderEmail = rawEmail.replace(/^"|"$/g, "").trim();

  const [receiverEmail, setReceiverEmail] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showChatList, setShowChatList] = useState(true); // default true to show

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { data: chatRoom } = useQuery({
    queryKey: ["chatRoom", chatId],
    queryFn: () => fetchChatRoom(chatId),
    enabled: !!chatId,
  });

  const roomId = chatRoom?.roomId?._id || "";
  const { data: roomData } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoom(roomId),
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!chatRoom) return;
    const other = chatRoom.participants.find(
      (p: any) => p.email !== senderEmail
    );
    setReceiverEmail(other?.email ?? "");
  }, [chatRoom, senderEmail]);

  useEffect(() => {
    if (!chatId || !senderEmail || !receiverEmail) return;

    fetchMessages(chatId, senderEmail, receiverEmail)
      .then(setMessages)
      .catch(console.error);
  }, [chatId, senderEmail, receiverEmail]);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.emit("joinRoom", chatId);

    socket.on("receiveMessage", (msg: Message) => {
      if (msg.chatId === chatId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.emit("leaveRoom", chatId);
      socket.off("receiveMessage");
    };
  }, [chatId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const message: Message = {
      chatId,
      text: input,
      sender: "user",
      senderEmail,
      receiverEmail,
      timestamp: new Date().toISOString(),
    };
    socket.emit("sendMessage", message);
    setMessages((prev) => [...prev, message]);
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-[90vh] max-w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Chat List */}
      {showChatList && (
        <div className="w-80 min-w-[320px] bg-white dark:bg-gray-900">
          <ChatList />
        </div>
      )}

      {/* Chat Box */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <button
            className="block  text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => setShowChatList((v) => !v)}
            aria-label={showChatList ? "Hide chat list" : "Show chat list"}
          >
            {showChatList ? <FaTimes size={20} /> : <FaComments size={20} />}
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
            Chat with {receiverEmail || "Loading..."}
          </h1>
          <div></div> {/* Placeholder for right side */}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-blue-500 scrollbar-track-transparent">
          {messages.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-12">
              No messages yet
            </p>
          )}
          {messages.map((msg, idx) => {
            const isSender = msg.senderEmail === senderEmail;
            return (
              <div
                key={idx}
                className={`flex ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[60%] px-4 py-2 rounded-lg ${
                    isSender
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <span className="block text-xs text-gray-100 mt-1 text-right">
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center px-6 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
        >
          <input
            type="text"
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
          />
          <button
            type="submit"
            className="ml-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!input.trim()}
          >
            Send
          </button>
        </form>
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
      return null;
    },
  });
