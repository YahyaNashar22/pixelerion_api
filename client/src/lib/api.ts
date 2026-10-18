export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const multipart = options.body instanceof FormData;

  const response = await fetch("/api/v1" + path, {
    ...options,
    credentials: "same-origin",

    headers: {
      ...(multipart ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok)
    throw new APIError(
      response.status,
      data.error?.message || "Unable to complete the request",
    );

  return data as T;
}

export function send<T = { ok: boolean }>(
  path: string,
  body: unknown,
  method = "POST",
) {
  return api<T>(path, { method, body: JSON.stringify(body) });
}

export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );

export const date = (value: string) =>
  value
    ? new Date(
        value.length === 10 ? value + "T12:00:00" : value,
      ).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not specified";

export const duration = (minutes: number) =>
  `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
