import { isAuthenticated } from "@/lib/auth";
import { createRoute, redirect, RootRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Wifi, Car, Home, CheckCircle, Snowflake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  type: "single" | "shared" | "apartment";
  images: string[];
  amenities: string[];
  occupancy: string;
  furnished: boolean;
  postedBy?: {
    email?: string;
  };
}

export const OtherPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [availableFrom, setAvailableFrom] = useState("");

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
    .filter(
      (post) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((post) => {
      if (priceFilter !== "all") {
        const max = parseInt(priceFilter);
        if (post.price > max) return false;
      }
      if (roomTypeFilter !== "all" && post.type !== roomTypeFilter) {
        return false;
      }
      if (
        availableFrom &&
        new Date(post.availableFrom) < new Date(availableFrom)
      ) {
        return false;
      }
      if (
        amenityFilters.length > 0 &&
        !amenityFilters.every((amenity) => post.amenities.includes(amenity))
      ) {
        return false;
      }
      return true;
    });

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6)
          .fill(0)
          .map((_, idx) => (
            <Skeleton key={idx} className="h-80 rounded-xl" />
          ))}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="bg-white rounded-2xl shadow p-4 lg:sticky top-6 h-fit">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Filters</h2>

          <input
            type="text"
            placeholder="Search by title or location..."
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:border-blue-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Prices</option>
            <option value="2500">Under ₹2500</option>
            <option value="4000">Under ₹4000</option>
            <option value="6000">Under ₹6000</option>
          </select>

          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Room Types</option>
            <option value="single">Single</option>
            <option value="shared">Shared</option>
            <option value="apartment">Apartment</option>
          </select>

          <input
            type="date"
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg"
            value={availableFrom}
            onChange={(e) => setAvailableFrom(e.target.value)}
          />

          <div className="text-sm font-medium mb-2">Amenities:</div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "wifi", icon: <Wifi size={16} /> },
              { key: "ac", icon: <Snowflake size={16} /> },
              { key: "parking", icon: <Car size={16} /> },
              { key: "furnished", icon: <Home size={16} /> },
              { key: "washingMachine", icon: <CheckCircle size={16} /> },
            ].map(({ key, icon }) => (
              <button
                key={key}
                className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 ${
                  amenityFilters.includes(key)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => toggleAmenity(key)}
              >
                {icon}
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Room Listings */}
        <div className="lg:col-span-3">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            🏡 Explore Rooms & Houses Available for Rent
          </h1>

          {filteredPosts.length === 0 ? (
            <div className="text-gray-500">No rooms found.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredPosts.map((post) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl shadow-lg border hover:shadow-xl overflow-hidden"
                  >
                    {post.images && post.images.length > 0 && (
                      <img
                        src={post.images[0]}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                      <p className="text-sm text-gray-500">{post.location}</p>
                      <p className="text-blue-600 font-bold text-sm mt-1">
                        ₹{post.price} / month
                      </p>
                      <p className="text-xs text-gray-500">
                        Available:{" "}
                        {format(new Date(post.availableFrom), "dd MMM yyyy")}
                      </p>
                      <p className="text-xs capitalize text-gray-600">
                        {post.type}
                      </p>
                      <p className="text-xs mt-1 text-gray-500">
                        {post.amenities.join(", ") || "No amenities"}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        <strong>Posted By:</strong>{" "}
                        {post.postedBy?.email || "Unknown"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
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
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) {
        return redirect({ to: "/" });
      }
    },
  });
