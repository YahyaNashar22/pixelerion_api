import { useWorkspace } from "../../context/Workspace";

import Panel, { Empty, Form, PageTitle } from "../../components/WorkspaceUI";

import { date, duration, send } from "../../lib/api";

export default function SupportTime() {
  const { data, refresh } = useWorkspace();
  if (!data) return null;

  return (
    <>
      <PageTitle title="Every minute, accounted for.">
        See your available time and a transparent record of the work behind it.
      </PageTitle>
      <div className="workspace-columns">
        <Panel title="Available support">
          <p className="hero-value">{duration(data.balance_minutes)}</p>
          <p className="muted">
            Monthly plan minutes expire at the end of their period. Extra
            purchased minutes do not expire unless separately agreed.
          </p>
        </Panel>
        <Panel title="Request extra minutes">
          <p className="muted">
            $30/hour ($0.50/minute). Pixelerion will confirm availability and
            arrange payment externally before adding your minutes.
          </p>
          <Form
            submit="Request minutes"
            fields={[
              {
                name: "minutes",
                label: "Minutes to request",
                type: "number",
                min: 1,
                max: 100000,
                required: true,
              },
              {
                name: "body",
                label: "What would you like help with?",
                type: "textarea",
                required: true,
              },
              {
                name: "terms",
                label:
                  "I approve the additional cost of $30/hour for these minutes.",
                type: "checkbox",
                required: true,
              },
            ]}
            onSubmit={async (v) => {
              await send("/requests", {
                kind: "minutes",
                title: "Additional " + v.minutes + " minutes",
                body: v.body,
                minutes: Number(v.minutes),
                terms_accepted: v.terms,
              });
              await refresh();
            }}
          />
        </Panel>
      </div>
      <Panel title="Minute history">
        {data.ledger.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Work / allocation</th>
                  <th>Minutes</th>
                  <th>Available from</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {data.ledger.map((l) => (
                  <tr key={l.id}>
                    <td>{date(l.created_at)}</td>
                    <td>{l.description}</td>
                    <td className={l.minutes > 0 ? "positive" : ""}>
                      {l.minutes > 0 ? "+" : ""}
                      {l.minutes} min
                    </td>
                    <td>
                      {l.available_at
                        ? date(l.available_at)
                        : date(l.created_at)}
                    </td>
                    <td>{l.expires_at ? date(l.expires_at) : "No expiry"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>
            No minute entries yet. Allocations and work logs will appear here.
          </Empty>
        )}
      </Panel>
    </>
  );
}
