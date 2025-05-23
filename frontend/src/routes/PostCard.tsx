import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";

export default function PostCard({ post, lastPostRef }) {
  const [imageIndex, setImageIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!post.images || post.images.length <= 1) return;

    const interval = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % post.images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [post.images]);

  return (
    <motion.div
      key={post._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      whileHover={{ scale: 1.03 }}
      className="bg-white rounded-2xl shadow-md border hover:shadow-lg transition-all overflow-hidden"
      ref={lastPostRef}
    >
      {post.images.length > 0 && (
        <img
          src={post.images[imageIndex]}
          alt="Room"
          className="w-full h-48 object-cover transition-all duration-500"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 truncate">
          {post.title}
        </h3>
        <p className="text-sm text-gray-500">{post.location}</p>
        <p className="text-indigo-600 font-semibold mt-1">
          ₹{post.price}/month
        </p>
        <button
          onClick={() => navigate({ to: `/room/${post._id}` })}
          className="text-sm mt-2 text-indigo-700 hover:underline"
        >
          View Details
        </button>
      </div>
    </motion.div>
  );
}
