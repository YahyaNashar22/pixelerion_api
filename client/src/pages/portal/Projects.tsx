import { useState } from "react";

import { useAuth } from "../../context/Auth";

import { useWorkspace } from "../../context/Workspace";

import Panel, {
  Badge,
  Disclosure,
  Empty,
  Form,
  PageTitle,
  type Field,
  type Values,
} from "../../components/WorkspaceUI";

import { api, date, money, send } from "../../lib/api";

import type { Phase, Project, Task } from "../../lib/types";

const taskStatuses = ["backlog", "todo", "in_progress", "review", "done"];

const options = (values: string[]) =>
  values.map((value) => ({ value, label: value.replaceAll("_", " ") }));

const phaseFields: Field[] = [
  { name: "title", label: "Phase title", required: true },
  { name: "due_date", label: "Due date", type: "date", required: true },
  {
    name: "amount",
    label: "Amount (USD)",
    type: "number",
    min: 0,
    step: "0.01",
    required: true,
  },
  {
    name: "status",
    label: "Progress",
    type: "select",
    options: options(["planned", "in_progress", "completed"]),
    required: true,
  },
  {
    name: "payment_status",
    label: "Payment",
    type: "select",
    options: options(["unpaid", "paid"]),
    required: true,
  },
  {
    name: "payment_reference",
    label: "External payment reference (required if paid)",
  },
  {
    name: "position",
    label: "Display order",
    type: "number",
    min: 0,
    required: true,
  },
];

export default function Projects() {
  const { data, client, refresh } = useWorkspace(),
    { user } = useAuth();
  if (!data) return null;
  const admin = user?.role === "ADMIN";

  return (
    <>
      <PageTitle
        title={admin ? "Shape the work." : "From the first step to launch."}
        eyebrow={admin ? "PROJECT MANAGEMENT" : undefined}
      >
        Project milestones, tasks and a shared view of progress.
      </PageTitle>
      {admin && client && (
        <Panel title="Create a project">
          <Form
            submit="Create project"
            fields={[
              { name: "title", label: "Project name", required: true },
              {
                name: "description",
                label: "Scope and overview",
                type: "textarea",
              },
            ]}
            onSubmit={async (v) => {
              await send("/admin/projects", { ...v, client_id: client });
              await refresh();
            }}
          />
        </Panel>
      )}
      {admin && !client && (
        <p className="notice">
          Select a client above to manage their projects.
        </p>
      )}
      {data.projects.length ? (
        data.projects.map((project) => (
          <ProjectView key={project.id} project={project} admin={admin} />
        ))
      ) : (
        <Empty>No projects to show yet.</Empty>
      )}
    </>
  );
}

function ProjectView({
  project: p,
  admin,
}: {
  project: Project;
  admin: boolean;
}) {
  const { data, refresh } = useWorkspace();
  if (!data) return null;

  const phases = data.phases.filter((f) => f.project_id === p.id),
    tasks = data.tasks.filter((t) => t.project_id === p.id);

  const done = tasks.filter((t) => t.status === "done").length;

  function taskFields(): Field[] {
    return [
      { name: "title", label: "Task title", required: true },
      { name: "description", label: "Details", type: "textarea" },
      {
        name: "phase_id",
        label: "Phase (optional)",
        type: "select",
        options: phases.map((f) => ({ value: f.id, label: f.title })),
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: options(taskStatuses),
        required: true,
      },
    ];
  }

  const savePhase = async (v: Values, phase?: Phase) => {
    const body = {
      title: v.title,
      due_date: v.due_date,
      amount_cents: Math.round(Number(v.amount) * 100),
      currency: "USD",
      status: v.status,
      payment_status: v.payment_status,
      payment_reference: v.payment_reference,
      position: Number(v.position),
    };

    await send(
      phase
        ? "/admin/phases/" + phase.id
        : "/admin/projects/" + p.id + "/phases",
      body,
      phase ? "PATCH" : "POST",
    );
    await refresh();
  };

  return (
    <Panel title={p.title} aside={<Badge value={p.status} />}>
      <p className="muted preserve-lines">{p.description}</p>
      {p.status === "halted" && (
        <div className="notice error">
          <strong>Project progress is paused.</strong>
          <p>{p.halt_reason}</p>
          <p>
            Work resumes after Pixelerion confirms payment and updates the
            project status.
          </p>
        </div>
      )}
      <div className="progress-label">
        <span>
          {done} of {tasks.length} tasks complete
        </span>
        <strong>
          {tasks.length ? Math.round((done / tasks.length) * 100) : 0}%
        </strong>
      </div>
      <progress
        value={done}
        max={tasks.length || 1}
        aria-label="Project completion"
      />
      {admin && (
        <Disclosure title="Edit project / halt or resume">
          <Form
            submit="Update project"
            fields={[
              { name: "title", label: "Project title", required: true },
              { name: "description", label: "Description", type: "textarea" },
              {
                name: "status",
                label: "Project status",
                type: "select",
                options: options(["active", "halted", "completed"]),
                required: true,
              },
              {
                name: "halt_reason",
                label: "Reason for halting (visible to client)",
                type: "textarea",
              },
            ]}
            initial={{
              title: p.title,
              description: p.description,
              status: p.status,
              halt_reason: p.halt_reason,
            }}
            onSubmit={async (v) => {
              await send("/admin/projects/" + p.id, v, "PATCH");
              await refresh();
            }}
          />
        </Disclosure>
      )}
      <h3 className="subheading">Milestones & phases</h3>
      <div className="phase-grid">
        {phases.map((f) => (
          <div className="phase-card" key={f.id}>
            <div className="record-row">
              <h3>{f.title}</h3>
              <Badge value={f.status} />
            </div>
            <p>
              {date(f.due_date)} · {money(f.amount_cents)}
            </p>
            <Badge value={f.payment_status} />
            {admin && (
              <Disclosure title="Edit phase & payment">
                <Form
                  submit="Save phase"
                  fields={phaseFields}
                  initial={{
                    title: f.title,
                    due_date: f.due_date,
                    amount: String(f.amount_cents / 100),
                    status: f.status,
                    payment_status: f.payment_status,
                    payment_reference: f.payment_reference,
                    position: String(f.position),
                  }}
                  onSubmit={(v) => savePhase(v, f)}
                />
              </Disclosure>
            )}
          </div>
        ))}
      </div>
      {!phases.length && (
        <Empty>Project phases have not been scheduled yet.</Empty>
      )}
      {admin && (
        <Disclosure title="+ Add phase">
          <Form
            submit="Create phase"
            fields={phaseFields}
            initial={{
              status: "planned",
              payment_status: "unpaid",
              amount: "0",
              position: String(phases.length + 1),
            }}
            onSubmit={(v) => savePhase(v)}
          />
        </Disclosure>
      )}
      <h3 className="subheading">Task board</h3>
      <div className="task-board">
        {taskStatuses.map((status) => (
          <div className="task-column" key={status}>
            <h4>
              {status.replaceAll("_", " ")}
              <span>{tasks.filter((t) => t.status === status).length}</span>
            </h4>
            {tasks
              .filter((t) => t.status === status)
              .map((task) => (
                <TaskView
                  key={task.id}
                  task={task}
                  admin={admin}
                  fields={taskFields()}
                />
              ))}
          </div>
        ))}
      </div>
      {admin && (
        <Disclosure title="+ Add task">
          <Form
            submit="Create task"
            fields={taskFields()}
            initial={{ status: "backlog" }}
            onSubmit={async (v) => {
              await send("/admin/projects/" + p.id + "/tasks", v);
              await refresh();
            }}
          />
        </Disclosure>
      )}
    </Panel>
  );
}

