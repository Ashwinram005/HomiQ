import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Wifi,
  Snowflake,
  Car,
  Home,
  Tv,
  Refrigerator,
  ChevronLeft,
  ChevronRight,
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
import { Button } from "@/components/ui/button";
import { getUserIdFromToken } from "@/lib/getUserIdFromToken";

type ImageCarouselProps = {
  images: string[];
};

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

export const ImageCarousel = ({ images }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
  };

  return (
    <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg">
      <AnimatePresence initial={false}>
        <motion.img
          key={images[currentIndex]}
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="w-full h-full object-contain"
          initial={{ opacity: 0.5, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.4 }}
        />
      </AnimatePresence>

      {/* Prev Button */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrev}
          className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white/70 p-1 rounded-full hover:bg-white"
        >
          <ChevronLeft />
        </button>
      )}

      {/* Next Button */}
      {currentIndex < images.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white/70 p-1 rounded-full hover:bg-white"
        >
          <ChevronRight />
        </button>
      )}

      {/* Indicators */}
      <div className="absolute bottom-2 w-full flex justify-center gap-1">
        {images.map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full ${
              idx === currentIndex ? "bg-white" : "bg-white/50"
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export const OtherPosts = () => {
  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver | null>(null);
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

  const [selectedPost, setSelectedPost] = useState(null);
  console.log("Selected Post", selectedPost);
  // Fetch posts from backend using infinite query
  const fetchOtherPosts = async ({ pageParam = 1 }) => {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `http://localhost:5000/api/posts/others?page=${pageParam}&limit=7`, // Update this URL as needed
      {
        headers: { Authorization: `Bearer ${token}` },
        params: filters,
      }
    );
    console.log("recieved other post data", res.data);
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
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
  });

  const allPosts = posts?.pages.flatMap((page) => page?.posts || []) || [];
  const filteredPosts = allPosts;

  const toggleAmenity = (amenity) => {
    setTempFilters((prev) => ({
      ...prev,
      amenityFilters: prev.amenityFilters.includes(amenity)
        ? prev.amenityFilters.filter((a) => a !== amenity)
        : [...prev.amenityFilters, amenity],
    }));
  };

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

  const handleChatClick = () => {
    console.log("Selected Post", selectedPost._id);
    navigate({
      to: `/chat/${selectedPost._id}`,
      search: {
        otherUserId: selectedPost?.postedBy?._id,
      },
    });
  };
  const handleUserChatClick = () => {
    navigate({
      to: `/userchatpage`,
    });
  };

  return (
    <div className="bg-gradient-to-tr from-sky-50 to-indigo-100 min-h-screen p-6 lg:p-8">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="bg-white shadow-xl rounded-2xl p-6 h-fit sticky top-4">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4">Filters</h2>
          <input
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-md"
            placeholder="Search by title or description"
            value={tempFilters.searchQuery}
            onChange={(e) =>
              setTempFilters({ ...tempFilters, searchQuery: e.target.value })
            }
          />
          <input
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-md"
            placeholder="Location"
            value={tempFilters.locationQuery}
            onChange={(e) =>
              setTempFilters({ ...tempFilters, locationQuery: e.target.value })
            }
          />
          <select
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-md"
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
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-md"
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
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-md"
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
            className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md"
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
          <div className="mt-4 flex justify-center">
            <Button onClick={handleUserChatClick}>Chat with Owners</Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-indigo-800">
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
            <p className="text-gray-500">
              No rooms found matching the filters.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.03 }}
                    className="bg-white rounded-2xl shadow-md border hover:shadow-lg transition-all overflow-hidden"
                    ref={
                      index === filteredPosts.length - 1 ? lastPostRef : null
                    }
                  >
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
          {isFetchingNextPage && (
            <div className="flex justify-center items-center py-4">
              <p className="text-indigo-600 font-semibold">Loading more...</p>
            </div>
          )}
          {/* No more posts */}
          {!hasNextPage && (
            <div className="flex justify-center items-center py-4">
              <p className="text-gray-500">No more posts available.</p>
            </div>
          )}
        </div>
      </div>
      {/* Selected Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white max-w-2xl w-full p-6 rounded-xl relative overflow-y-auto max-h-[90vh]"
          >
            <button
              className="absolute top-3 right-2.5 text-black hover:text-gray-500 text-2xl z-10 hover:cursor-pointer"
              onClick={() => setSelectedPost(null)}
            >
              ×
            </button>
            <ImageCarousel images={selectedPost?.images || []} />

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedPost.title}
            </h2>
            <p className="text-gray-600 mb-3">{selectedPost.description}</p>
            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <strong>Posted By :</strong> {selectedPost.postedBy.email}
              </p>
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
              {selectedPost.postedBy?.email ? (
                <Button onClick={handleChatClick}>Chat with Owner</Button>
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
    validateSearch: (search) => ({
      otherUserId: search.otherUserId as string,
    }),

    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) return redirect({ to: "/" });
    },
  });
