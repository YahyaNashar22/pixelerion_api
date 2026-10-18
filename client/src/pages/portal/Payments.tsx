import { useWorkspace } from "../../context/Workspace";

import Panel, { Badge, Empty, PageTitle } from "../../components/WorkspaceUI";

import { date, money } from "../../lib/api";

export default function Payments() {
  const { data } = useWorkspace();
  if (!data) return null;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageTitle title="Payments, clearly laid out.">
        Track project phase fees and confirmation of transfers made outside the
        platform.
      </PageTitle>
      <Panel title="How to pay">
        <p className="preserve-lines">{data.payment_instructions}</p>
        <p className="muted">
          Pay using your agreed external method. Pixelerion will mark the phase
          paid after verifying receipt. Project resumption is confirmed
          separately.
        </p>
      </Panel>
      <Panel title="Project payments">
        {data.phases.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Project / phase</th>
                  <th>Due</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {data.phases.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <small>
                        {
                          data.projects.find(
                            (project) => project.id === p.project_id,
                          )?.title
                        }
                      </small>
                      <br />
                      {p.title}
                    </td>
                    <td>{date(p.due_date)}</td>
                    <td>{money(p.amount_cents)}</td>
                    <td>
                      <Badge
                        value={
                          p.payment_status === "unpaid" && p.due_date < today
                            ? "overdue"
                            : p.payment_status
                        }
                      />
                    </td>
                    <td>{p.payment_reference || "Awaiting confirmation"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>
            Your phase payments will appear once your project is scheduled.
          </Empty>
        )}
      </Panel>
      <Panel title="Support plan payment history">
        {data.subscriptions.length ? (
          data.subscriptions.map((s) => (
            <div className="record-row" key={s.id}>
              <div>
                <h3>{s.plan_name}</h3>
                <small>
                  {date(s.starts_at)} · {date(s.ends_at)}
                </small>
              </div>
              <span>{money(s.price_cents)} · confirmed</span>
            </div>
          ))
        ) : (
          <Empty>No support plan payments recorded.</Empty>
        )}
      </Panel>
    </>
  );
}
