import React, { useState } from "react";
import { Button } from "@/components/ui/button"; // Adjust import as needed for your Button component
import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";

export const ChatPage = () => {
  const [conversations, setConversations] = useState<any[]>([
    {
      id: 1,
      name: "Room 1",
      messages: [{ sender: "user", text: "Hello!" }],
      avatar: "https://via.placeholder.com/40",
    },
    {
      id: 2,
      name: "Room 2",
      messages: [{ sender: "owner", text: "Hi!" }],
      avatar: "https://via.placeholder.com/40",
    },
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
      <div className="w-80 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white p-6 shadow-lg rounded-l-lg flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Chats</h2>
          <input
            type="text"
            placeholder="Search"
            className="p-2 rounded-lg bg-white text-black border focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="space-y-4 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleSelectConversation(conversation)}
              className={`flex items-center p-4 rounded-lg cursor-pointer hover:bg-indigo-700 transition-all ${
                activeConversation?.id === conversation.id
                  ? "bg-indigo-700"
                  : ""
              }`}
            >
              <img
                src={conversation.avatar}
                alt="avatar"
                className="w-12 h-12 rounded-full mr-4"
              />
              <div>
                <p className="text-lg font-medium">{conversation.name}</p>
                <p className="text-sm text-gray-300">
                  {conversation.messages[conversation.messages.length - 1].text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 p-6 flex flex-col bg-white shadow-lg rounded-r-lg">
        {activeConversation ? (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4">
              {activeConversation.messages.map((msg: any, index: number) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg max-w-[80%] ${
                    msg.sender === "user"
                      ? "self-end bg-indigo-600 text-white"
                      : "self-start bg-gray-200 text-gray-800"
                  } shadow-lg transition-all`}
                >
                  <div className="flex items-center space-x-2">
                    <img
                      src={
                        msg.sender === "user"
                          ? "https://via.placeholder.com/40"
                          : "https://via.placeholder.com/40"
                      }
                      alt="avatar"
                      className="w-8 h-8 rounded-full"
                    />
                    <p className="text-sm text-gray-500">{msg.sender}</p>
                  </div>
                  <p>{msg.text}</p>
                  <div className="text-xs text-gray-400 mt-1">12:45 PM</div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex items-center space-x-3 border-t pt-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 p-3 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Type a message..."
                rows={2}
              />
              <Button
                onClick={handleSendMessage}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all"
              >
                Send
              </Button>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-full text-lg text-gray-500">
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
