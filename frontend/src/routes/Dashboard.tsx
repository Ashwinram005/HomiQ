import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  MessageSquare,
  User,
  Home,
  DoorOpen,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import socket from "@/lib/socket";
import { createRoute, redirect, useNavigate } from "@tanstack/react-router";
import type { RootRoute } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";

function ConfirmLogout({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-[90%] max-w-sm shadow-xl border border-gray-300 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Confirm Session Termination
        </h3>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Are you certain you wish to end your session? Re-authentication will
          be required to access your personalized dashboard.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Retain Session
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Terminate Session
          </Button>
        </div>
      </div>
    </div>
  );
}

function useOutsideClick(
  ref: React.RefObject<HTMLDivElement>,
  callback: () => void
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}

export function Dashboard() {
  const email = localStorage.getItem("email");
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Valued Member";
  const queryClient = useQueryClient();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(profileMenuRef, () => setProfileMenuOpen(false));

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const initialTheme = prefersDark ? "dark" : "light";
      setTheme(initialTheme);
      document.documentElement.classList.toggle(
        "dark",
        initialTheme === "dark"
      );
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogout = async () => {
    if (socket.connected) socket.disconnect();
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    queryClient.clear();
    navigate({ to: "/" });
  };

  const onLogoutClick = () => setLogoutModalOpen(true);
  const onCancelLogout = () => setLogoutModalOpen(false);
  const onConfirmLogout = () => {
    setLogoutModalOpen(false);
    handleLogout();
  };

  const handleRoomPosting = () => navigate({ to: "/post" });
  const handleSearchRooms = () => navigate({ to: "/otherposts" });
  const handleMyRooms = () => navigate({ to: "/myposts" });

  const goToProfile = () => {
    setProfileMenuOpen(false);
    navigate({ to: `/profile` });
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center transition-colors duration-300 relative"
      style={{
        backgroundImage: `url('https://wallpaperaccess.com/full/2470869.jpg')`,
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black opacity-40"></div>

      <header className="relative z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg px-6 py-4 flex items-center justify-between sticky top-0 rounded-b-lg">
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 drop-shadow">
          Greetings, {username}!
        </h1>
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            className="gap-2 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 rounded-lg transition-all duration-200"
            onClick={() => navigate({ to: "/chat" })}
          >
            <MessageSquare size={20} />
            Engage in Chat
          </Button>
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen((open) => !open)}
              title={email || "User"}
              className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-haspopup="true"
              aria-expanded={profileMenuOpen}
              aria-label="User menu"
            >
              <User size={20} />
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 rounded-xl bg-white dark:bg-gray-800 shadow-xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
                <button
                  onClick={goToProfile}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <User size={18} />
                  View Profile
                </button>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700"></div>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onLogoutClick();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <LogOut size={18} />
                  End Session
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <ConfirmLogout
        isOpen={logoutModalOpen}
        onConfirm={onConfirmLogout}
        onCancel={onCancelLogout}
      />
      <main className="relative z-30 max-w-6xl mx-auto px-6 py-12 text-center">
        <h2 className="text-4xl font-extrabold text-white mb-4 drop-shadow-lg">
          Your Next Stay, Just a Click Away.
        </h2>
        <p className="text-lg text-gray-200 mb-12 drop-shadow">
          Explore Rooms, Flats, and PGs with Confidence.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <DashboardCard
            title="Present Your Residence"
            description="Effortlessly feature your available room to a network of prospective tenants."
            icon={<Home size={28} className="text-white" />}
            onClick={handleRoomPosting}
            color="bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            image="https://cdn.pixabay.com/photo/2016/11/18/17/20/living-room-1835923__480.jpg"
            buttonText="Showcase My Space"
          />
          <DashboardCard
            title="Explore Available Properties"
            description="Navigate through a curated collection of residences aligned with your criteria."
            icon={<Home size={28} className="text-white" />}
            onClick={handleSearchRooms}
            color="bg-gradient-to-br from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
            image="https://th.bing.com/th/id/OIP.Zk_i0JGaL6O9vftz0aI9AQAAAA?rs=1&pid=ImgDetMain"
            buttonText="Browse Residences"
          />
          <DashboardCard
            title="Oversee Your Portfolio"
            description="Maintain oversight of your listed properties and engage with interested parties."
            icon={<DoorOpen size={28} className="text-white" />}
            onClick={handleMyRooms}
            color="bg-gradient-to-br from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
            image="https://wallup.net/wp-content/uploads/2019/09/495651-interior-design-home-room-beautiful-arhitecture.jpg"
            buttonText="Administer Listings"
          />
        </div>
      </main>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  icon,
  onClick,
  color,
  image,
  buttonText,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
  image: string;
  buttonText: string;
}) {
  return (
    <Card className="rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-transform hover:scale-105 duration-300 cursor-pointer group">
      <div
        className="h-40 bg-cover bg-center group-hover:scale-110 transition-transform duration-300 ease-in-out"
        style={{ backgroundImage: `url(${image})` }}
      ></div>
      <CardHeader className="p-6 bg-white dark:bg-black">
        <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-white">
          <div
            className={`rounded-full p-3 ${color} flex items-center justify-center shadow-md`}
          >
            {icon}
          </div>
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600 text-md dark:text-gray-300 mt-3 text-base">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0 bg-white dark:bg-black">
        <Button
          size="lg"
          className={`w-full mt-4 rounded-xl text-white font-semibold py-3 shadow-lg ${color}`}
          onClick={onClick}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/dashboard",
    component: Dashboard,
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) {
        return redirect({ to: "/" });
      }
    },
  });
