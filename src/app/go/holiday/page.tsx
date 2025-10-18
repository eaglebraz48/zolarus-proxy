// src/app/go/holiday/page.tsx
'use client';

import { useEffect } from 'react';

export default function HolidayRedirect() {
  useEffect(() => {
    // Amazon affiliate destination
    window.location.href = 'https://www.amazon.com/?tag=mateussousa-20';
  }, []);

  return (
    <main style={{ padding: 16 }}>
      <p>Taking you to Holiday specials…</p>
    </main>
  );
}
