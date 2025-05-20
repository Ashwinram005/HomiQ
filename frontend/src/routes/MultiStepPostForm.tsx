import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Check, Loader2 } from "lucide-react";
import {
  createRoute,
  redirect,
  RootRoute,
  useNavigate,
} from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { getUserIdFromToken } from "@/lib/getUserIdFromToken";

// Form schema
const postSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  price: z.string().regex(/^\d+$/, "Price must be numeric"),
  location: z.string().min(3),
  type: z.enum(["Room", "House", "PG", "Shared"]),
  occupancy: z.enum(["Single", "Double", "Triple", "Any"]),
  furnished: z.boolean(),
  availableFrom: z
    .string()
    .min(1, { message: "Available From date is required" }), // required
  amenities: z.array(z.string()).optional(),
  imageFile: z
    .any()
    .refine((files) => files instanceof FileList && files.length > 0, {
      message: "Please upload at least one image",
    }),
});

type PostFormData = z.infer<typeof postSchema>;

const amenitiesList = [
  "Wi-Fi",
  "AC",
  "Parking",
  "Laundry",
  "TV",
  "Refrigerator",
];

export const MultiStepPostForm = () => {
  // Helper function to upload a single image to Cloudinary with signed upload
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
      throw error; // Rethrow to handle in onSubmit
    }
  };

  const createPost = async (data: PostFormData) => {
    const token = localStorage.getItem("token"); // or sessionStorage or from context
    console.log(token);
    const response = await fetch("http://localhost:5000/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to submit post");
    }

    return response.json();
  };

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      navigate({ to: "/dashboard" });
    },
    onError: () => {
      alert("Something went wrong.");
    },
  });

  const methods = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { amenities: [], furnished: false },
    mode: "onBlur",
  });

  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    <Step1 key="step1" />,
    <Step2 key="step2" />,
    <Step3 key="step3" />,
    <Step4 key="step4" />, // Add this step to the steps array
  ];
  const stepLabels = [
    "Basic Info",
    "Details",
    "Amenities & Image",
    "Confirm details",
  ];

  const onSubmit = async (data: PostFormData) => {
    try {
      const files = data.imageFile;
      if (!(files instanceof FileList) || files.length === 0) {
        throw new Error("No images selected");
      }

      // Upload images sequentially (can be parallel with Promise.all if you want)
      const imageUrls = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImageToCloudinary(files[i]);
        imageUrls.push(url);
      }
      console.log("Image URLs", imageUrls);
      // Prepare post payload with image URLs instead of FileList
      const postPayload = {
        ...data,
        images: imageUrls, // add images field with URLs
      };

      // Remove imageFile field from payload because it's raw files
      delete postPayload.imageFile;

      // Now send postPayload to your backend
      mutation.mutate(postPayload);
    } catch (error) {
      alert("Error uploading images or submitting form: " + error.message);
    }
  };

  const handleNext = async () => {
    let isValid = false;

    if (step === 0) {
      isValid = await methods.trigger(["title", "description"]);
    } else if (step === 1) {
      isValid = await methods.trigger([
        "price",
        "location",
        "type",
        "occupancy",
        "furnished",
        "availableFrom",
      ]);
    } else if (step === 2) {
      isValid = await methods.trigger(["imageFile", "amenities"]);
    }

    if (isValid && step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      console.log("Validation errors:", methods.formState.errors);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="w-full h-screen mx-auto p-6 sm:p-10 bg-white rounded-3xl shadow-2xl flex gap-10">
        {/* Stepper Sidebar */}
        <div className="w-1/4 min-w-[220px] bg-white border-r px-6 py-10 space-y-6 shadow-md">
          {stepLabels.map((label, index) => {
            const isActive = index === step;
            const isCompleted = step > index;

            return (
              <div key={label} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm transition-colors
                ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-800"
                }
              `}
                >
                  {isCompleted ? <Check size={16} /> : index + 1}
                </div>
                <div
                  className={`text-sm font-medium ${
                    isActive ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Form Area */}
        <form className="w-3/4 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.4 }}
                className="bg-gray-50 border p-8 rounded-xl shadow-inner space-y-6"
              >
                {steps[step]}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center border-t pt-6 mt-auto">
            <div className="flex gap-3">
              <Button
                variant="outline"
                type="button"
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>

              <Button
                variant="ghost"
                type="button"
                onClick={() => navigate({ to: "/dashboard" })}
              >
                Cancel
              </Button>
            </div>

            {step < steps.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => methods.handleSubmit(onSubmit)()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Submit"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
};

// Step 1
const Step1 = () => {
  const { register, formState } = useFormContext<PostFormData>();
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Basic Information
      </h3>
      <div className="space-y-4">
        <div>
          <Label>
            Title <span className="text-red-500">*</span>
          </Label>
          <Input {...register("title")} />
          <p className="text-red-500 text-sm">
            {formState.errors.title?.message}
          </p>
        </div>
        <div>
          <Label>
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea rows={4} {...register("description")} />
          <p className="text-red-500 text-sm">
            {formState.errors.description?.message}
          </p>
        </div>
      </div>
    </div>
  );
};

// Step 2
const Step2 = () => {
  const { register, setValue, watch, formState } =
    useFormContext<PostFormData>();
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Property Details
      </h3>
      <div className="space-y-4">
        <div>
          <Label>Price (₹)</Label>
          <Input type="number" {...register("price")} />
          <p className="text-red-500 text-sm">
            {formState.errors.price?.message}
          </p>
        </div>
        <div>
          <Label>Location</Label>
          <Input {...register("location")} />
          <p className="text-red-500 text-sm">
            {formState.errors.location?.message}
          </p>
        </div>
        <div>
          <Label>Type</Label>
          <Select
            value={watch("type")}
            onValueChange={(v) => setValue("type", v as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose type" />
            </SelectTrigger>
            <SelectContent>
              {["Room", "House", "PG", "Shared"].map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-red-500 text-sm">
            {formState.errors.type?.message}
          </p>
        </div>
        <div>
          <Label>Occupancy</Label>
          <Select
            value={watch("occupancy")}
            onValueChange={(v) => setValue("occupancy", v as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose occupancy" />
            </SelectTrigger>
            <SelectContent>
              {["Single", "Double", "Triple", "Any"].map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-red-500 text-sm">
            {formState.errors.type?.message}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="furnished"
            checked={watch("furnished")}
            onCheckedChange={(v) => setValue("furnished", !!v)}
          />
          <Label htmlFor="furnished">Furnished</Label>
        </div>
        <div>
          <Label>Available From</Label>
          <Input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            {...register("availableFrom")}
          />{" "}
          <p className="text-red-500 text-sm">
            {formState.errors.availableFrom?.message}
          </p>
        </div>
      </div>
    </div>
  );
};

// Step 3

const Step3 = () => {
  const { setValue, watch, formState } = useFormContext<PostFormData>();
  const selected = watch("amenities") || [];

  // Use a local state to keep track of uploaded images as File[]
  const [images, setImages] = useState<File[]>([]);

  // Sync form value "imageFile" with images state whenever images state changes
  useEffect(() => {
    // Create a DataTransfer object to convert array to FileList (hacky way)
    const dataTransfer = new DataTransfer();
    images.forEach((file) => dataTransfer.items.add(file));
    setValue("imageFile", dataTransfer.files, { shouldValidate: true });
  }, [images, setValue]);

  // Handler when new files are uploaded
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    // Append new files to existing images array
    setImages((prev) => [...prev, ...Array.from(e.target.files)]);
    // Reset input value so same file can be uploaded again if needed
    e.target.value = "";
  };

  // Handler to remove image by index
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle amenities function remains same
  const toggleAmenity = (item: string) => {
    const updated = selected.includes(item)
      ? selected.filter((a) => a !== item)
      : [...selected, item];
    setValue("amenities", updated);
  };

  // Generate preview URLs for images
  const imagePreviews = images.map((file) => URL.createObjectURL(file));

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Amenities & Image
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        {amenitiesList.map((item) => (
          <div key={item} className="flex items-center space-x-2">
            <Checkbox
              id={item}
              checked={selected.includes(item)}
              onCheckedChange={() => toggleAmenity(item)}
            />
            <Label htmlFor={item}>{item}</Label>
          </div>
        ))}
      </div>

      <div>
        <Label>Upload Images</Label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />
        {formState.errors.imageFile && (
          <p className="text-red-500 text-sm">
            {formState.errors.imageFile.message}
          </p>
        )}
      </div>

      {/* Image preview with delete buttons */}
      <div className="mt-4 flex flex-wrap gap-4">
        {imagePreviews.map((src, idx) => (
          <div
            key={idx}
            className="relative w-24 h-24 border rounded overflow-hidden"
          >
            <img
              src={src}
              alt={`Preview ${idx}`}
              className="object-cover w-full h-full"
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(idx)}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Step4 = () => {
  const { watch } = useFormContext<PostFormData>();
  const imageFiles = watch("imageFile");

  // Create image URLs to preview
  const imagePreviews = imageFiles
    ? Array.from(imageFiles).map((file) => URL.createObjectURL(file))
    : [];
  const data = watch();

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Confirm Details
      </h3>
      <div className="space-y-4">
        <div>
          <Label>Title</Label>
          <p>{data.title}</p>
        </div>
        <div>
          <Label>Description</Label>
          <p>{data.description}</p>
        </div>
        <div>
          <Label>Price (₹)</Label>
          <p>{data.price}</p>
        </div>
        <div>
          <Label>Location</Label>
          <p>{data.location}</p>
        </div>
        <div>
          <Label>Type</Label>
          <p>{data.type}</p>
        </div>
        <div>
          <Label>Occupancy</Label>
          <p>{data.occupancy}</p>
        </div>
        <div>
          <Label>Furnished</Label>
          <p>{data.furnished ? "Yes" : "No"}</p>
        </div>
        <div>
          <Label>Available From</Label>
          <p>{data.availableFrom}</p>
        </div>
        <div>
          <Label>Amenities</Label>
          <p>{data.amenities?.join(", ") || "None"}</p>
        </div>
        <div>
          <Label>Images</Label>
          <div className="grid grid-cols-3 gap-4 mt-2">
            {imagePreviews.length > 0 ? (
              imagePreviews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Uploaded preview ${idx + 1}`}
                  className="w-full h-40 object-cover rounded-md"
                />
              ))
            ) : (
              <p>No images uploaded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/post",
    component: MultiStepPostForm,
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) {
        return redirect({ to: "/" });
      }
    },
  });
