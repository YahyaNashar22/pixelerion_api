import { useState } from "react";

import { Link, useNavigate } from "react-router";

import { useAuth } from "../../context/Auth";

import { Form, PageTitle } from "../../components/WorkspaceUI";

import { send } from "../../lib/api";

export default function Login() {
  const auth = useAuth(),
    navigate = useNavigate();

  const [forgot, setForgot] = useState(false),
    [message, setMessage] = useState("");

  return (
    <main className="auth-page">
      <div className="auth-orbit" aria-hidden="true" />
      <div className="auth-card">
        <Link to="/" className="brand">
          <span className="brand-mark">P</span> Pixelerion
        </Link>
        <PageTitle
          eyebrow="WELCOME TO YOUR WORKSPACE"
          title={forgot ? "Reset your password" : "Good to see you."}
        >
          {forgot
            ? "We’ll send a reset link to your account email."
            : "Your projects, progress and support. All in one place."}
        </PageTitle>
        {forgot ? (
          <Form
            submit="Send reset link"
            fields={[
              {
                name: "email",
                label: "Account email",
                type: "email",
                required: true,
              },
            ]}
            onSubmit={async (v) => {
              const result = await send<{ message: string }>(
                "/auth/forgot-password",
                { email: v.email },
              );
              setMessage(result.message);
            }}
          />
        ) : (
          <Form
            submit="Sign in ?"
            fields={[
              {
                name: "identifier",
                label: "Username or email",
                required: true,
              },
              {
                name: "password",
                label: "Password",
                type: "password",
                required: true,
              },
            ]}
            onSubmit={async (v) => {
              const user = await auth.login(
                String(v.identifier),
                String(v.password),
              );
              navigate(user.role === "ADMIN" ? "/admin" : "/portal/dashboard");
            }}
          />
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        <button
          className="text-button"
          onClick={() => {
            setForgot(!forgot);
            setMessage("");
          }}
        >
          {forgot ? "Back to sign in" : "Forgot password?"}
        </button>
        <p className="muted text-sm">
          Accounts are provided by Pixelerion. Contact your project manager if
          you need access.
        </p>
        <Link to="/" className="text-button">
          ← Back to Pixelerion
        </Link>
      </div>
    </main>
  );
}
