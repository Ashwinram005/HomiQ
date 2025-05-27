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
  useEffect(() => setSelectedChatId(urlChatId || null), [urlChatId]);

  // 1️⃣ Fetch current user
  const {
    data: currentUser,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["userByEmail", email],
    queryFn: async () => {
      if (!email) throw new Error("No email");
      const res = await fetch(
        `http://localhost:5000/api/users/by-email?email=${encodeURIComponent(
          email
        )}`
      );
      const json = await res.json();
      if (!json.success) throw new Error("Failed to fetch user");
      return json.data;
    },
    enabled: !!email,
  });
  const userId = currentUser?._id;

  // 2️⃣ Fetch chats
  const {
    data: chats = [],
    isLoading: chatsLoading,
    error: chatsError,
  } = useQuery({
    queryKey: ["chats", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(
        `http://localhost:5000/api/chatroom/user/${userId}`
      );
      const json = await res.json();
      if (!json.success) throw new Error("Failed to fetch chats");
      return json.chats;
    },
    enabled: !!userId,
    staleTime: 0,
  });

  // 3️⃣ Fetch rooms owned by user
  const { data: myRooms = [] } = useQuery({
    queryKey: ["myRooms", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`http://localhost:5000/api/posts/user/${userId}`);
      const json = await res.json();
      if (!json.success) throw new Error("Failed to fetch rooms");
      return json.rooms;
    },
    enabled: !!userId,
    staleTime: 0,
  });
  const myRoomIds = myRooms?.map((room) => room._id.toString()) || [];

  const filteredChats =
    chats?.filter((chat) => {
      const roomId = chat.roomId?.toString() || "";
      const isMine = myRoomIds.includes(roomId);
      return activeTab === "mine" ? isMine : !isMine;
    }) || [];

  // 5️⃣ Join all rooms on socket so you’ll get events for them
  useEffect(() => {
    if (!userId || !chats.length) return;
    if (!socket.connected) socket.connect();

    chats.forEach((chat) => {
      socket.emit("joinRoom", chat._id);
    });

    return () => {
      chats.forEach((chat) => {
        socket.emit("leaveRoom", chat._id);
      });
    };
  }, [userId, chats]);

  // 6️⃣ Optimistic cache patch on incoming messages for any room
  useEffect(() => {
    if (!userId) return;

    const handleMessage = (payload: any) => {
      const roomId = payload.chatRoom;
      const msg = payload.content; // { text, timestamp, ... }

      queryClient.setQueryData<any[]>(["chats", userId], (old = []) => {
        const idx = old.findIndex((c) => c._id === roomId);
        let updatedChats = [...old];

        if (idx !== -1) {
          const existing = old[idx];
          const updated = {
            ...existing,
            latestMessage: {
              content: msg.text,
              timestamp: msg.timestamp,
            },
          };
          updatedChats = [updated, ...old.slice(0, idx), ...old.slice(idx + 1)];
        } else {
          // Insert new chat
          updatedChats = [
            {
              _id: roomId,
              participants: [],
              roomId: { _id: roomId },
              latestMessage: { content: msg.text, timestamp: msg.timestamp },
            },
            ...old,
          ];
        }

        // 🔁 Determine if this is the most recent message
        const latest = updatedChats.reduce(
          (latest, chat) => {
            const t = new Date(chat.latestMessage?.timestamp || 0).getTime();
            return t > latest.time ? { time: t, chat } : latest;
          },
          { time: 0, chat: null }
        );

        if (latest.chat) {
          const belongsToMyRoom = myRoomIds.includes(
            latest.chat.roomId?._id || latest.chat.roomId
          );
          const correctTab = belongsToMyRoom ? "mine" : "others";
          setActiveTab((prev) => (prev !== correctTab ? correctTab : prev));
        }

        return updatedChats;
      });
    };

    socket.on("receiveMessage", handleMessage);
    socket.on("updateMessage", handleMessage);

    return () => {
      socket.off("receiveMessage", handleMessage);
      socket.off("updateMessage", handleMessage);
    };
  }, [userId, queryClient, myRoomIds]);

  if (userLoading || chatsLoading) {
    return <div className="w-80 p-4 text-center">Loading...</div>;
  }
  if (userError || chatsError) {
    return (
      <div className="w-80 p-4 text-center text-red-600">Error loading</div>
    );
  }

  return (
    <div className="w-80 border-r flex flex-col">
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 text-center font-semibold ${
            activeTab === "mine" ? "border-b-2 text-blue-600" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("mine")}
        >
          Tenants
        </button>
        <button
          className={`flex-1 py-2 text-center font-semibold ${
            activeTab === "others"
              ? "border-b-2 text-blue-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("others")}
        >
          Owners
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filteredChats.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="p-4 text-center text-gray-500">No chats</p>
            </motion.div>
          )}

          {filteredChats.map((chat) => {
            const isSelected = selectedChatId === chat._id;
            const other = chat.participants.find((p: any) => p.email !== email);
            const lm = chat.latestMessage || {};
            return (
              <motion.div
                key={chat._id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={`cursor-pointer p-3 border-b ${
                  isSelected ? "bg-blue-100" : ""
                }`}
                onClick={() =>
                  navigate({
                    to: "/chat/$chatId",
                    params: { chatId: chat._id },
                  })
                }
              >
                <div className="font-semibold">{other?.email || "Unknown"}</div>
                <div className="text-sm text-gray-600 truncate">
                  {lm.content || "No messages yet"}
                </div>
                <div className="text-xs text-gray-400">
                  {lm.timestamp ? new Date(lm.timestamp).toLocaleString() : ""}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
