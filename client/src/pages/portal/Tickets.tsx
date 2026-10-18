import RequestQuote from "../../components/RequestQuote";
import { useWorkspace } from "../../context/Workspace";

import Panel, {
  Badge,
  Empty,
  Form,
  PageTitle,
} from "../../components/WorkspaceUI";

import { date, send } from "../../lib/api";

export default function Tickets() {
  const { data, refresh } = useWorkspace();
  if (!data) return null;

  return (
    <>
      <PageTitle title="Let’s keep things moving.">
        Send a support request. We’ll follow up with you by email.
      </PageTitle>
      <div className="workspace-columns">
        <Panel title="New support request">
          <Form
            submit="Send support request"
            fields={[
              { name: "title", label: "Subject", required: true },
              {
                name: "body",
                label: "Describe the issue and how to reproduce it",
                type: "textarea",
                required: true,
              },
            ]}
            onSubmit={async (v) => {
              await send("/requests", {
                kind: "support",
                title: v.title,
                body: v.body,
              });
              await refresh();
            }}
          />
          <p className="muted text-sm">
            Your request is saved in Pixelerion’s inbox
            {data.email_configured
              ? " and queued for email delivery"
              : ". Email notifications are awaiting configuration"}
            .
          </p>
        </Panel>
        <Panel title="Your requests">
          {data.requests.length ? (
            data.requests.map((r) => (
              <details key={r.id} className="request-item">
                <summary>
                  <span>
                    {r.title}
                    <small>
                      {r.kind.replaceAll("_", " ")} · {date(r.created_at)}
                    </small>
                  </span>
                  <Badge value={r.status} />
                </summary>
                <p className="preserve-lines">{r.body}</p>
                <RequestQuote request={r} />
                {r.admin_note && (
                  <div className="notice">
                    <strong>Pixelerion’s reply</strong>
                    <p>{r.admin_note}</p>
                  </div>
                )}
              </details>
            ))
          ) : (
            <Empty>You haven’t submitted any requests yet.</Empty>
          )}
        </Panel>
      </div>
    </>
  );
}
