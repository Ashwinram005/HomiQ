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
      className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="bg-white border border-gray-200 rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row min-h-[620px]">
        {/* Carousel Section */}
        <motion.div
          className="w-full md:w-3/5 bg-gray-100"
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
              interval={4500}
              swipeable
              emulateTouch
              useKeyboardArrows
              className="rounded-l-3xl"
            >
              {post.images.map((img: string, idx: number) => (
                <div key={idx}>
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

        {/* Details Section */}
        <motion.div
          className="w-full md:w-2/5 px-6 py-8 flex flex-col justify-between"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start flex-wrap gap-2">
              <h2 className="text-3xl font-semibold text-gray-900">
                {post.title}
              </h2>
              <span className="text-2xl font-bold text-indigo-700">
                ₹{post.price}/month
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{post.location}</span>
            </div>

            {/* Description */}
            <p className="text-gray-700 text-sm leading-relaxed">
              {post.description}
            </p>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm text-gray-800">
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-indigo-600" />
                <span>Type: {post.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>Occupancy: {post.occupancy}</span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-yellow-600" />
                <span>Furnished: {post.furnished ? "Yes" : "No"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Available From:</span>
                <span className="text-gray-900">
                  {new Date(post.availableFrom).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Amenities */}
            {post.amenities?.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-800 mt-4 mb-2">
                  Amenities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {post.amenities.map((item: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact Button */}
          <div className="pt-6">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={handleChatClick}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-3 rounded-xl transition-all"
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
