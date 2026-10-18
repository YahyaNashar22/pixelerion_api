import { useState, type ReactNode } from "react";

export interface Field {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "date"
    | "textarea"
    | "select"
    | "checkbox";

  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  hint?: string;
}

export type Values = Record<string, string | boolean>;

export default function Panel({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="workspace-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Badge({ value }: { value: string }) {
  return (
    <span className={"badge badge-" + value}>{value.replaceAll("_", " ")}</span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty-state">{children}</p>;
}

export function PageTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-title">
      <p className="eyebrow">{eyebrow || "CLIENT WORKSPACE"}</p>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Form({
  fields,
  initial = {},
  submit,
  onSubmit,
  children,
}: {
  fields: Field[];
  initial?: Values;
  submit: string;
  onSubmit: (values: Values) => Promise<void>;
  children?: ReactNode;
}) {
  const [values, setValues] = useState<Values>(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.name,
        initial[f.name] ?? (f.type === "checkbox" ? false : ""),
      ]),
    ),
  );

  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false);

  return (
    <form
      className="workspace-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setSuccess(false);

        try {
          await onSubmit(values);
          setValues((current) =>
            Object.fromEntries(
              Object.entries(current).map(([key, value]) => [
                key,
                fields.some((f) => f.name === key && f.type === "password")
                  ? ""
                  : value,
              ]),
            ),
          );
          setSuccess(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to save");
        } finally {
          setBusy(false);
        }
      }}
    >
      {fields.map((f) => (
        <label
          key={f.name}
          className={f.type === "checkbox" ? "check-field" : ""}
        >
          {f.type !== "checkbox" && <span>{f.label}</span>}
          {f.type === "textarea" ? (
            <textarea
              rows={3}
              maxLength={10000}
              value={String(values[f.name])}
              required={f.required}
              onChange={(e) =>
                setValues({ ...values, [f.name]: e.target.value })
              }
            />
          ) : f.type === "select" ? (
            <select
              value={String(values[f.name])}
              required={f.required}
              onChange={(e) =>
                setValues({ ...values, [f.name]: e.target.value })
              }
            >
              <option value="">Select...</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === "checkbox" ? (
            <>
              <input
                type="checkbox"
                checked={!!values[f.name]}
                required={f.required}
                onChange={(e) =>
                  setValues({ ...values, [f.name]: e.target.checked })
                }
              />
              <span>{f.label}</span>
            </>
          ) : (
            <input
              type={f.type || "text"}
              autoComplete={f.type === "password" ? "new-password" : undefined}
              maxLength={f.type === "password" ? 72 : 500}
              minLength={f.type === "password" ? 12 : undefined}
              value={String(values[f.name])}
              min={f.min}
              max={f.max}
              step={f.step}
              required={f.required}
              onChange={(e) =>
                setValues({ ...values, [f.name]: e.target.value })
              }
            />
          )}
          {f.hint && <small>{f.hint}</small>}
        </label>
      ))}
      {children}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="notice success" role="status">
          Saved successfully.
        </p>
      )}
      <button className="button primary" disabled={busy} type="submit">
        {busy ? "Saving..." : submit}
      </button>
    </form>
  );
}

export function Disclosure({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="workspace-disclosure">
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  );
}
