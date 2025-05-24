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

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { isAuthenticated } from "@/lib/auth";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
  type: z.enum(["Room", "House", "PG", "Shared"], "Select a valid type"),
  occupancy: z.enum(
    ["Single", "Double", "Triple", "Any"],
    "Select a valid occupancy"
  ),
  furnished: z.boolean().optional(),
  availableFrom: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

export function EditPost() {
  const navigate = useNavigate();
  const { postId } = useParams({ from: "/edit-post/$postId" });
  const token = localStorage.getItem("token");

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
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      location: "",
      type: "",
      occupancy: "",
      furnished: false,
      availableFrom: "",
      amenities: [],
      images: [],
    },
  });

  // Sync post data to form
  useEffect(() => {
    if (post) {
      // Format date
      let formattedDate = "";
      if (post.availableFrom) {
        const dateObj = new Date(post.availableFrom);
        formattedDate = !isNaN(dateObj.getTime())
          ? dateObj.toISOString().split("T")[0]
          : "";
      }

      setValue("title", post.title || "");
      setValue("description", post.description || "");
      setValue("price", String(post.price || ""));
      setValue("location", post.location || "");
      setValue("type", post.type || "");
      setValue("occupancy", post.occupancy || "");
      setValue("furnished", post.furnished || false);
      setValue("availableFrom", formattedDate);
      setValue("amenities", post.amenities || []);
      setValue("images", post.images || []);
    }
  }, [post, setValue]);

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
      formData.append("folder", "HomiQ");

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");
      const uploadResult = await uploadResponse.json();
      return uploadResult.secure_url;
    } catch (error) {
      toast.error("Image upload failed");
      throw error;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const uploadedUrls: string[] = [];
    try {
      toast.loading("Uploading images...", { id: "upload" });

      for (const file of files) {
        const url = await uploadImageToCloudinary(file);
        uploadedUrls.push(url);
      }

      setValue("images", [...(images || []), ...uploadedUrls]);
      toast.success("Images uploaded!", { id: "upload" });
    } catch {
      toast.error("Upload failed", { id: "upload" });
    }
  };

  const handleImageDelete = async (index: number) => {
    const urlToDelete = images?.[index];
    if (!urlToDelete) return;
    const publicId = getPublicIdFromUrl(urlToDelete);
    if (!publicId) return toast.error("Invalid image URL");

    try {
      toast.loading("Deleting image...", { id: "deleteImage" });

      await axios.delete("http://localhost:5000/api/cloudinary/delete", {
        data: { publicId },
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedImages = [...(images || [])];
      updatedImages.splice(index, 1);

      setValue("images", updatedImages);
      toast.success("Image deleted", { id: "deleteImage" });
    } catch {
      toast.error("Deletion failed", { id: "deleteImage" });
    }
  };

  const [isUpdating, setIsUpdating] = useState(false);
  const onSubmit = async (data: FormData) => {
    try {
      setIsUpdating(true); // show modal

      const payload = { ...data, price: Number(data.price) };
      await axios.put(`http://localhost:5000/api/posts/${postId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Delay for 1 second so user can see the modal spinner
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsUpdating(false);
      navigate({ to: "/myposts" });
    } catch (err) {
      setIsUpdating(false);
      // show error toast or modal here if you want
    }
  };

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading post.</div>;

  return (
    <>
      <Toaster />
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-3xl mx-auto space-y-6 p-8 bg-white shadow-2xl rounded-2xl border border-gray-100"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-4xl font-extrabold text-indigo-700">Edit Post</h2>

        {/* Title */}
        <div className="space-y-1">
          <label className="block font-medium text-gray-700">Title</label>
          <Input {...register("title")} />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="block font-medium text-gray-700">Description</label>
          <Textarea {...register("description")} />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Price */}
        <div className="space-y-1">
          <label className="block font-medium text-gray-700">Price</label>
          <Input
            type="text"
            {...register("price")}
            placeholder="Enter price (numbers only)"
          />
          {errors.price && (
            <p className="text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-1">
          <label className="block font-medium text-gray-700">Location</label>
          <Input {...register("location")} />
          {errors.location && (
            <p className="text-sm text-red-600">{errors.location.message}</p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-1">
          <label className="block font-medium text-gray-700">Type</label>
          <select
            {...register("type")}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Select Type</option>
            <option value="Room">Room</option>
            <option value="House">House</option>
            <option value="PG">PG</option>
            <option value="Shared">Shared</option>
          </select>
          {errors.type && (
            <p className="text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Occupancy */}
        <div className="space-y-1">
          <label className="block font-medium text-gray-700">Occupancy</label>
          <select
            {...register("occupancy")}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Select Occupancy</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Triple">Triple</option>
            <option value="Any">Any</option>
          </select>
          {errors.occupancy && (
            <p className="text-sm text-red-600">{errors.occupancy.message}</p>
          )}
        </div>

        {/* Furnished */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register("furnished")}
            id="furnished"
            className="form-checkbox h-5 w-5 text-indigo-600"
          />
          <label htmlFor="furnished" className="text-gray-700 font-medium">
            Furnished
          </label>
        </div>

        {/* Available From */}
        <div className="space-y-1">
          <label className="block font-medium text-gray-700">
            Available From
          </label>
          <Input type="date" {...register("availableFrom")} />
        </div>

        {/* Amenities as checkboxes */}
        <fieldset className="space-y-2">
          <legend className="text-gray-700 font-semibold">Amenities</legend>
          <div className="flex flex-wrap gap-4">
            {amenitiesList.map((amenity) => (
              <label
                key={amenity}
                className="inline-flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={amenity}
                  checked={amenities?.includes(amenity) ?? false}
                  onChange={() => toggleAmenity(amenity)}
                  className="form-checkbox h-5 w-5 text-indigo-600"
                />
                <span className="text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
          {errors.amenities && (
            <p className="text-sm text-red-600">{errors.amenities.message}</p>
          )}
        </fieldset>

        {/* Images */}
        <div>
          <label className="block font-medium text-gray-700 mb-2">Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="mb-4"
          />
          <div className="flex flex-wrap gap-4">
            {images &&
              images.map((url, idx) => (
                <div
                  key={idx}
                  className="relative w-32 h-32 rounded-md overflow-hidden border border-gray-200"
                >
                  <img
                    src={url}
                    alt={`Uploaded ${idx}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageDelete(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
          </div>
        </div>

        <Button type="submit" className="w-full py-3 text-lg font-semibold">
          Update Post
        </Button>
      </motion.form>
      {isUpdating && (
        <AlertDialog open={isUpdating} onOpenChange={setIsUpdating}>
          <AlertDialogContent className="w-96 max-w-full p-8 rounded-2xl bg-white shadow-xl flex flex-col items-center justify-center gap-6">
            {/* Spinner */}
            <div className="h-14 w-14 rounded-full border-4 border-indigo-300 border-t-indigo-600 animate-spin" />

            <AlertDialogTitle className="text-xl font-semibold text-gray-800">
              Updating your post
            </AlertDialogTitle>

            <AlertDialogDescription className="text-base text-gray-500 text-center">
              Please wait a moment while we save your changes.
            </AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
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
