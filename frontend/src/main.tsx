import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";

import { Toaster } from "react-hot-toast";

import LandingPage from "./routes/LandingPage";
import Dashboard from "./routes/Dashboard";
import MultiStepPostForm from "./routes/MultiStepPostForm";
import MyPosts from "./routes/MyPosts";
import OtherPosts from "./routes/OtherPosts";
import ChatRoute from "./routes/Chat";
import EmptyChatRoute from "./routes/EmptyChat";
import EditPostRoute from "./routes/EditPost";
import SinglePostRoute from "./routes/SinglePost";
import ProfilePageRoute from "./routes/ProfilePage";
import Wildcard from "./routes/Wildcard";

import { isAuthenticated } from "./lib/auth";

import TanstackQueryLayout from "./integrations/tanstack-query/layout";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";

import "./styles.css";
import "leaflet/dist/leaflet.css";

import reportWebVitals from "./reportWebVitals";
import App from "./App";

// 1. Root layout component - renders Toaster and child routes

// 2. Define root route with layout = App
const rootRoute = createRootRoute({
  component: App,
});

// 3. Define index route "/" renders LandingPage, redirect to dashboard if authenticated
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
  beforeLoad: async () => {
    const auth = await isAuthenticated();
    if (auth) {
      return redirect({ to: "/dashboard" });
    }
  },
});

// 4. Dashboard route, protected, redirect to "/" if not authenticated
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
  beforeLoad: async () => {
    const auth = await isAuthenticated();
    if (!auth) {
      return redirect({ to: "/" });
    }
  },
});

// 5. Other routes — add with the rootRoute as parent
const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  ProfilePageRoute(rootRoute),
  EmptyChatRoute(rootRoute),
  MultiStepPostForm(rootRoute),
  MyPosts(rootRoute),
  OtherPosts(rootRoute),
  EditPostRoute(rootRoute),
  ChatRoute(rootRoute),
  SinglePostRoute(rootRoute),
  Wildcard(rootRoute),
]);

// 6. Create router with Tanstack Query context and options
const router = createRouter({
  routeTree,
  context: {
    ...TanstackQuery.getContext(),
  },
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// 7. Register router type for TypeScript
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// 8. Render root app with RouterProvider and Query provider
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <TanstackQuery.Provider>
        <RouterProvider router={router} />
      </TanstackQuery.Provider>
    </StrictMode>
  );
}

// 9. Optional: measure performance
reportWebVitals();
