import { isAuthenticated } from "@/lib/auth";
import {
  createRoute,
  redirect,
  RootRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { BadgeCheck, BedDouble, MapPin, ShieldCheck } from "lucide-react";
import { getUserIdFromToken } from "@/lib/getUserIdFromToken";

export function SinglePost() {
  const { id } = useParams({ from: "/room/$id" });
  const navigate = useNavigate();
  const {
    data: post,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["singlePost", id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    },
  });
  const handleChatClick = async () => {
    try {
      const token = localStorage.getItem("token");
      const currentUserId = getUserIdFromToken(); // your existing util
      const otherUserId = post.postedBy;
      const roomId = post._id;
      const response = await axios.post(
        "http://localhost:5000/api/chatroom/create",
        {
          userId: currentUserId,
          otherUserId,
          roomId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const chatId = response.data._id; // or response.data.chatId based on your backend
      navigate({ to: `/chat/${chatId}` });
    } catch (error) {
      console.error("Failed to start chat:", error);
      alert("Could not start chat. Please try again.");
    }
  };

  if (isLoading)
    return <div className="p-6 text-center text-lg">Loading...</div>;
  if (isError || !post)
    return <div className="p-6 text-center text-red-500">Post not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        {post.images?.[0] && (
          <img
            src={post.images[0]}
            alt="Room"
            className="w-full h-72 object-cover"
          />
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
            <span className="text-xl text-indigo-600 font-semibold">
              ₹{post.price}/month
            </span>
          </div>

          <div className="flex items-center gap-3 text-gray-600">
            <MapPin className="w-5 h-5" />
            <span className="text-md">{post.location}</span>
          </div>

          <p className="text-gray-700 leading-relaxed">{post.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-indigo-500" />
              <span>Type: {post.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span>Occupancy: {post.occupancy}</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-yellow-500" />
              <span>Furnished: {post.furnished ? "Yes" : "No"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Available From:</span>
              <span className="font-medium text-gray-800">
                {new Date(post.availableFrom).toLocaleDateString()}
              </span>
            </div>
          </div>

          {post.amenities?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
                Amenities
              </h3>
              <ul className="flex flex-wrap gap-2">
                {post.amenities.map((item, idx) => (
                  <li
                    key={idx}
                    className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-6">
            <Button
              onClick={handleChatClick}
              className="w-full text-lg py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all"
            >
              Contact Owner
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/room/$id",
    component: SinglePost,
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) return redirect({ to: "/" });
    },
  });
