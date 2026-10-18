import RequestQuote from "../../components/RequestQuote";
import { useState } from "react";

import { useLocation } from "react-router";

import { useWorkspace } from "../../context/Workspace";

import Panel, {
  Badge,
  Disclosure,
  Empty,
  Form,
  PageTitle,
  type Field,
} from "../../components/WorkspaceUI";

import { date, duration, money, send } from "../../lib/api";

import Projects from "../portal/Projects";

import type { Request } from "../../lib/types";

export default function Admin() {
  const { data, client, selectClient, refresh } = useWorkspace();
  const { pathname } = useLocation();

  const [resetLink, setResetLink] = useState<{
    clientID: string;
    url: string;
  } | null>(null);

  if (!data) return null;

  const section = pathname.split("/")[2] || "overview";

  const account = data.clients?.find((u) => u.id === client);

  if (section === "projects") return <Projects />;

  if (section === "clients")
    return (
      <>
        <PageTitle
          eyebrow="STUDIO / CLIENTS"
          title="Good work starts with good people."
        >
          Create private client accounts and maintain business details.
        </PageTitle>
        <div className="workspace-columns">
          <Panel title="Create client account">
            <Form
              submit="Create account"
              fields={[
                { name: "username", label: "Username", required: true },
                {
                  name: "email",
                  label: "Email",
                  type: "email",
                  required: true,
                },
                {
                  name: "password",
                  label: "Initial password (at least 12 characters)",
                  type: "password",
                  required: true,
                },
                { name: "business_name", label: "Business name" },
                {
                  name: "business_details",
                  label: "Business details, address and contact",
                  type: "textarea",
                },
              ]}
              onSubmit={async (v) => {
                await send("/admin/clients", v);
                await refresh();
              }}
            />
          </Panel>
          <Panel title="Client directory">
            {data.clients?.length ? (
              data.clients.map((u) => (
                <button
                  key={u.id}
                  className={
                    "client-row " + (u.id === client ? "selected" : "")
                  }
                  onClick={() => {
                    selectClient(u.id);
                    setResetLink(null);
                  }}
                >
                  <strong>{u.business_name || u.username}</strong>
                  <span>{u.email}</span>
                  <small>@{u.username} →</small>
                </button>
              ))
            ) : (
              <Empty>No client accounts yet.</Empty>
            )}
          </Panel>
        </div>
        {account && (
          <Panel key={account.id} title={"Manage " + account.username}>
            <Form
              submit="Save business details"
              fields={[
                { name: "business_name", label: "Business name" },
                {
                  name: "business_details",
                  label: "Business details",
                  type: "textarea",
                },
              ]}
              initial={{
                business_name: account.business_name,
                business_details: account.business_details,
              }}
              onSubmit={async (v) => {
                await send("/admin/clients/" + account.id, v, "PATCH");
                await refresh();
              }}
            />
            <Form
              fields={[]}
              submit="Generate one-hour password reset link"
              onSubmit={async () => {
                const result = await send<{ url: string }>(
                  "/admin/clients/" + account.id + "/reset-link",
                  {},
                );
                setResetLink({ clientID: account.id, url: result.url });
              }}
            />
            {resetLink?.clientID === account.id && (
              <div className="notice">
                <p>
                  Share this link privately with the client. It expires in one
                  hour and works once.
                </p>
                <input
                  aria-label="Generated password reset link"
                  className="reset-link"
                  readOnly
                  value={resetLink.url}
                  onFocus={(e) => e.target.select()}
                />
              </div>
            )}
          </Panel>
        )}
      </>
    );

  if (section === "requests")
    return (
      <>
        <PageTitle eyebrow="STUDIO / REQUESTS" title="The client inbox.">
          Approve paid allocations, review plan changes, and reply to support
          requests.
        </PageTitle>
        {data.requests.length ? (
          data.requests.map((r) => <RequestReview key={r.id} request={r} />)
        ) : (
          <Empty>No requests for this selection.</Empty>
        )}
      </>
    );

  if (section === "minutes")
    return (
      <>
        <PageTitle eyebrow="STUDIO / SUPPORT" title="Keep support transparent.">
          Select a client to activate a paid plan or record support minutes.
        </PageTitle>
        {!account ? (
          <Empty>Select a client using the selector above.</Empty>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <span>{account.business_name || account.username}</span>
                <strong>{duration(data.balance_minutes)}</strong>
                <small>Available minutes</small>
              </div>
            </div>
            <div className="workspace-columns">
              <Panel title="Activate a paid plan">
                <p className="muted">
                  Activation schedules the plan’s monthly minutes once. Existing
                  active periods cannot overlap. Renew manually after payment at
                  the end of the current period.
                </p>
                <Form
                  key={client}
                  submit="Activate paid plan"
                  fields={[
                    {
                      name: "plan_id",
                      label: "Plan",
                      type: "select",
                      options: data.plans
                        .filter((p) => p.active)
                        .map((p) => ({
                          value: p.id,
                          label:
                            p.name +
                            " / " +
                            money(p.price_cents) +
                            " per month, " +
                            p.duration_months +
                            " month(s)",
                        })),
                      required: true,
                    },
                    {
                      name: "payment_reference",
                      label: "Verified external payment reference",
                      required: true,
                    },
                    {
                      name: "terms_accepted",
                      label:
                        "The client accepted the support terms and I verified the external payment.",
                      type: "checkbox",
                      required: true,
                    },
                  ]}
                  onSubmit={async (v) => {
                    await send("/admin/clients/" + client + "/subscription", v);
                    await refresh();
                  }}
                />
              </Panel>
              <Panel title="Record minutes">
                <p className="muted">
                  Use negative minutes to log work. Positive entries are paid
                  credits or documented corrections. History is append-only.
                </p>
                <Form
                  key={client}
                  submit="Record minute entry"
                  fields={[
                    {
                      name: "minutes",
                      label: "Minutes (+ credit / - work)",
                      type: "number",
                      min: -100000,
                      max: 100000,
                      required: true,
                    },
                    {
                      name: "description",
                      label: "Work description or payment/correction reference",
                      type: "textarea",
                      required: true,
                    },
                    {
                      name: "expiry",
                      label: "Credit expiry (optional)",
                      type: "date",
                    },
                  ]}
                  onSubmit={async (v) => {
                    await send("/admin/clients/" + client + "/minutes", {
                      minutes: Number(v.minutes),
                      description: v.description,
                      expires_at: v.expiry
                        ? String(v.expiry) + "T23:59:59Z"
                        : "",
                    });
                    await refresh();
                  }}
                />
              </Panel>
            </div>
            <Panel title="Minute ledger">
              {data.ledger.length ? (
                data.ledger.map((l) => (
                  <div className="record-row" key={l.id}>
                    <div>
                      <h3>{l.description}</h3>
                      <small>
                        {date(l.created_at)} · expires{" "}
                        {l.expires_at ? date(l.expires_at) : "never"}
                      </small>
                    </div>
                    <strong className={l.minutes > 0 ? "positive" : ""}>
                      {l.minutes > 0 ? "+" : ""}
                      {l.minutes} min
                    </strong>
                  </div>
                ))
              ) : (
                <Empty>No entries yet.</Empty>
              )}
            </Panel>
          </>
        )}
      </>
    );

  if (section === "catalog") {
    const fields: Field[] = [
      { name: "name", label: "Plan name", required: true },
      {
        name: "description",
        label: "Included services and details",
        type: "textarea",
        required: true,
      },
      {
        name: "price",
        label: "Monthly price (USD)",
        type: "number",
        min: 0,
        step: "0.01",
        required: true,
      },
      {
        name: "included_minutes",
        label: "Monthly included minutes",
        type: "number",
        min: 1,
        max: 100000,
        required: true,
      },
      {
        name: "duration_months",
        label: "Allocation duration (months)",
        type: "number",
        min: 1,
        max: 12,
        required: true,
        hint: "1-12 month agreement; monthly minutes release separately and expire without rollover. Full agreement fee is confirmed externally.",
      },
      {
        name: "response_target",
        label: "Response target",
        type: "textarea",
        required: true,
      },
      {
        name: "active",
        label: "Available for client requests",
        type: "checkbox",
      },
    ];

    return (
      <>
        <PageTitle
          eyebrow="STUDIO / PLANS"
          title="A support offering that grows with you."
        >
          Catalog edits apply to future agreements. Active agreements keep their
          original price and allocation.
        </PageTitle>
        <Panel title="New maintenance plan">
          <Form
            fields={fields}
            initial={{ duration_months: "1", active: true }}
            submit="Create plan"
            onSubmit={async (v) => {
              const { price, ...rest } = v;
              await send("/admin/plans", {
                ...rest,
                price_cents: Math.round(Number(price) * 100),
                included_minutes: Number(v.included_minutes),
                duration_months: Number(v.duration_months),
              });
              await refresh();
            }}
          />
        </Panel>
        {data.plans.map((p) => (
          <Panel
            key={p.id}
            title={p.name}
            aside={<Badge value={p.active ? "active" : "inactive"} />}
          >
            <Disclosure title="Edit plan">
              <Form
                fields={fields}
                initial={{
                  name: p.name,
                  description: p.description,
                  price: String(p.price_cents / 100),
                  included_minutes: String(p.included_minutes),
                  duration_months: String(p.duration_months),
                  response_target: p.response_target,
                  active: !!p.active,
                }}
                submit="Save plan"
                onSubmit={async (v) => {
                  const { price, ...rest } = v;
                  await send(
                    "/admin/plans/" + p.id,
                    {
                      ...rest,
                      price_cents: Math.round(Number(price) * 100),
                      included_minutes: Number(v.included_minutes),
                      duration_months: Number(v.duration_months),
                    },
                    "PUT",
                  );
                  await refresh();
                }}
              />
            </Disclosure>
          </Panel>
        ))}
      </>
    );
  }

  if (section === "settings")
    return (
      <>
        <PageTitle
          eyebrow="STUDIO / SETTINGS"
          title="The details behind the work."
        >
          Payment instructions and email delivery visibility.
        </PageTitle>
        <Panel title="Private payment instructions">
          <p className="muted">
            These instructions are only visible after sign-in. Add the Whish
            number or bank beneficiary / IBAN you want clients to use, currency,
            and reference format.
          </p>
          <Form
            submit="Save instructions"
            fields={[
              {
                name: "payment_instructions",
                label: "External payment instructions",
                type: "textarea",
                required: true,
              },
            ]}
            initial={{ payment_instructions: data.payment_instructions }}
            onSubmit={async (v) => {
              await send("/admin/settings", v, "PUT");
              await refresh();
            }}
          />
        </Panel>
        <Panel title="Email delivery">
          <p className={"notice " + (data.email_configured ? "success" : "")}>
            {data.email_configured
              ? "Gmail SMTP is configured. Delivery retries run every 15 seconds."
              : "Email is not configured. Set SMTP credentials in the server environment. Client requests remain saved in the admin inbox."}
          </p>
          {data.email_queue?.map((e) => (
            <div className="record-row" key={e.id}>
              <div>
                <h3>{e.subject}</h3>
                <small>{e.recipient}</small>
                {e.last_error && <p>{e.last_error}</p>}
              </div>
              <Badge
                value={
                  e.sent_at ? "sent" : e.attempts >= 8 ? "failed" : "queued"
                }
              />
            </div>
          ))}
        </Panel>
      </>
    );

  return (
    <>
      <PageTitle
        eyebrow="PIXELERION / STUDIO"
        title="A little clarity. A lot of progress."
      >
        Your clients, delivery work and support requests, in one workspace.
      </PageTitle>
      <div className="stats-grid">
        <div className="stat-card">
          <span>Client accounts</span>
          <strong>{data.clients?.length || 0}</strong>
        </div>
        <div className="stat-card">
          <span>Pending requests</span>
          <strong>
            {data.requests.filter((r) => r.status === "pending").length}
          </strong>
        </div>
        <div className="stat-card">
          <span>Selected client balance</span>
          <strong>{duration(data.balance_minutes)}</strong>
        </div>
      </div>
      <Panel title="Recent activity">
        {data.audit?.length ? (
          data.audit.map((a) => (
            <div className="record-row" key={a.id}>
              <div>
                <h3>{a.action.replaceAll(".", " / ")}</h3>
                <small>{a.username}</small>
              </div>
              <small>{date(a.created_at)}</small>
            </div>
          ))
        ) : (
          <Empty>
            Changes to projects, minutes and accounts will appear here.
          </Empty>
        )}
      </Panel>
    </>
  );
}

