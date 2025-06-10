import React, { useState, useEffect, useCallback, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash.debounce";
import { AuthForm } from "@/components/AuthForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouseCircleCheck } from "@fortawesome/free-solid-svg-icons";

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
  Search,
  MapPin,
  DollarSign,
  Building,
  Users,
  Calendar,
  ChevronUp, // Added ChevronUp icon
  Loader2,
  Filter, // Added Filter icon
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
  setModalOpen,
}: {
  toggleTheme: () => void;
  theme: string;
  setModalOpen: (tab: "login" | "signup" | null) => void;
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  }, [location.search, setModalOpen]); // Add setModalOpen to dependencies

  const isDark = theme === "dark";

  return (
    <nav
      className={`w-full px-6 py-4 shadow-lg flex justify-between items-center z-20 relative transition-colors duration-300 ${
        isDark ? "bg-gray-900 text-white" : "bg-white bg-opacity-95 text-black"
      }`}
    >
      <div className="flex items-center gap-3">
        <FontAwesomeIcon  icon={faHouseCircleCheck} />
        <h2
          className={`text-2xl font-extrabold select-none ${
            isDark ? "text-blue-400" : "text-black"
          }`}
        >
          HomiQ
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full  transition-colors duration-300 ${
            isDark
              ? "hover:bg-gray-700 text-yellow-300"
              : "hover:bg-gray-300 text-blue-600"
          }`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={20} /> : <Moon className="text-black" size={20} />}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className={`flex items-center gap-1 px-3 sm:px-5 py-2 text-sm sm:text-base border rounded-lg font-semibold shadow-sm  transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isDark
                ? "bg-gray-700 border-gray-600 text-blue-300 hover:bg-gray-600 focus:ring-blue-700 focus:ring-offset-gray-800"
                : "bg-black  text-white "
            }`}
          >
            Account <span className="text-xs">▼</span>
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
                      : "text-black hover:bg-gray-300"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setModalOpen("signup")}
                  className={`w-full text-left px-5 py-3 hover:bg-blue-50 font-medium rounded-b-xl transition-colors duration-150 ${
                    isDark
                      ? "text-blue-300 border-gray-600 hover:bg-gray-600 hover:text-blue-200"
                      : "text-black hover:bg-gray-300"
                  }`}
                >
                  Signup
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
  const [showFilters, setShowFilters] = useState(false); // New state for filter visibility

  const [modalOpen, setModalOpen] = useState<"login" | "signup" | null>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");

    // Initialize showFilters based on screen size
    const handleResize = () => {
      setShowFilters(window.innerWidth >= 1024);
    };
    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
      initialPageParam: 1, // <-- Add this line
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
        backgroundImage:
          "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1470&q=80')",
      }}
    >
      {modalOpen && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-xs z-30 transition-opacity duration-300"></div>
      )}

      <div
        className={`relative z-10 transition-all duration-300 ${
          modalOpen ? "blur-xs pointer-events-none select-none" : ""
        }`}
      >
        <Navbar
          toggleTheme={toggleTheme}
          theme={theme}
          setModalOpen={setModalOpen}
        />
        {/* Pass setModalOpen */}
        <div className="px-4 py-10 max-w-7xl mx-auto">
          <h1 className={`text-4xl font-extrabold mb-8 text-center text-white`}>
            Find Your Space, Feel at Home.
          </h1>

          {/* Filters - Single Card Layout */}
          <div
            className={`mb-12 p-6 rounded-xl shadow-xl transition-all duration-300 ease-in-out ${
              isDark
                ? "bg-gray-800 border border-gray-700"
                : "bg-white border border-gray-200"
            }`}
          >
            {/* Filter Toggler for smaller screens */}
            <div className="flex justify-between items-center lg:hidden mb-4">
              <h3
                className={`text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Room Filters
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-full transition-colors duration-200 ${
                  isDark
                    ? "text-blue-300 hover:bg-gray-700"
                    : "text-blue-600 hover:bg-blue-100"
                }`}
                aria-expanded={showFilters}
                aria-controls="filter-section"
              >
                {showFilters ? <ChevronUp size={24} /> : <Filter size={24} />}
              </button>
            </div>

            {/* Filter Inputs - Initially hidden on smaller screens, always visible on lg */}
            <AnimatePresence>
              {(showFilters || window.innerWidth >= 1024) && (
                <motion.div
                  id="filter-section"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 lg:pt-0">
                    {/* Title Search */}
                    <div className="relative">
                      <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                        size={20}
                      />
                      <input
                        type="text"
                        placeholder="Search title or description"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark
                            ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400 focus:ring-blue-700"
                            : "bg-gray-100 text-gray-800 border-gray-300 placeholder-gray-500 focus:ring-blue-400"
                        }`}
                      />
                    </div>

                    {/* Location */}
                    <div className="relative">
                      <MapPin
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                        size={20}
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark
                            ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400 focus:ring-blue-700"
                            : "bg-gray-100 text-gray-800 border-gray-300 placeholder-gray-500 focus:ring-blue-400"
                        }`}
                      />
                    </div>

                    {/* Price */}
                    <div className="relative">
                      <DollarSign
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                        size={20}
                      />
                      <select
                        value={priceFilter}
                        onChange={(e) => setPriceFilter(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark
                            ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-700"
                            : "bg-gray-100 text-gray-800 border-gray-300 focus:ring-blue-400"
                        }`}
                      >
                        <option value="all">All Prices</option>
                        <option value="3000">Below ₹3,000</option>
                        <option value="5000">Below ₹5,000</option>
                        <option value="8000">Below ₹8,000</option>
                      </select>
                    </div>

                    {/* Type */}
                    <div className="relative">
                      <Building
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                        size={20}
                      />
                      <select
                        value={roomTypeFilter}
                        onChange={(e) => setRoomTypeFilter(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark
                            ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-700"
                            : "bg-gray-100 text-gray-800 border-gray-300 focus:ring-blue-400"
                        }`}
                      >
                        <option value="all">All Types</option>
                        <option value="Room">Room</option>
                        <option value="House">House</option>
                        <option value="PG">PG</option>
                        <option value="Shared">Shared</option>
                      </select>
                    </div>

                    {/* Occupancy */}
                    <div className="relative">
                      <Users
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                        size={20}
                      />
                      <select
                        value={occupancyFilter}
                        onChange={(e) => setOccupancyFilter(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark
                            ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-700"
                            : "bg-gray-100 text-gray-800 border-gray-300 focus:ring-blue-400"
                        }`}
                      >
                        <option value="all">Occupancy</option>
                        <option value="Single">Single</option>
                        <option value="Double">Double</option>
                        <option value="Triple">Triple</option>
                        <option value="Any">Any</option>
                      </select>
                    </div>

                    {/* Furnished */}
                    <div className="relative">
                      <Home
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                        size={20}
                      />
                      <select
                        value={furnishedFilter}
                        onChange={(e) => setFurnishedFilter(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark
                            ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-700"
                            : "bg-gray-100 text-gray-800 border-gray-300 focus:ring-blue-400"
                        }`}
                      >
                        <option value="all">Furnishing</option>
                        <option value="true">Furnished</option>
                        <option value="false">Unfurnished</option>
                      </select>
                    </div>

                    {/* Available From */}
                    <div className="relative">
                      <Calendar
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                        size={20}
                      />
                      <input
                        type="date"
                        value={availableFromFilter}
                        onChange={(e) => setAvailableFromFilter(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark
                            ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-700"
                            : "bg-gray-100 text-gray-800 border-gray-300 focus:ring-blue-400"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Amenities Icons - Professional Styling */}
                  <div className="flex flex-wrap gap-4 pt-6 border-t border-dashed mt-6">
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
          flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-200 text-sm font-medium
          ${
            selected
              ? isDark
                ? "bg-blue-800 text-white ring-2 ring-blue-500 hover:bg-blue-700"
                : "bg-blue-600 text-white ring-2 ring-blue-500 hover:bg-blue-700"
              : isDark
              ? "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-blue-50"
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Posts */}
          {isLoading ? (
            <p
              className={`text-center text-lg ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Loading awesome rooms...
            </p>
          ) : isError ? (
            <div className="text-center text-red-500 text-lg">
              <p>Oops! Something went wrong while fetching rooms.</p>
              <p>{(error as any)?.message}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {data?.pages?.flatMap((page: any) =>
                page?.posts?.map((post: Post) => (
                  <PostCard key={post._id} post={post} theme={theme} />
                ))
              )}
            </div>
          )}

          {hasNextPage && (
            <div className="mt-12 text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className={`px-8 py-3 font-semibold rounded-xl shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? "bg-blue-800 text-white hover:bg-blue-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isFetchingNextPage ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading More...
                  </span>
                ) : (
                  "Load More Rooms"
                )}
              </button>
            </div>
          )}
          {!hasNextPage && !isLoading && !isError && (
            <p
              className={`text-center mt-12 text-lg ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              You've seen all available rooms for these filters!
            </p>
          )}
        </div>
      </div>
      {/* Modal outside of the blur container with higher z-index */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md mx-auto">
            <AuthForm
              className="max-w-md"
              defaultTab={modalOpen ?? "login"}
              onClose={() => setModalOpen(null)}
            />
          </div>
        </div>
      )}
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
      className={`rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col max-w-screen w-full mx-auto h-full ${
        isDark
          ? "bg-gray-800 text-white border border-gray-700"
          : "bg-white bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
    >
      <div className="relative w-full h-72 sm:h-80 md:h-72 overflow-hidden rounded-t-3xl">
        {post.images && post.images.length > 0 ? (
          <img
            src={post.images[currentImage]}
            alt={post.title}
            className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Home size={60} className="text-gray-500" />
          </div>
        )}
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
          } mt-3 mb-4 text-sm`}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "3.6em", // ~3 lines of text at text-sm
          }}
        >
          {post.description}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-dashed pt-4">
          <p
            className={`flex items-center text-base ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <MapPin className="mr-2 h-5 w-5 text-blue-500" /> {post.location}
          </p>
          <p
            className={`${
              isDark ? "text-green-400" : "text-green-700"
            } font-extrabold text-xl sm:text-2xl`}
          >
            ₹{post.price}/mo
          </p>
        </div>

        <p
          className={`mt-4 text-xs italic select-none ${
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
