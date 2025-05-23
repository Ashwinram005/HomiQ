import React, { useState, useEffect } from "react";
import {
  createRoute,
  redirect,
  useNavigate,
  useParams,
  type RootRoute,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { isAuthenticated } from "@/lib/auth";

export function EditPost() {
  const navigate = useNavigate();
  function getPublicIdFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");

      // Find version part (e.g. /v1685000000/)
      const versionIndex = pathParts.findIndex((part) => /^v\d+$/.test(part));
      if (versionIndex === -1) return null;

      // Everything after version is publicId + extension
      const publicIdParts = pathParts.slice(versionIndex + 1);
      const publicIdWithExt = publicIdParts.join("/");

      // Remove file extension
      return publicIdWithExt.replace(/\.[^/.]+$/, "");
    } catch {
      return null;
    }
  }

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

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    type: "",
    occupancy: "",
    furnished: false,
    availableFrom: "",
    amenities: "",
    images: [] as string[],
  });

  useEffect(() => {
    if (post) {
      let formattedDate = "";
      if (post.availableFrom) {
        const dateObj = new Date(post.availableFrom);
        formattedDate = !isNaN(dateObj.getTime())
          ? dateObj.toISOString().split("T")[0]
          : "";
      }

      setFormData({
        title: post.title || "",
        description: post.description || "",
        price: post.price || "",
        location: post.location || "",
        type: post.type || "",
        occupancy: post.occupancy || "",
        furnished: post.furnished || false,
        availableFrom: formattedDate,
        amenities: post.amenities?.join(", ") || "",
        images: post.images || [],
      });
    }
  }, [post]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const uploadImageToCloudinary = async (file: File) => {
    try {
      const signatureResponse = await fetch(
        "http://localhost:5000/api/cloudinary/sign"
      );
      if (!signatureResponse.ok)
        throw new Error("Failed to get Cloudinary signature");

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

      if (!uploadResponse.ok)
        throw new Error("Failed to upload image to Cloudinary");

      const uploadResult = await uploadResponse.json();
      return uploadResult.secure_url;
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Image upload failed. Please try again.");
      throw error;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const uploadedUrls: string[] = [];

    try {
      toast.loading("Uploading images...", { id: "upload" });

      for (const file of files) {
        const imageUrl = await uploadImageToCloudinary(file);
        uploadedUrls.push(imageUrl);
      }

      toast.success("Images uploaded!", { id: "upload" });

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (error) {
      toast.error("Image upload failed", { id: "upload" });
    }
  };

  const handleImageDelete = async (index: number) => {
    const urlToDelete = formData.images[index];
    const publicId = getPublicIdFromUrl(urlToDelete);

    if (!publicId) {
      toast.error("Invalid image URL, can't delete.");
      return;
    }

    try {
      toast.loading("Deleting image...", { id: "deleteImage" });

      await axios.delete("http://localhost:5000/api/cloudinary/delete", {
        data: { publicId },
        headers: {
          Authorization: `Bearer ${token}`, // if your backend requires auth
        },
      });

      const updatedImages = [...formData.images];
      updatedImages.splice(index, 1);

      setFormData((prev) => ({ ...prev, images: updatedImages }));
      toast.success("Image deleted successfully", { id: "deleteImage" });
    } catch (error) {
      console.error("Image deletion error:", error);
      toast.error("Failed to delete image", { id: "deleteImage" });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      toast.loading("Updating post...", { id: "updatePost" });

      const updatedData = {
        ...formData,
        amenities: formData.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      };

      await axios.put(
        `http://localhost:5000/api/posts/${postId}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      navigate({ to: "/myposts" });
      toast.success("Post updated successfully!", { id: "updatePost" });
    } catch (err) {
      console.error("Update failed", err);
      toast.error("Failed to update post.", { id: "updatePost" });
    }
  };

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading post.</div>;

  return (
    <>
      <Toaster />
      <motion.form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto space-y-6 p-6 bg-white shadow-xl rounded-xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-indigo-800 mb-4">Edit Post</h2>

        <Input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Title"
        />
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description"
        />
        <Input
          name="price"
          type="number"
          value={formData.price}
          onChange={handleChange}
          placeholder="Price"
        />
        <Input
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Location"
        />
        <Input
          name="type"
          value={formData.type}
          onChange={handleChange}
          placeholder="Type"
        />
        <Input
          name="occupancy"
          value={formData.occupancy}
          onChange={handleChange}
          placeholder="Occupancy"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="furnished"
            checked={formData.furnished}
            onChange={handleChange}
          />
          Furnished
        </label>

        <Input
          name="availableFrom"
          type="date"
          value={formData.availableFrom}
          onChange={handleChange}
        />
        <Input
          name="amenities"
          value={formData.amenities}
          onChange={handleChange}
          placeholder="Amenities (comma separated)"
        />

        {/* Image preview and upload */}
        <div className="space-y-2">
          <label className="font-medium">Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
          />
          <div className="flex flex-wrap gap-3 mt-2">
            {formData.images.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`img-${index}`}
                  className="w-24 h-24 rounded object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleImageDelete(index)}
                  className="absolute top-0 right-0 text-white bg-red-500 rounded-full w-5 h-5 text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded-lg"
        >
          Update Post
        </Button>
      </motion.form>
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
