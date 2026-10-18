import { useEffect, useState } from "react";

import { api, duration, money } from "../lib/api";

import type { Plan } from "../lib/types";

export default function PublicPlans() {
  const [plans, setPlans] = useState<Plan[]>([]),
    [error, setError] = useState(false);

  useEffect(() => {
    let current = true;
    api<Plan[]>("/plans")
      .then((value) => {
        if (current) setPlans(value);
      })
      .catch(() => {
        if (current) setError(true);
      });
    return () => {
      current = false;
    };
  }, []);

  return (
    <div className="mb-10">
      {error ? (
        <p className="text-sm text-[#9898a8]">
          Contact Pixelerion for current maintenance plans and pricing.
        </p>
      ) : (
        <div className="plan-grid">
          {plans.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-6"
            >
              <h3 className="text-white font-semibold">{p.name}</h3>
              <p className="plan-price">
                {money(p.price_cents)}
                <small>/ month</small>
              </p>
              <p className="text-sm text-[#c3d1e6]">
                {duration(p.included_minutes)} / month
              </p>
              <p className="text-xs text-[#9caac0] mt-4 leading-relaxed">
                {p.response_target}
              </p>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-[#9caac0] mt-4 leading-relaxed">
        Monthly minutes do not roll over. Extra time requires approval at
        $30/hour. Response targets apply during business hours and do not
        guarantee resolution time. Custom agreements available by quotation.
      </p>
    </div>
  );
}
