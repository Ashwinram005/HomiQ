import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField, Typography, Box } from "@mui/material";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Check, Loader2, Moon, Sun } from "lucide-react";
import {
  createRoute,
  redirect,
  RootRoute,
  useNavigate,
} from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";

// Form schema
const postSchema = z.object({
  email: z.string(),
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
const email = localStorage.getItem("email");
const amenitiesList = [
  "Wi-Fi",
  "AC",
  "Parking",
  "Laundry",
  "TV",
  "Refrigerator",
];

export const MultiStepPostForm = () => {
  const [showSubmittingModal, setShowSubmittingModal] = useState(false);
  const theme = localStorage.getItem("theme"); // Get theme

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
      throw error; // Rethrow to handle in onSubmit
    }
  };

  const createPost = async (data: PostFormData) => {
    const token = localStorage.getItem("token"); // or sessionStorage or from context

    const response = await fetch("http://localhost:5000/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to submit post");

    return response.json();
  };

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      setShowSubmittingModal(false);

      navigate({ to: "/dashboard" });
    },
    onError: () => {
      alert("Something went wrong.");
      setShowSubmittingModal(false);
    },
  });

  const methods = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { email: email, amenities: [], furnished: false },
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
    setShowSubmittingModal(true);
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

      // Prepare post payload with image URLs instead of FileList
      const postPayload = {
        ...data,
        images: imageUrls, // add images field with URLs
      };

      // Remove imageFile field from payload because it's raw files
      delete postPayload.imageFile;

      // Now send postPayload to your backend
      mutation.mutate(postPayload);
    } catch (error: any) {
      alert("Error uploading images or submitting form: " + error.message);
      setShowSubmittingModal(false); // Hide modal on error
    }
  };
  const getTheme = (): "light" | "dark" => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  };
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(
    getTheme()
  );
  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
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

  // Determine background class based on theme
  const backgroundClass = theme === "dark" ? "bg-gray-900" : "bg-white";

  return (
    <FormProvider {...methods}>
      <div
        className={`w-full h-screen mx-auto p-6 sm:p-10 shadow-2xl flex flex-col relative ${backgroundClass}`}
      >
        {/* 🌗 Theme Toggle Icon (Top Right Corner) */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-full border transition-colors duration-300
            hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-800" />
          )}
        </button>

        {/* Stepper Top Navigation */}
        <div
          className={`w-full flex justify-around py-4 border-b ${
            theme === "dark" ? "border-gray-700" : "border-gray-300"
          } mb-8`}
        >
          {stepLabels.map((label, index) => {
            const isActive = index === step;
            const isCompleted = step > index;
            const textColor =
              theme === "dark" ? "text-gray-300" : "text-gray-600";

            return (
              <div key={label} className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm transition-colors
                    ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-600 text-white"
                        : "bg-gray-300 text-gray-800"
                    }`}
                >
                  {isCompleted ? <Check size={20} /> : index + 1}
                </div>
                <div
                  className={`text-sm font-medium text-center ${
                    isActive ? "text-blue-600" : textColor
                  }`}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Form Body */}
        <form className="flex-1 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.4 }}
                className={`border p-8 rounded-xl shadow-inner space-y-6 ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-50"
                }`}
              >
                {steps[step]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Button Bar */}
          <div
            className={`flex justify-between items-center border-t pt-6 mt-auto ${
              theme === "dark" ? "border-gray-700" : ""
            }`}
          >
            <div className="flex gap-3">
              <Button
                variant={theme === "dark" ? "secondary" : "outline"}
                type="button"
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>

              <Button
                variant={theme === "dark" ? "secondary" : "outline"}
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

        {/* Submitting Modal */}
        <AnimatePresence>
          {showSubmittingModal && (
            <motion.div
              key="modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className={`rounded-lg p-8 flex flex-col items-center space-y-4 max-w-sm w-full shadow-lg ${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                }`}
              >
                <Loader2 size={48} className="animate-spin text-blue-600" />
                <p
                  className={`text-lg font-semibold text-center ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Submitting your post, please wait...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FormProvider>
  );
};

