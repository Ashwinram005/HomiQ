import React, { useState, useEffect } from "react";
import { isAuthenticated } from "@/lib/auth";
import {
  createRoute,
  redirect,
  useParams,
  type RootRoute,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function EditPost() {
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
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

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
      });

      setExistingImages(post.images || []);
    }
  }, [post]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages(Array.from(e.target.files));
    }
  };

  const handleDeleteExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const updatedData = {
        ...formData,
        amenities: formData.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      };

      let uploadedUrls: string[] = [];

      if (newImages.length > 0) {
        const formDataImg = new FormData();
        newImages.forEach((file) => formDataImg.append("images", file));

        const imageUploadRes = await axios.post(
          "http://localhost:5000/api/upload",
          formDataImg,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        uploadedUrls = imageUploadRes.data.urls;
      }

      updatedData.images = [...existingImages, ...uploadedUrls];

      await axios.put(
        `http://localhost:5000/api/posts/${postId}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Post updated successfully!");
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update post.");
    }
  };

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading post.</div>;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto space-y-6 p-6 bg-white shadow-xl rounded-xl"
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

      {/* Existing Image Preview + Delete */}
      <div>
        <label className="block font-medium mb-1 text-gray-700">
          Current Images
        </label>
        <div className="flex flex-wrap gap-3">
          {existingImages.length > 0 ? (
            existingImages.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24">
                <img
                  src={img}
                  alt={`Room ${idx}`}
                  className="w-full h-full object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteExistingImage(idx)}
                  className="absolute top-0 right-0 bg-red-600 text-white text-xs px-1 rounded-bl hover:bg-red-700"
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No images</p>
          )}
        </div>
      </div>

      {/* New Image Upload */}
      <div>
        <label className="block font-medium mb-1 text-gray-700">
          Upload New Images
        </label>
        <Input type="file" multiple onChange={handleImageChange} />
      </div>

      <Button
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded-lg"
      >
        Update Post
      </Button>
    </form>
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
