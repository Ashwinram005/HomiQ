import React, { useState, useEffect } from "react";
import {
  createRoute,
  redirect,
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submitting form:", formData);

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
      <Toaster /> {/* Ensure toast notifications are visible */}
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

// Route definition for TanStack Router
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
