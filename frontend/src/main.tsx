import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import Dashboard from "./routes/Dashboard.tsx";

import TanstackQueryLayout from "./integrations/tanstack-query/layout";

import * as TanstackQuery from "./integrations/tanstack-query/root-provider";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";

import App from "./App.tsx";
import Wildcard from "./routes/Wildcard.tsx";
import { isAuthenticated } from "./lib/auth.ts";
import MultiStepPostForm from "./routes/MultiStepPostForm.tsx";
import MyPosts from "./routes/MyPosts.tsx";
import OtherPosts from "./routes/OtherPosts.tsx";
import ChatPage from "./routes/ChatPage.tsx";
import Chat from "./routes/Chat.tsx";

const rootRoute = createRootRoute({
  component: () => (
    <>
      {/* <Header /> */}
      <Outlet />
      {/* <TanStackRouterDevtools /> */}

      <TanstackQueryLayout />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
  beforeLoad: async () => {
    const auth = await isAuthenticated();
    if (auth) {
      return redirect({ to: "/dashboard" });
    }
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,

  Dashboard(rootRoute),
  Wildcard(rootRoute),
  MultiStepPostForm(rootRoute),
  MyPosts(rootRoute),
  OtherPosts(rootRoute),
  ChatPage(rootRoute),
  Chat(rootRoute),
]);

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

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
