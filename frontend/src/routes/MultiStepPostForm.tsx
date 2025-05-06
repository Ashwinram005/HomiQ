import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { Label } from "@/components/ui/label";

const postSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  price: z.string().min(1, "Price is required"),
  location: z.string().min(3, "Location is required"),
  type: z.enum(["Room", "House", "PG", "Shared"]),
  occupancy: z.enum(["Single", "Double", "Triple", "Any"]),
  furnished: z.boolean(),
  availableFrom: z.string().min(1, "Availability date is required"),
  amenities: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

const amenitiesList = ["Wi-Fi", "AC", "Parking", "Laundry", "TV", "Refrigerator"];

export default function MultiStepPostForm() {
  const methods = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    mode: "onBlur",
    defaultValues: { amenities: [] },
  });

  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: PostFormData) => {
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
      } else alert("Failed to create post.");
    } catch {
      alert("Error posting data.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    <Step1 key="1" />,
    <Step2 key="2" />,
    <Step3 key="3" />,
  ];

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-md space-y-6"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between pt-4">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button type="button" onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

// Step 1: Basic Info
const Step1 = () => {
  const { register, formState } = useFormContext<PostFormData>();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Basic Information</h2>
      <div>
        <Label>Title</Label>
        <Input {...register("title")} />
        <p className="text-red-500 text-sm">{formState.errors.title?.message}</p>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea {...register("description")} rows={4} />
        <p className="text-red-500 text-sm">{formState.errors.description?.message}</p>
      </div>
    </div>
  );
};

// Step 2: Property Details
const Step2 = () => {
  const { register, setValue, watch, formState } = useFormContext<PostFormData>();
  const type = watch("type");
  const occupancy = watch("occupancy");

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Property Details</h2>

      <div>
        <Label>Price (₹)</Label>
        <Input type="number" {...register("price")} />
        <p className="text-red-500 text-sm">{formState.errors.price?.message}</p>
      </div>

      <div>
        <Label>Location</Label>
        <Input {...register("location")} />
        <p className="text-red-500 text-sm">{formState.errors.location?.message}</p>
      </div>

      <div>
        <Label>Accommodation Type</Label>
        <Select onValueChange={(value) => setValue("type", value as PostFormData["type"])}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Room">Room</SelectItem>
            <SelectItem value="House">House</SelectItem>
            <SelectItem value="PG">PG</SelectItem>
            <SelectItem value="Shared">Shared</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Occupancy</Label>
        <Select onValueChange={(value) => setValue("occupancy", value as PostFormData["occupancy"])}>
          <SelectTrigger>
            <SelectValue placeholder="Select occupancy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Single">Single</SelectItem>
            <SelectItem value="Double">Double</SelectItem>
            <SelectItem value="Triple">Triple</SelectItem>
            <SelectItem value="Any">Any</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="furnished" onCheckedChange={(checked) => setValue("furnished", !!checked)} />
        <Label htmlFor="furnished">Furnished</Label>
      </div>

      <div>
        <Label>Available From</Label>
        <Input type="date" {...register("availableFrom")} />
        <p className="text-red-500 text-sm">{formState.errors.availableFrom?.message}</p>
      </div>
    </div>
  );
};

// Step 3: Amenities & Image
const Step3 = () => {
  const { register, setValue, watch } = useFormContext<PostFormData>();
  const selected = watch("amenities");

  const toggleAmenity = (item: string) => {
    const updated = selected?.includes(item)
      ? selected.filter((a) => a !== item)
      : [...(selected || []), item];
    setValue("amenities", updated);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Amenities & Image</h2>

      <div className="grid grid-cols-2 gap-3">
        {amenitiesList.map((item) => (
          <div key={item} className="flex items-center space-x-2">
            <Checkbox
              id={item}
              checked={selected?.includes(item)}
              onCheckedChange={() => toggleAmenity(item)}
            />
            <Label htmlFor={item}>{item}</Label>
          </div>
        ))}
      </div>

      <div>
        <Label>Image URL</Label>
        <Input {...register("imageUrl")} placeholder="https://your-image.url" />
      </div>
    </div>
  );
};
