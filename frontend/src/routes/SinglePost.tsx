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
import { isAuthenticated } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

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
  const [showContact, setShowContact] = useState(false);

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

  // Geocode post location string
  useEffect(() => {
    if (!post?.location) return;

    const fetchCoords = async () => {
      try {
        const res = await axios.get(
          "https://nominatim.openstreetmap.org/search",
          {
            params: { q: post.location, format: "json", limit: 1 },
          }
        );

        if (res.data.length > 0) {
          setPostCoords({
            lat: parseFloat(res.data[0].lat),
            lng: parseFloat(res.data[0].lon),
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
  }, [userLocation, postCoords]);

  if (isLoading) return <div className="p-6 text-center">Loading...</div>;
  if (isError || !post)
    return <div className="p-6 text-center text-red-500">Post not found</div>;

  if (geoError)
    return (
      <div className="text-center p-4 text-red-600">
        Geolocation error: {geoError}
      </div>
    );

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
              <span className="text-gray-900">${post.price.toFixed(2)}</span>
            </div>
            {post.amenities.length > 0 && (
              <div className="col-span-full">
                <strong className="font-semibold">Amenities:</strong>{" "}
                <span className="text-gray-900">
                  {post.amenities.join(", ")}
                </span>
              </div>
            )}
          </motion.div>

          {/* Contact Owner Button */}
          <button
            onClick={() => setShowContact((prev) => !prev)}
            className="w-max px-6 py-3 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            aria-expanded={showContact}
            aria-controls="contact-owner"
          >
            {showContact ? "Hide" : "Contact"} Owner
          </button>

          <AnimatePresence>
            {showContact && (
              <motion.div
                id="contact-owner"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden bg-gray-50 p-5 rounded-md border border-gray-300 text-gray-800"
              >
                <p>
                  <strong>Owner Email:</strong>{" "}
                  <a
                    href={`mailto:${post.email}`}
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {post.email}
                  </a>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map */}
          {postCoords ? (
            <MapContainer
              center={[postCoords.lat, postCoords.lng]}
              zoom={13}
              scrollWheelZoom={false}
              style={{
                height: "320px",
                width: "100%",
                borderRadius: "1rem",
                boxShadow:
                  "0 4px 8px rgba(0, 0, 0, 0.1), 0 6px 20px rgba(0, 0, 0, 0.1)",
              }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[postCoords.lat, postCoords.lng]}>
                <Popup>Post Location</Popup>
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
                    pathOptions={{ color: "blue" }}
                  />
                </>
              )}
            </MapContainer>
          ) : (
            <p className="text-center text-gray-500 mt-4">Loading map...</p>
          )}

          {distanceInKm && (
            <p className="mt-6 text-gray-700 text-center text-lg font-semibold">
              📍 Distance from your location:{" "}
              <span className="text-blue-600">{distanceInKm} km</span>
            </p>
          )}
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
