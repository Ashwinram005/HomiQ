import { useEffect, useState } from "react";
import axios from "axios";
import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Toaster, toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(10, "New password must be at least 10 characters"),
    confirmNewPassword: z.string().min(1, "Please confirm new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

type PasswordSchema = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // For editing name
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  const email = localStorage.getItem("email");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PasswordSchema>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/users/by-email?email=${email}`
        );
        setUser(res.data.data);
        setNewName(res.data.data.name);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };

    if (email) fetchUser();
  }, [email]);

  // Save edited name API call
  const handleNameSave = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Name cannot be empty");
      return;
    }

    // 🛑 If they re–enter exactly their existing name, do nothing
    if (trimmed === user.name) {
      setEditingName(false);
      return;
    }

    try {
      await axios.put("http://localhost:5000/api/users/update-name", {
        email,
        newName: trimmed,
      });
      setUser((prev: any) => ({ ...prev, name: trimmed }));
      setEditingName(false);
      toast.success("Name updated successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update name");
    }
  };

  const handleVerifyCurrentPassword = async () => {
    const currentPassword = watch("currentPassword");
    setVerifying(true);
    setVerifyMessage("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/users/verify-password",
        { email, password: currentPassword }
      );
      if (res.data.valid) {
        setIsCurrentPasswordValid(true);
        setVerifyMessage("Password verified");
        toast.success("Password verified successfully!");
      } else {
        setIsCurrentPasswordValid(false);
        setVerifyMessage("Invalid password");
        toast.error("Invalid current password");
      }
    } catch (err) {
      setIsCurrentPasswordValid(false);
      setVerifyMessage(" Error verifying password");
      toast.error(err || "Error verifying password");
    } finally {
      setVerifying(false);
    }
  };

  const handlePasswordChange = async (data: PasswordSchema) => {
    try {
      await axios.post("http://localhost:5000/api/users/change-password", {
        email,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast.success("Password updated successfully!");
      setIsCurrentPasswordValid(false);
      setVerifyMessage("");
      setShowChangePassword(false);
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
  };

  const getPasswordStrength = (password?: string) => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthColors = [
    "bg-red-500",
    "bg-yellow-400",
    "bg-green-400",
    "bg-green-600",
  ];

  const newPassword = watch("newPassword");
  const strength = getPasswordStrength(newPassword);

  if (loading)
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500 text-lg font-semibold tracking-wide">
          Loading...
        </p>
      </div>
    );
  if (!user)
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-600 text-lg font-semibold tracking-wide">
          User not found
        </p>
      </div>
    );

  return (
    <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row ring-1 ring-gray-300">
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast:
                "bg-white shadow-md border border-gray-200 text-gray-900 rounded-xl",
              description: "text-sm text-gray-600",
              actionButton:
                "bg-indigo-600 text-white px-3 py-1 rounded-md text-sm",
              cancelButton: "text-gray-500 text-sm",
            },
          }}
        />
        {/* Left Profile Info Panel */}
        <div className="md:w-1/3 bg-gradient-to-b from-indigo-700 to-indigo-900 text-white p-10 space-y-8 flex flex-col">
          <h2 className="text-4xl font-extrabold border-b border-indigo-400 pb-4">
            Profile Info
          </h2>

          {/* Name Field */}
          <div>
            <label className="text-indigo-100 font-semibold block mb-2">
              Name
            </label>
            {editingName ? (
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  className="flex-grow px-4 py-2 rounded-md text-gray-800 focus:outline-none focus:ring-4 focus:ring-sky-400"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  spellCheck={false}
                />
                <button
                  onClick={handleNameSave}
                  className="bg-white text-sky-700 px-4 py-2 rounded-md font-semibold hover:bg-sky-100 transition"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNewName(user.name);
                  }}
                  className="bg-transparent border border-white px-4 py-2 rounded-md font-semibold hover:bg-white hover:text-sky-700 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sky-200 text-lg font-medium">
                  {user.name}
                </span>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-sm bg-white text-sky-700 px-3 py-2 rounded-md font-semibold hover:bg-sky-100 transition"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Email Display */}
          <div className="text-indigo-100">
            <span className="font-semibold">Email:</span>{" "}
            <span>{user.email}</span>
          </div>

          {/* Change Password Toggle */}
          <button
            onClick={() => {
              setShowChangePassword(!showChangePassword);
              setIsCurrentPasswordValid(false);
              setVerifyMessage("");
              reset();
            }}
            className="mt-auto bg-white text-indigo-900 font-semibold py-3 rounded-xl shadow-md hover:bg-indigo-100 transition"
          >
            {showChangePassword ? "Cancel" : "Change Password"}
          </button>
        </div>

        {/* Right Password Change Panel */}
        <div className="md:w-2/3 p-10 bg-white">
          <AnimatePresence>
            {showChangePassword ? (
              <motion.form
                onSubmit={handleSubmit(handlePasswordChange)}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.35 }}
                className="space-y-8"
                autoComplete="off"
              >
                {/* Current Password */}
                <div className="relative">
                  <label
                    htmlFor="currentPassword"
                    className="block text-gray-700 font-semibold mb-2"
                  >
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    placeholder="Enter current password"
                    disabled={isCurrentPasswordValid}
                    {...register("currentPassword")}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border shadow-sm focus:outline-none transition ${
                      errors.currentPassword
                        ? "border-red-500 focus:ring-2 focus:ring-red-400"
                        : "border-gray-300 focus:ring-2 focus:ring-indigo-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((prev) => !prev)}
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {errors.currentPassword && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.currentPassword.message}
                    </p>
                  )}
                  {!isCurrentPasswordValid && (
                    <button
                      type="button"
                      onClick={handleVerifyCurrentPassword}
                      className="mt-3 bg-indigo-600 text-white py-2 px-5 rounded-lg font-semibold hover:bg-indigo-700 transition"
                      disabled={verifying}
                    >
                      {verifying ? "Verifying..." : "Verify"}
                    </button>
                  )}
                  {verifyMessage && (
                    <p
                      className={`text-sm mt-2 ${
                        isCurrentPasswordValid
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {verifyMessage}
                    </p>
                  )}
                </div>

                {/* New Password */}
                {isCurrentPasswordValid && (
                  <>
                    <div className="relative">
                      <label
                        htmlFor="newPassword"
                        className="block text-gray-700 font-semibold mb-2"
                      >
                        New Password
                      </label>
                      <input
                        id="newPassword"
                        type={showNew ? "text" : "password"}
                        placeholder="Enter new password"
                        {...register("newPassword")}
                        className={`w-full px-4 py-3 pr-12 rounded-lg border shadow-sm focus:outline-none transition ${
                          errors.newPassword
                            ? "border-red-500 focus:ring-2 focus:ring-red-400"
                            : "border-gray-300 focus:ring-2 focus:ring-indigo-400"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((prev) => !prev)}
                        className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                        tabIndex={-1}
                      >
                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      {errors.newPassword && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.newPassword.message}
                        </p>
                      )}
                      {newPassword && (
                        <div className="mt-3">
                          <div className="flex gap-1">
                            {Array(4)
                              .fill(0)
                              .map((_, i) => (
                                <div
                                  key={i}
                                  className={`h-2 flex-1 rounded-full ${
                                    strength > i
                                      ? strengthColors[strength - 1]
                                      : "bg-gray-300"
                                  }`}
                                />
                              ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Password strength
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div className="relative">
                      <label
                        htmlFor="confirmNewPassword"
                        className="block text-gray-700 font-semibold mb-2"
                      >
                        Confirm New Password
                      </label>
                      <input
                        id="confirmNewPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter new password"
                        {...register("confirmNewPassword")}
                        className={`w-full px-4 py-3 pr-12 rounded-lg border shadow-sm focus:outline-none transition ${
                          errors.confirmNewPassword
                            ? "border-red-500 focus:ring-2 focus:ring-red-400"
                            : "border-gray-300 focus:ring-2 focus:ring-indigo-400"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((prev) => !prev)}
                        className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      {errors.confirmNewPassword && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.confirmNewPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Submit */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition"
                      >
                        Update Password
                      </button>
                    </div>
                  </>
                )}
              </motion.form>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.35 }}
                className="text-center text-gray-600 text-lg"
              >
                <p className="mb-2 font-medium">
                  Click on <strong>Change Password</strong> to get started.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
