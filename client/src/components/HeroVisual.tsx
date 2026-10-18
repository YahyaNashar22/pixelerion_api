import { Component, lazy, Suspense, type ReactNode } from "react";

import { useReducedMotion } from "framer-motion";

const HeroCanvas = lazy(() => import("./HeroCanvas"));

function StaticHero() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 grid place-items-center"
    >
      <div className="w-64 h-64 rotate-12 rounded-[3rem] border border-[#4285F4]/30 bg-gradient-to-br from-[#4285F4]/10 via-transparent to-[#34A853]/10">
        <div className="w-full h-full -rotate-45 rounded-[3rem] border border-[#34A853]/20" />
      </div>
    </div>
  );
}

class CanvasBoundary extends Component<
  { children: ReactNode },
  {
    failed: boolean;
  }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <StaticHero /> : this.props.children;
  }
}

export default function HeroVisual() {
  const reduced = useReducedMotion();

  if (reduced) return <StaticHero />;

  return (
    <CanvasBoundary>
      <Suspense fallback={<StaticHero />}>
        <HeroCanvas />
      </Suspense>
    </CanvasBoundary>
  );
}
