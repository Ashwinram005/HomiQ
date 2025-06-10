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

 

  // Fetch messages initially & when dependencies change
  useEffect(() => {
    if (!chatId || !senderEmail || !receiverEmail) return;

    fetchMessages(chatId, senderEmail, receiverEmail)
      .then(setMessages)
      .catch(console.error);
  }, [chatId, senderEmail, receiverEmail]);

  // Setup socket listeners for realtime messages
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
        // Scroll to bottom on receiving new message
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

      // Scroll to bottom on sending new message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const [openChatList, setOpenChatList] = useState(true);

  return (
    <div className="flex-1 max-w-full flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 ">
      {openChatList && (
        <div className="fixed inset-0 z-50 flex h-screen md:static md:z-auto md:h-auto">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setOpenChatList(false)}
          />

          {/* Sidebar Panel */}
          <div className="relative z-10 h-screen w-[80vw] max-w-sm bg-white dark:bg-neutral-900 md:w-80 md:h-auto md:static">
            <ChatList setOpenChatList={setOpenChatList} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col md:h-[100vh] bg-white dark:bg-neutral-800  overflow-hidden  border-gray-200 dark:border-neutral-700 h-full relative">
        {/* Header */}
        <div className="fixed top-0 w-full bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-4 md:px-6 py-3 flex items-center  z-20">
          <button
            className="mr-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
            onClick={() => setOpenChatList((prev) => !prev)}
            aria-label="Toggle sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6 text-gray-800 dark:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5h18M3 12h18M3 19h18"
              />
            </svg>
          </button>

          <div className="flex-1 flex flex-col min-w-0 mb-1 ">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
              Chat Room
            </h2>
            <small className="text-sm text-gray-500 dark:text-gray-400 truncate">
              Post: {roomData?.title || "Untitled"}
            </small>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 pt-8 pb-17 space-y-3 hide-scrollbar"
          style={{ marginTop: "56px" }}
        >
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
                    className={`px-4 py-3 max-w-[70%] break-words whitespace-pre-wrap rounded-2xl text-sm text-black`}
                    style={{
                      background: isSender ? "#e0d3d5" : "#f3f4f6",
                    }}
                  >
                    <div className="text-xs font-medium mb-1 text-gray-500">
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
            <div className="text-center text-gray-400 mt-12 max-h-100">

            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className={`bg-white fixed bottom-0 dark:bg-neutral-800 border-t border-gray-200 dark:border-neutral-700 px-4 md:px-6 py-3 flex items-center gap-3 ${
            openChatList ? "w-[calc(100%-320px)] left-80" : "w-full left-0"
          }`}
        >
          <input
            type="text"
            placeholder="Message..."
            className="flex-1 md: border border-gray-300 dark:border-neutral-600 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 dark:bg-neutral-800 dark:text-white rounded-full"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white px-5 py-2 text-sm rounded-full transition disabled:opacity-50"
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
