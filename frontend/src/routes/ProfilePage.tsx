import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { Toaster, toast } from "sonner"; // Using react-hot-toast for notifications
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Sun,
  Moon,
  Edit2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Loader2,
  ArrowLeft,
} from "lucide-react"; // Using lucide-react for icons
import {
  createRoute,
  Navigate,
  redirect,
  useNavigate,
  type RootRoute,
} from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { z } from "zod";

type User = {
  name: string;
  email: string;
};

type PasswordForm = {
  currentPassword?: string; // Make optional for initial state
  newPassword: string;
  confirmNewPassword: string;
};

// Function to get theme from local storage
const getTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  }
  return "light";
};

// Function to set theme in local storage and update class on html element
const setTheme = (theme: "light" | "dark") => {
  if (typeof window !== "undefined") {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }
};

export function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // General loading state for data fetching and saving
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [isCurrentPasswordVerified, setIsCurrentPasswordVerified] =
    useState(false); // Renamed for clarity
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(
    getTheme()
  );
  // Derived state for easier use in JSX
  const isDark = currentTheme === "dark";

  // Example: you might get email from context or props; here hardcoded for example
  const email =
    typeof window !== "undefined" ? localStorage.getItem("email") : null; // Safe access to localStorage

  // React Hook Form setup for password change
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isSubmittingPassword }, // Renamed for clarity
    reset,
    watch, // Use watch to get current password value for verification
    setValue, // Use setValue to clear password fields
    setError, // Use setError for manual validation errors
    clearErrors, // Use clearErrors to clear manual validation errors
  } = useForm<PasswordForm>({
    mode: "onBlur", // Validate on blur
    resolver: undefined, // Remove Zod resolver for initial verification
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // Add a separate Zod resolver for the new password fields
  const newPasswordSchema = z
    .object({
      newPassword: z.string().min(6, "Password must be at least 6 characters"),
      confirmNewPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "Passwords do not match",
      path: ["confirmNewPassword"], // Associate error with confirm field
    });

  // On mount, get theme from localStorage and apply class
  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  // Listen for theme changes from other components (if any)
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentTheme(getTheme());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Toggle theme and save to localStorage
  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
  };

  // Fetch user info on mount or email change
  useEffect(() => {
    async function fetchUser() {
      if (!email) return;
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/users/by-email?email=${email}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUser(res.data.data);
        setNewName(res.data.data.name);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        toast.error("Failed to fetch user information.");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [email]);

  // Handle name save
  async function handleNameSave() {
    if (newName.trim() === user?.name.trim()) {
      setEditingName(false); // No change, just exit editing
      return;
    }
    if (newName.trim() === "") {
      toast.error("Name cannot be empty.");
      return;
    }
    setLoading(true); // Indicate saving state
    toast.loading("Saving name...", { id: "nameSave" });
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/users/update-name", // Your backend endpoint
        { email: user?.email, newName: newName.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser((prev) => (prev ? { ...prev, name: newName.trim() } : prev));
      setEditingName(false);
      toast.success("Name updated successfully!", { id: "nameSave" });
    } catch (err: any) {
      console.error("Failed to update name:", err);
      toast.error(err.response?.data?.message || "Failed to update name.", {
        id: "nameSave",
      });
    } finally {
      setLoading(false);
    }
  }

  const navigate = useNavigate();
  // Handle verifying current password
  async function handleVerifyCurrentPassword() {
    const currentPassword = watch("currentPassword"); // Get value using watch

    if (!currentPassword) {
      setVerifyMessage("Please enter your current password.");
      setIsCurrentPasswordVerified(false);
      clearErrors("currentPassword"); // Clear any previous errors
      return;
    }

    setVerifying(true);
    setVerifyMessage(""); // Clear previous message
    setIsCurrentPasswordVerified(false); // Reset verification status
    clearErrors("currentPassword"); // Clear errors before verification attempt

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/users/verify-password", // Your backend endpoint
        { email: user?.email, password: currentPassword }
      );

      if (res.status === 200) {
        setIsCurrentPasswordVerified(true);
        setVerifyMessage("Current password verified!");
        toast.success("Current password verified!");
      } else {
        // Should not happen with 200 status, but as a fallback
        setIsCurrentPasswordVerified(false);
        setVerifyMessage("Invalid current password.");
        toast.error("Invalid current password.");
      }
    } catch (err: any) {
      setIsCurrentPasswordVerified(false);
      const errorMessage =
        err.response?.data?.message || "Verification failed.";
      setVerifyMessage(errorMessage);
      toast.error(errorMessage);
      console.error("Password verification failed:", err);
      setError("currentPassword", {
        type: "manual",
        message: "Invalid password",
      }); // Set error on the field
    } finally {
      setVerifying(false);
    }
  }

  // Handle password change submit
  const handlePasswordChange = handleSubmit(async (data) => {
    // Client-side validation using the new schema
    const validationResult = newPasswordSchema.safeParse(data);
    if (!validationResult.success) {
      clearErrors(["newPassword", "confirmNewPassword"]); // Clear existing errors
      validationResult.error.errors.forEach((err) => {
        toast.error(err.message);
        // Manually set errors based on Zod validation result
        if (err.path && err.path.length > 0) {
          setError(err.path[0] as any, {
            type: "manual",
            message: err.message,
          });
        }
      });
      return;
    }

    if (!isCurrentPasswordVerified) {
      toast.error("Please verify your current password first.");
      return;
    }

    setLoading(true); // Indicate submitting state
    toast.loading("Updating password...", { id: "passwordUpdate" });
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/users/update-password", // Your backend endpoint
        { email: user?.email, newPassword: data.newPassword }
      );
      toast.success("Password updated successfully!", { id: "passwordUpdate" });
      setShowChangePassword(false);
      reset(); // Reset form fields (might not clear inputs due to manual setValue later)
      setIsCurrentPasswordVerified(false);
      setVerifyMessage("");
      // Manually clear password fields after successful update and reset
      setValue("currentPassword", "", { shouldValidate: false });
      setValue("newPassword", "", { shouldValidate: false });
      setValue("confirmNewPassword", "", { shouldValidate: false });
      clearErrors(["currentPassword", "newPassword", "confirmNewPassword"]); // Ensure errors are cleared
    } catch (err: any) {
      console.error("Failed to update password:", err);
      toast.error(err.response?.data?.message || "Failed to update password.", {
        id: "passwordUpdate",
      });
    } finally {
      setLoading(false);
    }
  });

  // Theme-based classes (refined)
  const containerBgClass = isDark
    ? "bg-gray-950 text-gray-100" // Darker background for overall page
    : "bg-gray-100 text-gray-900";

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 pr-12 rounded-lg border shadow-sm focus:outline-none transition-colors duration-200 ${
      hasError
        ? "border-red-500 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
        : isDark
        ? "border-gray-700 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
        : "border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
    }`;

  const labelClass = isDark ? "text-gray-300" : "text-gray-700";
  const errorClass = "text-sm text-red-500 dark:text-red-400 mt-1";

  const verifyBtnClass = isDark
    ? "mt-3 px-5 py-2 rounded-lg font-semibold transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    : "mt-3 px-5 py-2 rounded-lg font-semibold transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed";

  const verifyMsgClass = (isValid: boolean) =>
    `text-sm mt-2 ${
      isValid
        ? "text-green-600 dark:text-green-400"
        : "text-red-500 dark:text-red-400"
    }`;

  const submitButtonClass = isDark
    ? "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
    : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-white";

  if (loading && !user)
    return (
      <div
        className={`w-full h-screen flex items-center justify-center ${containerBgClass}`}
      >
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-indigo-600 dark:text-indigo-400" />
        <p className="text-lg font-semibold tracking-wide">
          Loading profile...
        </p>
      </div>
    );

  if (!user && !loading)
    return (
      <div
        className={`w-full h-screen flex items-center justify-center ${containerBgClass}`}
      >
        <AlertCircle className="w-8 h-8 mr-3 text-red-600 dark:text-red-400" />
        <p className="text-lg font-semibold tracking-wide text-red-600 dark:text-red-400">
          User not found.
        </p>
      </div>
    );

  return (
    <div
      className={`w-full min-h-screen flex flex-col items-center p-6 sm:p-10 transition-colors duration-300 ${containerBgClass}`}
    >
      <div className="w-full max-w-xl self-start mb-4">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm transition-all duration-300
        ${
          isDark
            ? "bg-gray-700 text-gray-100 hover:bg-gray-600 hover:text-white"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }
      `}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Toaster positioned at top center */}
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast: `shadow-md border text-sm rounded-xl ${
              currentTheme === "dark"
                ? "bg-gray-700 text-white border-gray-600"
                : "bg-white text-gray-900 border-gray-200"
            }`,
            description:
              currentTheme === "dark" ? "text-gray-300" : "text-gray-600",
            actionButton:
              "bg-indigo-600 text-white px-3 py-1 rounded-md text-sm",
            cancelButton: "text-gray-500 text-sm",
            error: isDark ? "bg-red-900 text-red-200 border-red-700" : "",
            success: isDark
              ? "bg-green-900 text-green-200 border-green-700"
              : "",
            loading: isDark ? "bg-blue-900 text-blue-200 border-blue-700" : "",
          },
          duration: 3000, // Auto-dismiss after 3 seconds
        }}
      />

      {/* Main Content Area (no longer a card) */}
      <div
        className={`w-full max-w-xl p-8 md:p-10 space-y-6 flex flex-col transition-colors duration-300 ${
          isDark
            ? "bg-gray-800 text-white rounded-xl shadow-xl" // Added some rounding and shadow for a contained feel without being a card
            : "bg-white text-gray-900 rounded-xl shadow-xl"
        }`}
      >
        {/* Header with Title and Theme Switcher */}
        <div className="flex justify-between items-center border-b pb-4">
          <h2
            className={`text-3xl md:text-4xl font-semibold tracking-tight ${
              isDark ? "text-indigo-200" : "text-gray-900"
            }`}
          >
            {user?.name ? `${user.name}'s Profile` : "User Profile"}
          </h2>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-colors duration-300 hover:bg-opacity-20"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun size={24} className="text-yellow-300" />
            ) : (
              <Moon size={24} className="text-indigo-700" />
            )}
          </button>
        </div>

        {/* Name Field */}
        <div>
          <label
            className={`${
              isDark ? "text-gray-300" : "text-gray-700"
            } font-semibold block mb-2`}
          >
            Name
          </label>
          {editingName ? (
            <div className="flex flex-col gap-3">
              {" "}
              {/* Stacked layout */}
              <input
                type="text"
                className={`flex-grow px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-600"
                    : "bg-white border-gray-300 text-gray-800 focus:ring-indigo-600"
                } transition-colors duration-200`}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                spellCheck={false}
                disabled={loading} // Disable during save
              />
              <div className="flex gap-3">
                <button
                  onClick={handleNameSave}
                  className="bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading} // Disable during save
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    if (user) setNewName(user.name); // Revert to original name
                  }}
                  className={`bg-transparent border px-4 py-2 rounded-md font-semibold hover:bg-opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? "border-gray-500 text-gray-300 hover:bg-gray-600"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                  disabled={loading} // Disable during save
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span
                className={`${
                  isDark ? "text-gray-200" : "text-gray-800"
                } text-lg font-medium`}
              >
                {user?.name}
              </span>
              <button
                onClick={() => {
                  setEditingName(true);
                  if (user) setNewName(user.name); // Set initial edit value
                }}
                className={`text-sm px-3 py-2 rounded-md font-semibold transition ${
                  isDark
                    ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    : "bg-gray-100 text-indigo-700 hover:bg-gray-200"
                }`}
              >
                <Edit2 size={16} className="inline-block mr-1" /> Edit
              </button>
            </div>
          )}
        </div>

        {/* Email Display */}
        <div
          className={`${isDark ? "text-gray-300" : "text-gray-700"} text-lg`}
        >
          <span className="font-semibold">Email:</span>{" "}
          <span className={`${isDark ? "text-gray-200" : "text-gray-800"}`}>
            {user?.email}
          </span>
        </div>

        {/* Change Password Toggle */}
        <button
          onClick={() => {
            setShowChangePassword(!showChangePassword);
            setIsCurrentPasswordVerified(false); // Reset verification
            setVerifyMessage(""); // Clear verify message
            reset({
              // Reset password fields when closing or opening form
              currentPassword: "",
              newPassword: "",
              confirmNewPassword: "",
            });
            // Manually clear password fields using setValue to ensure inputs update
            setValue("currentPassword", "", { shouldValidate: false });
            setValue("newPassword", "", { shouldValidate: false });
            setValue("confirmNewPassword", "", { shouldValidate: false });
            clearErrors([
              "currentPassword",
              "newPassword",
              "confirmNewPassword",
            ]); // Clear validation errors
          }}
          className={`${submitButtonClass} mt-auto font-semibold py-3 rounded-xl shadow-md transition w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={loading} // Disable toggle button during loading
        >
          {showChangePassword ? "Cancel Change Password" : "Change Password"}
        </button>

        {/* Password Change Form or Security Tips (Stacked Below Profile Info) */}
        <AnimatePresence mode="wait">
          {" "}
          {/* Use mode="wait" for sequential animations */}
          {showChangePassword ? (
            <motion.form
              onSubmit={handlePasswordChange}
              key="password-form" // Unique key for animation
              initial={{ opacity: 0, y: 30 }} // Animate from bottom
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }} // Animate out to top
              transition={{ duration: 0.4 }}
              className="space-y-6 pt-6 border-t border-gray-300 dark:border-gray-700" // Added border-top
              autoComplete="off"
            >
              {/* Title for the password change section */}
              <h3
                className={`text-2xl font-bold mb-4 ${
                  isDark ? "text-indigo-300" : "text-gray-800"
                }`}
              >
                Update Your Password
              </h3>

              {/* Current Password Verification */}
              <div className="space-y-2">
                {" "}
                {/* Adjusted spacing */}
                <label
                  htmlFor="currentPassword"
                  className={`${labelClass} block font-medium mb-1`}
                >
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    placeholder="Enter current password"
                    disabled={
                      isCurrentPasswordVerified ||
                      verifying ||
                      isSubmittingPassword
                    }
                    {...register("currentPassword", {
                      required: showChangePassword
                        ? "Current password is required"
                        : false, // Require only when form is visible
                    })}
                    className={inputClass(!!errors.currentPassword)}
                  />
                  {/* Toggle password visibility */}
                  <button
                    type="button"
                    onClick={() => setShowCurrent((prev) => !prev)}
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                    tabIndex={-1} // Prevent tabbing to this button
                  >
                    {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.currentPassword && !isCurrentPasswordVerified && (
                  <p className={errorClass}>{errors.currentPassword.message}</p>
                )}
                {/* Verify Button and Message */}
                <div className="flex items-center gap-3 mt-3">
                  {" "}
                  {/* Aligned items */}
                  {!isCurrentPasswordVerified && (
                    <button
                      type="button"
                      onClick={handleVerifyCurrentPassword} // Call the verification handler
                      className={`${verifyBtnClass} flex items-center gap-2`}
                      disabled={
                        verifying ||
                        !!errors.currentPassword ||
                        isSubmittingPassword
                      }
                    >
                      {verifying ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />{" "}
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} /> Verify Password
                        </>
                      )}
                    </button>
                  )}
                  {verifyMessage && (
                    <motion.p
                      key="verify-msg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={verifyMsgClass(isCurrentPasswordVerified)}
                    >
                      {verifyMessage}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* New Password and Confirm Password fields (only show if verified) */}
              <AnimatePresence>
                {isCurrentPasswordVerified && (
                  <motion.div
                    key="new-password-fields" // Unique key for animation
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 overflow-hidden" // Hide overflow during animation
                  >
                    {/* New Password */}
                    <div className="space-y-2">
                      <label
                        htmlFor="newPassword"
                        className={`${labelClass} block font-medium mb-1`}
                      >
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          type={showNew ? "text" : "password"}
                          placeholder="Enter new password"
                          {...register("newPassword", {
                            required: true, // Already handled by Zod schema, but good as backup
                          })}
                          // Apply Zod validation errors directly from formState
                          className={inputClass(!!errors.newPassword)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew((prev) => !prev)}
                          className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                          tabIndex={-1}
                        >
                          {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {errors.newPassword && (
                        <p className={errorClass}>
                          {errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-2">
                      <label
                        htmlFor="confirmNewPassword"
                        className={`${labelClass} block font-medium mb-1`}
                      >
                        Confirm New Password{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="confirmNewPassword"
                          type={showConfirm ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...register("confirmNewPassword", {
                            required: true, // Already handled by Zod schema
                          })}
                          // Apply Zod validation errors directly from formState
                          className={inputClass(!!errors.confirmNewPassword)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((prev) => !prev)}
                          className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                          tabIndex={-1}
                        >
                          {showConfirm ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>

                      {errors.confirmNewPassword && (
                        <p className={errorClass}>
                          {errors.confirmNewPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={
                        isSubmittingPassword ||
                        loading ||
                        !isCurrentPasswordVerified
                      } // Disable if not verified
                      className={`${submitButtonClass} font-semibold py-3 rounded-xl shadow-md transition w-full flex items-center justify-center gap-2`}
                    >
                      {isSubmittingPassword || loading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />{" "}
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.form>
          ) : (
            // Placeholder or Security Tips when password form is hidden
            <motion.div
              key="security-tips" // Unique key for animation
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className={`space-y-6 text-center p-6 rounded-xl border transition-colors duration-300 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-300"
                  : "bg-gray-100 border-gray-200 text-gray-600"
              }`}
            >
              <ShieldCheck
                size={48}
                className={`mx-auto ${
                  isDark ? "text-blue-400" : "text-blue-600"
                }`}
              />
              <h3
                className={`text-xl font-semibold ${
                  isDark ? "text-indigo-300" : "text-gray-800"
                }`}
              >
                Keep Your Account Secure
              </h3>
              <p>
                Regularly updating your password is a good way to protect your
                account. Use a strong, unique password for better security.
              </p>
              {/* Add more security tips if desired */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/profile",
    component: ProfilePage,
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) return redirect({ to: "/" });
    },
  });
