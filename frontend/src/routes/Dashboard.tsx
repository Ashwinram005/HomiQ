import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createRoute,
  redirect,
  RootRoute,
  useNavigate,
} from "@tanstack/react-router";
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
  };

  const goTo = (path: string) => navigate({ to: path });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white bg-opacity-90 backdrop-blur-md border-b border-gray-200 px-8 py-5 flex justify-between items-center shadow-md sticky top-0 z-30">
        <h1 className="text-3xl font-extrabold text-indigo-700 tracking-wide select-none">
          🏠 Welcome, {user?.name || "User"}
        </h1>
        <div className="relative">
          <Button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            variant="outline"
            className="text-indigo-700 font-semibold tracking-wide px-4 py-2 rounded-lg hover:bg-indigo-50 transition"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            {user?.name || "User"}
          </Button>
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-40 animate-fade-in"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu-button"
              tabIndex={-1}
            >
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  goTo("/profile");
                }}
                className="w-full px-5 py-3 text-left flex items-center gap-3 text-indigo-700 hover:bg-indigo-100 rounded-t-xl transition"
                role="menuitem"
                tabIndex={0}
              >
                <User size={18} /> Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-5 py-3 text-left flex items-center gap-3 text-red-600 hover:bg-red-100 rounded-b-xl transition"
                role="menuitem"
                tabIndex={0}
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          )}
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