function RequestReview({ request: r }: { request: Request }) {
  const { refresh } = useWorkspace();

  return (
    <Panel title={r.title} aside={<Badge value={r.status} />}>
      <p className="muted">
        {r.username} · {r.kind.replaceAll("_", " ")} · {date(r.created_at)}
      </p>
      <p className="preserve-lines">{r.body}</p>
      <RequestQuote request={r} />
      {r.admin_note && <div className="notice">{r.admin_note}</div>}
      {r.status === "pending" && (
        <Form
          submit="Update request"
          fields={[
            {
              name: "status",
              label: "Decision",
              type: "select",
              options: [
                { value: "approved", label: "Approve" },
                { value: "declined", label: "Decline" },
                { value: "resolved", label: "Resolve / acknowledge" },
              ],
              required: true,
            },
            {
              name: "admin_note",
              label: "Reply / decision note (visible to client)",
              type: "textarea",
            },
            ...(["minutes", "plan_change"].includes(r.kind)
              ? [
                  {
                    name: "payment_reference",
                    label:
                      "Verified external payment reference (required to approve)",
                  } as Field,
                ]
              : []),
            ...(r.kind === "plan_change"
              ? [
                  {
                    name: "terms_accepted",
                    label: "The client accepted the support terms.",
                    type: "checkbox",
                  } as Field,
                ]
              : []),
          ]}
          onSubmit={async (v) => {
            await send("/admin/requests/" + r.id, v, "PATCH");
            await refresh();
          }}
        />
      )}
      {r.kind === "cancellation" && (
        <p className="muted">
          Cancellation acknowledgement leaves the paid current period available
          until its expiry. Renewals are manual.
        </p>
      )}
    </Panel>
  );
}
