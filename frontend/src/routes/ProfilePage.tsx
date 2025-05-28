import { useEffect, useState } from "react";
import axios from "axios";
import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
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
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    try {
      await axios.put("http://localhost:5000/api/users/update-name", {
        email,
        newName: newName.trim(),
      });
      setUser((prev: any) => ({ ...prev, name: newName.trim() }));
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
        setVerifyMessage("❌ Invalid password");
        toast.error("Invalid current password");
      }
    } catch (err) {
      setIsCurrentPasswordValid(false);
      setVerifyMessage("❌ Error verifying password");
      toast.error("Error verifying password");
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
    <div className="w-full min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-lg flex flex-col md:flex-row overflow-hidden ring-1 ring-gray-200">
        {/* Left panel: User Info */}
        <div className="md:w-1/3 bg-gradient-to-b from-indigo-700 to-indigo-900 text-white p-12 flex flex-col justify-center space-y-8">
          <h2 className="text-4xl font-extrabold border-b border-indigo-400 pb-4 mb-8 tracking-wide select-none">
            Profile Info
          </h2>
          <div className="space-y-5 text-lg leading-relaxed">
            <div>
              <label className="font-semibold block mb-1 select-none text-indigo-100">
                Name
              </label>
              {editingName ? (
                <div className="flex items-center space-x-4 w-full">
                  <input
                    type="text"
                    className="flex-grow text-lg px-4 py-3 rounded-md text-gray-900 focus:outline-none focus:ring-4 focus:ring-sky-400"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                    spellCheck={false}
                  />
                  <button
                    onClick={handleNameSave}
                    className="bg-white text-sky-700 px-6 py-3 rounded-md font-semibold hover:bg-sky-100 transition select-none"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNewName(user.name);
                    }}
                    className="bg-transparent border border-white px-6 py-3 rounded-md font-semibold hover:bg-white hover:text-sky-700 transition select-none"
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
                    className="text-sm bg-white text-sky-700 px-4 py-2 rounded-md font-semibold hover:bg-sky-100 transition select-none"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <p>
              <span className="font-semibold">Email:</span>{" "}
              <span className="text-indigo-100">{user.email}</span>
            </p>
          </div>
          <button
            onClick={() => {
              setShowChangePassword(!showChangePassword);
              setIsCurrentPasswordValid(false);
              setVerifyMessage("");
              reset();
            }}
            className="mt-auto bg-white text-indigo-900 font-semibold py-3 rounded-xl shadow-md hover:bg-indigo-100 transition duration-300 active:scale-[0.98] select-none"
          >
            {showChangePassword ? "Cancel" : "Change Password"}
          </button>
        </div>

        {/* Right panel: Change Password Form */}
        <div className="md:w-2/3 p-12">
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
                    className="block text-gray-800 font-semibold mb-2 select-none"
                  >
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    placeholder="Enter current password"
                    disabled={isCurrentPasswordValid}
                    {...register("currentPassword")}
                    className={`w-full px-5 py-3 pr-12 border rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-400 transition disabled:opacity-60 placeholder-gray-400 ${
                      errors.currentPassword
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition select-none"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                  {errors.currentPassword && (
                    <p className="mt-1 text-red-600 text-sm select-none">
                      {errors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* Verify button & message */}
                {!isCurrentPasswordValid && (
                  <button
                    type="button"
                    onClick={handleVerifyCurrentPassword}
                    disabled={verifying || !watch("currentPassword")}
                    className="w-full bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl shadow-md transition select-none"
                  >
                    {verifying ? "Verifying..." : "Verify Current Password"}
                  </button>
                )}
                {verifyMessage && (
                  <p
                    className={`mt-2 text-center select-none ${
                      isCurrentPasswordValid ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {verifyMessage}
                  </p>
                )}

                {/* New Password */}
                <div className="relative">
                  <label
                    htmlFor="newPassword"
                    className="block text-gray-800 font-semibold mb-2 select-none"
                  >
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    placeholder="Enter new password"
                    disabled={!isCurrentPasswordValid}
                    {...register("newPassword")}
                    className={`w-full px-5 py-3 pr-12 border rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-400 transition disabled:opacity-60 placeholder-gray-400 ${
                      errors.newPassword
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition select-none"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                  {errors.newPassword && (
                    <p className="mt-1 text-red-600 text-sm select-none">
                      {errors.newPassword.message}
                    </p>
                  )}

                  {/* Password Strength Bar */}
                  <div
                    className="flex space-x-1 mt-2 select-none"
                    aria-label="password strength meter"
                  >
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`h-2 flex-1 rounded-full ${
                          index < strength
                            ? strengthColors[strength - 1]
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="relative">
                  <label
                    htmlFor="confirmNewPassword"
                    className="block text-gray-800 font-semibold mb-2 select-none"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirmNewPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    disabled={!isCurrentPasswordValid}
                    {...register("confirmNewPassword")}
                    className={`w-full px-5 py-3 pr-12 border rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-400 transition disabled:opacity-60 placeholder-gray-400 ${
                      errors.confirmNewPassword
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition select-none"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                  {errors.confirmNewPassword && (
                    <p className="mt-1 text-red-600 text-sm select-none">
                      {errors.confirmNewPassword.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!isCurrentPasswordValid}
                  className="w-full bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl shadow-md transition select-none"
                >
                  Change Password
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.35 }}
                className="text-center text-gray-400 italic select-none"
              >
                Click "Change Password" to edit your password
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
