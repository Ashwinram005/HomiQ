// src/App.tsx
import { Outlet } from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      {/* You can put a <Header /> or nav here */}
      <Outlet />
    </>
  );
}
