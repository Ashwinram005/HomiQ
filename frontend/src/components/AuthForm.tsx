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

export function AuthForm({ className, ...props }: React.ComponentProps<"div">) {
  const [tab, setTab] = useState("login");

  return (
    <Tabs
      defaultValue="login"
      value={tab}
      onValueChange={setTab}
      className={cn("w-full max-w-md mx-auto", className)}
      {...props}
    >
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>

      {/* Login Tab */}
      <TabsContent value="login">
        <LoginForm />
      </TabsContent>

      {/* Signup Tab */}
      <TabsContent value="signup">
        <SignupForm onSuccess={() => setTab("login")} />
      </TabsContent>
    </Tabs>
  );
}

function LoginForm() {
  const navigate = useNavigate();

  useEffect(() => {
    // Use async function inside useEffect to await the promise
    const checkAuthentication = async () => {
      const auth = await isAuthenticated();
      if (auth) {
        navigate({ to: "/dashboard" }); // Redirect to the dashboard if the user is already logged in
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
      console.log("Login success:", result);
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

      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:border-t after:border-border">
        <span className="bg-background relative z-10 px-2 text-muted-foreground">
          Or continue with
        </span>
      </div>

      <Button
        variant="outline"
        className="w-full flex items-center gap-2 justify-center"
      >
        Login with GitHub
      </Button>
    </form>
  );
}
interface SignupFormProps {
  onSuccess: () => void;
}
function SignupForm({ onSuccess }: SignupFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupSchema) => {
    try {
      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      if (response.ok) {
        onSuccess();
        console.log("Signup successful");
        reset();
      } else {
        const error = await response.json();
        alert(error.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error", err);
      alert("An unexpected error occurred. Try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to sign up for a new account
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

      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:border-t after:border-border">
        <span className="bg-background relative z-10 px-2 text-muted-foreground">
          Or continue with
        </span>
      </div>

      <Button
        variant="outline"
        className="w-full flex items-center gap-2 justify-center"
      >
        Sign Up with GitHub
      </Button>
    </form>
  );
}

// SVG GitHub icon component
