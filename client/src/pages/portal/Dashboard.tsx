import { Link } from "react-router";

import { useWorkspace } from "../../context/Workspace";

import { useAuth } from "../../context/Auth";

import Panel, { Badge, Empty, PageTitle } from "../../components/WorkspaceUI";

import { date, duration, money } from "../../lib/api";

export default function Dashboard() {
  const { data } = useWorkspace(),
    { user } = useAuth();
  if (!data) return null;

  const due = data.phases.filter((p) => p.payment_status === "unpaid");

  const active = data.subscriptions.find(
    (s) => new Date(s.ends_at) > new Date(),
  );

  return (
    <>
      <PageTitle
        title={"Hello, " + (user?.business_name || user?.username) + "."}
        eyebrow="YOUR WORK, IN VIEW"
      >
        A clear picture of what’s moving, what’s next, and where your support
        time goes.
      </PageTitle>
      {data.projects
        .filter((p) => p.status === "halted")
        .map((p) => (
          <div className="notice error" key={p.id}>
            <strong>{p.title} is halted.</strong>
            <p>{p.halt_reason}</p>
            <Link to="/portal/payments">Review payments →</Link>
          </div>
        ))}
      <div className="stats-grid">
        <Link to="/portal/support-time" className="stat-card">
          <span>Available support</span>
          <strong>{duration(data.balance_minutes)}</strong>
          <small>View every minute →</small>
        </Link>
        <Link to="/portal/projects" className="stat-card">
          <span>Active projects</span>
          <strong>
            {data.projects
              .filter((p) => p.status === "active")
              .length.toString()
              .padStart(2, "0")}
          </strong>
          <small>Follow the progress →</small>
        </Link>
        <Link to="/portal/payments" className="stat-card">
          <span>Outstanding payments</span>
          <strong>
            {money(due.reduce((sum, p) => sum + p.amount_cents, 0))}
          </strong>
          <small>
            {due.length} unpaid phase{due.length !== 1 ? "s" : ""} →
          </small>
        </Link>
        <Link to="/portal/plan" className="stat-card">
          <span>Your support plan</span>
          <strong className="small-value">
            {active?.plan_name || "No active plan"}
          </strong>
          <small>
            {active
              ? "Current period ends " + date(active.ends_at)
              : "Explore maintenance plans →"}
          </small>
        </Link>
      </div>
      <div className="workspace-columns">
        <Panel
          title="Your projects"
          aside={<Link to="/portal/projects">View projects →</Link>}
        >
          {data.projects.length ? (
            data.projects.map((p) => (
              <div className="record-row" key={p.id}>
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                </div>
                <Badge value={p.status} />
              </div>
            ))
          ) : (
            <Empty>
              Your projects will appear here when Pixelerion sets them up.
            </Empty>
          )}
        </Panel>
        <Panel
          title="Recent requests"
          aside={<Link to="/portal/tickets">Request support →</Link>}
        >
          {data.requests.length ? (
            data.requests.slice(0, 4).map((r) => (
              <div className="record-row" key={r.id}>
                <div>
                  <h3>{r.title}</h3>
                  <small>{date(r.created_at)}</small>
                </div>
                <Badge value={r.status} />
              </div>
            ))
          ) : (
            <Empty>
              Need a hand? Send a support request from your workspace.
            </Empty>
          )}
        </Panel>
      </div>
    </>
  );
}
