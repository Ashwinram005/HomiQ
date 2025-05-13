import React, { useState } from "react";
import { Button } from "@/components/ui/button"; // Adjust import as needed for your Button component
import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";

export const ChatPage = () => {
  const [conversations, setConversations] = useState<any[]>([
    { id: 1, name: "Room 1", messages: [{ sender: "user", text: "Hello!" }] },
    { id: 2, name: "Room 2", messages: [{ sender: "owner", text: "Hi!" }] },
  ]);
  const [activeConversation, setActiveConversation] = useState<any | null>(
    null
  );
  const [message, setMessage] = useState("");

  // Handle selecting a conversation
  const handleSelectConversation = (conversation: any) => {
    setActiveConversation(conversation);
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if (message.trim()) {
      setActiveConversation((prevConversation) => {
        return {
          ...prevConversation,
          messages: [
            ...prevConversation.messages,
            { sender: "user", text: message },
          ],
        };
      });
      setMessage(""); // Clear message input
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-gradient-to-b from-blue-500 to-blue-700 text-white p-6 shadow-lg">
        <h2 className="text-3xl font-semibold mb-6">Conversations</h2>
        <div className="space-y-4 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleSelectConversation(conversation)}
              className={`p-3 rounded-lg cursor-pointer hover:bg-blue-400 transition-all ${
                activeConversation?.id === conversation.id ? "bg-blue-600" : ""
              }`}
            >
              <p className="text-xl">{conversation.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-gray-50 p-6 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {activeConversation.messages.map((msg: any, index: number) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg max-w-xs ${
                    msg.sender === "user"
                      ? "self-end bg-blue-500 text-white"
                      : "self-start bg-gray-300 text-gray-800"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex space-x-3 items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Type a message..."
              />
              <Button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
              >
                Send
              </Button>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-full text-xl text-gray-500">
            <p>Select a conversation to start chatting!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/chatPage",
    component: ChatPage,
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) {
        return redirect({ to: "/" });
      }
    },
  });
