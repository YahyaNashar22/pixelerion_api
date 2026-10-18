import type { Request } from "../lib/types";
import { duration, money } from "../lib/api";

export default function RequestQuote({ request }: { request: Request }) {
  if (request.kind === "minutes") {
    return (
      <p className="muted">
        {request.minutes} additional minutes · {money(request.minutes * 50)}{" "}
        total at $30/hour.
      </p>
    );
  }
  if (
    request.kind !== "plan_change" ||
    request.quoted_price_cents === null ||
    !request.quoted_months
  )
    return null;
  return (
    <p className="muted">
      Requested agreement: {money(request.quoted_price_cents)} / month for{" "}
      {request.quoted_months} month(s), {duration(request.quoted_minutes || 0)}{" "}
      / month. Total:{" "}
      {money(request.quoted_price_cents * request.quoted_months)}, paid
      externally in advance.
    </p>
  );
}
