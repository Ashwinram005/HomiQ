import React, { useState } from "react";
import { ChatList } from "./ChatList";
import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";

function EmptyChat() {
  const [openChatList, setOpenChatList] = useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar / ChatList */}
      {openChatList && (
        <div className="fixed inset-0 z-50 flex md:static md:inset-auto md:z-auto md:flex md:h-full">
          {/* Backdrop for mobile */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setOpenChatList(false)}
          />

          <div className="relative z-10 w-[80vw] max-w-sm md:w-80 h-full bg-white dark:bg-neutral-900">
            <ChatList setOpenChatList={setOpenChatList} />
          </div>
        </div>
      )}

      {/* Main Placeholder Chat Section */}
      <div
        className={`flex-1 h-full flex flex-col bg-white dark:bg-neutral-800 border-l border-gray-200 dark:border-neutral-700
        ${openChatList ? "hidden md:flex" : "flex"}`}
      >
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b dark:border-neutral-700 shadow-sm">
          <button
            className="mr-4 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
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

          <div className="flex-1 flex flex-col  ">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Chat Room
            </h2>
            <small className="text-sm text-gray-500 dark:text-gray-400">
              Select a chat to start conversation
            </small>
          </div>
        </div>

        {/* Placeholder Chat Box */}
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 mx-6 my-8">
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
