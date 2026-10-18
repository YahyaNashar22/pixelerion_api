import ErrorPage from "./pages/ErrorPage";
import { createBrowserRouter } from "react-router";

import { lazy } from "react";

const Root = lazy(() => import("./pages/Root"));

const Home = lazy(() => import("./pages/Home"));

const PortalLayout = lazy(() => import("./pages/portal/PortalLayout"));

const Login = lazy(() => import("./pages/portal/Login"));

const ResetPassword = lazy(() => import("./pages/portal/ResetPassword"));

const Dashboard = lazy(() => import("./pages/portal/Dashboard"));

const Projects = lazy(() => import("./pages/portal/Projects"));

const Tickets = lazy(() => import("./pages/portal/Tickets"));

const SupportTime = lazy(() => import("./pages/portal/SupportTime"));

const Plan = lazy(() => import("./pages/portal/Plan"));

const Account = lazy(() => import("./pages/portal/Account"));

const Payments = lazy(() => import("./pages/portal/Payments"));

const Admin = lazy(() => import("./pages/admin/Admin"));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    ErrorBoundary: ErrorPage,
    children: [{ index: true, Component: Home }],
  },

  { path: "/portal/login", Component: Login },

  { path: "/portal/reset-password", Component: ResetPassword },

  {
    path: "/portal",
    Component: PortalLayout,
    ErrorBoundary: ErrorPage,
    children: [
      { index: true, Component: Dashboard },
      { path: "dashboard", Component: Dashboard },

      { path: "projects", Component: Projects },
      { path: "tickets", Component: Tickets },

      { path: "support-time", Component: SupportTime },
      { path: "plan", Component: Plan },

      { path: "payments", Component: Payments },
      { path: "account", Component: Account },
    ],
  },

  {
    path: "/admin",
    element: <AdminLayout />,
    ErrorBoundary: ErrorPage,
    children: [
      { index: true, Component: Admin },
      ...[
        "clients",
        "projects",
        "requests",
        "minutes",
        "catalog",
        "settings",
      ].map((path) => ({ path, Component: Admin })),
    ],
  },

  {
    path: "*",
    element: (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Page not found</h1>
          <a href="/">Return to Pixelerion →</a>
        </div>
      </div>
    ),
  },
]);

function AdminLayout() {
  return <PortalLayout admin />;
}
