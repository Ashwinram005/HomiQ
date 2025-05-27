import { useEffect, useState } from "react";
import axios from "axios";
import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");

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
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };

    if (email) fetchUser();
  }, [email]);

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
        setVerifyMessage("✔️ Password verified");
      } else {
        setIsCurrentPasswordValid(false);
        setVerifyMessage("❌ Invalid password");
      }
    } catch (err) {
      setIsCurrentPasswordValid(false);
      setVerifyMessage("❌ Error verifying password");
    } finally {
      setVerifying(false);
    }
  };

  const handlePasswordChange = async (data: PasswordSchema) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/users/change-password",
        {
          email,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }
      );

      setIsCurrentPasswordValid(false);
      setVerifyMessage("");
      setShowChangePassword(false);
      reset();
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to change password");
    }
  };

  if (loading) return <p className="text-center mt-6">Loading...</p>;
  if (!user)
    return <p className="text-center text-red-600 mt-6">User not found</p>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-2xl rounded-2xl border border-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Profile
      </h1>

      <div className="mb-6 space-y-2">
        <p className="text-lg">
          <span className="font-semibold">Name:</span> {user.name}
        </p>
        <p className="text-lg">
          <span className="font-semibold">Email:</span> {user.email}
        </p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => {
            setShowChangePassword(!showChangePassword);
            setIsCurrentPasswordValid(false);
            setVerifyMessage("");
            reset();
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showChangePassword ? "Cancel" : "Change Password"}
        </button>
      </div>

      {showChangePassword && (
        <form
          onSubmit={handleSubmit(handlePasswordChange)}
          className="mt-6 space-y-4"
        >
          <div className="flex gap-2 items-center">
            <input
              type="password"
              placeholder="Current Password"
              disabled={isCurrentPasswordValid}
              {...register("currentPassword")}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleVerifyCurrentPassword}
              disabled={
                verifying || !watch("currentPassword") || isCurrentPasswordValid
              }
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Verify"}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-red-600 text-sm">
              {errors.currentPassword.message}
            </p>
          )}
          {verifyMessage && (
            <p
              className={`text-sm ${
                isCurrentPasswordValid ? "text-green-600" : "text-red-600"
              }`}
            >
              {verifyMessage}
            </p>
          )}

          <input
            type="password"
            placeholder="New Password"
            {...register("newPassword")}
            disabled={!isCurrentPasswordValid}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          />
          {errors.newPassword && (
            <p className="text-red-600 text-sm">{errors.newPassword.message}</p>
          )}

          <input
            type="password"
            placeholder="Confirm New Password"
            {...register("confirmNewPassword")}
            disabled={!isCurrentPasswordValid}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          />
          {errors.confirmNewPassword && (
            <p className="text-red-600 text-sm">
              {errors.confirmNewPassword.message}
            </p>
          )}

          <button
            type="submit"
            disabled={!isCurrentPasswordValid}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            Update Password
          </button>
        </form>
      )}
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
