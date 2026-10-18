import { useState, Suspense } from "react";

import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router";

import { useAuth } from "../../context/Auth";

import WorkspaceProvider, { useWorkspace } from "../../context/Workspace";

import { duration } from "../../lib/api";

export default function PortalLayout({ admin = false }: { admin?: boolean }) {
  const auth = useAuth();

  if (auth.loading)
    return <div className="page-loading">Opening your workspace...</div>;

  if (!auth.user) return <Navigate to="/portal/login" replace />;

  if (admin && auth.user.role !== "ADMIN")
    return <Navigate to="/portal/dashboard" replace />;

  if (!admin && auth.user.role === "ADMIN")
    return <Navigate to="/admin" replace />;

  return (
    <WorkspaceProvider>
      <Shell admin={admin} />
    </WorkspaceProvider>
  );
}

function Shell({ admin }: { admin: boolean }) {
  const { user, logout } = useAuth(),
    { data, loading, error, refresh, client, selectClient } = useWorkspace();

  const [open, setOpen] = useState(false),
    [logoutError, setLogoutError] = useState("");
  const navigate = useNavigate();

  const nav = admin
    ? [
        ["/admin", "Overview"],
        ["/admin/clients", "Clients"],
        ["/admin/projects", "Projects"],
        ["/admin/requests", "Requests"],
        ["/admin/minutes", "Minutes & plans"],
        ["/admin/catalog", "Plan catalog"],
        ["/admin/settings", "Settings"],
      ]
    : [
        ["/portal/dashboard", "Overview"],
        ["/portal/projects", "Projects"],
        ["/portal/support-time", "Support minutes"],
        ["/portal/plan", "Maintenance plan"],
        ["/portal/payments", "Payments"],
        ["/portal/tickets", "Support requests"],
        ["/portal/account", "Account"],
      ];

  return (
    <div className="workspace">
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={"workspace-sidebar " + (open ? "is-open" : "")}>
        <Link className="brand" to="/">
          <span className="brand-mark">P</span>Pixelerion
        </Link>
        <div className="sidebar-caption">
          {admin ? "STUDIO MANAGEMENT" : "YOUR CLIENT WORKSPACE"}
        </div>
        <nav aria-label="Workspace">
          {nav.map(([path, label], i) => (
            <NavLink
              end={path === "/admin"}
              key={path}
              to={path}
              onClick={() => setOpen(false)}
            >
              <span className="nav-number">0{i + 1}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="availability-dot" />{" "}
          {admin ? "Admin workspace" : "Built around your business"}
          <Link to="/">Visit the studio →</Link>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-header">
          <button
            className="mobile-menu"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          {admin ? (
            <label className="client-switch">
              Client workspace
              <select
                aria-label="Select client"
                value={client}
                onChange={(e) => selectClient(e.target.value)}
              >
                <option value="">All clients / studio</option>
                {data?.clients?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.business_name || u.username}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="balance-chip">
              <span className="availability-dot" />
              <strong>{duration(data?.balance_minutes || 0)}</strong>
              <span>available support</span>
            </div>
          )}
          <div className="header-user">
            <span className="avatar">
              {user?.username.slice(0, 2).toUpperCase()}
            </span>
            <span>
              {user?.business_name || user?.username}
              <small>{admin ? "Administrator" : "Client account"}</small>
            </span>
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await logout();
                  navigate("/portal/login");
                } catch (e) {
                  setLogoutError((e as Error).message);
                }
              }}
            >
              Sign out
            </button>
          </div>
        </header>
        <main id="main-content" className="workspace-main">
          {logoutError && (
            <p role="alert" className="notice error">
              {logoutError}
            </p>
          )}
          {loading ? (
            <div className="page-loading">Loading workspace...</div>
          ) : error ? (
            <div className="notice error" role="alert">
              {error}
              <button
                className="text-button"
                onClick={() => void refresh().catch(() => {})}
              >
                Retry
              </button>
            </div>
          ) : (
            <Suspense fallback={<div className="page-loading">Loading...</div>}>
              <Outlet />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}
