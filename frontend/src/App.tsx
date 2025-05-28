// src/App.tsx
import { Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import LandingPage from "./routes/LandingPage";

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <LandingPage />
      <Outlet />
    </>
  );
}
