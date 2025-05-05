import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react"; // For password visibility toggle

// Validation schema for login
export const loginSchema = z.object({
  email: z
    .string()
    .nonempty("Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .nonempty("Password is required")
    .min(10, "Password must be at least 10 characters"),
});

// Validation schema for signup
export const signupSchema = z
  .object({
    email: z
      .string()
      .nonempty("Email is required")
      .email("Enter a valid email address"),
    password: z
      .string()
      .nonempty("Password is required")
      .min(10, "Password must be at least 10 characters"),
    confirmPassword: z.string().nonempty("Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginSchema = z.infer<typeof loginSchema>;
export type SignupSchema = z.infer<typeof signupSchema>;

export function AuthForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isSignup, setIsSignup] = useState(false); // Toggle state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginSchema | SignupSchema>({
    resolver: zodResolver(isSignup ? signupSchema : loginSchema),
  });

  const onSubmit = (data: any) => {
    console.log(isSignup ? "Signup Data" : "Login Data", data);
    // Handle login or signup logic here
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">
          {isSignup ? "Create an account" : "Login to your account"}
        </h1>
        <p className="text-muted-foreground text-sm text-balance">
          {isSignup
            ? "Enter your details to sign up for a new account"
            : "Enter your details to log in to your account"}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Email Field */}
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="grid gap-3 relative">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              {...register("password")}
              className="pr-10"
            />
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password Field (for signup only) */}
        {isSignup && (
          <div className="grid gap-3 relative">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm your password"
                {...register("confirmPassword")}
                className="pr-10"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        )}

        <Button type="submit" className="w-full">
          {isSignup ? "Sign Up" : "Login"}
        </Button>

        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or continue with
          </span>
        </div>
        <Button variant="outline" className="w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              fill="currentColor"
            />
          </svg>
          {isSignup ? "Sign Up with GitHub" : "Login with GitHub"}
        </Button>
      </div>

      {/* Toggle between Login and Signup */}
      <div className="text-center text-sm">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Button
              variant="link"
              type="button"
              onClick={() => {
                setIsSignup(false);
                reset(); // clear form fields
              }}
            >
              Login
            </Button>
          </>
        ) : (
          <>
            Don't have an account?{" "}
            <Button
              variant="link"
              type="button"
              onClick={() => {
                setIsSignup(true);
                reset(); // clear form fields
              }}
            >
              Sign Up
            </Button>
          </>
        )}
      </div>
    </form>
  );    
}
