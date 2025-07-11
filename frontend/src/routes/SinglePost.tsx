import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  RootRoute,
  createRoute,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // Carousel styles not needed

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getUserIdFromToken } from "@/lib/getUserIdFromToken";
import { Sun, Moon } from "lucide-react"; // Import Sun and Moon icons

// Fix Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string {
  const R = 6371; // Radius of Earth in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180; // Corrected: lon2 - lon1
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) + // Math.sin(dLat / 2) ** 2
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2); // Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

// Function to get theme from local storage
const getTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  }
  return "light";
};

// Function to set theme in local storage and update class on html element
const setTheme = (theme: "light" | "dark") => {
  if (typeof window !== "undefined") {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }
};

export function SinglePost() {
  const { id } = useParams({ from: "/room/$id" });
  const navigate = useNavigate();

  // Theme state and logic
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(
    getTheme()
  );

  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentTheme(getTheme());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
  };

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [postCoords, setPostCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [distanceInKm, setDistanceInKm] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const {
    data: post,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["singlePost", id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`https://homiq.onrender.com/api/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
  });

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoError(null);
      },
      (err) => {
        setGeoError(err.message);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId); // Cleanup watch
  }, []);

  // Fetch post coordinates
  useEffect(() => {
    if (!post?.location) return;

    const fetchCoords = async () => {
      try {
        const response = await fetch(
          `https://us1.locationiq.com/v1/search?key=pk.156347b797adf47f459dbb3d2c9ffabd&q=${encodeURIComponent(
            post.location
          )}&format=json&limit=1`
        );
        const data = await response.json();
        if (data?.length > 0) {
          setPostCoords({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
        } else {
          setGeoError("Post location not found.");
        }
      } catch (error) {
        setGeoError("Error fetching post coordinates.");
        console.error("LocationIQ error:", error);
      }
    };
    fetchCoords();
  }, [post?.location]);

  // Calculate distance
  useEffect(() => {
    if (userLocation && postCoords) {
      const dist = getDistanceFromLatLonInKm(
        userLocation.lat,
        userLocation.lng,
        postCoords.lat,
        postCoords.lng
      );
      setDistanceInKm(dist);
    }
  }, [userLocation, postCoords]); // Re-calculate if user or post location changes

  const handleChatClick = async () => {
    try {
      const token = localStorage.getItem("token");
      const currentUserId = getUserIdFromToken();
      const otherUserId = post.postedBy;
      const roomId = post._id;

      if (!token || !currentUserId || !otherUserId || !roomId) {
        navigate({
          to: "/",
          search: {
            tab: "login",
          },
        });
        return;
      }
      const response = await axios.post(
        "https://homiq.onrender.com/api/chatroom/create",
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
      alert("Could not start chat Please try again.");
    }
  };
  // Apply theme-based classes
  const containerBgClass =
    currentTheme === "dark"
      ? "bg-gray-900 text-white"
      : "bg-gray-100 text-gray-900"; // Changed to gray-100 for light mode bg
  const panelBgClass =
    currentTheme === "dark"
      ? "bg-gray-800 text-white"
      : "bg-white text-gray-900";
  const backButtonClass =
    currentTheme === "dark"
      ? "text-blue-400 bg-gray-700 hover:bg-gray-600"
      : "text-blue-600 bg-blue-100 hover:bg-blue-200";
  const detailTitleClass =
    currentTheme === "dark" ? "text-indigo-300" : "text-indigo-700";

  if (isLoading)
    return (
      <div className={`p-6 text-center ${containerBgClass}`}>Loading...</div>
    );
  if (isError || !post)
    return (
      <div className={`p-6 text-center text-red-500 ${containerBgClass}`}>
        Post not found
      </div>
    );

  return (
    <div
      className={`w-full min-h-screen transition-colors duration-300 ${containerBgClass}`}
    >
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <Button
            onClick={() => navigate({ to: "/otherposts", search: { otherUserId: post.postedBy } })}
            className={`inline-flex items-center px-3 py-1.5 rounded-md font-semibold text-sm transition duration-300 ease-in-out shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${backButtonClass} ${
              currentTheme === "dark"
                ? "focus:ring-blue-400 focus:ring-offset-gray-900"
                : "focus:ring-blue-500 focus:ring-offset-gray-100"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Button>
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors duration-300 hover:bg-opacity-20 ${
              currentTheme === "dark"
                ? "text-yellow-300 hover:bg-gray-700"
                : "text-indigo-700 hover:bg-gray-200"
            }`}
            aria-label="Toggle theme"
          >
            {currentTheme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <div
          className={`flex flex-col md:flex-row gap-8 shadow-md rounded-lg p-6 transition-colors duration-300 ${panelBgClass}`}
        >
          {post.images?.length > 0 && (
            <div className="md:w-1/2 w-full flex flex-col">
              <div className="relative">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0.5, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`rounded-md overflow-hidden border aspect-video mb-3 ${
                    currentTheme === "dark"
                      ? "border-gray-700"
                      : "border-gray-300"
                  }`}
                >
                  <img
                    src={post.images[currentImageIndex]}
                    alt={`Post image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </motion.div>

                {/* Carousel Buttons */}
                <button
                  onClick={() =>
                    setCurrentImageIndex(
                      (currentImageIndex - 1 + post.images.length) %
                        post.images.length
                    )
                  }
                  className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition"
                  aria-label="Previous Image"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex(
                      (currentImageIndex + 1) % post.images.length
                    )
                  }
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition"
                  aria-label="Next Image"
                >
                  ›
                </button>
              </div>

              <div className="flex space-x-2 overflow-x-auto pb-1 px-1">
                {post.images.map((imgUrl: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 flex-shrink-0 overflow-hidden border-2 rounded-md ${
                      idx === currentImageIndex
                        ? "border-blue-600 dark:border-blue-400 shadow"
                        : `border-gray-300 dark:border-gray-600 ${
                            currentTheme === "dark"
                              ? "hover:border-blue-400"
                              : "hover:border-blue-400"
                          }`
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="md:w-1/2 flex flex-col space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-2xl font-bold ${detailTitleClass}`}
            >
              {post.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-sm ${
                currentTheme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {post.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm ${
                currentTheme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <div>
                <strong className="font-medium text-gray-900 dark:text-white">
                  Location:
                </strong>{" "}
                {post.location}
              </div>
              <div>
                <strong className="font-medium text-gray-900 dark:text-white">
                  Type:
                </strong>{" "}
                {post.type}
              </div>
              <div>
                <strong className="font-medium text-gray-900 dark:text-white">
                  Occupancy:
                </strong>{" "}
                {post.occupancy}
              </div>
              <div>
                <strong className="font-medium text-gray-900 dark:text-white">
                  Furnished:
                </strong>{" "}
                {post.furnished ? "Yes" : "No"}
              </div>
              <div>
                <strong className="font-medium text-gray-900 dark:text-white">
                  Available From:
                </strong>{" "}
                {new Date(post.availableFrom).toLocaleDateString()}
              </div>
              <div>
                <strong className="font-medium text-gray-900 dark:text-white">
                  Price:
                </strong>{" "}
                ₹{post.price}
              </div>
              <div>
                <strong className="font-medium text-gray-900 dark:text-white">
                  Posted By:
                </strong>{" "}
                {post.email || "N/A"}
              </div>
              <div>
                <strong className="font-medium text-gray-900 dark:text-white">
                  Distance:
                </strong>{" "}
                {distanceInKm
                  ? `${distanceInKm} km`
                  : geoError || "Calculating..."}
              </div>

              {post.amenities?.length > 0 && (
                <div className="sm:col-span-2">
                  <strong className="font-medium text-gray-900 dark:text-white">
                    Amenities:
                  </strong>
                  <ul className="list-disc list-inside">
                    {post.amenities.map((amenity: string, index: number) => (
                      <li key={index}>{amenity}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>

            {/* Condensed Map */}
            {postCoords && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`h-64 rounded-md overflow-hidden border ${
                  currentTheme === "dark"
                    ? "border-gray-700"
                    : "border-gray-300"
                }`}
              >
                <MapContainer
                  center={[postCoords.lat, postCoords.lng]}
                  zoom={13}
                  scrollWheelZoom={false}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[postCoords.lat, postCoords.lng]}>
                    <Popup>{post.location}</Popup>
                  </Marker>
                  {userLocation && (
                    <>
                      <Marker position={[userLocation.lat, userLocation.lng]}>
                        <Popup>Your Location</Popup>
                      </Marker>
                      <Polyline
                        positions={[
                          [userLocation.lat, userLocation.lng],
                          [postCoords.lat, postCoords.lng],
                        ]}
                      />
                    </>
                  )}
                </MapContainer>
              </motion.div>
            )}

            {geoError && (
              <div
                className={`text-sm mt-2 ${
                  currentTheme === "dark" ? "text-red-400" : "text-red-600"
                }`}
              >
                Geolocation Error: {geoError}
              </div>
            )}

            {/* Chat Button */}
            {getUserIdFromToken() !== post.postedBy && (
              <Button
                onClick={handleChatClick}
                className={`self-start px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-300 ${
                  currentTheme === "dark"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Start Chat
              </Button>
            )}
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
    // Optional: Add a beforeLoad to ensure authentication if necessary
    // beforeLoad: async () => {
    //     const auth = await isAuthenticated();
    //     if (!auth) return redirect({ to: '/' });
    // },
  });