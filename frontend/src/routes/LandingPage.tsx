import React, { useState, useEffect, useCallback, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import debounce from "lodash.debounce";
import { AuthForm } from "@/components/AuthForm";
import { Modal } from "@/components/Modal";
import { useNavigate } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import { Wifi, Snowflake, Car, Tv, Refrigerator, Home } from "lucide-react";
interface Post {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  type: string;
  images: string[];
  postedBy: { email: string };
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

const Navbar = () => {
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

  return (
    <nav className="w-full px-6 py-4 bg-white bg-opacity-95 shadow-lg flex justify-between items-center z-20 relative">
      <div className="flex items-center gap-3">
        <img
          src="https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/000000/external-home-real-estate-agency-flaticons-lineal-color-flat-icons.png"
          alt="RoomRental Logo"
          className="h-9 w-9 object-contain"
        />
        <h2 className="text-2xl font-extrabold text-blue-600 select-none">
          RoomRental
        </h2>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-1 px-5 py-2 border border-blue-300 rounded-lg bg-blue-50 text-blue-700 font-semibold shadow-sm hover:bg-blue-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-haspopup="true"
          aria-expanded={open}
          aria-label="Account menu"
        >
          Account <span className="text-sm">▼</span>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 z-10">
            <button
              onClick={() => setModalOpen("login")}
              className="w-full text-left px-5 py-3 border-b border-gray-200 hover:bg-blue-50 text-blue-700 font-medium rounded-t-xl transition-colors duration-150"
            >
              Login
            </button>
            <button
              onClick={() => setModalOpen("signup")}
              className="w-full text-left px-5 py-3 hover:bg-blue-50 text-blue-700 font-medium rounded-b-xl transition-colors duration-150"
            >
              Signup
            </button>
          </div>
        )}

        <Modal isOpen={modalOpen !== null} onClose={() => setModalOpen(null)}>
          <AuthForm className="max-w-md" defaultTab={modalOpen ?? "login"} />
        </Modal>
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
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
  });

  const handleAmenityChange = (amenity: string) => {
    setAmenitiesFilter((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1470&q=80')",
      }}
    >
      <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-0"></div>

      <div className="relative z-10">
        <Navbar />

        <div className="px-4 py-10 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
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
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
            />

            {/* Location */}
            <input
              type="text"
              placeholder="📍 Location"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
            />

            {/* Price */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
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
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
            >
              <option value="all">🏠 All Types</option>
              <option value="Room">Room</option>
              <option value="House">House</option>
              <option value="PG">PG</option>
            </select>

            {/* Occupancy */}
            <select
              value={occupancyFilter}
              onChange={(e) => setOccupancyFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
            >
              <option value="all">👥 Occupancy</option>
              <option value="Single">Single</option>
              <option value="Shared">Shared</option>
            </select>

            {/* Furnished */}
            <select
              value={furnishedFilter}
              onChange={(e) => setFurnishedFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
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
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>

          {/* Amenities Icons */}
          <div className="flex flex-wrap gap-4 mb-8">
            {[
              { name: "wifi", Icon: Wifi },
              { name: "parking", Icon: Car },
              { name: "ac", Icon: Snowflake },
              { name: "laundry", Icon: Home },
              { name: "Tv", Icon: Tv },
              { name: "Refrigerator", Icon: Refrigerator },
            ].map(({ name, Icon }) => {
              const selected = amenitiesFilter.includes(name);
              return (
                <button
                  key={name}
                  onClick={() => handleAmenityChange(name)}
                  className={`
          flex items-center gap-2 px-3 py-2 border rounded-xl transition
          ${
            selected
              ? "bg-blue-600 text-white border-blue-600 shadow"
              : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
          }
        `}
                  aria-pressed={selected}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      selected ? "text-white" : "text-blue-500"
                    }`}
                  />
                  <span className="capitalize">{name}</span>
                </button>
              );
            })}
          </div>
          {/* Posts */}
          {isLoading ? (
            <p className="text-center">Loading...</p>
          ) : isError ? (
            <div className="text-center text-red-500">
              <p>Something went wrong!</p>
              <p>{(error as any)?.message}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.pages?.flatMap((page) =>
                page?.posts?.map((post: Post) => (
                  <PostCard key={post._id} post={post} />
                ))
              )}
            </div>
          )}

          {hasNextPage && (
            <div className="mt-10 text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl shadow hover:bg-blue-700 transition duration-200 disabled:opacity-50"
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

const PostCard = ({ post }: { post: Post }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate();

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
      className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 cursor-pointer flex flex-col max-w-sm mx-auto"
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
        <h2 className="text-2xl font-semibold text-gray-900 truncate">
          {post.title}
        </h2>
        <p className="text-gray-700 line-clamp-3 mt-2 flex-grow">
          {post.description}
        </p>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="flex items-center text-gray-600 text-base">
            <span className="mr-2">📍</span> {post.location}
          </p>
          <p className="text-green-700 font-extrabold text-lg sm:text-2xl">
            ₹{post.price}/mo
          </p>
        </div>

        <p className="mt-4 text-gray-500 text-sm italic select-none">
          Posted by: {post.postedBy?.email ?? "Anonymous"}
        </p>
      </div>
    </motion.div>
  );
};

export default LandingPage;
