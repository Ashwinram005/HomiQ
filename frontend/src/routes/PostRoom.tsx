// src/components/PostForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Validation Schema
const postFormSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  price: z.number().positive(),
  location: z.string().min(3),
  accommodationType: z.enum(["PG", "Hostel", "Apartment", "House", "Shared Room"]),
  roomType: z.enum(["Private", "Shared", "Entire Place"]),
  beds: z.number().min(1),
  availableFrom: z.string(),
  availableTo: z.string(),
  genderPreference: z.enum(["Male", "Female", "Unisex"]),
  amenities: z.array(z.string()).optional(),
  furnishing: z.enum(["Furnished", "Semi-Furnished", "Unfurnished"]),
  rules: z.string().optional(),
  contact: z.string().min(10),
  imageUrl: z.string().url().optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

const PostForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
  });

  const handlePostSubmit = async (data: PostFormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        alert("Post created!");
        navigate({ to: "/dashboard" });
      } else alert("Failed to post.");
    } catch (err) {
      alert("Server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg mt-6">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">Post Accommodation</h2>
      <form onSubmit={handleSubmit(handlePostSubmit)} className="space-y-5">

        <Input label="Title" {...register("title")} placeholder="Room title" />
        {errors.title && <p className="text-red-500">{errors.title.message}</p>}

        <Textarea label="Description" {...register("description")} placeholder="Room description" />

        <Input label="Price" type="number" {...register("price", { valueAsNumber: true })} />
        <Input label="Location" {...register("location")} />
        <Input label="Contact" {...register("contact")} />

        <select {...register("accommodationType")} className="w-full border rounded p-2">
          <option value="">Select Accommodation Type</option>
          <option value="PG">PG</option>
          <option value="Hostel">Hostel</option>
          <option value="Apartment">Apartment</option>
          <option value="House">House</option>
          <option value="Shared Room">Shared Room</option>
        </select>

        <select {...register("roomType")} className="w-full border rounded p-2">
          <option value="">Select Room Type</option>
          <option value="Private">Private</option>
          <option value="Shared">Shared</option>
          <option value="Entire Place">Entire Place</option>
        </select>

        <Input label="Beds" type="number" {...register("beds", { valueAsNumber: true })} />

        <Input label="Available From" type="date" {...register("availableFrom")} />
        <Input label="Available To" type="date" {...register("availableTo")} />

        <select {...register("genderPreference")} className="w-full border rounded p-2">
          <option value="">Gender Preference</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Unisex">Unisex</option>
        </select>

        <select {...register("furnishing")} className="w-full border rounded p-2">
          <option value="">Furnishing</option>
          <option value="Furnished">Furnished</option>
          <option value="Semi-Furnished">Semi-Furnished</option>
          <option value="Unfurnished">Unfurnished</option>
        </select>

        <Textarea label="Rules" {...register("rules")} placeholder="e.g., No pets, No smoking" />

        <Input label="Image URL" {...register("imageUrl")} />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Posting..." : "Post Accommodation"}
        </Button>
      </form>
    </div>
  );
};

export default PostForm;
