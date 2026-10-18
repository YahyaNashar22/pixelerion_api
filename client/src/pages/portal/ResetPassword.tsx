import { useEffect, useState } from "react";

import { Link } from "react-router";

import { Form, PageTitle } from "../../components/WorkspaceUI";

import { send } from "../../lib/api";

export default function ResetPassword() {
  const [token] = useState(() => {
    return (
      new URLSearchParams(window.location.hash.slice(1)).get("token") || ""
    );
  });

  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const [done, setDone] = useState(false);

  return (
    <main className="auth-page">
      <div className="auth-card">
        <PageTitle title="A fresh start." eyebrow="PASSWORD RESET">
          Choose a password with at least 12 characters.
        </PageTitle>
        {done ? (
          <p className="notice success">
            Password updated. You can now sign in.
          </p>
        ) : token ? (
          <Form
            submit="Update password"
            fields={[
              {
                name: "password",
                label: "New password",
                type: "password",
                required: true,
              },
              {
                name: "confirm",
                label: "Confirm password",
                type: "password",
                required: true,
              },
            ]}
            onSubmit={async (v) => {
              if (v.password !== v.confirm)
                throw new Error("Passwords do not match");
              await send("/auth/reset-password", {
                token,
                password: v.password,
              });
              setDone(true);
            }}
          />
        ) : (
          <p className="notice error">
            Open the complete reset link from your email or request a new one.
          </p>
        )}
        <Link to="/portal/login" className="text-button">
          Back to sign in →
        </Link>
      </div>
    </main>
  );
}
