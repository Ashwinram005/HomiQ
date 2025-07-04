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
  onCancel: () => void; // corrected type here
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onCancel} // pass function, don't call it here
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-xl border border-gray-300 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Confirm Session Termination
        </h3>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Are you certain you wish to end your session? Re-authentication will
          be required to access your personalized dashboard.
        </p>
        <div className="flex flex-col sm:flex-row justify-end gap-3">
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
  ref: React.RefObject<HTMLDivElement|null>,
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
    localStorage.removeItem("email");
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    navigate({ to: "/" });
  };

  const onLogoutClick = () => setLogoutModalOpen(true);
  const onCancelLogout = () => setLogoutModalOpen(false);
  const onConfirmLogout = () => {
    setLogoutModalOpen(false);
    handleLogout();
  };

  const handleRoomPosting = () => navigate({ to: "/post" });
  const handleSearchRooms = () => navigate({ to: "/otherposts", search: { otherUserId: "" } });
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

      <header className="relative z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 rounded-b-lg gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-800 dark:text-gray-100 drop-shadow text-center sm:text-left">
          Greetings, {username}!
        </h1>
        <div className="flex items-center gap-4 sm:gap-6">
          {" "}
          {/* Adjust gap */}
          <Button
            variant="ghost"
            // Keep gap-2 but remove sm:flex, and use responsive padding
            className="flex items-center gap-2 px-3 py-2 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 rounded-lg transition-all duration-200"
            onClick={() => navigate({ to: "/chat" })}
          >
            <MessageSquare className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />{" "}
            {/* Hide text on small screens, show on sm and up */}
            <span className="hidden sm:inline">Engage in Chat</span>
          </Button>
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen((open) => !open)}
              title={email || "User"}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg sm:text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" // Adjust size and text size
              aria-haspopup="true"
              aria-expanded={profileMenuOpen}
              aria-label="User menu"
            >
              <User className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />{" "}
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 mt-3 w-48 sm:w-56 rounded-xl bg-white dark:bg-gray-800 shadow-xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
                {" "}
                {/* Adjust width */}
                <button
                  onClick={goToProfile}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <User className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />{" "}
                  View Profile
                </button>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {theme === "light" ? (
                    <Moon className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />
                  ) : (
                    <Sun className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />
                  )}{" "}
                  {/* Adjust icon size */}
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
                  <LogOut className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" /> {/* Adjust icon size */}
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
      <main className="relative z-30 max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 text-center">
        {" "}
        {/* Adjust padding */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 md:mb-4 drop-shadow-lg">
          {" "}
          {/* Adjust text size */}
          Your Next Stay, Just a Click Away.
        </h2>
        <p className="text-base sm:text-lg text-gray-200 mb-8 md:mb-12 drop-shadow">
          {" "}
          {/* Adjust text size */}
          Explore Rooms, Flats, and PGs with Confidence.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {" "}
          {/* Adjust gap */}
          <DashboardCard
            title="Present Your Residence"
            description="Effortlessly feature your available room to a network of prospective tenants."
            icon={<Home
  className="w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] text-white" // Combined existing className
/>} // Adjust icon size
            onClick={handleRoomPosting}
            color="bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            image="https://cdn.pixabay.com/photo/2016/11/18/17/20/living-room-1835923__480.jpg"
            buttonText="Showcase My Space"
          />
          <DashboardCard
            title="Explore Available Properties"
            description="Navigate through a curated collection of residences aligned with your criteria."
            icon={<Home
  className="w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] text-white" // Combined existing className
/>} // Adjust icon size
            onClick={handleSearchRooms}
            color="bg-gradient-to-br from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
            image="https://th.bing.com/th/id/OIP.Zk_i0JGaL6O9vftz0aI9AQAAAA?rs=1&pid=ImgDetMain"
            buttonText="Browse Residences"
          />
          <DashboardCard
            title="Oversee Your Portfolio"
            description="Maintain oversight of your listed properties and engage with interested parties."
            icon={<DoorOpen
  className="w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] text-white" // Combined existing className
/>} // Adjust icon size
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
        className="h-32 sm:h-40 bg-cover bg-center group-hover:scale-110 transition-transform duration-300 ease-in-out" // Adjust height
        style={{ backgroundImage: `url(${image})` }}
      ></div>
      <CardHeader className="p-4 sm:p-6 bg-white dark:bg-black">
        {" "}
        {/* Adjust padding */}
        <CardTitle className="flex items-center gap-3 text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
          {" "}
          {/* Adjust text size */}
          <div
            className={`rounded-full p-2 sm:p-3 ${color} flex items-center justify-center shadow-md`} // Adjust padding
          >
            {icon}
          </div>
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300 mt-2 sm:mt-3 text-sm sm:text-base">
          {" "}
          {/* Adjust margin and text size */}
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 bg-white dark:bg-black">
        {" "}
        {/* Adjust padding */}
        <Button
          size="lg"
          className={`w-full mt-3 sm:mt-4 rounded-xl text-white font-semibold py-2 sm:py-3 shadow-lg ${color}`} // Adjust margin and padding
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
