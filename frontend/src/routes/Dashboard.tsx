import { createRoute, redirect, RootRoute, useNavigate } from "@tanstack/react-router";
import { isAuthenticated, logout } from "@/lib/auth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";


export const Dashboard = () => {
  const navigate=useNavigate();
  useEffect(() => {
      // Use async function inside useEffect to await the promise
      const checkAuthentication = async () => {
        const auth = await isAuthenticated();
        if (auth) {
          navigate({ to: "/dashboard" }); // Redirect to the dashboard if the user is already logged in
        }
      };
  
      checkAuthentication();
    }, []);
    const handleLogout = async () => {
      await logout(); // clear token/session
      navigate({ to: "/" }); // redirect to login page
    };
  
  return (
    <div>
        <h1>Welcome to the Dashboard!</h1>
        <p>This is a protected page only accessible after login.</p>
        <Button variant="destructive" onClick={handleLogout}>
        Logout
      </Button>
      </div>
    );
  }
  
  export default (parentRoute: RootRoute) =>
    createRoute({
        path: "/dashboard",
        component: Dashboard,
        getParentRoute: () => parentRoute,
        beforeLoad:async () => {
          const auth = await isAuthenticated();
          if (!auth) {
              // If not authenticated, redirect to login page
              return redirect({to:"/"}); // Redirect to login page
          }
        },
    });
  