function TaskView({
  task: t,
  admin,
  fields,
}: {
  task: Task;
  admin: boolean;
  fields: Field[];
}) {
  const { data, refresh } = useWorkspace();
  const [uploadError, setUploadError] = useState(""),
    [uploading, setUploading] = useState(false);
  if (!data) return null;

  return (
    <details className="task-card">
      <summary>{t.title}</summary>
      <p className="preserve-lines">{t.description}</p>
      {admin && (
        <Disclosure title="Edit task">
          <Form
            submit="Save task"
            fields={fields}
            initial={{
              title: t.title,
              description: t.description,
              status: t.status,
              phase_id: t.phase_id || "",
            }}
            onSubmit={async (v) => {
              await send("/admin/tasks/" + t.id, v, "PATCH");
              await refresh();
            }}
          />
        </Disclosure>
      )}
      <div className="task-comments">
        {data.comments
          .filter((c) => c.task_id === t.id)
          .map((c) => (
            <div className="task-comment" key={c.id}>
              <small>
                {c.author} · {date(c.created_at)}
              </small>
              <p className="preserve-lines">{c.body}</p>
            </div>
          ))}
      </div>
      <Form
        submit="Add comment"
        fields={[
          { name: "body", label: "Comment", type: "textarea", required: true },
        ]}
        onSubmit={async (v) => {
          await send("/tasks/" + t.id + "/comments", v);
          await refresh();
        }}
      />
      {data.attachments
        .filter((f) => f.task_id === t.id)
        .map((f) => (
          <a
            className="attachment"
            key={f.id}
            href={"/api/v1/attachments/" + f.id}
            target="_blank"
            rel="noreferrer"
          >
            <img
              loading="lazy"
              src={"/api/v1/attachments/" + f.id}
              alt={f.filename}
            />
            <span>{f.filename} →</span>
          </a>
        ))}
      {admin && (
        <label className="upload-field">
          {uploading
            ? "Uploading..."
            : "Add screenshot (PNG, JPEG, WebP - 5 MB max)"}
          <input
            disabled={uploading}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              setUploadError("");

              try {
                if (file.size > 5 * 1024 * 1024)
                  throw new Error("Image must be 5 MB or smaller");
                const body = new FormData();
                body.append("file", file);
                await api("/admin/tasks/" + t.id + "/attachments", {
                  method: "POST",
                  body,
                });
                await refresh();
              } catch (error) {
                setUploadError((error as Error).message);
              } finally {
                setUploading(false);
                e.target.value = "";
              }
            }}
          />
        </label>
      )}
      {uploadError && (
        <p className="notice error" role="alert">
          {uploadError}
        </p>
      )}
    </details>
  );
}
