import { useState } from "react";
import { Button } from "@/components/ui/button"; // ShadCN Button
import { Input } from "@/components/ui/input"; // ShadCN Input
import { Textarea } from "@/components/ui/textarea"; // ShadCN Textarea
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod"; // Using Zod for form validation
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const postFormSchema = z.object({
  title: z.string().min(5, "Title should be at least 5 characters long"),
  description: z.string().min(10, "Description should be at least 10 characters long"),
  price: z.number().positive("Price must be a positive number"),
  location: z.string().min(3, "Location is required"),
  imageUrl: z.string().url("Invalid image URL format").optional(),
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("Post created successfully!");
        navigate({ to: "/dashboard" }); // Redirect to dashboard
      } else {
        alert("Error creating post.");
      }
    } catch (error) {
      console.error("Error submitting the post:", error);
      alert("Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg mt-6">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">Post a Room</h2>
      <form onSubmit={handleSubmit(handlePostSubmit)} className="space-y-6">
        
        <div className="space-y-2">
          <label htmlFor="title" className="block text-gray-700">Room Title</label>
          <Input
            id="title"
            {...register("title")}
            className="w-full p-4 border rounded-md"
            placeholder="Enter room title"
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-gray-700">Description</label>
          <Textarea
            id="description"
            {...register("description")}
            className="w-full p-4 border rounded-md"
            placeholder="Enter a brief description"
            rows={4}
          />
          {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="price" className="block text-gray-700">Price</label>
          <Input
            id="price"
            type="number"
            {...register("price")}
            className="w-full p-4 border rounded-md"
            placeholder="Enter price per night"
          />
          {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="location" className="block text-gray-700">Location</label>
          <Input
            id="location"
            {...register("location")}
            className="w-full p-4 border rounded-md"
            placeholder="Enter location"
          />
          {errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="imageUrl" className="block text-gray-700">Image URL</label>
          <Input
            id="imageUrl"
            {...register("imageUrl")}
            className="w-full p-4 border rounded-md"
            placeholder="Optional: Enter image URL"
          />
          {errors.imageUrl && <p className="text-sm text-red-500">{errors.imageUrl.message}</p>}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg mt-4"
          disabled={loading}
        >
          {loading ? "Posting..." : "Post Room"}
        </Button>
      </form>
    </div>
  );
};

export default PostForm;
