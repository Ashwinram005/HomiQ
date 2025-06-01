import axios from "axios";
import { format } from "date-fns";
import {
  createRoute,
  redirect,
  useNavigate,
  type RootRoute,
} from "@tanstack/react-router";
import { Loader2, Sun, Moon } from "lucide-react"; // Spinner icon, Sun, and Moon

import toast from "react-hot-toast";
import { isAuthenticated } from "@/lib/auth";
import {
  MapPin,
  Calendar,
  IndianRupee,
  PencilLine,
  Trash2,
  ArrowLeft,
  Wifi,
  Snowflake,
  Car,
  Home,
  Tv,
  Refrigerator,
  Filter, // Added for mobile filter toggle
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRef, useCallback, useState, useEffect } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Toaster } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Import Sheet components

const PAGE_LIMIT = 4;

// Function to get theme from local storage
const getTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  }
  return "light";
};

// Function to set theme in local storage and update class on html element
const setTheme = (theme: "light" | "dark") => {
  if (typeof window !== "undefined") {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }
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

export const MyPosts = () => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false); // Using this for the delete modal state
  const navigate = useNavigate();
  const [showDeletingModal, setShowDeletingModal] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false); // State for mobile filter sheet

  // Theme state and logic
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(
    getTheme()
  );

  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentTheme(getTheme());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
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

  const fetchPosts = async ({ pageParam = 1 }) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `http://localhost:5000/api/posts/myPosts?page=${pageParam}&limit=${PAGE_LIMIT}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: filters,
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to fetch posts");
    }

    return {
      posts: response.data.posts,
      nextPage: response.data.hasMore ? pageParam + 1 : undefined,
    };
  };

  // Temp filters for controlled inputs before applying
  const [tempFilters, setTempFilters] = useState(filters);

  const toggleAmenity = (key: string) => {
    setTempFilters((prev) => {
      const exists = prev.amenityFilters.includes(key);
      if (exists) {
        return {
          ...prev,
          amenityFilters: prev.amenityFilters.filter((a) => a !== key),
        };
      } else {
        return { ...prev, amenityFilters: [...prev.amenityFilters, key] };
      }
    });
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setIsFilterSheetOpen(false); // Close sheet after applying filters on mobile
  };

  const resetFilters = () => {
    const defaultFilters = {
      searchQuery: "",
      locationQuery: "",
      priceFilter: "all",
      roomTypeFilter: "all",
      occupancyFilter: "all",
      availableFrom: "",
      amenityFilters: [],
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters); // Also apply the reset to the actual filters
    setIsFilterSheetOpen(false); // Close sheet after resetting filters on mobile
  };

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["myPosts", filters],
    queryFn: fetchPosts,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    refetchOnWindowFocus: false, // Prevents re-fetching on window focus, can be adjusted
  });

  //delete
  function getPublicIdFromUrl(url: string): string | null {
    try {
      const parts = url.split("/");
      const filename = parts.pop() || "";
      const folder = parts.pop() || "";
      return `${folder}/${filename.split(".")[0]}`;
    } catch {
      return null;
    }
  }

  async function handleDeletePostAndImages(postId: string, images: string[]) {
    const token = localStorage.getItem("token") || "";
    setLoading(true); // Set loading for the delete button
    try {
      setShowDeletingModal(true);
      toast.loading("Deleting images and post...", { id: "delete" });

      for (const imageUrl of images) {
        const publicId = getPublicIdFromUrl(imageUrl);
        if (publicId) {
          const res = await fetch(
            "http://localhost:5000/api/cloudinary/delete",
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ publicId }),
            }
          );

          if (!res.ok)
            throw new Error("Failed to delete image from Cloudinary");
        }
      }

      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete post");

      // ✅ Update cached posts
      queryClient.setQueryData(["myPosts", filters], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.filter((post: any) => post._id !== postId),
          })),
        };
      });

      toast.success("Post and images deleted successfully", { id: "delete" });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete post or images", { id: "delete" });
    } finally {
      setLoading(false); // Reset loading state
      setShowDeletingModal(false);
    }
  }

  // Wrapper for handleDeletePostAndImages to pass to AlertDialogAction
  const handleDelete = (post: any) => {
    handleDeletePostAndImages(post._id, post.images);
  };

  // Flatten pages of posts into a single array
  const posts = data?.pages.flatMap((page) => page.posts) || [];

  const observer = useRef<IntersectionObserver | null>(null);

  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  // Apply base background and text color to the main container based on theme
  const containerClasses = `min-h-screen transition-all ${
    currentTheme === "dark"
      ? "bg-gradient-to-tr from-gray-900 to-gray-800 text-white"
      : "bg-gradient-to-tr from-sky-50 to-indigo-100 text-black"
  }`;

  // Filter content component to reuse for both desktop and mobile sheet
  const FilterContent = () => (
    <div className="space-y-6">
      <h2
        className={`text-2xl font-bold mb-4 ${
          currentTheme === "dark" ? "text-indigo-300" : "text-indigo-700"
        }`}
      >
        Filters
      </h2>
      <input
        className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
          currentTheme === "dark"
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
        className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
          currentTheme === "dark"
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
      />
      <select
        className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
          currentTheme === "dark"
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
        className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
          currentTheme === "dark"
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
      >
        <option value="all">All Room Types</option>
        <option value="Room">Room</option>
        <option value="House">House</option>
        <option value="PG">PG</option>
        <option value="Shared">Shared</option>
      </select>
      <select
        className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
          currentTheme === "dark"
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
        className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
          currentTheme === "dark"
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
      />
      <div>
        <div
          className={`mb-2 font-semibold text-sm ${
            currentTheme === "dark" ? "text-indigo-300" : "text-indigo-600"
          }`}
        >
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
                  : currentTheme === "dark"
                  ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <Button
          variant="outline"
          className={`flex-1 ${
            currentTheme === "dark"
              ? "bg-gray-600 text-white border-gray-500 hover:bg-gray-500"
              : "bg-white text-black border-gray-300 hover:bg-gray-100"
          }`}
          onClick={resetFilters}
        >
          Reset
        </Button>
        <Button
          className={`flex-1 ${
            currentTheme === "dark"
              ? "bg-indigo-700 hover:bg-indigo-800"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
          onClick={applyFilters}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div
        className={`${containerClasses} max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6`}
      >
        {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
          <Card
            key={i}
            className={`space-y-4 p-4 ${
              currentTheme === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <Skeleton
              className={`h-40 w-full rounded-lg ${
                currentTheme === "dark" ? "bg-gray-700" : "bg-gray-200"
              }`}
            />
            <Skeleton
              className={`h-6 w-2/3 ${
                currentTheme === "dark" ? "bg-gray-700" : "bg-gray-200"
              }`}
            />
            <Skeleton
              className={`h-4 w-1/2 ${
                currentTheme === "dark" ? "bg-gray-700" : "bg-gray-200"
              }`}
            />
            <Skeleton
              className={`h-10 w-full ${
                currentTheme === "dark" ? "bg-gray-700" : "bg-gray-200"
              }`}
            />
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={`${containerClasses} text-center py-20 text-red-500 dark:text-red-400`}
      >
        Error loading posts. Please try again later.
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div
          className={`relative flex items-center justify-between gap-4 mb-10 sticky top-0 z-20 p-4 sm:p-5 rounded-2xl ${
            currentTheme === "dark" ? "bg-gray-700" : "bg-blue-400"
          }`}
        >
          {/* Left: Back Button & Mobile Filter Toggle */}
          <div className="flex items-center gap-2 z-10">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/dashboard" })}
              className={`flex gap-2 justify-center transition duration-300 ease-in-out transform hover:scale-105 ${
                currentTheme === "dark"
                  ? "bg-gray-600 text-white border-gray-500 hover:bg-indigo-700"
                  : "bg-white text-gray-800 border-gray-300 hover:bg-indigo-600 hover:text-white"
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            {/* Mobile Filter Button */}
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button
                  variant="outline"
                  className={`flex gap-2 transition duration-300 ease-in-out transform hover:scale-105 ${
                    currentTheme === "dark"
                      ? "bg-gray-600 text-white border-gray-500 hover:bg-indigo-700"
                      : "bg-white text-gray-800 border-gray-300 hover:bg-indigo-600 hover:text-white"
                  }`}
                >
                  <Filter className="w-4 h-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className={`w-[300px] sm:w-[350px] overflow-auto ${
                  currentTheme === "dark"
                    ? "bg-gray-800 text-white"
                    : "bg-white text-black"
                }`}
              >
                {/* Filter content inside the sheet */}
                {FilterContent()}
              </SheetContent>
            </Sheet>
          </div>

          {/* Center: Absolutely Positioned Title */}
          <h1
            className={` hidden sm:flex absolute left-1/2 transform -translate-x-1/2 text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-center whitespace-nowrap ${
              currentTheme === "dark" ? "text-indigo-300" : "text-indigo-900"
            }`}
          >
            🏡 Your Property Listings
          </h1>

          {/* Right: Theme Toggle */}
          <div className="z-10">
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors duration-200 ${
                currentTheme === "dark"
                  ? "bg-gray-600 text-gray-200 hover:bg-gray-500"
                  : "bg-white text-gray-700 hover:bg-gray-200"
              }`}
              aria-label="Toggle theme"
            >
              {currentTheme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr] gap-6">
          {/* Desktop Filter Sidebar */}
          <aside
            className={`hidden md:block shadow-xl rounded-2xl p-6 h-fit sticky top-20 ${
              currentTheme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-black"
            }`}
          >
            {FilterContent()}
          </aside>

          {/* Posts Grid */}
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div
                className={`text-center py-20 ${
                  currentTheme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <p className="text-lg">You haven't posted anything yet.</p>
                <p className="text-sm mt-2">
                  Start posting to showcase your listings!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post: any, index) => {
                  // Attach ref to last post for infinite scroll triggering
                  const isLastPost = index === posts.length - 1;
                  return (
                    <Card
                      key={post._id}
                      ref={isLastPost ? lastPostRef : null}
                      className={`flex flex-col justify-between shadow-xl border hover:shadow-2xl transition duration-300 rounded-xl overflow-hidden ${
                        currentTheme === "dark"
                          ? "bg-gray-700 border-gray-600 hover:border-blue-500 text-white"
                          : "bg-gradient-to-br from-indigo-100 to-blue-50 border-gray-300 hover:border-blue-500 text-black"
                      }`}
                    >
                      {post.images?.length > 0 ? (
                        <img
                          src={post.images[0]}
                          alt="Property"
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div
                          className={`h-48 flex justify-center items-center text-6xl ${
                            currentTheme === "dark"
                              ? "bg-gray-600 text-gray-400"
                              : "bg-gradient-to-br from-blue-100 to-blue-50"
                          }`}
                        >
                          🏠
                        </div>
                      )}

                      <CardContent className="space-y-3 py-4 px-5 flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <CardTitle
                            className={`text-xl font-semibold break-words ${
                              currentTheme === "dark"
                                ? "text-indigo-300"
                                : "text-indigo-800"
                            }`}
                          >
                            {post.title}
                          </CardTitle>
                          <Badge
                            className={`flex-shrink-0 capitalize p-2 text-sm font-medium ${
                              post.status === "Booked"
                                ? "bg-red-200 text-red-700 dark:bg-red-700 dark:text-red-200"
                                : "bg-green-200 text-green-700 dark:bg-green-700 dark:text-green-200"
                            }`}
                          >
                            {post.status || "Available"}
                          </Badge>
                        </div>

                        <div
                          className={`text-sm space-y-1 ${
                            currentTheme === "dark"
                              ? "text-gray-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar
                              className={`w-4 h-4 ${
                                currentTheme === "dark"
                                  ? "text-blue-300"
                                  : "text-blue-500"
                              }`}
                            />
                            <span>
                              Listed:{" "}
                              {format(new Date(post.createdAt), "dd MMM yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin
                              className={`w-4 h-4 ${
                                currentTheme === "dark"
                                  ? "text-green-300"
                                  : "text-green-600"
                              }`}
                            />
                            <span>{post.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IndianRupee
                              className={`w-4 h-4 ${
                                currentTheme === "dark"
                                  ? "text-yellow-300"
                                  : "text-yellow-500"
                              }`}
                            />
                            <span
                              className={`font-medium text-lg ${
                                currentTheme === "dark"
                                  ? "text-indigo-300"
                                  : "text-indigo-800"
                              }`}
                            >
                              ₹ {post.price?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            🏡<span>Type: {post.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            🛏️ <span>Occupancy: {post.occupancy}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            🛋️{" "}
                            <span>
                              Furnished: {post.furnished ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <strong>Available From: </strong>
                            <span>
                              {format(
                                new Date(post.availableFrom),
                                "dd MMM yyyy"
                              )}
                            </span>
                          </div>
                        </div>

                        <div>
                          <strong
                            className={`text-sm ${
                              currentTheme === "dark"
                                ? "text-white"
                                : "text-foreground"
                            }`}
                          >
                            Description:
                          </strong>
                          <p
                            className={`text-sm mt-1 ${
                              currentTheme === "dark"
                                ? "text-gray-400"
                                : "text-muted-foreground"
                            } line-clamp-3`}
                          >
                            {post.description || "No description provided."}
                          </p>
                        </div>

                        <div>
                          <strong
                            className={`text-sm ${
                              currentTheme === "dark"
                                ? "text-white"
                                : "text-foreground"
                            }`}
                          >
                            Amenities:
                          </strong>
                          <div
                            className={`max-h-24 overflow-auto mt-1 text-sm ${
                              currentTheme === "dark"
                                ? "text-gray-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {post.amenities?.length > 0 ? (
                              <ul className="list-disc ml-5">
                                {post.amenities.map(
                                  (amenity: string, idx: number) => (
                                    <li key={idx}>{amenity}</li>
                                  )
                                )}
                              </ul>
                            ) : (
                              <p className="text-gray-400">None</p>
                            )}
                          </div>
                        </div>

                        {post.contactEmail && (
                          <div className="text-sm mt-2">
                            📧{" "}
                            <span
                              className={`${
                                currentTheme === "dark"
                                  ? "text-blue-300"
                                  : "text-blue-600"
                              }`}
                            >
                              {post.contactEmail}
                            </span>
                          </div>
                        )}
                        {post.contactPhone && (
                          <div className="text-sm">
                            📱{" "}
                            <span
                              className={`${
                                currentTheme === "dark"
                                  ? "text-blue-300"
                                  : "text-blue-600"
                              }`}
                            >
                              {post.contactPhone}
                            </span>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="grid grid-cols-2 gap-3 px-5 pb-5">
                        <Button
                          onClick={() =>
                            navigate({ to: `/edit-post/${post._id}` })
                          }
                          variant="outline"
                          className={`flex gap-2 hover:cursor-pointer justify-center w-full transition duration-300 ease-in-out transform hover:scale-105 ${
                            currentTheme === "dark"
                              ? "bg-gray-600 text-white border-gray-500 hover:bg-indigo-700"
                              : "bg-white text-black border-gray-300 hover:bg-indigo-600 hover:text-white"
                          }`}
                        >
                          <PencilLine className="w-4 h-4" />
                          Edit
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="flex gap-2 justify-center hover:cursor-pointer w-full transition duration-300 ease-in-out transform hover:bg-red-600 hover:text-white hover:scale-105"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent
                            className={
                              currentTheme === "dark"
                                ? "bg-gray-800 text-white border-gray-700"
                                : ""
                            }
                          >
                            <AlertDialogHeader>
                              <AlertDialogTitle
                                className={
                                  currentTheme === "dark" ? "text-white" : ""
                                }
                              >
                                Are you sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription
                                className={
                                  currentTheme === "dark" ? "text-gray-400" : ""
                                }
                              >
                                This action will permanently delete this post
                                and all associated images from Cloudinary.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                disabled={loading}
                                className={
                                  currentTheme === "dark"
                                    ? "bg-gray-600 text-white border-gray-500 hover:bg-gray-500"
                                    : ""
                                }
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                disabled={loading}
                                onClick={() => handleDelete(post)}
                                className={
                                  currentTheme === "dark"
                                    ? "bg-red-700 hover:bg-red-800"
                                    : ""
                                }
                              >
                                {loading ? (
                                  <span className="flex items-center gap-2">
                                    <Loader2 className="animate-spin w-4 h-4" />
                                    Deleting...
                                  </span>
                                ) : (
                                  "Delete"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Loading indicator for fetching next page */}
            {isFetchingNextPage && (
              <div
                className={`flex flex-col items-center gap-3 mt-8 border rounded-lg p-4 shadow-lg ${
                  currentTheme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-300"
                    : "bg-indigo-50 border-indigo-400 text-indigo-900"
                }`}
              >
                <svg
                  className={`animate-spin h-10 w-10 ${
                    currentTheme === "dark"
                      ? "text-indigo-300"
                      : "text-indigo-700"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
                <p
                  className={`font-semibold text-lg ${
                    currentTheme === "dark"
                      ? "text-indigo-300"
                      : "text-indigo-900"
                  }`}
                >
                  Loading more posts...
                </p>
              </div>
            )}

            <AnimatePresence>
              {showDeletingModal && (
                <motion.div
                  key="delete-modal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    className={`${
                      currentTheme === "dark"
                        ? "bg-gray-800 text-white"
                        : "bg-white text-black"
                    } rounded-lg p-8 flex flex-col items-center space-y-4 max-w-sm w-full shadow-lg border ${
                      currentTheme === "dark"
                        ? "border-gray-700"
                        : "border-gray-200"
                    }`}
                  >
                    <Loader2 size={48} className="animate-spin text-red-600" />
                    <p className="text-lg font-semibold text-center">
                      Deleting your post, please wait...
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/myposts",
    component: MyPosts,
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) {
        return redirect({ to: "/" });
      }
    },
  });
