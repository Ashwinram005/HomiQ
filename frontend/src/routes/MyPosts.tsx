import axios from "axios";
import { format } from "date-fns";
import {
  createRoute,
  redirect,
  useNavigate,
  type RootRoute,
} from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import {
  MapPin,
  Calendar,
  IndianRupee,
  PencilLine,
  Trash2,
  ArrowLeft,
} from "lucide-react";

import { Card, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

const fetchPosts = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get("http://localhost:5000/api/posts/myPosts", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status !== 200) {
    throw new Error("Failed to fetch posts");
  }

  return response.data; // Return posts data
};

export const MyPosts = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["myPosts"], // Define the query key
    queryFn: fetchPosts, // Define the function to fetch the posts
  });

  const navigate = useNavigate(); // Initialize the navigate function

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/dashboard" })} // Navigate to the dashboard
          className="flex gap-2 justify-center hover:cursor-pointer transition duration-300 ease-in-out transform hover:bg-indigo-600 hover:text-white hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
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
          {posts.map((post) => (
            <Card
              key={post._id}
              className="flex flex-col justify-between shadow-xl border border-gray-300 hover:shadow-2xl hover:border-blue-500 transition duration-300 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-blue-50"
            >
              {/* Image or Banner */}
              {post.images.length > 0 ? (
                <img
                  src={post.images[0]} // Assuming the first image is the main image
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
                  <CardTitle className="text-xl font-semibold  text-indigo-800 truncate">
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
                    🛏️ <span>Occupancy: {post.occupancy}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    🛋️ <span>Furnished: {post.furnished ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Available From: </strong>
                    <span>
                      {format(new Date(post.availableFrom), "dd MMM yyyy")}
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
                    <span className="text-blue-600">{post.contactEmail}</span>
                  </div>
                )}
                {post.contactPhone && (
                  <div className="text-sm">
                    📱{" "}
                    <span className="text-blue-600">{post.contactPhone}</span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="grid grid-cols-2 gap-3 px-5 pb-5">
                <Button
                  variant="outline"
                  className="flex gap-2 hover:cursor-pointer justify-center w-full transition duration-300 ease-in-out transform hover:bg-indigo-600 hover:text-white hover:scale-105"
                >
                  <PencilLine className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex gap-2 justify-center hover:cursor-pointer w-full transition duration-300 ease-in-out transform hover:bg-red-600 hover:text-white hover:scale-105"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
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
