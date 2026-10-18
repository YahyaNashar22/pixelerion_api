import { useWorkspace } from "../../context/Workspace";

import Panel, {
  Disclosure,
  Form,
  PageTitle,
} from "../../components/WorkspaceUI";

import { date, duration, money, send } from "../../lib/api";

export default function Plan() {
  const { data, refresh } = useWorkspace();
  if (!data) return null;

  const active = data.subscriptions.find(
    (s) => new Date(s.ends_at) > new Date(),
  );

  return (
    <>
      <PageTitle title="Support that stays with you.">
        Dedicated maintenance and technical assistance after your project goes
        live.
      </PageTitle>
      <Panel title="Your current agreement">
        {active ? (
          <>
            <h3>{active.plan_name}</h3>
            <p>
              {money(active.price_cents)} · {duration(active.included_minutes)}{" "}
              allocated across this agreement
            </p>
            <p className="muted">
              {date(active.starts_at)} · {date(active.ends_at)}. Monthly minutes
              do not roll over.
            </p>
          </>
        ) : (
          <p className="muted">
            You don’t have an active maintenance plan. Request one below and
            we’ll confirm capacity and payment details.
          </p>
        )}
      </Panel>
      <div className="plan-grid">
        {data.plans
          .filter((p) => p.active)
          .map((p) => (
            <Panel title={p.name} key={p.id}>
              <p className="plan-price">
                {money(p.price_cents)}
                <small>/ month</small>
              </p>
              <strong>{duration(p.included_minutes)} support / month</strong>
              <p className="muted">
                {p.duration_months}-month agreement;{" "}
                {money(p.price_cents * p.duration_months)} total, paid
                externally in advance.
              </p>
              <p className="muted">{p.description}</p>
              <p className="response-target">{p.response_target}</p>
              <Disclosure title="Request this plan">
                <Form
                  submit="Submit plan request"
                  fields={[
                    {
                      name: "body",
                      label: "Tell us about your support needs",
                      type: "textarea",
                      required: true,
                    },
                    {
                      name: "terms",
                      label:
                        "I accept the support terms below, monthly advance billing and no rollover of unused minutes.",
                      type: "checkbox",
                      required: true,
                    },
                  ]}
                  onSubmit={async (v) => {
                    await send("/requests", {
                      kind: "plan_change",
                      title: "Request " + p.name,
                      body: v.body,
                      plan_id: p.id,
                      terms_accepted: v.terms,
                    });
                    await refresh();
                  }}
                />
              </Disclosure>
            </Panel>
          ))}
      </div>
      <Panel title="Support terms">
        <div className="prose-notes">
          <p>
            Plans are optional, billed monthly in advance and activated after
            selection, acceptance of terms, payment and availability
            confirmation. Fees for a period already started are non-refundable.
          </p>
          <p>
            Minutes cover actual investigation, implementation, testing,
            deployment, communication, consultation and technical meetings.
            Unused monthly minutes do not roll over. Work on third-party issues
            can also use support time; third-party fees remain your
            responsibility.
          </p>
          <p>
            Additional work requires your approval at $30/hour. Substantial new
            functionality, major redesigns and architectural changes require a
            separate quotation. Pixelerion will notify you before treating a
            request as separate project work.
          </p>
          <p>
            Support is provided during agreed business days and hours. Response
            targets describe acknowledgement and initial evaluation, not
            guaranteed resolution. Premium’s critical response applies to
            substantially unavailable core production services, during business
            hours.
          </p>
          <p>
            Cancel before the next billing period. Future pricing may change
            with reasonable advance notice. Custom support and dedicated
            capacity are available by quotation. Without an active plan,
            assistance depends on availability.
          </p>
        </div>
        <Disclosure title="Request cancellation or a custom agreement">
          <Form
            submit="Send request"
            fields={[
              {
                name: "kind",
                label: "Request type",
                type: "select",
                required: true,
                options: [
                  { value: "cancellation", label: "Cancel before next period" },
                  { value: "support", label: "Custom / enterprise agreement" },
                ],
              },
              {
                name: "body",
                label: "Details",
                type: "textarea",
                required: true,
              },
            ]}
            onSubmit={async (v) => {
              await send("/requests", {
                kind: v.kind,
                title:
                  v.kind === "cancellation"
                    ? "Plan cancellation request"
                    : "Custom support agreement",
                body: v.body,
              });
              await refresh();
            }}
          />
        </Disclosure>
      </Panel>
    </>
  );
}
