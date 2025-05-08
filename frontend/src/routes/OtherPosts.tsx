// Updated OtherPosts.tsx with professional and colorful UI
import { isAuthenticated } from "@/lib/auth";
import { createRoute, redirect, RootRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Wifi, Snowflake, Car, Home, Tv, Refrigerator } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";

interface Post {
  _id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  deposit: number;
  availableFrom: string;
  type: "Room" | "House" | "PG" | "Shared";
  images: string[];
  amenities: string[];
  occupancy: "Single" | "Double" | "Triple" | "Any";
  furnished: boolean;
  postedBy?: { email?: string };
}

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [occupancyFilter, setOccupancyFilter] = useState("all");
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [availableFrom, setAvailableFrom] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5000/api/posts/others",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPosts(response.data);
      } catch (err) {
        console.error("Error loading posts", err);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  const toggleAmenity = (amenity: string) => {
    setAmenityFilters((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const filteredPosts = posts
    .filter((post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(
      (post) =>
        locationQuery === "" ||
        post.location.toLowerCase().includes(locationQuery.toLowerCase())
    )
    .filter(
      (post) => priceFilter === "all" || post.price <= parseInt(priceFilter)
    )
    .filter((post) => roomTypeFilter === "all" || post.type === roomTypeFilter)
    .filter(
      (post) => occupancyFilter === "all" || post.occupancy === occupancyFilter
    )
    .filter(
      (post) =>
        availableFrom === "" ||
        new Date(post.availableFrom) >= new Date(availableFrom)
    )
    .filter(
      (post) =>
        amenityFilters.length === 0 ||
        amenityFilters.every((a) =>
          post.amenities.map((x) => x.toLowerCase()).includes(a.toLowerCase())
        )
    );

  if (loading) {
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

  return (
    <div className="bg-gradient-to-tr from-sky-50 to-indigo-100 min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="bg-white shadow-xl rounded-2xl p-6 h-fit sticky top-4">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4">Filters</h2>

          <input
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-md"
            placeholder="Search by title or description"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <input
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-md"
            placeholder="Location"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
          />

          <select
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-md"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
          >
            <option value="all">All Prices</option>
            <option value="2500">Under ₹2500</option>
            <option value="4000">Under ₹4000</option>
            <option value="6000">Under ₹6000</option>
          </select>

          <select
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-md"
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
          >
            <option value="all">All Room Types</option>
            <option value="Room">Room</option>
            <option value="House">House</option>
            <option value="PG">PG</option>
            <option value="Shared">Shared</option>
          </select>

          <select
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-md"
            value={occupancyFilter}
            onChange={(e) => setOccupancyFilter(e.target.value)}
          >
            <option value="all">All Occupancy</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Triple">Triple</option>
            <option value="Any">Any</option>
          </select>

          <input
            type="date"
            className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md"
            value={availableFrom}
            onChange={(e) => setAvailableFrom(e.target.value)}
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
                  amenityFilters.includes(key)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <h1 className="text-3xl font-bold text-indigo-800 mb-6">
            🏡 Explore Available Rooms
          </h1>

          {filteredPosts.length === 0 ? (
            <p className="text-gray-500">
              No rooms found matching the filters.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredPosts.map((post) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.03 }}
                    className="bg-white rounded-2xl shadow-md border hover:shadow-lg transition-all overflow-hidden"
                  >
                    {post.images[0] && (
                      <img
                        src={post.images[0]}
                        alt=""
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500">{post.location}</p>
                      <p className="text-indigo-600 font-semibold mt-1">
                        ₹{post.price}/month
                      </p>
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="text-sm mt-2 text-indigo-700 hover:underline"
                      >
                        View Details
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {selectedPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white max-w-2xl w-full p-6 rounded-xl relative overflow-y-auto max-h-[90vh]"
          >
            <button
              className="absolute top-3 right-4 text-gray-400 hover:text-black text-2xl"
              onClick={() => setSelectedPost(null)}
            >
              &times;
            </button>
            {selectedPost.images[0] && (
              <img
                src={selectedPost.images[0]}
                className="w-full h-64 object-cover rounded-lg mb-4"
                alt="Room"
              />
            )}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedPost.title}
            </h2>
            <p className="text-gray-600 mb-3">{selectedPost.description}</p>
            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <strong>Location:</strong> {selectedPost.location}
              </p>
              <p>
                <strong>Price:</strong> ₹{selectedPost.price}
              </p>
              <p>
                <strong>Available From:</strong>{" "}
                {format(new Date(selectedPost.availableFrom), "dd MMM yyyy")}
              </p>
              <p>
                <strong>Type:</strong> {selectedPost.type}
              </p>
              <p>
                <strong>Occupancy:</strong> {selectedPost.occupancy}
              </p>
              <p>
                <strong>Furnished:</strong>{" "}
                {selectedPost.furnished ? "Yes" : "No"}
              </p>
              <p>
                <strong>Amenities:</strong>{" "}
                {selectedPost.amenities.join(", ") || "None"}
              </p>
              {/* Add Contact Button */}
              {selectedPost.postedBy?.email ? (
                <a
                  href={`mailto:${selectedPost.postedBy.email}?subject=Inquiry about ${selectedPost.title}&body=Hello, I am interested in the ${selectedPost.title}.`}
                  className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white text-center rounded-full hover:bg-indigo-700 transition-colors"
                >
                  Contact via Email
                </a>
              ) : (
                <p className="mt-4 text-red-600">
                  Email not available for contact.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/otherposts",
    component: OtherPosts,
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) return redirect({ to: "/" });
    },
  });
