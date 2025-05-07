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

  if (loading)
    return (
      <p className="text-center mt-10 text-lg font-medium text-blue-600">
        Loading your posts...
      </p>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-extrabold text-center mb-10 text-neutral-800">
        🏡 Your Property Listings
      </h1>

      {posts.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          You haven't posted any listings yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Thumbnail or Placeholder */}
              <div className="h-48 bg-gradient-to-br from-blue-200 to-blue-100 flex items-center justify-center text-5xl text-white font-bold">
                🏠
              </div>

              {/* Post Content */}
              <div className="p-5 flex flex-col justify-between h-full">
                <div className="space-y-3 flex-grow">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-blue-800 truncate">
                      {post.title}
                    </h2>
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 capitalize font-medium">
                      {post.type}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
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
                      <span className="font-semibold">
                        {post.price?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm">
                    <strong>Description:</strong>{" "}
                    {post.description || "No description provided."}
                  </p>

                  <div>
                    <strong className="text-sm text-gray-700">
                      Amenities:
                    </strong>
                    {post.amenities?.length > 0 ? (
                      <ul className="list-disc ml-5 mt-1 text-sm text-gray-600">
                        {post.amenities.map((amenity, idx) => (
                          <li key={idx}>{amenity}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">None</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex justify-between items-center">
                  <button className="flex items-center gap-1 px-4 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition">
                    <PencilLine className="w-4 h-4" />
                    Edit
                  </button>
                  <button className="flex items-center gap-1 px-4 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
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
