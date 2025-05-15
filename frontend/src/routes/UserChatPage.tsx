import { useEffect, useRef, useState } from "react";
import { createRoute, redirect, RootRoute } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { getUserIdFromToken } from "@/lib/getUserIdFromToken";

// Dummy function to get userId from token


export const UserChatPage = () => {
  const userId = getUserIdFromToken();

  // Store fetched chat rooms here
  const [chatRooms, setChatRooms] = useState<
    { _id: string; roomId: string; otherUserEmail: string }[]
  >([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Messages for selected chat room
  const [messages, setMessages] = useState<
    Record<string, { text: string; sender: "me" | "them" }[]>
  >({});

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat rooms on mount
  useEffect(() => {
    async function fetchChatRooms() {
      try {
        const res = await fetch(`http://localhost:5000/api/chatroom/userchatroom/${userId}`);
        if (!res.ok) {
          console.error("Failed to fetch chat rooms");
          return;
        }
        const rooms = await res.json();
        setChatRooms(rooms);
        if (rooms.length > 0) setSelectedRoomId(rooms[0]._id);
      } catch (error) {
        console.error("Error fetching chat rooms:", error);
      }
    }
    fetchChatRooms();
  }, [userId]);

  // Fetch messages when selectedRoomId changes
  useEffect(() => {
    if (!selectedRoomId) return;

    async function fetchMessages() {
      try {
        // Replace with your real API endpoint to fetch messages by roomId
        const res = await fetch(`/api/messages/${selectedRoomId}`);
        if (!res.ok) {
          console.error("Failed to fetch messages");
          return;
        }
        const msgs = await res.json();
        setMessages((prev) => ({
          ...prev,
          [selectedRoomId]: msgs,
        }));
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }

    // For demo, we mock messages if none exist
    if (!messages[selectedRoomId]) {
      fetchMessages();
    }
  }, [selectedRoomId]);

  // Scroll to bottom when messages or selectedRoomId changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedRoomId]);

  function sendMessage() {
    if (!input.trim() || !selectedRoomId) return;

    // Here you would POST the message to your backend API,
    // but for demo, we update locally
    setMessages((prev) => ({
      ...prev,
      [selectedRoomId]: [
        ...(prev[selectedRoomId] || []),
        { text: input, sender: "me" },
      ],
    }));

    setInput("");
  }

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
        <h2 style={{ marginBottom: 20, fontWeight: "600" }}>Chats</h2>
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
          </div>
        ))}
      </aside>

      {/* Chat Window */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          padding: "1.5rem 2rem",
        }}
      >
        <header
          style={{
            borderBottom: "1px solid #eee",
            paddingBottom: 12,
            marginBottom: 20,
            fontWeight: "700",
            fontSize: 24,
            color: "#2563eb",
          }}
        >
          {chatRooms.find((r) => r._id === selectedRoomId)?.otherUserEmail ||
            "Select a chat"}
          {" 👤"}
        </header>

        {/* Messages Container */}
        <section
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: 10,
          }}
        >
          {(messages[selectedRoomId] || []).map((msg, idx) => {
            const isMe = msg.sender === "me";
            return (
              <div
                key={idx}
                style={{
                  maxWidth: "60%",
                  padding: "0.6rem 1rem",
                  marginBottom: 10,
                  borderRadius: 20,
                  backgroundColor: isMe ? "#2563eb" : "#e5e7eb",
                  color: isMe ? "#fff" : "#111",
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  boxShadow: "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px",
                  fontSize: 15,
                  lineHeight: 1.4,
                }}
              >
                {msg.text}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </section>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          style={{
            marginTop: 20,
            display: "flex",
            gap: 12,
            borderTop: "1px solid #eee",
            paddingTop: 16,
          }}
        >
          <input
            type="text"
            placeholder={`Message ${
              chatRooms.find((r) => r._id === selectedRoomId)?.otherUserEmail ||
              ""
            }...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              fontSize: 16,
              borderRadius: 24,
              border: "1.5px solid #ddd",
              outline: "none",
              transition: "border-color 0.3s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              backgroundColor: input.trim() ? "#2563eb" : "#93c5fd",
              color: "white",
              border: "none",
              borderRadius: 24,
              padding: "0 20px",
              cursor: input.trim() ? "pointer" : "not-allowed",
              fontWeight: "600",
              fontSize: 16,
              boxShadow: "0 3px 6px rgb(37 99 235 / 0.4)",
              transition: "background-color 0.3s",
            }}
          >
            Send
          </button>
        </form>
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
