import { Suspense } from 'react';
import { Outlet } from 'react-router';

export default function Root() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080c]" />}>
      <Outlet />
    </Suspense>
  );
}
