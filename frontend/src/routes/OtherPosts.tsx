import { isAuthenticated } from "@/lib/auth";
import { createRoute, redirect, RootRoute } from "@tanstack/react-router";
import axios from "axios";
import { useEffect, useState } from "react";

export const OtherPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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
        console.log(response.data);
        setPosts(response.data);
      } catch (err) {
        console.error("Error loading posts", err);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  if (loading) return <div className="p-4">Loading posts...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Available Rooms & Houses</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div
            key={post._id}
            className="border rounded-xl p-4 shadow-lg bg-white space-y-2"
          >
            <h2 className="text-xl font-bold text-indigo-600">{post.title}</h2>
            <p className="text-gray-700">{post.description}</p>

            <div className="text-sm text-gray-500">
              <p>
                <strong>Location:</strong> {post.location}
              </p>
              <p>
                <strong>Type:</strong> {post.type}
              </p>
              <p>
                <strong>Occupancy:</strong> {post.occupancy}
              </p>
              <p>
                <strong>Furnished:</strong> {post.furnished ? "Yes" : "No"}
              </p>
              <p>
                <strong>Available From:</strong>{" "}
                {new Date(post.availableFrom).toLocaleDateString()}
              </p>
              <p>
                <strong>Price:</strong> ₹{post.price}
              </p>
              <p>
                <strong>Amenities:</strong> {post.amenities?.join(", ")}
              </p>
              <p>
                <strong>Posted By:</strong> {post.postedBy?.email || "Unknown"}
              </p>
            </div>

            {post.images && post.images.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-auto">
                {post.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Post ${idx}`}
                    className="h-24 w-32 object-cover rounded-md border"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
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
