import axios from "axios";
import { format } from "date-fns";
import {
  createRoute,
  redirect,
  useNavigate,
  type RootRoute,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react"; // Spinner icon

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
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRef, useCallback, useState } from "react";

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

const PAGE_LIMIT = 4;

// Fetch posts function with pagination for infinite scroll

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showDeletingModal, setShowDeletingModal] = useState(false);
  const handleDelete = async (post) => {
    try {
      setShowDeletingModal(true);
      await handleDeletePostAndImages(post._id, post.images);

      // Optionally show success toast or refresh post list here
    } catch (error) {
      console.error("Error deleting post:", error);
      // Optionally show error toast here
    } finally {
      setShowDeletingModal(false);
    }
  };

  const [filters, setFilters] = useState({
    searchQuery: "",
    locationQuery: "",
    priceFilter: "all",
    roomTypeFilter: "all",
    occupancyFilter: "all",
    availableFrom: "",
    amenityFilters: [],
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
  const toggleAmenity = (key) => {
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
    try {
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
    }
  }

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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
          <Card key={i} className="space-y-4 p-4">
            <Skeleton className="h-40 w-full rounded-lg bg-gradient-to-r from-blue-300 to-blue-500" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 text-red-500">
        Error loading posts. Please try again later.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10 top-0 mt-0 sticky z-10 bg-blue-400 p-5 rounded-2xl ">
        <div className="mb-6 flex items-center gap-2 sticky top-2">
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/dashboard" })}
            className="flex gap-2 justify-center hover:cursor-pointer transition duration-300 ease-in-out transform hover:bg-indigo-600 hover:text-white hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-900 tracking-tight">
            🏡 Your Property Listings
          </h1>
        </div>
        <Button
          variant="default"
          size="lg"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md transition-all duration-300 rounded-xl px-6 py-2"
          onClick={() => navigate({ to: "/ownerchatpage" })}
        >
          💬 Chat with Tenants
        </Button>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-6">
        <aside className="bg-white shadow-xl rounded-2xl p-6 h-fit sticky top-20">
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
          <div className="mt-5 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setTempFilters(filters)} // reset temp filters to applied filters
            >
              Reset
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setFilters(tempFilters);
                // query will refetch because filters changed
              }}
            >
              Apply Filters
            </Button>
          </div>
        </aside>
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg text-gray-500">
                You haven't posted anything yet.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Start posting to showcase your listings!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => {
                // Attach ref to last post for infinite scroll triggering
                const isLastPost = index === posts.length - 1;
                return (
                  <Card
                    key={post._id}
                    ref={isLastPost ? lastPostRef : null}
                    className="flex flex-col justify-between shadow-xl border border-gray-300 hover:shadow-2xl hover:border-blue-500 transition duration-300 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-blue-50"
                  >
                    {post.images?.length > 0 ? (
                      <img
                        src={post.images[0]}
                        alt="Property"
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-blue-100 to-blue-50 h-48 flex justify-center items-center text-6xl">
                        🏠
                      </div>
                    )}

                    <CardContent className="space-y-3 py-4 px-5 flex-1">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-semibold text-indigo-800 truncate">
                          {post.title}
                        </CardTitle>
                        <Badge
                          className={`capitalize ${
                            post.status === "Booked"
                              ? "bg-red-200 text-red-700"
                              : "bg-green-200 text-green-700"
                          } p-2 rounded-full text-sm font-medium`}
                        >
                          {post.status || "Available"}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span>
                            {format(new Date(post.createdAt), "dd MMM yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <span>{post.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-lg text-indigo-800">
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
                        <strong className="text-sm text-foreground">
                          Description:
                        </strong>
                        <p className="text-sm text-muted-foreground mt-1">
                          {post.description || "No description provided."}
                        </p>
                      </div>

                      <div>
                        <strong className="text-sm text-foreground">
                          Amenities:
                        </strong>
                        <div className="max-h-24 overflow-auto mt-1 text-sm text-muted-foreground">
                          {post.amenities?.length > 0 ? (
                            <ul className="list-disc ml-5">
                              {post.amenities.map((amenity, idx) => (
                                <li key={idx}>{amenity}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-400">None</p>
                          )}
                        </div>
                      </div>

                      {post.contactEmail && (
                        <div className="text-sm mt-2">
                          📧{" "}
                          <span className="text-blue-600">
                            {post.contactEmail}
                          </span>
                        </div>
                      )}
                      {post.contactPhone && (
                        <div className="text-sm">
                          📱{" "}
                          <span className="text-blue-600">
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
                        className="flex gap-2 hover:cursor-pointer justify-center w-full transition duration-300 ease-in-out transform hover:bg-indigo-600 hover:text-white hover:scale-105"
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
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will permanently delete this post and
                              all associated images from Cloudinary.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={loading}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              disabled={loading}
                              onClick={() => handleDelete(post)}
                            >
                              {loading ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="animate-spin w-4 h-4" />
                                  Deleting your post...
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
            <div className="flex flex-col items-center gap-3 mt-8 bg-indigo-50 border border-indigo-400 rounded-lg p-4 shadow-lg">
              <svg
                className="animate-spin h-10 w-10 text-indigo-700"
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
              <p className="text-indigo-900 font-semibold text-lg">
                Loading more posts...
              </p>
            </div>
          )}

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
                className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 max-w-sm w-full shadow-lg"
              >
                <Loader2 size={48} className="animate-spin text-red-600" />
                <p className="text-lg font-semibold text-gray-700 text-center">
                  Deleting your post, please wait...
                </p>
              </motion.div>
            </motion.div>
          )}
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
