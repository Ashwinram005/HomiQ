// ChatList.tsx
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import socket from "@/lib/socket";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";

export function ChatList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"mine" | "others">("mine");

  const email = localStorage.getItem("email") || "";

  const {
    data: currentUser,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["userByEmail", email],
    queryFn: async () => {
      if (!email) throw new Error("No email in localStorage");
      const res = await fetch(
        `http://localhost:5000/api/users/by-email?email=${email}`
      );
      const result = await res.json();
      if (!result.success) throw new Error("Failed to fetch user data");
      if (!result.data?._id) throw new Error("User ID missing in response");
      return result.data;
    },
    enabled: !!email,
  });

  const userId = currentUser?._id;

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ["chats", userId],
    queryFn: async () => {
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

    const onNewMessage = () => {
      queryClient.invalidateQueries(["chats", userId]);
    };

    socket.on("receiveMessage", onNewMessage);

    return () => {
      socket.off("receiveMessage", onNewMessage);
    };
  }, [userId, chats, queryClient]);

  if (userLoading)
    return <div className="p-4 text-gray-500">Loading user info...</div>;
  if (userError)
    return <div className="p-4 text-red-500">Error loading user info.</div>;

  return (
    <div className="w-80 h-[90vh] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex bg-white/70 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-700">
        {["mine", "others"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "mine" | "others")}
            className={`relative flex-1 py-3 text-sm font-semibold uppercase tracking-wide transition-colors duration-300 ${
              activeTab === tab
                ? "text-blue-600"
                : "text-gray-500 dark:text-gray-400 hover:text-blue-500"
            }`}
          >
            {tab === "mine" ? "Chat With Tenants" : "Chat With Owners"}
            {activeTab === tab && (
              <motion.div
                layoutId="underline"
                className="absolute bottom-0 left-4 right-4 h-[3px] bg-blue-600 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-blue-500 scrollbar-track-transparent">
        {chatsLoading ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-12 animate-pulse">
            Loading chats...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-gray-400 dark:text-gray-500 text-center py-12 italic">
            No chats found.
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredChats.map((chat) => {
              const otherUser = chat.participants.find(
                (m) => m._id?.toString() !== userId
              );
              return (
                <motion.div
                  key={chat._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  layout
                  onClick={() => {
                    navigate({ to: `/chat/${chat._id}` });
                  }}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-700 transition-all duration-200 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 cursor-pointer"
                >
                  <img
                    src="/user.png"
                    alt="User Avatar"
                    className="w-12 h-12 rounded-full border border-gray-300 dark:border-gray-600 object-cover"
                  />
                  <div className="flex flex-col overflow-hidden">
                    <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[180px]">
                      {otherUser?.email || "Unknown User"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[180px]">
                      {chat.latestMessage?.content || "No messages yet"}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
