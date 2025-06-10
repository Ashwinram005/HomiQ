import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { toast, Toaster } from "sonner"; // Assuming 'sonner' is used for toasts

// Validation schemas
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

export const signupSchema = z
  .object({
    name: z.string().nonempty("Username is required"),
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

// Corrected AuthFormProps interface
type AuthFormProps = {
  className?: string;
  defaultTab?: "login" | "signup";
  onClose?: () => void; // <--- ADDED THIS PROP
};

export function AuthForm({
  className,
  defaultTab = "login",
  onClose, // Destructure the prop
  ...props
}: AuthFormProps) {
  const [tab, setTab] = useState(defaultTab);
  const [theme, setTheme] = useState("light"); // State to hold the theme

  useEffect(() => {
    // Fetch theme from local storage on component mount
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  const isDark = theme === "dark";

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as "login" | "signup")} // <--- FIXED HERE
      className={cn("w-full max-w-md mx-auto", className)}
      {...props}
    >
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close"
          className={cn(
            "absolute top-2 right-0 rounded-full p-2 mb-5 transition hover:scale-110",
            {
              "text-white": isDark,
              "text-black ": !isDark,
            }
          )}
        >
          <span className="text-3xl">&times;</span>
        </button>
      )}
      <TabsList
        className={cn("grid w-full grid-cols-2 mb-6", {
          "bg-gray-700 text-gray-300": isDark,
          "bg-gray-200 text-gray-800": !isDark,
        })}
      >
        <TabsTrigger
          value="login"
          className={cn({
            "data-[state=active]:bg-blue-600 data-[state=active]:text-white":
              !isDark,
            "data-[state=active]:bg-blue-800 data-[state=active]:text-white":
              isDark,
          })}
        >
          Login
        </TabsTrigger>
        <TabsTrigger
          value="signup"
          className={cn({
            "data-[state=active]:bg-blue-600 data-[state=active]:text-white":
              !isDark,
            "data-[state=active]:bg-blue-800 data-[state=active]:text-white":
              isDark,
          })}
        >
          Sign Up
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="login"
        className={cn("rounded-md border p-6 shadow-md", {
          "bg-gray-800 border-gray-700 text-gray-300": isDark,
          "bg-white border-gray-200 text-gray-800": !isDark,
        })}
      >
        <LoginForm />
      </TabsContent>

      <TabsContent
        value="signup"
        className={cn("rounded-md border p-6 shadow-md", {
          "bg-gray-800 border-gray-700 text-gray-300": isDark,
          "bg-white border-gray-200 text-gray-800": !isDark,
        })}
      >
        <SignupForm onSuccess={() => setTab("login")} />
      </TabsContent>
    </Tabs>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState("light"); // State to hold the theme

  useEffect(() => {
    // Fetch theme from local storage on component mount
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    const checkAuthentication = async () => {
      const auth = await isAuthenticated();
      if (auth) {
        // Also ensure search: {} if your dashboard route has search params
        navigate({ to: "/dashboard", search: {} });
      }
    };

    checkAuthentication();
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    try {
      const response = await fetch("https://homiq.onrender.com/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message || "Login failed");
        return;
      }
      localStorage.setItem("token", result.token);
      localStorage.setItem("email", result.email);
      localStorage.setItem("username", result.name);
      // Also ensure search: {} if your dashboard route has search params
      navigate({ to: "/dashboard", search: {} });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong");
    }
  };

  const isDark = theme === "dark";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="text-center">
        <h1
          className={cn("text-2xl font-bold", {
            "text-gray-200": isDark,
            "text-gray-800": !isDark,
          })}
        >
          Login to your account
        </h1>
        <p
          className={cn("text-sm", {
            "text-gray-400": isDark,
            "text-muted-foreground": !isDark,
          })}
        >
          Enter your details to log in to your account
        </p>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="email" className={cn({ "text-gray-300": isDark })}>
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
          className={cn({
            "bg-gray-700 border-gray-600 text-white placeholder-gray-400":
              isDark,
          })}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="grid gap-3">
        <Label htmlFor="password" className={cn({ "text-gray-300": isDark })}>
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter password"
          {...register("password")}
          className={cn({
            "bg-gray-700 border-gray-600 text-white placeholder-gray-400":
              isDark,
          })}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className={cn("w-full", {
          "bg-blue-600 hover:bg-blue-700 text-white": !isDark,
          "bg-blue-800 hover:bg-blue-900 text-white": isDark,
        })}
      >
        Login
      </Button>
    </form>
  );
}

