import { Suspense } from "react";

import { RouterProvider } from "react-router";

import { MotionConfig } from "framer-motion";

import { router } from "./routes";

import AuthProvider from "./context/Auth";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <Suspense
          fallback={<div className="page-loading">Loading Pixelerion...</div>}
        >
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
    </MotionConfig>
  );
}
