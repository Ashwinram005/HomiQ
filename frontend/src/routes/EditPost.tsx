import React, { useState, useEffect } from "react";
import {
  createRoute,
  redirect,
  useNavigate,
  useParams,
  type RootRoute,
} from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

import { Input } from "@/components/ui/input"; // Assuming these are styled inputs
import { Textarea } from "@/components/ui/textarea"; // Assuming these are styled textareas
import { Button } from "@/components/ui/button"; // Assuming these are styled buttons
import { isAuthenticated } from "@/lib/auth";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Trash2, Loader2, Sun, Moon } from "lucide-react"; // Added Sun and Moon icons

const amenitiesList = [
  "Wi-Fi",
  "AC",
  "Parking",
  "Laundry",
  "TV",
  "Refrigerator",
];

// Zod schema
const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description is required"),
  price: z
    .string()
    .regex(/^\d+$/, "Price must be a positive number")
    .min(1, "Price is required"),
  location: z.string().min(1, "Location is required"),
  type: z.enum(["Room", "House", "PG", "Shared"])
    .refine((val) => !!val, { message: "Select a valid type" }),
  occupancy: z
    .enum(["Single", "Double", "Triple", "Any"])
    .refine((val) => !!val, { message: "Select a valid occupancy" }),
  furnished: z.boolean().optional(),
  availableFrom: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

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