interface SignupFormProps {
  onSuccess: () => void;
}
export function SignupForm({ onSuccess }: SignupFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
  });

  const [showOtpField, setShowOtpField] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [theme, setTheme] = useState("light"); // State to hold the theme

  useEffect(() => {
    // Fetch theme from local storage on component mount
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  const onSubmit = async (data: SignupSchema) => {
    try {
      const response = await fetch("https://homiq.onrender.com/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setEmailForOtp(data.email);
        setShowOtpField(true); // Show OTP input field
        toast.success("OTP sent to your email!"); // Add success toast for OTP
      } else {
        const error = await response.json();
        toast.error(error.message || "Signup failed"); // Use toast for errors
      }
    } catch (err) {
      console.error("Signup error", err);
      toast.error("An unexpected error occurred. Try again."); // Use toast for errors
    }
  };

  const verifyOtp = async () => {
    try {
      const res = await fetch("https://homiq.onrender.com/api/users/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailForOtp, otp }),
      });

      if (res.ok) {
        toast.success("Account verified successfully!");
        reset();
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.message || "Invalid OTP");
      }
    } catch (err) {
      toast.error("OTP Verification Error"); // Simplified error message for user
      console.error("OTP Verification Error", err); // Log detailed error
    }
  };

  const isDark = theme === "dark";

  // Define toaster class names based on the theme
  const toasterClassNames = {
    toast: cn("shadow-md rounded-xl", {
      "bg-gray-800 text-white border border-gray-700": isDark,
      "bg-white border border-gray-200 text-gray-900": !isDark,
    }),
    description: cn("text-sm", {
      "text-gray-400": isDark,
      "text-gray-600": !isDark,
    }),
    actionButton: cn("px-3 py-1 rounded-md text-sm", {
      "bg-blue-600 text-white": !isDark,
      "bg-blue-800 text-white": isDark,
    }),
    cancelButton: cn("text-sm", {
      "text-gray-400": isDark,
      "text-gray-500": !isDark,
    }),
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: toasterClassNames,
        }}
      />
      <div className="text-center">
        <h1
          className={cn("text-2xl font-bold", {
            "text-gray-200": isDark,
            "text-gray-800": !isDark,
          })}
        >
          Create an account
        </h1>
        <p
          className={cn("text-sm", {
            "text-gray-400": isDark,
            "text-muted-foreground": !isDark,
          })}
        >
          Enter your details to sign up for a new account
        </p>
      </div>

      {!showOtpField ? (
        <>
          <div className="grid gap-3">
            <Label htmlFor="name" className={cn({ "text-gray-300": isDark })}>
              Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="E.g. John Doe"
              {...register("name")}
              className={cn({
                "bg-gray-700 border-gray-600 text-white placeholder-gray-400":
                  isDark,
              })}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="email" className={cn({ "text-gray-300": isDark })}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className={cn({
                "bg-gray-700 border-gray-600 text-white placeholder-gray-400":
                  isDark,
              })}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label
              htmlFor="password"
              className={cn({ "text-gray-300": isDark })}
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              {...register("password")}
              className={cn({
                "bg-gray-700 border-gray-600 text-white placeholder-gray-400":
                  isDark,
              })}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label
              htmlFor="confirmPassword"
              className={cn({ "text-gray-300": isDark })}
            >
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              {...register("confirmPassword")}
              className={cn({
                "bg-gray-700 border-gray-600 text-white placeholder-gray-400":
                  isDark,
              })}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className={cn("w-full", {
              "bg-blue-600 hover:bg-blue-700 text-white": !isDark,
              "bg-blue-800 hover:bg-blue-900 text-white": isDark,
            })}
          >
            Send Otp
          </Button>
        </>
      ) : (
        <>
          <div className="grid gap-3">
            <Label htmlFor="otp" className={cn({ "text-gray-300": isDark })}>
              Enter OTP sent to {emailForOtp}
            </Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={cn({
                "bg-gray-700 border-gray-600 text-white placeholder-gray-400":
                  isDark,
              })}
            />
          </div>
          <Button
            type="button"
            onClick={verifyOtp}
            className={cn("w-full", {
              "bg-blue-600 hover:bg-blue-700 text-white": !isDark,
              "bg-blue-800 hover:bg-blue-900 text-white": isDark,
            })}
          >
            Verify OTP
          </Button>
        </>
      )}
    </form>
  );
}
