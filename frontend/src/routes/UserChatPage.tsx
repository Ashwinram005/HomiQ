import { useEffect, useState } from "react";
import { createRoute, redirect, RootRoute } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { getUserIdFromToken } from "@/lib/getUserIdFromToken";
import { useNavigate } from "@tanstack/react-router";

import { ChatWindow } from "./ChatWindow";

interface ChatRoom {
  _id: string;
  roomId: string;
  otherUserId: string;
  otherUserEmail: string;
}

export const UserChatPage = () => {
  const navigate = useNavigate();

  const userId = getUserIdFromToken();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChatRooms() {
      try {
        const res = await fetch(
          `http://localhost:5000/api/chatroom/userchatroom/${userId}`
        );
        if (!res.ok) throw new Error("Failed to fetch chat rooms");

        const rooms: ChatRoom[] = await res.json();
        setChatRooms(rooms);
        if (rooms.length > 0) setSelectedRoomId(rooms[0]._id);
      } catch (error) {
        console.error("Error fetching user chat rooms:", error);
      }
    }

    if (userId) fetchChatRooms();
  }, [userId]);

  const selectedRoom = chatRooms.find((r) => r._id === selectedRoomId);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: "#f8fafc",
        color: "#222",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 280,
          borderRight: "1px solid #ddd",
          padding: "1.5rem 1rem",
          backgroundColor: "#fff",
          boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontWeight: "600", margin: 0, fontSize: "1.25rem" }}>
            Your Chats
          </h2>
          <button
            onClick={() => navigate({ to: "/otherposts" })}
            style={{
              padding: "0.4rem 1rem",
              backgroundColor: "#3b82f6", // a brighter blue
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.9rem",
              boxShadow: "0 2px 6px rgba(59, 130, 246, 0.4)",
              transition: "background-color 0.3s ease",
              userSelect: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#2563eb";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#3b82f6";
            }}
          >
            Back
          </button>
        </div>{" "}
        {chatRooms.length === 0 && <p>No chat rooms found</p>}
        {chatRooms.map((room) => (
          <div
            key={room._id}
            onClick={() => setSelectedRoomId(room._id)}
            style={{
              padding: "0.75rem 1rem",
              marginBottom: 8,
              borderRadius: 8,
              cursor: "pointer",
              backgroundColor:
                selectedRoomId === room._id ? "#2563eb" : "transparent",
              color: selectedRoomId === room._id ? "white" : "#333",
              fontWeight: selectedRoomId === room._id ? "700" : "500",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (selectedRoomId !== room._id) {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  "#e0e7ff";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedRoomId !== room._id) {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  "transparent";
              }
            }}
          >
            {room.otherUserEmail}
            {room.latestMessage?.content && (
              <div
                style={{
                  fontSize: "0.85rem",
                  color: selectedRoomId === room._id ? "#d1d5db" : "#666",
                  marginTop: 4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "220px",
                }}
              >
                {room.latestMessage.sender === userId ? "You: " : "Owner: "}

                {room.latestMessage.content}
              </div>
            )}
          </div>
        ))}
      </aside>

      {/* Main Chat Window */}
      <main
        style={{
          flex: 1,
          padding: "1.5rem",
          backgroundColor: "#f9fafb",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {selectedRoom ? (
          <ChatWindow
            key={selectedRoom._id}
            roomid={selectedRoom.roomId}
            otherUserId={selectedRoom.otherUserId}
          />
        ) : (
          <div
            style={{
              margin: "auto",
              fontSize: 18,
              color: "#999",
              userSelect: "none",
            }}
          >
            Select a chat to start messaging
          </div>
        )}
      </main>
    </div>
  );
};

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/userchatpage",
    component: UserChatPage,
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) {
        return redirect({ to: "/" });
      }
    },
  });
