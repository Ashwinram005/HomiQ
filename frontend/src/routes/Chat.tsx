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
  senderName: string;
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
    senderName: msg.sender.name,
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
    const otherParticipant = chatRoom.participants.find(
      (p: any) => p.email !== senderEmail
    );
    if (otherParticipant) setReceiverEmail(otherParticipant.email);
  }, [chatRoom, senderEmail]);

  const { data: senderUser } = useQuery({
    queryKey: ["user", senderEmail],
    queryFn: () => fetchUser(senderEmail),
    enabled: !!senderEmail,
  });

  const { data: receiverUser } = useQuery({
    queryKey: ["user", receiverEmail],
    queryFn: () => fetchUser(receiverEmail),
    enabled: !!receiverEmail,
  });

  useEffect(() => {
    if (!chatId || !senderEmail || !receiverEmail) return;

    fetchMessages(chatId, senderEmail, receiverEmail)
      .then(setMessages)
      .catch(console.error);
  }, [chatId, senderEmail, receiverEmail]);

  useEffect(() => {
    if (!chatId) return;
    if (!socket.connected) socket.connect();

    socket.emit("joinRoom", chatId);
    const handleReceiveMessage = (msg: any) => {
      const newMsg: Message = {
        _id: msg.content._id,
        chatId: msg.content.chatId,
        text: msg.content.text,
        senderName: msg.senderName,
        sender: msg.content.senderEmail === senderEmail ? "user" : "owner",
        senderEmail: msg.content.senderEmail,
        receiverEmail: msg.content.receiverEmail,
        timestamp: msg.content.timestamp,
      };

      if (newMsg.chatId === chatId) {
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.emit("leaveRoom", chatId);
    };
  }, [chatId, senderEmail]);

  const sendMessage = async () => {
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

      if (!data.success) return;

      const newMsg: Message = {
        _id: data.message._id,
        chatId,
        text: data.message.content,
        sender: "user",
        senderName: data.message.sender.name,
        senderEmail,
        receiverEmail,
        timestamp: data.message.timestamp,
      };

      setMessages((prev) => [...prev, newMsg]);

      socket.emit("sendMessage", {
        chatId,
        message: newMsg,
        senderEmail,
        receiverEmail,
      });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex-1 max-w-full flex flex-col md:flex-row gap-6 px-4 py-8 bg-gray-100 dark:bg-gray-950">
      <ChatList />
      <div className="w-full h-[90vh] flex flex-col bg-white dark:bg-gray-900 shadow-xl overflow-hidden border border-gray-300 dark:border-gray-700">
        <div className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
          <h2 className="text-xl font-semibold">Chat Room</h2>
          <small className="text-sm">
            Post: {roomData?.title || "Untitled"}
          </small>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
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
                    className="px-4 py-3 max-w-[70%] break-words whitespace-pre-wrap shadow-sm text-white"
                    style={{
                      background: isSender
                        ? "linear-gradient(135deg, #3b82f6, #2563eb)" // blue gradient for sender
                        : "linear-gradient(135deg, #e0e7ff, #a5b4fc)", // purple gradient for receiver
                      color: isSender ? "white" : "#1e293b",
                    }}
                  >
                    <div className="text-xs font-medium mb-1 text-neutral-500 dark:text-gray-400">
                      {isSender ? "You" : msg.senderName}
                    </div>
                    <div>{msg.text}</div>
                    <div className="text-right text-xs text-gray-400 mt-1">
                      {formatTimestamp(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-400 mt-12">
              No messages yet. Start the conversation!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 px-6 py-3 flex items-center gap-3">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 border border-gray-400 dark:border-gray-600 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-900 dark:text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={() => {
              sendMessage(input);
              setInput("");
            }}
            disabled={!input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 disabled:opacity-50"
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
    path: "/chat/$chatId",
    component: Chat,
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) return redirect({ to: "/" });
    },
  });
