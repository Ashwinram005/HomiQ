import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  createRoute,
  redirect,
  RootRoute,
  useNavigate,
} from "@tanstack/react-router";
import { isAuthenticated, logout } from "@/lib/auth";

export const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch user authentication and details
  useEffect(() => {
    const checkAuthentication = async () => {
      const auth = await isAuthenticated();
      if (auth) {
        setUser(auth.user);
      } else {
        navigate({ to: "/" });
      }
    };
    checkAuthentication();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handlePostFeature = () => {
    navigate({ to: "/post" });
  };

  const handleMyPosts = () => {
    navigate({ to: "/myposts" });
  };

  const handleBrowseRooms = () => {
    navigate({ to: "/browse" });
  };

  return (
    <div className="h-screen w-full bg-gray-100 flex flex-col">
      {/* Top Nav/Header */}
      <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {user?.name || "User"}!
        </h1>
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
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8 max-w-7xl mx-auto w-full">
        {/* Overview Stats */}
        <section className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Card 1 - Number of Rooms Posted */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Total Rooms Posted</h3>
            <p className="text-4xl font-bold text-blue-600">
              {user?.roomsPosted || 0}
            </p>
          </div>

          {/* Stats Card 2 - Inquiries Received */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Inquiries Received</h3>
            <p className="text-4xl font-bold text-green-600">
              {user?.inquiriesReceived || 0}
            </p>
          </div>

          {/* Stats Card 3 - Active Listings */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Active Listings</h3>
            <p className="text-4xl font-bold text-purple-600">
              {user?.activeListings || 0}
            </p>
          </div>
        </section>

        {/* Action Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition transform hover:scale-105 cursor-pointer"
            onClick={handlePostFeature}
          >
            <h3 className="text-xl font-semibold mb-2">Post a Room</h3>
            <p className="text-gray-500 mb-4">
              Create a new room listing to rent or share.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Post Now
            </Button>
          </div>

          <div
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition transform hover:scale-105 cursor-pointer"
            onClick={handleMyPosts}
          >
            <h3 className="text-xl font-semibold mb-2">My Posts</h3>
            <p className="text-gray-500 mb-4">
              View and manage the rooms you've posted.
            </p>
            <Button className="bg-gray-600  hover:cursor-pointer hover:bg-gray-700 text-white">
              View Posts
            </Button>
          </div>

          <div
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition transform hover:scale-105 cursor-pointer"
            onClick={handleBrowseRooms}
          >
            <h3 className="text-xl font-semibold mb-2">Browse Rooms</h3>
            <p className="text-gray-500 mb-4">
              Explore available rooms to rent or share.
            </p>
            <Button className="bg-gray-600 hover:bg-gray-700 text-white">
              Browse Now
            </Button>
          </div>
        </section>
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
