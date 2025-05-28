import { Outlet } from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      {/* Possibly add header/nav here */}
      <Outlet />
    </>
  );
}
