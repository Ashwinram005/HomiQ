import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import socket from "@/lib/socket";
import { useParams, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sun, Moon, X } from "lucide-react";

// 🌓 Get theme from localStorage
const getTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  }
  return "light";
};

// 🌓 Set theme to localStorage and <html>
const setTheme = (theme: "light" | "dark") => {
  if (typeof window !== "undefined") {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }
};

// 📍 Get active tab from localStorage
const getStoredTab = (): "mine" | "others" => {
  if (typeof window !== "undefined") {
    return (
      (localStorage.getItem("activeChatTab") as "mine" | "others") || "others"
    );
  }
  return "others";
};

export function ChatList({ setOpenChatList }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const email = localStorage.getItem("email") || "";
  const { chatId: urlChatId } = useParams({});
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  useEffect(() => setSelectedChatId(urlChatId || null), [urlChatId]);

  // 🌙 Theme state
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(
    getTheme()
  );
  useEffect(() => setTheme(currentTheme), [currentTheme]);
  useEffect(() => {
    const handleStorageChange = () => setCurrentTheme(getTheme());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
  };

  // 🔁 Tab state (stored in localStorage)
  const [activeTab, setActiveTab] = useState<"mine" | "others">(getStoredTab());
  const handleTabChange = (tab: "mine" | "others") => {
    setActiveTab(tab);
    localStorage.setItem("activeChatTab", tab);
  };

  // 1️⃣ Fetch current user
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["userByEmail", email],
    queryFn: async () => {
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
  const { data: chats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ["chats", userId],
    queryFn: async () => {
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

  // 3️⃣ Fetch user's rooms
  const { data: myRooms = [] } = useQuery({
    queryKey: ["myRooms", userId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/posts/user/${userId}`);
      const json = await res.json();
      if (!json.success) throw new Error("Failed to fetch rooms");
      return json.rooms;
    },
    enabled: !!userId,
    staleTime: 0,
  });
  const myRoomIds = myRooms?.map((room) => room._id.toString()) || [];

  // 4️⃣ Filter chats by tab
  const filteredChats = chats?.filter((chat) => {
    const roomId = chat.roomId?.toString() || "";
    const isMine = myRoomIds.includes(roomId);
    return activeTab === "mine" ? isMine : !isMine;
  });

  // 5️⃣ Join socket rooms
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

  // 6️⃣ Optimistic chat updates
  useEffect(() => {
    if (!userId) return;

    const handleMessage = (payload: any) => {
      const roomId = payload.chatRoom;
      const msg = payload.content;

      queryClient.setQueryData<any[]>(["chats", userId], (old = []) => {
        const idx = old.findIndex((c) => c._id === roomId);
        let updatedChats = [...old];

        if (idx !== -1) {
          const existing = old[idx];
          const updated = {
            ...existing,
            latestMessage: { content: msg.text, timestamp: msg.timestamp },
          };
          updatedChats = [updated, ...old.slice(0, idx), ...old.slice(idx + 1)];
        } else {
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

        // Optionally update tab to match most recent message
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
          if (correctTab !== activeTab) {
            handleTabChange(correctTab);
          }
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

  // 💄 Theme-based classes
  const sidebarBgClass =
    currentTheme === "dark"
      ? "bg-neutral-800 border-gray-700 text-gray-200"
      : "bg-white border-gray-300 text-gray-800";
  const backButtonClass =
    currentTheme === "dark"
      ? "text-blue-400 hover:text-blue-300 hover:bg-gray-800"
      : "text-blue-600 hover:text-blue-700 hover:bg-blue-50";
  const tabButtonClass = (tab: "mine" | "others") =>
    `flex-1 py-2 text-center font-semibold transition-colors duration-200 ${
      activeTab === tab
        ? currentTheme === "dark"
          ? "border-b-2 border-blue-400 text-blue-400"
          : "border-b-2 border-blue-600 text-blue-600"
        : currentTheme === "dark"
        ? "text-gray-400 hover:text-gray-300"
        : "text-gray-600 hover:text-gray-700"
    }`;
  const chatItemClass = (isSelected: boolean) =>
    `cursor-pointer p-3 border-b transition-colors duration-200 ${
      isSelected
        ? currentTheme === "dark"
          ? "bg-blue-900 text-blue-100 border-gray-700"
          : "bg-blue-100 text-blue-800 border-gray-200"
        : currentTheme === "dark"
        ? "hover:bg-gray-800 border-gray-700"
        : "hover:bg-gray-50 border-gray-200"
    }`;

  if (userLoading || chatsLoading) {
    return (
      <div className={`w-80 p-4 text-center ${sidebarBgClass}`}>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className={`w-full z-100 min-h-screen border-r flex flex-col shadow-xl transition-colors duration-300 ${sidebarBgClass}`}
    >
      {/* Header */}
      <div
        className={`p-3 border-b flex items-center justify-between transition-colors duration-300 ${
          currentTheme === "dark" ? "border-gray-700" : "border-gray-300"
        }`}
      >
        <div className="flex items-center flex-1">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md transition-colors duration-200 ${backButtonClass}`}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* Theme toggle + close */}
        <div className="flex gap-1">
          <div className="flex justify-center flex-1">
            <button
              onClick={toggleTheme}
              className={`p-1 rounded-full transition-colors duration-200 ${
                currentTheme === "dark"
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              aria-label="Toggle theme"
            >
              {currentTheme === "light" ? (
                <Moon size={20} />
              ) : (
                <Sun size={20} />
              )}
            </button>
          </div>
          <div className="flex justify-end flex-1">
            <button
              className="mr-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
              onClick={() => setOpenChatList((prev) => !prev)}
              aria-label="Toggle sidebar"
            >
              <X />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className={`flex border-b transition-colors duration-300 ${
          currentTheme === "dark" ? "border-gray-700" : "border-gray-300"
        }`}
      >
        <button
          className={tabButtonClass("mine")}
          onClick={() => handleTabChange("mine")}
        >
          Tenants
        </button>
        <button
          className={tabButtonClass("others")}
          onClick={() => handleTabChange("others")}
        >
          Owners
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {filteredChats.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 text-center text-gray-500 dark:text-gray-400"
            >
              No chats
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
                className={chatItemClass(isSelected)}
                onClick={() => {
                  setSelectedChatId(chat._id);
                  navigate({
                    to: "/chat/$chatId",
                    params: { chatId: chat._id },
                  });
                  if (window.innerWidth < 768) setOpenChatList(false);

                  // 🧠 Store active tab when a chat is clicked
                  localStorage.setItem("activeChatTab", activeTab);
                }}
              >
                <div
                  className={`font-semibold ${
                    currentTheme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                >
                  {other?.name || "Unknown"}
                </div>
                <div
                  className={`text-sm truncate ${
                    currentTheme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {lm.content || "No messages yet"}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    currentTheme === "dark" ? "text-gray-500" : "text-gray-400"
                  }`}
                >
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
