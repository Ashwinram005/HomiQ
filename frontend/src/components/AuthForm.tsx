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
import { toast, Toaster } from "sonner";

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

type AuthFormProps = {
  className?: string;
  defaultTab?: "login" | "signup";
};

export function AuthForm({
  className,
  defaultTab = "login",
  ...props
}: AuthFormProps) {
  const [tab, setTab] = useState(defaultTab);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      className={cn("w-full max-w-md mx-auto", className)}
      {...props}
    >
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <LoginForm />
      </TabsContent>

      <TabsContent value="signup">
        <SignupForm onSuccess={() => setTab("login")} />
      </TabsContent>
    </Tabs>
  );
}

function LoginForm() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthentication = async () => {
      const auth = await isAuthenticated();
      if (auth) {
        navigate({ to: "/dashboard" });
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
      const response = await fetch("http://localhost:5000/api/users/login", {
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
        alert(result.message || "Login failed");
        return;
      }
      localStorage.setItem("token", result.token);
      localStorage.setItem("email", result.email);
      navigate({ to: "/dashboard" });
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to log in to your account
        </p>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="grid gap-3">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
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

  const onSubmit = async (data: SignupSchema) => {
    try {
      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setEmailForOtp(data.email);
        setShowOtpField(true); // Show OTP input field
      } else {
        const error = await response.json();
        alert(error.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error", err);
      alert("An unexpected error occurred. Try again.");
    }
  };

  const verifyOtp = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/users/verify-otp", {
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
      toast.error("OTP Verification Error", err);
      alert("Something went wrong. Try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
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
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to sign up for a new account
        </p>
      </div>

      {!showOtpField ? (
        <>
          <div className="grid gap-3">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="E.g. John Doe"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full">
            Sign Up
          </Button>
        </>
      ) : (
        <>
          <div className="grid gap-3">
            <Label htmlFor="otp">Enter OTP sent to {emailForOtp}</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <Button type="button" onClick={verifyOtp} className="w-full">
            Verify OTP
          </Button>
        </>
      )}
    </form>
  );
}
