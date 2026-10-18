import { useAuth } from "../../context/Auth";

import Panel, { Form, PageTitle } from "../../components/WorkspaceUI";

import { send } from "../../lib/api";

export default function Account() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <PageTitle title="Your account.">
        Your contact and business details, managed with Pixelerion.
      </PageTitle>
      <div className="workspace-columns">
        <Panel title="Account details">
          <dl className="account-details">
            <dt>Username</dt>
            <dd>{user.username}</dd>
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Business</dt>
            <dd>{user.business_name || "Not specified"}</dd>
            <dt>Business details</dt>
            <dd className="preserve-lines">
              {user.business_details ||
                "Contact Pixelerion to update your business details."}
            </dd>
          </dl>
        </Panel>
        <Panel title="Password security">
          <p className="muted">
            Request a private reset link. Updating your password signs you out
            of every active session.
          </p>
          <Form
            fields={[]}
            submit="Email a password reset link"
            onSubmit={async () => {
              await send("/auth/forgot-password", { email: user.email });
            }}
          />
          <p className="muted text-sm">
            You can also ask Pixelerion to generate a reset link for you.
          </p>
        </Panel>
      </div>
    </>
  );
}
