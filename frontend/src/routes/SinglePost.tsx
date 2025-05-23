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
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import { motion } from "framer-motion";

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
      const currentUserId = getUserIdFromToken();
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

      const chatId = response.data._id;
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
    <motion.div
      className="max-w-[1100px] mx-auto px-8 py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row border border-gray-200 min-h-[650px]">
        {/* Image Carousel */}
        <motion.div
          className="w-full md:w-3/5 md:h-[600px]"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          {post.images?.length > 0 && (
            <Carousel
              showArrows
              infiniteLoop
              showThumbs={false}
              autoPlay
              interval={4000}
              className="h-full rounded-l-2xl"
              swipeable
              emulateTouch
              useKeyboardArrows
              dynamicHeight={false}
            >
              {post.images.map((img, idx) => (
                <div key={idx} className="h-full">
                  <img
                    src={img}
                    alt={`Room image ${idx + 1}`}
                    className="w-full h-[600px] object-cover"
                  />
                </div>
              ))}
            </Carousel>
          )}
        </motion.div>

        {/* Room Details */}
        <motion.div
          className="w-full md:w-2/5 p-10 flex flex-col justify-between"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
                {post.title}
              </h2>
              <span className="text-2xl font-extrabold text-indigo-600">
                ₹{post.price}/month
              </span>
            </div>

            <div className="flex items-center text-gray-600 gap-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              <span className="font-medium">{post.location}</span>
            </div>

            <p className="text-gray-700 text-base leading-relaxed tracking-wide">
              {post.description}
            </p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-gray-700 text-base">
              <div className="flex items-center gap-2">
                <BedDouble className="text-indigo-500 w-6 h-6" />
                <span className="font-semibold">Type: {post.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-green-500 w-6 h-6" />
                <span className="font-semibold">
                  Occupancy: {post.occupancy}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="text-yellow-500 w-6 h-6" />
                <span className="font-semibold">
                  Furnished: {post.furnished ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Available From:</span>
                <span className="font-medium text-gray-900">
                  {new Date(post.availableFrom).toLocaleDateString()}
                </span>
              </div>
            </div>

            {post.amenities?.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mt-6 mb-2 text-gray-800">
                  Amenities
                </h4>
                <div className="flex flex-wrap gap-3">
                  {post.amenities.map((item, idx) => (
                    <span
                      key={idx}
                      className="bg-indigo-100 text-indigo-900 px-4 py-1 rounded-full text-sm font-medium shadow-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-8">
            <motion.div
              whileHover={{
                scale: 1.05,
                boxShadow: "0 8px 15px rgba(99, 102, 241, 0.4)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleChatClick}
                className="w-full text-lg py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md"
              >
                Contact Owner
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
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
