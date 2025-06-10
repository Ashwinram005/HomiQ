import { createRoute, redirect, RootRoute } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth"; // Assuming isAuthenticated checks login status

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "*",
    component: () => {
      return <div>Loading...</div>;
    },
    getParentRoute: () => parentRoute,
    beforeLoad: async () => {
      const auth = await isAuthenticated();
      if (!auth) {
        return redirect({ to: "/" }); // Redirect to login page
      } else {
        return redirect({ to: "/dashboard" });
      }
    },
  });
