import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PostCard from "./PostCard";
import {
  Wifi,
  Snowflake,
  Car,
  Home,
  Tv,
  Refrigerator,
  Sun,
  Moon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import {
  createRoute,
  redirect,
  RootRoute,
  useNavigate,
} from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { useInfiniteQuery } from "@tanstack/react-query";

const amenitiesList = [
  { key: "wi-fi", label: "Wi-Fi", icon: <Wifi size={16} /> },
  { key: "ac", label: "AC", icon: <Snowflake size={16} /> },
  { key: "parking", label: "Parking", icon: <Car size={16} /> },
  { key: "laundry", label: "Laundry", icon: <Home size={16} /> },
  { key: "tv", label: "TV", icon: <Tv size={16} /> },
  {
    key: "refrigerator",
    label: "Refrigerator",
    icon: <Refrigerator size={16} />,
  },
];

export const OtherPosts = () => {
  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver | null>(null);

  // Theme state & toggle
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const [filters, setFilters] = useState({
    searchQuery: "",
    locationQuery: "",
    priceFilter: "all",
    roomTypeFilter: "all",
    occupancyFilter: "all",
    availableFrom: "",
    amenityFilters: [] as string[],
  });

  const [tempFilters, setTempFilters] = useState(filters);

  const toggleAmenity = (amenity: string) => {
    setTempFilters((prev) => ({
      ...prev,
      amenityFilters: prev.amenityFilters.includes(amenity)
        ? prev.amenityFilters.filter((a) => a !== amenity)
        : [...prev.amenityFilters, amenity],
    }));
  };

  const fetchOtherPosts = async ({ pageParam = 1 }) => {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `http://localhost:5000/api/posts/others?page=${pageParam}&limit=7`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: filters,
      }
    );
    return res.data;
  };

  const {
    data: posts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["otherposts", filters],
    queryFn: fetchOtherPosts,
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
  });

  const allPosts = posts?.pages.flatMap((page) => page?.posts || []) || [];
  const filteredPosts = allPosts;
  const lastPostRef = useRef(null);

  useEffect(() => {
    if (isLoading || !hasNextPage) return;

    const options = {
      root: null,
      rootMargin: "100px",
      threshold: 1.0,
    };

    observer.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, options);

    if (lastPostRef.current) {
      observer.current.observe(lastPostRef.current);
    }

    return () => {
      if (observer.current && lastPostRef.current) {
        observer.current.unobserve(lastPostRef.current);
      }
    };
  }, [isLoading, hasNextPage, fetchNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen p-6 lg:p-8 transition-all ${
        isDark
          ? "bg-gradient-to-tr from-gray-900 to-gray-800 text-white"
          : "bg-gradient-to-tr from-sky-50 to-indigo-100 text-black"
      }`}
    >
      {/* Theme toggle button fixed top-right */}
      <div className="fixed top-6 right-6 z-50 mt-3">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full shadow transition ${
            isDark
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun size={20} className="text-yellow-400" />
          ) : (
            <Moon size={20} className="text-blue-600" />
          )}
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div
          className={`shadow-xl rounded-2xl p-6 h-fit sticky top-4 transition ${
            isDark ? "bg-gray-800 text-white" : "bg-white text-black"
          }`}
        >
          <h2 className="text-2xl font-bold mb-4">Filters</h2>
          <input
            className={`w-full mb-3 px-4 py-2 border rounded-md ${
              isDark
                ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                : "bg-white text-black border-gray-300"
            }`}
            placeholder="Search by title or description"
            value={tempFilters.searchQuery}
            onChange={(e) =>
              setTempFilters({ ...tempFilters, searchQuery: e.target.value })
            }
          />
          <input
            className={`w-full mb-3 px-4 py-2 border rounded-md ${
              isDark
                ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                : "bg-white text-black border-gray-300"
            }`}
            placeholder="Location"
            value={tempFilters.locationQuery}
            onChange={(e) =>
              setTempFilters({ ...tempFilters, locationQuery: e.target.value })
            }
          />
          <select
            className={`w-full mb-3 px-4 py-2 border rounded-md ${
              isDark
                ? "bg-gray-700 text-white border-gray-600"
                : "bg-white text-black border-gray-300"
            }`}
            value={tempFilters.priceFilter}
            onChange={(e) =>
              setTempFilters({ ...tempFilters, priceFilter: e.target.value })
            }
          >
            <option value="all">All Prices</option>
            <option value="2500">Under ₹2500</option>
            <option value="4000">Under ₹4000</option>
            <option value="6000">Under ₹6000</option>
          </select>
          <select
            className={`w-full mb-3 px-4 py-2 border rounded-md ${
              isDark
                ? "bg-gray-700 text-white border-gray-600"
                : "bg-white text-black border-gray-300"
            }`}
            value={tempFilters.roomTypeFilter}
            onChange={(e) =>
              setTempFilters({ ...tempFilters, roomTypeFilter: e.target.value })
            }
          >
            <option value="all">All Room Types</option>
            <option value="Room">Room</option>
            <option value="House">House</option>
            <option value="PG">PG</option>
            <option value="Shared">Shared</option>
          </select>
          <select
            className={`w-full mb-3 px-4 py-2 border rounded-md ${
              isDark
                ? "bg-gray-700 text-white border-gray-600"
                : "bg-white text-black border-gray-300"
            }`}
            value={tempFilters.occupancyFilter}
            onChange={(e) =>
              setTempFilters({
                ...tempFilters,
                occupancyFilter: e.target.value,
              })
            }
          >
            <option value="all">All Occupancy</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Triple">Triple</option>
            <option value="Any">Any</option>
          </select>
          <input
            type="date"
            className={`w-full mb-4 px-4 py-2 border rounded-md ${
              isDark
                ? "bg-gray-700 text-white border-gray-600"
                : "bg-white text-black border-gray-300"
            }`}
            value={tempFilters.availableFrom}
            onChange={(e) =>
              setTempFilters({ ...tempFilters, availableFrom: e.target.value })
            }
          />
          <div className="mb-2 font-semibold text-sm text-indigo-600">
            Amenities
          </div>
          <div className="flex flex-wrap gap-2">
            {amenitiesList.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => toggleAmenity(key)}
                className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full border transition-all ${
                  tempFilters.amenityFilters.includes(key)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : isDark
                    ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFilters(tempFilters)}
            className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
          >
            Apply Filters
          </button>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h1
              className={`text-3xl font-bold ${
                isDark ? "text-indigo-300" : "text-indigo-800"
              }`}
            >
              🏡 Explore Available Rooms
            </h1>

            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="px-6 py-3 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
          {filteredPosts.length === 0 ? (
            <p
              className={`text-center ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              No rooms found matching the filters.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredPosts.map((post, index) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    lastPostRef={
                      index === filteredPosts.length - 1 ? lastPostRef : null
                    }
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
          {isFetchingNextPage && (
            <div className="flex justify-center items-center py-4">
              <p className="text-indigo-600 font-semibold">Loading more...</p>
            </div>
          )}
          {!hasNextPage && (
            <div className="flex justify-center items-center py-4">
              <p
                className={`text-center ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No more posts available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/otherposts",
    component: OtherPosts,
    getParentRoute: () => parentRoute,
    validateSearch: (search) => ({
      otherUserId: search.otherUserId as string,
    }),
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) return redirect({ to: "/" });
    },
  });
