import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Keep Textarea for better control if needed
import { Checkbox } from "@/components/ui/checkbox";
import { TextField, Typography, Box } from "@mui/material"; // Keep MUI for TextField
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
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be at most 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be at most 1000 characters"),
  price: z.number(), // Added non-negative assumption
  location: z.string().min(3, "Location is required"),
  type: z.enum(["Room", "House", "PG", "Shared"], {
    message: "Please select a property type",
  }),
  occupancy: z.enum(["Single", "Double", "Triple", "Any"], {
    message: "Please select an occupancy type",
  }),
  furnished: z.boolean(),
  availableFrom: z
    .string()
    .min(1, { message: "Available From date is required" })
    .refine(
      (dateString) => {
        // Validate future or today's date
        const selectedDate = new Date(dateString);
        selectedDate.setHours(0, 0, 0, 0); // Normalize to start of day
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        return selectedDate >= today;
      },
      { message: "Available From date cannot be in the past" }
    ),
  imageFile: z
    .any()
    .refine((files) => files instanceof FileList && files.length > 0, {
      message: "Please upload at least one image",
    }),
  amenities: z.array(z.string()).optional(),
});

type PostFormData = z.infer<typeof postSchema>;
const email = localStorage.getItem("email"); // Ensure this is not null for production
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
  const navigate = useNavigate();

  // Theme state and logic for the parent component
  const getTheme = (): "light" | "dark" => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  };
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(
    getTheme()
  );

  useEffect(() => {
    // Apply theme class to HTML element on mount and theme change
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(currentTheme);
    }
  }, [currentTheme]);

  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    localStorage.setItem("theme", newTheme); // Store in local storage
  };

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
      formData.append("folder", "HomiQ"); // Ensure this folder exists or is desired
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
      // alert("Image upload failed. Please try again."); // Moved error handling to mutation
      throw error; // Rethrow to handle in onSubmit
    }
  };

  const createPost = async (data: PostFormData) => {
    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:5000/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to submit post");
    }

    return response.json();
  };

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      setShowSubmittingModal(false);
      navigate({ to: "/dashboard" });
    },
    onError: (error) => {
      console.error("Post submission error:", error);
      alert("Something went wrong: " + error.message);
      setShowSubmittingModal(false);
    },
  });

  const methods = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { email: email || "", amenities: [], furnished: false },
    mode: "onTouched", // Validate on blur, but also on interaction for better UX
  });

  const [step, setStep] = useState(0);

  const steps = [
    <Step1 key="step1" currentTheme={currentTheme} />,
    <Step2 key="step2" currentTheme={currentTheme} />,
    <Step3 key="step3" currentTheme={currentTheme} />,
    <Step4 key="step4" currentTheme={currentTheme} />,
  ];
  const stepLabels = [
    "Basic Info",
    "Details",
    "Amenities & Image",
    "Confirmation",
  ];

  const onSubmit = async (data: PostFormData) => {
    setShowSubmittingModal(true);
    try {
      const files = data.imageFile;
      if (!(files instanceof FileList) || files.length === 0) {
        throw new Error("No images selected");
      }

      const imageUrls = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImageToCloudinary(files[i]);
        imageUrls.push(url);
      }

      const postPayload = {
        ...data,
        images: imageUrls,
      };

      // Remove imageFile field as it contains raw files not needed by backend
      const { imageFile, ...finalPayload } = postPayload;

      mutation.mutate(
        finalPayload as Omit<PostFormData, "imageFile"> & { images: string[] }
      );
    } catch (error: any) {
      alert("Error uploading images or submitting form: " + error.message);
      setShowSubmittingModal(false);
    }
  };

  const handleNext = async () => {
    let isValid = false;

    // Trigger validation based on the current step's fields
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
      // Validate amenities and imageFile
      // amenities are optional so only imageFile is critical here
      isValid = await methods.trigger(["imageFile"]);
    } else if (step === 3) {
      // Nothing to validate on confirm step before final submit
      isValid = true;
    }

    if (isValid && step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      console.log("Validation errors:", methods.formState.errors);
      // Optionally scroll to the first error or show a global error message
      if (!isValid) {
        const firstErrorField = Object.keys(methods.formState.errors)[0];
        if (firstErrorField) {
          methods.setFocus(firstErrorField as any); // Focus on the first invalid field
        }
      }
    }
  };

  // Determine background class based on theme
  const backgroundClass =
    currentTheme === "dark"
      ? "bg-gray-900"
      : "bg-gradient-to-tr from-blue-50 to-indigo-100";

  return (
    <FormProvider {...methods}>
      <div
        className={`w-full min-h-screen mx-auto p-4 sm:p-6 md:p-10 flex flex-col relative ${backgroundClass} transition-colors duration-300`}
      >
        {/* 🌗 Theme Toggle Icon (Top Right Corner) */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full border transition-colors duration-300
            hover:bg-gray-200 dark:hover:bg-gray-700 z-10"
          aria-label="Toggle Theme"
        >
          {currentTheme === "dark" ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-800" />
          )}
        </button>

        <h1
          className={`text-2xl sm:text-3xl font-bold text-center mb-8 ${
            currentTheme === "dark" ? "text-indigo-300" : "text-indigo-800"
          }`}
        >
          Create New Listing
        </h1>

        {/* Stepper Top Navigation */}
        <div
          className={`w-full flex justify-around py-4 border-b ${
            currentTheme === "dark" ? "border-gray-700" : "border-gray-300"
          } mb-6`}
        >
          {stepLabels.map((label, index) => {
            const isActive = index === step;
            const isCompleted = step > index;
            const textColor =
              currentTheme === "dark" ? "text-gray-400" : "text-gray-600";

            return (
              <div
                key={label}
                className="flex flex-col items-center gap-1 sm:gap-2 flex-1"
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full font-bold text-sm transition-colors
                    ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-600 text-white"
                        : currentTheme === "dark"
                        ? "bg-gray-600 text-gray-300"
                        : "bg-gray-300 text-gray-800"
                    }`}
                >
                  {isCompleted ? <Check size={16} sm:size={20} /> : index + 1}
                </div>
                <div
                  className={`text-xs sm:text-sm font-medium text-center mt-1 sm:mt-0 ${
                    isActive
                      ? currentTheme === "dark"
                        ? "text-blue-400"
                        : "text-blue-600"
                      : textColor
                  }`}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Form Body */}
        <form className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto pb-8">
            {" "}
            {/* Added padding-bottom for scrollable content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{
                  opacity: 0,
                  x: step > methods.formState.submitCount ? 50 : -50,
                }} // Simple slide animation
                animate={{ opacity: 1, x: 0 }}
                exit={{
                  opacity: 0,
                  x: step > methods.formState.submitCount ? -50 : 50,
                }}
                transition={{ duration: 0.4 }}
                className={`border p-6 sm:p-8 rounded-xl shadow-inner min-h-[300px] flex flex-col ${
                  // Ensure it takes enough height
                  currentTheme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                {steps[step]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Button Bar */}
          <div
            className={`flex justify-between items-center border-t pt-4 sm:pt-6 mt-6 ${
              currentTheme === "dark" ? "border-gray-700" : "border-gray-300"
            }`}
          >
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant={currentTheme === "dark" ? "secondary" : "outline"}
                type="button"
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
                className="text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                Back
              </Button>

              <Button
                variant={currentTheme === "dark" ? "secondary" : "outline"}
                type="button"
                onClick={() => navigate({ to: "/dashboard" })}
                className="text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                Cancel
              </Button>
            </div>

            {step < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => methods.handleSubmit(onSubmit)()}
                disabled={mutation.isPending}
                className="text-xs sm:text-sm px-3 sm:px-4 py-2"
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
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className={`rounded-lg p-6 sm:p-8 flex flex-col items-center space-y-4 max-w-xs sm:max-w-sm w-full shadow-lg border ${
                  currentTheme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <Loader2 size={48} className="animate-spin text-blue-600" />
                <p
                  className={`text-lg sm:text-xl font-semibold text-center ${
                    currentTheme === "dark" ? "text-gray-300" : "text-gray-700"
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

// ======================= Step Components =======================

interface StepProps {
  currentTheme: "light" | "dark";
}

const Step1 = ({ currentTheme }: StepProps) => {
  const { register, formState, setFocus } = useFormContext<PostFormData>();
  const isDark = currentTheme === "dark";

  const textColor = isDark ? "text-gray-300" : "text-gray-800"; // For Labels/Typography
  const inputBgColor = isDark ? "#1a202c" : "#fff"; // For MUI TextField background
  const inputTextColor = isDark ? "#e2e8f0" : "#000"; // For MUI TextField text color
  const inputBorderColor = isDark ? "#4a5568" : "#e2e8f0"; // For MUI TextField border color

  // Custom styling for MUI TextField
  const muiTextFieldStyle = {
    "& .MuiOutlinedInput-root": {
      color: inputTextColor,
      backgroundColor: inputBgColor,
      "& fieldset": {
        borderColor: inputBorderColor,
      },
      "&:hover fieldset": {
        borderColor: isDark ? "#63b3ed" : "#3b82f6", // Blue on hover
      },
      "&.Mui-focused fieldset": {
        borderColor: isDark ? "#63b3ed" : "#3b82f6", // Blue on focus
        borderWidth: "2px",
      },
    },
    "& .MuiInputLabel-root": {
      color: textColor,
    },
    "& .MuiFormHelperText-root": {
      color: isDark ? "#fca5a5" : "#ef4444", // Red for errors
    },
  };

  useEffect(() => {
    // Set focus on the first input when the step mounts
    setFocus("title");
  }, [setFocus]);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} className={`mb-2 ${textColor}`}>
        Basic Information
      </Typography>

      <Box display="flex" flexDirection="column" gap={3}>
        <div>
          <Label className={`${textColor} mb-1 block`}>
            Title <span className="text-red-500">*</span>
          </Label>
          <TextField
            {...register("title")}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="e.g., Spacious 2BHK near University"
            error={!!formState.errors.title}
            helperText={formState.errors.title?.message}
            sx={muiTextFieldStyle}
          />
        </div>

        <div>
          <Label className={`${textColor} mb-3 block`}>
            Description <span className="text-red-500">*</span>
          </Label>
          <TextField
            {...register("description")}
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            size="small"
            placeholder="Describe your property: features, neighborhood, etc."
            error={!!formState.errors.description}
            helperText={formState.errors.description?.message}
            sx={muiTextFieldStyle}
          />
        </div>
      </Box>
    </Box>
  );
};

const Step2 = ({ currentTheme }: StepProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const { register, setValue, watch, formState, setFocus } =
    useFormContext<PostFormData>();

  const isDark = currentTheme === "dark";
  const labelTextColor = isDark ? "text-gray-300" : "text-gray-800";
  const inputBgColor = isDark ? "bg-gray-700" : "bg-white";
  const inputTextColor = isDark ? "text-white" : "text-gray-900";
  const inputBorderColor = isDark ? "border-gray-600" : "border-gray-300";
  const inputFocusRing = isDark ? "focus:ring-blue-400" : "focus:ring-blue-500";
  const placeholderColor = isDark
    ? "placeholder-gray-400"
    : "placeholder-gray-500";

  const fetchPlaces = useCallback(async (search: string) => {
    if (search.length < 3) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
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
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  // ✅ Focus price only on mount
  useEffect(() => {
    setFocus("price");
  }, [setFocus]);

  // 🔁 Watch query and fetch suggestions with debounce
  useEffect(() => {
    const currentLocation = watch("location");
    if (currentLocation) {
      setQuery(currentLocation);
    }

    const handler = setTimeout(() => {
      fetchPlaces(query);
    }, 500);

    return () => clearTimeout(handler);
  }, [query, fetchPlaces, watch]);

  function handleSelect(place: any) {
    setValue("location", place.display_name, { shouldValidate: true });
    setQuery(place.display_name);
    setSuggestions([]);
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="relative w-full mx-auto ">
      <h3 className={`text-lg font-semibold ${labelTextColor} mb-3`}>
        Property Details
      </h3>
      <div className="grid md:grid-cols-2 gap-4 py-10">
        {/* Price */}
        <div>
          <Label className={`${labelTextColor} block mb-3`}>
            Price (₹) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            placeholder="e.g., 5000"
            {...register("price", { valueAsNumber: true })}
            className={`${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputFocusRing} ${placeholderColor} transition-colors duration-200`}
          />
          {formState.errors.price && (
            <p className="text-red-500 text-sm mt-1">
              {formState.errors.price.message}
            </p>
          )}
        </div>

        {/* Available From */}
        <div>
          <Label className={`${labelTextColor} block mb-3`}>
            Available From <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            min={today}
            {...register("availableFrom")}
            className={`${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputFocusRing} transition-colors duration-200`}
          />
          {formState.errors.availableFrom && (
            <p className="text-red-500 text-sm mt-1">
              {formState.errors.availableFrom.message}
            </p>
          )}
        </div>

        {/* Location */}
        <div className="relative col-span-full">
          <Label className={`${labelTextColor} block mb-3`}>
            Location <span className="text-red-500">*</span>
          </Label>
          <Input
            {...register("location")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setValue("location", e.target.value, { shouldValidate: false });
            }}
            autoComplete="off"
            placeholder="Search city, school, area..."
            className={`z-20 ${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputFocusRing} ${placeholderColor} transition-colors duration-200`}
          />
          {loadingSuggestions && (
            <div className="absolute z-30 w-full flex justify-center py-2">
              <Loader2
                className={`animate-spin w-5 h-5 ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              />
            </div>
          )}
          {suggestions.length > 0 &&
            query.length >= 3 &&
            !loadingSuggestions && (
              <ul
                className={`absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-md border shadow-lg ${
                  isDark
                    ? "border-gray-700 bg-gray-800 text-gray-300"
                    : "border-gray-300 bg-white text-gray-800"
                } scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100`}
              >
                {suggestions.map((place: any) => (
                  <li
                    key={place.place_id}
                    onClick={() => handleSelect(place)}
                    className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                      isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                  >
                    {place.display_name}
                  </li>
                ))}
              </ul>
            )}
          {formState.errors.location && (
            <p className="text-red-500 text-sm mt-1">
              {formState.errors.location.message}
            </p>
          )}
        </div>

        {/* Type */}
        <div>
          <Label className={`${labelTextColor} block mb-3`}>
            Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={watch("type")}
            onValueChange={(v) =>
              setValue("type", v as any, { shouldValidate: true })
            }
          >
            <SelectTrigger
              className={`${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputFocusRing} transition-colors duration-200`}
            >
              <SelectValue placeholder="Choose type" />
            </SelectTrigger>
            <SelectContent
              className={
                isDark ? "bg-gray-800 text-white" : "bg-white text-black"
              }
            >
              {["Room", "House", "PG", "Shared"].map((type) => (
                <SelectItem key={type} value={type} className="cursor-pointer">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formState.errors.type && (
            <p className="text-red-500 text-sm mt-1">
              {formState.errors.type.message}
            </p>
          )}
        </div>

        {/* Occupancy */}
        <div>
          <Label className={`${labelTextColor} block mb-3`}>
            Occupancy <span className="text-red-500">*</span>
          </Label>
          <Select
            value={watch("occupancy")}
            onValueChange={(v) =>
              setValue("occupancy", v as any, { shouldValidate: true })
            }
          >
            <SelectTrigger
              className={`${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputFocusRing} transition-colors duration-200`}
            >
              <SelectValue placeholder="Choose occupancy" />
            </SelectTrigger>
            <SelectContent
              className={
                isDark ? "bg-gray-800 text-white" : "bg-white text-black"
              }
            >
              {["Single", "Double", "Triple", "Any"].map((o) => (
                <SelectItem key={o} value={o} className="cursor-pointer">
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formState.errors.occupancy && (
            <p className="text-red-500 text-sm mt-1">
              {formState.errors.occupancy.message}
            </p>
          )}
        </div>

        {/* Furnished */}
        <div className="flex items-center mt-2 col-span-full">
          <Checkbox
            id="furnished"
            checked={watch("furnished")}
            onCheckedChange={(v) => setValue("furnished", !!v)}
            className={
              isDark ? "data-[state=checked]:bg-blue-500 border-gray-500" : ""
            }
          />
          <Label htmlFor="furnished" className={`${labelTextColor} ml-2`}>
            Furnished
          </Label>
        </div>
      </div>
    </div>
  );
};

const Step3 = ({ currentTheme }: StepProps) => {
  const { setValue, watch, formState, getValues, setFocus } =
    useFormContext<PostFormData>();
  const selected = watch("amenities") || [];
  const isDark = currentTheme === "dark";
  const textColor = isDark ? "text-gray-300" : "text-gray-800";
  const inputBorderColor = isDark ? "border-gray-600" : "border-gray-300";
  const inputBgColor = isDark ? "bg-gray-700" : "bg-white";
  const inputTextColor = isDark ? "text-white" : "text-gray-900";
  const inputFocusRing = isDark ? "focus:ring-blue-400" : "focus:ring-blue-500";

  // Use a local state to keep track of uploaded images as File[]
  const [images, setImages] = useState<File[]>(() => {
    // When the component mounts, try to get existing files from the form state
    const files = getValues("imageFile");
    if (files && files instanceof FileList) {
      return Array.from(files);
    }
    return [];
  });

  // Effect to update the form's imageFile field whenever 'images' state changes
  useEffect(() => {
    const dataTransfer = new DataTransfer();
    images.forEach((file) => dataTransfer.items.add(file));
    setValue("imageFile", dataTransfer.files, { shouldValidate: true });
  }, [images, setValue]);

  useEffect(() => {
    // Set focus on the first input when the step mounts (e.g., first checkbox)
    setFocus(amenitiesList[0] as any);
  }, [setFocus]);

  // Handler when new files are uploaded
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    // Convert FileList to array and append new files to existing images array
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
        Amenities & Images
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {amenitiesList.map((item) => (
          <div key={item} className="flex items-center space-x-2">
            <Checkbox
              id={item}
              checked={selected.includes(item)}
              onCheckedChange={() => toggleAmenity(item)}
              className={
                isDark
                  ? "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-gray-500"
                  : ""
              }
            />
            <Label htmlFor={item} className={textColor}>
              {item}
            </Label>
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="image-upload" className={`${textColor} mb-1 block`}>
          Upload Images <span className="text-red-500">*</span>
        </Label>
        <Input
          id="image-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className={`${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputFocusRing} transition-colors duration-200 file:text-blue-500 file:file:border-none file:rounded-md file:mr-4 file:py-2 file:px-4`}
        />
        {formState.errors.imageFile && (
          <p className="text-red-500 text-sm mt-1">
            {formState.errors.imageFile.message as string}
          </p>
        )}
      </div>

      {/* Image preview with delete buttons */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {imagePreviews.map((src, idx) => (
          <div
            key={idx}
            className={`relative w-full h-24 sm:h-32 border rounded-lg overflow-hidden shadow-sm group ${
              isDark
                ? "border-gray-700 bg-gray-600"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <img
              src={src}
              alt={`Preview ${idx}`}
              className="object-cover w-full h-full"
              onLoad={() => URL.revokeObjectURL(src)} // Clean up memory
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(idx)}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              aria-label={`Remove image ${idx + 1}`}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Step4 = ({ currentTheme }: StepProps) => {
  const { watch } = useFormContext<PostFormData>();
  const isDark = currentTheme === "dark";

  // Determine text color based on theme
  const labelTextColor = isDark ? "text-gray-300" : "text-gray-800";
  const valueTextColor = isDark ? "text-gray-400" : "text-gray-700";

  const data = watch();
  const imageFiles = data.imageFile;

  // Create image URLs to preview
  const imagePreviews = imageFiles
    ? Array.from(imageFiles).map((file) => URL.createObjectURL(file))
    : [];

  return (
    <div className="w-full mx-auto p-3 rounded-md">
      <h3 className={`text-base font-semibold mb-3 ${labelTextColor}`}>
        Confirm Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <Label className={`${labelTextColor} font-medium`}>Title</Label>
          <p className={`${valueTextColor}`}>{data.title}</p>
        </div>

        <div>
          <Label className={`${labelTextColor} font-medium`}>Location</Label>
          <p className={`${valueTextColor}`}>{data.location}</p>
        </div>

        <div className="md:col-span-2">
          <Label className={`${labelTextColor} font-medium`}>Description</Label>
          <p className={`${valueTextColor}`}>{data.description}</p>
        </div>

        <div>
          <Label className={`${labelTextColor} font-medium`}>Price (₹)</Label>
          <p className={`${valueTextColor}`}>
            ₹ {data.price?.toLocaleString()}
          </p>
        </div>

        <div>
          <Label className={`${labelTextColor} font-medium`}>Type</Label>
          <p className={`${valueTextColor}`}>{data.type}</p>
        </div>

        <div>
          <Label className={`${labelTextColor} font-medium`}>Occupancy</Label>
          <p className={`${valueTextColor}`}>{data.occupancy}</p>
        </div>

        <div>
          <Label className={`${labelTextColor} font-medium`}>Furnished</Label>
          <p className={`${valueTextColor}`}>{data.furnished ? "Yes" : "No"}</p>
        </div>

        <div>
          <Label className={`${labelTextColor} font-medium`}>
            Available From
          </Label>
          <p className={`${valueTextColor}`}>{data.availableFrom}</p>
        </div>

        <div className="md:col-span-2">
          <Label className={`${labelTextColor} font-medium`}>Amenities</Label>
          <p className={`${valueTextColor}`}>
            {data.amenities?.length ? data.amenities.join(", ") : "None"}
          </p>
        </div>

        <div className="md:col-span-2">
          <Label className={`${labelTextColor} font-medium`}>Images</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-1">
            {imagePreviews.length > 0 ? (
              imagePreviews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-20 object-cover rounded shadow-sm"
                  onLoad={() => URL.revokeObjectURL(src)}
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

// ======================= Tanstack Router Route =======================
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