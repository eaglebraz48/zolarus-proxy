// src/app/browse/browse-client.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export default function BrowseClient() {
  const sp = useSearchParams();

  // Example usage — keep your existing logic here
  const q = useMemo(() => sp.get('q') ?? '', [sp]);

  return (
    <main style={{ maxWidth: 920, margin: '40px auto', padding: '0 16px' }}>
      <h1>Browse</h1>
      <p>Query: {q || '(none)'}</p>
      {/* ...your existing browse UI... */}
    </main>
  );
}
