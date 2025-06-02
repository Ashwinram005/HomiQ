import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PostCard from "./PostCard"; // Ensure this import path is correct
import {
  Wifi,
  Snowflake,
  Car,
  Home,
  Tv,
  Refrigerator,
  Sun,
  Moon,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"; // Ensure this import path is correct
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  useEffect(() => {
    if (isSidebarOpen && !isDesktop) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen, isDesktop]);

  useEffect(() => {
    const handleResize = () => {
      const currentIsDesktop = window.innerWidth >= 1024;
      setIsDesktop(currentIsDesktop);

      if (currentIsDesktop && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarOpen]);

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

  const toggleAmenity = useCallback((amenity: string) => {
    setTempFilters((prev) => ({
      ...prev,
      amenityFilters: prev.amenityFilters.includes(amenity)
        ? prev.amenityFilters.filter((a) => a !== amenity)
        : [...prev.amenityFilters, amenity],
    }));
  }, []);

  const applyFilters = useCallback(() => {
    setFilters(tempFilters);
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  }, [tempFilters, isDesktop]);

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
    isFetching,
  } = useInfiniteQuery({
    queryKey: ["otherposts", filters],
    queryFn: fetchOtherPosts,
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
    refetchOnWindowFocus: false,
  });

  const allPosts = posts?.pages.flatMap((page) => page?.posts || []) || [];

  const lastPostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isLoading || isFetchingNextPage || !hasNextPage) return;

    const currentLastPostRef = lastPostRef.current;
    if (!currentLastPostRef) return;

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

    observer.current.observe(currentLastPostRef);

    return () => {
      if (observer.current && currentLastPostRef) {
        observer.current.unobserve(currentLastPostRef);
      }
    };
  }, [isLoading, hasNextPage, fetchNextPage, isFetchingNextPage]);

  const isDark = theme === "dark";

  if (isLoading) {
    return (
      <div
        className={`min-h-screen p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8 ${
          isDark
            ? "bg-gradient-to-tr from-gray-900 to-gray-800"
            : "bg-gradient-to-tr from-sky-50 to-indigo-100"
        }`}
      >
        <div
          className={`h-96 rounded-2xl hidden lg:block shadow-lg ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <Skeleton
            className={`h-full rounded-2xl ${
              isDark ? "bg-gray-700" : "bg-gray-200"
            }`}
          />
        </div>
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton
                key={i}
                className={`h-80 rounded-xl shadow-md ${
                  isDark ? "bg-gray-700" : "bg-gray-200"
                }`}
              />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 lg:p-8 transition-all relative ${
        isDark
          ? "bg-gradient-to-tr from-gray-900 to-gray-800 text-white"
          : "bg-gradient-to-tr from-sky-50 to-indigo-100 text-black"
      }`}
    >
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full shadow-md transition-colors duration-300 ease-in-out transform hover:scale-105 ${
            isDark
              ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
              : "bg-white hover:bg-gray-100 text-gray-700"
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

      {!isDesktop && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className={`p-4 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105
                      flex items-center justify-center gap-2 text-white font-medium
                      ${
                        isDark
                          ? "bg-indigo-700 hover:bg-indigo-600"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
            aria-label="Open Filters"
            aria-expanded={isSidebarOpen}
          >
            <Filter size={24} />
            <span className="sr-only">Open Filters</span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {isSidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`
              fixed inset-0 z-40
              bg-black/20
              backdrop-blur-sm
            `}
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8 relative">
        <AnimatePresence>
          {(isSidebarOpen || isDesktop) && (
            <motion.div
              initial={!isDesktop ? { x: "100%" } : {}}
              animate={!isDesktop ? { x: 0 } : {}}
              exit={!isDesktop ? { x: "100%" } : {}}
              transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
              className={`
                ${
                  !isDesktop
                    ? "fixed inset-y-0 right-0 w-full max-w-xs sm:max-w-sm"
                    : "lg:relative lg:col-span-1 lg:sticky lg:top-8"
                }
                shadow-xl rounded-none lg:rounded-2xl p-6 lg:p-6 lg:h-fit z-50
                transition-colors duration-300 ease-in-out overflow-y-auto
                ${isDark ? "bg-gray-800 text-white" : "bg-white text-black"}
              `}
            >
              <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  Filters
                </h2>
                {!isDesktop && (
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className={`p-2 rounded-full transition-colors duration-200 transform hover:scale-110
                                ${
                                  isDark
                                    ? "hover:bg-gray-700 text-gray-300"
                                    : "hover:bg-gray-100 text-gray-700"
                                }`}
                    aria-label="Close Filters"
                  >
                    <X size={24} />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <input
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    isDark
                      ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                      : "bg-white text-black border-gray-300"
                  }`}
                  placeholder="Search by title or description"
                  value={tempFilters.searchQuery}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      searchQuery: e.target.value,
                    })
                  }
                  aria-label="Search by title or description"
                />
                <input
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    isDark
                      ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                      : "bg-white text-black border-gray-300"
                  }`}
                  placeholder="Location"
                  value={tempFilters.locationQuery}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      locationQuery: e.target.value,
                    })
                  }
                  aria-label="Filter by location"
                />
                <div className="relative">
                  <select
                    className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none pr-10 ${
                      isDark
                        ? "bg-gray-700 text-white border-gray-600"
                        : "bg-white text-black border-gray-300"
                    }`}
                    value={tempFilters.priceFilter}
                    onChange={(e) =>
                      setTempFilters({
                        ...tempFilters,
                        priceFilter: e.target.value,
                      })
                    }
                    aria-label="Filter by price"
                  >
                    <option value="all">All Prices</option>
                    <option value="2500">Under ₹2500</option>
                    <option value="4000">Under ₹4000</option>
                    <option value="6000">Under ₹6000</option>
                  </select>
                  <ChevronDown
                    size={20}
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                  />
                </div>
                <div className="relative">
                  <select
                    className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none pr-10 ${
                      isDark
                        ? "bg-gray-700 text-white border-gray-600"
                        : "bg-white text-black border-gray-300"
                    }`}
                    value={tempFilters.roomTypeFilter}
                    onChange={(e) =>
                      setTempFilters({
                        ...tempFilters,
                        roomTypeFilter: e.target.value,
                      })
                    }
                    aria-label="Filter by room type"
                  >
                    <option value="all">All Room Types</option>
                    <option value="Room">Room</option>
                    <option value="House">House</option>
                    <option value="PG">PG</option>
                    <option value="Shared">Shared</option>
                  </select>
                  <ChevronDown
                    size={20}
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                  />
                </div>
                <div className="relative">
                  <select
                    className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none pr-10 ${
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
                    aria-label="Filter by occupancy"
                  >
                    <option value="all">All Occupancy</option>
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Triple">Triple</option>
                    <option value="Any">Any</option>
                  </select>
                  <ChevronDown
                    size={20}
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                  />
                </div>
                <input
                  type="date"
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    isDark
                      ? "bg-gray-700 text-white border-gray-600"
                      : "bg-white text-black border-gray-300"
                  }`}
                  value={tempFilters.availableFrom}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      availableFrom: e.target.value,
                    })
                  }
                  aria-label="Filter by availability date"
                />
              </div>

              <div className="mt-6 mb-3 font-semibold text-sm text-indigo-600 dark:text-indigo-400">
                Amenities
              </div>
              <div className="flex flex-wrap gap-2">
                {amenitiesList.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => toggleAmenity(key)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border transition-all duration-200 ease-in-out hover:shadow-sm ${
                      tempFilters.amenityFilters.includes(key)
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : isDark
                        ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                    aria-pressed={tempFilters.amenityFilters.includes(key)}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
              <button
                onClick={applyFilters}
                className="mt-8 w-full bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors duration-300 ease-in-out font-semibold text-base shadow-lg transform hover:scale-[1.01]"
              >
                Apply Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1
              className={`text-2xl sm:text-3xl font-extrabold ${
                isDark ? "text-indigo-300" : "text-indigo-800"
              }`}
            >
              🏡 Explore Available Rooms
            </h1>

            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out text-sm sm:text-base font-medium transform hover:scale-105"
            >
              Go to Dashboard
            </button>
          </div>
          {allPosts.length === 0 && !isFetching ? (
            <p
              className={`text-center text-lg md:text-xl mt-10 p-6 rounded-xl border border-dashed ${
                isDark
                  ? "bg-gray-800 bg-opacity-60 text-gray-400 border-gray-700"
                  : "bg-white bg-opacity-80 text-gray-600 border-gray-300"
              }`}
            >
              <span className="block mb-2 text-3xl">😞</span>
              No rooms found matching your current filters.
              <span className="block mt-1">
                Try adjusting them or broaden your search!
              </span>
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {allPosts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    layout
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                      duration: 0.4,
                    }}
                  >
                    <PostCard
                      post={post}
                      lastPostRef={
                        index === allPosts.length - 1 ? lastPostRef : null
                      }
                      theme={theme} // <--- Pass the theme state here!
                    />
                  </motion.div>
                ))}
                {/* Skeleton loaders for fetching next page */}
                {isFetchingNextPage &&
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton
                        key={`skeleton-${i}`}
                        className={`h-80 rounded-xl shadow-md ${
                          isDark ? "bg-gray-700" : "bg-gray-200"
                        }`}
                      />
                    ))}
              </AnimatePresence>
            </div>
          )}
          {!hasNextPage && allPosts.length > 0 && (
            <div className="flex justify-center items-center py-8">
              <p
                className={`text-center text-md p-3 rounded-lg ${
                  isDark ? "text-gray-400 bg-gray-800" : "bg-gray-500 bg-white"
                }`}
              >
                ✨ You've reached the end! No more posts available.
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
