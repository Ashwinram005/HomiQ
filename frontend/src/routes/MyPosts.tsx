import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import {
  MapPin,
  Calendar,
  IndianRupee,
  PencilLine,
  Trash2,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5000/api/posts/myPosts",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching my posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="space-y-4 p-4">
            <Skeleton className="h-40 w-full rounded-lg" />
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
      <h1 className="text-4xl font-bold text-center mb-10 text-primary">
        🏡 Your Property Listings
      </h1>

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
              className="flex flex-col justify-between shadow-md border hover:shadow-xl transition-shadow duration-300 rounded-xl"
            >
              <CardHeader className="bg-gradient-to-br from-blue-200 to-sky-100 h-48 flex justify-center items-center text-6xl rounded-t-xl">
                🏠
              </CardHeader>

              <CardContent className="space-y-4 py-5 px-5 flex-1">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-primary truncate">
                    {post.title}
                  </CardTitle>
                  <Badge className="capitalize" variant="secondary">
                    {post.type}
                  </Badge>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>
                      {format(new Date(post.createdAt), "dd MMM yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span>{post.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">
                      {post.price?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  <strong>Description:</strong>{" "}
                  {post.description || "No description provided."}
                </p>

                <div>
                  <strong className="text-sm text-foreground">
                    Amenities:
                  </strong>
                  {post.amenities?.length > 0 ? (
                    <ul className="list-disc ml-5 mt-1 text-sm text-muted-foreground">
                      {post.amenities.map((amenity, idx) => (
                        <li key={idx}>{amenity}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 mt-1">None</p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="grid grid-cols-2 gap-3 px-5 pb-5">
                <Button
                  variant="outline"
                  className="flex gap-2 w-full justify-center hover:cursor-pointer"
                >
                  <PencilLine className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex gap-2 w-full justify-center hover:cursor-pointer"
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
