import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
// Removed Sun, Moon icons as they are not directly used in PostCard

// Import icons if you need them for displaying post details
import { MapPin, DollarSign, Users, Calendar, Home } from "lucide-react";

// Define the type for your post data (adjust to match your actual post structure)
interface Post {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  roomType: string;
  occupancy: string;
  availableFrom: string; // Ensure this is a string that can be parsed by Date
  amenities: string[];
  images: string[]; // Assuming 'images' is an array of strings (image URLs)
  user: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

// Define the props for PostCard, expecting 'theme' as a prop
interface PostCardProps {
  post: Post;
  lastPostRef?: React.Ref<HTMLDivElement>;
  theme: string; // Theme now comes from props
}

const PostCard = ({ post, lastPostRef, theme }: PostCardProps) => {
  const [imageIndex, setImageIndex] = useState(0);
  const navigate = useNavigate();

  // No internal theme state or localStorage listener needed here.
  // The theme is passed directly from OtherPosts.

  useEffect(() => {
    // Only set up interval if there are multiple images
    if (!post.images || post.images.length <= 1) return;

    const interval = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % post.images.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval); // Clear interval on unmount or if images change
  }, [post.images]); // Depend on post.images so interval resets if images array changes

  const isDark = theme === "dark"; // Directly use the theme prop

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "N/A Date"; // Handle invalid date strings gracefully
      }
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A Date";
    }
  };

  return (
    <motion.div
      // No need for initial, animate, exit here, as the parent AnimatePresence handles it
      // The `layout` prop on the parent motion.div is crucial for list re-ordering
      whileHover={{ scale: 1.03 }} // Subtle hover effect
      className={`
        rounded-2xl shadow-md border hover:shadow-lg transition-all overflow-hidden cursor-pointer
        ${
          isDark
            ? "bg-gray-800 text-gray-200 border-gray-700 dark:hover:shadow-indigo-500/30" // Dark mode specific hover shadow (optional)
            : "bg-white text-gray-800 border-gray-200 hover:shadow-indigo-200/50" // Light mode specific hover shadow (optional)
        }
      `}
      ref={lastPostRef}
      onClick={() => navigate({ to: `/room/${post._id}` })} // Navigate on card click
    >
      {post.images && post.images.length > 0 ? (
        <img
          src={post.images[imageIndex]}
          alt={`Property image for ${post.title}`}
          className="w-full h-48 object-cover transition-all duration-500 ease-in-out"
        />
      ) : (
        <div
          className={`h-48 w-full flex justify-center items-center text-6xl ${
            isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-600"
          }`}
          aria-label="No image available for this property"
        >
          🏠
        </div>
      )}
      <div className="p-4 space-y-1">
        <h3
          className={`text-lg font-semibold truncate mb-1 ${
            isDark ? "text-indigo-400" : "text-gray-800"
          }`}
          title={post.title} // Add title for full text on hover
        >
          {post.title}
        </h3>
        <p
          className={`text-sm mb-2 ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <MapPin size={14} className="inline-block mr-1 text-blue-500" />
          {post.location}
        </p>
        <p
          className={`font-semibold mt-1 text-base ${
            isDark ? "text-indigo-300" : "text-indigo-600"
          }`}
        >
          <DollarSign
            size={16}
            className="inline-block mr-1 align-text-bottom"
          />
          {post.price?.toLocaleString()}/month
        </p>

        {/* Additional details for better info on card */}
        <div
          className={`text-xs space-y-1 mt-2 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          <p className="flex items-center gap-1">
            <Home size={14} className="text-emerald-500" /> Room Type:{" "}
            {post.roomType}
          </p>
          <p className="flex items-center gap-1">
            <Users size={14} className="text-purple-500" /> Occupancy:{" "}
            {post.occupancy}
          </p>
          <p className="flex items-center gap-1">
            <Calendar size={14} className="text-rose-500" /> Available From:{" "}
            {formatDate(post.availableFrom)}
          </p>
        </div>

        {/* Removed redundant "View Details" button, as the whole card is now clickable */}
      </div>
    </motion.div>
  );
};

export default PostCard;
