import React from "react";
import { ChatList } from "./ChatList";
import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";

function EmptyChat() {
  return (
    <div className="flex-1 max-w-full flex flex-col md:flex-row gap-6 px-4 py-6">
      {/* Chat List Sidebar */}
      <ChatList />

      {/* Placeholder Chat Box */}
      <div className="w-full h-[90vh] flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="text-center px-6">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-100">
            Select a chat to start conversation
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Choose a user from the chat list to begin chatting.
          </p>
        </div>
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/chat",
    component: EmptyChat,
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) return redirect({ to: "/" });
    },
  });
