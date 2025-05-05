import { createRoute, RootRoute } from "@tanstack/react-router";

export const Dashboard = () => {
    return (
      <div>
        <h1>Welcome to the Dashboard!</h1>
        <p>This is a protected page only accessible after login.</p>
      </div>
    );
  }
  
  export default (parentRoute: RootRoute) =>
    createRoute({
        path: "/dashboard",
        component: Dashboard,
        getParentRoute: () => parentRoute,
    });
  