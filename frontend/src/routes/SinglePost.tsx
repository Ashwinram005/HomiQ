import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  RootRoute,
  createRoute,
  redirect,
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
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getUserIdFromToken } from "@/lib/getUserIdFromToken";

// Fix Leaflet marker icons
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
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

export function SinglePost() {
  const { id } = useParams({ from: "/room/$id" });
  const navigate = useNavigate();

  const handleChatClick = async () => {
    try {
      const token = localStorage.getItem("token");
      const currentUserId = getUserIdFromToken();
      const otherUserId = post.postedBy;
      const roomId = post._id;
      if (!token || !currentUserId || !otherUserId || !roomId) {
        navigate({ to: "/?tab=login" });
        return;
      }
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

  // Fetch post data
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
        console.error("Geolocation error:", err);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Geocode post location using LocationIQ
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

        if (data && data.length > 0) {
          setPostCoords({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
          setGeoError(null);
        } else {
          setGeoError("Post location not found.");
        }
      } catch (error) {
        setGeoError("Error fetching post coordinates.");
        console.error(error);
      }
    };

    fetchCoords();
  }, [post?.location]);

  // Calculate distance between user and post
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
  }, [userLocation, postCoords]);

  if (isLoading) return <div className="p-6 text-center">Loading...</div>;
  if (isError || !post)
    return <div className="p-6 text-center text-red-500">Post not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
      {/* Back button */}
      <Button
        onClick={() => navigate({ to: "/otherposts" })}
        className="
          mb-8
          inline-flex
          items-center
          px-4
          py-2
          text-blue-600
          bg-blue-100
          hover:bg-blue-200
          hover:text-blue-900
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:ring-offset-2
          rounded-md
          font-semibold
          transition
          duration-300
          ease-in-out
          select-none
          shadow-sm
        "
        aria-label="Go back to listings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2 h-5 w-5 font-bold"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </Button>

      <div className="flex flex-col md:flex-row gap-12 bg-white shadow-lg rounded-lg p-8">
        {/* Left: Images */}
        {post.images && post.images.length > 0 && (
          <div className="md:w-1/3 flex flex-col">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg overflow-hidden shadow-md border border-gray-200 mb-4 aspect-[4/3]"
            >
              <img
                src={post.images[currentImageIndex]}
                alt={`Post image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>

            <div className="flex space-x-3 overflow-x-auto px-1">
              {post.images.map((imgUrl: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-shadow duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    idx === currentImageIndex
                      ? "border-blue-600 shadow-lg"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                  aria-label={`Show image ${idx + 1}`}
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

        {/* Right: Post Details */}
        <div className="md:w-2/3 flex flex-col space-y-6">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-gray-900 tracking-tight"
          >
            {post.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg text-gray-700 whitespace-pre-line leading-relaxed"
          >
            {post.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-gray-700"
          >
            <div>
              <strong className="font-semibold">Location:</strong>{" "}
              <span className="text-gray-900">{post.location}</span>
            </div>
            <div>
              <strong className="font-semibold">Type:</strong>{" "}
              <span className="text-gray-900">{post.type}</span>
            </div>
            <div>
              <strong className="font-semibold">Occupancy:</strong>{" "}
              <span className="text-gray-900">{post.occupancy}</span>
            </div>
            <div>
              <strong className="font-semibold">Furnished:</strong>{" "}
              <span className="text-gray-900">
                {post.furnished ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <strong className="font-semibold">Available From:</strong>{" "}
              <span className="text-gray-900">
                {new Date(post.availableFrom).toLocaleDateString()}
              </span>
            </div>
            <div>
              <strong className="font-semibold">Price:</strong>{" "}
              <span className="text-gray-900">₹{post.price}</span>
            </div>
            <div>
              <strong className="font-semibold">Posted By:</strong>{" "}
              <span className="text-gray-900">{post.email || "N/A"}</span>
            </div>
            <div>
              <strong className="font-semibold">Distance:</strong>{" "}
              <span className="text-gray-900">
                {distanceInKm ? `${distanceInKm} km` : "Calculating..."}
              </span>
            </div>
            {post.amenities && post.amenities.length > 0 && (
              <div className="sm:col-span-2">
                <strong className="font-semibold block mb-1">Amenities:</strong>
                <ul className="list-disc list-inside text-gray-900 space-y-1">
                  {post.amenities.map((amenity: string, index: number) => (
                    <li key={index}>{amenity}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

          {postCoords && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-96 rounded-lg overflow-hidden border border-gray-300 shadow-md"
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
                      color="blue"
                    />
                  </>
                )}
              </MapContainer>
            </motion.div>
          )}

          <Button
            onClick={handleChatClick}
            className="self-start px-6 py-3 font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Start Chat
          </Button>
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
  });