// Step 1
const Step1 = () => {
  const { register, formState } = useFormContext<PostFormData>();
  const theme = localStorage.getItem("theme");
  const isDark = theme === "dark";

  // text color for Typography and inputs
  const textColor = isDark ? "white" : "black";
  const bgColor = isDark ? "gray-800" : "#fff";

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} color={textColor} mb={2}>
        Basic Information
      </Typography>

      <Box display="flex" flexDirection="column" gap={3}>
        <div>
          <Typography variant="body1" color={textColor}>
            Title <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextField
            {...register("title")}
            fullWidth
            variant="outlined"
            size="small"
            error={!!formState.errors.title}
            helperText={formState.errors.title?.message}
            InputProps={{
              style: {
                color: textColor,
                backgroundColor: bgColor,
              },
            }}
          />
        </div>

        <div>
          <Typography variant="body1" color={textColor}>
            Description <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextField
            {...register("description")}
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            size="small"
            error={!!formState.errors.description}
            helperText={formState.errors.description?.message}
            InputProps={{
              style: {
                color: textColor,
                backgroundColor: bgColor,
              },
            }}
          />
        </div>
      </Box>
    </Box>
  );
};

// Step 2

const Step2 = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const { register, setValue, watch, formState } =
    useFormContext<PostFormData>();
  const theme = localStorage.getItem("theme");
  const labelTextColor = theme === "dark" ? "text-gray-300" : "text-gray-800";

  // Debounced fetch using useCallback
  const fetchPlaces = useCallback(async (search) => {
    if (!search) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          search
        )}&format=json&addressdetails=1&limit=10`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Error fetching places:", err);
      setSuggestions([]);
    }
    setLoading(false);
  }, []);
  const inputTextColor =
    theme === "dark"
      ? "text-white bg-gray-900 placeholder-gray-400"
      : "text-gray-900 bg-white placeholder-gray-500";

  useEffect(() => {
    // debounce with cleanup
    const handler = setTimeout(() => {
      fetchPlaces(query);
    }, 500);

    return () => clearTimeout(handler);
  }, [query, fetchPlaces]);

  function handleSelect(place: any) {
    setValue("location", place.display_name, { shouldValidate: true });
    setQuery(place.display_name);
    setSuggestions([]);
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto px-6 py-10">
      <h3 className={`text-lg font-semibold ${labelTextColor} mb-4`}>
        Property Details
      </h3>
      <div className="space-y-4">
        {/* Price input */}
        <div>
          <Label className={labelTextColor}>Price (₹)</Label>
          <Input
            className={`${inputTextColor}`}
            type="number"
            {...register("price")}
          />
          <p className="text-red-500 text-sm">
            {formState.errors.price?.message}
          </p>
        </div>

        {/* Location input + dropdown */}
        <div className="relative">
          <Label className={labelTextColor}>Location</Label>
          <Input
            {...register("location")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            placeholder="Search for city, school, popular place..."
            className={`z-20 relative ${inputTextColor}`}
          />

          {suggestions.length > 0 && (
            <ul
              className={`absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-md border ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-300 bg-white"
              } shadow-lg scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100`}
            >
              {suggestions.map((place: any) => (
                <li
                  key={place.place_id}
                  onClick={() => handleSelect(place)}
                  className={`cursor-pointer px-3 py-2 ${
                    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                  }`}
                >
                  {place.display_name}
                </li>
              ))}
            </ul>
          )}
          <p className="text-red-500 text-sm">
            {formState.errors.location?.message}
          </p>
        </div>

        {/* Type */}
        <div>
          <Label className={labelTextColor}>Type</Label>
          <Select
            value={watch("type")}
            onValueChange={(v) => setValue("type", v as any)}
          >
            <SelectTrigger className={inputTextColor}>
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

        {/* Occupancy */}
        <div>
          <Label className={labelTextColor}>Occupancy</Label>
          <Select
            value={watch("occupancy")}
            onValueChange={(v) => setValue("occupancy", v as any)}
          >
            <SelectTrigger className={inputTextColor}>
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
            {formState.errors.occupancy?.message}
          </p>
        </div>

        {/* Furnished checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="furnished"
            checked={watch("furnished")}
            onCheckedChange={(v) => setValue("furnished", !!v)}
          />
          <Label htmlFor="furnished" className={labelTextColor}>
            Furnished
          </Label>
        </div>

        {/* Available From */}
        <div>
          <Label className={labelTextColor}>Available From</Label>
          <Input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            {...register("availableFrom")}
            className={inputTextColor}
          />
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
  const { setValue, watch, formState, getValues } =
    useFormContext<PostFormData>();
  const selected = watch("amenities") || [];
  const theme = localStorage.getItem("theme");
  const textColor = theme === "dark" ? "text-gray-300" : "text-gray-800";

  // Use a local state to keep track of uploaded images as File[]
  const [images, setImages] = useState<File[]>(() => {
    const files = getValues("imageFile");
    if (files && files instanceof FileList) {
      return Array.from(files);
    }
    return [];
  });

  useEffect(() => {
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
      <h3 className={`text-lg font-semibold ${textColor} mb-4`}>
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
            <Label htmlFor={item} className={textColor}>
              {item}
            </Label>
          </div>
        ))}
      </div>

      <div>
        <Label className={textColor}>Upload Images</Label>
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
            className={`relative w-24 h-24 border rounded overflow-hidden ${
              theme === "dark" ? "border-gray-700" : ""
            }`}
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

  // Fetch theme from local storage
  const theme = localStorage.getItem("theme"); // Assuming the theme is stored under the key "theme"

  // Determine text color based on theme
  const labelTextColor = theme === "dark" ? "text-gray-300" : "text-gray-800";
  const valueTextColor = theme === "dark" ? "text-gray-400" : "text-gray-700";

  // Create image URLs to preview
  const imagePreviews = imageFiles
    ? Array.from(imageFiles).map((file) => URL.createObjectURL(file))
    : [];
  const data = watch();

  return (
    <div className="w-full max-w-4xl mx-auto p-6  dark:bg-gray-900 rounded-xl shadow-lg">
      <h3 className={`text-2xl font-semibold mb-6 ${labelTextColor}`}>
        Confirm Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className={labelTextColor}>Title</Label>
          <p className={`mt-1 ${valueTextColor}`}>{data.title}</p>
        </div>

        <div>
          <Label className={labelTextColor}>Description</Label>
          <p className={`mt-1 ${valueTextColor}`}>{data.description}</p>
        </div>

        <div>
          <Label className={labelTextColor}>Price (₹)</Label>
          <p className={`mt-1 ${valueTextColor}`}>{data.price}</p>
        </div>

        <div>
          <Label className={labelTextColor}>Location</Label>
          <p className={`mt-1 ${valueTextColor}`}>{data.location}</p>
        </div>

        <div>
          <Label className={labelTextColor}>Type</Label>
          <p className={`mt-1 ${valueTextColor}`}>{data.type}</p>
        </div>

        <div>
          <Label className={labelTextColor}>Occupancy</Label>
          <p className={`mt-1 ${valueTextColor}`}>{data.occupancy}</p>
        </div>

        <div>
          <Label className={labelTextColor}>Furnished</Label>
          <p className={`mt-1 ${valueTextColor}`}>
            {data.furnished ? "Yes" : "No"}
          </p>
        </div>

        <div>
          <Label className={labelTextColor}>Available From</Label>
          <p className={`mt-1 ${valueTextColor}`}>{data.availableFrom}</p>
        </div>

        <div className="md:col-span-2">
          <Label className={labelTextColor}>Amenities</Label>
          <p className={`mt-1 ${valueTextColor}`}>
            {data.amenities?.join(", ") || "None"}
          </p>
        </div>

        <div className="md:col-span-2">
          <Label className={labelTextColor}>Images</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
            {imagePreviews.length > 0 ? (
              imagePreviews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Uploaded preview ${idx + 1}`}
                  className="w-full h-40 object-cover rounded-lg shadow-md"
                />
              ))
            ) : (
              <p className={valueTextColor}>No images uploaded.</p>
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
