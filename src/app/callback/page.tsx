'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CallbackPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    // forward all query params to the real handler at /auth/callback
    const qs = sp.toString();
    router.replace(`/auth/callback${qs ? `?${qs}` : ''}`);
  }, [router, sp]);

  return <div style={{ padding: 24, textAlign: 'center' }}>Redirecting…</div>;
}
