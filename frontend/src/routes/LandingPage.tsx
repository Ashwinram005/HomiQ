import React, { useState, useEffect, useCallback, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash.debounce";
import { AuthForm } from "@/components/AuthForm";
import { Modal } from "@/components/Modal";
import { useNavigate } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import {
  Wifi,
  Snowflake,
  Car,
  Tv,
  Refrigerator,
  Home,
  Sun,
  Moon,
} from "lucide-react";

interface Post {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  type: string;
  images: string[];
  postedBy: { email: string };
  // Add other properties from your backend post model
  occupancy: string;
  furnished: boolean;
  availableFrom: string;
  amenities: string[];
}

const fetchPosts = async ({ pageParam = 1, queryKey }: any) => {
  const [_key, filters] = queryKey;
  const res = await axios.get(`http://localhost:5000/api/posts/all`, {
    params: {
      page: pageParam,
      limit: 6,
      searchQuery: filters.searchQuery,
      locationQuery: filters.locationQuery,
      priceFilter: filters.priceFilter,
      roomTypeFilter: filters.roomTypeFilter,
      occupancyFilter: filters.occupancyFilter,
      furnishedFilter: filters.furnishedFilter,
      availableFromFilter: filters.availableFromFilter,
      amenitiesFilter: filters.amenitiesFilter,
    },
  });
  return res.data;
};

const Navbar = ({
  toggleTheme,
  theme,
}: {
  toggleTheme: () => void;
  theme: string;
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState<"login" | "signup" | null>(null);

  const location = useLocation();

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open modal based on query param 'tab=login' or 'tab=signup'
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab === "login" || tab === "signup") {
      setModalOpen(tab);
      setOpen(false);
    }
  }, [location.search]);

  const isDark = theme === "dark";

  return (
    <nav
      className={`w-full px-6 py-4 shadow-lg flex justify-between items-center z-20 relative transition-colors duration-300 ${
        isDark ? "bg-gray-900 text-white" : "bg-white bg-opacity-95 text-black"
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src="https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/000000/external-home-real-estate-agency-flaticons-lineal-color-flat-icons.png"
          alt="RoomRental Logo"
          className="h-9 w-9 object-contain"
        />
        <h2
          className={`text-2xl font-extrabold select-none ${
            isDark ? "text-blue-400" : "text-blue-600"
          }`}
        >
          RoomRental
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-colors duration-300 ${
            isDark
              ? "hover:bg-gray-700 text-yellow-300"
              : "hover:bg-blue-100 text-blue-600"
          }`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className={`flex items-center gap-1 px-5 py-2 border rounded-lg font-semibold shadow-sm hover:bg-blue-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isDark
                ? "bg-gray-700 border-gray-600 text-blue-300 hover:bg-gray-600 focus:ring-blue-700 focus:ring-offset-gray-800"
                : "bg-blue-50 border-blue-300 text-blue-700 focus:ring-blue-400 focus:ring-offset-white"
            }`}
            aria-haspopup="true"
            aria-expanded={open}
            aria-label="Account menu"
          >
            Account <span className="text-sm">▼</span>
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`absolute right-0 mt-2 w-36 rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 z-10 ${
                  isDark ? "bg-gray-700" : "bg-white"
                }`}
              >
                <button
                  onClick={() => setModalOpen("login")}
                  className={`w-full text-left px-5 py-3 border-b border-gray-200 hover:bg-blue-50 font-medium rounded-t-xl transition-colors duration-150 ${
                    isDark
                      ? "text-blue-300 border-gray-600 hover:bg-gray-600 hover:text-blue-200"
                      : "text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setModalOpen("signup")}
                  className={`w-full text-left px-5 py-3 hover:bg-blue-50 font-medium rounded-b-xl transition-colors duration-150 ${
                    isDark
                      ? "text-blue-300 hover:bg-gray-600 hover:text-blue-200"
                      : "text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  Signup
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <Modal isOpen={modalOpen !== null} onClose={() => setModalOpen(null)}>
            <AuthForm className="max-w-md" defaultTab={modalOpen ?? "login"} />
          </Modal>
        </div>
      </div>
    </nav>
  );
};

const LandingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [occupancyFilter, setOccupancyFilter] = useState("all");
  const [furnishedFilter, setFurnishedFilter] = useState("all");
  const [availableFromFilter, setAvailableFromFilter] = useState("");
  const [amenitiesFilter, setAmenitiesFilter] = useState<string[]>([]);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      return newTheme;
    });
  };

  // Debounce search
  const debouncedFilter = useCallback(
    debounce((value) => setDebouncedSearch(value), 600),
    []
  );
  useEffect(() => {
    debouncedFilter(searchQuery);
  }, [searchQuery, debouncedFilter]);

  // Convert amenitiesFilter array to comma separated string for query params
  const amenitiesFilterStr = amenitiesFilter.join(",");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      "posts",
      {
        searchQuery: debouncedSearch,
        locationQuery,
        priceFilter,
        roomTypeFilter,
        occupancyFilter,
        furnishedFilter,
        availableFromFilter,
        amenitiesFilter: amenitiesFilterStr,
      },
    ],
    queryFn: fetchPosts,
    getNextPageParam: (lastPage: any, allPages: any) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
  });

  const handleAmenityChange = (amenity: string) => {
    setAmenitiesFilter((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`relative min-h-screen bg-cover bg-center transition-colors duration-300 ${
        isDark ? "bg-gray-900" : "bg-white"
      }`}
      style={{
        backgroundImage: isDark
          ? "none"
          : "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1470&q=80')",
      }}
    >
      <div
        className={`absolute inset-0 z-0 ${
          isDark
            ? "bg-gray-900 bg-opacity-90"
            : "bg-white bg-opacity-80 backdrop-blur-sm"
        }`}
      ></div>

      <div className="relative z-10">
        <Navbar toggleTheme={toggleTheme} theme={theme} />

        <div className="px-4 py-10 max-w-7xl mx-auto">
          <h1
            className={`text-3xl font-bold mb-6 text-center ${
              isDark ? "text-gray-200" : "text-gray-800"
            }`}
          >
            Available Rooms
          </h1>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Title Search */}
            <input
              type="text"
              placeholder="🔍 Search title or description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:ring-2 transition ${
                isDark
                  ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400 focus:ring-blue-700"
                  : "bg-white text-black border-gray-300 focus:ring-blue-400"
              }`}
            />

            {/* Location */}
            <input
              type="text"
              placeholder="📍 Location"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:ring-2 transition ${
                isDark
                  ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400 focus:ring-blue-700"
                  : "bg-white text-black border-gray-300 focus:ring-blue-400"
              }`}
            />

            {/* Price */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:ring-2 transition ${
                isDark
                  ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-700"
                  : "bg-white text-black border-gray-300 focus:ring-blue-400"
              }`}
            >
              <option value="all">💰 All Prices</option>
              <option value="3000">Below ₹3,000</option>
              <option value="5000">Below ₹5,000</option>
              <option value="8000">Below ₹8,000</option>
            </select>

            {/* Type */}
            <select
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:ring-2 transition ${
                isDark
                  ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-700"
                  : "bg-white text-black border-gray-300 focus:ring-blue-400"
              }`}
            >
              <option value="all">🏠 All Types</option>
              <option value="Room">Room</option>
              <option value="House">House</option>
              <option value="PG">PG</option>
              <option value="Shared">Shared</option>
            </select>

            {/* Occupancy */}
            <select
              value={occupancyFilter}
              onChange={(e) => setOccupancyFilter(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:ring-2 transition ${
                isDark
                  ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-700"
                  : "bg-white text-black border-gray-300 focus:ring-blue-400"
              }`}
            >
              <option value="all">👥 Occupancy</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Triple">Triple</option>
              <option value="Any">Any</option>
            </select>

            {/* Furnished */}
            <select
              value={furnishedFilter}
              onChange={(e) => setFurnishedFilter(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:ring-2 transition ${
                isDark
                  ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-700"
                  : "bg-white text-black border-gray-300 focus:ring-blue-400"
              }`}
            >
              <option value="all">🛋 Furnishing</option>
              <option value="true">Furnished</option>
              <option value="false">Unfurnished</option>
            </select>

            {/* Available From */}
            <input
              type="date"
              value={availableFromFilter}
              onChange={(e) => setAvailableFromFilter(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:ring-2 transition ${
                isDark
                  ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-700"
                  : "bg-white text-black border-gray-300 focus:ring-blue-400"
              }`}
            />
          </div>

          {/* Amenities Icons */}
          <div className="flex flex-wrap gap-4 mb-8">
            {[
              { name: "Wi-Fi", Icon: Wifi },
              { name: "Parking", Icon: Car },
              { name: "AC", Icon: Snowflake },
              { name: "Laundry", Icon: Home },
              { name: "TV", Icon: Tv },
              { name: "Refrigerator", Icon: Refrigerator },
            ].map(({ name, Icon }) => {
              const selected = amenitiesFilter.includes(name);
              return (
                <button
                  key={name}
                  onClick={() => handleAmenityChange(name)}
                  className={`
          flex items-center gap-2 px-3 py-2 border rounded-xl transition-all duration-200
          ${
            selected
              ? isDark
                ? "bg-blue-800 text-white border-blue-800 shadow"
                : "bg-blue-600 text-white border-blue-600 shadow"
              : isDark
              ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
          }
        `}
                  aria-pressed={selected}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      selected
                        ? isDark
                          ? "text-blue-300"
                          : "text-white"
                        : isDark
                        ? "text-blue-400"
                        : "text-blue-500"
                    }`}
                  />
                  <span className="capitalize">{name}</span>
                </button>
              );
            })}
          </div>
          {/* Posts */}
          {isLoading ? (
            <p
              className={`text-center ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Loading...
            </p>
          ) : isError ? (
            <div className="text-center text-red-500">
              <p>Something went wrong!</p>
              <p>{(error as any)?.message}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.pages?.flatMap((page: any) =>
                page?.posts?.map((post: Post) => (
                  <PostCard key={post._id} post={post} theme={theme} />
                ))
              )}
            </div>
          )}

          {hasNextPage && (
            <div className="mt-10 text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className={`px-6 py-2 font-semibold rounded-xl shadow transition duration-200 disabled:opacity-50 ${
                  isDark
                    ? "bg-blue-800 text-white hover:bg-blue-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post, theme }: { post: Post; theme: string }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!post.images || post.images.length < 2) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % post.images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [post.images]);

  const handleClick = () => {
    console.log("Card clicked");
    navigate({ to: `/room/${post._id}` });
  };
  return (
    <motion.div
      onClick={handleClick}
      className={`rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 cursor-pointer flex flex-col max-w-sm mx-auto ${
        isDark
          ? "bg-gray-800 text-white"
          : "bg-white bg-gradient-to-br from-indigo-50 to-blue-50"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.04 }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
    >
      <div className="relative w-full h-72 sm:h-80 md:h-72 overflow-hidden rounded-t-3xl">
        <img
          src={post.images?.[currentImage] || "/placeholder.jpg"}
          alt={post.title}
          className="w-full h-full object-cover object-center transition-transform duration-500"
        />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h2
          className={`text-2xl font-semibold truncate ${
            isDark ? "text-blue-300" : "text-gray-900"
          }`}
        >
          {post.title}
        </h2>
        <p
          className={`${
            isDark ? "text-gray-300" : "text-gray-700"
          } line-clamp-3 mt-2 flex-grow`}
        >
          {post.description}
        </p>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p
            className={`flex items-center text-base ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <span className="mr-2">📍</span> {post.location}
          </p>
          <p
            className={`${
              isDark ? "text-green-300" : "text-green-700"
            } font-extrabold text-lg sm:text-2xl`}
          >
            ₹{post.price}/mo
          </p>
        </div>

        <p
          className={`mt-4 text-sm italic select-none ${
            isDark ? "text-gray-500" : "text-gray-500"
          }`}
        >
          Posted by: {post.postedBy?.email ?? "Anonymous"}
        </p>
      </div>
    </motion.div>
  );
};

export default LandingPage;
