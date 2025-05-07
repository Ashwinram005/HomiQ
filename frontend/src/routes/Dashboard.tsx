import {
  createRoute,
  redirect,
  RootRoute,
  useNavigate,
} from "@tanstack/react-router";
import { isAuthenticated, logout } from "@/lib/auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

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

  const handlePostFeature = () => {
    navigate({ to: "/post" });
  };

  return (
    <div className="h-screen w-full bg-gray-100 flex flex-col">
      {/* Top Nav/Header */}
      <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {user?.name || "User"}!
        </h1>
        <Button
          variant="destructive"
          className="bg-red-600 hover:bg-red-700 text-white hover:cursor-pointer"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8 max-w-7xl mx-auto w-full">
        {/* Intro */}
        <section className="mb-8">
          <p className="text-lg text-gray-600">
            This is your dashboard. Access all your accommodation features here.
          </p>
        </section>

        {/* Actions */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Post a Room</h3>
            <p className="text-gray-500 mb-4">
              Create a new room listing to rent or share.
            </p>
            <Button
              className="bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white"
              onClick={handlePostFeature}
            >
              Post Now
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">My Posts</h3>
            <p className="text-gray-500 mb-4">
              View and manage the rooms you've posted.
            </p>
            <Button
              className="bg-gray-600 hover:bg-gray-700 text-white hover:cursor-pointer"
              onClick={() => navigate({ to: "/my-posts" })}
            >
              View Posts
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Browse Rooms</h3>
            <p className="text-gray-500 mb-4">
              Explore available rooms to rent or share.
            </p>
            <Button
              className="bg-gray-600 hover:bg-gray-700 text-white hover:cursor-pointer"
              onClick={() => navigate({ to: "/browse" })}
            >
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
