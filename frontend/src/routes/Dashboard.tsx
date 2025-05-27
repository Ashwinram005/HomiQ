import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createRoute,
  redirect,
  RootRoute,
  useNavigate,
} from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

import { isAuthenticated, logout } from "@/lib/auth";
import { Home, PlusCircle, LayoutDashboard, LogOut, User } from "lucide-react";

export const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      const auth = await isAuthenticated();
      if (auth) setUser(auth.user);
      else navigate({ to: "/" });
    };
    checkAuthentication();
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
    localStorage.clear();
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const goTo = (path: string) => navigate({ to: path });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white bg-opacity-90 backdrop-blur-md border-b border-gray-200 px-8 py-5 flex justify-between items-center shadow-md sticky top-0 z-30">
        <h1 className="text-3xl font-extrabold text-indigo-700 tracking-wide select-none">
          🏠 Welcome, {user?.name || "User"}
        </h1>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate({ to: "/chat" })}
            className="p-2 bg-white text-blue-600 hover:bg-gray-100 border border-gray-300 rounded-full"
            variant="ghost"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>

          <div className="relative">
            <Button
              onClick={toggleDropdown}
              className="flex items-center gap-2 p-2 bg-blue-600 text-white rounded-lg"
            >
              {user?.name || "User"} <span>&#9660;</span>
            </Button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg">
                <button
                  onClick={handleLogout}
                  className="block px-4 py-2 text-gray-800"
                >
                  Logout
                </button>
                <button
                  onClick={() => navigate({ to: "/profile" })}
                  className="block px-4 py-2 text-gray-800"
                >
                  Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-14 px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card: Post a Room */}
          <div
            onClick={() => goTo("/post")}
            tabIndex={0}
            role="button"
            className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl cursor-pointer transition-transform transform hover:-translate-y-1 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-indigo-300"
            aria-label="Post a Room"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") goTo("/post");
            }}
          >
            <div className="flex items-center mb-5 text-indigo-600">
              <PlusCircle size={26} className="mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Post a Room</h2>
            </div>
            <p className="text-gray-600 mb-6 text-lg">
              Create a new room listing to rent or share.
            </p>
            <Button
              variant="secondary"
              className="w-full text-indigo-700 hover:bg-indigo-100 border-indigo-300"
            >
              Post Now
            </Button>
          </div>

          {/* Card: My Posts */}
          <div
            onClick={() => goTo("/myposts")}
            tabIndex={0}
            role="button"
            className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl cursor-pointer transition-transform transform hover:-translate-y-1 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-emerald-300"
            aria-label="My Posts"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") goTo("/myposts");
            }}
          >
            <div className="flex items-center mb-5 text-emerald-600">
              <LayoutDashboard size={26} className="mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">My Posts</h2>
            </div>
            <p className="text-gray-600 mb-6 text-lg">
              View and manage your listed rooms.
            </p>
            <Button
              variant="secondary"
              className="w-full text-emerald-700 hover:bg-emerald-100 border-emerald-300"
            >
              View Posts
            </Button>
          </div>

          {/* Card: Browse Rooms */}
          <div
            onClick={() => goTo("/otherposts")}
            tabIndex={0}
            role="button"
            className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl cursor-pointer transition-transform transform hover:-translate-y-1 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-purple-300"
            aria-label="Browse Rooms"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") goTo("/otherposts");
            }}
          >
            <div className="flex items-center mb-5 text-purple-600">
              <Home size={26} className="mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Browse Rooms</h2>
            </div>
            <p className="text-gray-600 mb-6 text-lg">
              Explore available rooms posted by others.
            </p>
            <Button
              variant="secondary"
              className="w-full text-purple-700 hover:bg-purple-100 border-purple-300"
            >
              Browse Now
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

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