export function EditPost() {
  const navigate = useNavigate();
  const { postId } = useParams({ from: "/edit-post/$postId" });
  const token = localStorage.getItem("token");
  // Initialize state from local storage
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(
    getTheme()
  );

  // Effect to apply theme class to html element on mount and when theme changes
  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  // Listen for theme changes from other components (if any)
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentTheme(getTheme());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
  };

  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:5000/api/posts/${postId}`);
      return res.data.data;
    },
    enabled: !!postId,
    staleTime: 1000 * 60 * 5, // Data considered fresh for 5 minutes
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      location: "",
      type: "" as "Room", // Explicitly cast to a valid enum member
      occupancy: "" as "Single", // Explicitly cast to a valid enum member
      furnished: false,
      availableFrom: "",
      amenities: [],
      images: [],
    },
    values: post // Populate form with fetched data on load
      ? {
          title: post.title || "",
          description: post.description || "",
          price: String(post.price || ""),
          location: post.location || "",
          type: post.type || ("" as "Room"),
          occupancy: post.occupancy || ("" as "Single"),
          furnished: post.furnished || false,
          availableFrom: post.availableFrom
            ? !isNaN(new Date(post.availableFrom).getTime())
              ? new Date(post.availableFrom).toISOString().split("T")[0]
              : ""
            : "",
          amenities: post.amenities || [],
          images: post.images || [],
        }
      : undefined,
  });

  const amenities = watch("amenities");
  const images = watch("images");

  function getPublicIdFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const versionIndex = pathParts.findIndex((part) => /^v\d+$/.test(part));
      if (versionIndex === -1) return null;
      const publicIdParts = pathParts.slice(versionIndex + 1);
      return publicIdParts.join("/").replace(/\.[^/.]+$/, "");
    } catch {
      return null;
    }
  }

  // Toggle amenity checkbox
  const toggleAmenity = (amenity: string) => {
    let updatedAmenities = amenities ? [...amenities] : [];
    if (updatedAmenities.includes(amenity)) {
      updatedAmenities = updatedAmenities.filter((a) => a !== amenity);
    } else {
      updatedAmenities.push(amenity);
    }
    setValue("amenities", updatedAmenities);
  };

  const uploadImageToCloudinary = async (file: File) => {
    try {
      const signatureResponse = await fetch(
        "http://localhost:5000/api/cloudinary/sign"
      );
      if (!signatureResponse.ok) throw new Error("Failed to get signature");

      const { timestamp, signature, cloudName, apiKey } =
        await signatureResponse.json();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", "HomiQ"); // Specify your folder

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error.message || "Upload failed");
      }
      const uploadResult = await uploadResponse.json();
      return uploadResult.secure_url;
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(`Image upload failed: ${error.message}`);
      throw error;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Optional: Limit the number of images
    if ((images?.length || 0) + files.length > 5) {
      toast.error("You can upload a maximum of 5 images.");
      return;
    }

    const uploadedUrls: string[] = [];
    const uploadToastId = toast.loading("Uploading images...");

    try {
      for (const file of files) {
        const url = await uploadImageToCloudinary(file);
        uploadedUrls.push(url);
      }

      setValue("images", [...(images || []), ...uploadedUrls]);
      toast.success("Images uploaded!", { id: uploadToastId });
    } catch {
      toast.error("Upload failed", { id: uploadToastId });
    } finally {
      // Clear the file input after selection
      e.target.value = "";
    }
  };

  const handleImageDelete = async (index: number) => {
    const urlToDelete = images?.[index];
    if (!urlToDelete) return;
    const publicId = getPublicIdFromUrl(urlToDelete);
    if (!publicId) {
      toast.error("Invalid image URL for deletion");
      return;
    }

    const deleteToastId = toast.loading("Deleting image...");

    try {
      await axios.delete("http://localhost:5000/api/cloudinary/delete", {
        data: { publicId },
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedImages = [...(images || [])];
      updatedImages.splice(index, 1);

      setValue("images", updatedImages);
      toast.success("Image deleted", { id: deleteToastId });
    } catch (err: any) {
      console.error("Image deletion error:", err);
      toast.error(
        `Deletion failed: ${err.response?.data?.message || err.message}`,
        { id: deleteToastId }
      );
    }
  };

  const [showUpdatingModal, setShowUpdatingModal] = useState(false);

  const onSubmit = async (data: FormData) => {
    setShowUpdatingModal(true); // show modal

    try {
      const payload = { ...data, price: Number(data.price) };
      await axios.put(`http://localhost:5000/api/posts/${postId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Simulate a short delay for better UX with the modal
      await new Promise((resolve) => setTimeout(resolve, 800));

      setShowUpdatingModal(false);
      toast.success("Post updated successfully!");
      navigate({ to: "/myposts" });
    } catch (err: any) {
      setShowUpdatingModal(false);
      console.error("Update post error:", err);
      toast.error(
        `Update failed: ${err.response?.data?.message || err.message}`
      );
    }
  };

  // Apply base background and text color to the main container based on theme
  const containerClasses = `min-h-screen py-8 ${
    currentTheme === "dark"
      ? "bg-gray-900 text-gray-200"
      : "bg-gray-100 text-gray-800"
  }`;

  if (isLoading)
    return (
      <div className={`${containerClasses} flex justify-center items-center`}>
        <Loader2 className="w-8 h-8 animate-spin mr-2 text-indigo-600" />{" "}
        Loading post...
      </div>
    );
  if (error)
    return (
      <div
        className={`${containerClasses} text-center text-red-600 dark:text-red-400`}
      >
        Error loading post: {(error as Error).message}
      </div>
    );

  return (
    <div className={containerClasses}>
      {" "}
      {/* Apply theme background here */}
      <Toaster position="top-center" reverseOrder={false} />
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className={`max-w-4xl mx-auto space-y-8 p-8 md:p-10 shadow-3xl rounded-2xl transition-colors duration-300 ${
          currentTheme === "dark"
            ? "bg-gray-800 text-gray-200 border border-gray-700 shadow-lg"
            : "bg-white text-gray-800 border border-gray-200 shadow-xl"
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <Button
            type="button"
            onClick={() => navigate({ to: "/myposts" })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${
              currentTheme === "dark"
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <h2
            className={`text-3xl md:text-4xl font-extrabold text-center flex-grow ${
              currentTheme === "dark" ? "text-indigo-400" : "text-indigo-700"
            }`}
          >
            Edit Post
          </h2>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors duration-200 ${
              currentTheme === "dark"
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            aria-label="Toggle theme"
          >
            {currentTheme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Grid Layout for Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="space-y-2">
            <label
              className={`block text-sm font-medium ${
                currentTheme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Title
            </label>
            <Input
              {...register("title")}
              className={`${
                currentTheme === "dark"
                  ? "bg-gray-800 border-gray-700 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                  : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
              } transition-colors duration-200`}
            />
            {errors.title && (
              <p
                className={`text-sm ${
                  currentTheme === "dark" ? "text-red-400" : "text-red-600"
                }`}
              >
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label
              className={`block text-sm font-medium ${
                currentTheme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Price
            </label>
            <Input
              type="text"
              {...register("price")}
              placeholder="e.g., 5000"
              className={`${
                currentTheme === "dark"
                  ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                  : "border-gray-300 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
              } transition-colors duration-200`}
            />
            {errors.price && (
              <p
                className={`text-sm ${
                  currentTheme === "dark" ? "text-red-400" : "text-red-600"
                }`}
              >
                {errors.price.message}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2 col-span-full">
            <label
              className={`block text-sm font-medium ${
                currentTheme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Location
            </label>
            <Input
              {...register("location")}
              placeholder="e.g., City, Area"
              className={`${
                currentTheme === "dark"
                  ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                  : "border-gray-300 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
              } transition-colors duration-200`}
            />
            {errors.location && (
              <p
                className={`text-sm ${
                  currentTheme === "dark" ? "text-red-400" : "text-red-600"
                }`}
              >
                {errors.location.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2 col-span-full">
            <label
              className={`block text-sm font-medium ${
                currentTheme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Description
            </label>
            <Textarea
              {...register("description")}
              placeholder="Describe your place, features, and surroundings..."
              className={`h-23 resize-none overflow-y-auto ${
                currentTheme === "dark"
                  ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                  : "border-gray-300 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
              } transition-colors duration-200`}
            />

            {errors.description && (
              <p
                className={`text-sm ${
                  currentTheme === "dark" ? "text-red-400" : "text-red-600"
                }`}
              >
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label
              className={`block text-sm font-medium ${
                currentTheme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Type
            </label>
            <select
              {...register("type")}
              className={`w-full rounded-md border px-3 py-2 text-base ${
                currentTheme === "dark"
                  ? "bg-gray-800 border-gray-700 text-gray-200"
                  : "border-gray-300 text-gray-700"
              } focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200`}
            >
              <option value="">Select Type</option>
              <option value="Room">Room</option>
              <option value="House">House</option>
              <option value="PG">PG</option>
              <option value="Shared">Shared</option>
            </select>
            {errors.type && (
              <p
                className={`text-sm ${
                  currentTheme === "dark" ? "text-red-400" : "text-red-600"
                }`}
              >
                {errors.type.message}
              </p>
            )}
          </div>

          {/* Occupancy */}
          <div className="space-y-2">
            <label
              className={`block text-sm font-medium ${
                currentTheme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Occupancy
            </label>
            <select
              {...register("occupancy")}
              className={`w-full rounded-md border px-3 py-2 text-base ${
                currentTheme === "dark"
                  ? "bg-gray-800 border-gray-700 text-gray-200"
                  : "border-gray-300 text-gray-700"
              } focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200`}
            >
              <option value="">Select Occupancy</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Triple">Triple</option>
              <option value="Any">Any</option>
            </select>
            {errors.occupancy && (
              <p
                className={`text-sm ${
                  currentTheme === "dark" ? "text-red-400" : "text-red-600"
                }`}
              >
                {errors.occupancy.message}
              </p>
            )}
          </div>

          {/* Available From */}
          <div className="space-y-2">
            <label
              className={`block text-sm font-medium ${
                currentTheme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Available From
            </label>
            <Input
              type="date"
              {...register("availableFrom")}
              className={`${
                currentTheme === "dark"
                  ? "bg-gray-800 border-gray-700 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                  : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
              } transition-colors duration-200`}
            />
          </div>

          {/* Furnished */}
          <div className="flex items-center space-x-2 self-end pb-2">
            <input
              type="checkbox"
              {...register("furnished")}
              id="furnished"
              className={`form-checkbox h-5 w-5 rounded ${
                currentTheme === "dark"
                  ? "text-indigo-400 border-gray-600 bg-gray-700 checked:bg-indigo-400 checked:border-indigo-400 focus:ring-indigo-400 focus:ring-offset-gray-900"
                  : "text-indigo-600 border-gray-300 focus:ring-indigo-500 focus:ring-offset-white"
              } transition-colors duration-200`}
            />
            <label
              htmlFor="furnished"
              className={`text-sm font-medium ${
                currentTheme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Furnished
            </label>
          </div>
        </div>

        {/* Amenities as checkboxes */}
        <fieldset className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <legend
            className={`text-lg font-semibold mb-3 ${
              currentTheme === "dark" ? "text-gray-200" : "text-gray-800"
            }`}
          >
            Amenities
          </legend>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {amenitiesList.map((amenity) => (
              <label
                key={amenity}
                className={`inline-flex items-center space-x-3 cursor-pointer px-4 py-2 rounded-lg transition-colors duration-200 ${
                  amenities?.includes(amenity)
                    ? currentTheme === "dark"
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-100 text-indigo-800"
                    : currentTheme === "dark"
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <input
                  type="checkbox"
                  value={amenity}
                  checked={amenities?.includes(amenity) ?? false}
                  onChange={() => toggleAmenity(amenity)}
                  className={`form-checkbox h-5 w-5 rounded ${
                    currentTheme === "dark"
                      ? "text-indigo-400 border-gray-600 bg-gray-700 checked:bg-indigo-400 checked:border-indigo-400 focus:ring-indigo-400 focus:ring-offset-gray-900"
                      : "text-indigo-600 border-gray-300 focus:ring-indigo-500 focus:ring-offset-white"
                  } transition-colors duration-200`}
                />
                <span className="font-medium">{amenity}</span>
              </label>
            ))}
          </div>
          {errors.amenities && (
            <p
              className={`text-sm ${
                currentTheme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            >
              {errors.amenities.message as string}{" "}
              {/* Cast to string as error might be array */}
            </p>
          )}
        </fieldset>

        {/* Images */}
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <label
            className={`block text-lg font-semibold mb-3 ${
              currentTheme === "dark" ? "text-gray-200" : "text-gray-800"
            }`}
          >
            Images ({images?.length || 0}/5)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className={`block w-full text-sm ${
              currentTheme === "dark" ? "text-gray-300" : "text-gray-700"
            } file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${
              currentTheme === "dark"
                ? "file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
                : "file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            } hover:file:cursor-pointer transition-colors duration-200`}
            disabled={(images?.length || 0) >= 5} // Disable input if max images reached
          />
          {(images?.length || 0) >= 5 && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              You have reached the maximum number of images (5).
            </p>
          )}
          <div className="flex flex-wrap gap-4 mt-4">
            <AnimatePresence>
              {images &&
                images.map((url, idx) => (
                  <motion.div
                    key={url} // Use URL as key for reliable animation
                    className={`relative w-32 h-32 rounded-lg overflow-hidden border shadow-sm ${
                      currentTheme === "dark"
                        ? "border-gray-700"
                        : "border-gray-200"
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={url}
                      alt={`Uploaded ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageDelete(idx)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 text-xs opacity-90 hover:opacity-100 transition-opacity duration-200"
                      aria-label="Delete image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
          {errors.images && (
            <p
              className={`text-sm ${
                currentTheme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            >
              {errors.images.message as string}{" "}
              {/* Cast to string as error might be array */}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className={`w-full py-3 text-lg font-semibold rounded-lg transition-colors duration-200 ${
            currentTheme === "dark"
              ? "bg-indigo-700 hover:bg-indigo-800 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
          ) : (
            "Update Post"
          )}
        </Button>
      </motion.form>
      <AnimatePresence>
        {showUpdatingModal && (
          <AlertDialog
            open={showUpdatingModal}
            onOpenChange={setShowUpdatingModal}
          >
            <AlertDialogContent
              className={`w-96 max-w-full p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-6 transition-colors duration-300 ${
                currentTheme === "dark"
                  ? "bg-gray-800 text-gray-200"
                  : "bg-white text-gray-800"
              }`}
            >
              {/* Spinner */}
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className={`h-14 w-14 rounded-full border-4 ${
                  currentTheme === "dark"
                    ? "border-indigo-600 border-t-indigo-400"
                    : "border-indigo-300 border-t-indigo-600"
                }`}
              />

              <AlertDialogTitle
                className={`text-xl font-semibold text-center ${
                  currentTheme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Updating your post
              </AlertDialogTitle>

              <AlertDialogDescription
                className={`text-base text-center ${
                  currentTheme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Please wait a moment while we save your changes.
              </AlertDialogDescription>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </AnimatePresence>
    </div> // Close the main container div
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/edit-post/$postId",
    component: EditPost,
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) return redirect({ to: "/" });
    },
  });
