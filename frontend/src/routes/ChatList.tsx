import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import socket from "@/lib/socket";
import { useParams, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";

export function ChatList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"mine" | "others">("others");

  const email = localStorage.getItem("email") || "";

  const { chatId: urlChatId } = useParams({});

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  useEffect(() => {
    if (urlChatId) {
      setSelectedChatId(urlChatId);
    } else {
      setSelectedChatId(null);
    }
  }, [urlChatId]);

  const {
    data: currentUser,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["userByEmail", email],
    queryFn: async () => {
      if (!email) throw new Error("No email in localStorage");
      const res = await fetch(
        `http://localhost:5000/api/users/by-email?email=${encodeURIComponent(
          email
        )}`
      );
      const result = await res.json();
      if (!result.success) throw new Error("Failed to fetch user data");
      if (!result.data?._id) throw new Error("User ID missing in response");
      return result.data;
    },
    enabled: !!email,
  });

  const userId = currentUser?._id;

  const {
    data: chats,
    isLoading: chatsLoading,
    error: chatsError,
  } = useQuery({
    queryKey: ["chats", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(
        `http://localhost:5000/api/chatroom/user/${userId}`
      );
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Failed to fetch chats");
      return data.chats;
    },
    enabled: !!userId,
  });

  const { data: myRooms } = useQuery({
    queryKey: ["myRooms", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`http://localhost:5000/api/posts/user/${userId}`);
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Failed to fetch rooms");
      return data.rooms;
    },
    enabled: !!userId,
  });

  const myRoomIds = myRooms?.map((room) => room._id.toString()) || [];

  const filteredChats =
    chats?.filter((chat) => {
      const roomId = chat.roomId?.toString() || "";
      const isMine = myRoomIds.includes(roomId);
      return activeTab === "mine" ? isMine : !isMine;
    }) || [];

  useEffect(() => {
    if (!userId) return;
    if (!socket.connected) socket.connect();

    const handleInvalidate = () => {
      queryClient.invalidateQueries(["chats", userId]);
    };

    const handleRoomUpdated = (payload: { chatId: string }) => {
      console.log("Room updated:", payload.chatId);
      queryClient.invalidateQueries(["chats", userId]);
    };

    socket.on("receiveMessage", handleInvalidate);
    socket.on("roomUpdated", handleRoomUpdated);

    return () => {
      socket.off("receiveMessage", handleInvalidate);
      socket.off("roomUpdated", handleRoomUpdated);
    };
  }, [userId, queryClient]);

  return (
    <div className="w-80 border-r border-gray-300 dark:border-gray-700 flex flex-col">
      <div className="flex border-b border-gray-300 dark:border-gray-700">
        <button
          className={`flex-1 py-2 text-center font-semibold ${
            activeTab === "mine"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("mine")}
        >
          My Room Chats
        </button>
        <button
          className={`flex-1 py-2 text-center font-semibold ${
            activeTab === "others"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("others")}
        >
          Other Room Chats
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filteredChats.length === 0 && (
            <motion.div
              key="no-chats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 text-gray-500 text-center"
            >
              No chats in this category.
            </motion.div>
          )}

          {filteredChats.map((chat) => {
            const isSelected = selectedChatId === chat._id.toString();
            const otherParticipant = chat.participants.find(
              (p: any) => p.email !== email
            );
            const lastMessage = chat.latestMessage || {};

            return (
              <motion.div
                key={chat._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() =>
                  navigate({
                    to: "/chat/$chatId",
                    params: { chatId: chat._id.toString() },
                  })
                }
                className={`cursor-pointer px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isSelected ? "bg-blue-100 dark:bg-blue-900" : ""
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {otherParticipant?.email || "Unknown"}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {lastMessage.content
                    ? lastMessage.content.length > 50
                      ? lastMessage.content.slice(0, 47) + "..."
                      : lastMessage.content
                    : "No messages yet"}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {lastMessage.timestamp
                    ? new Date(lastMessage.timestamp).toLocaleString()
                    : ""}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
