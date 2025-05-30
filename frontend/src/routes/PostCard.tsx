import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Sun, Moon } from "lucide-react"; // Import icons if you need them for preview

// Function to get theme from local storage
const getTheme = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("theme") || "light";
  }
  return "light";
};

export default function PostCard({ post, lastPostRef }) {
  const [imageIndex, setImageIndex] = useState(0);
  const navigate = useNavigate();
  const [theme, setTheme] = useState(getTheme()); // Get initial theme

  // Effect to update theme state if local storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setTheme(getTheme());
    };

    window.addEventListener("storage", handleStorageChange);

    // Initial check in case the event didn't fire but theme is set
    setTheme(getTheme());

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!post.images || post.images.length <= 1) return;

    const interval = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % post.images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [post.images]);

  const isDark = theme === "dark";

  return (
    <motion.div
      key={post._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      whileHover={{ scale: 1.03 }}
      className={`rounded-2xl shadow-md border hover:shadow-lg transition-all overflow-hidden ${
        isDark
          ? "bg-gray-800 text-gray-200 border-gray-700 hover:shadow-xl-dark" // Add dark mode shadow if you have it
          : "bg-white text-gray-800 border-gray-200"
      }`}
      ref={lastPostRef}
    >
      {post.images.length > 0 ? (
        <img
          src={post.images[imageIndex]}
          alt={`Property image ${imageIndex + 1}`}
          className="w-full h-48 object-cover transition-all duration-500"
        />
      ) : (
        <div
          className={`h-48 flex justify-center items-center text-6xl ${
            isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-600"
          }`}
        >
          🏠
        </div>
      )}
      <div className="p-4 space-y-1">
        {" "}
        {/* Added space-y for vertical spacing */}
        <h3
          className={`text-lg font-semibold truncate ${
            isDark ? "text-indigo-400" : "text-gray-800"
          }`}
        >
          {post.title}
        </h3>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {post.location}
        </p>
        <p
          className={`font-semibold mt-1 ${
            isDark ? "text-indigo-300" : "text-indigo-600"
          }`}
        >
          ₹{post.price?.toLocaleString()}/month{" "}
          {/* Added toLocaleString for better price formatting */}
        </p>
        {/* Optional: Add more post details here */}
        {/* <div className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>Type: {post.type}</p>
            <p>Occupancy: {post.occupancy}</p>
          </div> */}
        <button
          onClick={() => navigate({ to: `/room/${post._id}` })}
          className={`text-sm mt-2 font-medium ${
            isDark
              ? "text-indigo-400 hover:text-indigo-300"
              : "text-indigo-700 hover:text-indigo-800"
          } hover:underline transition-colors duration-200`}
        >
          View Details
        </button>
      </div>
    </motion.div>
  );
}
